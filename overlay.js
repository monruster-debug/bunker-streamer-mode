'use strict';
const $=id=>document.getElementById(id);
let game=null, stream=null, sourceKind=null, raf=0, lastSignature='', settingsOpen=false;
const sourceVideo=$('source-video');
let options={grid:'4x3',left:0,top:0,right:0,bottom:0,map:{}};
const CATEGORIES={};
const safeText=(s)=>String(s??'');
function gridDims(){const [c,r]=options.grid.split('x').map(Number);return {cols:c,rows:r,total:c*r};}
function playerKey(p,i){return `${p.number||'Игрок '+(i+1)}:${p.name||''}`;}
function clamp(n,a,b){return Math.max(a,Math.min(b,Number(n)||0));}
function configRead(){
 options.grid=$('source-grid').value;
 for(const k of ['left','top','right','bottom'])options[k]=clamp($('crop-'+k).value,0,80);
 if(options.left+options.right>95)options.right=95-options.left;
 if(options.top+options.bottom>95)options.bottom=95-options.top;
}
function syncInputs(){ $('source-grid').value=options.grid;for(const k of ['left','top','right','bottom'])$('crop-'+k).value=options[k];}
async function save(){await chrome.storage.local.set({streamVideoOptions:options});$('video-status').textContent=stream?'Настройки сохранены · видео подключено':'Настройки сохранены · видео не подключено';}
function updateSourceStatus(msg){$('video-status').textContent=msg;}
async function stopVideo(message='Видео отключено'){
 cancelAnimationFrame(raf);raf=0;
 if(stream){for(const track of stream.getTracks())track.stop();}
 stream=null;sourceKind=null;sourceVideo.srcObject=null;
 updateSourceStatus(message);render();
}
async function attachVideo(next,kind){
 await stopVideo();
 stream=next;sourceKind=kind;
 sourceVideo.srcObject=stream;
 const track=stream.getVideoTracks()[0];
 if(track)track.addEventListener('ended',()=>{if(stream===next)stopVideo('Источник отключён или демонстрация завершена')},{once:true});
 try{await sourceVideo.play();}catch(e){updateSourceStatus('Источник получен, но воспроизведение не началось: '+e.message);return;}
 updateSourceStatus((kind==='screen'?'Захват окна':'Камера')+' подключён · '+(track?.label||'видеопоток'));
 render();drawLoop();
}
async function captureScreen(){
 try{
  if(!navigator.mediaDevices?.getDisplayMedia)throw Error('В этом браузере нет доступа к захвату экрана');
  // The browser chooser must be invoked directly from a user click.
  const next=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:24,max:30}},audio:false});
  await attachVideo(next,'screen');
 }catch(e){if(e.name!=='NotAllowedError')updateSourceStatus('Не удалось захватить окно: '+e.message);else updateSourceStatus('Захват не разрешён или отменён');}
}
async function devices(){
 try{
 const list=await navigator.mediaDevices.enumerateDevices();
 const el=$('camera-device'), selected=el.value;el.replaceChildren();
 const base=document.createElement('option');base.value='';base.textContent='Камера по умолчанию';el.append(base);
 for(const device of list.filter(d=>d.kind==='videoinput')){const x=document.createElement('option');x.value=device.deviceId;x.textContent=device.label||'Камера (доступ откроется после разрешения)';el.append(x);}
 if([...el.options].some(o=>o.value===selected))el.value=selected;
 }catch(e){updateSourceStatus('Список устройств недоступен: '+e.message);}
}
async function captureCamera(){
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw Error('В этом браузере недоступна камера');
  const device=$('camera-device').value;
  const next=await navigator.mediaDevices.getUserMedia({audio:false,video:device?{deviceId:{exact:device}}:{width:{ideal:1920},height:{ideal:1080}}});
  await attachVideo(next,'camera');await devices();
 }catch(e){updateSourceStatus('Камера не подключена: '+e.message+' · проверьте разрешения браузера и запуск OBS Virtual Camera');}
}
function createPlayer(p,i){
 const key=playerKey(p,i), article=document.createElement('article');article.className='player'+(p.eliminated?' dead':'')+(game?.current===p.name?' active':'');article.dataset.key=key;
 const cam=document.createElement('div');cam.className='cam';
 const canvas=document.createElement('canvas');canvas.width=480;canvas.height=300;canvas.hidden=!stream;cam.append(canvas);
 const placeholder=document.createElement('div');placeholder.className='cam-placeholder';placeholder.textContent='Камера не подключена';placeholder.hidden=!!stream;cam.append(placeholder);
 const idx=document.createElement('div');idx.className='cam-index';idx.textContent=p.number||`Игрок ${i+1}`;cam.append(idx);
 const select=document.createElement('select');select.className='cam-map';select.title='Номер видеоячейки для игрока';select.setAttribute('aria-label','Видеоячейка для '+p.name);
 const unassigned=document.createElement('option');unassigned.value='0';unassigned.textContent='Без камеры';select.append(unassigned);
 const {total}=gridDims();for(let n=1;n<=total;n++){const opt=document.createElement('option');opt.value=String(n);opt.textContent=`Камера ${n}`;select.append(opt);}
 const mapped=options.map[key];select.value=String(mapped===undefined?(i<total?i+1:0):mapped);if(!select.value)select.value='0';
 select.hidden=!settingsOpen;select.onchange=()=>{options.map[key]=Number(select.value);save().catch(()=>{});};cam.append(select);
 const name=document.createElement('div');name.className='name';const small=document.createElement('small');small.textContent=p.number||`#${i+1}`;const title=document.createElement('span');title.textContent=safeText(p.name);name.append(small,title);
 if(p.eliminated){const tag=document.createElement('span');tag.className='deadTag';tag.textContent='ИЗГНАН';name.append(tag);}
 const cards=document.createElement('div');cards.className='cards';
 const entries=Object.entries(p.cards||{});
 if(!entries.length){const t=document.createElement('div');t.className='empty';t.textContent='Открытых карт пока нет';cards.append(t);}
 for(const [k,v] of entries){const card=document.createElement('div');card.className='card';const b=document.createElement('b');b.textContent=safeText(k);const val=document.createElement('span');val.textContent=safeText(v);card.append(b,val);cards.append(card);}
 article.append(cam,name,cards);return article;
}
function render(){
 if(!game){$('status').textContent='Откройте игру и проверьте подключение в меню расширения';return;}
 $('stage').textContent=game.final?'Финал':`${game.round?'Круг '+game.round:'Игра'}${game.stage?' · '+game.stage:''}`;
 $('clock').textContent=game.timer||'';
 $('catastrophe').textContent=game.catastrophe||'Нет данных';$('cat-description').textContent=game.catastropheDescription||'';
 const people=$('people');people.replaceChildren(...(game.players||[]).map(createPlayer));
 const bunker=$('bunker');bunker.replaceChildren();for(const card of game.bunker||[]){const div=document.createElement('div');div.className='bunker-item'+(card.closed?' muted':'');div.textContent=card.closed?'Закрытая карта':card.title||'Карта бункера';bunker.append(div);}
 $('turn').textContent=game.final?'Игра завершена':`Ходит: ${game.current||'не определено'}${game.next?' · Следующий: '+game.next:''}`;
 $('status').textContent=`Данные: ${new Date(game.updatedAt).toLocaleTimeString('ru-RU')} · Видео: ${stream?'подключено':'не подключено'}`;
 if(stream&&!raf)drawLoop();
}
function drawLoop(){
 if(!stream||sourceVideo.readyState<2){raf=stream?requestAnimationFrame(drawLoop):0;return;}
 const vw=sourceVideo.videoWidth,vh=sourceVideo.videoHeight;
 if(vw&&vh){
 const {cols,rows,total}=gridDims();const x=vw*options.left/100,y=vh*options.top/100;
 const w=vw*(100-options.left-options.right)/100,h=vh*(100-options.top-options.bottom)/100;
 if(w>1&&h>1){const cw=w/cols,ch=h/rows;
 for(const [i,card] of [...document.querySelectorAll('.player')].entries()){
  const canvas=card.querySelector('canvas');if(!canvas)continue;
  const key=card.dataset.key, mapped=options.map[key];const slot=mapped===undefined?i+1:Number(mapped);
  if(slot<1||slot>total){canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);continue;}
  const sx=x+((slot-1)%cols)*cw,sy=y+Math.floor((slot-1)/cols)*ch;
  try{canvas.getContext('2d').drawImage(sourceVideo,sx,sy,cw,ch,0,0,canvas.width,canvas.height);}catch(e){}
 }
 }}
 raf=requestAnimationFrame(drawLoop);
}
function toggleSettings(next){settingsOpen=next;$('config').hidden=!next;$('settings-toggle').textContent=next?'× Скрыть настройки':'⚙ Настройка камер';render();}
function setGame(s){if(!s)return;game=s;const sign=JSON.stringify(s);if(sign!==lastSignature){lastSignature=sign;render();}}
$('settings-toggle').addEventListener('click',()=>toggleSettings(!settingsOpen));
$('hide-settings').addEventListener('click',()=>toggleSettings(false));
$('capture-screen').addEventListener('click',captureScreen);
$('capture-camera').addEventListener('click',captureCamera);
$('stop-video').addEventListener('click',()=>stopVideo());
$('refresh-devices').addEventListener('click',devices);
$('source-grid').addEventListener('change',()=>{configRead();render();save().catch(()=>{});});
for(const k of ['left','top','right','bottom'])$('crop-'+k).addEventListener('input',()=>{configRead();});
$('save-settings').addEventListener('click',()=>{configRead();save().catch(e=>updateSourceStatus('Не сохранено: '+e.message));render();});
$('auto-map').addEventListener('click',()=>{const {total}=gridDims();options.map={};for(const [i,p] of (game?.players||[]).entries())options.map[playerKey(p,i)]=i<total?i+1:0;render();save().catch(()=>{});});
chrome.storage.local.get(['gameState','streamVideoOptions'],r=>{if(r.streamVideoOptions){options={...options,...r.streamVideoOptions,map:r.streamVideoOptions.map||{}};if(!['4x3','3x4','4x4','3x3','2x2'].includes(options.grid))options.grid='4x3';}syncInputs();setGame(r.gameState);});
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.gameState)setGame(changes.gameState.newValue);});
setInterval(()=>{if(!game||Date.now()-game.updatedAt>12000)$('status').textContent='Нет свежих данных игры · проверьте вкладку';},5000);
window.addEventListener('pagehide',()=>{if(stream)for(const t of stream.getTracks())t.stop();});
