import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
const testDirectory=await mkdtemp(tmpdir()+'/roamready-static-check-');
const source=await readFile(new URL('../js/api.js',import.meta.url),'utf8');
const snapshot=JSON.parse(await readFile(new URL('../data/guide-snapshot.json',import.meta.url)));
const originalFetch=globalThis.fetch;
try {
 const calls=[];
 globalThis.fetch=async path=>{calls.push(String(path));assert.equal(path,'data/guide-snapshot.json');return {ok:true,json:async()=>snapshot};};
 const staticCode=source.replace('import { API_BASE, SAVED_GUIDES_ONLY } from "./config.js?v=20261110-pages";',"const API_BASE='https://example.github.io';const SAVED_GUIDES_ONLY=true;");
 await writeFile(testDirectory+'/static.mjs',staticCode);
 const api=await import(pathToFileURL(testDirectory+'/static.mjs').href);
 assert.equal((await api.getDestinations()).length,36);
 const brazil=await api.getFacts('brazil',{stayMin:5,stayMax:5,purpose:'tourism'});
 assert.equal(brazil.length,21);
 assert.ok(brazil.every(f=>f.destination_slug==='brazil'));
 assert.equal(api.sourceInfo().mode,'snapshot');
 assert.deepEqual(calls,['data/guide-snapshot.json']);
 api.retryLive();await api.getDestinations();assert.equal(calls.length,1);
 // An actual API refusal remains an error; static-host support must not hide it.
 globalThis.fetch=async()=>({ok:false,status:404,json:async()=>({detail:'Not found'})});
 const liveCode=source.replace('import { API_BASE, SAVED_GUIDES_ONLY } from "./config.js?v=20261110-pages";',"const API_BASE='https://api.example.com';const SAVED_GUIDES_ONLY=false;");
 await writeFile(testDirectory+'/live.mjs',liveCode);
 const live=await import(pathToFileURL(testDirectory+'/live.mjs').href);
 await assert.rejects(live.getDestinations(),/Not found/);
 console.log('Static-host checks passed: all destinations, Brazil facts, labeled saved data, no unavailable API calls, genuine API refusals preserved.');
} finally {globalThis.fetch=originalFetch;}
