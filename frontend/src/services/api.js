const apiBaseUrl = new URLSearchParams(window.location.search).get("api") || "http://127.0.0.1:8000";

export async function getJson(path, accessToken) {
  const response = await fetch(new URL(path, apiBaseUrl), {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed (${response.status})`);
  }

  return response.json();
}
