import * as G from './game.mjs';
import * as BM from './battlemarch.mjs';

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
export function readyToDeploy(s){if(s.deployOrder?.alternate)return !!deploymentChoice(s);return s.stage==='deployment'&&s.units.filter(u=>u.team==='ash').every(u=>u.x!==null)&&(s.rocket.x!==null||s.rocket.absent)&&(s.units.some(u=>u.team==='iron'&&u.x===null)||s.cannons.some(c=>c.x===null));}
// Candidate spots come from the bot's actual deployment zone on the current battlefield.
const candidateXs=s=>{const b=G.zoneBounds(s,'iron');return Array.from({length:Math.max(1,Math.floor(b.right-b.left)-1)},(_,i)=>b.left+1+i);};
const frontRow=(s,u)=>G.zoneBounds(s,'iron').bottom-G.size(u).h/2-.01,backRow=(s,u)=>G.zoneBounds(s,'iron').top+G.size(u).h/2+.01;
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
 const mid=s.board.width/2,z=G.zoneBounds(s,'iron'),h=G.size(u).h,rows=[row,(z.top+z.bottom)/2,z.top+h/2+.01,z.bottom-h/2-.01].filter((y,i,a)=>a.indexOf(y)===i);
 for(const y of rows){const options=candidateXs(s).map(x=>({x,y,score:score(pose(u,x,y))})).sort((a,b)=>b.score-a.score||Math.abs(a.x-mid)-Math.abs(b.x-mid));for(const o of options)if(tryPlace(s,u,o.x,o.y))return o;}
 throw Error(`No legal deployment space for ${u.id}.`);
}
// War machines stand on the back edge of the zone, where their range still reaches the enemy. A
// random source varies the opening spread; without one the bot deploys the same way every time.
export function deployOpponent(s,random=null){
 if(s.stage!=='deployment')throw Error('The bot can deploy only before the battle.');
 const mine=s.units.filter(u=>u.team==='iron'&&u.x===null),cannons=s.cannons.filter(c=>c.x===null),foes=s.units.filter(u=>u.team==='ash'&&u.x!==null&&u.role!=='wizard');
 const faction=s.units.find(u=>u.team==='iron')?.faction;
 const infantry=mine.filter(u=>u.role==='infantry'),missile=mine.filter(u=>u.role==='missile'),wizard=mine.find(u=>u.role==='wizard');
 const reach=u=>G.missileWeapon(u).range+G.profile(u).M+2;
 if(!foes.length){
  // Nothing to react to yet: an even spread across the zone.
  const W=s.board.width,mix=list=>random?list.map(v=>[random(),v]).sort((a,b)=>a[0]-b[0]).map(([,v])=>v):list,slots=mix([.25,.5,.75,.89]).map(f=>f+(random?(random()-.5)*.08:0));
  for(const [u,x]of [...infantry,...missile].map((u,i)=>[u,W*slots[i%4]]))placeBest(s,u,frontRow(s,u),p=>-Math.abs(p.x-x));
  for(const [c,x]of cannons.map((c,i)=>[c,W*mix([.11,.89])[i%2]]))placeBest(s,c,backRow(s,c),p=>-Math.abs(p.x-x));
  if(wizard)placeBest(s,wizard,backRow(s,wizard),p=>-Math.abs(p.x-W*.97));return;
 }
 // The enemy blocks to oppose: the Decimators, then the regiments nearest to them.
 const soft=foes.find(u=>u.role==='missile')??foes[0],opposite=[soft,...foes.filter(u=>u!==soft).sort((a,b)=>Math.abs(a.x-soft.x)-Math.abs(b.x-soft.x))];
 const claimed=new Set();
 const oppose=u=>{const target=opposite.find(t=>!claimed.has(t.id))??opposite[0];claimed.add(target.id);return target;};
 if(faction==='empire'){
  for(const c of cannons){const others=()=>s.cannons.filter(o=>o.x!==null&&o.id!==c.id);placeBest(s,c,backRow(s,c),p=>shots(s,p,60)+Math.min(12,...others().map(o=>Math.abs(o.x-p.x)),12)*.05+(random?random()*.3:0));}
  // The crossbows, like the State Troops, keep out of the cannons' fire lanes from the back edge.
  for(const u of missile)placeBest(s,u,frontRow(s,u),p=>shots(s,p,reach(u))-3*lanesCut(s,p));
  for(const u of infantry){const target=oppose(u);placeBest(s,u,frontRow(s,u),p=>-Math.abs(p.x-target.x)*.3-5*lanesCut(s,p));}
 }else{
  for(const u of infantry){const target=oppose(u);placeBest(s,u,frontRow(s,u),p=>-Math.abs(p.x-target.x));}
  for(const u of missile)placeBest(s,u,frontRow(s,u),p=>shots(s,p,reach(u))-Math.abs(p.x-s.board.width/2)*.01);
  for(const c of cannons)placeBest(s,c,backRow(s,c),p=>shots(s,p,60));
 }
 for(const hero of mine.filter(u=>u.role==='character')){const line=s.units.filter(u=>u.team==='iron'&&u.x!==null&&!G.isCharacter(u)),mid=line.reduce((n,u)=>n+u.x,0)/Math.max(1,line.length);placeBest(s,hero,backRow(s,hero),p=>-Math.abs(p.x-mid)-5*lanesCut(s,p));}
 if(wizard){const line=s.units.filter(u=>u.team==='iron'&&u.x!==null&&!G.isCharacter(u)),mid=line.reduce((n,u)=>n+u.x,0)/Math.max(1,line.length);placeBest(s,wizard,backRow(s,wizard),p=>-Math.abs(p.x-mid)-5*lanesCut(s,p)+(line.some(u=>Math.abs(u.x-p.x)<G.size(u).w/2)?2:0));}
}

