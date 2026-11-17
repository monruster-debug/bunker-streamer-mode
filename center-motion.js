'use strict';
// Timelines are owned by their content; timer updates do not restart them.
window.S42Motion = {
 createCarousel(track, createSlide, intervalMs=30000){
  let signature='', timer=0, resetTimer=0, index=0, length=0;
  const reset=()=>{track.style.transition='none';track.style.transform='translateX(0px)';index=0;};
  const position=()=>`translateX(-${index*((track.firstElementChild?.getBoundingClientRect().width||212)+4)}px)`;
  const observer=new ResizeObserver(()=>{track.style.transition='none';track.style.transform=position();});
  observer.observe(track);
  const step=()=>{
   if(length<2)return;
   index++;
   track.style.transition='transform 650ms ease-in-out';
   track.style.transform=position();
   if(index===length)resetTimer=setTimeout(reset,700);
  };
  return {
   update(cards){
    const next=JSON.stringify(cards);
    if(next===signature)return;
    signature=next;clearInterval(timer);clearTimeout(resetTimer);length=cards.length;reset();
    const slides=cards.map(createSlide);
    if(length>1){const clone=createSlide(cards[0]);clone.setAttribute('aria-hidden','true');slides.push(clone);}
    track.replaceChildren(...slides);
    if(length>1)timer=setInterval(step,intervalMs);
   },
   destroy(){clearInterval(timer);clearTimeout(resetTimer);observer.disconnect();}
  };
 },
 createCredits(viewport,text){
  let signature=null,animation=null,frame=0;
  function measure(){
   animation?.cancel();animation=null;
   const distance=Math.max(0,text.scrollHeight-viewport.clientHeight);
   if(!distance)return;
   const travel=Math.max(4000,distance/12*1000),pause=120000,endPause=2000;
   const duration=pause+travel*2+endPause;

   animation=text.animate([
    {transform:'translateY(0px)',offset:0},
    {transform:'translateY(0px)',offset:pause/duration},
    {transform:`translateY(-${distance}px)`,offset:(pause+travel)/duration},
    {transform:`translateY(-${distance}px)`,offset:(pause+travel+endPause)/duration},
    {transform:'translateY(0px)',offset:1}
   ],{duration,iterations:Infinity,easing:'linear'});
  }
  const observer=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);});
  observer.observe(viewport);
  return {
   update(value){if(value===signature)return;signature=value;text.textContent=value;cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);},
   destroy(){observer.disconnect();animation?.cancel();cancelAnimationFrame(frame);}
  };
 }
};
