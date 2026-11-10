"""Connect saved country facts to focused topic pages, preserving source wording.

Each sentence is assigned once per guide. Unclassified passages stay in an
explicit overview; unavailable details are never filled with another country.
"""
import json,re
from pathlib import Path
from build_snapshot import read_facts
ROOT=Path(__file__).resolve().parents[2]
TEMPLATES={
'entry':[('visas','Visa'),('passport','Passport'),('forms','Arrival forms'),('medicine','Medicine')],
'money':[('currency','Currency'),('cash','Cash & ATMs'),('cards','Cards & transit cards'),('tax-free','Tax-free shopping')],
'phones':[('esim','SIM, eSIM & roaming'),('pocket-wifi','Pocket Wi-Fi'),('wifi','Wi-Fi'),('electricity','Plugs & voltage')],
'health':[('insurance','Insurance'),('vaccines','Vaccines & health precautions'),('medicines','Medicine'),('care','Finding care')],
'there':[('airport-1','Airports & terminals'),('airport-2','Airport connections'),('arrival-steps','Arrival steps'),('city-transfer','City transfers')],
'around':[('subway','Metro & local transit'),('trains','Rail'),('buses','Buses'),('taxis','Taxis')],
'safety':[('advisories','Travel advisories'),('emergencies','Emergency help'),('hazards','Weather & natural hazards'),('solo','Personal safety')],
'culture':[('etiquette','Etiquette'),('tipping','Tipping'),('venue','Venue rules'),('laws','Local laws')],
}
GUIDE={'entry':'entry','money':'money','phones':'phones','electricity':'phones','health':'health','arrival':'there','getting-around':'around','safety':'safety','emergency':'safety','culture':'culture'}
RULES={
'entry':[('forms',r'arrival card|arrival form|declaration|disembark|e-arrival'),('medicine',r'medicin|prescription'),('visas',r'visa|visa-free|visa-exempt|90 days|90-day|Schengen|employment|work|study|permission|authori[sz]ation|ETA'),('passport',r'passport|blank page')],
'money':[('tax-free',r'tax.free|VAT|refund'),('currency',r'^(?:[A-Za-z ’.-]+ uses |[A-Za-z ’.-]+ currency|[A-Za-z ’.-]+\([A-Z]{3}\)\.)|exchange rate|USD/|reference rate'),('cash',r'cash|ATM|withdraw|exchange|payment instrument|declar|receipts'),('cards',r'card|contactless|transit|tap')],
'health':[('insurance',r'insurance|evacuation|coverage|cover care'),('medicines',r'medicine.import|prescription|packing medicine|pack.*medicin'),('care',r'hospital|clinic|medical care|treatment cost|pay.*care|healthcare'),('vaccines',r'vaccin|CDC|clinician|measles|malaria|hepatitis|polio|mosquito|insect|tick|health|disease|protection|itinerary')],
'culture':[('tipping',r'tip|service charge|service.*bill|bill|anything extra'),('laws',r'law|illegal|prohibit|passport|identity|arrest|criminal'),('venue',r'temple|venue|mosque|shoe|religious|photograph'),('etiquette',r'dress|cloth|shoulder|knees|greet|custom|cultur|respect')],
'safety':[('hazards',r'typhoon|flood|weather|earthquake|hurricane|storm|rain|heat|tsunami|cyclone|monsoon|volcan'),('advisories',r'advisory|Level [1-4]|recheck|warning|conflict|terror|regional restriction|border|demonstration|security alert|armed|kidnap'),('solo',r'theft|belonging|scam|night|drink|crime|pickpocket|personal safety')],
}
def sentences(text):
    # Keep abbreviations inside their sentence and preserve every original character.
    protected=text
    for word in ['U.S.','U.K.','e.g.','i.e.']:
        protected=protected.replace(word,word.replace('.', '\u2024'))
    return [s.replace('\u2024','.') for s in re.split(r'(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ0-9])',protected) if s]

