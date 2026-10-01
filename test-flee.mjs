import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

const test=(name,fn)=>{fn();console.log('PASS '+name);};
// Returns the given D6 faces in order, then repeats the last one.
const dice=(...faces)=>{let i=0;return ()=>(faces[Math.min(i++,faces.length-1)]-1)/6+.01;};
const H=G.SIZE.h;

// Red A1 charges green I1; green I2 stands 1.5" behind I1. Every block is 25 mm Chaos Dwarfs.
function chargeIntoScreen(){
 const s=G.createGame();G.autoDeploy(s);G.begin(s,()=>0);for(const u of s.units)if(!['A1','I1','I2'].includes(u.id)){u.x=null;u.y=null;}s.rocket.x=null;
 const charger=G.getUnit(s,'A1'),defender=G.getUnit(s,'I1'),friend=G.getUnit(s,'I2');
 Object.assign(charger,{x:36,y:30,heading:0});Object.assign(defender,{x:36,y:30-H-4,heading:180});Object.assign(friend,{x:36,y:defender.y-H-1.5,heading:180});
 Object.assign(s,{stage:'movement',movementStep:'declare'});G.declareCharge(s,'A1','I1');return {s,charger,defender,friend};
}

test('a flee passes through a friendly unit, which then takes a Panic test',()=>{
 const {s,defender,friend}=chargeIntoScreen(),from=defender.y;
 const r=G.chargeReaction(s,'A1','flee',dice(6,6,1,1));
 assert.equal(G.heading(defender),0);assert.ok(Math.abs(from-defender.y-12)<1e-6);assert.deepEqual(r.flee.passedThrough,['I2']);assert.equal(r.flee.peril.length,0);
 assert.equal(r.flee.panic.length,1);assert.equal(r.flee.panic[0].passed,true);assert.equal(friend.fleeing,false);assert.equal(defender.fleeing,true);
});
test('a flee that would end on a friend keeps going until it is clear',()=>{
 const {s,defender,friend}=chargeIntoScreen();const r=G.chargeReaction(s,'A1','flee',dice(2,3,1,1));
 assert.ok(r.flee.distance>5);assert.ok(defender.y<friend.y);assert.ok(G.gap(defender,friend)>=1-1e-6);assert.ok(G.gap(defender,friend)<1.1);
});
test('a panicked friend flees in turn, directly away from the nearest enemy that is not fleeing',()=>{
 const {s,charger,friend}=chargeIntoScreen();friend.deadModels=G.modelSquares(s,friend).map(m=>m.index).slice(10);// at half strength a failed Panic test means fleeing
 const perils=Array.from({length:20},(_,i)=>i%2?6:1);const r=G.chargeReaction(s,'A1','flee',dice(6,6,6,6,6,6,...perils));
 const panic=r.flee.panic[0];assert.equal(panic.passed,false);assert.equal(friend.fleeing,true);assert.equal(G.heading(friend),0,'away from the nearest enemy that is not fleeing: the charger');
 assert.deepEqual(panic.flee.passedThrough,['I1'],'back through the fleeing regiment, not the charger');assert.equal(panic.flee.peril.length,0);assert.equal(G.aliveCount(friend),10);
 assert.ok(friend.y<charger.y-5,'it fled away from the charger');assert.equal(G.aliveCount(charger),20);
});
test('a broken unit turns away and flees through an enemy unit behind it',()=>{
 const s=G.createGame();G.autoDeploy(s);G.begin(s,()=>0);for(const u of s.units)if(!['A1','A2','I1'].includes(u.id)){u.x=null;u.y=null;}s.rocket.x=null;
 const winner=G.getUnit(s,'A1'),loser=G.getUnit(s,'I1'),blocker=G.getUnit(s,'A2');
 Object.assign(winner,{x:18,y:30,heading:0});Object.assign(loser,{x:18,y:30-H,heading:180});Object.assign(blocker,{x:18,y:loser.y-H-2,heading:0});
 s.stage='combat';s.lastCombat={a:'A1',b:'I1'};s.combatHistory=[s.lastCombat];s.pendingCombat={winner:'A1',loser:'I1',margin:3,stage:'retreat',outcome:'break'};
 const out=G.moveCombatLoser(s,dice(4,4,...Array(20).fill(5)));
 assert.equal(G.heading(loser),0);assert.equal(loser.fleeing,true);assert.deepEqual(out.flee.passedThrough,['A2']);assert.equal(out.flee.peril.length,20);assert.equal(out.flee.casualties,0);
 assert.ok(loser.y<blocker.y);assert.ok(G.gap(loser,blocker)>=1-1e-6);assert.ok(out.distance>7);assert.equal(s.pendingCombat.fleeDistance,7);
});
test('Peril tests can destroy a fleeing unit outright',()=>{
 // The defender flees from the charger straight through an enemy regiment, and every model fails its Peril test.
 const {s,defender,friend}=chargeIntoScreen();Object.assign(friend,{x:null,y:null});Object.assign(G.getUnit(s,'A2'),{x:36,y:defender.y-H-2,heading:180});
 const r=G.chargeReaction(s,'A1','flee',dice(6,6,1));assert.deepEqual(r.flee.passedThrough,['A2']);assert.equal(r.flee.casualties,20);assert.equal(defender.destroyed,true);assert.equal(defender.x,null);
});
