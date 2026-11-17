const {test}=require('node:test');
const assert=require('node:assert/strict');
const {runInNewContext}=require('node:vm');
const fs=require('node:fs');

test('bunker reader follows the visible public modal through reveal, next card and creator closing',()=>{
 const scope={window:{},getComputedStyle:el=>el.style||{display:'block',visibility:'visible'}};
 runInNewContext(fs.readFileSync('game-dom.js','utf8'),scope);
 const parent={hidden:false,parentElement:null,getAttribute:()=>null};
 let title='Запасы воды',number='2';
 const modal={parentElement:parent,getClientRects:()=>[{}],getAttribute:()=>null,querySelector:s=>({
  '.bunker-card-modal__intro':{textContent:`Карта убежища №${number}`},
  '.bunker-card-modal__content h4':{textContent:title},
  '.bunker-card-modal__txt':{textContent:' Питьевой воды\nна два года '},
  '.bunker-card-modal__image':{currentSrc:'https://shelter42.ru/water.jpg'}
 })[s]};
 const hidden={...modal,style:{display:'none'}};
 let present=true;
 const doc={querySelectorAll:s=>{assert.equal(s,'.modal-overlay .bunker-card-modal');return present?[hidden,modal]:[];}};
 const read=()=>scope.window.S42GameDOM.readBunker(doc);
 assert.equal(read().visible,true);assert.equal(read().title,title);
 assert.equal(read().label,'Карта бункера №2');assert.equal(read().description,'Питьевой воды на два года');
 parent.hidden=true;assert.equal(read().visible,false);parent.hidden=false;
 title='Мастерская';number='3';assert.equal(read().title,title);assert.equal(read().number,'3');
 parent.style={visibility:'hidden'};assert.equal(read().visible,false);delete parent.style;
 present=false;assert.equal(read().visible,false);
 present=true;assert.equal(read().visible,true);
});

test('bunker viewer mirrors source visibility without resetting reading position on timer ticks',()=>{
 const fields=new Map();const root={hidden:true,querySelector:s=>{
  if(!fields.has(s))fields.set(s,{textContent:'',scrollTop:0});return fields.get(s);
 }};
 const scope={window:{},URL};runInNewContext(fs.readFileSync('bunker-view.js','utf8'),scope);
 const view=scope.window.S42BunkerView.create(root);
 const popup={visible:true,label:'Карта бункера №1',title:'<b>Мастерская</b>',description:'Инструменты',image:'https://shelter42.ru/tools.png'};
 view.update({bunkerPopup:popup});assert.equal(root.hidden,false);
 assert.equal(fields.get('[data-bunker-title]').textContent,popup.title);
 const copy=fields.get('.bunker-popup-copy');copy.scrollTop=48;
 view.update({bunkerPopup:{...popup},timer:'01:59'});assert.equal(copy.scrollTop,48);
 view.update({bunkerPopup:{visible:false}});assert.equal(root.hidden,true);
 view.update({bunkerPopup:{...popup,image:'javascript:alert(1)'}});
 assert.equal(root.hidden,false);assert.equal(copy.scrollTop,0);
 assert.equal(fields.get('[data-bunker-image]').src,'assets/bunker-popup.png');
 view.update({});assert.equal(root.hidden,true);
});
