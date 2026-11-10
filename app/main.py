"""FastAPI application entry point and route registration."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, destinations, health, trips
from app.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title="RoamReady API",
        description="Authenticated, source-grounded country travel information.",
        version="0.2.0",
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.frontend_origins),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "apikey"],
    )
    application.include_router(health.router, prefix="/api")
    application.include_router(auth.router, prefix="/api")
    application.include_router(trips.router, prefix="/api")
    application.include_router(destinations.router, prefix="/api")
    application.mount("/", StaticFiles(directory=Path(__file__).resolve().parents[1] / "site", html=True), name="frontend")
    return application


app = create_app()

