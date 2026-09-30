import * as F from './formats.mjs';
import * as A from './armies.mjs';
export const BOARD={width:72,height:48,zone:12};
export const ROCKET_PROFILES={demolition:{name:'Demolition Rockets',template:3,strength:3,centreStrength:6,ap:0,centreAp:3},incendiary:{name:'Infernal Incendiaries',template:5,strength:3,centreStrength:3,ap:0,centreAp:0}};
export const ROCKET_BASE={w:50/25.4,h:75/25.4};
export function rocketFootprint(x,y){return [{x:x-ROCKET_BASE.w/2,y:y-ROCKET_BASE.h/2},{x:x+ROCKET_BASE.w/2,y:y-ROCKET_BASE.h/2},{x:x+ROCKET_BASE.w/2,y:y+ROCKET_BASE.h/2},{x:x-ROCKET_BASE.w/2,y:y+ROCKET_BASE.h/2}];}
export const CANNON_BASE={w:50/25.4,h:75/25.4};
export function cannonFootprint(x,y){return [{x:x-CANNON_BASE.w/2,y:y-CANNON_BASE.h/2},{x:x+CANNON_BASE.w/2,y:y-CANNON_BASE.h/2},{x:x+CANNON_BASE.w/2,y:y+CANNON_BASE.h/2},{x:x-CANNON_BASE.w/2,y:y+CANNON_BASE.h/2}];}
export function createCannons(opponent){return opponent==='empire'?[1,2].map(n=>({id:'I'+(n+4),name:'Great Cannon '+('AB'[n-1]),...machineFields('iron','empire'),x:null,y:null,heading:180,wounds:3,crew:3,shot:false,disabledUntil:0,lastShot:null})):[];}
// A war machine is one model. Its crew bases are tokens: in combat the model uses the
// crew profile, makes one Attack per surviving crew token and loses a token per wound.
export const WAR_MACHINE_CREW={chaos:{name:'Chaos Dwarf Crew',profile:{M:3,WS:3,BS:3,S:3,T:4,W:3,I:2,A:3,Ld:9,save:7}},empire:{name:'Empire Crew',profile:{M:4,WS:3,BS:3,S:3,T:3,W:3,I:3,A:3,Ld:7,save:7}}};
function machineFields(team,faction){return {team,faction,role:'warmachine',engaged:null,charge:null,combatResolved:false,fleeing:false,destroyed:false,deadModels:[]};}
export function combatants(s){return [...s.units,s.rocket,...(s.cannons??[])].filter(m=>m&&!m.absent);}
export const PROFILE={M:3,WS:4,BS:3,S:3,T:4,W:1,I:2,A:1,Ld:9,save:4};
export const SIZE={w:125/25.4,h:100/25.4};
export const FACTIONS={chaos:{name:'Chaos Dwarf Warriors',army:'Chaos Dwarfs',color:'#b63229',bright:'#ff3f39',base:25,equipment:'Hand weapons · heavy armour · shields',profile:PROFILE,heavy:true,shield:true,shieldwall:true,resolute:true},orc:{name:'Orc Mob',army:'Orc & Goblin Tribes',color:'#418248',bright:'#54ef53',base:30,equipment:'Hand weapons · light armour',profile:{M:4,WS:3,BS:3,S:3,T:4,W:1,I:3,A:1,Ld:6,save:6},choppas:true,furious:true,warband:true,impetuous:true},empire:{name:'State Troops',army:'Empire of Man',color:'#286a9a',bright:'#32aaff',base:25,equipment:'Hand weapons · light armour · shields',profile:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7,save:5},shield:true}};
export const MISSILE={chaos:{name:'Blunderbuss Decimators',equipment:'Hand weapons · blunderbusses · heavy armour',profile:{M:3,WS:3,BS:3,S:3,T:4,W:1,I:2,A:1,Ld:9,save:5},weapon:{name:'Hailshot blunderbuss',range:12,strength:3,ap:1,multiple:'D3',volley:true,ignoreLong:true,ignoreStand:true,hailshot:true}},empire:{name:'State Missile Troops',equipment:'Hand weapons · crossbows',profile:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7,save:7},weapon:{name:'Crossbow',range:30,strength:4,ap:0}},orc:{name:'Orc Mob · Warbows',equipment:'Hand weapons · warbows · light armour',profile:{M:4,WS:3,BS:3,S:3,T:4,W:1,I:3,A:1,Ld:6,save:6},weapon:{name:'Warbow',range:24,strength:3,ap:0}}};
export const WIZARDS={chaos:{name:'Daemonsmith Sorcerer',equipment:'Hand weapon · heavy armour · Blackshard armour · Ensorcelled weapon',profile:{M:3,WS:4,BS:4,S:4,T:4,W:2,I:2,A:2,Ld:9,save:5}},empire:{name:'Master Mage (Battlemage)',equipment:'Hand weapon',profile:{M:4,WS:3,BS:3,S:3,T:3,W:2,I:3,A:1,Ld:7,save:7}}};
export const CHARACTERS={empireCaptain:{name:'Captain of the Empire',profile:{M:4,WS:5,BS:5,S:4,T:4,W:2,I:4,A:2,Ld:9},equipment:'Hand weapon'}};
const ARMOUR_SAVE={fullPlate:4,heavy:5,light:6};
export const isCharacter=u=>u?.role==='wizard'||u?.role==='character';
export const profile=u=>u?.role==='character'?{...CHARACTERS[u.kind].profile,save:ARMOUR_SAVE[u.armour]??7}:u?.role==='warmachine'?{...WAR_MACHINE_CREW[u.faction].profile,A:Math.max(0,u.crew)}:u?.role==='wizard'?{...WIZARDS[u.faction].profile,T:WIZARDS[u.faction].profile.T+(u.petrified??0)}:u?.role==='missile'?MISSILE[u.faction].profile:FACTIONS[u?.faction??'chaos'].profile;
export const equipment=u=>u?.role==='character'?[CHARACTERS[u.kind].equipment,u.weapon==='greatWeapon'?'great weapon':null,{fullPlate:'full plate armour',heavy:'heavy armour',light:'light armour'}[u.armour]].filter(Boolean).join(' · '):u?.role==='wizard'?WIZARDS[u.faction].equipment:u?.role==='missile'?MISSILE[u.faction].equipment:FACTIONS[u?.faction??'chaos'].equipment;
export const missileWeapon=u=>u?.role==='missile'?MISSILE[u.faction].weapon:null;
// A regiment's block is its files wide and as many ranks deep as its starting models need.
export const startingModels=u=>u?.models??20,filesOf=u=>u?.files??5,ranksOf=u=>Math.ceil(startingModels(u)/filesOf(u));
export const size=u=>{if(u?.role==='warmachine')return {w:ROCKET_BASE.w,h:ROCKET_BASE.h};const b=FACTIONS[u?.faction??'chaos'].base/25.4;return isCharacter(u)?{w:b,h:b}:{w:filesOf(u)*b,h:ranksOf(u)*b};};
export const baseSize=u=>FACTIONS[u?.faction??'chaos'].base;
export const COMMAND_SLOTS={1:'M',2:'S',3:'C'};
export function hasShield(u){return u?.shields??(u?.role==='infantry'&&!!FACTIONS[u?.faction??'chaos'].shield);}
// Purchased command stand in the middle of the front rank: musician, standard at the centre, champion.
export function commandSlots(u){const c=Math.floor(filesOf(u)/2),bought=u?.command??{M:true,S:true,C:true},slots={};for(const [role,col]of [['M',c-1],['S',c],['C',c+1]])if(bought[role]&&col>=0&&col<filesOf(u)&&col<startingModels(u))slots[col]=role;return slots;}
export function commandAlive(u,role){if(isCharacter(u)||u?.role==='warmachine')return false;const entry=Object.entries(commandSlots(u)).find(([,r])=>r===role);return !!entry&&aliveCount(u)>0&&!(u.deadModels??[]).includes(Number(entry[0]));}
// Unit Strength = models x Unit Strength per model for the troop type (war machines: starting Wounds).
export const TROOP_TYPES={regular:{name:'Regular Infantry',perModel:1,perRank:5},heavy:{name:'Heavy Infantry',perModel:1,perRank:4},character:{name:'Infantry character',perModel:1},warmachine:{name:'War Machine',perModel:'wounds'}};
export function troopType(u){return u?.role==='warmachine'?'warmachine':isCharacter(u)?'character':u?.troop??(FACTIONS[u?.faction??'chaos'].heavy?'heavy':'regular');}
export function startingWounds(u){return u?.role==='warmachine'||isCharacter(u)?(u.startingWounds??(isCharacter(u)?profile(u).W:3)):startingModels(u)*(profile(u).W??1);}
export function unitStrength(u){if(!u||aliveCount(u)===0||u.x===null&&!u.offBoardPursuit)return 0;const per=TROOP_TYPES[troopType(u)].perModel;return per==='wounds'?startingWounds(u):aliveCount(u)*per;}
export function startingUnitStrength(u){const per=TROOP_TYPES[troopType(u)].perModel;return per==='wounds'?startingWounds(u):isCharacter(u)?1:startingModels(u)*per;}
export function championProfile(u){return {...profile(u),A:u.role==='missile'&&u.faction==='empire'?1:2,BS:u.role==='missile'&&u.faction==='empire'?4:profile(u).BS,Ld:u.faction==='orc'?7:profile(u).Ld};}
export function setOpponent(s,faction){if(s.stage!=='deployment')throw Error('Choose the opposing army before battle starts.');if(!['orc','empire','chaos'].includes(faction))throw Error('Unknown army.');s.units=s.units.filter(u=>u.id!=='I7');for(const u of s.units.filter(u=>u.team==='iron')){u.faction=faction;u.name=u.role==='missile'?MISSILE[faction].name:FACTIONS[faction].name;u.x=null;u.y=null;}if(faction==='empire')s.units.push(createWizard('iron','empire'));s.cannons=createCannons(faction);return faction;}
export const PHASES=['strategy','movement','shooting','combat'];
export const armyName=(team,s)=>team==='ash'?'Chaos Dwarfs · Red':`${FACTIONS[s?.units.find(u=>u.team==='iron')?.faction??'chaos'].army} · ${s?.units.find(u=>u.team==='iron')?.faction==='orc'?'Green':'Blue'}`;
const EPS=1e-8,rad=d=>d*Math.PI/180;
export function createWizard(team,faction){return {id:team==='ash'?'A6':'I7',team,faction,role:'wizard',name:WIZARDS[faction].name,level:2,spells:[],castThisTurn:[],wounds:2,petrified:0,engineerUsed:false,x:null,y:null,heading:team==='ash'?0:180,moved:false,shot:false,spent:0,movementMode:null,marchRequired:null,marchTest:null,engaged:null,charge:null,impetuousTest:null,combatResolved:false,fleeing:false,rallyAttempted:false,rallied:false,deadModels:[]};}
const runtime=()=>({x:null,y:null,moved:false,shot:false,spent:0,movementMode:null,marchRequired:null,marchTest:null,engaged:null,charge:null,impetuousTest:null,combatResolved:false,fleeing:false,rallyAttempted:false,rallied:false,shieldwallUsed:false,deadModels:[]});
const REGIMENT_IDS={ash:['A1','A2','A3','A4','A7','A8','A9','A10'],iron:['I1','I2','I3','I4','I8','I9','I10','I11']},CHARACTER_IDS={ash:['A12','A13'],iron:['I12','I13']};
// Units, the launcher and cannons for one side from its roster. The engine models one wizard,
// one Deathshrieker (red) and Great Cannons (opponent) per side.
function armyFromRoster(team,roster){
 const faction=roster.faction,units=[],cannons=[];let rocket=null,regiments=0;
 for(const item of roster.entries){
  const e=A.entryOf(faction,item.entry),paid={cost:A.entryCost(faction,item),category:e.category,entry:item.entry,general:!!item.general};
  if(e.role==='wizard'){if(units.some(u=>u.role==='wizard'))throw Error('This engine supports one wizard per army.');units.push({...createWizard(team,faction),name:e.name,...paid});}
  else if(e.role==='warmachine'&&team==='ash'&&item.entry==='deathshrieker'){if(rocket)throw Error('This engine supports one Deathshrieker per army.');rocket={...paid};}
  else if(e.role==='warmachine'&&team==='iron'&&item.entry==='greatCannon'){if(cannons.length>=2)throw Error('This engine supports at most two Great Cannons.');cannons.push({id:'I'+(5+cannons.length),name:'Great Cannon '+'AB'[cannons.length],...machineFields('iron','empire'),x:null,y:null,heading:180,wounds:3,crew:3,shot:false,disabledUntil:0,lastShot:null,...paid});}
  else if(e.role==='infantry'||e.role==='missile'){const id=REGIMENT_IDS[team][regiments++];if(!id)throw Error('Too many regiments for this engine.');units.push({id,team,faction,role:e.role,name:e.name,models:item.models,files:item.files??5,command:{C:!!item.command?.C,S:!!item.command?.S,M:!!item.command?.M},troop:e.troop,shields:!!(e.options?.shields&&(e.options.shields.required||item.options?.shields)),spears:!!item.options?.spears,...paid,heading:team==='ash'?0:180,...runtime()});}
  else if(e.role==='character'){const id=CHARACTER_IDS[team][units.filter(u=>u.role==='character').length];if(!id)throw Error('Too many characters for this engine.');units.push({id,team,faction,role:'character',kind:e.kind,name:e.name,weapon:item.options?.greatWeapon?'greatWeapon':null,armour:item.options?.fullPlate?'fullPlate':null,wounds:CHARACTERS[e.kind].profile.W,...paid,heading:team==='ash'?0:180,...runtime()});}
  else throw Error(`${e.name} cannot be fielded by this engine for this side.`);
 }
 return {units,cannons,rocket};
}
export function createGame(opponent='chaos',{format='classic',board=null,points=null,deployment=null,rosters=null}={}){if(!FACTIONS[opponent])throw Error('Unknown army.');const fmt=F.format(format),field=F.boardFor(fmt,{board,points}),setup=deployment??(fmt.deployment?.map?{map:fmt.deployment.map,depth:fmt.deployment.depth}:null);
 if(fmt.id==='battle-march')return createRosterGame(opponent,fmt,field,setup,points,rosters);const units=Array.from({length:8},(_,i)=>{const faction=i<4?'chaos':opponent,role=i%4===3?'missile':'infantry';return {id:(i<4?'A':'I')+(i%4+1),team:i<4?'ash':'iron',faction,role,name:role==='missile'?MISSILE[faction].name:FACTIONS[faction].name,x:null,y:null,heading:i<4?0:180,moved:false,shot:false,spent:0,movementMode:null,marchRequired:null,marchTest:null,engaged:null,charge:null,impetuousTest:null,combatResolved:false,fleeing:false,rallyAttempted:false,rallied:false,shieldwallUsed:false,deadModels:[]};});units.push(createWizard('ash','chaos'));if(opponent==='empire')units.push(createWizard('iron','empire'));return {stage:'deployment',team:'ash',round:1,selected:'A1',rocket:{id:'A5',name:'Deathshrieker Rocket Launcher',...machineFields('ash','chaos'),x:null,y:null,heading:0,wounds:3,crew:3,shot:false,disabledUntil:0,lastShot:null},cannons:createCannons(opponent),units,history:[],vortices:[],fatedDispelUsed:false,format:{id:fmt.id,name:fmt.name,rulesVersion:fmt.rulesVersion,points:fmt.points?(points??fmt.points.default):null,rounds:fmt.rounds,deployment:setup,resultPolicy:fmt.resultPolicy??null,optional:{...(fmt.optional??{})}},board:field,zones:F.deploymentZones(fmt,field,setup??{}),firstPlayer:'ash',turnLog:[]};}
