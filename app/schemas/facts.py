"""Response models for reviewed source-backed travel facts."""

from datetime import date

from typing import Literal

from pydantic import AnyHttpUrl, BaseModel


TripPurpose = Literal["tourism", "business", "study", "work", "family", "long-term", "transit"]
ApplicabilityStatus = Literal["general", "conditional"]


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
    min_stay_days: int | None = None
    max_stay_days: int | None = None
    applies_to_purposes: list[TripPurpose] | None = None
    applicability_status: ApplicabilityStatus
    last_verified_at: date
    sources: list[SourceCitation]
