// Battle March rules layered on the core engine: objectives, objective control, scoring and the
// end of the game. The engine calls these hooks through registerFormatRules; the UI and the bot
// call the same functions.
import * as G from './game.mjs';

export const TROVE_RADIUS=20/25.4,LANDMARK_RADIUS=50/25.4,CONTROL_RANGE=3,MIN_CONTROL_US=5,TERRAIN_CLEARANCE=3,RAID_VP=30;
export const OBJECTIVE_VP={trove:10,landmark:25},BONUS_VP={general:50,standard:25,battleStandard:25};
export const LANDMARK_PROPERTY=roll=>roll<=2?'magicResistance':roll<=4?'frenzy':'stubborn';
export const PROPERTY_NAME={magicResistance:'Magic Resistance (−2)',frenzy:'Frenzy',stubborn:'Stubborn'};
export const PROPERTY_TEXT={magicResistance:'Enemy spells that target this unit suffer −2 to their casting roll.',frenzy:'+1 Attack in a turn it charges; it cannot flee as a charge reaction, must charge when it can, always pursues, and passes Panic tests. It loses Frenzy if it loses a combat.',stubborn:'The first time it loses a combat and fails its Break test, it falls back in good order instead of breaking.'};
export const OBJECTIVE_CHOICES={roll:'Roll a D6 (1–2 two troves, 3–4 three troves, 5–6 landmark)',troves2:'Two treasure troves',troves3:'Three treasure troves',landmark:'One strategic landmark'};
const fmt=n=>(Math.round(n*100)/100).toString(),TOLERANCE=1e-6;
const other=team=>team==='ash'?'iron':'ash';
// Names as the players see them: regiments carry a letter (State Troops A, B, C).
const label=u=>!u?'a unit':u.role==='infantry'?`${u.name} ${'ABC'[Number(u.id.slice(1))-1]??u.id}`:u.name;
const side=(s,team)=>G.armyName(team,s).split(' · ').pop();

// ---- Setup ------------------------------------------------------------------------------------
// Treasure troves start in a custom even layout across the centre line (the official placement
// diagrams have not been supplied) and can be moved before the first unit deploys. The landmark
// always stands at the centre.
export function setupObjectives(s,{choice='roll',random=Math.random}={}){
 if(!OBJECTIVE_CHOICES[choice])throw Error(`Unknown objective choice "${choice}".`);
 const roll=choice==='roll'?G.rollD6(1,random)[0]:null,kind=choice==='roll'?(roll<=2?'troves2':roll<=4?'troves3':'landmark'):choice,W=s.board.width,H=s.board.height;
 s.objectives={choice,roll,kind,items:[],layout:kind==='landmark'?'centre':'custom even spacing (not an official diagram)'};
 if(kind==='landmark'){
  const property=G.rollD6(1,random)[0];
  s.objectives.items=[{id:'L',kind:'landmark',name:'Strategic landmark',x:W/2,y:H/2,r:LANDMARK_RADIUS,control:null}];
  s.objectives.property={roll:property,rule:LANDMARK_PROPERTY(property)};
  s.terrain=[{id:'L',kind:'landmark',name:'Strategic landmark',x:W/2,y:H/2,r:LANDMARK_RADIUS,impassable:true,blocksSight:true}];
 }else{
  const n=kind==='troves3'?3:2;
  s.objectives.items=Array.from({length:n},(_,i)=>({id:'T'+(i+1),kind:'trove',name:'Treasure trove '+(i+1),x:W*(i+1)/(n+1),y:H/2,r:TROVE_RADIUS,control:null}));
  s.terrain=[];
 }
 s.scoring={ledger:[]};
 return s.objectives;
}
export function canPlaceObjectives(s){return s.stage==='deployment'&&!G.terrainPending(s)&&s.objectives?.kind!=='landmark'&&!!s.objectives&&!G.combatants(s).some(p=>p.x!==null)&&!s.deployOrder?.log?.length;}
// Where a treasure trove may stand: wholly on the battlefield, 3″ clear of terrain, not on another trove.
export function objectivePlacementError(s,id,x,y){
 const obj=s.objectives?.items.find(o=>o.id===id);if(!obj)return 'Unknown objective.';
 if(obj.kind!=='trove')return 'The strategic landmark stays at the centre of the battlefield.';
 if(!Number.isFinite(x)||!Number.isFinite(y)||x-obj.r<0||y-obj.r<0||x+obj.r>s.board.width||y+obj.r>s.board.height)return 'Keep the whole treasure trove on the battlefield.';
 if((s.terrain??[]).some(t=>G.featureDistance(t,{x,y})-obj.r<TERRAIN_CLEARANCE-TOLERANCE))return 'A treasure trove cannot be within 3″ of a terrain feature (or straddle a low obstacle).';
 if(s.objectives.items.some(o=>o.id!==id&&Math.hypot(o.x-x,o.y-y)<o.r+obj.r))return 'Treasure troves cannot overlap.';
 return null;
}
export function placeObjective(s,id,x,y){const error=objectivePlacementError(s,id,x,y);if(error)throw Error(error);if(!canPlaceObjectives(s))throw Error('Treasure troves are placed before any unit deploys.');return Object.assign(s.objectives.items.find(o=>o.id===id),{x,y});}

