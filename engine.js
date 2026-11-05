import {lessons} from './data.js';
export const storageKey='pocket-aces-v1';
export const emptyState=()=>({version:1,completed:[],seen:{},mastery:{},attempts:{},daily:{},days:[],quietMotion:false});
export function normalizeState(raw){
 const s=emptyState(); if(!raw || raw.version!==1)return s;
 const list=Array.isArray(raw.completed)?raw.completed:[];
 // Only a contiguous sequence can be complete; discard inconsistent data safely.
 for(const l of lessons){if(list.includes(l.id))s.completed.push(l.id);else break;}
 for(const l of lessons){s.seen[l.id]=Math.max(0,Math.min(l.pages.length,Number(raw.seen?.[l.id])||0));s.mastery[l.id]=Array.isArray(raw.mastery?.[l.id])?l.concepts.filter(c=>raw.mastery[l.id].includes(c.id)).map(c=>c.id):[];}
 s.attempts=raw.attempts&&typeof raw.attempts==='object'?raw.attempts:{};
 s.daily=raw.daily&&typeof raw.daily==='object'?raw.daily:{};
 s.days=Array.isArray(raw.days)?[...new Set(raw.days.filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)))].slice(-365):[];
 s.quietMotion=raw.quietMotion===true;return s;
}
export const currentIndex=s=>Math.min(s.completed.length,lessons.length);
export const canOpen=(s,index)=>Number.isInteger(index)&&index>=0&&index<lessons.length&&index<=currentIndex(s);
export const isTaught=(s,l)=>(s.seen[l.id]||0)>=l.pages.length;
export function markRead(s,l,pageIndex){if(pageIndex===(s.seen[l.id]||0))s.seen[l.id]=pageIndex+1;}
export function recordAnswer(s,l,conceptId,correct){
 if(!isTaught(s,l)||!l.concepts.some(c=>c.id===conceptId))return false;
 const key=l.id+':'+conceptId;s.attempts[key]=(Number(s.attempts[key])||0)+1;
 s.mastery[l.id]??=[];if(correct&&!s.mastery[l.id].includes(conceptId))s.mastery[l.id].push(conceptId);
 if(l.concepts.every(c=>s.mastery[l.id].includes(c.id))&&lessons[currentIndex(s)]?.id===l.id){s.completed.push(l.id);return true;}return false;
}
export function nextQuestion(s,l){const c=l.concepts.find(x=>!s.mastery[l.id]?.includes(x.id));if(!c)return null;const attempt=Number(s.attempts[l.id+':'+c.id])||0;return {...c.variants[attempt%c.variants.length],conceptId:c.id};}
export function localDay(date=new Date()){const pad=n=>String(n).padStart(2,'0');return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;}
export function dailyQuestion(s,day=localDay()){
 const l=lessons[currentIndex(s)];if(!l||!isTaught(s,l))return null;
 const hash=[...day].reduce((a,c)=>a+c.charCodeAt(0),0);const c=l.concepts[hash%l.concepts.length];
 return {lesson:l,question:{...c.variants[hash%c.variants.length],conceptId:c.id},key:day+':'+l.id,day};
}
export function celebrateDay(s,day=localDay()){if(!s.days.includes(day))s.days.push(day);}
