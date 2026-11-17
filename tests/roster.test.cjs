const {test}=require('node:test');const assert=require('node:assert/strict');const {runInNewContext}=require('node:vm');const fs=require('node:fs');
test('elimination and table reordering retain positions, numbers and vote identities after reload',()=>{
 const scope={window:{}};runInNewContext(fs.readFileSync('game-dom.js','utf8'),scope);const api=scope.window.S42GameDOM;
 const roster=api.createRoster();roster.update([{name:'А'},{name:'Б'},{name:'В'}]);
 let players=roster.update([{name:'А'},{name:'В'},{name:'Б',eliminated:true}]);
 assert.equal(players.map(p=>p.name).join(','),'А,Б,В');assert.equal(players[1].eliminated,true);assert.equal(players[2].number,'Игрок 3');
 players=api.createRoster(players).update([{name:'В'},{name:'А'}]);
 assert.equal(players.map(p=>p.name).join(','),'А,Б,В');assert.equal(players[1].eliminated,true);
});
