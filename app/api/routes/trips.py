from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import HTTPAuthorizationCredentials
from app.auth import bearer_scheme, require_authenticated_user
from app.repositories.trips import trip_request
from app.schemas.trips import TripInput

def disable_cache(response: Response):
    response.headers["Cache-Control"] = "no-store"


router = APIRouter(prefix="/trips", tags=["trips"], dependencies=[Depends(disable_cache)])


def trip_session(user: dict = Depends(require_authenticated_user),
                 credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    return user["id"], credentials.credentials


@router.get("")
def list_trips(session=Depends(trip_session)):
    owner, token = session
    return trip_request("GET", token, owner)


@router.post("", status_code=201)
def create_trip(trip: TripInput, session=Depends(trip_session)):
    owner, token = session
    rows = trip_request("POST", token, owner, payload=trip.model_dump(mode="json"))
    if not rows:
        raise HTTPException(503, "Trip storage did not confirm the save")
    return rows[0]


@router.get("/{trip_id}")
def get_trip(trip_id: UUID, session=Depends(trip_session)):
    owner, token = session
    rows = trip_request("GET", token, owner, str(trip_id))
    if not rows:
        raise HTTPException(404, "Trip not found")
    return rows[0]


@router.put("/{trip_id}")
def update_trip(trip_id: UUID, trip: TripInput, session=Depends(trip_session)):
    owner, token = session
    rows = trip_request("PATCH", token, owner, str(trip_id), trip.model_dump(mode="json"))
    if not rows:
        raise HTTPException(404, "Trip not found")
    return rows[0]


@router.delete("/{trip_id}", status_code=204)
def delete_trip(trip_id: UUID, session=Depends(trip_session)):
    owner, token = session
    if not trip_request("DELETE", token, owner, str(trip_id)):
        raise HTTPException(404, "Trip not found")
    return Response(status_code=204)
