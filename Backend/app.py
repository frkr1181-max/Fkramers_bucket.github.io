import os
# Read connection settings from the environment and keep them out of source code.
import re
# Extract searchable terms from a travel question.
from dotenv import load_dotenv
# Load local development settings from the ignored Backend/.env file.
from flask import Flask, jsonify, request
# Provide the JSON API routes used by the RoamReady website.
from supabase import create_client
# Use Supabase's Python client to read the shared project database.

load_dotenv()
# Load local environment variables without replacing system-provided values.
app = Flask(__name__)
# Create the Flask application that handles backend requests.
SUPABASE_CLIENT = None
# Keep one reusable Supabase client for this API process.

def get_supabase_client():
# Create the client the first time it is needed and reuse it afterward.
    global SUPABASE_CLIENT
    # Allow the helper to update the shared module-level client.
    if SUPABASE_CLIENT is None:
    # Initialize the Supabase connection on the first database request.
        supabase_url = os.getenv("SUPABASE_URL")
        # Read the project URL from the environment.
        publishable_key = os.getenv("SUPABASE_PUBLISHABLE_KEY")
        # Read the publishable key that is limited by database RLS policies.
        if not supabase_url or not publishable_key:
        # Stop clearly when the local Supabase settings have not been configured.
            raise RuntimeError("Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY before starting the API.")
            # Name the missing settings without printing any configured values.
        SUPABASE_CLIENT = create_client(supabase_url, publishable_key)
        # Connect to the Supabase Data API with the public project key.
    return SUPABASE_CLIENT
    # Give the calling route the shared Supabase client.

def api_error(message, status_code):
# Build the same JSON error shape for every API route.
    return jsonify({"error": {"code": "request_failed", "message": message}}), status_code
    # Return the readable error and the corresponding HTTP status.

@app.after_request
# Allow the front end to read this public, read-only API during development.
def add_browser_headers(response):
# Add browser headers for cross-origin requests from the website.
    response.headers["Access-Control-Allow-Origin"] = os.getenv("ROAMREADY_ALLOWED_ORIGIN", "*")
    # Use the configured front-end origin or allow local prototype pages by default.
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    # Permit the JSON content header used by the question route.
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    # Advertise the request methods supported by this API.
    return response
    # Return the response after attaching browser access headers.

@app.get("/api/health")
# Check whether this API can reach its Supabase project.
def health():
# Run one small read-only query to verify the database connection.
    try:
    # Catch connection and permission failures with a safe response.
        get_supabase_client().table("destinations").select("slug").limit(1).execute()
        # Query one destination identifier without retrieving travel details.
    except Exception:
    # Keep connection details and keys out of the health response.
        app.logger.exception("Supabase health check failed.")
        # Write technical diagnostics to the backend log for the team.
        return api_error("The backend could not reach its travel database.", 503)
        # Tell the website that the database is temporarily unavailable.
    return jsonify({"status": "ok", "service": "RoamReady API", "version": "0.2.0"})
    # Confirm that the backend and its database are responding.

@app.get("/api/destinations")
# Return active destinations from the shared Supabase project.
def list_destinations():
# Send the destination records in alphabetical order.
    try:
    # Convert database failures into a safe JSON response.
        response = get_supabase_client().table("destinations").select("slug,name,iso_alpha2,region,research_owner").eq("active", True).order("name").execute()
        # Read only public fields for destinations marked active.
    except Exception:
    # Keep technical query errors out of the website response.
        app.logger.exception("Could not load destinations from Supabase.")
        # Record the technical failure in the backend log.
        return api_error("Destinations are temporarily unavailable.", 503)
        # Let the website display a retryable error.
    return jsonify({"destinations": response.data})
    # Return the destination list as structured JSON.

@app.get("/api/destinations/<string:destination_slug>/facts")
# Return published, source-backed travel facts for an active destination.
def destination_facts(destination_slug):
# Keep draft and review-only records out of traveler-facing results.
    try:
    # Catch database failures while loading the guide and its facts.
        client = get_supabase_client()
        # Reuse the shared client for both read-only lookups.
        destination_response = client.table("destinations").select("slug,name,iso_alpha2,region").eq("slug", destination_slug).eq("active", True).limit(1).execute()
        # Confirm that the requested destination is active.
        if not destination_response.data:
        # Return not found for an unknown or inactive destination.
            return api_error("That destination is not available.", 404)
            # Use HTTP 404 because an active destination guide does not exist.
        fact_response = client.table("travel_facts").select("id,country_code,destination_slug,category,title,plain_summary,official_text_excerpt,last_verified_at,sources").eq("destination_slug", destination_slug).eq("published", True).order("category").order("title").execute()
        # Select published claims and their citations from Supabase.
    except Exception:
    # Do not expose database error details to website visitors.
        app.logger.exception("Could not load published travel facts from Supabase.")
        # Save diagnostic details in the backend log for maintainers.
        return api_error("Travel information is temporarily unavailable.", 503)
        # Tell the website it can retry the request later.
    return jsonify({"destination": destination_response.data[0], "facts": fact_response.data, "notice": "Travel information can change; confirm details with the linked official sources."})
    # Return the destination, published facts, and a freshness reminder.

