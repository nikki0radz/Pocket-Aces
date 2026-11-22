import {CROP,TARGETS,STORY,EXTRA,selectTarget} from './triton-hand.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
let root=null,selected=null,detail=false,voice=false,guide=-1,repeats=new Map();
const coords=t=>`left:${(t.x-CROP.x)/CROP.width*100}%;top:${(t.y-CROP.y)/CROP.height*100}%;width:${t.w/CROP.width*100}%;height:${t.h/CROP.height*100}%`;
export function screenshotLink(){return `<button class="triton-entry" data-nav="screenshot"><span class="triton-entry-card" aria-hidden="true">K<span>♦</span></span><span><small>YOUR TRITON SCREENSHOT</small><strong>Tap it. Pip explains it.</strong><span>Owen’s hand, exactly as you saw it. Every number, card and move.</span></span></button>`;}

export function tritonView(){return `<section id="triton-root" class="triton-page">
  <button class="text-button" data-nav="watch">Back to Watch with Pip</button>
  <div class="page-heading"><div><p class="eyebrow">YOUR SCREENSHOT. ONE LITTLE AHA AT A TIME.</p><h1>What does all this mean?</h1><p>Tap any name, number, card or move. Pip’s right here.</p></div></div>
  <div class="triton-tools"><button class="primary" data-triton="guide">Explain it from the start</button><button class="secondary" data-triton="show" aria-pressed="false">Show tappable bits</button><button class="secondary" data-triton="zoom" aria-pressed="false">Make screenshot bigger</button></div>
  <div class="triton-layout"><div class="triton-image-column">
    <div class="triton-screenshot-scroll" id="triton-scroll"><div class="triton-stage" id="triton-stage" aria-label="Interactive copy of your Triton hand screenshot"><img src="assets/triton-owen-hand.jpg" alt="Owen Messere’s Triton hand history. Use the labelled buttons over the screenshot, or the text list below." draggable="false">${TARGETS.map(t=>`<button class="triton-hotspot" data-triton-target="${t.id}" style="${coords(t)}" aria-label="Explain ${esc(t.label)}" aria-pressed="false"><span class="sr-only">${esc(t.label)}</span></button>`).join('')}</div></div>
    <p class="triton-caption">Your original screenshot, with tappable explanations. This is one finished hand; it isn’t updating live.</p>
    <div class="triton-extra"><button data-triton-extra="order">How do I read this?</button><button data-triton-extra="totals">Why +53K, not +104K?</button><button data-triton-extra="private">Where are Owen’s cards?</button><button data-triton-extra="colours">The dots & faded rows?</button><button data-triton-extra="chips">Are these pounds?</button></div>
    <details class="triton-text-list"><summary>Prefer bigger buttons? Open the text list.</summary><p>Every label below explains the matching part of your screenshot.</p><div>${TARGETS.map(t=>`<button data-triton-target="${t.id}">${esc(t.label)}</button>`).join('')}</div></details>
  </div>
  <aside class="triton-pip panel" id="triton-pip" aria-label="Pip’s screenshot explanations">
    <div class="triton-pip-top"><button class="triton-pip-face" data-triton="expand" aria-label="Open Pip’s explanation"><span class="pip happy" aria-hidden="true"></span></button><div><span class="eyebrow">PIP EXPLAINS</span><strong id="triton-pip-title">Let’s untangle this.</strong></div><button class="triton-collapse" data-triton="collapse" aria-label="Minimise Pip’s explanation">Hide</button></div>
    <div class="triton-pip-body" id="triton-pip-body"><div id="triton-explanation" class="triton-explanation" aria-live="polite" aria-atomic="true"><p>Start anywhere. Even the faded bits work.</p><p>Tap the same thing as often as you need. I’ll explain it every time.</p></div>
    <p id="triton-repeat-note" class="triton-repeat-note">No tests. No remembering required.</p>
    <div class="triton-pip-actions"><button data-triton="again" class="secondary">Say it again</button><button data-triton="detail" class="secondary" id="triton-detail">Tell me a little more</button></div>
    <label class="triton-voice"><input type="checkbox" id="triton-voice"> Read Pip’s explanation aloud</label>
    <p class="triton-authored">Written for this screenshot · works without an API key.</p></div>
    <div class="triton-guide" id="triton-guide" hidden><button data-triton="previous" class="secondary" aria-label="Previous moment">Previous</button><span id="triton-step"></span><button data-triton="next" class="primary" aria-label="Next moment">Next</button></div>
  </aside></div></section>`;}

