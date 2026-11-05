// Stable rewards: existing module/card pairs must never change when adding lessons.
export const moduleRewards = Object.freeze({
  deck: 'A♠', red: 'A♥', black: 'A♣', read: 'A♦', ranks: '2♠',
  pair: '2♥', table: '2♣', streets: '2♦', actions: '3♠', compare: '3♥'
});
export const deckRanks = Object.freeze(['A','2','3','4','5','6','7','8','9','10','J','Q','K']);
export const fullDeck = Object.freeze(['♥','♦','♣','♠'].flatMap(suit=>deckRanks.map(rank=>rank+suit)));
export function collectedCards(state) {
  // Completion is the single saved source of truth. This also credits old progress.
  const completed = new Set(state.completed || []);
  return Object.entries(moduleRewards)
    .filter(([moduleId])=>completed.has(moduleId))
    .map(([moduleId,card])=>({moduleId,card}));
}
export function cardName(card) {
  const rank=card.slice(0,-1), suit=card.slice(-1);
  return `${({A:'Ace',J:'Jack',Q:'Queen',K:'King'})[rank] || rank} of ${({ '♥':'hearts','♦':'diamonds','♣':'clubs','♠':'spades'})[suit]}`;
}
