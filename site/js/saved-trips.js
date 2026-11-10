import { accountRequest } from './auth.js';
import { purposeById } from './guides.js';
export function toPayload(trip,done) {
  return {destination_slug:trip.country,trip_name:trip.name?.trim()||null,
    trip_purpose:purposeById(trip.purpose)?.api || 'emergency',
    start_date:trip.from||null,end_date:trip.to||null,
    completed_checklist:Object.fromEntries([...done].map(i=>[`task-${i}`,true]))};
}
export function fromRow(row) {
  const purpose = row.trip_purpose==='tourism' ? 'leisure' : row.trip_purpose;
  return {id:row.id,country:row.destination_slug,from:row.start_date||'',to:row.end_date||'',name:row.trip_name||'',purpose};
}
export function savedChecks(row) {
  return Object.entries(row.completed_checklist||{}).filter(([key,value])=>/^task-[0-7]$/.test(key)&&value===true).map(([key])=>Number(key.slice(5)));
}
export const listTrips=()=>accountRequest('/trips');
export const loadTrip=id=>accountRequest(`/trips/${encodeURIComponent(id)}`);
export const saveTrip=(trip,done)=>accountRequest(trip.id?`/trips/${encodeURIComponent(trip.id)}`:'/trips',trip.id?'PUT':'POST',toPayload(trip,done));
export const deleteTrip=id=>accountRequest(`/trips/${encodeURIComponent(id)}`,'DELETE');
