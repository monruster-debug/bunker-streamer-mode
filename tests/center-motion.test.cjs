const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {runInNewContext}=require('node:vm');
function setup(){
 const intervals=new Map(),timeouts=new Map(),frames=new Map();let id=0;
 const scope={window:{},getComputedStyle:track=>({columnGap:track.gap||"4px"}),setInterval:(fn,ms)=>{intervals.set(++id,{fn,ms});return id;},clearInterval:key=>intervals.delete(key),setTimeout:fn=>{timeouts.set(++id,fn);return id;},clearTimeout:key=>timeouts.delete(key),requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:key=>frames.delete(key),ResizeObserver:class{observe(){}disconnect(){}}};
 runInNewContext(readFileSync('center-motion.js','utf8'),scope);
 return {api:scope.window.S42Motion,intervals,timeouts,flush(){for(const fn of frames.values())fn();frames.clear();}};
}
test('credits hold for 2 minutes then reach the end and return without resets on unchanged content',()=>{
 const s=setup();let cancelled=0,started=0,frames,timing;
 const text={scrollHeight:400,animate:(f,t)=>{started++;frames=f;timing=t;return {cancel:()=>cancelled++};}},view={clientHeight:200};
 const c=s.api.createCredits(view,text);c.update('Длинное описание');s.flush();
 assert.equal(started,1);assert.ok(Math.abs(frames[1].offset*timing.duration-120000)<.001);assert.equal(frames[2].transform,'translateY(-200px)');assert.equal(frames.at(-1).transform,'translateY(0px)');assert.equal(timing.iterations,Infinity);
 c.update('Длинное описание');s.flush();assert.equal(started,1);
 text.scrollHeight=100;c.update('Короткое описание');s.flush();assert.equal(cancelled,1);assert.equal(started,1);c.destroy();
});


test('carousel loops continuously in 60 seconds with enough copies to fill a wide viewport',()=>{
 const s=setup();let starts=0,cancels=0,keyframes,timing;
 const track={style:{},clientWidth:568,firstElementChild:{offsetWidth:228},nodes:[],replaceChildren(...n){this.nodes=n;},append(n){this.nodes.push(n);},animate(f,t){starts++;keyframes=f;timing=t;return {currentTime:0,cancel(){cancels++;}};}};
 const slide=card=>({card,setAttribute(k,v){this[k]=v;}}),c=s.api.createCarousel(track,slide),cards=[{title:'А'},{title:'Б'}];
 c.update(cards);s.flush();assert.equal(timing.duration,60000);assert.equal(timing.iterations,Infinity);assert.equal(timing.easing,'linear');assert.equal(keyframes[0].transform,'translateX(-464px)');
 assert.equal(keyframes[1].transform,'translateX(0px)');assert.equal(track.nodes.length,8);assert.equal(track.nodes[2]['aria-hidden'],'true');
 c.update(cards);s.flush();assert.equal(starts,1);
 track.gap='10px';c.update([{title:'Один'}]);s.flush();assert.equal(keyframes[0].transform,'translateX(-238px)');assert.ok(track.nodes.length*238>=568+238);
 c.update([]);s.flush();assert.equal(track.nodes.length,0);assert.ok(cancels>=2);c.destroy();
});
