import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

// Line of sight and cover (the user's line-of-sight brief of 2 October 2026, section 17).
const test=(name,fn)=>{fn();console.log('PASS '+name);};
const rect=(x0,y0,x1,y1)=>[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];
const area=(id,points,sight='blocks')=>({id,key:sight==='wood'?'wood':'building',name:sight==='wood'?'Woodland':'Building',kind:sight==='wood'?'wood':'building',movement:sight==='wood'?'difficult':'impassable',sight,points});
const feature=(id,key,x,y,heading=0)=>({id,...G.makeFeature(key,x,y,heading)});
const only=(s,keep)=>{for(const p of G.combatants(s))if(!keep.includes(p.id)){p.x=null;p.y=null;}};
function game(first='iron'){const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:first});for(const u of s.units)u.charge=null;return s;}
// The State Missile Troops (I4, crossbows, five files of four) at (30,10) face down the table at the
// Chaos Dwarf Warriors (A1) 20″ away at (30,30).
function range(){const s=game();only(s,['I4','A1']);Object.assign(s,{stage:'shooting',team:'iron'});const u=G.getUnit(s,'I4'),t=G.getUnit(s,'A1');Object.assign(u,{x:30,y:10,heading:180,moved:false,spent:0,movedThisTurn:false,shot:false});Object.assign(t,{x:30,y:30,heading:0});return {s,u,t,a2:G.getUnit(s,'A2')};}
const shot=(s,u,t,o)=>G.shootingPlan(s,u,t,o);

