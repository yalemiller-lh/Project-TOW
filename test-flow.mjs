import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

const test=(name,fn)=>{fn();console.log('PASS '+name);};
function battle(){const s=G.createGame();G.autoDeploy(s);G.begin(s,()=>0);return s;}
function combat(){const s=battle(),winner=G.getUnit(s,'A1'),loser=G.getUnit(s,'I1');Object.assign(winner,{x:18,y:22,engaged:loser.id});Object.assign(loser,{x:18,y:22-G.SIZE.h,engaged:winner.id});s.stage='combat';return {s,winner,loser};}
function pending(s,winner,loser,outcome,options={}){winner.engaged=loser.engaged=null;s.lastCombat={a:winner.id,b:loser.id};s.combatHistory=[s.lastCombat];s.pendingCombat={stage:'winner-choice',winner:winner.id,loser:loser.id,outcome,retreat:{moved:options.moved??4,dir:{x:0,y:-1}},fleeDistance:options.fleeDistance??4,loserDestroyed:options.destroyed??false};}

test('a pursuer moves its rolled distance after catching and destroying a fleeing unit',()=>{
 const {s,winner,loser}=combat();loser.y=14;pending(s,winner,loser,'break');const out=G.winnerCombat(s,'follow',()=>.4);
 assert.equal(out.pursuitDistance,5);assert.equal(out.loserDestroyed,true);assert.equal(loser.x,null);assert.ok(out.movement.winner>4.9);assert.ok(winner.y<17.1);
});
test('a pursuer still moves when the fleeing unit already left the board',()=>{
 const {s,winner,loser}=combat();G.getUnit(s,'I1').x=null;G.getUnit(s,'I1').y=null;pending(s,winner,loser,'break',{destroyed:true,fleeDistance:8});const out=G.winnerCombat(s,'follow',()=>0);
 assert.equal(out.loserDestroyed,true);assert.equal(out.pursuitDistance,1);assert.equal(out.movement.winner,1);assert.equal(winner.y,21);
});
test('destroying every enemy model before the Break test offers an overrun',()=>{
 const {s,winner,loser}=combat();loser.deadModels=Array.from({length:19},(_,i)=>i);
 G.beginCombat(s,winner.id);let i=0;while(s.combatSession.phase==='attacks')G.fightCombatStep(s,()=>i++<12?.999:0);
 const result=G.compareCombat(s);assert.equal(result.outcome,'destroyed');assert.equal(s.pendingCombat.outcome,'overrun');assert.equal(s.pendingCombat.stage,'winner-choice');assert.throws(()=>G.nextPhase(s),/Resolve/);
 const out=G.winnerCombat(s,'follow',()=>.4);assert.equal(out.overrun,true);assert.ok(out.movement.winner>0);assert.equal(loser.x,null);
});
test('overrun goes straight forward and engages a fresh enemy as a charge',()=>{
 const {s,winner,loser}=combat(),fresh=G.getUnit(s,'I2');G.getUnit(s,'I2').x=18;G.getUnit(s,'I2').y=10;G.getUnit(s,'I1').x=null;G.getUnit(s,'I1').y=null;G.getUnit(s,'I1').destroyed=true;pending(s,winner,loser,'overrun',{destroyed:true,moved:0});
 const out=G.winnerCombat(s,'follow',()=>.9);assert.equal(out.contact,fresh.id);assert.equal(winner.engaged,fresh.id);assert.equal(fresh.engaged,winner.id);assert.equal(winner.charge.status,'success');assert.ok(out.movement.winner>0&&out.movement.winner<out.pursuitDistance);
 assert.equal(G.combatPairs(s).length,0);G.nextPhase(s);assert.equal(G.combatPairs(s).length,1);assert.equal(winner.charge.status,'success');
});
test('overrun stops before a friendly blocker and restraint prevents movement',()=>{
 const {s,winner,loser}=combat(),ally=G.getUnit(s,'A2');ally.x=18;ally.y=15;G.getUnit(s,'I1').x=null;G.getUnit(s,'I1').y=null;pending(s,winner,loser,'overrun',{destroyed:true,moved:0});
 const out=G.winnerCombat(s,'follow',()=>.9);assert.equal(out.blocked,true);assert.ok(out.movement.winner<out.pursuitDistance);
 const again=combat();again.loser.x=null;again.loser.y=null;pending(again.s,again.winner,again.loser,'overrun',{destroyed:true,moved:0});const stayed=G.winnerCombat(again.s,'restrain',()=>0);assert.equal(stayed.overrun,false);assert.equal(again.winner.y,22);
});
test('an overrunner may pass a Leadership test and reform unless it contacted a new enemy',()=>{
 const first=combat();first.loser.x=null;first.loser.y=null;pending(first.s,first.winner,first.loser,'overrun',{destroyed:true,moved:0});
 const out=G.winnerCombat(first.s,'follow-reform',()=>0,90);assert.equal(out.reform.passed,true);assert.equal(first.winner.heading,90);assert.deepEqual(out.rolls.reform,[1,1]);
 const second=combat();second.loser.x=null;second.loser.y=null;pending(second.s,second.winner,second.loser,'overrun',{destroyed:true,moved:0});
 const stopped=G.winnerCombat(second.s,'restrain',()=>0,180);assert.equal(stopped.overrun,false);assert.equal(stopped.reform.passed,true);assert.equal(second.winner.heading,180);
});
test('the instant combat API uses the same overrun and pursuit resolution',()=>{
 const {s,winner,loser}=combat();loser.x=null;loser.y=null;pending(s,winner,loser,'overrun',{destroyed:true,moved:0});
 const out=G.finishCombat(s,'follow',()=>0);assert.equal(out.overrun,true);assert.equal(out.movement.winner,1);assert.equal(s.pendingCombat,null);
});
test('empty Strategy, charge declarations, Remaining Moves, Shooting, and Combat skip automatically',()=>{
 const s=battle();G.getUnit(s,'A6').x=null;G.getUnit(s,'A6').destroyed=true;s.rocket.wounds=0;
 const skipped=G.skipEmptySteps(s);assert.ok(skipped.includes('strategy'));assert.equal(s.stage,'movement');assert.equal(s.movementStep,'remaining');
 for(const u of s.units.filter(u=>u.team==='ash'))u.moved=true;
 const rest=G.skipEmptySteps(s);assert.ok(rest.includes('Movement · remaining'));assert.ok(rest.includes('combat'));assert.equal(s.team,'iron');
});
test('available rally, charge, shooting, and combat actions prevent auto skips',()=>{
 const s=battle(),a=G.getUnit(s,'A1'),enemy=G.getUnit(s,'I1');a.fleeing=true;assert.deepEqual(G.skipEmptySteps(s),[]);a.fleeing=false;
 s.stage='movement';s.movementStep='declare';a.x=18;a.y=22;enemy.x=18;enemy.y=16;assert.equal(G.phaseHasActions(s),true);assert.deepEqual(G.skipEmptySteps(s),[]);
 s.stage='shooting';s.team='ash';const missile=G.getUnit(s,'A4');missile.x=18;missile.y=24;enemy.y=18;assert.equal(G.phaseHasActions(s),true);
 s.stage='combat';s.pendingCombat={stage:'winner-choice',winner:'A1',loser:'I1'};assert.deepEqual(G.skipEmptySteps(s),[]);
});
test('a moved Orc does not keep empty charge declarations open',()=>{
 const s=G.createGame('orc');G.autoDeploy(s);G.begin(s);s.team='iron';s.stage='movement';s.movementStep='declare';const orc=G.getUnit(s,'I1'),target=G.getUnit(s,'A1');orc.x=18;orc.y=22;target.x=18;target.y=28;for(const u of s.units.filter(u=>u.team==='iron'))u.moved=true;
 assert.equal(G.phaseHasActions(s),false);const skipped=G.skipEmptySteps(s);assert.deepEqual(skipped.slice(0,2),['Movement · declare','Movement · remaining']);assert.equal(s.team,'ash');
});
test('Movement can be reopened from Shooting until the army acts, with its moves still undoable',()=>{
 const s=battle();G.nextPhase(s);assert.equal(s.movementStep,'remaining');G.move(s,'A1',3,'advance');G.nextPhase(s);assert.equal(s.stage,'shooting');
 assert.equal(G.canReturnToMovement(s),true);G.returnToMovement(s);assert.equal(s.stage,'movement');assert.equal(s.movementStep,'remaining');
 assert.deepEqual(G.skipEmptySteps(s),[]);G.undo(s);assert.equal(G.getUnit(s,'A1').y,42);G.move(s,'A1',2,'advance');G.nextPhase(s);assert.equal(s.stage,'shooting');assert.equal(s.movementReopened,false);
 const target=G.rocketTargets(s).find(t=>!t.error);G.fireRocket(s,target.unit.id,'demolition',{artillery:2,scatter:'hit'},()=>0);
 assert.equal(G.canReturnToMovement(s),false);assert.throws(()=>G.returnToMovement(s),/reopened/);
});
test('an automatically skipped Shooting phase still lets Combat return to Movement before any fight',()=>{
 const s=battle();s.rocket.wounds=0;G.nextPhase(s);G.hold(s,'A1');G.nextPhase(s);assert.equal(s.stage,'combat');assert.equal(s.shootingSkipped,true);
 assert.equal(G.canReturnToMovement(s),true);G.getUnit(s,'A2').combatResolved=true;assert.equal(G.canReturnToMovement(s),false);G.getUnit(s,'A2').combatResolved=false;
 G.returnToMovement(s);assert.equal(s.history.length,1);G.undo(s);assert.equal(G.getUnit(s,'A1').moved,false);
});
test('Movement cannot be reopened from Strategy or after a missile unit acts',()=>{
 const s=battle();assert.equal(G.canReturnToMovement(s),false);G.nextPhase(s);G.nextPhase(s);assert.equal(s.stage,'shooting');G.getUnit(s,'A4').shot=true;assert.equal(G.canReturnToMovement(s),false);
});
