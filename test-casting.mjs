import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

// Shared casting and dispelling rules (the Daemonology brief of 1 October 2026, sections 3 to 7
// and 9), checked on Battle Magic before any new lore is added.
const test=(name,fn)=>{fn();console.log('PASS '+name);};
// Returns the given D6 faces in order, then repeats the last one.
const dice=(...faces)=>{let i=0;return ()=>(faces[Math.min(i++,faces.length-1)]-1)/6+.01;};
const clearExcept=(s,keep)=>{for(const p of G.combatants(s))if(!keep.includes(p.id)){p.x=null;p.y=null;}};
function battle(){const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0);for(const u of s.units)u.charge=null;return s;}
function strategy(s,team='ash'){Object.assign(s,{stage:'strategy',team});return s;}
// The wizard and one enemy unit in base contact, front to front, in a Combat phase.
function duel(enemy='I1',team='ash'){
 const s=battle();clearExcept(s,['A6',enemy]);const w=G.getUnit(s,'A6'),t=G.getUnit(s,enemy);
 Object.assign(t,{x:30,y:20,heading:180});Object.assign(w,{x:30,y:20+(G.size(t).h+G.size(w).h)/2,heading:0,spells:['hammerhand','shield'],castThisTurn:[]});
 w.engaged=[t.id];t.engaged=[w.id];Object.assign(s,{stage:'combat',team});return {s,w,t};
}
const toStep=(s,id)=>{while(s.combatSession.initiative[id]!==s.combatSession.groups[s.combatSession.step])G.fightCombatStep(s,()=>0);};

