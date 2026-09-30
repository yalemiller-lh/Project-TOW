import * as G from './game.mjs';

const alive=u=>u.x!==null&&G.aliveCount(u)>0;
const enemies=s=>s.units.filter(u=>u.team==='ash'&&alive(u));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const nearest=(s,u)=>enemies(s).sort((a,b)=>G.gap(u,a)-G.gap(u,b))[0];
const roll=random=>G.rollD6(2,random);

// ---- Bot deployment -----------------------------------------------------------------------
// The bot deploys after the player and reacts to their line. Orcs (and a mirror Chaos Dwarf
// army) set up to attack: each regiment lines up opposite an enemy block, the Decimators first,
// on the front edge of the zone. The Empire builds a gun line: the Great Cannons and crossbows
// take the spots with the most clear shots, the State Troops face the enemy without blocking a
// fire lane, and the Battlemage stands behind the middle of the line.
export function readyToDeploy(s){return s.stage==='deployment'&&s.units.filter(u=>u.team==='ash').every(u=>u.x!==null)&&s.rocket.x!==null&&(s.units.some(u=>u.team==='iron'&&u.x===null)||s.cannons.some(c=>c.x===null));}
const CANDIDATE_X=Array.from({length:71},(_,i)=>1+i);
const frontRow=u=>G.BOARD.zone-G.size(u).h/2-.01,backRow=u=>G.size(u).h/2+.01;
const pose=(u,x,y)=>({...u,x,y,heading:180});
function blocked(s,from,to,ignore){return s.units.some(v=>v.x!==null&&!ignore.includes(v.id)&&G.aliveCount(v)>0&&G.polygonGap([from,to],G.corners(v))<1e-6)||s.cannons.some(c=>c.x!==null&&!ignore.includes(c.id)&&G.polygonGap([from,to],G.corners(c))<1e-6);}
const targetValue=t=>t.role==='missile'?1.3:t.role==='wizard'?.5:1;
// Enemy units a shooter at this spot could hit: inside its front arc, within reach, clear line.
function shots(s,shooter,reach){return s.units.filter(t=>t.team==='ash'&&t.x!==null).reduce((sum,t)=>{const dy=t.y-shooter.y,dx=t.x-shooter.x;return (shooter.role==='warmachine'||dy>0&&Math.abs(dx)<=dy+G.size(t).w/2)&&G.gap(shooter,t)<=reach&&!blocked(s,{x:shooter.x,y:shooter.y},{x:t.x,y:t.y},[shooter.id,t.id])?sum+targetValue(t):sum;},0);}
// How many currently clear bot fire lanes a footprint at this spot would cut.
function lanesCut(s,candidate){let cut=0;for(const f of [...s.units.filter(u=>u.team==='iron'&&u.x!==null&&u.role==='missile'),...s.cannons.filter(c=>c.x!==null)])for(const t of s.units.filter(t=>t.team==='ash'&&t.x!==null)){const a={x:f.x,y:f.y},b={x:t.x,y:t.y};if(!blocked(s,a,b,[f.id,t.id])&&G.polygonGap([a,b],G.corners(candidate))<1e-6)cut++;}return cut;}
function tryPlace(s,u,x,y){try{if(u.role==='warmachine')G.placeCannon(s,u.id,x,y);else G.place(s,u.id,x,y);return true;}catch{return false;}}
// Place at the best-scoring legal spot on the given row.
function placeBest(s,u,row,score){
 const options=CANDIDATE_X.map(x=>({x,y:row,score:score(pose(u,x,row))})).sort((a,b)=>b.score-a.score||Math.abs(a.x-36)-Math.abs(b.x-36));
 for(const o of options)if(tryPlace(s,u,o.x,o.y))return o;
 throw Error(`No legal deployment space for ${u.id}.`);
}
export function deployOpponent(s){
 if(s.stage!=='deployment')throw Error('The bot can deploy only before the battle.');
 const mine=s.units.filter(u=>u.team==='iron'&&u.x===null),cannons=s.cannons.filter(c=>c.x===null),foes=s.units.filter(u=>u.team==='ash'&&u.x!==null&&u.role!=='wizard');
 const faction=s.units.find(u=>u.team==='iron')?.faction;
 const infantry=mine.filter(u=>u.role==='infantry'),missile=mine.filter(u=>u.role==='missile'),wizard=mine.find(u=>u.role==='wizard');
 const reach=u=>G.missileWeapon(u).range+G.profile(u).M+2;
 if(!foes.length){
  // Nothing to react to yet: an even spread across the zone.
  for(const [u,x]of [...infantry,...missile].map((u,i)=>[u,[18,36,54,64][i]]))placeBest(s,u,frontRow(u),p=>-Math.abs(p.x-x));
  for(const [c,x]of cannons.map((c,i)=>[c,[8,45][i]]))placeBest(s,c,frontRow(c),p=>-Math.abs(p.x-x));
  if(wizard)placeBest(s,wizard,backRow(wizard),p=>-Math.abs(p.x-70));return;
 }
 // The enemy blocks to oppose: the Decimators, then the regiments nearest to them.
 const soft=foes.find(u=>u.role==='missile')??foes[0],opposite=[soft,...foes.filter(u=>u!==soft).sort((a,b)=>Math.abs(a.x-soft.x)-Math.abs(b.x-soft.x))];
 const claimed=new Set();
 const oppose=u=>{const target=opposite.find(t=>!claimed.has(t.id))??opposite[0];claimed.add(target.id);return target;};
 if(faction==='empire'){
  for(const c of cannons){const others=()=>s.cannons.filter(o=>o.x!==null&&o.id!==c.id);placeBest(s,c,frontRow(c),p=>shots(s,p,60)+Math.min(12,...others().map(o=>Math.abs(o.x-p.x)),12)*.05);}
  for(const u of missile)placeBest(s,u,frontRow(u),p=>shots(s,p,reach(u)));
  for(const u of infantry){const target=oppose(u);placeBest(s,u,frontRow(u),p=>-Math.abs(p.x-target.x)*.3-5*lanesCut(s,p));}
 }else{
  for(const u of infantry){const target=oppose(u);placeBest(s,u,frontRow(u),p=>-Math.abs(p.x-target.x));}
  for(const u of missile)placeBest(s,u,frontRow(u),p=>shots(s,p,reach(u))-Math.abs(p.x-36)*.01);
  for(const c of cannons)placeBest(s,c,frontRow(c),p=>shots(s,p,60));
 }
 if(wizard){const line=s.units.filter(u=>u.team==='iron'&&u.x!==null&&u.role!=='wizard'),mid=line.reduce((n,u)=>n+u.x,0)/Math.max(1,line.length);placeBest(s,wizard,backRow(wizard),p=>-Math.abs(p.x-mid)-5*lanesCut(s,p)+(line.some(u=>Math.abs(u.x-p.x)<G.size(u).w/2)?2:0));}
}

