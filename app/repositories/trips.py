"""Trip operations use the caller's JWT and publishable key so RLS applies."""

import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from fastapi import HTTPException
from app.core.config import get_settings


def trip_request(method: str, token: str, owner_id: str, trip_id: str | None = None,
                 payload: dict | None = None) -> list[dict]:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_publishable_key:
        raise HTTPException(503, "Supabase trip storage is not configured")
    params = {"owner_id": f"eq.{owner_id}", "select": "*"}
    if trip_id:
        params["id"] = f"eq.{trip_id}"
    if method == "GET":
        params["order"] = "updated_at.desc"
    if payload is not None:
        payload = {**payload, "owner_id": owner_id}
        if method == "PATCH":
            from datetime import datetime, timezone
            payload["updated_at"] = datetime.now(timezone.utc).isoformat()
    request = Request(
        f"{settings.supabase_url}/rest/v1/user_trips?{urlencode(params)}",
        method=method,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={"apikey": settings.supabase_publishable_key,
                 "Authorization": f"Bearer {token}", "Content-Type": "application/json",
                 "Accept": "application/json", "Prefer": "return=representation"},
    )
    try:
        with urlopen(request, timeout=8) as response:
            rows = json.loads(response.read())
    except HTTPError as error:
        code = error.code
        if code in (401, 403):
            raise HTTPException(code, "Your session cannot access these trips; sign in again") from error
        if code in (400, 409, 422):
            raise HTTPException(422, "Trip could not be saved; check its destination and details") from error
        raise HTTPException(503, "Trip storage is unavailable") from error
    except (URLError, TimeoutError, json.JSONDecodeError) as error:
        raise HTTPException(503, "Trip storage is unavailable") from error
    if not isinstance(rows, list):
        raise HTTPException(503, "Unexpected trip storage response")
    return rows
