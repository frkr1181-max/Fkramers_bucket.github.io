"""Collect candidate sections from the GOV.UK Foreign Travel Advice API.

This adapter preserves source context and marks everything as a candidate.
It never writes to the production API or Supabase.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser
from urllib.request import Request, urlopen


SOURCE_ID = "govuk-fcdo-japan"
SOURCE_URL = "https://www.gov.uk/api/content/foreign-travel-advice/japan"
ROBOTS_URL = "https://www.gov.uk/robots.txt"
USER_AGENT = "RoamReadyResearchBot/0.1 (student research; contact: project team)"
MAX_RESPONSE_BYTES = 5_000_000
MIN_REQUEST_INTERVAL_SECONDS = 1.2


class TextExtractor(HTMLParser):
    """Extract readable section text without executing or retaining markup."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style", "noscript"}:
            self.skip_depth += 1
        elif not self.skip_depth and tag in {"p", "li", "h1", "h2", "h3", "h4", "br"}:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "noscript"} and self.skip_depth:
            self.skip_depth -= 1
        elif not self.skip_depth and tag in {"p", "li", "h1", "h2", "h3", "h4", "br"}:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if not self.skip_depth:
            text = re.sub(r"\s+", " ", data).strip()
            if text:
                self.parts.append(text)


def clean_html(value: str) -> str:
    parser = TextExtractor()
    parser.feed(value)
    return re.sub(r"\n{3,}", "\n\n", " ".join(parser.parts)).strip()


def read_limited(url: str, *, accept: str) -> bytes:
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": accept})
    with urlopen(request, timeout=20) as response:
        content_length = response.headers.get("Content-Length")
        if content_length and int(content_length) > MAX_RESPONSE_BYTES:
            raise ValueError(f"Response too large: {content_length} bytes")
        payload = response.read(MAX_RESPONSE_BYTES + 1)
    if len(payload) > MAX_RESPONSE_BYTES:
        raise ValueError(f"Response exceeds {MAX_RESPONSE_BYTES} bytes")
    return payload


def robots_allows(url: str) -> bool:
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    parser = RobotFileParser()
    parser.set_url(robots_url)
    try:
        parser.parse(read_limited(robots_url, accept="text/plain").decode("utf-8", "replace").splitlines())
    except (HTTPError, URLError, TimeoutError, ValueError) as exc:
        raise RuntimeError(f"Could not verify robots policy at {robots_url}: {exc}") from exc
    return parser.can_fetch(USER_AGENT, url)


def collect() -> dict:
    if not robots_allows(SOURCE_URL):
        raise RuntimeError(f"robots.txt disallows collection from {SOURCE_URL}")

    # Stay well below GOV.UK Content API's documented 10 requests/second limit.
    time.sleep(MIN_REQUEST_INTERVAL_SECONDS)
    raw = read_limited(SOURCE_URL, accept="application/json")
    payload = json.loads(raw)
    details = payload.get("details") or {}
    parts = details.get("parts") or []
    fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

    candidates = []
    for index, part in enumerate(parts):
        body = clean_html(part.get("body") or "")
        if not body:
            continue
        candidates.append({
            "candidate_id": f"{SOURCE_ID}-{index + 1:02d}",
            "status": "needs_review",
            "destination": "Japan",
            "destination_slug": "japan",
            "country_code": "JP",
            "category": part.get("slug") or "unclassified",
            "title": part.get("title") or payload.get("title") or "Foreign travel advice",
            "candidate_text": body,
            "source": {
                "title": payload.get("title") or "Foreign travel advice: Japan",
                "organization": "UK Foreign, Commonwealth & Development Office",
                "url": SOURCE_URL,
                "canonical_page": payload.get("base_path") or "https://www.gov.uk/foreign-travel-advice/japan",
                "jurisdiction": "United Kingdom",
                "public_updated_at": payload.get("public_updated_at"),
                "license": "Open Government Licence v3.0",
                "attribution": "Contains public sector information licensed under the Open Government Licence v3.0.",
            },
            "collected_at": fetched_at,
            "content_sha256": hashlib.sha256(raw).hexdigest(),
            "review_note": "Candidate source material only. A human must verify relevance, jurisdiction, currentness, and traveler-facing wording before use.",
        })

    return {
        "source_id": SOURCE_ID,
        "source_url": SOURCE_URL,
        "collected_at": fetched_at,
        "content_sha256": hashlib.sha256(raw).hexdigest(),
        "candidate_count": len(candidates),
        "candidates": candidates,
    }


def main() -> None:
    cli = argparse.ArgumentParser(description="Collect Japan FCDO source sections into a local review file.")
    cli.add_argument("--output-dir", type=Path, default=Path("data/candidates"))
    args = cli.parse_args()
    try:
        result = collect()
    except (HTTPError, URLError, TimeoutError, ValueError, RuntimeError, json.JSONDecodeError) as exc:
        raise SystemExit(f"Collection stopped: {exc}") from exc
    args.output_dir.mkdir(parents=True, exist_ok=True)
    output = args.output_dir / f"{SOURCE_ID}.json"
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {result['candidate_count']} review candidates to {output}")


if __name__ == "__main__":
    main()
