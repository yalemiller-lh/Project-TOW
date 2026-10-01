import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

const test=(name,fn)=>{fn();console.log('PASS '+name);};
const dice=(...faces)=>{let i=0;return ()=>(faces[i++%faces.length]-1)/6+.01;};
const near=(a,b)=>Math.abs(a-b)<1e-6;

// An Orc Mob faces the Deathshrieker in the Orc Movement phase; nothing else is on the table.
function orcsFaceRocket(){
 const s=G.createGame('orc');G.autoDeploy(s);G.begin(s,()=>0);
 for(const u of s.units)if(u.id!=='I1'){u.x=null;u.y=null;}
 const orc=G.getUnit(s,'I1');Object.assign(orc,{x:8,y:42-G.ROCKET_BASE.h/2-4-G.size(orc).h/2,heading:180,impetuousTest:true});
 Object.assign(s,{team:'iron',stage:'movement',movementStep:'declare'});return {s,orc,rocket:s.rocket};
}
function engaged(){
 const {s,orc,rocket}=orcsFaceRocket();G.declareCharge(s,'I1','A5');G.finishDeclarations(s);G.resolveCharge(s,'I1',[6,6]);G.nextPhase(s);return {s,orc,rocket};
}
function pendingBreak(s,winner,loser,margin=1){s.lastCombat={a:'A5',b:'I1',round:s.round};s.combatHistory=[s.lastCombat];s.pendingCombat={winner,loser,margin,stage:'break'};}

test('the Deathshrieker is a charge target that can only Hold',()=>{
 const {s,orc,rocket}=orcsFaceRocket();
 assert.equal(G.getUnit(s,'A5'),rocket);assert.ok(G.availableCharges(s,orc).includes(rocket));
 const declared=G.declareCharge(s,'I1','A5');assert.equal(declared.reaction,'hold');assert.equal(declared.face,'front');
 assert.throws(()=>G.chargeReaction(s,'I1','flee'),/No charge reaction/);
 G.finishDeclarations(s);assert.equal(s.movementStep,'charges');
 const out=G.resolveCharge(s,'I1',[6,6]);assert.equal(out.success,true);assert.deepEqual(orc.engaged,['A5']);assert.deepEqual(rocket.engaged,['I1']);assert.ok(G.gap(orc,rocket)<.05);
 assert.equal(rocket.x,8);assert.equal(rocket.y,42);
});
test('an engaged war machine fights, cannot fire, and counts as a combat pair',()=>{
 const {s,rocket}=engaged();assert.equal(s.stage,'combat');assert.deepEqual(G.combatPairs(s),[['A5','I1']]);
 Object.assign(s,{team:'ash',stage:'shooting'});assert.equal(G.canFireRocket(s),false);rocket.engaged=null;assert.equal(G.canFireRocket(s),true);
});
test('the crew profile is used in combat, with one Attack per surviving crew token',()=>{
 const {s,orc,rocket}=engaged();const p=G.profile(rocket);
 assert.deepEqual([p.WS,p.S,p.T,p.I,p.A,p.Ld],[3,3,4,2,3,9]);assert.equal(G.saveTarget(rocket,orc),7);assert.equal(G.woundTarget(orc,rocket),5);assert.equal(G.hitTarget(rocket,orc),4);
 assert.equal(G.aliveCount(rocket),1);assert.equal(G.remainingWounds(rocket),3);assert.equal(G.commandAlive(rocket,'S'),false);
 const [model]=G.modelSquares(s,rocket);assert.equal(model.fighting,true);assert.equal(model.contact,true);
 rocket.crew=2;rocket.wounds=2;assert.equal(G.profile(rocket).A,2);
});
test('wounds remove crew tokens and the last wound destroys the war machine',()=>{
 const {s,orc,rocket}=engaged();G.beginCombat(s,'I1');
 while(s.combatSession?.phase==='attacks')G.fightCombatStep(s,()=>.99);
 assert.equal(rocket.wounds,0);assert.equal(rocket.crew,0);assert.equal(rocket.x,null);assert.equal(orc.engaged,null);
 const result=G.compareCombat(s);assert.equal(result.outcome,'destroyed');assert.equal(result.winner,'I1');assert.equal(result.score.I1.flank,0);assert.equal(s.pendingCombat.outcome,'overrun');
});
test('a war machine that falls back stays in the fight; one that breaks is abandoned',()=>{
 {
  const {s,orc,rocket}=engaged();pendingBreak(s,'I1','A5');const test=G.rollCombatBreak(s,dice(4,5));assert.equal(test.outcome,'fall-back');assert.equal(test.shieldwallAvailable,false);
  const out=G.moveCombatLoser(s);assert.equal(out.finished,true);assert.equal(out.distance,0);assert.equal(s.pendingCombat,null);assert.deepEqual(rocket.engaged,['I1']);assert.deepEqual(orc.engaged,['A5']);assert.equal(rocket.y,42);
 }
 {
  const {s,orc,rocket}=engaged();pendingBreak(s,'I1','A5');assert.equal(G.rollCombatBreak(s,dice(6,6)).outcome,'break');
  const out=G.moveCombatLoser(s);assert.equal(out.abandoned,true);assert.equal(rocket.x,null);assert.equal(rocket.wounds,0);assert.equal(orc.engaged,null);assert.equal(s.lastCombat.aftermath.loserDestroyed,true);
 }
});
test('a winning war machine stays put and cannot pursue',()=>{
 const {s,orc,rocket}=engaged();pendingBreak(s,'A5','I1',2);assert.equal(G.rollCombatBreak(s,dice(6,6)).outcome,'break');
 const out=G.moveCombatLoser(s,dice(3,4));assert.equal(out.finished,true);assert.equal(s.pendingCombat,null);assert.equal(orc.fleeing,true);assert.equal(orc.engaged,null);assert.equal(rocket.engaged,null);
 assert.ok(near(rocket.x,8)&&near(rocket.y,42));assert.equal(s.lastCombat.aftermath.choice,'restrain');
});
test('Chaos Dwarf Warriors can charge and fight an Empire Great Cannon',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0);for(const u of s.units)if(u.id!=='A1'){u.x=null;u.y=null;}s.rocket.x=null;
 const cannon=s.cannons[0],warriors=G.getUnit(s,'A1');Object.assign(warriors,{x:cannon.x,y:cannon.y+G.CANNON_BASE.h/2+3+G.SIZE.h/2,heading:0});Object.assign(s,{stage:'movement',movementStep:'declare'});
 assert.equal(cannon.role,'warmachine');assert.ok(G.availableCharges(s,warriors).includes(cannon));G.declareCharge(s,'A1',cannon.id);G.finishDeclarations(s);assert.equal(G.resolveCharge(s,'A1',[5,1]).success,true);
 G.nextPhase(s);assert.equal(s.stage,'combat');assert.deepEqual(G.combatPairs(s),[['A1',cannon.id]]);assert.equal(G.profile(cannon).T,3);
 G.beginCombat(s,'A1');while(s.combatSession?.phase==='attacks')G.fightCombatStep(s,()=>0);const result=G.compareCombat(s);
 assert.equal(result.score.A1.flank,0);assert.equal(result.score[cannon.id].flank,0);assert.equal(result.score[cannon.id].ranks,0);
});
