import test from 'node:test';
import assert from 'node:assert/strict';
import {CROP,TARGETS,ROWS,STORY,EXTRA,findTarget,selectTarget} from '../triton-hand.js';

test('every screenshot hotspot is uniquely labelled, in bounds and explains itself',()=>{
  assert.ok(TARGETS.length>75);
  assert.equal(new Set(TARGETS.map(t=>t.id)).size,TARGETS.length);
  for(const t of TARGETS){
    assert.ok(t.label&&t.title&&t.text&&t.simple,t.id);
    assert.ok(t.x>=CROP.x&&t.y>=CROP.y,t.id);
    assert.ok(t.x+t.w<=CROP.x+CROP.width&&t.y+t.h<=CROP.y+CROP.height,t.id);
  }
});
test('all repeated BB/SB/D labels remain separate tappable explanations forever',()=>{
  for(const row of ROWS){
    const id=row.id+'-position';
    const first=selectTarget(id),again=selectTarget(id,first.visits),third=selectTarget(id,again.visits);
    assert.equal(third.visits,3);assert.equal(third.text,first.text);
    assert.match(first.simple,/seat|starting|marker/i);
    assert.ok(findTarget(row.id+'-name'));
    assert.ok(findTarget(row.id+'-stack'));
    assert.ok(findTarget(row.id+'-action'));
    if(row.amount)assert.ok(findTarget(row.id+'-amount'));
  }
  assert.equal(selectTarget('missing'),null);
  assert.match(findTarget('turn-pot-bbs').text,/measures an amount/);
  assert.notEqual(findTarget('turn-pot-bbs').simple,findTarget('dan-folds-position').simple);
});
test('ordered walkthrough covers the exact displayed cards and ends with the result',()=>{
  assert.equal(STORY.length,17);
  for(const step of STORY)assert.ok(findTarget(step.target),step.target);
  assert.match(findTarget('flop-card-0').title,/5♥/);
  assert.match(findTarget('flop-card-1').title,/K♦/);
  assert.match(findTarget('flop-card-2').title,/9♣/);
  assert.match(findTarget('turn-card-3').title,/6♣/);
  assert.match(findTarget('turn-card-4').text,/no fifth card/);
  assert.match(EXTRA.private.text,/cannot work out Owen’s cards/);
});
test('bet totals, additional chips, rounded pot and profit are distinguished',()=>{
  assert.match(findTarget('dan-calls-flop-amount').math,/35,000 − 10,000 = 25,000/);
  assert.match(findTarget('owen-calls-amount').math,/13,500/);
  const pile=16000+16000+1000+500+35000+35000;
  const own=16000+35000;
  assert.equal(pile,103500);assert.equal(pile-own,52500);
  assert.match(EXTRA.totals.math,/103,500.*104K.*52,500.*53K/);
  assert.match(findTarget('owen-bets-turn-action').text,/unmatched 75,000 back/);
  assert.match(findTarget('header-profit').text,/not £53,000/);
});
