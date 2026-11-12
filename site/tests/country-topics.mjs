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
 assert.ok(country.cards.flatMap(c=>c.subcards).every(s=>s.passages.length>0),'Saved topics must omit every unsupported country-specific card');
 const facts=snapshot.facts.filter(f=>f.destination_slug===country.country);
 if(facts.length)connected++;
 for(const guide of GUIDES){
  const topics=topicsForGuide(country.country,guide.id,facts,data);
  assert.ok(topics.every(t=>t.facts.length),'Public topics must not be empty placeholders');
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
assert.equal(topicsForGuide('france','entry',changed,data).find(t=>t.id==='overview').facts.length,changed.filter(f=>f.category==='entry').length);
assert.ok(!topicsForGuide('france','entry',snapshot.facts.filter(f=>f.destination_slug==='qatar'),data).flatMap(t=>t.facts).length);
const japan=await read('../data/japan-subcards.json');
assert.deepEqual(topicsForGuide('japan','entry',[],japan),[],'Draft research alone must not create public cards');
// 'Passport and permission checks' left the Japan mapping when the dedicated passport facts were published
const passportFact=snapshot.facts.find(f=>f.destination_slug==='japan'&&f.title==='Passport validity and the six-month question');
const japanTopics=topicsForGuide('japan','entry',[passportFact],japan);
assert.ok(japanTopics.length>0,'A supported Japan topic must remain visible');
assert.ok(japanTopics.every(t=>t.facts.length&&t.facts.every(f=>f.id===passportFact.id)),'Trip filtering must hide unsupported Japan topics too');
console.log('Country-topic checks passed: 35 non-Japan destinations, 35 catalog mappings, every saved fact connected, isolated passages, dates/sources/eligibility retained, changed live records preserved.');
