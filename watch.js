import {screenshotLink} from './triton.js';
import {DEMO, INITIAL_STATE, MAX_FRAMES, SESSION_MS, newLines, youtubeId} from './watch-core.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
const native=()=>window.PocketAcesAndroid;
const canShare=()=>!!(native()||navigator.mediaDevices?.getDisplayMedia);
let mounted=false,connected=null,mode='idle',paused=false,run=0,stream=null,video=null,canvas=null,previousPixels=null;
let frames=[],history=[],tableState={...INITIAL_STATE},transcripts=[],token='',expiresAt=0,startedAt=0,lastSent=0,lastCaptured=0;
let sampleTimer=null,analyseTimer=null,expiryTimer=null,demoTimer=null,recorderTimer=null,recorder=null,audioBusy=false,busy=false,controller=null;
let demoIndex=-1,lastUncertainty='',lastLine='',question='',previousImage='',skipped=0,sourceHasAudio=false,pendingNative=null,nativeWaitTimer=null;
let designWasWatching=false;
let player='',voice=false,videoId='',demoSpeed=9500;
try{const prefs=JSON.parse(localStorage.getItem('pocket-pip-prefs')||'{}');player=String(prefs.player||'').slice(0,80);voice=!!prefs.voice;}catch{}
const active=()=>mode==='live'||mode==='demo';
function savePrefs(){try{localStorage.setItem('pocket-pip-prefs',JSON.stringify({player,voice}));}catch{}}
function status(text){const el=$('#pip-status');if(el)el.textContent=text;}
function notice(text){const el=$('#pip-notice');if(el){el.textContent=text;el.hidden=!text;}}

export function watchView(){return `<section id="pip-watch-root" class="pip-watch">
  <button class="text-button" data-nav="learn">Back to Learn</button>
  <div class="page-heading"><div><p class="eyebrow">YOUR PATIENT POKER PAL</p><h1>Watch with Pip</h1><p>You watch the game. I’ll make it make sense.</p></div><div class="pip happy pip-heading" role="img" aria-label="Pip"></div></div>
  ${screenshotLink()}
  <div class="pip-mobile-actions"><button class="primary" data-pip="demo">Try practice</button><button class="secondary" data-pip="live">Share a game</button></div>
  <div class="pip-watch-layout"><div class="pip-view-column">
    <section class="pip-screen" aria-label="Your game"><div id="pip-video-area" class="pip-video-area"><div class="pip-screen-welcome"><span aria-hidden="true">♠ ♥ ♣ ♦</span><h2>Big table. Tiny explanations.</h2><p>Try a little practice game, or let me watch a stream with you.</p></div></div><div class="pip-screen-footer"><span id="pip-source">No game playing yet</span><span id="pip-status" role="status">Ready when you are</span></div></section>
    <section class="pip-start-panel panel"><h2>Let’s watch together.</h2><p>I’ll explain what changes, using everyday words. You don’t need to know any poker first.</p>
      <div class="pip-start-buttons"><button id="pip-demo" class="primary" data-pip="demo">Try a practice game</button><button id="pip-live" class="secondary" data-pip="live">Share a game with Pip</button></div>
      <p id="pip-connection" class="pip-help">Checking the live connection…</p>
      <div id="pip-notice" class="pip-notice" role="alert" hidden></div>
      <div id="pip-session-controls" class="pip-session-controls" hidden><button class="secondary" data-pip="pause" id="pip-pause">Pause Pip</button><button class="pip-stop" data-pip="stop">Stop watching</button><span id="pip-session-age"></span></div>
      <div class="pip-preferences"><label>Who are you watching? <span>(optional)</span><input id="pip-player" maxlength="80" placeholder="e.g. Owen" value="${esc(player)}"></label><label class="pip-voice"><input id="pip-voice" type="checkbox" ${voice?'checked':''}> Read Pip’s explanations aloud</label></div>
      <details class="pip-youtube"><summary>Play a YouTube video here</summary><p>You’ll still need to share the playing tab or app so Pip can see it.</p><form id="pip-video-form"><label class="sr-only" for="pip-youtube-url">YouTube link</label><input id="pip-youtube-url" type="url" placeholder="Paste a YouTube link" required><button class="secondary">Play video</button></form></details>
      <details class="pip-about"><summary>What does Pip share?</summary><p>Only the screen or app you select, plus its sound if you choose to share it. Pocket Aces does not save a video recording. Images and shared audio go to OpenAI for processing and are subject to its data-retention rules. The hand history stays in this session and is cleared when you leave or start a new game.</p><p>Use streams you’re allowed to share for analysis. Protected video or audio may be unavailable. Pip can miss quick actions or misread small cards; he’ll tell you when he’s unsure. A watch session stops after 30 minutes, and you can start another.</p><a href="https://developers.openai.com/api/docs/guides/your-data" target="_blank" rel="noopener noreferrer">OpenAI data information</a></details>
    </section>
  </div><aside class="pip-comment-column">
    <section class="pip-companion panel"><div class="pip-companion-header"><button class="pip-mascot" data-pip="simpler" aria-label="Ask Pip to explain more simply"><span class="pip happy" id="pip-mascot-image" role="img" aria-label="Pip"></span></button><div><span class="eyebrow">PIP EXPLAINS</span><strong>Right here with you.</strong><span class="pip-ai-label" id="pip-kind">AI companion · practice available</span></div></div><div class="pip-bubble" id="pip-bubble" aria-live="polite"><p>There are lots of things on a poker table. We’ll take them one at a time.</p></div><div class="pip-question-chips"><button data-pip="simpler">Even simpler, Pip</button><button data-pip="question" data-question="What is the pile of chips in the middle? Explain from zero.">The chips in the middle?</button><button data-pip="question" data-question="Explain SB and BB from zero using what is visible, and distinguish a seat label from an amount measured in BB.">What are SB and BB?</button></div><form id="pip-question-form"><label for="pip-question">Something confusing?</label><div><input id="pip-question" maxlength="600" placeholder="Ask Pip in your own words"><button aria-label="Ask Pip">Ask</button></div></form></section>
    <section class="pip-history panel"><div class="section-top"><h2>The story so far</h2><span id="pip-history-count">0 moments</span></div><p class="pip-help">Pip keeps track as you watch.</p><ol id="pip-history-list"><li class="pip-empty">The next little “aha” will appear here.</li></ol></section>
  </aside></div></section>`;}

