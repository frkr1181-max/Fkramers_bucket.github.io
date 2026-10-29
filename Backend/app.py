import os
# Load standard-library tools for paths, JSON responses, regular expressions, and SQLite.
import re
# Use regular expressions to turn a travel question into searchable words.
import sqlite3
# Use SQLite so the class prototype can run without a separate database server.
from pathlib import Path
# Use Path objects to build file locations safely across operating systems.
from flask import Flask, g, jsonify, request
# Use Flask to create the web API and return structured JSON responses.

BASE_DIR = Path(__file__).resolve().parent
# Find this backend folder so database paths do not depend on the launch directory.
DATABASE_PATH = Path(os.getenv("ROAMREADY_DATABASE", BASE_DIR / "instance" / "roamready.sqlite3"))
# Allow the team to select a database path with an environment setting.
PILOT_DESTINATIONS = [("Algeria", "DZ"), ("Brazil", "BR"), ("Egypt", "EG"), ("South Korea", "KR"), ("Paraguay", "PY"), ("Spain", "ES")]
# Seed the six first-round destinations named in the project build document.
app = Flask(__name__)
# Create the Flask application that receives browser and assistant requests.


def get_database():
# Return one SQLite connection for the current web request.
    if "database" not in g:
    # Reuse the request's connection when another helper needs the database.
        DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
        # Create the database folder on a first run if it does not exist yet.
        g.database = sqlite3.connect(DATABASE_PATH)
        # Open the local database file for this request.
        g.database.execute("PRAGMA foreign_keys = ON")
        # Ask SQLite to enforce the links between destinations, facts, and sources.
        g.database.row_factory = sqlite3.Row
        # Make query results behave like dictionaries with named columns.
    return g.database
    # Give the caller the request's SQLite connection.


@app.teardown_appcontext
# Ask Flask to close the request's database connection when the request ends.
def close_database(error=None):
# Release the database connection after Flask finishes a request.
    database = g.pop("database", None)
    # Remove the connection from Flask's request storage if one was opened.
    if database is not None:
    # Close the connection only when the request actually used the database.
        database.close()
        # Release the local database file handle.


def initialize_database():
# Create the tables and pilot destinations the first time the backend runs.
    database = sqlite3.connect(DATABASE_PATH)
    # Open the configured SQLite file outside a web request.
    database.execute("PRAGMA foreign_keys = ON")
    # Enforce relationships while creating and seeding the database.
    database.execute("CREATE TABLE IF NOT EXISTS destinations (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, country_code TEXT NOT NULL UNIQUE)")
    # Store one stable record for each destination supported by the pilot.
    database.execute("CREATE TABLE IF NOT EXISTS sources (id INTEGER PRIMARY KEY, title TEXT NOT NULL, organization TEXT NOT NULL, url TEXT NOT NULL, source_type TEXT NOT NULL, checked_at TEXT, active INTEGER NOT NULL DEFAULT 1)")
    # Keep source ownership and URLs separate so each fact can cite evidence.
    database.execute("CREATE TABLE IF NOT EXISTS facts (id INTEGER PRIMARY KEY, destination_id INTEGER NOT NULL REFERENCES destinations(id), category TEXT NOT NULL, title TEXT NOT NULL, plain_summary TEXT NOT NULL, official_excerpt TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('candidate', 'approved', 'rejected', 'stale')), last_verified_at TEXT)")
    # Store individual claims and keep their approval state explicit.
    database.execute("CREATE TABLE IF NOT EXISTS fact_sources (fact_id INTEGER NOT NULL REFERENCES facts(id), source_id INTEGER NOT NULL REFERENCES sources(id), source_location TEXT, retrieved_at TEXT NOT NULL, PRIMARY KEY(fact_id, source_id))")
    # Connect each fact to its supporting source and record when it was collected.
    database.execute("CREATE TABLE IF NOT EXISTS collection_runs (id INTEGER PRIMARY KEY, source_id INTEGER REFERENCES sources(id), started_at TEXT NOT NULL, finished_at TEXT, outcome TEXT NOT NULL, records_found INTEGER NOT NULL DEFAULT 0, error_summary TEXT)")
    # Record collection attempts so the team can explain success and failure.
    database.execute("CREATE TABLE IF NOT EXISTS change_reviews (id INTEGER PRIMARY KEY, fact_id INTEGER NOT NULL REFERENCES facts(id), old_value TEXT, proposed_value TEXT NOT NULL, detected_at TEXT NOT NULL, decision TEXT NOT NULL DEFAULT 'pending', reviewer TEXT, reviewed_at TEXT)")
    # Preserve proposed changes until a teammate has reviewed them.
    database.executemany("INSERT OR IGNORE INTO destinations (name, country_code) VALUES (?, ?)", PILOT_DESTINATIONS)
    # Add the six pilot countries without duplicating them on later starts.
    database.commit()
    # Save the tables and seed data to the database file.
    database.close()
    # Close the setup connection before Flask starts serving requests.