// ---- Control ----------------------------------------------------------------------------------
// Rules measurement: from the unit's footprint to the objective's footprint.
export function objectiveDistance(u,obj){return G.circleGap(G.corners(u),obj);}
// A unit's Unit Strength here counts the characters who have joined it.
export function canControl(u,s=null){return !!u&&u.x!==null&&G.aliveCount(u)>0&&!u.fleeing&&!u.stupid&&!u.joined&&(s?G.unitStrengthWith(s,u):G.unitStrength(u))>=MIN_CONTROL_US;}
// Closest eligible unit controls; equally close, higher Unit Strength; still tied between the
// armies, the objective is contested.
export function controlOf(s,obj){
 if(obj.removed)return {controller:null,unit:null,contested:false,reason:`Burned by ${label(G.getUnit(s,obj.removed.unit))} (Raid & Burn).`};
 const eligible=G.combatants(s).filter(u=>canControl(u,s)).map(u=>({u,d:objectiveDistance(u,obj),us:G.unitStrengthWith(s,u)})).filter(e=>e.d<=CONTROL_RANGE+TOLERANCE);
 if(!eligible.length)return {controller:null,unit:null,contested:false,reason:'No eligible unit within 3″ (Unit Strength 5+, not fleeing).'};
 const closest=Math.min(...eligible.map(e=>e.d)),near=eligible.filter(e=>e.d<=closest+TOLERANCE),top=Math.max(...near.map(e=>e.us)),best=near.filter(e=>e.us===top).sort((a,b)=>a.d-b.d||a.u.id.localeCompare(b.u.id));
 if(new Set(best.map(e=>e.u.team)).size>1){const a=best.find(e=>e.u.team==='ash'),b=best.find(e=>e.u.team==='iron');return {controller:null,unit:null,contested:true,reason:`Contested: ${label(a.u)} and ${label(b.u)} are equally close (${fmt(closest)}″) with equal Unit Strength ${top}.`};}
 const win=best[0],rival=eligible.filter(e=>e.u.team!==win.u.team).sort((a,b)=>a.d-b.d||b.us-a.us)[0];
 const reason=!rival?`${label(win.u)} holds it (${fmt(win.d)}″); no eligible enemy within 3″.`:rival.d<=closest+TOLERANCE?`${label(win.u)} and ${label(rival.u)} are equally close; higher Unit Strength (${win.us} vs ${rival.us}).`:`${label(win.u)} is closest (${fmt(win.d)}″ vs ${label(rival.u)} ${fmt(rival.d)}″).`;
 return {controller:win.u.team,unit:win.u.id,contested:false,distance:win.d,reason};
}
const turnKey=(round,team)=>`${round}:${team}`;
function nextTurnKey(s,team){return team===s.firstPlayer?turnKey(s.round,other(team)):turnKey(s.round+1,s.firstPlayer);}

