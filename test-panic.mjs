import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

// Panic (the user's Panic brief of 2 October 2026, section 11 acceptance tests A–L) and the
// Deathshrieker's Renegades 2.0 rockets.
const test=(name,fn)=>{fn();console.log('PASS '+name);};
const face=f=>(f-1)/6+.01;
// Two dice streams: one for the shot or attack, one for everything the Panic resolver rolls.
const split=(s,damage,panic)=>{let i=0,j=0;return ()=>s.panicResolving?face(panic[Math.min(j++,panic.length-1)]):face(damage[Math.min(i++,damage.length-1)]);};
const only=(s,keep)=>{for(const p of G.combatants(s))if(!keep.includes(p.id)){p.x=null;p.y=null;}};
// A classic battle in Red's Shooting phase; the Deathshrieker stands at (8,42).
function shooting(keep=['I1']){const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'ash'});G.nextPhase(s);G.nextPhase(s);assert.equal(s.stage,'shooting');for(const u of s.units)u.charge=null;only(s,['A5',...keep]);return s;}
const entries=(s,id)=>(s.panicLog??[]).filter(e=>e.unit===id);
// The State Troops (I1, 20 models, Ld 7, 5+ save) at (30,22): an incendiary direct hit. Its first
// model is partly under the template: hit on 4, wounded on 4, save 1. Every later roll is a 1.
const oneKill=[4,4,1];

test('the Deathshrieker\'s rockets are the Renegades 2.0 profiles',()=>{
 assert.deepEqual(G.ROCKET_PROFILES.demolition,{name:'Demolition Rockets',template:3,strength:4,centreStrength:8,ap:1,centreAp:3,centreMultipleWounds:6,armourBane:1});
 const inc=G.ROCKET_PROFILES.incendiary;assert.deepEqual([inc.template,inc.strength,inc.centreStrength,inc.ap,inc.centreAp,inc.armourBane,inc.flaming,inc.panicOnWound],[5,3,4,1,1,1,true,true]);
});
test('A: incendiaries kill 1 of 20, Panic fails, dice 3 and 5: it Falls Back in Good Order 5″, not 8″, and rallies',()=>{
 const s=shooting(),t=G.getUnit(s,'I1');Object.assign(t,{x:30,y:22,heading:180});const y=t.y;
 const r=G.fireRocket(s,'I1','incendiary',{artillery:2,scatter:'hit'},split(s,oneKill,[5,5,3,5]));
 assert.deepEqual(r.units.map(u=>[u.unit,u.killed,u.destroyed]),[['I1',1,false]]);const p=r.panic[0];
 assert.equal(p.cause,'Infernal Incendiaries');assert.equal(p.passed,false);assert.equal(p.outcome,'fall-back');assert.deepEqual(p.fleeDice,[3,5]);assert.ok(Math.abs(p.moved-5)<.06,`retreats ${p.moved}`);
 assert.equal(t.fleeing,false,'it rallies at once');assert.ok(t.y<y,'away from the Deathshrieker');assert.match(G.panicText(p),/19\/20 remain: Fall Back in Good Order\. Movement dice 3,5: retreat 5″/);
});
test('B: incendiaries leave exactly 10 of 20: a failed Panic test means fleeing the sum of 2D6',()=>{
 const s=shooting(),t=G.getUnit(s,'I1');Object.assign(t,{x:30,y:22,heading:180});t.deadModels=G.modelSquares(s,t).map(m=>m.index).slice(11);assert.equal(G.aliveCount(t),11);
 const r=G.fireRocket(s,'I1','incendiary',{artillery:2,scatter:'hit'},split(s,oneKill,[5,5,3,5]));const p=r.panic[0];
 assert.equal(G.aliveCount(t),10);assert.equal(p.outcome,'flee');assert.ok(p.moved>=8-.01);assert.equal(t.fleeing,true);
});
test('C: Heavy Casualties needs more than a quarter of the models the phase began with: 5 of 20 is not enough, a sixth is',()=>{
 const s=shooting(),t=G.getUnit(s,'I1');Object.assign(t,{x:30,y:22,heading:180});
 G.removeCasualties(s,t,5);assert.equal(G.heavyCasualties(s,t,null,null,()=>face(6)),null,'exactly 25%');assert.equal(G.phaseStart(s,t).models,20);
 G.removeCasualties(s,t,1);const p=G.heavyCasualties(s,t,null,null,()=>face(6));assert.ok(p);assert.equal(p.lost,6);assert.equal(p.cause,'Heavy Casualties');
 assert.equal(G.heavyCasualties(s,t,null,null,()=>face(6)),null,'one test a phase');
});
test('D: two units under one incendiary template: only models under it are hit, and each wounded unit tests once',()=>{
 const s=shooting(['I1','I2']),a=G.getUnit(s,'I1'),b=G.getUnit(s,'I2'),w=G.size(a).w;Object.assign(a,{x:30-w/2-.5,y:22,heading:180});Object.assign(b,{x:30+w/2+.5,y:22,heading:180});
 // Aimed at I1, scattered 2″ east: the template sits over the gap between them.
 const r=G.fireRocket(s,'I1','incendiary',{artillery:2,scatter:90},split(s,[4],[5,5,6,6]));
 assert.ok(r.affected.length<40,'not every model of the two units');assert.deepEqual(r.units.map(u=>u.unit).sort(),['I1','I2']);assert.ok(r.units.every(u=>u.killed>0&&!u.destroyed));
 assert.equal(entries(s,'I1').length,1);assert.equal(entries(s,'I2').length,1);assert.ok(r.panic.every(e=>e.cause==='Infernal Incendiaries'));
});
// A Chaos Dwarf regiment (A2, 20 models) destroyed in the Shooting phase, and a friend (A3) near it.
function nearby(gapInches,models=5){const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'iron'});G.nextPhase(s);G.nextPhase(s);for(const u of s.units)u.charge=null;only(s,['A2','A3','I1']);
 const d=G.getUnit(s,'A2'),f=G.getUnit(s,'A3');d.deadModels=G.modelSquares(s,d).map(m=>m.index).slice(models);Object.assign(d,{x:30,y:30,heading:0});Object.assign(f,{x:30+G.size(d).w/2+gapInches+G.size(f).w/2,y:30,heading:0});Object.assign(G.getUnit(s,'I1'),{x:30,y:6,heading:180});
 assert.ok(Math.abs(G.gap(d,f)-gapInches)<1e-6);G.removeCasualties(s,d,models);G.destroyUnit(s,d,'COMBAT_CASUALTIES',()=>face(6));return {s,d,f};}
