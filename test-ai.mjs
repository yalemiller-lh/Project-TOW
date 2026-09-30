import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
import * as AI from './dist/ai.mjs';

function deploy(opponent){const s=G.createGame(opponent);AI.deployOpponent(s);assert.equal(s.units.filter(u=>u.team==='iron'&&u.x!==null).length,opponent==='empire'?5:4);assert.equal(s.units.filter(u=>u.team==='ash'&&u.x!==null).length,0);for(const [i,u]of s.units.filter(u=>u.team==='ash').entries())G.place(s,u.id,u.role==='wizard'?3.5:[18,36,54,64][i],42);G.placeRocket(s,8,42);G.begin(s,()=>0);return s;}

for(const faction of ['empire','orc']){
 const s=deploy(faction);assert.equal(s.cannons.filter(c=>c.x!==null).length,faction==='empire'?2:0);
 s.team='iron';s.stage='strategy';let steps=0,choices=0,shots=0;
 while(s.team==='iron'&&steps++<250){const needed=AI.humanDecision(s);if(needed){choices++;if(needed.kind==='reaction'){const charger=s.units.find(u=>u.team==='iron'&&u.charge?.reaction==='pending');G.chargeReaction(s,charger.id,'hold');}else if(needed.kind==='shieldwall')G.chooseLoserAction(s,'fall-back');else G.winnerCombat(s,'follow');continue;}assert.equal(AI.shouldAct(s),true);const result=AI.takeStep(s,()=>.55);assert.ok(result.message);if(result.report)shots++;}
 assert.ok(steps<250,`${faction} AI turn did not finish`);assert.equal(s.team,'ash');assert.equal(s.stage,'strategy');if(faction==='empire')assert.ok(shots>0,'Empire AI should fire at least one weapon');assert.ok(choices>=0);
}

{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s);G.nextPhase(s);s.movementStep='declare';for(const u of s.units)if(!['A4','I4'].includes(u.id)){u.x=null;u.y=null;}const charger=G.getUnit(s,'A4'),defender=G.getUnit(s,'I4');charger.x=defender.x=35;charger.y=22;defender.y=15;
 G.declareCharge(s,'A4','I4');assert.equal(AI.shouldAct(s),true);const result=AI.takeStep(s,()=>.2);assert.match(result.message,/chooses/);assert.notEqual(charger.charge.reaction,'pending');
}

{
 const s=deploy('empire');s.team='iron';s.stage='movement';s.movementStep='declare';for(const u of s.units)if(!['A1','I1'].includes(u.id)){u.x=null;u.y=null;}const attacker=G.getUnit(s,'I1'),defender=G.getUnit(s,'A1');attacker.x=defender.x=35;attacker.y=20;defender.y=28;
 assert.equal(G.chargePlan(s,attacker,defender).error,undefined);AI.takeStep(s,()=>.5);assert.equal(attacker.charge.reaction,'pending');assert.equal(AI.humanDecision(s).kind,'reaction');assert.equal(AI.shouldAct(s),false);
 G.chargeReaction(s,attacker.id,'hold');assert.equal(AI.shouldAct(s),true);
}

{
 const s=deploy('empire');s.team='iron';s.stage='combat';s.pendingCombat={winner:'I1',loser:'A1',stage:'loser-choice'};
 assert.deepEqual(AI.humanDecision(s).kind,'shieldwall');assert.equal(AI.shouldAct(s),false);
 s.pendingCombat={winner:'A1',loser:'I1',stage:'winner-choice'};assert.equal(AI.humanDecision(s).kind,'aftermath');assert.equal(AI.shouldAct(s),false);
}

console.log('PASS AI deployment, both opponent turns, and automated charge reaction');