def row_to_dict(row):
# Convert one SQLite row into a regular Python dictionary for JSON output.
    return dict(row)
    # Flask can serialize the dictionary as a JSON object.


@app.after_request
# Add browser headers so the separate front-end can read this API during development.
def add_browser_headers(response):
# Let the static project front end request the read-only API from another local origin.
    response.headers["Access-Control-Allow-Origin"] = "*"
    # Allow browser JavaScript to read responses from this prototype API.
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    # Permit the JSON content header used by the question endpoint.
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    # Advertise the request methods supported by this API.
    return response
    # Return the response with the development browser headers attached.


@app.get("/api/health")
# Provide a simple endpoint that confirms the backend is running.
def health():
# Return a small status message suitable for a demo or uptime check.
    return jsonify({"status": "ok", "service": "RoamReady API", "version": "0.1.0"})
    # Send a JSON response without exposing machine or database details.


@app.get("/api/destinations")
# Provide the front end with the destinations available in the pilot.
def list_destinations():
# Read and return every pilot destination in a predictable order.
    rows = get_database().execute("SELECT id, name, country_code FROM destinations ORDER BY name").fetchall()
    # Select only public destination fields and sort them by name.
    return jsonify({"destinations": [row_to_dict(row) for row in rows]})
    # Wrap the list in a named JSON field for a consistent response shape.


@app.get("/api/destinations/<int:destination_id>/facts")
# Provide approved source-backed facts for one selected destination.
def destination_facts(destination_id):
# Return traveler-facing facts without exposing candidate or reviewer information.
    database = get_database()
    # Reuse the current request's database connection.
    destination = database.execute("SELECT id, name, country_code FROM destinations WHERE id = ?", (destination_id,)).fetchone()
    # Look up the requested destination using a parameterized query.
    if destination is None:
    # Report an unknown destination instead of returning an empty success response.
        return jsonify({"error": {"code": "destination_not_found", "message": "That destination is not in the pilot."}}), 404
        # Use HTTP 404 because the requested destination does not exist.
    fact_rows = database.execute("SELECT id, category, title, plain_summary, last_verified_at FROM facts WHERE destination_id = ? AND status = 'approved' AND EXISTS (SELECT 1 FROM fact_sources AS fs JOIN sources AS s ON s.id = fs.source_id WHERE fs.fact_id = facts.id AND s.active = 1) ORDER BY category, title", (destination_id,)).fetchall()
    # Select only approved facts and fields that are safe for the website.
    facts = []
    # Prepare a list that will hold each fact and its source links.
    for fact_row in fact_rows:
    # Add the supporting source records to each approved fact.
        fact = row_to_dict(fact_row)
        # Convert the fact row into a JSON-friendly dictionary.
        source_rows = database.execute("SELECT s.id, s.title, s.organization, s.url, s.checked_at, fs.source_location, fs.retrieved_at FROM sources AS s JOIN fact_sources AS fs ON fs.source_id = s.id WHERE fs.fact_id = ? AND s.active = 1 ORDER BY s.title", (fact["id"],)).fetchall()
        # Include active sources with their original link and collection time.
        fact["sources"] = [row_to_dict(source_row) for source_row in source_rows]
        # Attach the evidence list so users can inspect where a fact came from.
        facts.append(fact)
        # Add the complete fact to the response list.
    return jsonify({"destination": row_to_dict(destination), "facts": facts, "notice": "Travel information can change; confirm details with the linked official source."})
    # Return approved information, its evidence, and a clear freshness reminder.