test('E and F: a unit of Unit Strength 5 at the start of the phase destroyed: a friend 6″ away tests, one 6.01″ away does not; Unit Strength 4 sets off nothing',()=>{
 const at6=nearby(6);const e=entries(at6.s,'A3')[0];assert.equal(e.cause,'Nearby Friend Destroyed');assert.equal(e.source,'A2');assert.ok(Math.abs(e.distance-6)<1e-6);assert.equal(e.passed,false);
 assert.equal(e.retreatFrom,'I1','away from the nearest enemy, not from the destroyed friend');
 assert.equal(entries(nearby(6.01).s,'A3').length,0);assert.equal(entries(nearby(3,4).s,'A3').length,0,'Unit Strength 4');
});
// A hand-built combat: I1 has lost to A1 and retreats; I2 stands 5″ from I1.
function lostCombat(outcome){const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'ash'});for(const u of s.units)u.charge=null;only(s,['A1','I1','I2']);
 const w=G.getUnit(s,'A1'),l=G.getUnit(s,'I1'),f=G.getUnit(s,'I2');Object.assign(w,{x:30,y:30,heading:0});Object.assign(l,{x:30,y:30-G.size(w).h,heading:180});Object.assign(f,{x:30+G.size(l).w+5,y:l.y,heading:180});w.engaged=['I1'];l.engaged=['A1'];
 Object.assign(s,{stage:'combat',team:'ash'});s.lastCombat={winnerSide:'ash'};s.combatHistory=[s.lastCombat];s.pendingCombat={winner:'A1',loser:'I1',margin:1,stage:'retreat',outcome};
 const r=G.moveCombatLoser(s,()=>face(6));return {s,r,f};}
test('G: a loser of Unit Strength 5+ Falling Back in Good Order makes friends within 6″ test; Giving Ground does not',()=>{
 const back=lostCombat('fall-back');const e=entries(back.s,'I2')[0];assert.equal(e?.cause,'Nearby Friend Flees Combat');assert.ok(Math.abs(e.distance-5)<1e-6,'measured before it moved');
 assert.equal(entries(lostCombat('give-ground').s,'I2').length,0);
 assert.equal(G.PANIC_POLICY.loserStrength,'current','the documented default timing');
});
// A failed shooting Panic test: I1 at (30,22) faces down; it retreats north, away from A1 below it.
function retreat(friendX){const s=shooting(['I1','I2']);const t=G.getUnit(s,'I1'),f=G.getUnit(s,'I2');Object.assign(t,{x:30,y:22,heading:180});Object.assign(f,{x:friendX,y:15,heading:180});
 const enemy=G.getUnit(s,'A1');Object.assign(enemy,{x:30,y:34,heading:0});G.removeCasualties(s,t,6);const p=G.heavyCasualties(s,t,enemy,enemy,()=>face(6));return {s,p,f};}
