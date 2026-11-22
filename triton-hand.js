// A transcription of Nicole's supplied screenshot, not a live tournament feed.
// Rules reference: https://www.pokerstars.com/poker/learn/lesson/3-betting/
export const CROP={x:29,y:175,width:651,height:1231,imageWidth:709,imageHeight:1536};
const explanation=(title,text,simple,math='')=>({title,text,simple,math});
const round='One hand means one round of poker: cards are dealt, the players make their moves, and somebody wins the chips in the middle.';
const positions={
  BB:explanation('BB beside Dan’s name','Dan has the big-blind seat for this round. That means he had to put in the bigger required starting payment: 1,000 chips. The BB label stays beside his name for the whole round, even when he later bets a different amount.','BB here tells you Dan’s seat. His required starting payment was 1,000 chips.'),
  SB:explanation('SB beside Linus’s name','Linus has the small-blind seat for this round. He must start by putting 500 chips in the middle—half of the 1,000 big blind. This label tells you his seat; it does not mean he keeps paying 500 on every line.','Linus had to put 500 chips in to start. SB is the label for that seat.'),
  D:explanation('D beside Owen’s name','D marks Owen’s dealer-button seat for this round. A marker moves around the players between rounds to decide the turn order and who must pay the starting chips. A professional dealer can still deal the cards. D does not mean Owen is winning.','D is a seat marker. It helps decide whose turn comes when. It does not mean Owen is dealing the cards himself.')
};

export const ROWS=[
  {id:'ante',y:355,name:'Dan Dvoress',position:'BB',stack:'247K',action:'Ante',amount:'1K',
    text:'Before the players make their choices, Dan puts 1,000 chips into the middle as a required starting payment. This is called an ante. It is separate from his big-blind payment, so it does not count towards matching another player’s bet.',simple:'Dan has to put 1,000 chips in the middle before the round gets going.'},
  {id:'small-blind',y:423,name:'Linus Loeliger',position:'SB',stack:'240K',action:'SB',amount:'500',
    text:'Linus puts 500 chips in the middle because he has the small-blind seat. This is a required starting payment, not a bet he chose because he liked his cards.',simple:'Linus must put 500 chips in to start this round.'},
  {id:'big-blind',y:487,name:'Dan Dvoress',position:'BB',stack:'247K',action:'BB',amount:'1K',
    text:'Dan puts in the bigger required starting payment: 1,000 chips. That sets the starting amount other players need to match to keep playing. This payment is called the big blind. His separate 1,000-chip ante is extra.',simple:'Dan must put 1,000 chips in to start. Other players need to match this amount to stay in.'},
  {id:'owen-opens',y:552,name:'Owen Messere',position:'D',stack:'258K',action:'Raise',amount:'2.5K',
    text:'Owen increases the amount needed to keep playing from 1,000 to 2,500 chips. Increasing it is called raising. A player who wants to continue must now match 2,500 in total, put in more, or give up this round.',simple:'Owen makes the price to stay in this round 2,500 chips.',math:'2.5K = 2,500 chips. This is the new total to match, not 2,500 on top of 1,000.'},
  {id:'linus-folds',y:617,name:'Linus Loeliger',position:'SB',stack:'240K',action:'Fold',amount:'',
    text:'Linus gives up this round. That is called folding. He cannot win the chips in the middle now, and his 500 starting chips stay there. This does not mean he is out of the tournament—he can play the next round.',simple:'Linus stops playing this round. He leaves his 500 chips in the middle.'},
  {id:'dan-reraises',y:682,name:'Dan Dvoress',position:'BB',stack:'232K',action:'3-bet',amount:'16K',
    text:'Owen asked for 2,500. Dan pushes the total up again, to 16,000 chips. Owen now has to match that total to stay in. This second increase is called a 3-bet: the starting big blind counts as the first bet. It does not mean “bet three chips” or “multiply by three”.',simple:'Dan makes it more expensive again: 16,000 chips in total to stay in.',math:'Dan already put in 1,000 as his big blind. He adds 15,000 to bring that contribution to 16,000. His ante is separate.'},
  {id:'owen-calls',y:747,name:'Owen Messere',position:'D',stack:'245K',action:'Call',amount:'16K',
    text:'Owen matches Dan’s 16,000-chip total so he can keep playing. Matching the amount is called calling. Owen already put in 2,500, so he adds another 13,500—not a fresh 16,000.',simple:'Owen pays enough to catch up with Dan. They have now each put in 16,000 for these bets.',math:'16,000 − 2,500 = 13,500 more from Owen.'},
  {id:'dan-bets-flop',y:901,name:'Dan Dvoress',position:'BB',stack:'222K',action:'Bet',amount:'10K',
    text:'Three shared cards have appeared in the middle. Dan now puts in 10,000 more chips. Owen must match that amount to keep playing, put in more, or give up. The 16,000 they each paid earlier belongs to the previous stage; this new set of bets starts from zero.',simple:'Dan puts in 10,000 new chips. Owen now needs to match him or give up.'},
  {id:'owen-raises-flop',y:966,name:'Owen Messere',position:'D',stack:'210K',action:'Raise',amount:'35K',
    text:'Dan put in 10,000. Owen makes the amount for this stage 35,000 instead, and puts in those chips. Dan has to catch up to 35,000 if he wants to continue. Owen is asking for 35,000 in total, not 35,000 on top of Dan’s 10,000.',simple:'Owen makes the price bigger: 35,000 chips for this stage.'},
  {id:'dan-calls-flop',y:1031,name:'Dan Dvoress',position:'BB',stack:'197K',action:'Call',amount:'35K',
    text:'Dan matches Owen’s 35,000-chip total. Dan already put in 10,000 at this stage, so he adds only 25,000 more. That is why his chips left drop from 222K to 197K. “Call 35K” does not mean he puts in another 35,000.',simple:'Dan adds 25,000 more. That brings his total for this stage up to Owen’s 35,000.',math:'35,000 − 10,000 = 25,000 more. 222,000 − 25,000 = 197,000 left.'},
  {id:'dan-checks',y:1183,name:'Dan Dvoress',position:'BB',stack:'197K',action:'Check',amount:'',
    text:'The fourth shared card has appeared. Dan chooses not to put in any new chips yet. This is called checking. Nobody has bet at this new stage yet, so he is allowed to wait and stay in the round. He has not given up.',simple:'Dan adds nothing and stays in. He lets Owen have a turn.'},
  {id:'owen-bets-turn',y:1248,name:'Owen Messere',position:'D',stack:'135K',action:'Bet',amount:'75K',
    text:'Owen puts in 75,000 more chips. Dan would need to match 75,000 to keep playing, put in more, or give up. Dan gives up on the next line, so Owen gets this unmatched 75,000 back as well as winning the pile already in the middle.',simple:'Owen asks Dan to pay 75,000 to continue. Dan chooses to stop instead.',math:'Owen’s displayed chips fall from about 210K to 135K while his 75K is out in front. Because Dan does not match it, that 75K comes back.'},
  {id:'dan-folds',y:1313,name:'Dan Dvoress',position:'BB',stack:'197K',action:'Fold',amount:'',
    text:'Dan gives up this round instead of matching Owen’s 75,000. Owen is the only player left, so he wins the chips in the middle without needing to show better cards. We cannot tell from this picture whether Owen had strong cards or was bluffing.',simple:'Dan stops. Owen is the last player still in, so Owen wins this round.'}
];

