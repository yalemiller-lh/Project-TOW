import * as G from './game.mjs';
import * as BM from './battlemarch.mjs';

// The side the bot plays: Blue, unless setSide gives it Red (self-play tests).
let ME='iron',THEM='ash';
export function setSide(team){ME=team;THEM=team==='ash'?'iron':'ash';return ME;}
// The bot's own war machines: Blue's Great Cannons or Red's Deathshrieker.
const machinesOf=(s,team)=>team==='iron'?(s.cannons??[]):[s.rocket].filter(m=>m&&!m.absent),myMachines=s=>machinesOf(s,ME);
const alive=u=>u.x!==null&&G.aliveCount(u)>0;
const enemies=s=>s.units.filter(u=>u.team===THEM&&alive(u));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const nearest=(s,u)=>enemies(s).sort((a,b)=>G.gap(u,a)-G.gap(u,b))[0];
const roll=random=>G.rollD6(2,random);

// ---- Judging a choice by playing it out ----
// The bot weighs a fight, a shot or a spell by playing it out with the real rules on copies of
// the battle, many times, and comparing what each side loses: a unit's points (a classic unit by
// its models), the General's and a captured standard's bonus VP. In Battle March half of it is
// the VP the enemy would score (the whole cost when destroyed, half when fleeing or down to a
// quarter), so finishing off a battered unit is worth its full price.
const SIMS=20;
function seeded(n){let x=(Math.imul(n|0,2654435761)>>>0)%2147483647||1;return ()=>{x=(x*16807)%2147483647;return (x-1)/2147483646;};}
export function points(u){return (u.cost??(u.role==='warmachine'?110:G.isCharacter(u)?(u.role==='wizard'?115:60):G.startingModels(u)*(u.role==='missile'?10:8)))+(u.general?50:0);}
let scoring=false;
function lossOf(u,ref){const full=points(ref)+(G.commandAlive(ref,'S')?25:0);if(u.destroyed||u.x===null&&!u.offBoardPursuit)return full;const left=G.remainingWounds(u)/Math.max(1,G.startingWounds(u));let v=points(ref)*(1-left);if(u.fleeing)v=Math.max(v,full*.6);if(!scoring)return v;const vp=u.fleeing||left<=.25+1e-9?points(ref)/2:0;return (v+vp)/2;}
// Enemy losses minus the bot's own, from one state to another.
export function swing(before,after){scoring=!!before.objectives;let v=0;for(const b of G.combatants(before)){const a=G.getUnit(after,b.id);if(!a)continue;const d=lossOf(a,b)-lossOf(b,b);v+=b.team===ME?-d:d;}return v;}
const asList=v=>Array.isArray(v)?v:v?[v]:[];
// A fight played out: each charger set in contact as a successful charger (with any already in
// the fight), then every Initiative step, the result, the Break test, the flight and the pursuit.
// Fights already played out this turn are remembered (the dice are seeded, so they would repeat).
// What the bot remembers belongs to one battle: a copy of it (a loaded save) starts afresh.
const memory=new WeakMap();
function recall(s){let m=memory.get(s);if(!m)memory.set(s,m={fightMemo:new Map(),memoTurn:null,fights:new Map(),fightTurn:null,planKey:null,planCache:null});return m;}
export function playFight(s,charges,firstId,team=ME,n=SIMS){
 const m=recall(s),fightMemo=m.fightMemo,turn=`${s.round}:${s.team}:${s.stage}`;if(m.memoTurn!==turn){fightMemo.clear();m.memoTurn=turn;}
 const key=[firstId,team,n,...charges.map(({u,t,plan})=>`${u.id}>${t.id}@${Math.round(plan.end.x*10)},${Math.round(plan.end.y*10)}`),...G.combatants(s).filter(v=>v.x!==null).map(v=>`${v.id}:${G.aliveCount(v)}:${Math.round(v.x*10)},${Math.round(v.y*10)}`)].join("|");
 if(fightMemo.has(key))return fightMemo.get(key);
 const out=fightOut(s,charges,firstId,team,n);fightMemo.set(key,out);return out;
}
function fightOut(s,charges,firstId,team,n){
 let total=0,wins=0,played=0;
 for(let i=0;i<n;i++){
  const c=structuredClone(s);Object.assign(c,{stage:'combat',team,pendingSpell:null,combatSession:null,pendingCombat:null});
  for(const {u,t,plan}of charges){const cu=G.getUnit(c,u.id),ct=G.getUnit(c,t.id);Object.assign(cu,{x:plan.end.x,y:plan.end.y,heading:G.heading(plan.end)});cu.engaged=[...new Set([...asList(cu.engaged),ct.id])];ct.engaged=[...new Set([...asList(ct.engaged),cu.id])];cu.charge={target:ct.id,status:'success',distance:plan.cost??0,face:plan.face??'front'};}
  for(const v of G.combatants(c))v.combatResolved=false;
  const r=seeded(i+1);
  try{G.resolveCombat(c,firstId,r);}catch{continue;}
  // A unit that breaks is counted as fleeing, and as run down about one time in two (the flight
  // and pursuit themselves are not played: their geometry costs far more than the fight).
  let extra=0;scoring=!!s.objectives;for(const [id,b]of Object.entries(c.lastCombat?.breaks??{}))if(b.outcome==='break'){const u=G.getUnit(c,id),ref=G.getUnit(s,id);if(u&&u.x!==null&&!u.destroyed){u.fleeing=true;extra+=(u.team===ME?-1:1)*.45*(lossOf({...u,destroyed:true},ref)-lossOf(u,ref));}}
  played++;total+=swing(s,c)+extra;if(c.lastCombat?.winnerSide===ME)wins++;
 }
 return played?{value:total/played,win:wins/played}:{value:0,win:0};
}
// The chance a charge arrives: Movement plus the higher of 2D6 must cover the distance (a
// Warband re-rolls a failed charge).
function reachChance(u,cost){const k=Math.ceil(cost-G.profile(u).M-1e-6),p=k<=1?1:k>6?0:1-((k-1)/6)**2;return u.faction==='orc'?1-(1-p)**2:p;}
// One unit set squarely in front of another, as a frontal charge would end.
function frontal(e,u){const a=G.heading(u)*Math.PI/180,d=(G.size(u).h+G.size(e).h)/2,end={...e,x:u.x+Math.sin(a)*d,y:u.y-Math.cos(a)*d,heading:(G.heading(u)+180)%360};return {end,cost:Math.max(0,G.gap(e,u)),face:'front'};}
// What a charge by `a` on `b` is worth to the bot, played out once per turn and remembered.
function matchup(s,a,b){const m=recall(s),fights=m.fights,turn=`${s.round}:${s.team}`;if(m.fightTurn!==turn){fights.clear();m.fightTurn=turn;}const key=`${a.id}>${b.id}:${G.aliveCount(a)}:${G.aliveCount(b)}`;if(!fights.has(key)){const plan=G.chargePlan(s,a,b);fights.set(key,playFight(s,[{u:a,t:b,plan:plan.error?frontal(a,b):plan}],a.id,a.team,12).value);}return fights.get(key);}
// The enemy regiments that could charge, and are worth worrying about.
const chargers=s=>s.units.filter(e=>e.team===THEM&&alive(e)&&!e.fleeing&&!e.engaged&&e.role!=='warmachine');
// How a spot looks for a unit: the fights enemies could start against it next turn (each weighed
// by the chance its charge arrives) and the fights it could start itself.
// At the end of the battle there is no turn to come: the enemy cannot answer the bot's last
// turn, and the bot has no turn after the final round to make the charges it sets up.
const enemyTurnLeft=s=>!(s.format?.rounds&&s.round>=s.format.rounds&&s.team!==s.firstPlayer),ownTurnLeft=s=>!(s.format?.rounds&&s.round>=s.format.rounds);
function danger(s,u,p){if(!enemyTurnLeft(s))return 0;let v=0;for(const e of chargers(s)){const g=G.gap(e,p),c=reachChance(e,g);if(c>0)v+=c*Math.min(0,matchup(s,e,u));}return v;}
function promise(s,u,p){if(G.isCharacter(u)||u.role==='missile'||!ownTurnLeft(s))return 0;let v=0;for(const t of G.combatants(s).filter(t=>t.team===THEM&&alive(t)&&!t.fleeing)){const c=reachChance(u,G.gap(p,t)+.5);if(c>0)v=Math.max(v,c*Math.max(0,matchup(s,u,t)));}return v;}
// Inches a unit would give up to avoid losing a point's worth.
const INCH_PER_POINT=.12;
// What holding its objective is worth to a unit: the objective's VP for each of the bot's
// remaining turn ends, at most three.
function heldValue(s,u){const o=s.objectives?.items.find(o=>!o.removed&&BM.controlOf(s,o).unit===u.id);if(!o)return 0;const left=Math.max(1,(s.format?.rounds??5)-s.round+1);return BM.OBJECTIVE_VP[o.kind]*Math.min(3,left);}
// Every charge the bot could declare now, each weighed: the chance it arrives times the fight
// played out (with the bot's charges already declared at that target), a unit left stranded when
// it falls short, the objective it would leave, and what waiting to be charged by it would cost.
function chargeChoices(s){
 const declared=s.units.filter(u=>u.team===ME&&u.charge?.status==='declared').map(u=>{const t=G.getUnit(s,u.charge.target);return {u,t,plan:t?G.chargePlan(s,u,t):{error:true}};}).filter(d=>d.t&&!d.plan.error);
 const out=[];
 for(const u of s.units.filter(u=>u.team===ME&&G.canAct(s,u)&&!u.charge)){
  // Frenzy, or an Orc Mob that failed its Impetuous test, must charge if it can.
  const must=G.hasRule(u,'frenzy')||G.isImpetuous(s,u)&&u.impetuousTest===false;
  for(const t of G.availableCharges(s,u)){
   const plan=G.chargePlan(s,u,t);if(plan.error)continue;
   const p=reachChance(u,plan.cost);if(p<=0&&!must)continue;
   const fight=playFight(s,[...declared.filter(d=>d.t.id===t.id),{u,t,plan}],u.id);
   const ev=p*fight.value+(1-p)*-.12*points(u)-(s.objectives?heldValue(s,u):0);
   out.push({u,t,plan,p,ev,fight:fight.value,wait:waiting(s,u,t),must});
  }
 }
 // Two units that would each lose alone may win together: the first of the pair goes in, and the
 // second then sees it declared.
 const byTarget=new Map();for(const o of out.filter(o=>!o.must&&!worthCharging(o)&&o.p>=.5))byTarget.set(o.t.id,[...(byTarget.get(o.t.id)??[]),o]);
 for(const group of byTarget.values()){if(group.length<2)continue;const [a,b]=group.sort((x,y)=>y.p-x.p);const both=playFight(s,[...declared,{u:a.u,t:a.t,plan:a.plan},{u:b.u,t:b.t,plan:b.plan}],a.u.id).value,ev=a.p*b.p*both+a.p*(1-b.p)*a.fight+(1-a.p)*-.12*points(a.u);if(ev>0)out.push({...a,ev,pair:b.u.id});}
 return out;
}
// Waiting instead: the enemy may charge this unit next turn, if that fight suits it.
function waiting(s,u,t){if(t.role==='warmachine'||t.engaged||t.fleeing)return 0;const plan=G.chargePlan(s,t,u);if(plan.error)return 0;return reachChance(t,plan.cost)*(t.role==='missile'?.4:1)*Math.min(0,matchup(s,t,u));}
// A charge is made when it is worth something, or when it is clearly better than the beating the
// unit would otherwise take where it stands.
// (Missile troops never charge as the lesser evil: they can shoot, or Stand & Shoot.)
const worthCharging=o=>o.ev>Math.max(0,o.wait)+.02*points(o.u)||o.u.role==='infantry'&&o.wait<-.25*points(o.u)&&o.ev>o.wait+.15*points(o.u);
// A volley played out: what it costs the enemy.
function shotValue(s,u,t){let v=0;for(let i=0;i<6;i++){const c=structuredClone(s);try{G.shoot(c,u.id,t.id,seeded(i+31));v+=swing(s,c)/6;}catch{}}return v;}
function cannonValue(s,c,t,mode){let v=0;for(let i=0;i<6;i++){const k=structuredClone(s),r=seeded(i+41);try{G.fireCannon(k,c.id,t.id,mode,G.rollCannonDice(r),r,{aimShort:6});v+=swing(s,k)/6;}catch{}}return v;}
// In its Strategy phase the bot tries to dispel an enemy vortex near its units: its wizard when
// in range, otherwise the side's Fated Dispel.
function dispelVortices(s,random){
 for(const v of s.vortices??[]){const ref=v.id??v.caster;if(!G.canDispelVortex(s,ref))continue;if(!s.units.some(u=>u.team===ME&&alive(u)&&G.circleGap(G.corners(u),{x:v.x,y:v.y,r:(v.radius??1.5)+6})<1e-6))continue;
  const wizard=G.vortexDispellers(s,ref)[0],mode=wizard?'wizard':G.fatedDispelAvailable(s,ME)?'fated':null;if(!mode)continue;
  const out=G.dispelVortex(s,ref,random,mode,wizard?.id),name=G.SPELLS[v.spell??'pillar'].name;return {message:`${mode==='wizard'?wizard.id:'Fated Dispel'} tries to dispel ${name}: ${out.dice.join('+')} = ${out.total} vs ${out.beat} · ${out.success?'dispelled':'it remains'}.`,roll:{label:`Dispel ${name}`,dice:out.dice,team:ME}};}
 return null;
}

