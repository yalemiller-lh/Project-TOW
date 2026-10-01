import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

const sequence=(...values)=>{let i=0;return ()=>values[Math.min(i++,values.length-1)];};
function battle(){const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0);return s;}
function prepare(s,key,phase='strategy',caster='A6'){s.stage=phase;s.team=caster[0]==='A'?'ash':'iron';const u=G.getUnit(s,caster);u.spells=[key,'shield'];u.castThisTurn=[];return u;}

{
 const s=battle(),ash=prepare(s,'shield'),iron=G.getUnit(s,'I7');ash.x=8;ash.y=40;iron.x=64;iron.y=8;
 const first=G.castSpell(s,ash.id,'shield',ash.id,()=>.8,{dispel:'fated'});assert.equal(first.dispel.kind,'fated');assert.equal(s.fatedDispelUsed.iron,true,'Blue used its own Fated Dispel');assert.equal(s.fatedDispelUsed.ash,false);
 ash.spells=['shield','arrow'];const target=G.getUnit(s,'I1');target.x=8;target.y=24;
 assert.throws(()=>G.castSpell(s,ash.id,'arrow',target.id,()=>.8,{dispel:'fated'}),/already used this turn/);
 s.stage='combat';G.nextTurn(s);assert.deepEqual(s.fatedDispelUsed,{ash:false,iron:false});
 iron.spells=['shield'];iron.castThisTurn=[];const next=G.castSpell(s,iron.id,'shield',iron.id,()=>.8,{dispel:'fated'});assert.equal(next.dispel.kind,'fated');assert.equal(s.fatedDispelUsed.ash,true);
}

