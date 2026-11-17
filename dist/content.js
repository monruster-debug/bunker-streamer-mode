// Read only rendered text; never inspect application state or private card panels.
const visible=e=>e.getClientRects().length && getComputedStyle(e).visibility!=='hidden';
function elements(selector,root=document){try{return selector?[...root.querySelectorAll(selector)].filter(visible):[];}catch{return [];}}
function read(selector,root=document){return elements(selector,root).map(e=>e.innerText.trim()).filter(Boolean);}
function publicPlayers(){
 const heading=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6,div,span')].find(e=>visible(e)&&e.children.length===0&&e.innerText.trim()==='Подробная таблица открытых карт');
 if(!heading)return [];
 let root=heading.parentElement;
 while(root && root!==document.body){
  const text=root.innerText;
  if(/Игрок\s+\d+/.test(text)&&text.includes('Профессия:')&&text.includes('Здоровье:'))break;
  root=root.parentElement;
 }
 if(!root||root===document.body||/Скрыть мои карты|Перетащите карту сюда/.test(root.innerText))return [];
 const rows=[...root.querySelectorAll('*')].filter(e=>visible(e)&&/Игрок\s+\d+/.test(e.innerText)&&e.innerText.includes('Профессия:')&&e.innerText.includes('Здоровье:'));
 return rows.filter(e=>!rows.some(child=>child!==e&&e.contains(child))).slice(0,12).map(e=>{
  const lines=e.innerText.split('\n').map(s=>s.trim()).filter(Boolean);
  const index=lines.findIndex(s=>/^Игрок\s+\d+$/.test(s));
  return {name:lines[index+1]||'',text:lines.slice(index+2).join('\n')};
 }).filter(p=>p.name);
}
let busy=false;
async function capture(){
 if(busy)return;busy=true;
 try{
  const {adapter={}}=await chrome.storage.local.get('adapter');
  const players=adapter.players?elements(adapter.players).slice(0,12).map(e=>({name:read(adapter.playerName,e)[0]||'',text:e.innerText.trim()})):publicPlayers();
  const state={phase:read(adapter.phase)[0]||'',round:read(adapter.round)[0]||'',timer:read(adapter.timer)[0]||'',catastrophe:read(adapter.catastrophe)[0]||'',shelter:read(adapter.shelter)[0]||'',players,capturedAt:Date.now()};
  await chrome.runtime.sendMessage({type:'VISIBLE_GAME',state});
 }finally{busy=false;}
}
setInterval(()=>capture().catch(()=>{}),1500);
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.adapter)capture().catch(()=>{});});
capture().catch(()=>{});