export function humanDecision(s){
 if(s.pendingSpell&&G.getUnit(s,s.pendingSpell.caster)?.team==='iron')return {id:s.pendingSpell.caster,kind:'dispel',message:`Choose how to dispel ${G.BATTLE_MAGIC[s.pendingSpell.key].name}.`};
 const charge=s.units.find(u=>u.team==='iron'&&u.charge?.status==='declared'&&u.charge.reaction==='pending');
 if(charge)return {id:charge.charge.target,kind:'reaction',message:`Choose a reaction for ${charge.charge.target} against ${charge.id}.`};
 const p=s.pendingCombat;
 if(p?.stage==='loser-choice'&&G.getUnit(s,p.loser).team==='ash')return {id:p.loser,kind:'shieldwall',message:`Choose ${p.loser}'s Shieldwall or Fall Back.`};
 if(p?.stage==='winner-choice'&&G.getUnit(s,p.winner).team==='ash')return {id:p.winner,kind:'aftermath',message:`Choose ${p.winner}'s pursuit or restraint.`};
 return null;
}

// The computer resolves every combat-aftermath step that belongs to its own regiment,
// including when the player's turn produced the combat.
export function combatDecision(s){
 const p=s.pendingCombat;if(s.stage!=='combat'||!p)return null;
 const owner=['break','loser-choice','retreat'].includes(p.stage)?p.loser:p.stage==='winner-choice'?p.winner:null;
 return G.getUnit(s,owner)?.team==='iron'?p.stage:null;
}

