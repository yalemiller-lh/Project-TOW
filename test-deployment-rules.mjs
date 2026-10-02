import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
import './dist/battlemarch.mjs';

// Scouts, Vanguard and Ambushers (core rules from the game-system data). No unit in the playable
// rosters has them yet, so these tests give the rule to a unit directly.
const test=(name,fn)=>{fn();console.log('PASS '+name);};
const dice=(...faces)=>{let i=0;return ()=>(faces[Math.min(i++,faces.length-1)]-1)/6+.01;};
// A 500-point Battle March game, zones chosen and the deployment roll-off won by Red.
function bm(rules={}){const s=G.createGame('empire',{format:'battle-march',points:500,objectives:'troves2',deployment:{map:'pitched-battle'}});for(const [id,list]of Object.entries(rules))G.getUnit(s,id).rules=list;G.chooseDeploymentZone(s,'iron','A');G.deploymentRollOff(s,dice(6,1));return s;}
// Deploy by quick placement, a batch at a time, rolling off for Scouts when both armies have them.
function deployAll(s,{until=()=>false}={}){for(let guard=0;guard<40&&!G.deploymentComplete(s)&&!until(s);guard++){const d=s.deployOrder;if(!d.next&&d.scouts?.both&&!d.scouts.rollOff){G.scoutRollOff(s,dice(2,5));continue;}G.autoDeploy(s,{team:G.deploymentTurn(s)});}}
const start=s=>{G.firstTurnRollOff(s,dice(6,1));G.chooseFirstTurn(s,'ash','ash');G.begin(s,()=>0);};

