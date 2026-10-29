"""Backward-compatible exports for API response schemas."""

from app.schemas.destinations import Destination
from app.schemas.facts import SourceCitation, TravelFact

__all__ = ["Destination", "SourceCitation", "TravelFact"]
