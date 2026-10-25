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
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser
from urllib.request import Request, urlopen


SOURCE_CATALOG = Path(__file__).with_name("monitored_sources.json")
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


def load_sources() -> list[dict[str, Any]]:
    """Load enabled source adapters from the reviewed source catalog."""
    sources = json.loads(SOURCE_CATALOG.read_text(encoding="utf-8"))
    if not isinstance(sources, list):
        raise ValueError("Monitored source catalog must be a JSON list")
    return [source for source in sources if source.get("enabled") is True]


def collect(source: dict[str, Any]) -> dict:
    source_id = source["source_id"]
    source_url = source["api_url"]
    if source.get("adapter") != "govuk-fcdo":
        raise ValueError(f"Unsupported collector adapter: {source.get('adapter')}")
    if not robots_allows(source_url):
        raise RuntimeError(f"robots.txt disallows collection from {source_url}")

    # Stay well below GOV.UK Content API's documented 10 requests/second limit.
    time.sleep(MIN_REQUEST_INTERVAL_SECONDS)
    raw = read_limited(source_url, accept="application/json")
    payload = json.loads(raw)
    details = payload.get("details") or {}
    parts = details.get("parts") or []
    if not parts:
        raise ValueError(f"No source sections were returned for {source_id}")
    fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

    candidates = []
    for index, part in enumerate(parts):
        body = clean_html(part.get("body") or "")
        if not body:
            continue
        title = part.get("title") or payload.get("title") or "Foreign travel advice"
        category = part.get("slug") or "unclassified"
        fingerprint = hashlib.sha256(f"{title}\n{body}".encode("utf-8")).hexdigest()
        stable_section = re.sub(r"[^a-z0-9]+", "-", category.lower()).strip("-") or f"section-{index + 1}"
        candidates.append({
            # A content-version ID lets unchanged polls deduplicate while a
            # changed section creates a new review candidate in Supabase.
            "candidate_id": f"{source_id}-{stable_section}-{fingerprint[:16]}",
            "status": "needs_review",
            "destination": source["destination"],
            "destination_slug": source["destination_slug"],
            "country_code": source["country_code"],
            "category": category,
            "title": title,
            "candidate_text": body,
            "source": {
                "title": payload.get("title") or f"Foreign travel advice: {source['destination']}",
                "organization": "UK Foreign, Commonwealth & Development Office",
                "url": source_url,
                "canonical_page": payload.get("base_path") or source["canonical_page"],
                "jurisdiction": source["jurisdiction"],
                "public_updated_at": payload.get("public_updated_at"),
                "license": source["license"],
                "attribution": "Contains public sector information licensed under the Open Government Licence v3.0.",
            },
            "collected_at": fetched_at,
            "content_sha256": fingerprint,
            "review_note": "New or unchanged content version captured for review. A human must verify relevance, jurisdiction, currentness, and traveler-facing wording before use.",
        })

    return {
        "source_id": source_id,
        "source_url": source_url,
        "collected_at": fetched_at,
        "content_sha256": hashlib.sha256(raw).hexdigest(),
        "candidate_count": len(candidates),
        "candidates": candidates,
    }


def main() -> None:
    cli = argparse.ArgumentParser(description="Collect reviewed GOV.UK FCDO sources into local review files.")
    cli.add_argument("--output-dir", type=Path, default=Path("data/candidates"))
    cli.add_argument("--source-id", help="Collect one source ID from collectors/monitored_sources.json")
    args = cli.parse_args()
    sources = load_sources()
    if args.source_id:
        sources = [source for source in sources if source["source_id"] == args.source_id]
        if not sources:
            raise SystemExit(f"No enabled source found for ID: {args.source_id}")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    errors = []
    for source in sources:
        try:
            result = collect(source)
        except (HTTPError, URLError, TimeoutError, ValueError, RuntimeError, json.JSONDecodeError) as exc:
            errors.append(f"{source['source_id']}: {exc}")
            continue
        output = args.output_dir / f"{result['source_id']}.json"
        output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Saved {result['candidate_count']} review candidates to {output}")
    if errors:
        raise SystemExit("Collection failed:\n" + "\n".join(errors))


if __name__ == "__main__":
    main()