// ---- End of each player's turn: both armies can score, whoever's turn it was. -----------------
export function endOfTurn(s,team){
 s.scoring??={ledger:[]};if(!s.objectives)return;
 const key=turnKey(s.round,team);
 // Landmark properties granted a turn ago have already expired (game.mjs endOfPlayerTurn).
 // Objective control and VP:
 for(const obj of s.objectives.items.filter(o=>!o.removed)){
  const control=controlOf(s,obj);obj.control={...control,turn:key};
  if(!control.controller)continue;
  const unit=G.getUnit(s,control.unit);
  s.scoring.ledger.push({round:s.round,turn:team,team:control.controller,kind:obj.kind,objective:obj.id,unit:unit.id,vp:OBJECTIVE_VP[obj.kind],detail:`${obj.name} held by ${label(unit)} at the end of ${side(s,team)}’s turn ${s.round}`});
  if(obj.kind==='landmark'&&s.objectives.property){
   // The controlling unit gains the landmark's property until the end of the next turn.
   for(const u of G.combatants(s))G.removeEffects(u,e=>e.source==='landmark'||e.source?.kind==='landmark');
   const rule=s.objectives.property.rule;G.addEffect(s,[unit],{property:rule,source:{kind:'landmark',team:control.controller,objective:obj.id},rules:[{rule}],stack:'landmark',created:{round:s.round,team},expiry:{kind:'END_OF_NEXT_PLAYER_TURN',at:nextTurnKey(s,team)}});
  }
 }
}

// ---- Raid & Burn (optional) --------------------------------------------------------------------
export function raidAllowed(s){return !!s.format?.optional?.raidAndBurn&&!!s.objectives?.items.some(o=>o.kind==='trove');}
// Troves this unit can start destroying: it moved into base contact in Remaining Moves.
export function raidOptions(s,u){
 if(!raidAllowed(s)||!u||s.stage!=='movement'||s.movementStep!=='remaining'||u.team!==s.team||u.raiding||u.engaged||u.charge?.status==='success'||!((u.spent??0)>0)||!canControl(u,s))return [];
 return s.objectives.items.filter(o=>o.kind==='trove'&&!o.removed&&!G.combatants(s).some(v=>v.raiding?.trove===o.id)&&objectiveDistance(u,o)<=TOLERANCE);
}
export function startRaid(s,unitId,troveId){
 const u=G.getUnit(s,unitId);if(!raidOptions(s,u).some(o=>o.id===troveId))throw Error('Only a unit of Unit Strength 5+ that moved into base contact with a treasure trove this Remaining Moves step can start destroying it.');
 u.raiding={trove:troveId,round:s.round};u.moved=true;return u.raiding;
}
export function startOfTurn(s,team){
 s.raidReports=[];
 for(const u of G.combatants(s).filter(u=>u.team===team&&u.raiding)){
  const obj=s.objectives?.items.find(o=>o.id===u.raiding.trove),inContact=!!obj&&!obj.removed&&u.x!==null&&objectiveDistance(u,obj)<=TOLERANCE;
  const failure=!obj||obj.removed?'the trove is gone':!inContact?'it is no longer in base contact':G.unitStrength(u)<MIN_CONTROL_US?'its Unit Strength is below 5':u.engaged?'it is engaged in combat':u.fleeing?'it is fleeing':null;
  if(!failure){obj.removed={team,unit:u.id,round:s.round};s.scoring.ledger.push({round:s.round,turn:team,team,kind:'raid',objective:obj.id,unit:u.id,vp:RAID_VP,detail:`${label(u)} burned ${obj.name} (Raid & Burn)`});}
  s.raidReports.push({unit:u.id,trove:u.raiding.trove,success:!failure,reason:failure});
  u.raiding=null;
 }
}

