"""Response models for country-level guide destinations."""

from pydantic import BaseModel


class Destination(BaseModel):
    slug: str
    name: str
    iso_alpha2: str | None = None
    region: str
    research_owner: str
