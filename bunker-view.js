'use strict';
window.S42BunkerView={
 create(root){
  let previous='';
  return {update(game){
   const popup=game?.bunkerPopup;
   root.hidden=popup?.visible!==true;
   if(root.hidden){previous='';return;}
   const signature=JSON.stringify(popup);
   if(signature===previous)return;
   previous=signature;
   root.querySelector('[data-bunker-label]').textContent=popup.label||'Карта бункера';
   root.querySelector('[data-bunker-title]').textContent=popup.title||'';
   root.querySelector('[data-bunker-description]').textContent=popup.description||'';
   const image=root.querySelector('[data-bunker-image]');
   let source=popup.image||'';
   try{if(new URL(source).protocol!=='https:')source='';}catch{source='';}
   image.src=source||'assets/bunker-popup.png';
   root.querySelector('.bunker-popup-copy').scrollTop=0;
  }};
 }
};
