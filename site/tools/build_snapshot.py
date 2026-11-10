"""Build site/data/guide-snapshot.json from the team's published research files.

The coded site reads live guide data from the FastAPI app. When the API can't
be reached (a laptop demo with no backend running, or GitHub Pages), it falls
back to this snapshot so the demo never shows an empty guide.

Run from the repository root after the research files change:

    python3 site/tools/build_snapshot.py
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# the published fact batches, in the order they were written to the database
FACT_FILES = [
    ROOT / "docs/research/publication-2026-11-05/facts.json",
    ROOT / "docs/research/gap-fill-2026-11-05/facts.json",
]

# the destination catalog is seeded by the migrations (the first one adds 24
# countries, the roster one adds 12 more), so the list here matches what
# GET /api/destinations returns. countries with no published facts yet show
# "No reviewed info" in every guide, the same as on the live site
MIGRATIONS = ROOT / "supabase/migrations"

OUT = ROOT / "site/data/guide-snapshot.json"

# only the fields the API's TravelFact schema returns (app/schemas/facts.py),
# so the site handles live and snapshot data the same way
FACT_FIELDS = [
    "id", "destination_slug", "category", "title", "plain_summary",
    "official_text_excerpt", "min_stay_days", "max_stay_days",
    "applies_to_purposes", "applicability_status", "last_verified_at", "sources",
]
SOURCE_FIELDS = ["title", "organization", "url", "checked_at"]


def read_destinations() -> list[dict]:
    row = re.compile(r"\('([a-z-]+)', '([^']+)', '([A-Z]{2})', '([^']+)', '([^']+)'(?:, (true|false))?\)")
    catalog: dict[str, dict] = {}
    for path in sorted(MIGRATIONS.glob("*.sql")):  # oldest first, by timestamp
        if "destinations" not in (sql := path.read_text(encoding="utf-8")):
            continue
        for slug, name, iso, region, owner, active in row.findall(sql):
            if active == "false" or slug in catalog:  # later inserts use ON CONFLICT DO NOTHING
                continue
            catalog[slug] = {"slug": slug, "name": name, "iso_alpha2": iso, "region": region, "research_owner": owner}
    return sorted(catalog.values(), key=lambda d: d["name"])


def read_facts() -> list[dict]:
    facts: dict[str, dict] = {}
    for path in FACT_FILES:
        for row in json.loads(path.read_text(encoding="utf-8")):
            # same rule as the API: only reviewed, published facts reach travelers
            if not row.get("published") or row.get("applicability_status") not in ("general", "conditional"):
                continue
            fact = {key: row.get(key) for key in FACT_FIELDS}
            fact["sources"] = [{key: s.get(key) for key in SOURCE_FIELDS} for s in row.get("sources", [])]
            facts[fact["id"]] = fact
    # same order as the API: category, then title
    return sorted(facts.values(), key=lambda f: (f["destination_slug"], f["category"], f["title"]))


def main() -> None:
    destinations = read_destinations()
    facts = read_facts()
    newest = max(f["last_verified_at"] for f in facts)
    snapshot = {
        "built_from": [str(p.relative_to(ROOT)) for p in FACT_FILES],
        "newest_check": newest,
        "destinations": destinations,
        "facts": facts,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(destinations)} destinations, {len(facts)} facts, newest check {newest}")


if __name__ == "__main__":
    main()
