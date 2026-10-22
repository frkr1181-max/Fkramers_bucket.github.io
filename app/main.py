"""HTTP API for the RoamReady backend."""

import os

from fastapi import Depends, FastAPI, HTTPException
# FastAPI builds the API, and HTTPException creates clear error responses.
from fastapi.middleware.cors import CORSMiddleware

from app.auth import require_authenticated_user
# Validate Supabase sessions before returning traveler data.

from app.data import PILOT_DESTINATIONS
# Pilot destinations remain in code until the team finalizes their database list.

from app.models import Destination, TravelFact
# These models define the data shape that the API is allowed to return.
from app.supabase_data import list_published_facts

app = FastAPI(
# Create the FastAPI application object used by the development server.
    title="RoamReady API",
    # Show the project's name in the interactive API documentation.
    description="Source-grounded travel information for the RoamReady pilot.",
    # Explain the purpose of this API to teammates exploring the docs.
    version="0.1.0",
    # Mark this as the first small prototype version.
)
# Finish configuring the FastAPI application.

frontend_origins = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:5500,http://127.0.0.1:5500",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in frontend_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "apikey"],
)


@app.get("/api/health", tags=["health"])
# Register a read-only GET route that reports whether the API is responding.
def health() -> dict[str, str]:
# Define the function that FastAPI calls when the health route is requested.
    return {"status": "ok"}
    # Send a small JSON response that is easy to check during setup.


@app.get("/api/destinations", response_model=list[Destination], tags=["destinations"])
# Register a route that returns only values allowed by the Destination model.
def list_destinations(
    _user: dict = Depends(require_authenticated_user),
) -> list[Destination]:
# Define the function that handles requests for the pilot destination list.
    return PILOT_DESTINATIONS
    # Return the prototype destinations used by the team.


@app.get("/api/auth/me", tags=["auth"])
def current_user(
    user: dict = Depends(require_authenticated_user),
) -> dict[str, str | None]:
    """Return the identity for the currently authenticated Supabase user."""
    return {"id": user["id"], "email": user.get("email")}


@app.get(
# Begin the route registration for facts belonging to one destination.
    "/api/destinations/{country_code}/facts",
    # Put the destination's two-letter country code in the URL path.
    response_model=list[TravelFact],
    # Filter and document each returned fact using the TravelFact model.
    tags=["facts"],
    # Group this route with other fact-related routes in the API docs.
)
# Finish registering the facts route.
def list_destination_facts(
    country_code: str,
    _user: dict = Depends(require_authenticated_user),
) -> list[TravelFact]:
# Define the function and receive the country code from the URL.
    normalized_code = country_code.upper()
    # Normalize letter case so "es" and "ES" identify the same country.
    if normalized_code not in {destination.country_code for destination in PILOT_DESTINATIONS}:
    # Check that the requested country belongs to the prototype destination list.
        raise HTTPException(status_code=404, detail="Pilot destination not found")
        # Return a useful not-found response instead of an unexplained server error.
    return list_published_facts(normalized_code)
    # Read only published rows after validating the user's Supabase session.

