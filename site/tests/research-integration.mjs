import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {topicsForGuide} from '../js/topics.js';
const read=async path=>JSON.parse(await readFile(new URL(path,import.meta.url)));
const report=await read('../../docs/research/integration-2026-11-10/research-integration.json');
const original=await read('../../docs/research/frontend-subcards/content-map.json');
const snapshot=await read('../data/guide-snapshot.json');
const japan=await read('../data/japan-subcards.json');
assert.equal(report.research_destinations,24);
assert.equal(report.sections,240);
assert.equal(snapshot.facts.length,575);
const guideFor={entry:'entry',arrival:'there','getting-around':'around',money:'money',safety:'safety',health:'health',phones:'phones',electricity:'phones',emergency:'safety',culture:'culture'};
for(const country of report.countries){
 const source=original.countries.find(c=>c.slug===country.country);
 assert.deepEqual(country.sections.map(s=>s.original_research),source.source_leads);
 const facts=snapshot.facts.filter(f=>f.destination_slug===country.country);
 for(const section of country.sections){
  assert.ok(section.published_fact_ids.length);
  for(const id of section.published_fact_ids)assert.ok(facts.some(f=>f.id===id&&f.category===section.category));
  assert.ok(topicsForGuide(country.country,guideFor[section.category],facts,japan).some(t=>t.facts.length));
 }
}
assert.ok(!('additional_research' in japan));
const main=await readFile(new URL('../js/main.js',import.meta.url),'utf8');
assert.ok(!main.includes('Original Japan research archive'));
assert.ok(!main.includes('renderAdditionalJapan'));
console.log('Research integration checks passed: 240 preserved sections, 24 country guides, 575 saved facts, no public archive panel.');