// ---- Battle March setup: roll-off choices and one unit at a time ----------------------------
// The bot lets the player deploy first (so each of its placements answers one of theirs) and
// takes the first turn when it wins that roll-off.
export function deploymentChoice(s){
 const d=s.deployOrder;if(s.stage!=='deployment'||!d?.alternate)return null;
 if(!d.zonesChosen&&G.deploymentZoneChooser(s)==='iron')return 'zone';
 if(d.rollOff&&!d.first&&d.rollOff.winner==='iron')return 'deploy-order';
 if(s.firstTurn&&!s.firstTurn.chosen&&s.firstTurn.winner==='iron')return 'first-turn';
 if(G.deploymentTurn(s)==='iron')return 'deploy';
 return null;
}
export function takeDeploymentStep(s,random=null){
 const choice=deploymentChoice(s);
 // Red set up the map, so the bot picks a zone (either, at random when it has a random source).
 if(choice==='zone'){const zone=random?(random()<.5?'A':'B'):'A';G.chooseDeploymentZone(s,'iron',zone);return {message:`Red chose the map, so the bot chooses a zone: it takes ${zone==='A'?'zone A':'zone B'}.`,zone};}
 if(choice==='deploy-order'){G.chooseDeploymentOrder(s,'iron','ash');return {message:'The bot won the deployment roll-off and has you deploy first.'};}
 if(choice==='first-turn'){G.chooseFirstTurn(s,'iron','iron');return {message:'The bot won the roll-off and takes the first turn.'};}
 if(choice==='deploy'){const out=deployNext(s,random),names=(out.ids??[out.id]).map(id=>G.getUnit(s,id).name);return {message:`The bot deploys ${names.join(' and ')}.`,id:out.id,...out};}
 return null;
}
// The bot plans its whole remaining deployment against what is on the table now, then places
// the first unit of that plan: war machines and shooters first for a gun line, blocks first
// otherwise, characters and wizards last.
const PLAN_ORDER={empire:['warmachine','missile','infantry','character','wizard'],other:['infantry','missile','warmachine','character','wizard']};
export function deployNext(s,random=null){
 if(G.deploymentTurn(s)!=='iron')throw Error('It is not the bot’s turn to deploy.');
 // The gun-line planner works across the table; on a map deployed along it, spread out instead.
 if(G.deploymentFacing(s,'iron')!==180)return G.autoDeploy(s,{team:'iron',random});
 const trial=structuredClone(s);trial.deployOrder.auto=true;
 for(const p of G.deploymentPieces(trial,'iron'))if(!p.deployed){p.x=null;p.y=null;}
 try{deployOpponent(trial,random);}catch{}
 const order=PLAN_ORDER[s.units.find(u=>u.team==='iron')?.faction==='empire'?'empire':'other'];
 for(const p of G.deploymentPieces(s,'iron').filter(p=>!p.deployed).sort((a,b)=>order.indexOf(a.role)-order.indexOf(b.role))){
  const planned=G.getUnit(trial,p.id);if(planned?.x==null)continue;
  try{G.placeAt(s,p.id,planned.x,planned.y);}catch{continue;}
  // The rest of its batch (all war machines, or all characters) goes where the plan put them;
  // anything that no longer fits is placed by quick deployment, which then confirms the batch.
  for(const id of s.deployOrder.batch?.ids??[]){const q=G.getUnit(s,id),pl=G.getUnit(trial,id);if(q.x===null&&pl?.x!=null)try{G.placeAt(s,id,pl.x,pl.y);}catch{}}
  return G.autoDeploy(s,{team:'iron',random});
 }
 return G.autoDeploy(s,{team:'iron',random});
}

