import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authorize,validateRooms} from '../server/config.mjs';
const playerKeys=Array.from({length:12},(_,i)=>'secret-player-key-'+i);
const rooms={bunker:{playerKeys,viewerKey:'secret-viewer-key'}};
test('12 player slots, no 13th slot and no privilege escalation',()=>{
 validateRooms(rooms);
 for(let i=0;i<12;i++)assert.deepEqual(authorize(rooms,{room:'bunker',key:playerKeys[i],mode:'player'}),{identity:'player-'+(i+1),publish:true});
 assert.equal(authorize(rooms,{room:'bunker',key:'unknown',mode:'player'}),null);
 assert.equal(authorize(rooms,{room:'bunker',key:rooms.bunker.viewerKey,mode:'player'}),null);
 assert.equal(authorize(rooms,{room:'other',key:playerKeys[0],mode:'player'}),null);
 assert.throws(()=>validateRooms({bunker:{...rooms.bunker,playerKeys:[...playerKeys,'another-player-key']}}));
});
test('viewer cannot publish and player key reconnects to the same identity',()=>{
 assert.equal(authorize(rooms,{room:'bunker',key:rooms.bunker.viewerKey,mode:'viewer'}).publish,false);
 assert.equal(authorize(rooms,{room:'bunker',key:playerKeys[0],mode:'player'}).identity,'player-1');
});
