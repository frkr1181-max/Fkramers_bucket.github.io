let pending;
export async function loadJapanResearch(){
 if(!pending)pending=fetch('data/japan-subcards.json').then(response=>{
  if(!response.ok)throw new Error('Japan topic research could not load. Please try again.');return response.json();
 }).catch(error=>{pending=null;throw error;});
 return pending;
}
// Match only facts already filtered by the live API (or its labeled snapshot).
// Static research mappings must never reintroduce ineligible facts.
export function japanSubcards(data,guideId,eligibleFacts){
 const card=data.cards.find(c=>c.id===guideId);
 return (card?.subcards||[]).map(sub=>{const facts=sub.fact_titles.flatMap(title=>eligibleFacts.filter(f=>f.title===title));return {...sub,facts,research:sub.research.filter(note=>!(note.published_as||[]).some(title=>facts.some(f=>f.title===title)))};});
}
const sections={entry:['Entry and Documents'],money:['Money and Payments'],phones:['Phones and Internet','Electricity and Tech'],health:['Health'],there:['Getting There'],around:['Getting Around'],safety:['Safety','Emergency Information'],culture:['Local Culture']};
const normalize=text=>text.toLowerCase().replace(/[^a-z]/g,'');
export function japanAdditionalResearch(data,id){
 return data.additional_research.filter(section=>(sections[id]||[]).some(title=>normalize(title)===normalize(section.title)));
}
