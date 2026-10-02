import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
import * as BM from './dist/battlemarch.mjs';

// Characters joining units (core rules: Characters & Units, Positioning Characters, Enemy
// Shooting (Characters), "Look Out, Sir!", Fleeing Units (Characters), Leaving a Unit).
const test=(name,fn)=>{fn();console.log('PASS '+name);};
const dice=(...faces)=>{let i=0;return ()=>(faces[Math.min(i++,faces.length-1)]-1)/6+.01;};
const near=(a,b,tol=1e-6)=>Math.abs(a-b)<=tol;
const clearExcept=(s,keep)=>{for(const p of G.allPieces(s))if(!keep.includes(p.id)){p.x=null;p.y=null;}};
const front=u=>{const a=G.heading(u)*Math.PI/180,h=G.size(u).h;return {x:u.x+Math.sin(a)*h/2,y:u.y-Math.cos(a)*h/2};};
// A classic battle, deployed; the Daemonsmith (A6) joins the Chaos Dwarf Warriors (A1) as it deploys.
function joined(){const s=G.createGame('empire');G.autoDeploy(s);G.unplace(s,'A6');G.joinUnit(s,'A6','A1');return s;}

test('joining in deployment: a front-rank place beside the command group; the block grows at the back',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);const a=G.getUnit(s,'A1'),w=G.getUnit(s,'A6'),before=front(a),h=G.size(a).h;G.unplace(s,'A6');
 const out=G.joinUnit(s,'A6','A1');assert.equal(out.slot,4,'the outermost front-rank place not used by the command group');assert.equal(w.joined,'A1');
 assert.ok(near(G.size(a).h,h+G.size(w).h),'20 warriors and a character take five ranks');assert.ok(near(front(a).x,before.x)&&near(front(a).y,before.y),'the front edge stays');
 const corner=G.localPoint(a,G.size(a).w/2-G.size(w).w/2,-G.size(a).h/2+G.size(w).h/2);assert.ok(near(w.x,corner.x)&&near(w.y,corner.y),'the character stands in its place');
 const displaced=G.modelSquares(s,a).find(m=>m.index===4);assert.deepEqual([displaced.row,displaced.col],[4,0],'the model it displaced stands in the rear rank');
 assert.equal(G.checkPosition(s,a,a.x,a.y),null,'a unit does not keep 1″ from its own character');assert.equal(G.combatants(s).some(p=>p.id==='A6'),false);
});
test('the character moves with its unit, cannot be given orders, and casts as itself',()=>{
 const s=joined();G.begin(s,()=>0,{firstPlayer:'ash'});const a=G.getUnit(s,'A1'),w=G.getUnit(s,'A6'),y=w.y;Object.assign(s,{stage:'movement',movementStep:'remaining'});
 assert.equal(G.canAct(s,w),false);assert.equal(G.inactionReason(s,w),null,'it may cast Steed of Shadows on its own unit, which it always sees');G.commitOrder(s,'A1',{kind:'advance',mode:'advance',distance:2});assert.ok(near(w.y,y-2,1e-9));assert.match(G.inactionReason(s,w)??'',/Joined to/,'its unit has moved');
 w.spells=['darkness'];w.castThisTurn=[];s.stage='strategy';const e=G.getUnit(s,'I1');Object.assign(e,{x:a.x,y:a.y-14,heading:180});assert.equal(G.castBlockReason(s,'A6','darkness'),null);assert.equal(G.targetReason(s,'A6','darkness',e),null,'its own unit does not block it');
});
test('shooting: the character is no target; with fewer than five rank and file the hits are shared',()=>{
 const s=joined();G.begin(s,()=>0,{firstPlayer:'iron'});clearExcept(s,['A1','A6','I4']);const a=G.getUnit(s,'A1'),x=G.getUnit(s,'I4');Object.assign(a,{x:30,y:24,heading:0});G.syncJoined(s);Object.assign(x,{x:30,y:12,heading:180});Object.assign(s,{stage:'shooting',team:'iron'});
 assert.deepEqual(G.shootingTargets(s,x).map(t=>t.unit.id),['A1']);const r=G.shoot(s,'I4','A1',()=>.67);assert.equal(r.characters,undefined,'five or more rank and file: every hit is the unit\'s');
 a.deadModels=Array.from({length:17},(_,i)=>i+3);x.shot=false;const q=G.shoot(s,'I4','A1',()=>.67),total=q.hits+(q.characters?.[0]?.hits??0);
 assert.equal(q.hits,Math.min(total,3)+Math.ceil(Math.max(0,total-3)/2),'one hit per model first, then shared, the unit first');assert.equal(q.characters?.[0]?.id,'A6');
});
test('"Look Out, Sir!": a character under a template is hit on a 1; on a 2+ a model of the unit is hit instead',()=>{
 const s=joined(),w=G.getUnit(s,'A6');for(const [roll,saved]of [[1,false],[2,true],[6,true]]){const cell={unit:w,model:0},out=G.lookOutSir(s,cell,dice(roll));assert.equal(out.saved,saved);assert.equal(cell.unit.id,saved?'A1':'A6');}
 G.getUnit(s,'A1').deadModels=Array.from({length:16},(_,i)=>i+4);assert.equal(G.lookOutSir(s,{unit:w},dice(6)),null,'fewer than five rank and file: no roll');
});
test('Break tests and Panic use the highest Leadership in the unit; the character flees with it and is lost if it is run down',()=>{
 const s=G.createGame('empire',{format:'battle-march',points:500});G.autoDeploy(s);const c=G.getUnit(s,'I12'),u=G.getUnit(s,'I1');c.general=false;
 assert.equal(G.leadership(u,'normal',s),7);c.deployed=false;s.deployOrder.auto=true;G.joinUnit(s,'I12','I1');assert.equal(G.leadership(u,'normal',s),9,'the Captain\'s Leadership 9');
 const r=joined();G.begin(r,()=>0,{firstPlayer:'iron'});clearExcept(r,['A1','A6','I1']);const a=G.getUnit(r,'A1'),e=G.getUnit(r,'I1');Object.assign(a,{x:30,y:30,heading:180});G.syncJoined(r);Object.assign(e,{x:30,y:30+G.size(a).h/2+3+G.size(e).h/2,heading:0});
 Object.assign(r,{stage:'movement',team:'iron',movementStep:'declare'});G.declareCharge(r,'I1','A1');G.chargeReaction(r,'I1','flee',dice(1,1));assert.equal(G.getUnit(r,'A6').fleeing,true,'the character flees with its unit');
 G.finishDeclarations(r);const out=G.resolveCharge(r,'I1',[6,6]);assert.equal(out.runDown,true);assert.equal(G.getUnit(r,'A6').destroyed,true,'run down with its unit');
});
test('in combat the character fights as itself: it is engaged with its unit\'s enemies and may be attacked by those in contact with it',()=>{
 const s=joined();G.begin(s,()=>0,{firstPlayer:'ash'});clearExcept(s,['A1','A6','I1']);const a=G.getUnit(s,'A1'),w=G.getUnit(s,'A6'),e=G.getUnit(s,'I1');Object.assign(a,{x:30,y:30,heading:0});G.syncJoined(s);
 Object.assign(e,{x:30,y:30-G.size(a).h/2-G.size(e).h/2,heading:180});a.engaged=['I1'];e.engaged=['A1'];G.syncJoined(s);assert.deepEqual(w.engaged,['I1']);assert.ok(e.engaged.includes('A6'));
 Object.assign(s,{stage:'combat',team:'ash'});G.beginCombat(s,'A1');assert.ok(s.combatSession.units.includes('A6'));assert.equal(s.combatSession.initiative.A6,G.profile(w).I);
 e.combatFocus='A6';const focus=G.attackAllocation(s,e,0);assert.ok((focus.get('A6')??[]).length>=1,'models in contact with the character attack it');
 while(s.combatSession.phase==='attacks')G.fightCombatStep(s,()=>.5);G.compareCombat(s);assert.ok(!(s.pendingCombat?.losers??[]).includes('A6'),'it takes no Break test of its own');
});
test('joining and leaving in Remaining Moves',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'ash'});clearExcept(s,['A1','A6']);const a=G.getUnit(s,'A1'),w=G.getUnit(s,'A6');Object.assign(a,{x:30,y:30,heading:0});Object.assign(w,{x:30,y:30+G.size(a).h/2+6+G.size(w).h/2,heading:0});
 Object.assign(s,{stage:'movement',movementStep:'remaining'});assert.match(G.joinError(s,'A6','A1'),/beyond/);w.y=30+G.size(a).h/2+1.5+G.size(w).h/2;assert.equal(G.joinError(s,'A6','A1'),null);
 G.joinUnit(s,'A6','A1');assert.equal(a.moved,true,'a unit joined in Remaining Moves cannot move');assert.equal(w.joined,'A1');
 s.stage='combat';G.nextTurn(s,()=>0);s.stage='combat';G.nextTurn(s,()=>0);Object.assign(s,{stage:'movement',movementStep:'remaining'});const spot=G.leaveSpot(s,'A6');assert.ok(spot);
 const h=G.size(a).h;G.leaveUnit(s,'A6',spot);assert.equal(w.joined,null);assert.ok(G.size(a).h<h,'the block closes up');assert.equal(G.checkPosition(s,w,w.x,w.y),null);
 Object.assign(w,{moved:false,spent:0});G.joinUnit(s,'A6','A1');assert.throws(()=>G.leaveUnit(s,'A6',spot),/cannot move/,'a unit that cannot move keeps its character');
});
test('a unit wiped out leaves its character standing alone; Unit Strength for objectives counts the character',()=>{
 const s=joined();G.begin(s,()=>0,{firstPlayer:'iron'});clearExcept(s,['A1','A6','I4']);const a=G.getUnit(s,'A1'),w=G.getUnit(s,'A6');Object.assign(a,{x:30,y:24,heading:0});G.syncJoined(s);
 assert.equal(G.unitStrengthWith(s,a),21);a.deadModels=Array.from({length:16},(_,i)=>i+4);assert.equal(G.unitStrength(a),4);assert.equal(BM.canControl(a),false);assert.equal(BM.canControl(a,s),true,'4 warriors and the Daemonsmith: Unit Strength 5');
 const e=G.getUnit(s,'I1');Object.assign(e,{x:30,y:24-G.size(a).h/2-G.size(e).h/2,heading:180});a.engaged=['I1'];e.engaged=['A1'];G.syncJoined(s);Object.assign(s,{stage:'combat',team:'iron'});G.beginCombat(s,'I1');a.deadModels=Array.from({length:20},(_,i)=>i);s.combatSession.phase='compare';G.compareCombat(s);assert.equal(a.destroyed,true);assert.equal(w.joined,null);assert.ok(w.x!==null&&!w.destroyed,'the character stands on');assert.ok(G.combatants(s).some(p=>p.id==='A6'));
});
