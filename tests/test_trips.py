"""Exercise validation, authenticated routing, and RLS credentials without live writes."""
import json
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi.testclient import TestClient
from app.main import create_app
from app.core.config import Settings
from app.repositories.trips import trip_request

OWNER = "11111111-1111-4111-8111-111111111111"
TRIP = "22222222-2222-4222-8222-222222222222"
SETTINGS = Settings("https://example.supabase.co", "public-key", "SECRET-NEVER-USE", ())


@pytest.fixture
def client():
    return TestClient(create_app())


class Reply:
    def __init__(self, data): self.data = data
    def __enter__(self): return self
    def __exit__(self, *args): pass
    def read(self): return json.dumps(self.data).encode()


def auth_reply(user=None):
    return patch("app.auth.urlopen", return_value=Reply(user or {"id": OWNER, "email": "test@example.com"}))


@pytest.mark.parametrize("method,path", [("get", "/api/trips"), ("post", "/api/trips"),
    ("get", f"/api/trips/{TRIP}"), ("put", f"/api/trips/{TRIP}"), ("delete", f"/api/trips/{TRIP}")])
def test_requires_auth(client, method, path):
    assert getattr(client, method)(path).status_code == 401


@pytest.mark.parametrize("fields", [
    {"owner_id": OWNER}, {"password": "secret"}, {"email": "x@example.com"},
    {"end_date": "2026-12-02"}, {"start_date": "2026-12-02", "end_date": "2026-12-01"},
    {"estimated_duration_value": 3}, {"estimated_duration_value": 0, "estimated_duration_unit": "week"},
    {"estimated_duration_value": 2.5, "estimated_duration_unit": "week"},
    {"start_date": "2026-12-01", "end_date": "2026-12-02", "estimated_duration_value": 3, "estimated_duration_unit": "week"},
    {"trip_purpose": "invalid"}, {"completed_checklist": {"x": "yes"}},
])
def test_rejects_bad_or_identity_fields(client, fields):
    with auth_reply(), patch("app.api.routes.trips.trip_request") as storage:
        result = client.post("/api/trips", headers={"Authorization": "Bearer user-token"},
                             json={"destination_slug": "japan", **fields})
        assert result.status_code == 422
        storage.assert_not_called()


def test_create_uses_validated_identity(client):
    with auth_reply(), patch("app.api.routes.trips.trip_request", return_value=[{"id": TRIP}]) as storage:
        response = client.post("/api/trips", headers={"Authorization": "Bearer user-token"}, json={
            "destination_slug": "japan", "estimated_duration_value": 2, "estimated_duration_unit": "week",
            "completed_checklist": {"prep-0": True}})
        assert response.status_code == 201
        args, kwargs = storage.call_args
        assert args == ("POST", "user-token", OWNER)
        assert kwargs["payload"]["completed_checklist"] == {"prep-0": True}


@pytest.mark.parametrize("method", ["GET", "PATCH", "DELETE"])
def test_storage_uses_owner_filter_and_user_token(method):
    with patch("app.repositories.trips.get_settings", return_value=SETTINGS), \
         patch("app.repositories.trips.urlopen", return_value=Reply([])) as send:
        trip_request(method, "user-token", OWNER, TRIP,
                     {"destination_slug": "japan"} if method == "PATCH" else None)
        request = send.call_args.args[0]
        assert request.get_header("Authorization") == "Bearer user-token"
        assert request.get_header("Apikey") == "public-key"
        assert parse_qs(urlparse(request.full_url).query)["owner_id"] == [f"eq.{OWNER}"]
        assert parse_qs(urlparse(request.full_url).query)["id"] == [f"eq.{TRIP}"]
        if request.data:
            assert json.loads(request.data)["owner_id"] == OWNER


@pytest.mark.parametrize("method", ["get", "put", "delete"])
def test_inaccessible_trip_is_404(client, method):
    with auth_reply(), patch("app.api.routes.trips.trip_request", return_value=[]):
        options = {"json": {"destination_slug": "japan"}} if method == "put" else {}
        assert getattr(client, method)(f"/api/trips/{TRIP}",
            headers={"Authorization": "Bearer user-token"}, **options).status_code == 404


def test_anonymous_auth_account_cannot_save(client):
    with auth_reply({"id": OWNER, "is_anonymous": True}):
        assert client.post("/api/trips", headers={"Authorization": "Bearer user-token"},
                           json={"destination_slug": "japan"}).status_code == 403


def test_config_excludes_service_key(client):
    with patch("app.api.routes.auth.get_settings", return_value=SETTINGS):
        response = client.get("/api/auth/config")
        assert response.json() == {"url": SETTINGS.supabase_url, "publishableKey": "public-key"}
        assert response.headers["cache-control"] == "no-store"
