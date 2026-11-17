const {test}=require('node:test');const assert=require('node:assert/strict');const {runInNewContext}=require('node:vm');const fs=require('node:fs');
test('elimination and table reordering retain positions, numbers and vote identities after reload',()=>{
 const scope={window:{}};runInNewContext(fs.readFileSync('game-dom.js','utf8'),scope);const api=scope.window.S42GameDOM;
 const roster=api.createRoster();roster.update([{name:'А'},{name:'Б'},{name:'В'}]);
 let players=roster.update([{name:'А'},{name:'В'},{name:'Б',eliminated:true}]);
 assert.equal(players.map(p=>p.name).join(','),'А,Б,В');assert.equal(players[1].eliminated,true);assert.equal(players[2].number,'Игрок 3');
 players=api.createRoster(players).update([{name:'В'},{name:'А'}]);
 assert.equal(players.map(p=>p.name).join(','),'А,Б,В');assert.equal(players[1].eliminated,true);
});
test('eliminated players retain only previously public cards when source clears or removes their row',()=>{
 const scope={window:{}};runInNewContext(fs.readFileSync('game-dom.js','utf8'),scope);
 const roster=scope.window.S42GameDOM.createRoster();
 roster.update([{name:'А',cards:{Профессия:'Врач'}},{name:'Б',cards:{}}]);
 let players=roster.update([{name:'Б',cards:{}},{name:'А',eliminated:true,cards:{}}]);
 assert.equal(players[0].cards.Профессия,'Врач');assert.equal(players[0].cards.Здоровье,undefined);
 players=roster.update([{name:'Б',cards:{}}]);assert.equal(players[0].cards.Профессия,'Врач');
});
