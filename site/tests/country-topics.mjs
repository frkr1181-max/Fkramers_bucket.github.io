import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {topicsForGuide} from '../js/topics.js';
import {GUIDES} from '../js/guides.js';
const read=async path=>JSON.parse(await readFile(new URL(path,import.meta.url)));
const data=await read('../data/country-topics.json');
const snapshot=await read('../data/guide-snapshot.json');
assert.equal(data.countries.length,35);
let connected=0;
for(const country of data.countries){
 assert.ok(country.cards.flatMap(c=>c.subcards).filter(s=>s.id==='pocket-wifi').every(s=>s.passages.length>0));
 const facts=snapshot.facts.filter(f=>f.destination_slug===country.country);
 if(facts.length)connected++;
 for(const guide of GUIDES){
  const topics=topicsForGuide(country.country,guide.id,facts,data);
  const ids=new Set(topics.map(t=>t.id));assert.equal(ids.size,topics.length);
  for(const fact of facts.filter(f=>guide.categories.includes(f.category))){
   const excerpts=topics.flatMap(t=>t.facts).filter(f=>f.id===fact.id);
   assert.ok(excerpts.length,`Unconnected fact ${country.country}/${fact.title}`);
   for(const excerpt of excerpts){
    assert.equal(excerpt.last_verified_at,fact.last_verified_at);
    assert.deepEqual(excerpt.sources,fact.sources);
    assert.equal(excerpt.applicability_status,fact.applicability_status);
   }
  }
  const card=country.cards.find(c=>c.id===guide.id);
  const passages=card.subcards.flatMap(s=>s.passages);
  assert.equal(new Set(passages.map(p=>p.fact_id+':'+p.sentence_index)).size,passages.length);
  for(const passage of passages)assert.ok(passage.original_summary.includes(passage.text));
  // Supplying only one eligible record cannot bring excluded trip rules back.
  if(facts.length){const only=facts.slice(0,1);assert.ok(topicsForGuide(country.country,guide.id,only,data).flatMap(t=>t.facts).every(f=>f.id===only[0].id));}
 }
}
assert.equal(connected,35);
const france=snapshot.facts.filter(f=>f.destination_slug==='france');
const entry=topicsForGuide('france','entry',france,data);
assert.ok(entry.find(t=>t.id==='passport').facts.some(f=>/three months beyond Schengen departure/.test(f.plain_summary)));
assert.ok(entry.find(t=>t.id==='passport').facts.every(f=>/passport|blank page/i.test(f.plain_summary)));
assert.ok(!entry.find(t=>t.id==='passport').facts.some(f=>/90 days in 180/.test(f.plain_summary)));
assert.ok(entry.find(t=>t.id==='visas').facts.some(f=>/90 days in 180/.test(f.plain_summary)));
const changed=france.map(f=>({...f,plain_summary:f.plain_summary+' Updated live guidance.'}));
assert.equal(topicsForGuide('france','entry',changed,data).find(t=>t.id==='overview').facts.length,2);
assert.ok(!topicsForGuide('france','entry',snapshot.facts.filter(f=>f.destination_slug==='qatar'),data).flatMap(t=>t.facts).length);
console.log('Country-topic checks passed: 35 non-Japan destinations, 35 catalog mappings, every saved fact connected, isolated passages, dates/sources/eligibility retained, changed live records preserved.');
