const {test}=require('node:test');const assert=require('node:assert/strict');const {runInNewContext}=require('node:vm');const fs=require('node:fs');
function setup(){
 const scope={window:{}};runInNewContext(fs.readFileSync('game-dom.js','utf8'),scope);
 let cards=[];const doc={querySelectorAll:s=>{assert.equal(s,'.players-info-desktop .players-info-card');return cards;}};
 const card=(name,voters,visible=true)=>({getClientRects:()=>visible?[{}]:[],querySelector:()=>({textContent:name}),querySelectorAll:s=>{assert.equal(s,'.votes-players li');return voters.map(textContent=>({textContent}));}});
 return {read:players=>JSON.parse(JSON.stringify(scope.window.S42GameDOM.readVotes(players,doc))),set:value=>cards=value,card};
}
test('public voters map to stable table numbers and clear on changed vote or next round',()=>{
 const s=setup(),players=[{name:'Аня',number:'1'},{name:'Борис',number:'6'},{name:'Вера',number:'12'}];
 s.set([s.card('Аня',['Вера','Борис','Борис'])]);assert.deepEqual(s.read(players),[['6','12'],[],[]]);
 s.set([s.card('Аня',['Вера']),s.card('Вера',['Борис'])]);assert.deepEqual(s.read(players),[['12'],[],['6']]);
 s.set([]);assert.deepEqual(s.read(players),[[],[],[]]);
});
test('hidden, unknown and ambiguous player names never produce guessed votes',()=>{
 const s=setup(),players=[{name:'Аня',number:'1'},{name:'Дубль',number:'2'},{name:'Дубль',number:'3'}];
 s.set([s.card('Аня',['Дубль','Неизвестен']),s.card('Дубль',['Аня']),s.card('Аня',['Аня'],false)]);
 assert.deepEqual(s.read(players),[[],[],[]]);
});
