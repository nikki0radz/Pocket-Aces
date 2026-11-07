const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = ['♠', '♥', '♦', '♣'];
const suitNames = ['spades', 'hearts', 'diamonds', 'clubs'];
const deck = suits.flatMap(suit => ranks.map(rank => rank + suit));
const storageKey = 'pocket-aces-spectator-v1';
const streetCounts = [0, 3, 4, 5];
const sampleBoard = ['8♦', 'K♣', '3♥', '4♠', 'J♦'];
const sampleNames = ['Maya', 'Leo', 'Ivy', 'Ben', 'Ava', 'Sam'];
const modes = ['example', 'stream'];

function emptyHand() {
  return {game:'holdem', seats:6, dealer:null, count:0, board:Array(5).fill(''), names:{}, hands:{}, pot:''};
}
function readHand() {
  try {
    const h = JSON.parse(localStorage.getItem(storageKey));
    if (!h || !Number.isInteger(h.seats) || h.seats < 2 || h.seats > 9 ||
        !Number.isInteger(h.count) || h.count < 0 || h.count > 5 ||
        !Array.isArray(h.board) || h.board.length !== 5) return emptyHand();
    return {...emptyHand(), ...h};
  } catch { return emptyHand(); }
}
export function seatRole(seat, dealer, seats) {
  if (!Number.isInteger(dealer)) return '';
  const offset = (seat - dealer + seats) % seats;
  if (offset === 0) return seats === 2 ? 'D / SB' : 'D';
  if (offset === 1) return seats === 2 ? 'BB' : 'SB';
  return offset === 2 ? 'BB' : '';
}
export function street(count) {
  return ['Pre-flop', 'Partial board', 'Partial board', 'Flop', 'Turn', 'River'][count];
}
const guide = {
  D: ['Dealer button · D / BTN', 'The button marks the dealer position for this hand, even when a professional dealer handles the cards. At a full table the next two players clockwise normally post the small and big blinds.'],
  SB: ['Small blind · SB', 'A forced starting bet, usually half the big blind. SB beside a name tells you who posted it. With just two players, the button posts the small blind.'],
  BB: ['Big blind · BB', 'BB beside a player’s name usually marks the big blind seat. “25 BB” beside their chip stack means they have 25 big blinds’ worth of chips. If the big blind is 2,000, that stack is 50,000 chips.'],
  stack: ['Stack', 'The chips a player still has in front of them. Chips already bet go towards the pot. A broadcast may show the stack in chips, thousands (K), or big blinds (BB).'],
  Fold: ['Fold', 'The player gives up this hand. Their cards may disappear or their seat may fade on the stream. Chips they already put in stay in the pot.'],
  Check: ['Check', 'The player passes the action without adding chips. They can do that when there is no outstanding bet for them to match.'],
  Bet: ['Bet', 'The first wager on this betting round. Watch for a chip amount to appear beside the player who bet.'],
  Call: ['Call', 'The player matches the outstanding bet, or goes all-in for less if their stack is too small. The hand continues.'],
  Raise: ['Raise', 'The player increases the amount to match. “Raise to 6,000” shows their total bet for this round.'],
  'All-in': ['All-in', 'The player has committed their remaining chips. They can still win the pot they contributed to, even if other players keep betting into a side pot.'],
  Ante: ['Ante', 'A forced contribution to the pot before the hand. In many tournaments the big blind posts an ante for the table as well as their own big blind.']
};
const sampleNotes = [
  'Maya holds A♠ J♥. Before the flop, only the blinds are in the pot.',
  'Ben put in 2,000. Maya raised to 4,000 and Ben matched it. The two blinds folded, leaving 11,000 in the pot. Neither of Maya’s card ranks matches the board yet.',
  'Maya bet 4,000 on the flop and Ben called. That added 8,000 to the pot. The new 4♠ is the turn.',
  'Both players checked the turn, so the pot stayed the same. The river J♦ gives Maya a pair of jacks with her J♥.'
];
const streetNotes = [
  'No shared cards have been dealt yet. Players look at their private cards and there is a first round of betting.',
  'The first three shared cards arrive together as the flop. If you can only see one, the graphic may be cropped or still updating.',
  'Two cards in the middle do not mark a Hold’em betting round. Look for a third shared card, or check whether the two cards sit beside one player’s name.',
  'These first three shared cards are called the flop. Everyone still in the hand can use them. Watch for a round of betting.',
  'The fourth shared card is the turn. It joins the three flop cards, then the players have another chance to bet.',
  'The fifth and final shared card is the river. After the last betting round, any players still in show their hands to decide the winner.'
];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const action = (type, value, label, cls = '') => `<button type="button" class="${cls}" data-watch="${type}" data-value="${esc(value)}">${label}</button>`;
let mode = 'example', step = 0, hand = readHand();
const isLive = () => mode === 'stream';
const holeCount = () => isLive() && hand.game === 'omaha' ? 4 : 2;
const activeCount = () => isLive() ? hand.count : streetCounts[step];
const save = () => { try {localStorage.setItem(storageKey, JSON.stringify(hand));} catch {} };
function nameAt(i) {return isLive() ? hand.names[i] || 'Seat ' + (i + 1) : sampleNames[i];}
function face(v) {
  if (!v) return '<span class="unknown-face">?</span>';
  const red = '♥♦'.includes(v.slice(-1));
  return `<span class="watch-face ${red?'warm':''}">${esc(v.slice(0,-1))}<b>${esc(v.slice(-1))}</b></span>`;
}
const cardName = v => v ? v.slice(0,-1) + ' of ' + suitNames[suits.indexOf(v.slice(-1))] : 'unknown card';
function seat(i, total) {
  const role = seatRole(i, isLive() ? hand.dealer : 0, total);
  const privateCards = isLive() ? hand.hands[i] || [] : i === 0 ? ['A♠', 'J♥'] : [];
  const mini = Array.from({length:holeCount()}, (_,j)=>privateCards[j] ? `<i>${esc(privateCards[j])}</i>` : '<i class="card-back"></i>').join('');
  return action('seat', i, `<span class="seat-minis" aria-hidden="true">${mini}</span><strong>${esc(nameAt(i))}</strong>${role ? `<span class="seat-role">${role}</span>` : ''}`, 'watch-seat');
}
function table() {
  const total = isLive() ? hand.seats : 6, split = Math.ceil(total/2);
  const row = arr => `<div class="watch-seats" style="--seats:${arr.length}">${arr.map(i=>seat(i,total)).join('')}</div>`;
  const positions = Array.from({length:total}, (_,i)=>i);
  const count = activeCount(), board = isLive() ? hand.board : sampleBoard;
  const slots = Array.from({length:5}, (_,i) => {
    const label = i < 3 ? 'Flop' : i === 3 ? 'Turn' : 'River';
    const value = i < count ? board[i] : '';
    return `<button class="board-slot ${i < count?'dealt':'waiting'}" data-watch="board" data-value="${i}" aria-label="${label}, card ${i+1}, ${i<count?cardName(value):'not showing'}">${i<count?face(value):'·'}</button>`;
  }).join('');
  const pot = isLive() ? hand.pot || 'Pot' : ['3,000','11,000','19,000','19,000'][step];
  return `<section class="watch-table" aria-label="Interactive poker table">${row(positions.slice(0,split))}<div class="watch-felt">${action('pot','',`<span aria-hidden="true">◉</span> ${esc(pot==='Pot'?pot:'Pot · '+pot)}`,'pot-token')}<div class="watch-board">${slots}<span class="flop-label">Flop</span><span>Turn</span><span>River</span></div></div>${row(positions.slice(split).reverse())}</section>`;
}
const opt = (v, label, current) => `<option value="${esc(v)}" ${v===current?'selected':''}>${esc(label)}</option>`;
function setup() {
  const game = [['holdem','Texas Hold’em'],['omaha','4-card Omaha'],['unsure','I’m not sure']].map(([v,l])=>opt(v,l,hand.game)).join('');
  return `<div class="watch-setup"><label>Game on screen<select data-setup="game">${game}</select></label><label>Players dealt in<select data-setup="seats">${Array.from({length:8},(_,i)=>opt(i+2,i+2,hand.seats)).join('')}</select></label><label>Cards in the middle<select data-setup="count">${Array.from({length:6},(_,i)=>opt(i,i,hand.count)).join('')}</select></label></div>`;
}
export function spectatorView() {
  const count = activeCount();
  return `<div class="watch-wrap"><button class="text-button" data-nav="learn">← Learn</button><div class="page-heading"><div><h1>Follow a table</h1><p>Tap the part of the table you’re looking at on screen.</p></div></div>
  <div class="watch-modes" aria-label="Table mode">${modes.map((m,i)=>`<button data-watch="mode" data-value="${m}" aria-pressed="${mode===m}">${['Example hand','Follow my stream'][i]}</button>`).join('')}</div>
  ${isLive()?setup():'<p class="watch-intro">A six-player Texas Hold’em hand. Follow Maya’s two cards as the shared cards arrive.</p>'}
  ${table()}
  <section class="watch-readout" aria-live="polite"><div class="watch-read-title"><h2>${street(count)}</h2><span>${count} shared ${count===1?'card':'cards'}</span></div><p>${isLive()&&hand.game==='unsure'?'If the stream is showing Hold’em or four-card Omaha, this is how to read the middle. ':''}${streetNotes[count]}</p>
  ${isLive()?'':`<p class="example-note">${sampleNotes[step]}</p><div class="watch-steps">${step?action('step',step-1,'← Back','secondary'):''}${action('step',(step+1)%4,step===3?'Replay hand ↺':'Deal the '+['flop','turn','river'][step]+' →','primary')}</div>`}</section>
  <div class="watch-help"><h2>What did you spot?</h2><div class="watch-chips">${action('two','','Two cards on screen')}${['D','SB','BB','stack','Ante','Fold','Check','Bet','Call','Raise','All-in'].map(k=>action('term',k,k==='stack'?'Stack':k)).join('')}</div></div>
  ${isLive()?action('new','','Start a new hand','text-button'):''}</div>`;
}
export function handleSpectator(button, {render, modal, closeModal}) {
  const type = button.dataset.watch, value = button.dataset.value, i = Number(value);
  const sheet = (title, body) => modal(`<div class="watch-sheet"><p class="eyebrow">PIP’S TABLE GUIDE</p><h2>${title}</h2>${body}</div>`);
  function refresh() {save();closeModal();render();}
  if (type === 'mode') {mode=value; render();return;}
  if (type === 'step') {step=i;render();return;}
  if (type === 'two') {
    sheet('Where are the two cards?',`<p>Card graphics can appear anywhere on a broadcast. See which label they belong to.</p>${action('where','seat','Beside one player’s name','secondary')}${action('where','middle','In the middle of the table','secondary')}`);return;
  }
  if (type === 'where') {
    const bySeat = value==='seat';
    sheet(bySeat?'That player’s hole cards':'Look for the shared board',`<p>${bySeat?'In Texas Hold’em each player has two private cards. A broadcast may show them to viewers. The other players cannot see them.':'The flop has three cards, the turn adds a fourth and the river adds a fifth. Seeing two central cards alone isn’t enough to identify the round. The graphic may be incomplete, or it may belong to one player.'}</p>`);return;
  }
  if (type === 'term') {const [title,note]=guide[value];sheet(title,`<p>${note}</p>`);return;}
  if (type === 'pot') {
    sheet('The pot',`<p>These are the chips the players are competing for in this hand. The pot grows as players put chips in. A number beside a player may be their bet or their remaining stack.</p>${isLive()?`<label>Pot as shown<input id="watch-pot" maxlength="18" placeholder="e.g. 42K or 12 BB" value="${esc(hand.pot)}"></label>${action('savepot','','Save pot','primary')}`:''}`);return;
  }
  if (type === 'savepot') {hand.pot=document.querySelector('#watch-pot').value.trim();refresh();return;}
  if (type === 'board') {
    const note = i<3?'This is one of the first three shared cards. The three together are the flop.':i===3?'This is the fourth shared card. It is called the turn.':'This is the fifth shared card. It is called the river.';
    sheet(i<3?'A flop card':i===3?'The turn':'The river',`<p>${note} All players still in the hand share it.</p>${isLive()?cardEditor('board',i):`<p>${i<activeCount()?'On this table it is the '+cardName(sampleBoard[i])+'.':'This card hasn’t been dealt in the example yet.'}</p>`}`);return;
  }
  if (type === 'seat') {
    const role = seatRole(i,isLive()?hand.dealer:0,isLive()?hand.seats:6);
    const holeText = isLive()&&hand.game==='omaha'?'In four-card Omaha this player has four private cards and must use exactly two with three shared cards.':isLive()&&hand.game==='unsure'?'Cards attached to this name belong to this player. Hold’em deals two private cards and four-card Omaha deals four. The stream may hide some or all of them.':'The two cards beside this name are this player’s private cards, called hole cards. A face-down card means its identity is hidden.';
    let body=`<p>${holeText}</p>${role?`<p><strong>${role}</strong> · ${role==='D / SB'?'The button posts the small blind when only two play.':guide[role][1]}</p>`:''}`;
    if (isLive()) {
      body+=`<label>Player name<input id="watch-name" maxlength="18" value="${esc(hand.names[i]||'')}" placeholder="e.g. Owen"></label>${action('saveseat',i,'Save name','secondary')}<div class="hole-edits">${Array.from({length:holeCount()},(_,j)=>action('hole',i+','+j,`Card ${j+1} · ${esc(hand.hands[i]?.[j]||'?')}`,'secondary')).join('')}</div>${action('dealer',i,'Put the dealer button here','primary')}<small>Blind labels assume all seats are occupied and the usual blind order applies.</small>`;
    } else if(i===0) body+='<p>Maya holds A♠ and J♥. She can use both, one or neither to make her best five-card hand.</p>';
    sheet(esc(nameAt(i)),body);return;
  }
  if (type === 'saveseat') {hand.names[i]=document.querySelector('#watch-name').value.trim();refresh();return;}
  if (type === 'dealer') {hand.dealer=i;refresh();return;}
  if (type === 'hole') {sheet('Copy a private card',cardEditor('hole',value));return;}
  if (type === 'savecard') {
    const [zone, a, b] = value.split(',');
    const chosen=document.querySelector('#watch-card').value;
    if(zone==='board') {hand.board[+a]=chosen; hand.count=Math.max(hand.count,+a+1);}
    else {(hand.hands[a]??=[])[+b]=chosen;}
    refresh();return;
  }
  if(type==='new') {sheet('Start the next hand?',`<p>Clear the cards, pot and button. Keep your player names and table setup.</p>${action('clear','','Start next hand','primary')}`);return;}
  if(type==='clear') {hand={...emptyHand(),seats:hand.seats,game:hand.game,names:hand.names};refresh();}
}
function cardEditor(zone, position) {
  const [a,b]=String(position).split(',');
  const current=zone==='board'?hand.board[+a]:hand.hands[a]?.[+b];
  const used=new Set([...hand.board,...Object.values(hand.hands).flat()]);
  const choices=deck.filter(v=>v===current||!used.has(v)).map(v=>opt(v,cardName(v)+'  '+v,current)).join('');
  return `<label>Card shown<select id="watch-card">${opt('','Unknown / can’t read it',current||'')}${choices}</select></label>${action('savecard',zone+','+position,'Show on my table','primary')}`;
}
export function updateSpectator(field, render) {
  const key=field.dataset.setup;
  if(key==='count') {hand.count=Number(field.value);hand.board.fill('',hand.count);}
  if(key==='seats') {
    hand.seats=Number(field.value);
    if(hand.dealer>=hand.seats) hand.dealer=null;
    for(const seat of Object.keys(hand.hands)) if(Number(seat)>=hand.seats) delete hand.hands[seat];
  }
  if(key==='game') {
    hand.game=field.value;
    if(holeCount()===2) Object.keys(hand.hands).forEach(s=>hand.hands[s]=hand.hands[s].slice(0,2));
  }
  save(); render();
}