const flop=explanation('The first three shared cards','These cards are 5 of hearts, king of diamonds and 9 of clubs. Both Owen and Dan may use these cards together with their own two cards to make their best group of five. These first three shared cards are called the flop. Their own two cards are not shown in this screenshot.','The three cards in the middle belong to everybody still playing. Both players can use them.');
const turn=explanation('A fourth shared card','The 6 of clubs has joined the three cards in the middle. Both remaining players can use all four shared cards. This fourth card is called the turn. After it appears, the players get another chance to put chips in or give up.','One more shared card has arrived: a 6. Both players are allowed to use it.');

export const STORY=[
  {target:'header-profit',...explanation('Owen wins this one','This is a record of one finished round. Read the moves from top to bottom. Owen ends up winning because Dan gives up. The green +53K means Owen gained about 53,000 chips overall in this round—not £53,000.','Owen won this round. He finished with about 53,000 more chips than he had before.')},
  ...ROWS.slice(0,7).map(r=>({target:r.id+'-action',...explanation(r.name.split(' ')[0]+' · '+r.action,r.text,r.simple,r.math)})),
  {target:'flop-card-0',...flop},
  ...ROWS.slice(7,10).map(r=>({target:r.id+'-action',...explanation(r.name.split(' ')[0]+' · '+r.action,r.text,r.simple,r.math)})),
  {target:'turn-card-3',...turn},
  ...ROWS.slice(10).map(r=>({target:r.id+'-action',...explanation(r.name.split(' ')[0]+' · '+r.action,r.text,r.simple,r.math)})),
  {target:'header-final',...explanation('The result at the top','Owen finishes with about 313,000 chips. His gain for this round is about 53,000. The 104,000 pile included his own chips, so winning that pile is different from making 104,000 profit. His final unmatched 75,000 bet is returned to him.','Owen has about 313,000 chips now. About 53,000 of those are new chips he gained in this round.')}
];

