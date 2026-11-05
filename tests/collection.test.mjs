import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../data.js';
import {emptyState,normalizeState,markRead,recordAnswer} from '../engine.js';
import {fullDeck,moduleRewards,collectedCards} from '../collection.js';

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
  assert.deepEqual(collectedCards(s),[{moduleId:'deck',card:'A♠'}]);
  for(const c of l.concepts) recordAnswer(s,l,c.id,true);
  assert.equal(collectedCards(s).length,1);
  assert.deepEqual(collectedCards(normalizeState(JSON.parse(JSON.stringify(s)))),collectedCards(s));
});
test('existing completions receive rewards; daily practice does not award cards; reset clears them',()=>{
  const old=normalizeState({version:1,completed:['deck','red']});
  assert.deepEqual(collectedCards(old).map(r=>r.card),['A♠','A♥']);
  old.daily['2026-11-05:black']=true;
  assert.equal(collectedCards(old).length,2);
  assert.equal(collectedCards(emptyState()).length,0);
});