// ---- Bot deployment -----------------------------------------------------------------------
// The bot deploys after the player and reacts to their line. Orcs (and a mirror Chaos Dwarf
// army) set up to attack: each regiment lines up opposite an enemy block, the Decimators first,
// on the front edge of the zone. The Empire builds a gun line: the Great Cannons and crossbows
// take the spots with the most clear shots, the State Troops face the enemy without blocking a
// fire lane, and the Battlemage stands behind the middle of the line.
export function readyToDeploy(s){if(s.deployOrder?.alternate)return !!deploymentChoice(s);return s.stage==='deployment'&&s.units.filter(u=>u.team===THEM).every(u=>u.x!==null)&&machinesOf(s,THEM).every(m=>m.x!==null)&&(s.units.some(u=>u.team===ME&&u.x===null)||myMachines(s).some(c=>c.x===null));}
// The bot plans in its own deployment frame: "across" runs along its front, "depth" grows toward
// the enemy. The same plan then fits zones on the long edges, the short edges (Mountain Pass),
// quarters (Close Encounter) and triangles (Opposed Flanks, Outflank): the front line is the
// front-most spot that fits at each point along the zone, so a triangle's line follows its diagonal.
function deployFrame(s,team=ME){
 const a=G.deploymentFacing(s,team)*Math.PI/180,fw={x:Math.sin(a),y:-Math.cos(a)},lat={x:Math.cos(a),y:Math.sin(a)},zone=G.zoneOf(s,team);
 const across=p=>p.x*lat.x+p.y*lat.y,depth=p=>p.x*fw.x+p.y*fw.y,L=zone.map(across),D=zone.map(depth);
 return {across,depth,l0:Math.min(...L),l1:Math.max(...L),d0:Math.min(...D),d1:Math.max(...D),at:(l,d)=>({x:l*lat.x+d*fw.x,y:l*lat.y+d*fw.y})};
}
function blocked(s,from,to,ignore){return s.units.some(v=>v.x!==null&&!ignore.includes(v.id)&&G.aliveCount(v)>0&&G.polygonGap([from,to],G.corners(v))<1e-6)||s.cannons.some(c=>c.x!==null&&!ignore.includes(c.id)&&G.polygonGap([from,to],G.corners(c))<1e-6);}
const targetValue=t=>t.role==='missile'?1.3:t.role==='wizard'?.5:1;
// Enemy units a shooter at this spot could hit: in its front arc (a war machine turns to fire),
// within reach, with a clear line.
function shots(s,shooter,reach){return s.units.filter(t=>t.team!==shooter.team&&t.x!==null).reduce((sum,t)=>(shooter.role==='warmachine'||G.inVisionArc(shooter,t))&&G.gap(shooter,t)<=reach&&!blocked(s,{x:shooter.x,y:shooter.y},{x:t.x,y:t.y},[shooter.id,t.id])?sum+targetValue(t):sum,0);}
// How many currently clear bot fire lanes a footprint at this spot would cut.
function lanesCut(s,candidate){let cut=0;for(const f of [...s.units.filter(u=>u.team===ME&&u.x!==null&&u.role==='missile'),...myMachines(s).filter(c=>c.x!==null)])for(const t of s.units.filter(t=>t.team===THEM&&t.x!==null)){const a={x:f.x,y:f.y},b={x:t.x,y:t.y};if(!blocked(s,a,b,[f.id,t.id])&&G.polygonGap([a,b],G.corners(candidate))<1e-6)cut++;}return cut;}
function tryPlace(s,u,x,y){try{G.placeAt(s,u.id,x,y);return true;}catch{return false;}}
// A regiment with no enemy in its front arc turns toward the one it answers (15° steps), when it still fits.
function faceEnemy(s,u,t){if(!t||t.x===null||G.inVisionArc(u,t))return;const h=Math.round(Math.atan2(t.x-u.x,-(t.y-u.y))*180/Math.PI/15)*15;try{G.turnDeployed(s,u.id,(h+360)%360);}catch{}}
const nearestFoe=(s,u)=>s.units.filter(t=>t.team!==u.team&&t.x!==null&&!G.isCharacter(t)).sort((a,b)=>G.gap(u,a)-G.gap(u,b))[0];
// Place at the best-scoring legal spot. For each point along the zone the candidate is the
// front-most (band 'front') or back-most (band 'back') spot that fits there.
function placeBest(s,u,band,score){
 const zf=deployFrame(s),{h}=G.size(u),front=zf.d1-h/2-.01,back=zf.d0+h/2+.01,steps=Math.max(0,Math.floor((front-back)*2)),depths=Array.from({length:steps+1},(_,k)=>band==='back'?back+k/2:front-k/2),options=[];
 for(let l=zf.l0+.5;l<=zf.l1-.5+1e-9;l+=.5)for(const d of depths){const {x,y}=zf.at(l,d);if(G.deployError(s,u,x,y)===null){options.push({x,y,l,d,score:score({...u,x,y})});break;}}
 options.sort((a,b)=>b.score-a.score||(band==='back'?a.d-b.d:b.d-a.d));
 for(const o of options)if(tryPlace(s,u,o.x,o.y))return o;
 throw Error(`No legal deployment space for ${u.id}.`);
}
// War machines stand on the back edge of the zone, where their range still reaches the enemy. A
// random source varies the opening spread; without one the bot deploys the same way every time.
export function deployOpponent(s,random=null){
 if(s.stage!=='deployment')throw Error('The bot can deploy only before the battle.');
 const zf=deployFrame(s),mine=s.units.filter(u=>u.team===ME&&u.x===null),cannons=myMachines(s).filter(c=>c.x===null),foes=s.units.filter(u=>u.team===THEM&&u.x!==null&&u.role!=='wizard');
 const faction=s.units.find(u=>u.team===ME)?.faction;
 const infantry=mine.filter(u=>u.role==='infantry'),missile=mine.filter(u=>u.role==='missile'),wizard=mine.find(u=>u.role==='wizard');
 const reach=u=>G.missileWeapon(u).range+G.profile(u).M+2,slot=f=>zf.l0+(zf.l1-zf.l0)*f,across=p=>zf.across(p);
 const line=()=>s.units.filter(u=>u.team===ME&&u.x!==null&&!G.isCharacter(u)),middle=()=>{const l=line();return l.length?l.reduce((n,u)=>n+across(u),0)/l.length:slot(.5);};
 const mix=list=>random?list.map(v=>[random(),v]).sort((a,b)=>a[0]-b[0]).map(([,v])=>v):list;
 if(!foes.length){
  // Nothing to react to yet: an even spread along the front, the cannons on the back edge's flanks.
  const slots=mix([.25,.5,.75,.89]).map(f=>f+(random?(random()-.5)*.08:0));
  for(const [u,f]of [...infantry,...missile].map((u,i)=>[u,slots[i%4]]))placeBest(s,u,'front',p=>-Math.abs(across(p)-slot(f)));
  for(const [c,f]of cannons.map((c,i)=>[c,mix([.11,.89])[i%2]]))placeBest(s,c,'back',p=>-Math.abs(across(p)-slot(f)));
 }else{
  // The enemy blocks to oppose: the Decimators (or whatever shoots) first, then the regiments nearest to them.
  const soft=foes.find(u=>u.role==='missile')??foes[0],opposite=[soft,...foes.filter(u=>u!==soft).sort((a,b)=>Math.abs(across(a)-across(soft))-Math.abs(across(b)-across(soft)))];
  const claimed=new Set(),oppose=()=>{const target=opposite.find(t=>!claimed.has(t.id))??opposite[0];claimed.add(target.id);return target;};
  if(faction==='empire'){
   // A gun line: cannons on the back edge with the most clear shots and some spacing, crossbows at
   // the front where they see most, State Troops facing the enemy without blocking a fire lane.
   for(const c of cannons){const others=()=>myMachines(s).filter(o=>o.x!==null&&o.id!==c.id);placeBest(s,c,'back',p=>shots(s,p,60)+Math.min(12,...others().map(o=>Math.abs(across(o)-across(p))),12)*.05+(random?random()*.3:0));}
   for(const u of missile){placeBest(s,u,'front',p=>shots(s,p,reach(u))-3*lanesCut(s,p));faceEnemy(s,u,nearestFoe(s,u));}
   for(const u of infantry){const target=oppose();placeBest(s,u,'front',p=>-Math.abs(across(p)-across(target))*.3-5*lanesCut(s,p));faceEnemy(s,u,target);}
  }else{
   for(const u of infantry){const target=oppose();placeBest(s,u,'front',p=>-Math.abs(across(p)-across(target)));faceEnemy(s,u,target);}
   for(const u of missile){placeBest(s,u,'front',p=>shots(s,p,reach(u))-Math.abs(across(p)-slot(.5))*.01);faceEnemy(s,u,nearestFoe(s,u));}
   for(const c of cannons)placeBest(s,c,'back',p=>shots(s,p,60));
  }
 }
 // Characters behind the middle of the line, out of the fire lanes; the wizard tucked behind a regiment.
 for(const hero of mine.filter(u=>u.role==='character'))placeBest(s,hero,'back',p=>-Math.abs(across(p)-middle())-5*lanesCut(s,p));
 if(wizard)placeBest(s,wizard,'back',p=>-Math.abs(across(p)-middle())-5*lanesCut(s,p)+(line().some(u=>Math.abs(across(u)-across(p))<G.size(u).w/2)?2:0));
}

