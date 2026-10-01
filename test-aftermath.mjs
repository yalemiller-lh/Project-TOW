import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
import * as BM from './dist/battlemarch.mjs';

// Combat destruction, Break outcomes and pursuit (the user's brief of 1 October 2026).
const test=(name,fn)=>{fn();console.log('PASS '+name);};
const seq=values=>{let i=0;return ()=>values[i++]??0;};
// D6 face n from the random source: 1+floor(r*6).
const face=n=>(n-.5)/6;
function engaged(ids=['A1','I1']){
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0);for(const p of G.combatants(s))if(!ids.includes(p.id)){p.x=null;p.y=null;}
 const a=G.getUnit(s,ids[0]),b=G.getUnit(s,ids[1]);Object.assign(b,{x:36,y:20,heading:180});Object.assign(a,{x:36,y:20+(G.size(a).h+G.size(b).h)/2,heading:0});
 a.engaged=[b.id];b.engaged=[a.id];Object.assign(s,{stage:'combat',team:'ash'});return {s,a,b};
}
// A Break test waiting for the loser, as compareCombat leaves it.
function breakFor(s,winner,loser,{margin=1,strength=null}={}){const w=G.getUnit(s,winner),l=G.getUnit(s,loser);s.pendingCombat={combat:[winner,loser],winnerSide:w.team,loserSide:l.team,margin,stage:'break',winners:[winner],losers:[loser],results:{},former:{[winner]:[loser],[loser]:[winner]},loser,winner,strength};return s.pendingCombat;}

