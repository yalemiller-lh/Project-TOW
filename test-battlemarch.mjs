import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
import * as BM from './dist/battlemarch.mjs';
import * as AI from './dist/ai.mjs';

const test=(name,fn)=>{fn();console.log('PASS '+name);};
// Dice in order: each value v rolls 1+floor(6v).
const seq=values=>{let i=0;return ()=>values[i++]??0;};
function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const bm=(o={})=>G.createGame('empire',{format:'battle-march',random:()=>0,...o});
function ready(o={}){const s=bm(o);G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:o.first??'ash'});return s;}
const clear=s=>{for(const u of G.combatants(s)){u.x=null;u.y=null;}};
const put=(s,id,x,y,heading)=>Object.assign(G.getUnit(s,id),{x,y,...(heading===undefined?{}:{heading})});
const trove=(s,id)=>s.objectives.items.find(o=>o.id===id);
// A unit facing north whose front edge is `gap` inches below the objective's footprint.
const below=(s,id,obj,gap)=>put(s,id,obj.x,obj.y+obj.r+gap+G.size(G.getUnit(s,id)).h/2,0);
const above=(s,id,obj,gap)=>put(s,id,obj.x,obj.y-obj.r-gap-G.size(G.getUnit(s,id)).h/2,180);
function playOut(s){let guard=0;while(s.stage!=='finished'&&guard++<500){G.nextPhase(s);G.skipEmptySteps(s);}}
function toRemainingMoves(s){G.nextPhase(s);if(s.movementStep==='declare')G.finishDeclarations(s);if(s.movementStep==='charges')G.enterRemaining(s);assert.equal(s.movementStep,'remaining');}

test('the objective D6 gives two troves on 1–2, three on 3–4 and the landmark on 5–6',()=>{
 for(const [r,kind,count] of [[0,'troves2',2],[.3,'troves2',2],[.34,'troves3',3],[.66,'troves3',3],[.67,'landmark',1],[.99,'landmark',1]]){
  const s=bm({random:()=>r});assert.equal(s.objectives.kind,kind,`roll ${1+Math.floor(r*6)}`);assert.equal(s.objectives.items.length,count);assert.equal(s.objectives.roll,1+Math.floor(r*6));
 }
 const s=bm({objectives:'troves3'});assert.equal(s.objectives.roll,null);assert.equal(s.objectives.items.length,3);assert.deepEqual(s.terrain,[]);
 for(const o of s.objectives.items){assert.equal(o.r,20/25.4,'40 mm treasure trove');assert.equal(o.y,s.board.height/2);}
 assert.throws(()=>bm({objectives:'baggage'}),/Unknown objective/);
});
test('the landmark is a 100 mm impassable, sight-blocking feature at the centre, with a D6 property',()=>{
 for(const [r,rule] of [[0,'magicResistance'],[.2,'magicResistance'],[.4,'frenzy'],[.6,'frenzy'],[.7,'stubborn'],[.99,'stubborn']]){
  const s=bm({random:seq([.99,r])});assert.equal(s.objectives.kind,'landmark');assert.equal(s.objectives.property.rule,rule);
 }
 const s=bm({objectives:'landmark'}),[t]=s.terrain;assert.deepEqual([t.x,t.y,t.r*2*25.4],[24,18,100]);assert.equal(t.impassable,true);assert.equal(t.blocksSight,true);
 const u=G.getUnit(s,'A1');assert.match(G.checkPosition(s,u,24,18),/impassable/);
});
test('treasure troves can be moved before deployment, on the table, clear of terrain and of each other',()=>{
 const s=bm({objectives:'troves2'});assert.equal(BM.canPlaceObjectives(s),true);
 BM.placeObjective(s,'T1',10,10);assert.deepEqual([trove(s,'T1').x,trove(s,'T1').y],[10,10]);
 assert.throws(()=>BM.placeObjective(s,'T1',.5,10),/whole treasure trove/);
 assert.throws(()=>BM.placeObjective(s,'T1',trove(s,'T2').x+.5,trove(s,'T2').y),/overlap/);
 s.terrain=[{id:'hill',x:30,y:8,r:2}];const clearance=2+20/25.4+3;
 assert.throws(()=>BM.placeObjective(s,'T1',30+clearance-.05,8),/3″ of a terrain/);BM.placeObjective(s,'T1',30+clearance+.05,8);
 G.deploymentRollOff(s,seq([.9,0]));G.chooseDeploymentOrder(s,'ash','ash');G.autoDeploy(s,{team:'ash'});
 assert.equal(BM.canPlaceObjectives(s),false);assert.throws(()=>BM.placeObjective(s,'T1',12,12),/before any unit/);
 assert.throws(()=>BM.placeObjective(bm({objectives:'landmark'}),'L',10,10),/centre/);
});