function createRosterGame(opponent,fmt,field,setup,points,rosters){
 const limit=points??fmt.points.default,chosen={ash:rosters?.ash??A.defaultRoster('chaos',limit),iron:rosters?.iron??A.defaultRoster(opponent,limit)};
 if(!chosen.iron)throw Error(A.GAPS[opponent]?.[0]??`No Battle March army is available for ${opponent}.`);
 if(chosen.ash.faction!=='chaos'||chosen.iron.faction!==opponent)throw Error('Red must be Chaos Dwarfs and the opponent must match the chosen army.');
 const red=armyFromRoster('ash',chosen.ash),blue=armyFromRoster('iron',chosen.iron);
 const rocket={id:'A5',name:'Deathshrieker Rocket Launcher',...machineFields('ash','chaos'),x:null,y:null,heading:0,wounds:3,crew:3,shot:false,disabledUntil:0,lastShot:null,...(red.rocket??{absent:true,wounds:0,crew:0})};
 const armies=Object.fromEntries(Object.entries(chosen).map(([team,roster])=>[team,{roster,validation:A.validateRoster(roster,limit),source:A.SOURCES[roster.faction]}]));
 return {stage:'deployment',team:'ash',round:1,selected:red.units[0]?.id,rocket,cannons:blue.cannons,units:[...red.units,...blue.units],history:[],vortices:[],fatedDispelUsed:false,
  format:{id:fmt.id,name:fmt.name,rulesVersion:fmt.rulesVersion,points:limit,rounds:fmt.rounds,deployment:setup,resultPolicy:fmt.resultPolicy,optional:{...fmt.optional}},board:field,zones:F.deploymentZones(fmt,field,setup??{}),firstPlayer:'ash',turnLog:[],armies,sources:{system:A.SOURCES.system,preferences:A.PREFERENCES}};
}
export function getUnit(s,id=s.selected){return s.units.find(u=>u.id===id)??(id!==undefined&&id!==null?combatants(s).find(u=>u.id===id):undefined);}
export function heading(u){return u.heading??(u.team==='ash'?0:180);}
export function normalize(a){return ((a%360)+360)%360;}
export function localPoint(u,x,y){const a=rad(heading(u)),c=Math.cos(a),s=Math.sin(a);return {x:u.x+x*c-y*s,y:u.y+x*s+y*c};}
export function corners(u){const {w,h}=size(u);return [[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([x,y])=>localPoint(u,x,y));}
export function rectangle(u){const p=corners(u);return {left:Math.min(...p.map(v=>v.x)),right:Math.max(...p.map(v=>v.x)),top:Math.min(...p.map(v=>v.y)),bottom:Math.max(...p.map(v=>v.y))};}
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function pointSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;const t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
function intersects(a,b,c,d){const x=cross(a,b,c),y=cross(a,b,d),z=cross(c,d,a),w=cross(c,d,b);if(((x>EPS&&y< -EPS)||(x< -EPS&&y>EPS))&&((z>EPS&&w< -EPS)||(z< -EPS&&w>EPS)))return true;return Math.min(pointSegment(a,c,d),pointSegment(b,c,d),pointSegment(c,a,b),pointSegment(d,a,b))<EPS;}
function inside(p,poly){if(poly.length<3)return false;let sign=0;for(let i=0;i<poly.length;i++){const c=cross(poly[i],poly[(i+1)%poly.length],p);if(Math.abs(c)<EPS)continue;const n=Math.sign(c);if(sign&&sign!==n)return false;sign=n;}return true;}
export function polygonGap(a,b){if(inside(a[0],b)||inside(b[0],a))return 0;let best=Infinity;for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){const p=a[i],q=a[(i+1)%a.length],r=b[j],s=b[(j+1)%b.length];if(intersects(p,q,r,s))return 0;best=Math.min(best,pointSegment(p,r,s),pointSegment(q,r,s),pointSegment(r,p,q),pointSegment(s,p,q));}return best;}
function hull(points){const p=[...points].sort((a,b)=>a.x-b.x||a.y-b.y);const half=items=>{const out=[];for(const v of items){while(out.length>1&&cross(out.at(-2),out.at(-1),v)<=EPS)out.pop();out.push(v);}return out;};return [...half(p).slice(0,-1),...half([...p].reverse()).slice(0,-1)];}
export function gap(a,b){return polygonGap(corners(a),corners(b));}
// Distance from a footprint to a circle (0 when they touch or overlap).
export function circleGap(poly,c){if(inside({x:c.x,y:c.y},poly))return 0;let best=Infinity;for(let i=0;i<poly.length;i++)best=Math.min(best,pointSegment({x:c.x,y:c.y},poly[i],poly[(i+1)%poly.length]));return Math.max(0,best-c.r);}
export function terrainBlocks(s,poly){return (s?.terrain??[]).some(t=>t.impassable&&circleGap(poly,t)<EPS);}
function terrainBlocksSight(s,a,b){return (s?.terrain??[]).some(t=>t.blocksSight&&pointSegment({x:t.x,y:t.y},a,b)<t.r-EPS);}
// ---- Temporary effects (such as a landmark's property) sit beside a unit's permanent rules. ----
export function hasRule(u,rule){return !!u?.effects?.some(e=>e.rule===rule);}
export function magicResistance(u){return Math.max(hasRule(u,'magicResistance')?2:0,u?.role==='wizard'&&u?.faction==='empire'?1:0);}
export const boardOf=s=>s?.board??BOARD;
function offBoard(u,s){const r=rectangle(u),b=boardOf(s);return r.left< -EPS||r.right>b.width+EPS||r.top< -EPS||r.bottom>b.height+EPS;}
function withinPolygon(p,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(pointSegment(p,a,b)<1e-6)return true;if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
export function zoneOf(s,team){return (s?.zones??F.deploymentZones('classic',BOARD))[team];}
// A footprint is inside a zone (which may be concave) when every corner is inside it and no
// zone corner pokes into the footprint.
export function inZone(s,team,footprint){const zone=zoneOf(s,team);return footprint.every(p=>withinPolygon(p,zone))&&!zone.some(z=>inside(z,footprint)&&!footprint.some((p,i)=>pointSegment(z,p,footprint[(i+1)%footprint.length])<1e-6));}
export function zoneBounds(s,team){const z=zoneOf(s,team);return {left:Math.min(...z.map(p=>p.x)),right:Math.max(...z.map(p=>p.x)),top:Math.min(...z.map(p=>p.y)),bottom:Math.max(...z.map(p=>p.y))};}
function claimStandard(s,u,by){if(u&&!u.standardClaimed&&commandAlive(u,'S')){u.standardClaimed=by;(s.trophies??=[]).push({unit:u.id,team:by,round:s.round});}}
function destroyUnit(u){Object.assign(u,{x:null,y:null,destroyed:true,fleeing:false,engaged:null});}
export function checkPosition(state,unit,x,y,deployment=false){
  if(!Number.isFinite(x)||!Number.isFinite(y))return 'Enter valid coordinates.';
  const candidate={...unit,x,y},r=rectangle(candidate);
  if(offBoard(candidate,state))return 'The whole regiment must stay on the battlefield.';
  if(terrainBlocks(state,corners(candidate)))return 'Units cannot enter impassable terrain.';
  if(deployment&&!inZone(state,unit.team,corners(candidate)))return 'Keep the entire block inside its own deployment zone.';
  if(state.units.some(u=>u.id!==unit.id&&u.x!==null&&gap(candidate,u)<1-EPS))return 'Keep at least 1″ between regiments.';
  if(state.rocket?.x!==null&&polygonGap(corners(candidate),rocketFootprint(state.rocket.x,state.rocket.y))<1-EPS)return 'Keep at least 1″ between regiments and the Deathshrieker.';
  if(state.cannons?.some(c=>c.x!==null&&polygonGap(corners(candidate),cannonFootprint(c.x,c.y))<1-EPS))return 'Keep at least 1″ between regiments and cannons.';
  return null;
}
export function place(s,id,x,y){if(s.stage!=='deployment')throw Error('Deployment is finished.');const u=getUnit(s,id);if(!u)throw Error('Unknown regiment.');const error=checkPosition(s,u,x,y,true);if(error)throw Error(error);Object.assign(u,{x,y});return u;}
export function placeRocket(s,x,y){if(s.stage!=='deployment')throw Error('Deploy the launcher before battle.');if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Enter valid coordinates.');if(!inZone(s,'ash',corners({...s.rocket,x,y})))throw Error('Keep the whole launcher in the red deployment zone.');const footprint=rocketFootprint(x,y);if(s.units.some(u=>u.x!==null&&polygonGap(corners(u),footprint)<1-EPS))throw Error('Keep the launcher at least 1″ from regiments.');Object.assign(s.rocket,{x,y});return s.rocket;}
export function placeCannon(s,id,x,y){if(s.stage!=='deployment')throw Error('Deploy cannons before battle.');const cannon=s.cannons.find(c=>c.id===id);if(!cannon)throw Error('Choose an Empire cannon.');if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Enter valid coordinates.');const footprint=cannonFootprint(x,y);if(!inZone(s,'iron',corners({...cannon,x,y})))throw Error('Keep the whole cannon in the blue deployment zone.');if(s.units.some(u=>u.x!==null&&polygonGap(corners(u),footprint)<1-EPS)||s.cannons.some(c=>c.id!==id&&c.x!==null&&polygonGap(cannonFootprint(c.x,c.y),footprint)<1-EPS))throw Error('Keep cannons at least 1″ from other units.');Object.assign(cannon,{x,y});return cannon;}
export function autoDeploy(s,{team=null}={}){if(s.stage!=='deployment')throw Error('Deployment is finished.');if((s.format?.id??'classic')!=='classic')return searchDeploy(s,team);s.units.forEach((u,i)=>{if(!team||u.team===team)Object.assign(u,{x:u.id==='A6'?3.5:u.id==='I7'?70:[18,36,54,64][i%4],y:u.team==='ash'?42:6});});if(!team||team==='ash')placeRocket(s,8,42);if(!team||team==='iron')for(const [i,c]of s.cannons.entries())placeCannon(s,c.id,[8,45][i],6);}
// Spread each army across the middle of its zone, trying the nearest legal spots.
function searchDeploy(s,team){
 for(const side of team?[team]:['ash','iron']){
  const pieces=[...s.units.filter(u=>u.team===side&&!isCharacter(u)),...combatants(s).filter(m=>m.role==='warmachine'&&m.team===side),...s.units.filter(u=>u.team===side&&isCharacter(u))];
  for(const p of pieces){p.x=null;p.y=null;}
  const b=zoneBounds(s,side),middle=(b.top+b.bottom)/2;
  pieces.forEach((p,i)=>{
   const ideal=b.left+(b.right-b.left)*(i+1)/(pieces.length+1),{h}=size(p),rows=[middle,b.top+h/2+.01,b.bottom-h/2-.01];
   const xs=Array.from({length:Math.ceil((b.right-b.left)*2)+1},(_,k)=>b.left+k/2).sort((a,c)=>Math.abs(a-ideal)-Math.abs(c-ideal));
   for(const y of rows)for(const x of xs){try{if(p.role==='warmachine'&&p.team==='ash')placeRocket(s,x,y);else if(p.role==='warmachine')placeCannon(s,p.id,x,y);else place(s,p.id,x,y);return;}catch{}}
   throw Error(`No legal deployment space for ${p.name??p.id}.`);
  });
 }
}
export function begin(s,random=Math.random,{firstPlayer=null}={}){if(s.stage!=='deployment')throw Error('The battle already started.');if(s.units.some(u=>u.x===null)||s.rocket.x===null&&!s.rocket.absent||s.cannons.some(c=>c.x===null))throw Error('Deploy all units, the Deathshrieker, and Empire cannons before battle.');for(const u of s.units.filter(u=>u.role==='wizard'))u.spells=generateSpells(random);s.firstPlayer=firstPlayer??s.firstPlayer??'ash';s.stage='strategy';s.team=s.firstPlayer;s.selected=s.units.find(u=>u.team===s.team)?.id;}
export function canAct(s,u){return s.stage==='movement'&&u?.team===s.team&&aliveCount(u)>0&&!u.moved&&!u.engaged&&!u.charge&&!u.fleeing&&u.x!==null;}
// Why a unit cannot act right now, in plain words, or null when it can.
export function inactionReason(s,u){
 if(!u||s.stage==='deployment')return null;
 if(s.stage==='finished')return 'The battle is over.';
 if(u.destroyed||aliveCount(u)===0)return 'Destroyed.';
 if(u.x===null)return u.offBoardPursuit?'Off the battlefield after pursuing; it returns in its next Movement phase.':'Not on the battlefield.';
 if(u.team!==s.team)return 'Waiting: it is the other army’s turn.';
 const spellNow=u.role==='wizard'&&u.spells.some(key=>BATTLE_MAGIC[key]?.phase===s.stage&&spellTargets(s,u.id,key).some(t=>canCast(s,u.id,key,t.id)));
 if(s.stage==='strategy'){if(u.fleeing&&!u.rallyAttempted||spellNow)return null;if(u.fleeing)return 'Failed to rally this turn and is still fleeing.';return u.role==='wizard'?'No hex or enchantment can be cast now.':'Nothing to do in Strategy: only fleeing units rally and wizards cast here.';}
 if(s.stage==='movement'){
  if(u.engaged)return 'Engaged in combat: units in combat cannot move.';
  if(u.fleeing)return 'Fleeing: it must rally in its Strategy phase before it can move.';
  if(s.movementStep==='declare'){
   if(u.charge)return 'Charge declared; waiting for charges to be rolled.';
   if(canAct(s,u)&&availableCharges(s,u).length)return null;
   if(u.rallied)return 'Rallied this turn, so it cannot charge.';
   const enemies=combatants(s).filter(v=>v.team!==u.team&&v.x!==null&&aliveCount(v)>0),reasons=enemies.map(t=>chargePlan(s,u,t).error).filter(Boolean);
   return 'Cannot charge: '+(reasons.find(r=>!/Beyond/.test(r))&&enemies.some(t=>gap(u,t)<=profile(u).M+6)?reasons.find(r=>!/Beyond/.test(r)):`no enemy within its ${profile(u).M+6}″ maximum charge range.`);
  }
  if(s.movementStep==='charges')return u.charge?.status==='declared'?null:'Waiting for declared charges to be rolled.';
  if(canAct(s,u)||spellNow)return null;
  if(u.charge?.status==='success')return 'Charged into combat this turn.';
  if(u.charge?.status==='failed')return 'Failed its charge: it cannot move again this turn.';
  if(u.moved)return 'Already moved this turn.';
  return 'Cannot move now.';
 }
 if(s.stage==='shooting'){
  if(u.role==='wizard')return spellNow?null:'No magic missile or vortex can be cast now.';
  if(u.role!=='missile')return 'Not a missile unit: only missile troops, war machines and wizards act in Shooting.';
  if(u.shot)return 'Already shot this phase.';
  if(u.engaged)return 'Engaged in combat: it cannot shoot.';
  if(u.fleeing)return 'Fleeing: it cannot shoot.';
  if(u.charge)return 'Charged this turn: it cannot shoot.';
  if(u.movementMode==='march')return 'Marched this turn: it cannot shoot.';
  const plans=shootingTargets(s,u).map(t=>t.plan);if(plans.some(p=>!p.error))return null;
  return 'No target: '+(plans.map(p=>p.error).find(e=>!/Choose an enemy/.test(e))??'no enemy is in range, arc and line of sight.');
 }
 if(u.engaged&&!u.combatResolved)return null;
 return u.engaged?'Already fought this Combat phase.':'Not engaged in combat.';
}
export function phaseComplete(s,u){if(s.stage==='deployment'||u.team!==s.team)return false;if(aliveCount(u)===0)return true;if(s.stage==='movement')return u.moved||!!u.engaged;if(s.stage==='shooting')return u.role!=='missile'||u.shot||!!u.engaged||u.fleeing;return true;}
export function needsMarchTest(s,u){if(u.marchRequired!==null&&u.marchRequired!==undefined)return u.marchRequired;return s.units.some(v=>v.team!==u.team&&v.x!==null&&gap(u,v)<=8+EPS);}
export function marchTest(s,id,dice){const u=getUnit(s,id);if(!canAct(s,u))throw Error('Select an unmoved regiment from the active army.');if(!needsMarchTest(s,u))throw Error('No nearby enemy. This march needs no test.');if(u.marchTest!==null)throw Error('This regiment already took its march test this turn.');if(!Array.isArray(dice)||dice.length!==2||dice.some(d=>!Number.isInteger(d)||d<1||d>6))throw Error('A march test requires two D6.');enterRemaining(s);u.marchTest=dice.reduce((a,b)=>a+b,0)<=leadership(u,'march');return u.marchTest;}
export function wheelCost(angle,u){return 2*size(u).w*Math.sin(rad(Math.abs(angle))/2);}
export function maxWheel(mode='advance',u){return 2*Math.asin((mode==='march'?2*profile(u).M:profile(u).M)/(2*size(u).w))*180/Math.PI;}
export function wheelPose(u,angle){const {w,h}=size(u),pivot=localPoint(u,(angle<0?-1:1)*w/2,-h/2),a=rad(angle),x=u.x-pivot.x,y=u.y-pivot.y;return {...u,x:pivot.x+x*Math.cos(a)-y*Math.sin(a),y:pivot.y+x*Math.sin(a)+y*Math.cos(a),heading:normalize(heading(u)+angle)};}
export function forwardPose(u,distance){const a=rad(heading(u));return {...u,x:u.x+Math.sin(a)*distance,y:u.y-Math.cos(a)*distance};}
export function planMove(u,order){const kind=order.kind??'advance',mode=order.mode??'advance',angle=Number(order.angle??0),distance=Number(order.distance??0),side=order.side??1;let after=u,cost=0,pivot=null;
  if(kind==='wheel'){after=wheelPose(u,angle);cost=wheelCost(angle,u);pivot=localPoint(u,(angle<0?-1:1)*size(u).w/2,-size(u).h/2);}
  if(kind==='pivot'){after={...u,heading:normalize(heading(u)+angle)};cost=profile(u).M;pivot={x:u.x,y:u.y};}
  const end=kind==='pivot'?after:kind==='back'?forwardPose(after,-distance):kind==='side'?{...after,...localPoint(after,side*distance,0)}:forwardPose(after,distance);
  return {start:{...u},afterWheel:after,end,cost:cost+(kind==='pivot'?0:['back','side'].includes(kind)?2*distance:distance),wheelCost:kind==='wheel'?cost:0,allowance:mode==='march'?2*profile(u).M:profile(u).M,pivot,kind,mode,angle,distance,side};
}
function crossedVortices(s,u,start,end){return (s.vortices??[]).filter(v=>getUnit(s,v.caster)?.team!==u.team&&pointSegment({x:v.x,y:v.y},{x:start.x,y:start.y},{x:end.x,y:end.y})<=1.5+Math.max(size(u).w,size(u).h)/2+EPS);}
function forwardError(s,u,start,end){const swept=hull([...corners(start),...corners(end)]);if(terrainBlocks(s,swept))return 'Impassable terrain blocks this path. Shorten the move or go around it.';for(const v of s.units){if(v.id===u.id||v.x===null)continue;if(polygonGap(swept,corners(v))<1-EPS)return 'Another regiment blocks this path. Shorten the move.';}if(s.rocket?.x!==null&&polygonGap(swept,rocketFootprint(s.rocket.x,s.rocket.y))<1-EPS)return 'The Deathshrieker blocks this path. Shorten the move.';if(s.cannons.some(c=>c.x!==null&&polygonGap(swept,cannonFootprint(c.x,c.y))<1-EPS))return 'A cannon blocks this path. Shorten the move.';return null;}
export function orderError(s,u,order){
  if(!canAct(s,u))return 'Select an unmoved regiment from the active army.';
  const {kind='advance',mode='advance',angle=0,distance=0}=order;
  if(!['advance','back','side','wheel','pivot'].includes(kind)||!['advance','march'].includes(mode))return 'Choose a valid movement order.';
  if(!Number.isFinite(angle)||!Number.isFinite(distance)||distance<0)return 'Enter a valid angle and distance.';
  if(kind==='advance'&&(distance<=0||angle!==0))return 'Choose a forward distance.';
  if((kind==='back'||kind==='side')&&(distance<=0||angle!==0))return 'Choose a sideways or backward distance.';
  if(kind==='side'&&![-1,1].includes(order.side))return 'Choose left or right for a sideways move.';
  if(kind==='wheel'&&(angle===0||Math.abs(angle)>90))return 'Choose a wheel angle between −90° and 90°.';
  if(kind==='pivot'&&(angle===0||Math.abs(angle)>180||distance!==0||mode==='march'))return 'A reform pivots up to 180°, uses the whole move, and cannot march.';
  const plan=planMove(u,order);
  const difficult=crossedVortices(s,u,plan.start,plan.end).length>0,allowance=Math.max(1,profile(u).M-(difficult?1:0))*(mode==='march'?2:1);
  if(u.movementMode&&u.movementMode!==mode)return 'Movement mode is locked after the first step. Undo all steps to change it.';
  if(kind==='pivot'&&(u.spent??0)>EPS)return 'A reform requires the whole unused movement allowance.';
  if((u.spent??0)+plan.cost>allowance+EPS)return 'This order exceeds the movement allowance.';
  if(mode==='march'&&needsMarchTest(s,u)&&u.marchTest!==true)return u.marchTest===false?`March test failed. This unit can still advance up to ${profile(u).M}″.`:'Take the march Leadership test first.';
  const error=checkPosition(s,plan.end,plan.end.x,plan.end.y);if(error)return error;
  if(kind==='pivot')return null;
  if(kind==='wheel'){
    // Sweep the leading edge, not the rear ranks (FAQ 1.5.3). The small additional
    // clearance covers the sagitta between 0.25-degree subdivisions of the curve.
    const steps=Math.ceil(Math.abs(angle)/.25);let previous=corners(u).slice(0,2);
    for(let i=1;i<=steps;i++){
      const pose=wheelPose(u,angle*i/steps);if(offBoard(pose,s))return 'The wheel would leave the battlefield.';
      const front=corners(pose).slice(0,2),sweep=hull([...previous,...front]);
      for(const v of s.units){if(v.id===u.id||v.x===null)continue;if(polygonGap(sweep,corners(v))<1.0001-EPS)return 'Another regiment blocks the leading edge of this wheel.';}
      if(combatants(s).some(m=>m.role==='warmachine'&&m.x!==null&&polygonGap(sweep,corners(m))<1.0001-EPS))return 'A war machine blocks the leading edge of this wheel.';
      if(terrainBlocks(s,sweep))return 'Impassable terrain blocks this wheel.';
      previous=front;
    }
  }
  if(distance>EPS)return forwardError(s,u,plan.afterWheel,plan.end);
  return null;
}
function remember(s,u){s.history.push({id:u.id,x:u.x,y:u.y,heading:heading(u),moved:u.moved,spent:u.spent??0,movementMode:u.movementMode??null,marchRequired:u.marchRequired??null});}
export function commitOrder(s,id,order){const u=getUnit(s,id);const error=orderError(s,u,order);if(error)throw Error(error);const plan=planMove(u,order),vortices=crossedVortices(s,u,plan.start,plan.end);enterRemaining(s);remember(s,u);const marchRequired=needsMarchTest(s,u),spent=(u.spent??0)+plan.cost,allowance=Math.max(1,profile(u).M-(vortices.length?1:0))*(plan.mode==='march'?2:1);Object.assign(u,{x:plan.end.x,y:plan.end.y,heading:plan.end.heading,spent,movementMode:plan.mode,marchRequired,moved:plan.kind==='pivot'||spent>=allowance-EPS});s.lastVortexHits=vortices.map(v=>({caster:v.caster,unit:u.id,...magicDamage(s,u,Math.ceil(rollD6(1)[0]/2)+3,3,2,Math.random,true)}));return plan;}
export function movementError(s,u,distance,mode){return orderError(s,u,{kind:'advance',distance,mode,angle:0});}
export function move(s,id,distance,mode){return commitOrder(s,id,{kind:'advance',distance,mode,angle:0});}
export function hold(s,id){const u=getUnit(s,id);if(!canAct(s,u))throw Error('This regiment cannot take orders now.');enterRemaining(s);remember(s,u);u.moved=true;}
export function undo(s){if(s.stage!=='movement')throw Error('Undo is available during Movement only.');const last=s.history.pop();if(!last)throw Error('No move to undo this turn.');const u=getUnit(s,last.id);Object.assign(u,{x:last.x,y:last.y,heading:last.heading,moved:last.moved,spent:last.spent,movementMode:last.movementMode,marchRequired:last.marchRequired});s.selected=u.id;}
// Format rules modules (such as Battle March objectives and scoring) register what happens at
// the end of each player's turn and at the end of the game.
const FORMAT_RULES={};
export function registerFormatRules(id,rules){FORMAT_RULES[id]=rules;}
function formatRules(s){const id=s.format?.id??'classic';if(id==='classic')return null;const rules=FORMAT_RULES[id];if(!rules)throw Error(`The rules module for "${id}" is not loaded.`);return rules;}
// Runs once per player turn, even when empty phases were skipped; the last turn ends the game.
export function endOfPlayerTurn(s,team=s.team){
 const key=`${s.round}:${team}`;s.turnLog??=[];if(s.turnLog.includes(key))return false;s.turnLog.push(key);
 formatRules(s)?.endOfTurn?.(s,team);
 if(s.format?.rounds&&s.round>=s.format.rounds&&team!==s.firstPlayer)finishGame(s,'The final round is complete.');
 return true;
}
export function finishGame(s,reason){if(s.stage==='finished')return s.result;s.stage='finished';s.pendingCombat=null;s.combatSession=null;s.result={reason,...(formatRules(s)?.endOfGame?.(s)??{})};return s.result;}
export function nextTurn(s,random=Math.random){if(s.stage!=='combat')throw Error('Finish the Combat phase first.');endOfPlayerTurn(s,s.team);if(s.stage==='finished')return;s.stage='strategy';s.team=s.team==='ash'?'iron':'ash';if(s.team===(s.firstPlayer??'ash'))s.round++;s.units.forEach(u=>{u.moved=false;u.shot=false;u.spent=0;u.movementMode=null;u.marchRequired=null;u.marchTest=null;if(u.pursuitPending&&u.engaged)u.pursuitPending=false;else u.charge=null;u.impetuousTest=null;u.combatResolved=false;u.rallyAttempted=false;u.arcaneUrgency=false;if(u.role==='wizard'){u.castThisTurn=[];u.magicExhausted=false;u.engineerUsed=false;if(u.team===s.team){u.oakenShield=false;u.ashStorm=false;}}if(u.arrowCurseCaster===s.team){u.arrowCurse=false;u.arrowCurseCaster=null;}});s.fatedDispelUsed=false;s.vortexReports=driftVortices(s,random);s.rocket.shot=false;s.rocket.lastShot=null;s.cannons.forEach(c=>{c.shot=false;c.lastShot=null;});s.history=[];s.selected=s.units.find(u=>u.team===s.team).id;}
export function nextPhase(s){if(s.stage==='finished')throw Error('The battle is over.');if(s.pendingSpell)throw Error('Resolve the dispel of the spell just cast first.');if(s.stage==='strategy'&&s.units.some(u=>u.team===s.team&&u.x!==null&&u.fleeing&&!u.rallyAttempted))throw Error('Attempt to rally every fleeing regiment first.');if(s.units.some(u=>u.charge?.status==='declared'))throw Error('Resolve all declared charges first.');if(s.stage==='combat'&&(s.combatSession||s.pendingCombat||combatPairs(s).length))throw Error('Resolve every combat and its outcome first.');const i=PHASES.indexOf(s.stage);if(i<0)throw Error('Begin the battle first.');s.movementReopened=false;s.movementHistory=i===1?s.history:i===2?s.movementHistory:null;if(i===3)nextTurn(s);else{s.stage=PHASES[i+1];s.history=[];if(s.stage==='movement'){s.movementStep='declare';if(!s.units.some(u=>u.team===s.team&&canAct(s,u)&&availableCharges(s,u).length))beginRemaining(s);}s.shootingSkipped=false;if(s.stage==='shooting'&&!phaseHasActions(s)){s.stage='combat';s.shootingSkipped=true;}if(s.stage==='combat')combatants(s).forEach(u=>u.combatResolved=false);}return s.stage;}
// Movement can be reopened until the active army acts in Shooting (or, when Shooting
// was skipped, in Combat). Its undo history is kept so the last moves can be taken back.
function castIn(s,phase){return s.units.some(u=>u.team===s.team&&u.role==='wizard'&&u.castThisTurn.some(key=>BATTLE_MAGIC[key]?.phase===phase));}
export function canReturnToMovement(s){
 const shootingUntouched=!s.units.some(u=>u.team===s.team&&u.shot)&&!(s.team==='ash'&&s.rocket.shot)&&!(s.team==='iron'&&s.cannons.some(c=>c.shot))&&!castIn(s,'shooting');
 if(s.stage==='shooting')return shootingUntouched;
 return s.stage==='combat'&&!!s.shootingSkipped&&shootingUntouched&&!s.combatSession&&!s.pendingCombat&&!s.units.some(u=>u.combatResolved)&&!castIn(s,'combat');
}
export function returnToMovement(s){if(!canReturnToMovement(s))throw Error('Movement can only be reopened before anything happens in Shooting or Combat.');Object.assign(s,{stage:'movement',movementStep:'remaining',history:s.movementHistory??[],movementHistory:null,movementReopened:true,shootingSkipped:false});return s.stage;}
export function phaseHasActions(s){
 if(s.stage==='deployment'||s.stage==='finished'||s.pendingSpell)return true;
 const active=s.units.filter(u=>u.team===s.team&&u.x!==null&&aliveCount(u)>0);
 const spells=phase=>active.some(u=>u.role==='wizard'&&u.spells.some(key=>BATTLE_MAGIC[key]?.phase===phase&&spellTargets(s,u.id,key).some(t=>canCast(s,u.id,key,t.id))));
 if(s.stage==='strategy')return active.some(u=>u.fleeing&&!u.rallyAttempted)||spells('strategy')||s.round===1&&active.some(u=>u.role==='wizard'&&!u.castThisTurn.length&&u.spells.some(key=>SPELL_ROLL.includes(key))&&!u.spells.some(key=>['hammerhand','hashutCurse','ashStorm','hashutFlames'].includes(key)));
 if(s.stage==='movement')return s.movementStep==='declare'?active.some(u=>u.charge?.status==='declared'||canAct(s,u)&&availableCharges(s,u).length):s.movementStep==='charges'?active.some(u=>u.charge?.status==='declared'):active.some(u=>canAct(s,u))||spells('movement')||!!s.movementReopened;
 if(s.stage==='shooting')return availableShots(s).length>0||canFireRocket(s)&&[false,true].some(indirect=>rocketTargets(s,{indirect}).some(t=>!t.error))||s.cannons.some(c=>canFireCannon(s,c.id)&&(cannonTargets(s,c.id,{mode:'grape'}).some(t=>!t.error)||Array.from({length:11},(_,aimShort)=>cannonTargets(s,c.id,{mode:'ball',aimShort}).some(t=>!t.error)).some(Boolean)))||spells('shooting');
 return !!s.pendingCombat||!!s.combatSession||combatPairs(s).length>0;
}
export function skipEmptySteps(s){
 const skipped=[];
 for(let guard=0;guard<8&&s.stage!=='deployment'&&!phaseHasActions(s);guard++){
  const before=s.stage==='movement'?`Movement · ${s.movementStep}`:s.stage;
  if(s.stage==='movement'&&s.movementStep==='declare')finishDeclarations(s);
  else if(s.stage==='movement'&&s.movementStep==='charges')enterRemaining(s);
  else nextPhase(s);
  skipped.push(before);
 }
 return skipped;
}
export function rally(s,id,random=Math.random){const u=getUnit(s,id);if(s.stage!=='strategy'||u?.team!==s.team||u.x===null||!u.fleeing||u.rallyAttempted)throw Error('Select a fleeing regiment in its own Strategy phase.');const dice=rollD6(2,random),success=dice[0]+dice[1]<=leadership(u,'rally');u.rallyAttempted=true;u.rallied=success;if(success)u.fleeing=false;return {id,dice,success};}
export function rollD6(count,random=Math.random){if(!Number.isInteger(count)||count<1||count>20)throw Error('Choose 1 to 20 dice.');return Array.from({length:count},()=>1+Math.floor(random()*6));}

export const BATTLE_MAGIC={hammerhand:{name:'Hammerhand',type:'assailment',phase:'combat',cast:7,range:0},fireball:{name:'Fireball',type:'magic missile',phase:'shooting',cast:8,range:24},arrow:{name:'Curse of Arrow Attraction',type:'hex',phase:'strategy',cast:7,range:21},pillar:{name:'Pillar of Fire',type:'magical vortex',phase:'shooting',cast:9,range:12},urgency:{name:'Arcane Urgency',type:'conveyance',phase:'movement',cast:9,range:15},shield:{name:'Oaken Shield',type:'enchantment',phase:'strategy',cast:7,range:0},coward:{name:'Curse of Cowardly Flight',type:'hex',phase:'strategy',cast:8,range:15},hashutCurse:{name:'Curse of Hashut',type:'magic missile',phase:'shooting',cast:9,range:18},ashStorm:{name:'Storm of Ash',type:'hex',phase:'strategy',cast:10,range:0},hashutFlames:{name:'Flames of Hashut',type:'assailment',phase:'combat',cast:9,range:0}};
export const SPELL_TEXT={
 fireball:'The target enemy unit suffers 2D6 Strength 4 hits (AP –) with Flaming Attacks. Needs line of sight; cannot target a unit in combat.',
 arrow:'Until your next Start of Turn, you may re-roll natural 1s To Hit when shooting at the target enemy unit.',
 pillar:'Remains in Play. Place a 3″ template within 12″; it is difficult terrain and scatters D6″ each Start of Turn. Any enemy unit that moves through it, or that it moves over, suffers D3+3 Strength 3 hits (AP –2) with Flaming Attacks. The opponent can dispel it in their Strategy phase by beating 9.',
 urgency:'Cast in Remaining Moves: a friendly unit that has already moved this Movement phase, and is not fleeing, may move again.',
 shield:'Until your next Start of Turn, the caster has a 5+ Ward save against any wounds.',
 coward:'The target enemy unit must take a Panic test at once; if it fails, it flees 2D6″ directly away from the caster (a unit in combat gives ground instead).',
 hammerhand:'Assailment: one enemy unit the caster is fighting suffers 2D3 Strength 4 hits (AP –2).',
 hashutCurse:'Targets an enemy character in range and line of sight, even one in combat. It takes a Toughness test: if passed, D3 Strength 2 hits; if failed, D3+2 Strength 5 hits with no armour saves.',
 ashStorm:'Until your next Start of Turn, enemy units within 9″ of the caster suffer –1 To Hit (natural 6s are unaffected).',
 hashutFlames:'Assailment: one enemy unit the caster is fighting suffers D3+1 Strength 4 hits (AP –1) with Flaming Attacks.',
};
export const SPELL_ROLL=['fireball','arrow','pillar','urgency','shield','coward'];
export function generateSpells(random=Math.random){const pool=[...SPELL_ROLL],out=[];for(let i=0;i<2;i++)out.push(pool.splice(Math.min(pool.length-1,Math.floor(random()*pool.length)),1)[0]);return out;}
export function exchangeSignature(s,id,spell,replacement='hammerhand'){const u=getUnit(s,id),choices=u?.faction==='chaos'?['hammerhand','hashutCurse','ashStorm','hashutFlames']:['hammerhand'];if(s.stage!=='strategy'||s.round!==1||u?.role!=='wizard'||u.castThisTurn.length||!SPELL_ROLL.includes(spell)||!u.spells.includes(spell)||!choices.includes(replacement)||u.spells.some(k=>choices.includes(k)))throw Error('Exchange one generated spell for a permitted signature before casting.');u.spells.splice(u.spells.indexOf(spell),1,replacement);return u.spells;}
function spellVision(u,t){const a=rad(-heading(u)),dx=t.x-u.x,dy=t.y-u.y,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);return ly<0&&Math.abs(lx)<=-ly+Math.max(size(t).w,size(t).h)/2+EPS;}
export function spellTargets(s,id,key){const u=getUnit(s,id),spell=BATTLE_MAGIC[key];if(!u||!spell)return [];if(['shield','pillar','ashStorm'].includes(key))return [u];return s.units.filter(t=>t.x!==null&&aliveCount(t)>0&&(key==='urgency'?t.team===u.team&&t.moved&&!t.fleeing&&!t.engaged:t.team!==u.team)&&(!spell.range||gap(u,t)<=spell.range+EPS)&&(['hammerhand','hashutFlames'].includes(key)?u.engaged===t.id:key==='hashutCurse'?isCharacter(t)&&spellVision(u,t):!t.engaged&&spellVision(u,t))&&(!['fireball','hashutCurse'].includes(key)||modelCanSee(s,u,t,modelSquares(s,u)[0],spell.range)));
}
export function canCast(s,id,key,targetId){const u=getUnit(s,id),spell=BATTLE_MAGIC[key],t=getUnit(s,targetId);if(s.pendingSpell||!u||u.role!=='wizard'||u.team!==s.team&&!['hammerhand','hashutFlames'].includes(key)||u.x===null||u.fleeing||!spell||s.stage!==spell.phase||key==='urgency'&&s.movementStep!=='remaining'||['fireball','pillar','hashutCurse'].includes(key)&&u.movementMode==='march'||!u.spells.includes(key)||u.castThisTurn.includes(key)||u.castThisTurn.length>=u.level||u.magicExhausted)return false;if(u.engaged&&!['hammerhand','hashutFlames','shield','ashStorm'].includes(key))return false;if(['shield','pillar','ashStorm'].includes(key))return targetId===id;return !!t&&spellTargets(s,id,key).includes(t);}
function magicDamage(s,target,hits,strength,ap,random,flaming=false,ignoreArmour=false){const dice={wound:[],save:[],ward:[]};let wounds=0,unsaved=0;for(let i=0;i<hits&&aliveCount(target)>0;i++){const wound=rollD6(1,random)[0];dice.wound.push(wound);if(wound<Math.max(2,Math.min(6,4+profile(target).T-strength)))continue;wounds++;if(!ignoreArmour){const armour=rollD6(1,random)[0];dice.save.push(armour);const save=Math.max(2,Math.min(7,profile(target).save+ap));if(armour>=save)continue;}const ward=target.oakenShield?5:target.role==='wizard'&&target.faction==='chaos'&&flaming?5:7;if(ward<=6){const value=rollD6(1,random)[0];dice.ward.push(value);if(value>=ward)continue;}removeCasualties(s,target,1);unsaved++;}return {hits,wounds,unsaved,dice};}
function miscast(s,u,random){if(u.faction==='chaos'){const test=rollD6(1,random)[0];if(test>profile(u).T){removeCasualties(s,u,1);u.petrified++;return {kind:'Sorcerer’s Curse',test,wounds:1,toughness:profile(u).T};}}const dice=rollD6(2,random),sum=dice[0]+dice[1];if(sum<=6){const radius=sum<=4?2.5:1.5,strength=sum<=4?10:6,ap=sum<=4?4:2;const affected=s.units.filter(t=>t.x!==null&&Math.hypot(t.x-u.x,t.y-u.y)<=radius+Math.max(size(t).w,size(t).h)/2).map(t=>({id:t.id,...magicDamage(s,t,1,strength,ap,random)}));return {kind:sum<=4?'Dimensional Cascade':'Calamitous Detonation',dice,affected,cast:false};}if(sum===7){const hit=magicDamage(s,u,1,4,1,random);return {kind:'Careless Conjuration',dice,hit,cast:false};}u.magicExhausted=true;return {kind:sum<=9?'Barely Controlled Power':'Power Drain',dice,cast:true,undispellable:sum>=10};}
function magicPanic(s,caster,target,random){const dice=rollD6(2,random),passed=dice[0]+dice[1]<=leadership(target);if(passed)return {dice,passed};if(target.engaged)return {dice,passed,gaveGround:true};target.fleeing=true;target.moved=true;target.heading=normalize(Math.atan2(target.x-caster.x,-(target.y-caster.y))*180/Math.PI);const flee=rollD6(2,random),move=fleeMove(s,target,flee[0]+flee[1],random);return {dice,passed,flee,fledOffBoard:move.fledOffBoard,move};}
// Casting and dispelling are two steps. attemptSpell makes the casting roll; a cast spell that
// can still be dispelled waits in s.pendingSpell until the defending player picks a Wizardly
// Dispel (one eligible Wizard), the Fated Dispel, or no dispel with resolveDispel.
// castSpell does both at once for the AI and tests.
function wizardDispellers(s,caster,targetId){return s.units.filter(v=>v.role==='wizard'&&v.team!==caster.team&&v.x!==null&&aliveCount(v)>0&&!v.fleeing&&gap(v,caster)<=(v.level>=3?24:18)+EPS&&(!v.engaged||v.id===targetId));}
export function dispelOptions(s){const p=s.pendingSpell;if(!p)return null;const caster=getUnit(s,p.caster);return {caster:p.caster,spell:p.key,team:caster.team==='ash'?'iron':'ash',casting:p.report.casting,wizards:wizardDispellers(s,caster,p.target).map(v=>({id:v.id,bonus:Math.ceil(v.level/2),distance:gap(v,caster)})),fated:!s.fatedDispelUsed};}
export function castSpell(s,id,key,targetId,random=Math.random,{dispel='none',dispeller=null,point=null}={}){
 if(!['none','wizard','fated'].includes(dispel))throw Error('Choose a legal dispel.');const u=getUnit(s,id);
 if(u&&dispel==='wizard'&&!wizardDispellers(s,u,targetId).some(v=>!dispeller||v.id===dispeller))throw Error('No opposing wizard is in dispel range.');
 if(dispel==='fated'&&s.fatedDispelUsed)throw Error('The Fated Dispel was already used this turn.');
 const report=attemptSpell(s,id,key,targetId,random,{point});if(!report.pending)return report;
 return resolveDispel(s,dispel==='wizard'?dispeller??dispelOptions(s).wizards[0].id:dispel,random);
}
export function attemptSpell(s,id,key,targetId,random=Math.random,{point=null}={}){if(!canCast(s,id,key,targetId))throw Error('This spell cannot be cast on that target now.');const u=getUnit(s,id),t=getUnit(s,targetId),spell=BATTLE_MAGIC[key];if(key==='pillar'&&point&&(!Number.isFinite(point.x)||!Number.isFinite(point.y)||Math.hypot(point.x-u.x,point.y-u.y)>12+EPS||point.x<1.5||point.x>boardOf(s).width-1.5||point.y<1.5||point.y>boardOf(s).height-1.5))throw Error('Place the 3″ Pillar within 12″ of the caster and on the battlefield.');const dice=rollD6(2,random),casting=dice[0]+dice[1]+Math.ceil(u.level/2)-(t.id!==id?magicResistance(t):0),report={caster:id,spell:key,target:targetId,dice,casting,cast:false,dispel:null,effect:null};u.castThisTurn.push(key);if(key==='pillar')s.vortices=s.vortices.filter(v=>v.caster!==id);if(dice[0]===1&&dice[1]===1){report.miscast=miscast(s,u,random);if(!report.miscast.cast)return report;report.casting=spell.cast;}else if(casting<spell.cast&&!(dice[0]===6&&dice[1]===6))return report;report.cast=true;
 report.perfect=dice[0]===6&&dice[1]===6||!!report.miscast?.undispellable;
 s.pendingSpell={caster:id,key,target:targetId,point,report};const options=dispelOptions(s);
 if(!report.perfect&&(options.wizards.length||options.fated)){report.pending=true;return report;}
 s.pendingSpell=null;applySpell(s,{caster:id,key,target:targetId,point,report},random);return report;}
// Wizardly Dispel: 2D6 + half the level (rounded up); Fated Dispel: unmodified 2D6, once per turn,
// no range. Either must beat the casting result (ties fail); a natural double 6 always dispels.
// A natural double 1 always fails, and on a Wizardly Dispel the Wizard miscasts (Outclassed in the Art).
export function resolveDispel(s,choice='none',random=Math.random){
 const p=s.pendingSpell;if(!p)throw Error('No spell is waiting for a dispel.');const options=dispelOptions(s),report=p.report;
 if(choice!=='none'){
  const wizard=choice==='fated'?null:options.wizards.find(w=>w.id===choice);
  if(choice==='fated'&&!options.fated)throw Error('The Fated Dispel was already used this turn.');
  if(choice!=='fated'&&!wizard)throw Error('Choose a Wizard in dispel range, the Fated Dispel, or no dispel.');
  if(!wizard)s.fatedDispelUsed=true;
  const dice=rollD6(2,random),double1=dice[0]===1&&dice[1]===1,total=dice[0]+dice[1]+(wizard?wizard.bonus:0);
  report.dispel={kind:wizard?'wizard':'fated',by:wizard?.id??null,dice,total,success:!double1&&(dice[0]===6&&dice[1]===6||total>report.casting)};
  if(double1&&wizard)report.dispel.miscast=miscast(s,getUnit(s,wizard.id),random);
 }
 s.pendingSpell=null;report.pending=false;
 if(report.dispel?.success){report.cast=false;return report;}
 applySpell(s,p,random);return report;
}
function applySpell(s,{caster:id,key,target:targetId,point,report},random){const u=getUnit(s,id),t=getUnit(s,targetId);
 if(key==='fireball')report.effect=magicDamage(s,t,rollD6(2,random).reduce((a,b)=>a+b,0),4,0,random,true);
 else if(key==='hammerhand')report.effect=magicDamage(s,t,rollD6(2,random).reduce((a,b)=>a+Math.ceil(b/2),0),4,2,random);
 else if(key==='hashutFlames')report.effect=magicDamage(s,t,Math.ceil(rollD6(1,random)[0]/2)+1,4,1,random,true);
 else if(key==='hashutCurse'){const test=rollD6(1,random)[0],passed=test<=profile(t).T;report.effect={test,passed,...magicDamage(s,t,passed?Math.ceil(rollD6(1,random)[0]/2):Math.ceil(rollD6(1,random)[0]/2)+2,passed?2:5,0,random,false,!passed)};}
 else if(key==='ashStorm'){u.ashStorm=true;report.effect={radius:9};}
 else if(key==='arrow'){t.arrowCurse=true;t.arrowCurseCaster=u.team;report.effect={rerollOnes:true};}
 else if(key==='shield'){u.oakenShield=true;report.effect={ward:5};}
 else if(key==='coward')report.effect=magicPanic(s,u,t,random);
 else if(key==='urgency'){t.moved=false;t.spent=0;t.movementMode=null;t.charge=null;t.arcaneUrgency=true;report.effect={moveAgain:true};}
 else if(key==='pillar'){const p=point??{x:t.x,y:t.y};s.vortices=s.vortices.filter(v=>v.caster!==id);s.vortices.push({caster:id,x:p.x,y:p.y,radius:1.5});report.effect={point:p};}
 return report;}
export function driftVortices(s,random=Math.random){const reports=[];for(const v of s.vortices){const angle=Math.floor(random()*8)*Math.PI/4,distance=rollD6(1,random)[0],from={x:v.x,y:v.y};v.x+=Math.sin(angle)*distance;v.y-=Math.cos(angle)*distance;const affected=[];for(const u of s.units.filter(u=>u.x!==null&&u.team!==getUnit(s,v.caster)?.team)){const a={x:from.x,y:from.y},b={x:v.x,y:v.y},dx=b.x-a.x,dy=b.y-a.y,q=dx*dx+dy*dy,p=q?Math.max(0,Math.min(1,((u.x-a.x)*dx+(u.y-a.y)*dy)/q)):0;if(Math.hypot(u.x-a.x-p*dx,u.y-a.y-p*dy)<=1.5+Math.max(size(u).w,size(u).h)/2)affected.push({id:u.id,...magicDamage(s,u,Math.ceil(rollD6(1,random)[0]/2)+3,3,2,random,true)});}reports.push({caster:v.caster,from,to:{x:v.x,y:v.y},distance,affected});}s.vortices=s.vortices.filter(v=>v.x>=-1.5&&v.x<=boardOf(s).width+1.5&&v.y>=-1.5&&v.y<=boardOf(s).height+1.5&&getUnit(s,v.caster)?.x!==null);return reports;}
export function vortexDispellers(s,casterId){const vortex=s.vortices.find(v=>v.caster===casterId);if(!vortex)return [];return s.units.filter(u=>u.role==='wizard'&&u.team!==getUnit(s,casterId)?.team&&u.x!==null&&aliveCount(u)>0&&!u.fleeing&&!u.engaged&&Math.hypot(u.x-vortex.x,u.y-vortex.y)<=(u.level>=3?24:18)+EPS);}
export function canDispelVortex(s,casterId){return s.stage==='strategy'&&!s.pendingSpell&&s.vortices.some(v=>v.caster===casterId)&&getUnit(s,casterId)?.team!==s.team;}
export function dispelVortex(s,casterId,random=Math.random,mode='wizard',dispellerId=null){const vortex=s.vortices.find(v=>v.caster===casterId);if(!vortex)throw Error('No Pillar of Fire remains in play.');if(!canDispelVortex(s,casterId))throw Error('Dispel a Remains in Play spell in your own Strategy phase (Conjuration).');if(!['wizard','fated'].includes(mode))throw Error('Choose a dispel method.');const wizard=mode==='wizard'?vortexDispellers(s,casterId).find(u=>!dispellerId||u.id===dispellerId):null;if(mode==='wizard'&&!wizard)throw Error('No opposing wizard is in dispel range.');if(mode==='fated'&&s.fatedDispelUsed)throw Error('Fated Dispel already used.');const dice=rollD6(2,random),double1=dice[0]===1&&dice[1]===1,total=dice[0]+dice[1]+(wizard?Math.ceil(wizard.level/2):0),success=!double1&&(dice[0]===6&&dice[1]===6||total>BATTLE_MAGIC.pillar.cast);if(mode==='fated')s.fatedDispelUsed=true;const result={mode,by:wizard?.id??null,dice,total,success};if(double1&&wizard)result.miscast=miscast(s,wizard,random);if(success)s.vortices=s.vortices.filter(v=>v!==vortex);return result;}
export function canEngineerReroll(s){const u=getUnit(s,'A6'),r=s.rocket;return !!u&&u.x!==null&&!u.fleeing&&!u.engaged&&!u.engineerUsed&&r.x!==null&&Math.hypot(u.x-r.x,u.y-r.y)<=profile(u).Ld+EPS;}
export function engineerReroll(s,dice,which,random=Math.random){if(!canEngineerReroll(s))throw Error('The Daemonsmith cannot assist the Deathshrieker now.');if(!['artillery','scatter'].includes(which))throw Error('Choose one Artillery or Scatter die.');const next={...dice},fresh=rollRocketDice(random);next[which]=fresh[which];if(which==='scatter')next.hitArrow=fresh.hitArrow;getUnit(s,'A6').engineerUsed=true;return next;}

// Ranged attacks are measured from individual model centres. The front 90-degree
// arc extends from each front base corner; other regiments block a clear shot.
function shootingModels(s,u){const cells=modelSquares(s,u).filter(m=>!m.dead);return cells.filter(m=>m.row===0||(missileWeapon(u)?.volley&&cells.filter(v=>v.row===m.row).indexOf(m)<Math.ceil(cells.filter(v=>v.row===m.row).length/2)));}
function shotPoint(u,m){return localPoint(u,m.x+m.size/2,m.y+m.size/2);}
function sightBlocked(s,u,t,a,b){return terrainBlocksSight(s,a,b)||s.units.some(v=>v.x!==null&&v.id!==u.id&&v.id!==t.id&&aliveCount(v)>0&&(()=>{const poly=corners(v);return poly.some((p,i)=>intersects(a,b,p,poly[(i+1)%4]))||inside(a,poly)||inside(b,poly);})());}
function modelCanSee(s,u,t,m,range){const origin=shotPoint(u,m),a=rad(-heading(u)),targets=[{x:t.x,y:t.y},...corners(t)];return targets.some(point=>{const dx=point.x-origin.x,dy=point.y-origin.y,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);return ly<0&&Math.abs(lx)<=-ly+m.size/2+EPS&&Math.hypot(dx,dy)<=range+EPS&&!sightBlocked(s,u,t,origin,point);});}
export function canShoot(s,u){return s.stage==='shooting'&&u?.team===s.team&&u.role==='missile'&&u.x!==null&&aliveCount(u)>0&&!u.shot&&!u.engaged&&!u.fleeing&&!u.charge&&u.movementMode!=='march';}
export function shootingPlan(s,u,t,{reaction=false}={}){
 if(!u||!t||u.team===t.team||u.x===null||t.x===null||u.role!=='missile'||aliveCount(u)===0||aliveCount(t)===0)return {error:'Choose an enemy target for a missile regiment.'};
 if(reaction){if(u.engaged||u.fleeing||u.movementMode==='march')return {error:'Engaged, fleeing, or marched regiments cannot Stand & Shoot.'};if(gap(u,t)+EPS<profile(t).M)return {error:`Charger is too close for Stand & Shoot (less than M${profile(t).M}″).`};}
 else if(!canShoot(s,u))return {error:'This regiment cannot shoot in this phase.'};
 else if(t.engaged)return {error:'Cannot shoot at a regiment in combat.'};
 const weapon=missileWeapon(u),range=weapon.range,half=range/2,clear=shootingModels(s,u).filter(m=>modelCanSee(s,u,t,m,reaction?Math.max(range,gap(u,t)+size(t).w):range));
 if(!clear.length)return {error:'Target is outside the front arc, range, or clear line of sight.',range,half};
 const distance=gap(u,t),models=clear.map(m=>{const point=shotPoint(u,m),poly=corners(t),modelDistance=Math.min(...poly.map((p,i)=>pointSegment(point,p,poly[(i+1)%4])));return {index:m.index,bs:m.command==='C'?championProfile(u).BS:profile(u).BS,distance:modelDistance,long:!reaction&&modelDistance>half+EPS};}),long=models.some(m=>m.long),modifiers=[];
 if(!reaction&&(u.moved||(u.spent??0)>0)&&!weapon.ignoreMove)modifiers.push({label:'Moved',value:-1});
 if(long)modifiers.push({label:'Long range',value:weapon.ignoreLong?0:-1});
 if(reaction)modifiers.push({label:'Stand & Shoot',value:weapon.ignoreStand?0:-1});
 if(weapon.multiple)modifiers.push({label:'Multiple Shots D3',value:0});
 const modifier=modifiers.reduce((n,v)=>n+v.value,0),toHit=Math.max(2,Math.min(7,7-profile(u).BS-modifier));
 const hitNumbers=models.map(m=>Math.max(2,Math.min(7,7-m.bs-(modifier+(long&&!m.long&&!weapon.ignoreLong?1:0)))));
 return {target:t.id,weapon,range,half,distance,band:reaction?'Stand & Shoot':models.every(m=>m.long)?'far':long?'mixed':'close',shooters:clear.length,closeShooters:models.filter(m=>!m.long).length,farShooters:models.filter(m=>m.long).length,models,modifiers,modifier,toHit,hitLabel:Math.min(...hitNumbers)===Math.max(...hitNumbers)?`${hitNumbers[0]}+`:`${Math.min(...hitNumbers)}+–${Math.max(...hitNumbers)}+`,reaction};
}
export function shootingTargets(s,u){return s.units.filter(t=>t.team!==u?.team&&t.x!==null&&aliveCount(t)>0).map(t=>({unit:t,plan:shootingPlan(s,u,t)}));}
export function availableShots(s){return s.stage==='shooting'?s.units.filter(u=>canShoot(s,u)&&shootingTargets(s,u).some(t=>!t.plan.error)):[];}
export function finishShooting(s,id){const u=getUnit(s,id);if(!canShoot(s,u))throw Error('This regiment cannot finish shooting now.');u.shot=true;return u;}
function shootDice(count,random){return Array.from({length:count},()=>1+Math.floor(random()*6));}
function stormPenalty(s,u){return s.units.some(w=>w.role==='wizard'&&w.ashStorm&&w.x!==null&&w.team!==u.team&&Math.hypot(w.x-u.x,w.y-u.y)<=9+EPS)?1:0;}
function fireMissiles(s,u,t,plan,random=Math.random){
 const dice={shots:plan.weapon.multiple?shootDice(plan.shooters,random).map(d=>Math.ceil(d/2)):[],hit:[],reroll:[],wound:[],save:[],ward:[]};
 const shots=plan.weapon.multiple?dice.shots.reduce((a,b)=>a+b,0):plan.shooters,hitTargets=plan.models.flatMap((m,i)=>Array.from({length:plan.weapon.multiple?dice.shots[i]:1},()=>Math.max(2,Math.min(stormPenalty(s,u)?6:7,7-m.bs-(plan.modifiers.filter(v=>v.label!=='Long range').reduce((n,v)=>n+v.value,0))-(m.long&&!plan.weapon.ignoreLong? -1:0)+stormPenalty(s,u)))));
 dice.hit=shootDice(shots,random);if(t.arrowCurse){for(const [i,n]of dice.hit.entries())if(n===1){const reroll=shootDice(1,random)[0];dice.reroll.push(reroll);dice.hit[i]=reroll;}}const hits=dice.hit.filter((n,i)=>n>=hitTargets[i]).length;
 const toWound=Math.max(2,Math.min(6,4+profile(t).T-plan.weapon.strength));dice.wound=shootDice(hits,random);if(plan.weapon.hailshot&&plan.shooters>=10){dice.woundReroll=[];for(const [i,n]of dice.wound.entries())if(n===1){const r=shootDice(1,random)[0];dice.woundReroll.push(r);dice.wound[i]=r;}}
 const wounds=dice.wound.filter(n=>n>=toWound).length;
 const toSave=Math.min(7,Math.max(2,profile(t).save-(hasShield(t)?1:0)+plan.weapon.ap));dice.save=shootDice(wounds,random);
 let unsaved=Math.min(remainingWounds(t),dice.save.filter(n=>n<toSave).length);if(t.oakenShield){dice.ward=shootDice(unsaved,random);unsaved=dice.ward.filter(n=>n<5).length;}removeCasualties(s,t,unsaved);if(aliveCount(t)===0){t.destroyed=true;t.engaged=null;u.engaged=null;}
 return {...plan,from:u.id,to:t.id,shots,hits,wounds,unsaved,toWound,toSave,hitTargets,dice};
}
export function shoot(s,id,target,random=Math.random){const u=getUnit(s,id),t=getUnit(s,target),plan=shootingPlan(s,u,t);if(plan.error)throw Error(plan.error);const result=fireMissiles(s,u,t,plan,random);u.shot=true;s.lastShooting=result;return result;}

// Charge routes use one measured leading-corner wheel, then a free alignment wheel.
// Face selection is fixed by the charger's starting position.
export function chargeFace(u,t){
 const a=rad(-heading(t)),c=Math.cos(a),si=Math.sin(a),{w}=size(u),b=w/5,counts={front:0,rear:0,'left flank':0,'right flank':0};
 for(let i=0;i<5;i++){const p=localPoint(u,(i-2)*b,-size(u).h/2),dx=p.x-t.x,dy=p.y-t.y,x=dx*c-dy*si,y=dx*si+dy*c;counts[Math.abs(x)<=Math.abs(y)?y<0?'front':'rear':x<0?'left flank':'right flank']++;}
 return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
}
function directChargePlan(s,u,t){
 if(!u||!t||u.x===null||t.x===null||u.team===t.team)return {error:'Choose an enemy regiment.'};
 if(u.rallied)return {error:'A regiment that rallied this turn cannot charge.'};
 if(u.engaged||t.engaged||u.fleeing||aliveCount(u)===0||aliveCount(t)===0)return {error:'Already engaged. Multiple-unit combats are not supported yet.'};
 if(gap(u,t)>profile(u).M+6+EPS)return {error:`Beyond the maximum ${profile(u).M+6}″ charge range.`};
 const a=rad(-heading(u)),dx=t.x-u.x,dy=t.y-u.y,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);
 if(ly>=0||Math.abs(lx)>-ly+EPS)return {error:'Target centre is outside the front arc in this prototype.'};
 const face=chargeFace(u,t),offset={'front':0,'rear':180,'left flank':-90,'right flank':90}[face],out=normalize(heading(t)+offset),desired=normalize(out+180),angle=((desired-heading(u)+540)%360)-180;
 if(Math.abs(angle)>90+EPS)return {error:'This charge needs more than a 90° wheel.'};
 const after=Math.abs(angle)>EPS?wheelPose(u,angle):{...u},a2=rad(desired),f={x:Math.sin(a2),y:-Math.cos(a2)},right={x:Math.cos(a2),y:Math.sin(a2)};
 const own=size(u),theirs=size(t),targetDepth=face.includes('flank')?theirs.w:theirs.h,targetWidth=face.includes('flank')?theirs.h:theirs.w;
 const rel={x:t.x-after.x,y:t.y-after.y},distance=rel.x*f.x+rel.y*f.y-(own.h+targetDepth)/2,lateral=rel.x*right.x+rel.y*right.y;
 if(distance< -EPS)return {error:'No forward approach to the target face.'};
 // Require maximum possible frontage; do not silently slide a unit sideways.
 if(Math.abs(lateral)>Math.abs(own.w-targetWidth)/2+.02)return {error:'Line up the frontages first. Offset / closing-the-door charges are not supported yet.'};
 const end=forwardPose(after,Math.max(0,distance)),cost=wheelCost(angle,u)+Math.max(0,distance),plan={start:{...u},afterWheel:after,contact:end,end,angle,distance:Math.max(0,distance),wheelCost:wheelCost(angle,u),alignAngle:0,cost,face,target:t.id};
 if(cost>profile(u).M+6+EPS)return {...plan,error:`The wheel and approach exceed the maximum ${profile(u).M+6}″ charge range.`};
 if(offBoard(end,s))return {...plan,error:'Charge ends off the battlefield.'};
 const others=combatants(s).filter(v=>v.x!==null&&v.id!==u.id&&v.id!==t.id);
 if(others.some(v=>gap(end,v)<1-EPS))return {...plan,error:'Another regiment blocks the contact position.'};
 if(terrainBlocks(s,corners(end)))return {...plan,error:'Impassable terrain blocks the contact position.'};
 const steps=Math.max(1,Math.ceil(Math.abs(angle)/.25));let prev=corners(u).slice(0,2);
 for(let i=1;i<=steps;i++){
  const pose=wheelPose(u,angle*i/steps),front=corners(pose).slice(0,2),sweep=hull([...prev,...front]);
  if(offBoard(pose,s)||polygonGap(sweep,corners(t))<EPS||others.some(v=>polygonGap(sweep,corners(v))<1-EPS)||terrainBlocks(s,sweep))return {...plan,error:'The charge wheel is obstructed.'};prev=front;
 }
 const swept=hull([...corners(after),...corners(end)]);
 if(others.some(v=>polygonGap(swept,corners(v))<1-EPS))return {...plan,error:'Another regiment blocks the charge path.'};
 if(terrainBlocks(s,swept))return {...plan,error:'Impassable terrain blocks the charge path.'};
 return plan;
}
// The aligned pose after contact: flush against the face u meets, turned square to it and
// slid no further than needed to keep maximum frontage (the free alignment wheel).
function alignedContact(u,t,face=chargeFace(u,t)){
 const out=normalize(heading(t)+{front:0,rear:180,'left flank':-90,'right flank':90}[face]),own=size(u),theirs=size(t),depth=face.includes('flank')?theirs.w:theirs.h,width=face.includes('flank')?theirs.h:theirs.w;
 const oa=rad(out),normal={x:Math.sin(oa),y:-Math.cos(oa)},right={x:Math.cos(oa),y:Math.sin(oa)},lateral=(u.x-t.x)*right.x+(u.y-t.y)*right.y,limit=Math.abs(own.w-width)/2,centering=Math.max(-limit,Math.min(limit,lateral));
 return {...u,x:t.x+normal.x*(own.h+depth)/2+right.x*centering,y:t.y+normal.y*(own.h+depth)/2+right.y*centering,heading:normalize(out+180)};
}
export function chargePlan(s,u,t){
 const direct=directChargePlan(s,u,t);if(!direct.error)return direct;
 if(!u||!t||u.x===null||t.x===null||u.team===t.team||u.engaged||t.engaged||u.fleeing||u.rallied||gap(u,t)>profile(u).M+6+EPS||/front arc/.test(direct.error))return direct;
 const face=chargeFace(u,t),offset={front:0,rear:180,'left flank':-90,'right flank':90}[face],out=normalize(heading(t)+offset),desired=normalize(out+180),own=size(u),theirs=size(t),depth=face.includes('flank')?theirs.w:theirs.h,width=face.includes('flank')?theirs.h:theirs.w;
 const oa=rad(out),normal={x:Math.sin(oa),y:-Math.cos(oa)},right={x:Math.cos(oa),y:Math.sin(oa)},others=combatants(s).filter(v=>v.x!==null&&v.id!==u.id&&v.id!==t.id),limit=profile(u).M+6;
 let best=null;
 for(let angle=-90;angle<=90;angle+=5){
  const after=Math.abs(angle)>EPS?wheelPose(u,angle):{...u},wheel=wheelCost(angle,u);if(wheel>=limit||offBoard(after,s))continue;
  let blocked=false,previous=corners(u).slice(0,2);
  for(let i=1,n=Math.ceil(Math.abs(angle)/2);i<=n;i++){const pose=wheelPose(u,angle*i/n),front=corners(pose).slice(0,2),sweep=hull([...previous,...front]);if(offBoard(pose,s)||polygonGap(sweep,corners(t))<EPS||others.some(v=>polygonGap(sweep,corners(v))<1-EPS)||terrainBlocks(s,sweep)){blocked=true;break;}previous=front;}
  if(blocked)continue;
  const remaining=limit-wheel;
  for(let d=.1;d<=remaining+.1;d+=.1){
   const contact=forwardPose(after,Math.min(d,remaining));if(offBoard(contact,s)||others.some(v=>gap(contact,v)<1-EPS)||terrainBlocks(s,corners(contact))){blocked=true;break;}
   if(gap(contact,t)>.12)continue;
   if(chargeFace(contact,t)!==face)break;
   const end=alignedContact(contact,t,face);
   const alignAngle=((desired-heading(contact)+540)%360)-180;
   if(Math.abs(alignAngle)>90+EPS||Math.hypot(end.x-contact.x,end.y-contact.y)>.2+2*own.w*Math.sin(rad(Math.abs(alignAngle))/2)||offBoard(end,s)||gap(end,t)>.02||others.some(v=>gap(end,v)<1-EPS)||terrainBlocks(s,corners(end)))break;
   const swept=hull([...corners(after),...corners(contact)]);if(others.some(v=>polygonGap(swept,corners(v))<1-EPS)||terrainBlocks(s,swept))break;
   const plan={start:{...u},afterWheel:after,contact,end,angle,distance:Math.min(d,remaining),wheelCost:wheel,alignAngle,cost:wheel+Math.min(d,remaining),face,target:t.id};
   if(!best||plan.cost<best.cost)best=plan;break;
  }
 }
 return best??direct;
}
export function declareCharge(s,id,target){
 const u=getUnit(s,id),t=getUnit(s,target);
 if(s.stage!=='movement'||s.movementStep!=='declare'||!canAct(s,u))throw Error('Declare charges before Remaining Moves with an unengaged regiment.');
 if(FACTIONS[u.faction??'chaos'].impetuous&&u.impetuousTest===null)throw Error('Roll this Orc Mob’s Impetuous test before declaring a charge.');
 if(s.units.some(v=>v.charge?.status==='declared'&&v.charge.target===target))throw Error('Only one charger per target is supported.');
 const p=chargePlan(s,u,t);if(p.error)throw Error(p.error);
 const reaction=t.role==='warmachine'?'hold':'pending';
 u.charge={target,status:'declared',reaction,initialPlan:p};s.history=[];return {...p,reaction};
}
export function canStandShoot(s,defender,charger){return !!defender&&!!charger&&defender.role==='missile'&&!defender.engaged&&!defender.fleeing&&defender.movementMode!=='march'&&aliveCount(defender)>0&&gap(defender,charger)+EPS>=profile(charger).M&&!shootingPlan(s,defender,charger,{reaction:true}).error;}
export function chargeReaction(s,chargerId,choice,random=Math.random){
 const charger=getUnit(s,chargerId),defender=getUnit(s,charger?.charge?.target);
 if(s.stage!=='movement'||s.movementStep!=='declare'||charger?.charge?.status!=='declared'||charger.charge.reaction!=='pending')throw Error('No charge reaction is pending.');
 if(!['hold','stand-shoot','flee'].includes(choice))throw Error('Choose Hold, Stand & Shoot, or Flee.');
 if(choice==='hold'&&defender.fleeing)throw Error('A fleeing regiment must Flee.');
 if(choice==='stand-shoot'&&!canStandShoot(s,defender,charger))throw Error('This regiment cannot Stand & Shoot against this charge.');
 if(choice==='flee'&&defender.engaged)throw Error('An engaged regiment must Hold.');
 if(choice==='flee'&&hasRule(defender,'frenzy')&&!defender.fleeing)throw Error('A Frenzied unit cannot Flee as a charge reaction.');
 if(defender.role==='warmachine'&&choice!=='hold')throw Error('A war machine can only Hold.');
 let report=null,fleeDice=null,fleeDistance=0,flee=null;
 if(choice==='stand-shoot'){const plan=shootingPlan(s,defender,charger,{reaction:true});report=fireMissiles(s,defender,charger,plan,random);defender.reacted=true;}
 if(choice==='flee'){
  fleeDice=rollD6(2,random);fleeDistance=fleeDice[0]+fleeDice[1];
  const dx=defender.x-charger.x,dy=defender.y-charger.y;
  defender.heading=normalize(Math.atan2(dx,-dy)*180/Math.PI);
  flee=fleeMove(s,defender,fleeDistance,random);
  defender.fleeing=!defender.destroyed;defender.moved=true;
 }
 charger.charge.reaction=choice;charger.charge.reactionReport=report;charger.charge.fleeDice=fleeDice;
 if(aliveCount(charger)===0){charger.charge.status='stopped';charger.moved=true;}
 return {choice,report,fleeDice,fleeDistance,flee,fledOffBoard:!!flee?.fledOffBoard,charger:chargerId,defender:defender.id,stopped:charger.charge.status==='stopped'};
}
export function cancelCharge(s,id){if(s.movementStep!=='declare')throw Error('Declarations are locked after rolling begins.');const u=getUnit(s,id);if(u?.charge?.status==='declared'&&u.charge.reaction!=='pending')throw Error('A charge cannot be cancelled after its defender reacts.');if(u?.charge?.status==='declared')u.charge=null;}
export function availableCharges(s,u){return combatants(s).filter(v=>v.team!==u.team&&v.x!==null&&aliveCount(v)>0&&!s.units.some(other=>other.id!==u.id&&other.charge?.status==='declared'&&other.charge.target===v.id)&&!chargePlan(s,u,v).error);}
export function impetuousTest(s,id,dice){const u=getUnit(s,id);if(s.stage!=='movement'||s.movementStep!=='declare'||u?.team!==s.team||u.faction!=='orc'||u.impetuousTest!==null||!availableCharges(s,u).length)throw Error('Select an Orc Mob with an available charge.');if(!Array.isArray(dice)||dice.length!==2||dice.some(d=>!Number.isInteger(d)||d<1||d>6))throw Error('An Impetuous test requires two D6.');u.impetuousTest=dice[0]+dice[1]<=profile(u).Ld;return u.impetuousTest;}
export function finishDeclarations(s){if(s.stage!=='movement'||s.movementStep!=='declare')throw Error('Not declaring charges.');if(s.units.some(u=>u.charge?.reaction==='pending'))throw Error('Choose every defender’s charge reaction first.');for(const u of s.units.filter(u=>u.team===s.team&&hasRule(u,'frenzy')&&!u.charge&&canAct(s,u)&&availableCharges(s,u).length))throw Error(`${u.name} is Frenzied and must declare a charge.`);for(const u of s.units.filter(u=>u.team===s.team&&u.faction==='orc'&&!u.charge&&canAct(s,u)&&availableCharges(s,u).length)){if(u.impetuousTest===null)throw Error('Roll Impetuous for each Orc Mob able to charge.');if(u.impetuousTest===false)throw Error('An Impetuous Orc Mob must declare a charge.');}if(s.units.some(u=>u.charge?.status==='declared'))s.movementStep='charges';else beginRemaining(s);s.history=[];}
export function enterRemaining(s){
 if(s.units.some(u=>u.charge?.status==='declared'))throw Error('Resolve all declared charges before Remaining Moves.');
 beginRemaining(s);
}
function beginRemaining(s){if(s.movementStep!=='remaining'){s.movementStep='remaining';returnPursuers(s);}}
// Pursuers and overrunners that left the battlefield return during their Compulsory Moves:
// just inside the edge they left by, facing inward, near their exit point, counting as moved.
function returnPursuers(s){
 for(const u of s.units.filter(u=>u.team===s.team&&u.offBoardPursuit)){
  const {edge,x,y}=u.offBoardPursuit,angle={top:180,bottom:0,left:90,right:270}[edge],depth=size(u).h/2;
  for(let offset=0;offset<=boardOf(s).width+boardOf(s).height;offset+=.5){
   let found=false;
   for(const sign of offset===0?[1]:[1,-1]){
    const along=(edge==='top'||edge==='bottom'?x:y)+offset*sign,pose={...u,heading:angle,x:edge==='left'?depth:edge==='right'?boardOf(s).width-depth:along,y:edge==='top'?depth:edge==='bottom'?boardOf(s).height-depth:along};
    if(checkPosition(s,pose,pose.x,pose.y))continue;
    Object.assign(u,{x:pose.x,y:pose.y,heading:angle,moved:true,offBoardPursuit:null});found=true;break;
   }
   if(found)break;
  }
 }
}
export function resolveCharge(s,id,dice){
 const u=getUnit(s,id);if(s.stage!=='movement'||s.movementStep!=='charges'||u?.charge?.status!=='declared')throw Error('Select a declared charge to resolve.');
 if(!Array.isArray(dice)||dice.length!==2||dice.some(d=>!Number.isInteger(d)||d<1||d>6))throw Error('A charge roll requires two D6.');
 if(u.charge.reaction==='pending')throw Error('Choose the defender’s reaction first.');
 const t=getUnit(s,u.charge.target),fled=u.charge.reaction==='flee',p=t?.x!==null?chargePlan(s,u,t):{error:'Target fled off the table.'},route=p.error?u.charge.initialPlan:p,roll=Math.max(...dice),range=profile(u).M+roll,success=!p.error&&range+EPS>=p.cost;
 let end={...u},travel=0;
 if(success){end=p.end;travel=p.cost;if(fled){claimStandard(s,t,u.team);destroyUnit(t);}else{u.engaged=t.id;t.engaged=u.id;}}
 else if(route?.start){
  const budget=fled?range:roll;
  const wheelAngle=route.wheelCost<=budget?route.angle:Math.sign(route.angle)*2*Math.asin(Math.min(1,budget/(2*size(u).w)))*180/Math.PI;
  const wheelEnd=wheelPose(u,wheelAngle),straight=Math.max(0,budget-wheelCost(wheelAngle,u));
  // Stop a failed charge short of units or table edges; never enter combat on failure.
  for(let i=1;i<=100;i++){const pose=i/100<=wheelCost(wheelAngle,u)/budget?wheelPose(u,wheelAngle*(i/100)*budget/Math.max(wheelCost(wheelAngle,u),EPS)):forwardPose(wheelEnd,Math.min(straight,(i/100)*budget-wheelCost(wheelAngle,u)));if(checkPosition(s,pose,pose.x,pose.y))break;end=pose;travel=budget*i/100;}
 }
 Object.assign(u,{x:end.x,y:end.y,heading:heading(end),moved:true});
 u.charge={...u.charge,status:success?'success':'failed',dice:[...dice],roll,range,distance:travel,face:route?.face};s.history=[];
 if(!s.units.some(v=>v.charge?.status==='declared'))beginRemaining(s);
 return {success,runDown:success&&fled,dice,roll,range,distance:travel,target:t.id,reason:p.error??null};
}