// ---- Battle March setup: roll-off choices and one unit at a time ----------------------------
// The bot lets the player deploy first (so each of its placements answers one of theirs) and
// takes the first turn when it wins that roll-off.
export function deploymentChoice(s){
 const d=s.deployOrder;if(s.stage!=='deployment'||!d?.alternate)return null;
 if(!d.zonesChosen&&G.deploymentZoneChooser(s)===ME)return 'zone';
 if(d.rollOff&&!d.first&&d.rollOff.winner===ME)return 'deploy-order';
 if(s.firstTurn&&!s.firstTurn.chosen&&s.firstTurn.winner===ME)return 'first-turn';
 if(G.deploymentTurn(s)===ME)return 'deploy';
 return null;
}
export function takeDeploymentStep(s,random=null){
 const choice=deploymentChoice(s);
 // Red set up the map, so the bot picks a zone (either, at random when it has a random source).
 if(choice==='zone'){const zone=random?(random()<.5?'A':'B'):'A';G.chooseDeploymentZone(s,ME,zone);return {message:`Red chose the map, so the bot chooses a zone: it takes ${zone==='A'?'zone A':'zone B'}.`,zone};}
 if(choice==='deploy-order'){G.chooseDeploymentOrder(s,ME,THEM);return {message:'The bot won the deployment roll-off and has you deploy first.'};}
 if(choice==='first-turn'){G.chooseFirstTurn(s,ME,ME);return {message:'The bot won the roll-off and takes the first turn.'};}
 if(choice==='deploy'){const out=deployNext(s,random),names=(out.ids??[out.id]).map(id=>G.getUnit(s,id).name);return {message:`The bot deploys ${names.join(' and ')}.`,id:out.id,...out};}
 return null;
}
// The bot plans its whole remaining deployment against what is on the table now, then places
// the first unit of that plan: war machines and shooters first for a gun line, blocks first
// otherwise, characters and wizards last.
const PLAN_ORDER={empire:['warmachine','missile','infantry','character','wizard'],other:['infantry','missile','warmachine','character','wizard']};
export function deployNext(s,random=null){
 if(G.deploymentTurn(s)!==ME)throw Error('It is not the bot’s turn to deploy.');
 const trial=structuredClone(s);trial.deployOrder.auto=true;
 for(const p of G.deploymentPieces(trial,ME))if(!p.deployed){p.x=null;p.y=null;}
 try{deployOpponent(trial,random);}catch{}
 const order=PLAN_ORDER[s.units.find(u=>u.team===ME)?.faction==='empire'?'empire':'other'];
 for(const p of G.deploymentPieces(s,ME).filter(p=>!p.deployed).sort((a,b)=>order.indexOf(a.role)-order.indexOf(b.role))){
  const planned=G.getUnit(trial,p.id);if(planned?.x==null)continue;
  try{G.placeAt(s,p.id,planned.x,planned.y);if(planned.heading!==p.heading)try{G.turnDeployed(s,p.id,planned.heading);}catch{}}catch{continue;}
  // The rest of its batch (all war machines, or all characters) goes where the plan put them;
  // anything that no longer fits is placed by quick deployment, which then confirms the batch.
  for(const id of s.deployOrder.batch?.ids??[]){const q=G.getUnit(s,id),pl=G.getUnit(trial,id);if(q.x===null&&pl?.x!=null)try{G.placeAt(s,id,pl.x,pl.y);if(pl.heading!==q.heading)try{G.turnDeployed(s,id,pl.heading);}catch{}}catch{}}
  return G.autoDeploy(s,{team:ME,random});
 }
 return G.autoDeploy(s,{team:ME,random});
}

