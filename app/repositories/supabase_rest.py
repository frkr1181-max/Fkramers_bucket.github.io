"""Small server-only Supabase REST adapter; privileged keys stay in the API."""

from __future__ import annotations

import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import HTTPException, status

from app.core.config import get_settings


def select_rows(table: str, params: dict[str, str]) -> list[dict[str, Any]]:
    settings = get_settings()
    key = settings.supabase_service_role_key
    if not settings.supabase_url or not key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase data access is not configured",
        )

    query = urlencode(params)
    request = Request(
        f"{settings.supabase_url}/rest/v1/{table}?{query}",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Accept": "application/json",
        },
    )
    try:
        with urlopen(request, timeout=8) as response:
            rows = json.loads(response.read())
    except HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Supabase could not return {table}",
        ) from error
    except (URLError, TimeoutError, json.JSONDecodeError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase data service is unavailable",
        ) from error
    if not isinstance(rows, list):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase returned an unexpected data response",
        )
    return rows
