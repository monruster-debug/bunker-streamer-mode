'use strict';
// Timelines are owned by their content; timer updates do not restart them.
window.S42Motion = {
 createCarousel(track, createSlide, cycleMs=60000){
  let signature='',cards=[],animation=null,frame=0;
  function measure(){
   const progress=animation?(Number(animation.currentTime)||0)%cycleMs:0;
   animation?.cancel();animation=null;
   if(!cards.length){track.replaceChildren();return;}
   const originals=cards.map((card,i)=>createSlide(card,i));
   track.replaceChildren(...originals);
   const width=track.firstElementChild?.offsetWidth||228;
   const gap=parseFloat(getComputedStyle(track).columnGap)||0;
   const distance=cards.length*(width+gap);
   const viewportWidth=track.clientWidth||track.parentElement?.clientWidth||width;
   const copies=Math.ceil(viewportWidth/distance)+1;
   for(let copy=0;copy<copies;copy++)cards.forEach((card,i)=>{
    const clone=createSlide(card,i);clone.setAttribute('aria-hidden','true');track.append(clone);
   });
   animation=track.animate([{transform:'translateX(0px)'},{transform:`translateX(-${distance}px)`}],{duration:cycleMs,iterations:Infinity,easing:'linear'});
   animation.currentTime=progress;
  }
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};
  const observer=new ResizeObserver(schedule);observer.observe(track);
  return {
   update(value){
    const next=JSON.stringify(value);if(next===signature)return;
    signature=next;cards=value;animation?.cancel();animation=null;schedule();
   },
   destroy(){observer.disconnect();animation?.cancel();cancelAnimationFrame(frame);}
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