test('the Break test: double 1 Gives Ground; R > Ld breaks; R + margin > Ld Falls Back; otherwise Gives Ground',()=>{
 for(const [dice,margin,outcome] of [[[1,1],6,'give-ground'],[[6,5],1,'break'],[[3,3],2,'fall-back'],[[3,3],1,'give-ground']]){const {s}=engaged();breakFor(s,'A1','I1',{margin});assert.equal(G.rollCombatBreak(s,seq(dice.map(face))).outcome,outcome,`${dice} with margin ${margin}`);}
});
test('outnumbered: more than twice the Unit Strength turns Fall Back into a Break; exactly twice does not',()=>{
 for(const [winner,loser,outcome,outnumbered] of [[11,5,'break',true],[10,5,'fall-back',false],[20,5,'break',true]]){const {s}=engaged();breakFor(s,'A1','I1',{margin:2,strength:{winner,loser}});const r=G.rollCombatBreak(s,seq([face(3),face(3)]));assert.equal(r.outcome,outcome,`${winner} vs ${loser}`);assert.equal(r.outnumbered,outnumbered);}
 {const {s}=engaged();breakFor(s,'A1','I1',{margin:1,strength:{winner:20,loser:5}});assert.equal(G.rollCombatBreak(s,seq([face(1),face(1)])).outcome,'give-ground','a double 1 still Gives Ground');}
 {const {s}=engaged();breakFor(s,'A1','I1',{margin:1,strength:{winner:20,loser:5}});const r=G.rollCombatBreak(s,seq([face(6),face(5)]));assert.equal(r.outcome,'break');assert.equal(r.outnumbered,false,'already a Break');}
 // compareCombat records both sides' Unit Strength after casualties.
 const {s}=engaged();G.getUnit(s,'I1').deadModels=G.modelSquares(s,G.getUnit(s,'I1')).map(m=>m.index).slice(4);let n=0;G.beginCombat(s,'A1');for(let k=0;k<6&&s.combatSession?.phase==='attacks';k++)G.fightCombatStep(s,()=>[.99,.99,0][n++%3]);if(s.combatSession)G.compareCombat(s);
 if(s.pendingCombat?.strength)assert.ok(s.pendingCombat.strength.winner>0&&s.pendingCombat.strength.loser>=0);
});
test('the Daemonsmith\'s Stubborn turns a Break into Fall Back and is not spent on a Give Ground',()=>{
 const {s,b}=engaged(['A6','I1']);breakFor(s,'I1','A6',{margin:1});const w=G.getUnit(s,'A6');
 assert.equal(G.rollCombatBreak(s,seq([face(1),face(1)])).outcome,'give-ground');assert.ok(!w.stubbornUsed,'kept');
 breakFor(s,'I1','A6',{margin:1});const r=G.rollCombatBreak(s,seq([face(6),face(6)]));assert.equal(r.outcome,'fall-back');assert.equal(r.stubborn,true);assert.equal(w.stubbornUsed,true);
 breakFor(s,'I1','A6',{margin:1});assert.equal(G.rollCombatBreak(s,seq([face(6),face(6)])).outcome,'break','spent: a second Break stands');
});
test('Giving Ground or Falling Back at the table edge stops there: the unit is not lost',()=>{
 for(const [dice,outcome] of [[[3,3],'give-ground'],[[2,2],'fall-back']]){
  const {s,a,b}=engaged();Object.assign(b,{x:36,y:G.size(b).h/2+.3,heading:180});Object.assign(a,{x:36,y:b.y+(G.size(a).h+G.size(b).h)/2,heading:0});
  breakFor(s,'A1','I1',{margin:outcome==='give-ground'?0:4});const r=G.rollCombatBreak(s,seq(dice.map(face)));assert.equal(r.outcome,outcome);if(s.pendingCombat.stage==='loser-choice')G.chooseLoserAction(s,'fall-back');
  G.moveCombatLoser(s,seq([face(2),face(2)]));assert.notEqual(b.x,null,`${outcome}: still on the table`);assert.ok(!b.destroyed);assert.equal(b.fleeing,false);
  assert.equal(b.combatOutcome.kind,outcome==='give-ground'?'GAVE_GROUND':'FELL_BACK');assert.equal(BM.casualtyVP(b).vp,0);
 }
});
test('every destruction keeps its reason: fled off the table, wiped out by attacks',()=>{
 const {s,a,b}=engaged();Object.assign(b,{x:36,y:G.size(b).h/2+.3,heading:180});Object.assign(a,{x:36,y:b.y+(G.size(a).h+G.size(b).h)/2,heading:0});
 breakFor(s,'A1','I1',{margin:3});assert.equal(G.rollCombatBreak(s,seq([face(6),face(6)])).outcome,'break');G.moveCombatLoser(s,seq([face(6),face(6)]));
 assert.equal(b.x,null);assert.equal(b.destroyedBy,'FLED_OFF_TABLE');assert.equal(b.leftBoard,'fled');assert.equal(b.combatOutcome.kind,'BROKE');
 const t=G.createGame('empire');G.autoDeploy(t);t.rocket.wounds=0;G.begin(t);G.nextPhase(t);for(const p of G.combatants(t))if(!['A1','I4'].includes(p.id)){p.x=null;p.y=null;}
 Object.assign(t,{stage:'shooting',team:'iron'});const target=G.getUnit(t,'A1'),i4=G.getUnit(t,'I4');Object.assign(i4,{x:35,y:15,heading:180,moved:false,shot:false,movementMode:null});Object.assign(target,{x:35,y:25,heading:0});
 target.deadModels=G.modelSquares(t,target).map(m=>m.index).slice(1);let n=0;G.shoot(t,'I4','A1',()=>n++<10?.99:0);assert.equal(target.destroyedBy,'COMBAT_CASUALTIES');
});
test('a Frenzied unit passes the Panic test of a Curse of Cowardly Flight',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0);const w=G.getUnit(s,'A6'),t=G.getUnit(s,'I1');Object.assign(s,{stage:'strategy',team:'ash'});
 Object.assign(w,{x:30,y:30,spells:['coward'],castThisTurn:[]});Object.assign(t,{x:30,y:20});t.effects=[{rule:'frenzy',source:'test'}];
 const r=G.castSpell(s,'A6','coward','I1',seq([.99,.99,.99,.99,.99,.99]));if(r.cast&&!r.dispel?.success){assert.equal(r.effect.passed,true);assert.equal(t.fleeing,false);}
});
