document.getElementById('version').textContent='· '+chrome.runtime.getManifest().version;
const status=document.getElementById('status');
const show=s=>status.textContent=s;
document.getElementById('open').onclick=()=>chrome.tabs.create({url:chrome.runtime.getURL('overlay.html')});
async function diagnose(){
 show('Проверяем вкладку игры…');
 try {
  const tabs=await chrome.tabs.query({url:'https://shelter42.ru/online/game*'});
  if(!tabs.length){show('Вкладка игры не найдена. Откройте https://shelter42.ru/online/game в этом браузере и запустите игру.');return;}
  const tab=tabs[0];
  try{
   const response=await chrome.tabs.sendMessage(tab.id,{type:'S42_SCAN'});
   if(!response?.ok){show('Вкладка найдена, но игровая таблица не обнаружена. Запустите игру и повторите проверку.');return;}
   const {gameState}=await chrome.storage.local.get('gameState');
   show(`Подключено! Игроков: ${response.players}. Катастрофа: ${gameState?.catastrophe||'ещё не найдена'}. Откройте экран стрима.`);
  }catch(e){show('Вкладка игры открыта, но расширение к ней не подключилось. Обновите вкладку игры (Ctrl+R), затем нажмите «Проверить подключение».');}
 }catch(e){show('Ошибка проверки: '+e.message)}
}
document.getElementById('scan').onclick=diagnose;
diagnose();