test('control: within 3″ measured between footprints, Unit Strength 5+, not fleeing, not stupid',()=>{
 const s=ready({objectives:'troves2'}),t=trove(s,'T1');clear(s);
 const a=below(s,'A1',t,2.9);assert.ok(Math.hypot(a.x-t.x,a.y-t.y)>3,'centre-to-centre is further than 3″');
 let c=BM.controlOf(s,t);assert.equal(c.controller,'ash');assert.equal(c.unit,'A1');
 below(s,'A1',t,3.1);assert.equal(BM.controlOf(s,t).controller,null);below(s,'A1',t,2.9);
 a.fleeing=true;assert.equal(BM.controlOf(s,t).controller,null);a.fleeing=false;
 a.stupid=true;assert.equal(BM.controlOf(s,t).controller,null);a.stupid=false;
 G.removeCasualties(s,a,15);assert.equal(G.unitStrength(a),5);assert.equal(BM.controlOf(s,t).controller,'ash','Unit Strength 5 is enough');
 G.removeCasualties(s,a,1);assert.equal(G.unitStrength(a),4);assert.equal(BM.controlOf(s,t).controller,null,'Unit Strength 4 is not');
 for(const id of ['A6','I7','A5','I5']){const u=G.getUnit(s,id);clear(s);Object.assign(u,{x:t.x,y:t.y+3});assert.equal(BM.controlOf(s,t).controller,null,`${id} (Unit Strength ${G.unitStrength(u)}) cannot control`);}
});
test('control: the closest unit wins; equally close, higher Unit Strength; still tied, contested',()=>{
 const s=ready({objectives:'troves2'}),t=trove(s,'T1');clear(s);
 below(s,'A1',t,2.9);above(s,'I1',t,2.5);let c=BM.controlOf(s,t);assert.equal(c.controller,'iron');assert.match(c.reason,/closest/);
 above(s,'I1',t,2.9);c=BM.controlOf(s,t);assert.equal(c.controller,null);assert.equal(c.contested,true);assert.match(c.reason,/Contested/);
 G.getUnit(s,'I1').x=null;above(s,'I3',t,2.9);assert.equal(G.unitStrength(G.getUnit(s,'I3')),15);c=BM.controlOf(s,t);assert.equal(c.controller,'ash');assert.match(c.reason,/higher Unit Strength \(20 vs 15\)/);
 G.getUnit(s,'I3').x=null;above(s,'A2',t,2.9);c=BM.controlOf(s,t);assert.equal(c.controller,'ash','two friendly units tied: still that army');assert.equal(c.contested,false);
});
test('both armies score at the end of every player turn, and each turn is scored exactly once',()=>{
 const s=ready({objectives:'troves2'});clear(s);put(s,'A1',trove(s,'T1').x,trove(s,'T1').y,0);put(s,'I1',trove(s,'T2').x,trove(s,'T2').y,180);
 assert.equal(G.endOfPlayerTurn(s,'ash'),true);assert.equal(G.endOfPlayerTurn(s,'ash'),false);
 assert.deepEqual(s.scoring.ledger.map(e=>[e.turn,e.team,e.objective,e.vp]),[['ash','ash','T1',10],['ash','iron','T2',10]]);
 G.endOfPlayerTurn(s,'iron');assert.equal(s.scoring.ledger.length,4);
 const vp=BM.score(s);assert.deepEqual(vp.committed,{ash:20,iron:20});assert.deepEqual(vp.provisional,{ash:0,iron:0});
});
test('the landmark scores 25 and lends its property to the controlling unit until the end of the next turn',()=>{
 for(const first of ['ash','iron']){
  const s=ready({objectives:'landmark',random:seq([.5]),first}),L=trove(s,'L'),second=first==='ash'?'iron':'ash';clear(s);
  const a=below(s,'A1',L,.5);assert.equal(s.objectives.property.rule,'frenzy');
  G.endOfPlayerTurn(s,first);assert.equal(G.hasRule(a,'frenzy'),true);assert.equal(a.effects[0].expires,`1:${second}`);assert.equal(s.scoring.ledger.at(-1).vp,25);
  a.y+=10;G.endOfPlayerTurn(s,second);assert.equal(G.hasRule(a,'frenzy'),false,'expires at the end of the next turn');
  s.round=2;below(s,'A1',L,.5);G.endOfPlayerTurn(s,first);assert.equal(a.effects.at(-1).expires,`2:${second}`);
  G.endOfPlayerTurn(s,second);assert.equal(G.hasRule(a,'frenzy'),true,'still holding it: granted again');assert.equal(a.effects.length,1);assert.equal(a.effects[0].expires,`3:${first}`);
 }
 const u={effects:[{rule:'magicResistance',source:'landmark'}]};assert.equal(G.magicResistance(u),2);
});
test('casualty VP: full when destroyed or fled off, half (rounded up) when fleeing or at 25% or less, never both',()=>{
 const s=ready({objectives:'troves2'}),I1=G.getUnit(s,'I1'),I3=G.getUnit(s,'I3'),I5=G.getUnit(s,'I5'),mage=G.getUnit(s,'I7');
 assert.deepEqual(BM.casualtyVP(I1),{vp:0,reason:null});
 G.removeCasualties(s,I1,14);assert.equal(BM.casualtyVP(I1).vp,0,'6 of 20 is above 25%');
 G.removeCasualties(s,I1,1);assert.equal(BM.casualtyVP(I1).vp,Math.ceil(135/2),'5 of 20 is exactly 25%');assert.match(BM.casualtyVP(I1).reason,/Unit Strength/);
 I3.fleeing=true;assert.equal(BM.casualtyVP(I3).vp,53,'105 halved rounds up to 53');
 I1.fleeing=true;assert.equal(BM.casualtyVP(I1).vp,68,'fleeing and reduced: still one half award');
 I3.destroyed=true;assert.equal(BM.casualtyVP(I3).vp,105);I3.leftBoard='fled';assert.match(BM.casualtyVP(I3).reason,/fled off/);
 I5.wounds=1;assert.equal(BM.casualtyVP(I5).vp,0,'1 of 3 Wounds is above 25%');I5.wounds=0;assert.equal(BM.casualtyVP(I5).vp,125);
 mage.wounds=1;assert.equal(BM.casualtyVP(mage).vp,0);
 const vp=BM.score(s);assert.equal(vp.final,false);assert.ok(vp.lines.ash.filter(l=>l.kind==='casualty').every(l=>!l.committed),'casualty VP stay provisional');
});
test('General (+50), captured standards (+25) and a Battle Standard Bearer (+25) score for the enemy',()=>{
 const s=ready({objectives:'troves2'}),general=G.getUnit(s,'I7');assert.equal(general.general,true);
 general.fleeing=true;let lines=BM.score(s).lines.ash;assert.ok(lines.some(l=>l.kind==='general'&&l.vp===50&&/fleeing/.test(l.detail)));
 general.fleeing=false;general.destroyed=true;lines=BM.score(s).lines.ash;assert.ok(lines.some(l=>l.kind==='general'&&/slain/.test(l.detail)));
 s.trophies=[{unit:'I1',team:'ash',round:2}];assert.ok(BM.score(s).lines.ash.some(l=>l.kind==='standard'&&l.vp===25&&l.committed));
 G.getUnit(s,'A1').battleStandard=true;G.getUnit(s,'A1').destroyed=true;assert.ok(BM.score(s).lines.iron.some(l=>l.kind==='battleStandard'&&l.vp===25));
});
test('results use the configurable, unconfirmed policy: a 100 VP margin to win, double for a crushing victory',()=>{
 const policy=F=>BM.classify(F,{id:'core-100',margin:100,crushingRatio:2,confirmed:false});
 assert.equal(policy({ash:300,iron:250}).label,'Draw');assert.equal(policy({ash:350,iron:250}).winner,'ash');assert.equal(policy({ash:350,iron:250}).label,'Victory');
 assert.equal(policy({ash:200,iron:500}).label,'Crushing victory');assert.equal(policy({ash:0,iron:0}).label,'Draw');
 assert.equal(bm().format.resultPolicy.confirmed,false);
});
for(const first of ['ash','iron'])test(`with ${first} first, skipped phases still score every turn end and the battle ends after round five`,()=>{
 const s=ready({objectives:'troves2',first});put(s,'A1',trove(s,'T1').x,trove(s,'T1').y,0);put(s,'I1',trove(s,'T2').x,trove(s,'T2').y,180);
 playOut(s);assert.equal(s.stage,'finished');assert.equal(s.round,5);assert.equal(s.turnLog.length,10);
 const keys=s.scoring.ledger.map(e=>`${e.round}:${e.turn}:${e.objective}`);assert.equal(keys.length,20);assert.equal(new Set(keys).size,20);
 assert.deepEqual(s.result.totals,{ash:100,iron:100});assert.equal(s.result.label,'Draw');assert.equal(s.result.final,true);assert.match(s.result.reason,/final round/);
 assert.throws(()=>G.nextPhase(s),/over/);assert.equal(G.endOfPlayerTurn(s,s.team),false);
});

