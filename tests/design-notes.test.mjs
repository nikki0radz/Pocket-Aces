import test from 'node:test';
import assert from 'node:assert/strict';
import {readNotes,exportNotes,exportFilename,pageReference} from '../design-notes.js';

test('JSON exports preserve notes across pages, exact targets and repeated edits',()=>{
  const date=new Date('2026-11-28T10:40:00Z');
  const notes=[{id:'one',note:'Make this bigger',route:'#screenshot',point:{pageX:85,pageY:400},target:{selector:'[data-triton-target="dan-checks-action"]',relativeX:.5,relativeY:.5}},{id:'two',note:'Move left',route:'#watch',point:{pageX:10,pageY:20}}];
  const result=JSON.parse(JSON.stringify(exportNotes(notes,date)));
  assert.equal(result.app,'Pocket Aces');assert.equal(result.schemaVersion,1);assert.deepEqual(result.notes,notes);
  assert.equal(exportFilename(date),'pocket-aces-design-notes-2026-11-28T10-40-00-000Z.json');
  assert.deepEqual(readNotes([null,{},...result.notes]),notes);
});
test('exported page links omit query parameters and damaged notes do not break recovery',()=>{
  assert.equal(pageReference({origin:'https://example.com',pathname:'/',search:'?token=private',hash:'#watch'}),'https://example.com/#watch');
  assert.deepEqual(readNotes([{id:'broken',note:'hello',route:'#home',point:{pageX:NaN,pageY:5}}]),[]);
  assert.deepEqual(readNotes(null),[]);
});
