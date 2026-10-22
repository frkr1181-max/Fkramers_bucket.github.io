"""Starter destination list kept in code during the prototype."""
# This file keeps the destination labels separate from API route functions.

from app.models import Destination
# Import the response shape for the starter destination list.

PILOT_DESTINATIONS = [
# Include the build-document pilot set and Japan for the prototype screens.
    Destination(country_code="DZ", name="Algeria", region="Africa"),
    # Add Algeria using its ISO two-letter country code.
    Destination(country_code="BR", name="Brazil", region="South America"),
    # Add Brazil using its ISO two-letter country code.
    Destination(country_code="EG", name="Egypt", region="Africa"),
    # Add Egypt using its ISO two-letter country code.
    Destination(country_code="KR", name="South Korea", region="Asia"),
    # Add South Korea using its ISO two-letter country code.
    Destination(country_code="PY", name="Paraguay", region="South America"),
    # Add Paraguay using its ISO two-letter country code.
    Destination(country_code="ES", name="Spain", region="Europe"),
    # Add Spain using its ISO two-letter country code.
    Destination(country_code="JP", name="Japan", region="Asia"),
    # Include Japan because it is the destination selected for the prototype flow.
]
# Finish the starter destination list.
