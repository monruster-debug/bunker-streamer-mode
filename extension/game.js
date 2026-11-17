export const normalizeName=value=>String(value||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('ru');
export function playerText(players,name){
 const key=normalizeName(name);
 const matches=(players||[]).filter(p=>p&&typeof p==='object'&&normalizeName(p.name)===key);
 return key&&matches.length===1?matches[0].text||'':'';
}
export function isStale(game,now=Date.now()){
 return !Number.isFinite(game.capturedAt)||now-game.capturedAt>15000;
}
