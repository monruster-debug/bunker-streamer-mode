(() => {
  if (window.__s42StreamerInstalled) return;
  window.__s42StreamerInstalled = true;
  const clean = (e) => e?.textContent?.replace(/\s+/g,' ').trim() || '';
  const get = (sel, root=document) => clean(root?.querySelector(sel));
  let previous = '', timer = null;
  let publicStats={title:''};
  let roster=window.S42GameDOM.createRoster();
  function snapshot() {
    const catastrophePopup=window.S42GameDOM.readCatastrophe();
    const bunkerPopup=window.S42GameDOM.readBunker();
    const title=get('.bunker-main__title h3')||catastrophePopup.title||get('.bunker-info_sm-info h3');
    if(title!==publicStats.title)publicStats={title};
    const capacityText=get('.bunker-main__actions') .match(/Кол-во мест:\s*(\d+)/)?.[1]||get('.bunker-info_sm-info .base-button span');
    if(capacityText)publicStats.capacity=capacityText+' чел.';
    for(const field of ['population','duration','area'])if(catastrophePopup[field])publicStats[field]=catastrophePopup[field];
    const table = document.querySelector('.open-cards-table.hide-in-mobile') || document.querySelector('.open-cards-table');
    const players = roster.update(table ? [...table.querySelectorAll('.open-cards-table-tr')].map((row,i)=> {
      const id = row.querySelector('.open-cards-table__first-cell');
      const number = get('p',id) || `Игрок ${i+1}`;
      const name = get('span',id) || `Игрок ${i+1}`;
      const cards = {};
      row.querySelectorAll('.open-cards-table__base-cell').forEach(cell => {
        const spans = cell.querySelectorAll(':scope > span');
        if(spans.length<2) return;
        const category = clean(spans[0]).replace(/:$/,'');
        const value = clean(spans[1]);
        // The actual page marks unopened cards as a dash.
        // Never read the player's private "Мои карточки" dialog.
        if(category && value && value !== '-' && value !== '—' && !cell.classList.contains('hidden')) cards[category]=value;
      });
      return {number,name,cards,eliminated:row.classList.contains('open-cards-table-tr-dropped')};
    }) : []);
    const votes=window.S42GameDOM.readVotes(players);
    players.forEach((player,i)=>{player.voters=votes[i];});
    const active = document.querySelector('.game-status-header.hide-in-mobile .status-item_act');
    const stage = active?.querySelector('.status-item__current span')?.textContent?.trim() || '';
    const round = get('.status-item__number',active);
    const bunker = window.S42GameDOM.readBunkerCards();
    const background=document.querySelector('.bunker-main');
    const catastropheImage=background?getComputedStyle(background).backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1]||'':'';
    const current = get('.game-header .current-status .base-button__text');
    const next = get('.game-header .next-status .base-button__text');
    const additionalTime=get('.game-header .additional-time');
    const phase=active?.querySelector('.act-discuss')?'discussion':active?.querySelector('.act-judge')?'voting':active?.querySelector('.act-game')?'game':'';
    const seconds = get('.game-header .game-timer') || get('.game-mobile-header .game-timer');
    return {source:'shelter42.ru/online/game', updatedAt:Date.now(), players, capacity:publicStats.capacity||'', duration:publicStats.duration||'', population:publicStats.population||'', area:publicStats.area||'', catastrophe:title||'', catastropheDescription:get('.bunker-main__text')||catastrophePopup.description||'', catastrophePopup, catastropheImage, bunkerPopup, bunker, round, stage, phase, additionalTime, current, next, timer:additionalTime?seconds.replace(additionalTime,'').trim():seconds, final:!!document.querySelector('.final')};
  }
  function publish() {
    if(!document.querySelector('.bunker-info, .open-cards-table, .disaster-card-modal, .bunker-card-modal')&&!previous) return;
    const result = snapshot();
    const sign = JSON.stringify({...result,updatedAt:0});
    if(sign === previous) return;
    previous = sign;
    chrome.storage.local.set({gameState:result}).catch(()=>{});
  }
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== 'S42_SCAN') return;
    try {
      previous = '';
      publish();
      const found = !!document.querySelector('.open-cards-table, .bunker-info');
      sendResponse({ok:found, players: snapshot().players.length, url:location.href});
    } catch(e) {sendResponse({ok:false,error:String(e)});}
  });
  function schedule() { clearTimeout(timer); timer = setTimeout(publish,180); }
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style','hidden','aria-hidden','src']});
  chrome.storage.local.get(['gameState'],saved=>{
    roster=window.S42GameDOM.createRoster(saved.gameState?.players||[]);
    previous='';publish();
  });
  setInterval(publish,3000);
  window.addEventListener('pagehide',()=>{chrome.storage.local.set({gameDisconnectedAt:Date.now()}).catch(()=>{});});
})();