test('armies deploy one unit at a time; the roll-off winner chooses who starts',()=>{
 const s=bm({objectives:'troves2'}),d=s.deployOrder;
 assert.throws(()=>G.place(s,'A1',10,30),/Roll off first/);
 assert.throws(()=>G.chooseDeploymentOrder(s,'ash','ash'),/Roll off/);
 const r=G.deploymentRollOff(s,seq([.5,.5,.9,0]));assert.deepEqual(r.rolls,[{ash:4,iron:4},{ash:6,iron:1}],'ties are re-rolled');assert.equal(r.winner,'ash');
 assert.throws(()=>G.deploymentRollOff(s),/has been made/);assert.throws(()=>G.chooseDeploymentOrder(s,'iron','iron'),/winner/);
 G.chooseDeploymentOrder(s,'ash','iron');assert.equal(G.deploymentTurn(s),'iron');
 assert.throws(()=>G.place(s,'A1',10,30),/deploys the next unit/);
 G.place(s,'I1',10,6);assert.equal(d.pending,'I1');G.place(s,'I2',20,6);assert.equal(G.getUnit(s,'I1').x,null,'the other unit returns to reserve');assert.equal(d.pending,'I2');
 G.place(s,'I2',22,6);assert.equal(G.getUnit(s,'I2').x,22,'adjustable until confirmed');
 assert.equal(G.confirmDeployment(s).next,'ash');assert.throws(()=>G.place(s,'I2',25,6),/already deployed|deploys the next/);
 assert.throws(()=>G.confirmDeployment(s),/Place a unit/);
 while(!d.complete)G.autoDeploy(s,{team:d.next});
 assert.deepEqual(d.log.map(e=>e.team),['iron','ash','iron','ash','iron','ash','iron','ash','iron','ash','iron'],'alternate until Red is down, then the rest');
 for(const u of s.units)assert.equal(G.checkPosition(s,u,u.x,u.y,true),null,u.id);
 assert.throws(()=>G.begin(s),/Roll off for the first turn/);
 const f=G.firstTurnRollOff(s,seq([0,.9]));assert.equal(f.winner,'iron');assert.throws(()=>G.chooseFirstTurn(s,'ash','ash'),/winner/);
 G.chooseFirstTurn(s,'iron','ash');G.begin(s,()=>0);assert.equal(s.team,'ash');assert.equal(s.firstPlayer,'ash');
});
test('a placement the player has not confirmed does not finish deployment',()=>{
 const s=bm({objectives:'troves2'});G.deploymentRollOff(s,seq([.9,0]));G.chooseDeploymentOrder(s,'ash','ash');
 while(G.deploymentPieces(s,'ash').concat(G.deploymentPieces(s,'iron')).filter(p=>!p.deployed).length>1)G.autoDeploy(s,{team:s.deployOrder.next});
 const last=G.deploymentPieces(s,'ash').concat(G.deploymentPieces(s,'iron')).find(p=>!p.deployed);assert.equal(last.team,'iron');
 const spot=[...Array(47).keys()].flatMap(x=>[...Array(11).keys()].map(y=>({x:x+1,y:y+1}))).find(p=>last.role==='warmachine'?(()=>{try{const t=structuredClone(s);G.placeCannon(t,last.id,p.x,p.y);return true;}catch{return false;}})():G.checkPosition(s,last,p.x,p.y,true)===null);
 if(last.role==='warmachine')G.placeCannon(s,last.id,spot.x,spot.y);else G.place(s,last.id,spot.x,spot.y);assert.equal(s.deployOrder.pending,last.id);
 assert.throws(()=>G.firstTurnRollOff(s),/Deploy both armies/);G.confirmDeployment(s);assert.equal(s.deployOrder.complete,true);
});

