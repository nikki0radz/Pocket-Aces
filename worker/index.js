import {validateBatch, watchRequest, compactState, SESSION_MS} from '../watch-core.js';

const limits = new Map();
const json = (body,status=200) => new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}});
const enc = new TextEncoder();
const b64 = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function key(secret) {return crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
async function startToken(user,secret) {
  const payload = b64(enc.encode(JSON.stringify({user,until:Date.now()+SESSION_MS,id:crypto.randomUUID()})));
  const sig = b64(await crypto.subtle.sign('HMAC',await key(secret),enc.encode(payload)));
  return payload+'.'+sig;
}
async function validToken(token,user,secret) {
  try {
    const [data,sig] = token.split('.');
    const bytes = Uint8Array.from(atob(sig.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
    if (!await crypto.subtle.verify('HMAC',await key(secret),bytes,enc.encode(data))) return false;
    const p=JSON.parse(atob(data.replace(/-/g,'+').replace(/_/g,'/')));
    return p.user===user && p.until>Date.now() && p.until<=Date.now()+SESSION_MS;
  } catch {return false;}
}
function rateLimit(user,route) {
  const now=Date.now(), k=user+route;
  const hits=(limits.get(k)||[]).filter(at=>at>now-60000);
  if (hits.length >= (route==='session' ? 6 : 10)) return false;
  hits.push(now); limits.set(k,hits);
  if(limits.size>1000) for(const [id,arr] of limits) if(arr.at(-1)<now-60000) limits.delete(id);
  return true;
}
async function limitedText(req,max) {
  const reader=req.body?.getReader(); if(!reader) throw new Error('A request body is required.');
  const decoder=new TextDecoder();let size=0,result='';
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new Error('This request is too large.');}result+=decoder.decode(value,{stream:true});}
  return result+decoder.decode();
}
function providerError(status) {
  if(status===401||status===403) return json({error:'The OpenAI connection needs updating. Your screen sharing has stopped.'},502);
  if(status===429) return json({error:'OpenAI reached a usage or spending limit. Sharing has stopped; check the OpenAI account before restarting.'},429);
  return json({error:'Pip could not read that update. Screen sharing has stopped. You can try again.'},502);
}
export async function api(request,env,fetcher=fetch) {
  const url = new URL(request.url), user=request.headers.get('oai-authenticated-user-id');
  if(!user) return json({error:'Sign in to Pocket Aces before using live Pip.'},401);
  const origin=request.headers.get('origin');
  if((origin && origin!==url.origin)||request.headers.get('sec-fetch-site')==='cross-site') return json({error:'Open Pocket Aces to start sharing.'},403);
  if(url.pathname==='/api/pip/status' && request.method==='GET') return json({connected:!!env.OPENAI_API_KEY,sessionMinutes:30});
  if(request.method!=='POST')return json({error:'Use POST for this action.'},405);
  if(!env.OPENAI_API_KEY)return json({error:'Live Pip needs its OpenAI connection. You can try the practice game now.'},503);
  const route=url.pathname.split('/').at(-1);
  if(!['session','analyse','transcribe'].includes(route))return json({error:'Not found.'},404);
  if(!rateLimit(user,route))return json({error:'Too many requests. Sharing has stopped; wait a minute before restarting.'},429);
  if(route==='session')return json({token:await startToken(user,env.OPENAI_API_KEY),expiresAt:Date.now()+SESSION_MS});
  if(!await validToken(request.headers.get('x-pip-session')||'',user,env.OPENAI_API_KEY))return json({error:'This watch session has ended. Start a new one when you’re ready.'},401);
  if(route==='analyse') {
    let batch;
    try {batch=validateBatch(JSON.parse(await limitedText(request,2900000)));}catch(e){return json({error:e.message},400);}
    let response;
    try {response=await fetcher('https://api.openai.com/v1/responses',{method:'POST',headers:{authorization:'Bearer '+env.OPENAI_API_KEY,'content-type':'application/json'},body:JSON.stringify(watchRequest(batch,env.OPENAI_WATCH_MODEL||'gpt-4.1-mini')),signal:AbortSignal.timeout(45000)});}catch{return json({error:'Pip lost the connection. Sharing has stopped. Please try again.'},502);}
    if(!response.ok)return providerError(response.status);
    try {
      const data=await response.json();
      if(data.status && data.status!=='completed')throw new Error('Incomplete response');
      const output=data.output?.flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('')||'';
      const result=JSON.parse(output);
      if(!Array.isArray(result.commentary)||!result.state||!['low','medium','high'].includes(result.confidence))throw new Error('Invalid response');
      return json({commentary:result.commentary.filter(x=>typeof x==='string').slice(0,4).map(x=>x.slice(0,1000)),confidence:result.confidence,uncertainty:String(result.uncertainty||'').slice(0,300),state:compactState(result.state)});
    }catch{return json({error:'Pip couldn’t make sense of this update. Sharing has stopped so he won’t guess.'},502);}
  }
  const type=request.headers.get('content-type')||'';
  if(!/^audio\/(webm|mp4|ogg|wav)(;|$)/.test(type))return json({error:'Unsupported audio format.'},400);
  let audio;
  try {
    const reader=request.body.getReader();const chunks=[];let bytes=0;
    while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>800000){await reader.cancel();return json({error:'Audio chunk is too large.'},413);}chunks.push(value);}
    audio=new Blob(chunks,{type});
  }catch{return json({error:'The audio could not be read.'},400);}
  if(audio.size<200)return json({text:''});
  const form=new FormData();form.append('file',audio,type.includes('mp4')?'commentary.mp4':type.includes('wav')?'commentary.wav':type.includes('ogg')?'commentary.ogg':'commentary.webm');
  form.append('model',env.OPENAI_TRANSCRIBE_MODEL||'gpt-4o-mini-transcribe');form.append('language','en');
  try {
    const response=await fetcher('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{authorization:'Bearer '+env.OPENAI_API_KEY},body:form,signal:AbortSignal.timeout(25000)});
    if(!response.ok)return providerError(response.status);
    const data=await response.json();return json({text:String(data.text||'').slice(0,3000)});
  }catch{return json({error:'The broadcast audio could not be understood. Pip can still watch the table.'},502);}
}

// The build appends a deterministic asset map. No frames, audio or keys go in it.
export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    if(url.pathname.startsWith('/api/pip/'))return api(request,env);
    let path;
    try {path=decodeURIComponent(url.pathname);}catch{return new Response('Invalid URL',{status:400});}
    const asset=ASSETS[path==='/'?'/index.html':path];
    if(!asset)return new Response('Not found',{status:404});
    if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
    const body=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0));
    return new Response(request.method==='HEAD'?null:body,{headers:{'content-type':asset.type,'cache-control':'no-cache','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin'}});
  }
};
