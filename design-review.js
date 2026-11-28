import {NOTES_KEY,readNotes,exportNotes,exportFilename,pageReference} from './design-notes.js';

let notes=[];try{notes=readNotes(JSON.parse(localStorage.getItem(NOTES_KEY)||'[]'));}catch{}
let active=false,dialog=null,previousFocus=null,storageOkay=true,oldOverflow='',oldRootOverflow='',pausedVideos=[],tabs=[];
const $=s=>document.querySelector(s);
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const button=(text,fn,cls='')=>{const n=el('button',cls,text);n.type='button';n.addEventListener('click',fn);return n;};
const bar=el('section','design-bar');bar.id='design-bar';bar.setAttribute('aria-label','Page design review');
const label=el('label','design-switch');const toggle=el('input');toggle.type='checkbox';toggle.setAttribute('role','switch');toggle.id='design-mode';label.append(toggle,el('span','design-switch-track'),el('strong','', 'Design mode'));
const help=el('span','design-bar-help','Freeze the page to leave notes.');
const listButton=button('',showList,'design-bar-button');const exportButton=button('Export JSON',download,'design-bar-button design-export');
bar.append(label,help,listButton,exportButton);document.body.prepend(bar);document.body.classList.add('has-design-bar');
const layer=el('div','design-layer');layer.id='design-layer';layer.hidden=true;layer.setAttribute('aria-label','Tap a place on the page to leave a design note');document.body.append(layer);
toggle.addEventListener('change',()=>setMode(toggle.checked));
layer.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(e.target.closest('.design-pin'))return;pick(e.clientX,e.clientY);});
layer.addEventListener('wheel',e=>e.preventDefault(),{passive:false});layer.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
window.addEventListener('hashchange',()=>{if(active)setMode(false);});
window.addEventListener('resize',drawPins);
window.addEventListener('pocket-aces-native',e=>{if(e.detail?.type==='design-export'){help.textContent=e.detail.saved?'JSON saved. Your notes are still here.':e.detail.cancelled?'Save cancelled. Your notes are still here.':'The JSON could not be saved. Your notes are still here.';exportButton.disabled=!notes.length;}});
document.addEventListener('keydown',e=>{
  if(dialog){
    if(e.key==='Escape'){e.preventDefault();closeDialog();return;}
    if(e.key==='Tab'){
      const items=[...dialog.querySelectorAll('button,input,textarea,a[href]')].filter(n=>!n.disabled);const first=items[0],last=items.at(-1);
      if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }
    return;
  }
  if(active&&!bar.contains(e.target)&&['Enter',' ','ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();}
  if(active&&e.key==='Escape'){e.preventDefault();setMode(false);toggle.focus();}
},true);

function refresh(){listButton.textContent='Notes ('+notes.length+')';exportButton.disabled=!notes.length;drawPins();}
function persist(){try{localStorage.setItem(NOTES_KEY,JSON.stringify(notes));storageOkay=true;}catch{storageOkay=false;}refresh();if(!storageOkay)help.textContent='Export before closing: notes could not be saved on this device.';}
function setMode(value){
  if(value===active)return;active=value;toggle.checked=value;document.body.classList.toggle('design-mode',value);
  if(value){
    window.dispatchEvent(new CustomEvent('pocket-aces-design-mode',{detail:{active:true}}));
    window.speechSynthesis?.cancel();
    oldOverflow=document.body.style.overflow;oldRootOverflow=document.documentElement.style.overflow;
    document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden';
    tabs=[...$('#app').querySelectorAll('button,a,input,select,textarea,summary,[tabindex],iframe')].map(node=>({node,tabindex:node.getAttribute('tabindex')}));
    tabs.forEach(({node})=>node.setAttribute('tabindex','-1'));
    pausedVideos=[...document.querySelectorAll('#app video')].filter(v=>!v.paused);pausedVideos.forEach(v=>v.pause());
    document.querySelectorAll('#app iframe').forEach(f=>{try{if(new URL(f.src).hostname==='www.youtube.com')f.contentWindow.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}),'https://www.youtube.com');}catch{}});
    layer.hidden=false;help.textContent='Page frozen. Tap anywhere to leave a note.';
  }else{
    layer.hidden=true;document.body.style.overflow=oldOverflow;document.documentElement.style.overflow=oldRootOverflow;
    tabs.forEach(({node,tabindex})=>{if(tabindex===null)node.removeAttribute('tabindex');else node.setAttribute('tabindex',tabindex);});tabs=[];
    pausedVideos.forEach(v=>{if(v.isConnected)v.play().catch(()=>{});});pausedVideos=[];
    window.dispatchEvent(new CustomEvent('pocket-aces-design-mode',{detail:{active:false}}));help.textContent='Freeze the page to leave notes.';
  }
  drawPins();
}
function cssPath(node){
  if(!node||node===document.body)return 'body';
  if(node.id)return '#'+CSS.escape(node.id);
  for(const key of ['data-triton-target','data-pip','data-action','data-watch','data-nav','data-lesson'])if(node.hasAttribute(key))return node.tagName.toLowerCase()+'['+key+'="'+CSS.escape(node.getAttribute(key))+'"]';
  const parts=[];let current=node;
  for(let i=0;i<6&&current?.parentElement;i++,current=current.parentElement){
    if(current.id){parts.unshift('#'+CSS.escape(current.id));break;}
    const siblings=[...current.parentElement.children].filter(n=>n.tagName===current.tagName);parts.unshift(current.tagName.toLowerCase()+':nth-of-type('+(siblings.indexOf(current)+1)+')');
  }
  return parts.join(' > ');
}
function pick(x,y){
  if(dialog)return;
  layer.style.pointerEvents='none';const raw=document.elementFromPoint(x,y);layer.style.pointerEvents='';
  if(!raw||bar.contains(raw)||raw.closest('.design-dialog-backdrop'))return;
  const node=raw.closest('button,a,input,select,textarea,summary,h1,h2,h3,p,li,img,.pip,.playing-card')||raw;
  const rect=node.getBoundingClientRect();
  const description=node.getAttribute('aria-label')||node.getAttribute('alt')||node.textContent.trim().replace(/\s+/g,' ').slice(0,180)||'This spot on the page';
  const draft={id:crypto.randomUUID(),createdAt:new Date().toISOString(),route:location.hash||'#home',page:pageReference(location),title:document.title,
    viewport:{width:innerWidth,height:innerHeight,scrollX,scrollY,devicePixelRatio},
    point:{clientX:x,clientY:y,pageX:x+scrollX,pageY:y+scrollY},
    target:{selector:cssPath(node),tag:node.tagName.toLowerCase(),label:description,rect:{x:rect.x+scrollX,y:rect.y+scrollY,width:rect.width,height:rect.height},relativeX:rect.width?(x-rect.x)/rect.width:0,relativeY:rect.height?(y-rect.y)/rect.height:0},note:''};
  edit(draft,false);
}
function openDialog(title){
  closeDialog();previousFocus=document.activeElement;
  const backdrop=el('div','design-dialog-backdrop');dialog=el('section','design-dialog');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label',title);dialog.tabIndex=-1;
  const heading=el('h2','',title);dialog.append(heading);backdrop.append(dialog);document.body.append(backdrop);return dialog;
}
function closeDialog(){if(dialog){dialog.parentElement.remove();dialog=null;previousFocus?.isConnected&&previousFocus.focus();previousFocus=null;}}
function edit(draft,existing){
  const sheet=openDialog(existing?'Edit design note':'Leave a design note');sheet.append(el('p','design-target-label',draft.target?.label||'This spot on the page'));
  const label=el('label','design-note-label','What would you like to change?');const field=el('textarea');field.maxLength=5000;field.rows=5;field.value=draft.note;field.placeholder='e.g. Make this bigger, move this left, change the colour…';label.append(field);sheet.append(label);
  const actions=el('div','design-dialog-actions');const cancel=button('Cancel',closeDialog,'design-neutral');
  const save=button('Save note',()=>{const text=field.value.trim();if(!text){field.focus();return;}const saved={...draft,note:text,updatedAt:new Date().toISOString()};if(existing)notes=notes.map(n=>n.id===saved.id?saved:n);else notes.push(saved);persist();closeDialog();},'design-save');
  save.disabled=!field.value.trim();field.addEventListener('input',()=>{save.disabled=!field.value.trim();});actions.append(cancel,save);sheet.append(actions);
  if(existing)sheet.append(button('Delete this note',()=>{notes=notes.filter(n=>n.id!==draft.id);persist();closeDialog();},'design-delete'));
  field.focus();
}
function showList(){
  const sheet=openDialog('Your design notes');sheet.append(el('p','',notes.length?'Tap a note to edit it. Export includes notes from every page.':'Turn on Design mode, then tap anything on the page to leave your first note.'));
  const list=el('div','design-note-list');notes.forEach((n,i)=>{
    const entry=button('',()=>edit(n,true),'design-note-entry');entry.append(el('strong','',String(i+1)+'. '+(n.target?.label||'Page note')),el('span','',n.note),el('small','',n.route));list.append(entry);
  });sheet.append(list,button('Close',closeDialog,'design-neutral'));sheet.focus();
}
function drawPins(){
  layer.replaceChildren();if(!active)return;
  notes.forEach((n,i)=>{if(n.route!==(location.hash||'#home'))return;
    let x=n.point.pageX-scrollX,y=n.point.pageY-scrollY;
    try{const target=document.querySelector(n.target?.selector);if(target){const r=target.getBoundingClientRect();if(r.width&&r.height){x=r.x+r.width*(n.target.relativeX??.5);y=r.y+r.height*(n.target.relativeY??.5);}}}catch{}
    const pin=button(String(i+1),e=>{e.stopPropagation();edit(n,true);},'design-pin');pin.setAttribute('aria-label','Edit note '+(i+1)+': '+n.note.slice(0,100));pin.style.left=x+'px';pin.style.top=y+'px';layer.append(pin);
  });
}
async function download(){
  if(!notes.length)return;
  const date=new Date(),data=JSON.stringify(exportNotes(notes,date),null,2),filename=exportFilename(date);
  if(window.PocketAcesAndroid?.exportDesignNotes){exportButton.disabled=true;help.textContent='Choose where to save your JSON.';window.PocketAcesAndroid.exportDesignNotes(data,filename);return;}
  const blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),link=el('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);help.textContent='JSON exported. Your notes are still here.';
}
refresh();