@app.post("/api/assistant/ask")
# Accept a question and retrieve matching approved facts without inventing answers.
def ask_assistant():
# Search verified pilot records and cite any facts included in the response.
    payload = request.get_json(silent=True)
    # Read the request body as JSON and handle malformed JSON as missing input.
    if not isinstance(payload, dict):
    # Require a JSON object before trying to read its fields.
        return jsonify({"error": {"code": "invalid_json", "message": "Send a JSON object with destination_id and question."}}), 400
        # Return HTTP 400 when the request body is not a JSON object.
    question = payload.get("question")
    # Read the travel question supplied by the user.
    destination_id = payload.get("destination_id")
    # Read the chosen destination so searches stay within its approved records.
    if not isinstance(question, str) or not question.strip() or len(question) > 1000:
    # Reject empty questions and limit request size to 1,000 characters.
        return jsonify({"error": {"code": "invalid_question", "message": "Question must contain 1 to 1,000 characters."}}), 400
        # Explain the accepted question size with a client error status.
    if not isinstance(destination_id, int) or isinstance(destination_id, bool):
    # Require an integer destination identifier and reject Python's boolean subtype.
        return jsonify({"error": {"code": "invalid_destination_id", "message": "destination_id must be an integer."}}), 400
        # Tell the caller how to correct a malformed destination identifier.
    database = get_database()
    # Open the request's database connection before searching records.
    destination = database.execute("SELECT id, name FROM destinations WHERE id = ?", (destination_id,)).fetchone()
    # Confirm the destination exists before looking for matching claims.
    if destination is None:
    # Avoid returning a misleading unsupported-answer response for an invalid destination.
        return jsonify({"error": {"code": "destination_not_found", "message": "That destination is not in the pilot."}}), 404
        # Report that the requested destination cannot be searched.
    question_words = {word.lower() for word in re.findall(r"[A-Za-z0-9]+", question) if len(word) > 2}
    # Keep meaningful question words and ignore short words such as “to” and “is”.
    fact_rows = database.execute("SELECT id, category, title, plain_summary, last_verified_at FROM facts WHERE destination_id = ? AND status = 'approved' AND EXISTS (SELECT 1 FROM fact_sources AS fs JOIN sources AS s ON s.id = fs.source_id WHERE fs.fact_id = facts.id AND s.active = 1) ORDER BY category, title", (destination_id,)).fetchall()
    # Retrieve only approved facts for the selected destination.
    matching_facts = []
    # Prepare a list for facts whose wording overlaps with the question.
    for fact_row in fact_rows:
    # Compare the question with each approved fact's title, category, and summary.
        fact = row_to_dict(fact_row)
        # Convert the stored fact into a regular dictionary.
        searchable_text = " ".join([fact["category"], fact["title"], fact["plain_summary"]]).lower()
        # Combine public fact text into one searchable string.
        if question_words.intersection(re.findall(r"[A-Za-z0-9]+", searchable_text)):
        # Keep a fact when at least one meaningful question word matches it.
            source_rows = database.execute("SELECT s.id, s.title, s.organization, s.url, s.checked_at, fs.source_location, fs.retrieved_at FROM sources AS s JOIN fact_sources AS fs ON fs.source_id = s.id WHERE fs.fact_id = ? AND s.active = 1 ORDER BY s.title", (fact["id"],)).fetchall()
            # Fetch active citations for the fact before it can support an answer.
            fact["sources"] = [row_to_dict(source_row) for source_row in source_rows]
            # Attach those citations to the fact returned to the traveler.
            if fact["sources"]:
            # Do not return a matching claim if it has no currently active source.
                matching_facts.append(fact)
                # Keep the fact only when the evidence link is available.
    if not matching_facts:
    # Clearly abstain when verified sourced records cannot answer the question.
        return jsonify({"answer": "RoamReady does not have a verified answer for that question yet. Check the official destination sources or ask the team to review this topic.", "citations": [], "limitation": "No matching approved fact with an active source was found."})
        # Return an explicit limitation instead of guessing about travel guidance.
    answer = " ".join(fact["plain_summary"] for fact in matching_facts)
    # Build the response only from approved summaries already stored in the database.
    citations = [{"fact_id": fact["id"], "title": fact["title"], "last_verified_at": fact["last_verified_at"], "sources": fact["sources"]} for fact in matching_facts]
    # Provide fact IDs, verification dates, and evidence links for every summary.
    return jsonify({"answer": answer, "citations": citations, "limitation": "This response uses matching approved records only; confirm current rules with the linked official source."})
    # Return the source-grounded response and explain its limits.


@app.errorhandler(404)
# Give unknown API routes the same predictable JSON error shape as other failures.
def not_found(error):
# Convert Flask's default missing-route response into a JSON message.
    return jsonify({"error": {"code": "not_found", "message": "The requested API route was not found."}}), 404
    # Send HTTP 404 with a short message suitable for the front end.


if __name__ == "__main__":
# Initialize local tables and start the development server only when run directly.
    initialize_database()
    # Prepare the SQLite database before the first request arrives.
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=False)
    # Listen locally on port 5000 without enabling the interactive debugger.
