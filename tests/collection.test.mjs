import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../data.js';
import {emptyState,normalizeState,markRead,recordAnswer} from '../engine.js';
import {fullDeck,moduleRewards,collectedCards,awardCard,restoreRewards} from '../collection.js';

test('the goal is a standard 52-card deck with unique, valid module rewards',()=>{
  assert.equal(fullDeck.length,52);
  assert.equal(new Set(fullDeck).size,52);
  const rewards=Object.values(moduleRewards);
  assert.equal(new Set(rewards).size,rewards.length);
  for(const l of lessons) assert.ok(fullDeck.includes(moduleRewards[l.id]));
});
test('only finishing every concept earns a card; replay and mistakes cannot duplicate it',()=>{
  const s=emptyState(), l=lessons[0];
  l.pages.forEach((_,i)=>markRead(s,l,i));
  recordAnswer(s,l,l.concepts[0].id,false);
  assert.equal(collectedCards(s).length,0);
  recordAnswer(s,l,l.concepts[0].id,true);
  assert.equal(collectedCards(s).length,0);
  for(const c of l.concepts) recordAnswer(s,l,c.id,true);
  const earned=collectedCards(s);
  assert.equal(earned.length,1);
  assert.equal(earned[0].moduleId,'deck');
  assert.ok(/^([2-9]|10)[♥♦♣♠]$/.test(earned[0].card));
  for(const c of l.concepts) recordAnswer(s,l,c.id,true);
  assert.equal(collectedCards(s).length,1);
  assert.deepEqual(collectedCards(s),earned);
  assert.deepEqual(collectedCards(normalizeState(JSON.parse(JSON.stringify(s)))),collectedCards(s));
});
test('rewards draw without replacement, start with a number card and stay fixed',()=>{
  const s=emptyState();let step=0;
  const random=()=>[0,.999999,.25,.7][step++%4];
  const first=awardCard(s,'first',random);
  assert.ok(/^([2-9]|10)[♥♦♣♠]$/.test(first));
  assert.equal(awardCard(s,'first',()=>.8),first);
  for(let i=1;i<52;i++)assert.ok(fullDeck.includes(awardCard(s,'module-'+i,random)));
  assert.equal(new Set(Object.values(s.rewards)).size,52);
  assert.equal(awardCard(s,'extra',random),null);
  assert.notEqual(awardCard(emptyState(),'first',()=>0),awardCard(emptyState(),'first',()=>.999999));
});
test('saved random cards and old aces survive migration; damaged entries cannot duplicate cards',()=>{
  const s=normalizeState({version:1,completed:['deck','red'],rewards:{deck:'7♥',red:'Q♣'}});
  assert.deepEqual(collectedCards(s).map(r=>r.card),['7♥','Q♣']);
  assert.deepEqual(normalizeState(JSON.parse(JSON.stringify(s))).rewards,s.rewards);
  const repaired=restoreRewards(['deck','red','black'],{deck:'7♥',red:'7♥',black:'not a card'});
  assert.equal(repaired.deck,'7♥');
  assert.equal(new Set(Object.values(repaired)).size,3);
  for(const value of Object.values(repaired))assert.ok(fullDeck.includes(value));
});
test('existing completions receive rewards; daily practice does not award cards; reset clears them',()=>{
  const old=normalizeState({version:1,completed:['deck','red']});
  assert.deepEqual(collectedCards(old).map(r=>r.card),['A♠','A♥']);
  old.daily['2026-11-05:black']=true;
  assert.equal(collectedCards(old).length,2);
  assert.equal(collectedCards(emptyState()).length,0);
});
