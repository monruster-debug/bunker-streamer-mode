import {playerText,isStale} from './game.js';
import {Room,RoomEvent,Track} from 'livekit-client';
const $=id=>document.getElementById(id);
const tabId=new URLSearchParams(location.search).get('tab');
let room=null,game={},muted=false,demo=false;
const tiles=new Map();
function tile(identity,name){
 if(tiles.has(identity))return tiles.get(identity);
 const el=document.createElement('section');el.className='tile';
 const placeholder=document.createElement('div');placeholder.className='placeholder';placeholder.textContent=String(tiles.size+1).padStart(2,'0');
 const label=document.createElement('div');label.className='label';label.textContent=name;
 const cards=document.createElement('div');cards.className='cards';
 el.append(placeholder,label,cards);$('grid').append(el);tiles.set(identity,el);return el;
}
function updateGame(){
 $('phase').textContent=[game.round,game.phase,game.timer].filter(Boolean).join(' · ')||'НЕТ ДАННЫХ ОБ ЭТАПЕ';
 $('catastrophe').textContent=game.catastrophe||'Нет данных из игры';$('shelter').textContent=game.shelter||'Нет данных из игры';
 const stale=!demo&&isStale(game);
 $('syncStatus').textContent=demo?'Демонстрационные данные':stale?'Нет свежих данных из вкладки игры':`Синхронизация активна · игроков: ${game.players?.length||0}`;
 [...tiles.values()].forEach((el,i)=>el.querySelector('.cards').textContent=demo?game.players?.[i]||'':stale?'Данные устарели':playerText(game.players,el.querySelector('.label').textContent)||'Нет однозначного совпадения имени в публичной таблице');
}
function attach(track,participant){
 if(track.kind===Track.Kind.Audio){if(participant.isLocal)return;const a=track.attach();a.muted=muted;a.dataset.identity=participant.identity;$('audio').append(a);a.play().catch(()=>{$('status').textContent='Нажмите «Звук», чтобы разрешить воспроизведение.';});return;}
 if(track.kind!==Track.Kind.Video)return;
 const el=tile(participant.identity,participant.name||participant.identity);el.querySelector('video')?.remove();const video=track.attach();video.muted=true;el.prepend(video);
}
function reset(){tiles.clear();$('grid').replaceChildren();$('audio').replaceChildren();['camera','mic','leave'].forEach(id=>$(id).disabled=true);}
async function disconnect(){const old=room;room=null;if(old)await old.disconnect();reset();$('status').textContent='Отключено';}
$('join').onsubmit=async event=>{
 event.preventDefault();await disconnect();demo=false;const submit=$('join').querySelector('button');submit.disabled=true;
 try{
 const base=new URL($('server').value);if(base.protocol!=='https:' && !(base.protocol==='http:' && ['localhost','127.0.0.1'].includes(base.hostname)))throw Error('Для удалённого сервера нужен HTTPS');
 const response=await fetch(new URL('/token',base),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({room:$('room').value,key:$('key').value,name:$('name').value,mode:$('mode').value})});
 const data=await response.json();if(!response.ok)throw Error(data.error||'Ошибка подключения');
 const current=new Room({adaptiveStream:true,dynacast:true,videoCaptureDefaults:{resolution:{width:640,height:360,frameRate:24}}});room=current;
 current.on(RoomEvent.TrackSubscribed,attach).on(RoomEvent.TrackUnsubscribed,track=>track.detach().forEach(el=>el.remove())).on(RoomEvent.LocalTrackPublished,pub=>{if(pub.track)attach(pub.track,current.localParticipant);}).on(RoomEvent.LocalTrackUnpublished,pub=>pub.track?.detach().forEach(el=>el.remove())).on(RoomEvent.ParticipantConnected,p=>{if(p.permissions?.canPublish)tile(p.identity,p.name);updateGame();}).on(RoomEvent.ParticipantDisconnected,p=>{tiles.get(p.identity)?.remove();tiles.delete(p.identity);$('audio').querySelectorAll('audio').forEach(a=>{if(a.dataset.identity===p.identity)a.remove();});updateGame();}).on(RoomEvent.ActiveSpeakersChanged,ps=>{for(const [id,el]of tiles)el.classList.toggle('speaking',ps.some(p=>p.identity===id));}).on(RoomEvent.Disconnected,()=>{if(room===current){room=null;reset();$('status').textContent='Соединение закрыто';}});
 await current.connect(data.url,data.token);
 for(const p of current.remoteParticipants.values())if(p.permissions?.canPublish)tile(p.identity,p.name);
 $('leave').disabled=false;
 let mediaWarning='';
 if($('mode').value==='player'){
 tile(current.localParticipant.identity,$('name').value);
 try{await current.localParticipant.enableCameraAndMicrophone();}catch{mediaWarning=' Доступ к камере или микрофону не получен — включите отдельно.';}
 $('camera').disabled=false;$('mic').disabled=false;
 }
 updateGame();$('status').textContent='Подключено. Видеостол можно захватывать в OBS как окно.'+mediaWarning;
 }catch(error){await disconnect();$('status').textContent=error.message;}finally{submit.disabled=false;}
};
for(const [id,property,method] of [['camera','isCameraEnabled','setCameraEnabled'],['mic','isMicrophoneEnabled','setMicrophoneEnabled']])$(id).onclick=async()=>{try{const p=room?.localParticipant;if(!p)return;await p[method](!p[property]);$(id).textContent=(id==='camera'?'Камера':'Микрофон')+(p[property]?': вкл':': выкл');}catch(e){$('status').textContent=e.message;}};
$('leave').onclick=disconnect;
$('sound').onclick=()=>{muted=!muted;$('audio').querySelectorAll('audio').forEach(a=>{a.muted=muted;a.play().catch(()=>{});});$('sound').textContent='Звук: '+(muted?'выключен':'включён');};
$('clean').onclick=()=>document.body.classList.add('clean');document.addEventListener('keydown',e=>{if(e.key==='Escape')document.body.classList.remove('clean');});
$('demo').onclick=async()=>{await disconnect();demo=true;for(let i=0;i<12;i++)tile('demo'+i,'Игрок '+(i+1));game={phase:'ДЕМО · ОБСУЖДЕНИЕ',round:'Раунд 2',catastrophe:'Демонстрационные данные. Солнечная буря.',shelter:'Демонстрационные данные. 6 мест · 18 месяцев',players:Array.from({length:12},(_,i)=>`Демо-персонаж ${i+1}\nПрофессия: ${['Врач','Инженер','Биолог'][i%3]}\nЗдоровье: раскрыто`)};updateGame();$('status').textContent='Демо: камеры и игра не подключены.';};
$('adapter').onsubmit=async e=>{e.preventDefault();const adapter=Object.fromEntries(new FormData(e.target));for(const selector of Object.values(adapter))if(selector){try{document.querySelector(selector);}catch{$('status').textContent='Некорректный CSS-селектор: '+selector;return;}}await chrome.storage.local.set({adapter});$('status').textContent='Селекторы сохранены. Ожидаем данные из вкладки игры.';};
if(globalThis.chrome?.storage){const saved=await chrome.storage.local.get(['adapter','game:'+tabId]);for(const [key,value]of Object.entries(saved.adapter||{})){const input=$('adapter').elements.namedItem(key);if(input)input.value=value;}game=saved['game:'+tabId]||{};updateGame();chrome.storage.onChanged.addListener(changes=>{if(!demo&&changes['game:'+tabId]){game=changes['game:'+tabId].newValue||{};updateGame();}});}
setInterval(updateGame,2000);
window.addEventListener('pagehide',()=>room?.disconnect());
