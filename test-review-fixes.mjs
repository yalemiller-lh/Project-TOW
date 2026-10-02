import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
import './dist/battlemarch.mjs';
import * as BM from './dist/battlemarch.mjs';

// Regressions found by the 1 October 2026 review: each was reproduced before it was fixed.
const test=(name,fn)=>{fn();console.log('PASS '+name);};
const clearExcept=(s,keep)=>{for(const p of G.combatants(s))if(!keep.includes(p.id)){p.x=null;p.y=null;}};

test('arcs run out from the base corners at 45°: flush on the front of a 5 × 2 regiment is a front charge',()=>{
 const s=G.createGame('empire',{format:'battle-march',points:500});G.autoDeploy(s);clearExcept(s,['A1','I2']);
 const a=G.getUnit(s,'A1'),t=G.getUnit(s,'I2');
 for(let h=0;h<360;h+=15){t.heading=h;const r=h*Math.PI/180,depth=(G.size(t).h+G.size(a).h)/2;Object.assign(t,{x:22,y:15});Object.assign(a,{x:22+Math.sin(r)*depth,y:15-Math.cos(r)*depth,heading:(h+180)%360});assert.equal(G.chargeFace(a,t),'front',`target heading ${h}°`);}
});
test('a target any part of which is in the front arc can be charged, though its centre is outside',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0);clearExcept(s,['A1','I1']);Object.assign(s,{stage:'movement',movementStep:'declare',team:'ash'});
 const a=G.getUnit(s,'A1'),t=G.getUnit(s,'I1');Object.assign(a,{x:30,y:30,heading:0});Object.assign(t,{x:37.5,y:24,heading:180});
 const dx=t.x-a.x,dy=t.y-a.y;assert.ok(Math.abs(dx)>-dy,'the target centre is outside the old centre-based cone');
 assert.equal(G.inVisionArc(a,t),true);assert.doesNotMatch(G.chargePlan(s,a,t).error??'',/front arc/);
 Object.assign(t,{x:44,y:30});assert.equal(G.inVisionArc(a,t),false,'level with the charger: not in its front arc');
});
test('a regiment shot down to its last model leaves the battlefield and scores in full',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);s.rocket.wounds=0;G.begin(s);G.nextPhase(s);clearExcept(s,['A1','I4']);
 Object.assign(s,{stage:'shooting',team:'iron'});const a=G.getUnit(s,'A1'),i4=G.getUnit(s,'I4');Object.assign(i4,{x:35,y:15,heading:180,moved:false,shot:false,movementMode:null});Object.assign(a,{x:35,y:25,heading:0});
 a.deadModels=G.modelSquares(s,a).map(m=>m.index).slice(1);assert.equal(G.aliveCount(a),1);
 let n=0;const r=()=>n++<10?.99:0;G.shoot(s,'I4','A1',r);
 assert.equal(G.aliveCount(a),0);assert.equal(a.x,null,'no empty block left as a blocker');assert.equal(a.destroyed,true);
});
test('in Battle March a spell kill counts as destroyed for VP',()=>{
 const s=G.createGame('empire',{format:'battle-march',points:500});G.autoDeploy(s);const t=G.getUnit(s,'I2');t.deadModels=G.modelSquares(s,t).map(m=>m.index).slice(1);
 G.removeCasualties(s,t,1);assert.equal(G.aliveCount(t),0);
 // removeCasualties alone leaves the bookkeeping to the attack; the shared wipe-out runs inside every attack path.
 const s2=G.createGame('empire',{format:'battle-march',points:500});G.autoDeploy(s2);G.begin(s2,()=>0,{firstPlayer:'ash'});clearExcept(s2,['A6','I2']);
 const w=G.getUnit(s2,'A6'),c=G.getUnit(s2,'I2');Object.assign(s2,{stage:'shooting',team:'ash'});Object.assign(w,{x:20,y:24,heading:0,spells:['fireball'],castThisTurn:[]});Object.assign(c,{x:20,y:14,heading:180});c.deadModels=G.modelSquares(s2,c).map(m=>m.index).slice(1);
 let n=0;const r=()=>[.99,.99,.99,.99,.99,0][n++%6];G.castSpell(s2,'A6','fireball','I2',r);
 assert.equal(c.x,null);assert.equal(c.destroyed,true);assert.equal(BM.casualtyVP(c).reason,'destroyed');
});
test('an ordinary move cannot close into contact with an enemy that starts within 1″',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0);clearExcept(s,['A1','I1']);Object.assign(s,{stage:'movement',movementStep:'remaining',team:'iron'});
 const a=G.getUnit(s,'A1'),t=G.getUnit(s,'I1');Object.assign(a,{x:30,y:30,heading:0});Object.assign(t,{x:30,y:30-G.size(a).h-.5,heading:180,moved:false,spent:0,charge:null});
 assert.match(G.orderError(s,t,{kind:'advance',mode:'advance',distance:.5,angle:0})??'',/1″|block/);
});
test('an enemy Pillar of Fire in dispel range keeps Strategy open and the wizard active',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0);const w=G.getUnit(s,'A6'),caster=G.getUnit(s,'I7');
 Object.assign(w,{x:30,y:30,spells:['fireball','pillar'],castThisTurn:[]});s.vortices=[{caster:caster.id,x:30,y:22,radius:1.5}];Object.assign(s,{stage:'strategy',team:'ash'});
 for(const u of s.units)if(u.team==='ash')u.fleeing=false;
 assert.equal(G.phaseHasActions(s),true);assert.equal(G.inactionReason(s,w),null);assert.equal(G.phaseComplete(s,w),false);
});
test('a regiment flush against the front of a narrower unit fights its front: no flank bonus',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0);clearExcept(s,['A6','I1']);const w=G.getUnit(s,'A6'),t=G.getUnit(s,'I1');
 Object.assign(t,{x:30,y:20,heading:180});Object.assign(w,{x:30,y:20+(G.size(t).h+G.size(w).h)/2,heading:0});w.engaged=['I1'];t.engaged=['A6'];Object.assign(s,{stage:'combat',team:'ash'});
 assert.equal(G.chargeFace(t,w),'front','five files wide against a 25 mm base');G.resolveCombat(s,'A6',()=>0);assert.equal(s.lastCombat.score.iron.flank,0);
});
test('a shield counts once against shooting, artillery and magic; a regiment\'s Parry adds one in close combat, to 3+',()=>{
 const s=G.createGame('empire',{format:'battle-march',points:500});G.autoDeploy(s);
 const warriors=s.units.find(u=>u.entry==='warriors'),troops=s.units.find(u=>u.entry==='stateTroops'),dec=s.units.find(u=>u.entry==='decimators');
 assert.equal(G.armourSave(warriors),4,'heavy armour and shields');assert.equal(G.armourSave(troops),5,'light armour and shields');assert.equal(G.armourSave(dec),G.hasShield(dec)?4:5);
 assert.equal(G.saveTarget(warriors,troops),3,'Parry');assert.equal(G.saveTarget(troops,warriors),4,'5+ with Parry');
 assert.equal(G.armourSave({...troops,shields:false}),6,'State Troops without shields');
});
test('a missile unit that holds its ground has not moved: no −1 to hit, and Volley Fire still allowed',()=>{
 const s=G.createGame('empire',{format:'battle-march',points:500});G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'ash'});const dec=s.units.find(u=>u.entry==='decimators'),t=s.units.find(u=>u.entry==='stateTroops');clearExcept(s,[dec.id,t.id]);
 Object.assign(dec,{x:22,y:24,heading:0,moved:false,spent:0,movementMode:null});Object.assign(t,{x:22,y:24-G.size(dec).h/2-6-G.size(t).h/2,heading:180});Object.assign(s,{stage:'movement',movementStep:'remaining',team:'ash'});
 G.hold(s,dec.id);s.stage='shooting';const held=G.shootingPlan(s,dec,t);assert.equal(held.modifiers.some(m=>m.label==='Moved'),false);const all=held.shooters;
 const m=G.createGame('empire',{format:'battle-march',points:500});G.autoDeploy(m);G.begin(m,()=>0,{firstPlayer:'ash'});const d2=m.units.find(u=>u.entry==='decimators'),t2=m.units.find(u=>u.entry==='stateTroops');clearExcept(m,[d2.id,t2.id]);
 Object.assign(d2,{x:22,y:25,heading:0,moved:false,spent:0,movementMode:null});Object.assign(t2,{x:22,y:24-G.size(d2).h/2-6-G.size(t2).h/2,heading:180});Object.assign(m,{stage:'movement',movementStep:'remaining',team:'ash'});
 G.commitOrder(m,d2.id,{kind:'advance',mode:'advance',distance:1,angle:0});m.stage='shooting';const moved=G.shootingPlan(m,d2,t2);
 assert.ok(moved.shooters<all,`after moving only the front rank shoots (${moved.shooters} of ${all}): no Volley Fire`);
});
test('missile regiments may shoot at war machines, at the machine\'s Toughness 6',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'iron'});Object.assign(s,{stage:'shooting',team:'iron'});const u=G.getUnit(s,'I4');clearExcept(s,['I4','A5']);
 Object.assign(u,{x:30,y:10,heading:180,moved:false,shot:false});Object.assign(s.rocket,{x:30,y:25,heading:0});
 assert.ok(G.shootingTargets(s,u).some(t=>t.unit.id==='A5'&&!t.plan.error));assert.equal(G.shoot(s,'I4','A5',()=>.99).toWound,6);
});
test('a lone character beside a friendly regiment can be shot or targeted by a spell only when it is the closest target',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'iron'});Object.assign(s,{stage:'shooting',team:'iron'});const u=G.getUnit(s,'I4'),w=G.getUnit(s,'A6'),a=G.getUnit(s,'A1'),mage=G.getUnit(s,'I7');clearExcept(s,['I4','A6','A1','I7']);
 Object.assign(u,{x:30,y:10,heading:180,moved:false,shot:false});Object.assign(a,{x:30,y:30,heading:0});Object.assign(w,{x:30+G.size(a).w/2+2.5,y:30,heading:0});Object.assign(mage,{x:24,y:10,heading:180,spells:['fireball'],castThisTurn:[]});
 assert.match(G.shootingPlan(s,u,w).error??'',/closest target/);assert.match(G.targetReason(s,'I7','fireball',w)??'',/closest target/);
 a.x=60;assert.equal(G.shootingPlan(s,u,w).error,undefined,'with the regiment gone it may be shot');
});
test('a fleeing unit that fails to rally flees again, 2D6 straight ahead, in Compulsory Moves',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'ash'});clearExcept(s,['A1','I1']);const a=G.getUnit(s,'A1');Object.assign(a,{x:30,y:30,heading:180,fleeing:true});Object.assign(G.getUnit(s,'I1'),{x:60,y:6});
 assert.equal(G.rally(s,'A1',()=>.999).success,false);const y=a.y;G.nextPhase(s);assert.equal(s.movementStep,'remaining');
 assert.equal(s.compulsoryReports.length,1);assert.equal(s.compulsoryReports[0].unit,'A1');assert.ok(a.y>y+1,'it fled toward the way it faces');assert.equal(a.fleeing,true);
});
test('Panic: losing more than a quarter of its models to shooting makes a unit test; it Falls Back while more than half remain, and flees otherwise',()=>{
 // Five crossbows hit and wound; the saves fail; the Panic roll is 12. Sixteen models lose five
 // (11 of 20 left: Fall Back); twelve lose five (7 left: flee).
 for(const [dead,outcome] of [[4,'fall-back'],[8,'flee']]){
  const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'iron'});Object.assign(s,{stage:'shooting',team:'iron'});const u=G.getUnit(s,'I4'),t=G.getUnit(s,'A1');clearExcept(s,['I4','A1']);
  Object.assign(u,{x:30,y:10,heading:180,moved:false,shot:false});Object.assign(t,{x:30,y:24,heading:0});t.deadModels=G.modelSquares(s,t).map(m=>m.index).slice(20-dead).slice(0,dead);
  // Every shot hits, wounds and goes unsaved, then the Panic test is failed (12).
  let i=0;const r=G.shoot(s,'I4','A1',()=>i++<10?.99:i<=15?0:.99);assert.ok(r.unsaved>(20-dead)/4,'more than a quarter lost');assert.equal(r.panic?.cause,'Heavy Casualties');assert.equal(r.panic.passed,false);assert.equal(r.panic.outcome,outcome);
  assert.equal(t.fleeing,outcome==='flee');assert.ok(t.y>24,'it moved away from the crossbows');
 }
});
test('Panic: friendly units within 6″ test when a unit of Unit Strength 5 or more is destroyed',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'iron'});Object.assign(s,{stage:'shooting',team:'iron'});const u=G.getUnit(s,'I4'),t=G.getUnit(s,'A1'),f=G.getUnit(s,'A2');clearExcept(s,['I4','A1','A2']);
 Object.assign(u,{x:30,y:10,heading:180,moved:false,shot:false});Object.assign(t,{x:30,y:24,heading:0});Object.assign(f,{x:30+G.size(t).w+3,y:24,heading:0});t.deadModels=G.modelSquares(s,t).map(m=>m.index).slice(5);
 let i=0;G.shoot(s,'I4','A1',()=>i++<10?.99:i<=15?0:.99);assert.equal(t.destroyed,true);assert.ok((s.panicLog??[]).some(e=>e.unit==='A2'&&e.cause==='Nearby Friend Destroyed'));
});
test('Panic: one test a phase for each unit; a Frenzied unit passes',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0);const t=G.getUnit(s,'A1');
 assert.ok(G.panicTest(s,t,{random:()=>0}));assert.equal(G.panicTest(s,t,{random:()=>0}),null,'No Need for Hysterics');
 const f=G.getUnit(s,'A2');f.effects=[{rule:'frenzy',source:'test'}];assert.equal(G.panicTest(s,f,{random:()=>.99}).passed,true);
});
test('weapon rules: crossbows have Armour Bane (2), and a cannonball stops at impassable terrain',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'iron'});Object.assign(s,{stage:'shooting',team:'iron'});const u=G.getUnit(s,'I4'),t=G.getUnit(s,'A1');clearExcept(s,['I4','A1']);
 Object.assign(u,{x:30,y:10,heading:180,moved:false,shot:false});Object.assign(t,{x:30,y:24,heading:0});
 // Every die a 6 but the saves (5s): Chaos Dwarfs save 4+ (5 holds), but a 6 to wound makes it 6+ (5 fails).
 let i=0;const r=G.shoot(s,'I4','A1',()=>i++<10?.99:.7);assert.equal(r.toSave,4);assert.equal(r.unsaved,5,'every save of 5 fails against Armour Bane (2)');
 const c=G.createGame('empire');G.autoDeploy(c);G.begin(c,()=>0,{firstPlayer:'iron'});Object.assign(c,{stage:'shooting',team:'iron'});const can=c.cannons[0],a=G.getUnit(c,'A1');clearExcept(c,[can.id,'A1']);
 Object.assign(can,{x:30,y:4,heading:180});Object.assign(a,{x:30,y:44,heading:0});c.terrain=[{x:30,y:40,r:1,impassable:true,blocksSight:false}];
 const out=G.fireCannon(c,can.id,'A1','ball',{strike:4,bounce:10},()=>.5,{aimShort:10});assert.ok(out.strike.y<39,'it lands short of the terrain');assert.equal(out.stoppedByTerrain,true);assert.ok(out.end.y<=39+1e-6,'the bounce ends at the terrain edge');
});
