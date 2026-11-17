'use strict';
window.S42CatastropheView={
 create(root){
  return {update(game){
   const popup=game?.catastrophePopup;
   root.hidden=popup?.visible!==true;
   if(root.hidden)return;
   root.querySelector('[data-popup-title]').textContent=popup.title||game.catastrophe||'';
   root.querySelector('[data-popup-description]').textContent=popup.description||game.catastropheDescription||'';
   const image=root.querySelector('[data-popup-image]');
   let source=popup.image||'';
   if(!source&&popup.title==='Ядерная война')source='assets/catastrophe-popup.png';
   if(source&&!source.startsWith('assets/')){try{if(new URL(source).protocol!=='https:')source='';}catch{source='';}}
   image.hidden=!source;
   image.classList.toggle('figma-catastrophe-image',source==='assets/catastrophe-popup.png');
   if(source&&image.getAttribute('src')!==source)image.src=source;
   if(!source)image.removeAttribute('src');
   for(const key of ['duration','area','capacity','population'])root.querySelector(`[data-popup-${key}]`).textContent=popup[key]||game[key]||'—';
  }};
 }
};
