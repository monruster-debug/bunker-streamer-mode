'use strict';
const $=id=>document.getElementById(id);
let game=null, stream=null, sourceKind=null, raf=0, lastSignature='', settingsOpen=false;
const sourceVideo=$('source-video');
const catastropheView=window.S42CatastropheView.create($('catastrophe-popup'));
const bunkerView=window.S42BunkerView.create($('bunker-popup'));
const credits=window.S42Motion.createCredits($('cat-viewport'),$('cat-description'));
const carousel=window.S42Motion.createCarousel($('bunker'),createBunkerCard);
function createBunkerCard(card,i){
 const slide=document.createElement('article');slide.className='bunker-slide'+(card.closed?' closed':'');
 const content=document.createElement('div');content.className='bunker-card-content';
 if(card.closed){
  const icon=document.createElement('img');icon.src='assets/bunker-closed.svg';icon.width=32;icon.height=32;icon.alt='';
  const description=document.createElement('p');description.textContent=card.revealLabel||'Откроется после '+(i+1)+' круга';
  content.append(icon,description);
 }else{
  const background=document.createElement('img');background.className='bunker-background';background.src=window.S42BunkerView.imageSource(card.image,'assets/bunker-background.png');background.alt='';slide.append(background);
  const title=document.createElement('h2');title.textContent=card.title||'Карта бункера';
  const description=document.createElement('p');description.textContent=card.description||'';
  content.append(title,description);
 }
 slide.append(content);return slide;
}
const wideLayout=window.matchMedia('(min-width:2560px)');
function fitCanvas(){
 const fit=window.S42Layout.fit(window.innerWidth,window.innerHeight,wideLayout.matches);
 const style=$('app').style;
 style.setProperty('--overlay-scale',fit.scale);
 style.setProperty('--overlay-left',fit.left+'px');style.setProperty('--overlay-top',fit.top+'px');
}
fitCanvas();window.addEventListener('resize',fitCanvas);
function createSlotState(dead=false, cameraOff=false){
 const state=document.createElement('div');state.className='slot-state'+(cameraOff?' camera-off':'');
 const brand=document.createElement('img');brand.className='slot-brand';brand.src='assets/empty-brand.svg';brand.width=337.097;brand.height=61.2305;brand.alt='';
 const label=document.createElement('div');label.className='slot-state-label';
 const icon=document.createElement('img');icon.src=dead?'assets/eliminated-skull.svg':cameraOff?'assets/camera-off.svg':'assets/empty-crown.svg';icon.width=34;icon.height=34;icon.alt='';
 const text=document.createElement('span');
 if(dead){const firstLine=document.createElement('span');firstLine.className='slot-state-first-line';firstLine.textContent='Игрок покинул';text.append(firstLine,document.createElement('br'),document.createTextNode('убежище'));}else text.textContent=cameraOff?'Камера отключена':'Место пустует';
 label.append(icon,text);state.append(brand,label);return state;
}
function createCameraSettings(label,key){
 const button=document.createElement('button');button.type='button';button.className='player-camera-settings';button.title='Настройка камер';button.setAttribute('aria-label','Настройка камеры: '+label);
 const icon=document.createElement('img');icon.src='assets/camera-settings.svg';icon.width=20;icon.height=20;icon.alt='';button.append(icon);
 button.addEventListener('click',()=>{toggleSettings(true);if(key){const select=[...$('camera-assignments-list').querySelectorAll('select')].find(el=>el.dataset.playerKey===key);select?.focus({preventScroll:true});select?.scrollIntoView({block:'nearest'});}});return button;
}
function createEmptySlot(){const slot=document.createElement('article');slot.className='player empty';slot.setAttribute('aria-label','Свободное место');slot.append(createSlotState(),createCameraSettings('свободное место'));return slot;}

