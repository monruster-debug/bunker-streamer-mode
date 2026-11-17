'use strict';
// Read public rendered DOM only. Never inspect framework state or private cards.
window.S42GameDOM={
 readBunkerCards(doc=document){
  const clean=el=>el?.textContent?.replace(/\s+/g,' ').trim()||'';
  return [...doc.querySelectorAll('.bunker-card')].map(card=>{
   const closed=card.classList.contains('bunker-card__close');
   if(closed)return {closed:true,revealLabel:clean(card.querySelector('h3')),title:'',description:'',image:''};
   const image=card.querySelector('.bunker-card__front__img');
   return {closed:false,revealLabel:'',title:clean(card.querySelector('.bunker-card__front .bunker-card__title')),description:clean(card.querySelector('.bunker-card__back .bunker-card__title')),image:image?.currentSrc||image?.src||''};
  });
 },
 readVotes(players,doc=document){
  const clean=el=>el?.textContent?.replace(/\s+/g,' ').trim()||'';
  // Names are the only public identity in voting cards. Ambiguous names are skipped.
  const find=name=>{const matches=players.filter(p=>p.name===name);return matches.length===1?matches[0]:null;};
  const result=new Map(players.map(p=>[p, new Set()]));
  for(const card of doc.querySelectorAll('.players-info-desktop .players-info-card')){
   if(!card.getClientRects().length)continue;
   const target=find(clean(card.querySelector('.players-info-card__username')));
   if(!target)continue;
   for(const item of card.querySelectorAll('.votes-players li')){
    const voter=find(clean(item));
    if(voter)result.get(target).add(String(voter.number));
   }
  }
  return players.map(p=>[...result.get(p)].sort((a,b)=>Number(a)-Number(b)));
 },
 visibleModal(doc,selector){
  return [...doc.querySelectorAll(selector)].find(modal=>{
   if(!modal.getClientRects().length)return false;
   for(let el=modal;el;el=el.parentElement){
    const style=getComputedStyle(el);
    if(el.hidden||el.getAttribute('aria-hidden')==='true'||style.display==='none'||style.visibility==='hidden')return false;
   }
   return true;
  });
 },
 readBunker(doc=document){
  const modal=this.visibleModal(doc,'.modal-overlay .bunker-card-modal');
  if(!modal)return {visible:false};
  const clean=selector=>modal.querySelector(selector)?.textContent?.replace(/\s+/g,' ').trim()||'';
  const image=modal.querySelector('.bunker-card-modal__image');
  const intro=clean('.bunker-card-modal__intro');
  const number=intro.match(/№\s*(\d+)/)?.[1]||'';
  return {visible:true,number,label:number?`Карта бункера №${number}`:intro,title:clean('.bunker-card-modal__content h4'),description:clean('.bunker-card-modal__txt'),image:image?.currentSrc||image?.src||''};
 },
 readCatastrophe(doc=document){
  const modal=doc.querySelector('.modal-overlay .disaster-card-modal');
  if(!modal||!modal.getClientRects().length)return {visible:false};
  for(let el=modal;el;el=el.parentElement){
   const style=getComputedStyle(el);
   if(el.hidden||el.getAttribute('aria-hidden')==='true'||style.display==='none'||style.visibility==='hidden')return {visible:false};
  }
  const clean=el=>el?.textContent?.replace(/\s+/g,' ').trim()||'';
  const stats={};
  for(const row of modal.querySelectorAll('.disaster-card-modal__info > div')){
   const label=clean(row),value=clean(row.querySelector('div > span:last-child'));
   if(label.includes('Осталось людей'))stats.population=value;
   if(label.includes('Время пребывания'))stats.duration=value;
  }
  const image=modal.querySelector('.disaster-card-modal__image');
  return {visible:true,title:clean(modal.querySelector('.disaster-card-modal__content h4')),description:clean(modal.querySelector('.disaster-card-modal__html')),image:image?.currentSrc||image?.src||'',...stats};
 }
};
