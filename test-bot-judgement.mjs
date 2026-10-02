import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
import * as AI from './dist/ai.mjs';

// The bot weighs its choices by playing them out with the real rules (see "Judging a choice" in
// ai.mjs). Each case below is a choice the earlier bot got wrong.
const test=(name,fn)=>{fn();console.log('PASS '+name);};
const clearExcept=(s,keep)=>{for(const p of G.combatants(s))if(!keep.includes(p.id)){p.x=null;p.y=null;}};
function battle(){const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'iron'});for(const u of s.units)u.charge=null;return s;}
const declareStep=s=>Object.assign(s,{stage:'movement',movementStep:'declare',team:'iron'});

test('the bot does not charge into a fight it would lose, and does charge one it would win',()=>{
 const s=declareStep(battle());clearExcept(s,['A1','I1']);const t=G.getUnit(s,'A1'),u=G.getUnit(s,'I1');Object.assign(u,{x:35,y:20,heading:180});Object.assign(t,{x:35,y:28,heading:0});
 assert.equal(G.chargePlan(s,u,t).error,undefined);AI.takeStep(s,()=>.5);assert.equal(u.charge,null,'State Troops do not charge a full block of Chaos Dwarf Warriors');
 const w=declareStep(battle());clearExcept(w,['A1','I1']);const a=G.getUnit(w,'A1'),b=G.getUnit(w,'I1');Object.assign(b,{x:35,y:20,heading:180});Object.assign(a,{x:35,y:28,heading:0});a.deadModels=G.modelSquares(w,a).map(m=>m.index).slice(4);
 AI.takeStep(w,()=>.5);assert.equal(b.charge?.target,'A1','four Chaos Dwarfs left: worth charging');
});
test('playing a fight out favours the stronger side, and a broken unit counts as lost',()=>{
 const s=battle();clearExcept(s,['A1','I1']);const a=G.getUnit(s,'A1'),b=G.getUnit(s,'I1');Object.assign(b,{x:35,y:20,heading:180});Object.assign(a,{x:35,y:28,heading:0});Object.assign(s,{stage:'movement',movementStep:'declare',team:'ash'});
 const plan=G.chargePlan(s,a,b),fight=AI.playFight(s,[{u:a,t:b,plan}],'A1','ash');assert.ok(fight.value<-15,`Chaos Dwarfs charging State Troops is bad for the bot (${fight.value.toFixed(0)})`);assert.ok(fight.win<.5);
});
test('the bot\'s wizard keeps out of enemy charge reach',()=>{
 const s=battle();clearExcept(s,['A1','I7','I1']);Object.assign(s,{stage:'movement',movementStep:'remaining',team:'iron'});const w=G.getUnit(s,'I7'),a=G.getUnit(s,'A1'),i1=G.getUnit(s,'I1');
 Object.assign(i1,{x:30,y:10,heading:180});Object.assign(w,{x:30,y:16,heading:180,moved:false,spent:0,movementMode:null});Object.assign(a,{x:30,y:32,heading:0});
 for(let k=0;k<6&&G.canAct(s,w);k++)AI.takeStep(s,()=>.5);
 assert.ok(G.gap(a,w)>G.profile(a).M+6||G.gap(a,w)>=G.gap({...a},{...w,y:16}),`the Master Mage ends ${G.gap(a,w).toFixed(1)}″ from the Chaos Dwarfs`);
});
test('the bot lets a harmless spell through rather than spend its Fated Dispel',()=>{
 const s=battle();Object.assign(s,{stage:'strategy',team:'ash'});clearExcept(s,['A6','I1']);const w=G.getUnit(s,'A6');Object.assign(w,{spells:['vessel'],castThisTurn:[]});
 G.attemptSpell(s,'A6','vessel',undefined,()=>.6);assert.ok(s.pendingSpell,'waiting for the bot');AI.takeStep(s,()=>.5);assert.equal(s.fatedDispelUsed.iron,false,'Daemonic Vessel on a wizard far from any fight is not worth the Fated Dispel');
});
test('the bot dispels an enemy vortex beside its units in its Strategy phase',()=>{
 const s=battle();Object.assign(s,{stage:'strategy',team:'iron'});clearExcept(s,['A6','I1','I7']);const t=G.getUnit(s,'I1');Object.assign(t,{x:30,y:20,heading:180});Object.assign(G.getUnit(s,'I7'),{x:30,y:12,heading:180});Object.assign(G.getUnit(s,'A6'),{x:30,y:44});
 G.getUnit(s,'I7').spells=[];s.vortices=[{id:'V1',spell:'vortexChaos',caster:'A6',team:'ash',x:30,y:20+G.size(t).h/2+2,radius:1.5}];
 const out=AI.takeStep(s,()=>.99);assert.match(out.message,/dispel Vortex of Chaos/);
});
test('missile troops do not charge a stronger enemy as the lesser evil: they shoot or Stand & Shoot instead',()=>{
 const s=declareStep(battle());clearExcept(s,['A1','I4']);const t=G.getUnit(s,'A1'),u=G.getUnit(s,'I4');Object.assign(u,{x:35,y:20,heading:180});Object.assign(t,{x:35,y:28,heading:0});
 AI.takeStep(s,()=>.5);assert.equal(u.charge,null);
});
