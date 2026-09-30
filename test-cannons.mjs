import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

function battle(){const s=G.createGame('empire');G.autoDeploy(s);s.stage='shooting';s.team='iron';return s;}

{
 const s=G.createGame('empire');assert.deepEqual(s.cannons.map(c=>c.id),['I5','I6']);
 assert.throws(()=>G.begin(s),/cannons/);G.autoDeploy(s);assert.deepEqual(s.cannons.map(c=>[c.x,c.y]),[[8,6],[45,6]]);
 assert.throws(()=>G.placeCannon(s,'I5',8,42),/blue deployment zone/);
 assert.throws(()=>G.place(s,'I1',8,6),/cannons/);
 G.setOpponent(s,'orc');assert.equal(s.cannons.length,0);G.setOpponent(s,'empire');assert.equal(s.cannons.length,2);
}
{
 const s=battle(),c=s.cannons[0],target=G.getUnit(s,'A1');
 assert.equal(G.canFireCannon(s,c.id),true);
 assert.equal(G.cannonPlan(s,c.id,target).error,undefined);
 const report=G.fireCannon(s,c.id,target.id,'ball',{strike:6,bounce:8},()=>.8);
 assert.ok(report.hits>0);assert.ok(report.unsaved>0);assert.ok(G.aliveCount(target)<20);
 assert.equal(c.shot,true);assert.throws(()=>G.fireCannon(s,c.id,target.id,'ball',{strike:2,bounce:2}),/cannot fire/);
}
{
 const s=battle(),c=s.cannons[0],target=G.getUnit(s,'A1');target.x=8;target.y=18;
 assert.equal(G.cannonPlan(s,c.id,target,{mode:'grape'}).error,undefined);
 let roll=0;const report=G.fireCannon(s,c.id,target.id,'grape',{strike:4},()=>++roll%2?.8:0);
 assert.equal(report.hits,4);assert.equal(report.unsaved,4);
}
{
 const s=battle(),c=s.cannons[0],target=G.getUnit(s,'A1');
 const report=G.fireCannon(s,c.id,target.id,'ball',{strike:'misfire',bounce:8},()=>0);
 assert.equal(report.misfire,1);assert.equal(c.wounds,0);assert.equal(c.x,null);
}
{
 const s=battle(),c=s.cannons[0],target=G.getUnit(s,'A1');
 const report=G.fireCannon(s,c.id,target.id,'ball',{strike:6,bounce:'misfire'},()=>.8);
 assert.deepEqual(report.end,report.strike);assert.ok(report.hits>=1);
 G.nextPhase(s);G.nextPhase(s);G.nextPhase(s);G.nextPhase(s);
 assert.equal(c.shot,false);
}
console.log('Cannon deployment and firing checks passed.');