export function humanDecision(s){
 if(s.pendingSpell&&G.getUnit(s,s.pendingSpell.caster)?.team===ME)return {id:s.pendingSpell.caster,kind:'dispel',message:`Choose how to dispel ${G.SPELLS[s.pendingSpell.key].name}.`};
 // At the player's wizard's Initiative step in a combat: cast an Assailment or fight on.
 const wizard=G.assailmentWaiting(s,THEM)[0];
 if(wizard)return {id:wizard.id,kind:'assailment',message:`${wizard.id} fights at Initiative ${s.combatSession.groups[s.combatSession.step]}: cast an Assailment, or fight on without one.`};
 // Charge reactions are chosen once every charge has been declared.
 const charge=s.movementStep==='reactions'?s.units.find(u=>u.team===ME&&u.charge?.status==='declared'&&u.charge.reaction==='pending'):null;
 if(charge)return {id:charge.charge.target,kind:'reaction',message:`Choose a reaction for ${charge.charge.target} against ${charge.id}.`};
 const p=s.pendingCombat;
 if(p?.stage==='loser-choice'&&G.getUnit(s,p.loser).team===THEM)return {id:p.loser,kind:'shieldwall',message:`Choose ${p.loser}'s Shieldwall or Fall Back.`};
 if(p?.stage==='declare'&&G.getUnit(s,p.winner).team===THEM)return {id:p.winner,kind:'declare',message:`Declare ${p.winner}'s pursuit or restraint before the losers move.`};
 if(p?.stage==='winner-choice'&&!p.declarations?.[p.winner]&&G.getUnit(s,p.winner).team===THEM)return {id:p.winner,kind:'aftermath',message:`Choose ${p.winner}'s overrun or restraint.`};
 return null;
}

