import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

const test=(name,fn)=>{fn();console.log('PASS '+name);};
const regiment=(overrides={})=>({...G.createGame('empire').units.find(u=>u.id==='I1'),...overrides});

test('a 13-model regiment five files wide is three ranks deep with a partial rear rank',()=>{
 const s=G.createGame('empire'),u=Object.assign(G.getUnit(s,'I1'),{models:13});
 assert.equal(G.ranksOf(u),3);assert.deepEqual(G.size(u),{w:5*25/25.4,h:3*25/25.4});
 const squares=G.modelSquares(s,u);assert.equal(squares.length,13);assert.deepEqual(squares.filter(m=>m.row===2).map(m=>m.col),[0,1,2]);assert.equal(G.aliveCount(u),13);
});
test('only purchased command models are placed, in the middle of the front rank',()=>{
 const s=G.createGame('empire'),u=Object.assign(G.getUnit(s,'I1'),{models:12,command:{S:true,C:false,M:true}});
 assert.deepEqual(G.commandSlots(u),{1:'M',2:'S'});assert.equal(G.commandAlive(u,'C'),false);assert.equal(G.commandAlive(u,'S'),true);
 assert.deepEqual(G.modelSquares(s,u).filter(m=>m.command).map(m=>[m.index,m.command]),[[1,'M'],[2,'S']]);
 const wide=Object.assign(G.getUnit(s,'I2'),{models:21,files:7});assert.deepEqual(G.commandSlots(wide),{2:'M',3:'S',4:'C'});
});
test('casualties still come off the rear rank of a smaller regiment',()=>{
 const s=G.createGame('empire'),u=Object.assign(G.getUnit(s,'I1'),{models:13});G.removeCasualties(s,u,4);
 assert.deepEqual(u.deadModels,[12,11,10,9]);assert.equal(G.aliveCount(u),9);
});
test('Unit Strength counts models by troop type; war machines use their starting Wounds',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);const troops=G.getUnit(s,'I1'),mage=G.getUnit(s,'I7'),cannon=s.cannons[0];
 assert.equal(G.unitStrength(troops),20);G.removeCasualties(s,troops,5);assert.equal(G.unitStrength(troops),15);assert.equal(G.startingUnitStrength(troops),20);
 assert.equal(G.unitStrength(mage),1);assert.equal(G.unitStrength(cannon),3);assert.equal(G.startingUnitStrength(cannon),3);
 cannon.wounds=1;assert.equal(G.unitStrength(cannon),3,'a damaged war machine keeps its Unit Strength');troops.destroyed=true;assert.equal(G.unitStrength(troops),0);
});
test('a rear rank counts for rank bonus only with the troop type\'s models per rank',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s);const a=G.getUnit(s,'A1'),b=G.getUnit(s,'I1');
 Object.assign(a,{x:18,y:22,engaged:'I1'});Object.assign(b,{x:18,y:22-G.SIZE.h,engaged:'A1'});s.stage='combat';
 G.removeCasualties(s,b,6);const r=G.resolveCombat(s,'A1',()=>0);assert.equal(G.aliveCount(b),14);assert.equal(r.score.I1.ranks,1,'regular infantry: a rear rank of 4 does not count');
 const t=G.createGame('empire');G.autoDeploy(t);G.begin(t);const c=G.getUnit(t,'A1'),d=G.getUnit(t,'I1');Object.assign(c,{x:18,y:22,engaged:'I1'});Object.assign(d,{x:18,y:22-G.SIZE.h,engaged:'A1'});t.stage='combat';
 G.removeCasualties(t,c,6);const r2=G.resolveCombat(t,'A1',()=>0);assert.equal(G.aliveCount(c),14);assert.equal(r2.score.A1.ranks,2,'heavy infantry: a rear rank of 4 counts');
});