export function modelSquares(s,u){
 if(u.role==='warmachine'){const {w,h}=size(u),enemy=u.engaged?getUnit(s,u.engaged):null,poly=corners(u),gapToEnemy=enemy?polygonGap(poly,corners(enemy)):Infinity;return [{index:0,row:0,col:0,x:-w/2,y:-h/2,size:w,command:null,dead:aliveCount(u)===0,fighting:gapToEnemy<=profile(u).M+EPS,contact:gapToEnemy<EPS}];}
 if(isCharacter(u)){const base=baseSize(u)/25.4,enemy=u.engaged?getUnit(s,u.engaged):null,poly=corners(u);return [{index:0,row:0,col:0,x:-base/2,y:-base/2,size:base,command:null,dead:aliveCount(u)===0,fighting:!!enemy&&polygonGap(poly,corners(enemy))<=profile(u).M+EPS,contact:!!enemy&&polygonGap(poly,corners(enemy))<EPS}];}
 const base=baseSize(u)/25.4,footprint=size(u),enemy=u.engaged?getUnit(s,u.engaged):null,face=enemy?chargeFace(enemy,u):null,depth=u.charge?.status==='success'?1:u.spears?3:2;
 const files=filesOf(u),ranks=ranksOf(u),slots=commandSlots(u);
 return Array.from({length:startingModels(u)},(_,i)=>{const row=Math.floor(i/files),col=i%files,x=-footprint.w/2+col*base,y=-footprint.h/2+row*base;
 const poly=[[x,y],[x+base,y],[x+base,y+base],[x,y+base]].map(([a,b])=>localPoint(u,a,b));
 const edge=face==='front'?row:face==='rear'?ranks-1-row:face==='left flank'?col:face==='right flank'?files-1-col:Infinity;
 const dead=(u.deadModels??[]).includes(i);
 const fighting=!dead&&!!enemy&&edge<depth&&polygonGap(poly,corners(enemy))<=profile(u).M+EPS;
 return {index:i,row,col,rank:edge,x,y,size:base,command:slots[i]??null,dead,fighting,contact:!dead&&!!enemy&&polygonGap(poly,corners(enemy))<EPS};
 });
}