def choose(fact,text,previous):
    cat=fact['category']
    if cat=='electricity':return 'electricity'
    if cat=='emergency':return 'emergencies'
    if cat=='phones':
        if re.search(r'pocket|portable.*wi.fi',text,re.I):return 'pocket-wifi'
        if re.search(r'wi.fi|hotspot',text,re.I) and not re.search(r'SIM|roaming|plan|data',text,re.I):return 'wifi'
        return 'esim'
    if cat=='arrival':
        if re.search(r'customs|declar|cash|quarantine|immigration|arrival card|baggage|goods|e-Arrival',text,re.I):return 'arrival-steps'
        if re.search(r'bus|train|metro|taxi|transfer|transport|ticket|route|connection|accessib',text,re.I):return 'city-transfer'
        if re.search(r'airport|terminal',text,re.I):return 'airport-1'
        return previous or 'overview'
    if cat=='getting-around':
        modes=[(key,bool(re.search(pattern,text,re.I))) for key,pattern in [('trains',r'rail|train|SNCF|SNTF|KORAIL'),('subway',r'metro|subway|tram'),('buses',r'bus'),('taxis',r'taxi|ride.hail')]]
        matches=[key for key,hit in modes if hit]
        return matches[0] if len(matches)==1 else ('overview' if len(matches)>1 else previous or 'overview')
    if cat=='entry' and re.search(r'passport.{0,35}(?:valid|months|blank)|blank page|passport.validity',text,re.I) and not re.search(r'visa.free|visa.exempt|citizens may visit',text,re.I):return 'passport'
    for key,pattern in RULES.get(cat,[]):
        if re.search(pattern,text,re.I):return key
    return previous or 'overview'

def main():
    explicit=json.loads((ROOT/'docs/research/publication-2026-11-10-missing-countries/topic-mapping.json').read_text())
    explicit.update(json.loads((ROOT/'docs/research/publication-2026-11-10-original-countries/topic-mapping.json').read_text()))
    facts=read_facts(); destinations=json.loads((ROOT/'site/data/guide-snapshot.json').read_text())['destinations'];countries=[]
    for country in destinations:
        if country['slug']=='japan':continue
        cards=[{'id':key,'subcards':[{'id':id,'title':title,'passages':[]} for id,title in subs]} for key,subs in TEMPLATES.items()]
        lookup={c['id']:c for c in cards}
        for fact in facts:
            if fact['destination_slug']!=country['slug']:continue
            hints=explicit.get(fact['id'])
            if hints:
                for hint in hints if isinstance(hints,list) else [hints]:
                    guide_id,topic_id=hint.split(':')
                    target=lookup[guide_id]
                    sub=next((s for s in target['subcards'] if s['id']==topic_id),None)
                    if sub is None:
                        sub={'id':topic_id,'title':'Planning overview','passages':[]};target['subcards'].append(sub)
                    sub['passages'].append({'fact_id':fact['id'],'original_summary':fact['plain_summary'],'text':fact['plain_summary'],'sentence_index':0})
                continue
            card=lookup[GUIDE[fact['category']]];previous=None
            for index,text in enumerate(sentences(fact['plain_summary'])):
                topic=choose(fact,text,previous);previous=topic
                sub=next((s for s in card['subcards'] if s['id']==topic),None)
                if sub is None:
                    sub={'id':'overview','title':'Planning overview','passages':[]};card['subcards'].append(sub)
                sub['passages'].append({'fact_id':fact['id'],'original_summary':fact['plain_summary'],'text':text,'sentence_index':index})
        # Keep only country topics backed by published passages. Preserve the
        # research separately; an empty design slot is not a traveler-facing card.
        for card in cards:
            card['subcards']=[sub for sub in card['subcards'] if sub['passages']]
        countries.append({'country':country['slug'],'cards':cards})
    payload={'organized_at':'2026-11-10','scope':'Exact passages from saved published facts; original source dates and trip conditions retained. No draft promotion.','countries':countries}
    (ROOT/'site/data/country-topics.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
    print(f'Connected focused topics for {len(countries)} destinations; Japan keeps its reviewed editorial mapping.')
if __name__=='__main__':main()