function resolveCombatDecision(s,random){
 const p=s.pendingCombat;
 if(p.stage==='break'){const out=G.rollCombatBreak(s,random);return {message:`${p.loser} ${out.outcome.replace('-',' ')} (${out.dice.join('+')}).`};}
 if(p.stage==='loser-choice'){G.chooseLoserAction(s,p.shieldwallAvailable?'shieldwall':'fall-back');return {message:`${p.loser} chooses ${p.loserChoice}.`};}
 if(p.stage==='retreat'){const out=G.moveCombatLoser(s,random);return {message:`${out.loser} retreats ${out.distance.toFixed(1)}″.`};}
 const out=G.winnerCombat(s,'follow',random);return {message:`${out.winner} ${out.outcome==='overrun'?'overruns':out.outcome==='break'?'pursues':'follows up'}.`};
}

export function shouldAct(s){
 if(s.stage==='deployment')return false;
 if(s.pendingSpell)return G.getUnit(s,s.pendingSpell.caster)?.team==='ash';
 if(s.team==='iron')return !humanDecision(s);
 return s.stage==='movement'&&s.movementStep==='declare'&&s.units.some(u=>u.team==='ash'&&u.charge?.status==='declared'&&u.charge.reaction==='pending'&&G.getUnit(s,u.charge.target)?.team==='iron')||!!combatDecision(s)||s.stage==='combat'&&s.units.some(u=>u.team==='iron'&&u.role==='wizard'&&u.engaged&&u.spells.some(key=>['hammerhand','hashutFlames'].includes(key)&&G.canCast(s,u.id,key,u.engaged)));
}

function moveRegiment(s,u,random){
 s.selected=u.id;
 const target=nearest(s,u);if(!target){G.hold(s,u.id);return {message:`${u.id} holds position.`};}
 const virtual={...s,stage:'shooting',team:'iron'};
 if(u.role==='missile'&&G.canShoot(virtual,u)&&G.shootingTargets(virtual,u).some(t=>!t.plan.error)){G.hold(s,u.id);return {message:`${u.id} holds for a clear shot.`};}
 const dx=target.x-u.x,dy=target.y-u.y,desired=G.normalize(Math.atan2(dx,-dy)*180/Math.PI),turn=((desired-G.heading(u)+540)%360)-180;
 const separation=G.gap(u,target),wantMarch=u.role!=='missile'&&separation>14&&u.marchTest!==false,mode=u.movementMode??(wantMarch?'march':'advance');
 if(mode==='march'&&G.needsMarchTest(s,u)&&u.marchTest===null){const dice=roll(random),passed=G.marchTest(s,u.id,dice);return {message:`${u.id} march test ${passed?'passed':'failed'} (${dice.join('+')}).`};}
 if((u.spent??0)===0&&Math.abs(turn)>75){const order={kind:'pivot',angle:Math.round(turn),distance:0,mode:'advance'};if(!G.orderError(s,u,order)){G.commitOrder(s,u.id,order);return {message:`${u.id} reforms toward ${target.id}.`};}}
 if((u.spent??0)===0&&Math.abs(turn)>12){for(const angle of [Math.min(35,Math.abs(turn)),25,15].map(n=>Math.round(n)*Math.sign(turn))){const order={kind:'wheel',angle,distance:0,mode};if(angle&&!G.orderError(s,u,order)){G.commitOrder(s,u.id,order);return {message:`${u.id} wheels toward ${target.id}.`};}}}
 const allowance=mode==='march'?2*G.profile(u).M:G.profile(u).M,remaining=allowance-(u.spent??0),max=Math.max(0,Math.min(remaining,separation-1));
 for(let d=Math.floor(max*2)/2;d>=.5;d-=.5){const order={kind:'advance',distance:d,angle:0,mode};if(!G.orderError(s,u,order)){G.commitOrder(s,u.id,order);return {message:`${u.id} ${mode==='march'?'marches':'advances'} ${d}″ toward ${target.id}.`};}}
 G.hold(s,u.id);return {message:`${u.id} holds position.`};
}