test('the casting roll keeps the natural dice apart from each named modifier; Magic Resistance counts only against an enemy target',()=>{
 const s=battle();Object.assign(s,{stage:'movement',movementStep:'remaining',team:'ash'});const w=G.getUnit(s,'A6'),a=G.getUnit(s,'A1');
 Object.assign(w,{spells:['urgency','fireball'],castThisTurn:[]});Object.assign(a,{x:w.x,y:w.y-4,moved:true});a.effects=[{rule:'magicResistance',source:'test'}];
 const r=G.attemptSpell(s,'A6','urgency','A1',dice(4,4));assert.deepEqual(r.dice,[4,4]);assert.equal(r.casting,9);assert.deepEqual(r.modifiers,[{label:'Level 2',value:1}]);
 const t=battle();Object.assign(t,{stage:'shooting',team:'ash'});clearExcept(t,['A6','I1']);const c=G.getUnit(t,'A6'),e=G.getUnit(t,'I1');Object.assign(c,{x:30,y:30,heading:0,spells:['fireball'],castThisTurn:[]});Object.assign(e,{x:30,y:20,heading:180});e.effects=[{rule:'magicResistance',source:'test'}];
 const f=G.attemptSpell(t,'A6','fireball','I1',dice(4,4));assert.deepEqual(f.modifiers,[{label:'Level 2',value:1},{label:'Magic Resistance',value:-2}]);assert.equal(f.casting,7);
});
test('exactly the casting value succeeds; failed attempts use up the turn\'s allowance',()=>{
 const s=strategy(battle());const w=G.getUnit(s,'A6');Object.assign(w,{spells:['shield','ashStorm','arrow'],castThisTurn:[]});
 assert.equal(G.attemptSpell(s,'A6','shield','A6',dice(3,3)).cast,true,'6 + 1 = 7 meets 7+');G.resolveDispel(s,'none');
 assert.equal(G.attemptSpell(s,'A6','ashStorm','A6',dice(1,2)).cast,false);
 assert.match(G.castBlockReason(s,'A6','arrow'),/attempts/);assert.match(G.castBlockReason(s,'A6','shield'),/Already attempted/);
});
test('a wizard that charged or marched cannot cast a Magic Missile or a Magical Vortex',()=>{
 const s=battle();Object.assign(s,{stage:'shooting',team:'ash'});const w=G.getUnit(s,'A6');Object.assign(w,{spells:['fireball','pillar'],castThisTurn:[]});
 w.charge={status:'failed'};assert.match(G.castBlockReason(s,'A6','fireball'),/Charged/);assert.match(G.castBlockReason(s,'A6','pillar'),/Charged/);
 w.charge=null;w.movementMode='march';assert.match(G.castBlockReason(s,'A6','fireball'),/Marched/);
 w.movementMode=null;assert.equal(G.castBlockReason(s,'A6','fireball'),null);
});
test('every unit that cannot be targeted says why',()=>{
 const s=battle();Object.assign(s,{stage:'shooting',team:'ash'});clearExcept(s,['A6','A1','I1','I2','I3']);const w=G.getUnit(s,'A6');Object.assign(w,{x:30,y:30,heading:0,spells:['fireball'],castThisTurn:[]});
 Object.assign(G.getUnit(s,'I1'),{x:30,y:2,heading:180});Object.assign(G.getUnit(s,'I2'),{x:48,y:30,heading:270});Object.assign(G.getUnit(s,'I3'),{x:22,y:20,heading:180});G.getUnit(s,'I3').engaged=['A1'];Object.assign(G.getUnit(s,'A1'),{x:22,y:24});
 const why=Object.fromEntries(G.spellTargetOptions(s,'A6','fireball').map(o=>[o.unit.id,o.reason]));
 assert.match(why.A1,/enemy/);assert.match(why.I1,/range/);assert.match(why.I2,/vision arc/);assert.match(why.I3,/Engaged/);
});
test('the Fated Dispel is once per turn for each side',()=>{
 // Red dispels Blue's Pillar with its Fated Dispel in its own Strategy phase; Blue keeps its own for Red's spells.
 const s=battle();clearExcept(s,['A6','I7','A1']);const w=G.getUnit(s,'A6');Object.assign(w,{x:10,y:30,heading:0,spells:['shield'],castThisTurn:[]});
 s.vortices=[{id:'V9',spell:'pillar',caster:'I7',team:'iron',x:40,y:15,radius:1.5}];Object.assign(G.getUnit(s,'I7'),{x:60,y:6});strategy(s,'ash');
 const out=G.dispelVortex(s,'V9',dice(6,5),'fated');assert.equal(out.success,true);assert.deepEqual(s.fatedDispelUsed,{ash:true,iron:false});
 G.attemptSpell(s,'A6','shield','A6',dice(4,4));assert.equal(G.dispelOptions(s).fated,true,'Blue still has its Fated Dispel');
});
test('a double 1 on the casting roll is a Dimensional Cascade (2): a 5″ template on the wizard, model by model',()=>{
 for(const [hitFace,rocketHit] of [[6,true],[1,false]]){
  const s=strategy(battle());clearExcept(s,['A6','A5']);const w=G.getUnit(s,'A6');Object.assign(w,{x:30,y:20,heading:0,spells:['shield'],castThisTurn:[]});
  // The Deathshrieker's base edge 2.1″ from the wizard's centre: partly under the 5″ template.
  Object.assign(s.rocket,{x:30,y:20+2.1+G.size(s.rocket).h/2,heading:0});
  // Casting 1,1; the Sorcerer's Curse test 1 (passed); the table 1,1; then each hit roll.
  const r=G.attemptSpell(s,'A6','shield','A6',dice(1,1,1,1,1,hitFace));assert.equal(r.miscast.kind,'Dimensional Cascade');
  assert.equal(r.miscast.cells.some(c=>c.unit==='A5'),rocketHit,`a ${hitFace} to hit the partly covered war machine`);assert.ok(r.miscast.cells.some(c=>c.unit==='A6'&&c.hitRoll===null),'the wizard under the centre is hit without a roll');
  assert.equal(r.miscast.hits,r.miscast.cells.length);
 }
});
test('the Sorcerer\'s Curse: a 6 always fails the Toughness test, a 1 always passes',()=>{
 {const s=strategy(battle()),w=G.getUnit(s,'A6');Object.assign(w,{spells:['shield'],castThisTurn:[],petrified:2});assert.equal(G.profile(w).T,6);const r=G.attemptSpell(s,'A6','shield','A6',dice(1,1,6));assert.equal(r.miscast.kind,'Sorcerer’s Curse');assert.equal(G.profile(w).T,7);}
 {const s=strategy(battle()),w=G.getUnit(s,'A6');Object.assign(w,{spells:['shield'],castThisTurn:[]});const r=G.attemptSpell(s,'A6','shield','A6',dice(1,1,1,4,3));assert.equal(r.miscast.kind,'Careless Conjuration','passed: the Miscast table instead');}
});
test('miscast 8-9 casts the spell but ends that wizard\'s casting; 10-12 is undispellable and ends the side\'s',()=>{
 {const s=strategy(battle()),w=G.getUnit(s,'A6');Object.assign(w,{spells:['shield','ashStorm'],castThisTurn:[]});const r=G.attemptSpell(s,'A6','shield','A6',dice(1,1,1,4,4));assert.equal(r.cast,true);assert.equal(r.casting,7);assert.equal(r.pending,true);G.resolveDispel(s,'none');assert.match(G.castBlockReason(s,'A6','ashStorm'),/spent/);}
 {const s=strategy(battle()),w=G.getUnit(s,'A6');Object.assign(w,{spells:['shield','ashStorm'],castThisTurn:[]});const r=G.attemptSpell(s,'A6','shield','A6',dice(1,1,1,6,5));assert.equal(r.perfect,true);assert.equal(s.pendingSpell,null);assert.equal(G.hasRule(w,'ward'),true);assert.equal(s.magicLocked.ash,true);}
});
test('Outclassed in the Art: 8-9 dispels and ends that wizard\'s dispelling; 10-12 dispels and ends the side\'s',()=>{
 const setup=()=>{const s=strategy(battle()),w=G.getUnit(s,'A6');Object.assign(w,{spells:['shield','ashStorm'],castThisTurn:[]});Object.assign(G.getUnit(s,'I7'),{x:w.x+3,y:w.y-6});return s;};
 {const s=setup();G.attemptSpell(s,'A6','shield','A6',dice(4,3));const out=G.resolveDispel(s,'I7',dice(1,1,4,4));const i7=G.getUnit(s,'I7');
  assert.equal(out.dispel.success,true);assert.equal(out.dispel.miscast.kind,'Barely Controlled Power');assert.equal(i7.dispelExhausted,true);assert.notEqual(i7.magicExhausted,true);
  G.attemptSpell(s,'A6','ashStorm','A6',dice(6,5));assert.deepEqual(G.dispelOptions(s).wizards,[],'I7 cannot dispel again this turn');assert.equal(G.dispelOptions(s).fated,true);}
 {const s=setup();G.attemptSpell(s,'A6','shield','A6',dice(4,3));const out=G.resolveDispel(s,'I7',dice(1,1,5,5));assert.equal(out.dispel.success,true);assert.equal(s.dispelBlocked.iron,true);
  G.attemptSpell(s,'A6','ashStorm','A6',dice(6,5));assert.equal(s.pendingSpell,null,'nothing can dispel it: cast at once');}
});
test('a vortex is dispelled later by beating its printed value, measured to the caster or to the template',()=>{
 const s=battle();clearExcept(s,['A6','I7']);const w=G.getUnit(s,'A6'),i7=G.getUnit(s,'I7');Object.assign(w,{x:10,y:40,heading:0,spells:['pillar'],castThisTurn:[]});Object.assign(s,{stage:'shooting',team:'ash'});
 G.castSpell(s,'A6','pillar','A6',dice(6,6),{point:{x:10,y:30}});const v=s.vortices[0];assert.equal(v.spell,'pillar');assert.equal(v.team,'ash');assert.ok(v.id);
 strategy(s,'iron');Object.assign(i7,{x:10,y:11});assert.ok(G.gap(i7,w)>18,'the caster is out of range');assert.deepEqual(G.vortexDispellers(s,v.id).map(u=>u.id),['I7'],'the template is within 18″');
 const out=G.dispelVortex(s,v.id,dice(4,4),'wizard','I7');assert.equal(out.beat,9);assert.equal(out.success,false);
});
test('placing a template: within range of the wizard, wholly on the table, touching no base',()=>{
 const s=battle();clearExcept(s,['A6','I1']);const w=G.getUnit(s,'A6'),t=G.getUnit(s,'I1');Object.assign(w,{x:20,y:30,heading:0,spells:['pillar'],castThisTurn:[]});Object.assign(t,{x:20,y:15,heading:180});Object.assign(s,{stage:'shooting',team:'ash'});
 const front=t.y+G.size(t).h/2;
 assert.match(G.templatePlacementError(s,'A6','pillar',{x:20,y:front+1.5})??'',/touch/);assert.equal(G.templatePlacementError(s,'A6','pillar',{x:20,y:front+1.6}),null);
 const edge=G.size(w).w/2;assert.match(G.templatePlacementError(s,'A6','pillar',{x:20-edge-12.2,y:30})??'',/within 12″/);assert.equal(G.templatePlacementError(s,'A6','pillar',{x:20-edge-11.9,y:30}),null);
 w.y=s.board.height-3;assert.match(G.templatePlacementError(s,'A6','pillar',{x:20,y:s.board.height-.5})??'',/battlefield/);w.y=30;
 assert.throws(()=>G.attemptSpell(s,'A6','pillar','A6',dice(4,4)),/Place/,'a template spell needs a point');
});
test('attempting a Remains in Play spell again ends the earlier one at once, even when the attempt fails',()=>{
 const s=battle();clearExcept(s,['A6']);const w=G.getUnit(s,'A6');Object.assign(w,{x:20,y:30,heading:0,spells:['pillar'],castThisTurn:[]});Object.assign(s,{stage:'shooting',team:'ash'});
 s.vortices=[{id:'V1',spell:'pillar',caster:'A6',team:'ash',x:20,y:20,radius:1.5},{id:'V2',spell:'vortexChaos',caster:'A6',team:'ash',x:30,y:20,radius:1.5}];
 const r=G.attemptSpell(s,'A6','pillar','A6',dice(1,2),{point:{x:20,y:24}});assert.equal(r.cast,false);assert.deepEqual(r.ended,['V1']);assert.deepEqual(s.vortices.map(v=>v.id),['V2'],'another spell\'s vortex stays');
});
test('an Assailment is cast when the wizard fights, at its Initiative step, and its wounds count in the combat result',()=>{
 const {s,w,t}=duel();assert.match(G.castBlockReason(s,'A6','hammerhand'),/fights/);
 G.beginCombat(s,'A6');const c=s.combatSession;assert.ok(c.initiative.I1>c.initiative.A6,'the State Troops strike first');
 assert.match(G.castBlockReason(s,'A6','hammerhand'),/Initiative step/);assert.deepEqual(G.assailmentWaiting(s),[]);
 toStep(s,'A6');assert.equal(G.castBlockReason(s,'A6','hammerhand'),null);assert.deepEqual(G.assailmentWaiting(s).map(u=>u.id),['A6']);
 const before=G.aliveCount(t),r=G.castSpell(s,'A6','hammerhand','I1',dice(5,5,6,6,6,1));assert.equal(r.cast,true);assert.ok(r.effect.unsaved>0);assert.equal(G.aliveCount(t),before,'casualties wait for the end of the step');
 const step=G.fightCombatStep(s,()=>0);const spell=step.stages.find(st=>st.spell==='hammerhand');assert.ok(spell);assert.equal(G.aliveCount(t),before-r.effect.unsaved);
 G.compareCombat(s);assert.ok(s.lastCombat.score.ash.wounds>=r.effect.unsaved,'the spell\'s wounds are in the result');
});
test('an Assailment may be cast in the enemy\'s Combat phase; a wizard may fight on without casting',()=>{
 const {s}=duel('I1','iron');G.beginCombat(s,'I1');toStep(s,'A6');assert.equal(G.castBlockReason(s,'A6','hammerhand'),null);
 G.passAssailment(s,'A6');assert.deepEqual(G.assailmentWaiting(s),[]);assert.equal(G.castBlockReason(s,'A6','hammerhand'),null,'it still could');
});
test('an engaged wizard casts only Assailments and Self spells; a Self spell needs no target',()=>{
 const {s}=duel();s.stage='strategy';const w=G.getUnit(s,'A6');w.spells=['shield','arrow'];
 assert.equal(G.castBlockReason(s,'A6','shield'),null);assert.match(G.castBlockReason(s,'A6','arrow'),/Engaged/);
 assert.equal(G.attemptSpell(s,'A6','shield',undefined,dice(4,4)).target,'A6');
});
test('a war machine can be targeted by a spell, at Toughness 6',()=>{
 const s=battle();Object.assign(s,{stage:'shooting',team:'iron'});clearExcept(s,['I7','A5']);const w=G.getUnit(s,'I7');Object.assign(w,{x:30,y:10,heading:180,spells:['fireball'],castThisTurn:[]});Object.assign(s.rocket,{x:30,y:22,heading:0});
 assert.ok(G.spellTargets(s,'I7','fireball').some(t=>t.id==='A5'));const r=G.castSpell(s,'I7','fireball','A5',dice(5,5,6,6,4,4,4,4,4,4,4,4,4,4,4,4));assert.equal(r.effect.toWound,6,'S4 against T6 needs 6s');
});