export function movementRemaining(u,mode=u.movementMode??'advance'){return u.moved||u.engaged||u.charge||u.fleeing?0:Math.max(0,(mode==='march'?2*profile(u).M:profile(u).M)-(u.spent??0));}

export function aliveCount(u){return u.destroyed?0:isCharacter(u)||u.role==='warmachine'?(u.wounds>0?1:0):startingModels(u)-(u.deadModels?.length??0);}
export function remainingWounds(u){return isCharacter(u)||u.role==='warmachine'?Math.max(0,u.wounds):aliveCount(u);}
export function combatPairs(s){const all=combatants(s);return all.filter(u=>u.engaged&&u.x!==null&&!u.combatResolved&&u.id< u.engaged&&all.some(v=>v.id===u.engaged&&v.x!==null&&!v.combatResolved)).map(u=>[u.id,u.engaged]);}
function combatDice(count,random){return count?rollD6(count,random):[];}
function combatInitiative(u,enemy=null){const base=u.weapon==='greatWeapon'?1:profile(u).I,braced=u.spears&&enemy?.charge?.status==='success'&&enemy.charge.target===u.id&&enemy.charge.face==='front'?1:0;if(u.charge?.status!=='success')return base+braced;return base+Math.min(u.charge.face==='front'?3:4,Math.floor(u.charge.distance+EPS));}
export function hitTarget(attacker,defender){const a=profile(attacker).WS,d=profile(defender).WS;return a>2*d?2:a>d?3:d>2*a?5:4;}
export function woundTarget(attacker,defender){return Math.max(2,Math.min(6,4+profile(defender).T-profile(attacker).S-(attacker.weapon==='greatWeapon'?2:0)));}
export function saveTarget(defender,attacker){let target=profile(defender).save-(hasShield(defender)?1:0)+(attacker.weapon==='greatWeapon'?2:0)+(FACTIONS[attacker.faction??'chaos'].choppas&&attacker.charge?.status==='success'?1:0)+(attacker.role==='wizard'&&attacker.faction==='chaos'?1:0);return Math.max(2,Math.min(7,target));}
// Ranks behind the first count when they hold at least the troop type's models per rank
// (5 regular, 4 heavy infantry); casualties come off the rear, so the front ranks stay full.
function rankBonus(u){const alive=aliveCount(u),files=filesOf(u),full=Math.floor(alive/files),partial=alive%files,need=Math.min(files,TROOP_TYPES[troopType(u)].perRank??files);return full<1?0:Math.min(2,full-1+(partial>=need?1:0));}
export function leadership(u,kind='normal'){const base=commandAlive(u,'C')?Math.max(profile(u).Ld,championProfile(u).Ld):profile(u).Ld;return Math.min(10,base+(FACTIONS[u.faction??'chaos'].warband&&kind!=='restraint'&&!u.fleeing?rankBonus(u):0)+(commandAlive(u,'M')&&(kind==='march'||kind==='rally')?1:0));}
// Casualties already suffered in this combat count against the first fighting rank, then the
// second (never the champion); the models that stepped forward from the rear cannot attack.
function stepForward(models,lost){let drop=lost;return [...models].sort((a,b)=>(a.rank??0)-(b.rank??0)).filter(m=>{if(drop>0&&m.command!=='C'){drop--;return false;}return true;});}
function attackStage(s,attacker,defender,random,lost=0){
 const fighting=stepForward(modelSquares(s,attacker).filter(m=>m.fighting),isCharacter(attacker)||attacker.role==='warmachine'?0:lost),faction=FACTIONS[attacker.faction??'chaos'],chopping=faction.choppas&&attacker.charge?.status==='success',dice={hit:[],wound:[],reroll:[],save:[]};
 const furious=(faction.furious&&attacker.charge?.status==='success'&&attacker.charge.distance>=3?1:0)+(hasRule(attacker,'frenzy')&&attacker.charge?.status==='success'?1:0);
 const attacks=fighting.reduce((total,model)=>total+(model.command==='C'?championProfile(attacker).A:profile(attacker).A)+furious,0);dice.hit=combatDice(attacks,random);
 const toHit=Math.min(6,hitTarget(attacker,defender)+stormPenalty(s,attacker)),toWound=woundTarget(attacker,defender),toSave=saveTarget(defender,attacker),hits=dice.hit.filter(n=>n>=toHit).length;dice.wound=combatDice(hits,random);
 if(chopping){dice.reroll=combatDice(dice.wound.filter(n=>n===1).length,random);}
 const wounds=dice.wound.filter(n=>n>=toWound).length+dice.reroll.filter(n=>n>=toWound).length;dice.save=combatDice(wounds,random);
 const bane=attacker.weapon==='greatWeapon'?[...dice.wound,...dice.reroll].filter(n=>n===6).length:0;
 let unsaved=Math.min(remainingWounds(defender),dice.save.filter((n,i)=>n<(i<bane?Math.min(7,toSave+1):toSave)).length);if(defender.oakenShield){dice.ward=combatDice(unsaved,random);unsaved=dice.ward.filter(n=>n<5).length;}
 return {from:attacker.id,to:defender.id,initiative:combatInitiative(attacker,defender),fighters:fighting.length,lostBefore:lost,attacks,hits,wounds,saved:wounds-unsaved,unsaved,toHit,toWound,toSave,dice};
}
export function removeCasualties(s,u,count){
 if(u.role==='warmachine'){u.wounds=Math.max(0,u.wounds-count);u.crew=Math.min(u.crew,u.wounds);if(!u.wounds){const enemy=u.engaged?getUnit(s,u.engaged):null;if(enemy)enemy.engaged=null;destroyUnit(u);}return;}
 if(isCharacter(u)){u.wounds=Math.max(0,u.wounds-count);if(!u.wounds){if(u.engaged){const enemy=getUnit(s,u.engaged);if(enemy)enemy.engaged=null;}s.vortices=s.vortices.filter(v=>v.caster!==u.id);destroyUnit(u);}return;}
 // Models are physically removed from the right-hand end of the rear rank, so the survivors
 // stay together and the fighting rank stays full; the musician, then the standard bearer,
 // then the champion go only when no ordinary warriors remain.
 const n=Math.min(count,aliveCount(u));for(let i=0;i<n;i++){
  const live=modelSquares(s,u).filter(m=>!m.dead),ordinary=live.filter(m=>!m.command),rear=Math.max(...ordinary.map(m=>m.row));
  const victim=ordinary.filter(m=>m.row===rear).sort((a,b)=>b.col-a.col)[0]??live.find(m=>m.command==='M')??live.find(m=>m.command==='S')??live[0];
  u.deadModels.push(victim.index);
 }
}
// The Deathshrieker is a separately based war machine. Its three crew bases are
// drawn beside it; this first war-machine pass does not put crew into melee.
export function canFireRocket(s){return s.stage==='shooting'&&s.team==='ash'&&s.rocket.x!==null&&s.rocket.wounds>0&&!s.rocket.engaged&&!s.rocket.shot&&s.round>s.rocket.disabledUntil;}
// The facing a war machine pivots to when it shoots at a point.
function facingTo(from,to){return normalize(Math.atan2(to.x-from.x,-(to.y-from.y))*180/Math.PI);}
export function rocketPlan(s,target,{indirect=false}={}){
 const r=s.rocket;if(r.x===null)return {error:'Deploy the launcher first.'};if(!target||target.x===null||target.team==='ash'||aliveCount(target)===0)return {error:'Choose a surviving enemy regiment.'};if(target.engaged)return {error:'Cannot target a regiment in combat.'};
 const facing=facingTo(r,target),distance=polygonGap(corners({...r,heading:facing}),corners(target));
 if(distance<12-EPS||distance>48+EPS)return {error:'Target must be between 12″ and 48″ away.',distance};
 if(!indirect&&sightBlocked(s,r,target,{x:r.x,y:r.y},{x:target.x,y:target.y}))return {error:'Another regiment blocks line of sight. Choose Indirect Fire.',distance};
 return {target:target.id,distance,aim:{x:target.x,y:target.y},indirect,facing};
}
export function rocketTargets(s,options={}){if(!canFireRocket(s))return [];return s.units.filter(u=>u.team==='iron'&&u.x!==null&&aliveCount(u)>0).map(u=>({unit:u,...rocketPlan(s,u,options)}));}
export function rollRocketDice(random=Math.random){const face=Math.floor(random()*6),hit=Math.floor(random()*3)===0,angle=Math.floor(random()*8)*45;return {artillery:face===5?'misfire':(face+1)*2,scatter:hit?'hit':angle,hitArrow:angle};}
function blastCells(s,point,radius){const out=[];for(const unit of s.units.filter(u=>u.x!==null&&aliveCount(u)>0)){
 const a=rad(heading(unit)),c=Math.cos(a),sn=Math.sin(a),dx=point.x-unit.x,dy=point.y-unit.y,lx=dx*c+dy*sn,ly=-dx*sn+dy*c;
 for(const model of modelSquares(s,unit).filter(m=>!m.dead)){const x=Math.max(model.x,Math.min(lx,model.x+model.size)),y=Math.max(model.y,Math.min(ly,model.y+model.size));if(Math.hypot(lx-x,ly-y)>radius+EPS)continue;
 const centre=lx>=model.x-EPS&&lx<=model.x+model.size+EPS&&ly>=model.y-EPS&&ly<=model.y+model.size+EPS;
 const fully=[[model.x,model.y],[model.x+model.size,model.y],[model.x,model.y+model.size],[model.x+model.size,model.y+model.size]].every(([mx,my])=>Math.hypot(lx-mx,ly-my)<=radius+EPS);
 out.push({unit,model:model.index,centre,fully});
 }
 }return out;}
