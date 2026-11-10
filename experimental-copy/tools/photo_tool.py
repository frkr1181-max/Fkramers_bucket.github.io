"""Find and add background photos that need no license and no credit.

Photos come from two places, both free to use with no permission and no
credit line:
  - Wikimedia Commons: only files Commons marks as CC0 or public domain.
    Anything else (CC BY, CC BY-SA, ...) is refused.
  - Unsplash: only free photos under the Unsplash License (images.unsplash.com).
    Paid "Unsplash+" photos (plus.unsplash.com) are refused.

Add a free Unsplash photo (check its page in a browser first; it must say
"Free to use under the Unsplash License"):
    python experimental-copy/tools/photo_tool.py add-unsplash --universal plan
        --page https://unsplash.com/photos/<slug> --image https://images.unsplash.com/photo-<id>

Needs Pillow:  python -m pip install pillow

Search (prints candidates, newest Commons ranking first):
    python experimental-copy/tools/photo_tool.py search "Sydney harbour skyline"

Add a country photo (slot is main, plan, arrive or know; see js/photos.js):
    python experimental-copy/tools/photo_tool.py add --slug australia --slot main --file "File:Sydney skyline.jpg"

Add a universal photo (hero, plan or arrive):
    python experimental-copy/tools/photo_tool.py add --universal hero --file "File:Some photo.jpg"

"add" downloads the photo, crops it to 16:9, shrinks it to 1600 x 900, saves it
as .webp in assets/photos/, and writes a small .json beside it saying where it
came from and what its license is. Then run tools/build_photos.py.
"""

from __future__ import annotations

import argparse
import io
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PHOTOS = ROOT / "assets" / "photos"
SNAPSHOT = ROOT / "data" / "guide-snapshot.json"
API = "https://commons.wikimedia.org/w/api.php"
AGENT = "photo-fetch-script/0.1 (student web project; python urllib)"
COUNTRY_SLOTS = ("main", "plan", "arrive", "know")
UNIVERSAL_SLOTS = ("hero", "plan", "arrive")
OUT_W, OUT_H = 1600, 900
MIN_W = 1400
MAX_BYTES = 40 * 1024 * 1024
# only these hosts are ever downloaded from
IMAGE_HOSTS = {"upload.wikimedia.org", "thumb.wikimedia.org", "images.unsplash.com"}
# Commons license names that need no permission and no credit
FREE = re.compile(r"^(cc0|cc-zero|public domain|pd\b|pd-|no restrictions)", re.I)
# Wikidata ids used by Commons search: license = CC0, copyright status = public domain
SEARCH_FILTER = "haswbstatement:P275=Q6938433|P6216=Q19652"