test('H: a retreat passing 2″ beside a friend sets off no test; one that crosses it does',()=>{
 const beside=retreat(30+4.92+2);assert.equal(beside.p.passed,false);assert.deepEqual(beside.p.crossed,[]);assert.equal(entries(beside.s,'I2').length,0,'no test for being near');
 const through=retreat(30);assert.deepEqual(through.p.crossed,['I2']);const e=entries(through.s,'I2')[0];assert.equal(e.cause,'Fled Through');assert.equal(e.source,'I1');
});
test('I: a unit that has tested this phase does not test again when fled through',()=>{
 const s=shooting(['I1','I2']);const t=G.getUnit(s,'I1'),f=G.getUnit(s,'I2');Object.assign(t,{x:30,y:22,heading:180});Object.assign(f,{x:30,y:15,heading:180});Object.assign(G.getUnit(s,'A1'),{x:30,y:34,heading:0});
 assert.equal(G.panicTest(s,f,{random:()=>face(1)}).passed,true);G.removeCasualties(s,t,6);const p=G.heavyCasualties(s,t,null,null,()=>face(6));
 assert.deepEqual(p.crossed,['I2']);assert.equal(entries(s,'I2').length,1,'still only its first test');
});
test('J: engaged, charging and fleeing units take no test; a majority Immune to Psychology passes; double 1 passes, double 6 fails',()=>{
 const s=shooting(['I1','I2','I3']);const [a,b,c]=['I1','I2','I3'].map(id=>G.getUnit(s,id));a.engaged=['A1'];assert.equal(G.panicExempt(s,a),'engaged in combat');assert.equal(G.panicTest(s,a,{random:()=>face(6)}),null);
 a.engaged=null;a.charge={status:'declared',target:'A1'};assert.equal(G.panicExempt(s,a),'making a charge');a.charge=null;b.fleeing=true;assert.equal(G.panicExempt(s,b),'already fleeing');
 c.rules=['immuneToPsychology'];const p=G.panicTest(s,c,{random:()=>face(6)});assert.equal(p.passed,true);assert.equal(p.auto,'Immune to Psychology');
 const d=shooting(['I1','I2']),[x,y]=['I1','I2'].map(id=>G.getUnit(d,id));Object.assign(x,{x:30,y:22});Object.assign(y,{x:50,y:22});
 assert.equal(G.panicTest(d,x,{random:()=>face(1)}).natural,'double 1');const six=G.panicTest(d,y,{random:()=>face(6)});assert.equal(six.passed,false);assert.equal(six.natural,'double 6');
});
test('Hold Your Ground: a failed test is re-rolled once within the Battle Standard Bearer\'s Command range',()=>{
 // No roster here has a Battle Standard yet: the Master Mage stands in as one.
 const s=shooting(['I1','I7']),t=G.getUnit(s,'I1'),bsb=G.getUnit(s,'I7');Object.assign(t,{x:30,y:22,heading:180});Object.assign(bsb,{x:40,y:22,heading:180,battleStandard:true});
 const p=G.panicTest(s,t,{random:(()=>{const f=[5,5,1,2];let i=0;return ()=>face(f[Math.min(i++,f.length-1)]);})()});assert.deepEqual(p.reroll,[1,2]);assert.equal(p.passed,true);
 bsb.fleeing=true;const q=shooting(['I2','I7']);Object.assign(G.getUnit(q,'I2'),{x:30,y:22});Object.assign(G.getUnit(q,'I7'),{x:40,y:22,battleStandard:true,fleeing:true});assert.equal(G.panicTest(q,G.getUnit(q,'I2'),{random:()=>face(5)}).reroll,undefined,'not while the bearer flees');
});
test('K: a Demolition centre hit on a one-Wound model kills that model only',()=>{
 const s=shooting(),t=G.getUnit(s,'I1');Object.assign(t,{x:30,y:22,heading:180});const r=G.fireRocket(s,'I1','demolition',{artillery:2,scatter:'hit'},split(s,[6],[1,1]));
 const centre=r.affected.find(a=>a.centre);assert.equal(centre.wounds,1,'Multiple Wounds (D6) cannot reach beyond its one model');assert.equal(r.units[0].killed,r.affected.filter(a=>a.slain).length);
});
test('L: a Fall Back in Good Order across the battlefield edge removes the unit, apart from the shot\'s casualties',()=>{
 const s=shooting(),t=G.getUnit(s,'I1');Object.assign(t,{x:30,y:5,heading:180});
 const r=G.fireRocket(s,'I1','incendiary',{artillery:2,scatter:'hit'},split(s,oneKill,[5,5,5,5]));
 assert.deepEqual([r.units[0].killed,r.units[0].destroyed],[1,false],'the rocket killed one model');const p=r.panic[0];
 assert.equal(p.outcome,'fall-back');assert.equal(p.fledOffBoard,true);assert.equal(p.destroyed,true);assert.equal(p.destroyedReason,'fell back off the battlefield');assert.equal(t.destroyed,true);
 assert.match(G.panicText(p),/Destroyed: fell back off the battlefield/);
});
