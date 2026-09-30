import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

const test=(name,fn)=>{fn();console.log('PASS '+name);};
// A1 has charged I1 (both Chaos Dwarf Warriors), so A1 strikes first at Initiative 5.
function fightFixture(){const s=G.createGame();G.autoDeploy(s);G.begin(s);G.nextPhase(s);const a=G.getUnit(s,'A1'),b=G.getUnit(s,'I1');Object.assign(a,{x:18,y:22,engaged:'I1',charge:{status:'success',distance:4,face:'front'}});Object.assign(b,{x:18,y:22-G.SIZE.h,engaged:'A1'});s.stage='combat';return s;}
const rolls=(...values)=>{let i=0;return ()=>values[i++]??0;};

test('casualties come off the right end of the rear rank, then musician, standard bearer, champion',()=>{
 const s=G.createGame(),u=G.getUnit(s,'A1');
 G.removeCasualties(s,u,3);assert.deepEqual(u.deadModels,[19,18,17]);
 G.removeCasualties(s,u,12);assert.deepEqual(u.deadModels.slice(-2),[6,5]);assert.ok(G.modelSquares(s,u).filter(m=>m.row===0).every(m=>!m.dead));
 G.removeCasualties(s,u,2);assert.deepEqual(u.deadModels.slice(-2),[4,0]);
 G.removeCasualties(s,u,1);assert.equal(u.deadModels.at(-1),1);G.removeCasualties(s,u,1);assert.equal(u.deadModels.at(-1),2);
 assert.equal(G.aliveCount(u),1);assert.equal(G.commandAlive(u,'C'),true);
});
test('casualties before a unit strikes cut its first fighting rank, then its second; the stepped-forward rear cannot attack',()=>{
 const s=fightFixture(),b=G.getUnit(s,'I1');
 const r=G.resolveCombat(s,'A1',rolls(...Array(6).fill(.999),...Array(6).fill(.999),...Array(6).fill(0)));
 assert.equal(r.stages[0].unsaved,6);assert.equal(r.stages[1].lostBefore,6);assert.equal(r.stages[1].fighters,4);assert.equal(r.stages[1].attacks,5);
 assert.ok(G.modelSquares(s,b).filter(m=>m.row===0).every(m=>!m.dead));assert.deepEqual([...b.deadModels].sort((x,y)=>x-y),[14,15,16,17,18,19]);
});
test('blows struck at the same Initiative are simultaneous and not reduced',()=>{
 const s=fightFixture();G.getUnit(s,'A1').charge=null;const r=G.resolveCombat(s,'A1',()=>.999);
 assert.deepEqual(r.stages.map(x=>[x.lostBefore,x.fighters]),[[0,10],[0,10]]);
});
test('in the next Combat phase the refilled fighting ranks attack in full',()=>{
 const s=fightFixture(),b=G.getUnit(s,'I1');G.resolveCombat(s,'A1',rolls(...Array(6).fill(.999),...Array(6).fill(.999),...Array(6).fill(0)));
 s.pendingCombat=null;for(const u of [G.getUnit(s,'A1'),b])u.combatResolved=false;G.getUnit(s,'A1').charge=null;G.getUnit(s,'A1').engaged='I1';b.engaged='A1';
 G.beginCombat(s,'I1');const step=G.fightCombatStep(s,()=>0);assert.equal(step.stages.find(x=>x.from==='I1').fighters,10);
});
