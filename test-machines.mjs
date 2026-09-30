import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

const test=(name,fn)=>{fn();console.log('PASS '+name);};
// Empire battle with only the named units left on the table.
function field(keep){const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0);for(const u of s.units)if(!keep.includes(u.id)){u.x=null;u.y=null;}if(!keep.includes('A5'))s.rocket.x=null;for(const c of s.cannons)if(!keep.includes(c.id))c.x=null;return s;}

test('the Deathshrieker pivots to face a target behind it before shooting',()=>{
 const s=field(['A5','I1']);Object.assign(s.rocket,{x:36,y:20,heading:0});Object.assign(G.getUnit(s,'I1'),{x:36,y:40});Object.assign(s,{stage:'shooting',team:'ash'});
 const plan=G.rocketPlan(s,G.getUnit(s,'I1'));assert.equal(plan.error,undefined);assert.equal(plan.facing,180);
 G.fireRocket(s,'I1','demolition',{artillery:2,scatter:'hit'},()=>.99);assert.equal(s.rocket.heading,180);assert.deepEqual([s.rocket.x,s.rocket.y],[36,20]);
});
test('a Great Cannon pivots to face a target behind it before shooting',()=>{
 const s=field(['I5','A1']),c=s.cannons[0];Object.assign(c,{x:36,y:24,heading:180});Object.assign(G.getUnit(s,'A1'),{x:36,y:8});Object.assign(s,{stage:'shooting',team:'iron'});
 const plan=G.cannonPlan(s,'I5',G.getUnit(s,'A1'),{mode:'ball',aimShort:0});assert.equal(plan.error,undefined);assert.equal(plan.facing,0);
 G.fireCannon(s,'I5','A1','ball',{strike:2,bounce:2},()=>.99,{aimShort:0});assert.equal(c.heading,0);
});
test('a charge cannot pass through a war machine',()=>{
 const s=field(['A1','I1','I5']);const a=G.getUnit(s,'A1'),t=G.getUnit(s,'I1');Object.assign(a,{x:36,y:30,heading:0});Object.assign(t,{x:36,y:30-G.SIZE.h-7,heading:180});Object.assign(s,{stage:'movement',movementStep:'declare'});
 assert.equal(G.chargePlan(s,a,t).error,undefined);Object.assign(s.cannons[0],{x:36,y:(a.y+t.y)/2});assert.ok(G.chargePlan(s,a,t).error);
});
test('a wheel cannot sweep through the Deathshrieker',()=>{
 const s=field(['A1','A5']);const a=G.getUnit(s,'A1');Object.assign(a,{x:30,y:30,heading:0});Object.assign(s,{stage:'movement',movementStep:'remaining',team:'ash'});
 const order={kind:'wheel',angle:30,distance:0,mode:'advance'};assert.equal(G.orderError(s,a,order),null);
 Object.assign(s.rocket,{x:a.x-G.SIZE.w/2-1.2,y:a.y-G.SIZE.h/2-1.5});assert.match(G.orderError(s,a,order)??'',/war machine|Deathshrieker|blocks/);
});
test('a unit falling back stops short of a war machine instead of passing through it',()=>{
 const s=field(['A1','I1','A5']);const w=G.getUnit(s,'A1'),l=G.getUnit(s,'I1');Object.assign(w,{x:18,y:30,heading:0});Object.assign(l,{x:18,y:30-G.SIZE.h,heading:180});Object.assign(s.rocket,{x:18,y:l.y-G.SIZE.h/2-2.5});
 s.stage='combat';s.lastCombat={a:'A1',b:'I1'};s.combatHistory=[s.lastCombat];s.pendingCombat={winner:'A1',loser:'I1',margin:1,stage:'retreat',outcome:'fall-back'};
 G.moveCombatLoser(s,()=>.99);assert.ok(G.gap(l,{...s.rocket})>=-1e-9);assert.ok(l.y>s.rocket.y,'the loser did not pass the launcher');
});
test('a unit falling back stops 1″ short of a friendly unit instead of ending on top of it',()=>{
 const s=field(['A1','I1','I2']);const w=G.getUnit(s,'A1'),l=G.getUnit(s,'I1'),friend=G.getUnit(s,'I2');Object.assign(w,{x:18,y:30,heading:0});Object.assign(l,{x:18,y:30-G.SIZE.h,heading:180});Object.assign(friend,{x:18,y:l.y-G.SIZE.h-2.5,heading:180});
 s.stage='combat';s.lastCombat={a:'A1',b:'I1'};s.combatHistory=[s.lastCombat];s.pendingCombat={winner:'A1',loser:'I1',margin:1,stage:'retreat',outcome:'fall-back'};
 G.moveCombatLoser(s,()=>.99);assert.ok(G.gap(l,friend)>=1-1e-6,'kept 1″ from the friend');assert.ok(l.y>friend.y);
});
test('a loser that cannot give ground stays in the fight',()=>{
 const s=field(['A1','I1','I2']);const w=G.getUnit(s,'A1'),l=G.getUnit(s,'I1'),friend=G.getUnit(s,'I2');Object.assign(w,{x:18,y:30,heading:0});Object.assign(l,{x:18,y:30-G.SIZE.h,heading:180});Object.assign(friend,{x:18,y:l.y-G.SIZE.h-1,heading:180});
 s.stage='combat';s.lastCombat={a:'A1',b:'I1'};s.combatHistory=[s.lastCombat];s.pendingCombat={winner:'A1',loser:'I1',margin:1,stage:'retreat',outcome:'give-ground'};
 const moved=G.moveCombatLoser(s,()=>.99);assert.equal(moved.distance,0);const out=G.winnerCombat(s,'restrain',()=>.99);assert.equal(out.stillEngaged,true);assert.equal(w.engaged,'I1');assert.equal(l.engaged,'A1');
});
