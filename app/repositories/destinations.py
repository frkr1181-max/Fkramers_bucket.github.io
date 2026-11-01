"""Database queries for the country catalog and reviewed guide facts."""

from typing import Any

from app.schemas.facts import TripPurpose

from app.repositories.supabase_rest import select_public_rows


def list_destinations() -> list[dict[str, Any]]:
    return select_public_rows("destinations", {
        "select": "slug,name,iso_alpha2,region,research_owner",
        "active": "eq.true",
        "order": "name.asc",
    })


def get_destination(slug: str) -> dict[str, Any] | None:
    rows = select_public_rows("destinations", {
        "select": "slug,name,iso_alpha2,region,research_owner",
        "slug": f"eq.{slug}",
        "active": "eq.true",
        "limit": "1",
    })
    return rows[0] if rows else None


def list_published_facts(
    destination_slug: str,
    category: str | None = None,
    stay_days_min: int | None = None,
    stay_days_max: int | None = None,
    purpose: TripPurpose | None = None,
) -> list[dict[str, Any]]:
    params = {
        "select": "id,destination_slug,category,title,plain_summary,official_text_excerpt,min_stay_days,max_stay_days,applies_to_purposes,applicability_status,last_verified_at,sources",
        "destination_slug": f"eq.{destination_slug}",
        "published": "eq.true",
        "applicability_status": "in.(general,conditional)",
        "order": "category.asc,title.asc",
    }
    if category:
        params["category"] = f"eq.{category}"
    rows = select_public_rows("travel_facts", params)

    # When no stay range or purpose is supplied, hide conditional guidance
    # instead of guessing. For estimates spanning a boundary, return facts
    # that could apply anywhere in the estimated range. A single bound means
    # the other side is open-ended.
    has_stay_range = stay_days_min is not None or stay_days_max is not None
    requested_min = stay_days_min or 1 if has_stay_range else None
    requested_max = stay_days_max or 36500 if has_stay_range else None

    matching_rows: list[dict[str, Any]] = []
    for row in rows:
        minimum = row.get("min_stay_days")
        maximum = row.get("max_stay_days")
        purposes = row.get("applies_to_purposes")

        if not has_stay_range:
            if minimum is not None or maximum is not None:
                continue
        else:
            assert requested_min is not None and requested_max is not None
            if maximum is not None and requested_min > maximum:
                continue
            if minimum is not None and requested_max < minimum:
                continue

        if purpose is None:
            if purposes is not None:
                continue
        elif purposes is not None and purpose not in purposes:
            continue

        matching_rows.append(row)

    return matching_rows