function aiDispel(s,random){
 const options=G.dispelOptions(s),wizard=[...options.wizards].sort((a,b)=>b.bonus-a.bonus)[0],choice=wizard?.id??(options.fated?'fated':'none');
 const out=G.resolveDispel(s,choice,random),name=G.BATTLE_MAGIC[out.spell].name;
 if(!out.dispel)return {message:`The bot lets ${name} through.`};
 return {message:`${out.dispel.kind==='fated'?'Fated Dispel':out.dispel.by+' tries to dispel'}: ${out.dispel.dice.join('+')} = ${out.dispel.total} vs ${out.casting} · ${out.dispel.success?name+' dispelled':name+' takes effect'}${out.dispel.miscast?' · '+out.dispel.miscast.kind:''}.`,roll:{label:`${out.dispel.by??options.caster} · ${out.dispel.kind==='fated'?'Fated Dispel':'Dispel'}`,dice:out.dispel.dice,team:'iron'},report:out,spell:true,point:G.getUnit(s,out.target)};
}
export function takeStep(s,random=Math.random){
 if(!shouldAct(s))return {message:'Waiting for the player.',wait:true};
 if(s.pendingSpell)return aiDispel(s,random);
 if(s.team==='ash'){
  if(s.stage==='combat'){if(combatDecision(s))return resolveCombatDecision(s,random);const cast=aiSpell(s,random);if(cast)return cast;return {message:'Waiting for the player.',wait:true};}
  const charger=s.units.find(u=>u.team==='ash'&&u.charge?.status==='declared'&&u.charge.reaction==='pending'&&G.getUnit(s,u.charge.target)?.team==='iron');
  const defender=G.getUnit(s,charger.charge.target),choice=defender.fleeing?'flee':G.canStandShoot(s,defender,charger)?'stand-shoot':'hold',point={x:charger.x,y:charger.y},out=G.chargeReaction(s,charger.id,choice,random);
  return {message:`${defender.id} chooses ${choice==='stand-shoot'?'Stand & Shoot':choice}.`,report:out.report,point};
 }
 const decision=humanDecision(s);if(decision)return {...decision,wait:true};
 if(s.stage==='strategy'){
  const u=s.units.find(u=>u.team==='iron'&&u.x!==null&&u.fleeing&&!u.rallyAttempted);
  if(u){s.selected=u.id;const out=G.rally(s,u.id,random);return {message:`${u.id} ${out.success?'rallies':'fails to rally'} (${out.dice.join('+')}).`};}
  const cast=aiSpell(s,random);if(cast)return cast;
  G.nextPhase(s);return {message:'The bot begins Movement.'};
 }
 if(s.stage==='movement'&&s.movementStep==='declare'){
  const pending=s.units.find(u=>u.team==='iron'&&u.charge?.status==='declared'&&u.charge.reaction==='pending');if(pending)return {...humanDecision(s),wait:true};
  for(const u of s.units.filter(u=>u.team==='iron'&&G.canAct(s,u)&&u.faction==='orc'&&u.impetuousTest===null&&G.availableCharges(s,u).length)){const dice=roll(random),passed=G.impetuousTest(s,u.id,dice);s.selected=u.id;return {message:`${u.id} Impetuous test ${passed?'passed':'failed'} (${dice.join('+')}).`};}
  const options=s.units.filter(u=>u.team==='iron'&&G.canAct(s,u)).flatMap(u=>G.availableCharges(s,u).map(t=>({u,t,plan:G.chargePlan(s,u,t)}))).sort((a,b)=>a.plan.cost-b.plan.cost);
  if(options.length){const {u,t}=options[0];s.selected=u.id;G.declareCharge(s,u.id,t.id);return {message:`${u.id} charges ${t.id}. Choose a reaction.`};}
  G.finishDeclarations(s);return {message:'The bot finishes charge declarations.'};
 }
 if(s.stage==='movement'&&s.movementStep==='charges'){
  const u=s.units.find(u=>u.team==='iron'&&u.charge?.status==='declared');if(u){s.selected=u.id;const dice=roll(random),out=G.resolveCharge(s,u.id,dice);return {message:`${u.id} charge ${out.success?'succeeds':'fails'} (${dice.join(', ')}).`};}
  G.enterRemaining(s);return {message:'The bot begins remaining moves.'};
 }
 if(s.stage==='movement'){
  const u=s.units.find(u=>u.team==='iron'&&G.canAct(s,u));if(u)return moveRegiment(s,u,random);
  const cast=aiSpell(s,random);if(cast)return cast;
  G.nextPhase(s);return {message:`The bot begins ${s.stage}.`};
 }
 if(s.stage==='shooting'){
  const cast=aiSpell(s,random);if(cast)return cast;
  const choices=s.units.filter(u=>u.team==='iron'&&G.canShoot(s,u)).flatMap(u=>G.shootingTargets(s,u).filter(t=>!t.plan.error).map(t=>({u,t}))).sort((a,b)=>a.t.plan.distance-b.t.plan.distance);
  if(choices.length){const {u,t}=choices[0],point={x:t.unit.x,y:t.unit.y};s.selected=u.id;const report=G.shoot(s,u.id,t.unit.id,random);return {message:`${u.id} fires at ${t.unit.id}: ${report.unsaved} slain.`,report,point};}
  for(const c of s.cannons){if(!G.canFireCannon(s,c.id))continue;const grape=G.cannonTargets(s,c.id,{mode:'grape'}).filter(t=>!t.error),ball=G.cannonTargets(s,c.id,{mode:'ball',aimShort:6}).filter(t=>!t.error),targets=grape.length?grape:ball;
   if(!targets.length)continue;const target=targets.sort((a,b)=>a.distance-b.distance)[0],mode=grape.length?'grape':'ball',positions=new Map(s.units.filter(alive).map(u=>[u.id,{x:u.x,y:u.y}]));const report=G.fireCannon(s,c.id,target.unit.id,mode,G.rollCannonDice(random),random,{aimShort:6});return {message:`${c.name} fires ${mode==='grape'?'grapeshot':'a cannonball'}: ${report.unsaved} slain.`,report,positions,artillery:true};}
  G.nextPhase(s);return {message:'The bot begins Combat.'};
 }
 if(s.stage==='combat'){
  const cast=aiSpell(s,random);if(cast)return cast;
  if(s.pendingCombat)return resolveCombatDecision(s,random);
  if(s.combatSession?.phase==='attacks'){const out=G.fightCombatStep(s,random);return {message:`Initiative ${out.initiative}: ${out.stages.reduce((n,x)=>n+x.unsaved,0)} slain.`};}
  if(s.combatSession?.phase==='compare'){const out=G.compareCombat(s);return {message:out.winner?`${out.winner} wins combat.`:'Combat is a draw.'};}
  const pair=G.combatPairs(s)[0];if(pair){const id=pair.find(id=>G.getUnit(s,id).team==='iron')??pair[0];s.selected=id;G.beginCombat(s,id);return {message:`${pair.join(' fights ')}: initiative order shown.`};}
  G.nextPhase(s);return {message:'The bot ends its turn.'};
 }
 return {message:'Waiting for the player.',wait:true};
}

