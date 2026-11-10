"""Link original research sections to saved published facts, without publishing drafts.

This is topic-level provenance, not a claim that every historical sentence is
currently correct. Original prose and sources stay in documentation; the site
uses only the published facts and their original verification dates.
"""
import json
from pathlib import Path
from build_snapshot import read_facts

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/research/integration-2026-11-10/research-integration.json'
CATEGORIES = {
    'Entry and Documents': 'entry', 'Getting There': 'arrival',
    'Getting Around': 'getting-around', 'Money and Payments': 'money',
    'Safety': 'safety', 'Health': 'health', 'Phones and Internet': 'phones',
    'Electricity and Tech': 'electricity', 'Emergency Information': 'emergency',
    'Local Culture': 'culture',
}

def main():
    research = json.loads((ROOT / 'docs/research/frontend-subcards/content-map.json').read_text())
    facts = read_facts()
    countries = []
    for country in research['countries']:
        published = [f for f in facts if f['destination_slug'] == country['slug']]
        sections = []
        for original in country['source_leads']:
            category = CATEGORIES[original['title']]
            matches = [f for f in published if f['category'] == category]
            assert matches, f"No saved published support for {country['slug']}/{category}"
            sections.append({
                'section': original['title'], 'category': category,
                'original_research': original,
                'published_fact_ids': [f['id'] for f in matches],
                'published_fact_titles': [f['title'] for f in matches],
                'disposition': 'Use saved reviewed facts in the normal guide; retain original notes as provenance.',
                'scope': 'Topic-level integration. Original draft prose is not approved wholesale or newly verified.',
            })
        countries.append({'country': country['slug'], 'published_facts': len(published), 'sections': sections})
    result = {'integrated_at': '2026-11-10', 'original_source': 'docs/research/frontend-subcards/content-map.json',
              'research_destinations': len(countries), 'sections': sum(len(c['sections']) for c in countries),
              'published_facts': len(facts), 'countries': countries,
              'catalog_destinations_without_supplied_research': sorted({d['slug'] for d in json.loads((ROOT/'site/data/guide-snapshot.json').read_text())['destinations']} - {c['country'] for c in countries})}
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(f"Integrated provenance for {result['sections']} original sections across {len(countries)} destinations; {len(facts)} saved published facts.")

if __name__ == '__main__':
    main()