def api(params: dict) -> dict:
    query = urllib.parse.urlencode({"format": "json", "formatversion": "2", **params})
    request = urllib.request.Request(f"{API}?{query}", headers={"User-Agent": AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def strip_tags(html: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html or "")).strip()


def file_info(title: str) -> dict:
    """Size, license and description of one Commons file, plus a 1920px download link."""
    data = api({
        "action": "query", "titles": title, "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata", "iiurlwidth": "1920",
    })
    page = data["query"]["pages"][0]
    if page.get("missing") or "imageinfo" not in page:
        raise SystemExit(f"not found on Commons: {title}")
    info = page["imageinfo"][0]
    meta = {key: strip_tags(str(value.get("value", ""))) for key, value in info.get("extmetadata", {}).items()}
    return {
        "title": page["title"],
        "width": info["width"], "height": info["height"], "mime": info.get("mime", ""),
        "page": info["descriptionurl"],
        "download": info.get("thumburl") or info["url"],
        "license": meta.get("LicenseShortName", ""),
        "author": meta.get("Artist", "")[:120],
        "description": meta.get("ImageDescription", "")[:300],
        "categories": meta.get("Categories", "")[:400],
    }


def search(args: argparse.Namespace) -> None:
    data = api({
        "action": "query", "generator": "search", "gsrnamespace": "6", "gsrlimit": str(args.limit),
        "gsrsearch": f"{args.query} {SEARCH_FILTER} filetype:bitmap",
        "prop": "imageinfo", "iiprop": "size|mime|extmetadata|url",
        "iiextmetadatafilter": "LicenseShortName|ImageDescription",
    })
    pages = sorted(data.get("query", {}).get("pages", []), key=lambda p: p.get("index", 0))
    shown = 0
    for page in pages:
        info = page["imageinfo"][0]
        meta = info.get("extmetadata", {})
        license_name = strip_tags(str(meta.get("LicenseShortName", {}).get("value", "")))
        wide = info["width"] >= MIN_W and info["width"] > info["height"]
        if not wide or not FREE.match(license_name) or info.get("mime") not in ("image/jpeg", "image/png", "image/webp"):
            continue
        shown += 1
        description = strip_tags(str(meta.get("ImageDescription", {}).get("value", "")))[:110]
        print(f"{info['width']}x{info['height']} | {license_name} | {page['title']} | {description}")
    print(f"-- {shown} usable of {len(pages)} results for: {args.query}")


def target(args: argparse.Namespace) -> tuple[Path, str]:
    """The folder and slot name a photo should be saved as."""
    if args.universal:
        if args.universal not in UNIVERSAL_SLOTS:
            raise SystemExit(f"--universal must be one of {UNIVERSAL_SLOTS}")
        return PHOTOS / "universal", args.universal
    known = {d["slug"] for d in json.loads(SNAPSHOT.read_text(encoding="utf-8"))["destinations"]}
    if args.slug not in known:
        raise SystemExit(f"unknown country slug: {args.slug}")
    if args.slot not in COUNTRY_SLOTS:
        raise SystemExit(f"--slot must be one of {COUNTRY_SLOTS}")
    return PHOTOS / "countries" / args.slug, args.slot


def download(url: str) -> bytes:
    host = urllib.parse.urlparse(url).hostname
    if host not in IMAGE_HOSTS:
        raise SystemExit(f"REFUSED: unexpected download host {host}")
    request = urllib.request.Request(url, headers={"User-Agent": AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        raw = response.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise SystemExit("REFUSED: file is larger than 40 MB")
    return raw


def save(raw: bytes, folder: Path, slot: str, record: dict) -> None:
    """Crop the middle to 16:9, shrink to 1600 x 900, save as .webp plus a .json record."""
    from PIL import Image  # imported here so "search" works without Pillow

    image = Image.open(io.BytesIO(raw))
    image.load()
    image = image.convert("RGB")
    width, height = image.size
    if width < MIN_W or width <= height:
        raise SystemExit(f"REFUSED: needs a landscape photo at least {MIN_W}px wide, got {width}x{height}")
    target_ratio = OUT_W / OUT_H
    if width / height > target_ratio:
        new_w = round(height * target_ratio)
        left = (width - new_w) // 2
        image = image.crop((left, 0, left + new_w, height))
    else:
        new_h = round(width / target_ratio)
        top = (height - new_h) // 2
        image = image.crop((0, top, width, top + new_h))
    image = image.resize((OUT_W, OUT_H), Image.LANCZOS)

    folder.mkdir(parents=True, exist_ok=True)
    out = folder / f"{slot}.webp"
    image.save(out, "WEBP", quality=54, method=6)
    record["original_size"] = f"{width}x{height}"
    (folder / f"{slot}.json").write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    print(f"saved {out.relative_to(ROOT.parent)} ({out.stat().st_size // 1024} kB) | {record['license']} | {record['file']}")


def add(args: argparse.Namespace) -> None:
    folder, slot = target(args)
    info = file_info(args.file)
    # the rule for Commons photos: no license needed, no credit needed
    if not FREE.match(info["license"]):
        raise SystemExit(f"REFUSED: license is '{info['license']}', not CC0 or public domain: {info['title']}")
    if info["width"] < MIN_W or info["width"] <= info["height"]:
        raise SystemExit(f"REFUSED: needs a landscape photo at least {MIN_W}px wide, got {info['width']}x{info['height']}")
    save(download(info["download"]), folder, slot, {
        "file": info["title"], "page": info["page"], "license": info["license"],
        "author": info["author"], "description": info["description"],
    })


def add_unsplash(args: argparse.Namespace) -> None:
    """A free Unsplash photo. The Unsplash License allows use with no permission
    and no credit. Unsplash's paid "Unsplash+" photos live on plus.unsplash.com
    and are refused here. Unsplash's pages block scripts, so check the page in a
    browser first: it must say "Free to use under the Unsplash License"."""
    folder, slot = target(args)
    page = urllib.parse.urlparse(args.page)
    if page.scheme != "https" or page.hostname != "unsplash.com" or not page.path.startswith("/photos/"):
        raise SystemExit("REFUSED: --page must be an https://unsplash.com/photos/... page")
    image = urllib.parse.urlparse(args.image)
    if image.scheme != "https" or image.hostname != "images.unsplash.com" or not image.path.startswith("/photo-"):
        raise SystemExit("REFUSED: --image must be an https://images.unsplash.com/photo-... link (free photos only)")
    photo_id = page.path.rstrip("/").rsplit("-", 1)[-1].rsplit("/", 1)[-1]
    url = f"https://images.unsplash.com{image.path}?w=2400&q=85&fm=jpg"
    save(download(url), folder, slot, {
        "file": f"Unsplash photo {photo_id}",
        "page": f"https://unsplash.com{page.path}", "license": "Unsplash License",
        "author": args.author or "", "description": args.description or "",
    })


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    commands = parser.add_subparsers(dest="command", required=True)
    find = commands.add_parser("search")
    find.add_argument("query")
    find.add_argument("--limit", type=int, default=30)
    find.set_defaults(run=search)
    put = commands.add_parser("add")
    put.add_argument("--slug")
    put.add_argument("--slot")
    put.add_argument("--universal")
    put.add_argument("--file", required=True, help='Commons file title, like "File:Sydney skyline.jpg"')
    put.set_defaults(run=add)
    free = commands.add_parser("add-unsplash")
    free.add_argument("--slug")
    free.add_argument("--slot")
    free.add_argument("--universal")
    free.add_argument("--page", required=True, help="the photo's https://unsplash.com/photos/... page")
    free.add_argument("--image", required=True, help="its https://images.unsplash.com/photo-... link")
    free.add_argument("--author")
    free.add_argument("--description")
    free.set_defaults(run=add_unsplash)
    args = parser.parse_args()
    args.run(args)


if __name__ == "__main__":
    main()