@app.post("/api/assistant/ask")
# Search published facts and return citations rather than inventing guidance.
def ask_assistant():
# Keep answers grounded in records already approved for publication.
    payload = request.get_json(silent=True)
    # Read JSON input and treat malformed JSON as missing.
    if not isinstance(payload, dict):
    # Require an object containing a question and destination slug.
        return api_error("Send a JSON object with destination_slug and question.", 400)
        # Tell the caller which request fields are required.
    question = payload.get("question")
    # Read the travel question supplied by the traveler.
    destination_slug = payload.get("destination_slug")
    # Read the selected destination's stable slug.
    if not isinstance(question, str) or not question.strip() or len(question) > 1000:
    # Reject empty questions and limit question length to 1,000 characters.
        return api_error("Question must contain 1 to 1,000 characters.", 400)
        # Explain the accepted question size.
    if not isinstance(destination_slug, str) or not destination_slug.strip():
    # Require a destination identifier before searching.
        return api_error("destination_slug must be a non-empty string.", 400)
        # Tell the caller which field needs correction.
    try:
    # Catch database failures while checking the destination and loading facts.
        client = get_supabase_client()
        # Reuse the shared Supabase client for the search.
        destination_response = client.table("destinations").select("slug").eq("slug", destination_slug).eq("active", True).limit(1).execute()
        # Confirm the selected destination is active.
        if not destination_response.data:
        # Reject unknown destinations rather than reporting a false no-answer.
            return api_error("That destination is not available.", 404)
            # Use HTTP 404 for a destination outside the active roster.
        fact_response = client.table("travel_facts").select("id,category,title,plain_summary,last_verified_at,sources").eq("destination_slug", destination_slug).eq("published", True).execute()
        # Retrieve published facts for the selected destination only.
    except Exception:
    # Keep raw database errors and connection details out of the public response.
        app.logger.exception("Could not search published facts in Supabase.")
        # Save technical diagnostics in the backend log for the project team.
        return api_error("Verified travel information is temporarily unavailable.", 503)
        # Tell the website that it can retry this request later.
    question_words = {word.lower() for word in re.findall(r"[A-Za-z0-9]+", question) if len(word) > 2}
    # Keep meaningful question words while skipping short common terms.
    matching_facts = []
    # Prepare a list for published facts that match the question.
    for fact in fact_response.data:
    # Compare the question with each published title, category, and summary.
        searchable_text = " ".join([fact["category"], fact["title"], fact["plain_summary"]]).lower()
        # Combine the public fact text into one searchable string.
        fact_words = set(re.findall(r"[A-Za-z0-9]+", searchable_text))
        # Make a set of fact terms for keyword comparison.
        if question_words.intersection(fact_words) and fact["sources"]:
        # Include a fact only when it matches and has source citations.
            matching_facts.append(fact)
            # Add the verified fact to the answer set.
    if not matching_facts:
    # Abstain when the database has no matching published source-backed fact.
        return jsonify({"answer": "RoamReady does not have a verified answer for that question yet. Check the linked official sources or ask the team to review this topic.", "citations": [], "limitation": "No matching published fact with a source was found."})
        # Explain the lack of evidence instead of guessing about travel rules.
    answer = " ".join(fact["plain_summary"] for fact in matching_facts)
    # Compose the response only from published summaries stored in Supabase.
    citations = [{"fact_id": fact["id"], "title": fact["title"], "last_verified_at": fact["last_verified_at"], "sources": fact["sources"]} for fact in matching_facts]
    # Include the fact IDs, verification dates, and source links for every claim.
    return jsonify({"answer": answer, "citations": citations, "limitation": "This response uses published records only; confirm current rules with the linked official source."})
    # Return the evidence-backed answer and its limitation.

@app.errorhandler(404)
# Return missing routes in the same JSON format as other API failures.
def not_found(error):
# Convert Flask's default missing-route page into a readable response.
    return api_error("The requested API route was not found.", 404)
    # Keep route errors understandable for the front-end team.

if __name__ == "__main__":
# Start the local development server when this file is run directly.
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=False)
    # Listen locally without enabling Flask's interactive debugger.

