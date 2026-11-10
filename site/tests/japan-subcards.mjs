import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {japanSubcards,japanAdditionalResearch} from '../js/japan-subcards.js';
const data=JSON.parse(await readFile(new URL('../data/japan-subcards.json',import.meta.url)));
assert.equal(data.cards.length,8);
assert.equal(data.cards.flatMap(c=>c.subcards).length,32);
const seen=new Set();let draftCount=0;
for(const card of data.cards){
 assert.equal(card.subcards.length,4);
 for(const sub of card.subcards){
  assert.ok(!seen.has(card.id+':'+sub.id));seen.add(card.id+':'+sub.id);
  for(const draft of sub.research){assert.equal(draft.published,false);assert.ok(draft.sources.length);draftCount++;}
 }
}
assert.equal(draftCount,13);
assert.equal(new Set(data.cards.flatMap(c=>c.subcards.flatMap(s=>s.research.map(r=>r.id)))).size,12);
const eligible=[{title:'Passport and permission checks',id:'passport'},{title:'Short tourist stays',id:'tourism'},{title:'Check each medicine before packing',id:'medicine'},{title:'Customs and arrival preparation',id:'arrival'}];
const entry=japanSubcards(data,'entry',eligible);
assert.deepEqual(entry.map(s=>s.title),['Visa','Passport','Arrival forms','Medicine']);
assert.deepEqual(entry[0].facts.map(f=>f.id),['passport','tourism']);
assert.ok(entry[3].facts.some(f=>f.id==='medicine'));
assert.ok(!entry.flatMap(s=>s.facts).some(f=>f.title==='Paid work needs the correct status'));
assert.ok(japanSubcards(data,'money',[]).find(s=>s.id==='tax-free').research.length);
assert.equal(data.cards.reduce((n,c)=>n+japanAdditionalResearch(data,c.id).length,0),10);
// All mapped published Japan titles have a topic; unrelated live facts never leak in.
const titles=[...new Set(data.cards.flatMap(c=>c.subcards.flatMap(s=>s.fact_titles)))];
assert.equal(titles.length,44);
const mapped=data.cards.flatMap(c=>japanSubcards(data,c.id,titles.map(title=>({title}))).flatMap(s=>s.facts));
for(const title of titles)assert.ok(mapped.some(f=>f.title===title));
assert.equal(japanSubcards(data,'entry',[{title:'Unrelated fact'}]).flatMap(s=>s.facts).length,0);
const snapshot=JSON.parse(await readFile(new URL('../data/guide-snapshot.json',import.meta.url)));
const japan=snapshot.facts.filter(f=>f.destination_slug==='japan');
assert.equal(japan.length,44);
for(const card of data.cards){const subs=japanSubcards(data,card.id,japan);assert.ok(subs.every(s=>s.facts.length>0));assert.ok(subs.every(s=>s.research.length===0));}

console.log('Japan checks passed: 32 topics, 11 follow-up records plus one supplemental Narita note, 10 longer research sections, cross-category medicine mapping, eligible-only facts and full mapping coverage.');