export function mountWatch(){
  if(!$('#pip-watch-root')){if(mounted){stop();history=[];tableState={...INITIAL_STATE};mounted=false;}return;}
  if(mounted)return;
  mounted=true;
  $('#pip-watch-root').addEventListener('click',e=>{
    const b=e.target.closest('[data-pip]');if(!b)return;
    const action=b.dataset.pip;
    if(action==='demo')startDemo();
    if(action==='live')startLive();
    if(action==='pause')togglePause();
    if(action==='stop')stop();
    if(action==='simpler')ask('Please explain your last explanation more simply, with fewer ideas and no unexplained poker words.');
    if(action==='question')ask(b.dataset.question);
  });
  $('#pip-player').addEventListener('input',e=>{player=e.target.value;savePrefs();});
  $('#pip-voice').addEventListener('change',e=>{voice=e.target.checked;savePrefs();if(!voice)window.speechSynthesis?.cancel();});
  $('#pip-question-form').addEventListener('submit',e=>{e.preventDefault();const input=$('#pip-question');if(input.value.trim()){ask(input.value.trim());input.value='';}});
  $('#pip-video-form').addEventListener('submit',e=>{e.preventDefault();loadVideo($('#pip-youtube-url').value);});
  updateConnection();
}
async function updateConnection(){
  try{const r=await fetch('/api/pip/status',{cache:'no-store'});if(!r.ok)throw new Error();connected=!!(await r.json()).connected;}catch{connected=false;}
  const p=$('#pip-connection');if(!p)return;
  if(location.hostname==='appassets.androidplatform.net'){p.textContent='Live AI isn’t connected in this app yet. Lessons, practice and the screenshot guide work without signing in.';return;}
  if(location.hostname==='nikki0radz.github.io'){p.innerHTML='Practice works here. For live sharing, <a href="https://pocket-aces.nikki0radz.chatgpt.site/#watch">open the hosted Pocket Aces app</a>.';return;}
  if(!connected)p.innerHTML='Live Pip needs its OpenAI connection. The practice game works now.'+(!native()?' <a href="https://pocket-aces.nikki0radz.chatgpt.site/downloads/Pocket-Aces-0.3.3.apk">Get the Android test app</a>.':'');
  else if(!canShare())p.innerHTML='For screen sharing on your phone, use the <a href="https://pocket-aces.nikki0radz.chatgpt.site/downloads/Pocket-Aces-0.3.3.apk">Pocket Aces Android app</a>. On a laptop, use Chrome or Edge.';
  else p.textContent='Live Pip is connected. Choose your video tab or app when you start. Live watching uses API credits only while a session is running.';
}
function setControls(){
  const el=$('#pip-session-controls');if(el)el.hidden=!active();
  const pause=$('#pip-pause');if(pause)pause.textContent=paused?'Resume Pip':'Pause Pip';
  const demo=$('#pip-demo');if(demo)demo.textContent=mode==='demo'?'Restart practice game':'Try a practice game';
  document.querySelectorAll('[data-pip=live]').forEach(el=>{el.disabled=mode==='live'||mode==='starting';});
  const kind=$('#pip-kind');if(kind)kind.textContent=mode==='demo'?'Practice game · written example':mode==='live'?'AI watching your shared game':'AI companion · practice available';
}
function elapsed(){return Math.max(0,Math.floor((Date.now()-startedAt)/1000));}
function clock(s){return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
function addLine(text,label='',mood='happy'){
  if(!text)return;
  lastLine=text;history.push({at:new Date().toISOString(),text,label:label||clock(elapsed())});if(history.length>160)history.shift();
  const bubble=$('#pip-bubble');if(bubble)bubble.innerHTML=`<p>${esc(text)}</p>`;
  const mascot=$('#pip-mascot-image');if(mascot)mascot.className=`pip ${mood}`;
  paintHistory();
  if(native())native().showExplanation(text,voice);
  else if(voice && window.speechSynthesis){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-GB';u.rate=.94;speechSynthesis.speak(u);}
}
function paintHistory(){
  const list=$('#pip-history-list');if(!list)return;
  list.innerHTML=history.length?history.slice(-60).reverse().map(e=>`<li><span>${esc(e.label)}</span><p>${esc(e.text)}</p></li>`).join(''):'<li class="pip-empty">The next little “aha” will appear here.</li>';
  $('#pip-history-count').textContent=history.length+' '+(history.length===1?'moment':'moments');
}
function resetHistory(){history=[];frames=[];tableState={...INITIAL_STATE};transcripts=[];lastUncertainty='';lastLine='';previousImage='';previousPixels=null;skipped=0;question='';paintHistory();}
function clearResources(){
  ++run;clearInterval(sampleTimer);clearTimeout(analyseTimer);clearInterval(expiryTimer);clearTimeout(demoTimer);clearTimeout(recorderTimer);clearTimeout(nativeWaitTimer);
  sampleTimer=analyseTimer=expiryTimer=demoTimer=recorderTimer=nativeWaitTimer=null;
  controller?.abort();controller=null;
  if(recorder&&recorder.state!=='inactive'){recorder.onstop=null;try{recorder.stop();}catch{}}recorder=null;
  stream?.getTracks().forEach(t=>t.stop());stream=null;
  if(video){video.srcObject=null;video.remove();}video=null;canvas=null;
  native()?.stopCapture();
  if(pendingNative){pendingNative.reject(new Error('Sharing cancelled.'));pendingNative=null;}
  window.speechSynthesis?.cancel();token='';expiresAt=0;busy=false;audioBusy=false;frames=[];previousImage='';previousPixels=null;sourceHasAudio=false;
}
function stop(message='Pip has stopped watching. Your screen is no longer shared.'){
  const wasDemo=mode==='demo';clearResources();mode='idle';paused=false;setControls();status(wasDemo?'Practice stopped':'Not sharing');if(mounted&&message)notice(message);
}
function loadVideo(value){
  const id=youtubeId(value);if(!id){notice('That doesn’t look like a YouTube video link. Try copying the link from Share in YouTube.');return;}
  if(active()||mode==='starting')stop('');videoId=id;
  $('#pip-video-area').innerHTML=`<iframe src="https://www.youtube.com/embed/${id}?playsinline=1&autoplay=1&enablejsapi=1" title="Your YouTube video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
  $('#pip-source').textContent='Your YouTube video';notice('Video loaded. Press “Share a game with Pip” and select this tab or app to let him watch.');
}
function demoCard(card){return `<span class="pip-demo-card ${'♥♦'.includes(card.slice(-1))?'red':''}">${esc(card)}</span>`;}
function drawDemo(step){
  $('#pip-video-area').innerHTML=`<div class="pip-demo-table"><span class="pip-practice-tag">PRACTICE GAME · NOT A LIVE STREAM</span><div class="pip-demo-seat"><strong>Maya</strong><span>${step.maya} chips left</span><div>${step.reveal?['7♥','K♣'].map(demoCard).join(''):'<i class="pip-card-back"></i><i class="pip-card-back"></i>'}</div></div><div class="pip-demo-middle"><span>Chips in the middle: <b>${step.pot}</b></span><div class="pip-demo-board">${Array.from({length:5},(_,i)=>step.board[i]?demoCard(step.board[i]):'<span class="pip-demo-card empty">·</span>').join('')}</div></div><div class="pip-demo-seat owen"><div>${['A♦','Q♠'].map(demoCard).join('')}</div><strong>Owen</strong><span>${step.owen} chips left</span></div><span class="pip-demo-progress">${demoIndex+1} of ${DEMO.length} little moments</span></div>`;
}
function startDemo(){
  clearResources();mode='demo';paused=false;demoIndex=-1;startedAt=Date.now();resetHistory();notice('This is a written practice game, so you can try Pip before connecting live AI. No screen is shared and no API credits are used.');setControls();$('#pip-source').textContent='Owen & Maya · practice';nextDemo();
}
function nextDemo(){
  if(mode!=='demo'||paused)return;
  demoIndex++;const step=DEMO[demoIndex];if(!step){status('Practice finished');mode='idle';setControls();return;}
  drawDemo(step);addLine(step.text,step.label,demoIndex===DEMO.length-1?'celebrate':'happy');status('Pip is explaining');
  demoTimer=setTimeout(nextDemo,Math.max(demoSpeed,step.text.split(' ').length*310));
}
function togglePause(){
  if(!active())return;paused=!paused;frames=[];window.speechSynthesis?.cancel();
  if(paused){controller?.abort();clearTimeout(demoTimer);if(recorder&&recorder.state!=='inactive')try{recorder.stop();}catch{}native()?.setPaused(true);status('Pip paused');notice(mode==='live'?'Pip isn’t analysing while paused. Screen sharing remains available; Stop watching ends it. Actions during the pause will be unknown.':'Practice paused.');}
  else {if(mode==='live'){transcripts.push('[Analysis was paused. Actions during that gap were not observed.]');transcripts=transcripts.slice(-6);}native()?.setPaused(false);notice('');status(mode==='demo'?'Practice resumed':'Watching your shared game');if(mode==='demo')nextDemo();else{lastSent=0;previousPixels=null;beginAudio(run);}}
  setControls();
}
async function apiCall(path,body,signal){
  const r=await fetch('/api/pip/'+path,{method:'POST',headers:{'content-type':'application/json','x-pip-session':token},body:JSON.stringify(body),signal});
  const data=await r.json().catch(()=>({error:'Pip couldn’t connect. Please sign in and try again.'}));
  if(!r.ok)throw new Error(data.error||'Pip couldn’t connect.');return data;
}
async function startLive(){
  if(mode==='starting'||mode==='live')return;
  if(connected!==true){await updateConnection();if(!connected){notice('The screen-sharing feature is ready, but live explanations need the OpenAI connection first. Try the practice game for now.');return;}}
  if(!canShare()){notice('This phone browser cannot share its screen. Use the Pocket Aces Android app, or open Pocket Aces in Chrome or Edge on your laptop.');return;}
  clearResources();mode='starting';paused=false;resetHistory();setControls();notice('');status('Choose the video app or tab');
  const generation=run;
  try{
    if(native()){
      await new Promise((resolve,reject)=>{pendingNative={resolve,reject};native().startCapture(String(generation));nativeWaitTimer=setTimeout(()=>{if(pendingNative){pendingNative.reject(new Error('Screen sharing wasn’t started. Please try again.'));pendingNative=null;}},90000);});
    }else{
      stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:2,max:5}},audio:true,selfBrowserSurface:'include',systemAudio:'include'});
      if(generation!==run){stream.getTracks().forEach(t=>t.stop());return;}
      video=document.createElement('video');video.muted=true;video.playsInline=true;video.srcObject=stream;await video.play();canvas=document.createElement('canvas');
      stream.getVideoTracks()[0].addEventListener('ended',()=>{if(generation===run)stop('Screen sharing ended. Pip has stopped watching.');});
      sourceHasAudio=stream.getAudioTracks().length>0;
    }
    const session=await apiCall('session',{});
    if(generation!==run)return;
    token=session.token;expiresAt=session.expiresAt;startedAt=Date.now();lastSent=0;mode='live';setControls();
    if(!videoId && !native())$('#pip-video-area').innerHTML='<div class="pip-screen-welcome"><h2>Your game is playing in the shared tab.</h2><p>Pip is following it here. You can keep that tab beside Pocket Aces.</p></div>';
    $('#pip-source').textContent='Your shared game · AI explanations';status('Looking at the table…');
    notice(sourceHasAudio?'Pip is watching the table and listening to the shared broadcast sound.':'Pip is watching the table. Broadcast sound is not shared, so he’ll use what he can see.');
    if(!native())sampleTimer=setInterval(()=>captureFrame(generation),1000);
    expiryTimer=setInterval(()=>{if(generation!==run)return;if(Date.now()>=expiresAt){stop('Your 30-minute session has ended. Start another whenever you’re ready.');return;}const el=$('#pip-session-age');if(el)el.textContent=clock(elapsed())+' watching';},1000);
    if(!native())captureFrame(generation);beginAudio(generation);
  }catch(e){if(generation!==run)return;stop(e.name==='NotAllowedError'?'Screen sharing wasn’t allowed. You can start again when you’re ready.':e.message||'Screen sharing could not start.');}
}
function pushFrame(image,at,generation){
  if(generation!==run||mode!=='live'||paused)return;
  if(Date.now()>=expiresAt){stop('Your watch session has ended. Start a new one when you’re ready.');return;}
  previousImage=image;
  if(frames.length>=MAX_FRAMES){frames.shift();skipped++;}
  frames.push({image,at});lastCaptured=Date.now();
  if(!busy && Date.now()-lastSent>=8000)analyse(generation);
}
function captureFrame(generation){
  if(generation!==run||mode!=='live'||paused||!video?.videoWidth)return;
  const width=Math.min(1440,video.videoWidth),height=Math.round(video.videoHeight*width/video.videoWidth);canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(video,0,0,width,height);
  const small=document.createElement('canvas');small.width=48;small.height=27;const sc=small.getContext('2d',{willReadFrequently:true});sc.drawImage(canvas,0,0,48,27);const pixels=sc.getImageData(0,0,48,27).data;
  let delta=0,brightness=0;for(let i=0;i<pixels.length;i+=4){brightness+=pixels[i]+pixels[i+1]+pixels[i+2];if(previousPixels)delta+=Math.abs(pixels[i]-previousPixels[i])+Math.abs(pixels[i+1]-previousPixels[i+1])+Math.abs(pixels[i+2]-previousPixels[i+2]);}
  if(brightness/(pixels.length/4*3)<2){status('The shared picture is black');return;}
  const changed=!previousPixels||delta/(pixels.length/4*3)>1.1;previousPixels=pixels;
  if(changed||Date.now()-lastCaptured>10000)pushFrame(canvas.toDataURL('image/jpeg',.72),Date.now(),generation);
}
async function analyse(generation,explicit=''){
  if(generation!==run||mode!=='live'||paused||busy||(!frames.length&&!explicit))return;
  busy=true;lastSent=Date.now();controller=new AbortController();const batch=frames.splice(0);const sentQuestion=explicit||question;question='';
  status('Pip is following the action…');
  const wasSkipped=skipped;skipped=0;
  try{
    const result=await apiCall('analyse',{frames:batch.length?batch:previousImage?[{image:previousImage,at:Date.now()}]:[],state:tableState,history,transcript:transcripts.slice(-4).join('\n'),player,question:sentQuestion+(wasSkipped?'\nSome views were skipped while processing. Do not assume all actions were seen.':'')},controller.signal);
    if(generation!==run||paused)return;
    tableState=result.state;
    const lines=newLines(result.commentary,history);
    if(lines.length)addLine(lines.join(' '),'AI · '+clock(elapsed()),result.confidence==='low'?'thinking':'happy');
    if(result.uncertainty && result.uncertainty!==lastUncertainty){lastUncertainty=result.uncertainty;notice('Pip is unsure: '+result.uncertainty);}
    else if(!result.uncertainty)notice('');
    status(result.confidence==='low'?'Waiting for a clearer view':'Watching for the next move');
  }catch(e){if(generation!==run||e.name==='AbortError')return;stop(e.message);}
  finally{if(generation===run){busy=false;controller=null;if(mode==='live'&&!paused)analyseTimer=setTimeout(()=>{if(question)analyse(generation,question);else if(frames.length)analyse(generation);},Math.max(1000,8000-(Date.now()-lastSent)));}}
}
function beginAudio(generation){
  if(generation!==run||mode!=='live'||paused||!sourceHasAudio||native()||typeof MediaRecorder==='undefined'||recorder?.state==='recording')return;
  try{
    const audio=new MediaStream(stream.getAudioTracks());const chunks=[];
    const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t));
    if(!mime)return;
    recorder=new MediaRecorder(audio,{mimeType:mime});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onstop=async()=>{
      if(generation!==run||mode!=='live'||paused)return;
      const blob=new Blob(chunks,{type:mime});
      if(!audioBusy&&blob.size>200){audioBusy=true;try{const r=await fetch('/api/pip/transcribe',{method:'POST',headers:{'content-type':mime,'x-pip-session':token},body:blob});const d=await r.json();if(generation!==run)return;if(r.ok&&d.text){transcripts.push(d.text);transcripts=transcripts.slice(-6);}else if(!r.ok){sourceHasAudio=false;notice(d.error||'Broadcast sound is unavailable. Pip is using the table picture.');}}catch{sourceHasAudio=false;notice('Broadcast sound disconnected. Pip is using the table picture.');}finally{if(generation===run)audioBusy=false;}}
      if(generation===run&&mode==='live'&&!paused)beginAudio(generation);
    };
    recorder.start();recorderTimer=setTimeout(()=>{if(recorder?.state==='recording')recorder.stop();},12000);
  }catch{sourceHasAudio=false;notice('Broadcast sound is unavailable. Pip is using the table picture.');}
}
function ask(text){
  if(mode==='demo'||(mode==='idle'&&demoIndex>=0&&history.length)){
    const response=text.includes('SB')?'SB and BB are labels for the two people who must put chips in before the round starts. SB puts in the smaller amount. BB puts in the bigger amount. In our example, that’s 1 chip and 2 chips.':text.includes('pile of chips')?'The chips in the middle are the prize for this round. Every chip a player puts in joins that pile. The winner takes it. Poker calls that pile the pot.':`Let’s take just one thing: ${demoIndex===DEMO.length-1?'Owen now has 206 chips. He started with 200. That means he has 6 more than before.':demoIndex>=4?'The cards in the middle are shared. Owen and Maya are both allowed to use them.':'Each player has their own chips. They put some in the middle to keep playing. The winner gets the middle pile.'}`;
    addLine(response,'Practice · Pip explains');return;
  }
  if(mode!=='live'){notice('Start a practice game or share a live game first, so Pip has something to explain.');return;}
  if(paused){notice('Resume Pip so he can look at the table and answer.');return;}
  if(!previousImage){notice('Pip needs a clear view of the table first.');return;}
  question=text;if(!busy)analyse(run,text);
}
window.pipNativeEvent=(event)=>{
  if(event.session!==undefined && String(event.session)!==String(run))return;
  if(event.type==='black'){status('The shared video is black or protected');return;}
  if(event.type==='started'){clearTimeout(nativeWaitTimer);pendingNative?.resolve();pendingNative=null;sourceHasAudio=!!event.audio;}
  if(event.type==='frame'){pushFrame(event.image,event.at,run);}
  if(event.type==='error'){if(pendingNative){clearTimeout(nativeWaitTimer);pendingNative.reject(new Error(event.message));pendingNative=null;}else if(mode==='live'||mode==='starting')stop(event.message);}
  if(event.type==='stopped'&&(mode==='live'||mode==='starting'))stop('Screen sharing ended. Pip has stopped watching.');
  if(event.type==='pause'&&mode==='live')togglePause();
};
window.addEventListener('pip-native-ready',()=>{if(mounted)updateConnection();});
window.addEventListener('pagehide',()=>{if(active()||mode==='starting')stop('');});

window.addEventListener('pocket-aces-design-mode',event=>{
  if(event.detail.active){designWasWatching=active()&&!paused;if(designWasWatching)togglePause();}
  else if(designWasWatching){designWasWatching=false;if(active()&&paused)togglePause();}
});
