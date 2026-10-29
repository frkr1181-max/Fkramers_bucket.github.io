from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth import require_authenticated_user
from app.repositories.destinations import (
    get_destination,
    list_destinations,
    list_published_facts,
)
from app.schemas.destinations import Destination
from app.schemas.facts import TravelFact

router = APIRouter(prefix="/destinations", tags=["destinations"])


@router.get("", response_model=list[Destination])
def destinations(_user: dict = Depends(require_authenticated_user)) -> list[dict]:
    return list_destinations()


@router.get("/{destination_slug}/facts", response_model=list[TravelFact], tags=["facts"])
def destination_facts(
    destination_slug: str,
    category: str | None = Query(default=None, min_length=1, max_length=64),
    _user: dict = Depends(require_authenticated_user),
) -> list[dict]:
    destination = get_destination(destination_slug)
    if destination is None:
        raise HTTPException(status_code=404, detail="Destination not found")
    return list_published_facts(destination_slug, category)