function aiSpell(s,random){const wizard=s.units.find(u=>u.team==='iron'&&u.role==='wizard'&&alive(u));if(!wizard)return null;for(const key of wizard.spells){const targets=G.spellTargets(s,wizard.id,key).filter(t=>G.canCast(s,wizard.id,key,t.id));if(!targets.length)continue;const target=key==='shield'?wizard:targets.sort((a,b)=>G.gap(wizard,a)-G.gap(wizard,b))[0],point=key==='pillar'?(()=>{const victim=nearest(s,wizard);if(!victim)return {x:wizard.x,y:wizard.y};const d=distance(wizard,victim),f=Math.min(10,d)/d;return {x:Math.max(1.5,Math.min(70.5,wizard.x+(victim.x-wizard.x)*f)),y:Math.max(1.5,Math.min(46.5,wizard.y+(victim.y-wizard.y)*f))};})():null;const report=G.attemptSpell(s,wizard.id,key,target.id,random,{point});s.selected=wizard.id;return {message:`${wizard.name} casts ${G.BATTLE_MAGIC[key].name}: ${report.dice.join('+')} = ${report.casting} · ${report.pending?'cast — choose a dispel':report.cast?'cast':'failed'}.`,roll:{label:`${wizard.id} · ${G.BATTLE_MAGIC[key].name} casting`,dice:report.dice,team:'iron'},spell:true,report,point:{x:target.x,y:target.y}};}return null;}