export function mountTriton(){
  const next=$('#triton-root');if(next===root)return;
  if(root)window.speechSynthesis?.cancel();root=next;selected=null;detail=false;guide=-1;repeats=new Map();if(!root)return;
  root.addEventListener('click',e=>{
    const target=e.target.closest('[data-triton-target]');if(target){choose(target.dataset.tritonTarget,true);return;}
    const extra=e.target.closest('[data-triton-extra]');if(extra){guide=-1;selected={...EXTRA[extra.dataset.tritonExtra],id:'extra-'+extra.dataset.tritonExtra,visits:1};detail=false;highlight();paint();return;}
    const control=e.target.closest('[data-triton]');if(!control)return;
    switch(control.dataset.triton){
      case 'show':{const on=$('#triton-stage').classList.toggle('show-targets');control.setAttribute('aria-pressed',on);control.textContent=on?'Hide outlines':'Show tappable bits';break;}
      case 'zoom':{const on=$('#triton-scroll').classList.toggle('triton-zoom');control.setAttribute('aria-pressed',on);control.textContent=on?'Fit screenshot to screen':'Make screenshot bigger';break;}
      case 'guide':guide=0;choose(STORY[0].target,true,true);break;
      case 'next':if(guide<STORY.length-1){guide++;choose(STORY[guide].target,true,true);}break;
      case 'previous':if(guide>0){guide--;choose(STORY[guide].target,true,true);}break;
      case 'again':if(selected?.id.startsWith('extra-')){selected.visits++;detail=false;paint();}else if(selected)choose(selected.id,false,guide>=0);break;
      case 'detail':if(selected){detail=!detail;paint();}break;
      case 'expand':$('#triton-pip').classList.remove('is-collapsed');break;
      case 'collapse':$('#triton-pip').classList.add('is-collapsed');window.speechSynthesis?.cancel();break;
    }
  });
  $('#triton-voice').checked=voice;
  $('#triton-voice').addEventListener('change',e=>{voice=e.target.checked;if(!voice)window.speechSynthesis?.cancel();else speak();});
}
function choose(id,scroll=false,inGuide=false){
  selected=selectTarget(id,repeats.get(id)||0);if(!selected)return;repeats.set(id,selected.visits);detail=false;
  if(!inGuide)guide=-1;
  if(inGuide && guide>=0)selected={...selected,...STORY[guide],id,visits:selected.visits};
  highlight();paint();
  if(scroll){const button=$('#triton-stage').querySelector(`[data-triton-target="${id}"]`);button?.scrollIntoView({block:'center',inline:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
}
function highlight(){
  root.querySelectorAll('[data-triton-target]').forEach(b=>{const on=b.dataset.tritonTarget===selected?.id;b.classList.toggle('is-selected',on);b.setAttribute('aria-pressed',on);});
}
function paint(){
  if(!selected||!root)return;
  $('#triton-pip').classList.remove('is-collapsed');$('#triton-pip-title').textContent=selected.title;
  $('#triton-explanation').innerHTML=`<p>${esc(detail?selected.text:selected.simple)}</p>${detail&&selected.math?`<div class="triton-math">${esc(selected.math)}</div>`:''}`;
  $('#triton-repeat-note').textContent=selected.visits>1?'Again? Of course. Tap as many times as you like.':'Tap any other bit, or ask me to say this again.';
  $('#triton-detail').textContent=detail?'Make it simpler':'Tell me a little more';
  $('#triton-guide').hidden=guide<0;
  if(guide>=0){$('#triton-step').textContent=(guide+1)+' / '+STORY.length;root.querySelector('[data-triton=previous]').disabled=guide===0;root.querySelector('[data-triton=next]').disabled=guide===STORY.length-1;}
  speak();
}
function speak(){if(!selected||!voice||!window.speechSynthesis)return;speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(detail?selected.text:selected.simple);utterance.lang='en-GB';utterance.rate=.9;speechSynthesis.speak(utterance);}
