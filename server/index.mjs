import http from 'node:http';
import {AccessToken,RoomServiceClient} from 'livekit-server-sdk';
import {authorize,validateRooms} from './config.mjs';
const {LIVEKIT_URL,LIVEKIT_API_KEY,LIVEKIT_API_SECRET,ROOMS_JSON,PORT='8787',HOST='127.0.0.1'}=process.env;
if(!LIVEKIT_URL||!LIVEKIT_API_KEY||!LIVEKIT_API_SECRET||!ROOMS_JSON)throw Error('Заполните .env по .env.example');
const rooms=validateRooms(JSON.parse(ROOMS_JSON));
const client=new RoomServiceClient(LIVEKIT_URL.replace(/^ws/,'http'),LIVEKIT_API_KEY,LIVEKIT_API_SECRET);
const server=http.createServer(async(req,res)=>{
 res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
 // Room keys are credentials; CORS is not used as authentication.
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
 const reply=(status,value)=>{res.writeHead(status);res.end(JSON.stringify(value));};
 if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
 if(req.method!=='POST'||req.url!=='/token')return reply(404,{error:'Не найдено'});
 try{
 let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096)return reply(413,{error:'Слишком большой запрос'});}
 const data=JSON.parse(body);const auth=authorize(rooms,data);if(!auth)return reply(403,{error:'Неверная комната, роль или ключ'});
 if(typeof data.name!=='string'||!data.name.trim()||data.name.length>40)return reply(400,{error:'Укажите имя до 40 символов'});
 await client.createRoom({name:data.room,maxParticipants:20,emptyTimeout:300});
 const token=new AccessToken(LIVEKIT_API_KEY,LIVEKIT_API_SECRET,{identity:auth.identity,name:data.name.trim(),ttl:'10m'});
 token.addGrant({roomJoin:true,room:data.room,canPublish:auth.publish,canSubscribe:true,canPublishData:false,...(auth.publish?{canPublishSources:['camera','microphone']}:{})});
 reply(200,{url:LIVEKIT_URL,token:await token.toJwt()});
 }catch(error){console.error(error.message);reply(500,{error:'Не удалось подключиться. Проверьте настройки видеосервера.'});}
});
server.requestTimeout=10000;server.listen(Number(PORT),HOST,()=>console.log(`Token server: http://${HOST}:${PORT}`));