test('optional rules default off; unavailable ones cannot be switched on',()=>{
 assert.deepEqual(Object.values(bm().format.optional),[false,false,false,false,false,false,false]);
 assert.throws(()=>bm({optional:{baggageCarts:true}}),/not available yet/);assert.throws(()=>bm({optional:{nonsense:true}}),/Unknown optional rule/);
 const s=ready({objectives:'troves2'}),t=trove(s,'T1');toRemainingMoves(s);clear(s);below(s,'A3',t,1);G.commitOrder(s,'A3',{kind:'advance',distance:1,mode:'advance',angle:0});
 assert.deepEqual(BM.raidOptions(s,G.getUnit(s,'A3')),[],'Raid & Burn is off');
});
test('Raid & Burn: into contact in Remaining Moves, no shooting, burned at the next Start of Turn for 30 VP',()=>{
 const s=ready({objectives:'troves2',optional:{raidAndBurn:true}}),t=trove(s,'T1'),a=G.getUnit(s,'A3');
 toRemainingMoves(s);for(const u of G.combatants(s).filter(u=>u.team==='iron'))u.x=null;below(s,'A3',t,1);
 assert.deepEqual(BM.raidOptions(s,a),[],'it has to move into contact');
 G.commitOrder(s,'A3',{kind:'advance',distance:1,mode:'advance',angle:0});assert.ok(BM.objectiveDistance(a,t)<1e-6);
 assert.deepEqual(BM.raidOptions(s,a).map(o=>o.id),['T1']);BM.startRaid(s,'A3','T1');assert.equal(a.moved,true);assert.throws(()=>BM.startRaid(s,'A3','T1'),/Only a unit/);
 G.nextPhase(s);const shooting={...s,stage:'shooting',team:'ash'};assert.equal(G.canShoot(shooting,a),false);put(s,'I1',t.x,t.y-10,180);assert.match(G.shootingPlan(s,a,G.getUnit(s,'I1')).error,/destroying a treasure trove/);G.getUnit(s,'I1').x=null;assert.match(G.inactionReason(shooting,a),/Raid & Burn/);
 while(s.team==='ash')G.nextPhase(s);assert.equal(a.raiding.trove,'T1','still burning during the enemy turn');
 while(s.team==='iron')G.nextPhase(s);
 assert.equal(t.removed.team,'ash');assert.equal(a.raiding,null);assert.deepEqual(s.raidReports,[{unit:'A3',trove:'T1',success:true,reason:null}]);
 const vp=BM.score(s).lines.ash;assert.ok(vp.some(l=>l.kind==='raid'&&l.vp===30));assert.equal(vp.filter(l=>l.kind==='objective').length,2,'held at both turn ends before it burned');
 G.endOfPlayerTurn(s,'ash');assert.equal(s.scoring.ledger.filter(e=>e.objective==='T1'&&e.kind==='trove').length,2,'a burned trove cannot be held');
});
test('Raid & Burn fails if the raider is no longer in contact or is engaged at its next Start of Turn',()=>{
 for(const spoil of [u=>{u.x+=8;},u=>{u.engaged='I1';}]){
  const s=ready({objectives:'troves2',optional:{raidAndBurn:true}}),t=trove(s,'T1'),a=G.getUnit(s,'A3');
  toRemainingMoves(s);below(s,'A3',t,1);G.commitOrder(s,'A3',{kind:'advance',distance:1,mode:'advance',angle:0});BM.startRaid(s,'A3','T1');
  while(s.team==='ash')G.nextPhase(s);spoil(a);BM.startOfTurn(s,'ash');
  assert.equal(t.removed,undefined);assert.equal(s.raidReports[0].success,false);assert.match(s.raidReports[0].reason,/contact|engaged/);
 }
});
test('a player may concede, or the players may stop at an agreed time limit and score the battle as it stands',()=>{
 assert.throws(()=>BM.concede(bm(),'ash'),/not started/);
 const s=ready({objectives:'troves2'});BM.concede(s,'iron');assert.equal(s.stage,'finished');assert.equal(s.result.winner,'ash');assert.equal(s.result.label,'Victory by concession');
 const t=ready({objectives:'troves2'});put(t,'A1',trove(t,'T1').x,trove(t,'T1').y,0);G.endOfPlayerTurn(t,'ash');BM.endByAgreement(t);assert.equal(t.stage,'finished');assert.equal(t.result.totals.ash,10);assert.match(t.result.reason,/agreed/);assert.throws(()=>BM.endByAgreement(t),/already over/);
});

