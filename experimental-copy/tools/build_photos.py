"""List which country photos exist, so the site knows what it can show.

The site is static, so it can't look inside a folder itself. This script looks
for it and writes the answer to js/country-photos.js.

Photos go in:
    experimental-copy/assets/photos/countries/<country slug>/<slot>.webp
where <slot> is one of main, plan, arrive, know (see js/photos.js).

Run from the repo root after adding or removing photos:
    python experimental-copy/tools/build_photos.py
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PHOTOS = ROOT / "assets" / "photos" / "countries"
SNAPSHOT = ROOT / "data" / "guide-snapshot.json"
OUT = ROOT / "js" / "country-photos.js"
SLOTS = ("main", "plan", "arrive", "know")

HEADER = """// written by tools/build_photos.py. don't edit by hand: add or remove photos
// in assets/photos/countries/ and run the script again.
// country slug -> the photo slots that country has a file for
"""


def write_sources() -> None:
    """One readable list of where every photo came from, built from the .json files."""
    rows = []
    for record in sorted(PHOTOS.parent.glob("**/*.json")):
        info = json.loads(record.read_text(encoding="utf-8"))
        where = record.with_suffix(".webp").relative_to(PHOTOS.parent).as_posix()
        rows.append(f"| `{where}` | [{info['file']}]({info['page']}) | {info['license']} |")
    lines = [
        "# Photo sources",
        "",
        "Every photo listed here is from Wikimedia Commons and is marked CC0 or public domain there,",
        "so it needs no permission and no credit. This list is kept so anyone can check that.",
        "Built by `tools/build_photos.py`; don't edit by hand.",
        "",
        "| Photo | Commons file | License |",
        "|---|---|---|",
        *rows,
    ]
    (PHOTOS.parent / "SOURCES.md").write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")


def main() -> None:
    # the country slugs the site knows, to catch a misspelled folder name
    known = {d["slug"] for d in json.loads(SNAPSHOT.read_text(encoding="utf-8"))["destinations"]}
    found: dict[str, list[str]] = {}
    for folder in sorted(p for p in PHOTOS.glob("*") if p.is_dir()):
        slots = [slot for slot in SLOTS if (folder / f"{slot}.webp").is_file()]
        # each photo may have a .json beside it (where it came from), written by photo_tool.py
        extra = sorted(f.name for f in folder.iterdir() if f.is_file() and (f.stem not in SLOTS or f.suffix not in (".webp", ".json")))
        if folder.name not in known:
            print(f"skipped {folder.name}/: not a country slug in guide-snapshot.json")
            continue
        if extra:
            print(f"{folder.name}/: ignored {', '.join(extra)} (expected main/plan/arrive/know .webp)")
        if slots:
            found[folder.name] = slots
    body = json.dumps(found, indent=2)
    OUT.write_text(f"{HEADER}export const COUNTRY_PHOTOS = {body};\n", encoding="utf-8", newline="\n")
    write_sources()
    missing = sorted(known - set(found))
    print(f"{len(found)} of {len(known)} countries have photos; wrote {OUT.relative_to(ROOT.parent)}")
    if missing:
        print(f"no photos yet: {', '.join(missing)}")


if __name__ == "__main__":
    main()
