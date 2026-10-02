import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

// Two dice streams: one for the shot, one for everything the Panic resolver rolls.
const face=f=>(f-1)/6+.01,split=(s,damage,panic)=>{let i=0,j=0;return ()=>s.panicResolving?face(panic[Math.min(j++,panic.length-1)]):face(damage[Math.min(i++,damage.length-1)]);};
function battle(opponent='empire'){const s=G.createGame(opponent);G.autoDeploy(s);G.begin(s);G.nextPhase(s);G.nextPhase(s);assert.equal(s.stage,'shooting');return s;}
{
 const s=G.createGame('empire');assert.deepEqual(G.ROCKET_BASE,{w:50/25.4,h:75/25.4});
 assert.throws(()=>G.begin(s),/Deathshrieker|eight/);assert.throws(()=>G.placeRocket(s,8,35),/deployment zone/);
 G.autoDeploy(s);assert.equal(s.rocket.x,8);assert.equal(s.rocket.crew,3);assert.equal(s.rocket.wounds,3);
 assert.throws(()=>G.placeRocket(s,18,42),/1″/);
}
{
 const s=battle(),target=G.getUnit(s,'I1');assert.equal(G.canFireRocket(s),true);
 assert.equal(G.rocketPlan(s,target).error,undefined);target.x=8;target.y=35;assert.match(G.rocketPlan(s,target).error,/12″/);
 target.y=6;target.x=64;assert.match(G.rocketPlan(s,target).error,/48″/);
 target.x=8;G.getUnit(s,'A1').x=8;G.getUnit(s,'A1').y=25;
 assert.match(G.rocketPlan(s,target).error,/line of sight/);assert.equal(G.rocketPlan(s,target,{indirect:true}).error,undefined);
}
{
 const s=battle(),target=G.getUnit(s,'I4');target.x=8;target.y=6;
 const result=G.fireRocket(s,'I4','demolition',{artillery:2,scatter:'hit'},()=>.6);
 assert.equal(result.template,3);assert.deepEqual(result.impact,{x:8,y:6});assert.equal(result.scatterDistance,0);
 assert.ok(result.hits>0);assert.ok(result.unsaved>0);assert.ok(G.aliveCount(target)<20);assert.equal(s.rocket.shot,true);
 assert.throws(()=>G.fireRocket(s,'I4','incendiary',{artillery:2,scatter:'hit'}),/cannot fire/);
}
{
 const s=battle(),target=G.getUnit(s,'I4');target.x=8;target.y=6;
 const result=G.fireRocket(s,'I4','incendiary',{artillery:10,scatter:90},()=>.6);
 assert.equal(result.template,5);assert.equal(result.scatterDistance,10);assert.ok(Math.abs(result.impact.x-18)<1e-9&&Math.abs(result.impact.y-6)<1e-9);
}
{
 const s=battle('orc'),target=G.getUnit(s,'I1');target.x=8;target.y=6;
 let i=0;const result=G.fireRocket(s,'I1','incendiary',{artillery:2,scatter:'hit'},()=>[.6,.8,.6][i++]??.999);
 assert.ok(result.unsaved>0);const mob=result.units.find(u=>u.unit==='I1');assert.deepEqual([mob.killed,mob.destroyed],[20,true],'S3 AP−1 with Armour Bane (1): the whole mob dies under the template');assert.equal(result.panic,undefined,'a unit the shot destroyed takes no Panic test');
}
{
 // Half strength (10 of 20): one more model lost to the incendiaries, a failed Panic test, and it flees 2D6.
 const s=battle(),target=G.getUnit(s,'I1');target.x=8;target.y=20;for(const u of [...s.units,...s.cannons])if(u.id!=='I1'){u.x=null;u.y=null;}target.deadModels=G.modelSquares(s,target).map(m=>m.index).slice(10);
 const result=G.fireRocket(s,'I1','incendiary',{artillery:2,scatter:'hit'},split(s,[4,4,1],[5,5,5,5]));
 const panic=result.panic.find(p=>p.unit==='I1');
 assert.equal(panic.passed,false);assert.equal(panic.outcome,'flee');assert.deepEqual(panic.fleeDice,[5,5]);
 assert.equal(panic.fledOffBoard,false);assert.equal(target.fleeing,true);
 assert.equal(target.destroyed,undefined);assert.ok(target.x!==null&&target.y>0);
 assert.equal(G.aliveCount(target),9);
 G.nextPhase(s);G.nextPhase(s);assert.equal(s.team,'iron');
 assert.equal(G.rally(s,'I1',()=>0).success,true);
}
{
 // At full strength by the table edge: it Falls Back in Good Order, off the battlefield, and is lost.
 const s=battle(),target=G.getUnit(s,'I1');target.x=8;target.y=6;
 const result=G.fireRocket(s,'I1','incendiary',{artillery:2,scatter:'hit'},split(s,[4,4,1],[5,5,5,5]));
 const panic=result.panic.find(p=>p.unit==='I1');
 assert.equal(panic.passed,false);assert.equal(panic.outcome,'fall-back');assert.equal(panic.fledOffBoard,true);
 assert.equal(target.destroyed,true);assert.equal(target.x,null);assert.equal(result.units[0].killed,1,'the rocket itself killed one');
 assert.equal(target.fleeing,false);assert.equal(G.aliveCount(target),0);
 G.nextPhase(s);G.nextPhase(s);assert.equal(s.stage,'strategy');assert.equal(s.team,'iron');
 assert.throws(()=>G.rally(s,'I1'),/fleeing regiment/);
 assert.doesNotThrow(()=>G.nextPhase(s));
}
{
 const s=battle();const result=G.fireRocket(s,'I1','demolition',{artillery:'misfire',scatter:'hit'},()=>0);
 assert.equal(result.misfire,1);assert.equal(s.rocket.wounds,0);assert.equal(s.rocket.x,null);
}
{
 const s=battle();const result=G.fireRocket(s,'I1','incendiary',{artillery:'misfire',scatter:'hit'},()=>.4);
 assert.equal(result.misfire,3);assert.equal(s.rocket.wounds,2);assert.equal(s.rocket.crew,2);assert.equal(s.rocket.disabledUntil,2);
 G.nextPhase(s);G.nextPhase(s);G.nextPhase(s);G.nextPhase(s);assert.equal(G.canFireRocket(s),false);
}
console.log('PASS Deathshrieker deployment, profiles, templates, scatter, damage and misfires');
