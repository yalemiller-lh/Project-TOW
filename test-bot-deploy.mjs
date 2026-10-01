import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
import * as AI from './dist/ai.mjs';
import * as F from './dist/formats.mjs';
import './dist/battlemarch.mjs';

const test=(name,fn)=>{fn();console.log('PASS '+name);};
function redDeployed(opponent,xs=[18,36,54,64]){const s=G.createGame(opponent);for(const [i,u]of s.units.filter(u=>u.team==='ash').entries())G.place(s,u.id,u.role==='wizard'?3.5:xs[i],42);G.placeRocket(s,8,42);return s;}
const bot=s=>[...s.units.filter(u=>u.team==='iron'),...s.cannons];

test('Quick deploy can place one army, and the bot waits until the player has finished',()=>{
 const s=G.createGame('empire');G.autoDeploy(s,{team:'ash'});assert.ok(s.units.filter(u=>u.team==='ash').every(u=>u.x!==null));assert.ok(bot(s).every(u=>u.x===null));
 assert.equal(AI.readyToDeploy(s),true);AI.deployOpponent(s);assert.equal(AI.readyToDeploy(s),false);G.begin(s);assert.equal(s.stage,'strategy');
 const early=G.createGame('orc');G.place(early,'A1',18,42);assert.equal(AI.readyToDeploy(early),false);
});
for(const xs of [[18,36,54,64],[14,24,34,62],[40,50,60,68]])test(`Orc Mobs line up opposite the red regiments ${xs.join('/')}, the Decimators first`,()=>{
 const s=redDeployed('orc',xs);AI.deployOpponent(s);const mobs=['I1','I2','I3'].map(id=>G.getUnit(s,id)),red=s.units.filter(u=>u.team==='ash'&&u.role!=='wizard');
 const faced=mobs.map(m=>red.find(r=>Math.abs(r.x-m.x)<1.01)?.id);assert.ok(faced.every(Boolean),JSON.stringify(faced));assert.equal(new Set(faced).size,3);assert.ok(faced.includes('A4'));
 for(const u of bot(s)){assert.ok(u.y+G.size(u).h/2<=12+1e-9&&u.y+G.size(u).h/2>11,u.id+' on the front edge');}
});
for(const xs of [[18,36,54,64],[14,24,34,62],[40,50,60,68]])test(`the Empire gun line keeps clear shots against red ${xs.join('/')}`,()=>{
 const s=redDeployed('empire',xs);AI.deployOpponent(s);const red=s.units.filter(u=>u.team==='ash'&&u.role!=='wizard');
 for(const c of s.cannons){const clear=red.filter(t=>!G.cannonPlan(s,c.id,t,{mode:'ball',aimShort:6}).error);assert.ok(clear.length>=3,`${c.id} has ${clear.length} clear targets`);}
 const mage=G.getUnit(s,'I7'),line=s.units.filter(u=>u.team==='iron'&&u.role!=='wizard');assert.ok(line.every(u=>mage.y<u.y),'Battlemage stands behind the line');
 for(const u of bot(s))assert.equal(u.role==='warmachine'?null:G.checkPosition(s,u,u.x,u.y,true),null,u.id+' legal');
});
test('with nothing to react to, the bot still deploys a legal spread',()=>{
 const s=G.createGame('empire');AI.deployOpponent(s);assert.ok(bot(s).every(u=>u.x!==null));
});
test('on every Battle March map the bot deploys legally, mostly facing the enemy, cannons behind its line',()=>{
 const rng=seed=>()=>{seed=seed*16807%2147483647;return seed/2147483647;};
 let facing=0,regs=0;
 for(const m of F.DEPLOYMENT_MAPS.filter(m=>m.official))for(const mirrored of [false,true]){
  const r=rng(5),s=G.createGame('empire',{format:'battle-march',points:500,deployment:{map:m.id,mirrored},objectives:'troves2',random:r}),d=s.deployOrder;
  if(AI.deploymentChoice(s)==='zone')AI.takeDeploymentStep(s,r);else G.chooseDeploymentZone(s,G.deploymentZoneChooser(s),'A');G.deploymentRollOff(s,r);
  for(let g=0;g<40&&!d.complete;g++){if(AI.deploymentChoice(s)==='deploy')AI.takeDeploymentStep(s,r);else G.autoDeploy(s,{team:d.next,random:r});}
  assert.equal(d.complete,true,m.id);for(const p of G.combatants(s))assert.ok(p.x!==null&&G.inZone(s,p.team,G.corners(p)),`${m.id}: ${p.id} in its zone`);
  const bot=s.units.filter(u=>u.team==='iron'&&!G.isCharacter(u)),red=s.units.filter(u=>u.team==='ash'&&!G.isCharacter(u));
  for(const u of bot){regs++;if(red.some(t=>G.inVisionArc(u,t)))facing++;}
  const a=G.deploymentFacing(s,'iron')*Math.PI/180,depth=p=>p.x*Math.sin(a)-p.y*Math.cos(a);
  for(const c of s.cannons)assert.ok(bot.every(u=>depth(c)<=depth(u)+1e-6),`${m.id}${mirrored?' mirrored':''}: ${c.id} behind the line`);
 }
 assert.ok(facing>=.8*regs,`${facing} of ${regs} bot regiments start with an enemy in their front arc`);
});