export function humanDecision(s){
 if(s.pendingSpell&&G.getUnit(s,s.pendingSpell.caster)?.team==='iron')return {id:s.pendingSpell.caster,kind:'dispel',message:`Choose how to dispel ${G.BATTLE_MAGIC[s.pendingSpell.key].name}.`};
 // Charge reactions are chosen once every charge has been declared.
 const charge=s.movementStep==='reactions'?s.units.find(u=>u.team==='iron'&&u.charge?.status==='declared'&&u.charge.reaction==='pending'):null;
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
 if(s.stage==='deployment'||s.stage==='finished')return false;
 if(s.pendingSpell)return G.getUnit(s,s.pendingSpell.caster)?.team==='ash';
 if(s.team==='iron')return !humanDecision(s);
 return s.stage==='movement'&&s.movementStep==='reactions'&&s.units.some(u=>u.team==='ash'&&u.charge?.status==='declared'&&u.charge.reaction==='pending'&&G.getUnit(s,u.charge.target)?.team==='iron')||!!combatDecision(s)||s.stage==='combat'&&s.units.some(u=>u.team==='iron'&&u.role==='wizard'&&u.engaged&&u.spells.some(key=>['hammerhand','hashutFlames'].includes(key)&&G.opponents(s,u).some(t=>G.canCast(s,u.id,key,t.id))));
}

