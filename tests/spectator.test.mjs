import test from 'node:test';
import assert from 'node:assert/strict';
import {seatRole, street, spectatorView, handleSpectator, updateSpectator} from '../spectator.js';

test('button and blinds wrap around the table, including heads-up', () => {
  assert.deepEqual([0,1,2,3,4,5].map(seat => seatRole(seat,5,6)), ['SB','BB','','','','D']);
  assert.deepEqual([0,1].map(seat => seatRole(seat,1,2)), ['BB','D / SB']);
  assert.equal(seatRole(0,null,6),'');
});

test('partial board observations do not identify a betting round', () => {
  assert.deepEqual([0,1,2,3,4,5].map(street), ['Pre-flop','Partial board','Partial board','Flop','Turn','River']);
});

test('observer can copy a private card and a river, avoid duplicates, and clear the next hand', () => {
  let sheet;
  const context = {render(){},closeModal(){},modal(html){sheet=html;}};
  const press = (watch,value='') => handleSpectator({dataset:{watch,value}}, context);
  const input = {value:''};
  globalThis.document={querySelector:()=>input};
  const stored = new Map();
  globalThis.localStorage={setItem:(k,v)=>stored.set(k,v)};
  press('mode','stream');
  press('seat','0');
  input.value='Owen';
  press('saveseat','0');
  press('dealer','0');
  press('hole','0,0');
  input.value='A♠';
  press('savecard','hole,0,0');
  press('board','4');
  assert.doesNotMatch(sheet,/value="A♠"/);
  input.value='J♦';
  press('savecard','board,4');
  assert.match(spectatorView(),/J of diamonds/);
  assert.match(spectatorView(),/5 shared cards/);
  updateSpectator({dataset:{setup:'count'},value:'2'},context.render);
  assert.match(spectatorView(),/Partial board/);
  press('new');
  assert.match(sheet,/Start the next hand/);
  press('clear');
  const fresh=JSON.parse([...stored.values()][0]);
  assert.equal(fresh.count,0);
  assert.deepEqual(fresh.hands,{});
  assert.equal(fresh.names[0],'Owen');
  assert.equal(fresh.dealer,null);
  delete globalThis.document;
  delete globalThis.localStorage;
});
