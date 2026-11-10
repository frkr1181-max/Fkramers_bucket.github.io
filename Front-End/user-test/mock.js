/* A browser-only user-test copy. The source Figma file is never changed. */
'use strict';
const countries=window.COUNTRIES;
const root=document.body.firstElementChild;
root.classList.add('mock-root');
const [header,main,footer]=root.children;
header.classList.add('mock-header');main.classList.add('mock-main');footer.classList.add('mock-footer');
let trip={country:'japan',purpose:'Tourism',start:'2027-03-15',end:'2027-03-28',length:'14'};
let done=new Set();
const country=()=>countries.find(c=>c.slug===trip.country);
const leaf=text=>[...root.querySelectorAll('div')].find(e=>!e.children.length&&e.textContent.trim()===text);
const heading=leaf('Your trip to Tokyo');
const timing=leaf('Mar 15 – 28, 2027 · 14 days');
const purpose=leaf('Vacation');
const traveler=leaf('First solo trip');traveler.textContent='Guest trip';
const meta=timing.parentElement.parentElement;meta.classList.add('meta-row');
leaf('Ordered by deadline.').textContent='General preparation checklist.';
const counter=leaf('0 of 8 done');
const countdown=leaf('147 days to go');
const tasks=[
 'Review passport and entry requirements',
 'Check medicine rules for your destination',
 'Review travel insurance options',
 'Review U.S. embassy and STEP information',
 'Compare phone and internet options',
 'Check payment and cash options',
 'Check device voltage and plug requirements',
 'Review emergency contacts and source links'
];
const panel=document.querySelector('#panel'),body=document.querySelector('#panel-body');
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function toast(message){const e=document.querySelector('#notice');e.textContent=message;e.style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.style.display='none',4000);}
function show(title){document.querySelector('#panel-title').textContent=title;body.replaceChildren();if(!panel.open)panel.showModal();panel.scrollTop=0;}
document.querySelector('#close-panel').onclick=()=>panel.close();
panel.addEventListener('click',e=>{if(e.target===panel){const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)panel.close();}});
function interactive(e,fn,label){e.setAttribute('role','button');e.tabIndex=0;if(label)e.setAttribute('aria-label',label);e.onclick=fn;e.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();fn();}};}
const note=el('p','User-testing mock · Supplied country research is unverified. Prepared November 1, 2026; this is not a verification date.','test-note');main.prepend(note);
footer.replaceChildren(el('div','RoamReady'),el('div','Research and preparation for U.S. passport holders · User-testing prototype'));
function renderTrip(){
 heading.textContent=trip.name ? `${trip.name} · ${country().name}` : `Your trip to ${country().name}`;
 purpose.textContent=trip.purpose;
 const fmt=s=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(s+'T00:00:00Z'));
 timing.textContent=trip.start&&trip.end?`${fmt(trip.start)} – ${fmt(trip.end)} · ${Math.round((Date.parse(trip.end)-Date.parse(trip.start))/86400000)+1} days`:`Estimated stay · ${trip.length} days`;
 countdown.textContent=trip.start?`${Math.max(0,Math.ceil((Date.parse(trip.start+'T00:00:00')-Date.now())/86400000))} days to go`:'Flexible travel dates';
 document.title=`RoamReady — ${country().name} user-test mock`;
}
function planDialog(){
 show('Plan a trip');
 body.append(el('p','Choose a country and tell us about your trip. Guest details and checklist progress last only for this browser session.','muted'));
 const form=el('form',undefined,'trip-form');
 function field(label,input){const wrap=el('label',label);wrap.append(input);form.append(wrap);return input;}
 const select=el('select');select.name='country';countries.forEach(c=>{const o=el('option',c.name);o.value=c.slug;select.append(o);});select.value=trip.country;field('Destination country',select);
 const purposes=el('select');purposes.name='purpose';['Tourism','Business','Study','Work','Visiting family or friends','Long-term stay or relocation','Transit'].forEach(p=>purposes.append(el('option',p)));purposes.value=trip.purpose;field('Trip purpose',purposes);
 const start=el('input');start.type='date';start.value=trip.start;field('Departure date (optional)',start);
 const end=el('input');end.type='date';end.value=trip.end;field('Return date (optional)',end);
 const length=el('input');length.type='number';length.min='1';length.max='3650';length.value=trip.length;field('Estimated stay in days (for flexible dates)',length);
 const err=el('p','','wide');err.setAttribute('role','alert');form.append(err);
 const submit=el('button','View my trip','primary wide');submit.type='submit';form.append(submit);
 form.onsubmit=e=>{e.preventDefault();if(Boolean(start.value)!==Boolean(end.value)){err.textContent='Enter both dates, or clear both to use an estimated stay.';return;}if(start.value&&end.value<start.value){err.textContent='Return date must be on or after departure.';return;}if(!start.value&&(!length.value||Number(length.value)<1)){err.textContent='Enter an estimated stay of at least one day.';return;}if(select.value!==trip.country)done=new Set();trip={country:select.value,purpose:purposes.value,start:start.value,end:end.value,length:length.value};renderTrip();refreshChecks();dashboard();};body.append(form);
}
const titleMap={
 'Entry & documents':['Entry and Documents'],'Money & payments':['Money and Payments'],
 'Phones & tech':['Phones and Internet','Electricity and Tech'],Health:['Health'],
 'Getting there':['Getting There'],'Getting around':['Getting Around'],Safety:['Safety','Emergency Information'],
 'Local culture':['Local Culture']
};
function normalize(s){return s.toLowerCase().replaceAll('&','and').replace(/[^a-z]/g,'');}
function sectionsFor(title){return country().topics.filter(s=>(titleMap[title]||[]).some(t=>normalize(t)===normalize(s.title)));}
function guide(title){
 show(`${country().name} · ${title}`);
 body.append(el('p','Research draft — supplied notes and sources, not verified travel advice. Prepared November 1, 2026. Open the linked sources to check current requirements and applicability.','draft'));
 const nav=el('div',undefined,'topic-nav');for(const t of Object.keys(titleMap)){const b=el('button',t);b.setAttribute('aria-pressed',String(t===title));b.onclick=()=>guide(t);nav.append(b);}body.append(nav);
 const sections=sectionsFor(title);
 if(!sections.length)body.append(el('p','No supplied research is available for this topic.'));
 for(const s of sections){const section=el('section',undefined,'guide-section');section.append(el('h2',s.title));if(s.draftParagraphs){section.append(el('p','Existing Japan guide draft · Research checked '+s.draftDate+' · Still awaiting review.','muted'));for(const paragraph of s.draftParagraphs)section.append(el('p',paragraph));}else if(s.note)section.append(el('p',s.note));section.append(el('h3','Sources supplied by the team'));
 const list=el('ul');for(const source of s.sources){const li=el('li');const a=el('a',source.title);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);list.append(li);}if(!s.sources.length)section.append(el('p','No source link was supplied.'));else section.append(list);body.append(section);}
}
for(const card of root.querySelectorAll('[data-status]')){card.classList.add('topic-card');card.parentElement.classList.add('card-row');const title=Object.keys(titleMap).find(t=>card.textContent.includes(t));if(title)interactive(card,()=>guide(title),`Open ${title}`);}
function refreshChecks(){counter.textContent=`${done.size} of ${tasks.length} done`;root.querySelectorAll('.task-checkbox').forEach(c=>c.checked=done.has(Number(c.dataset.index)));}
root.querySelectorAll('[data-state="To do"]').forEach((row,i)=>{const input=el('input',undefined,'task-checkbox');input.type='checkbox';input.dataset.index=i;input.setAttribute('aria-label',tasks[i]);input.onchange=()=>{input.checked?done.add(i):done.delete(i);refreshChecks();};row.firstElementChild.replaceWith(input);const text=row.lastElementChild.firstElementChild;text.textContent=tasks[i];row.lastElementChild.lastElementChild.textContent='Before departure';});
function checklist(){show('Before you leave');body.append(el('p',`${country().name} · General trip preparation checklist`,'muted'));tasks.forEach((t,i)=>{const label=el('label',undefined,'checklist-row');const input=el('input',undefined,'task-checkbox');input.type='checkbox';input.checked=done.has(i);input.onchange=()=>{input.checked?done.add(i):done.delete(i);refreshChecks();};label.append(input,el('span',t));body.append(label);});}
function bind(text,fn,parent=false){const e=leaf(text);if(e)interactive(parent?e.parentElement:e,fn);}
bind('Edit trip',plan,true);bind('Plan a trip',plan,true);bind('My trip',dashboard,true);
bind('See all 8 tasks',checklist,true);
bind('Home',home,true);
bind('Help',()=>{show('How to use RoamReady');body.append(el('p','Choose Plan a trip to select one of 24 countries. Open a topic card to read the team’s research notes and source links. Check off preparation tasks as you go. Guest trip details clear when this page reloads.','muted'));},true);
bind('About',()=>{show('About RoamReady');body.append(el('p','RoamReady is a country research and preparation prototype for travelers using a U.S. passport. It covers entry, transport, money, safety, health, culture, connectivity, electricity, and emergency information.','muted'));},true);
bind('Share plan',()=>{show('Copy trip summary');body.append(el('p','Copy this summary to share your test trip. Checklist progress and personal details are not included.','muted'));const area=el('textarea');area.value=`RoamReady — ${country().name}\n${timing.textContent}\n${trip.purpose}\nUser-testing mock. Country content is unverified research.`;area.rows=6;area.style.width='100%';area.readOnly=true;body.append(area);area.select();},true);
// Replace the export's illustrative emergency numbers with source-backed research links.
const essentials=leaf('Trip essentials').parentElement.parentElement;
essentials.replaceChildren(el('h2','Trip essentials'),el('p','Review emergency information for your destination and save the contacts you need.','muted'));
const emergency=el('button','Emergency information & sources');emergency.onclick=()=>{show(`${country().name} · Emergency information`);const s=country().topics.find(t=>normalize(t.title)==='emergencyinformation');body.append(el('p','Unverified research — confirm current contacts in the supplied sources.','draft'));if(s){body.append(el('p',s.note,'muted'));for(const source of s.sources){const p=el('p');const a=el('a',source.title);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';p.append(a);body.append(p);}}else body.append(el('p','No emergency source was supplied.'));};essentials.append(emergency);
const download=el('button','Download research & checklist');
// Downloads contain only the selected country, test trip, and checklist.
download.onclick=()=>{const blob=new Blob([JSON.stringify({trip,country:country(),status:'Unverified research draft',checklist:tasks.map((task,i)=>({task,done:done.has(i)}))},null,2)],{type:'application/json'});const a=el('a');a.href=URL.createObjectURL(blob);a.download=`roamready-${trip.country}-research.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Downloaded research and checklist.');};essentials.append(download);
essentials.parentElement.classList.add('lower-row');
const question=leaf('Have a question about your trip?');question.parentElement.parentElement.parentElement.parentElement.classList.add('question-panel');
leaf("Roam answers questions about your trip in plain language. It can't give legal or emergency advice.").textContent='Explore the source-linked country research. A live AI assistant is not connected in this mock.';
for(const [label,title] of [['Do I need a visa for Japan?','Entry & documents'],['How do I get from Narita to Shinjuku?','Getting there'],['Is Tokyo safe at night on my own?','Safety']]){const e=leaf(label);e.textContent={'Entry & documents':'What entry documents should I review?','Getting there':'How can I plan my arrival?',Safety:'Where can I find safety information?'}[title];interactive(e.parentElement,()=>guide(title));}
bind('Ask Roam',()=>guide('Entry & documents'),true);
renderTrip();refreshChecks();

root.querySelector('.question-panel')?.remove();
// Separate page views reproduce the main guest flow while reusing the exported dashboard.
const page=el('section',undefined,'page-view');header.after(page);
function activeNav(name){for(const e of header.querySelectorAll('[data-state]')){const active=e.textContent.trim()===name;e.dataset.state=active?'Active':'Default';e.firstElementChild.style.fontWeight=active?'600':'400';if(e.lastElementChild!==e.firstElementChild)e.lastElementChild.style.opacity=active?'1':'0';}}
function openPage(name,hash){main.style.setProperty('display','none','important');page.hidden=false;page.replaceChildren();page.append(el('p',note.textContent,'test-note'));activeNav(name);panel.close();history.replaceState(null,'',hash);window.scrollTo(0,0);}
function dashboard(){page.hidden=true;main.style.removeProperty('display');panel.close();activeNav('My trip');history.replaceState(null,'','#trip');window.scrollTo(0,0);}
function home(){
 openPage('Home','#home');
 const hero=el('div',undefined,'hero'),intro=el('div');intro.append(el('h1','Get ready for your first solo trip'),el('p',"Tell us where you’re going, when, and how. We’ll help you find what to review before you go — in language that’s easy to understand.",'muted'));
 const label=el('label','Where are you going?');label.htmlFor='home-country';intro.append(label);
 const row=el('div',undefined,'home-select'),select=el('select');select.id='home-country';for(const c of countries){const o=el('option',c.name);o.value=c.slug;select.append(o);}select.value=trip.country;
 const start=el('button','Start planning →','primary');start.onclick=()=>{if(trip.country!==select.value)done=new Set();trip.country=select.value;renderTrip();refreshChecks();plan();};row.append(select,start);intro.append(row,el('p','Country research for U.S. passport holders.','muted'));const image=el('div',undefined,'wireframe-image');image.setAttribute('aria-label','Image placeholder from the reference wireframe');hero.append(intro,image);page.append(hero);
 const how=el('section',undefined,'home-section');how.append(el('h2','How RoamReady works'),el('p','Three steps from browsing to boarding.','muted'));const steps=el('div',undefined,'step-grid');[['Tell us about your trip','Add where you’re going, your dates and what you want to prepare for.'],['Get your checklist and guide','See what to review before you leave and where to find country information.'],['Check the official source','Every topic links to the supplied sources so you can confirm the details yourself.']].forEach(([title,desc],i)=>{const card=el('article',undefined,'step-card');card.append(el('span',`Step ${i+1}`),el('h3',title),el('p',desc));steps.append(card);});how.append(steps);page.append(how);
 const trust=el('section',undefined,'home-section');trust.append(el('h2','Information you can trust'),el('p','Follow official source links and check the guidance that applies to your trip.','muted'));const layout=el('div',undefined,'trust-layout'),grid=el('div',undefined,'trust-grid');[['U.S. Department of State','Entry rules, travel advisories and embassy contacts.'],['Destination governments','Visa rules, customs and official requirements.'],['Airports and transit','Arrivals, transport and getting around.'],['Official tourism boards','Local culture and practical information.']].forEach(([title,desc])=>{const card=el('article',undefined,'step-card');card.append(el('h3',title),el('p',desc));grid.append(card);});const example=el('article',undefined,'step-card');example.append(el('h3',`Explore ${country().name} entry information`),el('p','Read the team’s existing research and open the source links. Draft content is awaiting verification.'));const b=el('button','Open entry research →');b.onclick=()=>guide('Entry & documents');example.append(b);layout.append(grid,example);trust.append(layout);page.append(trust);
}
function plan(){
 planDialog();
 const contents=[...body.childNodes];panel.close();openPage('Plan a trip','#plan');page.append(el('h1',"Let’s get prepared!"),el('p','Answer a few quick questions and we’ll build your preparation guide.','muted'));
 const layout=el('div',undefined,'planner-layout'),form=contents.find(e=>e.tagName==='FORM');
 const name=el('input');name.type='text';name.maxLength=100;name.value=trip.name||'';name.placeholder='For example: Spring break in Japan';const nameLabel=el('label','Give your trip a name (optional)');nameLabel.append(name);
 const description=el('textarea');description.maxLength=1000;description.value=trip.description||'';description.placeholder='For example: My first time abroad, mainly food, temples and a few day trips.';const descLabel=el('label','Trip description (optional)');descLabel.append(description);
 form.insertBefore(nameLabel,form.lastElementChild);form.insertBefore(descLabel,form.lastElementChild);form.lastElementChild.textContent='Create my plan →';const submit=form.onsubmit;form.onsubmit=e=>{submit(e);if(page.hidden){trip.name=name.value.trim();trip.description=description.value.trim();renderTrip();}};
 const aside=el('aside');aside.append(el('h3','Your plan will include'),el('p','A checklist of what to do before you leave, plus country guides for each part of your trip.','muted'));
 for(const [group,titles] of [['Prepare',['Entry & documents','Money & payments','Phones & tech','Health']],['Plan your arrival',['Getting there','Getting around']],['Know before you go',['Safety','Local culture']]]){aside.append(el('h4',group));const list=el('ul');titles.forEach(t=>list.append(el('li',t)));aside.append(list);}layout.append(form,aside);page.append(layout);
}
// Keep unsupported account features explicit in the user-testing flow.
const account=header.lastElementChild.lastElementChild;
interactive(account,()=>{show('Your profile');body.append(el('p','You’re using RoamReady as a guest. Account sign-in and saving trips to a profile are not connected in this HTML mock. Your test trip stays in memory until the page reloads.','muted'));const b=el('button','View my trip');b.onclick=dashboard;body.append(b);},'Your profile');
if(location.hash==='#trip')dashboard();else if(location.hash==='#plan')plan();else home();
