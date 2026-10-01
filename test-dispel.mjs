import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

const test=(name,fn)=>{fn();console.log('PASS '+name);};
// Returns the given D6 faces in order, then repeats the last one.
const dice=(...faces)=>{let i=0;return ()=>(faces[Math.min(i++,faces.length-1)]-1)/6+.01;};

// The Daemonsmith (A6, Level 2) casts Oaken Shield (Self, 7+) in Red's Strategy phase with the
// Battlemage (I7, Level 2) 12" away.
function setup(){
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0);Object.assign(s,{stage:'strategy',team:'ash'});
 const caster=G.getUnit(s,'A6'),wizard=G.getUnit(s,'I7');caster.spells=['shield','fireball'];Object.assign(wizard,{x:3.5,y:30});return {s,caster,wizard};
}

test('a cast spell waits for the defender, who may pick an eligible wizard or the Fated Dispel',()=>{
 const {s}=setup(),report=G.attemptSpell(s,'A6','shield','A6',dice(4,3));
 assert.equal(report.casting,8);assert.equal(report.cast,true);assert.equal(report.pending,true);assert.equal(G.getUnit(s,'A6').oakenShield,undefined);
 const options=G.dispelOptions(s);assert.equal(options.team,'iron');assert.deepEqual(options.wizards.map(w=>[w.id,w.bonus]),[['I7',1]]);assert.equal(options.fated,true);
 assert.throws(()=>G.nextPhase(s),/dispel/);assert.equal(G.phaseHasActions(s),true);assert.deepEqual(G.skipEmptySteps(s),[]);
});
test('a Wizardly Dispel adds half the level and must beat the casting result; a tie fails',()=>{
 {const {s}=setup();G.attemptSpell(s,'A6','shield','A6',dice(4,3));const out=G.resolveDispel(s,'I7',dice(4,3));assert.equal(out.dispel.total,8);assert.equal(out.dispel.success,false);assert.equal(out.cast,true);assert.equal(G.getUnit(s,'A6').oakenShield,true);assert.equal(s.pendingSpell,null);}
 {const {s}=setup();G.attemptSpell(s,'A6','shield','A6',dice(4,3));const out=G.resolveDispel(s,'I7',dice(5,3));assert.equal(out.dispel.total,9);assert.equal(out.dispel.success,true);assert.equal(out.cast,false);assert.equal(G.getUnit(s,'A6').oakenShield,undefined);}
});
test('the Fated Dispel is unmodified, once per turn, and may be chosen even when a wizard could dispel',()=>{
 const {s,caster}=setup();G.attemptSpell(s,'A6','shield','A6',dice(4,3));const out=G.resolveDispel(s,'fated',dice(6,3));
 assert.equal(out.dispel.kind,'fated');assert.equal(out.dispel.total,9);assert.equal(out.dispel.success,true);assert.equal(s.fatedDispelUsed.iron,true);
 caster.spells.push('ashStorm');G.attemptSpell(s,'A6','ashStorm','A6',dice(6,4));assert.equal(s.pendingSpell.report.casting,11);
 assert.equal(G.dispelOptions(s).fated,false);assert.throws(()=>G.resolveDispel(s,'fated'),/already used/);assert.equal(G.resolveDispel(s,'I7',dice(3,3)).cast,true);
 caster.castThisTurn=[];s.stage='combat';G.nextTurn(s);assert.deepEqual(s.fatedDispelUsed,{ash:false,iron:false});
});
test('the Fated Dispel needs no wizard and has no range limit',()=>{
 const {s,wizard}=setup();Object.assign(wizard,{x:70,y:6});G.attemptSpell(s,'A6','shield','A6',dice(4,3));
 assert.deepEqual(G.dispelOptions(s).wizards,[]);assert.equal(G.dispelOptions(s).fated,true);assert.equal(G.resolveDispel(s,'fated',dice(5,5)).dispel.success,true);
 assert.equal(G.castSpell(setup().s,'A6','shield','A6',dice(4,3,6,6),{dispel:'fated'}).dispel.success,true);
});
test('double 6 always dispels; double 1 fails, and only a Wizardly Dispel is then Outclassed in the Art',()=>{
 {const {s}=setup();G.attemptSpell(s,'A6','shield','A6',dice(6,5));assert.equal(s.pendingSpell.report.casting,12);assert.equal(G.resolveDispel(s,'fated',dice(6,6)).dispel.success,true);}
 {const {s}=setup();G.attemptSpell(s,'A6','shield','A6',dice(1,2));assert.equal(s.pendingSpell,undefined);}
 // Outclassed in the Art reads the Miscast table: a 7 (Careless Conjuration) fails the dispel.
 {const {s}=setup();G.attemptSpell(s,'A6','shield','A6',dice(4,3));const out=G.resolveDispel(s,'I7',dice(1,1,4,3,1));assert.equal(out.dispel.success,false);assert.equal(out.dispel.miscast?.kind,'Careless Conjuration');assert.equal(G.getUnit(s,'A6').oakenShield,true);}
 {const {s}=setup();G.attemptSpell(s,'A6','shield','A6',dice(4,3));const out=G.resolveDispel(s,'fated',dice(1,1));assert.equal(out.dispel.success,false);assert.equal(out.dispel.miscast,undefined);}
});
test('a Perfect Invocation is cast at once and cannot be dispelled',()=>{
 const {s}=setup(),report=G.attemptSpell(s,'A6','shield','A6',dice(6,6));assert.equal(report.perfect,true);assert.equal(report.pending,undefined);assert.equal(s.pendingSpell,null);assert.equal(G.getUnit(s,'A6').oakenShield,true);
});
test('wizards out of range, fleeing, or engaged against another unit cannot dispel',()=>{
 for(const change of [{x:3.5,y:10},{fleeing:true},{engaged:'A1'}]){const {s,wizard}=setup();Object.assign(wizard,change);G.attemptSpell(s,'A6','shield','A6',dice(4,3));assert.deepEqual(G.dispelOptions(s).wizards,[],JSON.stringify(change));}
 const {s,caster,wizard}=setup();Object.assign(s,{stage:'combat'});caster.spells=['hammerhand'];Object.assign(caster,{heading:0});Object.assign(wizard,{x:caster.x,y:caster.y-G.size(caster).h,heading:180});caster.engaged=['I7'];wizard.engaged=['A6'];
 G.beginCombat(s,'A6');while(s.combatSession.initiative.A6!==s.combatSession.groups[s.combatSession.step])G.fightCombatStep(s,()=>0);
 G.attemptSpell(s,'A6','hammerhand','I7',dice(4,3));assert.deepEqual(G.dispelOptions(s).wizards.map(w=>w.id),['I7']);
});
test('a Pillar of Fire in play is dispelled in the opponent\'s Strategy phase by beating its printed 9+',()=>{
 const {s,caster,wizard}=setup();caster.spells=['pillar'];s.stage='shooting';G.castSpell(s,'A6','pillar','A6',dice(6,6),{point:{x:caster.x+2,y:caster.y-6}});assert.equal(s.vortices.length,1);
 assert.equal(G.canDispelVortex(s,'A6'),false);Object.assign(s,{stage:'strategy',team:'iron'});assert.equal(G.canDispelVortex(s,'A6'),true);
 Object.assign(wizard,{x:caster.x+2,y:caster.y-12});assert.deepEqual(G.vortexDispellers(s,'A6').map(w=>w.id),['I7']);
 let out=G.dispelVortex(s,'A6',dice(4,4),'wizard','I7');assert.equal(out.total,9);assert.equal(out.success,false,'9 does not beat 9');
 // One attempt per vortex in each Conjuration.
 assert.equal(G.canDispelVortex(s,'A6'),false);assert.throws(()=>G.dispelVortex(s,'A6',dice(5,5),'fated'),/already faced a dispel/);
 s.round++;assert.equal(G.canDispelVortex(s,'A6'),true,'a later turn allows another attempt');
 out=G.dispelVortex(s,s.vortices[0].id,dice(5,5),'fated');assert.equal(out.success,true);assert.equal(s.vortices.length,0);
});
