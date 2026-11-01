from fastapi import APIRouter, HTTPException, Query

from app.repositories.destinations import (
    get_destination,
    list_destinations,
    list_published_facts,
)
from app.schemas.destinations import Destination
from app.schemas.facts import TripPurpose, TravelFact

router = APIRouter(prefix="/destinations", tags=["destinations"])


@router.get("", response_model=list[Destination])
def destinations() -> list[dict]:
    return list_destinations()


@router.get("/{destination_slug}/facts", response_model=list[TravelFact], tags=["facts"])
def destination_facts(
    destination_slug: str,
    category: str | None = Query(default=None, min_length=1, max_length=64),
    stay_days_min: int | None = Query(
        default=None,
        ge=1,
        le=36500,
        description="Shortest possible trip length in days, inclusive. Estimates can use a range.",
    ),
    stay_days_max: int | None = Query(
        default=None,
        ge=1,
        le=36500,
        description="Longest possible trip length in days, inclusive. Estimates can use a range.",
    ),
    purpose: TripPurpose | None = Query(
        default=None,
        description="Trip purpose; conditional facts for other purposes are excluded.",
    ),
) -> list[dict]:
    """Return general facts and only those conditional facts matching this trip."""
    destination = get_destination(destination_slug)
    if destination is None:
        raise HTTPException(status_code=404, detail="Destination not found")
    if stay_days_min is not None and stay_days_max is not None and stay_days_min > stay_days_max:
        raise HTTPException(status_code=422, detail="stay_days_min cannot be greater than stay_days_max")
    return list_published_facts(destination_slug, category, stay_days_min, stay_days_max, purpose)
