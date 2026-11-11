let pending;
export async function loadCountryTopics(){
 if(!pending)pending=fetch('data/country-topics.json?v=20261110-original24').then(response=>{
  if(!response.ok)throw new Error('Country topics could not load. Please try again.');
  return response.json();
 }).catch(error=>{pending=null;throw error;});
 return pending;
}

// Excerpts must match the current eligible fact exactly. Changed/new live facts
// remain visible in the overview instead of using a stale or incorrect excerpt.
export function countrySubcards(data,country,guide,eligibleFacts){
 const card=data?.countries?.find(c=>c.country===country)?.cards.find(c=>c.id===guide.id);
 const allowed=eligibleFacts.filter(f=>!f.destination_slug||f.destination_slug===country);
 const guideFacts=allowed.filter(f=>guide.categories.includes(f.category));
 if(!card||!guideFacts.length)return null;
 const used=new Set();
 const subs=card.subcards.map(sub=>{
  const grouped=new Map();
  for(const passage of sub.passages){
   const fact=allowed.find(f=>f.id===passage.fact_id);
   if(!fact||fact.plain_summary!==passage.original_summary)continue;
   const key=fact.id+':'+passage.sentence_index;
   if(used.has(key))continue;used.add(key);
   if(!grouped.has(fact.id))grouped.set(fact.id,{fact,text:[]});
   grouped.get(fact.id).text.push(passage.text);
  }
  return {id:sub.id,title:sub.title,research:[],facts:[...grouped.values()].map(({fact,text})=>({...fact,plain_summary:text.join(' '),topic_title:sub.id==='overview'?fact.title:sub.title}))};
 });
 const mapped=new Set(subs.flatMap(s=>s.facts.map(f=>f.id)));
 const remaining=guideFacts.filter(f=>!mapped.has(f.id));
 if(remaining.length){
  let overview=subs.find(s=>s.id==='overview');
  if(!overview){overview={id:'overview',title:'Planning overview',facts:[],research:[]};subs.push(overview);}
  overview.facts.push(...remaining);
 }
 return subs.filter(sub=>sub.facts.length);
}
