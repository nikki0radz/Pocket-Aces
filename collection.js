// Legacy rewards are used only when migrating already completed modules.
export const moduleRewards = Object.freeze({
  deck: 'A♠', red: 'A♥', black: 'A♣', read: 'A♦', ranks: '2♠',
  pair: '2♥', table: '2♣', streets: '2♦', actions: '3♠', compare: '3♥'
});
export const deckRanks = Object.freeze(['2','3','4','5','6','7','8','9','10','J','Q','K','A']);
export const fullDeck = Object.freeze(['♥','♦','♣','♠'].flatMap(suit=>deckRanks.map(rank=>rank+suit)));
export function awardCard(state,moduleId,random=Math.random){
  state.rewards??={};
  if(state.rewards[moduleId])return state.rewards[moduleId];
  const used=new Set(Object.values(state.rewards));
  let choices=fullDeck.filter(card=>!used.has(card));
  // Start with a number card. Face cards and aces join the pool after that.
  if(!used.size)choices=choices.filter(card=>/^([2-9]|10)/.test(card));
  if(!choices.length)return null;
  const value=Number(random());
  const index=Math.floor((Number.isFinite(value)?Math.max(0,Math.min(value,1-Number.EPSILON)):0)*choices.length);
  return state.rewards[moduleId]=choices[index];
}
export function restoreRewards(completed,saved){
  const rewards={},used=new Set();
  // Reserve valid saved cards before filling any missing or damaged entries.
  for(const id of completed){
    const card=saved?.[id];
    if(fullDeck.includes(card)&&!used.has(card)){rewards[id]=card;used.add(card);}
  }
  for(const id of completed){
    if(rewards[id])continue;
    const legacy=saved===undefined?moduleRewards[id]:null;
    if(legacy&&!used.has(legacy)){rewards[id]=legacy;used.add(legacy);}
    else{const card=awardCard({rewards},id);if(card)used.add(card);}
  }
  return rewards;
}
export function collectedCards(state) {
  return (state.completed||[]).map(moduleId=>({moduleId,card:state.rewards?.[moduleId]||moduleRewards[moduleId]})).filter(reward=>fullDeck.includes(reward.card));
}
export function cardName(card) {
  const rank=card.slice(0,-1), suit=card.slice(-1);
  return `${({A:'Ace',J:'Jack',Q:'Queen',K:'King'})[rank] || rank} of ${({ '♥':'hearts','♦':'diamonds','♣':'clubs','♠':'spades'})[suit]}`;
}