test('Scouts deploy after every other unit of both armies, in their zone or more than 12″ from the enemy',()=>{
 const s=bm({A2:['scouts']});const a=G.getUnit(s,'A2');
 assert.throws(()=>G.placeAt(s,'A2',22,4),/Scouts deploy after every other unit/);
 deployAll(s,{until:s=>G.scoutPhase(s)});assert.equal(G.scoutPhase(s),true);assert.equal(a.x,null);assert.equal(G.deploymentTurn(s),'ash');
 const enemyFront=Math.max(...G.combatants(s).filter(v=>v.team==='iron'&&v.x!==null).map(v=>G.rectangle(v).bottom));
 assert.match(G.deployError(s,a,22,enemyFront+11.5+G.size(a).h/2)??'',/more than 12″/);
 G.placeAt(s,'A2',22,enemyFront+12.6+G.size(a).h/2);assert.equal(a.scouted,true,'placed outside its zone');G.confirmDeployment(s);assert.equal(G.deploymentComplete(s),true);
 start(s);const e=G.combatants(s).find(v=>v.team==='iron'&&v.x!==null);assert.match(G.chargePlan(s,a,e).error,/Scouts: it cannot charge in its first turn/);
});
test('with Scouts in both armies a roll-off decides who deploys one first, then they alternate',()=>{
 const s=bm({A2:['scouts'],I2:['scouts']});deployAll(s,{until:s=>G.scoutPhase(s)&&!s.deployOrder.scouts?.rollOff});
 assert.equal(s.deployOrder.next,null);assert.throws(()=>G.placeAt(s,'A2',22,4),/roll off/);const r=G.scoutRollOff(s,dice(2,5));assert.equal(r.winner,'iron');assert.equal(G.deploymentTurn(s),'iron');
 G.autoDeploy(s,{team:'iron'});assert.equal(G.deploymentTurn(s),'ash');G.autoDeploy(s,{team:'ash'});assert.equal(G.deploymentComplete(s),true);assert.equal(G.getUnit(s,'A2').scouted,false,'deployed in its own zone');
});
test('Vanguard: after deployment, an ordinary move without marching; it cannot charge in its first turn',()=>{
 const s=bm({A1:['vanguard']});deployAll(s);const a=G.getUnit(s,'A1'),y=a.y;
 assert.equal(G.vanguardPending(s),true);assert.throws(()=>G.firstTurnRollOff(s,dice(6,1)),/Vanguard/);assert.equal(s.vanguard.next,'ash');
 G.beginVanguard(s,'A1');assert.match(G.orderError(s,a,{kind:'advance',mode:'march',distance:4}),/cannot march/);assert.equal(G.orderError(s,a,{kind:'advance',mode:'advance',distance:3}),null);
 G.commitOrder(s,'A1',{kind:'advance',mode:'advance',distance:3});assert.ok(a.y<y-2.9,'moved toward the enemy');G.endVanguard(s,'A1');assert.equal(a.vanguarded,true);assert.equal(G.vanguardPending(s),false);
 start(s);assert.equal(a.spent,0);assert.equal(a.moved,false);assert.equal(a.movedThisTurn,false,'the Vanguard move is not a move in the first turn');
 const e=G.combatants(s).find(v=>v.team==='iron'&&v.x!==null);assert.match(G.chargePlan(s,a,e).error,/Vanguard move: it cannot charge/);
 const q=bm({A1:['vanguard']});deployAll(q);G.beginVanguard(q,'A1');G.endVanguard(q,'A1',false);assert.equal(G.getUnit(q,'A1').vanguarded,undefined,'declined: no restriction');
});
test('Ambushers: held in reserve; from round 2 they arrive on a 4+ (round 5 for certain) against an edge, 8″ clear of the enemy',()=>{
 const s=bm({A1:['ambushers']});const a=G.getUnit(s,'A1');assert.throws(()=>G.holdInReserve(s,'A2'),/Ambushers/);G.holdInReserve(s,'A1');deployAll(s);
 assert.equal(a.x,null);assert.equal(G.deploymentComplete(s),true);start(s);assert.match(G.inactionReason(s,a),/reserve/);
 const toRedTurn=r=>{for(let g=0;g<20&&!(s.team==='ash'&&s.round===r&&s.stage==='strategy');g++){s.pendingCombat=null;s.combatSession=null;s.stage='combat';G.nextTurn(s,dice(3));}};
 G.nextPhase(s);assert.equal(s.stage,'movement');
 toRedTurn(2);assert.deepEqual(s.reserveReports,[{unit:'A1',roll:3,arrives:false}]);
 s.stage='combat';G.nextTurn(s,dice(3));s.stage='combat';G.nextTurn(s,dice(5));assert.equal(s.round,3);assert.deepEqual(s.reserveReports,[{unit:'A1',roll:5,arrives:true}]);
 Object.assign(s,{stage:'movement',movementStep:'remaining'});const b=G.getUnit(s,'A2');b.moved=false;assert.match(G.orderError(s,b,{kind:'advance',mode:'advance',distance:1}),/reinforcements first/);
 assert.match(G.reinforcementError(s,'A1','top',22)??'',/8″/,'the far edge is the enemy\'s');
 const spot=G.firstReinforcementSpot(s,'A1');assert.equal(spot.edge,'bottom','its own zone\'s edge first');G.placeReinforcement(s,'A1',spot.edge,spot.along);
 assert.equal(a.heading,0,'facing the centre');assert.ok(Math.abs(G.rectangle(a).bottom-s.board.height)<1e-9,'rear edge on the table edge');assert.match(G.orderError(s,a,{kind:'advance',mode:'march',distance:4})??'',/cannot march/);assert.doesNotMatch(G.orderError(s,a,{kind:'advance',mode:'advance',distance:2})??'',/march|reinforcements/,'it may still advance');assert.equal(a.movedThisTurn,true,'it counts as having moved for shooting');
 const r=bm({A1:['ambushers']});G.holdInReserve(r,'A1');deployAll(r);start(r);for(let g=0;g<30&&!(r.team==='ash'&&r.round===5);g++){r.stage='combat';G.nextTurn(r,dice(1));}assert.deepEqual(r.reserveReports,[{unit:'A1',roll:null,arrives:true}],'round 5: no roll');
});
