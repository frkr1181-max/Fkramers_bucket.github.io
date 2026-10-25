"""Response models for reviewed source-backed travel facts."""

from datetime import date

from pydantic import AnyHttpUrl, BaseModel


class SourceCitation(BaseModel):
    title: str
    organization: str
    url: AnyHttpUrl
    checked_at: date


class TravelFact(BaseModel):
    id: str
    destination_slug: str
    category: str
    title: str
    plain_summary: str
    official_text_excerpt: str | None = None
    last_verified_at: date
    sources: list[SourceCitation]