export function fireRocket(s,targetId,profileKey,dice,random=Math.random,{indirect=false}={}){
 if(!canFireRocket(s))throw Error('The Deathshrieker cannot fire in this Shooting phase.');
 const profile=ROCKET_PROFILES[profileKey],target=getUnit(s,targetId),plan=rocketPlan(s,target,{indirect});if(!profile)throw Error('Choose a rocket profile.');if(plan.error)throw Error(plan.error);
 if(!dice||!([2,4,6,8,10,'misfire'].includes(dice.artillery))||!(dice.scatter==='hit'||Number.isInteger(dice.scatter)&&dice.scatter>=0&&dice.scatter<360))throw Error('Roll valid Artillery and Scatter dice.');
 const report={profile:profileKey,from:'A5',target:targetId,aim:plan.aim,impact:null,template:profile.template,artillery:dice.artillery,scatter:dice.scatter,indirect,misfire:null,affected:[],hits:0,unsaved:0};
 s.rocket.shot=true;s.rocket.heading=plan.facing;
 if(dice.artillery==='misfire'){
  const result=rollD6(1,random)[0];report.misfire=result;
  if(result===1){s.rocket.wounds=0;s.rocket.x=null;s.rocket.y=null;s.rocket.crew=0;}
  else if(result<=4){s.rocket.wounds--;s.rocket.crew=Math.min(s.rocket.crew,s.rocket.wounds);s.rocket.disabledUntil=s.round+1;if(s.rocket.wounds<=0){s.rocket.x=null;s.rocket.y=null;s.rocket.crew=0;}}
  s.rocket.lastShot=report;return report;
 }
 let angle=dice.scatter,travel=dice.artillery;
 if(angle==='hit'&&!indirect)travel=0;
 else if(angle==='hit'){angle=dice.hitArrow??0;travel=Math.max(0,dice.artillery-3);}
 const direction=rad(angle==='hit'?0:angle),impact={x:plan.aim.x+Math.sin(direction)*travel,y:plan.aim.y-Math.cos(direction)*travel};report.impact=impact;report.scatterDistance=travel;
 const cells=blastCells(s,impact,profile.template/2),centrals=cells.filter(c=>c.centre),central=centrals.find(c=>c.unit.id===targetId)??centrals[0];
 for(const cell of cells){const isCentre=cell===central,hitRoll=cell.fully||isCentre?null:rollD6(1,random)[0];if(hitRoll!==null&&hitRoll<4)continue;
  report.hits++;const strength=isCentre?profile.centreStrength:profile.strength,ap=isCentre?profile.centreAp:profile.ap,woundRoll=rollD6(1,random)[0],toWound=Math.max(2,Math.min(6,4+GprofileT(cell.unit)-strength));
  const saveRoll=woundRoll>=toWound?rollD6(1,random)[0]:null,toSave=Math.max(2,Math.min(7,profileOfSave(cell.unit)+ap));let slain=aliveCount(cell.unit)>0&&saveRoll!==null&&saveRoll<toSave?1:0;const ward=slain&&(cell.unit.oakenShield||cell.unit.role==='wizard'&&cell.unit.faction==='chaos'&&profileKey==='incendiary')?rollD6(1,random)[0]:null;if(slain&&ward!==null&&ward>=5)slain=0;
  report.affected.push({unit:cell.unit.id,model:cell.model,centre:isCentre,hitRoll,woundRoll,saveRoll,ward,toWound,toSave,slain});
  if(slain){removeCasualties(s,cell.unit,1);report.unsaved++;if(aliveCount(cell.unit)===0){if(cell.unit.engaged)getUnit(s,cell.unit.engaged).engaged=null;cell.unit.destroyed=true;cell.unit.engaged=null;cell.unit.x=null;cell.unit.y=null;}}
 }
 if(profileKey==='incendiary')for(const unit of s.units.filter(u=>report.affected.some(a=>a.unit===u.id&&a.slain)&&u.x!==null)){
  const panic=rollD6(2,random);report.panic??=[];report.panic.push({unit:unit.id,dice:panic,passed:panic[0]+panic[1]<=leadership(unit)});
  if(panic[0]+panic[1]>leadership(unit)){unit.fleeing=true;unit.moved=true;const away=Math.atan2(unit.x-s.rocket.x,-(unit.y-s.rocket.y))*180/Math.PI;unit.heading=normalize(away);const flee=rollD6(2,random),move=fleeMove(s,unit,flee[0]+flee[1],random);Object.assign(report.panic.at(-1),{fleeDice:flee,fledOffBoard:move.fledOffBoard,move});}
  if(hasRule(unit,'frenzy'))Object.assign(report.panic.at(-1),{passed:true,frenzy:true});
 }
 s.rocket.lastShot=report;return report;
}
const ARTILLERY_FACES=[2,4,6,8,10,'misfire'];
export function rollCannonDice(random=Math.random){const face=()=>ARTILLERY_FACES[Math.floor(random()*6)];return {strike:face(),bounce:face()};}
export function canFireCannon(s,id){const c=s.cannons.find(c=>c.id===id);return !!c&&s.stage==='shooting'&&s.team==='iron'&&c.x!==null&&c.wounds>0&&!c.engaged&&!c.shot&&s.round>c.disabledUntil;}
export function cannonPlan(s,id,target,{mode='ball',aimShort=6}={}){
 const c=s.cannons.find(c=>c.id===id);if(!c||c.x===null)return {error:'Deploy the Great Cannon first.'};
 if(!target||target.x===null||target.team!=='ash'||aliveCount(target)===0||target.engaged)return {error:'Choose a surviving enemy regiment outside combat.'};
 if(!['ball','grape'].includes(mode))return {error:'Choose cannonball or grapeshot.'};
 const facing=facingTo(c,target),distance=polygonGap(corners({...c,heading:facing}),corners(target)),dx=target.x-c.x,dy=target.y-c.y,range=mode==='ball'?60:12;
 if(distance>range+EPS)return {error:`Target is beyond ${range}″ range.`,distance};
 if(sightBlocked(s,c,target,{x:c.x,y:c.y},{x:target.x,y:target.y}))return {error:'Another regiment blocks line of sight.',distance};
 if(!Number.isFinite(aimShort)||aimShort<0||aimShort>10)return {error:'Aim from 0″ to 10″ short of the target.'};
 const length=Math.hypot(dx,dy),direction={x:dx/length,y:dy/length},aim={x:target.x-direction.x*aimShort,y:target.y-direction.y*aimShort};
 if(mode==='ball'&&(Math.hypot(aim.x-c.x,aim.y-c.y)>60+EPS||aim.y<0||aim.y>boardOf(s).height||aim.x<0||aim.x>boardOf(s).width||Math.hypot(aim.x-c.x,aim.y-c.y)<CANNON_BASE.h/2))return {error:'Choose an aim point on the battlefield within cannon range.'};
 return {id,target:target.id,distance,direction,aim,mode,aimShort,facing};
}
export function cannonTargets(s,id,options={}){if(!canFireCannon(s,id))return [];return s.units.filter(u=>u.team==='ash'&&u.x!==null&&aliveCount(u)>0).map(unit=>({unit,...cannonPlan(s,id,unit,options)}));}
function cannonMisfire(s,c,random){const result=rollD6(1,random)[0];if(result===1){c.wounds=0;c.crew=0;c.x=null;c.y=null;}else if(result<=4){c.wounds--;c.crew=Math.min(c.crew,c.wounds);c.disabledUntil=s.round+1;if(c.wounds<=0){c.crew=0;c.x=null;c.y=null;}}return result;}
function cannonballCells(s,start,end,direction){const length=Math.hypot(end.x-start.x,end.y-start.y),hits=[];
 for(const unit of s.units.filter(u=>u.x!==null&&aliveCount(u)>0))for(const model of modelSquares(s,unit).filter(m=>!m.dead)){
  const poly=[[model.x,model.y],[model.x+model.size,model.y],[model.x+model.size,model.y+model.size],[model.x,model.y+model.size]].map(([x,y])=>localPoint(unit,x,y));
  if(!inside(start,poly)&&!(length>EPS&&(inside(end,poly)||poly.some((p,i)=>intersects(start,end,p,poly[(i+1)%4])))))continue;
  const centre=localPoint(unit,model.x+model.size/2,model.y+model.size/2),along=(centre.x-start.x)*direction.x+(centre.y-start.y)*direction.y;
  const forward={x:Math.sin(rad(heading(unit))),y:-Math.cos(rad(heading(unit)))},front=Math.abs(forward.x*direction.x+forward.y*direction.y)>=.707;
  hits.push({unit,model,along,rank:front?model.row:model.col});
 }
 const seen=new Set();return hits.sort((a,b)=>a.along-b.along).filter(hit=>{const key=hit.unit.id+':'+hit.rank;if(seen.has(key))return false;seen.add(key);return true;});
}
export function fireCannon(s,id,targetId,mode,dice,random=Math.random,{aimShort=6}={}){
 if(!canFireCannon(s,id))throw Error('This Great Cannon cannot fire in this Shooting phase.');const c=s.cannons.find(c=>c.id===id),target=getUnit(s,targetId),plan=cannonPlan(s,id,target,{mode,aimShort});if(plan.error)throw Error(plan.error);
 if(!ARTILLERY_FACES.includes(dice?.strike)||(mode==='ball'&&!ARTILLERY_FACES.includes(dice?.bounce)))throw Error('Roll valid Artillery dice.');
 const report={from:id,target:targetId,mode,aim:plan.aim,strike:null,end:null,artillery:dice.strike,bounce:mode==='ball'?dice.bounce:null,misfire:null,hits:0,unsaved:0,affected:[]};c.shot=true;c.heading=plan.facing;
 if(dice.strike==='misfire'){report.misfire=cannonMisfire(s,c,random);c.lastShot=report;return report;}
 let cells=[];
 if(mode==='grape'){cells=Array.from({length:dice.strike},()=>({unit:target,model:null}));}
 else{report.strike={x:plan.aim.x+plan.direction.x*dice.strike,y:plan.aim.y+plan.direction.y*dice.strike};const bounce=dice.bounce==='misfire'?0:dice.bounce;report.end={x:report.strike.x+plan.direction.x*bounce,y:report.strike.y+plan.direction.y*bounce};cells=cannonballCells(s,report.strike,report.end,plan.direction);}
 for(const cell of cells){if(aliveCount(cell.unit)===0)continue;report.hits++;const strength=mode==='grape'?4:10,ap=mode==='grape'?1:3,woundRoll=rollD6(1,random)[0],toWound=Math.max(2,Math.min(6,4+profile(cell.unit).T-strength)),saveRoll=woundRoll>=toWound?rollD6(1,random)[0]:null,toSave=Math.max(2,Math.min(7,profileOfSave(cell.unit)+ap)),ward=cell.unit.oakenShield&&saveRoll!==null&&saveRoll<toSave?rollD6(1,random)[0]:null,slain=saveRoll!==null&&saveRoll<toSave&&(ward===null||ward<5);
  report.affected.push({unit:cell.unit.id,model:cell.model?.index??null,woundRoll,saveRoll,ward,toWound,toSave,slain});
  if(slain){removeCasualties(s,cell.unit,1);report.unsaved++;if(aliveCount(cell.unit)===0){if(cell.unit.engaged)getUnit(s,cell.unit.engaged).engaged=null;destroyUnit(cell.unit);}}
 }
 c.lastShot=report;return report;
}
function GprofileT(u){return profile(u).T;}
function profileOfSave(u){return profile(u).save-(hasShield(u)?1:0);}
function combatScore(s,u,enemy,inflicted){
 const alive=aliveCount(u),face=chargeFace(enemy,u),disrupted=(face==='left flank'||face==='right flank'||face==='rear')&&aliveCount(enemy)>=10;
 const ranks=disrupted?0:rankBonus(u);
 const closeOrder=alive>=10&&!(u.role==='missile'&&u.faction==='chaos')?1:0,flank=enemy.role==='warmachine'||u.role==='warmachine'?0:chargeFace(u,enemy)==='left flank'||chargeFace(u,enemy)==='right flank'?1:chargeFace(u,enemy)==='rear'?2:0;
 const massed=alive>aliveCount(enemy)?1:0,standard=commandAlive(u,'S')?1:0;
 return {wounds:inflicted,ranks,closeOrder,flank,massed,standard,musician:0,total:inflicted+ranks+closeOrder+flank+massed+standard};
}
function breakTieWithMusician(a,b,scoreA,scoreB){if(scoreA.total!==scoreB.total)return;const aMusic=commandAlive(a,'M'),bMusic=commandAlive(b,'M');if(aMusic!==bMusic){const score=aMusic?scoreA:scoreB;score.musician=1;score.total++;}}
export function resolveCombat(s,id,random=Math.random){
 if(s.stage!=='combat'||s.pendingCombat)throw Error('Finish the current combat outcome first.');
 const a=getUnit(s,id),b=getUnit(s,a?.engaged);
 if(!a||!b||!a.engaged||a.combatResolved||b.combatResolved)throw Error('Select an unresolved engaged regiment.');
 const groups=[...new Set([combatInitiative(a,b),combatInitiative(b,a)])].sort((x,y)=>y-x),stages=[],damage={[a.id]:0,[b.id]:0},standards={[a.id]:commandAlive(a,'S'),[b.id]:commandAlive(b,'S')};
 for(const init of groups){
  const simultaneous=[];
  if(combatInitiative(a,b)===init&&aliveCount(a)>0)simultaneous.push(attackStage(s,a,b,random,damage[a.id]));
  if(combatInitiative(b,a)===init&&aliveCount(b)>0)simultaneous.push(attackStage(s,b,a,random,damage[b.id]));
  for(const stage of simultaneous){stages.push(stage);damage[stage.to]+=stage.unsaved;}
  for(const stage of simultaneous)removeCasualties(s,getUnit(s,stage.to),stage.unsaved);
 }
 const scoreA=combatScore(s,a,b,damage[b.id]),scoreB=combatScore(s,b,a,damage[a.id]);breakTieWithMusician(a,b,scoreA,scoreB);
 let winner=null,loser=null,outcome='draw',breakDice=null,margin=Math.abs(scoreA.total-scoreB.total);
 if(aliveCount(a)===0||aliveCount(b)===0){winner=aliveCount(a)>0?a.id:aliveCount(b)>0?b.id:null;loser=winner===a.id?b.id:a.id;outcome='destroyed';}
 else if(scoreA.total!==scoreB.total){winner=scoreA.total>scoreB.total?a.id:b.id;loser=winner===a.id?b.id:a.id;breakDice=combatDice(2,random);const natural=breakDice[0]+breakDice[1],lost=getUnit(s,loser),ld=leadership(lost);outcome=breakDice[0]===1&&breakDice[1]===1||natural+margin<=ld?'give-ground':natural>ld?'break':'fall-back';
  if(outcome==='fall-back'&&lost.role!=='warmachine'&&FACTIONS[lost.faction??'chaos'].shieldwall&&!lost.shieldwallUsed&&lost.charge?.status!=='success'&&getUnit(s,winner).charge?.status==='success'){outcome='give-ground';lost.shieldwallUsed=true;}
 }
 a.combatResolved=b.combatResolved=true;
 const result={a:a.id,b:b.id,stages,damage,score:{[a.id]:scoreA,[b.id]:scoreB},winner,loser,outcome,breakDice,margin,round:s.round};
 s.lastCombat=result;(s.combatHistory??=[]).push(result);
 if(outcome==='destroyed'){for(const dead of [a,b].filter(u=>aliveCount(u)===0)){if(standards[dead.id]&&winner&&!dead.standardClaimed){dead.standardClaimed=getUnit(s,winner).team;(s.trophies??=[]).push({unit:dead.id,team:dead.standardClaimed,round:s.round});}destroyUnit(dead);}if(winner){getUnit(s,winner).engaged=null;if(getUnit(s,winner).role!=='warmachine')s.pendingCombat={winner,loser,outcome:'overrun',stage:'winner-choice',loserDestroyed:true,retreat:{moved:0,dir:null}};}}
 else if(outcome!=='draw')s.pendingCombat={winner,loser,outcome,margin};
 if(loser){const l=getUnit(s,loser);if(l?.effects)l.effects=l.effects.filter(e=>e.rule!=='frenzy');}
 return result;
}
export function beginCombat(s,id){
 if(s.stage!=='combat'||s.combatSession||s.pendingCombat)throw Error('Finish the current combat first.');
 const a=getUnit(s,id),b=getUnit(s,a?.engaged);if(!a||!b||a.combatResolved||b.combatResolved)throw Error('Select an unresolved engaged regiment.');
 const groups=[...new Set([combatInitiative(a,b),combatInitiative(b,a)])].sort((x,y)=>y-x);
 return s.combatSession={standards:{[a.id]:commandAlive(a,'S'),[b.id]:commandAlive(b,'S')},a:a.id,b:b.id,initiative:{[a.id]:combatInitiative(a,b),[b.id]:combatInitiative(b,a)},groups,step:0,phase:'attacks',stages:[],damage:{[a.id]:0,[b.id]:0}};
}
export function fightCombatStep(s,random=Math.random){
 const c=s.combatSession;if(s.stage!=='combat'||c?.phase!=='attacks')throw Error('Show Initiative before rolling attacks.');
 const a=getUnit(s,c.a),b=getUnit(s,c.b),initiative=c.groups[c.step],stages=[];
 if(c.initiative[a.id]===initiative&&aliveCount(a)>0)stages.push(attackStage(s,a,b,random,c.damage[a.id]));
 if(c.initiative[b.id]===initiative&&aliveCount(b)>0)stages.push(attackStage(s,b,a,random,c.damage[b.id]));
 for(const stage of stages){c.stages.push(stage);c.damage[stage.to]+=stage.unsaved;}
 for(const stage of stages)removeCasualties(s,getUnit(s,stage.to),stage.unsaved);
 c.step++;if(c.step>=c.groups.length)c.phase='compare';
 return {initiative,stages,next:c.phase};
}
export function compareCombat(s){
 const c=s.combatSession;if(s.stage!=='combat'||c?.phase!=='compare')throw Error('Finish all Initiative steps first.');
 const a=getUnit(s,c.a),b=getUnit(s,c.b),scoreA=combatScore(s,a,b,c.damage[b.id]),scoreB=combatScore(s,b,a,c.damage[a.id]);breakTieWithMusician(a,b,scoreA,scoreB);
 const winner=aliveCount(a)===0&&aliveCount(b)===0?null:aliveCount(a)===0?b.id:aliveCount(b)===0?a.id:scoreA.total>scoreB.total?a.id:scoreB.total>scoreA.total?b.id:null;
 const loser=winner===a.id?b.id:winner===b.id?a.id:null,margin=Math.abs(scoreA.total-scoreB.total),outcome=aliveCount(a)===0||aliveCount(b)===0?'destroyed':winner?'await-break':'draw';
 const result={a:a.id,b:b.id,initiative:c.initiative,stages:c.stages,damage:c.damage,score:{[a.id]:scoreA,[b.id]:scoreB},winner,loser,outcome,breakDice:null,margin,round:s.round};
 a.combatResolved=b.combatResolved=true;s.lastCombat=result;(s.combatHistory??=[]).push(result);s.combatSession=null;
 if(outcome==='destroyed'){for(const dead of [a,b].filter(u=>aliveCount(u)===0)){if(c.standards?.[dead.id]&&winner&&!dead.standardClaimed){dead.standardClaimed=getUnit(s,winner).team;(s.trophies??=[]).push({unit:dead.id,team:dead.standardClaimed,round:s.round});}destroyUnit(dead);}if(winner){getUnit(s,winner).engaged=null;if(getUnit(s,winner).role!=='warmachine')s.pendingCombat={winner,loser,outcome:'overrun',stage:'winner-choice',loserDestroyed:true,retreat:{moved:0,dir:null}};}}
 else if(winner)s.pendingCombat={winner,loser,margin,stage:'break'};
 if(loser){const l=getUnit(s,loser);if(l?.effects)l.effects=l.effects.filter(e=>e.rule!=='frenzy');}
 return result;
}
export function rollCombatBreak(s,random=Math.random){
 const p=s.pendingCombat;if(s.stage!=='combat'||p?.stage!=='break')throw Error('Compare combat results before the Break test.');
 const loser=getUnit(s,p.loser),winner=getUnit(s,p.winner),dice=combatDice(2,random),natural=dice[0]+dice[1],ld=leadership(loser);
 p.outcome=dice[0]===1&&dice[1]===1||natural+p.margin<=ld?'give-ground':natural>ld?'break':'fall-back';if(loser.role==='wizard'&&loser.faction==='chaos'&&!loser.stubbornUsed){loser.stubbornUsed=true;p.outcome='fall-back';}const stubborn=loser.effects?.find(e=>e.rule==='stubborn'&&!e.used);if(stubborn&&p.outcome!=='give-ground'){stubborn.used=true;p.outcome='fall-back';p.stubborn=true;}p.breakDice=dice;
 p.shieldwallAvailable=p.outcome==='fall-back'&&loser.role!=='warmachine'&&FACTIONS[loser.faction??'chaos'].shieldwall&&!loser.shieldwallUsed&&loser.charge?.status!=='success'&&winner.charge?.status==='success';
 p.stage=p.shieldwallAvailable?'loser-choice':'retreat';s.lastCombat={...s.lastCombat,outcome:p.outcome,breakDice:dice};s.combatHistory[s.combatHistory.length-1]=s.lastCombat;
 return {dice,outcome:p.outcome,loser:p.loser,leadership:ld,shieldwallAvailable:p.shieldwallAvailable};
}
export function chooseLoserAction(s,choice){
 const p=s.pendingCombat;if(s.stage!=='combat'||p?.stage!=='loser-choice')throw Error('No loser choice is available.');
 if(!['shieldwall','fall-back'].includes(choice))throw Error('Choose Shieldwall or Fall Back in Good Order.');
 if(choice==='shieldwall'){getUnit(s,p.loser).shieldwallUsed=true;p.outcome='give-ground';s.lastCombat={...s.lastCombat,outcome:p.outcome};s.combatHistory[s.combatHistory.length-1]=s.lastCombat;}
 p.loserChoice=choice;p.stage='retreat';return {choice,outcome:p.outcome};
}
// Old World flee move: straight ahead and through other units. Friends passed through take a
// Panic test and may flee in turn (a chain reaction); every model whose path crossed an enemy
// takes a Peril test and loses a wound on 1-3. The move continues until the unit is clear:
// 1" beyond enemies and, because this prototype keeps 1" between all units, 1" from friends.
function fleeMove(s,u,distance,random=Math.random,depth=0){
 const start={...u},others=combatants(s).filter(v=>v.id!==u.id&&v.x!==null&&aliveCount(v)>0);
 const clearOf=pose=>!terrainBlocks(s,hull([...corners(pose),...corners(forwardPose(pose,distance))]));
 if(!clearOf(start))for(let turn=5;turn<=90;turn+=5){const l={...start,heading:normalize(heading(start)-turn)},r={...start,heading:normalize(heading(start)+turn)};if(clearOf(l)){start.heading=l.heading;break;}if(clearOf(r)){start.heading=r.heading;break;}}
 u.heading=start.heading;
 let travel=distance,end=forwardPose(start,travel);
 while(!offBoard(end,s)&&(others.some(v=>gap(end,v)<1-EPS)||terrainBlocks(s,corners(end)))){travel+=.05;end=forwardPose(start,travel);}
 const leave=forwardPose(start,Math.min(.02,travel)),path=hull([...corners(leave),...corners(end)]),crossed=others.filter(v=>polygonGap(path,corners(v))<EPS);
 const report={unit:u.id,distance:travel,passedThrough:crossed.map(v=>v.id),peril:[],panic:[],fledOffBoard:offBoard(end,s)};
 if(report.fledOffBoard)destroyUnit(u);
 else{
  const square=(pose,m)=>[[m.x,m.y],[m.x+m.size,m.y],[m.x+m.size,m.y+m.size],[m.x,m.y+m.size]].map(([x,y])=>localPoint(pose,x,y)),models=modelSquares(s,u).filter(m=>!m.dead);
  for(const enemy of crossed.filter(v=>v.team!==u.team))for(const m of models){
   if(aliveCount(u)===0)break;
   if(polygonGap(hull([...square(leave,m),...square(end,m)]),corners(enemy))>=EPS)continue;
   const roll=rollD6(1,random)[0],lost=roll<=3;report.peril.push({enemy:enemy.id,model:m.index,roll,lost});
   if(lost)removeCasualties(s,u,1);
  }
  Object.assign(u,{x:end.x,y:end.y});
  if(aliveCount(u)===0){s.vortices=s.vortices.filter(v=>v.caster!==u.id);destroyUnit(u);}
 }
 report.casualties=report.peril.filter(p=>p.lost).length;report.destroyed=!!u.destroyed;
 const from=u.x!==null?u:end;
 for(const friend of crossed.filter(v=>v.team===u.team&&v.role!=='warmachine'&&!v.fleeing&&!v.engaged&&v.x!==null&&aliveCount(v)>0)){
  const dice=rollD6(2,random),passed=hasRule(friend,'frenzy')||dice[0]+dice[1]<=leadership(friend),entry={unit:friend.id,dice,passed};report.panic.push(entry);
  if(passed||depth>=6)continue;
  Object.assign(friend,{fleeing:true,moved:true,heading:normalize(Math.atan2(friend.x-from.x,-(friend.y-from.y))*180/Math.PI)});
  entry.fleeDice=rollD6(2,random);entry.flee=fleeMove(s,friend,entry.fleeDice[0]+entry.fleeDice[1],random,depth+1);
 }
 return report;
}
// A broken unit turns directly away from the victor and flees.
function fleeFrom(s,u,enemy,distance,random){
 const dx=u.x-enemy.x,dy=u.y-enemy.y,len=Math.hypot(dx,dy)||1,dir={x:dx/len,y:dy/len};u.heading=normalize(Math.atan2(dir.x,-dir.y)*180/Math.PI);
 const flee=fleeMove(s,u,distance,random);return {moved:flee.distance,offBoard:flee.fledOffBoard,dir,flee};
}
function stillTouching(a,b){return a.x!==null&&b.x!==null&&aliveCount(a)>0&&aliveCount(b)>0&&!a.fleeing&&!b.fleeing&&!a.engaged&&!b.engaged&&gap(a,b)<EPS;}
function retreatPose(s,u,enemy,distance,stopNear=true){
 const dx=u.x-enemy.x,dy=u.y-enemy.y,len=Math.hypot(dx,dy)||1,dir={x:dx/len,y:dy/len},start={x:u.x,y:u.y};let moved=0;
 for(let i=1;i<=Math.ceil(distance*20);i++){
  const d=Math.min(distance,i/20),pose={...u,x:start.x+dir.x*d,y:start.y+dir.y*d};
  if(offBoard(pose,s))return {moved,offBoard:true,dir};
  const obstructed=combatants(s).some(v=>v.x!==null&&v.id!==u.id&&v.id!==enemy.id&&gap(pose,v)<1-EPS)||terrainBlocks(s,corners(pose));
  if(obstructed)break;
  Object.assign(u,{x:pose.x,y:pose.y});moved=d;
 }
 return {moved,offBoard:false,dir};
}
function pursuitAdvance(s,winner,distance,dir,ignoredId,originalId){
 const start={x:winner.x,y:winner.y};let moved=0,contact=null,blocked=false,offBoardPursuit=false;
 for(let i=1;i<=Math.ceil(distance*20);i++){
  const d=Math.min(distance,i/20),pose={...winner,x:start.x+dir.x*d,y:start.y+dir.y*d};
  if(offBoard(pose,s)){
   const r=rectangle(pose),edge=r.left<0?'left':r.right>boardOf(s).width?'right':r.top<0?'top':'bottom';
   winner.offBoardPursuit={edge,x:winner.x,y:winner.y};winner.x=null;winner.y=null;offBoardPursuit=true;break;
  }
  if(terrainBlocks(s,corners(pose))){blocked=true;break;}
  const obstacle=combatants(s).find(v=>v.id!==winner.id&&v.id!==ignoredId&&v.x!==null&&aliveCount(v)>0&&(v.team===winner.team||v.engaged&&v.engaged!==winner.id?gap(pose,v)<1-EPS:gap(pose,v)<EPS));
  if(obstacle){
   if(obstacle.team!==winner.team&&!obstacle.engaged){
    // Move only as far as first contact rather than to the step that overlaps.
    let lo=moved,hi=d;for(let k=0;k<24;k++){const mid=(lo+hi)/2;if(gap({...winner,x:start.x+dir.x*mid,y:start.y+dir.y*mid},obstacle)<EPS)hi=mid;else lo=mid;}
    Object.assign(winner,{x:start.x+dir.x*hi,y:start.y+dir.y*hi});moved=hi;contact=obstacle.id;
    if(!obstacle.fleeing){const aligned=alignedContact(winner,obstacle);if(!offBoard(aligned,s)&&!s.units.some(v=>v.id!==winner.id&&v.id!==obstacle.id&&v.x!==null&&gap(aligned,v)<1-EPS))Object.assign(winner,{x:aligned.x,y:aligned.y,heading:aligned.heading});}
    if(obstacle.fleeing){claimStandard(s,obstacle,winner.team);destroyUnit(obstacle);}
    else{winner.engaged=obstacle.id;obstacle.engaged=winner.id;if(obstacle.id!==originalId){winner.charge={target:obstacle.id,status:'success',distance:moved,face:chargeFace(winner,obstacle),pursuit:true};winner.pursuitPending=true;winner.combatResolved=obstacle.combatResolved=true;}}
   }else blocked=true;
   break;
  }
  Object.assign(winner,{x:pose.x,y:pose.y});moved=d;
 }
 return {distance:moved,contact,blocked,offBoardPursuit};
}
export function moveCombatLoser(s,random=Math.random){
 const p=s.pendingCombat;if(s.stage!=='combat'||p?.stage!=='retreat')throw Error('Resolve the Break test and any Shieldwall choice first.');
 const loser=getUnit(s,p.loser),winner=getUnit(s,p.winner);
 if(loser.role==='warmachine'){
  const abandoned=p.outcome==='break';if(abandoned){loser.wounds=0;loser.crew=0;destroyUnit(loser);winner.engaged=null;}
  const move={distance:0,dice:null,outcome:p.outcome,offBoard:false,abandoned};s.pendingCombat=null;
  s.lastCombat={...s.lastCombat,loserMove:move,aftermath:{winner:p.winner,loser:p.loser,outcome:p.outcome,choice:abandoned?'restrain':'hold',rolls:{},movement:{loser:0},loserDestroyed:abandoned}};s.combatHistory[s.combatHistory.length-1]=s.lastCombat;
  return {loser:p.loser,...move,finished:true};
 }
 winner.engaged=null;loser.engaged=null;
 const dice=p.outcome==='give-ground'?null:combatDice(2,random),distance=p.outcome==='give-ground'?2:Math.max(1,(p.outcome==='fall-back'?Math.max(...dice):dice[0]+dice[1])-(FACTIONS[loser.faction??'chaos'].resolute?1:0));
 const retreat=p.outcome==='break'?fleeFrom(s,loser,winner,distance,random):retreatPose(s,loser,winner,distance);if(retreat.offBoard){loser.x=null;loser.y=null;loser.destroyed=true;}
 if(p.outcome==='break'&&loser.x!==null)loser.fleeing=true;
 Object.assign(p,{stage:'winner-choice',retreat,retreatDice:dice,fleeDistance:distance,loserDestroyed:!!retreat.offBoard||!!loser.destroyed});
 s.lastCombat={...s.lastCombat,loserMove:{distance:retreat.moved,dice,outcome:p.outcome,offBoard:!!retreat.offBoard,flee:retreat.flee??null}};
 const finished=winner.role==='warmachine';if(finished&&stillTouching(winner,loser)){winner.engaged=loser.id;loser.engaged=winner.id;}if(finished){s.pendingCombat=null;s.lastCombat.aftermath={winner:p.winner,loser:p.loser,outcome:p.outcome,choice:'restrain',rolls:{},movement:{loser:retreat.moved},loserDestroyed:!!retreat.offBoard};}
 s.combatHistory[s.combatHistory.length-1]=s.lastCombat;
 return {loser:p.loser,outcome:p.outcome,distance:retreat.moved,dice,offBoard:!!retreat.offBoard,flee:retreat.flee??null,finished};
}
export function winnerCombat(s,choice='follow',random=Math.random,reformHeading=null){
 const p=s.pendingCombat;if(s.stage!=='combat'||p?.stage!=='winner-choice')throw Error('Move the losing regiment before the winner decides.');
 if(!['follow','follow-reform','restrain'].includes(choice))throw Error('Choose follow, follow and reform, or restrain.');
 const winner=getUnit(s,p.winner),loser=getUnit(s,p.loser),out={winner:p.winner,loser:p.loser,outcome:p.outcome,choice,rolls:{},movement:{loser:p.retreat.moved},loserDestroyed:p.loserDestroyed};
 if(reformHeading!==null&&(!Number.isFinite(reformHeading)||reformHeading<0||reformHeading>=360))throw Error('Choose a facing from 0° to 359°.');
 const reform=()=>{const target={...winner,heading:normalize(reformHeading??heading(winner))},error=checkPosition(s,target,target.x,target.y);out.reform={passed:!error,heading:heading(winner),error};if(!error){winner.heading=target.heading;out.reform.heading=winner.heading;}};
 if(hasRule(winner,'frenzy')&&choice==='restrain')choice='follow';out.choice=choice;
 let follow=choice!=='restrain';if(choice==='restrain'){const dice=combatDice(2,random);out.rolls.restraint=dice;follow=dice[0]+dice[1]>leadership(winner,'restraint');out.restraintFailed=follow;if(!follow&&p.outcome==='overrun')reform();}
 if(follow){
  let advance=p.retreat.moved;
  if(p.outcome!=='give-ground'){
   const dice=combatDice(2,random);out.rolls.pursuit=dice;
   const chase=Math.max(1,dice[0]+dice[1]-(FACTIONS[winner.faction??'chaos'].resolute?1:0));out.pursuitDistance=chase;
   if(p.outcome==='overrun')advance=chase;
   else if(p.outcome==='break'&&(p.loserDestroyed||chase>=p.fleeDistance)){if(loser.x!==null){claimStandard(s,loser,winner.team);destroyUnit(loser);}out.loserDestroyed=true;advance=chase;}
   else if(p.outcome==='fall-back'&&loser.x!==null&&chase>=p.fleeDistance){out.caughtInGoodOrder=true;advance=p.retreat.moved;}
   else advance=Math.min(chase,Math.max(0,p.retreat.moved-1));
  }
  if(advance>0){
   const dir=p.outcome==='overrun'?{x:Math.sin(rad(heading(winner))),y:-Math.cos(rad(heading(winner)))}:p.retreat.dir;
   const moved=pursuitAdvance(s,winner,advance,dir,out.loserDestroyed?loser.id:null,loser.id);
   out.movement.winner=moved.distance;out.contact=moved.contact;out.blocked=moved.blocked;out.offBoardPursuit=moved.offBoardPursuit;
   if(out.caughtInGoodOrder&&moved.distance+EPS<advance)out.caughtInGoodOrder=false;
   if((p.outcome==='give-ground'||out.caughtInGoodOrder)&&loser.x!==null&&gap(winner,loser)<EPS){winner.engaged=loser.id;loser.engaged=winner.id;}
  }
 }
 if(choice==='follow-reform'&&out.loserDestroyed&&!out.contact&&winner.x!==null){const dice=combatDice(2,random);out.rolls.reform=dice;if(dice[0]+dice[1]<=leadership(winner,'restraint'))reform();else out.reform={passed:false,heading:heading(winner),error:'Leadership test failed.'};}
 if(p.outcome==='overrun')out.overrun=follow;
 // A loser that could not move away is still in the fight: the combat continues next turn.
 if(!out.loserDestroyed&&stillTouching(winner,loser)){winner.engaged=loser.id;loser.engaged=winner.id;out.stillEngaged=true;}
 s.pendingCombat=null;s.lastCombat={...s.lastCombat,aftermath:out};s.combatHistory[s.combatHistory.length-1]=s.lastCombat;return out;
}
export function finishCombat(s,choice='follow',random=Math.random,reformHeading=null){
 const pending=s.pendingCombat;if(s.stage!=='combat'||!pending)throw Error('No combat outcome is waiting.');
 if(pending.outcome!=='overrun'){pending.stage='retreat';if(moveCombatLoser(s,random).finished)return s.lastCombat.aftermath;}
 return winnerCombat(s,choice,random,reformHeading);
}