function moveRegiment(s,u,random){
 s.selected=u.id;
 const foe=nearest(s,u);if(!foe)return endMove(s,u,`${u.id} holds position.`);
 const goal=chooseGoal(s,u,foe),virtual={...s,stage:'shooting',team:'iron'};
 if(u.role==='missile'&&(goal.kind!=='objective'||goal.dist(u)<=BM.CONTROL_RANGE)&&G.canShoot(virtual,u)&&G.shootingTargets(virtual,u).some(t=>!t.plan.error))return endMove(s,u,`${u.id} holds for a clear shot.`);
 if(goal.kind==='objective'&&goal.dist(u)<=.05)return endMove(s,u,`${u.id} holds ${goal.name}.`);
 if(goal.kind==='support'&&goal.dist(u)<=1)return endMove(s,u,`${u.id} stays behind the line.`);
 const separation=goal.dist(u),wantMarch=(goal.kind==='enemy'?u.role!=='missile'&&separation>14:separation>G.profile(u).M+.5)&&u.marchTest!==false,mode=u.movementMode??(wantMarch?'march':'advance');
 if(mode==='march'&&G.needsMarchTest(s,u)&&u.marchTest===null){const dice=roll(random),passed=G.marchTest(s,u.id,dice);return {message:`${u.id} march test ${passed?'passed':'failed'} (${dice.join('+')}).`};}
 const best=bestOrder(s,u,goal,mode)??(mode==='march'?bestOrder(s,u,goal,'advance'):null);
 if(best){G.commitOrder(s,u.id,best.order);return {message:`${u.id} ${describeOrder(best.order)} toward ${goal.name}.`};}
 return endMove(s,u,`${u.id} holds position.`);
}
// A unit that ends its move on a treasure trove may start burning it (Raid & Burn, when on):
// worth it once holding the trove for the rest of the battle would score less than 30 VP.
function endMove(s,u,message){
 const trove=BM.raidOptions(s,u)[0];
 if(trove&&raidWorthIt(s)){BM.startRaid(s,u.id,trove.id);return {message:`${u.id} starts to burn ${trove.name} (Raid & Burn).`};}
 G.hold(s,u.id);return {message};
}
function raidWorthIt(s){const rounds=s.format?.rounds;if(!rounds||s.round>=rounds)return false;const turnEnds=2*(rounds-s.round)+(s.firstPlayer===s.team?2:1);return BM.RAID_VP>BM.OBJECTIVE_VP.trove*(turnEnds-2);}
const enemyGoal=t=>({kind:'enemy',name:t.id,x:t.x,y:t.y,face:t,dist:p=>G.gap(p,t)});
function chooseGoal(s,u,foe){
 if(!s.objectives)return enemyGoal(foe);
 if(G.isCharacter(u))return supportGoal(s,u,foe)??enemyGoal(foe);
 const obj=objectivePlan(s).get(u.id);
 return obj?{kind:'objective',name:obj.name,x:obj.x,y:obj.y,face:foe,dist:p=>BM.objectiveDistance(p,obj)}:enemyGoal(foe);
}
// Battle March: objectives, the landmark first, go to the nearest bot units that can control them
// and still reach them before the battle ends; the rest of the army fights.
function objectivePlan(s){
 const plan=new Map(),turns=Math.max(1,(s.format?.rounds??5)-s.round+1),free=s.units.filter(u=>u.team==='iron'&&!G.isCharacter(u)&&BM.canControl(u)&&!u.engaged),pairs=[];
 for(const o of s.objectives.items.filter(o=>!o.removed))for(const u of free){const d=BM.objectiveDistance(u,o);if(d<=turns*2*G.profile(u).M+BM.CONTROL_RANGE)pairs.push({u,o,score:d-(o.kind==='landmark'?4:0)});}
 const units=new Set(),objectives=new Set();
 for(const p of pairs.sort((a,b)=>a.score-b.score)){if(units.has(p.u.id)||objectives.has(p.o.id))continue;plan.set(p.u.id,p.o);units.add(p.u.id);objectives.add(p.o.id);}
 return plan;
}
function holdsObjective(s,u){return !!s.objectives?.items.some(o=>!o.removed&&BM.controlOf(s,o).unit===u.id);}
// Characters (the General is worth 50 VP to the enemy) keep a few inches behind the friendly
// block nearest the enemy, where they stay in spell range but out of the way of charges.
function supportGoal(s,u,foe){
 const line=s.units.filter(v=>v.team===u.team&&v.id!==u.id&&!G.isCharacter(v)&&alive(v)&&!v.fleeing&&!v.engaged);if(!line.length)return null;
 const anchor=line.sort((a,b)=>G.gap(a,foe)-G.gap(b,foe))[0],dx=anchor.x-foe.x,dy=anchor.y-foe.y,len=Math.hypot(dx,dy)||1,back=G.size(anchor).h/2+G.size(u).h/2+2.5;
 const x=Math.max(1,Math.min(s.board.width-1,anchor.x+dx/len*back)),y=Math.max(1,Math.min(s.board.height-1,anchor.y+dy/len*back));
 return {kind:'support',name:'a place behind '+anchor.id,x,y,face:foe,dist:p=>Math.hypot(p.x-x,p.y-y)};
}
// Try a spread of legal orders (advances, wheels either way with an advance, a reform toward the
// goal, and short side steps) and take the one that ends closest to the goal, facing the enemy
// best. A unit blocked in one direction therefore finds another way instead of holding.
function bestOrder(s,u,goal,mode){
 if(u.movementMode&&u.movementMode!==mode)return null;
 const allowance=(mode==='march'?2:1)*G.profile(u).M,left=allowance-(u.spent??0);if(left<.25)return null;
 const target=goal.face??goal,facingError=p=>{const want=G.normalize(Math.atan2(target.x-p.x,-(target.y-p.y))*180/Math.PI);return Math.abs(((want-G.heading(p)+540)%360)-180);};
 const score=p=>-goal.dist(p)-(goal.kind==='enemy'?.03:.01)*facingError(p),steps=d=>[d,d*.75,d*.5,d*.25].filter(x=>x>=.25),orders=[];
 for(const d of steps(left))orders.push({kind:'advance',distance:d,angle:0,mode});
 for(let a=-40;a<=40;a+=10){if(!a)continue;const cost=G.wheelCost(a,u);if(cost>=left-.05)continue;orders.push({kind:'wheel',angle:a,distance:0,mode});for(const d of steps(left-cost))orders.push({kind:'wheel',angle:a,distance:d,mode});}
 if((u.spent??0)===0&&mode==='advance'&&facingError(u)>60)orders.push({kind:'pivot',angle:Math.round(((G.normalize(Math.atan2(target.x-u.x,-(target.y-u.y))*180/Math.PI)-G.heading(u)+540)%360)-180),distance:0,mode:'advance'});
 for(const side of [-1,1])for(const d of [1,2].filter(d=>2*d<=left))orders.push({kind:'side',side,distance:d,angle:0,mode});
 // Toward a goal behind or beside the unit (an objective, a place behind the line): reform to
 // face it, or step back.
 if(goal.kind!=='enemy'){if((u.spent??0)===0&&mode==='advance'){const toward=Math.round(((G.normalize(Math.atan2(goal.x-u.x,-(goal.y-u.y))*180/Math.PI)-G.heading(u)+540)%360)-180);if(Math.abs(toward)>60)orders.push({kind:'pivot',angle:toward,distance:0,mode:'advance'});}for(const d of [1,2,3].filter(d=>2*d<=left))orders.push({kind:'back',distance:d,angle:0,mode});}
 const now=score(u);let best=null;
 for(const order of orders){if(order.kind==='pivot'&&!order.angle)continue;if(G.orderError(s,u,order))continue;const val=score(G.planMove(u,order).end);if(!best||val>best.val)best={order,val};}
 return best&&best.val>now+.05?best:null;
}
function describeOrder(o){return o.kind==='pivot'?'reforms':o.kind==='side'?`steps ${o.distance}″ ${o.side<0?'left':'right'}`:o.kind==='wheel'?`wheels ${Math.abs(o.angle)}° ${o.angle<0?'left':'right'}${o.distance?' and '+(o.mode==='march'?'marches':'advances')+' '+Math.round(o.distance*10)/10+'″':''}`:`${o.mode==='march'?'marches':'advances'} ${Math.round(o.distance*10)/10}″`;}

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
  // One reaction answers every charge on a unit: Stand & Shoot at the strongest charger it can
  // shoot when none of them is too close, otherwise Hold (a fleeing unit must Flee).
  const charger=s.units.find(u=>u.team==='ash'&&u.charge?.status==='declared'&&u.charge.reaction==='pending'&&G.getUnit(s,u.charge.target)?.team==='iron');
  const defender=G.getUnit(s,charger.charge.target),chargers=s.units.filter(u=>u.charge?.status==='declared'&&u.charge.target===defender.id),tooClose=!!G.standShootTooClose(s,defender,chargers);
  const shooter=defender.fleeing||tooClose?null:chargers.filter(v=>v.charge.reaction==='pending'&&G.canStandShoot(s,defender,v)).sort((a,b)=>G.unitStrength(b)-G.unitStrength(a))[0];
  const choice=defender.fleeing?'flee':shooter?'stand-shoot':'hold',at=shooter??charger,point={x:at.x,y:at.y},out=G.chargeReaction(s,at.id,choice,random);
  return {message:`${defender.id} chooses ${choice==='stand-shoot'?'Stand & Shoot':choice}${choice==='stand-shoot'&&chargers.length>1?' at '+at.id:''}.`,report:out.report,point};
 }
 const decision=humanDecision(s);if(decision)return {...decision,wait:true};
 if(s.stage==='strategy'){
  const u=s.units.find(u=>u.team==='iron'&&u.x!==null&&u.fleeing&&!u.rallyAttempted);
  if(u){s.selected=u.id;const out=G.rally(s,u.id,random);return {message:`${u.id} ${out.success?'rallies':'fails to rally'} (${out.dice.join('+')}).`};}
  const cast=aiSpell(s,random);if(cast)return cast;
  G.nextPhase(s);return {message:'The bot begins Movement.'};
 }
 if(s.stage==='movement'&&s.movementStep==='reactions'){G.finishReactions(s);return {message:'Every charged unit has reacted.'};}
 if(s.stage==='movement'&&s.movementStep==='declare'){

  for(const u of s.units.filter(u=>u.team==='iron'&&G.canAct(s,u)&&u.faction==='orc'&&u.impetuousTest===null&&G.availableCharges(s,u).length)){const dice=roll(random),passed=G.impetuousTest(s,u.id,dice);s.selected=u.id;return {message:`${u.id} Impetuous test ${passed?'passed':'failed'} (${dice.join('+')}).`};}
  const options=s.units.filter(u=>u.team==='iron'&&G.canAct(s,u)).flatMap(u=>G.availableCharges(s,u).map(t=>({u,t,plan:G.chargePlan(s,u,t)}))).filter(o=>G.hasRule(o.u,'frenzy')||!s.objectives||!(G.isCharacter(o.u)&&G.unitStrength(o.t)>=BM.MIN_CONTROL_US)&&!(s.round>=(s.format.rounds??Infinity)&&holdsObjective(s,o.u))).sort((a,b)=>a.plan.cost-b.plan.cost);
  if(options.length){const {u,t}=options[0];s.selected=u.id;G.declareCharge(s,u.id,t.id);return {message:`${u.id} charges ${t.id}. Choose a reaction.`};}
  G.finishDeclarations(s);return {message:'The bot finishes charge declarations.'};
 }
 if(s.stage==='movement'&&s.movementStep==='charges'){
  const u=s.units.find(u=>u.team==='iron'&&u.charge?.status==='declared');if(u){s.selected=u.id;const target=G.getUnit(s,u.charge.target),plan=target?.x!==null?G.chargePlan(s,u,target):{error:true},first=roll(random),reroll=u.faction==='orc'&&!plan.error&&G.profile(u).M+Math.max(...first)<plan.cost,dice=reroll?roll(random):first,out=G.resolveCharge(s,u.id,dice);return {message:`${u.id} ${out.success?'charge succeeds':out.pursuit?'pursues fleeing target':'charge fails'} (${reroll?'Warband reroll · ':''}${dice.join(', ')}).`,roll:{label:`${u.id} · Charge roll · keep highest`,dice,team:'iron'}};}
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
  const pair=G.combatPairs(s)[0];if(pair){const id=pair.find(id=>G.getUnit(s,id).team==='iron')??pair[0];s.selected=id;
   // A bot unit fighting several enemies aims its spare attacks at the one closest to destruction.
   for(const u of pair.map(i=>G.getUnit(s,i)).filter(u=>u.team==='iron')){const foes=G.opponents(s,u);if(foes.length>1)u.combatFocus=foes.sort((a,b)=>G.remainingWounds(a)-G.remainingWounds(b))[0].id;}
   G.beginCombat(s,id);return {message:`${pair.join(pair.length>2?', ':' fights ')}${pair.length>2?' fight one combat':''}: initiative order shown.`};}
  G.nextPhase(s);return {message:'The bot ends its turn.'};
 }
 return {message:'Waiting for the player.',wait:true};
}

