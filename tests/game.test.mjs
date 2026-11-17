import {test} from 'node:test';
import assert from 'node:assert/strict';
import {playerText,isStale} from '../extension/game.js';
test('cards follow unique names across reconnects and reordered players',()=>{
 const players=[{name:'Огурец',text:'Врач'},{name:' Свекла ',text:'Инженер'}];
 assert.equal(playerText(players,'СВЕКЛА'),'Инженер');
 assert.equal(playerText([...players].reverse(),'Огурец'),'Врач');
 assert.equal(playerText([...players,{name:'Свекла',text:'Другое'}],'Свекла'),'');
 assert.equal(playerText(['legacy positional card'],'Свекла'),'');
 assert.equal(playerText(players,'Неизвестный'),'');
});
test('missing and expired heartbeats are stale',()=>{
 assert.equal(isStale({},20000),true);
 assert.equal(isStale({capturedAt:1000},16001),true);
 assert.equal(isStale({capturedAt:1000},15000),false);
});
