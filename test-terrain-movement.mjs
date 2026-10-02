import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

// Terrain and movement (the user's terrain brief of 1 October 2026, sections 7–9, 15 and 18):
// difficult and dangerous terrain, low walls, Move Through Cover, Iron Shod Wheels, defended
// obstacles, and fleeing around impassable terrain.
const test=(name,fn)=>{fn();console.log('PASS '+name);};
const dice=(...faces)=>{let i=0;return ()=>(faces[Math.min(i++,faces.length-1)]-1)/6+.01;};
const clearExcept=(s,keep)=>{for(const p of G.combatants(s))if(!keep.includes(p.id)){p.x=null;p.y=null;}};
const rect=(x0,y0,x1,y1)=>[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];
const wood=(id,points,movement='difficult')=>({id,key:'wood',name:movement==='dangerous'?'Dark woodland':'Woodland',kind:'wood',movement,sight:'wood',points});
const feature=(id,key,x,y,heading=0)=>({id,...G.makeFeature(key,x,y,heading)});
function battle(){const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'ash'});for(const u of s.units)u.charge=null;return s;}
// A1 (Movement 3) at (30,30) facing up: its front rank of five spans x 27.54–32.46 at y 28.03.
function block(){const s=battle();clearExcept(s,['A1','A6']);Object.assign(G.getUnit(s,'A6'),{x:8,y:44});const a=G.getUnit(s,'A1');Object.assign(a,{x:30,y:30,heading:0,moved:false,spent:0,movementMode:null});Object.assign(s,{stage:'movement',team:'ash',movementStep:'remaining'});return {s,a};}
const advance=distance=>({kind:'advance',mode:'advance',distance});

test('one model clipping difficult terrain slows the whole unit by 1″; open ground and a near miss do not',()=>{
 const {s,a}=block();s.terrain=[wood('T1',rect(32.2,24,34,26.6))];
 assert.match(G.orderError(s,a,advance(3))??'',/exceeds|allowance/,'M3 − 1');assert.equal(G.orderError(s,a,advance(2)),null);
 s.terrain[0].points=rect(32.6,24,34,26.6);assert.equal(G.orderError(s,a,advance(3)),null,'0.14″ clear of the right-hand model');
 s.terrain=[feature('H1','hill',30,26)];assert.equal(G.orderError(s,a,advance(3)),null,'a gentle hill is open ground');
 s.terrain=[feature('W1','wall',30,26.5)];assert.equal(G.movementOf(s.terrain[0]),'difficult');assert.match(G.orderError(s,a,advance(3))??'',/exceeds|allowance/,'crossing a low wall');
 assert.equal(G.modelsInDifficult(s,a).within,0,'nobody stands "in" a wall');
});
test('Move Through Cover removes the Movement penalty, not the terrain',()=>{
 const {s,a}=block();a.rules=['moveThroughCover'];s.terrain=[wood('T1',rect(26,24,34,26.6))];assert.equal(G.orderError(s,a,advance(3)),null);
 assert.deepEqual(G.terrainCrossed(s,a,[a,G.forwardPose(a,3)]).map(t=>t.id),['T1'],'still crossed');
});
test('charging through difficult terrain keeps the lower die and Movement − 1',()=>{
 const s=battle();clearExcept(s,['A1','I1','A6']);const ch=G.getUnit(s,'A1'),tg=G.getUnit(s,'I1');Object.assign(G.getUnit(s,'A6'),{x:4,y:44});Object.assign(ch,{x:30,y:36,heading:0});Object.assign(tg,{x:30,y:24,heading:180});
 s.terrain=[wood('T1',rect(25,29,35,31))];Object.assign(s,{stage:'movement',team:'ash',movementStep:'declare'});G.declareCharge(s,'A1','I1');G.chargeReaction(s,'A1','hold');G.finishDeclarations(s);
 const out=G.resolveCharge(s,'A1',[2,6],dice(3));assert.equal(out.difficult,true);assert.equal(out.roll,2,'the lower die');assert.equal(out.range,(3-1)+2);
});
test('dangerous terrain: a test for each model whose base touches it, once per feature; two features test separately',()=>{
 const {s,a}=block();s.terrain=[wood('D1',rect(26,26.5,34,27),'dangerous'),wood('D2',rect(26,26.1,34,26.3),'dangerous')];
 G.commitOrder(s,'A1',advance(2),dice(1,6,6,6,6,6,6,6,6,6));assert.deepEqual(s.lastTerrainHits.map(h=>[h.feature,h.tests,h.wounds]),[['D1',5,1],['D2',5,0]],'only the front rank reaches them');
 assert.equal(G.aliveCount(a),19);
 const one=block();one.s.terrain=[wood('D1',rect(20,20,40,40),'dangerous')];G.commitOrder(one.s,'A1',advance(1),dice(6));
 assert.equal(one.s.lastTerrainHits.length,1);assert.equal(one.s.lastTerrainHits[0].tests,20,'starting, crossing and ending in one feature is one test each');
 G.commitOrder(one.s,'A1',advance(.5),dice(6));assert.equal(one.s.lastTerrainHits.length,0,'the rest of the same move does not test again');
});
test('Move Through Cover re-rolls a Dangerous Terrain 1',()=>{
 const {s,a}=block();a.rules=['moveThroughCover'];s.terrain=[wood('D1',rect(26,26.5,34,27),'dangerous')];
 G.commitOrder(s,'A1',advance(2),dice(1,6,6,6,6,6));const hit=s.lastTerrainHits[0];assert.equal(hit.wounds,0);assert.deepEqual([hit.rolls[0].first,hit.rolls[0].reroll],[1,6]);assert.equal(G.aliveCount(a),20);
});
test('Iron Shod Wheels: difficult terrain is dangerous, a failed test costs D3 Wounds, and walls are impassable',()=>{
 const {s,a}=block();a.rules=['ironShodWheels'];s.terrain=[wood('T1',rect(26,26.5,34,27))];assert.equal(G.movementOf(s.terrain[0],a),'dangerous');assert.equal(G.movementOf(s.terrain[0]),'difficult');
 G.commitOrder(s,'A1',advance(2),dice(1,6,6,6,6,5));assert.equal(s.lastTerrainHits[0].wounds,3,'D3: a 5 is 3');assert.equal(G.aliveCount(a),17);
 const w=block();w.a.rules=['ironShodWheels'];w.s.terrain=[feature('W1','wall',30,26.5)];assert.equal(G.movementOf(w.s.terrain[0],w.a),'impassable');assert.match(G.orderError(w.s,w.a,advance(2))??'',/Impassable/);
 w.a.rules=[];assert.equal(G.orderError(w.s,w.a,advance(2)),null,'an ordinary unit climbs it');
});
// I1 faces down at (30,24): its front edge lies along y = 24 + depth/2. A low wall laid along it is defended.
function defended(offset=.3,heading=0){const s=battle();clearExcept(s,['A1','I1','A6']);const ch=G.getUnit(s,'A1'),tg=G.getUnit(s,'I1');Object.assign(G.getUnit(s,'A6'),{x:4,y:44});Object.assign(tg,{x:30,y:24,heading:180});
 const front=24+G.size(tg).h/2;Object.assign(ch,{x:30,y:front+5+G.size(ch).h/2,heading:0});s.terrain=[feature('W1','wall',30,front+offset,heading)];Object.assign(s,{stage:'movement',team:'ash',movementStep:'declare'});return {s,ch,tg};}
