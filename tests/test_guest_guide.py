"""Verify the active frontend and trip-filtered public Japan guide share one app."""
from unittest.mock import patch

from fastapi.testclient import TestClient
from app.main import create_app


def test_main_frontend_and_api_routes():
    client = TestClient(create_app())
    page = client.get('/')
    assert page.status_code == 200
    assert 'js/main.js' in page.text
    assert client.get('/js/auth.js').status_code == 200
    assert client.get('/api/health').status_code == 200
    assert client.get('/docs').status_code == 200
    assert client.get('/src/main.js').status_code == 404


def test_japan_guide_filters_conditional_facts_for_trip():
    general = dict(id='general', destination_slug='japan', category='entry', title='Passport',
                   plain_summary='Read the source.', last_verified_at='2026-11-05', sources=[],
                   applicability_status='general')
    tourism = dict(general, id='short-tourism', applicability_status='conditional',
                   min_stay_days=1, max_stay_days=90, applies_to_purposes=['tourism'])
    work = dict(general, id='work', applicability_status='conditional', applies_to_purposes=['work'])
    def select(table, params):
        if table == 'destinations':
            return [{'slug':'japan', 'name':'Japan'}]
        assert params['published'] == 'eq.true'
        assert params['destination_slug'] == 'eq.japan'
        return [general, tourism, work]
    with patch('app.repositories.destinations.select_public_rows', side_effect=select):
        client = TestClient(create_app())
        response = client.get('/api/destinations/japan/facts?purpose=tourism&stay_days_min=14&stay_days_max=14')
        assert response.status_code == 200
        assert {fact['id'] for fact in response.json()} == {'general', 'short-tourism'}
        response = client.get('/api/destinations/japan/facts?purpose=work&stay_days_min=120&stay_days_max=120')
        assert {fact['id'] for fact in response.json()} == {'general', 'work'}