// The computer resolves every combat-aftermath step that belongs to its own regiment,
// including when the player's turn produced the combat.
export function combatDecision(s){
 const p=s.pendingCombat;if(s.stage!=='combat'||!p)return null;
 // A pursuit declared before the losers moved is carried out without a further choice, whoever owns it.
 if(p.stage==='winner-choice'&&p.declarations?.[p.winner])return p.stage;
 const owner=['break','loser-choice','retreat'].includes(p.stage)?p.loser:['winner-choice','declare'].includes(p.stage)?p.winner:null;
 return G.getUnit(s,owner)?.team===ME?p.stage:null;
}

function resolveCombatDecision(s,random){
 const p=s.pendingCombat;
 if(p.stage==='break'){const out=G.rollCombatBreak(s,random);return {message:`${p.loser} ${out.outcome.replace('-',' ')} (${out.dice.join('+')}).`};}
 if(p.stage==='loser-choice'){G.chooseLoserAction(s,p.shieldwallAvailable?'shieldwall':'fall-back');return {message:`${p.loser} chooses ${p.loserChoice}.`};}
 if(p.stage==='retreat'){const out=G.moveCombatLoser(s,random);return {message:`${out.loser} retreats ${out.distance.toFixed(1)}″.`};}
 // The bot pursues the unit it can do most harm to: broken units first.
 // A winner holding an objective stays on it (it tests to restrain) unless the loser is worth more.
 if(p.stage==='declare'){const w=G.getUnit(s,p.winner),loser=G.getUnit(s,p.loser),stay=!G.hasRule(w,'frenzy')&&s.objectives&&holdsObjective(s,w)&&heldValue(s,w)>=.5*points(loser);const out=G.declarePursuit(s,p.winner,stay?'restrain':'follow',null,random);if(stay)return {message:`${out.winner} ${out.restraint?.passed===false?'fails to restrain and pursues':'stays on its objective'}.`};return {message:`${out.winner} will ${out.outcome==='give-ground'?'follow up':'pursue'} ${out.target}.`};}
 const out=G.winnerCombat(s,'follow',random);return {message:`${out.winner} ${out.outcome==='overrun'?'overruns':out.outcome==='break'?'pursues':'follows up'}.`};
}

export function shouldAct(s){
 if(s.stage==='deployment'||s.stage==='finished')return false;
 if(s.pendingSpell)return G.getUnit(s,s.pendingSpell.caster)?.team===THEM;
 if(s.team===ME)return !humanDecision(s);
 return s.stage==='movement'&&s.movementStep==='reactions'&&s.units.some(u=>u.team===THEM&&u.charge?.status==='declared'&&u.charge.reaction==='pending'&&G.getUnit(s,u.charge.target)?.team===ME)||!!combatDecision(s)||G.assailmentWaiting(s,ME).length>0;
}

