"""API response models for destinations and source-backed travel facts."""
# A model describes the fields an API record must contain.

from datetime import date
# Use date values for verification dates so their format stays consistent.

from pydantic import AnyHttpUrl, BaseModel
# BaseModel validates records, and AnyHttpUrl rejects malformed source links.


class Destination(BaseModel):
# Define the public fields returned for a pilot destination.
    country_code: str
    # Store the two-letter country code used in the destination API path.
    name: str
    # Store the readable destination name shown to travelers.
    region: str | None = None
    # Keep the broad region optional until the team confirms it is needed.


class SourceCitation(BaseModel):
# Define the source details that must accompany a verified travel fact.
    title: str
    # Store the page or document title people can recognize.
    organization: str
    # Identify the government or official organization publishing the source.
    url: AnyHttpUrl
    # Require a valid web address so users can open the original evidence.
    checked_at: date
    # Record when the team last checked this source.


class TravelFact(BaseModel):
# Define one reviewed travel claim that can be returned to the website.
    id: str
    # Give the fact a stable identifier for updates and citations.
    category: str
    # Group the fact, for example under entry, safety, or transportation.
    title: str
    # Give the claim a short heading.
    plain_summary: str
    # Store the team's traveler-friendly explanation separately from official text.
    official_text_excerpt: str | None = None
    # Preserve a relevant source excerpt when the team has one.
    last_verified_at: date
    # Show when a reviewer last confirmed this fact.
    sources: list[SourceCitation]
    # Require one or more source records so claims remain traceable.
