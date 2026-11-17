'use strict';
window.S42BunkerView={
 imageSource(source,fallback){
  try{if(new URL(source).protocol==='https:')return source;}catch{}
  return fallback;
 },
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
   image.src=window.S42BunkerView.imageSource(popup.image,'assets/bunker-popup.png');
   root.querySelector('.bunker-popup-copy').scrollTop=0;
  }};
 }
};
