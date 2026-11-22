import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBatch,watchRequest,newLines,youtubeId,compactState,DEMO} from '../watch-core.js';
import {api} from '../worker/index.js';

const frame={image:'data:image/jpeg;base64,YQ==',at:1730000000000};
const input={frames:[frame],state:{},history:[]};
const origin='https://pocket-aces.nikki0radz.chatgpt.site';
function req(path,{user='test-user',body=input,method='POST',token='',requestOrigin=origin}={}){
  return new Request(origin+'/api/pip/'+path,{method,headers:{...(user?{'oai-authenticated-user-id':user}:{}),origin:requestOrigin,'content-type':'application/json','x-pip-session':token},...(method==='GET'?{}:{body:JSON.stringify(body)})});
}
test('only known YouTube hosts and exact video IDs can become an embedded player',()=>{
  for(const link of ['https://youtu.be/abcdefghijk?t=20','https://www.youtube.com/watch?v=abcdefghijk','https://youtube.com/live/abcdefghijk'])assert.equal(youtubeId(link),'abcdefghijk');
  for(const link of ['https://youtube.com.evil.test/watch?v=abcdefghijk','javascript:alert(1)','https://youtube.com/watch?v=%22%3E','https://not-youtube.com/abcdefghijk'])assert.equal(youtubeId(link),null);
});
test('table images must be bounded, in order, and valid JPEG data URLs',()=>{
  assert.equal(validateBatch(input).frames.length,1);
  assert.throws(()=>validateBatch({frames:Array(7).fill(frame)}));
  assert.throws(()=>validateBatch({frames:[frame,{...frame,at:frame.at-1}]}));
  assert.throws(()=>validateBatch({frames:[{...frame,image:'https://private-network/image'}]}));
  assert.throws(()=>validateBatch({frames:[{...frame,image:'data:image/jpeg;base64,'+'Y'.repeat(650001)}]}));
  assert.throws(()=>validateBatch({frames:[]}));
});
test('Pip carries bounded history and explicit zero-knowledge instructions without saving responses',()=>{
  const batch=validateBatch({...input,history:Array(40).fill({text:'x'.repeat(1000)}),state:{summary:'x'.repeat(4000)},transcript:'a'.repeat(10000)});
  assert.equal(batch.history.length,16);assert.equal(batch.state.summary.length,1800);assert.equal(batch.transcript.length,4000);
  const request=watchRequest(batch);assert.equal(request.store,false);
  assert.match(request.input[0].content,/NO poker knowledge/);assert.match(request.input[0].content,/Never infer an unseen action/);
  assert.equal(request.input[1].content.filter(x=>x.type==='input_image').length,1);
  assert.deepEqual(newLines(['He wins!','he wins','New cards'],[{text:'HE WINS.'}]),['New cards']);
  assert.equal(compactState({players:Array(40).fill({name:'A'})}).players.length,10);
});
test('practice chips are conserved and finishing profit is distinct from the pot',()=>{
  for(const step of DEMO)assert.equal(step.owen+step.maya+step.pot,400);
  assert.equal(DEMO.at(-1).owen-200,6);assert.match(DEMO.at(-1).text,/Winning 12.*different from gaining 12/);
  assert.match(DEMO.find(s=>s.label==='Show the cards').text,/two pairs/);
});
test('live API requires identity and same-origin access, and never calls OpenAI without a key',async()=>{
  let calls=0;const fake=async()=>{calls++;throw Error('Should not call');};
  assert.equal((await api(req('status',{user:'',method:'GET'}),{},fake)).status,401);
  assert.equal((await api(req('analyse',{requestOrigin:'https://other.test'}),{OPENAI_API_KEY:'fake'},fake)).status,403);
  assert.deepEqual(await (await api(req('status',{method:'GET'}),{},fake)).json(),{connected:false,sessionMinutes:30});
  assert.equal((await api(req('session'),{},fake)).status,503);assert.equal(calls,0);
});
test('session signatures bind a watch session to its user and successful updates carry state forward',async()=>{
  const env={OPENAI_API_KEY:'test-only-secret'};
  const session=await (await api(req('session',{user:'watch-owner'}),env)).json();assert.ok(session.token);
  let calls=0;
  const fake=async(url,options)=>{calls++;assert.equal(url,'https://api.openai.com/v1/responses');const body=JSON.parse(options.body);assert.equal(body.store,false);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({commentary:['Three shared cards have appeared.'],confidence:'high',uncertainty:'',state:{board:['A♥','7♣','2♦'],pot:'4',players:[],summary:'Owen and Maya matched two chips each.'}})}]}]});};
  assert.equal((await api(req('analyse',{user:'someone-else',token:session.token}),env,fake)).status,401);
  assert.equal((await api(req('analyse',{user:'watch-owner',token:session.token+'bad'}),env,fake)).status,401);
  const result=await api(req('analyse',{user:'watch-owner',token:session.token}),env,fake);
  assert.equal(result.status,200);assert.equal(calls,1);assert.equal((await result.json()).state.board.length,3);
});
test('provider refusals, incomplete output, bad JSON and usage limits never become invented commentary',async()=>{
  const env={OPENAI_API_KEY:'test-only-secret'};
  const session=await (await api(req('session',{user:'error-owner'}),env)).json();
  for(const data of [{status:'incomplete',output:[]},{status:'completed',output:[{content:[{type:'refusal',refusal:'Cannot read'}]}]},{output:[{content:[{type:'output_text',text:'not json'}]}]}]){
    const result=await api(req('analyse',{user:'error-owner',token:session.token}),env,async()=>Response.json(data));assert.equal(result.status,502);assert.ok((await result.json()).error);
  }
  const limit=await api(req('analyse',{user:'error-owner',token:session.token}),env,async()=>new Response('',{status:429}));assert.equal(limit.status,429);
});
