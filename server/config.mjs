export function authorize(rooms,request){
 const config=rooms[request.room];if(!config||typeof request.key!=='string')return null;
 if(request.mode==='viewer'&&config.viewerKey===request.key)return {identity:'viewer-'+crypto.randomUUID(),publish:false};
 if(request.mode!=='player')return null;
 const index=config.playerKeys?.indexOf(request.key)??-1;
 if(index<0||index>=12)return null;
 return {identity:'player-'+(index+1),publish:true};
}
export function validateRooms(rooms){
 for(const config of Object.values(rooms)){
 const keys=config.playerKeys;
 if(!Array.isArray(keys)||keys.length<1||keys.length>12||keys.some(k=>typeof k!=='string'||k.length<16)||new Set(keys).size!==keys.length||typeof config.viewerKey!=='string'||config.viewerKey.length<16||keys.includes(config.viewerKey))throw Error('Комната должна иметь 1–12 уникальных ключей игроков и отдельный ключ зрителя, не короче 16 символов');
 }
 return rooms;
}
