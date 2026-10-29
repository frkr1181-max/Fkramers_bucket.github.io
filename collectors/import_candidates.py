"""Import collector JSON into Supabase's private review queue."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.config import load_local_env


def main() -> None:
    load_local_env()
    parser = argparse.ArgumentParser(description="Import candidates into Supabase for human review.")
    parser.add_argument("candidate_file", type=Path)
    args = parser.parse_args()

    base_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not base_url or not service_role_key:
        raise SystemExit("Set SUPABASE_URL and the server-only SUPABASE_SERVICE_ROLE_KEY first.")

    payload = json.loads(args.candidate_file.read_text(encoding="utf-8"))
    rows = [{
        "candidate_id": candidate["candidate_id"],
        "country_code": candidate["country_code"],
        "destination_slug": candidate.get("destination_slug"),
        "category": candidate["category"],
        "title": candidate["title"],
        "candidate_text": candidate["candidate_text"],
        "source": candidate["source"],
        "status": "needs_review",
        "collected_at": candidate["collected_at"],
        "content_sha256": candidate.get("content_sha256"),
        "review_note": candidate.get("review_note"),
    } for candidate in payload.get("candidates", [])]

    if not rows:
        print("No candidates to import.")
        return

    request = Request(
        f"{base_url}/rest/v1/source_candidates?on_conflict=candidate_id",
        data=json.dumps(rows).encode("utf-8"),
        method="POST",
        headers={
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=ignore-duplicates,return=minimal",
        },
    )
    try:
        with urlopen(request, timeout=20) as response:
            response.read()
    except HTTPError as error:
        detail = error.read(1000).decode("utf-8", "replace")
        raise SystemExit(f"Supabase rejected candidate import ({error.code}): {detail}") from error
    except (URLError, TimeoutError) as error:
        raise SystemExit(f"Could not reach Supabase: {error}") from error
    print(f"Submitted {len(rows)} candidates. Existing candidate IDs were left unchanged.")


if __name__ == "__main__":
    main()