function aiSpell(s,random){const wizard=s.units.find(u=>u.team==='iron'&&u.role==='wizard'&&alive(u));if(!wizard)return null;for(const key of wizard.spells){const targets=G.spellTargets(s,wizard.id,key).filter(t=>G.canCast(s,wizard.id,key,t.id));if(!targets.length)continue;const target=key==='shield'?wizard:targets.sort((a,b)=>G.gap(wizard,a)-G.gap(wizard,b))[0],point=key==='pillar'?(()=>{const victim=nearest(s,wizard);if(!victim)return {x:wizard.x,y:wizard.y};const d=distance(wizard,victim),f=Math.min(10,d)/d;return {x:Math.max(1.5,Math.min(s.board.width-1.5,wizard.x+(victim.x-wizard.x)*f)),y:Math.max(1.5,Math.min(s.board.height-1.5,wizard.y+(victim.y-wizard.y)*f))};})():null;const report=G.attemptSpell(s,wizard.id,key,target.id,random,{point});s.selected=wizard.id;return {message:`${wizard.name} casts ${G.BATTLE_MAGIC[key].name}: ${report.dice.join('+')} = ${report.casting} · ${report.pending?'cast — choose a dispel':report.cast?'cast':'failed'}.`,roll:{label:`${wizard.id} · ${G.BATTLE_MAGIC[key].name} casting`,dice:report.dice,team:'iron'},spell:true,report,point:{x:target.x,y:target.y}};}return null;}
