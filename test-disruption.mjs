import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

// Disruption: no Rank Bonus for a unit engaged in its flank or rear by an enemy of Unit Strength 5
// or more, or with a quarter or more of its models within difficult terrain.
const test=(name,fn)=>{fn();console.log('PASS '+name);};
const clearExcept=(s,keep)=>{for(const p of G.combatants(s))if(!keep.includes(p.id)){p.x=null;p.y=null;}};
const rect=(x0,y0,x1,y1)=>[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];
function battle(){const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'ash'});for(const u of s.units)u.charge=null;return s;}
// A1 at (30,30) facing up; its front rank of five spans x 27.54–32.46, y 28.03–29.02.
function block(){const s=battle();clearExcept(s,['A1','I1','A6']);Object.assign(G.getUnit(s,'A6'),{x:8,y:44});const a=G.getUnit(s,'A1');Object.assign(a,{x:30,y:30,heading:0});return {s,a,e:G.getUnit(s,'I1')};}

test('exactly a quarter of the models in difficult terrain disrupts; one fewer does not',()=>{
 const {s,a}=block();s.terrain=[{id:'W1',name:'Wood',movement:'difficult',points:rect(27,27,33,28.5)}];
 assert.deepEqual(G.modelsInDifficult(s,a),{within:5,total:20,features:['Wood']});assert.equal(G.isDisrupted(s,a),true);assert.match(G.disruption(s,a)[0].text,/5 of 20 models in Wood/);
 s.terrain[0].points=rect(27,27,31.4,28.5);assert.equal(G.modelsInDifficult(s,a).within,4);assert.equal(G.isDisrupted(s,a),false,'4 of 20 is under a quarter');
 s.terrain[0].points=rect(27,27,33,28.03);assert.equal(G.modelsInDifficult(s,a).within,0,'touching the edge is not within');
 s.terrain[0].movement='open';s.terrain[0].points=rect(27,27,33,40);assert.equal(G.isDisrupted(s,a),false,'open ground does not disrupt');
});
test('a vortex template is difficult terrain: it disrupts, and slows its own side as well as the enemy',()=>{
 const {s,a}=block();s.vortices=[{id:'V1',spell:'pillar',caster:'A6',team:'ash',x:30,y:29.5,radius:1.5}];
 assert.ok(G.modelsInDifficult(s,a).within>=5);assert.equal(G.isDisrupted(s,a),true);
 const m=battle();clearExcept(m,['A1','A6']);Object.assign(G.getUnit(m,'A6'),{x:8,y:44});const b=G.getUnit(m,'A1');Object.assign(b,{x:30,y:30,heading:0});m.vortices=[{id:'V1',spell:'pillar',caster:'A6',team:'ash',x:30,y:25,radius:1.5}];
 Object.assign(m,{stage:'movement',team:'ash',movementStep:'remaining'});assert.match(G.orderError(m,b,{kind:'advance',mode:'advance',distance:3}),/exceeds/,'M3 −1 through its own Pillar of Fire');assert.equal(G.orderError(m,b,{kind:'advance',mode:'advance',distance:2}),null);
});
test('a flank attack disrupts only when the enemy unit has Unit Strength 5 or more; a disrupted unit claims no Rank Bonus',()=>{
 const {s,a,e}=block();Object.assign(e,{heading:90,x:30-G.size(a).w/2-G.size(e).h/2,y:30});e.deadModels=Array.from({length:15},(_,i)=>i+5);a.engaged=['I1'];e.engaged=['A1'];
 assert.equal(G.chargeFace(e,a),'left flank');assert.equal(G.unitStrength(e),5);assert.equal(G.isDisrupted(s,a),true);
 e.deadModels.push(4);assert.equal(G.unitStrength(e),4);assert.equal(G.isDisrupted(s,a),false,'Unit Strength 4 does not disrupt');
 e.deadModels.pop();Object.assign(s,{stage:'combat',team:'ash'});G.beginCombat(s,'A1');while(s.combatSession.phase==='attacks')G.fightCombatStep(s,()=>.01);G.compareCombat(s);
 assert.equal(s.lastCombat.score.ash.ranks,0);assert.match(s.lastCombat.score.ash.disrupted[0].reasons[0],/left flank/);
});
