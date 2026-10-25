"""Database queries for the country catalog and reviewed guide facts."""

from typing import Any

from app.repositories.supabase_rest import select_rows


def list_destinations() -> list[dict[str, Any]]:
    return select_rows("destinations", {
        "select": "slug,name,iso_alpha2,region,research_owner",
        "active": "eq.true",
        "order": "name.asc",
    })


def get_destination(slug: str) -> dict[str, Any] | None:
    rows = select_rows("destinations", {
        "select": "slug,name,iso_alpha2,region,research_owner",
        "slug": f"eq.{slug}",
        "active": "eq.true",
        "limit": "1",
    })
    return rows[0] if rows else None


def list_published_facts(destination_slug: str, category: str | None = None) -> list[dict[str, Any]]:
    params = {
        "select": "id,destination_slug,category,title,plain_summary,official_text_excerpt,last_verified_at,sources",
        "destination_slug": f"eq.{destination_slug}",
        "published": "eq.true",
        "order": "category.asc,title.asc",
    }
    if category:
        params["category"] = f"eq.{category}"
    return select_rows("travel_facts", params)