export const TARGETS=[];
function target(id,label,x,y,w,h,info,story=0){TARGETS.push({id,label,x,y,w,h,...info,story});}
target('header-pot','104BB pot',55,188,151,37,explanation('104BB pot','The pot is the pile of chips the players are trying to win. Here it grew to about 104,000 chips. “104BB” measures that pile using the 1,000-chip big blind as a unit. It does not mean 104 players or £104.','This round had about 104,000 chips in the middle to win.','104 × 1,000 = 104,000 chips. The display rounds the amounts.'));
target('header-table','Table 2',210,188,171,37,explanation('Table 2','This hand happened at the poker table labelled number 2. A tournament can have many tables playing at once. This is a table number, not Owen’s finishing place.','This game happened at table number 2.'));
target('header-time','18m ago',503,188,128,37,explanation('18 minutes ago','When you took the screenshot, this item was labelled 18 minutes old. You are looking at an earlier hand’s record, not necessarily the move happening on the live stream right now.','This round happened earlier. It was not necessarily happening at the exact moment of your screenshot.'));
target('header-chevron','Collapse arrow',633,188,39,37,explanation('The little arrow','On Triton’s page, this arrow opens or closes the list of moves for the hand. It is a page control, not a poker symbol. Here we keep the list open so you can tap every part.','This arrow is just for opening or closing the list.'));
target('header-photo','Owen’s player photo',58,240,91,91,explanation('Owen’s photo','This player photo belongs to the winner named beside it: Owen Messere. The detailed rows below also show the other players who took part in this round.','This is the photo for Owen’s player profile.'));
target('header-flag','United Kingdom flag',128,304,30,30,explanation('The little flag','This is the United Kingdom flag displayed on Owen’s player profile. It is a profile detail; it changes nothing about his cards or the result of this round.','That flag is a profile detail, not a poker rule.'));
target('header-player','Owen Messere',172,261,170,43,explanation('Owen Messere','This is Owen’s name. He is the player whose result this card summarises. The repeated lines with his name below show what the same Owen did at different moments.','That’s Owen. Each later line with his name is another move he made.'));
target('header-position','Owen’s D marker',344,262,48,41,positions.D);
target('header-profit','+53K',578,248,85,39,STORY[0]);
target('header-final','313K',586,288,77,38,STORY.at(-1),STORY.length-1);

ROWS.forEach((r,i)=>{
  const step=STORY.findIndex(s=>s.target===r.id+'-action');
  const end=r.name.startsWith('Dan')?205:r.name.startsWith('Linus')?220:228;
  target(r.id+'-name',r.name+' on the '+r.action+' row',57,r.y,end-57,61,explanation('Whose turn is this?','This line records '+r.name+' making a move. Read the lines from top to bottom. Seeing the same name again means the same player is taking another turn, not a new player joining the table.','On this line, '+r.name.split(' ')[0]+' is the person making the move.'),step);
  target(r.id+'-position',r.position+' beside '+r.name+' on the '+r.action+' row',end+1,r.y,278-end,61,positions[r.position],step);
  const amount=Number(r.stack.slice(0,-1))*1000;
  target(r.id+'-stack',r.stack+' chips left beside '+r.name,305,r.y,83,61,explanation(r.stack+' · chips left',r.stack+' means about '+amount.toLocaleString('en-GB')+' chips. This column shows '+r.name.split(' ')[0]+'’s remaining chips at this point in the record. The amount for the move itself is in the far-right column. K after a chip number means thousand; a K on a playing card means king.','This is about '+amount.toLocaleString('en-GB')+' chips '+r.name.split(' ')[0]+' has left—not the amount of this bet.'),step);
  target(r.id+'-action',r.name+' · '+r.action,408,r.y,159,61,explanation(r.name.split(' ')[0]+' · '+r.action,r.text,r.simple,r.math),step);
  if(r.amount)target(r.id+'-amount',r.amount+' for '+r.name+'’s '+r.action,577,r.y,89,61,explanation(r.amount+' · this move',r.text,r.simple,r.math),step);
});

