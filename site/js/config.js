// On Render the site and API share an origin. Set apiBase before publishing to GitHub Pages.
const LOCAL = ['localhost','127.0.0.1'].includes(location.hostname);
export const DEPLOYMENT = {apiBase: ''};
const defaultBase = DEPLOYMENT.apiBase || (LOCAL && location.port !== '8000' ? 'http://127.0.0.1:8000' : location.origin);
function chooseApi() {
  const asked = new URLSearchParams(location.search).get('api');
  if (!asked) return defaultBase;
  try {
    const url = new URL(asked);
    if ((LOCAL && ['localhost','127.0.0.1'].includes(url.hostname) && url.protocol==='http:') || url.origin===defaultBase) return url.origin;
  } catch {}
  return defaultBase;
}
export const API_BASE = chooseApi();
