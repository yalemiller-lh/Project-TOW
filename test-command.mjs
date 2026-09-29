import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
const test=(name,fn)=>{fn();console.log('PASS '+name)};
function fight(opponent='chaos'){
 const s=G.createGame(opponent);G.autoDeploy(s);G.begin(s);G.nextPhase(s);
 const a=G.getUnit(s,'A1'),b=G.getUnit(s,'I1');Object.assign(a,{x:18,y:22,engaged:'I1'});Object.assign(b,{x:18,y:22-(G.size(a).h+G.size(b).h)/2,engaged:'A1'});s.stage='combat';return s;
}
test('all six regiments have M, S and C in the centre of their front rank',()=>{
 for(const opponent of ['chaos','orc','empire']){const s=G.createGame(opponent);for(const u of s.units){assert.deepEqual(G.modelSquares(s,u).slice(0,5).map(m=>m.command),[null,'M','S','C',null]);assert.equal(G.modelSquares(s,u).filter(m=>m.command).length,3);}}
});
test('the champion adds one attack when fighting and the standard adds one combat result',()=>{
 const s=fight(),r=G.resolveCombat(s,'A1',()=>0);assert.equal(r.stages[0].attacks,r.stages[0].fighters+1);assert.equal(r.score.A1.standard,1);
});
test('a fallen standard stops scoring, and a sole musician breaks an otherwise tied result',()=>{
 const s=fight(),a=G.getUnit(s,'A1'),b=G.getUnit(s,'I1');a.deadModels=[1,2];b.deadModels=[0,4];const r=G.resolveCombat(s,'A1',()=>0);assert.equal(r.score.A1.standard,0);assert.equal(r.score.I1.standard,1);assert.equal(r.score.A1.musician,0);
 const t=fight(),ta=G.getUnit(t,'A1'),tb=G.getUnit(t,'I1');ta.deadModels=[1];tb.deadModels=[0];const tied=G.resolveCombat(t,'A1',()=>0);assert.equal(tied.score.I1.musician,1);assert.equal(tied.winner,'I1');
});
test('musician improves march and rally Leadership, and the Orc Boss leads at Ld7',()=>{
 const s=G.createGame('orc'),o=G.getUnit(s,'I1'),d=G.getUnit(s,'A1');assert.equal(G.leadership(o,'restraint'),7);assert.equal(G.leadership(o,'march'),10);assert.equal(G.leadership(d,'rally'),10);o.deadModels=[1];assert.equal(G.leadership(o,'march'),9);
});
test('ordinary casualties are removed before command models',()=>{
 const s=fight(),a=G.getUnit(s,'A1'),b=G.getUnit(s,'I1');a.charge={status:'success',distance:4,face:'front'};let i=0;G.resolveCombat(s,'A1',()=>[...Array(6).fill(.999),...Array(6).fill(.999),...Array(6).fill(0),...Array(50).fill(0)][i++]);assert.ok(b.deadModels.length>0);assert.ok(b.deadModels.every(n=>![1,2,3].includes(n)));
});
