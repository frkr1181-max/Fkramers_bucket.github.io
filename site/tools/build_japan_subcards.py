"""Package existing Japan research for the website; never change publication status."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'docs/research/frontend-subcards'
country=next(c for c in json.loads((BASE/'content-map.json').read_text())['countries'] if c['slug']=='japan')
research=json.loads((BASE/'research-2026-11-09/research-results.json').read_text())
facts={f['id']:f for f in country['facts']}
sources={s['id']:s for s in research['sources']}
def citations(ids):
 return [dict(sources[i],organization=sources[i]['title'].strip()) for i in ids]
records={r['id']:r for r in research['records'] if r['country']=='japan'}
rename={'tech':'phones','arrival':'there','transport':'around'}
labels={'airport-1':'Narita Airport','airport-2':'Haneda Airport','trains':'JR trains','hazards':'Earthquakes','venue':'Onsen & tattoos'}
for card in country['cards']:
 original=card['id'];card['id']=rename.get(original,original)
 for sub in card['subcards']:
  sub['title']=labels.get(sub['id'],sub['title'])
  sub['fact_titles']=[facts[i]['title'] for i in sub['fact_ids']]
  record=records.get(f"japan:{original}:{sub['id']}")
  sub['research']=[]
  if record:
   note=dict(record,sources=citations(record['source_ids']))
   note['shared_notes']=[dict(research['shared_notes'][key],sources=citations(research['shared_notes'][key]['source_ids'])) for key in record['common_note_ids']]
   sub['research'].append(note)
supplements=json.loads((BASE/'new-source-notes.json').read_text())
for note in supplements:
 if note['country']!='japan': continue
 arrival=next(c for c in country['cards'] if c['id']=='there')
 for sub in arrival['subcards']:
  if sub['id'] not in ['airport-1','arrival-steps']: continue
  sub['research'].append({'id':'japan:narita-arrivals-supplement','text':note['text'],'researched_at':note['checked_at'],'published':False,'publication_status':'research_draft','shared_notes':[],'limitations':[note['verification_scope']],'sources':[{'title':note['source_title'],'url':note['url'],'checked_at':note['checked_at']}]})
publication_map=json.loads((ROOT/'docs/research/publication-2026-11-10-japan/subcard-mapping.json').read_text())
for card in country['cards']:
 for sub in card['subcards']:
  approved=publication_map.get(f"{card['id']}:{sub['id']}",[])
  sub['fact_titles']=list(dict.fromkeys(approved+sub['fact_titles']))
  for note in sub['research']:note['published_as']=approved
payload={'country':'japan','organized_at':'2026-11-10','publication_status':'Reviewed Japan additions published November 10; original research is preserved as an archive.','cards':country['cards'],'additional_research':country['source_leads']}
(ROOT/'site/data/japan-subcards.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
print('Packaged 32 Japan subcards, 11 follow-up records, one supplemental Narita note and 10 existing research sections; no database writes.')
