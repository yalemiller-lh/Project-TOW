import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
import * as AI from './dist/ai.mjs';
import * as BM from './dist/battlemarch.mjs';

// Plays whole seeded games (the bot as the opponent, a random but legal player as Red) and checks
// after every step that no two units overlap unless they are fighting each other, that the bot
// always has something to do in its own turn (or is waiting on a real player decision), and that
// the game never stalls. SEEDS=n plays more games.
function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const pick=(r,list)=>list[Math.floor(r()*list.length)];
function overlaps(s){
 const pieces=G.combatants(s).filter(u=>u.x!==null&&G.aliveCount(u)>0),bad=[],p=s.pendingCombat;
 for(let i=0;i<pieces.length;i++)for(let j=i+1;j<pieces.length;j++){const a=pieces[i],b=pieces[j];if(G.engagedWith(a,b))continue;
  // Friends may end up shoulder to shoulder (after fighting side by side), never on top of each other.
  if(a.team===b.team){if(G.overlaps(a,b))bad.push(`${a.id}/${b.id} overlap`);continue;}
  // The pair whose combat aftermath is being resolved is briefly apart from its engagement.
  if(p&&[p.winner,p.loser].includes(a.id)&&[p.winner,p.loser].includes(b.id))continue;
  const g=G.gap(a,b);if(g<.001)bad.push(`${a.id}/${b.id} gap ${g.toFixed(3)}`);}
 return bad;
}
const fingerprint=s=>JSON.stringify([s.stage,s.team,s.round,s.movementStep,s.pendingCombat,s.combatSession,s.pendingSpell?.key,G.combatants(s).map(u=>[u.x,u.y,u.heading,u.moved,u.shot,u.engaged,u.charge?.status,u.charge?.reaction,u.fleeing,u.deadModels?.length,u.wounds,u.combatResolved,u.castThisTurn?.length,u.marchTest,u.impetuousTest])]);
function redStep(s,r){
 const d=AI.humanDecision(s);
 if(d?.kind==='reaction'){const c=s.units.find(u=>u.team==='iron'&&u.charge?.reaction==='pending'),def=G.getUnit(s,c.charge.target),close=!!G.standShootTooClose(s,def,s.units.filter(v=>v.charge?.status==='declared'&&v.charge.target===def.id));G.chargeReaction(s,c.id,def.fleeing?'flee':!close&&G.canStandShoot(s,def,c)&&r()<.5?'stand-shoot':r()<.25&&!G.hasRule(def,'frenzy')?'flee':'hold',r);return 'reaction';}
 if(d?.kind==='reform'){const u=G.getUnit(s,d.id),to=Math.round(r()*8)*45;if(r()<.5&&!G.reformError(s,d.id,to))G.reformUnit(s,d.id,to,r);else G.declineReform(s,d.id);return 'reform';}
 if(d?.kind==='shieldwall'){G.chooseLoserAction(s,r()<.5?'shieldwall':'fall-back');return 'shieldwall';}
 if(d?.kind==='declare'){const p=s.pendingCombat,targets=G.pursuitTargets(s,p.winner);G.declarePursuit(s,p.winner,pick(r,['follow','restrain','follow-reform']),pick(r,targets).id,r);return 'declare';}
 if(d?.kind==='aftermath'){G.winnerCombat(s,pick(r,['follow','restrain','follow-reform']),r);return 'aftermath';}
 if(d?.kind==='dispel'){const o=G.dispelOptions(s);G.resolveDispel(s,pick(r,['none',...(o.fated?['fated']:[]),...o.wizards.map(w=>w.id)]),r);return 'dispel';}
 // Red's wizard at its Initiative step in a combat: cast an Assailment now and then, or fight on.
 if(d?.kind==='assailment'){const w=G.getUnit(s,d.id),key=w.spells.find(k=>G.SPELLS[k]?.type==='assailment'&&!G.castBlockReason(s,w.id,k)&&G.spellTargets(s,w.id,k).length);if(key&&r()<.6){G.attemptSpell(s,w.id,key,pick(r,G.spellTargets(s,w.id,key)).id,r);return 'assailment';}G.passAssailment(s,w.id);return 'fight on';}
 if(s.pendingCombat){G.finishCombat(s,pick(r,['follow','restrain']),r);return 'finish';}
 const red=s.units.filter(u=>u.team==='ash'&&u.x!==null&&G.aliveCount(u)>0);
 // Red casts now and then, so the bot's dispels are exercised too.
 for(const w of red.filter(u=>u.role==='wizard'))for(const key of w.spells){const t=G.spellTargets(s,w.id,key).filter(t=>G.canCast(s,w.id,key,t.id));if(t.length&&r()<.5){let point=null;if(G.SPELLS[key].template){for(let k=0;k<40&&!point;k++){const p={x:w.x+(r()-.5)*2*G.SPELLS[key].range,y:w.y+(r()-.5)*2*G.SPELLS[key].range};if(!G.templatePlacementError(s,w.id,key,p))point=p;}if(!point)continue;}G.attemptSpell(s,w.id,key,pick(r,t).id,r,{point});return 'cast';}}
 if(s.stage==='strategy'){const f=red.find(u=>u.fleeing&&!u.rallyAttempted);if(f){G.rally(s,f.id,r);return 'rally';}}
 if(s.stage==='movement'&&s.movementStep==='declare'){for(const u of red.filter(u=>G.canAct(s,u)&&!u.charge)){const t=G.availableCharges(s,u);if(t.length&&(G.hasRule(u,'frenzy')||r()<.6)){G.declareCharge(s,u.id,pick(r,t).id);return 'declare';}}G.finishDeclarations(s,r);return 'finish declarations';}
 if(s.stage==='movement'&&s.movementStep==='charges'){const u=red.find(u=>u.charge?.status==='declared');if(u){G.resolveCharge(s,u.id,G.rollD6(2,r));return 'charge';}G.enterRemaining(s,r);return 'remaining';}
 if(s.stage==='movement'&&s.movementStep==='remaining')for(const u of red){const o=BM.raidOptions(s,u);if(o.length&&r()<.5){BM.startRaid(s,u.id,o[0].id);return 'raid';}}
 if(s.stage==='movement'){const u=red.find(u=>G.canAct(s,u));if(u){const M=G.profile(u).M;for(let tries=0;tries<6;tries++){const order=r()<.35?{kind:'wheel',angle:pick(r,[-30,-15,15,30]),distance:0,mode:'advance'}:{kind:'advance',distance:Math.round(r()*M*2*2)/2||.5,mode:r()<.4?'march':'advance',angle:0};if(order.mode==='march'&&G.needsMarchTest(s,u)&&u.marchTest===null){G.marchTest(s,u.id,G.rollD6(2,r));break;}if(!G.orderError(s,u,order)){G.commitOrder(s,u.id,order,r);return 'move';}}if(G.canAct(s,u))G.hold(s,u.id,r);return 'hold';}}
 if(s.stage==='shooting'){for(const u of red.filter(u=>G.canShoot(s,u))){const t=G.shootingTargets(s,u).filter(x=>!x.plan.error);if(t.length){G.shoot(s,u.id,pick(r,t).unit.id,r);return 'shoot';}G.finishShooting(s,u.id);return 'no shot';}if(G.canFireRocket(s)){const t=G.rocketTargets(s).filter(x=>!x.error);if(t.length){G.fireRocket(s,pick(r,t).unit.id,pick(r,['demolition','incendiary']),G.rollRocketDice(r),r);return 'rocket';}}}
 // Red fights each combat one Initiative step at a time, so the bot's wizard can cast at its step.
 if(s.stage==='combat'){if(s.combatSession?.phase==='attacks'){G.fightCombatStep(s,r);return 'fight step';}if(s.combatSession?.phase==='compare'){G.compareCombat(s,r);return 'compare';}const pair=G.combatPairs(s)[0];if(pair){G.beginCombat(s,pair[0]);return 'begin combat';}}
 G.nextPhase(s,r);return 'next phase';
}
// Classic: Red deploys, then the bot. Battle March: roll off, alternate one unit at a time, roll
// off for the first turn; the bot makes its own choices when it wins.
function deploy(s,r){
 if(!s.deployOrder?.alternate){G.autoDeploy(s,{team:'ash',random:r});AI.deployOpponent(s,r);return G.begin(s,r);}
 // Terrain first: the bot takes its own turns, Red places at random legal spots (or passes).
 for(let g=0;g<40&&G.terrainPending(s);g++){const ts=s.terrainSetup;if(AI.deploymentChoice(s)==='terrain'){AI.takeDeploymentStep(s,r);continue;}if(ts.scatter){if(ts.scatter.count===null)G.scatterTerrainCount(s,r);else G.scatterTerrain(s,ts.scatter.by,ts.placed.slice(0,ts.scatter.count),r);continue;}if(ts.method!=='free'&&!ts.rollOff){G.terrainRollOff(s,r);continue;}if(!G.autoPlaceTerrain(s,ts.method==='free'?'ash':ts.next,r))G.passTerrain(s,ts.method==='free'?'ash':ts.next);}
 const d=s.deployOrder;if(AI.deploymentChoice(s)==='zone')AI.takeDeploymentStep(s,r);else G.chooseDeploymentZone(s,G.deploymentZoneChooser(s),r()<.5?'A':'B');G.deploymentRollOff(s,r);
 for(let guard=0;guard<40&&!d.complete;guard++){if(AI.deploymentChoice(s)==='deploy')AI.takeDeploymentStep(s,r);else G.autoDeploy(s,{team:'ash',random:r});}
 assert.ok(d.complete,'deployment finishes');
 G.firstTurnRollOff(s,r);if(s.firstTurn.winner==='ash')G.chooseFirstTurn(s,'ash',r()<.5?'ash':'iron');else AI.takeDeploymentStep(s);
 G.begin(s,r);
}
function play(seed,options){
 const r=rng(seed),s=G.createGame(options.opponent,{...options,random:r});deploy(s,r);
 let same=0,last=fingerprint(s);
 for(let step=0;step<2500&&s.stage!=='finished'&&s.round<=6;step++){
  const where=()=>`seed ${seed} (${options.opponent} ${options.format}${options.points?' '+options.points:''}${options.deployment?' '+options.deployment.map:''}), round ${s.round}, ${s.team} ${s.stage}${s.stage==='movement'?'/'+s.movementStep:''}`;
  if(s.team==='iron')assert.ok(AI.shouldAct(s)||AI.humanDecision(s),`${where()}: the bot has nothing to do and is not waiting on the player`);
  let who,what;
  if(AI.shouldAct(s)){who='bot';const out=AI.takeStep(s,r);what=out.message;assert.ok(!out.wait||AI.humanDecision(s),`${where()}: the bot waits without a player decision (${what})`);}
  else{who='red';what=redStep(s,r);}
  G.skipEmptySteps(s,r);
  assert.deepEqual(overlaps(s),[],`${where()}: after ${who} ${what}`);
  const now=fingerprint(s);same=now===last?same+1:0;last=now;assert.ok(same<25,`${where()}: nothing changed for 25 steps (last: ${who} ${what})`);
 }
 if(s.format.id==='battle-march'){
  assert.equal(s.stage,'finished',`seed ${seed}: the Battle March game reaches its end`);assert.equal(s.turnLog.length,10);
  const keys=s.scoring.ledger.filter(e=>e.kind!=='raid').map(e=>`${e.round}:${e.turn}:${e.objective}`);assert.equal(new Set(keys).size,keys.length,'each objective scores at most once per turn end');
  assert.ok(Number.isFinite(s.result.totals.ash)&&Number.isFinite(s.result.totals.iron));
 }
 return s;
}
const SEEDS=Number(process.env.SEEDS??2);let games=0;
for(const [opponent,format,points,extra]of [['empire','battle-march',500],['empire','battle-march',750,{objectives:'landmark',terrain:{method:'alternate'}}],['empire','battle-march',600,{objectives:'troves3',optional:{raidAndBurn:true},terrain:{method:'scatter',pieces:['hill','darkWood','hedge','rocks']}}],['empire','battle-march',500,{deployment:{map:'mountain-pass'},terrain:{method:'alternate',pieces:['steepHill','wood','highWall','building']}}],['empire','battle-march',750,{deployment:{map:'opposed-flanks',mirrored:true},objectives:'troves2'}],['orc','battle-march',500,{terrain:{method:'alternate'}}],['orc','classic',null],['empire','classic',null]])
 for(let seed=1;seed<=SEEDS;seed++){if(process.env.ONLY&&String(seed*97+(points??1))!==process.env.ONLY||process.env.OPP&&opponent!==process.env.OPP||process.env.FORMAT&&format!==process.env.FORMAT)continue;play(seed*97+(points??1),{opponent,format,points,...extra});games++;}
console.log(`PASS ${games} seeded games played with no overlaps, stalls or idle bot turns`);
