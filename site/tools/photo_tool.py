"""Find and add background photos.

Photos come from two places:
  - Wikimedia Commons: any free license (CC0, public domain, CC BY, CC BY-SA).
    This is a class project and the class needs no credit line, but the author
    and license of every photo are still kept in its .json and in SOURCES.md.
  - Unsplash: only free photos under the Unsplash License (images.unsplash.com).
    Paid "Unsplash+" photos (plus.unsplash.com) are refused.

Add a free Unsplash photo (check its page in a browser first; it must say
"Free to use under the Unsplash License"):
    python site/tools/photo_tool.py add-unsplash --universal plan
        --page https://unsplash.com/photos/<slug> --image https://images.unsplash.com/photo-<id>

Needs Pillow:  python -m pip install pillow

Search (prints candidates, biggest first; --best keeps only Commons
"Quality images" and "Featured pictures", which reviewers checked for focus,
noise and exposure, so try that first):
    python site/tools/photo_tool.py search "Sydney harbour skyline" --best

Add a country photo (slot is dashboard or guide; see css/photos.css):
    python site/tools/photo_tool.py add --slug australia --slot dashboard --file "File:Sydney skyline.jpg"

Add a universal photo (hero, plan or arrive):
    python site/tools/photo_tool.py add --universal hero --file "File:Some photo.jpg"

Save an existing photo again from its source, at the current size and quality:
    python site/tools/photo_tool.py redo --slug australia --slot dashboard

"add" downloads the photo, crops it to 16:9 (--focus top|bottom|left|right
moves the crop off the middle), shrinks it to 2560 x 1440, saves it
as .webp in assets/photos/, and writes a small .json beside it saying where it
came from and what its license is. Replacing a photo needs nothing else. For a
new country, add its two lines to css/photos.css. Either way, then rebuild
assets/photos/SOURCES.md from the .json files:
    python site/tools/photo_tool.py sources
"""

from __future__ import annotations

import argparse
import io
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PHOTOS = ROOT / "assets" / "photos"
SNAPSHOT = ROOT / "data" / "guide-snapshot.json"
API = "https://commons.wikimedia.org/w/api.php"
AGENT = "photo-fetch-script/0.1 (student web project; python urllib)"
COUNTRY_SLOTS = ("dashboard", "guide")
UNIVERSAL_SLOTS = ("hero", "plan", "arrive")
# every photo band can fill a whole screen (the trip dashboard does), so every
# photo gets the size the home hero needs: 1600px at quality 54 was stretched on
# big screens and showed the compression as blocks and smears
OUT_W, OUT_H, QUALITY = 2560, 1440, 80
MAX_BYTES = 40 * 1024 * 1024
# only these hosts are ever downloaded from
IMAGE_HOSTS = {"upload.wikimedia.org", "thumb.wikimedia.org", "images.unsplash.com"}
# Commons pages reviewers picked for technical quality
BEST_FILTER = "incategory:Quality_images|Featured_pictures_on_Wikimedia_Commons"


def fetch(request: urllib.request.Request, timeout: int, limit: int = -1) -> bytes:
    """urlopen, waiting and trying again when Commons says too many requests (429) or is busy (5xx)."""
    for attempt in range(6):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return response.read(limit)
        except urllib.error.HTTPError as error:
            if attempt == 5 or (error.code != 429 and error.code < 500):
                raise
            wait = error.headers.get("Retry-After", "")
            time.sleep(int(wait) if wait.isdigit() else 5 * 2 ** attempt)
    raise AssertionError("unreachable")


def api(params: dict) -> dict:
    query = urllib.parse.urlencode({"format": "json", "formatversion": "2", **params})
    request = urllib.request.Request(f"{API}?{query}", headers={"User-Agent": AGENT})
    return json.loads(fetch(request, 30))


def strip_tags(html: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html or "")).strip()


def big_enough(width: int, height: int) -> bool:
    """True when a 16:9 crop of the photo is still at least 2560 x 1440."""
    return min(width, height * OUT_W / OUT_H) >= OUT_W


def file_info(title: str) -> dict:
    """Size, license and description of one Commons file, plus a download link
    big enough that its 16:9 crop is still 2560 x 1440."""
    def ask(width: int) -> dict:
        data = api({
            "action": "query", "titles": title, "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata", "iiurlwidth": str(width),
        })
        page = data["query"]["pages"][0]
        if page.get("missing") or "imageinfo" not in page:
            raise SystemExit(f"not found on Commons: {title}")
        return page

    page = ask(OUT_W)
    info = page["imageinfo"][0]
    # a 2560px-wide thumbnail of a wide panorama is under 1440 tall, and Commons
    # rounds bigger thumbnails to fixed widths, so take the original file instead
    wide = info["width"] * OUT_H > info["height"] * OUT_W
    meta = {key: strip_tags(str(value.get("value", ""))) for key, value in info.get("extmetadata", {}).items()}
    return {
        "title": page["title"],
        "width": info["width"], "height": info["height"], "mime": info.get("mime", ""),
        "page": info["descriptionurl"],
        "download": info["url"] if wide else info.get("thumburl") or info["url"],
        "license": meta.get("LicenseShortName", ""),
        "author": meta.get("Artist", "")[:120],
        "description": meta.get("ImageDescription", "")[:300],
        "categories": meta.get("Categories", "")[:400],
    }


