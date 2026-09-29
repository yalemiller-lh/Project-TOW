import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
const test=(name,run)=>{run();console.log('PASS '+name);};
test('opponent selection gives Orc and State Troop profiles and true base footprints',()=>{
 const s=G.createGame('empire'),d=G.getUnit(s,'A1'),e=G.getUnit(s,'I1');
 assert.equal(e.name,'State Troops');assert.equal(G.profile(e).M,4);assert.equal(G.profile(e).T,3);assert.equal(G.size(e).w,125/25.4);
 G.setOpponent(s,'orc');const o=G.getUnit(s,'I1');assert.equal(o.name,'Orc Mob');assert.equal(G.profile(o).Ld,6);assert.equal(G.size(o).w,150/25.4);assert.equal(G.size(o).h,120/25.4);assert.equal(G.size(d).w,125/25.4);
 G.autoDeploy(s);G.begin(s);assert.throws(()=>G.setOpponent(s,'empire'),/before battle/);
});
test('each opponent moves at its own M and the Orc wheel uses 30 mm bases',()=>{
 const e=G.getUnit(G.createGame('empire'),'I1'),o=G.getUnit(G.createGame('orc'),'I1'),d=G.getUnit(G.createGame(),'A1');
 assert.equal(G.planMove(e,{distance:4,mode:'advance'}).allowance,4);assert.equal(G.planMove(o,{distance:8,mode:'march'}).allowance,8);assert.equal(G.planMove(d,{distance:3,mode:'advance'}).allowance,3);
 assert.ok(G.wheelCost(20,o)>G.wheelCost(20,d));
});
test('mixed Weapon Skill, Toughness, Parry and Choppa saves use the correct targets',()=>{
 const s=G.createGame('orc'),d=G.getUnit(s,'A1'),o=G.getUnit(s,'I1');
 assert.equal(G.hitTarget(d,o),3);assert.equal(G.hitTarget(o,d),4);assert.equal(G.woundTarget(d,o),5);assert.equal(G.saveTarget(o,d),6);
 o.charge={status:'success',distance:4,face:'front'};assert.equal(G.saveTarget(d,o),4);
 const e=G.getUnit(G.createGame('empire'),'I1');assert.equal(G.woundTarget(d,e),4);assert.equal(G.saveTarget(e,d),4);
});
test('Orcs get Furious Charge attacks, Choppas wound rerolls and Warband Leadership',()=>{
 const s=G.createGame('orc');G.autoDeploy(s);G.begin(s);const d=G.getUnit(s,'A1'),o=G.getUnit(s,'I1');d.x=o.x=18;d.y=22;o.y=d.y-(G.size(d).h+G.size(o).h)/2;d.engaged=o.id;o.engaged=d.id;o.charge={status:'success',distance:4,face:'front'};s.stage='combat';
 assert.equal(G.leadership(o),9);assert.equal(G.leadership(o,'restraint'),7);
 const r=G.resolveCombat(s,'I1',()=>0);const orcStage=r.stages.find(v=>v.from==='I1');assert.equal(orcStage.attacks,11);assert.equal(orcStage.toHit,4);assert.equal(orcStage.toWound,5);
});
test('an Orc Mob with an available charge must take its Impetuous test',()=>{
 const s=G.createGame('orc');G.autoDeploy(s);G.begin(s);s.team='iron';s.stage='movement';s.movementStep='declare';const o=G.getUnit(s,'I1'),d=G.getUnit(s,'A1');o.x=d.x=18;o.y=19;d.y=27;
 assert.equal(G.availableCharges(s,o).length,1);assert.throws(()=>G.finishDeclarations(s),/Impetuous/);assert.throws(()=>G.declareCharge(s,'I1','A1'),/Impetuous/);
 assert.equal(G.impetuousTest(s,'I1',[6,6]),false);assert.throws(()=>G.finishDeclarations(s),/must declare/);G.declareCharge(s,'I1','A1');G.finishDeclarations(s);assert.equal(s.movementStep,'charges');
});
