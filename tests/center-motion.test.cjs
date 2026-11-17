const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {runInNewContext}=require('node:vm');
function setup(){
 const intervals=new Map(),timeouts=new Map(),frames=new Map();let id=0;
 const scope={window:{},setInterval:(fn,ms)=>{intervals.set(++id,{fn,ms});return id;},clearInterval:key=>intervals.delete(key),setTimeout:fn=>{timeouts.set(++id,fn);return id;},clearTimeout:key=>timeouts.delete(key),requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:key=>frames.delete(key),ResizeObserver:class{observe(){}disconnect(){}}};
 runInNewContext(readFileSync('center-motion.js','utf8'),scope);
 return {api:scope.window.S42Motion,intervals,timeouts,flush(){for(const fn of frames.values())fn();frames.clear();}};
}
test('carousel waits 30 seconds, slides horizontally, wraps, and survives unchanged game updates',()=>{
 const s=setup(),track={style:{},replaceChildren(...nodes){this.nodes=nodes;}},card=v=>({value:v,setAttribute(){}});
 const c=s.api.createCarousel(track,card),cards=[{title:'Один'},{title:'Два'}];
 c.update(cards);assert.equal(track.nodes.length,3);const timer=[...s.intervals.values()][0];assert.equal(timer.ms,30000);
 timer.fn();assert.equal(track.style.transform,'translateX(-216px)');
 c.update(cards);assert.equal(track.style.transform,'translateX(-216px)');assert.equal(s.intervals.size,1);
 timer.fn();assert.equal(track.style.transform,'translateX(-432px)');[...s.timeouts.values()][0]();assert.equal(track.style.transform,'translateX(0px)');
 c.update([{title:'Один'}]);assert.equal(s.intervals.size,0);assert.equal(track.nodes.length,1);c.destroy();
});
test('credits hold for 2 minutes then reach the end and return without resets on unchanged content',()=>{
 const s=setup();let cancelled=0,started=0,frames,timing;
 const text={scrollHeight:400,animate:(f,t)=>{started++;frames=f;timing=t;return {cancel:()=>cancelled++};}},view={clientHeight:200};
 const c=s.api.createCredits(view,text);c.update('Длинное описание');s.flush();
 assert.equal(started,1);assert.ok(Math.abs(frames[1].offset*timing.duration-120000)<.001);assert.equal(frames[2].transform,'translateY(-200px)');assert.equal(frames.at(-1).transform,'translateY(0px)');assert.equal(timing.iterations,Infinity);
 c.update('Длинное описание');s.flush();assert.equal(started,1);
 text.scrollHeight=100;c.update('Короткое описание');s.flush();assert.equal(cancelled,1);assert.equal(started,1);c.destroy();
});
