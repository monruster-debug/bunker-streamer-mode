const {test}=require('node:test');const assert=require('node:assert/strict');const {runInNewContext}=require('node:vm');const fs=require('node:fs');
test('reads only a visible disaster modal and follows closing, reopening and hidden ancestors',()=>{
 const parent={hidden:false,parentElement:null,getAttribute:()=>null};
 const modal={parentElement:parent,hidden:false,getClientRects:()=>[{}],getAttribute:()=>null,querySelector:s=>s.endsWith('h4')?{textContent:'Ядерная война'}:s.includes('__html')?{textContent:'Публичное описание'}:s.includes('__image')?{src:'https://shelter42.ru/disaster.png'}:null,querySelectorAll:()=>[]};
 let present=true;const doc={querySelector:()=>present?modal:null},scope={window:{},getComputedStyle:()=>({display:'block',visibility:'visible'})};
 runInNewContext(fs.readFileSync('game-dom.js','utf8'),scope);const read=()=>scope.window.S42GameDOM.readCatastrophe(doc);
 assert.equal(read().visible,true);assert.equal(read().title,'Ядерная война');
 present=false;assert.equal(read().visible,false);present=true;assert.equal(read().visible,true);
 parent.hidden=true;assert.equal(read().visible,false);
});
test('viewer popup stays open through timer updates and closes only on source visibility',()=>{
 const fields=new Map();const root={hidden:true,querySelector:s=>{if(!fields.has(s))fields.set(s,{textContent:'',hidden:true,getAttribute(){return this.src},removeAttribute(){delete this.src}});return fields.get(s);}};
 const scope={window:{},URL};runInNewContext(fs.readFileSync('catastrophe-view.js','utf8'),scope);const view=scope.window.S42CatastropheView.create(root);
 const game={catastrophePopup:{visible:true,title:'Ядерная война',description:'<b>Текст</b>',image:'https://shelter42.ru/image.png'}};
 view.update(game);assert.equal(root.hidden,false);assert.equal(fields.get('[data-popup-description]').textContent,'<b>Текст</b>');
 view.update({...game,timer:'01:59'});assert.equal(root.hidden,false);
 view.update({catastrophePopup:{visible:false}});assert.equal(root.hidden,true);
 view.update({...game,catastrophePopup:{...game.catastrophePopup,image:'javascript:alert(1)'}});assert.equal(root.hidden,false);assert.equal(fields.get('[data-popup-image]').hidden,true);
 view.update({});assert.equal(root.hidden,true);
});
