import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

function duel(opponent='empire'){
 const s=G.createGame(opponent);G.autoDeploy(s);s.rocket.wounds=0;G.begin(s);G.nextPhase(s);
 for(const u of s.units)if(!['A4','I4'].includes(u.id)){u.x=null;u.y=null;}
 Object.assign(G.getUnit(s,'A4'),{x:35,y:25});Object.assign(G.getUnit(s,'I4'),{x:35,y:15});return s;
}

for(const [faction,name,range] of [['empire','State Missile Troops',30],['orc','Orc Mob · Warbows',24],['chaos','Blunderbuss Decimators',12]]){
 const s=duel(faction),u=G.getUnit(s,'I4');assert.equal(u.name,name);assert.equal(G.missileWeapon(u).range,range);assert.equal(G.modelSquares(s,u).length,20);
}
{
 const s=duel();G.nextPhase(s);const a=G.getUnit(s,'A4'),t=G.getUnit(s,'I4');let p=G.shootingPlan(s,a,t);
 assert.equal(p.range,12);assert.equal(p.half,6);assert.equal(p.band,'far');assert.equal(p.toHit,4);assert.equal(p.shooters,14);assert.ok(p.modifiers.some(m=>m.label==='Long range'&&m.value===0));
 t.x=55;assert.match(G.shootingPlan(s,a,t).error,/front arc/);t.x=35;t.y=5;assert.match(G.shootingPlan(s,a,t).error,/range/);
 t.y=15;const r=G.shoot(s,'A4','I4',()=>.99);assert.equal(r.shots,42);assert.equal(r.unsaved,20);assert.equal(G.aliveCount(t),0);assert.equal(a.shot,true);assert.throws(()=>G.shoot(s,'A4','I4'),/cannot|Choose/);
}
{
 const s=duel();G.nextPhase(s);assert.equal(s.stage,'shooting');assert.deepEqual(G.availableShots(s).map(u=>u.id),['A4']);
 const blocked=duel();G.getUnit(blocked,'A4').movementMode='march';G.nextPhase(blocked);assert.equal(blocked.stage,'combat');
}
{
 const s=duel('empire');G.nextPhase(s);s.team='iron';const u=G.getUnit(s,'I4'),t=G.getUnit(s,'A4');let p=G.shootingPlan(s,u,t);assert.equal(p.half,15);assert.equal(p.toHit,4);u.spent=2;p=G.shootingPlan(s,u,t);assert.equal(p.toHit,5);assert.ok(p.modifiers.some(m=>m.label==='Moved'&&m.value===-1));u.movementMode='march';assert.match(G.shootingPlan(s,u,t).error,/cannot shoot/);
 assert.equal(G.canShoot(s,u),false);assert.throws(()=>G.shoot(s,u.id,t.id),/cannot shoot/);
 u.movementMode='advance';u.fleeing=true;assert.equal(G.canShoot(s,u),false);assert.throws(()=>G.shoot(s,u.id,t.id),/cannot shoot/);
}
{
 const s=duel('empire');s.movementStep='declare';const c=G.getUnit(s,'A4'),d=G.getUnit(s,'I4');c.y=22;const plan=G.chargePlan(s,c,d);assert.equal(plan.error,undefined);assert.equal(G.canStandShoot(s,d,c),true);const declared=G.declareCharge(s,'A4','I4');assert.equal(declared.reaction,'pending');const r=G.chargeReaction(s,'A4','stand-shoot',()=>0);assert.equal(r.report.toHit,5);assert.equal(r.report.band,'Stand & Shoot');assert.equal(c.charge.reaction,'stand-shoot');G.finishDeclarations(s);assert.equal(s.movementStep,'charges');
}
{
 const s=duel();const c=G.getUnit(s,'A4'),d=G.getUnit(s,'I4');c.y=22;d.heading=0;assert.equal(G.canStandShoot(s,d,c),false);c.y=18;d.heading=180;assert.equal(G.canStandShoot(s,d,c),false);
}
{
 const s=duel();s.movementStep='declare';const charger=G.getUnit(s,'A4'),defender=G.getUnit(s,'I4');charger.y=22;
 // Having marched in its own turn does not stop a unit Standing & Shooting; fleeing does.
 defender.movementMode='march';assert.equal(G.canStandShoot(s,defender,charger),true);
 G.declareCharge(s,charger.id,defender.id);
 defender.fleeing=true;assert.equal(G.canStandShoot(s,defender,charger),false);assert.match(G.shootingPlan(s,defender,charger,{reaction:true}).error,/fleeing/);
 assert.throws(()=>G.chargeReaction(s,charger.id,'stand-shoot'),/cannot Stand & Shoot/);
}
{
 // Quick Shot: Stand & Shoot however close the charger is, still at −1 To Hit (crossbow BS3: 5+).
 // Cumbersome: never. Neither is a rule of the weapons here, so both are switched on for the test.
 const s=duel('empire');s.movementStep='declare';const c=G.getUnit(s,'A4'),d=G.getUnit(s,'I4'),w=G.missileWeapon(d);c.y=20.5;
 assert.match(G.shootingPlan(s,d,c,{reaction:true}).error,/too close/);assert.ok(G.standShootTooClose(s,d,[c]));
 w.quickShot=true;try{assert.equal(G.canStandShoot(s,d,c),true);assert.equal(G.standShootTooClose(s,d,[c]),null);assert.equal(G.shootingPlan(s,d,c,{reaction:true}).toHit,5);}finally{delete w.quickShot;}
 c.y=22;w.cumbersome=true;try{assert.equal(G.canStandShoot(s,d,c),false);assert.match(G.shootingPlan(s,d,c,{reaction:true}).error,/Cumbersome/);}finally{delete w.cumbersome;}
 assert.equal(G.canStandShoot(s,d,c),true);
}
{
 const s=duel('chaos');s.movementStep='declare';G.getUnit(s,'A4').y=22;G.declareCharge(s,'A4','I4');let i=0;const r=G.chargeReaction(s,'A4','stand-shoot',()=>i++<98?.99:0);assert.equal(r.report.toHit,4);assert.equal(r.report.shots,42);assert.equal(r.stopped,true);assert.equal(G.getUnit(s,'A4').charge.status,'stopped');G.finishDeclarations(s);assert.equal(s.movementStep,'remaining');
}
{
 const s=duel();G.nextPhase(s);const t=G.getUnit(s,'I4');assert.deepEqual(G.availableShots(s).map(u=>u.id),['A4']);t.engaged='A1';
 assert.match(G.shootingPlan(s,G.getUnit(s,'A4'),t).error,/in combat/);assert.throws(()=>G.shoot(s,'A4','I4'),/in combat/);assert.deepEqual(G.availableShots(s).map(u=>u.id),[]);
 const caster=G.getUnit(s,'A6'),wizard=G.getUnit(s,'I7');Object.assign(caster,{x:50,y:30,spells:['hashutCurse']});Object.assign(wizard,{x:50,y:20});
 assert.equal(G.spellTargets(s,'A6','hashutCurse').includes(wizard),true);wizard.engaged='A2';assert.equal(G.spellTargets(s,'A6','hashutCurse').includes(wizard),true,'Curse of Hashut may target an engaged character');
 caster.spells=['fireball'];assert.equal(G.spellTargets(s,'A6','fireball').includes(wizard),false,'Fireball cannot target a unit in combat');
}
console.log('PASS missile units, arc/range, modifiers, casualties, Stand & Shoot, and no shots into combat');
