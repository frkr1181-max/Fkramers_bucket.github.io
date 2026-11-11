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
 return (card?.subcards||[]).map(sub=>{
  const facts=sub.fact_titles.flatMap(title=>eligibleFacts.filter(f=>f.title===title).map(f=>{
   const excerpt=sub.excerpts?.[title];
   // Use a narrower passage only while it still matches the reviewed source fact.
   const focused=excerpt && f.plain_summary?.startsWith(excerpt) ? {...f,plain_summary:excerpt} : {...f};
   if(sub.display_titles?.[title])focused.topic_title=sub.display_titles[title];
   return focused;
  }));
  const research=sub.research.filter(note=>!(note.published_as||[]).some(title=>eligibleFacts.some(f=>f.title===title)));
  return {...sub,facts,research};
 });
}
