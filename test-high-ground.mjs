import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

// Hills in combat (the user's terrain brief of 1 October 2026, section 12): a fighting rank higher
// than the enemy's claims +1 combat result, and nothing else.
const test=(name,fn)=>{fn();console.log('PASS '+name);};
const feature=(id,key,x,y,heading=0)=>({id,...G.makeFeature(key,x,y,heading)});
const clearExcept=(s,keep)=>{for(const p of G.combatants(s))if(!keep.includes(p.id)){p.x=null;p.y=null;}};
// The State Troops (I1) face down at (30,20); the Chaos Dwarf Warriors (A1) are in contact below them.
function fight(hill){const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'ash'});clearExcept(s,['A1','I1']);for(const u of s.units)u.charge=null;
 const d=G.getUnit(s,'I1'),a=G.getUnit(s,'A1');Object.assign(d,{x:30,y:20,heading:180});Object.assign(a,{x:30,y:20+G.size(d).h/2+G.size(a).h/2,heading:0});a.engaged=['I1'];d.engaged=['A1'];s.terrain=hill?[hill]:[];return {s,a,d};}
function result(s){Object.assign(s,{stage:'combat',team:'ash'});G.beginCombat(s,'A1');while(s.combatSession.phase==='attacks')G.fightCombatStep(s,()=>.5);const stages=s.combatSession.stages.map(st=>[st.from,st.toHit,st.toWound]);G.compareCombat(s);return {score:s.lastCombat.score,stages};}

test('a hill\'s height runs from 0 at its edge to 1 at its top',()=>{
 const s={terrain:[feature('H1','hill',30,20)]};assert.equal(G.elevationAt(s,{x:30,y:20}),1);assert.equal(G.elevationAt(s,{x:30,y:30}),0);assert.ok(Math.abs(G.elevationAt(s,{x:30,y:21.5})-.5)<.05);
});
test('defenders on the crest fighting enemies below hold the high ground; the uphill side does not',()=>{
 const {s,a,d}=fight(feature('H1','hill',30,20));assert.equal(G.highGround(s,d,a),true);assert.equal(G.highGround(s,a,d),false);
 const r=result(s);assert.equal(r.score.iron.high,1);assert.equal(r.score.ash.high,0);
 const flat=fight();assert.equal(G.highGround(flat.s,flat.d,flat.a),false);const f=result(flat.s);assert.equal(f.score.iron.high,0);
 assert.deepEqual(r.stages,f.stages,'the same To Hit and To Wound rolls: it is a combat result bonus only');
 assert.equal(r.score.iron.total-f.score.iron.total-(r.score.iron.wounds-f.score.iron.wounds),1);
});
test('fighting ranks at the same height, or only rear ranks on the hill, do not qualify',()=>{
 // A long slope whose crest is the table edge at x = 60: the contact runs down the slope, so both fighting ranks stand equally high.
 const {s,a,d}=fight();s.terrain=[{...feature('H1','hill',30,0),points:[{x:0,y:0},{x:60,y:0},{x:60,y:44},{x:0,y:44}],top:{x:60,y:22}}];assert.ok(G.elevationAt(s,{x:30,y:22})>.4);
 assert.equal(G.highGround(s,d,a),false,'a broad slope across the line of contact: both ranks equally high');assert.equal(G.highGround(s,a,d),false);
 const rear=fight();const back=rear.a.y+G.size(rear.a).h/2;rear.s.terrain=[feature('H1','hill',30,back+2.6)];assert.ok(G.elevationAt(rear.s,{x:30,y:back-.3})>0,'its rear rank is on the hill');
 assert.equal(G.highGround(rear.s,rear.a,rear.d),false,'its fighting rank is not');
});
