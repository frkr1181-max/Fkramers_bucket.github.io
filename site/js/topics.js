import { guideById } from './guides.js';
import { japanSubcards } from './japan-subcards.js';
import { countrySubcards } from './country-topics.js';

// The caller supplies only facts eligible for the current trip.
export function topicsForGuide(country,guideId,eligibleFacts,japanData){
  eligibleFacts=eligibleFacts.filter(f=>!f.destination_slug||f.destination_slug===country);
  const guide=guideById(guideId);
  if(!guide)return [];
  if(country==='japan')return japanSubcards(japanData,guideId,eligibleFacts);
  const connected=countrySubcards(japanData,country,guide,eligibleFacts);
  if(connected)return connected;
  return eligibleFacts.filter(fact=>guide.categories.includes(fact.category))
    .map(fact=>({id:fact.id,title:fact.title,facts:[fact],research:[]}));
}
