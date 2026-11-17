chrome.action.onClicked.addListener(tab=>chrome.windows.create({url:chrome.runtime.getURL(`studio.html?tab=${tab.id}`),type:'normal',width:1440,height:950}));
chrome.runtime.onMessage.addListener((message,sender)=>{
  if(message.type==='VISIBLE_GAME' && sender.tab?.url?.startsWith('https://shelter42.ru/')) chrome.storage.local.set({['game:'+sender.tab.id]:message.state});
});