let options={grid:'4x3',left:0,top:0,right:0,bottom:0,map:{}};
const CATEGORIES=['Профессия','Здоровье','Биология','Хобби','Багаж','Факты'];
const CARD_ICONS={'Профессия':'profession','Здоровье':'health','Биология':'biology','Факты':'fact','Хобби':'hobby','Багаж':'baggage'};
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
 const key=playerKey(p,i), article=document.createElement('article');article.className='player'+(p.eliminated?' dead':'')+(game?.current===p.name&&!p.eliminated?' active':'');article.dataset.key=key;
 const cam=document.createElement('div');cam.className='cam';
 const canvas=document.createElement('canvas');canvas.width=480;canvas.height=300;canvas.hidden=!stream;cam.append(canvas);
 const idx=document.createElement('div');idx.className='cam-index';idx.textContent=p.number||`Игрок ${i+1}`;cam.append(idx);
 const {total}=gridDims();
 const mapped=options.map[key]??(i<total?i+1:0);
 const name=document.createElement('div');name.className='name';const small=document.createElement('small');small.textContent=String(p.number||i+1).replace('Игрок ','');const title=document.createElement('span');title.textContent=safeText(p.name);name.append(small,title);
 if(p.eliminated)article.append(createSlotState(true));
 else if(!stream||Number(mapped)<1||Number(mapped)>total){canvas.hidden=true;article.append(createSlotState(false,true));}
 const cards=document.createElement('div');cards.className='cards';
 const known=p.cards||{};
 const left=document.createElement('div');left.className='card-stack card-stack-left';
 const right=document.createElement('div');right.className='card-stack card-stack-right';
 for(const k of CATEGORIES){
  const v=known[k]||(k==='Факты'?known['Факт']:null),card=document.createElement('div');card.className='card card-'+CARD_ICONS[k]+(v?'':' unrevealed');card.title=`${k}: ${v||'не раскрыто'}`;
  const label=document.createElement('span');label.textContent=v?safeText(v):(k==='Факты'?'Факт':k);
  const icon=document.createElement('img');icon.src=`assets/${v&&!p.eliminated?"":"unrevealed/"}${CARD_ICONS[k]}.svg`;icon.width=16;icon.height=16;icon.alt='';
  if(['Профессия','Здоровье','Биология'].includes(k)){card.append(icon,label);left.append(card);}else{card.append(label,icon);right.append(card);}
 }
 cards.append(left,right);
 article.append(cam,name,cards,createCameraSettings(p.name,key));
 const voters=[...new Set((p.voters||[]).map(String))].filter(n=>/^\d+$/.test(n)).sort((a,b)=>Number(a)-Number(b));
 if(voters.length){
  const votes=document.createElement('div');votes.className='player-votes';votes.setAttribute('aria-label','За изгнание проголосовали игроки: '+voters.join(', '));
  for(const number of voters){const badge=document.createElement('span');badge.className='vote-badge';badge.textContent=number;votes.append(badge);}
  article.append(votes);
 }
 return article;
}
function updateTurnClock(state){
 $('clock').textContent=state.timer||'';
 const discussion=!state.final&&(state.phase?state.phase==='discussion':/обсуждени/i.test((state.stage||'')+' '+(state.current||'')));
 const currentPlayer=!state.final&&!discussion&&(state.players||[]).find(p=>p.name===state.current&&!p.eliminated);
 $('clock-player').hidden=!currentPlayer;
 $('clock-number').textContent=currentPlayer?String(currentPlayer.number).replace('Игрок ',''):'';
 $('clock-name').textContent=currentPlayer?.name||'';
 $('discussion-icon').hidden=!discussion;
 $('clock-description').hidden=!discussion&&!currentPlayer;
 $('clock-description').textContent=discussion?'Уважаемые игроки, пришло время обсудить открытые карты...':currentPlayer?'Думает какую карту вам показать...':'';
 $('clock-additional').textContent=state.additionalTime||'';
 $('clock-additional').hidden=!discussion||!state.additionalTime;
}
let previousAssignmentsRender='';
function renderCameraAssignments(){
 if(!settingsOpen)return;
 const players=(game?.players||[]).slice(0,wideLayout.matches?12:10);
 const signature=JSON.stringify({players:players.map((p,i)=>playerKey(p,i)),grid:options.grid,map:options.map});
 if(signature===previousAssignmentsRender)return;
 previousAssignmentsRender=signature;
 const list=$('camera-assignments-list');list.replaceChildren();
 if(!players.length){const empty=document.createElement('p');empty.textContent='Игроки появятся после подключения к игре.';list.append(empty);return;}
 const {cols,total}=gridDims();
 players.forEach((p,i)=>{
  const key=playerKey(p,i),label=document.createElement('label');label.className='camera-assignment';
  const name=document.createElement('span');name.textContent=String(p.number||i+1).replace('Игрок ','')+'. '+p.name;
  const select=document.createElement('select');select.dataset.playerKey=key;select.setAttribute('aria-label','Камера для '+name.textContent);
  const none=document.createElement('option');none.value='0';none.textContent='Без камеры';select.append(none);
  for(let n=1;n<=total;n++){const opt=document.createElement('option');opt.value=String(n);opt.textContent='Камера '+n+' · ряд '+(Math.floor((n-1)/cols)+1)+', место '+((n-1)%cols+1);select.append(opt);}
  const mapped=Number(options.map[key]??(i<total?i+1:0));select.value=String(mapped>=1&&mapped<=total?mapped:0);
  select.addEventListener('change',()=>{options.map[key]=Number(select.value);save().catch(e=>updateSourceStatus('Не сохранено: '+e.message));render();});
  label.append(name,select);list.append(label);
 });
}
function render(){
 renderCameraAssignments();
 catastropheView.update(game);
 bunkerView.update(game);
 if(!game){$('status').textContent='Откройте игру и проверьте подключение в меню расширения';renderPlayers([]);return;}
 $('stage').textContent=game.final?'Финал':`${game.round?'Круг '+game.round:'Игра'}${game.stage?' · '+game.stage:''}`;
 updateTurnClock(game);
 $('catastrophe').textContent=game.catastrophe||'';credits.update(game.catastropheDescription||'');
 const nuclear=game.catastrophe==='Ядерная война';
 const image=$('cat-center-image');let source=game.catastropheImage||game.catastrophePopup?.image||'';
 try{if(source&&new URL(source).protocol!=='https:')source='';}catch{source='';}
 image.hidden=!source&&!nuclear;
 const path=source||(nuclear?'assets/catastrophe-popup.png':'');
 if(path&&image.getAttribute('src')!==path)image.src=path;
 if(!path)image.removeAttribute('src');
 const wideSource=$('cat-wide-source');
 if(!source&&nuclear)wideSource.srcset='assets/center-catastrophe-wide.png';else wideSource.removeAttribute('srcset');
 renderPlayers(game.players||[]);
 $('duration').textContent=game.duration||'—';$('population').textContent=game.population||'—';
 $('area').textContent=game.area||'—';$('capacity').textContent=game.capacity||'—';
 carousel.update(game.bunker||[]);
 const current=document.createElement('div');current.className='turn-current';current.textContent=game.final?'Игра завершена':game.current||'Ход не определён';
 const next=document.createElement('div');next.className='turn-next';next.textContent=game.final?'Финал партии':`Следующий ход → ${game.next||'ожидание'}`;$('turn').replaceChildren(current,next);
 $('status').textContent=`Данные: ${new Date(game.updatedAt).toLocaleTimeString('ru-RU')} · Видео: ${stream?'подключено':'не подключено'}`;
 if(stream&&!raf)drawLoop();
}
function animateElimination(previous,next){
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const transition=document.createElement('div');transition.className='elimination-transition';transition.setAttribute('aria-hidden','true');
 const oldCanvas=previous.querySelector('canvas');
 let outgoing;
 if(oldCanvas&&!oldCanvas.hidden){
  outgoing=document.createElement('canvas');outgoing.width=oldCanvas.width;outgoing.height=oldCanvas.height;
  outgoing.getContext('2d').drawImage(oldCanvas,0,0);
 }else outgoing=previous.querySelector('.slot-state')?.cloneNode(true)||document.createElement('div');
 outgoing.classList.add('elimination-outgoing');
 const incoming=next.querySelector('.slot-state').cloneNode(true);incoming.classList.add('elimination-incoming');
 transition.append(outgoing,incoming);next.append(transition);
 const fade=outgoing.animate([{opacity:1,filter:'grayscale(0) blur(0px)',transform:'scale(1)'},{opacity:.65,filter:'grayscale(1) blur(2px)',transform:'scale(1.025)',offset:.45},{opacity:0,filter:'grayscale(1) blur(8px)',transform:'scale(1.06)'}],{duration:1000,easing:'ease-in',fill:'both'});
 const reveal=incoming.animate([{opacity:0,transform:'translateY(12px) scale(.94)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:750,delay:550,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
 Promise.allSettled([fade.finished,reveal.finished]).then(()=>{
  transition.remove();
  if(next.isConnected){previousPlayersRender='';render();}
 });
}
let previousPlayersRender='';
function renderPlayers(players){
 const signature=JSON.stringify({players,current:game?.current,wide:wideLayout.matches,settingsOpen,video:!!stream,options});
 if(signature===previousPlayersRender)return;
 previousPlayersRender=signature;
 const center=$('game-center'),wide=wideLayout.matches;
 const positions=wide?Array.from({length:12},(_,i)=>[Math.floor(i/4)+1,i%4+1]):[[1,1],[1,2],[1,3],[1,4],[2,1],[2,4],[3,1],[3,2],[3,3],[3,4]];
 const existing=new Map([...$('people').querySelectorAll('.player')].map(slot=>[slot.dataset.key,slot]));
 const slots=positions.map((position,i)=>{
  const player=players[i],previous=player&&existing.get(playerKey(player,i));
  // Keep a running transition mounted through timer, vote and camera-setting updates.
  const continuing=player?.eliminated&&previous?.querySelector('.elimination-transition');
  const slot=continuing?previous:player?createPlayer(player,i):createEmptySlot();
  if(player?.eliminated&&previous&&!previous.classList.contains('dead'))animateElimination(previous,slot);
  slot.style.gridArea=position.join(' / ');return slot;
 });
 $('people').querySelectorAll('.player').forEach(p=>{if(!slots.includes(p))p.remove();});
 const parent=wide?$('app'):$('people');if(center.parentElement!==parent)parent.append(center);
 slots.forEach(slot=>$('people').append(slot));
}
wideLayout.addEventListener('change',()=>{fitCanvas();render();});

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
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('catastrophe-popup').hidden&&$('bunker-popup').hidden)toggleSettings(!settingsOpen);});
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
chrome.storage.local.get(['gameState','streamVideoOptions'],r=>{if(r.streamVideoOptions){options={...options,...r.streamVideoOptions,map:r.streamVideoOptions.map||{}};if(!['4x3','3x4','4x4','3x3','3x2','2x3','2x2'].includes(options.grid))options.grid='4x3';}syncInputs();setGame(r.gameState);});
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.gameState)setGame(changes.gameState.newValue);});
setInterval(()=>{if(!game||Date.now()-game.updatedAt>12000)$('status').textContent='Нет свежих данных игры · проверьте вкладку';},5000);
window.addEventListener('pagehide',()=>{if(stream)for(const t of stream.getTracks())t.stop();});
window.addEventListener('pagehide',()=>{carousel.destroy();credits.destroy();});
render();