function moveRegiment(s,u,random){
 s.selected=u.id;
 const foe=nearest(s,u);if(!foe)return endMove(s,u,`${u.id} holds position.`,random);
 const goal=chooseGoal(s,u,foe),virtual={...s,stage:'shooting',team:ME};
 if(u.role==='missile'&&(goal.kind!=='objective'||goal.dist(u)<=BM.CONTROL_RANGE)&&G.canShoot(virtual,u)&&G.shootingTargets(virtual,u).some(t=>!t.plan.error))return endMove(s,u,`${u.id} holds for a clear shot.`,random);
 if(goal.kind==='objective'&&goal.dist(u)<=.05)return endMove(s,u,`${u.id} holds ${goal.name}.`,random);
 if(goal.kind==='support'&&goal.dist(u)<=1)return endMove(s,u,`${u.id} stays behind the line.`,random);
 // A unit with Fly (Steed of Shadows) flies: further, over anything in the way, and it may march
 // near the enemy without a test.
 const fly=G.flyValues(u)[0],medium=u.movementMedium??(fly?'fly':'ground');
 const separation=goal.dist(u),wantMarch=(goal.kind==='enemy'?u.role!=='missile'&&separation>14:separation>G.moveValue(u,medium)+.5)&&(medium==='fly'||u.marchTest!==false),mode=u.movementMode??(wantMarch?'march':'advance');
 if(mode==='march'&&medium!=='fly'&&G.needsMarchTest(s,u)&&u.marchTest===null){const dice=roll(random),passed=G.marchTest(s,u.id,dice,random);return {message:`${u.id} march test ${passed?'passed':'failed'} (${dice.join('+')}).`};}
 const best=bestOrder(s,u,goal,mode,medium)??(mode==='march'?bestOrder(s,u,goal,'advance',medium):null);
 if(best){G.commitOrder(s,u.id,best.order,random);return {message:`${u.id} ${describeOrder(best.order)} toward ${goal.name}.`};}
 return endMove(s,u,`${u.id} holds position.`,random);
}
// A unit that ends its move on a treasure trove may start burning it (Raid & Burn, when on):
// worth it once holding the trove for the rest of the battle would score less than 30 VP.
function endMove(s,u,message,random=Math.random){
 const trove=BM.raidOptions(s,u)[0];
 if(trove&&raidWorthIt(s)){BM.startRaid(s,u.id,trove.id);return {message:`${u.id} starts to burn ${trove.name} (Raid & Burn).`};}
 G.hold(s,u.id,random);return {message};
}
function raidWorthIt(s){const rounds=s.format?.rounds;if(!rounds||s.round>=rounds)return false;const turnEnds=2*(rounds-s.round)+(s.firstPlayer===s.team?2:1);return BM.RAID_VP>BM.OBJECTIVE_VP.trove*(turnEnds-2);}
const enemyGoal=t=>({kind:'enemy',name:t.id,x:t.x,y:t.y,face:t,dist:p=>G.gap(p,t)});
function chooseGoal(s,u,foe){
 // Characters (and the wizard) keep behind the line in every format; with no line to keep
 // behind, they stay where they are, out of reach.
 if(G.isCharacter(u))return supportGoal(s,u,foe)??{kind:'support',name:'its ground',x:u.x,y:u.y,face:foe,dist:p=>Math.hypot(p.x-u.x,p.y-u.y)};
 if(!s.objectives)return enemyGoal(foe);
 const obj=stickyPlan(s).get(u.id);
 return obj?{kind:'objective',name:obj.name,x:obj.x,y:obj.y,face:foe,dist:p=>BM.objectiveDistance(p,obj)}:enemyGoal(foe);
}
// Battle March: objectives, the landmark first, go to the nearest bot units that can control them
// and still reach them before the battle ends; the rest of the army fights.
// The objectives are shared out once at the start of each of the bot's Movement phases, so a
// unit does not turn from one objective to another between its own steps.
function stickyPlan(s){const m=recall(s),key=`${s.round}:${s.team}`;if(m.planKey!==key||!m.planCache){m.planKey=key;m.planCache=objectivePlan(s);}for(const [id,o]of m.planCache)if(o.removed||!alive(G.getUnit(s,id)))m.planCache.delete(id);return m.planCache;}
function objectivePlan(s){
 const plan=new Map(),turns=Math.max(1,(s.format?.rounds??5)-s.round+1),free=s.units.filter(u=>u.team===ME&&!G.isCharacter(u)&&BM.canControl(u)&&!u.engaged),pairs=[];
 for(const o of s.objectives.items.filter(o=>!o.removed))for(const u of free){const d=BM.objectiveDistance(u,o);if(d<=turns*2*G.profile(u).M+BM.CONTROL_RANGE)pairs.push({u,o,score:d-(o.kind==='landmark'?4:0)});}
 const units=new Set(),objectives=new Set();
 for(const p of pairs.sort((a,b)=>a.score-b.score)){if(units.has(p.u.id)||objectives.has(p.o.id))continue;plan.set(p.u.id,p.o);units.add(p.u.id);objectives.add(p.o.id);}
 return plan;
}
function holdsObjective(s,u){return !!s.objectives?.items.some(o=>!o.removed&&BM.controlOf(s,o).unit===u.id);}
// Characters (the General is worth 50 VP to the enemy) keep a few inches behind the friendly
// block nearest the enemy, where they stay in spell range but out of the way of charges.
function supportGoal(s,u,foe){
 const line=s.units.filter(v=>v.team===u.team&&v.id!==u.id&&!G.isCharacter(v)&&alive(v)&&!v.fleeing);if(!line.length)return null;
 const anchor=line.sort((a,b)=>G.gap(a,foe)-G.gap(b,foe))[0],dx=anchor.x-foe.x,dy=anchor.y-foe.y,len=Math.hypot(dx,dy)||1,back=G.size(anchor).h/2+G.size(u).h/2+2.5;
 const x=Math.max(1,Math.min(s.board.width-1,anchor.x+dx/len*back)),y=Math.max(1,Math.min(s.board.height-1,anchor.y+dy/len*back));
 return {kind:'support',name:'a place behind '+anchor.id,x,y,face:foe,dist:p=>Math.hypot(p.x-x,p.y-y)};
}
// Try a spread of legal orders (advances, wheels either way with an advance, a reform toward the
// goal, and short side steps) and take the one that ends closest to the goal, facing the enemy
// best. A unit blocked in one direction therefore finds another way instead of holding.
function bestOrder(s,u,goal,mode,medium='ground'){
 if(u.movementMode&&u.movementMode!==mode)return null;
 const left=G.movementRemaining(u,mode,medium);if(left<.25)return null;
 const target=goal.face??goal,facingError=p=>{const want=G.normalize(Math.atan2(target.x-p.x,-(target.y-p.y))*180/Math.PI);return Math.abs(((want-G.heading(p)+540)%360)-180);};
 // A spot is judged by how near it brings the unit to its goal, how well it faces the enemy, and
 // the fights it invites or threatens next turn (a character weighs danger twice over).
 const care=(G.isCharacter(u)?2:1)*INCH_PER_POINT,near=p=>-goal.dist(p)-(goal.kind==='enemy'?.03:.01)*facingError(p),score=p=>near(p)+care*danger(s,u,p)+.5*INCH_PER_POINT*promise(s,u,p),steps=d=>[d,d*.75,d*.5,d*.25].filter(x=>x>=.25),orders=[];
 for(const d of steps(left))orders.push({kind:'advance',distance:d,angle:0,mode});
 for(let a=-40;a<=40;a+=10){if(!a)continue;const cost=G.wheelCost(a,u);if(cost>=left-.05)continue;orders.push({kind:'wheel',angle:a,distance:0,mode});for(const d of steps(left-cost))orders.push({kind:'wheel',angle:a,distance:d,mode});}
 if((u.spent??0)===0&&mode==='advance'&&facingError(u)>60)orders.push({kind:'pivot',angle:Math.round(((G.normalize(Math.atan2(target.x-u.x,-(target.y-u.y))*180/Math.PI)-G.heading(u)+540)%360)-180),distance:0,mode:'advance'});
 for(const side of [-1,1])for(const d of [1,2].filter(d=>2*d<=left))orders.push({kind:'side',side,distance:d,angle:0,mode});
 // Toward a goal behind or beside the unit (an objective, a place behind the line): reform to
 // face it, or step back.
 if(goal.kind!=='enemy'){if((u.spent??0)===0&&mode==='advance'){const toward=Math.round(((G.normalize(Math.atan2(goal.x-u.x,-(goal.y-u.y))*180/Math.PI)-G.heading(u)+540)%360)-180);if(Math.abs(toward)>60)orders.push({kind:'pivot',angle:toward,distance:0,mode:'advance'});}for(const d of [1,2,3].filter(d=>2*d<=left))orders.push({kind:'back',distance:d,angle:0,mode});}
 for(const o of orders)o.medium=medium;
 // Every legal order is ranked by its goal first; the fights it invites are weighed for the best few.
 const legal=orders.filter(o=>!(o.kind==='pivot'&&!o.angle)&&!G.orderError(s,u,o)).map(order=>{const end=G.planMove(u,order).end;return {order,end,first:near(end)};}).sort((a,b)=>b.first-a.first).slice(0,8);
 const now=score(u);let best=null;
 for(const {order,end}of legal){const val=score(end);if(!best||val>best.val)best={order,val};}
 return best&&best.val>now+.05?best:null;
}
function describeOrder(o){return o.kind==='pivot'?'reforms':o.kind==='side'?`steps ${o.distance}″ ${o.side<0?'left':'right'}`:o.kind==='wheel'?`wheels ${Math.abs(o.angle)}° ${o.angle<0?'left':'right'}${o.distance?' and '+(o.mode==='march'?'marches':'advances')+' '+Math.round(o.distance*10)/10+'″':''}`:`${o.mode==='march'?'marches':'advances'} ${Math.round(o.distance*10)/10}″`;}

