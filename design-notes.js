export const NOTES_KEY='pocket-aces-design-notes-v1';
export function readNotes(value){
  if(!Array.isArray(value))return [];
  return value.filter(n=>n && typeof n.id==='string' && typeof n.note==='string' && n.note.trim() && typeof n.route==='string' && n.point && Number.isFinite(n.point.pageX) && Number.isFinite(n.point.pageY)).slice(-500);
}
export function exportNotes(notes,date=new Date()){
  return {schemaVersion:1,app:'Pocket Aces',appVersion:'0.3.2',exportedAt:date.toISOString(),notes:readNotes(notes)};
}
export function exportFilename(date=new Date()){
  return 'pocket-aces-design-notes-'+date.toISOString().replace(/[:.]/g,'-')+'.json';
}
export function pageReference(location){return location.origin+location.pathname+location.hash;}
