const {test}=require('node:test');const assert=require('node:assert/strict');const {runInNewContext}=require('node:vm');const fs=require('node:fs');
test('bunker carousel reads public images and never reads closed card contents',()=>{
 const scope={window:{}};runInNewContext(fs.readFileSync('game-dom.js','utf8'),scope);
 let closed=false;
 const card={classList:{contains:()=>closed},querySelector:s=>{
  if(closed){assert.equal(s,'h3');return {textContent:'После 2 круга'};}
  if(s==='.bunker-card__front__img')return {currentSrc:'https://shelter42.ru/card-water.webp',src:'https://shelter42.ru/fallback.webp'};
  return {textContent:s.includes('__back')?'Запас воды':'Вода'};
 }};
 const doc={querySelectorAll:()=>[card]},read=()=>JSON.parse(JSON.stringify(scope.window.S42GameDOM.readBunkerCards(doc)))[0];
 assert.equal(read().image,'https://shelter42.ru/card-water.webp');assert.equal(read().title,'Вода');
 closed=true;assert.deepEqual(read(),{closed:true,revealLabel:'После 2 круга',title:'',description:'',image:''});
});
test('bunker imagery accepts HTTPS sources and retains local fallback for missing or unsafe URLs',()=>{
 const scope={window:{},URL};runInNewContext(fs.readFileSync('bunker-view.js','utf8'),scope);
 const source=scope.window.S42BunkerView.imageSource;
 assert.equal(source('https://shelter42.ru/water.webp','fallback'),'https://shelter42.ru/water.webp');
 for(const value of ['',undefined,'javascript:alert(1)','http://example.com/card.png'])assert.equal(source(value,'fallback'),'fallback');
});
