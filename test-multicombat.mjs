import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

const test=(name,fn)=>{fn();console.log('PASS '+name);};
// Dice in order: each value v rolls 1+floor(6v); afterwards every die is a 1.
const seq=values=>{let i=0;return ()=>values[i++]??0;};
// A Classic table with only the named units on it, in the Movement phase's declare step.
function table(ids){const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0);s.stage='movement';s.movementStep='declare';for(const u of G.combatants(s))if(!ids.includes(u.id)){u.x=null;u.y=null;}return s;}
const put=(s,id,x,y,heading)=>Object.assign(G.getUnit(s,id),{x,y,heading});
const W=4.92125984251968,H=3.937007874015748;
// I1 faces south at (36,20). A1 charges its front from the south, A2 its flank from the east.
function twoChargers(frontGap=4,flankGap=3){const s=table(['A1','A2','I1']);put(s,'I1',36,20,180);put(s,'A1',36,20+H+frontGap,0);put(s,'A2',36+W/2+flankGap+H/2,20,270);return s;}
function engaged(s,a,b){return G.engagedWith(G.getUnit(s,a),b)&&G.engagedWith(G.getUnit(s,b),a);}

test('two units charge one enemy, front and flank; it reacts once and fights both',()=>{
 const s=twoChargers();assert.equal(G.declareCharge(s,'A1','I1').reaction,'pending');
 const flank=G.chargePlan(s,G.getUnit(s,'A2'),G.getUnit(s,'I1'));assert.equal(flank.error,undefined);assert.match(flank.face,/flank/);
 G.declareCharge(s,'A2','I1');G.finishDeclarations(s);assert.equal(s.movementStep,'reactions','reactions come after every declaration');
 assert.throws(()=>G.declareCharge(s,'A1','I1'),/Declare charges/);
 G.chargeReaction(s,'A1','hold');assert.equal(G.getUnit(s,'A2').charge.reaction,'hold','one reaction answers both charges');assert.equal(s.movementStep,'charges');
 assert.equal(G.resolveCharge(s,'A1',[6,6]).success,true);assert.equal(G.resolveCharge(s,'A2',[6,6]).success,true);
 assert.ok(engaged(s,'A1','I1')&&engaged(s,'A2','I1'));assert.deepEqual(G.combats(s),[['A1','A2','I1']]);
 const a1=G.getUnit(s,'A1'),a2=G.getUnit(s,'A2');assert.ok(G.gap(a1,a2)>=0&&!(G.gap(a1,a2)<0));
 assert.equal(G.gap(a2,G.getUnit(s,'I1'))<1e-6,true);
});
test('a charge into a unit already in combat is allowed, and that unit can only Hold',()=>{
 const s=twoChargers();put(s,'A1',36,20+H,0);const a1=G.getUnit(s,'A1'),i1=G.getUnit(s,'I1');a1.engaged=['I1'];i1.engaged=['A1'];
 assert.equal(G.chargePlan(s,G.getUnit(s,'A2'),i1).error,undefined);assert.equal(G.declareCharge(s,'A2','I1').reaction,'hold');
 G.finishDeclarations(s);assert.equal(s.movementStep,'charges');G.resolveCharge(s,'A2',[6,6]);assert.ok(engaged(s,'A2','I1')&&engaged(s,'A1','I1'));
 assert.throws(()=>G.declareCharge(s,'A1','I1'),/./,'an engaged unit cannot charge');
});
test('Stand & Shoot picks one charger and holds against the rest, unless any charger is too close',()=>{
 const s=table(['A1','A2','I4']);put(s,'I4',36,20,180);put(s,'A1',36,20+H+5,0);put(s,'A2',36+W/2+2+H/2,20,270);
 G.declareCharge(s,'A1','I4');G.declareCharge(s,'A2','I4');G.finishDeclarations(s);
 assert.throws(()=>G.chargeReaction(s,'A1','stand-shoot',()=>0),/too close/,'A2 is within its 3″ Movement');
 const t=table(['A1','A2','I4']);put(t,'I4',36,20,180);put(t,'A1',36,20+H+5,0);put(t,'A2',36+W/2+4+H/2,20,270);
 G.declareCharge(t,'A1','I4');G.declareCharge(t,'A2','I4');G.finishDeclarations(t);
 const r=G.chargeReaction(t,'A1','stand-shoot',()=>0);assert.equal(r.report.band,'Stand & Shoot');assert.equal(G.getUnit(t,'A1').charge.reaction,'stand-shoot');assert.equal(G.getUnit(t,'A2').charge.reaction,'hold');
});
test('a unit charged by several units flees directly away from the one with the highest Unit Strength',()=>{
 const s=twoChargers();G.removeCasualties(s,G.getUnit(s,'A1'),10);assert.equal(G.unitStrength(G.getUnit(s,'A2')),20);
 G.declareCharge(s,'A1','I1');G.declareCharge(s,'A2','I1');G.finishDeclarations(s);
 const before=G.getUnit(s,'I1').x;G.chargeReaction(s,'A1','flee',()=>0);const i1=G.getUnit(s,'I1');
 assert.equal(Math.round(i1.heading),270,'away from A2 in the east, not from A1 in the south');assert.ok(i1.x<before);assert.equal(i1.fleeing,true);
 assert.equal(G.getUnit(s,'A2').charge.reaction,'flee');
});