def search(args: argparse.Namespace) -> None:
    data = api({
        "action": "query", "generator": "search", "gsrnamespace": "6", "gsrlimit": str(args.limit),
        "gsrsearch": f"{args.query} {BEST_FILTER if args.best else ''} filetype:bitmap",
        "prop": "imageinfo", "iiprop": "size|mime|extmetadata|url",
        "iiextmetadatafilter": "LicenseShortName|ImageDescription",
    })
    pages = sorted(data.get("query", {}).get("pages", []), key=lambda p: -p["imageinfo"][0]["width"])
    shown = 0
    for page in pages:
        info = page["imageinfo"][0]
        meta = info.get("extmetadata", {})
        license_name = strip_tags(str(meta.get("LicenseShortName", {}).get("value", "")))
        wide = big_enough(info["width"], info["height"]) and info["width"] > info["height"] * 1.2
        if not wide or info.get("mime") not in ("image/jpeg", "image/png", "image/webp"):
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
    raw = fetch(request, 60, MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise SystemExit("REFUSED: file is larger than 40 MB")
    return raw


def save(raw: bytes, folder: Path, slot: str, record: dict, focus: str = "") -> None:
    """Crop to 16:9 (the middle, unless focus says otherwise), shrink to 2560 x 1440, save as .webp plus a .json record."""
    from PIL import Image  # imported here so "search" works without Pillow

    image = Image.open(io.BytesIO(raw))
    image.load()
    image = image.convert("RGB")
    width, height = image.size
    if not big_enough(width, height):
        raise SystemExit(f"REFUSED: too small for a {OUT_W} x {OUT_H} crop, got {width}x{height}")
    out_w, out_h, quality = OUT_W, OUT_H, QUALITY
    target_ratio = out_w / out_h
    if width / height > target_ratio:
        new_w = round(height * target_ratio)
        left = {"left": 0, "right": width - new_w}.get(focus, (width - new_w) // 2)
        image = image.crop((left, 0, left + new_w, height))
    else:
        new_h = round(width / target_ratio)
        top = {"top": 0, "bottom": height - new_h}.get(focus, (height - new_h) // 2)
        image = image.crop((0, top, width, top + new_h))
    if image.width > out_w:
        image = image.resize((out_w, out_h), Image.LANCZOS)

    folder.mkdir(parents=True, exist_ok=True)
    out = folder / f"{slot}.webp"
    image.save(out, "WEBP", quality=quality, method=6)
    record.setdefault("original_size", f"{width}x{height}")
    if focus:
        record["focus"] = focus
    (folder / f"{slot}.json").write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    print(f"saved {out.relative_to(ROOT.parent)} ({out.stat().st_size // 1024} kB) | {record['license']} | {record['file']}")


def add(args: argparse.Namespace) -> None:
    folder, slot = target(args)
    info = file_info(args.file)
    if not big_enough(info["width"], info["height"]):
        raise SystemExit(f"REFUSED: too small for a {OUT_W} x {OUT_H} crop, got {info['width']}x{info['height']}")
    save(download(info["download"]), folder, slot, {
        "file": info["title"], "page": info["page"], "license": info["license"],
        "author": info["author"], "description": info["description"],
        "original_size": f"{info['width']}x{info['height']}",
    }, args.focus or "")


def redo(args: argparse.Namespace) -> None:
    """Save a photo again from the Commons file its .json names."""
    folder, slot = target(args)
    record = json.loads((folder / f"{slot}.json").read_text(encoding="utf-8"))
    if not record["file"].startswith("File:"):
        raise SystemExit(f"not a Commons photo, add it again by hand: {record['file']}")
    args.file = record["file"]
    args.focus = args.focus or record.get("focus", "")
    add(args)


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
    url = f"https://images.unsplash.com{image.path}?w={OUT_W}&q=90&fm=jpg"
    save(download(url), folder, slot, {
        "file": f"Unsplash photo {photo_id}",
        "page": f"https://unsplash.com{page.path}", "license": "Unsplash License",
        "author": args.author or "", "description": args.description or "",
    })


def sources(_args: argparse.Namespace) -> None:
    """Write assets/photos/SOURCES.md again from the .json beside every photo."""
    rows = []
    for record_path in sorted(PHOTOS.rglob("*.json")):
        record = json.loads(record_path.read_text(encoding="utf-8"))
        photo = record_path.with_suffix(".webp").relative_to(PHOTOS).as_posix()
        author = (record.get("author") or "").replace("|", "/")
        rows.append(f"| `{photo}` | [{record['file']}]({record['page']}) | {author} | {record['license']} |")
    (PHOTOS / "SOURCES.md").write_text(
        "# Photo sources\n\n"
        "Every photo comes from Wikimedia Commons (under the free license named below) "
        "or from Unsplash (free under the Unsplash License).\n"
        "This list is written by `python site/tools/photo_tool.py sources` from the `.json` file beside each photo, "
        "so run that after adding or replacing a photo.\n\n"
        "| Photo | Source | Author | License |\n|---|---|---|---|\n" + "\n".join(rows) + "\n",
        encoding="utf-8", newline="\n")
    print(f"wrote {len(rows)} rows to {(PHOTOS / 'SOURCES.md').relative_to(ROOT.parent)}")


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    commands = parser.add_subparsers(dest="command", required=True)
    find = commands.add_parser("search")
    find.add_argument("query")
    find.add_argument("--limit", type=int, default=50)
    find.add_argument("--best", action="store_true", help="only Commons Quality images and Featured pictures")
    find.set_defaults(run=search)
    put = commands.add_parser("add")
    put.add_argument("--slug")
    put.add_argument("--slot")
    put.add_argument("--universal")
    put.add_argument("--file", required=True, help='Commons file title, like "File:Sydney skyline.jpg"')
    put.add_argument("--focus", choices=("top", "bottom", "left", "right"))
    put.set_defaults(run=add)
    again = commands.add_parser("redo")
    again.add_argument("--slug")
    again.add_argument("--slot")
    again.add_argument("--universal")
    again.add_argument("--focus", choices=("top", "bottom", "left", "right"))
    again.set_defaults(run=redo)
    commands.add_parser("sources").set_defaults(run=sources)
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