test('the bot deploys one legal unit per turn, answers the roll-offs, and moves to claim objectives',()=>{
 const r=rng(7),s=bm({objectives:'troves3'}),d=s.deployOrder;
 G.deploymentRollOff(s,seq([0,.9]));assert.equal(AI.deploymentChoice(s),'deploy-order');AI.takeDeploymentStep(s);assert.equal(d.first,'ash');
 while(!d.complete){const before=d.log.length;if(AI.deploymentChoice(s)==='deploy'){AI.takeDeploymentStep(s);const last=G.getUnit(s,d.log.at(-1).id);assert.equal(last.team,'iron');assert.ok(G.inZone(s,'iron',G.corners(last)),last.id);}else G.autoDeploy(s,{team:'ash'});assert.equal(d.log.length,before+1);}
 for(const u of s.units)assert.equal(G.checkPosition(s,u,u.x,u.y,true),null,u.id);
 G.firstTurnRollOff(s,seq([0,.9]));assert.equal(AI.deploymentChoice(s),'first-turn');AI.takeDeploymentStep(s);assert.equal(s.firstTurn.chosen,'iron');
 G.begin(s,r);assert.equal(s.team,'iron');
 const near=()=>Math.min(...s.objectives.items.map(o=>Math.min(...s.units.filter(u=>u.team==='iron'&&BM.canControl(u)).map(u=>BM.objectiveDistance(u,o))))),start=near();
 for(let guard=0;guard<200&&s.team==='iron'&&s.stage!=='finished';guard++){if(AI.shouldAct(s))AI.takeStep(s,r);else break;}
 assert.ok(near()<start,`the bot closes on an objective (${start.toFixed(1)}″ → ${near().toFixed(1)}″)`);
});
