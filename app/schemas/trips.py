"""Writable trip fields; identity and timestamps always come from the server."""

from datetime import date
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, StrictBool, model_validator
from app.schemas.facts import TripPurpose


class TripInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    destination_slug: str = Field(min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    trip_name: str | None = Field(default=None, min_length=1, max_length=80)
    trip_purpose: TripPurpose | Literal["leisure", "emergency"] = "tourism"
    start_date: date | None = None
    end_date: date | None = None
    estimated_duration_value: int | None = Field(default=None, gt=0, le=2147483647, strict=True)
    estimated_duration_unit: Literal["day", "week", "month", "year"] | None = None
    travel_experience: Literal["first-solo", "some"] | None = None
    completed_checklist: dict[str, StrictBool] = Field(default_factory=dict, max_length=100)

    @model_validator(mode="after")
    def validate_timing(self):
        if self.end_date and (not self.start_date or self.end_date < self.start_date):
            raise ValueError("Return date cannot be before the start date")
        if (self.estimated_duration_value is None) != (self.estimated_duration_unit is None):
            raise ValueError("Estimated duration needs both a value and a unit")
        if self.end_date and self.estimated_duration_value is not None:
            raise ValueError("Use an exact return date or an estimated duration")
        if any(len(key) > 100 for key in self.completed_checklist):
            raise ValueError("Checklist keys must be at most 100 characters")
        return self
