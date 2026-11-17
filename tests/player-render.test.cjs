const {test}=require('node:test');const assert=require('node:assert/strict');const {runInNewContext}=require('node:vm');const fs=require('node:fs');
test('timer updates keep camera selectors mounted while turn, settings and assignment changes still render',()=>{
 const source=fs.readFileSync('overlay.js','utf8');let created=0;
 const people={querySelectorAll:()=>[],append(){}},app={append(){}},center={parentElement:people};
 const scope={game:{current:'А',timer:'02:00'},options:{grid:'3x2',map:{}},stream:null,settingsOpen:true,wideLayout:{matches:false},$:id=>({'people':people,'app':app,'game-center':center}[id]),createPlayer:()=>{created++;return {style:{}}},createEmptySlot:()=>({style:{}})};
 runInNewContext(source.slice(source.indexOf("let previousPlayersRender="),source.indexOf("wideLayout.addEventListener('change'")),scope);
 const players=[{name:'А',number:'1',cards:{}}];scope.renderPlayers(players);assert.equal(created,1);
 scope.game.timer='01:59';scope.renderPlayers(players);assert.equal(created,1);
 scope.game.current='Б';scope.renderPlayers(players);assert.equal(created,2);
 scope.options.map['1:А']=3;scope.renderPlayers(players);assert.equal(created,3);
 scope.settingsOpen=false;scope.renderPlayers(players);assert.equal(created,4);
});
