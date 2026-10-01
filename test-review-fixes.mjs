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
