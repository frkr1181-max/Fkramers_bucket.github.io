/* Public guide requests go through FastAPI; no database credentials in the browser. */
'use strict';
window.RoamGuide = (() => {
  const configured = new URLSearchParams(location.search).get('api');
  const localPreview = ['localhost', '127.0.0.1'].includes(location.hostname) && location.port !== '8000';
  const base = configured || (localPreview ? 'http://127.0.0.1:8000' : location.origin);
  const purposes = {Tourism:'tourism', Business:'business', Study:'study', Work:'work',
    'Visiting family or friends':'family', 'Long-term stay or relocation':'long-term', Transit:'transit'};
  function stayDays(trip) {
    const days = trip.start && trip.end
      ? Math.round((Date.parse(trip.end + 'T00:00:00Z') - Date.parse(trip.start + 'T00:00:00Z')) / 86400000) + 1
      : Number(trip.length);
    if (!Number.isInteger(days) || days < 1 || days > 36500) throw new Error('Invalid trip duration');
    return days;
  }
  function sourceUrl(value) {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid source URL');
    return url.href;
  }
  async function loadFacts(trip) {
    if (trip.country !== 'japan' || !purposes[trip.purpose]) throw new Error('Unsupported trip');
    const days = stayDays(trip);
    const url = new URL('/api/destinations/japan/facts', base);
    url.search = new URLSearchParams({purpose:purposes[trip.purpose], stay_days_min:String(days), stay_days_max:String(days)});
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, {signal:controller.signal, headers:{Accept:'application/json'}, cache:'no-store'});
      if (!response.ok) throw new Error(`Guide request failed (${response.status})`);
      const facts = await response.json();
      if (!Array.isArray(facts)) throw new Error('Invalid guide response');
      for (const fact of facts) {
        if (fact.destination_slug !== 'japan' || !['general','conditional'].includes(fact.applicability_status)
          || !['category','title','plain_summary','last_verified_at'].every(key => typeof fact[key] === 'string')
          || !Array.isArray(fact.sources)) throw new Error('Invalid fact');
        for (const source of fact.sources) sourceUrl(source.url);
      }
      return facts;
    } finally { clearTimeout(timeout); }
  }
  return {loadFacts, stayDays, sourceUrl};
})();