// ---- Victory points ---------------------------------------------------------------------------
// Dead or Fled: destroyed or fled off = full cost; fleeing at the end, or at 25% or less of its
// starting Unit Strength (remaining Wounds where Unit Strength equals starting Wounds) = half
// cost, rounded up. A unit only ever scores the larger award.
export function casualtyVP(u){
 const cost=u.cost??0;if(!cost)return {vp:0,reason:null};
 if(u.destroyed||u.role==='warmachine'&&u.wounds<=0)return {vp:cost,reason:u.leftBoard==='fled'?'fled off the battlefield':u.leftBoard==='fell back'?'fell back off the battlefield':'destroyed'};
 if(u.fleeing)return {vp:Math.ceil(cost/2),reason:'fleeing'};
 const startUS=G.startingUnitStrength(u),startW=G.startingWounds(u),byWounds=startUS===startW;
 // Surviving strength, wherever the unit is (a pursuer can be off the table for a moment).
 const reduced=byWounds?G.remainingWounds(u)<=startW/4+TOLERANCE:G.unitStrength(u.x===null?{...u,x:0}:u)<=startUS/4+TOLERANCE;
 return reduced?{vp:Math.ceil(cost/2),reason:`at 25% or less of its starting ${byWounds&&(G.isCharacter(u)||u.role==='warmachine')?'Wounds':'Unit Strength'}`}:{vp:0,reason:null};
}
// Objective, raid and standard VP are committed when earned. Casualty and General VP are
// provisional until the battle ends, because a fleeing unit can still rally.
export function score(s,{final=s.stage==='finished'}={}){
 const lines={ash:[],iron:[]};
 for(const e of s.scoring?.ledger??[])lines[e.team].push({kind:e.kind==='raid'?'raid':'objective',vp:e.vp,detail:e.detail,round:e.round,committed:true});
 for(const t of s.trophies??[])lines[t.team].push({kind:'standard',vp:BONUS_VP.standard,detail:`Captured the standard of ${label(G.getUnit(s,t.unit))}`,round:t.round,committed:true});
 for(const u of G.allPieces(s)){
  const scorer=other(u.team),c=casualtyVP(u);if(c.vp)lines[scorer].push({kind:'casualty',vp:c.vp,detail:`${label(u)} ${c.reason} (${c.vp===u.cost?'full':'half of'} ${u.cost} pts)`,committed:final});
  const gone=u.destroyed?(u.leftBoard==='fled'?'fled off the battlefield':u.leftBoard==='fell back'?'fell back off the battlefield':'slain'):u.fleeing?'fleeing':null;
  if(u.general&&gone)lines[scorer].push({kind:'general',vp:BONUS_VP.general,detail:`Enemy General ${label(u)} ${gone}`,committed:final});
  if(u.battleStandard&&gone)lines[scorer].push({kind:'battleStandard',vp:BONUS_VP.battleStandard,detail:`Enemy Battle Standard Bearer ${label(u)} ${gone}`,committed:final});
 }
 const sum=(team,test=()=>true)=>lines[team].filter(test).reduce((n,l)=>n+l.vp,0);
 return {lines,totals:{ash:sum('ash'),iron:sum('iron')},committed:{ash:sum('ash',l=>l.committed),iron:sum('iron',l=>l.committed)},provisional:{ash:sum('ash',l=>!l.committed),iron:sum('iron',l=>!l.committed)},final};
}
// Result classification. The Battle March rule is not in the brief, so the policy is
// configurable and marked unconfirmed; the default is the core rulebook's (a win needs a margin
// of 100 VP or more, a crushing victory double the loser's VP).
export function classify(totals,policy={id:'core-100',margin:100,crushingRatio:2,confirmed:false}){
 const lead=totals.ash===totals.iron?null:totals.ash>totals.iron?'ash':'iron',margin=Math.abs(totals.ash-totals.iron);
 if(!lead||margin<policy.margin)return {winner:null,label:'Draw',margin,policy};
 const crushing=totals[lead]>=policy.crushingRatio*totals[other(lead)];
 return {winner:lead,label:crushing?'Crushing victory':'Victory',margin,policy};
}
export function endOfGame(s){
 const final=score(s,{final:true});
 if(s.concededBy)return {...final,winner:other(s.concededBy),label:'Victory by concession',margin:Math.abs(final.totals.ash-final.totals.iron),policy:s.format.resultPolicy,conceded:s.concededBy};
 return {...final,...classify(final.totals,s.format.resultPolicy)};
}
export function concede(s,team){if(s.stage==='finished')throw Error('The battle is already over.');if(s.stage==='deployment')throw Error('The battle has not started.');s.concededBy=team;return G.finishGame(s,`${team==='ash'?'Red':'The opponent'} conceded in round ${s.round}.`);}
// An agreed time limit: the battle stops now and is scored as it stands.
export function endByAgreement(s){if(s.stage==='finished')throw Error('The battle is already over.');if(s.stage==='deployment')throw Error('The battle has not started.');return G.finishGame(s,`The players ended the battle in round ${s.round} (agreed time limit).`);}

G.registerFormatRules('battle-march',{setup:(s,options)=>setupObjectives(s,options),endOfTurn,startOfTurn,endOfGame});
