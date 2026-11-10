import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {topicsForGuide} from '../js/topics.js';
const data=JSON.parse(await readFile(new URL('../data/japan-subcards.json',import.meta.url)));
const snapshot=JSON.parse(await readFile(new URL('../data/guide-snapshot.json',import.meta.url)));
const japan=snapshot.facts.filter(f=>f.destination_slug==='japan');
let count=0;
for(const guide of data.cards){
 const topics=topicsForGuide('japan',guide.id,japan,data);
 assert.equal(topics.length,4);count+=topics.length;
 assert.ok(topics.every(t=>t.id&&t.title&&t.facts.length));
 for(const topic of topics)assert.equal(topics.find(t=>t.id===topic.id),topic);
}
assert.equal(count,32);
assert.equal(topicsForGuide('japan','missing',japan,data).length,0);
const eligible=[{id:'one',title:'French transport',category:'getting-around'},{id:'two',title:'French entry',category:'entry'}];
assert.deepEqual(topicsForGuide('france','around',eligible,null).map(t=>t.id),['one']);
assert.deepEqual(topicsForGuide('france','entry',eligible,null)[0].facts,[eligible[1]]);
assert.equal(topicsForGuide('france','entry',[],null).length,0);
const withoutTourism=japan.filter(f=>f.title!=='Short tourist stays');
assert.ok(!topicsForGuide('japan','entry',withoutTourism,data).flatMap(t=>t.facts).some(f=>f.title==='Short tourist stays'));
console.log('Topic-page checks passed: all 32 Japan topics, stable detail lookup, country/category isolation, missing topics and trip eligibility.');
