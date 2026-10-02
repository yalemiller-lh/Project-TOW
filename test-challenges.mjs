import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

// Challenges (core rules: Issuing, Accepting, Refusing a Challenge, Nowhere to Run, Fighting a
// Challenge, Overkill, To The Death!, Champions in Combat).
const test=(name,fn)=>{fn();console.log('PASS '+name);};
const clearExcept=(s,keep)=>{for(const p of G.allPieces(s))if(!keep.includes(p.id)){p.x=null;p.y=null;}};
// No armour worth the name (an effect worsening it by 4), so every wound of a 4 goes through.
const bare=(s,u)=>G.addEffect(s,[u],{spell:'test',armour:4,stack:'test',expiry:{kind:'END_CURRENT_PLAYER_TURN',at:'9:ash'}});
// Chaos Dwarf Warriors A1 and State Troops I1 front to front, both with full command, Red's turn.
function fight(keep=[]){const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'ash'});for(const u of s.units)u.charge=null;clearExcept(s,['A1','I1',...keep]);const a=G.getUnit(s,'A1'),e=G.getUnit(s,'I1');Object.assign(a,{x:30,y:30,heading:0});Object.assign(e,{x:30,y:30-G.size(a).h/2-G.size(e).h/2,heading:180});a.engaged=['I1'];e.engaged=['A1'];Object.assign(s,{stage:'combat',team:'ash'});return {s,a,e};}

test('the active player may issue a challenge first, with a champion in the fighting rank; then the other player',()=>{
 const {s}=fight();G.beginCombat(s,'A1');const ch=s.combatSession.challenge;assert.equal(G.challengePending(s),true);assert.equal(ch.team,'ash');
 assert.deepEqual(G.challengeCandidates(s,'ash'),['A1:C']);assert.deepEqual(G.challengeCandidates(s,'iron'),['I1:C']);
 assert.throws(()=>G.issueChallenge(s,'iron','I1:C'),/first/);G.issueChallenge(s,'ash',null);assert.equal(ch.team,'iron','declined: the other player may');G.issueChallenge(s,'iron',null);assert.equal(G.challengePending(s),false);assert.equal(ch.stage,'none');
});
test('an accepted challenge: the two fight only each other; a slain champion is replaced by a rank and file model',()=>{
 const {s,a,e}=fight();bare(s,e);G.beginCombat(s,'A1');G.issueChallenge(s,'ash','A1:C');G.answerChallenge(s,'I1:C');assert.equal(s.combatSession.challenge.stage,'fight');
 const before=G.aliveCount(e);while(s.combatSession.phase==='attacks')G.fightCombatStep(s,()=>.5);const duels=s.combatSession.stages.filter(st=>st.duel);
 assert.ok(duels.some(st=>st.from==='A1'&&st.duel.to==='I1:C'),'the challenger strikes the champion it challenged');assert.ok(duels.find(st=>st.from==='A1').attacks===G.championProfile(a).A,'with its own Attacks only');
 assert.equal(G.commandAlive(e,'C'),false,'the Sergeant is slain');assert.equal(G.commandAlive(e,'S'),true,'its place is taken: the standard stays');
 assert.equal(s.combatSession.stages.filter(st=>!st.duel&&st.from==='A1').reduce((n,st)=>n+st.attacks,0),G.modelSquares(s,a).filter(m=>m.fighting&&!m.dead&&m.command!=='C').length,'the rest of the unit fights on, without its champion');
 assert.ok(G.aliveCount(e)<before);G.compareCombat(s);assert.equal(s.lastCombat.score.ash.overkill,0,'Overkill is a character\'s');
});
test('a refused challenge: the challenger names one that could have accepted; it retires, giving and taking no attacks and lending no Leadership',()=>{
 const {s,e}=fight();G.beginCombat(s,'A1');G.issueChallenge(s,'ash','A1:C');assert.equal(G.canRefuseChallenge(s),true);G.answerChallenge(s,null);
 assert.equal(s.combatSession.challenge.stage,'nominate');assert.equal(s.combatSession.challenge.team,'ash','the challenger\'s player names it');G.nominateRetiree(s,'I1:C');assert.ok(e.championRetired);
 assert.ok(!G.attackAllocation(s,e,0).get('A1')?.some(m=>m.command==='C'),'the retired champion makes no attacks');
 e.effects=[];assert.equal(G.leadership(e,'normal',s),7,'its Leadership is not lent');
});
test('Nowhere to Run: a lone character cannot refuse; a character\'s kill with wounds to spare is Overkill (at most +5)',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'ash'});for(const u of s.units)u.charge=null;clearExcept(s,['A6','I1']);const w=G.getUnit(s,'A6'),e=G.getUnit(s,'I1');
 Object.assign(e,{x:30,y:20,heading:180});Object.assign(w,{x:30+G.size(e).w/2-G.size(w).w*1.5,y:20+G.size(e).h/2+G.size(w).h/2,heading:0});w.engaged=['I1'];e.engaged=['A6'];Object.assign(s,{stage:'combat',team:'iron'});bare(s,e);
 G.beginCombat(s,'I1');assert.deepEqual(G.challengeCandidates(s,'ash'),['A6']);G.issueChallenge(s,'iron','I1:C');assert.equal(G.canRefuseChallenge(s),false,'a lone character has nowhere to run');assert.throws(()=>G.answerChallenge(s,null),/Nowhere to Run/);
 G.answerChallenge(s,'A6');while(s.combatSession.phase==='attacks')G.fightCombatStep(s,()=>.5);const hit=s.combatSession.stages.find(st=>st.from==='A6'&&st.duel);assert.equal(hit.unsaved,1);assert.equal(hit.overkill,G.profile(w).A-1,'every wound past the champion\'s one');
 G.compareCombat(s);assert.equal(s.lastCombat.score.ash.overkill,hit.overkill);
});
test('To the Death: if both survive and the combat goes on, the challenge goes on next round',()=>{
 const {s}=fight();G.beginCombat(s,'A1');G.issueChallenge(s,'ash','A1:C');G.answerChallenge(s,'I1:C');while(s.combatSession.phase==='attacks')G.fightCombatStep(s,()=>.01);G.compareCombat(s);
 assert.deepEqual(s.duels.map(d=>[d.challenger,d.acceptor]),[['A1:C','I1:C']]);s.pendingCombat=null;for(const u of s.units)u.combatResolved=false;s.team='iron';
 G.beginCombat(s,'I1');assert.equal(s.combatSession.challenge.stage,'fight');assert.equal(s.combatSession.challenge.continued,true);assert.equal(G.challengePending(s),false,'no new challenge in that combat');
});