function potTargets(prefix,y,amount,bbs,stage,story){
  target(prefix+'-word','Pot label before the '+stage,57,y,53,66,explanation('Pot = the chips in the middle','All the chips the players have put into this round form a pile in the middle. That pile is called the pot. A player can win it with the strongest cards at the end—or by being the last player who has not given up.','The pot is the pile of chips they are trying to win.'),story);
  target(prefix+'-amount',amount+' chips in the middle',108,y,52,66,explanation(amount+' · the whole pile','At this point, the chips in the middle add up to about '+(Number(amount.slice(0,-1))*1000).toLocaleString('en-GB')+' chips. This includes Owen’s own chips as well as other players’ chips. It is not his remaining chips or his profit.','This is the total prize pile in the middle right now. The K means thousand.'),story);
  target(prefix+'-bbs',bbs+' BBs as a chip measurement',160,y,119,66,explanation(bbs+' BBs · a measuring unit','Here BBs is a way of measuring a pile of chips. One big blind in this round is 1,000 chips. So '+bbs+' big blinds means about '+(Number(bbs)*1000).toLocaleString('en-GB')+' chips. Beside Dan’s name, BB labels his seat. Here, after a number, it measures an amount.','Here BBs measures chips. '+bbs+' BBs means about '+(Number(bbs)*1000).toLocaleString('en-GB')+' chips.','1 BB = 1,000 chips in this hand. '+bbs+' × 1,000 = '+(Number(bbs)*1000).toLocaleString('en-GB')+'.'),story);
}
potTargets('flop-pot',819,'34K','34','first three shared cards',8);
potTargets('turn-pot',1101,'104K','104','fourth shared card',12);
const cardXs=[444,485,528,571,612];
function cardTargets(prefix,y,visible,story){
  const cards=[['5♥','5 of hearts','5','hearts'],['K♦','King of diamonds','king','diamonds'],['9♣','9 of clubs','9','clubs'],['6♣','6 of clubs','6','clubs']];
  for(let i=0;i<5;i++){
    if(i<visible){const [symbol,name,rank,suit]=cards[i];target(prefix+'-card-'+i,name+' among the shared cards',cardXs[i],y,39,58,explanation(symbol+' · '+name,(prefix==='turn'&&i===3?'This is the new fourth shared card. ':'This is one of the shared cards in the middle. ')+'The '+(rank==='king'?'K means king':rank+' tells you the card’s number')+'. The '+symbol.slice(-1)+' symbol means '+suit+', one of the four card families called suits. Both Owen and Dan may use this card with their own two cards. '+(rank==='king'?'K on a card means king, not thousand.':'The suit does not make this card stronger just because it is red or black.'),'This is a '+rank+' from the '+suit+' family. Both players can use it.'),story);}
    else target(prefix+'-card-'+i,(i===3?'Fourth':'Fifth')+' shared card not revealed',cardXs[i],y,39,58,explanation('A card that has not appeared yet','This card back is a placeholder for a shared card that has not been revealed at this point. It is not a card in Owen’s or Dan’s own hand. '+(i===4&&prefix==='turn'?'Dan gives up before the last shared card is needed, so no fifth card is shown in this record.':'The next shared card will appear here if the round continues.'),'This shared card is not showing yet. We cannot know what it is.'),story);
  }
}
cardTargets('flop',826,3,8);cardTargets('turn',1109,4,12);

export const EXTRA={
  order:explanation('Read it from top to bottom','The top panel is the result. Under that, the moves run from the beginning of the round to the end. The same names repeat because the players take more turns. Rows with cards show when new shared cards appeared. '+round,'Start at the first move under Owen’s result, then read down.'),
  colours:explanation('The dots and faded text','The dot is a visual marker beside an action. Green appears beside bets, raises and calls here. Yellow appears beside required starting payments and “Check”. Green does not automatically mean a player won or made a good move. Read the word beside the dot. Faded rows still count, and you can tap them here.','The colours help you spot the action words. They are not a score for how well somebody played.'),
  totals:explanation('Why winning 104K is not gaining 104K','Owen had already put 16,000 + 35,000 = 51,000 chips into the earlier pile. Winning that pile returns his own chips too. The listed contributions from the other players are Dan’s 51,000 plus his 1,000 ante, and Linus’s 500. That is 52,500 gained, displayed as about +53K. Owen’s final unmatched 75,000 also comes back.','Part of the prize pile was Owen’s own chips coming back. He gained about 53,000 new chips.','Earlier pile: 16,000 + 16,000 + 1,000 + 500 + 35,000 + 35,000 = 103,500, displayed as 104K. Other players’ chips: 52,500, displayed as +53K.'),
  private:explanation('Where are Owen’s own cards?','This screenshot does not show either player’s own two cards. The cards beside the pot are shared cards. We know Owen won because Dan gave up, but we cannot work out Owen’s cards or say whether he was bluffing from this picture.','We cannot see Owen’s own cards here. We only see the shared cards and the moves.'),
  chips:explanation('Chips, not pounds','These numbers count tournament chips. They are used to play the tournament; they are not a direct pound or dollar balance. Winning 53K chips in this round does not mean being paid £53,000 or being 53K ahead across the whole tournament.','These are playing chips, not pounds. +53K describes just this round.')
};

export function findTarget(id){return TARGETS.find(t=>t.id===id);}
// Pure selection: repeat clicks always return a fresh explanation; nothing is consumed.
export function selectTarget(id,taps=0){const t=findTarget(id);return t?{...t,visits:taps+1}:null;}