// A spell is dispelled when letting it through would cost the bot enough: its effect is played
// out on copies of the battle (lasting spells are judged by what they do). A Wizardly Dispel is
// tried for anything that matters; the side's one Fated Dispel is kept for spells that hurt.
function spellHarm(s){
 const p=s.pendingSpell,key=p.key,spell=G.SPELLS[key];let harm=0;
 for(let i=0;i<6;i++){const c=structuredClone(s);try{G.resolveDispel(c,'none',seeded(i+11));harm+=-swing(s,c)/6;}catch{}}
 const lasting={arrow:6,shield:5,ashStorm:8,urgency:8,darkness:12,vessel:10,vigour:10,steed:10,pillar:15,vortexChaos:15,stormCall:8,plagueRust:10,ramparts:10,pathway:8,elementalSpirit:15,wordOfPain:12,gateway:8,phantasmagoria:15,battleLust:12};
 return harm+(lasting[key]??(spell.type==='assailment'?8:0));
}
function aiDispel(s,random){
 const options=G.dispelOptions(s),wizard=[...options.wizards].sort((a,b)=>b.bonus-a.bonus)[0],harm=spellHarm(s),choice=wizard&&harm>=3?wizard.id:options.fated&&harm>=12?'fated':'none';
 const out=G.resolveDispel(s,choice,random),name=G.SPELLS[out.spell].name;
 if(!out.dispel)return {message:`The bot lets ${name} through.`};
 return {message:`${out.dispel.kind==='fated'?'Fated Dispel':out.dispel.by+' tries to dispel'}: ${out.dispel.dice.join('+')} = ${out.dispel.total} vs ${out.casting} · ${out.dispel.success?name+' dispelled':name+' takes effect'}${out.dispel.miscast?' · '+out.dispel.miscast.kind:''}.`,roll:{label:`${out.dispel.by??options.caster} · ${out.dispel.kind==='fated'?'Fated Dispel':'Dispel'}`,dice:out.dispel.dice,team:ME},report:out,spell:true,point:G.getUnit(s,out.target)};
}
export function takeStep(s,random=Math.random){
 if(!shouldAct(s))return {message:'Waiting for the player.',wait:true};
 if(s.pendingSpell)return aiDispel(s,random);
 if(s.team===THEM){
  if(s.stage==='combat'){if(combatDecision(s))return resolveCombatDecision(s,random);const cast=aiSpell(s,random);if(cast)return cast;return {message:'Waiting for the player.',wait:true};}
  // One reaction answers every charge on a unit: Stand & Shoot at the strongest charger it can
  // shoot when none of them is too close, otherwise Hold (a fleeing unit must Flee).
  const charger=s.units.find(u=>u.team===THEM&&u.charge?.status==='declared'&&u.charge.reaction==='pending'&&G.getUnit(s,u.charge.target)?.team===ME);
  const defender=G.getUnit(s,charger.charge.target),chargers=s.units.filter(u=>u.charge?.status==='declared'&&u.charge.target===defender.id),tooClose=!!G.standShootTooClose(s,defender,chargers);
  const shooter=defender.fleeing||tooClose?null:chargers.filter(v=>v.charge.reaction==='pending'&&G.canStandShoot(s,defender,v)).sort((a,b)=>G.unitStrength(b)-G.unitStrength(a))[0];
  const choice=defender.fleeing?'flee':shooter?'stand-shoot':'hold',at=shooter??charger,point={x:at.x,y:at.y},out=G.chargeReaction(s,at.id,choice,random);
  return {message:`${defender.id} chooses ${choice==='stand-shoot'?'Stand & Shoot':choice}${choice==='stand-shoot'&&chargers.length>1?' at '+at.id:''}.`,report:out.report,point};
 }
 // The bot's wizard casts its Assailment when it fights, in either player's turn.
 if(G.assailmentWaiting(s,ME).length){const cast=aiSpell(s,random);if(cast)return cast;}
 const decision=humanDecision(s);if(decision)return {...decision,wait:true};
 if(s.stage==='strategy'){
  const u=s.units.find(u=>u.team===ME&&u.x!==null&&u.fleeing&&!u.rallyAttempted);
  if(u){s.selected=u.id;const out=G.rally(s,u.id,random);return {message:`${u.id} ${out.success?'rallies':'fails to rally'} (${out.dice.join('+')}).`};}
  const cast=aiSpell(s,random);if(cast)return cast;
  const unbind=dispelVortices(s,random);if(unbind)return unbind;
  G.nextPhase(s,random);return {message:'The bot begins Movement.'};
 }
 if(s.stage==='movement'&&s.movementStep==='reactions'){G.finishReactions(s,random);return {message:'Every charged unit has reacted.'};}
 if(s.stage==='movement'&&s.movementStep==='declare'){

  for(const u of s.units.filter(u=>u.team===ME&&G.canAct(s,u)&&G.isImpetuous(s,u)&&u.impetuousTest===null&&G.availableCharges(s,u).length)){const dice=roll(random),passed=G.impetuousTest(s,u.id,dice);s.selected=u.id;return {message:`${u.id} Impetuous test ${passed?'passed':'failed'} (${dice.join('+')}).`};}
  // Charges are weighed by playing the fights out (see chargeChoices); a Frenzied unit must charge.
  const options=chargeChoices(s).sort((a,b)=>b.ev-a.ev),best=options.find(o=>o.must)??options.find(o=>worthCharging(o));
  if(best){const {u,t}=best;s.selected=u.id;G.declareCharge(s,u.id,t.id);return {message:`${u.id} charges ${t.id}. Choose a reaction.`,judged:{ev:Math.round(best.ev),chance:Math.round(best.p*100)}};}
  G.finishDeclarations(s,random);return {message:'The bot finishes charge declarations.'};
 }
 if(s.stage==='movement'&&s.movementStep==='charges'){
  const u=s.units.find(u=>u.team===ME&&u.charge?.status==='declared');if(u){s.selected=u.id;const target=G.getUnit(s,u.charge.target),plan=target?.x!==null?G.chargePlan(s,u,target):{error:true},first=roll(random),reroll=u.faction==='orc'&&!plan.error&&G.profile(u).M+Math.max(...first)<plan.cost,dice=reroll?roll(random):first,out=G.resolveCharge(s,u.id,dice,random);return {message:`${u.id} ${out.success?'charge succeeds':out.pursuit?'pursues fleeing target':'charge fails'} (${reroll?'Warband reroll · ':''}${dice.join(', ')}).`,roll:{label:`${u.id} · Charge roll · keep highest`,dice,team:ME}};}
  G.enterRemaining(s,random);return {message:'The bot begins remaining moves.'};
 }
 if(s.stage==='movement'){
  const u=s.units.find(u=>u.team===ME&&G.canAct(s,u));if(u)return moveRegiment(s,u,random);
  const cast=aiSpell(s,random);if(cast)return cast;
  G.nextPhase(s,random);return {message:`The bot begins ${s.stage}.`};
 }
 if(s.stage==='shooting'){
  const cast=aiSpell(s,random);if(cast)return cast;
  // Each shooter fires at the target where its volley is worth the most, played out.
  const choices=s.units.filter(u=>u.team===ME&&G.canShoot(s,u)).flatMap(u=>G.shootingTargets(s,u).filter(t=>!t.plan.error).map(t=>({u,t,value:shotValue(s,u,t.unit)}))).sort((a,b)=>b.value-a.value||a.t.plan.distance-b.t.plan.distance);
  if(choices.length){const {u,t}=choices[0],point={x:t.unit.x,y:t.unit.y};s.selected=u.id;const report=G.shoot(s,u.id,t.unit.id,random);return {message:`${u.id} fires at ${t.unit.id}: ${report.unsaved} slain.`,report,point};}
  // Playing Red, the Deathshrieker fires at the nearest target it can reach (direct fire when it can see).
  if(ME==='ash'&&G.canFireRocket(s)){const targets=G.rocketTargets(s).filter(t=>!t.error);const direct=targets.filter(t=>!G.rocketPlan(s,t.unit).error),indirect=G.rocketTargets(s,{indirect:true}).filter(t=>!t.error),pick=(direct.length?direct:indirect).sort((a,b)=>a.distance-b.distance)[0];
   if(pick){const positions=new Map(s.units.filter(alive).map(u=>[u.id,{x:u.x,y:u.y}])),report=G.fireRocket(s,pick.unit.id,G.aliveCount(pick.unit)>=10?'incendiary':'demolition',G.rollRocketDice(random),random,{indirect:!direct.length});return {message:`The Deathshrieker fires: ${report.unsaved} slain.`,report,positions,artillery:true};}}
  for(const c of ME==='iron'?s.cannons:[]){if(!G.canFireCannon(s,c.id))continue;const grape=G.cannonTargets(s,c.id,{mode:'grape'}).filter(t=>!t.error),ball=G.cannonTargets(s,c.id,{mode:'ball',aimShort:6}).filter(t=>!t.error),targets=grape.length?grape:ball;
   if(!targets.length)continue;const mode=grape.length?'grape':'ball',target=targets.map(t=>({...t,value:cannonValue(s,c,t.unit,mode)})).sort((a,b)=>b.value-a.value||a.distance-b.distance)[0],positions=new Map(s.units.filter(alive).map(u=>[u.id,{x:u.x,y:u.y}]));const report=G.fireCannon(s,c.id,target.unit.id,mode,G.rollCannonDice(random),random,{aimShort:6});return {message:`${c.name} fires ${mode==='grape'?'grapeshot':'a cannonball'}: ${report.unsaved} slain.`,report,positions,artillery:true};}
  G.nextPhase(s,random);return {message:'The bot begins Combat.'};
 }
 if(s.stage==='combat'){
  const cast=aiSpell(s,random);if(cast)return cast;
  if(s.pendingCombat)return resolveCombatDecision(s,random);
  if(s.combatSession?.phase==='attacks'){const out=G.fightCombatStep(s,random);return {message:`Initiative ${out.initiative}: ${out.stages.reduce((n,x)=>n+x.unsaved,0)} slain.`};}
  if(s.combatSession?.phase==='compare'){const out=G.compareCombat(s,random);return {message:out.winner?`${out.winner} wins combat.`:'Combat is a draw.'};}
  const pair=G.combatPairs(s)[0];if(pair){const id=pair.find(id=>G.getUnit(s,id).team===ME)??pair[0];s.selected=id;
   // A bot unit fighting several enemies aims its spare attacks at the one closest to destruction.
   for(const u of pair.map(i=>G.getUnit(s,i)).filter(u=>u.team===ME)){const foes=G.opponents(s,u);if(foes.length>1)u.combatFocus=foes.sort((a,b)=>G.remainingWounds(a)-G.remainingWounds(b))[0].id;}
   G.beginCombat(s,id);return {message:`${pair.join(pair.length>2?', ':' fights ')}${pair.length>2?' fight one combat':''}: initiative order shown.`};}
  G.nextPhase(s,random);return {message:'The bot ends its turn.'};
 }
 return {message:'Waiting for the player.',wait:true};
}