{
 const s=battle(),a=G.getUnit(s,'A6'),b=G.getUnit(s,'I7');assert.equal(a.level,2);assert.equal(b.level,2);assert.equal(a.wounds,2);assert.equal(b.wounds,2);assert.deepEqual(a.spells,['fireball','arrow']);assert.equal(G.size(a).w,25/25.4);assert.equal(G.modelSquares(s,a).length,1);assert.equal(G.profile(a).T,4);assert.equal(G.profile(b).Ld,7);
}
{
 const s=battle();prepare(s,'arrow');G.getUnit(s,'I1').x=8;G.getUnit(s,'I1').y=24;const out=G.castSpell(s,'A6','arrow','I1',()=>.8);assert.equal(out.cast,true);assert.equal(G.hasRule(G.getUnit(s,'I1'),'arrowAttraction'),true);assert.equal(G.canCast(s,'A6','arrow','I1'),false);s.stage='combat';G.nextTurn(s);assert.equal(G.hasRule(G.getUnit(s,'I1'),'arrowAttraction'),true);s.stage='combat';G.nextTurn(s);assert.equal(G.hasRule(G.getUnit(s,'I1'),'arrowAttraction'),false);
}
{
 const s=battle();prepare(s,'shield');const out=G.castSpell(s,'A6','shield','A6',()=>.8);assert.equal(out.cast,true);assert.equal(G.hasRule(G.getUnit(s,'A6'),'ward'),true);s.stage='combat';G.nextTurn(s);assert.equal(G.hasRule(G.getUnit(s,'A6'),'ward'),true);s.stage='combat';G.nextTurn(s);assert.equal(G.hasRule(G.getUnit(s,'A6'),'ward'),false);
}
{
 const s=battle(),u=prepare(s,'urgency','movement'),t=G.getUnit(s,'A1');s.movementStep='remaining';t.moved=true;t.x=6;t.y=35;const out=G.castSpell(s,u.id,'urgency',t.id,()=>.8);assert.equal(out.cast,true);assert.equal(G.canAct(s,t),true);
}
{
 const s=battle(),u=prepare(s,'fireball','shooting'),t=G.getUnit(s,'I1');t.x=4;t.y=24;const out=G.castSpell(s,u.id,'fireball',t.id,sequence(.9,.9,.9,.9,.9,.9,0));assert.equal(out.cast,true);assert.ok(out.effect.hits>=2);assert.ok(out.effect.unsaved>=0);
}
{
 const s=battle(),u=prepare(s,'pillar','shooting');const out=G.castSpell(s,u.id,'pillar',u.id,()=>.8,{point:{x:u.x,y:u.y-5}});assert.equal(out.cast,true);assert.equal(s.vortices.length,1);assert.equal(s.vortices[0].radius,1.5);const drift=G.driftVortices(s,()=>.5);assert.equal(drift.length,1);assert.equal(drift[0].distance,4);assert.throws(()=>G.dispelVortex(s,u.id,()=>.99,'fated'),/Strategy/);Object.assign(s,{stage:'strategy',team:u.team==='ash'?'iron':'ash'});assert.equal(G.dispelVortex(s,u.id,()=>.99,'fated').success,true);assert.equal(s.vortices.length,0);
}
{
 const s=battle(),u=prepare(s,'coward'),t=G.getUnit(s,'I1');t.x=4;t.y=30;const out=G.castSpell(s,u.id,'coward',t.id,sequence(.8,.8,.99));assert.equal(out.cast,true);assert.equal(out.effect.passed,false);assert.equal(t.fleeing||t.destroyed,true);
}
{
 const s=battle(),u=prepare(s,'hammerhand','combat'),t=G.getUnit(s,'I1');u.x=20;u.y=20;t.x=20;t.y=18;u.engaged=t.id;t.engaged=u.id;G.beginCombat(s,u.id);while(s.combatSession.initiative[u.id]!==s.combatSession.groups[s.combatSession.step])G.fightCombatStep(s,()=>0);const out=G.castSpell(s,u.id,'hammerhand',t.id,()=>.9);assert.equal(out.cast,true);assert.ok(out.effect.hits>=2);
}
{
 const s=battle(),u=prepare(s,'shield');const out=G.castSpell(s,u.id,'shield',u.id,sequence(0,0,.99));assert.equal(out.cast,false);assert.equal(out.miscast.kind,'Sorcerer’s Curse');assert.equal(u.wounds,1);assert.equal(G.profile(u).T,5);
}
{
 const s=battle(),u=prepare(s,'shield','strategy','I7'),enemy=G.getUnit(s,'A6');enemy.x=70;enemy.y=24;const out=G.castSpell(s,u.id,'shield',u.id,sequence(.8,.8,.99),{dispel:'wizard'});assert.equal(out.dispel.kind,'wizard');assert.equal(out.dispel.success,true);assert.equal(out.cast,false);
}
{
 const s=battle(),u=G.getUnit(s,'A6');assert.deepEqual(G.exchangeSignature(s,u.id,'fireball','ashStorm'),['ashStorm','arrow']);assert.throws(()=>G.exchangeSignature(s,u.id,'arrow','hammerhand'));const out=G.castSpell(s,u.id,'ashStorm',u.id,()=>.9);assert.equal(out.cast,true);assert.equal(G.hasRule(u,'stormOfAsh'),true);
}
{
 const s=battle(),u=prepare(s,'hashutCurse','shooting'),t=G.getUnit(s,'I7');u.x=70;u.y=30;t.x=70;t.y=12;const out=G.castSpell(s,u.id,'hashutCurse',t.id,()=>.9);assert.equal(out.cast,true);assert.ok(out.effect.hits>=1);
}
{
 const s=battle(),u=prepare(s,'hashutFlames','combat'),t=G.getUnit(s,'I1');u.x=20;u.y=20;t.x=20;t.y=18;u.engaged=t.id;t.engaged=u.id;G.beginCombat(s,u.id);while(s.combatSession.initiative[u.id]!==s.combatSession.groups[s.combatSession.step])G.fightCombatStep(s,()=>0);const out=G.castSpell(s,u.id,'hashutFlames',t.id,()=>.9);assert.equal(out.cast,true);assert.ok(out.effect.hits>=2);
}
{
 const s=battle(),u=prepare(s,'fireball','shooting'),t=G.getUnit(s,'I1');t.x=4;t.y=24;u.movementMode='march';assert.equal(G.canCast(s,u.id,'fireball',t.id),false);u.movementMode=null;assert.equal(G.canCast(s,u.id,'fireball',t.id),true);u.fleeing=true;assert.equal(G.canCast(s,u.id,'fireball',t.id),false);
}
{
 const s=battle();assert.equal(G.canEngineerReroll(s),true);const first=G.rollRocketDice(()=>.99),next=G.engineerReroll(s,first,'artillery',()=>0);assert.equal(next.artillery,2);assert.equal(G.canEngineerReroll(s),false);assert.throws(()=>G.engineerReroll(s,first,'scatter',()=>0));
}
{
 const s=battle(),u=prepare(s,'pillar','shooting');u.x=20;u.y=40;G.castSpell(s,u.id,'pillar',u.id,()=>.9,{point:{x:20,y:30}});const target=G.getUnit(s,'I1');target.x=20;target.y=30;s.stage='movement';s.team='iron';s.movementStep='remaining';assert.match(G.orderError(s,target,{kind:'advance',mode:'advance',distance:4,angle:0}),/allowance/);
}
console.log('PASS Battle Magic, wizard profiles, dispels, miscasts, and spell effects');
