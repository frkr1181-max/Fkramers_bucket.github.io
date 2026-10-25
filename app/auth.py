"""Supabase Auth token validation for protected API routes."""

import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings


bearer_scheme = HTTPBearer(auto_error=False)


def require_authenticated_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any]:
    """Validate a Supabase access token and return its Auth user record."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer access token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    settings = get_settings()
    supabase_url = settings.supabase_url
    publishable_key = settings.supabase_publishable_key
    if not supabase_url or not publishable_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase Auth is not configured",
        )

    request = Request(
        f"{supabase_url}/auth/v1/user",
        headers={
            "apikey": publishable_key,
            "Authorization": f"Bearer {credentials.credentials}",
            "Accept": "application/json",
        },
    )

    try:
        with urlopen(request, timeout=5) as response:
            user = json.loads(response.read())
    except HTTPError as error:
        if error.code in (401, 403):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired access token",
                headers={"WWW-Authenticate": "Bearer"},
            ) from error
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase Auth could not validate the access token",
        ) from error
    except (URLError, TimeoutError, json.JSONDecodeError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase Auth is unavailable",
        ) from error

    if not isinstance(user, dict) or not user.get("id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Supabase Auth user response",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.get("is_anonymous", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A registered account is required",
        )

    return user
