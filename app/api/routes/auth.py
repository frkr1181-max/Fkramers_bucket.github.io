from fastapi import APIRouter, Depends, HTTPException, Response
from app.core.config import get_settings

from app.auth import require_authenticated_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/config")
def auth_config(response: Response):
    """Expose only public client configuration; never return the service key."""
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_publishable_key:
        raise HTTPException(503, "Supabase Auth is not configured")
    response.headers["Cache-Control"] = "no-store"
    return {"url": settings.supabase_url, "publishableKey": settings.supabase_publishable_key}


@router.get("/me")
def current_user(response: Response, user: dict = Depends(require_authenticated_user)) -> dict[str, str | None]:
    """Return the identity for the currently authenticated Supabase user."""
    response.headers["Cache-Control"] = "no-store"
    return {"id": user["id"], "email": user.get("email")}
