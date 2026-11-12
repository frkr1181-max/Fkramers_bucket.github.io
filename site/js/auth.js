// Official, locally vendored Supabase Auth client. Only public configuration is loaded.
import { AuthClient } from './vendor/auth-js.mjs';
import { API_BASE } from './config.js?v=20261110-original24';  // same URL as api.js, so the module loads once
let pendingClient;
export function authClient() {
  if (!pendingClient) pendingClient = (async () => {
    const response = await fetch(`${API_BASE}/api/auth/config`, {cache:'no-store',signal:AbortSignal.timeout(8000)});
    if (!response.ok) throw new Error('Sign-in is unavailable. Please try again.');
    const config = await response.json();
    return new AuthClient({url:`${config.url}/auth/v1`, headers:{apikey:config.publishableKey},
      storageKey:'roamready-auth-v1', persistSession:true, autoRefreshToken:true, detectSessionInUrl:true});
  })().catch(error => {pendingClient=null; throw error;});
  return pendingClient;
}
export async function session() {
  const client = await authClient();
  const {data,error} = await client.getSession();
  if (error) throw error;
  return data.session;
}
export async function signIn(email,password) {
  const {data,error} = await (await authClient()).signInWithPassword({email,password});
  if (error) throw error;
  return data;
}
export async function signUp(email,password) {
  const {data,error} = await (await authClient()).signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});
  if (error) throw error;
  return data;
}
export async function signOut() {
  const {error} = await (await authClient()).signOut({scope:'local'});
  if (error) throw error;
}
export async function accountRequest(path,method='GET',payload) {
  const current = await session();
  if (!current) throw new Error('Log in to access your saved trips.');
  const controller = new AbortController(), timer=setTimeout(()=>controller.abort(),15000);
  try {
    const response = await fetch(`${API_BASE}/api${path}`, {method,signal:controller.signal,cache:'no-store',
      headers:{Authorization:`Bearer ${current.access_token}`,'Content-Type':'application/json'},
      ...(payload===undefined?{}:{body:JSON.stringify(payload)})});
    if (!response.ok) {
      if (response.status===401) throw new Error('Your session has expired. Please log in again.');
      if (response.status===404) throw new Error('That trip is unavailable or belongs to another account.');
      throw new Error('Your trips could not be loaded or saved. Please try again.');
    }
    return response.status===204?null:response.json();
  } finally {clearTimeout(timer);}
}
