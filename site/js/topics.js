import { guideById } from './guides.js';
import { japanSubcards } from './japan-subcards.js';

// The caller supplies only facts eligible for the current trip.
export function topicsForGuide(country,guideId,eligibleFacts,japanData){
  const guide=guideById(guideId);
  if(!guide)return [];
  if(country==='japan')return japanSubcards(japanData,guideId,eligibleFacts);
  return eligibleFacts.filter(fact=>guide.categories.includes(fact.category))
    .map(fact=>({id:fact.id,title:fact.title,facts:[fact],research:[]}));
}
