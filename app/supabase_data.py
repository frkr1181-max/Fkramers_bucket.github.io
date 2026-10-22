"""Minimal server-side read access to approved Supabase travel facts."""

import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import HTTPException, status

from app.config import load_local_env

load_local_env()


def list_published_facts(country_code: str) -> list[dict]:
    """Read published facts after the route validates the caller's Auth session."""
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_role_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase data access is not configured",
        )

    query = urlencode({
        "select": "id,country_code,category,title,plain_summary,official_text_excerpt,last_verified_at,sources",
        "country_code": f"eq.{country_code}",
        "published": "eq.true",
        "order": "category.asc,title.asc",
    })
    request = Request(
        f"{supabase_url}/rest/v1/travel_facts?{query}",
        headers={
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Accept": "application/json",
        },
    )
    try:
        with urlopen(request, timeout=8) as response:
            rows = json.loads(response.read())
    except HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase could not return travel facts",
        ) from error
    except (URLError, TimeoutError, json.JSONDecodeError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase data service is unavailable",
        ) from error
    return rows