// The bot casts the spell and target worth most: damage and flight played out, lasting spells by
// what they are for; spells with nothing to gain are not cast.
function spellValue(s,w,key,target,point){
 const spell=G.SPELLS[key];
 if(spell.type==='assailment')return 20;
 if(key==='shield')return w.engaged||danger(s,w,w)<-20?10:3;
 if(key==='ashStorm')return s.units.some(t=>t.team===THEM&&t.role==='missile'&&alive(t)&&Math.hypot(t.x-w.x,t.y-w.y)<=9)?8:1;
 if(key==='arrow')return s.units.some(u=>u.team===ME&&u.role==='missile'&&alive(u))||ME==='iron'&&s.cannons.some(c=>c.x!==null)?6:1;
 if(key==='urgency')return target.id===w.id?0:6;
 if(key==='vessel')return w.engaged?12:0;
 if(key==='vigour')return target.engaged?0:s.units.some(t=>t.team===THEM&&alive(t)&&G.gap(target,t)<=G.profile(target).M+7)?8:1;
 if(key==='darkness')return target.engaged?12:6;
 if(key==='steed')return 6;
 // Elementalism and Dark Magic, by what they are for. The bot does not plan relocations yet.
 if(key==='stormCall')return target.engaged?4:6;
 if(key==='plagueRust')return target.engaged||s.units.some(u=>u.team===ME&&u.role==='missile'&&alive(u))?9:4;
 if(key==='wordOfPain')return target.engaged?12:6;
 if(key==='ramparts')return target.engaged?0:danger(s,target,target)<-20?10:2;
 if(key==='battleLust')return target.role==='infantry'&&!target.engaged&&s.units.some(t=>t.team===THEM&&alive(t)&&!t.fleeing&&G.gap(target,t)<=G.profile(target).M+6)?8:0;
 if(G.SPELLS[key].relocate)return 0;
 if(spell.template)return point?10:0;
 let v=0;for(let i=0;i<6;i++){const c=structuredClone(s);try{G.castSpell(c,w.id,key,target.id,seeded(i+21),{point,dispel:'none'});v+=swing(s,c)/6;}catch{}}
 return v;
}
function aiSpell(s,random){const wizard=s.units.find(u=>u.team===ME&&u.role==='wizard'&&alive(u));if(!wizard)return null;let pick=null;for(const key of wizard.spells){const spell=G.SPELLS[key];if(G.castBlockReason(s,wizard.id,key))continue;const point=spell.template?templatePoint(s,wizard,key):null;if(spell.template&&!point)continue;for(const t of G.spellTargets(s,wizard.id,key)){const value=spellValue(s,wizard,key,t,point);if(value>1&&(!pick||value>pick.value))pick={key,spell,target:t,point,value};}}
 if(!pick)return null;const {key,spell,target,point}=pick;{const report=G.attemptSpell(s,wizard.id,key,target.id,random,{point});s.selected=wizard.id;return {message:`${wizard.name} casts ${spell.name}: ${report.dice.join('+')} = ${report.casting} · ${report.pending?'cast — choose a dispel':report.cast?'cast':'failed'}.`,roll:{label:`${wizard.id} · ${spell.name} casting`,dice:report.dice,team:ME},spell:true,report,point:point??{x:target.x,y:target.y}};}return null;}
// A legal centre for a template spell, as near the closest enemy as the rules allow: along the
// line to it, then a little to either side; null when none is legal.
function templatePoint(s,wizard,key){const spell=G.SPELLS[key],foe=nearest(s,wizard);if(!foe)return null;const d=distance(wizard,foe);if(!d)return null;const ux=(foe.x-wizard.x)/d,uy=(foe.y-wizard.y)/d;
 for(let along=Math.min(d,spell.range+.5);along>=spell.template+.6;along-=.5)for(const side of [0,1.5,-1.5,3,-3]){const p={x:wizard.x+ux*along-uy*side,y:wizard.y+uy*along+ux*side};if(!G.templatePlacementError(s,wizard.id,key,p))return p;}
 return null;}
