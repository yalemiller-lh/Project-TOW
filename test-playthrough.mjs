import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
import * as AI from './dist/ai.mjs';
import './dist/battlemarch.mjs';

// Plays whole seeded games (the bot as the opponent, a random but legal player as Red) and checks
// after every step that no two units overlap unless they are fighting each other, that the bot
// always has something to do in its own turn (or is waiting on a real player decision), and that
// the game never stalls. SEEDS=n plays more games.
function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const pick=(r,list)=>list[Math.floor(r()*list.length)];
function overlaps(s){
 const pieces=G.combatants(s).filter(u=>u.x!==null&&G.aliveCount(u)>0),bad=[],p=s.pendingCombat;
 for(let i=0;i<pieces.length;i++)for(let j=i+1;j<pieces.length;j++){const a=pieces[i],b=pieces[j];if(a.engaged===b.id||b.engaged===a.id)continue;
  // The pair whose combat aftermath is being resolved is briefly apart from its engagement.
  if(p&&[p.winner,p.loser].includes(a.id)&&[p.winner,p.loser].includes(b.id))continue;
  const g=G.gap(a,b);if(g<.001)bad.push(`${a.id}/${b.id} gap ${g.toFixed(3)}`);}
 return bad;
}
const fingerprint=s=>JSON.stringify([s.stage,s.team,s.round,s.movementStep,s.pendingCombat,s.combatSession,s.pendingSpell?.key,G.combatants(s).map(u=>[u.x,u.y,u.heading,u.moved,u.shot,u.engaged,u.charge?.status,u.charge?.reaction,u.fleeing,u.deadModels?.length,u.wounds,u.combatResolved,u.castThisTurn?.length,u.marchTest,u.impetuousTest])]);
function redStep(s,r){
 const d=AI.humanDecision(s);
 if(d?.kind==='reaction'){const c=s.units.find(u=>u.team==='iron'&&u.charge?.reaction==='pending'),def=G.getUnit(s,c.charge.target);G.chargeReaction(s,c.id,def.fleeing?'flee':G.canStandShoot(s,def,c)&&r()<.5?'stand-shoot':r()<.25?'flee':'hold',r);return 'reaction';}
 if(d?.kind==='shieldwall'){G.chooseLoserAction(s,r()<.5?'shieldwall':'fall-back');return 'shieldwall';}
 if(d?.kind==='aftermath'){G.winnerCombat(s,pick(r,['follow','restrain','follow-reform']),r);return 'aftermath';}
 if(d?.kind==='dispel'){const o=G.dispelOptions(s);G.resolveDispel(s,pick(r,['none',...(o.fated?['fated']:[]),...o.wizards.map(w=>w.id)]),r);return 'dispel';}
 if(s.pendingCombat){G.finishCombat(s,pick(r,['follow','restrain']),r);return 'finish';}
 const red=s.units.filter(u=>u.team==='ash'&&u.x!==null&&G.aliveCount(u)>0);
 // Red casts now and then, so the bot's dispels are exercised too.
 for(const w of red.filter(u=>u.role==='wizard'))for(const key of w.spells){const t=G.spellTargets(s,w.id,key).filter(t=>G.canCast(s,w.id,key,t.id));if(t.length&&r()<.5){G.attemptSpell(s,w.id,key,pick(r,t).id,r,{point:key==='pillar'?{x:Math.min(s.board.width-1.5,Math.max(1.5,w.x)),y:Math.min(s.board.height-1.5,Math.max(1.5,w.y-4))}:null});return 'cast';}}
 if(s.stage==='strategy'){const f=red.find(u=>u.fleeing&&!u.rallyAttempted);if(f){G.rally(s,f.id,r);return 'rally';}}
 if(s.stage==='movement'&&s.movementStep==='declare'){for(const u of red.filter(u=>G.canAct(s,u)&&!u.charge)){const t=G.availableCharges(s,u);if(t.length&&r()<.6){G.declareCharge(s,u.id,pick(r,t).id);return 'declare';}}G.finishDeclarations(s);return 'finish declarations';}
 if(s.stage==='movement'&&s.movementStep==='charges'){const u=red.find(u=>u.charge?.status==='declared');if(u){G.resolveCharge(s,u.id,G.rollD6(2,r));return 'charge';}G.enterRemaining(s);return 'remaining';}
 if(s.stage==='movement'){const u=red.find(u=>G.canAct(s,u));if(u){const M=G.profile(u).M;for(let tries=0;tries<6;tries++){const order=r()<.35?{kind:'wheel',angle:pick(r,[-30,-15,15,30]),distance:0,mode:'advance'}:{kind:'advance',distance:Math.round(r()*M*2*2)/2||.5,mode:r()<.4?'march':'advance',angle:0};if(order.mode==='march'&&G.needsMarchTest(s,u)&&u.marchTest===null){G.marchTest(s,u.id,G.rollD6(2,r));break;}if(!G.orderError(s,u,order)){G.commitOrder(s,u.id,order);return 'move';}}if(G.canAct(s,u))G.hold(s,u.id);return 'hold';}}
 if(s.stage==='shooting'){for(const u of red.filter(u=>G.canShoot(s,u))){const t=G.shootingTargets(s,u).filter(x=>!x.plan.error);if(t.length){G.shoot(s,u.id,pick(r,t).unit.id,r);return 'shoot';}G.finishShooting(s,u.id);return 'no shot';}if(G.canFireRocket(s)){const t=G.rocketTargets(s).filter(x=>!x.error);if(t.length){G.fireRocket(s,pick(r,t).unit.id,pick(r,['demolition','incendiary']),G.rollRocketDice(r),r);return 'rocket';}}}
 if(s.stage==='combat'){const pair=G.combatPairs(s)[0];if(pair){G.resolveCombat(s,pair[0],r);return 'fight';}}
 G.nextPhase(s);return 'next phase';
}
function play(seed,options){
 const r=rng(seed),s=G.createGame(options.opponent,options);G.autoDeploy(s,{team:'ash'});AI.deployOpponent(s);G.begin(s,r);
 let same=0,last=fingerprint(s);
 for(let step=0;step<2500&&s.stage!=='finished'&&s.round<=6;step++){
  const where=()=>`seed ${seed} (${options.opponent} ${options.format}${options.points?' '+options.points:''}), round ${s.round}, ${s.team} ${s.stage}${s.stage==='movement'?'/'+s.movementStep:''}`;
  if(s.team==='iron')assert.ok(AI.shouldAct(s)||AI.humanDecision(s),`${where()}: the bot has nothing to do and is not waiting on the player`);
  let who,what;
  if(AI.shouldAct(s)){who='bot';const out=AI.takeStep(s,r);what=out.message;assert.ok(!out.wait||AI.humanDecision(s),`${where()}: the bot waits without a player decision (${what})`);}
  else{who='red';what=redStep(s,r);}
  G.skipEmptySteps(s);
  assert.deepEqual(overlaps(s),[],`${where()}: after ${who} ${what}`);
  const now=fingerprint(s);same=now===last?same+1:0;last=now;assert.ok(same<25,`${where()}: nothing changed for 25 steps (last: ${who} ${what})`);
 }
 return s;
}
const SEEDS=Number(process.env.SEEDS??2);let games=0;
for(const [opponent,format,points]of [['empire','battle-march',500],['empire','battle-march',750],['empire','battle-march',600],['orc','classic',null],['empire','classic',null]])
 for(let seed=1;seed<=SEEDS;seed++){play(seed*97+(points??1),{opponent,format,points});games++;}
console.log(`PASS ${games} seeded games played with no overlaps, stalls or idle bot turns`);
