'use strict';
// Read public rendered DOM only. Never inspect framework state or private cards.
window.S42GameDOM={
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