// A combat of A1 (front) and A2 (flank) against I1, already in contact.
function combat(){const s=twoChargers();put(s,'A1',36,20+H,0);put(s,'A2',36+W/2+H/2,20,270);for(const [a,b]of [['A1','I1'],['A2','I1']]){G.getUnit(s,a).engaged=[...G.opponentIds(G.getUnit(s,a)),b];G.getUnit(s,b).engaged=[...G.opponentIds(G.getUnit(s,b)),a];}G.getUnit(s,'A1').charge={status:'success',target:'I1',distance:4,face:'front'};G.getUnit(s,'A2').charge={status:'success',target:'I1',distance:3,face:'left flank'};s.stage='combat';return s;}
test('combat result in a multiple combat: summed wounds, highest rank bonus, one standard, flank once, Close Order per unit',()=>{
 const s=combat();G.beginCombat(s,'A1');assert.deepEqual([...s.combatSession.units].sort(),['A1','A2','I1']);
 while(s.combatSession.phase==='attacks')G.fightCombatStep(s,()=>0);
 const r=G.compareCombat(s),ash=r.score.ash,iron=r.score.iron;
 assert.deepEqual([ash.wounds,ash.ranks,ash.standard,ash.flank,ash.closeOrder,ash.massed],[0,2,1,1,2,1]);
 assert.equal(iron.ranks,0,'I1 is disrupted by a flank attack from 10+ models');assert.equal(ash.total,7);assert.equal(iron.total,2);
 assert.equal(r.winnerSide,'ash');assert.equal(r.score.A2,r.score.ash,'each unit id reads its side’s result');assert.deepEqual(r.losers,['I1']);
});
test('the loser takes a Break test; a winner it moved away from follows up, one still touching it fights on',()=>{
 const s=combat();G.resolveCombat(s,'A1',()=>0);const p=s.pendingCombat;assert.equal(p.outcome,'give-ground','double 1 always gives ground');
 assert.equal(p.stage,'retreat');G.moveCombatLoser(s,()=>0);assert.equal(s.pendingCombat.stage,'winner-choice');assert.equal(s.pendingCombat.winner,'A1');
 assert.ok(engaged(s,'A2','I1'),'I1 gave ground along A2’s side, so A2 is still in the fight and does not follow up');
 G.winnerCombat(s,'follow',()=>0);assert.equal(s.pendingCombat,null);assert.ok(engaged(s,'A1','I1'),'A1 followed up into contact again');
});
test('two losers each test; a winner still touching an enemy cannot pursue',()=>{
 // A1 fights I1 (front) and I2 (on A1's left flank); I3 stands right behind I2 so I2 cannot give ground.
 const s=table(['A1','I1','I2','I3']);put(s,'A1',36,24,0);put(s,'I1',36,24-H,180);put(s,'I2',36-W/2-H/2,24,90);put(s,'I3',36-W/2-H-.5-H/2,24,90);
 for(const id of ['I1','I2']){G.getUnit(s,'A1').engaged=[...G.opponentIds(G.getUnit(s,'A1')),id];G.getUnit(s,id).engaged=['A1'];}
 s.stage='combat';s.team='ash';for(const id of ['I1','I2'])G.removeCasualties(s,G.getUnit(s,id),12);
 G.beginCombat(s,'A1');while(s.combatSession.phase==='attacks')G.fightCombatStep(s,()=>0);const r=G.compareCombat(s);
 assert.equal(r.winnerSide,'ash');assert.deepEqual([...r.losers].sort(),['I1','I2']);
 const order=[];for(let i=0;i<4&&s.pendingCombat?.stage==='break';i++){const loser=s.pendingCombat.loser;order.push(loser);G.rollCombatBreak(s,loser==='I1'?seq([.99,.99]):()=>0);if(s.pendingCombat.stage==='loser-choice')G.chooseLoserAction(s,'fall-back');G.moveCombatLoser(s,()=>.5);}
 assert.equal(order.length,2,'both losers took a Break test');
 assert.equal(G.getUnit(s,'I1').fleeing,true);assert.ok(engaged(s,'A1','I2'),'I2 could not get clear');
 assert.equal(s.pendingCombat,null,'A1 is still in contact with I2, so it cannot pursue I1');
});
test('attacks split between the enemies a unit touches; the focus decides models that touch both',()=>{
 const s=table(['A1','I1','I2']);put(s,'A1',36,24,0);put(s,'I1',36,24-H,180);put(s,'I2',36-W/2-H/2,24,90);
 for(const id of ['I1','I2']){G.getUnit(s,'A1').engaged=[...G.opponentIds(G.getUnit(s,'A1')),id];G.getUnit(s,id).engaged=['A1'];}
 const a1=G.getUnit(s,'A1'),split=G.attackAllocation(s,a1);assert.deepEqual([...split.keys()].sort(),['I1','I2']);
 const corner=m=>m.contacts.length>1;assert.ok(G.modelSquares(s,a1).some(corner),'the front-left model touches both');
 const both=G.modelSquares(s,a1).find(corner),attacks=(focus,id)=>{a1.combatFocus=focus;return G.attackAllocation(s,a1).get(id).some(m=>m.index===both.index);};assert.ok(attacks('I2','I2')&&attacks('I1','I1'),'the model touching both follows the focus');
});
test('a pursuer that meets an enemy in a combat not yet fought joins it',()=>{
 const s=table(['A1','A2','I1','I2']);s.stage='combat';put(s,'A1',36,30,0);
 put(s,'I2',36,30-H/2-3-H/2,180);put(s,'A2',36,30-H/2-3-H-H/2,180);G.getUnit(s,'I2').engaged=['A2'];G.getUnit(s,'A2').engaged=['I2'];
 const i1=G.getUnit(s,'I1');i1.x=null;i1.destroyed=true;
 s.pendingCombat={stage:'winner-choice',winner:'A1',loser:'I1',outcome:'overrun',loserDestroyed:true,retreat:{moved:0,dir:null}};
 const out=G.winnerCombat(s,'follow',()=>.99);assert.equal(out.contact,'I2');assert.equal(out.joinedCombat,true);
 assert.ok(engaged(s,'A1','I2'));assert.equal(G.getUnit(s,'A1').combatResolved,false,'it fights again in that combat');assert.deepEqual(G.combats(s),[['A1','A2','I2']]);
});
test('one-on-one combats keep their single winner and loser',()=>{
 const s=table(['A1','I1']);put(s,'I1',36,20,180);put(s,'A1',36,20+H,0);G.getUnit(s,'A1').engaged=['I1'];G.getUnit(s,'I1').engaged=['A1'];s.stage='combat';G.removeCasualties(s,G.getUnit(s,'I1'),5);
 const r=G.resolveCombat(s,'A1',()=>0);assert.equal(r.winner,'A1');assert.equal(r.loser,'I1');assert.deepEqual(r.units,['A1','I1']);assert.equal(r.score.A1.total,r.score.ash.total);
});
test('a unit left touching a friend after a combat can move away from it, but not into it',()=>{
 const s=table(['A1','A2']);s.movementStep='remaining';put(s,'A1',30,30,0);put(s,'A2',30+W,30,0);assert.ok(G.gap(G.getUnit(s,'A1'),G.getUnit(s,'A2'))<1e-6);
 assert.equal(G.orderError(s,G.getUnit(s,'A1'),{kind:'advance',distance:2,mode:'advance',angle:0}),null,'straight ahead, alongside its friend');
 assert.equal(G.orderError(s,G.getUnit(s,'A1'),{kind:'side',side:-1,distance:1,mode:'advance',angle:0}),null,'stepping away');
 assert.match(G.orderError(s,G.getUnit(s,'A1'),{kind:'side',side:1,distance:1,mode:'advance',angle:0})??'',/blocks|between/,'stepping into it');
 assert.match(G.checkPosition(s,G.getUnit(s,'A1'),30,30)??'',/between/,'placement still keeps 1″');
});