test('a formed unit cannot see behind itself; any part of a target in its arc will do',()=>{
 const {s,u,t}=range();Object.assign(t,{x:30,y:2});assert.equal(G.sightPlan(s,u,t).code,'OUTSIDE_VISION_ARC');assert.match(shot(s,u,t).error,/front arc/);
 Object.assign(t,{x:45,y:22});assert.equal(G.withinVisionArc(u,{...t,x:45,y:22,heading:0})&&true,true);assert.equal(G.sightPlan(s,u,t).visible,true,'its centre is outside the arc, a corner inside');
});
test('one model seeing the target does not let every model shoot',()=>{
 const {s,u,t}=range();s.terrain=[area('B1',rect(24,14,30.2,26))];const sight=G.sightPlan(s,u,t),p=shot(s,u,t);
 assert.deepEqual(sight.lookers.map(l=>l.sees),[true,true,true,false,false]);assert.equal(sight.lookers[3].code,'BLOCKED_BY_TERRAIN');assert.equal(p.shooters,3);
});
test('a visible flank model is enough to see the unit',()=>{
 const {s,u,t}=range();s.terrain=[area('B1',rect(20,14,32,26))];const sight=G.sightPlan(s,u,t);assert.equal(sight.visible,true);assert.ok(sight.lookers.every(l=>!l.sees||l.line.to.x>31.4),'only its right-hand file shows past the building');
});
test('rear ranks shoot only with a rule that allows it, and see what the front of their file sees',()=>{
 const {s,u,t}=range();assert.equal(shot(s,u,t).shooters,5,'the front rank');
 s.terrain=[feature('H1','hill',30,10)];assert.equal(G.entirelyOnHill(s,u)?.id,'H1');assert.equal(shot(s,u,t).shooters,10,'entirely on a hill: one more rank');
 s.terrain=[feature('H1','hill',30,14)];assert.equal(G.entirelyOnHill(s,u),null);assert.equal(shot(s,u,t).shooters,5,'partly on a hill: no extra rank');
 s.terrain=[feature('H1','hill',30,10),area('B1',rect(24,14,30.2,26))];assert.equal(shot(s,u,t).shooters,6,'the second rank of the two hidden files does not shoot');
});
test('other units block the view, friend or foe; a unit has no cover from its own models',()=>{
 const {s,u,t,a2}=range();const p=shot(s,u,t);assert.equal(p.cover,'none');assert.ok(!p.modifiers.some(m=>/cover/.test(m.label)),'its own rear ranks do not hide it');
 Object.assign(a2,{x:30,y:20,heading:0});assert.equal(G.sightPlan(s,u,t).code,'BLOCKED_BY_MODEL');
 a2.x=null;const friend=G.getUnit(s,'I1');Object.assign(friend,{x:30,y:20,heading:180});assert.equal(G.sightPlan(s,u,t).code,'BLOCKED_BY_MODEL','friendly infantry blocks');
});
test('partial and full cover by the proportion of models obscured; full cover is still a target',()=>{
 const {s,u,t}=range();s.terrain=[area('B1',rect(24,14,30.2,26))];let p=shot(s,u,t);assert.equal(p.cover,'partial');assert.ok(p.modifiers.some(m=>m.label==='Partial cover'&&m.value===-1));
 s.terrain=[area('B1',rect(24,20,31.6,26))];p=shot(s,u,t);assert.equal(p.error,undefined);assert.equal(p.cover,'full');assert.ok(p.modifiers.some(m=>m.label==='Full cover'&&m.value===-2));assert.ok(!p.modifiers.some(m=>m.label==='Partial cover'),'never both');
 s.terrain=[feature('W1','wall',30,27.7)];p=shot(s,u,t);assert.equal(p.cover,'partial','a low wall in front of it: half obscured, not full cover');assert.match(p.coverReason,/Low wall/);
 s.terrain=[feature('W1','wall',30,12.5)];assert.equal(shot(s,u,t).cover,'none','a wall at the shooters\' feet hides nothing');
});
test('woods: opaque between models outside them, not around their edge; models inside are seen, with partial cover',()=>{
 const {s,u,t}=range();s.terrain=[area('W1',rect(24,18,36,22),'wood')];assert.equal(G.sightPlan(s,u,t).code,'BLOCKED_BY_WOOD');
 s.terrain=[area('W1',rect(24,18,31,22),'wood')];assert.equal(G.sightPlan(s,u,t).visible,true,'a clear line round its edge');
 s.terrain=[area('W1',rect(20,26,40,36),'wood')];const p=shot(s,u,t);assert.equal(p.error,undefined,'not invisible inside');assert.equal(p.cover,'partial');assert.match(p.coverReason,/in Woodland/);
});
test('hills: a hill between two units off it blocks; a unit entirely on a hill sees over units, and is seen over them',()=>{
 const {s,u,t,a2}=range();s.terrain=[feature('H1','hill',30,20)];assert.equal(G.sightPlan(s,u,t).code,'BLOCKED_BY_HILL');
 Object.assign(a2,{x:30,y:20,heading:0});s.terrain=[];assert.equal(G.sightPlan(s,u,t).code,'BLOCKED_BY_MODEL');
 s.terrain=[feature('H1','hill',30,10)];assert.equal(G.sightPlan(s,u,t).visible,true,'over a unit not on a hill');
 s.terrain=[feature('H1','hill',30,14)];assert.equal(G.sightPlan(s,u,t).visible,false,'only partly on the hill');
 s.terrain=[feature('H1','hill',30,30)];assert.equal(G.entirelyOnHill(s,t)?.id,'H1');assert.equal(G.sightPlan(s,u,t).visible,true,'a ground unit sees a unit entirely on a hill over others');
});
test('on one hill, the unit nearer the top sees over the lower one, not the other way round',()=>{
 const s=game();only(s,['I4','A1','A2']);Object.assign(s,{stage:'shooting',team:'iron'});const u=G.getUnit(s,'I4'),a1=G.getUnit(s,'A1'),a2=G.getUnit(s,'A2');Object.assign(u,{x:30,y:12,heading:180,moved:false,spent:0,movedThisTurn:false,shot:false});
 const big=feature('H1','hill',30,12);big.points=big.points.map(p=>({x:30+(p.x-30)*3,y:12+(p.y-12)*3}));big.top={x:30,y:8};s.terrain=[big];
 Object.assign(a2,{x:30,y:18,heading:0});Object.assign(a1,{x:30,y:26,heading:0});assert.equal(shot(s,u,a1).error,undefined,'higher: sees over the lower unit');
 Object.assign(u,{x:30,y:18,heading:0});Object.assign(a2,{x:30,y:12,heading:0});Object.assign(a1,{x:30,y:4,heading:180});assert.match(shot(s,u,a1).error,/another unit/,'lower: the higher unit is in the way');
});
test('Large Target: seen over other units and seen over by them, never in cover, one more rank — but not through a wood',()=>{
 const {s,u,t,a2}=range();t.rules=['largeTarget'];Object.assign(a2,{x:30,y:20,heading:0});let p=shot(s,u,t);assert.equal(p.error,undefined);assert.equal(p.shooters,10);assert.equal(p.cover,'none');
 a2.rules=['largeTarget'];assert.equal(G.sightPlan(s,u,t).code,'BLOCKED_BY_MODEL','not over another Large Target');a2.x=null;
 s.terrain=[area('W1',rect(20,26,40,36),'wood')];assert.equal(shot(s,u,t).cover,'none','no cover even in a wood');
 s.terrain=[area('W1',rect(24,18,36,22),'wood')];assert.equal(G.sightPlan(s,u,t).code,'BLOCKED_BY_WOOD');
});
test('spells: a Hex needs only the vision arc and range; a Magic Missile needs line of sight too',()=>{
 const s=game();only(s,['I7','A1','A2']);const w=G.getUnit(s,'I7');Object.assign(w,{x:30,y:10,heading:180,spells:['fireball','coward'],castThisTurn:[]});Object.assign(G.getUnit(s,'A1'),{x:30,y:24,heading:0});Object.assign(G.getUnit(s,'A2'),{x:30,y:16,heading:0});
 Object.assign(s,{stage:'shooting',team:'iron'});assert.match(G.targetReason(s,'I7','fireball',G.getUnit(s,'A1'))??'',/No line of sight/);
 Object.assign(s,{stage:'strategy'});assert.equal(G.targetReason(s,'I7','coward',G.getUnit(s,'A1')),null);
 assert.equal(G.allRoundVision(w),true,'a Lone wizard is in Skirmish formation');w.joined='I1';assert.equal(G.allRoundVision(w),false,'joined, it takes its unit\'s formation');
});
test('charges: the charger must see its target when it declares',()=>{
 const s=game('ash');only(s,['A1','I1']);Object.assign(s,{stage:'movement',team:'ash',movementStep:'declare'});const a=G.getUnit(s,'A1'),e=G.getUnit(s,'I1');Object.assign(a,{x:30,y:30,heading:0});Object.assign(e,{x:30,y:20,heading:180});
 s.terrain=[area('W1',rect(24,24.5,36,25.5),'wood')];assert.match(G.chargePlan(s,a,e).error,/cannot see its target: a wood/);assert.equal(G.chargePlan(s,a,e,{sight:false}).error,undefined,'not checked again once declared');
 s.terrain=[area('W1',rect(24,24.5,30,25.5),'wood')];assert.equal(G.chargePlan(s,a,e).error,undefined);
});
test('a cannon needs to see its target point, not the target unit; on a hill it sees over units, not through woods',()=>{
 const s=game();only(s,['I5','A1','A2','A3']);Object.assign(s,{stage:'shooting',team:'iron'});const c=s.cannons[0];Object.assign(c,{x:30,y:4,heading:180});const a1=G.getUnit(s,'A1'),a2=G.getUnit(s,'A2'),a3=G.getUnit(s,'A3');a3.x=null;Object.assign(a1,{x:30,y:34,heading:0});Object.assign(a2,{x:30,y:29,heading:0});
 assert.equal(G.sightPlan(s,{...c,heading:180},a1,{lookers:'all'}).visible,false,'the unit is hidden');assert.match(G.cannonPlan(s,'I5',a1,{aimShort:6}).error,/target point/);assert.equal(G.cannonPlan(s,'I5',a1,{aimShort:10}).error,undefined,'its target point is seen');
 a2.x=null;s.terrain=[area('B1',rect(28,14,32,18))];assert.match(G.cannonPlan(s,'I5',a1,{aimShort:6}).error,/target point: terrain/);
 s.terrain=[];Object.assign(a3,{x:30,y:14,heading:0});assert.match(G.cannonPlan(s,'I5',a1,{aimShort:6}).error,/another unit/);
 s.terrain=[feature('H1','hill',30,4)];assert.equal(G.cannonPlan(s,'I5',a1,{aimShort:6}).error,undefined,'from a hill, over a unit not on one');
 a3.x=null;s.terrain.push(area('W1',rect(24,18,36,20),'wood'));assert.match(G.cannonPlan(s,'I5',a1,{aimShort:6}).error,/a wood/);
});
test('a cannonball cannot fly past blocking terrain on its first roll',()=>{
 const s=game();only(s,['I5','A1']);Object.assign(s,{stage:'shooting',team:'iron'});const c=s.cannons[0];Object.assign(c,{x:30,y:4,heading:180});const a1=G.getUnit(s,'A1');Object.assign(a1,{x:30,y:36,heading:0});
 s.terrain=[area('B2',rect(26,30,34,31))];const r=G.fireCannon(s,'I5','A1','ball',{strike:6,bounce:2},()=>.99,{aimShort:8});
 assert.equal(r.stoppedInFlight,true);assert.ok(Math.abs(r.strike.y-30)<1e-6,`stopped at the building, ${r.strike.y}`);assert.deepEqual(r.end,r.strike,'no bounce');
});
test('Indirect Fire waives line of sight only for a weapon that has it',()=>{
 const s=game('ash');only(s,['A5','I1']);Object.assign(s,{stage:'shooting',team:'ash'});Object.assign(s.rocket,{x:30,y:44,heading:0});const t=G.getUnit(s,'I1');Object.assign(t,{x:30,y:20,heading:180});
 s.terrain=[area('W1',rect(24,30,36,32),'wood')];assert.match(G.rocketPlan(s,t).error,/a wood is in the way/);assert.equal(G.rocketPlan(s,t,{indirect:true}).error,undefined);
});
test('Stand & Shoot takes its line of sight and cover when it is declared',()=>{
 const {s,u,t}=range();s.terrain=[feature('W1','wall',30,27.7)];const p=shot(s,u,t,{reaction:true});assert.equal(p.error,undefined);assert.ok(p.modifiers.some(m=>m.label==='Partial cover'));assert.ok(p.modifiers.some(m=>m.label==='Stand & Shoot'));
 s.terrain=[area('W1',rect(24,18,36,22),'wood')];assert.match(shot(s,u,t,{reaction:true}).error,/line of sight/,'charged out of sight: no Stand & Shoot');
});
test('a visible character near its regiment is still not a legal target',()=>{
 const s=game('ash');only(s,['A4','I7','I1']);Object.assign(s,{stage:'shooting',team:'ash'});const a4=G.getUnit(s,'A4');Object.assign(a4,{x:30,y:36,heading:0,moved:false,spent:0,movedThisTurn:false,shot:false});Object.assign(G.getUnit(s,'I1'),{x:30,y:24,heading:180});const c=G.getUnit(s,'I7');Object.assign(c,{x:34.5,y:21,heading:180});
 assert.equal(G.sightPlan(s,a4,c).visible,true);const p=shot(s,a4,c);assert.match(p.error,/closest target/);assert.equal(p.code,'VISIBLE_BUT_ILLEGAL_TARGET');
});
