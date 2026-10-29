from fastapi import APIRouter, Depends

from app.auth import require_authenticated_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
def current_user(user: dict = Depends(require_authenticated_user)) -> dict[str, str | None]:
    """Return the identity for the currently authenticated Supabase user."""
    return {"id": user["id"], "email": user.get("email")}