test('a unit whose front rank lines a low wall defends it: a charger without Fly makes a disordered charge',()=>{
 const {s,ch,tg}=defended();assert.equal(G.defendedObstacle(s,tg)?.id,'W1');assert.equal(G.defendedObstacle(s,tg,'left flank'),null,'only its front is defended');
 G.declareCharge(s,'A1','I1');G.chargeReaction(s,'A1','hold');G.finishDeclarations(s);const out=G.resolveCharge(s,'A1',[6,6],dice(3));
 assert.equal(out.success,true);assert.equal(out.difficult,true,'it still crosses the wall');assert.match(ch.charge.disordered??'',/defended low wall/);
 assert.ok(!G.disruption(s,ch).some(d=>d.kind==='obstacle'),'the charger meets the far side, it does not straddle it');assert.ok(!G.disruption(s,tg).some(d=>d.kind==='obstacle'));
 assert.equal(G.defendedObstacle(defended(2).s,G.getUnit(defended(2).s,'I1')),null,'2″ away is not in base contact');
 const across=defended(.3,90);assert.equal(G.defendedObstacle(across.s,across.tg),null,'a wall running away from the front is not defended');
});
test('a unit engaged while straddling a low wall is Disrupted',()=>{
 const s=battle();clearExcept(s,['A1','I1']);const a=G.getUnit(s,'A1'),e=G.getUnit(s,'I1');Object.assign(e,{x:30,y:24,heading:180});Object.assign(a,{x:30,y:24+G.size(e).h/2+G.size(a).h/2,heading:0});
 s.terrain=[feature('W1','wall',30.2,a.y,90)];assert.ok(!G.disruption(s,a).some(d=>d.kind==='obstacle'),'not while unengaged');
 a.engaged=['I1'];e.engaged=['A1'];assert.match(G.disruption(s,a).find(d=>d.kind==='obstacle')?.text??'',/straddling the low wall/);assert.equal(G.isDisrupted(s,a),true);
});
test('a fleeing unit turns around impassable terrain, and still tests for dangerous terrain',()=>{
 const s=battle();clearExcept(s,['A1','I1','A6']);const ch=G.getUnit(s,'A1'),tg=G.getUnit(s,'I1');Object.assign(G.getUnit(s,'A6'),{x:4,y:44});Object.assign(tg,{x:30,y:24,heading:180});Object.assign(ch,{x:30,y:24+G.size(tg).h/2+5+G.size(ch).h/2,heading:0});
 s.terrain=[feature('B1','building',30,16)];Object.assign(s,{stage:'movement',team:'ash',movementStep:'declare'});G.declareCharge(s,'A1','I1');G.chargeReaction(s,'A1','flee',dice(4,4,6));
 assert.ok(!G.terrainBlocks(s,G.corners(tg)),'it does not end on the building');assert.ok(Math.abs(G.heading(tg))>4,`turned aside to ${G.heading(tg)}°`);assert.ok(Math.hypot(tg.x-30,tg.y-24)>=7.9,'the full flee distance');
 const d=battle();clearExcept(d,['A1','I1','A6']);const c2=G.getUnit(d,'A1'),t2=G.getUnit(d,'I1');Object.assign(G.getUnit(d,'A6'),{x:4,y:44});Object.assign(t2,{x:30,y:24,heading:180});Object.assign(c2,{x:30,y:24+G.size(t2).h/2+5+G.size(c2).h/2,heading:0});
 d.terrain=[wood('D1',rect(20,15,40,17),'dangerous')];Object.assign(d,{stage:'movement',team:'ash',movementStep:'declare'});G.declareCharge(d,'A1','I1');const r=G.chargeReaction(d,'A1','flee',dice(4,4,6));
 const hits=r.flee?.terrainHits??r.fleeMove?.terrainHits??[];assert.equal(hits.length,1,'one feature crossed');assert.ok(hits[0].tests>0);
});
