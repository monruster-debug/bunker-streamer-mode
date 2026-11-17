const {test}=require('node:test');
const assert=require('node:assert/strict');
const {runInNewContext}=require('node:vm');
const fs=require('node:fs');

test('elimination animates once, survives concurrent updates, preserves position and skips initial dead players',()=>{
 let mounted=[],animated=0;
 const people={querySelectorAll:()=>[...mounted],append(slot){mounted=mounted.filter(x=>x!==slot);mounted.push(slot);}};
 const scope={game:{},options:{},stream:null,settingsOpen:false,wideLayout:{matches:false},
  $:id=>id==='people'?people:{parentElement:people},playerKey:p=>p.number+':'+p.name,
  createPlayer:p=>({dataset:{key:p.number+':'+p.name},style:{},dead:p.eliminated,
   classList:{contains:c=>c==='dead'&&p.eliminated},querySelector(){return this.animating;},remove(){mounted=mounted.filter(x=>x!==this);}}),
  createEmptySlot:()=>({dataset:{},style:{},remove(){mounted=mounted.filter(x=>x!==this);}}),
  animateElimination(old,next){animated++;next.animating=true;}};
 const source=fs.readFileSync('overlay.js','utf8');
 runInNewContext(source.slice(source.indexOf('let previousPlayersRender='),source.indexOf("wideLayout.addEventListener('change'")),scope);
 let players=[{number:'1',name:'А'},{number:'2',name:'Б',eliminated:true}];
 scope.renderPlayers(players);assert.equal(animated,0);
 players=[{...players[0],eliminated:true},players[1]];
 scope.renderPlayers(players);assert.equal(animated,1);
 const transitionSlot=mounted[0];
 scope.game.current='Б';scope.renderPlayers(players);
 assert.equal(mounted[0],transitionSlot);assert.equal(animated,1);
 players=[{...players[0],voters:['2']},players[1]];scope.renderPlayers(players);
 assert.equal(mounted[0],transitionSlot);assert.equal(mounted[1].dataset.key,'2:Б');
 assert.equal(mounted[0].style.gridArea,'1 / 1');
 transitionSlot.animating=false;scope.settingsOpen=true;scope.renderPlayers(players);
 assert.equal(animated,1);
 players=[{...players[0],eliminated:false},players[1]];scope.renderPlayers(players);
 players=[{...players[0],eliminated:true},players[1]];scope.renderPlayers(players);
 assert.equal(animated,2);
});
