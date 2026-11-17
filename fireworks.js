'use strict';
window.S42Fireworks={
 create(containers){
  const scenes=containers.map(root=>{const canvas=document.createElement('canvas');canvas.className='final-fireworks';canvas.setAttribute('aria-hidden','true');root.append(canvas);return {canvas,context:canvas.getContext('2d'),particles:[],wait:0};});
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let enabled=false,running=false,frame=0,last=0;
  const colors=['#ffd166','#ff6b9d','#6ee7b7','#7ab8ff','#c4a1ff'];
  function burst(scene,w,h){
   const x=w*(.2+Math.random()*.6),y=h*(.15+Math.random()*.4),color=colors[Math.floor(Math.random()*colors.length)];
   for(let i=0;i<48;i++){const angle=Math.PI*2*i/48,speed=35+Math.random()*65;scene.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,age:0,life:1.5+Math.random()*.7,color});}
  }
  function paint(time){
   const dt=last?Math.min((time-last)/1000,.05):0;last=time;
   for(const scene of scenes){
    const {canvas,context:ctx}=scene,w=canvas.clientWidth,h=canvas.clientHeight;
    if(!w||!h)continue;
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    ctx.clearRect(0,0,w,h);
    scene.wait-=dt;
    if(scene.wait<=0){burst(scene,w,h);scene.wait=.7+Math.random()*.6;}
    for(const p of scene.particles){
     p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=32*dt;
     ctx.globalAlpha=Math.max(0,1-p.age/p.life);ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=5;
     ctx.beginPath();ctx.arc(p.x,p.y,reduced.matches?1.5:1.8,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;scene.particles=scene.particles.filter(p=>p.age<p.life);
   }
   if(running&&!reduced.matches)frame=requestAnimationFrame(paint);
  }
  function sync(){
   const next=enabled&&!document.hidden;
   if(next===running)return;
   running=next;cancelAnimationFrame(frame);last=0;
   if(running){
    if(reduced.matches){for(const s of scenes){burst(s,s.canvas.clientWidth,s.canvas.clientHeight);for(const p of s.particles){p.x+=p.vx*.65;p.y+=p.vy*.65;p.age=.65;}s.wait=1;}}
    frame=requestAnimationFrame(paint);
   }else for(const s of scenes){s.particles=[];s.wait=0;s.context.clearRect(0,0,s.canvas.width,s.canvas.height);}
  }
  document.addEventListener('visibilitychange',sync);
  return {update(value){enabled=!!value;sync();},destroy(){enabled=false;sync();document.removeEventListener('visibilitychange',sync);scenes.forEach(s=>s.canvas.remove());}};
 }
};
