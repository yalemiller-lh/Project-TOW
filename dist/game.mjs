import * as F from './formats.mjs';
import * as A from './armies.mjs';
export const BOARD={width:72,height:48,zone:12};
export const ROCKET_PROFILES={demolition:{name:'Demolition Rockets',template:3,strength:3,centreStrength:6,ap:0,centreAp:3,centreMultipleWounds:6,armourBane:1},incendiary:{name:'Infernal Incendiaries',template:5,strength:3,centreStrength:3,ap:0,centreAp:0}};
export const ROCKET_BASE={w:50/25.4,h:75/25.4};
export function rocketFootprint(x,y){return [{x:x-ROCKET_BASE.w/2,y:y-ROCKET_BASE.h/2},{x:x+ROCKET_BASE.w/2,y:y-ROCKET_BASE.h/2},{x:x+ROCKET_BASE.w/2,y:y+ROCKET_BASE.h/2},{x:x-ROCKET_BASE.w/2,y:y+ROCKET_BASE.h/2}];}
export const CANNON_BASE={w:50/25.4,h:75/25.4};
export function cannonFootprint(x,y){return [{x:x-CANNON_BASE.w/2,y:y-CANNON_BASE.h/2},{x:x+CANNON_BASE.w/2,y:y-CANNON_BASE.h/2},{x:x+CANNON_BASE.w/2,y:y+CANNON_BASE.h/2},{x:x-CANNON_BASE.w/2,y:y+CANNON_BASE.h/2}];}
export function createCannons(opponent){return opponent==='empire'?[1,2].map(n=>({id:'I'+(n+4),name:'Great Cannon '+('AB'[n-1]),...machineFields('iron','empire'),x:null,y:null,heading:180,wounds:3,crew:3,shot:false,disabledUntil:0,lastShot:null})):[];}
// A war machine is one model. Its crew bases are tokens: in combat the model uses the
// crew profile, makes one Attack per surviving crew token and loses a token per wound.
// Shooting at a war machine hits the machine and its crew as one model: the machine's Toughness and
// Wounds (Toughness 6, Wounds 3 for the Deathshrieker and the Great Cannon here), the crew's armour.
export const WAR_MACHINE_STATS={T:6,W:3};
export const shotToughness=u=>u?.role==='warmachine'?withEffects(u,{T:WAR_MACHINE_STATS.T}).T:profile(u).T;
export const WAR_MACHINE_CREW={chaos:{name:'Chaos Dwarf Crew',profile:{M:3,WS:3,BS:3,S:3,T:4,W:3,I:2,A:3,Ld:9,save:7}},empire:{name:'Empire Crew',profile:{M:4,WS:3,BS:3,S:3,T:3,W:3,I:3,A:3,Ld:7,save:7}}};
function machineFields(team,faction){return {team,faction,role:'warmachine',engaged:null,charge:null,combatResolved:false,fleeing:false,destroyed:false,deadModels:[]};}
// Every independent piece on the battlefield: a character who has joined a regiment stands inside
// its block (see joinUnit) and is reached through it, so it is left out here.
export function combatants(s){return [...s.units,s.rocket,...(s.cannons??[])].filter(m=>m&&!m.absent&&!m.joined);}
// Every piece, joined characters included.
export function allPieces(s){return [...s.units,s.rocket,...(s.cannons??[])].filter(m=>m&&!m.absent);}
export const PROFILE={M:3,WS:4,BS:3,S:3,T:4,W:1,I:2,A:1,Ld:9,save:4};
export const SIZE={w:125/25.4,h:100/25.4};
export const FACTIONS={chaos:{name:'Chaos Dwarf Warriors',army:'Chaos Dwarfs',color:'#b63229',bright:'#ff3f39',base:25,equipment:'Hand weapons · heavy armour · shields',profile:PROFILE,heavy:true,shield:true,shieldwall:true,resolute:true},orc:{name:'Orc Mob',army:'Orc & Goblin Tribes',color:'#418248',bright:'#54ef53',base:30,equipment:'Hand weapons · light armour',profile:{M:4,WS:3,BS:3,S:3,T:4,W:1,I:3,A:1,Ld:6,save:6},choppas:true,furious:true,warband:true,impetuous:true},empire:{name:'State Troops',army:'Empire of Man',color:'#286a9a',bright:'#32aaff',base:25,equipment:'Hand weapons · light armour · shields',profile:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7,save:5},shield:true}};
export const MISSILE={chaos:{name:'Blunderbuss Decimators',equipment:'Hand weapons · blunderbusses · heavy armour',profile:{M:3,WS:3,BS:3,S:3,T:4,W:1,I:2,A:1,Ld:9,save:5},weapon:{name:'Hailshot blunderbuss',range:12,strength:3,ap:1,multiple:'D3',volley:true,ignoreLong:true,ignoreStand:true,hailshot:true}},empire:{name:'State Missile Troops',equipment:'Hand weapons · crossbows',profile:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7,save:7},weapon:{name:'Crossbow',range:30,strength:4,ap:0,armourBane:2,ponderous:true}},orc:{name:'Orc Mob · Warbows',equipment:'Hand weapons · warbows · light armour',profile:{M:4,WS:3,BS:3,S:3,T:4,W:1,I:3,A:1,Ld:6,save:6},weapon:{name:'Warbow',range:24,strength:3,ap:0,volley:true}}};
export const WIZARDS={chaos:{name:'Daemonsmith Sorcerer',equipment:'Hand weapon · heavy armour · Blackshard armour · Ensorcelled weapon',profile:{M:3,WS:4,BS:4,S:4,T:4,W:2,I:2,A:2,Ld:9,save:5},lore:'daemonology',rules:['loreOfHashut']},empire:{name:'Master Mage (Battlemage)',equipment:'Hand weapon',profile:{M:4,WS:3,BS:3,S:3,T:3,W:2,I:3,A:1,Ld:7,save:7},lore:'battle'}};
export const CHARACTERS={empireCaptain:{name:'Captain of the Empire',profile:{M:4,WS:5,BS:5,S:4,T:4,W:2,I:4,A:2,Ld:9},equipment:'Hand weapon'}};
const ARMOUR_SAVE={fullPlate:4,heavy:5,light:6};
export const isCharacter=u=>u?.role==='wizard'||u?.role==='character';
// A model's printed characteristics; profile() applies any temporary effects on top.
// Cavalry mounts (The Empire of Man data). A mounted character is treated as the mount's troop type
// and keeps a split profile: the rider's characteristics, but the mount's Movement (and any extra
// Wounds); the mount attacks with its own WS, S, I and A. Barding improves the armour value by 1.
export const MOUNTS={
 warhorse:{name:'Empire Warhorse',troop:'lightCavalry',base:{w:30,h:60},profile:{M:8,WS:3,S:3,I:3,A:1},rules:['fastCavalry','swiftstride']},
 barded:{name:'Barded Warhorse',troop:'heavyCavalry',base:{w:30,h:60},profile:{M:7,WS:3,S:3,I:3,A:1},barding:true,rules:['counterCharge','firstCharge','swiftstride']},
 pegasus:{name:'Pegasus',troop:'monstrousCavalry',base:{w:40,h:60},profile:{M:8,WS:3,S:4,I:4,A:2},wounds:1,fly:10,rules:['counterCharge','firstCharge','fly','swiftstride']},
};
function mounted(u,p){if(!u?.mount||!p)return p;const m=MOUNTS[u.mount];if(!m)return p;if(u.mountAttack)return {...p,...m.profile,BS:0,save:7};return {...p,M:m.profile.M,W:p.W+(m.wounds??0),save:m.barding?Math.max(2,(p.save??7)-1):p.save};}
// The mount striking for itself: the rider's state, the mount's characteristics, no weapon of the rider's.
export const mountProxy=u=>({...u,mountAttack:true,weapon:null,role:'mount'});
export const baseProfile=u=>mounted(u,riderProfile(u));
const riderProfile=u=>u?.role==='character'||u?.role==='mount'&&u.kind?{...CHARACTERS[u.kind].profile,save:ARMOUR_SAVE[u.armour]??7}:u?.role==='warmachine'?{...WAR_MACHINE_CREW[u.faction].profile,A:Math.max(0,u.crew)}:u?.role==='wizard'?{...WIZARDS[u.faction].profile,T:WIZARDS[u.faction].profile.T+(u.petrified??0)}:u?.role==='missile'?MISSILE[u.faction].profile:FACTIONS[u?.faction??'chaos'].profile;
export const profile=u=>withEffects(u,baseProfile(u));
export const equipment=u=>[riderEquipment(u),u?.mount&&MOUNTS[u.mount]?`${MOUNTS[u.mount].name} (WS${MOUNTS[u.mount].profile.WS} S${MOUNTS[u.mount].profile.S} I${MOUNTS[u.mount].profile.I} A${MOUNTS[u.mount].profile.A}${MOUNTS[u.mount].barding?', barding':''}${MOUNTS[u.mount].fly?', Fly '+MOUNTS[u.mount].fly:''})`:null].filter(Boolean).join(' · ');
const riderEquipment=u=>u?.role==='character'?[CHARACTERS[u.kind].equipment,u.weapon==='greatWeapon'?'great weapon':null,{fullPlate:'full plate armour',heavy:'heavy armour',light:'light armour'}[u.armour]].filter(Boolean).join(' · '):u?.role==='wizard'?WIZARDS[u.faction].equipment:u?.role==='missile'?MISSILE[u.faction].equipment:FACTIONS[u?.faction??'chaos'].equipment;
export const missileWeapon=u=>u?.role==='missile'?MISSILE[u.faction].weapon:null;
// A regiment's block is its files wide and as many ranks deep as its starting models need.
// A regiment joined by characters has a place in its block for each of them (u.charSlots).
export const startingModels=u=>u?.models??20,filesOf=u=>u?.files??5,ranksOf=u=>Math.ceil((startingModels(u)+(u?.charSlots?.length??0))/filesOf(u));
export const size=u=>{if(u?.role==='warmachine')return {w:ROCKET_BASE.w,h:ROCKET_BASE.h};const b=FACTIONS[u?.faction??'chaos'].base/25.4;return isCharacter(u)?(MOUNTS[u.mount]?{w:MOUNTS[u.mount].base.w/25.4,h:MOUNTS[u.mount].base.h/25.4}:{w:b,h:b}):{w:filesOf(u)*b,h:ranksOf(u)*b};};
export const baseSize=u=>FACTIONS[u?.faction??'chaos'].base;
export const COMMAND_SLOTS={1:'M',2:'S',3:'C'};
// A model's armour save before any attack: its armour, and its shield when it carries one. An
// infantry regiment's printed save already counts its army's usual shields (Chaos Dwarf Warriors
// 4+: heavy armour and shields; State Troops 5+: light armour and shields), so a regiment fielded
// without them is 1 worse; any other profile (missile troops, characters) is armour alone.
// Targeting a lone character: a character within 3″ of a friendly regiment of five or more models
// (not fleeing) cannot be picked out by enemy shooting or spells unless it is the closest target.
const SCREENED='A character within 3″ of a friendly regiment can be targeted only when it is the closest target.';
export function screenedCharacter(s,from,t){
 if(!isCharacter(t)||t.engaged||!from||from.x===null)return false;
 // The friendly unit must be of the character's troop type: infantry for one on foot, cavalry for one mounted.
 if(!s.units.some(f=>f.team===t.team&&f.id!==t.id&&f.x!==null&&!f.fleeing&&!isCharacter(f)&&f.role!=='warmachine'&&isCavalry(f)===isCavalry(t)&&aliveCount(f)>=5&&gap(t,f)<=3+EPS))return false;
 const d=gap(from,t);return combatants(s).some(v=>v.team===t.team&&v.id!==t.id&&v.x!==null&&aliveCount(v)>0&&gap(from,v)<d-EPS);
}
// A spell that worsens an armour value (Plague of Rust) adds to the save after shields; 7+ is none.
export function armourSave(u){const p=profile(u).save,worse=armourPenalty(u);if(u?.role==='infantry'&&FACTIONS[u.faction??'chaos']?.shield)return Math.min(7,(u.shields===false?p+1:p)+worse);return Math.min(7,(hasShield(u)?Math.max(2,p-1):p)+worse);}
export function hasShield(u){return u?.shields??(u?.role==='infantry'&&!!FACTIONS[u?.faction??'chaos'].shield);}
// Purchased command stand in the middle of the front rank: musician, standard at the centre, champion.
export function commandSlots(u){const c=Math.floor(filesOf(u)/2),bought=u?.command??{M:true,S:true,C:true},slots={};for(const [role,col]of [['M',c-1],['S',c],['C',c+1]])if(bought[role]&&col>=0&&col<filesOf(u)&&col<startingModels(u))slots[col]=role;return slots;}
export function commandAlive(u,role){if(isCharacter(u)||u?.role==='warmachine')return false;const entry=Object.entries(commandSlots(u)).find(([,r])=>r===role);return !!entry&&aliveCount(u)>0&&!(u.deadModels??[]).includes(Number(entry[0]));}
// Unit Strength = models x Unit Strength per model for the troop type (war machines: starting Wounds).
export const TROOP_TYPES={regular:{name:'Regular Infantry',perModel:1,perRank:5},heavy:{name:'Heavy Infantry',perModel:1,perRank:4},character:{name:'Infantry character',perModel:1},warmachine:{name:'War Machine',perModel:'wounds'},lightCavalry:{name:'Light Cavalry',perModel:2,perRank:5,cavalry:true},heavyCavalry:{name:'Heavy Cavalry',perModel:2,perRank:4,cavalry:true},monstrousCavalry:{name:'Monstrous Cavalry',perModel:3,perRank:3,cavalry:true}};
export const isCavalry=u=>!!TROOP_TYPES[troopType(u)]?.cavalry;
export function troopType(u){return u?.role==='warmachine'?'warmachine':isCharacter(u)?(MOUNTS[u.mount]?.troop??'character'):u?.troop??(FACTIONS[u?.faction??'chaos'].heavy?'heavy':'regular');}
export function startingWounds(u){return u?.role==='warmachine'||isCharacter(u)?(u.startingWounds??(isCharacter(u)?profile(u).W:3)):startingModels(u)*(profile(u).W??1);}
export function unitStrength(u){if(!u||aliveCount(u)===0||u.x===null&&!u.offBoardPursuit)return 0;const per=TROOP_TYPES[troopType(u)].perModel;return per==='wounds'?startingWounds(u):aliveCount(u)*per;}
export function startingUnitStrength(u){const per=TROOP_TYPES[troopType(u)].perModel;return per==='wounds'?startingWounds(u):isCharacter(u)?per:startingModels(u)*per;}
// The champion's own characteristics, then the same temporary effects as the rest of the unit.
export function championProfile(u){const b=baseProfile(u);return withEffects(u,{...b,A:u.role==='missile'&&u.faction==='empire'?1:2,BS:u.role==='missile'&&u.faction==='empire'?4:b.BS,Ld:u.faction==='orc'?7:b.Ld});}
export function setOpponent(s,faction){if(s.stage!=='deployment')throw Error('Choose the opposing army before battle starts.');if(!['orc','empire','chaos'].includes(faction))throw Error('Unknown army.');s.units=s.units.filter(u=>u.id!=='I7');for(const u of s.units.filter(u=>u.team==='iron')){u.faction=faction;u.name=u.role==='missile'?MISSILE[faction].name:FACTIONS[faction].name;u.x=null;u.y=null;}if(faction==='empire')s.units.push(createWizard('iron','empire'));s.cannons=createCannons(faction);return faction;}
export const PHASES=['strategy','movement','shooting','combat'];
export const armyName=(team,s)=>team==='ash'?'Chaos Dwarfs · Red':`${FACTIONS[s?.units.find(u=>u.team==='iron')?.faction??'chaos'].army} · ${s?.units.find(u=>u.team==='iron')?.faction==='orc'?'Green':'Blue'}`;
const EPS=1e-8,rad=d=>d*Math.PI/180;
export function createWizard(team,faction,{lore=null,level=2}={}){return {id:team==='ash'?'A6':'I7',team,faction,role:'wizard',name:WIZARDS[faction].name,lore:lore??WIZARDS[faction].lore??'battle',level,spells:[],castThisTurn:[],wounds:2,petrified:0,engineerUsed:false,x:null,y:null,heading:team==='ash'?0:180,moved:false,shot:false,spent:0,movementMode:null,marchRequired:null,marchTest:null,engaged:null,charge:null,impetuousTest:null,combatResolved:false,fleeing:false,rallyAttempted:false,rallied:false,deadModels:[]};}
const runtime=()=>({x:null,y:null,moved:false,shot:false,spent:0,movementMode:null,marchRequired:null,marchTest:null,engaged:null,charge:null,impetuousTest:null,combatResolved:false,fleeing:false,rallyAttempted:false,rallied:false,shieldwallUsed:false,deadModels:[]});
const REGIMENT_IDS={ash:['A1','A2','A3','A4','A7','A8','A9','A10'],iron:['I1','I2','I3','I4','I8','I9','I10','I11']},CHARACTER_IDS={ash:['A12','A13'],iron:['I12','I13']};
// Units, the launcher and cannons for one side from its roster. The engine models one wizard,
// one Deathshrieker (red) and Great Cannons (opponent) per side.
function armyFromRoster(team,roster){
 const faction=roster.faction,units=[],cannons=[];let rocket=null,regiments=0;
 for(const item of roster.entries){
  const e=A.entryOf(faction,item.entry),paid={cost:A.entryCost(faction,item),category:e.category,entry:item.entry,general:!!item.general};
  if(e.role==='wizard'){if(units.some(u=>u.role==='wizard'))throw Error('This engine supports one wizard per army.');const m=MOUNTS[item.mount];units.push({...createWizard(team,faction,{lore:item.lore??e.lores?.default}),name:e.name,...paid,...(m?{mount:item.mount,wounds:WIZARDS[faction].profile.W+(m.wounds??0),rules:[...m.rules]}:{})});}
  else if(e.role==='warmachine'&&team==='ash'&&item.entry==='deathshrieker'){if(rocket)throw Error('This engine supports one Deathshrieker per army.');rocket={...paid};}
  else if(e.role==='warmachine'&&team==='iron'&&item.entry==='greatCannon'){if(cannons.length>=2)throw Error('This engine supports at most two Great Cannons.');cannons.push({id:'I'+(5+cannons.length),name:'Great Cannon '+'AB'[cannons.length],...machineFields('iron','empire'),x:null,y:null,heading:180,wounds:3,crew:3,shot:false,disabledUntil:0,lastShot:null,...paid});}
  else if(e.role==='infantry'||e.role==='missile'){const id=REGIMENT_IDS[team][regiments++];if(!id)throw Error('Too many regiments for this engine.');units.push({id,team,faction,role:e.role,name:e.name,models:item.models,files:item.files??5,command:{C:!!item.command?.C,S:!!item.command?.S,M:!!item.command?.M},troop:e.troop,shields:!!(e.options?.shields&&(e.options.shields.required||item.options?.shields)),spears:!!item.options?.spears,...paid,rules:[...(e.rules??[])],heading:team==='ash'?0:180,...runtime()});}
  else if(e.role==='character'){const id=CHARACTER_IDS[team][units.filter(u=>u.role==='character').length];if(!id)throw Error('Too many characters for this engine.');units.push({id,team,faction,role:'character',kind:e.kind,name:e.name,weapon:item.options?.greatWeapon?'greatWeapon':null,armour:item.options?.fullPlate?'fullPlate':null,wounds:CHARACTERS[e.kind].profile.W+(MOUNTS[item.mount]?.wounds??0),mount:MOUNTS[item.mount]?item.mount:null,...paid,rules:[...(e.rules??[]),...(MOUNTS[item.mount]?.rules??[])],heading:team==='ash'?0:180,...runtime()});}
  else throw Error(`${e.name} cannot be fielded by this engine for this side.`);
 }
 return {units,cannons,rocket};
}
// A wizard's lore can be chosen for each side ({ash:'darkMagic'}): from its army entry's options.
const WIZARD_ENTRY={chaos:'daemonsmith',empire:'masterMage'};
function loreFor(faction,entry,lore){const options=A.ENTRIES[faction]?.[entry]?.lores?.options??['battle'];if(!options.includes(lore))throw Error(`${A.ENTRIES[faction]?.[entry]?.name??'This wizard'} cannot use ${A.LORE_NAMES[lore]??lore}.`);return lore;}
function withLores(lores,s){for(const [team,lore]of Object.entries(lores??{})){if(!lore)continue;for(const w of s.units.filter(u=>u.team===team&&u.role==='wizard'))w.lore=loreFor(w.faction,w.entry??WIZARD_ENTRY[w.faction],lore);}return s;}
export function createGame(opponent='chaos',{format='classic',board=null,points=null,deployment=null,rosters=null,objectives=null,optional=null,lores=null,terrain=null,random=Math.random}={}){if(!FACTIONS[opponent])throw Error('Unknown army.');const fmt=F.format(format),field=F.boardFor(fmt,{board,points}),setup=deployment??(fmt.deployment?.map?{map:fmt.deployment.map,depth:fmt.deployment.depth}:null);
 if(fmt.id==='battle-march')return withLores(lores,createRosterGame(opponent,fmt,field,setup,points,rosters,{objectives,optional,random,terrain}));const units=Array.from({length:8},(_,i)=>{const faction=i<4?'chaos':opponent,role=i%4===3?'missile':'infantry';return {id:(i<4?'A':'I')+(i%4+1),team:i<4?'ash':'iron',faction,role,name:role==='missile'?MISSILE[faction].name:FACTIONS[faction].name,x:null,y:null,heading:i<4?0:180,moved:false,shot:false,spent:0,movementMode:null,marchRequired:null,marchTest:null,engaged:null,charge:null,impetuousTest:null,combatResolved:false,fleeing:false,rallyAttempted:false,rallied:false,shieldwallUsed:false,deadModels:[]};});units.push(createWizard('ash','chaos'));if(opponent==='empire')units.push(createWizard('iron','empire'));return withLores(lores,{stage:'deployment',team:'ash',round:1,selected:'A1',rocket:{id:'A5',name:'Deathshrieker Rocket Launcher',...machineFields('ash','chaos'),x:null,y:null,heading:0,wounds:3,crew:3,shot:false,disabledUntil:0,lastShot:null},cannons:createCannons(opponent),units,history:[],vortices:[],fatedDispelUsed:{ash:false,iron:false},format:{id:fmt.id,name:fmt.name,rulesVersion:fmt.rulesVersion,points:fmt.points?(points??fmt.points.default):null,rounds:fmt.rounds,deployment:setup,resultPolicy:fmt.resultPolicy??null,optional:{...(fmt.optional??{})}},board:field,zones:F.deploymentZones(fmt,field,setup??{}),firstPlayer:'ash',turnLog:[]});}
function optionalRules(fmt,chosen){const rules={...fmt.optional};for(const [key,on]of Object.entries(chosen??{})){const rule=F.OPTIONAL_RULES[key];if(!(key in rules)||!rule)throw Error(`Unknown optional rule "${key}".`);if(on&&!rule.available)throw Error(`${rule.name} is not available yet: ${rule.reason}.`);rules[key]=!!on;}return rules;}
function createRosterGame(opponent,fmt,field,setup,points,rosters,{objectives=null,optional=null,random=Math.random,terrain=null}={}){
 // The deployment map is chosen or rolled on a D6. Red sets up the game, so Red counts as the map
 // selector (shown to the players) and the opponent chooses its zone.
 if(setup?.map==='roll'){const roll=rollD6(1,random)[0];setup={...setup,map:F.DEPLOYMENT_MAPS.find(m=>m.roll===roll).id,roll};}
 if(setup)setup={selector:'ash',mirrored:false,sides:{...F.DEFAULT_SIDES},...setup};
 const limit=points??fmt.points.default,chosen={ash:rosters?.ash??A.defaultRoster('chaos',limit),iron:rosters?.iron??A.defaultRoster(opponent,limit)};
 if(!chosen.iron)throw Error(A.GAPS[opponent]?.[0]??`No Battle March army is available for ${opponent}.`);
 if(chosen.ash.faction!=='chaos'||chosen.iron.faction!==opponent)throw Error('Red must be Chaos Dwarfs and the opponent must match the chosen army.');
 const red=armyFromRoster('ash',chosen.ash),blue=armyFromRoster('iron',chosen.iron);
 const rocket={id:'A5',name:'Deathshrieker Rocket Launcher',...machineFields('ash','chaos'),x:null,y:null,heading:0,wounds:3,crew:3,shot:false,disabledUntil:0,lastShot:null,...(red.rocket??{absent:true,wounds:0,crew:0})};
 const armies=Object.fromEntries(Object.entries(chosen).map(([team,roster])=>[team,{roster,validation:A.validateRoster(roster,limit),source:A.SOURCES[roster.faction]}]));
 const s={stage:'deployment',team:'ash',round:1,selected:red.units[0]?.id,rocket,cannons:blue.cannons,units:[...red.units,...blue.units],history:[],vortices:[],fatedDispelUsed:{ash:false,iron:false},
  format:{id:fmt.id,name:fmt.name,rulesVersion:fmt.rulesVersion,points:limit,rounds:fmt.rounds,deployment:setup,resultPolicy:fmt.resultPolicy,optional:optionalRules(fmt,optional),objectives:objectives??fmt.objectives??'roll'},board:field,zones:F.deploymentZones(fmt,field,setup??{}),facing:F.deploymentFacing(fmt,setup??{}),firstPlayer:'ash',turnLog:[],armies,sources:{system:A.SOURCES.system,preferences:A.PREFERENCES},
  deployOrder:fmt.deployment?.order==='alternate'?{alternate:true,rule:fmt.deployment.rollOff??'winner-chooses',zonesChosen:false,rollOff:null,first:null,chosenBy:null,next:null,pending:null,batch:null,log:[],complete:false}:null,firstTurn:null};
 // Each army deploys facing the way its map sets (across the table, or along it in Mountain Pass).
 for(const p of combatants(s))p.heading=deploymentFacing(s,p.team);
 // The format's own rules (objectives for Battle March) set up the battlefield before deployment.
 FORMAT_RULES[fmt.id]?.setup?.(s,{choice:s.format.objectives,random});
 // Terrain is set up next, before the objectives settle and the armies deploy (startTerrain).
 if(terrain)startTerrain(s,terrain);
 return s;
}
export function getUnit(s,id=s.selected){return s.units.find(u=>u.id===id)??(id!==undefined&&id!==null?combatants(s).find(u=>u.id===id):undefined);}
// ---- Engagements: a unit can fight several enemy units at once. u.engaged is null or the list
// of enemy unit ids it is in combat with; a combat is every unit joined by engagements.
export const opponentIds=u=>u?.engaged==null?[]:Array.isArray(u.engaged)?u.engaged:[u.engaged];
export function engagedWith(u,other){return opponentIds(u).includes(typeof other==='string'?other:other?.id);}
export function opponents(s,u){return opponentIds(u).map(id=>getUnit(s,id)).filter(v=>v&&v.x!==null&&aliveCount(v)>0);}
function engage(a,b){if(!a||!b||a.id===b.id)return;a.engaged=[...new Set([...opponentIds(a),b.id])];b.engaged=[...new Set([...opponentIds(b),a.id])];}
function release(s,u){if(!u)return;for(const id of opponentIds(u)){const v=getUnit(s,id);if(v){const rest=opponentIds(v).filter(x=>x!==u.id);v.engaged=rest.length?rest:null;}}u.engaged=null;for(const c of s.units.filter(c=>c.joined===u.id&&c.engaged))release(s,c);}
export function combatGroup(s,u){const seen=new Map(),stack=[u];while(stack.length){const v=stack.pop();if(!v||seen.has(v.id))continue;seen.set(v.id,v);for(const id of [...opponentIds(v)].reverse()){const w=getUnit(s,id);if(w&&w.x!==null&&aliveCount(w)>0&&!seen.has(w.id))stack.push(w);}}return [...seen.values()];}
// Every combat that still has to be fought this phase, as the sorted ids of its units.
export function combats(s){const done=new Set(),out=[];for(const u of combatants(s).filter(u=>u.engaged&&u.x!==null&&aliveCount(u)>0)){if(done.has(u.id))continue;const group=combatGroup(s,u);for(const v of group)done.add(v.id);if(group.length>1&&group.some(v=>!v.combatResolved)&&new Set(group.map(v=>v.team)).size>1)out.push(group.map(v=>v.id).sort());}return out;}
// A real overlap, not just touching: the footprint shrunk by a few hundredths still meets the other.
// Two footprints overlap when either, shrunk by 0.03″, still meets the other: touching is not
// overlapping, and the answer does not depend on which unit is named first.
function shrunkMeets(a,b){const pa=corners(a),c={x:pa.reduce((n,p)=>n+p.x,0)/4,y:pa.reduce((n,p)=>n+p.y,0)/4},inner=pa.map(p=>{const d=Math.hypot(p.x-c.x,p.y-c.y)||1;return {x:p.x+(c.x-p.x)*.03/d,y:p.y+(c.y-p.y)*.03/d};});return polygonGap(inner,corners(b))<EPS;}
export function overlaps(a,b){return shrunkMeets(a,b)||shrunkMeets(b,a);}
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
// Impassable terrain a footprint (or the area a move sweeps) overlaps; touching its edge is allowed.
export function terrainBlocks(s,poly){const inner=shrink(poly,.01);return (s?.terrain??[]).some(t=>featureMovement(t)==='impassable'&&featureGap(t,inner)<EPS);}
function terrainBlocksSight(s,a,b){return (s?.terrain??[]).some(t=>(t.blocksSight||t.sight==='blocks')&&(t.points||t.line?polygonGap(shrink(t.points??t.line,.01),[a,b])<EPS&&!(t.points&&(inside(a,t.points)||inside(b,t.points))):pointSegment({x:t.x,y:t.y},a,b)<t.r-EPS));}
// ---- Temporary effects: a spell's or a landmark's, kept on the units they affect. ----
// A record: {id, spell or property, source:{kind,caster,team}, mods:[{stat,add,min?,max?}], ap,
// rules:[{rule,value} or {block}], stack, created:{round,team}, expiry:{kind,at}}. An older
// landmark record carries a single rule. Records with the same stack key count once on a unit,
// so the same spell cast twice does not add up; different spells do.
const EFFECT_STATS=['M','WS','BS','S','T','W','I','A','Ld'];
function liveEffects(u){const list=u?.effects;if(!list?.length)return [];const seen=new Set(),out=[];for(const e of list){if(e.stack){if(seen.has(e.stack))continue;seen.add(e.stack);}out.push(e);}return out;}
// Each characteristic adds up its modifiers, then is held to the tightest minimum or maximum
// among them, which never takes it past its starting value: the order of effects never matters.
function withEffects(u,p){
 const list=liveEffects(u).filter(e=>e.mods?.length);if(!list.length||!p)return p;const out={...p};
 for(const stat of EFFECT_STATS){const mods=list.flatMap(e=>e.mods.filter(m=>m.stat===stat));if(!mods.length||out[stat]===undefined)continue;
  const base=out[stat],mins=mods.filter(m=>m.min!==undefined).map(m=>m.min),maxs=mods.filter(m=>m.max!==undefined).map(m=>m.max);let v=base+mods.reduce((n,m)=>n+m.add,0);
  if(mins.length&&v<Math.max(...mins))v=Math.min(base,Math.max(...mins));if(maxs.length&&v>Math.min(...maxs))v=Math.max(base,Math.min(...maxs));out[stat]=v;}
 return out;
}
// Adds one copy of the record to each recipient; a record with the same stack key is replaced.
export function addEffect(s,recipients,record){const out=[];for(const u of recipients.filter(Boolean)){s.effectSeq=(s.effectSeq??0)+1;const e={...structuredClone(record),id:'E'+s.effectSeq};u.effects=[...(u.effects??[]).filter(x=>!e.stack||x.stack!==e.stack),e];out.push(e);}return out;}
export function removeEffects(u,match){if(u?.effects?.length)u.effects=u.effects.filter(e=>!match(e));}
// The rule (or older single-rule record) granting this rule, or null. It may be marked as used.
export function effectRule(u,rule,match=()=>true){for(const e of liveEffects(u)){if(e.rule===rule&&match(e))return e;const r=e.rules?.find(r=>r.rule===rule&&match(r));if(r)return r;}return null;}
export function hasRule(u,rule){return !!effectRule(u,rule);}
// An effect that takes away one of the unit's rules (Gathering Darkness: Inspiring Presence).
export function blocksRule(u,rule){return liveEffects(u).some(e=>e.rules?.some(r=>r.block===rule));}
// Improved Armour Piercing from effects (the engine counts AP as a positive save modifier).
export function apBonus(u){return liveEffects(u).reduce((n,e)=>n+(e.ap??0),0);}
// How much worse effects make the unit's armour value (Plague of Rust: 2).
export function armourPenalty(u){return liveEffects(u).reduce((n,e)=>n+(e.armour??0),0);}
// The strongest Magic Resistance applies, never the sum.
export function magicResistance(u){return Math.max(0,...liveEffects(u).flatMap(e=>e.rule==='magicResistance'?[e.value??2]:(e.rules??[]).filter(r=>r.rule==='magicResistance').map(r=>r.value??2)),u?.role==='wizard'&&u?.faction==='empire'?1:0);}
// Turns are named round:side. Expiry kinds: END_CURRENT_PLAYER_TURN and END_OF_NEXT_PLAYER_TURN
// end with the turn named; START_OF_CASTING_PLAYER_NEXT_TURN ends as that turn begins.
const turnName=(round,team)=>`${round}:${team}`;
// The turn after this side's turn this round.
export function followingTurn(s,team=s.team){return team===s.firstPlayer?turnName(s.round,team==='ash'?'iron':'ash'):turnName(s.round+1,s.firstPlayer);}
// This side's next turn after the current one.
export function nextTurnOf(s,team){return team===s.team||team===s.firstPlayer?turnName(s.round+1,team):turnName(s.round,team);}
export function expiryAt(s,kind,team=s.team){return {kind,at:kind==='END_CURRENT_PLAYER_TURN'?turnName(s.round,s.team):kind==='END_OF_NEXT_PLAYER_TURN'?followingTurn(s,s.team):nextTurnOf(s,team)};}
function expireEffects(s,when,key){const ends=e=>when==='end'?e.expires===key||(e.expiry?.kind==='END_CURRENT_PLAYER_TURN'||e.expiry?.kind==='END_OF_NEXT_PLAYER_TURN')&&e.expiry.at===key:e.expiry?.kind==='START_OF_CASTING_PLAYER_NEXT_TURN'&&e.expiry.at===key;for(const u of allPieces(s))removeEffects(u,ends);}
// ---- The General's Inspiring Presence ----
export function generalOf(s,team){return s?.units.find(u=>u.team===team&&u.general&&!u.destroyed&&aliveCount(u)>0)??null;}
// Unless the General is fleeing, a friendly unit within its Command range (its Leadership in
// inches) may use the General's Leadership instead of its own.
// ---- Fly ----
// Fly values a unit has (from Steed of Shadows): separate options, never added together.
export function flyValues(u){return [...new Set([...liveEffects(u).flatMap(e=>(e.rules??[]).filter(r=>r.rule==='fly').map(r=>r.value)),...(MOUNTS[u?.mount]?.fly?[MOUNTS[u.mount].fly]:[])])].sort((a,b)=>b-a);}
// Swiftstride: 3″ more charge range, and +D6 to every Charge, Flee and Pursuit roll (always taken here).
export const chargeReach=u=>profile(u).M+6+(unitHasRule(u,'swiftstride')?3:0);
const swift=(u,random)=>unitHasRule(u,'swiftstride')?rollD6(1,random)[0]:0;
// The Movement a move uses: on foot, M; flying, the Fly value. Marching doubles it; difficult
// terrain takes 1 off first (never below 1).
export function moveValue(u,medium='ground',fly=null){return medium==='fly'?(fly??flyValues(u)[0]??0):profile(u).M;}
export function moveAllowance(u,{mode='advance',medium='ground',fly=null,difficult=false}={}){return Math.max(1,moveValue(u,medium,fly)-(difficult?1:0))*(mode==='march'?2:1);}
// The General's Command range is 12″, whatever its Leadership (the core rules' General & Battle Standard).
export const COMMAND_RANGE=12;
export function inspiringPresence(s,u){if(!s||!u||u.x===null)return null;const g=generalOf(s,u.team);if(!g||g.id===u.id||g.fleeing||g.x===null||blocksRule(u,'inspiringPresence'))return null;const ld=profile(g).Ld;return gap(g,u)<=COMMAND_RANGE+EPS?ld:null;}
export const boardOf=s=>s?.board??BOARD;
function offBoard(u,s){const r=rectangle(u),b=boardOf(s);return r.left< -EPS||r.right>b.width+EPS||r.top< -EPS||r.bottom>b.height+EPS;}
function withinPolygon(p,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(pointSegment(p,a,b)<1e-6)return true;if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
export function zoneOf(s,team){return (s?.zones??F.deploymentZones('classic',BOARD))[team];}
// A footprint is inside a zone (which may be concave) when every corner is inside it and no
// zone corner pokes into the footprint.
export function inZone(s,team,footprint){const zone=zoneOf(s,team);return footprint.every(p=>withinPolygon(p,zone))&&!zone.some(z=>inside(z,footprint)&&!footprint.some((p,i)=>pointSegment(z,p,footprint[(i+1)%footprint.length])<1e-6));}
export const deploymentFacing=(s,team)=>s?.facing?.[team]??(team==='ash'?0:180);
export function insideZone(s,team,p){return withinPolygon(p,zoneOf(s,team));}
export function zoneBounds(s,team){const z=zoneOf(s,team);return {left:Math.min(...z.map(p=>p.x)),right:Math.max(...z.map(p=>p.x)),top:Math.min(...z.map(p=>p.y)),bottom:Math.max(...z.map(p=>p.y))};}
function claimStandard(s,u,by){if(u&&!u.standardClaimed&&commandAlive(u,'S')){u.standardClaimed=by;(s.trophies??=[]).push({unit:u.id,team:by,round:s.round});}}
// Destruction is registered once, with its reason: COMBAT_CASUALTIES (wiped out by attacks:
// shooting, magic or close combat), RUN_DOWN (caught while fleeing), FLED_OFF_TABLE, or
// SPECIAL_RULE (a war machine abandoned by its crew, a fleeing unit lost to Peril). A Remains in
// Play spell of its own goes with it.
// A unit of Unit Strength 5 or more that is destroyed makes friendly units within 6″ test for Panic
// (Nearby Friend Destroyed), measured from where it stood.
function destroyUnit(s,u,reason='COMBAT_CASUALTIES',random=Math.random){if(!u)return;const pose=u.x!==null?{...u}:null,us=aliveCount(u)>0?unitStrength(u):(u.usBeforeLoss??0);
 // Characters in a unit that flees off the battlefield or is run down are lost with it; otherwise
 // they stand on as lone characters. A character slain in a unit leaves its place.
 for(const c of s?s.units.filter(c=>c.joined===u.id):[]){c.joined=null;if(reason==='FLED_OFF_TABLE'||reason==='RUN_DOWN')destroyUnit(s,c,reason,random);}if(u.charSlots)delete u.charSlots;if(s&&u.joined)detach(s,u);Object.assign(u,{x:null,y:null,destroyed:true,fleeing:false,engaged:null,raiding:null});u.destroyedBy??=reason;if(reason==='FLED_OFF_TABLE')u.leftBoard='fled';if(s)s.vortices=(s.vortices??[]).filter(v=>v.caster!==u.id);if(s&&pose&&us>=5)nearbyPanic(s,u,pose,'Nearby Friend Destroyed',random);}
// The prototype keeps 1″ between units. A unit that already stands closer than that to another
// (friends left shoulder to shoulder after a combat) may move along or away from it, but never into it.
// Only friends: an enemy is never reached by an ordinary move, only by a charge.
function closeAtStart(s,u){const start=getUnit(s,u?.id);return v=>!!start&&start.x!==null&&v.id!==start.id&&v.team===start.team&&v.x!==null&&gap(start,v)<1-EPS;}
function shrink(poly,d=.03){const c={x:poly.reduce((n,p)=>n+p.x,0)/poly.length,y:poly.reduce((n,p)=>n+p.y,0)/poly.length};return poly.map(p=>{const l=Math.hypot(p.x-c.x,p.y-c.y)||1;return {x:p.x+(c.x-p.x)*d/l,y:p.y+(c.y-p.y)*d/l};});}
// ---- Special deployment rules: Scouts, Vanguard, Ambushers ----
// A unit's special rules: from its army entry (rules), or granted by an effect.
export const unitHasRule=(u,rule)=>!!u?.rules?.includes(rule)||hasRule(u,rule);
const isScout=u=>unitHasRule(u,'scouts');
export const inReserve=u=>!!u?.reserve&&u.x===null&&!u.destroyed;
// Scouts deploy after every other unit of both armies (in a game deployed all at once, whenever).
function normalLeft(s,team){return deploymentPieces(s,team).some(q=>!q.deployed&&!inReserve(q)&&!isScout(q));}
export function scoutPhase(s){return s.stage==='deployment'&&(!s.deployOrder?.alternate||!normalLeft(s,'ash')&&!normalLeft(s,'iron'));}
const clearOfEnemies=(s,team,pose,d)=>combatants(s).every(v=>v.team===team||v.x===null||aliveCount(v)===0||gap(pose,v)>d+EPS);
export function checkPosition(state,unit,x,y,deployment=false,{moving=false}={}){
  if(!Number.isFinite(x)||!Number.isFinite(y))return 'Enter valid coordinates.';
  const candidate={...unit,x,y},r=rectangle(candidate),close=moving?closeAtStart(state,unit):()=>false;
  if(offBoard(candidate,state))return 'The whole regiment must stay on the battlefield.';
  if(terrainBlocks(state,corners(candidate)))return 'Units cannot enter impassable terrain.';
  // Scouts may also deploy anywhere more than 12″ from every enemy model.
  if(deployment&&!inZone(state,unit.team,corners(candidate))&&!(isScout(unit)&&scoutPhase(state)&&clearOfEnemies(state,unit.team,candidate,12)))return isScout(unit)&&scoutPhase(state)?'Scouts deploy in their own zone or more than 12″ from every enemy model.':'Keep the entire block inside its own deployment zone.';
  if(state.units.some(u=>u.id!==unit.id&&u.x!==null&&!u.joined&&(close(u)?overlaps(candidate,u):gap(candidate,u)<1-EPS)))return 'Keep at least 1″ between regiments.';
  if(state.rocket?.x!==null&&state.rocket.id!==unit.id&&(close(state.rocket)?polygonGap(shrink(corners(candidate)),corners(state.rocket))<EPS:polygonGap(corners(candidate),corners(state.rocket))<1-EPS))return 'Keep at least 1″ between regiments and the Deathshrieker.';
  if(state.cannons?.some(c=>c.x!==null&&c.id!==unit.id&&(close(c)?polygonGap(shrink(corners(candidate)),corners(c))<EPS:polygonGap(corners(candidate),corners(c))<1-EPS)))return 'Keep at least 1″ between regiments and cannons.';
  return null;
}
export function place(s,id,x,y){if(s.stage!=='deployment')throw Error('Deployment is finished.');const u=getUnit(s,id);if(!u)throw Error('Unknown regiment.');if(u.joined)throw Error(`${u.name} has joined a unit: pick it up first to place it on its own.`);deployGate(s,u);const error=checkPosition(s,u,x,y,true);if(error)throw Error(error);Object.assign(u,{x,y,reserve:null});if(isScout(u))u.scouted=!inZone(s,u.team,corners(u));deployPlaced(s,u);syncJoined(s,u);return u;}
// A war machine deploys like a regiment: its whole base, as turned, inside its own zone, clear of
// impassable terrain and at least 1″ from every other unit and war machine.
function machinePlacementError(s,m,x,y){
 if(!Number.isFinite(x)||!Number.isFinite(y))return 'Enter valid coordinates.';
 const poly=corners({...m,x,y}),name=m.id===s.rocket?.id?'launcher':'cannon';
 if(!inZone(s,m.team,poly))return `Keep the whole ${name} in the ${m.team==='ash'?'red':'blue'} deployment zone.`;
 if(terrainBlocks(s,poly))return 'War machines cannot be placed on impassable terrain.';
 if(combatants(s).some(v=>v.id!==m.id&&v.x!==null&&polygonGap(poly,corners(v))<1-EPS))return `Keep the ${name} at least 1″ from other units.`;
 return null;
}
// Why a piece cannot be placed at this spot during deployment, or null when it can.
export function deployError(s,p,x,y){return p?.role==='warmachine'?machinePlacementError(s,p,x,y):checkPosition(s,p,x,y,true);}
export function placeRocket(s,x,y){if(s.stage!=='deployment')throw Error('Deploy the launcher before battle.');if(s.rocket.absent)throw Error('This army has no Deathshrieker.');deployGate(s,s.rocket);const error=machinePlacementError(s,s.rocket,x,y);if(error)throw Error(error);Object.assign(s.rocket,{x,y});deployPlaced(s,s.rocket);return s.rocket;}
export function placeCannon(s,id,x,y){if(s.stage!=='deployment')throw Error('Deploy cannons before battle.');const cannon=s.cannons.find(c=>c.id===id);if(!cannon)throw Error('Choose an Empire cannon.');deployGate(s,cannon);if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Enter valid coordinates.');const error=machinePlacementError(s,cannon,x,y);if(error)throw Error(error);Object.assign(cannon,{x,y});deployPlaced(s,cannon);return cannon;}
// Quick deploy. Battle March always uses the deployment plan below; a classic game does too when
// given a random source (the game's Quick deploy), otherwise it keeps its fixed test layout.
export function autoDeploy(s,{team=null,random=null}={}){if(s.stage!=='deployment')throw Error('Deployment is finished.');if(terrainPending(s)){if(team)throw Error('Set up the terrain first.');quickTerrain(s,random??Math.random);}if((s.format?.id??'classic')!=='classic'||random)return alternating(s)?alternateAutoDeploy(s,team,random):searchDeploy(s,team,random);s.units.forEach((u,i)=>{if(!team||u.team===team)Object.assign(u,{x:u.id==='A6'?3.5:u.id==='I7'?70:[18,36,54,64][i%4],y:u.team==='ash'?42:6});});if(!team||team==='ash')placeRocket(s,8,42);if(!team||team==='iron')for(const [i,c]of s.cannons.entries())placeCannon(s,c.id,[8,45][i],6);}
// Spread each army across the middle of its zone, trying the nearest legal spots.
// Regiments, war machines, characters, then Scouts; a unit held in reserve is not deployed.
function deployOrderOf(s,side){const mine=v=>v.team===side&&!inReserve(v);return [...s.units.filter(u=>mine(u)&&!isCharacter(u)&&!isScout(u)),...combatants(s).filter(m=>m.role==='warmachine'&&mine(m)),...s.units.filter(u=>mine(u)&&isCharacter(u)&&!isScout(u)),...s.units.filter(u=>mine(u)&&isScout(u))];}
function placePiece(s,p,x,y){return p.role==='warmachine'?(p.team==='ash'?placeRocket(s,x,y):placeCannon(s,p.id,x,y)):place(s,p.id,x,y);}
// Manual deployment: place any piece (regiment, character or war machine), turn it where it
// stands, or pick it back up. Only a piece that has not been confirmed can be changed.
export function placeAt(s,id,x,y){const p=getUnit(s,id);if(!p)throw Error('Unknown unit.');return placePiece(s,p,x,y);}
export function turnDeployed(s,id,heading){
 const p=getUnit(s,id);if(s.stage!=='deployment'||!p||p.x===null)throw Error('Place the unit first.');
 const old=p.heading;p.heading=normalize(heading);try{placePiece(s,p,p.x,p.y);}catch(e){p.heading=old;throw Error(e.message.replace(/^Keep/,'Turned like that it would not fit: keep'));}return p;
}
export function unplace(s,id){
 const p=getUnit(s,id),d=s.deployOrder;if(s.stage!=='deployment'||!p||p.x===null)throw Error('Nothing to pick up.');
 if(p.deployed)throw Error(`${p.name} is already deployed; deployed units stay where they are.`);
 if(alternating(s)&&!d.auto&&!d.batch?.ids.includes(p.id))throw Error('Only a unit being placed this turn can be picked up.');
 if(p.joined)detach(s,p);Object.assign(p,{x:null,y:null});syncJoined(s,p);
 if(alternating(s)&&d.batch){const still=d.batch.ids.find(id=>getUnit(s,id)?.x!==null);d.pending=still??null;if(!still)d.batch=null;}return p;
}
// The quick-deploy plan for one army: regiments form the battle line along the front of the zone,
// war machines stand at its very back toward the flanks (where their long range still reaches),
// and characters just behind the middle of the line. With a random source the line's order,
// spacing and flank choice change from game to game; without one the plan is always the same.
function deployPlan(s,team,random=null){
 s.autoPlan??={};if(s.autoPlan[team])return s.autoPlan[team];
 const pieces=deployOrderOf(s,team),line=pieces.filter(p=>!isCharacter(p)&&p.role!=='warmachine'),machines=pieces.filter(p=>p.role==='warmachine'),heroes=pieces.filter(p=>isCharacter(p));
 const jitter=n=>random?(random()-.5)*n:0,shuffle=list=>random?list.map(v=>[random(),v]).sort((a,b)=>a[0]-b[0]).map(([,v])=>v):list,plan={};
 shuffle(line).forEach((p,i,all)=>{plan[p.id]={slot:Math.max(.04,Math.min(.96,(i+1)/(all.length+1)+jitter(.5/(all.length+1)))),band:'front'};});
 const flanks=shuffle([.08,.92]).concat([.3,.7,.5]);machines.forEach((p,i)=>{plan[p.id]={slot:Math.max(.02,Math.min(.98,flanks[i%flanks.length]+jitter(.1))),band:'back'};});
 heroes.forEach((p,i)=>{plan[p.id]={slot:.5+(i-(heroes.length-1)/2)*.14+jitter(.24),band:'back'};});
 return s.autoPlan[team]=plan;
}
function autoSpot(s,p,{slot=.5,band='front'}={}){
 // Worked across the army's front (lateral) and toward the enemy (depth), so the same plan fits
 // zones along the long edges, the short edges (Mountain Pass), quarters and triangles.
 const a=rad(deploymentFacing(s,p.team)),fw={x:Math.sin(a),y:-Math.cos(a)},lat={x:Math.cos(a),y:Math.sin(a)},zone=zoneOf(s,p.team),{h}=size(p);
 const L=zone.map(q=>q.x*lat.x+q.y*lat.y),D=zone.map(q=>q.x*fw.x+q.y*fw.y),l0=Math.min(...L),l1=Math.max(...L),d0=Math.min(...D),d1=Math.max(...D);
 const front=d1-h/2-.01,back=d0+h/2+.01,middle=(d0+d1)/2,ideal=l0+(l1-l0)*slot,point=(l,d)=>({x:l*lat.x+d*fw.x,y:l*lat.y+d*fw.y});
 // Lines from the preferred edge inward in ½″ steps, so a unit stands as far back (or forward) as it fits.
 const depths=Array.from({length:Math.max(1,Math.ceil((front-back)*2)+1)},(_,k)=>Math.min(front,back+k/2)),lines=band==='back'?depths:[...depths].reverse(),along=Array.from({length:Math.ceil((l1-l0)*2)+1},(_,k)=>l0+k/2).sort((m,n)=>Math.abs(m-ideal)-Math.abs(n-ideal));
 for(const d of lines)for(const l of along){const q=point(l,d);try{placePiece(s,p,q.x,q.y);return p;}catch{}}
 // Triangles and quarters: any legal spot in the zone, nearest the intended one first.
 const want=point(ideal,lines[0]),b=zoneBounds(s,p.team),grid=[];for(let x=b.left;x<=b.right+EPS;x+=.5)for(let y=b.top;y<=b.bottom+EPS;y+=.5)grid.push({x,y});
 for(const g of grid.sort((m,n)=>Math.hypot(m.x-want.x,m.y-want.y)-Math.hypot(n.x-want.x,n.y-want.y))){try{placePiece(s,p,g.x,g.y);return p;}catch{}}
 throw Error(`No legal deployment space for ${p.name??p.id}.`);
}
function searchDeploy(s,team,random=null){
 for(const side of team?[team]:['ash','iron']){const pieces=deployOrderOf(s,side);for(const p of pieces){p.x=null;p.y=null;}if(s.autoPlan)delete s.autoPlan[side];const plan=deployPlan(s,side,random);pieces.forEach(p=>autoSpot(s,p,plan[p.id]));}
}
// ---- Alternating deployment: one unit at a time. The deployment roll-off winner chooses who
// deploys first; the armies then alternate, and once one army is down the other places the rest.
// A placed unit can be adjusted until its placement is confirmed.
const alternating=s=>s.stage==='deployment'&&!!s.deployOrder?.alternate;
export function deploymentPieces(s,team){return allPieces(s).filter(p=>p.team===team);}
export function deploymentTurn(s){return alternating(s)&&s.deployOrder.first&&!s.deployOrder.complete?s.deployOrder.next:null;}
// Deployment batches: a regiment is one turn; all of an army's war machines go down together in
// one turn (anywhere in the zone); its characters go down together, last, once the rest is down.
// A unit with Scouts deploys on its own, after every other unit of both armies.
export function deploymentBatch(s,p){const kind=p.role==='warmachine'?'machines':isScout(p)?'scout':isCharacter(p)?'characters':'unit';return {kind,team:p.team,ids:kind==='unit'||kind==='scout'?[p.id]:deploymentPieces(s,p.team).filter(q=>!q.deployed&&!inReserve(q)&&(kind==='machines'?q.role==='warmachine':isCharacter(q)&&!isScout(q))).map(q=>q.id)};}
const charactersWait=(s,p)=>isCharacter(p)&&!isScout(p)&&deploymentPieces(s,p.team).some(q=>!q.deployed&&!inReserve(q)&&!isCharacter(q)&&!isScout(q));
function deployGate(s,p){const d=s.deployOrder;if(terrainPending(s))throw Error('Set up the terrain first.');if(inReserve(p))throw Error(`${p.name} is held in reserve; bring it back to deploy it.`);if(!alternating(s)||d.auto)return;if(!d.zonesChosen)throw Error('Choose the deployment zones first.');if(!d.first)throw Error('Roll off first: the winner deploys the first unit.');if(d.complete||p.deployed)throw Error(`${p.name} is already deployed; deployed units stay where they are.`);if(isScout(p)&&!scoutPhase(s))throw Error('Scouts deploy after every other unit of both armies.');if(scoutPhase(s)&&d.scouts?.both&&!d.scouts.rollOff)throw Error('Both armies have Scouts: roll off to see who deploys them first.');if(p.team!==d.next)throw Error(`${armyName(d.next,s)} deploys the next unit.`);if(charactersWait(s,p))throw Error('Characters deploy last, all together, once every other unit of the army is down.');}
function deployPlaced(s,p){const d=s.deployOrder;if(!alternating(s)||d.auto)return;
 // Starting a different batch puts back what the unconfirmed one had placed.
 if(d.batch&&!d.batch.ids.includes(p.id))for(const id of d.batch.ids){const q=getUnit(s,id);if(q&&!q.deployed)Object.assign(q,{x:null,y:null});}
 if(!d.batch?.ids.includes(p.id))d.batch=deploymentBatch(s,p);d.pending=p.id;}
// Battle March: the player who did not select the map chooses a deployment zone; the other army
// takes the other zone. The facing defaults follow.
export const deploymentZoneChooser=s=>{const sel=s.format?.deployment?.selector??'ash';return sel==='ash'?'iron':'ash';};
export function chooseDeploymentZone(s,team,zone){
 const d=s.deployOrder,setup=s.format.deployment;if(!alternating(s))throw Error('This game has no deployment zone choice.');if(d.zonesChosen)throw Error('The deployment zones have been chosen.');if(terrainPending(s))throw Error('Set up the terrain first.');
 if(team!==deploymentZoneChooser(s))throw Error(`${armyName(deploymentZoneChooser(s),s)} chooses the deployment zone.`);if(!['A','B'].includes(zone))throw Error('Choose zone A or zone B.');
 setup.sides={[team]:zone,[team==='ash'?'iron':'ash']:zone==='A'?'B':'A'};s.zones=F.deploymentZones(s.format.id,s.board,setup);s.facing=F.deploymentFacing(s.format.id,setup);
 for(const p of combatants(s))if(p.x===null)p.heading=deploymentFacing(s,p.team);d.zonesChosen=true;return {...setup.sides};
}
function rollOff(random){const rolls=[];for(let i=0;i<100;i++){const [ash]=rollD6(1,random),[iron]=rollD6(1,random);rolls.push({ash,iron});if(ash!==iron)return {rolls,winner:ash>iron?'ash':'iron'};}return {rolls,winner:'ash'};}
// Battle March: the winner deploys the first unit. Under the core rule the winner chooses instead.
export function deploymentRollOff(s,random=Math.random){if(!alternating(s))throw Error('This game has no deployment roll-off.');const d=s.deployOrder;if(!d.zonesChosen)throw Error('Choose the deployment zones first.');if(d.rollOff||d.first)throw Error('The deployment roll-off has been made.');d.rollOff=rollOff(random);if(d.rule==='winner-deploys')Object.assign(d,{first:d.rollOff.winner,next:d.rollOff.winner,chosenBy:null});return d.rollOff;}
export function chooseDeploymentOrder(s,team,first){const d=s.deployOrder;if(!alternating(s)||!d.rollOff)throw Error('Roll off for deployment first.');if(d.rule==='winner-deploys')throw Error('In Battle March the roll-off winner deploys the first unit.');if(d.first)throw Error('Who deploys first has already been chosen.');if(team!==d.rollOff.winner)throw Error('Only the roll-off winner chooses who deploys first.');if(!['ash','iron'].includes(first))throw Error('Choose Red or the opponent.');Object.assign(d,{first,next:first,chosenBy:team});return first;}
export function confirmDeployment(s){
 const d=s.deployOrder;if(!alternating(s))throw Error('This game does not deploy one unit at a time.');
 const b=d.batch,placed=(b?.ids??[]).map(id=>getUnit(s,id)).filter(q=>q&&q.x!==null);if(!b||!placed.length)throw Error('Place a unit before confirming.');
 const missing=b.ids.map(id=>getUnit(s,id)).filter(q=>q&&q.x===null);if(missing.length)throw Error(`${b.kind==='machines'?'War machines':'Characters'} deploy together: place ${missing.map(q=>q.name).join(' and ')} too, then confirm.`);
 for(const q of placed){q.deployed=true;d.log.push({team:q.team,id:q.id});}d.batch=null;d.pending=null;
 advanceDeployment(s,placed[0].team);
 return {id:placed[0].id,ids:placed.map(q=>q.id),kind:b.kind,next:d.next,complete:d.complete};
}
// Who deploys next after `team`: the other army while it has a unit to place, else this one. Then
// the Scouts: with Scouts in both armies a roll-off decides who places one first, and they alternate.
function advanceDeployment(s,team){
 const d=s.deployOrder,other=team==='ash'?'iron':'ash',scoutsLeft=t=>deploymentPieces(s,t).some(q=>!q.deployed&&!inReserve(q)&&isScout(q));
 if(normalLeft(s,other)||normalLeft(s,team)){d.next=normalLeft(s,other)?other:team;d.complete=false;return;}
 const scouting=['ash','iron'].filter(scoutsLeft);if(!scouting.length){d.next=null;d.complete=true;return;}
 d.scouts??={both:scouting.length>1,rollOff:null,started:false};d.complete=false;
 if(d.scouts.both&&!d.scouts.rollOff){d.next=null;return;}
 if(!d.scouts.started){d.scouts.started=true;d.next=d.scouts.rollOff?.winner??scouting[0];return;}
 d.next=scoutsLeft(other)?other:scoutsLeft(team)?team:null;d.complete=!d.next;
}
export function scoutRollOff(s,random=Math.random){const d=s.deployOrder;if(!alternating(s)||!d.scouts?.both||d.scouts.rollOff)throw Error('No Scouts roll-off is needed.');d.scouts.rollOff=rollOff(random);advanceDeployment(s,'ash');return d.scouts.rollOff;}
// Ambushers may be held in reserve (or brought back) any time before the unit is deployed.
export function holdInReserve(s,id,hold=true){
 const u=getUnit(s,id),d=s.deployOrder;if(s.stage!=='deployment')throw Error('A unit is held in reserve during deployment.');if(!unitHasRule(u,'ambushers'))throw Error(`${u?.name??'This unit'} does not have Ambushers.`);if(u.deployed)throw Error(`${u.name} is already deployed.`);
 if(hold){if(u.x!==null){if(d?.batch?.ids.includes(u.id)){d.batch=null;d.pending=null;}Object.assign(u,{x:null,y:null});}u.reserve={held:true,arriving:null};}else u.reserve=null;
 if(alternating(s)&&d.first&&!d.auto&&(!d.next||!deploymentPieces(s,d.next).some(q=>!q.deployed&&!inReserve(q))))advanceDeployment(s,d.next??u.team);
 return u;}
// With a team: place and confirm that side's next unit. Without: deploy both armies at once
// (a quick start for testing and two-player setups).
function alternateAutoDeploy(s,team,random=null){
 const d=s.deployOrder;
 if(!team){d.auto=true;try{searchDeploy(s,null,random);}finally{d.auto=false;}for(const p of [...deploymentPieces(s,'ash'),...deploymentPieces(s,'iron')])p.deployed=true;d.first??='ash';Object.assign(d,{next:null,pending:null,complete:true});return null;}
 if(!d.first)throw Error('Roll off first: the winner deploys the first unit.');
 if(d.next!==team)throw Error(d.complete?'Both armies are deployed.':`${armyName(d.next,s)} deploys the next unit.`);
 // The batch already started, or the next one in order; every piece of it goes down, then it is confirmed.
 const order=deployOrderOf(s,team),pending=d.pending?getUnit(s,d.pending):null,p=pending??order.find(q=>!q.deployed&&isScout(q)===scoutPhase(s)),plan=deployPlan(s,team,random);
 for(const id of (d.batch??deploymentBatch(s,p)).ids){const q=getUnit(s,id);if(q.x===null)autoSpot(s,q,plan[q.id]);}
 return confirmDeployment(s);
}
export function deploymentComplete(s){return combatants(s).every(p=>p.x!==null||inReserve(p))&&(!s.deployOrder?.alternate||s.deployOrder.complete);}
// ---- Vanguard moves: after deployment, before the first-turn roll-off. Each unit with Vanguard may
// make one ordinary move (it may manoeuvre but not march). With Vanguard units in both armies a
// roll-off decides who moves first, then the armies alternate a unit at a time. A unit that makes
// a Vanguard move cannot charge in its first turn.
export function vanguardUnits(s,team=null){return s.units.filter(u=>(!team||u.team===team)&&u.x!==null&&aliveCount(u)>0&&unitHasRule(u,'vanguard')&&!s.vanguard?.done?.includes(u.id));}
export function vanguardState(s){if(s.vanguard||s.stage!=='deployment'||!deploymentComplete(s))return s.vanguard??null;const teams=['ash','iron'].filter(t=>vanguardUnits(s,t).length);return s.vanguard={both:teams.length>1,rollOff:null,next:teams.length===1?teams[0]:null,active:null,done:[],complete:!teams.length};}
export const vanguardPending=s=>s.stage==='deployment'&&deploymentComplete(s)&&!vanguardState(s).complete;
export function vanguardRollOff(s,random=Math.random){const v=vanguardState(s);if(!v?.both||v.rollOff)throw Error('No Vanguard roll-off is needed.');v.rollOff=rollOff(random);v.next=v.rollOff.winner;return v.rollOff;}
export function beginVanguard(s,id){const v=vanguardState(s),u=getUnit(s,id);if(!v||v.complete)throw Error('There is no Vanguard move to make.');if(v.both&&!v.rollOff)throw Error('Both armies have Vanguard units: roll off first.');if(v.active&&v.active!==id)throw Error('Finish the Vanguard move in progress first.');if(!u||!vanguardUnits(s,v.next).includes(u))throw Error(`${armyName(v.next,s)} makes the next Vanguard move.`);v.active=id;s.history=[];return u;}
// The move ends (moved), or the unit declines it; the other army then makes its next one.
export function endVanguard(s,id,moved=true){const v=vanguardState(s),u=getUnit(s,id);if(!v||v.complete||!u||!vanguardUnits(s,v.next).includes(u)||v.active&&v.active!==id)throw Error('That unit is not making a Vanguard move.');
 v.done.push(id);v.active=null;if(moved&&(u.movedThisTurn||(u.spent??0)>EPS))u.vanguarded=true;s.history=[];const other=u.team==='ash'?'iron':'ash';v.next=vanguardUnits(s,other).length?other:vanguardUnits(s,u.team).length?u.team:null;v.complete=!v.next;return v;}
export function firstTurnRollOff(s,random=Math.random){if(s.stage!=='deployment')throw Error('The battle already started.');if(!deploymentComplete(s))throw Error('Deploy both armies before rolling off for the first turn.');if(vanguardPending(s))throw Error('Make or decline the Vanguard moves first.');if(s.firstTurn)throw Error('The first-turn roll-off has been made.');s.firstTurn={...rollOff(random),chosen:null};return s.firstTurn;}
export function chooseFirstTurn(s,team,first){if(!s.firstTurn)throw Error('Roll off for the first turn first.');if(s.firstTurn.chosen)throw Error('The first player has already been chosen.');if(team!==s.firstTurn.winner)throw Error('Only the roll-off winner chooses who goes first.');if(!['ash','iron'].includes(first))throw Error('Choose Red or the opponent.');s.firstTurn.chosen=first;s.firstPlayer=first;return first;}
export function begin(s,random=Math.random,{firstPlayer=null}={}){if(s.stage!=='deployment')throw Error('The battle already started.');if(vanguardPending(s))throw Error('Make or decline the Vanguard moves first.');if(s.units.some(u=>u.x===null&&!inReserve(u))||s.rocket.x===null&&!s.rocket.absent||s.cannons.some(c=>c.x===null))throw Error('Deploy all units, the Deathshrieker, and Empire cannons before battle.');if(s.deployOrder?.alternate&&!s.deployOrder.complete)throw Error('Confirm the last unit’s placement to finish deployment.');const first=firstPlayer??s.firstTurn?.chosen??(s.deployOrder?.alternate?null:s.firstPlayer??'ash');if(!first)throw Error('Roll off for the first turn; the winner chooses who goes first.');for(const u of s.units.filter(u=>u.role==='wizard')){const r=rollSpells(random,{lore:u.lore??'battle',level:u.level??2});u.spells=r.spells;u.spellRolls=r.rolls;}
 // A Vanguard move is made before the battle: it leaves no movement used in the first turn.
 for(const u of s.units)Object.assign(u,{moved:false,spent:0,movementMode:null,movementMedium:null,movementFly:null,marchRequired:null,marchTest:null,movedThisTurn:false,difficultThisMove:false});s.history=[];if(s.vanguard)s.vanguard.active=null;s.firstPlayer=first;s.stage='strategy';s.team=s.firstPlayer;s.selected=s.units.find(u=>u.team===s.team)?.id;}
export function canAct(s,u){if(u?.joined)return false;if(s.stage==='deployment')return !!u&&s.vanguard?.active===u.id&&!u.moved&&aliveCount(u)>0&&u.x!==null;return s.stage==='movement'&&u?.team===s.team&&aliveCount(u)>0&&!u.moved&&!u.engaged&&!u.charge&&!u.fleeing&&u.x!==null;}
// Why a unit cannot act right now, in plain words, or null when it can.
export function inactionReason(s,u){
 if(!u||s.stage==='deployment')return null;
 if(s.stage==='finished')return 'The battle is over.';
 if(u.destroyed||aliveCount(u)===0)return 'Destroyed.';
 if(u.x===null)return u.offBoardPursuit?'Off the battlefield after pursuing; it returns in its next Movement phase.':inReserve(u)?(u.reserve.arriving?'Arriving: place it against a battlefield edge in Compulsory Moves.':'Held in reserve (Ambushers): from round 2 it arrives on a 4+.'):'Not on the battlefield.';
 if(u.team!==s.team)return 'Waiting: it is the other army’s turn.';
 const spellNow=u.role==='wizard'&&u.spells.some(key=>SPELLS[key]?.phase===s.stage&&spellTargets(s,u.id,key).some(t=>canCast(s,u.id,key,t.id)));
 if(u.joined&&s.stage!=='combat'&&!spellNow)return `Joined to ${getUnit(s,u.joined)?.name??'a unit'}: it moves, rallies and fights with that unit.`;
 if(s.stage==='strategy'){if(u.fleeing&&!u.rallyAttempted||spellNow||u.role==='wizard'&&canDispelAVortex(s,u))return null;if(u.fleeing)return 'Failed to rally this turn and is still fleeing.';return u.role==='wizard'?'No hex or enchantment can be cast now.':'Nothing to do in Strategy: only fleeing units rally and wizards cast here.';}
 if(s.stage==='movement'){
  if(u.engaged)return 'Engaged in combat: units in combat cannot move.';
  if(u.fleeing)return 'Fleeing: it must rally in its Strategy phase before it can move.';
  if(s.movementStep==='declare'){
   if(u.charge)return 'Charge declared; waiting for charges to be rolled.';
   if(canAct(s,u)&&availableCharges(s,u).length)return null;
   if(u.rallied)return 'Rallied this turn, so it cannot charge.';
   const enemies=combatants(s).filter(v=>v.team!==u.team&&v.x!==null&&aliveCount(v)>0),reasons=enemies.map(t=>chargePlan(s,u,t).error).filter(Boolean);
   return 'Cannot charge: '+(reasons.find(r=>!/Beyond/.test(r))&&enemies.some(t=>gap(u,t)<=chargeReach(u))?reasons.find(r=>!/Beyond/.test(r)):`no enemy within its ${chargeReach(u)}″ maximum charge range.`);
  }
  if(s.movementStep==='reactions')return 'Waiting for the charged units to choose their reactions.';
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
  if(u.raiding)return 'Destroying a treasure trove (Raid & Burn): it cannot shoot.';
  const plans=shootingTargets(s,u).map(t=>t.plan);if(plans.some(p=>!p.error))return null;
  return 'No target: '+(plans.map(p=>p.error).find(e=>!/Choose an enemy/.test(e))??'no enemy is in range, arc and line of sight.');
 }
 if(u.engaged&&!u.combatResolved)return null;
 return u.engaged?'Already fought this Combat phase.':'Not engaged in combat.';
}
// A piece is done (greyed out) when it has nothing left to do in this phase or step: the same test
// that offers units to the player. A wizard with a spell to cast and a war machine with a target
// to shoot are still to act; a missile unit with no target is done.
export function phaseComplete(s,u){
 if(s.stage==='deployment'||u.team!==s.team)return false;if(aliveCount(u)===0)return true;
 if(u.role==='warmachine')return s.stage==='combat'?!(u.engaged&&!u.combatResolved):!(s.stage==='shooting'&&machineReady(s,u));
 if(s.stage==='movement'&&s.movementStep!=='remaining')return u.moved||!!u.engaged;
 if(canExchangeSignature(s,u))return false;
 return inactionReason(s,u)!==null;
}
// A war machine that can still fire this phase at a legal target.
export function machineReady(s,m){
 if(m?.role!=='warmachine'||m.team!==s.team)return false;
 if(m.id===s.rocket?.id)return canFireRocket(s)&&[false,true].some(indirect=>rocketTargets(s,{indirect}).some(t=>!t.error));
 return canFireCannon(s,m.id)&&(cannonTargets(s,m.id,{mode:'grape'}).some(t=>!t.error)||Array.from({length:11},(_,aimShort)=>cannonTargets(s,m.id,{mode:'ball',aimShort}).some(t=>!t.error)).some(Boolean));
}
export function needsMarchTest(s,u){if(u.marchRequired!==null&&u.marchRequired!==undefined)return u.marchRequired;return s.units.some(v=>v.team!==u.team&&v.x!==null&&gap(u,v)<=8+EPS);}
export function marchTest(s,id,dice,random=Math.random){const u=getUnit(s,id);if(!canAct(s,u))throw Error('Select an unmoved regiment from the active army.');if(!needsMarchTest(s,u))throw Error('No nearby enemy. This march needs no test.');if(u.marchTest!==null)throw Error('This regiment already took its march test this turn.');if(!Array.isArray(dice)||dice.length!==2||dice.some(d=>!Number.isInteger(d)||d<1||d>6))throw Error('A march test requires two D6.');enterRemaining(s,random);u.marchTest=dice.reduce((a,b)=>a+b,0)<=leadership(u,'march',s);return u.marchTest;}
export function wheelCost(angle,u){return 2*size(u).w*Math.sin(rad(Math.abs(angle))/2);}
export function maxWheel(mode='advance',u,medium='ground'){return 2*Math.asin(Math.min(1,moveAllowance(u,{mode,medium})/(2*size(u).w)))*180/Math.PI;}
export function wheelPose(u,angle){const {w,h}=size(u),pivot=localPoint(u,(angle<0?-1:1)*w/2,-h/2),a=rad(angle),x=u.x-pivot.x,y=u.y-pivot.y;return {...u,x:pivot.x+x*Math.cos(a)-y*Math.sin(a),y:pivot.y+x*Math.sin(a)+y*Math.cos(a),heading:normalize(heading(u)+angle)};}
export function forwardPose(u,distance){const a=rad(heading(u));return {...u,x:u.x+Math.sin(a)*distance,y:u.y-Math.cos(a)*distance};}
export function planMove(u,order){const kind=order.kind??'advance',mode=order.mode??'advance',angle=Number(order.angle??0),distance=Number(order.distance??0),side=order.side??1;let after=u,cost=0,pivot=null;
  if(kind==='wheel'){after=wheelPose(u,angle);cost=wheelCost(angle,u);pivot=localPoint(u,(angle<0?-1:1)*size(u).w/2,-size(u).h/2);}
  if(kind==='pivot'){after={...u,heading:normalize(heading(u)+angle)};cost=profile(u).M;pivot={x:u.x,y:u.y};}
  const end=kind==='pivot'?after:kind==='back'?forwardPose(after,-distance):kind==='side'?{...after,...localPoint(after,side*distance,0)}:forwardPose(after,distance);
  return {start:{...u},afterWheel:after,end,cost:cost+(kind==='pivot'?0:['back','side'].includes(kind)?2*distance:distance),wheelCost:kind==='wheel'?cost:0,allowance:mode==='march'?2*profile(u).M:profile(u).M,pivot,kind,mode,angle,distance,side};
}
// ---- Vortices in a unit's way ----
// The poses a move passes through: a wheel or a reform in steps, then the straight part.
function movePoses(plan){const {start,kind,angle}=plan,steps=[1,2,3,4,5,6];return [start,...(kind==='wheel'?steps.map(k=>wheelPose(start,angle*k/6)):kind==='pivot'?steps.map(k=>({...start,heading:normalize(heading(start)+angle*k/6)})):[]),plan.afterWheel??start,plan.end];}
// The vortices a unit passes through or ends in, moving through these poses. A Pillar of Fire
// troubles only its caster's enemies; a Vortex of Chaos, every unit.
// all: every vortex in the way, for its difficult terrain (each template is difficult terrain for
// every unit, whomever its hits strike).
function sweptVortices(s,u,poses,{all=false}={}){const out=new Set();for(let i=0;i+1<poses.length;i++){const poly=hull([...corners(poses[i]),...corners(poses[i+1])]);for(const v of s.vortices??[])if(!out.has(v)&&getUnit(s,v.caster)?.x!=null&&(all||vortexVictim(s,v,u))&&circleGap(poly,{x:v.x,y:v.y,r:v.radius??1.5})<EPS)out.add(v);}return [...out];}
// The hits for each vortex crossed, once per vortex in each movement (all of a unit's Remaining
// Moves are one movement; Arcane Urgency starts another).
function vortexMoveHits(s,u,vortices,random=Math.random,poses=null){const out=[],event=`${s.round}:${s.team}:${s.stage}:${u.moveEvent??0}`;for(const v of vortices){if(u.x===null||aliveCount(u)===0)break;const ref=v.id??v.caster;u.vortexHits??={};if(u.vortexHits[ref]===event)continue;u.vortexHits[ref]=event;const rule=VORTEX_RULES[v.spell??'pillar']??VORTEX_RULES.pillar;out.push({vortex:ref,spell:v.spell??'pillar',caster:v.caster,unit:u.id,...(rule.dangerous?dangerousTests(s,u,{x:v.x,y:v.y,r:v.radius??1.5},poses,random):magicDamage(s,u,rule.hits(random),rule.strength,rule.ap,random,{flaming:rule.flaming}))});}return out;}
function forwardError(s,u,start,end){const swept=hull([...corners(start),...corners(end)]),close=closeAtStart(s,u),inner=shrink(swept),blocks=(v,poly)=>close(v)?polygonGap(inner,poly)<EPS:polygonGap(swept,poly)<1-EPS;if(terrainBlocks(s,swept))return 'Impassable terrain blocks this path. Shorten the move or go around it.';for(const v of s.units){if(v.id===u.id||v.x===null||v.joined)continue;if(blocks(v,corners(v)))return 'Another regiment blocks this path. Shorten the move.';}if(s.rocket?.x!==null&&s.rocket.id!==u.id&&blocks(s.rocket,corners(s.rocket)))return 'The Deathshrieker blocks this path. Shorten the move.';if(s.cannons.some(c=>c.x!==null&&c.id!==u.id&&blocks(c,corners(c))))return 'A cannon blocks this path. Shorten the move.';return null;}
export function orderError(s,u,order){
  if(!canAct(s,u))return 'Select an unmoved regiment from the active army.';
  const {kind='advance',mode='advance',angle=0,distance=0}=order;
  if(s.stage==='deployment'&&mode==='march')return 'A Vanguard move cannot march.';
  if(s.stage==='movement'&&arrivals(s,u.team).length)return 'Place the arriving reinforcements first: they enter in Compulsory Moves.';
  if(mode==='march'&&u.reinforced===`${s.round}:${s.team}`)return 'Arrived as reinforcements this turn: it cannot march.';
  if(!['advance','back','side','wheel','pivot'].includes(kind)||!['advance','march'].includes(mode))return 'Choose a valid movement order.';
  if(!Number.isFinite(angle)||!Number.isFinite(distance)||distance<0)return 'Enter a valid angle and distance.';
  if(kind==='advance'&&(distance<=0||angle!==0))return 'Choose a forward distance.';
  if((kind==='back'||kind==='side')&&(distance<=0||angle!==0))return 'Choose a sideways or backward distance.';
  if(kind==='side'&&![-1,1].includes(order.side))return 'Choose left or right for a sideways move.';
  if(kind==='wheel'&&(angle===0||Math.abs(angle)>90))return 'Choose a wheel angle between −90° and 90°.';
  if(kind==='pivot'&&(angle===0||Math.abs(angle)>180||distance!==0||mode==='march'))return 'A reform pivots up to 180°, uses the whole move, and cannot march.';
  // Fly (Steed of Shadows): a unit may fly instead of moving on foot. A flight starts and ends on
  // the ground, passes over units and terrain, and may march within 8″ of an enemy without a
  // test. Flying or on foot is chosen with the first step.
  const medium=order.medium??u.movementMedium??'ground',fly=medium==='fly'?(order.fly??u.movementFly??flyValues(u)[0]??null):null;
  if(!['ground','fly'].includes(medium))return 'Choose to move on foot or to fly.';
  if(medium==='fly'&&!flyValues(u).includes(fly))return 'This unit cannot fly.';
  if(u.movementMedium&&u.movementMedium!==medium)return 'Flying or moving on foot is chosen with the first step. Undo all steps to change it.';
  const plan=planMove(u,order);
  // A vortex is difficult terrain: Movement −1 for the whole move once the unit enters it; a
  // flyer only when it takes off from or lands in one.
  const difficult=!!u.difficultThisMove||(medium==='fly'?vortexUnder(s,u,plan.start)||vortexUnder(s,u,plan.end):sweptVortices(s,u,movePoses(plan),{all:true}).length>0),allowance=moveAllowance(u,{mode,medium,fly,difficult});
  if(u.movementMode&&u.movementMode!==mode)return 'Movement mode is locked after the first step. Undo all steps to change it.';
  if(mode==='march'&&hasRule(u,'noMarch'))return 'Earthen Ramparts: this unit cannot march.';
  if(kind==='pivot'&&(u.spent??0)>EPS)return 'A reform requires the whole unused movement allowance.';
  // A reform takes the whole move, whatever the allowance.
  if(kind!=='pivot'&&(u.spent??0)+plan.cost>allowance+EPS)return 'This order exceeds the movement allowance.';
  if(mode==='march'&&medium!=='fly'&&needsMarchTest(s,u)&&u.marchTest!==true)return u.marchTest===false?`March test failed. This unit can still advance up to ${profile(u).M}″.`:'Take the march Leadership test first.';
  const error=checkPosition(s,plan.end,plan.end.x,plan.end.y,false,{moving:true});if(error)return error;
  if(kind==='pivot')return null;
  if(kind==='wheel'){
    // Sweep the leading edge, not the rear ranks (FAQ 1.5.3). The small additional
    // clearance covers the sagitta between 0.25-degree subdivisions of the curve.
    const steps=Math.ceil(Math.abs(angle)/.25);let previous=corners(u).slice(0,2);
    for(let i=1;i<=steps;i++){
      const pose=wheelPose(u,angle*i/steps);if(offBoard(pose,s))return 'The wheel would leave the battlefield.';
      // A flyer wheels over units and terrain: only the table edge limits it.
      if(medium==='fly')continue;
      const front=corners(pose).slice(0,2),sweep=hull([...previous,...front]);
      const close=closeAtStart(s,u),blocks=v=>close(v)?polygonGap(shrink(sweep),corners(v))<EPS:polygonGap(sweep,corners(v))<1.0001-EPS;
      for(const v of s.units){if(v.id===u.id||v.x===null||v.joined)continue;if(blocks(v))return 'Another regiment blocks the leading edge of this wheel.';}
      if(combatants(s).some(m=>m.role==='warmachine'&&m.x!==null&&m.id!==u.id&&blocks(m)))return 'A war machine blocks the leading edge of this wheel.';
      if(terrainBlocks(s,sweep))return 'Impassable terrain blocks this wheel.';
      previous=front;
    }
  }
  if(distance>EPS&&medium!=='fly')return forwardError(s,u,plan.afterWheel,plan.end);
  return null;
}
const vortexUnder=(s,u,pose)=>sweptVortices(s,u,[pose,pose],{all:true}).length>0;
// ---- Characters joining units ----
// A character may join a friendly regiment: in deployment by being placed with it, or in Remaining
// Moves by moving into base contact with it (neither engaged nor fleeing); a regiment joined in
// Remaining Moves cannot move afterwards. The character takes a place in the front rank beside the
// command group (outermost first), the rank and file model there stepping to the rear; with no
// room in the front rank it goes to the rear rank. The block grows at the back, its front edge
// staying where it was. The character then moves, flees and pursues with the regiment; it fights
// and casts as itself.
export function joinedCharacters(s,u){return (u?.charSlots??[]).map(c=>getUnit(s,c.id)).filter(c=>c&&!c.destroyed&&aliveCount(c)>0&&c.joined===u.id);}
export function unitStrengthWith(s,u){return unitStrength(u)+joinedCharacters(s,u).reduce((n,c)=>n+unitStrength(c),0);}
function reshape(u,change){const before=size(u).h;change();const after=size(u).h,a=rad(heading(u));if(u.x!==null&&Math.abs(after-before)>EPS){u.x-=Math.sin(a)*(after-before)/2;u.y+=Math.cos(a)*(after-before)/2;}}
function slotPose(u,slot){const files=filesOf(u),base=baseSize(u)/25.4,{w,h}=size(u),row=Math.floor(slot/files),col=slot%files,p=localPoint(u,-w/2+(col+.5)*base,-h/2+(row+.5)*base);return {x:p.x,y:p.y,heading:heading(u)};}
// Joined characters stand in their places, share their regiment's combat, charge and flight.
export function syncJoined(s,only=null){for(const host of only?[only]:s.units.filter(v=>v.charSlots?.length)){for(const cs of host.charSlots??[]){const c=getUnit(s,cs.id);if(!c||c.joined!==host.id||c.destroyed)continue;
 if(host.x===null){Object.assign(c,{x:null,y:null});continue;}
 Object.assign(c,slotPose(host,cs.slot),{fleeing:!!host.fleeing,charge:host.charge?{...host.charge}:null,movedThisTurn:!!host.movedThisTurn,moved:true});
 const foes=opponentIds(host);for(const id of opponentIds(c).filter(id=>!foes.includes(id))){const e=getUnit(s,id);if(e){const rest=opponentIds(e).filter(x=>x!==c.id);e.engaged=rest.length?rest:null;}}
 c.engaged=foes.length?[...foes]:null;for(const id of foes){const e=getUnit(s,id);if(e&&!opponentIds(e).includes(c.id))e.engaged=[...opponentIds(e),c.id];}}}}
// A character leaves its regiment's block (it is no longer joined); the block closes up at the back.
function detach(s,c){const u=getUnit(s,c?.joined);if(c)c.joined=null;if(!u)return;reshape(u,()=>{u.charSlots=(u.charSlots??[]).filter(x=>x.id!==c.id);if(!u.charSlots.length)delete u.charSlots;});for(const id of opponentIds(c).filter(id=>!opponentIds(u).includes(id))){const e=getUnit(s,id);if(e){const rest=opponentIds(e).filter(x=>x!==c.id);e.engaged=rest.length?rest:null;}}}
export function joinError(s,charId,unitId){
 const c=getUnit(s,charId),u=getUnit(s,unitId);
 if(!isCharacter(c))return 'Only a character can join a unit.';if(c.joined)return `${c.name} has already joined a unit.`;
 if(c.mount)return 'A mounted character joining an infantry regiment is not modelled yet (it would stand on the flank).';
 if(!u||u.team!==c.team||isCharacter(u)||u.role==='warmachine'||u.x===null||aliveCount(u)===0||u.destroyed)return 'Choose a friendly regiment.';
 if(u.engaged||c.engaged)return 'Neither may be engaged in combat.';if(u.fleeing||c.fleeing)return 'Neither may be fleeing.';
 if(s.stage==='deployment')return c.deployed?`${c.name} is already deployed.`:null;
 if(s.stage!=='movement'||s.movementStep!=='remaining'||s.team!==c.team)return 'A character joins a unit in Remaining Moves.';
 if(c.x===null||!canAct(s,c))return `${c.name} has already moved this phase.`;
 if(gap(c,u)>movementRemaining(c)+EPS)return `${u.name} is beyond ${c.name}’s move (${fmtInches(movementRemaining(c))}).`;
 return null;}
const fmtInches=n=>`${Math.round(n*10)/10}″`;
export function joinUnit(s,charId,unitId){
 const error=joinError(s,charId,unitId);if(error)throw Error(error);const c=getUnit(s,charId),u=getUnit(s,unitId);if(s.stage==='deployment')deployGate(s,c);
 const files=filesOf(u),command=new Set(Object.keys(commandSlots(u)).map(Number)),taken=new Set((u.charSlots??[]).map(x=>x.slot));
 const front=Array.from({length:files},(_,i)=>i%2?Math.floor(i/2):files-1-Math.floor(i/2)).find(col=>col<startingModels(u)&&!command.has(col)&&!taken.has(col));
 const slot=front??startingModels(u)+(u.charSlots?.length??0),before={x:u.x,y:u.y,charSlots:u.charSlots};
 c.joined=u.id;reshape(u,()=>{u.charSlots=[...(u.charSlots??[]),{id:c.id,slot}];});
 const bad=checkPosition(s,u,u.x,u.y,s.stage==='deployment',{moving:true});
 if(bad){c.joined=null;Object.assign(u,before);if(!before.charSlots)delete u.charSlots;throw Error(`With ${c.name} in its ranks ${u.name} would not fit: ${bad}`);}
 if(s.stage==='movement'){remember(s,c);c.moved=true;c.movedThisTurn=true;u.moved=true;s.history=s.history.filter(h=>h.id!==c.id&&h.id!==u.id);}
 syncJoined(s,u);if(s.stage==='deployment')deployPlaced(s,c);return {character:c.id,unit:u.id,slot};}
// Leaving: in Remaining Moves, before the regiment moves (it must still be able to), the character
// steps out to a place within its Movement of where it stood, and is a lone character again.
export function leaveError(s,charId,pose){
 const c=getUnit(s,charId),u=getUnit(s,c?.joined);if(!c||!u)return 'This character has not joined a unit.';
 if(s.stage!=='movement'||s.movementStep!=='remaining'||s.team!==c.team)return 'A character leaves its unit in Remaining Moves.';
 if(!canAct(s,u))return `${u.name} cannot move this phase, so ${c.name} cannot leave it.`;
 if(!pose||!Number.isFinite(pose.x)||!Number.isFinite(pose.y))return 'Choose where it steps out to.';
 const from=slotPose(u,(u.charSlots??[]).find(x=>x.id===c.id)?.slot??0);if(Math.hypot(pose.x-from.x,pose.y-from.y)>profile(c).M+EPS)return `${c.name} moves at most ${profile(c).M}″.`;
 const test={...c,joined:null,x:pose.x,y:pose.y,heading:normalize(Number.isFinite(pose.heading)?pose.heading:heading(u))};return checkPosition(s,test,test.x,test.y);}
export function leaveUnit(s,charId,pose){const error=leaveError(s,charId,pose);if(error)throw Error(error);const c=getUnit(s,charId),u=getUnit(s,c.joined),from={x:c.x,y:c.y};detach(s,c);Object.assign(c,{x:pose.x,y:pose.y,heading:normalize(Number.isFinite(pose.heading)?pose.heading:heading(u)),moved:true,movedThisTurn:true,spent:Math.hypot(pose.x-from.x,pose.y-from.y),charge:null});s.history=s.history.filter(h=>h.id!==c.id&&h.id!==u.id);return c;}
// The nearest legal place to step out to: in front of the regiment, beside it, or behind it.
export function leaveSpot(s,charId){const c=getUnit(s,charId),u=getUnit(s,c?.joined);if(!c||!u)return null;const a=rad(heading(u)),f={x:Math.sin(a),y:-Math.cos(a)},r={x:Math.cos(a),y:Math.sin(a)},{w,h}=size(u),b=size(c).w,out=[];
 for(const d of [1.05,1.5,2]){out.push({x:u.x+f.x*(h/2+d+b/2),y:u.y+f.y*(h/2+d+b/2)});for(const side of [-1,1])out.push({x:u.x+r.x*side*(w/2+d+b/2),y:u.y+r.y*side*(w/2+d+b/2)});out.push({x:u.x-f.x*(h/2+d+b/2),y:u.y-f.y*(h/2+d+b/2)});}
 const ok=out.map(p=>({...p,heading:heading(u)})).sort((p,q)=>Math.hypot(p.x-c.x,p.y-c.y)-Math.hypot(q.x-c.x,q.y-c.y)).find(p=>!leaveError(s,charId,p));return ok??null;}
function remember(s,u){s.history.push({id:u.id,x:u.x,y:u.y,heading:heading(u),moved:u.moved,spent:u.spent??0,movementMode:u.movementMode??null,movementMedium:u.movementMedium??null,movementFly:u.movementFly??null,difficultThisMove:!!u.difficultThisMove,movedThisTurn:!!u.movedThisTurn,marchRequired:u.marchRequired??null});}
// A flyer that crosses a vortex is struck by it as well; its Movement suffers only for landing in it.
export function commitOrder(s,id,order,random=Math.random){const u=getUnit(s,id);const error=orderError(s,u,order);if(error)throw Error(error);const medium=order.medium??u.movementMedium??'ground',fly=medium==='fly'?(order.fly??u.movementFly??flyValues(u)[0]):null,plan=planMove(u,order),vortices=sweptVortices(s,u,movePoses(plan)),entered=medium==='fly'?vortexUnder(s,u,plan.start)||vortexUnder(s,u,plan.end):sweptVortices(s,u,movePoses(plan),{all:true}).length>0,difficult=!!u.difficultThisMove||entered;if(s.stage==='movement')enterRemaining(s,random);remember(s,u);
 // A flyer suffers dangerous terrain only where it takes off or lands.
 const lands=v=>[plan.start,plan.end].some(p=>circleGap(corners(p),{x:v.x,y:v.y,r:v.radius??1.5})<EPS),struck=medium==='fly'?vortices.filter(v=>!VORTEX_RULES[v.spell]?.dangerous||lands(v)):vortices;const marchRequired=medium==='fly'?false:needsMarchTest(s,u),spent=(u.spent??0)+plan.cost,allowance=moveAllowance(u,{mode:plan.mode,medium,fly,difficult});Object.assign(u,{x:plan.end.x,y:plan.end.y,heading:plan.end.heading,spent,movementMode:plan.mode,movementMedium:medium,movementFly:fly,marchRequired,moved:plan.kind==='pivot'||spent>=allowance-EPS,movedThisTurn:true});if(entered)u.difficultThisMove=true;s.lastVortexHits=vortexMoveHits(s,u,struck,random,medium==='fly'?[plan.end]:movePoses(plan));
 // A unit that has finished moving may have to test against a Phantasmagoria.
 s.lastPhantasm=u.moved?endOfMove(s,u,random):null;
 // Dice were rolled for crossing a vortex: this unit's moves can no longer be taken back.
 if(s.lastVortexHits.length||s.lastPhantasm?.length)s.history=s.history.filter(h=>h.id!==u.id);syncJoined(s,u);return plan;}
export function movementError(s,u,distance,mode){return orderError(s,u,{kind:'advance',distance,mode,angle:0});}
export function move(s,id,distance,mode){return commitOrder(s,id,{kind:'advance',distance,mode,angle:0});}
export function hold(s,id,random=Math.random){const u=getUnit(s,id);if(!canAct(s,u)||s.stage!=='movement')throw Error('This regiment cannot take orders now.');if(arrivals(s,u.team).length)throw Error('Place the arriving reinforcements first: they enter in Compulsory Moves.');enterRemaining(s,random);remember(s,u);u.moved=true;s.lastPhantasm=u.movedThisTurn?endOfMove(s,u,random):null;if(s.lastPhantasm?.length)s.history=s.history.filter(h=>h.id!==u.id);}
export function undo(s){if(s.stage!=='movement'&&!s.vanguard?.active)throw Error('Undo is available during Movement only.');const last=s.history.pop();if(!last)throw Error('No move to undo this turn.');const u=getUnit(s,last.id);Object.assign(u,{x:last.x,y:last.y,heading:last.heading,moved:last.moved,spent:last.spent,movementMode:last.movementMode,movementMedium:last.movementMedium??null,movementFly:last.movementFly??null,difficultThisMove:!!last.difficultThisMove,movedThisTurn:!!last.movedThisTurn,marchRequired:last.marchRequired});s.selected=u.id;syncJoined(s,u);}
// Format rules modules (such as Battle March objectives and scoring) register what happens at
// the end of each player's turn and at the end of the game.
const FORMAT_RULES={};
export function registerFormatRules(id,rules){FORMAT_RULES[id]=rules;}
function formatRules(s){const id=s.format?.id??'classic';if(id==='classic')return null;const rules=FORMAT_RULES[id];if(!rules)throw Error(`The rules module for "${id}" is not loaded.`);return rules;}
// Runs once per player turn, even when empty phases were skipped; the last turn ends the game.
export function endOfPlayerTurn(s,team=s.team){
 const key=`${s.round}:${team}`;s.turnLog??=[];if(s.turnLog.includes(key))return false;s.turnLog.push(key);
 // Effects that last until the end of this turn end first, then the format's end of turn (scoring).
 expireEffects(s,'end',key);
 formatRules(s)?.endOfTurn?.(s,team);
 if(s.format?.rounds&&s.round>=s.format.rounds&&team!==s.firstPlayer)finishGame(s,'The final round is complete.');
 return true;
}
export function finishGame(s,reason){if(s.stage==='finished')return s.result;s.stage='finished';s.pendingCombat=null;s.combatSession=null;s.result={reason,...(formatRules(s)?.endOfGame?.(s)??{})};return s.result;}
export function nextTurn(s,random=Math.random){if(s.stage!=='combat')throw Error('Finish the Combat phase first.');endOfPlayerTurn(s,s.team);if(s.stage==='finished')return;s.stage='strategy';s.team=s.team==='ash'?'iron':'ash';if(s.team===(s.firstPlayer??'ash'))s.round++;s.units.forEach(u=>{u.moved=false;u.shot=false;u.pursued=false;u.spent=0;u.movementMode=null;u.marchRequired=null;u.marchTest=null;if(u.pursuitPending&&u.engaged)u.pursuitPending=false;else u.charge=null;u.reaction=null;u.combatFocus=null;u.impetuousTest=null;u.combatResolved=false;u.rallyAttempted=false;u.difficultThisMove=false;u.movedThisTurn=false;u.movementMedium=null;u.movementFly=null;if(u.role==='wizard'){u.castThisTurn=[];u.magicExhausted=false;u.dispelExhausted=false;u.engineerUsed=false;}});s.fatedDispelUsed={ash:false,iron:false};s.magicLocked={};s.dispelBlocked={};
 // Start of Turn, in this order: (1) effects lasting until the casting side's next Start of Turn
 // end; (2) vortices move; (3) the format's start of turn (Raid & Burn).
 expireEffects(s,'start',`${s.round}:${s.team}`);s.vortexReports=driftVortices(s,random);s.reserveReports=reserveRolls(s,s.team,random);s.rocket.shot=false;s.rocket.lastShot=null;s.cannons.forEach(c=>{c.shot=false;c.lastShot=null;});s.history=[];s.selected=s.units.find(u=>u.team===s.team).id;formatRules(s)?.startOfTurn?.(s,s.team,random);}
export function nextPhase(s,random=Math.random){if(s.stage==='finished')throw Error('The battle is over.');if(s.pendingSpell)throw Error('Resolve the dispel of the spell just cast first.');if(s.stage==='strategy'&&s.units.some(u=>u.team===s.team&&u.x!==null&&u.fleeing&&!u.rallyAttempted))throw Error('Attempt to rally every fleeing regiment first.');if(s.units.some(u=>u.charge?.status==='declared'))throw Error('Resolve all declared charges first.');if(s.stage==='combat'&&(s.combatSession||s.pendingCombat||combatPairs(s).length))throw Error('Resolve every combat and its outcome first.');const i=PHASES.indexOf(s.stage);if(i<0)throw Error('Begin the battle first.');if(s.stage==='movement')for(const u of arrivals(s)){if(firstReinforcementSpot(s,u.id))throw Error(`Place ${u.name} first: it arrives as reinforcements this turn.`);u.reserve.arriving=null;}if(s.stage==='movement')for(const u of s.units.filter(u=>u.team===s.team&&u.movedThisTurn))endOfMove(s,u,random);s.reformOffers=null;s.movementReopened=false;s.movementHistory=i===1?s.history:i===2?s.movementHistory:null;if(i===3)nextTurn(s,random);else{s.stage=PHASES[i+1];s.history=[];if(s.stage==='movement'){s.movementStep='declare';if(!s.units.some(u=>u.team===s.team&&canAct(s,u)&&availableCharges(s,u).length))beginRemaining(s,random);}s.shootingSkipped=false;if(s.stage==='shooting'&&!phaseHasActions(s)){s.stage='combat';s.shootingSkipped=true;}if(s.stage==='combat')combatants(s).forEach(u=>u.combatResolved=false);}return s.stage;}
// Movement can be reopened until the active army acts in Shooting (or, when Shooting
// was skipped, in Combat). Its undo history is kept so the last moves can be taken back.
function castIn(s,phase){return s.units.some(u=>u.team===s.team&&u.role==='wizard'&&u.castThisTurn.some(key=>SPELLS[key]?.phase===phase));}
export function canReturnToMovement(s){
 const shootingUntouched=!s.units.some(u=>u.team===s.team&&u.shot)&&!(s.team==='ash'&&s.rocket.shot)&&!(s.team==='iron'&&s.cannons.some(c=>c.shot))&&!castIn(s,'shooting');
 if(s.stage==='shooting')return shootingUntouched;
 return s.stage==='combat'&&!!s.shootingSkipped&&shootingUntouched&&!s.combatSession&&!s.pendingCombat&&!s.units.some(u=>u.combatResolved)&&!castIn(s,'combat');
}
export function returnToMovement(s){if(!canReturnToMovement(s))throw Error('Movement can only be reopened before anything happens in Shooting or Combat.');Object.assign(s,{stage:'movement',movementStep:'remaining',history:s.movementHistory??[],movementHistory:null,movementReopened:true,shootingSkipped:false});return s.stage;}
// An enemy Remains in Play vortex this wizard can still try to dispel in its own Strategy phase:
// by its own Wizardly dispel when in range, or by the side's unused Fated Dispel.
function canDispelAVortex(s,u){return (s.vortices??[]).some(v=>canDispelVortex(s,v.id??v.caster)&&(vortexDispellers(s,v.id??v.caster).some(w=>w.id===u.id)||fatedDispelAvailable(s,s.team)));}
export function phaseHasActions(s){
 if(s.stage==='deployment'||s.stage==='finished'||s.pendingSpell)return true;
 // A reform still to choose keeps the phase open.
 if((s.reformOffers??[]).some(o=>reformOffer(s,o.unit)))return true;
 const active=s.units.filter(u=>u.team===s.team&&u.x!==null&&aliveCount(u)>0);
 const spells=phase=>active.some(u=>u.role==='wizard'&&u.spells.some(key=>SPELLS[key]?.phase===phase&&spellTargets(s,u.id,key).some(t=>canCast(s,u.id,key,t.id))));
 if(s.stage==='strategy')return active.some(u=>u.fleeing&&!u.rallyAttempted)||spells('strategy')||active.some(u=>canExchangeSignature(s,u)||u.role==='wizard'&&canDispelAVortex(s,u));
 if(s.stage==='movement'&&s.movementStep==='reactions')return s.units.some(u=>u.charge?.reaction==='pending');
 if(s.stage==='movement')return s.movementStep==='declare'?active.some(u=>u.charge?.status==='declared'||canAct(s,u)&&availableCharges(s,u).length):s.movementStep==='charges'?active.some(u=>u.charge?.status==='declared'):active.some(u=>canAct(s,u))||spells('movement')||!!s.movementReopened;
 if(s.stage==='shooting')return availableShots(s).length>0||[s.rocket,...s.cannons].some(m=>m&&machineReady(s,m))||spells('shooting');
 return !!s.pendingCombat||!!s.combatSession||combatPairs(s).length>0;
}
export function skipEmptySteps(s,random=Math.random){
 const skipped=[];
 for(let guard=0;guard<8&&s.stage!=='deployment'&&!phaseHasActions(s);guard++){
  const before=s.stage==='movement'?`Movement · ${s.movementStep}`:s.stage;
  if(s.stage==='movement'&&s.movementStep==='declare')finishDeclarations(s,random);
  else if(s.stage==='movement'&&s.movementStep==='reactions')finishReactions(s,random);
  else if(s.stage==='movement'&&s.movementStep==='charges')enterRemaining(s,random);
  else nextPhase(s,random);
  skipped.push(before);
 }
 return skipped;
}
export function rally(s,id,random=Math.random){const u=getUnit(s,id);if(s.stage!=='strategy'||u?.team!==s.team||u.x===null||!u.fleeing||u.rallyAttempted)throw Error('Select a fleeing regiment in its own Strategy phase.');const dice=rollD6(2,random),success=dice[0]+dice[1]<=leadership(u,'rally',s);u.rallyAttempted=true;u.rallied=success;if(success)u.fleeing=false;return {id,dice,success};}
export function rollD6(count,random=Math.random){if(!Number.isInteger(count)||count<1||count>20)throw Error('Choose 1 to 20 dice.');return Array.from({length:count},()=>1+Math.floor(random()*6));}

// ---- Magic ----------------------------------------------------------------------------------
// Each spell is data: its type, the phase (and sub-phase) it is cast in, casting value and range.
// range 0 is Self (reach 'self': cast on the wizard) or Combat (reach 'combat': an enemy it fights).
// los: needs line of sight. targetsEngaged: may target a unit in combat. friendly: targets a
// friendly unit. characters: targets only characters. template: the radius of a template placed
// instead of choosing a target. remainsInPlay: stays until dispelled, ended or its caster is gone.
export const BATTLE_MAGIC={
 hammerhand:{name:'Hammerhand',type:'assailment',phase:'combat',cast:7,range:0,reach:'combat'},
 fireball:{name:'Fireball',type:'magic missile',phase:'shooting',cast:8,range:24,los:true},
 arrow:{name:'Curse of Arrow Attraction',type:'hex',phase:'strategy',cast:7,range:21},
 pillar:{name:'Pillar of Fire',type:'magical vortex',phase:'shooting',cast:9,range:12,template:1.5,remainsInPlay:true},
 urgency:{name:'Arcane Urgency',type:'conveyance',phase:'movement',step:'remaining',cast:9,range:15,friendly:true},
 shield:{name:'Oaken Shield',type:'enchantment',phase:'strategy',cast:7,range:0,reach:'self'},
 coward:{name:'Curse of Cowardly Flight',type:'hex',phase:'strategy',cast:8,range:15},
 hashutCurse:{name:'Curse of Hashut',type:'magic missile',phase:'shooting',cast:9,range:18,los:true,targetsEngaged:true,characters:true},
 ashStorm:{name:'Storm of Ash',type:'hex',phase:'strategy',cast:10,range:0,reach:'self'},
 hashutFlames:{name:'Flames of Hashut',type:'assailment',phase:'combat',cast:9,range:0,reach:'combat'},
};
// The Lore of Daemonology (a Daemonsmith's lore in Renegades 2.0). Spell numbers are generation
// results, not Wizard levels; The Summoning is its signature spell and summons no models.
export const DAEMONOLOGY={
 summoning:{name:'The Summoning',type:'magic missile',phase:'shooting',cast:9,range:18,los:true},
 steed:{name:'Steed of Shadows',type:'conveyance',phase:'movement',step:'remaining',cast:8,range:15,friendly:true},
 darkness:{name:'Gathering Darkness',type:'hex',phase:'strategy',cast:9,range:12,targetsEngaged:true},
 familiars:{name:'Daemonic Familiars',type:'assailment',phase:'combat',cast:8,range:0,reach:'combat'},
 vessel:{name:'Daemonic Vessel',type:'enchantment',phase:'strategy',cast:9,range:0,reach:'self'},
 vortexChaos:{name:'Vortex of Chaos',type:'magical vortex',phase:'shooting',cast:8,range:15,template:1.5,remainsInPlay:true},
 vigour:{name:'Daemonic Vigour',type:'enchantment',phase:'strategy',cast:9,range:15,friendly:true},
};
// Elementalism (The Lores of Magic): Storm Call is its signature spell. relocate: the spell takes
// the unit off the battlefield and places it again, wholly within that many inches.
export const ELEMENTALISM={
 stormCall:{name:'Storm Call',type:'hex',phase:'strategy',cast:7,range:12},
 flamingSword:{name:'Flaming Sword',type:'assailment',phase:'combat',cast:7,range:0,reach:'combat'},
 plagueRust:{name:'Plague of Rust',type:'hex',phase:'strategy',cast:9,range:21,targetsEngaged:true},
 elementalSpirit:{name:'Summon Elemental Spirit',type:'magical vortex',phase:'shooting',cast:9,range:15,template:1.5,remainsInPlay:true},
 ramparts:{name:'Earthen Ramparts',type:'enchantment',phase:'strategy',cast:9,range:15,friendly:true},
 windBlast:{name:'Wind Blast',type:'magic missile',phase:'shooting',cast:8,range:15,los:true},
 pathway:{name:'Travel Mystical Pathway',type:'conveyance',phase:'movement',step:'remaining',cast:10,range:9,friendly:true,relocate:12},
};
// Dark Magic (The Lores of Magic): Doombolt is its signature spell.
export const DARK_MAGIC={
 doombolt:{name:'Doombolt',type:'magic missile',phase:'shooting',cast:8,range:24,los:true},
 wordOfPain:{name:'Word of Pain',type:'hex',phase:'strategy',cast:10,range:18,targetsEngaged:true},
 streamCorruption:{name:'Stream of Corruption',type:'assailment',phase:'combat',cast:8,range:0,reach:'combat'},
 gateway:{name:'Infernal Gateway',type:'conveyance',phase:'movement',step:'remaining',cast:9,range:12,friendly:true,characters:true,targetsEngaged:true,relocate:12},
 phantasmagoria:{name:'Phantasmagoria',type:'magical vortex',phase:'shooting',cast:9,range:12,template:1.5,remainsInPlay:true},
 battleLust:{name:'Battle Lust',type:'enchantment',phase:'strategy',cast:9,range:12,friendly:true},
 soulEater:{name:'Soul Eater',type:'assailment',phase:'combat',cast:7,range:0,reach:'combat'},
};
// Every spell the engine knows, by key.
export const SPELLS={...BATTLE_MAGIC,...DAEMONOLOGY,...ELEMENTALISM,...DARK_MAGIC};
export const SPELL_TEXT={
 fireball:'The target enemy unit suffers 2D6 Strength 4 hits (AP –) with Flaming Attacks. Needs line of sight; cannot target a unit in combat.',
 arrow:'Until your next Start of Turn, you may re-roll natural 1s To Hit when shooting at the target enemy unit.',
 pillar:'Remains in Play. Place a 3″ template within 12″; it is difficult terrain and scatters D6″ each Start of Turn. Any enemy unit that moves through it, or that it moves over, suffers D3+3 Strength 3 hits (AP –2) with Flaming Attacks. The opponent can dispel it in their Strategy phase by beating 9.',
 urgency:'Cast in Remaining Moves: a friendly unit that has already moved this Movement phase, and is not fleeing, may move again.',
 shield:'Until your next Start of Turn, the caster has a 5+ Ward save against any wounds.',
 coward:'The target enemy unit must take a Panic test at once. If it fails, it Falls Back in Good Order (more than half its models left) or flees, directly away from the caster.',
 hammerhand:'Assailment: one enemy unit the caster is fighting suffers 2D3 Strength 4 hits (AP –2).',
 hashutCurse:'Targets an enemy character in range and line of sight, even one in combat. It takes a Toughness test: if passed, D3 Strength 2 hits; if failed, D3+2 Strength 5 hits with no armour saves.',
 ashStorm:'Until your next Start of Turn, enemy units within 9″ of the caster suffer –1 To Hit (natural 6s are unaffected).',
 hashutFlames:'Assailment: one enemy unit the caster is fighting suffers D3+1 Strength 4 hits (AP –1) with Flaming Attacks.',
 summoning:'Magic Missile: the target enemy unit, in line of sight and not in combat, suffers 2D6 Strength 4 hits (AP –1). No models are summoned.',
 steed:'Cast in Remaining Moves: a friendly infantry unit that has not moved this phase, and is not fleeing or in combat, gains Fly (12) until your next Start of Turn. The spell does not move it.',
 darkness:'Until your next Start of Turn, the target enemy unit (it may be in combat) has Initiative −2 (minimum 1) and Leadership −2 (minimum 2), and cannot use the General’s Inspiring Presence.',
 familiars:'Assailment, cast when the wizard fights, in either player’s turn: one enemy unit it is fighting suffers 2D6 Strength 2 hits with no armour saves (Ward saves still apply).',
 vessel:'Self, and may be cast in combat: until the end of this turn the wizard has Strength +1 and Attacks +1 (maximum 10), and its weapons +1 Armour Piercing.',
 vortexChaos:'Remains in Play. Place a 3″ template within 15″, touching no base. It is difficult terrain and scatters D6″ at every Start of Turn. Any unit, friend or foe, that moves through it, or that it moves over, suffers D6+1 Strength 3 hits. The opponent can dispel it in their Strategy phase by beating 8.',
 vigour:'Until the end of this turn, the target friendly unit (not in combat) has Movement, Toughness and Initiative +1 (maximum 10).',
 stormCall:'Until your next Start of Turn, the target enemy unit has Movement and Initiative −1 (minimum 1). Casting it ends every other Hex on that unit.',
 flamingSword:'Assailment: one enemy unit the caster is fighting suffers D6+1 Strength 3 hits (AP –) with Flaming Attacks.',
 plagueRust:'Until your next Start of Turn, the target enemy unit’s armour value is 2 worse. It may target a unit in combat.',
 elementalSpirit:'Remains in Play. Place a 3″ template within 15″, touching no base. It is difficult terrain that no line of sight can be drawn over, and scatters D6″ at every Start of Turn. Any enemy unit that moves through it, or that it moves over, suffers D3+3 Strength 4 hits (AP −1). The opponent can dispel it in their Strategy phase by beating 9.',
 ramparts:'Until your next Start of Turn, the target friendly unit has a 5+ Ward save and counts as behind a defended low obstacle when charged: a charger without Fly makes a disordered charge (no Initiative bonus for charging). It cannot march or charge.',
 windBlast:'Magic Missile: the target enemy unit, in line of sight and not in combat, suffers D3+3 Strength 5 hits (AP −1), then Gives Ground: 2″ directly away from the caster.',
 pathway:'Cast in Remaining Moves: a friendly unit that is not fleeing and has not moved this phase is taken off the battlefield and placed anywhere wholly within 12″ of where it stood, more than 6″ from every enemy. It cannot move again this phase.',
 doombolt:'Magic Missile: a 3″ blast template is centred on the target enemy unit (in line of sight, not in combat). Each enemy model under it risks a Strength 3 hit (AP −2): a whole base, or one under the centre, is hit; a base partly under it is hit on a 4+.',
 wordOfPain:'Until your next Start of Turn, the target enemy unit has Strength and Toughness −1 (minimum 1). It may target a unit in combat.',
 streamCorruption:'Assailment: a flame template runs from the caster’s base over an enemy unit it is fighting. Each model under it, friend or foe, risks a Strength 3 hit (AP −1): a whole base is hit, a base partly under it on a 4+. Casualties come from the rear ranks.',
 gateway:'Cast in Remaining Moves: a friendly character that is not fleeing (even one in combat, which it then leaves) is taken off the battlefield and placed anywhere within 12″ of where it stood, more than 6″ from every enemy.',
 phantasmagoria:'Remains in Play. Place a 3″ template within 12″, touching no base. It never moves and is dangerous terrain: each model that starts, crosses or ends a move in it loses a Wound on a 1. An enemy unit that ends its move within 12″ of it takes a Panic test: failing, it Falls Back in Good Order or flees directly away from the template; otherwise it is Impetuous while within 12″ of it. The opponent can dispel it by beating 9.',
 battleLust:'Until the end of this turn, the target friendly unit has Frenzy and Hatred (all enemies): it must charge if it can, has +1 Attack in a turn it charges, re-rolls failed To Hit rolls in the first round of combat, cannot flee from a charge and passes Panic tests.',
 soulEater:'Assailment: one enemy model the caster is fighting suffers a single Strength 3 hit with Multiple Wounds (3) and no armour save (Ward saves still apply).',
};
export const SPELL_ROLL=['fireball','arrow','pillar','urgency','shield','coward'];
export const SIGNATURE_SPELLS=['hammerhand','summoning','hashutCurse','ashStorm','hashutFlames','stormCall','doombolt'];
// Each lore: its six numbered spells (a D6 result picks one) and its signature spell.
export const LORES={battle:{name:'Battle Magic',roll:SPELL_ROLL,signature:'hammerhand'},daemonology:{name:'Daemonology',roll:['steed','darkness','familiars','vessel','vortexChaos','vigour'],signature:'summoning'},
 elementalism:{name:'Elementalism',roll:['flamingSword','plagueRust','elementalSpirit','ramparts','windBlast','pathway'],signature:'stormCall'},
 darkMagic:{name:'Dark Magic',roll:['wordOfPain','streamCorruption','gateway','phantasmagoria','battleLust','soulEater'],signature:'doombolt'}};
const loreOf=u=>LORES[u?.lore]??LORES.battle;
// The spells a wizard may take in exchange: its lore's signature spell, and for a Daemonsmith
// (Lore of Hashut) Curse of Hashut, Storm of Ash or Flames of Hashut.
export function signatureChoices(u){return [loreOf(u).signature,...(WIZARDS[u?.faction]?.rules?.includes('loreOfHashut')?['hashutCurse','ashStorm','hashutFlames']:[])];}
// Round 1 Strategy, before casting: a Wizard may swap one rolled spell for a signature spell, once.
export function canExchangeSignature(s,u){return s.stage==='strategy'&&s.round===1&&u?.role==='wizard'&&u.team===s.team&&!u.castThisTurn.length&&u.spells.some(key=>loreOf(u).roll.includes(key))&&!u.spells.some(key=>signatureChoices(u).includes(key));}
// Spells now affecting a unit, for its label: a hex on it or an enchantment it carries, with
// when it ends and who cast it.
const SPELL_SHORT={arrow:'Arrow Attraction',shield:'Oaken Shield',ashStorm:'Storm of Ash',urgency:'Arcane Urgency',steed:'Fly 12',darkness:'Darkness',vessel:'Vessel',vigour:'Vigour',stormCall:'Storm Call',plagueRust:'Rust −2',ramparts:'Ramparts',wordOfPain:'Word of Pain',battleLust:'Battle Lust'};
export function activeSpells(u){return liveEffects(u).filter(e=>SPELLS[e.spell]).map(e=>({key:e.spell,short:SPELL_SHORT[e.spell]??SPELLS[e.spell].name,name:SPELLS[e.spell].name,expiry:e.expiry,caster:e.source?.caster??null}));}
// A spell's lasting effect on its recipients.
function spellEffect(s,u,key,recipients,{rules=[],mods=[],ap=0,armour=0,expiry}){return addEffect(s,recipients,{spell:key,source:{kind:'spell',caster:u.id,team:u.team},rules,mods,ap,...(armour?{armour}:{}),stack:'spell:'+key,created:{round:s.round,team:s.team},expiry:expiryAt(s,expiry,u.team)});}
// Spell generation: one D6 per Wizard level (up to six), a duplicate rerolled; each result is that
// numbered spell of the wizard's lore. After 20 duplicates in a row the lowest unused number is
// taken, so a fixed random source still gives distinct spells.
export function rollSpells(random=Math.random,{lore='battle',level=2}={}){const table=(LORES[lore]??LORES.battle).roll,rolls=[],rerolled=[],picked=[];for(let i=0;i<Math.min(6,level);i++){let n=rollD6(1,random)[0],tries=0;rolls.push(n);while(picked.includes(n)){rerolled.push(n);if(++tries>=20){n=[1,2,3,4,5,6].find(k=>!picked.includes(k));break;}n=rollD6(1,random)[0];rolls.push(n);}picked.push(n);}return {spells:picked.map(n=>table[n-1]),rolls,rerolled};}
export function generateSpells(random=Math.random,options={}){return rollSpells(random,options).spells;}
export function exchangeSignature(s,id,spell,replacement=null){const u=getUnit(s,id),choices=signatureChoices(u);replacement??=choices[0];if(s.stage!=='strategy'||s.round!==1||u?.role!=='wizard'||u.castThisTurn.length||!loreOf(u).roll.includes(spell)||!u.spells.includes(spell)||!choices.includes(replacement)||u.spells.some(k=>choices.includes(k)))throw Error('Exchange one generated spell for a permitted signature before casting.');u.spells.splice(u.spells.indexOf(spell),1,replacement);return u.spells;}
function spellVision(u,t){const a=rad(-heading(u)),dx=t.x-u.x,dy=t.y-u.y,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);return ly<0&&Math.abs(lx)<=-ly+Math.max(size(t).w,size(t).h)/2+EPS;}
const targetless=spell=>spell?.reach==='self'||!!spell?.template;
// A spell's range as players read it: inches, Self or Combat.
export function spellRangeLabel(key){const spell=SPELLS[key];return !spell?'':spell.range?spell.range+'″':spell.reach==='combat'?'Combat':'Self';}
// Why this wizard cannot attempt this spell now (null when it can), before any target is chosen.
// The checks run in a fixed order, so the reason shown is the first that applies.
export function castBlockReason(s,id,key){
 const u=getUnit(s,id),spell=SPELLS[key];
 if(s.pendingSpell)return 'Resolve the dispel of the spell just cast first.';
 if(!u||u.role!=='wizard'||!spell||!u.spells?.includes(key))return 'This wizard does not know that spell.';
 if(u.x===null||aliveCount(u)===0)return 'The wizard is not on the battlefield.';
 if(u.fleeing)return 'Fleeing wizards cannot cast.';
 const assailment=spell.type==='assailment';
 if(u.team!==s.team&&!assailment)return 'Only an Assailment can be cast in the enemy’s turn.';
 if(s.stage!==spell.phase)return `Cast in the ${spell.phase[0].toUpperCase()+spell.phase.slice(1)} phase.`;
 if(spell.step&&s.movementStep!==spell.step)return 'Cast in the Remaining Moves sub-phase.';
 if(u.castThisTurn.includes(key))return 'Already attempted this turn.';
 if(u.castThisTurn.length>=u.level)return `No casting attempts left: a Level ${u.level} wizard has ${u.level} per turn.`;
 if(u.magicExhausted)return 'Its magic is spent this turn (miscast).';
 if(s.magicLocked?.[u.team])return 'This side cannot cast again this turn (Power Drain).';
 if(u.raiding&&spell.range)return 'Raiding: only Self and Combat spells can be cast.';
 if(['magic missile','magical vortex'].includes(spell.type)){if(u.movementMode==='march')return 'Marched this turn: no Magic Missiles or Magical Vortexes.';if(u.charge)return 'Charged this turn: no Magic Missiles or Magical Vortexes.';}
 if(u.engaged&&!assailment&&spell.reach!=='self')return 'Engaged in combat: only Assailments and Self spells can be cast.';
 // An Assailment is cast when the wizard fights: in a combat being fought, at its Initiative step.
 if(assailment){const c=s.combatSession;if(!c||c.phase!=='attacks'||!c.units.includes(u.id))return 'Cast when the wizard fights, at its Initiative step.';if(c.initiative[u.id]!==c.groups[c.step])return `Cast at the wizard’s Initiative step (${c.initiative[u.id]}).`;}
 return null;
}
// Why this unit is not a legal target for the spell (null when it is). The caster's own
// restrictions are castBlockReason's: a target that is allowed does not lift them.
export function targetReason(s,id,key,t){
 const u=getUnit(s,id),spell=SPELLS[key];if(!u||!spell)return 'Unknown spell.';
 if(!t||t.x===null||aliveCount(t)===0)return 'Not on the battlefield.';
 if(targetless(spell))return t.id===u.id?null:spell.template?'Place the template instead of choosing a target.':'A Self spell is cast on the wizard.';
 if(spell.friendly?t.team!==u.team:t.team===u.team)return spell.friendly?'Choose a friendly unit.':'Choose an enemy unit.';
 // An Assailment targets an enemy unit the wizard is itself fighting (not one elsewhere in the
 // same combat); the wizard must be fighting, though not necessarily in base contact.
 if(spell.reach==='combat')return !engagedWith(u,t)?'Not fighting the wizard.':!modelSquares(s,u)[0]?.fighting?'The wizard is not fighting.':null;
 if(spell.characters&&!isCharacter(t))return 'Only a character can be targeted.';
 if(key==='urgency'){if(!t.moved)return 'It has not moved yet this phase.';if(t.fleeing)return 'Fleeing.';}
 // Steed of Shadows: friendly infantry (by troop type) that has not moved this phase, once a turn.
 if(key==='steed'){if(!['regular','heavy','character'].includes(troopType(t)))return 'Only infantry can be given Steed of Shadows.';if(t.fleeing)return 'Fleeing.';if(t.moved||t.charge||(t.spent??0)>EPS||t.movementMode||hasRule(t,'arcaneUrgency'))return 'It has already moved this phase.';if(t.steededTurn===`${s.round}:${s.team}`)return 'Already given Steed of Shadows this turn.';}
 // Travel Mystical Pathway: a unit that has not moved this phase. Infernal Gateway: a character, even in combat.
 if(key==='pathway'){if(t.fleeing)return 'Fleeing.';if(t.moved||t.charge||(t.spent??0)>EPS||t.movementMode||hasRule(t,'arcaneUrgency'))return 'It has already moved this phase.';}
 if(key==='gateway'&&t.fleeing)return 'Fleeing.';
 // A unit cannot be affected by the same Conveyance spell more than once a turn.
 if(spell.type==='conveyance'&&t.conveyed?.[key]===`${s.round}:${s.team}`)return `Already moved by ${spell.name} this turn.`;
 if(t.engaged&&!spell.targetsEngaged)return 'Engaged in combat.';
 if(spell.range&&gap(u,t)>spell.range+EPS)return `Out of range (${spell.range}″).`;
 if(!spell.friendly&&screenedCharacter(s,u,t))return SCREENED;
 if(t.id!==u.id&&!spellVision(u,t))return 'Outside the wizard’s vision arc.';
 if(spell.los&&!modelCanSee(s,u,t,modelSquares(s,u)[0],spell.range))return 'No line of sight.';
 return null;
}
// Every unit and war machine on the battlefield with the reason it cannot be targeted (null when it can).
export function spellTargetOptions(s,id,key){const u=getUnit(s,id),spell=SPELLS[key];if(!u||!spell)return [];if(targetless(spell))return [{unit:u,reason:targetReason(s,id,key,u)}];return combatants(s).filter(t=>t.x!==null&&aliveCount(t)>0).map(t=>({unit:t,reason:targetReason(s,id,key,t)}));}
export function spellTargets(s,id,key){return spellTargetOptions(s,id,key).filter(o=>!o.reason).map(o=>o.unit);}
export function canCast(s,id,key,targetId){return !castBlockReason(s,id,key)&&!targetReason(s,id,key,getUnit(s,targetId));}
// Where a template spell may go: its centre within range of the wizard (measured from its base),
// the whole template on the battlefield, and touching no model's base.
export function templatePlacementError(s,id,key,point){
 const u=getUnit(s,id),spell=SPELLS[key];if(!spell?.template)return null;
 if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return `Place the ${spell.name} template.`;
 const r=spell.template,b=boardOf(s);
 if(circleGap(corners(u),{x:point.x,y:point.y,r:0})>spell.range+EPS)return `Its centre must be within ${spell.range}″ of the wizard.`;
 if(point.x<r-EPS||point.x>b.width-r+EPS||point.y<r-EPS||point.y>b.height-r+EPS)return 'The whole template must be on the battlefield.';
 if(combatants(s).some(v=>v.x!==null&&aliveCount(v)>0&&circleGap(corners(v),{x:point.x,y:point.y,r})<EPS))return 'The template cannot touch any model’s base.';
 return null;
}
// Where a relocating spell (Travel Mystical Pathway, Infernal Gateway) may put its target: the
// whole unit, as turned, within the spell's distance of the footprint it leaves, more than 6″ from
// every enemy, and where a unit may stand (on the table, off impassable terrain, 1″ from others).
export function relocationError(s,id,key,targetId,point){
 const spell=SPELLS[key],t=getUnit(s,targetId);if(!spell?.relocate)return null;
 if(!t||t.x===null)return 'Choose a friendly unit first.';
 if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return `Choose where ${spell.name} places ${t.name}.`;
 const pose={...t,x:point.x,y:point.y,heading:normalize(Number.isFinite(point.heading)?point.heading:heading(t))},from=corners(t);
 if(corners(pose).some(p=>circleGap(from,{x:p.x,y:p.y,r:0})>spell.relocate+EPS))return `The whole unit must stay within ${spell.relocate}″ of where it stands.`;
 if(combatants(s).some(v=>v.team!==t.team&&v.x!==null&&aliveCount(v)>0&&gap(pose,v)<=6+EPS))return 'It cannot be placed within 6″ of an enemy.';
 return checkPosition(s,pose,pose.x,pose.y);
}
// The flame template: a teardrop "approximately 8″ in length" (the rules give no width). Its broad
// end here is a 3″ circle, a convention of this game: the shape runs from a point at `tip` to the
// far side of that circle, straight toward `toward`.
export const FLAME_TEMPLATE={length:8,radius:1.5};
export function flameTemplate(tip,toward,steps=16){const d=Math.hypot(toward.x-tip.x,toward.y-tip.y)||1,ux=(toward.x-tip.x)/d,uy=(toward.y-tip.y)/d,{length:L,radius:r}=FLAME_TEMPLATE,D=L-r,c={x:tip.x+ux*D,y:tip.y+uy*D},a=Math.asin(r/D),base=Math.atan2(uy,ux);
 return [{x:tip.x,y:tip.y},...Array.from({length:steps+1},(_,k)=>{const t=base+Math.PI/2+a-k*(Math.PI+2*a)/steps;return {x:c.x+r*Math.cos(t),y:c.y+r*Math.sin(t)};})];}
// Every model under a template polygon: wholly under it, or partly.
function modelsUnder(s,poly,{exclude=null}={}){const out=[];for(const unit of allPieces(s).filter(u=>u.x!==null&&aliveCount(u)>0&&u.id!==exclude)){
 const squares=unit.role==='warmachine'||isCharacter(unit)?[{index:0,poly:corners(unit)}]:modelSquares(s,unit).filter(m=>!m.dead).map(m=>({index:m.index,poly:[[m.x,m.y],[m.x+m.size,m.y],[m.x+m.size,m.y+m.size],[m.x,m.y+m.size]].map(([x,y])=>localPoint(unit,x,y))}));
 for(const m of squares){if(polygonGap(m.poly,poly)>=EPS)continue;out.push({unit,model:m.index,fully:m.poly.every(p=>inside(p,poly))});}}return out;}
// The point of a footprint's edge nearest to p.
function nearestEdgePoint(poly,p){let best=null,d=Infinity;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0,q={x:a.x+t*dx,y:a.y+t*dy},e=Math.hypot(p.x-q.x,p.y-q.y);if(e<d){d=e;best=q;}}return best;}
// A unit's Ward save against these wounds (7: none). Oaken Shield gives 5+; a Daemonsmith's
// Blackshard armour gives 5+ against Flaming Attacks.
export function wardSave(u,{flaming=false}={}){return Math.min(effectRule(u,'ward')?.value??7,u?.role==='wizard'&&u?.faction==='chaos'&&flaming?5:7);}
// Magical hits: no roll To Hit; To Wound against the target's Toughness (6 for a war machine);
// armour saves (with any shield) unless the spell allows none; then any Ward save. With defer the
// wounds are counted but the casualties wait for the end of the Initiative step (an Assailment).
// multiple: Multiple Wounds (N) — each unsaved wound costs a character or war machine up to N
// Wounds; a rank-and-file model still dies once. panic:false leaves the Heavy Casualties test to the caller.
function magicDamage(s,target,hits,strength,ap,random,{flaming=false,ignoreArmour=false,defer=false,cap=null,multiple=null,panic:panics=true}={}){

 const before=aliveCount(target),dice={wound:[],save:[],ward:[]},limit=cap??remainingWounds(target),toWound=Math.max(2,Math.min(6,4+shotToughness(target)-strength)),toSave=Math.max(2,Math.min(7,armourSave(target)+ap)),ward=wardSave(target,{flaming});let wounds=0,unsaved=0;
 for(let i=0;i<hits&&unsaved<limit;i++){const wound=rollD6(1,random)[0];dice.wound.push(wound);if(wound<toWound)continue;wounds++;if(!ignoreArmour){const armour=rollD6(1,random)[0];dice.save.push(armour);if(armour>=toSave)continue;}if(ward<=6){const value=rollD6(1,random)[0];dice.ward.push(value);if(value>=ward)continue;}unsaved+=multiple&&(isCharacter(target)||target.role==='warmachine')?Math.min(multiple,limit-unsaved):1;}
 let panic=null;if(!defer){removeCasualties(s,target,unsaved,random);wipeOut(s,target,random);if(panics)panic=heavyCasualties(s,target,before,null,random);}
 return {hits,wounds,unsaved,dice,toWound,toSave:ignoreArmour?null:toSave,panic,before};}
// A blast template centred on a point, model by model as the Deathshrieker's: a model wholly under
// it, or under its centre, is hit; any other model it touches is hit on a 4+. Each hit wounds,
// saves and Wards on its own.
function templateHits(s,point,radius,strength,ap,random,{only=null}={}){
 const out={hits:0,cells:[],affected:[]},per={},before=new Map(combatants(s).map(u=>[u.id,aliveCount(u)]));
 for(const cell of blastCells(s,point,radius)){if(only&&!only(cell.unit))continue;const u=cell.unit,hitRoll=cell.fully||cell.centre?null:rollD6(1,random)[0];if(hitRoll!==null&&hitRoll<4)continue;out.hits++;
  const toWound=Math.max(2,Math.min(6,4+shotToughness(u)-strength)),toSave=Math.max(2,Math.min(7,armourSave(u)+ap)),woundRoll=rollD6(1,random)[0],saveRoll=woundRoll>=toWound?rollD6(1,random)[0]:null,ward=wardSave(u);
  let slain=saveRoll!==null&&saveRoll<toSave&&aliveCount(u)>0;const wardRoll=slain&&ward<=6?rollD6(1,random)[0]:null;if(wardRoll!==null&&wardRoll>=ward)slain=false;
  out.cells.push({unit:u.id,model:cell.model,hitRoll,woundRoll,saveRoll,ward:wardRoll,slain});const e=per[u.id]??={id:u.id,hits:0,wounds:0,unsaved:0};e.hits++;if(woundRoll>=toWound)e.wounds++;if(slain){e.unsaved++;removeCasualties(s,u,1,random);}}
 out.affected=Object.values(per);for(const e of out.affected){const u=getUnit(s,e.id);wipeOut(s,u,random);e.panic=heavyCasualties(s,u,before.get(e.id),null,random);}return out;}
// A regiment whose last model falls to shooting, Stand & Shoot, a spell or a vortex leaves the
// battlefield at once (full casualty VP). In a combat being fought, the combat result settles it.
function wipeOut(s,u,random=Math.random){if(!u||u.x===null||aliveCount(u)>0)return;const p=s.pendingCombat;if(s.combatSession?.units?.includes(u.id)||p&&(p.combat??[p.winner,p.loser]).includes(u.id))return;release(s,u);destroyUnit(s,u,'COMBAT_CASUALTIES',random);}
// A miscast (a natural double 1 when casting) or Outclassed in the Art (a natural double 1 on a
// Wizardly Dispel, which reads the table with dispelling in place of casting).
// The Sorcerer's Curse comes first for a Daemonsmith: a Toughness test (a 6 always fails, a 1
// always passes); failing costs a Wound and adds +1 Toughness instead of the Miscast table.
// 2-4: a 5″ template on the wizard, S10 AP-4. 5-6: a 3″ template, S6 AP-2. 7: one S4 AP-1 hit.
// 8-9: cast at its casting value (dispelled, for a dispel); this wizard is done for the turn.
// 10-12: cast with a Perfect Invocation (dispelled); this side is done for the turn.
function miscast(s,u,random,{dispel=false}={}){
 if(u.faction==='chaos'&&u.role==='wizard'){const test=rollD6(1,random)[0],toughness=profile(u).T;if(test===6||test!==1&&test>toughness){removeCasualties(s,u,1,random);u.petrified++;return {kind:'Sorcerer’s Curse',test,wounds:1,toughness};}}
 const dice=rollD6(2,random),sum=dice[0]+dice[1];
 if(sum<=6){const big=sum<=4,blast=templateHits(s,{x:u.x,y:u.y},big?2.5:1.5,big?10:6,big?4:2,random);return {kind:big?'Dimensional Cascade':'Calamitous Detonation',dice,hits:blast.hits,cells:blast.cells,affected:blast.affected,cast:false};}
 if(sum===7){const hit=magicDamage(s,u,1,4,1,random);return {kind:'Careless Conjuration',dice,hit,cast:false};}
 if(dispel){if(sum<=9)u.dispelExhausted=true;else (s.dispelBlocked??={})[u.team]=true;return {kind:sum<=9?'Barely Controlled Power':'Power Drain',dice,dispelled:true};}
 u.magicExhausted=true;if(sum>=10)(s.magicLocked??={})[u.team]=true;return {kind:sum<=9?'Barely Controlled Power':'Power Drain',dice,cast:true,undispellable:sum>=10};}
// Curse of Cowardly Flight: the target takes a Panic test at once (falling back or fleeing from the caster).
function magicPanic(s,caster,target,random){const out=panicTest(s,target,{away:caster,cause:'Curse of Cowardly Flight',random});if(!out)return {dice:[],passed:true,noTest:true};return {...out,flee:out.fleeDice};}
// Casting and dispelling are two steps. attemptSpell makes the casting roll; a cast spell that
// can still be dispelled waits in s.pendingSpell until the defending player picks a Wizardly
// Dispel (one eligible Wizard), the Fated Dispel, or no dispel with resolveDispel.
// castSpell does both at once for the AI and tests.
// The Fated Dispel is once per player turn for each side.
const fatedUsed=(s,team)=>s.fatedDispelUsed&&typeof s.fatedDispelUsed==='object'?!!s.fatedDispelUsed[team]:!!s.fatedDispelUsed;
function useFated(s,team){if(!s.fatedDispelUsed||typeof s.fatedDispelUsed!=='object')s.fatedDispelUsed={ash:!!s.fatedDispelUsed,iron:!!s.fatedDispelUsed};s.fatedDispelUsed[team]=true;}
export function fatedDispelAvailable(s,team){return !fatedUsed(s,team)&&!s.dispelBlocked?.[team];}
function wizardDispellers(s,caster,targetId){return s.units.filter(v=>v.role==='wizard'&&v.team!==caster.team&&v.x!==null&&aliveCount(v)>0&&!v.fleeing&&!v.dispelExhausted&&!s.dispelBlocked?.[v.team]&&gap(v,caster)<=(v.level>=3?24:18)+EPS&&(!v.engaged||v.id===targetId));}
export function dispelOptions(s){const p=s.pendingSpell;if(!p)return null;const caster=getUnit(s,p.caster),team=caster.team==='ash'?'iron':'ash';return {caster:p.caster,spell:p.key,team,casting:p.report.casting,wizards:wizardDispellers(s,caster,p.target).map(v=>({id:v.id,bonus:Math.ceil(v.level/2),distance:gap(v,caster)})),fated:fatedDispelAvailable(s,team)};}
export function castSpell(s,id,key,targetId,random=Math.random,{dispel='none',dispeller=null,point=null}={}){
 if(!['none','wizard','fated'].includes(dispel))throw Error('Choose a legal dispel.');const u=getUnit(s,id);
 if(u&&dispel==='wizard'&&!wizardDispellers(s,u,targetId).some(v=>!dispeller||v.id===dispeller))throw Error('No opposing wizard is in dispel range.');
 if(u&&dispel==='fated'&&!fatedDispelAvailable(s,u.team==='ash'?'iron':'ash'))throw Error('The Fated Dispel was already used this turn.');
 const report=attemptSpell(s,id,key,targetId,random,{point});if(!report.pending)return report;
 return resolveDispel(s,dispel==='wizard'?dispeller??dispelOptions(s).wizards[0].id:dispel,random);
}
// The casting roll: 2D6 plus half the wizard's level (rounded up), less the Magic Resistance of an
// enemy target; it must equal or beat the casting value. The natural dice and every modifier are
// kept apart in the report. A natural double 6 always succeeds and cannot be dispelled at once;
// a natural double 1 miscasts.
export function attemptSpell(s,id,key,targetId,random=Math.random,{point=null}={}){
 const spell=SPELLS[key],block=castBlockReason(s,id,key);if(block)throw Error(block);
 if(targetless(spell))targetId??=id;
 const u=getUnit(s,id),t=getUnit(s,targetId),why=targetReason(s,id,key,t);if(why)throw Error(why);
 if(spell.template){const bad=templatePlacementError(s,id,key,point);if(bad)throw Error(bad);}
 if(spell.relocate){const bad=relocationError(s,id,key,targetId,point);if(bad)throw Error(bad);}
 const dice=rollD6(2,random),modifiers=[{label:'Level '+u.level,value:Math.ceil(u.level/2)}],resistance=t.team!==u.team?magicResistance(t):0;
 if(resistance)modifiers.push({label:'Magic Resistance',value:-resistance});
 const casting=dice[0]+dice[1]+modifiers.reduce((n,m)=>n+m.value,0),report={caster:id,spell:key,target:targetId,dice,modifiers,casting,cast:false,dispel:null,effect:null};u.castThisTurn.push(key);
 // Attempting a Remains in Play spell again ends the caster's earlier one at once, whatever the result.
 if(spell.remainsInPlay){const old=s.vortices.filter(v=>v.caster===id&&(v.spell??'pillar')===key);if(old.length){s.vortices=s.vortices.filter(v=>!old.includes(v));report.ended=old.map(v=>v.id??v.caster);}}
 if(dice[0]===1&&dice[1]===1){report.miscast=miscast(s,u,random);if(!report.miscast.cast)return report;report.casting=spell.cast;}else if(casting<spell.cast&&!(dice[0]===6&&dice[1]===6))return report;report.cast=true;
 report.perfect=dice[0]===6&&dice[1]===6||!!report.miscast?.undispellable;
 s.pendingSpell={caster:id,key,target:targetId,point,report};const options=dispelOptions(s);
 if(!report.perfect&&(options.wizards.length||options.fated)){report.pending=true;return report;}
 s.pendingSpell=null;applySpell(s,{caster:id,key,target:targetId,point,report},random);return report;}
// Wizardly Dispel: 2D6 + half the level (rounded up); Fated Dispel: unmodified 2D6, once per turn
// for each side, no range. Either must beat the casting result (ties fail); a natural double 6
// always dispels. A natural double 1 fails, except that on a Wizardly Dispel the Wizard is
// Outclassed in the Art: the Miscast table, where 8-12 dispel the spell.
export function resolveDispel(s,choice='none',random=Math.random){
 const p=s.pendingSpell;if(!p)throw Error('No spell is waiting for a dispel.');const options=dispelOptions(s),report=p.report;
 if(choice!=='none'){
  const wizard=choice==='fated'?null:options.wizards.find(w=>w.id===choice);
  if(choice==='fated'&&!options.fated)throw Error('The Fated Dispel was already used this turn.');
  if(choice!=='fated'&&!wizard)throw Error('Choose a Wizard in dispel range, the Fated Dispel, or no dispel.');
  if(!wizard)useFated(s,options.team);
  const dice=rollD6(2,random),double1=dice[0]===1&&dice[1]===1,total=dice[0]+dice[1]+(wizard?wizard.bonus:0);
  report.dispel={kind:wizard?'wizard':'fated',by:wizard?.id??null,dice,total,success:!double1&&(dice[0]===6&&dice[1]===6||total>report.casting)};
  if(double1&&wizard){report.dispel.miscast=miscast(s,getUnit(s,wizard.id),random,{dispel:true});if(report.dispel.miscast.dispelled)report.dispel.success=true;}
 }
 s.pendingSpell=null;report.pending=false;
 if(report.dispel?.success){report.cast=false;return report;}
 applySpell(s,p,random);return report;
}
// Wizards in the combat being fought who may still cast an Assailment at this Initiative step,
// and have not chosen to fight on without it.
export function assailmentWaiting(s,team=null){const c=s.combatSession;if(s.stage!=='combat'||!c||c.phase!=='attacks'||s.pendingSpell)return [];return c.units.map(id=>getUnit(s,id)).filter(u=>u?.role==='wizard'&&(!team||u.team===team)&&c.passed?.[u.id]!==c.step&&u.spells.some(key=>SPELLS[key]?.type==='assailment'&&!castBlockReason(s,u.id,key)&&spellTargets(s,u.id,key).length));}
export function passAssailment(s,id){const c=s.combatSession;if(!c||c.phase!=='attacks')throw Error('No combat is being fought.');(c.passed??={})[id]=c.step;return c.step;}
// An Assailment's hits join the wizard's Initiative step: its casualties are removed with the
// step's attacks and its wounds count towards the combat result. Outside a combat being fought
// (tests that call it directly) they are removed at once.
// A unit outside the combat being fought (a friend under a flame template) loses its models at once.
function assail(s,u,t,key,hits,strength,ap,random,options={}){
 const c=s.combatSession;if(!c||!c.units.includes(u.id)||!c.units.includes(t.id)||c.phase!=='attacks')return magicDamage(s,t,hits,strength,ap,random,options);
 const queued=(c.spellStages??[]).filter(st=>st.to===t.id).reduce((n,st)=>n+st.unsaved,0),out=magicDamage(s,t,hits,strength,ap,random,{...options,defer:true,cap:Math.max(0,remainingWounds(t)-queued)});
 (c.spellStages??=[]).push({from:u.id,to:t.id,spell:key,initiative:c.groups[c.step],attacks:hits,hits,wounds:out.wounds,unsaved:out.unsaved,saved:out.wounds-out.unsaved,toHit:null,toWound:out.toWound,toSave:out.toSave,dice:out.dice,...(t.team===u.team?{friendly:true}:{}),...(options.rear?{rear:true}:{})});
 return out;}
// Stream of Corruption: the flame template's point touches the caster's base where it is nearest
// the target, and it runs straight toward the target's centre. Each unit under it takes its hits as
// one Assailment: wholly covered models are hit, partly covered ones on a 4+.
function streamOfCorruption(s,u,t,key,random){
 const tip=nearestEdgePoint(corners(u),{x:t.x,y:t.y}),template=flameTemplate(tip,{x:t.x,y:t.y}),cells=modelsUnder(s,template,{exclude:u.id}),per=new Map(),rolls=[];
 for(const cell of cells){const roll=cell.fully?null:rollD6(1,random)[0];rolls.push({unit:cell.unit.id,model:cell.model,fully:cell.fully,roll,hit:roll===null||roll>=4});if(roll===null||roll>=4)per.set(cell.unit.id,(per.get(cell.unit.id)??0)+1);}
 const affected=[...per].map(([id,hits])=>({id,friendly:getUnit(s,id).team===u.team,...assail(s,u,getUnit(s,id),key,hits,3,1,random,{rear:true})}));
 return {template,tip,rolls,affected,hits:affected.reduce((n,a)=>n+a.hits,0),unsaved:affected.reduce((n,a)=>n+a.unsaved,0)};}
function applySpell(s,{caster:id,key,target:targetId,point,report},random){const u=getUnit(s,id),t=getUnit(s,targetId),spell=SPELLS[key];
 if(key==='fireball')report.effect=magicDamage(s,t,rollD6(2,random).reduce((a,b)=>a+b,0),4,0,random,{flaming:true});
 else if(key==='hammerhand')report.effect=assail(s,u,t,key,rollD6(2,random).reduce((a,b)=>a+Math.ceil(b/2),0),4,2,random);
 else if(key==='hashutFlames')report.effect=assail(s,u,t,key,Math.ceil(rollD6(1,random)[0]/2)+1,4,1,random,{flaming:true});
 else if(key==='flamingSword')report.effect=assail(s,u,t,key,rollD6(1,random)[0]+1,3,0,random,{flaming:true});
 else if(key==='soulEater')report.effect=assail(s,u,t,key,1,3,0,random,{ignoreArmour:true,multiple:3});
 else if(key==='streamCorruption')report.effect=streamOfCorruption(s,u,t,key,random);
 // Doombolt: the 3″ blast is centred on the target and strikes only enemy models.
 else if(key==='doombolt'){const point={x:t.x,y:t.y};report.effect={point,radius:1.5,...templateHits(s,point,1.5,3,2,random,{only:v=>v.team!==u.team})};report.effect.unsaved=report.effect.affected.reduce((n,a)=>n+a.unsaved,0);}
 // Wind Blast: the hits, then the unit Gives Ground 2″ directly away from the caster; any Heavy
 // Casualties Panic test comes after.
 else if(key==='windBlast'){const out=magicDamage(s,t,Math.ceil(rollD6(1,random)[0]/2)+3,5,1,random,{panic:false});let gave=null;if(t.x!==null&&aliveCount(t)>0&&!t.engaged){const before={...t};gave=retreatPose(s,t,u,2);const crossed=sweptVortices(s,t,[before,{...t}]);if(crossed.length)gave.vortexHits=vortexMoveHits(s,t,crossed,random,[before,{...t}]);}const panic=t.x!==null&&aliveCount(t)>0?heavyCasualties(s,t,out.before,null,random):null;report.effect={...out,panic,giveGround:gave};}
 else if(key==='stormCall'){const ended=[...new Set(liveEffects(t).filter(e=>SPELLS[e.spell]?.type==='hex'&&e.spell!=='stormCall').map(e=>e.spell))];removeEffects(t,e=>SPELLS[e.spell]?.type==='hex'&&e.spell!=='stormCall');spellEffect(s,u,key,[t],{mods:[{stat:'M',add:-1,min:1},{stat:'I',add:-1,min:1}],expiry:'START_OF_CASTING_PLAYER_NEXT_TURN'});report.effect={movement:-1,initiative:-1,ended};}
 else if(key==='plagueRust'){spellEffect(s,u,key,[t],{armour:2,expiry:'START_OF_CASTING_PLAYER_NEXT_TURN'});report.effect={armour:-2};}
 else if(key==='wordOfPain'){spellEffect(s,u,key,[t],{mods:[{stat:'S',add:-1,min:1},{stat:'T',add:-1,min:1}],expiry:'START_OF_CASTING_PLAYER_NEXT_TURN'});report.effect={strength:-1,toughness:-1};}
 else if(key==='ramparts'){spellEffect(s,u,key,[t],{rules:[{rule:'ward',value:5},{rule:'defendedObstacle'},{rule:'noMarch'},{rule:'noCharge'}],expiry:'START_OF_CASTING_PLAYER_NEXT_TURN'});report.effect={ward:5,defended:true};}
 else if(key==='battleLust'){spellEffect(s,u,key,[t],{rules:[{rule:'frenzy'},{rule:'hatred'}],expiry:'END_CURRENT_PLAYER_TURN'});report.effect={frenzy:true,hatred:true};}
 // The relocating spells: the unit is taken off and placed again; Infernal Gateway may take a
 // character out of its combat. Moves already made by this unit can no longer be taken back.
 else if(spell.relocate){const from={x:t.x,y:t.y,heading:heading(t)};if(t.engaged)release(s,t);Object.assign(t,{x:point.x,y:point.y,heading:normalize(Number.isFinite(point.heading)?point.heading:heading(t)),movedThisTurn:true,...(key==='pathway'?{moved:true}:{})});s.history=s.history.filter(h=>h.id!==t.id);report.effect={from,to:{x:t.x,y:t.y,heading:t.heading}};}
 else if(key==='hashutCurse'){const test=rollD6(1,random)[0],passed=test<=profile(t).T;report.effect={test,passed,...magicDamage(s,t,passed?Math.ceil(rollD6(1,random)[0]/2):Math.ceil(rollD6(1,random)[0]/2)+2,passed?2:5,0,random,{ignoreArmour:!passed})};}
 else if(key==='ashStorm'){spellEffect(s,u,key,[u],{rules:[{rule:'stormOfAsh',value:9}],expiry:'START_OF_CASTING_PLAYER_NEXT_TURN'});report.effect={radius:9};}
 else if(key==='arrow'){spellEffect(s,u,key,[t],{rules:[{rule:'arrowAttraction'}],expiry:'START_OF_CASTING_PLAYER_NEXT_TURN'});report.effect={rerollOnes:true};}
 else if(key==='shield'){spellEffect(s,u,key,[u],{rules:[{rule:'ward',value:5}],expiry:'START_OF_CASTING_PLAYER_NEXT_TURN'});report.effect={ward:5};}
 else if(key==='coward')report.effect=magicPanic(s,u,t,random);
 else if(key==='urgency'){t.moved=false;t.spent=0;t.movementMode=null;t.charge=null;t.difficultThisMove=false;t.moveEvent=(t.moveEvent??0)+1;spellEffect(s,u,key,[t],{rules:[{rule:'arcaneUrgency'}],expiry:'END_CURRENT_PLAYER_TURN'});report.effect={moveAgain:true};}
 else if(key==='summoning')report.effect=magicDamage(s,t,rollD6(2,random).reduce((a,b)=>a+b,0),4,1,random);
 else if(key==='familiars')report.effect=assail(s,u,t,key,rollD6(2,random).reduce((a,b)=>a+b,0),2,0,random,{ignoreArmour:true});
 else if(key==='darkness'){spellEffect(s,u,key,[t],{mods:[{stat:'I',add:-2,min:1},{stat:'Ld',add:-2,min:2}],rules:[{block:'inspiringPresence'}],expiry:'START_OF_CASTING_PLAYER_NEXT_TURN'});report.effect={initiative:-2,leadership:-2};}
 // Daemonic Vessel: the caster only (the engine has no mounts or joined units).
 else if(key==='vessel'){spellEffect(s,u,key,[u],{mods:[{stat:'S',add:1,max:10},{stat:'A',add:1,max:10}],ap:1,expiry:'END_CURRENT_PLAYER_TURN'});report.effect={strength:1,attacks:1,ap:1};}
 else if(key==='vigour'){spellEffect(s,u,key,[t],{mods:[{stat:'M',add:1,max:10},{stat:'T',add:1,max:10},{stat:'I',add:1,max:10}],expiry:'END_CURRENT_PLAYER_TURN'});report.effect={movement:1,toughness:1,initiative:1};}
 // Steed of Shadows grants Fly (12) as a way to move; it does not move the unit.
 else if(key==='steed'){spellEffect(s,u,key,[t],{rules:[{rule:'fly',value:12}],expiry:'START_OF_CASTING_PLAYER_NEXT_TURN'});t.steededTurn=`${s.round}:${s.team}`;report.effect={fly:12};}
 else if(spell.template){s.vortices=s.vortices.filter(v=>!(v.caster===id&&(v.spell??'pillar')===key));s.vortexSeq=(s.vortexSeq??0)+1;const v={id:'V'+s.vortexSeq,spell:key,caster:id,team:u.team,x:point.x,y:point.y,radius:spell.template,cast:report.casting};s.vortices.push(v);report.effect={point:{x:point.x,y:point.y},vortex:v.id};}
 if(spell.type==='conveyance'&&t)(t.conveyed??={})[key]=`${s.round}:${s.team}`;
 return report;}
// ---- Vortices at the Start of Turn ----
// Every Start of Turn each vortex moves. A Pillar of Fire drifts D6″ along one of eight arrows
// and burns the enemy units it crosses (D3+3 Strength 3 hits, AP −2, Flaming). A Vortex of Chaos
// scatters D6″ on the scatter die (a Hit: it stays put) and strikes every unit it crosses, friend
// or foe (D6+1 Strength 3 hits, rolled for each unit); ending over a base, it is moved the least
// distance that clears every base. A vortex wholly off the battlefield, or whose caster has gone,
// is removed.
// Summon Elemental Spirit scatters as a Vortex of Chaos does (the same wording) but strikes only
// enemies, and no line of sight can be drawn over it. Phantasmagoria never moves and strikes no
// hits: it is dangerous terrain, and makes enemies that end a move within 12″ test for Panic.
export const VORTEX_RULES={pillar:{hits:random=>Math.ceil(rollD6(1,random)[0]/2)+3,strength:3,ap:2,flaming:true,enemiesOnly:true,scatter:'arrows'},vortexChaos:{hits:random=>rollD6(1,random)[0]+1,strength:3,ap:0,flaming:false,enemiesOnly:false,scatter:'die'},
 elementalSpirit:{hits:random=>Math.ceil(rollD6(1,random)[0]/2)+3,strength:4,ap:1,flaming:false,enemiesOnly:true,scatter:'die',blocksSight:true},
 phantasmagoria:{hits:null,dangerous:true,enemiesOnly:false,scatter:null,panicRange:12}};
// No line of sight crosses a vortex that blocks it (Summon Elemental Spirit).
function vortexBlocksSight(s,a,b){return (s?.vortices??[]).some(v=>VORTEX_RULES[v.spell]?.blocksSight&&pointSegment({x:v.x,y:v.y},a,b)<(v.radius??1.5)-EPS);}
// Dangerous terrain: a D6 for each model that starts, crosses or ends this move in it; each 1 costs
// a Wound. Only the models whose own bases touch it test.
function dangerousTests(s,u,circle,poses,random){
 const live=u.role==='warmachine'||isCharacter(u)?[{index:0,local:null}]:modelSquares(s,u).filter(m=>!m.dead).map(m=>({index:m.index,local:[[m.x,m.y],[m.x+m.size,m.y],[m.x+m.size,m.y+m.size],[m.x,m.y+m.size]]}));
 const square=(pose,m)=>m.local?m.local.map(([x,y])=>localPoint(pose,x,y)):corners(pose),list=poses?.length?poses:[u];
 const testing=live.filter(m=>list.some((p,i)=>circleGap(hull([...square(p,m),...square(list[Math.min(i+1,list.length-1)],m)]),circle)<EPS));
 const rolls=testing.map(m=>({model:m.index,roll:rollD6(1,random)[0]})),lost=rolls.filter(r=>r.roll===1).length,before=aliveCount(u);
 if(lost){removeCasualties(s,u,lost,random);wipeOut(s,u,random);}
 return {tests:rolls.length,rolls,hits:0,wounds:lost,unsaved:lost,dangerous:true,panic:lost&&u.x!==null?heavyCasualties(s,u,before,null,random):null};}
const vortexVictim=(s,v,u)=>!(VORTEX_RULES[v.spell??'pillar']??VORTEX_RULES.pillar).enemiesOnly||u.team!==(v.team??getUnit(s,v.caster)?.team);
// Wholly off the table: its centre more than its radius past an edge.
const vortexOffTable=(s,v)=>{const r=v.radius??1.5,b=boardOf(s);return v.x< -r||v.x>b.width+r||v.y< -r||v.y>b.height+r;};
// The scatter die: a Hit one time in three, otherwise one of eight arrows.
export function rollScatter(random=Math.random){const hit=Math.floor(random()*3)===0,angle=Math.floor(random()*8)*45;return {hit,angle};}
export function driftVortices(s,random=Math.random){const reports=[];
 for(const v of [...(s.vortices??[])]){const key=v.spell??'pillar',rule=VORTEX_RULES[key]??VORTEX_RULES.pillar,from={x:v.x,y:v.y};let angle,hit=false;if(!rule.scatter)continue;
  if(rule.scatter==='arrows')angle=Math.floor(random()*8)*45;else({hit,angle}=rollScatter(random));
  const distance=rollD6(1,random)[0],travel=hit?0:distance,a=rad(angle);v.x=from.x+Math.sin(a)*travel;v.y=from.y-Math.cos(a)*travel;
  const affected=[];if(travel>0)for(const u of combatants(s).filter(u=>u.x!==null&&aliveCount(u)>0&&vortexVictim(s,v,u)&&polygonGap([from,{x:v.x,y:v.y}],corners(u))<=(v.radius??1.5)+EPS))affected.push({id:u.id,...magicDamage(s,u,rule.hits(random),rule.strength,rule.ap,random,{flaming:rule.flaming})});
  const report={id:v.id??v.caster,spell:key,caster:v.caster,from,to:{x:v.x,y:v.y},distance:travel,hit,angle,affected};
  if(key!=='pillar'&&!vortexOffTable(s,v)){const shift=displaceVortex(s,v,angle);if(shift){report.displaced=shift;v.x=shift.point.x;v.y=shift.point.y;report.to={x:v.x,y:v.y};}}
  reports.push(report);}
 s.vortices=(s.vortices??[]).filter(v=>!vortexOffTable(s,v)&&getUnit(s,v.caster)?.x!=null);return reports;}
// The least move that leaves a vortex touching no base: the nearest point outside every base
// grown by the template's radius (edges pushed out, corners rounded). Equally near points are
// settled by a labelled convention: the one nearest the scatter direction, then clockwise.
function displaceVortex(s,v,angle=0){
 const r=v.radius??1.5,R=r+.005,c={x:v.x,y:v.y},bases=combatants(s).filter(u=>u.x!==null&&aliveCount(u)>0).map(u=>corners(u)),clear=p=>bases.every(poly=>circleGap(poly,{x:p.x,y:p.y,r})>1e-6);
 if(clear(c))return null;
 const segs=[],points=[],cand=[];
 for(const p of bases){const cx=p.reduce((n,q)=>n+q.x,0)/p.length,cy=p.reduce((n,q)=>n+q.y,0)/p.length;for(let i=0;i<p.length;i++){const a=p[i],e=p[(i+1)%p.length],len=Math.hypot(e.x-a.x,e.y-a.y)||1;let n={x:(e.y-a.y)/len,y:-(e.x-a.x)/len};if(((a.x+e.x)/2-cx)*n.x+((a.y+e.y)/2-cy)*n.y<0)n={x:-n.x,y:-n.y};segs.push([{x:a.x+n.x*R,y:a.y+n.y*R},{x:e.x+n.x*R,y:e.y+n.y*R}]);points.push(a);}}
 const project=(p,[a,b])=>{const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0;return {x:a.x+t*dx,y:a.y+t*dy};};
 const lines=(a,b,c2,d)=>{const r1={x:b.x-a.x,y:b.y-a.y},q={x:d.x-c2.x,y:d.y-c2.y},den=r1.x*q.y-r1.y*q.x;if(Math.abs(den)<1e-12)return [];const t=((c2.x-a.x)*q.y-(c2.y-a.y)*q.x)/den,w=((c2.x-a.x)*r1.y-(c2.y-a.y)*r1.x)/den;return t>=-1e-9&&t<=1+1e-9&&w>=-1e-9&&w<=1+1e-9?[{x:a.x+t*r1.x,y:a.y+t*r1.y}]:[];};
 const segCircle=(a,b,q)=>{const d={x:b.x-a.x,y:b.y-a.y},f={x:a.x-q.x,y:a.y-q.y},A=d.x*d.x+d.y*d.y,B=2*(f.x*d.x+f.y*d.y),C=f.x*f.x+f.y*f.y-R*R,disc=B*B-4*A*C;if(disc<0||A<1e-12)return [];const out=[];for(const sg of [-1,1]){const t=(-B+sg*Math.sqrt(disc))/(2*A);if(t>=-1e-9&&t<=1+1e-9)out.push({x:a.x+t*d.x,y:a.y+t*d.y});}return out;};
 const twoCircles=(p,q)=>{const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<1e-12||d>2*R)return [];const h=Math.sqrt(Math.max(0,R*R-d*d/4)),m={x:(p.x+q.x)/2,y:(p.y+q.y)/2},ux=(q.x-p.x)/d,uy=(q.y-p.y)/d;return [{x:m.x-uy*h,y:m.y+ux*h},{x:m.x+uy*h,y:m.y-ux*h}];};
 for(const sg of segs)cand.push(project(c,sg));
 for(const q of points){const d=Math.hypot(c.x-q.x,c.y-q.y);if(d>1e-12)cand.push({x:q.x+(c.x-q.x)/d*R,y:q.y+(c.y-q.y)/d*R});}
 for(let i=0;i<segs.length;i++)for(let j=i+1;j<segs.length;j++)cand.push(...lines(segs[i][0],segs[i][1],segs[j][0],segs[j][1]));
 for(const sg of segs)for(const q of points)cand.push(...segCircle(sg[0],sg[1],q));
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)cand.push(...twoCircles(points[i],points[j]));
 const ok=cand.filter(clear).map(p=>({p,d:Math.hypot(p.x-c.x,p.y-c.y)})).sort((a,b)=>a.d-b.d);if(!ok.length)return null;
 const turn=o=>((Math.atan2(o.p.x-c.x,-(o.p.y-c.y))*180/Math.PI-angle)%360+360)%360,ties=ok.filter(o=>o.d<=ok[0].d+.01).sort((a,b)=>turn(a)-turn(b));
 return {point:ties[0].p,distance:ties[0].d,ties:ties.length};
}
// The caster may end its own Remains in Play spell at the start of its Strategy phase, before
// the wizard casts.
export function canEndVortex(s,ref){const v=findVortex(s,ref),c=v&&getUnit(s,v.caster);return !!c&&s.stage==='strategy'&&c.team===s.team&&!s.pendingSpell&&!c.castThisTurn?.length;}
export function endVortex(s,ref){if(!canEndVortex(s,ref))throw Error('End a Remains in Play spell at the start of your Strategy phase, before the wizard casts.');const v=findVortex(s,ref);s.vortices=s.vortices.filter(x=>x!==v);return v;}
// ---- Remains in Play: dispelling a vortex later ----
// A vortex record: {id,spell,caster,team,x,y,radius,cast,dispelTried}. Older records without an
// id or spell are a Pillar of Fire, found by their caster.
function findVortex(s,ref){return (s.vortices??[]).find(v=>v.id===ref)??(s.vortices??[]).find(v=>v.caster===ref);}
const vortexTeam=(s,v)=>v.team??getUnit(s,v.caster)?.team;
const turnKey=s=>`${s.round}:${s.team}`;
// Wizards who may dispel an enemy vortex: in range (18″, 24″ at Level 3 or more) of its caster or
// of the template, not fleeing, not in combat.
export function vortexDispellers(s,ref){const v=findVortex(s,ref);if(!v)return [];const caster=getUnit(s,v.caster),team=vortexTeam(s,v);return s.units.filter(u=>u.role==='wizard'&&u.team!==team&&u.x!==null&&aliveCount(u)>0&&!u.fleeing&&!u.engaged&&!u.dispelExhausted&&!s.dispelBlocked?.[u.team]&&Math.min(caster?.x!=null?gap(u,caster):Infinity,circleGap(corners(u),{x:v.x,y:v.y,r:v.radius??1.5}))<=(u.level>=3?24:18)+EPS);}
// The opposing side may try once to dispel each vortex in its own Strategy phase (Conjuration).
export function canDispelVortex(s,ref){const v=findVortex(s,ref);return !!v&&s.stage==='strategy'&&!s.pendingSpell&&vortexTeam(s,v)!==s.team&&v.dispelTried!==turnKey(s);}
// The dispel must beat the spell's printed casting value, not the roll it was cast with, even
// after a Perfect Invocation.
export function dispelVortex(s,ref,random=Math.random,mode='wizard',dispellerId=null){
 const v=findVortex(s,ref);if(!v)throw Error('No such spell remains in play.');const spell=SPELLS[v.spell??'pillar'];
 if(!canDispelVortex(s,ref))throw Error(v.dispelTried===turnKey(s)?`${spell.name} has already faced a dispel this turn.`:'Dispel a Remains in Play spell in your own Strategy phase (Conjuration).');
 if(!['wizard','fated'].includes(mode))throw Error('Choose a dispel method.');
 const wizard=mode==='wizard'?vortexDispellers(s,ref).find(u=>!dispellerId||u.id===dispellerId):null;if(mode==='wizard'&&!wizard)throw Error('No opposing wizard is in dispel range.');
 if(mode==='fated'&&!fatedDispelAvailable(s,s.team))throw Error('Fated Dispel already used.');
 v.dispelTried=turnKey(s);if(mode==='fated')useFated(s,s.team);
 const dice=rollD6(2,random),double1=dice[0]===1&&dice[1]===1,total=dice[0]+dice[1]+(wizard?Math.ceil(wizard.level/2):0);
 const result={mode,by:wizard?.id??null,vortex:v.id??v.caster,spell:v.spell??'pillar',dice,total,beat:spell.cast,success:!double1&&(dice[0]===6&&dice[1]===6||total>spell.cast)};
 if(double1&&wizard){result.miscast=miscast(s,wizard,random,{dispel:true});if(result.miscast.dispelled)result.success=true;}
 if(result.success)s.vortices=s.vortices.filter(x=>x!==v);return result;}
export function canEngineerReroll(s){const u=getUnit(s,'A6'),r=s.rocket;return !!u&&u.x!==null&&!u.fleeing&&!u.engaged&&!u.engineerUsed&&r.x!==null&&Math.hypot(u.x-r.x,u.y-r.y)<=profile(u).Ld+EPS;}
export function engineerReroll(s,dice,which,random=Math.random){if(!canEngineerReroll(s))throw Error('The Daemonsmith cannot assist the Deathshrieker now.');if(!['artillery','scatter'].includes(which))throw Error('Choose one Artillery or Scatter die.');const next={...dice},fresh=rollRocketDice(random);next[which]=fresh[which];if(which==='scatter')next.hitArrow=fresh.hitArrow;getUnit(s,'A6').engineerUsed=true;return next;}

// Ranged attacks are measured from individual model centres. The front 90-degree
// arc extends from each front base corner; other regiments block a clear shot.
// The models that shoot: the front rank, and with Volley Fire half of each rank behind it, but not
// for a unit that has moved this turn or that is Standing & Shooting.
const hasMoved=u=>!!u.movedThisTurn||(u.spent??0)>EPS;
function shootingModels(s,u,{reaction=false}={}){const cells=modelSquares(s,u).filter(m=>!m.dead),volley=missileWeapon(u)?.volley&&!reaction&&!hasMoved(u);return cells.filter(m=>m.row===0||(volley&&cells.filter(v=>v.row===m.row).indexOf(m)<Math.ceil(cells.filter(v=>v.row===m.row).length/2)));}
function shotPoint(u,m){return localPoint(u,m.x+m.size/2,m.y+m.size/2);}
// A character in a unit sees past its own unit; the unit is seen as a whole.
function sightBlocked(s,u,t,a,b){return terrainBlocksSight(s,a,b)||vortexBlocksSight(s,a,b)||s.units.some(v=>v.x!==null&&v.id!==u.id&&v.id!==t.id&&!v.joined&&v.id!==u.joined&&v.id!==t.joined&&aliveCount(v)>0&&(()=>{const poly=corners(v);return poly.some((p,i)=>intersects(a,b,p,poly[(i+1)%4]))||inside(a,poly)||inside(b,poly);})());}
function modelCanSee(s,u,t,m,range){const origin=shotPoint(u,m),a=rad(-heading(u)),targets=[{x:t.x,y:t.y},...corners(t)];return targets.some(point=>{const dx=point.x-origin.x,dy=point.y-origin.y,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);return ly<0&&Math.abs(lx)<=-ly+m.size/2+EPS&&Math.hypot(dx,dy)<=range+EPS&&!sightBlocked(s,u,t,origin,point);});}
export function canShoot(s,u){return s.stage==='shooting'&&u?.team===s.team&&u.role==='missile'&&u.x!==null&&aliveCount(u)>0&&!u.shot&&!u.engaged&&!u.fleeing&&!u.charge&&u.movementMode!=='march'&&!u.raiding;}
export function shootingPlan(s,u,t,{reaction=false}={}){
 if(!u||!t||u.team===t.team||u.x===null||t.x===null||u.role!=='missile'||aliveCount(u)===0||aliveCount(t)===0)return {error:'Choose an enemy target for a missile regiment.'};
 if(u.raiding)return {error:`${u.name} is destroying a treasure trove and cannot shoot.`};
 // Stand & Shoot: missile weapons, line of sight, not fleeing or engaged, and the charger at least
 // its own Movement away (Quick Shot weapons ignore that distance; Cumbersome ones cannot react).
 if(reaction){const w=missileWeapon(u);if(u.engaged||u.fleeing)return {error:'Engaged or fleeing regiments cannot Stand & Shoot.'};if(w?.cumbersome)return {error:`${w.name}: a Cumbersome weapon cannot Stand & Shoot.`};if(!w?.quickShot&&gap(u,t)+EPS<profile(t).M)return {error:`Charger is too close for Stand & Shoot (less than M${profile(t).M}″).`};}
 else if(!canShoot(s,u))return {error:'This regiment cannot shoot in this phase.'};
 else if(t.engaged)return {error:'Cannot shoot at a regiment in combat.'};
 else if(screenedCharacter(s,u,t))return {error:SCREENED};
 const weapon=missileWeapon(u),range=weapon.range,half=range/2,clear=shootingModels(s,u,{reaction}).filter(m=>modelCanSee(s,u,t,m,reaction?Math.max(range,gap(u,t)+size(t).w):range));
 if(!clear.length)return {error:'Target is outside the front arc, range, or clear line of sight.',range,half};
 const distance=gap(u,t),models=clear.map(m=>{const point=shotPoint(u,m),poly=corners(t),modelDistance=Math.min(...poly.map((p,i)=>pointSegment(point,p,poly[(i+1)%4])));return {index:m.index,bs:m.command==='C'?championProfile(u).BS:profile(u).BS,distance:modelDistance,long:!reaction&&modelDistance>half+EPS};}),long=models.some(m=>m.long),modifiers=[];
 // Moving this turn costs −1 to hit; a unit that held its ground has not moved.
 if(!reaction&&hasMoved(u)&&!weapon.ignoreMove&&!weapon.quickShot)modifiers.push({label:weapon.ponderous?'Moved (Ponderous)':'Moved',value:weapon.ponderous?-2:-1});
 if(long)modifiers.push({label:'Long range',value:weapon.ignoreLong?0:-1});
 if(reaction)modifiers.push({label:'Stand & Shoot',value:weapon.ignoreStand?0:-1});
 if(weapon.multiple)modifiers.push({label:'Multiple Shots D3',value:0});
 const modifier=modifiers.reduce((n,v)=>n+v.value,0),toHit=Math.max(2,Math.min(7,7-profile(u).BS-modifier));
 const hitNumbers=models.map(m=>Math.max(2,Math.min(7,7-m.bs-(modifier+(long&&!m.long&&!weapon.ignoreLong?1:0)))));
 return {target:t.id,weapon,range,half,distance,band:reaction?'Stand & Shoot':models.every(m=>m.long)?'far':long?'mixed':'close',shooters:clear.length,closeShooters:models.filter(m=>!m.long).length,farShooters:models.filter(m=>m.long).length,models,modifiers,modifier,toHit,hitLabel:Math.min(...hitNumbers)===Math.max(...hitNumbers)?`${hitNumbers[0]}+`:`${Math.min(...hitNumbers)}+–${Math.max(...hitNumbers)}+`,reaction};
}
// Every enemy unit and war machine (a war machine is shot at its own Toughness and Wounds, with
// the crew's armour).
export function shootingTargets(s,u){return combatants(s).filter(t=>t.team!==u?.team&&t.x!==null&&aliveCount(t)>0).map(t=>({unit:t,plan:shootingPlan(s,u,t)}));}
export function availableShots(s){return s.stage==='shooting'?s.units.filter(u=>canShoot(s,u)&&shootingTargets(s,u).some(t=>!t.plan.error)):[];}
export function finishShooting(s,id){const u=getUnit(s,id);if(!canShoot(s,u))throw Error('This regiment cannot finish shooting now.');u.shot=true;return u;}
function shootDice(count,random){return Array.from({length:count},()=>1+Math.floor(random()*6));}
function stormPenalty(s,u){return s.units.some(w=>w.x!==null&&w.team!==u.team&&hasRule(w,'stormOfAsh')&&Math.hypot(w.x-u.x,w.y-u.y)<=(effectRule(w,'stormOfAsh').value??9)+EPS)?1:0;}
function fireMissiles(s,u,t,plan,random=Math.random){
 const before=aliveCount(t);
 const dice={shots:plan.weapon.multiple?shootDice(plan.shooters,random).map(d=>Math.ceil(d/2)):[],hit:[],reroll:[],wound:[],save:[],ward:[]};
 const shots=plan.weapon.multiple?dice.shots.reduce((a,b)=>a+b,0):plan.shooters,hitTargets=plan.models.flatMap((m,i)=>Array.from({length:plan.weapon.multiple?dice.shots[i]:1},()=>Math.max(2,Math.min(stormPenalty(s,u)?6:7,7-m.bs-(plan.modifiers.filter(v=>v.label!=='Long range').reduce((n,v)=>n+v.value,0))-(m.long&&!plan.weapon.ignoreLong? -1:0)+stormPenalty(s,u)))));
 dice.hit=shootDice(shots,random);if(hasRule(t,'arrowAttraction')){for(const [i,n]of dice.hit.entries())if(n===1){const reroll=shootDice(1,random)[0];dice.reroll.push(reroll);dice.hit[i]=reroll;}}
 // Characters in the target unit are hit only when fewer than five rank and file remain.
 const share=hitShares(s,t,dice.hit.filter((n,i)=>n>=hitTargets[i]).length),hits=share.unit,characters=share.chars.map(([c,n])=>({id:c.id,...characterHits(s,u,c,n,plan.weapon,random)}));
 const toWound=Math.max(2,Math.min(6,4+shotToughness(t)-plan.weapon.strength));dice.wound=shootDice(hits,random);if(plan.weapon.hailshot&&plan.shooters>=10){dice.woundReroll=[];for(const [i,n]of dice.wound.entries())if(n===1){const r=shootDice(1,random)[0];dice.woundReroll.push(r);dice.wound[i]=r;}}
 // Armour Bane (N): each wound from a natural 6 improves the weapon's AP by N for its save.
 const wounds=dice.wound.filter(n=>n>=toWound).length,banes=plan.weapon.armourBane?dice.wound.filter(n=>n===6).length:0;
 const toSave=Math.min(7,Math.max(2,armourSave(t)+plan.weapon.ap+apBonus(u)));dice.save=shootDice(wounds,random);
 let unsaved=Math.min(remainingWounds(t),dice.save.filter((n,i)=>n<(i<banes?Math.min(7,toSave+plan.weapon.armourBane):toSave)).length);const ward=wardSave(t);if(ward<=6){dice.ward=shootDice(unsaved,random);unsaved=dice.ward.filter(n=>n<ward).length;}removeCasualties(s,t,unsaved,random);wipeOut(s,t,random);const panic=heavyCasualties(s,t,before,u,random);
 return {...plan,from:u.id,to:t.id,shots,hits,wounds,unsaved,toWound,toSave,hitTargets,dice,panic,...(characters.length?{characters}:{})};
}
// Shooting at a unit joined by characters: while it has five or more rank and file, every hit is
// the unit's. With fewer, one hit goes to each of its models first, then the rest are shared as
// evenly as possible between the unit and each character (the unit first).
function hitShares(s,t,n){const chars=joinedCharacters(s,t);if(!chars.length||aliveCount(t)>=5)return {unit:n,chars:[]};const first=Math.min(n,aliveCount(t)),rest=n-first,groups=chars.length+1,per=i=>Math.floor(rest/groups)+(i<rest%groups?1:0);return {unit:first+per(0),chars:chars.map((c,i)=>[c,per(i+1)]).filter(([,k])=>k>0)};}
function characterHits(s,u,c,n,weapon,random){const toWound=Math.max(2,Math.min(6,4+shotToughness(c)-weapon.strength)),wound=shootDice(n,random),wounds=wound.filter(x=>x>=toWound).length,banes=weapon.armourBane?wound.filter(x=>x===6).length:0,toSave=Math.min(7,Math.max(2,armourSave(c)+weapon.ap+apBonus(u))),save=shootDice(wounds,random);let unsaved=save.filter((x,i)=>x<(i<banes?Math.min(7,toSave+weapon.armourBane):toSave)).length;const ward=wardSave(c);let wardDice=[];if(ward<=6){wardDice=shootDice(unsaved,random);unsaved=wardDice.filter(x=>x<ward).length;}unsaved=Math.min(unsaved,remainingWounds(c));removeCasualties(s,c,unsaved,random);return {hits:n,wounds,unsaved,toWound,toSave,dice:{wound,save,ward:wardDice}};}
// "Look Out, Sir!": a character in a unit with five or more rank and file, hit by shooting, is hit
// on a 1; on a 2+ a member of the unit is hit in its place.
export function lookOutSir(s,cell,random){const c=cell.unit;if(!c?.joined)return null;const host=getUnit(s,c.joined);if(!host||aliveCount(host)<5)return null;const roll=rollD6(1,random)[0],saved=roll>=2;if(saved){cell.unit=host;cell.model=null;}return {character:c.id,roll,saved};}
export function shoot(s,id,target,random=Math.random){const u=getUnit(s,id),t=getUnit(s,target),plan=shootingPlan(s,u,t);if(plan.error)throw Error(plan.error);const result=fireMissiles(s,u,t,plan,random);u.shot=true;s.lastShooting=result;return result;}

// Charge routes use one measured leading-corner wheel, then a free alignment wheel.
// Face selection is fixed by the charger's starting position.
// A unit's front, flank and rear arcs run out from the corners of its base at 45°, so a charger
// flush against the front of a shallow unit is in its front arc even beyond its centre diagonals.
export function chargeFace(u,t){
 // An attacker whose front edge lies flush against one of the target's faces fights that face,
 // however much wider it is than the target.
 const flush=flushFace(u,t);if(flush)return flush;
 const a=rad(-heading(t)),c=Math.cos(a),si=Math.sin(a),{w}=size(u),b=w/5,counts={front:0,rear:0,'left flank':0,'right flank':0};
 for(let i=0;i<5;i++){const p=localPoint(u,(i-2)*b,-size(u).h/2),dx=p.x-t.x,dy=p.y-t.y,x=dx*c-dy*si,y=dx*si+dy*c;counts[Math.abs(y)-size(t).h/2>=Math.abs(x)-size(t).w/2-1e-6?y<0?'front':'rear':x<0?'left flank':'right flank']++;}
 return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
}
// The front (vision) arc also runs out from the front corners at 45°: a point is in it when it is
// ahead of the front edge and no further past a front corner sideways than it is ahead. A target
// is in the arc when any part of it is.
function inFrontArc(u,p){const a=rad(-heading(u)),dx=p.x-u.x,dy=p.y-u.y,x=dx*Math.cos(a)-dy*Math.sin(a),y=dx*Math.sin(a)+dy*Math.cos(a),{w,h}=size(u),ahead=-y-h/2;return ahead>=-EPS&&Math.abs(x)-w/2<=ahead+EPS;}
export function inVisionArc(u,t){const poly=corners(t),points=[{x:t.x,y:t.y}];for(let i=0;i<4;i++){const a=poly[i],b=poly[(i+1)%4];for(let k=0;k<10;k++)points.push({x:a.x+(b.x-a.x)*k/10,y:a.y+(b.y-a.y)*k/10});}return points.some(p=>inFrontArc(u,p));}
function directChargePlan(s,u,t){
 if(!u||!t||u.x===null||t.x===null||u.team===t.team)return {error:'Choose an enemy regiment.'};
 if(u.rallied)return {error:'A regiment that rallied this turn cannot charge.'};
 if(u.engaged)return {error:'Engaged in combat: it cannot charge.'};
 if(u.fleeing||aliveCount(u)===0||aliveCount(t)===0)return {error:'Choose an enemy regiment.'};
 if(gap(u,t)>chargeReach(u)+EPS)return {error:`Beyond the maximum ${chargeReach(u)}″ charge range.`};
 const a=rad(-heading(u)),dx=t.x-u.x,dy=t.y-u.y,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);
 if(!inVisionArc(u,t))return {error:'The target is outside the charger’s front arc.'};
 const face=chargeFace(u,t),offset={'front':0,'rear':180,'left flank':-90,'right flank':90}[face],out=normalize(heading(t)+offset),desired=normalize(out+180),angle=((desired-heading(u)+540)%360)-180;
 if(Math.abs(angle)>90+EPS)return {error:'This charge needs more than a 90° wheel.'};
 const after=Math.abs(angle)>EPS?wheelPose(u,angle):{...u},a2=rad(desired),f={x:Math.sin(a2),y:-Math.cos(a2)},right={x:Math.cos(a2),y:Math.sin(a2)};
 const own=size(u),theirs=size(t),targetDepth=face.includes('flank')?theirs.w:theirs.h,targetWidth=face.includes('flank')?theirs.h:theirs.w;
 const rel={x:t.x-after.x,y:t.y-after.y},distance=rel.x*f.x+rel.y*f.y-(own.h+targetDepth)/2,lateral=rel.x*right.x+rel.y*right.y;
 if(distance< -EPS)return {error:'No forward approach to the target face.'};
 // Require maximum possible frontage; do not silently slide a unit sideways.
 if(Math.abs(lateral)>Math.abs(own.w-targetWidth)/2+.02)return {error:'Line up the frontages first. Offset / closing-the-door charges are not supported yet.'};
 const end=forwardPose(after,Math.max(0,distance)),cost=wheelCost(angle,u)+Math.max(0,distance),plan={start:{...u},afterWheel:after,contact:end,end,angle,distance:Math.max(0,distance),wheelCost:wheelCost(angle,u),alignAngle:0,cost,face,target:t.id};
 if(cost>chargeReach(u)+EPS)return {...plan,error:`The wheel and approach exceed the maximum ${chargeReach(u)}″ charge range.`};
 if(offBoard(end,s))return {...plan,error:'Charge ends off the battlefield.'};
 const others=combatants(s).filter(v=>v.x!==null&&v.id!==u.id&&v.id!==t.id),clear=pose=>!others.some(v=>blocksContact(u,t,v,pose));
 if(!clear(end))return {...plan,error:'Another regiment blocks the contact position.'};
 if(terrainBlocks(s,corners(end)))return {...plan,error:'Impassable terrain blocks the contact position.'};
 const steps=Math.max(1,Math.ceil(Math.abs(angle)/.25));let prev=corners(u).slice(0,2);
 for(let i=1;i<=steps;i++){
  const pose=wheelPose(u,angle*i/steps),front=corners(pose).slice(0,2),sweep=hull([...prev,...front]);
  if(offBoard(pose,s)||polygonGap(sweep,corners(t))<EPS||others.some(v=>polygonGap(sweep,corners(v))<1-EPS)||terrainBlocks(s,sweep))return {...plan,error:'The charge wheel is obstructed.'};prev=front;
 }
 const swept=hull([...corners(after),...corners(end)]);
 if(others.some(v=>!sharesCombat(u,t,v)&&polygonGap(swept,corners(v))<1-EPS))return {...plan,error:'Another regiment blocks the charge path.'};
 if(terrainBlocks(s,swept))return {...plan,error:'Impassable terrain blocks the charge path.'};
 return plan;
}
// A friend already fighting the target may be touched by a charger (several units can charge one
// enemy, and charge into a combat), but not overlapped; every other unit stays 1" away.
function sharesCombat(u,t,v){return v.team===u.team&&engagedWith(v,t);}
function blocksContact(u,t,v,pose){return sharesCombat(u,t,v)?overlaps(pose,v):gap(pose,v)<1-EPS;}
// The aligned pose after contact: flush against the face u meets, turned square to it and slid
// no further than needed to keep maximum frontage (the free alignment wheel). When that spot is
// taken (another charger already holds part of the face), it slides along the face to the
// nearest free spot that still keeps at least one model in contact.
function alignedContact(u,t,face=chargeFace(u,t),free=null){
 const out=normalize(heading(t)+{front:0,rear:180,'left flank':-90,'right flank':90}[face]),own=size(u),theirs=size(t),depth=face.includes('flank')?theirs.w:theirs.h,width=face.includes('flank')?theirs.h:theirs.w;
 const oa=rad(out),normal={x:Math.sin(oa),y:-Math.cos(oa)},right={x:Math.cos(oa),y:Math.sin(oa)},lateral=(u.x-t.x)*right.x+(u.y-t.y)*right.y,limit=Math.abs(own.w-width)/2,centering=Math.max(-limit,Math.min(limit,lateral));
 const at=offset=>({...u,x:t.x+normal.x*(own.h+depth)/2+right.x*offset,y:t.y+normal.y*(own.h+depth)/2+right.y*offset,heading:normalize(out+180)}),best=at(centering);
 if(!free||free(best))return best;
 const reach=(own.w+width)/2-baseSize(u)/25.4,steps=[];for(let d=.1;centering+d<=reach+EPS||centering-d>=-reach-EPS;d+=.1){if(centering+d<=reach+EPS)steps.push(centering+d);if(centering-d>=-reach-EPS)steps.push(centering-d);}
 return steps.map(at).find(free)??best;
}
// The pose after closing the door: turned flush to the face by pivoting about the point where the
// charger touched it, so it may overhang the corner of the face; slid along the face only as far as
// needed to keep at least one model in contact.
const FACE_EDGE={front:[0,1],'right flank':[1,2],rear:[2,3],'left flank':[3,0]};
function flushFace(u,t){
 const [fl,fr]=corners(u),c=corners(t),ux=fr.x-fl.x,uy=fr.y-fl.y,ul=Math.hypot(ux,uy);if(ul<EPS)return null;
 for(const [face,[i,j]]of Object.entries(FACE_EDGE)){const a=c[i],b=c[j],fx=b.x-a.x,fy=b.y-a.y,fl2=Math.hypot(fx,fy);if(fl2<EPS)continue;
  // Facing each other: the two edges run opposite ways, within a degree, and touch along a length.
  if((ux*fx+uy*fy)/(ul*fl2)>-Math.cos(Math.PI/180))continue;
  const nx=-fy/fl2,ny=fx/fl2,apart=Math.abs((fl.x-a.x)*nx+(fl.y-a.y)*ny);if(apart>.15)continue;
  const along=p=>((p.x-a.x)*fx+(p.y-a.y)*fy)/fl2,lo=Math.max(0,Math.min(along(fl),along(fr))),hi=Math.min(fl2,Math.max(along(fl),along(fr)));if(hi-lo>.1)return face;}
 return null;
}
function touchesFace(pose,t,face){const c=corners(t),[i,j]=FACE_EDGE[face],[fl,fr]=corners(pose);return Math.min(pointSegment(fl,c[i],c[j]),pointSegment(fr,c[i],c[j]),pointSegment(c[i],fl,fr),pointSegment(c[j],fl,fr))<.15;}
function closeTheDoor(u,t,face){
 const out=normalize(heading(t)+{front:0,rear:180,'left flank':-90,'right flank':90}[face]),own=size(u),theirs=size(t),depth=face.includes('flank')?theirs.w:theirs.h,width=face.includes('flank')?theirs.h:theirs.w;
 const oa=rad(out),normal={x:Math.sin(oa),y:-Math.cos(oa)},right={x:Math.cos(oa),y:Math.sin(oa)},poly=corners(t),[fl,fr]=corners(u);
 // The point of contact: the place along the charger's front edge nearest the target.
 const near=p=>Math.min(...poly.map((q,i)=>pointSegment(p,q,poly[(i+1)%4]))),f=Array.from({length:21},(_,i)=>i/20).sort((a,b)=>near({x:fl.x+(fr.x-fl.x)*a,y:fl.y+(fr.y-fl.y)*a})-near({x:fl.x+(fr.x-fl.x)*b,y:fl.y+(fr.y-fl.y)*b}))[0];
 const p={x:fl.x+(fr.x-fl.x)*f,y:fl.y+(fr.y-fl.y)*f},along=(p.x-t.x)*right.x+(p.y-t.y)*right.y,reach=(own.w+width)/2-baseSize(u)/25.4;
 // Facing the target, the charger's front-left corner lies half a frontage along the face's right-hand direction from its centre.
 const offset=Math.max(-reach,Math.min(reach,along-own.w/2+f*own.w));
 return {...u,x:t.x+normal.x*(own.h+depth)/2+right.x*offset,y:t.y+normal.y*(own.h+depth)/2+right.y*offset,heading:normalize(out+180)};
}
export function chargePlan(s,u,t){
 if(u?.joined)return {error:'A character in a unit charges with its unit.'};
 if(u&&hasRule(u,'noCharge'))return {error:'Earthen Ramparts: this unit cannot charge.'};
 if(u&&s.round===1&&(u.scouted||u.vanguarded))return {error:u.scouted?'Deployed as Scouts: it cannot charge in its first turn.':'Made a Vanguard move: it cannot charge in its first turn.'};
 const direct=directChargePlan(s,u,t);if(!direct.error)return direct;
 if(!u||!t||u.x===null||t.x===null||u.team===t.team||u.engaged||u.fleeing||u.rallied||gap(u,t)>chargeReach(u)+EPS||/front arc/.test(direct.error))return direct;
 const face=chargeFace(u,t),offset={front:0,rear:180,'left flank':-90,'right flank':90}[face],out=normalize(heading(t)+offset),desired=normalize(out+180),own=size(u),theirs=size(t),depth=face.includes('flank')?theirs.w:theirs.h,width=face.includes('flank')?theirs.h:theirs.w;
 const oa=rad(out),normal={x:Math.sin(oa),y:-Math.cos(oa)},right={x:Math.cos(oa),y:Math.sin(oa)},others=combatants(s).filter(v=>v.x!==null&&v.id!==u.id&&v.id!==t.id),limit=chargeReach(u);
 // Two passes: first square up on the face for maximum frontage (with the free alignment) at any
 // wheel that allows it; only if none does, close the door about the point of contact.
 const search=allowDoor=>{let best=null;
 for(let angle=-90;angle<=90;angle+=5){
  const after=Math.abs(angle)>EPS?wheelPose(u,angle):{...u},wheel=wheelCost(angle,u);if(wheel>=limit||offBoard(after,s))continue;
  let blocked=false,previous=corners(u).slice(0,2);
  for(let i=1,n=Math.ceil(Math.abs(angle)/2);i<=n;i++){const pose=wheelPose(u,angle*i/n),front=corners(pose).slice(0,2),sweep=hull([...previous,...front]);if(offBoard(pose,s)||polygonGap(sweep,corners(t))<EPS||others.some(v=>!sharesCombat(u,t,v)&&polygonGap(sweep,corners(v))<1-EPS)||terrainBlocks(s,sweep)){blocked=true;break;}previous=front;}
  if(blocked)continue;
  const remaining=limit-wheel;
  for(let d=.1;d<=remaining+.1;d+=.1){
   const contact=forwardPose(after,Math.min(d,remaining));if(offBoard(contact,s)||others.some(v=>blocksContact(u,t,v,contact))||terrainBlocks(s,corners(contact))){blocked=true;break;}
   if(gap(contact,t)>.12)continue;
   // The face is the one the charger's position gave when the charge was declared; a charger on the
   // border of two arcs may read differently on contact, which is fine while it touches that face.
   if(chargeFace(contact,t)!==face&&!touchesFace(contact,t,face))break;
   const fits=pose=>!offBoard(pose,s)&&gap(pose,t)<=.02&&!others.some(v=>blocksContact(u,t,v,pose))&&!terrainBlocks(s,corners(pose));
   const alignAngle=((desired-heading(contact)+540)%360)-180,shared=others.some(v=>sharesCombat(u,t,v)),allowed=.2+2*own.w*Math.sin(rad(Math.abs(alignAngle))/2)+(shared?own.w+width:0);
   let end=alignedContact(contact,t,face,fits),slide=Math.hypot(end.x-contact.x,end.y-contact.y),door=false;
   // Closing the door: when squaring up on the middle of the face would need a long slide, the
   // charger pivots about its point of contact instead and ends flush where it touched.
   if(allowDoor&&(slide>allowed||!fits(end))){const pivot=closeTheDoor(contact,t,face);if(fits(pivot)){end=pivot;slide=Math.hypot(end.x-contact.x,end.y-contact.y);door=true;}}
   if(Math.abs(alignAngle)>90+EPS||slide>allowed+(door?baseSize(u)/25.4:0)||!fits(end))break;
   const swept=hull([...corners(after),...corners(contact)]);if(others.some(v=>!sharesCombat(u,t,v)&&polygonGap(swept,corners(v))<1-EPS)||terrainBlocks(s,swept))break;
   const plan={start:{...u},afterWheel:after,contact,end,angle,distance:Math.min(d,remaining),wheelCost:wheel,alignAngle,cost:wheel+Math.min(d,remaining),face,target:t.id};
   if(!best||plan.cost<best.cost)best=plan;break;
  }
 }
 return best;};
 return search(false)??search(true)??direct;
}
export function declareCharge(s,id,target){
 const u=getUnit(s,id),t=getUnit(s,target);
 if(s.stage!=='movement'||s.movementStep!=='declare'||!canAct(s,u))throw Error('Declare charges before Remaining Moves with an unengaged regiment.');
 if(isImpetuous(s,u)&&u.impetuousTest===null)throw Error(`${u.name} is Impetuous: roll its Impetuous test before declaring a charge.`);
 const p=chargePlan(s,u,t);if(p.error)throw Error(p.error);
 // One reaction per charged unit: a target that has already reacted this turn keeps it, a war
 // machine or a unit already in combat can only Hold.
 const earlier=t.reaction?.round===s.round&&t.reaction.team===s.team?t.reaction.choice:null;
 const reaction=t.role==='warmachine'||t.engaged?'hold':earlier?(earlier==='flee'?'flee':'hold'):'pending';
 u.charge={target,status:'declared',reaction,initialPlan:p};s.history=[];return {...p,reaction};
}
export function canStandShoot(s,defender,charger){return !!defender&&!!charger&&defender.role==='missile'&&aliveCount(defender)>0&&!shootingPlan(s,defender,charger,{reaction:true}).error;}
// With several chargers a unit shoots at one; if any of them is too close (nearer than its own
// Movement) it cannot Stand & Shoot at all, unless its weapon has Quick Shot. Returns that charger.
export function standShootTooClose(s,defender,chargers){if(missileWeapon(defender)?.quickShot)return null;return chargers.find(v=>v.x!==null&&gap(defender,v)+EPS<profile(v).M)??null;}
// A charged unit declares one reaction, against every unit charging it: Hold; Stand & Shoot at one
// chosen charger (holding against the rest, and only if none of them is too close); or Flee,
// directly away from the charger with the highest Unit Strength (a tie decided at random).
export function chargeReaction(s,chargerId,choice,random=Math.random){
 const charger=getUnit(s,chargerId),defender=getUnit(s,charger?.charge?.target);
 if(s.stage!=='movement'||!['declare','reactions'].includes(s.movementStep)||charger?.charge?.status!=='declared'||charger.charge.reaction!=='pending')throw Error('No charge reaction is pending.');
 const chargers=s.units.filter(v=>v.charge?.status==='declared'&&v.charge.target===defender.id);
 if(choice==='stand-shoot'&&standShootTooClose(s,defender,chargers.filter(v=>v.id!==charger.id)))throw Error('Another charger is too close: no Stand & Shoot.');
 if(!['hold','stand-shoot','flee'].includes(choice))throw Error('Choose Hold, Stand & Shoot, or Flee.');
 if(choice==='hold'&&defender.fleeing)throw Error('A fleeing regiment must Flee.');
 if(choice==='stand-shoot'&&!canStandShoot(s,defender,charger))throw Error('This regiment cannot Stand & Shoot against this charge.');
 if(choice==='flee'&&defender.engaged)throw Error('An engaged regiment must Hold.');
 if(choice==='flee'&&hasRule(defender,'frenzy')&&!defender.fleeing)throw Error('A Frenzied unit cannot Flee as a charge reaction.');
 if(defender.role==='warmachine'&&choice!=='hold')throw Error('A war machine can only Hold.');
 let report=null,fleeDice=null,fleeDistance=0,flee=null;
 // A charger that panics under Stand & Shoot (Heavy Casualties) falls back or flees: its charge is stopped.
 if(choice==='stand-shoot'){const plan=shootingPlan(s,defender,charger,{reaction:true});report=fireMissiles(s,defender,charger,plan,random);defender.reacted=true;if(report.panic&&!report.panic.passed&&charger.charge){charger.charge.status='stopped';charger.charge.panicked=true;charger.moved=true;}}
 if(choice==='flee'){
  fleeDice=rollD6(2,random);fleeDistance=fleeDice[0]+fleeDice[1]+swift(defender,random);
  const top=Math.max(...chargers.map(v=>unitStrength(v))),biggest=chargers.filter(v=>unitStrength(v)===top),from=biggest.length>1?biggest[Math.floor(random()*biggest.length)]:biggest[0]??charger;
  const dx=defender.x-from.x,dy=defender.y-from.y;
  defender.heading=normalize(Math.atan2(dx,-dy)*180/Math.PI);
  flee=fleeMove(s,defender,fleeDistance,random);
  defender.fleeing=!defender.destroyed;defender.moved=true;
 }
 for(const v of chargers.filter(v=>v.charge.reaction==='pending'))Object.assign(v.charge,{reaction:v.id===charger.id||choice!=='stand-shoot'?choice:'hold',reactionReport:v.id===charger.id?report:null,fleeDice});
 defender.reaction={choice,round:s.round,team:s.team};syncJoined(s,defender);
 if(aliveCount(charger)===0){charger.charge.status='stopped';charger.moved=true;}
 if(s.movementStep==='reactions'&&!s.units.some(u=>u.charge?.reaction==='pending'))finishReactions(s,random);
 return {choice,report,fleeDice,fleeDistance,flee,fledOffBoard:!!flee?.fledOffBoard,charger:chargerId,defender:defender.id,stopped:charger.charge.status==='stopped'};
}
export function cancelCharge(s,id){if(s.movementStep!=='declare')throw Error('Declarations are locked after rolling begins.');const u=getUnit(s,id);if(u?.charge?.status==='declared'&&u.charge.reaction!=='pending')throw Error('A charge cannot be cancelled after its defender reacts.');if(u?.charge?.status==='declared')u.charge=null;}
export function availableCharges(s,u){return combatants(s).filter(v=>v.team!==u.team&&v.x!==null&&aliveCount(v)>0&&!chargePlan(s,u,v).error);}
export function impetuousTest(s,id,dice){const u=getUnit(s,id);if(s.stage!=='movement'||s.movementStep!=='declare'||u?.team!==s.team||!isImpetuous(s,u)||u.impetuousTest!==null||!availableCharges(s,u).length)throw Error('Select an Impetuous unit with an available charge.');if(!Array.isArray(dice)||dice.length!==2||dice.some(d=>!Number.isInteger(d)||d<1||d>6))throw Error('An Impetuous test requires two D6.');u.impetuousTest=dice[0]+dice[1]<=profile(u).Ld;return u.impetuousTest;}
export function finishDeclarations(s,random=Math.random){if(s.stage!=='movement'||s.movementStep!=='declare')throw Error('Not declaring charges.');for(const u of s.units.filter(u=>u.team===s.team&&hasRule(u,'frenzy')&&!u.charge&&canAct(s,u)&&availableCharges(s,u).length))throw Error(`${u.name} is Frenzied and must declare a charge.`);for(const u of s.units.filter(u=>u.team===s.team&&isImpetuous(s,u)&&!u.charge&&canAct(s,u)&&availableCharges(s,u).length)){if(u.impetuousTest===null)throw Error(`Roll Impetuous for ${u.name}: it is able to charge.`);if(u.impetuousTest===false)throw Error(`${u.name} failed its Impetuous test and must declare a charge.`);}s.history=[];if(s.units.some(u=>u.charge?.reaction==='pending')){s.movementStep='reactions';return;}finishReactions(s,random);}
// After every charged unit has reacted: roll the charges, or go straight to Remaining Moves.
export function finishReactions(s,random=Math.random){if(s.units.some(u=>u.charge?.reaction==='pending'))throw Error('Choose every charged unit’s reaction first.');if(s.units.some(u=>u.charge?.status==='declared'))s.movementStep='charges';else beginRemaining(s,random);}
export function enterRemaining(s,random=Math.random){
 if(s.units.some(u=>u.charge?.status==='declared'))throw Error('Resolve all declared charges before Remaining Moves.');
 beginRemaining(s,random);
}
// Compulsory Moves, before Remaining Moves: pursuers that left the battlefield return, and each
// fleeing unit that failed to rally this turn flees again, 2D6″ straight ahead.
function beginRemaining(s,random=Math.random){if(s.movementStep!=='remaining'){s.movementStep='remaining';returnPursuers(s);s.compulsoryReports=compulsoryFlight(s,random);}}
function compulsoryFlight(s,random){const out=[];for(const u of s.units.filter(u=>u.team===s.team&&u.x!==null&&aliveCount(u)>0&&u.fleeing&&u.rallyAttempted&&!u.rallied&&!u.engaged)){const dice=rollD6(2,random),move=fleeMove(s,u,dice[0]+dice[1]+swift(u,random),random);out.push({unit:u.id,dice,distance:move.distance,fledOffBoard:move.fledOffBoard,move});}return out;}
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
    Object.assign(u,{x:pose.x,y:pose.y,heading:angle,moved:true,offBoardPursuit:null});syncJoined(s,u);found=true;break;
   }
   if(found)break;
  }
 }
}
export function resolveCharge(s,id,dice,random=Math.random){
 const u=getUnit(s,id);if(s.stage!=='movement'||s.movementStep!=='charges'||u?.charge?.status!=='declared')throw Error('Select a declared charge to resolve.');
 if(!Array.isArray(dice)||dice.length!==2||dice.some(d=>!Number.isInteger(d)||d<1||d>6))throw Error('A charge roll requires two D6.');
 if(u.charge.reaction==='pending')throw Error('Choose the defender’s reaction first.');
 const t=getUnit(s,u.charge.target),fled=u.charge.reaction==='flee',p=t?.x!==null?chargePlan(s,u,t):{error:'Target fled off the table.'},route=p.error?u.charge.initialPlan:p;
 // Charging through a vortex (difficult terrain): Movement −1, and the lower die counts.
 const difficult=!!route?.end&&sweptVortices(s,u,[u,...(route.angle?[wheelPose(u,route.angle)]:[]),route.end],{all:true}).length>0,roll=difficult?Math.min(...dice):Math.max(...dice),swiftRoll=swift(u,random),range=Math.max(1,profile(u).M-(difficult?1:0))+roll+swiftRoll,success=!p.error&&range+EPS>=p.cost;
 let end={...u},travel=0,disordered=null;
 // Charging a unit behind a defended obstacle (Earthen Ramparts) is a disordered charge, unless the charger has Fly.
 if(success){end=p.end;travel=p.cost;if(fled){claimStandard(s,t,u.team);destroyUnit(s,t,'RUN_DOWN',random);u.ranDown=true;}else{engage(u,t);if(hasRule(t,'defendedObstacle')&&!flyValues(u).length)disordered='Earthen Ramparts';}}
 else if(route?.start){
  const budget=fled?range:roll;
  const wheelAngle=route.wheelCost<=budget?route.angle:Math.sign(route.angle)*2*Math.asin(Math.min(1,budget/(2*size(u).w)))*180/Math.PI;
  const wheelEnd=wheelPose(u,wheelAngle),straight=Math.max(0,budget-wheelCost(wheelAngle,u));
  // Stop a failed charge short of units or table edges; never enter combat on failure.
  for(let i=1;i<=100;i++){const pose=i/100<=wheelCost(wheelAngle,u)/budget?wheelPose(u,wheelAngle*(i/100)*budget/Math.max(wheelCost(wheelAngle,u),EPS)):forwardPose(wheelEnd,Math.min(straight,(i/100)*budget-wheelCost(wheelAngle,u)));if(checkPosition(s,pose,pose.x,pose.y))break;end=pose;travel=budget*i/100;}
 }
 const before={...u};Object.assign(u,{x:end.x,y:end.y,heading:heading(end),moved:true,movedThisTurn:u.movedThisTurn||travel>0});
 u.charge={...u.charge,status:success?'success':fled?'pursuit':'failed',dice:[...dice],roll,range,distance:travel,face:route?.face,difficult,...(disordered?{disordered}:{})};s.history=[];
 const poses=[before,...(route?.angle?[wheelPose(before,route.angle)]:[]),{...u}],vortexHits=travel>0?vortexMoveHits(s,u,sweptVortices(s,u,poses),random,poses):[];
 if(!success&&travel>0)s.lastPhantasm=endOfMove(s,u,random);
 // First Charge: a unit's first charge of the game, if it hits home, leaves its target Disrupted
 // until the end of that turn's Combat phase.
 if(!u.firstChargeTried){u.firstChargeTried=true;if(success&&!fled&&unitHasRule(u,'firstCharge'))t.firstChargeDisrupted=`${s.round}:${s.team}`;}
 if(!s.units.some(v=>v.charge?.status==='declared'))beginRemaining(s,random);
 syncJoined(s);if(success&&fled&&u.ranDown){delete u.ranDown;offerReform(s,u,'leadership','ran down');}
 return {success,runDown:success&&fled,pursuit:fled&&!success,targetLeftBoard:fled&&!!t.destroyed,dice,roll,range,distance:travel,target:t.id,reason:p.error??null,difficult,vortexHits,...(swiftRoll?{swift:swiftRoll}:{})};
}

export function modelSquares(s,u){
 if(u.role==='warmachine'||isCharacter(u)){const {w,h}=size(u),base=u.role==='warmachine'||MOUNTS[u.mount]?null:baseSize(u)/25.4,poly=corners(u),gaps=opponents(s,u).map(e=>({id:e.id,g:polygonGap(poly,corners(e))})),targets=gaps.filter(v=>v.g<=riderProfile(u).M+EPS).map(v=>v.id),contacts=gaps.filter(v=>v.g<EPS).map(v=>v.id);return [{index:0,row:0,col:0,x:base?-base/2:-w/2,y:base?-base/2:-h/2,size:base??w,h:base??h,command:null,dead:aliveCount(u)===0,fighting:targets.length>0,contact:contacts.length>0,targets,contacts}];}
 // A model fights each enemy unit on a face it is within the fighting ranks of; it touches the
 // ones it is in base contact with.
 const base=baseSize(u)/25.4,footprint=size(u),foes=opponents(s,u).map(e=>({e,face:chargeFace(e,u),poly:corners(e)})),depth=u.charge?.status==='success'?1:u.spears?3:2;
 // Fighting reach uses the printed Movement: a spell that adds Movement does not change who fights.
 const files=filesOf(u),ranks=ranksOf(u),slots=commandSlots(u),reach=baseProfile(u).M+EPS;
 // A joined character takes a place; the rank and file model it displaced stands at the back.
 const M=startingModels(u),reserved=new Set((u.charSlots??[]).map(c=>c.slot)),spare=Array.from({length:u.charSlots?.length??0},(_,j)=>M+j).filter(k=>!reserved.has(k)),displaced=[...reserved].filter(k=>k<M).sort((a,b)=>a-b),slotOf=i=>reserved.has(i)?spare[displaced.indexOf(i)]:i;
 return Array.from({length:M},(_,i)=>{const k=slotOf(i),row=Math.floor(k/files),col=k%files,x=-footprint.w/2+col*base,y=-footprint.h/2+row*base;
 const poly=[[x,y],[x+base,y],[x+base,y+base],[x,y+base]].map(([a,b])=>localPoint(u,a,b));
 const dead=(u.deadModels??[]).includes(i),targets=[],contacts=[];let rank=Infinity;
 for(const {e,face,poly:enemy}of foes){const edge=face==='front'?row:face==='rear'?ranks-1-row:face==='left flank'?col:face==='right flank'?files-1-col:Infinity,g=polygonGap(poly,enemy);if(!dead&&edge<depth&&g<=reach){targets.push(e.id);rank=Math.min(rank,edge);}if(!dead&&g<EPS)contacts.push(e.id);}
 return {index:i,row,col,rank,x,y,size:base,command:slots[i]??null,dead,fighting:targets.length>0,contact:contacts.length>0,targets,contacts};
 });
}

export function movementRemaining(u,mode=u.movementMode??'advance',medium=u.movementMedium??'ground'){return u.moved||u.engaged||u.charge||u.fleeing?0:Math.max(0,moveAllowance(u,{mode,medium,difficult:!!u.difficultThisMove})-(u.spent??0));}

export function aliveCount(u){return u.destroyed?0:isCharacter(u)||u.role==='warmachine'?(u.wounds>0?1:0):startingModels(u)-(u.deadModels?.length??0);}
export function remainingWounds(u){return isCharacter(u)||u.role==='warmachine'?Math.max(0,u.wounds):aliveCount(u);}
export function combatPairs(s){return combats(s);}
function combatDice(count,random){return count?rollD6(count,random):[];}
// A disordered charge (into Earthen Ramparts) gains no Initiative for charging.
function combatInitiative(u,foes=[]){const list=Array.isArray(foes)?foes:[foes],base=u.weapon==='greatWeapon'?1:profile(u).I,braced=u.spears&&list.some(enemy=>enemy?.charge?.status==='success'&&enemy.charge.target===u.id&&enemy.charge.face==='front')?1:0;if(u.charge?.status!=='success'||u.charge.disordered)return base+braced;return base+Math.min(u.charge.face==='front'?3:4,Math.floor(u.charge.distance+EPS));}
export function hitTarget(attacker,defender){const a=profile(attacker).WS,d=profile(defender).WS;return a>2*d?2:a>d?3:d>2*a?5:4;}
export function woundTarget(attacker,defender){return Math.max(2,Math.min(6,4+profile(defender).T-profile(attacker).S-(attacker.weapon==='greatWeapon'?2:0)));}
// Parry: in close combat a regiment's hand weapons and shields improve its save by one more, to 3+ at best.
const parry=u=>u?.role==='infantry'&&hasShield(u)&&armourSave(u)>3?1:0;
export function saveTarget(defender,attacker){let target=armourSave(defender)-parry(defender)+apBonus(attacker)+(attacker.weapon==='greatWeapon'?2:0)+(FACTIONS[attacker.faction??'chaos'].choppas&&attacker.charge?.status==='success'?1:0)+(attacker.role==='wizard'&&attacker.faction==='chaos'?1:0);return Math.max(2,Math.min(7,target));}
// ---- Difficult ground and Disruption ----
// Terrain features are circles {x,y,r} or polygons {points}; movement is 'open', 'difficult',
// 'dangerous' or 'impassable' (older records say impassable:true). Every vortex template in play
// is difficult terrain as well.
export const featureMovement=t=>t?.movement??(t?.impassable?'impassable':'open');
export function featureGap(t,poly){return t.points||t.line?polygonGap(poly,t.points??t.line):circleGap(poly,t);}
// ---- Terrain features ----
// A feature: {id, key, name, kind, x, y, heading, points (an area) or line (a linear obstacle),
// width (its widest extent), movement, sight, top (a hill's highest point), owner (the side that
// placed it)}. The Battle March landmark is a circle {x, y, r}.
export function terrainGeometry(piece,x,y,heading=0){const sh=piece.shape,a=rad(heading),pt=(lx,ly)=>({x:x+lx*Math.cos(a)-ly*Math.sin(a),y:y+lx*Math.sin(a)+ly*Math.cos(a)});
 if(sh.type==='line')return {line:[pt(-sh.length/2,0),pt(sh.length/2,0)],width:sh.length};
 if(sh.type==='rect')return {points:[pt(-sh.w/2,-sh.h/2),pt(sh.w/2,-sh.h/2),pt(sh.w/2,sh.h/2),pt(-sh.w/2,sh.h/2)],width:Math.max(sh.w,sh.h)};
 const n=24;return {points:Array.from({length:n},(_,k)=>pt(sh.w/2*Math.cos(2*Math.PI*k/n),sh.h/2*Math.sin(2*Math.PI*k/n))),width:Math.max(sh.w,sh.h)};}
export function makeFeature(key,x,y,heading=0,extra={}){const piece=F.TERRAIN_PIECES[key];if(!piece)throw Error(`Unknown terrain piece "${key}".`);return {key,name:piece.name,kind:piece.kind,x,y,heading:normalize(heading),movement:piece.movement,sight:piece.sight,...(piece.low?{low:true}:{}),...(piece.high?{high:true}:{}),...terrainGeometry(piece,x,y,heading),...(piece.kind==='hill'?{top:{x,y}}:{}),...extra};}
// Distance from a feature to a point, and between two features (footprint to footprint).
export function featureDistance(t,p){return t.points||t.line?circleGap(t.points??t.line,{x:p.x,y:p.y,r:0}):Math.max(0,Math.hypot(t.x-p.x,t.y-p.y)-t.r);}
export function featuresGap(a,b){const pa=a.points??a.line,pb=b.points??b.line;if(pa&&pb)return polygonGap(pa,pb);if(pa)return circleGap(pa,b);if(pb)return circleGap(pb,a);return Math.max(0,Math.hypot(a.x-b.x,a.y-b.y)-a.r-b.r);}
const featureOnBoard=(s,f)=>{const b=boardOf(s),pts=f.points??f.line;return pts?pts.every(p=>p.x>=-EPS&&p.y>=-EPS&&p.x<=b.width+EPS&&p.y<=b.height+EPS):f.x-f.r>=-EPS&&f.y-f.r>=-EPS&&f.x+f.r<=b.width+EPS&&f.y+f.r<=b.height+EPS;};
// ---- Terrain setup (the brief's steps 2–3: terrain, then objectives, then deployment) ----
// Normal placement: a roll-off; the winner places first and the players alternate, each from the
// combined selection, none within 12″ of the centre or within 12″ of a feature the other player
// placed, until the allowance is placed (or neither can place more). Scattered: the winner places
// every feature (centre rule only); the loser picks D3 to scatter 2D6″ on the scatter die, each
// stopping as it touches another feature or the battlefield edge. Free: an agreed layout.
export function startTerrain(s,{method='alternate',pieces=F.STARTER_COLLECTION}={}){
 if(!F.TERRAIN_METHODS[method])throw Error(`Unknown terrain method "${method}".`);s.terrain=(s.terrain??[]).filter(t=>t.kind==='landmark'||t.scenario);
 const allowance=F.terrainAllowance(boardOf(s)),pool=[...pieces];for(const k of pool)if(!F.TERRAIN_PIECES[k])throw Error(`Unknown terrain piece "${k}".`);
 s.terrainSetup={method,pool,allowance,used:0,placed:[],rollOff:null,next:null,passed:[],scatter:null,done:method==='none'||!pool.length};
 if(s.terrainSetup.done)finishTerrain(s);return s.terrainSetup;}
export const terrainPending=s=>!!s.terrainSetup&&!s.terrainSetup.done;
export function terrainRollOff(s,random=Math.random){const ts=s.terrainSetup;if(!terrainPending(s)||ts.rollOff)throw Error('No terrain roll-off is needed.');if(ts.method==='free')throw Error('An agreed layout needs no roll-off.');ts.rollOff=rollOff(random);ts.next=ts.rollOff.winner;return ts.rollOff;}
// Why this piece cannot be placed here by this side (null when it can).
export function terrainPlacementError(s,team,key,x,y,heading=0){
 const ts=s.terrainSetup;if(!terrainPending(s))return 'The terrain is set up.';if(ts.scatter)return 'Scatter the chosen features first.';
 if(ts.method!=='free'&&!ts.rollOff)return 'Roll off first: the winner places the first feature.';if(ts.method!=='free'&&team!==ts.next)return `${armyName(ts.next,s)} places the next feature.`;
 if(!ts.pool.includes(key))return 'That piece is not in the selection still to place.';
 if(ts.used+F.terrainSizeClass(F.TERRAIN_PIECES[key].shape.length??Math.max(F.TERRAIN_PIECES[key].shape.w,F.TERRAIN_PIECES[key].shape.h))>ts.allowance)return `It would take the terrain past the allowance of ${ts.allowance}.`;
 if(!Number.isFinite(x)||!Number.isFinite(y))return 'Choose where it goes.';const f=makeFeature(key,x,y,heading),b=boardOf(s);
 if(!featureOnBoard(s,f))return 'The whole feature must be on the battlefield.';
 if(ts.method!=='free'&&featureDistance(f,{x:b.width/2,y:b.height/2})<=12+EPS)return 'Terrain cannot be placed within 12″ of the centre of the battlefield.';
 if(ts.method==='alternate'&&(s.terrain??[]).some(t=>t.owner&&t.owner!==team&&featuresGap(t,f)<=12+EPS))return 'It cannot be placed within 12″ of a feature the other player placed.';
 if((s.terrain??[]).some(t=>featuresGap(t,f)<EPS))return 'Terrain features cannot overlap.';
 return null;}
export function placeTerrain(s,team,key,x,y,heading=0){
 const error=terrainPlacementError(s,team,key,x,y,heading);if(error)throw Error(error);const ts=s.terrainSetup;s.terrainSeq=(s.terrainSeq??0)+1;
 const f=makeFeature(key,x,y,heading,{id:'T'+s.terrainSeq,owner:ts.method==='free'?null:team});s.terrain=[...(s.terrain??[]),f];
 ts.pool.splice(ts.pool.indexOf(key),1);ts.used+=F.terrainSizeClass(f.width);ts.placed.push(f.id);ts.passed=[];
 if(ts.method==='alternate')ts.next=team==='ash'?'iron':'ash';advanceTerrain(s);return f;}
// A side that cannot (or will not) place more passes; when both have passed in turn, or the pool or
// allowance is used up, placement ends (unused pieces are set aside).
export function passTerrain(s,team){const ts=s.terrainSetup;if(!terrainPending(s)||ts.scatter)throw Error('No terrain is being placed.');if(ts.method!=='free'&&team!==ts.next)throw Error(`${armyName(ts.next,s)} places the next feature.`);ts.passed=[...new Set([...ts.passed,team])];if(ts.method==='alternate'&&ts.passed.length<2)ts.next=team==='ash'?'iron':'ash';else ts.pool=[];advanceTerrain(s);return ts;}
function advanceTerrain(s){const ts=s.terrainSetup,fits=k=>ts.used+F.terrainSizeClass(F.TERRAIN_PIECES[k].shape.length??Math.max(F.TERRAIN_PIECES[k].shape.w,F.TERRAIN_PIECES[k].shape.h))<=ts.allowance;
 if(ts.pool.some(fits))return;
 if(ts.method==='scatter'&&ts.placed.length&&!ts.scatter){ts.scatter={by:ts.rollOff.winner==='ash'?'iron':'ash',count:null,chosen:null,reports:[]};return;}
 finishTerrain(s);}
// Scattered placement, the loser's part: roll D3 for how many, choose that many, then each scatters.
export function scatterTerrainCount(s,random=Math.random){const sc=s.terrainSetup?.scatter;if(!sc||sc.count!==null)throw Error('No scatter roll is due.');sc.count=Math.min(s.terrainSetup.placed.length,Math.ceil(rollD6(1,random)[0]/2));return sc.count;}
export function scatterTerrain(s,team,ids,random=Math.random){
 const ts=s.terrainSetup,sc=ts?.scatter;if(!sc||sc.count===null)throw Error('Roll for how many features scatter first.');if(team!==sc.by)throw Error(`${armyName(sc.by,s)} chooses which features scatter.`);
 if(!Array.isArray(ids)||new Set(ids).size!==sc.count||ids.some(id=>!ts.placed.includes(id)))throw Error(`Choose ${sc.count} placed feature${sc.count===1?'':'s'} to scatter.`);
 sc.chosen=[...ids];for(const id of ids){const f=s.terrain.find(t=>t.id===id),{hit,angle}=rollScatter(random),dice=rollD6(2,random),dist=hit?0:dice[0]+dice[1],a=rad(angle),from={x:f.x,y:f.y};let moved=0,stop=null;
  // In ⅛″ steps, so the feature never jumps through another one: it stops as it touches one, or the edge.
  for(let d=.125;d<=dist+EPS;d+=.125){const g=makeFeature(f.key,from.x+Math.sin(a)*d,from.y-Math.cos(a)*d,f.heading);if(!featureOnBoard(s,g)){stop='edge';break;}if(s.terrain.some(t=>t.id!==id&&featuresGap(t,g)<EPS)){stop='feature';break;}moved=d;}
  Object.assign(f,makeFeature(f.key,from.x+Math.sin(a)*moved,from.y-Math.cos(a)*moved,f.heading,{id:f.id,owner:f.owner}));sc.reports.push({id,hit,angle,dice,distance:dist,moved,stop});}
 finishTerrain(s);return sc.reports;}
// Terrain done: treasure troves keep 3″ from terrain (ordinary terrain is shifted the least distance
// needed, directly away from the trove), then deployment can begin.
function finishTerrain(s){const ts=s.terrainSetup;if(ts)ts.done=true;for(const o of s.objectives?.items??[]){if(o.kind!=='trove')continue;for(const f of (s.terrain??[]).filter(t=>t.kind!=='landmark'&&!t.scenario)){const gapNow=()=>featureDistance(f,o)-o.r;if(gapNow()>=3-EPS)continue;const dx=f.x-o.x,dy=f.y-o.y,l=Math.hypot(dx,dy)||1;for(let d=.05;d<=12&&gapNow()<3-EPS;d+=.05){Object.assign(f,makeFeature(f.key,f.x+dx/l*.05,f.y+dy/l*.05,f.heading,{id:f.id,owner:f.owner,shifted:true}));}}}}
// Quick terrain: every remaining step made for both sides, at random legal places.
export function quickTerrain(s,random=Math.random){
 for(let guard=0;guard<40&&terrainPending(s);guard++){const ts=s.terrainSetup;
  if(ts.scatter){if(ts.scatter.count===null)scatterTerrainCount(s,random);const ids=[...ts.placed].sort(()=>random()-.5).slice(0,ts.scatter.count);scatterTerrain(s,ts.scatter.by,ids,random);continue;}
  if(ts.method!=='free'&&!ts.rollOff){terrainRollOff(s,random);continue;}
  const team=ts.method==='free'?'ash':ts.next;if(!autoPlaceTerrain(s,team,random))passTerrain(s,team);}
 return s.terrain;}
// One piece placed for a side at a random legal spot (the first piece in its selection that fits).
export function autoPlaceTerrain(s,team,random=Math.random,{key=null,score=null}={}){
 const ts=s.terrainSetup,b=boardOf(s),keys=key?[key]:[...new Set(ts.pool)];
 for(const k of keys){const options=[];for(let x=1;x<b.width;x+=1)for(let y=1;y<b.height;y+=1)for(const h of [0,90,45,135])if(!terrainPlacementError(s,team,k,x,y,h))options.push({x,y,h,v:score?score(k,x,y,h):random()});
  if(options.length){const o=options.sort((p,q)=>q.v-p.v)[0];return placeTerrain(s,team,k,o.x,o.y,o.h);}}
 return null;}
export function difficultGround(s){return [...(s?.terrain??[]).filter(t=>['difficult','dangerous'].includes(featureMovement(t))).map(t=>({kind:'terrain',id:t.id,name:t.name,shape:t})),...(s?.vortices??[]).filter(v=>getUnit(s,v.caster)?.x!=null).map(v=>({kind:'vortex',id:v.id??v.caster,name:SPELLS[v.spell??'pillar']?.name??'Vortex',shape:{x:v.x,y:v.y,r:v.radius??1.5}}))];}
// A model is within difficult ground when part of its base overlaps it (only touching is not enough).
export function modelsInDifficult(s,u){const ground=difficultGround(s),total=aliveCount(u);if(!ground.length||!u||u.x===null)return {within:0,total,features:[]};
 const squares=isCharacter(u)||u.role==='warmachine'?[corners(u)]:modelSquares(s,u).filter(m=>!m.dead).map(m=>[[m.x,m.y],[m.x+m.size,m.y],[m.x+m.size,m.y+m.size],[m.x,m.y+m.size]].map(([x,y])=>localPoint(u,x,y)));
 const names=new Set();let within=0;for(const sq of squares){const inner=shrink(sq,.01),under=ground.filter(g=>featureGap(g.shape,inner)<EPS);if(under.length){within++;for(const g of under)names.add(g.name);}}
 return {within,total:squares.length,features:[...names]};}
// Disrupted (it cannot claim a Rank Bonus): engaged in its flank or rear by an enemy unit of Unit
// Strength 5 or more, or with a quarter or more of its models within difficult ground. It is
// judged where the units stand when the combat result is worked out. Returns the reasons.
export function disruption(s,u){const out=[];if(!u||u.x===null)return out;
 for(const e of opponents(s,u)){const face=chargeFace(e,u);if(unitStrength(e)>=5&&['left flank','right flank','rear'].includes(face))out.push({kind:'flank',unit:e.id,text:`engaged in the ${face} by ${e.name}`});}
 if(u.firstChargeDisrupted===`${s.round}:${s.team}`)out.push({kind:'firstCharge',text:'charged by a unit with First Charge'});
 const g=modelsInDifficult(s,u);if(g.total&&g.within*4>=g.total)out.push({kind:'terrain',within:g.within,total:g.total,features:g.features,text:`${g.within} of ${g.total} models in ${g.features.join(' and ')}`});
 return out;}
export const isDisrupted=(s,u)=>disruption(s,u).length>0;
// Ranks behind the first count when they hold at least the troop type's models per rank
// (5 regular, 4 heavy infantry); casualties come off the rear, so the front ranks stay full.
function rankBonus(u){const alive=aliveCount(u),files=filesOf(u),full=Math.floor(alive/files),partial=alive%files,need=Math.min(files,TROOP_TYPES[troopType(u)].perRank??files);return full<1?0:Math.min(2,full-1+(partial>=need?1:0));}
// Leadership for a test: the unit's own (or its champion's), or the General's through Inspiring
// Presence when s is given, then a Warband's rank bonus and a musician's +1 to march and rally.
// A unit tests on the highest Leadership among its models: its champion's, a joined character's.
export function leadership(u,kind='normal',s=null){const own=Math.max(commandAlive(u,'C')&&!u.championRetired?Math.max(profile(u).Ld,championProfile(u).Ld):profile(u).Ld,...(s?joinedCharacters(s,u).filter(c=>!c.retired).map(c=>profile(c).Ld):[])),base=Math.max(own,inspiringPresence(s,u)??0);return Math.min(10,base+(FACTIONS[u.faction??'chaos'].warband&&kind!=='restraint'&&!u.fleeing&&!(s&&isDisrupted(s,u))?rankBonus(u):0)+(commandAlive(u,'M')&&(kind==='march'||kind==='rally')?1:0));}
// Casualties already suffered in this combat count against the first fighting rank, then the
// second (never the champion); the models that stepped forward from the rear cannot attack.
function stepForward(models,lost){let drop=lost;return [...models].sort((a,b)=>(a.rank??0)-(b.rank??0)).filter(m=>{if(drop>0&&m.command!=='C'){drop--;return false;}return true;});}
// Which enemy each fighting model attacks. A model in base contact attacks a unit it touches
// (the unit's chosen focus if it touches several); a supporting model attacks the closest enemy
// unit it can reach, the focus breaking a tie. Casualties already taken come off the front first.
// In a challenge the two duellists fight only each other (fightCombatStep): no one else attacks or
// is attacked by them. A model retired by a refused challenge neither attacks nor is attacked.
export function attackAllocation(s,u,lost=0){
 const keys=duelKeys(s);if(isCharacter(u)&&(u.retired||keys.includes(u.id)))return new Map();const benched=keys.includes(u.id+':C')||!!u.championRetired;
 const fighting=modelSquares(s,u).filter(m=>m.fighting&&!(benched&&m.command==='C')),fighters=isCharacter(u)||u.role==='warmachine'?fighting:stepForward(fighting,lost),out=new Map(),foes=new Map(opponents(s,u).filter(e=>!(isCharacter(e)&&(e.retired||keys.includes(e.id)))).map(e=>[e.id,corners(e)]));
 for(const m of fighters){
  let pick=null;
  if(m.contacts?.length)pick=m.contacts.includes(u.combatFocus)?u.combatFocus:m.contacts.find(id=>foes.has(id));
  else{const square=[[m.x,m.y],[m.x+m.size,m.y],[m.x+m.size,m.y+m.size],[m.x,m.y+m.size]].map(([x,y])=>localPoint(u,x,y)),ranked=(m.targets??[]).filter(id=>foes.has(id)).map(id=>({id,g:polygonGap(square,foes.get(id))})).sort((a,b)=>a.g-b.g);pick=ranked.length>1&&ranked[1].g-ranked[0].g<EPS&&ranked.some(r=>r.id===u.combatFocus)?u.combatFocus:ranked[0]?.id;}
  if(!pick)continue;if(!out.has(pick))out.set(pick,[]);out.get(pick).push(m);
 }
 return out;
}
function attackStage(s,attacker,defender,random,lost=0,{models=null,cap=null}={}){
 const fighting=models??stepForward(modelSquares(s,attacker).filter(m=>m.fighting&&(!m.targets||m.targets.includes(defender.id))),isCharacter(attacker)||attacker.role==='warmachine'?0:lost),faction=FACTIONS[attacker.faction??'chaos'],chopping=faction.choppas&&attacker.charge?.status==='success',dice={hit:[],wound:[],reroll:[],save:[]};
 const furious=(faction.furious&&attacker.charge?.status==='success'&&attacker.charge.distance>=3?1:0)+(hasRule(attacker,'frenzy')&&attacker.charge?.status==='success'?1:0);
 const attacks=fighting.reduce((total,model)=>total+(model.command==='C'?championProfile(attacker).A:profile(attacker).A)+furious,0);dice.hit=combatDice(attacks,random);
 const toHit=Math.min(6,hitTarget(attacker,defender)+stormPenalty(s,attacker)),toWound=woundTarget(attacker,defender),toSave=saveTarget(defender,attacker);
 // Hatred (Battle Lust): failed rolls To Hit are re-rolled in the first round of combat, the turn a charge started it.
 if(hasRule(attacker,'hatred')&&(attacker.charge?.status==='success'||defender.charge?.status==='success'))dice.hitReroll=combatDice(dice.hit.filter(n=>n<toHit).length,random);
 const hits=dice.hit.filter(n=>n>=toHit).length+(dice.hitReroll??[]).filter(n=>n>=toHit).length;dice.wound=combatDice(hits,random);
 if(chopping){dice.reroll=combatDice(dice.wound.filter(n=>n===1).length,random);}
 const wounds=dice.wound.filter(n=>n>=toWound).length+dice.reroll.filter(n=>n>=toWound).length;dice.save=combatDice(wounds,random);
 const bane=attacker.weapon==='greatWeapon'?[...dice.wound,...dice.reroll].filter(n=>n===6).length:0;
 let unsaved=Math.min(cap??remainingWounds(defender),dice.save.filter((n,i)=>n<(i<bane?Math.min(7,toSave+1):toSave)).length);const ward=wardSave(defender);if(ward<=6){dice.ward=combatDice(unsaved,random);unsaved=dice.ward.filter(n=>n<ward).length;}
 return {from:attacker.id,to:defender.id,initiative:combatInitiative(attacker,defender),fighters:fighting.length,lostBefore:lost,attacks,hits,wounds,saved:wounds-unsaved,unsaved,toHit,toWound,toSave,dice};
}
export function removeCasualties(s,u,count,random=Math.random){
 if(count>0)u.usBeforeLoss=unitStrength(u);
 if(u.role==='warmachine'){u.wounds=Math.max(0,u.wounds-count);u.crew=Math.min(u.crew,u.wounds);if(!u.wounds){release(s,u);destroyUnit(s,u,'COMBAT_CASUALTIES',random);}return;}
 if(isCharacter(u)){u.wounds=Math.max(0,u.wounds-count);if(!u.wounds){release(s,u);destroyUnit(s,u,'COMBAT_CASUALTIES',random);}return;}
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
 const r=s.rocket;if(r.x===null)return {error:'Deploy the launcher first.'};if(!target||target.x===null||target.team==='ash'||aliveCount(target)===0)return {error:'Choose a surviving enemy regiment.'};if(target.engaged)return {error:'Cannot target a regiment in combat.'};if(screenedCharacter(s,r,target))return {error:SCREENED};
 const facing=facingTo(r,target),distance=polygonGap(corners({...r,heading:facing}),corners(target));
 if(distance<12-EPS||distance>48+EPS)return {error:'Target must be between 12″ and 48″ away.',distance};
 if(!indirect&&sightBlocked(s,r,target,{x:r.x,y:r.y},{x:target.x,y:target.y}))return {error:'Another regiment blocks line of sight. Choose Indirect Fire.',distance};
 return {target:target.id,distance,aim:{x:target.x,y:target.y},indirect,facing};
}
// Every enemy unit, including war machines, is a possible target.
export function rocketTargets(s,options={}){if(!canFireRocket(s))return [];return combatants(s).filter(u=>u.team==='iron'&&u.x!==null&&aliveCount(u)>0).map(u=>({unit:u,...rocketPlan(s,u,options)}));}
export function rollRocketDice(random=Math.random){const face=Math.floor(random()*6),{hit,angle}=rollScatter(random);return {artillery:face===5?'misfire':(face+1)*2,scatter:hit?'hit':angle,hitArrow:angle};}
// Models under a blast template. A war machine and its crew are one model: its whole base.
function blastCells(s,point,radius){const out=[];for(const unit of allPieces(s).filter(u=>u.x!==null&&aliveCount(u)>0)){
 const a=rad(heading(unit)),c=Math.cos(a),sn=Math.sin(a),dx=point.x-unit.x,dy=point.y-unit.y,lx=dx*c+dy*sn,ly=-dx*sn+dy*c,{w,h}=size(unit);
 const models=unit.role==='warmachine'||MOUNTS[unit.mount]?[{index:0,x:-w/2,y:-h/2,w,h}]:modelSquares(s,unit).filter(m=>!m.dead).map(m=>({...m,w:m.size,h:m.size}));
 for(const model of models){const x=Math.max(model.x,Math.min(lx,model.x+model.w)),y=Math.max(model.y,Math.min(ly,model.y+model.h));if(Math.hypot(lx-x,ly-y)>radius+EPS)continue;
 const centre=lx>=model.x-EPS&&lx<=model.x+model.w+EPS&&ly>=model.y-EPS&&ly<=model.y+model.h+EPS;
 const fully=[[model.x,model.y],[model.x+model.w,model.y],[model.x,model.y+model.h],[model.x+model.w,model.y+model.h]].every(([mx,my])=>Math.hypot(lx-mx,ly-my)<=radius+EPS);
 out.push({unit,model:model.index,centre,fully});
 }
 }return out;}
export function fireRocket(s,targetId,profileKey,dice,random=Math.random,{indirect=false}={}){
 if(!canFireRocket(s))throw Error('The Deathshrieker cannot fire in this Shooting phase.');
 const profile=ROCKET_PROFILES[profileKey],target=getUnit(s,targetId),plan=rocketPlan(s,target,{indirect});if(!profile)throw Error('Choose a rocket profile.');if(plan.error)throw Error(plan.error);
 if(!dice||!([2,4,6,8,10,'misfire'].includes(dice.artillery))||!(dice.scatter==='hit'||Number.isInteger(dice.scatter)&&dice.scatter>=0&&dice.scatter<360))throw Error('Roll valid Artillery and Scatter dice.');
 const report={profile:profileKey,from:'A5',target:targetId,aim:plan.aim,impact:null,template:profile.template,artillery:dice.artillery,scatter:dice.scatter,indirect,misfire:null,affected:[],hits:0,unsaved:0};
 s.rocket.shot=true;s.rocket.heading=plan.facing;const before=new Map(combatants(s).map(u=>[u.id,aliveCount(u)]));
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
  report.hits++;{const los=lookOutSir(s,cell,random);if(los)(report.lookOutSir??=[]).push(los);}const strength=isCentre?profile.centreStrength:profile.strength,ap=isCentre?profile.centreAp:profile.ap,woundRoll=rollD6(1,random)[0],toWound=Math.max(2,Math.min(6,4+shotToughness(cell.unit)-strength));
  const saveRoll=woundRoll>=toWound?rollD6(1,random)[0]:null,toSave=Math.max(2,Math.min(7,profileOfSave(cell.unit)+ap+(profile.armourBane&&woundRoll===6?profile.armourBane:0)));let slain=aliveCount(cell.unit)>0&&saveRoll!==null&&saveRoll<toSave?1:0;const warding=wardSave(cell.unit,{flaming:profileKey==='incendiary'}),ward=slain&&warding<=6?rollD6(1,random)[0]:null;if(slain&&ward!==null&&ward>=warding)slain=0;
  // The central hole's Multiple Wounds count on a model with several Wounds (a war machine or a character).
  const multiple=slain&&isCentre&&profile.centreMultipleWounds&&(cell.unit.role==='warmachine'||isCharacter(cell.unit))?rollD6(1,random)[0]:null,wounds=slain?Math.min(multiple??1,remainingWounds(cell.unit)):0;
  report.affected.push({unit:cell.unit.id,model:cell.model,centre:isCentre,hitRoll,woundRoll,saveRoll,ward,toWound,toSave,slain,multiple,wounds});
  if(slain){removeCasualties(s,cell.unit,wounds,random);report.unsaved+=wounds;if(aliveCount(cell.unit)===0){release(s,cell.unit);destroyUnit(s,cell.unit,'COMBAT_CASUALTIES',random);}}
 }
 // Infernal Incendiaries: every unit that loses a model tests for Panic; otherwise Heavy Casualties.
 for(const unit of s.units.filter(u=>report.affected.some(a=>a.unit===u.id&&a.slain)&&u.x!==null)){const panic=profileKey==='incendiary'?panicTest(s,unit,{away:s.rocket,cause:'Infernal Incendiaries',random}):heavyCasualties(s,unit,before.get(unit.id),s.rocket,random);if(panic){report.panic??=[];report.panic.push({...panic,flee:panic.fleeDice});}}
 s.rocket.lastShot=report;return report;
}
const ARTILLERY_FACES=[2,4,6,8,10,'misfire'];
export function rollCannonDice(random=Math.random){const face=()=>ARTILLERY_FACES[Math.floor(random()*6)];return {strike:face(),bounce:face()};}
export function canFireCannon(s,id){const c=s.cannons.find(c=>c.id===id);return !!c&&s.stage==='shooting'&&s.team==='iron'&&c.x!==null&&c.wounds>0&&!c.engaged&&!c.shot&&s.round>c.disabledUntil;}
export function cannonPlan(s,id,target,{mode='ball',aimShort=6}={}){
 const c=s.cannons.find(c=>c.id===id);if(!c||c.x===null)return {error:'Deploy the Great Cannon first.'};
 if(!target||target.x===null||target.team!=='ash'||aliveCount(target)===0||target.engaged)return {error:'Choose a surviving enemy regiment outside combat.'};
 if(screenedCharacter(s,c,target))return {error:SCREENED};
 if(!['ball','grape'].includes(mode))return {error:'Choose cannonball or grapeshot.'};
 const facing=facingTo(c,target),distance=polygonGap(corners({...c,heading:facing}),corners(target)),dx=target.x-c.x,dy=target.y-c.y,range=mode==='ball'?60:12;
 if(distance>range+EPS)return {error:`Target is beyond ${range}″ range.`,distance};
 if(sightBlocked(s,c,target,{x:c.x,y:c.y},{x:target.x,y:target.y}))return {error:'Another regiment blocks line of sight.',distance};
 if(!Number.isFinite(aimShort)||aimShort<0||aimShort>10)return {error:'Aim from 0″ to 10″ short of the target.'};
 const length=Math.hypot(dx,dy),direction={x:dx/length,y:dy/length},aim={x:target.x-direction.x*aimShort,y:target.y-direction.y*aimShort};
 if(mode==='ball'&&(Math.hypot(aim.x-c.x,aim.y-c.y)>60+EPS||aim.y<0||aim.y>boardOf(s).height||aim.x<0||aim.x>boardOf(s).width||Math.hypot(aim.x-c.x,aim.y-c.y)<CANNON_BASE.h/2))return {error:'Choose an aim point on the battlefield within cannon range.'};
 return {id,target:target.id,distance,direction,aim,mode,aimShort,facing};
}
export function cannonTargets(s,id,options={}){if(!canFireCannon(s,id))return [];return combatants(s).filter(u=>u.team==='ash'&&u.x!==null&&aliveCount(u)>0).map(unit=>({unit,...cannonPlan(s,id,unit,options)}));}
function cannonMisfire(s,c,random){const result=rollD6(1,random)[0];if(result===1){c.wounds=0;c.crew=0;c.x=null;c.y=null;}else if(result<=4){c.wounds--;c.crew=Math.min(c.crew,c.wounds);c.disabledUntil=s.round+1;if(c.wounds<=0){c.crew=0;c.x=null;c.y=null;}}return result;}
// A cannonball's bounce stops at the first impassable terrain in its path (Cannon Fire).
function stopAtTerrain(s,a,b){let t=1;
 // Polygon and line features: hills, impassable terrain and high walls stop the ball where it meets them.
 for(const k of (s.terrain??[]).filter(k=>(k.points||k.line)&&(featureMovement(k)==='impassable'||k.kind==='hill'||k.high))){const pts=k.points??k.line;if(k.points&&inside(a,k.points)){t=0;break;}for(let i=0;i<(k.line?1:pts.length);i++){const p=pts[i],q=pts[(i+1)%pts.length],r={x:b.x-a.x,y:b.y-a.y},e={x:q.x-p.x,y:q.y-p.y},den=r.x*e.y-r.y*e.x;if(Math.abs(den)<1e-12)continue;const u1=((p.x-a.x)*e.y-(p.y-a.y)*e.x)/den,u2=((p.x-a.x)*r.y-(p.y-a.y)*r.x)/den;if(u1>=0&&u1<t&&u2>=-1e-9&&u2<=1+1e-9)t=u1;}}
 for(const k of (s.terrain??[]).filter(k=>k.impassable&&k.r!==undefined)){const dx=b.x-a.x,dy=b.y-a.y,fx=a.x-k.x,fy=a.y-k.y,A=dx*dx+dy*dy,B=2*(fx*dx+fy*dy),C=fx*fx+fy*fy-k.r*k.r;if(C<=0){t=0;break;}if(A<EPS)continue;const disc=B*B-4*A*C;if(disc<0)continue;const t1=(-B-Math.sqrt(disc))/(2*A);if(t1>=0&&t1<t)t=t1;}return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,stopped:t<1};}
function cannonballCells(s,start,end,direction){const length=Math.hypot(end.x-start.x,end.y-start.y),hits=[];
 for(const unit of allPieces(s).filter(u=>u.x!==null&&aliveCount(u)>0))for(const model of unit.role==='warmachine'?[{index:0,row:0,col:0,x:-size(unit).w/2,y:-size(unit).h/2,size:size(unit).w}]:modelSquares(s,unit).filter(m=>!m.dead)){
  const poly=unit.role==='warmachine'||MOUNTS[unit.mount]?corners(unit):[[model.x,model.y],[model.x+model.size,model.y],[model.x+model.size,model.y+model.size],[model.x,model.y+model.size]].map(([x,y])=>localPoint(unit,x,y));
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
 const before=new Map(combatants(s).map(u=>[u.id,aliveCount(u)]));let cells=[];
 if(mode==='grape'){cells=Array.from({length:dice.strike},()=>({unit:target,model:null}));}
 else{report.strike={x:plan.aim.x+plan.direction.x*dice.strike,y:plan.aim.y+plan.direction.y*dice.strike};const bounce=dice.bounce==='misfire'?0:dice.bounce;report.end={x:report.strike.x+plan.direction.x*bounce,y:report.strike.y+plan.direction.y*bounce};{const stop=stopAtTerrain(s,report.strike,report.end);if(stop.stopped){report.end={x:stop.x,y:stop.y};report.stoppedByTerrain=true;}}cells=cannonballCells(s,report.strike,report.end,plan.direction);}
 // A cannonball: Armour Bane (2), so a 6 to wound improves its AP by 2, and Multiple Wounds (D3+1)
 // against a model with several Wounds (a war machine or a character).
 for(const cell of cells){if(aliveCount(cell.unit)===0)continue;report.hits++;{const los=lookOutSir(s,cell,random);if(los)(report.lookOutSir??=[]).push(los);}const ball=mode!=='grape',strength=ball?10:4,ap=ball?3:1,woundRoll=rollD6(1,random)[0],toWound=Math.max(2,Math.min(6,4+shotToughness(cell.unit)-strength)),bane=ball&&woundRoll===6?2:0,saveRoll=woundRoll>=toWound?rollD6(1,random)[0]:null,toSave=Math.max(2,Math.min(7,profileOfSave(cell.unit)+ap+bane)),warding=wardSave(cell.unit),ward=warding<=6&&saveRoll!==null&&saveRoll<toSave?rollD6(1,random)[0]:null,slain=saveRoll!==null&&saveRoll<toSave&&(ward===null||ward<warding);
  const multiple=slain&&ball&&(cell.unit.role==='warmachine'||isCharacter(cell.unit))?Math.ceil(rollD6(1,random)[0]/2)+1:null,wounds=slain?Math.min(multiple??1,remainingWounds(cell.unit)):0;
  report.affected.push({unit:cell.unit.id,model:cell.model?.index??null,woundRoll,saveRoll,ward,toWound,toSave,slain,multiple,wounds,...(bane?{armourBane:bane}:{})});
  if(slain){removeCasualties(s,cell.unit,wounds,random);report.unsaved+=wounds;if(aliveCount(cell.unit)===0){release(s,cell.unit);destroyUnit(s,cell.unit,'COMBAT_CASUALTIES',random);}}
 }
 for(const unit of s.units.filter(u=>report.affected.some(a=>a.unit===u.id&&a.slain)&&u.x!==null)){const panic=heavyCasualties(s,unit,before.get(unit.id),c,random);if(panic){report.panic??=[];report.panic.push(panic);}}
 c.lastShot=report;return report;
}
function GprofileT(u){return profile(u).T;}
function profileOfSave(u){return armourSave(u);}
// ---- Combat result -------------------------------------------------------------------------
// A combat holds every unit joined by engagements, so a side can have several units. Each side
// adds up the wounds its units caused. Only its highest rank bonus counts (a unit engaged in its
// flank or rear by an enemy unit of 10 or more models has none), one standard, flank and rear
// attacks once per enemy unit, Close Order for every unit that has it, and Massed Infantry once,
// for the side with the higher Unit Strength. A musician breaks a tie. A Disrupted unit (see
// disruption) claims no Rank Bonus; the reasons are kept with the score.
function sideScores(s,units,stages){
 const unit=id=>getUnit(s,id),live=u=>!!u&&u.x!==null&&aliveCount(u)>0,side=team=>units.map(unit).filter(u=>u?.team===team);
 const strength=team=>side(team).filter(live).reduce((n,u)=>n+unitStrength(u),0);
 const disrupted=u=>isDisrupted(s,u);
 const score={};
 for(const team of ['ash','iron']){
  const other=team==='ash'?'iron':'ash',alive=side(team).filter(live),foes=side(other);
  const wounds=stages.filter(st=>unit(st.from)?.team===team&&!st.friendly).reduce((n,st)=>n+st.unsaved,0);
  const ranks=Math.max(0,...alive.map(u=>disrupted(u)?0:rankBonus(u)));
  const closeOrder=alive.filter(u=>aliveCount(u)>=10&&!(u.role==='missile'&&u.faction==='chaos')).length;
  let flank=0;
  for(const e of foes.filter(e=>e.role!=='warmachine')){const faces=alive.filter(u=>u.role!=='warmachine'&&engagedWith(u,e)).map(u=>chargeFace(u,e));if(faces.some(f=>f==='left flank'||f==='right flank'))flank+=1;if(faces.includes('rear'))flank+=2;}
  const massed=strength(team)>strength(other)?1:0,standard=alive.some(u=>commandAlive(u,'S'))?1:0,overkill=Math.min(5,stages.filter(st=>st.duel&&unit(st.from)?.team===team).reduce((n,st)=>n+(st.overkill??0),0));
  score[team]={wounds,ranks,closeOrder,flank,massed,standard,overkill,musician:0,total:wounds+ranks+closeOrder+flank+massed+standard+overkill,disrupted:alive.filter(u=>rankBonus(u)>0&&disrupted(u)).map(u=>({unit:u.id,reasons:disruption(s,u).map(r=>r.text)}))};
 }
 if(score.ash.total===score.iron.total){const music=team=>side(team).filter(live).some(u=>commandAlive(u,'M'));if(music('ash')!==music('iron')){const team=music('ash')?'ash':'iron';score[team].musician=1;score[team].total++;}}
 return score;
}
// The winning unit a loser turns away from: the one in contact with the highest Unit Strength.
function facingWinner(s,p,loserId){const loser=getUnit(s,loserId),foes=opponents(s,loser).filter(e=>e.team===p.winnerSide).sort((a,b)=>unitStrength(b)-unitStrength(a)||a.id.localeCompare(b.id));return foes[0]?.id??p.winners?.find(id=>getUnit(s,id)?.x!==null)??p.winner;}
// Fight the whole combat at once (tests and quick resolution): every Initiative step, the
// result, and the first loser's Break test (Shieldwall is used when it is offered).
export function resolveCombat(s,id,random=Math.random){
 if(s.stage!=='combat'||s.pendingCombat)throw Error('Finish the current combat outcome first.');
 beginCombat(s,id);declineChallenges(s);
 while(s.combatSession?.phase==='attacks')fightCombatStep(s,random);
 compareCombat(s,random);
 const p=s.pendingCombat;
 if(p?.stage==='break'){rollCombatBreak(s,random);if(p.stage==='loser-choice')chooseLoserAction(s,'shieldwall');}
 return s.lastCombat;
}
// ---- Challenges ----
// When a combat is chosen, before any blow, the active player may issue a challenge with a
// character or champion in (or beside) the fighting rank; if not, the other player may. Only one
// is issued per combat. The opponent accepts with one of its own, or refuses: the challenger's
// player then names one model that could have accepted, which retires (it gives and takes no
// attacks and lends no Leadership while its unit fights the challenger's). A lone character, a
// unit's last model, or one in a unit engaged on all four sides cannot refuse (Nowhere to Run).
// The two attack only each other; if both survive and the combat goes on, so does the challenge.
// A duellist is keyed by its unit's id; a champion by "id:C".
export function duelist(s,key){if(!key)return null;const [id,c]=String(key).split(':'),u=getUnit(s,id);if(!u||u.x===null||u.destroyed||aliveCount(u)===0||c&&!commandAlive(u,'C'))return null;const model=c?modelSquares(s,u).find(m=>m.command==='C'&&!m.dead):modelSquares(s,u)[0];if(!model)return null;return {key:String(key),unit:u,champion:!!c,model,team:u.team,name:c?`${u.name}’s champion`:u.name};}
const duelKeys=s=>{const ch=s.combatSession?.challenge;return ch?.stage==='fight'?[ch.challenger,ch.acceptor]:[];};
export function challengeCandidates(s,team){const c=s.combatSession;if(!c)return [];const out=[];
 for(const id of c.units){const u=getUnit(s,id);if(!u||u.team!==team||u.x===null||aliveCount(u)===0||u.role==='warmachine')continue;
  if(isCharacter(u)){if(!u.retired&&modelSquares(s,u)[0]?.fighting)out.push(u.id);continue;}
  if(!u.championRetired&&commandAlive(u,'C')&&modelSquares(s,u).some(m=>m.command==='C'&&!m.dead&&m.fighting))out.push(u.id+':C');}
 return out;}
function nowhereToRun(s,key){const d=duelist(s,key);if(!d)return true;const host=d.champion?d.unit:d.unit.joined?getUnit(s,d.unit.joined):null;if(!host)return true;if(aliveCount(host)+joinedCharacters(s,host).length<=1)return true;const faces=new Set(opponents(s,host).map(e=>chargeFace(e,host)));return ['front','rear','left flank','right flank'].every(f=>faces.has(f));}
export function canRefuseChallenge(s){const ch=s.combatSession?.challenge;return ch?.stage==='accept'&&challengeCandidates(s,ch.team).every(k=>!nowhereToRun(s,k));}
// Who may issue next: the active player, then the other; with neither, the combat is fought.
function advanceIssue(s){const c=s.combatSession,ch=c.challenge,other=t=>t==='ash'?'iron':'ash',next=[s.team,other(s.team)].find(t=>!ch.declined.includes(t)&&challengeCandidates(s,t).length);if(next){ch.team=next;return ch;}ch.stage='none';ch.team=null;c.phase='attacks';return ch;}
export function issueChallenge(s,team,key=null){
 const c=s.combatSession,ch=c?.challenge;if(!c||ch?.stage!=='issue')throw Error('No challenge can be issued now.');if(team!==ch.team)throw Error(`${armyName(ch.team,s)} may issue a challenge first.`);
 if(!key){ch.declined.push(team);return advanceIssue(s);}
 if(!challengeCandidates(s,team).includes(key))throw Error('Choose a character or champion in the fighting rank.');
 Object.assign(ch,{challenger:key,issuedBy:team,stage:'accept',team:team==='ash'?'iron':'ash'});return ch;}
export function answerChallenge(s,key=null){
 const c=s.combatSession,ch=c?.challenge;if(!c||ch?.stage!=='accept')throw Error('No challenge is waiting for an answer.');
 if(key){if(!challengeCandidates(s,ch.team).includes(key))throw Error('Choose a character or champion in the fighting rank to accept.');Object.assign(ch,{acceptor:key,stage:'fight',team:null});c.phase='attacks';return ch;}
 if(!canRefuseChallenge(s))throw Error('Nowhere to Run: this challenge cannot be refused.');Object.assign(ch,{refused:true,stage:'nominate',refusedBy:ch.team,team:ch.issuedBy});return ch;}
export function nominateRetiree(s,key){
 const c=s.combatSession,ch=c?.challenge;if(ch?.stage!=='nominate')throw Error('No refused challenge is waiting for a nomination.');if(!challengeCandidates(s,ch.refusedBy).includes(key))throw Error('Name a character or champion that could have accepted.');
 const d=duelist(s,key),from=duelist(s,ch.challenger).unit,retired={by:from.joined??from.id,round:s.round};if(d.champion)d.unit.championRetired=retired;else d.unit.retired=retired;Object.assign(ch,{retired:key,stage:'refused',team:null});c.phase='attacks';return ch;}
// A retired model returns once its unit is no longer engaged with the challenger's.
function clearRetirements(s){for(const u of s.units){for(const key of ['retired','championRetired']){const r=u[key];if(!r)continue;const host=key==='retired'&&u.joined?getUnit(s,u.joined):u;if(!host||!engagedWith(host,r.by)&&!opponentIds(host).some(id=>getUnit(s,id)?.joined===r.by))delete u[key];}}}
// Decline every challenge (quick resolution and the bot's play-outs).
export function declineChallenges(s){const c=s.combatSession;while(c?.challenge?.stage==='issue')issueChallenge(s,c.challenge.team,null);if(c?.challenge?.stage==='accept')answerChallenge(s,canRefuseChallenge(s)?null:challengeCandidates(s,c.challenge.team)[0]);if(c?.challenge?.stage==='nominate')nominateRetiree(s,challengeCandidates(s,c.challenge.refusedBy)[0]);}
// A challenge choice is waiting: to issue (or not), to accept or refuse, or to name who retires.
export function challengePending(s){return ['issue','accept','nominate'].includes(s.combatSession?.challenge?.stage);}
export function beginCombat(s,id){
 if(s.stage!=='combat'||s.combatSession||s.pendingCombat)throw Error('Finish the current combat first.');
 const first=getUnit(s,id),units=first?.engaged&&first.x!==null?combatGroup(s,first).filter(u=>u.x!==null&&aliveCount(u)>0):[];
 if(units.length<2||!units.some(u=>!u.combatResolved))throw Error('Select an unresolved engaged regiment.');
 // A mounted character's mount strikes at its own Initiative (keyed "id:mount").
 const ids=units.map(u=>u.id),initiative=Object.fromEntries([...units.map(u=>[u.id,combatInitiative(u,opponents(s,u))]),...units.filter(u=>isCharacter(u)&&MOUNTS[u.mount]).map(u=>[u.id+':mount',combatInitiative(mountProxy(u),opponents(s,u))])]);
 s.combatSession={units:ids,sides:{ash:ids.filter(i=>getUnit(s,i).team==='ash'),iron:ids.filter(i=>getUnit(s,i).team==='iron')},a:first.id,b:opponents(s,first)[0]?.id??null,
  standards:Object.fromEntries(units.map(u=>[u.id,commandAlive(u,'S')])),initiative,groups:[...new Set(Object.values(initiative))].sort((x,y)=>y-x),step:0,phase:'attacks',stages:[],spellStages:[],passed:{},damage:Object.fromEntries(ids.map(i=>[i,0]))};
 // A challenge fought to the death goes on; otherwise one may be issued.
 clearRetirements(s);const c=s.combatSession,inCombat=key=>!!duelist(s,key)&&ids.includes(String(key).split(':')[0]),going=(s.duels??[]).find(d=>inCombat(d.challenger)&&inCombat(d.acceptor));
 if(going)c.challenge={stage:'fight',challenger:going.challenger,acceptor:going.acceptor,continued:true,team:null};
 else{c.challenge={stage:'issue',team:null,declined:[]};advanceIssue(s);}
 return c;
}
// One Initiative step: every unit at this Initiative attacks, its models split between the enemy
// units they can reach (see attackAllocation); casualties are removed after the whole step.
// Rolling attacks while a challenge is still unanswered means no challenge (see declineChallenges).
export function fightCombatStep(s,random=Math.random){
 if(challengePending(s))declineChallenges(s);
 const c=s.combatSession;if(s.stage!=='combat'||c?.phase!=='attacks')throw Error('Show Initiative before rolling attacks.');if(s.pendingSpell)throw Error('Resolve the dispel of the spell just cast first.');
 // Assailments cast at this step join it: their wounds are claimed before the attacks are rolled.
 const initiative=c.groups[c.step],stages=[...(c.spellStages??[])],claimed={};c.spellStages=[];for(const st of stages)claimed[st.to]=(claimed[st.to]??0)+st.unsaved;
 for(const id of c.units){
  const u=getUnit(s,id);if(c.initiative[id]!==initiative||!u||u.x===null||aliveCount(u)===0)continue;
  // Casualties from an Assailment's template come from the rear ranks: they do not thin the fighting rank.
  const lost=c.damage[id]-(c.rearLosses?.[id]??0);
  for(const [target,models]of attackAllocation(s,u,lost)){
   const t=getUnit(s,target);if(!t||aliveCount(t)===0)continue;
   const stage=attackStage(s,u,t,random,lost,{models,cap:Math.max(0,remainingWounds(t)-(claimed[target]??0))});claimed[target]=(claimed[target]??0)+stage.unsaved;stages.push(stage);
  }
 }
 // The challenge: each duellist strikes the other at its own Initiative step. Wounds beyond what
 // the other has left are Overkill (counted for a character).
 const ch=c.challenge?.stage==='fight'?c.challenge:null;
 // Mounts: at the mount's Initiative, at the enemy its rider fights (in a challenge, the other duellist).
 for(const id of c.units){const u=getUnit(s,id);if(!u||!isCharacter(u)||!MOUNTS[u.mount]||c.initiative[id+':mount']!==initiative||u.x===null||aliveCount(u)===0||u.retired)continue;
  const inDuel=ch&&[ch.challenger,ch.acceptor].includes(u.id),d=inDuel?duelist(s,ch.challenger===u.id?ch.acceptor:ch.challenger):null;if(inDuel&&!d)continue;
  const target=d?d.unit:getUnit(s,[...attackAllocation(s,u,0).keys()][0]);if(!target||aliveCount(target)===0)continue;
  const stage=attackStage(s,mountProxy(u),target,random,0,{models:modelSquares(s,u),cap:d?Infinity:Math.max(0,remainingWounds(target)-(claimed[target.id]??0))});stage.mount=MOUNTS[u.mount].name;
  if(d){const left=d.champion?1:remainingWounds(d.unit);Object.assign(stage,{unsaved:Math.min(stage.unsaved,left),duel:{from:u.id,to:d.key,champion:d.champion},overkill:0});}else claimed[target.id]=(claimed[target.id]??0)+stage.unsaved;stages.push(stage);}
 if(ch)for(const [from,to]of [[ch.challenger,ch.acceptor],[ch.acceptor,ch.challenger]]){const a=duelist(s,from),d=duelist(s,to);if(!a||!d||c.initiative[a.unit.id]!==initiative)continue;
  const stage=attackStage(s,a.unit,d.unit,random,0,{models:[a.model],cap:Infinity}),left=d.champion?1:remainingWounds(d.unit),kill=Math.min(stage.unsaved,left);
  Object.assign(stage,{unsaved:kill,saved:stage.wounds-stage.unsaved,duel:{from,to,champion:d.champion},overkill:!a.champion&&stage.unsaved>left?stage.unsaved-left:0});stages.push(stage);}
 for(const stage of stages){c.stages.push(stage);c.damage[stage.to]+=stage.unsaved;if(stage.rear)(c.rearLosses??={})[stage.to]=(c.rearLosses[stage.to]??0)+stage.unsaved;}
 // A slain champion is replaced by a rank and file model: the unit loses a model and its champion.
 for(const stage of stages){const t=getUnit(s,stage.to);if(stage.duel?.champion){if(stage.unsaved>0){removeCasualties(s,t,1,random);t.command={...(t.command??{M:true,S:true,C:true}),C:false};t.championSlain={round:s.round,by:stage.from};}}else removeCasualties(s,t,stage.unsaved,random);}
 c.step++;if(c.step>=c.groups.length)c.phase='compare';
 return {initiative,stages,next:c.phase};
}
export function compareCombat(s,random=Math.random){
 const c=s.combatSession;if(s.stage!=='combat'||c?.phase!=='compare')throw Error('Finish all Initiative steps first.');
 const unit=id=>getUnit(s,id),units=c.units.map(unit).filter(Boolean),score=sideScores(s,c.units,c.stages),standing=team=>units.some(u=>u.team===team&&aliveCount(u)>0);
 const ash=standing('ash'),iron=standing('iron'),margin=Math.abs(score.ash.total-score.iron.total);
 const winnerSide=!ash&&!iron?null:!ash?'iron':!iron?'ash':score.ash.total>score.iron.total?'ash':score.iron.total>score.ash.total?'iron':null;
 const loserSide=winnerSide?(winnerSide==='ash'?'iron':'ash'):null,outcome=!ash||!iron?'destroyed':winnerSide?'await-break':'draw';
 // A character in a unit that survives the combat moves with it: it neither tests nor pursues alone.
 const inUnit=u=>!!u.joined&&aliveCount(getUnit(s,u.joined)??{destroyed:true})>0;
 const winners=units.filter(u=>u.team===winnerSide&&aliveCount(u)>0&&!inUnit(u)).map(u=>u.id),losers=units.filter(u=>u.team===loserSide&&aliveCount(u)>0&&u.x!==null&&!inUnit(u)).map(u=>u.id);
 // The pair the combat was started from, for one-on-one reports.
 const winner=winners.includes(c.a)?c.a:winners.includes(c.b)?c.b:winners[0]??null,loser=winner?(winner===c.a?c.b:winner===c.b?c.a:null)??(units.find(u=>u.team===loserSide)?.id??null):null;
 const former=Object.fromEntries(units.map(u=>[u.id,opponentIds(u)]));
 const result={units:c.units,sides:c.sides,a:c.a,b:c.b,initiative:c.initiative,stages:c.stages,damage:c.damage,score:{...score,...Object.fromEntries(units.map(u=>[u.id,score[u.team]]))},winnerSide,loserSide,winners,losers,winner,loser,outcome,breakDice:null,breaks:{},margin,round:s.round};
 // To the Death: a challenge both duellists survive goes on in this combat's next round.
 {const ch=c.challenge;if(ch?.stage==='fight'){s.duels=(s.duels??[]).filter(d=>d.challenger!==ch.challenger&&d.acceptor!==ch.acceptor);if(duelist(s,ch.challenger)&&duelist(s,ch.acceptor))s.duels.push({challenger:ch.challenger,acceptor:ch.acceptor,since:ch.since??s.round});}result.challenge=ch?{...ch}:null;}
 for(const u of units)u.combatResolved=true;s.lastCombat=result;(s.combatHistory??=[]).push(result);s.combatSession=null;
 // The dead are removed; a destroyed unit's standard goes to the other side if any of it stands.
 for(const dead of units.filter(u=>aliveCount(u)===0)){const other=dead.team==='ash'?'iron':'ash';if(c.standards?.[dead.id]&&standing(other)&&!dead.standardClaimed){dead.standardClaimed=other;(s.trophies??=[]).push({unit:dead.id,team:other,round:s.round});}release(s,dead);if(!dead.destroyed||dead.x!==null)destroyUnit(s,dead,'COMBAT_CASUALTIES',random);}syncJoined(s);
 if(outcome==='destroyed'){const free=winners.filter(id=>unit(id).role!=='warmachine'&&!opponents(s,unit(id)).length);if(free.length){s.pendingCombat={combat:c.units,winnerSide,loserSide:null,margin,outcome:'overrun',stage:'winner-choice',winners:free,losers:[],results:{},former,winner:free[0],loser:former[free[0]]?.[0]??loser,loserDestroyed:true,retreat:{moved:0,dir:null}};}}
 // Every losing unit still facing an enemy takes a Break test, in a fixed order (not the order the
 // combat happened to be started from); one left with no enemy in contact does not.
 else if(winnerSide){const testing=[...losers].sort().filter(id=>{const l=unit(id);return l&&l.x!==null&&aliveCount(l)>0&&opponents(s,l).length;});const sideUS=team=>units.filter(u=>u.team===team&&u.x!==null&&aliveCount(u)>0).reduce((n,u)=>n+unitStrength(u),0),p=s.pendingCombat={combat:c.units,winnerSide,loserSide,margin,stage:'break',winners,losers:testing,results:{},former,loser:testing[0],strength:{winner:sideUS(winnerSide),loser:sideUS(loserSide)}};if(testing.length)p.winner=facingWinner(s,p,testing[0]);else if(!nextWinner(s,p,0))s.pendingCombat=null;}
 // Losing a round of combat loses Frenzy; the effect's other rules (Battle Lust's Hatred) stay.
 for(const id of loserSide?units.filter(u=>u.team===loserSide).map(u=>u.id):[]){const l=unit(id);for(const e of l.effects??[])if(e.rules?.some(r=>r.rule==='frenzy')){e.rules=e.rules.filter(r=>r.rule!=='frenzy');e.lostFrenzy=true;}removeEffects(l,e=>e.rule==='frenzy'||e.lostFrenzy&&!e.rules.length&&!e.mods?.length);}
 return result;
}
export function rollCombatBreak(s,random=Math.random){
 const p=s.pendingCombat;if(s.stage!=='combat'||p?.stage!=='break')throw Error('Compare combat results before the Break test.');
 const loser=getUnit(s,p.loser),winner=getUnit(s,p.winner),dice=combatDice(2,random),natural=dice[0]+dice[1],ld=leadership(loser,'normal',s);
 p.outcome=dice[0]===1&&dice[1]===1||natural+p.margin<=ld?'give-ground':natural>ld?'break':'fall-back';
 // Outnumbered: Fall Back in Good Order becomes a Break when the winning side's Unit Strength is
 // more than twice the losing side's (both after casualties; exactly twice is not enough).
 p.outnumbered=false;if(p.outcome==='fall-back'&&p.strength&&p.strength.winner>2*p.strength.loser){p.outcome='break';p.outnumbered=true;}
 // Stubborn (the Daemonsmith, or the landmark's property) turns a Break into Fall Back; it is spent
 // only when it changes the result, never on a Give Ground.
 if(loser.role==='wizard'&&loser.faction==='chaos'&&!loser.stubbornUsed&&p.outcome==='break'){loser.stubbornUsed=true;p.outcome='fall-back';p.stubborn=true;}const stubborn=effectRule(loser,'stubborn',r=>!r.used);if(stubborn&&p.outcome==='break'){stubborn.used=true;p.outcome='fall-back';p.stubborn=true;}p.breakDice=dice;
 // Nearby Friend Flees Combat: a loser of Unit Strength 5 or more that Breaks or Falls Back makes
 // friendly units within 6″ of it test for Panic before it moves.
 if(['break','fall-back'].includes(p.outcome)&&unitStrength(loser)>=5)p.panic=nearbyPanic(s,loser,{...loser},'Nearby Friend Flees Combat',random);
 // Shieldwall: a loser that did not charge, beaten by an enemy that did.
 const chargedBy=opponents(s,loser).length?opponents(s,loser):[winner].filter(Boolean);
 p.shieldwallAvailable=p.outcome==='fall-back'&&loser.role!=='warmachine'&&FACTIONS[loser.faction??'chaos'].shieldwall&&!loser.shieldwallUsed&&loser.charge?.status!=='success'&&chargedBy.some(e=>e.charge?.status==='success');
 p.stage=p.shieldwallAvailable?'loser-choice':'retreat';
 if(s.lastCombat){s.lastCombat={...s.lastCombat,outcome:p.outcome,breakDice:dice,breaks:{...s.lastCombat.breaks,[loser.id]:{dice,outcome:p.outcome,outnumbered:p.outnumbered,stubborn:!!p.stubborn}}};if(s.combatHistory?.length)s.combatHistory[s.combatHistory.length-1]=s.lastCombat;}
 const result={dice,outcome:p.outcome,loser:p.loser,leadership:ld,shieldwallAvailable:p.shieldwallAvailable,outnumbered:p.outnumbered,stubborn:!!p.stubborn};
 if(p.stage==='retreat'&&p.losers)afterBreak(s,p);
 return result;
}
export function chooseLoserAction(s,choice){
 const p=s.pendingCombat;if(s.stage!=='combat'||p?.stage!=='loser-choice')throw Error('No loser choice is available.');
 if(!['shieldwall','fall-back'].includes(choice))throw Error('Choose Shieldwall or Fall Back in Good Order.');
 if(choice==='shieldwall'){getUnit(s,p.loser).shieldwallUsed=true;p.outcome='give-ground';if(s.lastCombat){s.lastCombat={...s.lastCombat,outcome:p.outcome,breaks:{...s.lastCombat.breaks,[p.loser]:{...s.lastCombat.breaks?.[p.loser],outcome:p.outcome}}};if(s.combatHistory?.length)s.combatHistory[s.combatHistory.length-1]=s.lastCombat;}}
 p.loserChoice=choice;p.stage='retreat';const result={choice,outcome:p.outcome,loser:p.loser};if(p.losers)afterBreak(s,p);return result;
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
 if(report.fledOffBoard)destroyUnit(s,u,'FLED_OFF_TABLE',random);
 else{
  const square=(pose,m)=>[[m.x,m.y],[m.x+m.size,m.y],[m.x+m.size,m.y+m.size],[m.x,m.y+m.size]].map(([x,y])=>localPoint(pose,x,y)),models=modelSquares(s,u).filter(m=>!m.dead);
  for(const enemy of crossed.filter(v=>v.team!==u.team))for(const m of models){
   if(aliveCount(u)===0)break;
   if(polygonGap(hull([...square(leave,m),...square(end,m)]),corners(enemy))>=EPS)continue;
   const roll=rollD6(1,random)[0],lost=roll<=3;report.peril.push({enemy:enemy.id,model:m.index,roll,lost});
   if(lost)removeCasualties(s,u,1,random);
  }
  Object.assign(u,{x:end.x,y:end.y,movedThisTurn:true});
  // A fleeing unit is struck by any vortex it passes through (it moves on the ground).
  if(aliveCount(u)>0)report.vortexHits=vortexMoveHits(s,u,sweptVortices(s,u,[start,{...u}]),random,[start,{...u}]);
  if(aliveCount(u)===0)destroyUnit(s,u,'SPECIAL_RULE',random);
 }
 syncJoined(s,u);report.casualties=report.peril.filter(p=>p.lost).length;report.destroyed=!!u.destroyed;
 const from=u.x!==null?u:end;
 // Fled Through: a friendly unit this one passed through tests for Panic.
 if(depth<6)for(const friend of crossed.filter(v=>v.team===u.team&&v.role!=='warmachine'&&!v.fleeing&&!v.engaged&&v.x!==null&&aliveCount(v)>0)){const entry=panicTest(s,friend,{cause:'Fled Through',random,depth});if(entry)report.panic.push({...entry,flee:entry.move});}
 return report;
}
// ---- Ambushers: reserves and reinforcements ----
// From round 2, at each of its Start of Turns, a unit held in reserve arrives on a 4+ (in round 5 it
// arrives without a roll). It enters in Compulsory Moves, before any other unit's Remaining Move:
// its rear edge against a battlefield edge of its player's choice, facing the centre, more than 8″
// from every enemy model. It cannot march that turn, and counts as having moved for shooting.
// With no legal place on any edge, it stays in reserve and rolls again next turn.
function reserveRolls(s,team,random){const out=[];if(s.round<2)return out;for(const u of s.units.filter(u=>u.team===team&&inReserve(u)&&!u.reserve.arriving)){const roll=s.round>=5?null:rollD6(1,random)[0],arrives=roll===null||roll>=4;out.push({unit:u.id,roll,arrives});if(arrives)u.reserve.arriving=`${s.round}:${team}`;}return out;}
export const arrivals=(s,team=s.team)=>s.units.filter(u=>u.team===team&&inReserve(u)&&u.reserve.arriving===`${s.round}:${team}`);
const EDGE_HEADING={top:180,bottom:0,left:90,right:270};
export function reinforcementPose(s,u,edge,along){if(!(edge in EDGE_HEADING))return null;const h=size(u).h/2,b=boardOf(s);return {...u,heading:EDGE_HEADING[edge],x:edge==='left'?h:edge==='right'?b.width-h:along,y:edge==='top'?h:edge==='bottom'?b.height-h:along};}
export function reinforcementError(s,id,edge,along){
 const u=getUnit(s,id);if(!u||!inReserve(u))return 'This unit is not held in reserve.';
 if(s.stage!=='movement'||s.team!==u.team||u.reserve.arriving!==`${s.round}:${s.team}`)return 'It has not arrived: from round 2 it arrives on a 4+ at the Start of Turn.';
 if(s.movementStep!=='remaining')return 'It enters in Compulsory Moves, after charges.';
 if(!Number.isFinite(along))return 'Choose where along the edge it enters.';const pose=reinforcementPose(s,u,edge,along);if(!pose)return 'Choose a battlefield edge.';
 if(!clearOfEnemies(s,u.team,pose,8))return 'It cannot enter within 8″ of an enemy model.';
 return checkPosition(s,pose,pose.x,pose.y);}
export function placeReinforcement(s,id,edge,along){const error=reinforcementError(s,id,edge,along);if(error)throw Error(error);const u=getUnit(s,id),pose=reinforcementPose(s,u,edge,along);Object.assign(u,{x:pose.x,y:pose.y,heading:pose.heading,reserve:null,deployed:true,moved:false,spent:0,movementMode:null,movedThisTurn:true,reinforced:`${s.round}:${s.team}`});return u;}
// The first legal place: its own deployment zone's edges first, each searched from the middle out.
export function firstReinforcementSpot(s,id){const u=getUnit(s,id),b=boardOf(s),z=zoneOf(s,u.team),touches=edge=>z.some(p=>edge==='top'?p.y<EPS:edge==='bottom'?p.y>b.height-EPS:edge==='left'?p.x<EPS:p.x>b.width-EPS)?1:0;
 for(const edge of ['top','bottom','left','right'].sort((a,c)=>touches(c)-touches(a))){const len=edge==='top'||edge==='bottom'?b.width:b.height;for(let k=0;k<=len*2;k++){const along=len/2+(k%2?1:-1)*Math.ceil(k/2)/2;if(!reinforcementError(s,id,edge,along))return {edge,along};}}return null;}
export function autoReinforce(s,id){const spot=firstReinforcementSpot(s,id);if(!spot){getUnit(s,id).reserve.arriving=null;return null;}return placeReinforcement(s,id,spot.edge,spot.along);}
// ---- Phantasmagoria ----
// An enemy unit that ends its move within 12″ of the template tests for Panic at once, falling back
// or fleeing directly away from it if it fails; one that passes (or has no test to take) is
// Impetuous while it stays within 12″ of it. Each unit is checked once a phase.
function phantasms(s,u){return (s.vortices??[]).filter(v=>VORTEX_RULES[v.spell]?.panicRange&&vortexTeam(s,v)!==u.team&&getUnit(s,v.caster)?.x!=null&&circleGap(corners(u),{x:v.x,y:v.y,r:v.radius??1.5})<=VORTEX_RULES[v.spell].panicRange+EPS);}
function endOfMove(s,u,random=Math.random){
 if(!u||u.x===null||aliveCount(u)===0||u.role==='warmachine')return null;const key=`${s.round}:${s.team}:${s.stage}`;if(u.moveEnded===key)return null;u.moveEnded=key;const out=[];
 for(const v of phantasms(s,u)){if(u.x===null||u.fleeing)break;const test=panicTest(s,u,{away:{x:v.x,y:v.y},cause:SPELLS[v.spell].name,random});if(!test||test.passed)u.phantasm=v.id;if(test)out.push({...test,vortex:v.id});}
 return out.length?out:null;}
// Impetuous: an Orc Mob always; any unit made so by a Phantasmagoria while within 12″ of it.
export function isImpetuous(s,u){if(!u)return false;if(FACTIONS[u.faction??'chaos']?.impetuous)return true;return !!u.phantasm&&phantasms(s,u).some(v=>v.id===u.phantasm);}
// ---- Panic ----
// The nearest enemy that is not itself fleeing.
function steadyEnemy(s,u){return combatants(s).filter(v=>v.team!==u.team&&v.x!==null&&aliveCount(v)>0&&!v.fleeing).sort((a,b)=>gap(u,a)-gap(u,b))[0]??null;}
// A Panic test: 2D6 against Leadership, at most once a phase for each unit (a Frenzied unit
// passes; a unit in combat or a war machine does not test). Failing it, a unit that still has more
// than half its starting models Falls Back in Good Order: it moves as a fleeing unit by the higher
// of 2D6, then rallies. Otherwise it flees 2D6″. It moves directly away from `away` (the enemy
// that caused the test), or from the nearest enemy that is not fleeing.
export function panicTest(s,unit,{away=null,cause='Panic',random=Math.random,depth=0}={}){
 if(!unit||unit.x===null||unit.joined||aliveCount(unit)===0||unit.fleeing||unit.engaged||unit.role==='warmachine')return null;
 const key=`${s.round}:${s.team}:${s.stage}`;if(unit.panicTested===key)return null;unit.panicTested=key;
 const dice=rollD6(2,random),frenzy=hasRule(unit,'frenzy'),passed=frenzy||dice[0]+dice[1]<=leadership(unit,'normal',s),entry={unit:unit.id,cause,dice,passed,...(frenzy?{frenzy:true}:{})};(s.panicLog??=[]).push(entry);
 if(passed)return entry;
 const from=away&&away.x!==null?away:steadyEnemy(s,unit);if(from)unit.heading=normalize(Math.atan2(unit.x-from.x,-(unit.y-from.y))*180/Math.PI);
 const good=aliveCount(unit)*2>(isCharacter(unit)?1:startingModels(unit)),flee=rollD6(2,random),distance=(good?Math.max(...flee):flee[0]+flee[1])+swift(unit,random);
 unit.fleeing=true;unit.moved=true;const move=fleeMove(s,unit,distance,random,depth+1);if(good&&unit.x!==null)unit.fleeing=false;syncJoined(s,unit);
 return Object.assign(entry,{outcome:good?'fall-back':'flee',fleeDice:flee,distance,fledOffBoard:move.fledOffBoard,move});
}
// Heavy Casualties: a unit that loses more than a quarter of the models it had at the start of a
// phase (other than Combat) tests for Panic, and if it fails moves away from the enemy that caused it.
function heavyCasualties(s,u,before,source=null,random=Math.random){if(!u||s.stage==='combat'||u.x===null||isCharacter(u)||u.role==='warmachine')return null;const key=`${s.round}:${s.team}:${s.stage}`;if(u.phaseStart?.key!==key)u.phaseStart={key,models:before};return u.phaseStart.models-aliveCount(u)>u.phaseStart.models/4+EPS?panicTest(s,u,{away:source,cause:'Heavy Casualties',random}):null;}
// Nearby Friend Destroyed, Nearby Friend Flees Combat: friendly units within 6″ test for Panic.
function nearbyPanic(s,u,pose,cause,random=Math.random){const out=[];for(const f of s.units.filter(f=>f.team===u.team&&f.id!==u.id&&f.x!==null&&!f.joined&&aliveCount(f)>0&&!f.fleeing&&!f.engaged&&gap(f,pose)<=6+EPS)){const r=panicTest(s,f,{cause,random});if(r)out.push(r);}return out;}
// A broken unit turns directly away from the victor and flees.
function fleeFrom(s,u,enemy,distance,random){
 const dx=u.x-enemy.x,dy=u.y-enemy.y,len=Math.hypot(dx,dy)||1,dir={x:dx/len,y:dy/len};u.heading=normalize(Math.atan2(dir.x,-dir.y)*180/Math.PI);
 const flee=fleeMove(s,u,distance,random);return {moved:flee.distance,offBoard:flee.fledOffBoard,dir,flee};
}
// Two units left touching after a combat move are still fighting each other.
function stillTouching(a,b){return a.x!==null&&b.x!==null&&aliveCount(a)>0&&aliveCount(b)>0&&a.team!==b.team&&!a.fleeing&&!b.fleeing&&!engagedWith(a,b)&&gap(a,b)<EPS;}
// Units touching a mover when it sets off (the rest of its combat) only stop it if it would
// move into them; everything else keeps the usual 1" away.
const touchingAtStart=(s,u)=>new Set(combatants(s).filter(v=>v.id!==u.id&&v.x!==null&&aliveCount(v)>0&&gap(u,v)<EPS).map(v=>v.id));
function retreatPose(s,u,enemy,distance,stopNear=true){
 const dx=u.x-enemy.x,dy=u.y-enemy.y,len=Math.hypot(dx,dy)||1,dir={x:dx/len,y:dy/len},start={x:u.x,y:u.y},touching=touchingAtStart(s,u);let moved=0;
 for(let i=1;i<=Math.ceil(distance*20);i++){
  const d=Math.min(distance,i/20),pose={...u,x:start.x+dir.x*d,y:start.y+dir.y*d};
  if(offBoard(pose,s))break;
  const obstructed=combatants(s).some(v=>v.x!==null&&v.id!==u.id&&v.id!==enemy.id&&(touching.has(v.id)?overlaps(pose,v):gap(pose,v)<1-EPS))||terrainBlocks(s,corners(pose));
  if(obstructed)break;
  Object.assign(u,{x:pose.x,y:pose.y,movedThisTurn:true});moved=d;
 }
 syncJoined(s,u);return {moved,offBoard:false,dir};
}
// A pursuer that meets a fresh enemy is locked in combat with it until next turn. One that meets
// an enemy already in a combat not yet fought this phase joins that combat and fights in it
// (counting as charging, and it will not pursue again).
function pursuitAdvance(s,winner,distance,dir,ignoredId,originalId,random=Math.random){
 const start={x:winner.x,y:winner.y},touching=touchingAtStart(s,winner);let moved=0,contact=null,blocked=false,offBoardPursuit=false,joined=false;
 // Reaching the table edge (not one it already touched) takes the pursuer off the table until it returns.
 const edges=p=>{const r=rectangle(p),b=boardOf(s);return [r.left<EPS&&'left',r.right>b.width-EPS&&'right',r.top<EPS&&'top',r.bottom>b.height-EPS&&'bottom'].filter(Boolean);},startEdges=edges(winner);
 for(let i=1;i<=Math.ceil(distance*20);i++){
  const d=Math.min(distance,i/20),pose={...winner,x:start.x+dir.x*d,y:start.y+dir.y*d},reached=edges(pose).filter(e=>!startEdges.includes(e));
  if(offBoard(pose,s)||reached.length){
   const r=rectangle(pose),edge=reached[0]??(r.left<0?'left':r.right>boardOf(s).width?'right':r.top<0?'top':'bottom');
   winner.offBoardPursuit={edge,x:winner.x,y:winner.y};winner.x=null;winner.y=null;offBoardPursuit=true;break;
  }
  if(terrainBlocks(s,corners(pose))){blocked=true;break;}
  const obstacle=combatants(s).find(v=>v.id!==winner.id&&v.id!==ignoredId&&v.x!==null&&aliveCount(v)>0&&(v.team===winner.team?(touching.has(v.id)?overlaps(pose,v):gap(pose,v)<1-EPS):gap(pose,v)<EPS));
  if(obstacle){
   if(obstacle.team!==winner.team){
    // Move only as far as first contact rather than to the step that overlaps.
    let lo=moved,hi=d;for(let k=0;k<24;k++){const mid=(lo+hi)/2;if(gap({...winner,x:start.x+dir.x*mid,y:start.y+dir.y*mid},obstacle)<EPS)hi=mid;else lo=mid;}
    Object.assign(winner,{x:start.x+dir.x*hi,y:start.y+dir.y*hi});moved=hi;contact=obstacle.id;
    if(!obstacle.fleeing){const aligned=alignedContact(winner,obstacle);if(!offBoard(aligned,s)&&!combatants(s).some(v=>v.id!==winner.id&&v.id!==obstacle.id&&v.x!==null&&aliveCount(v)>0&&(v.team===winner.team&&engagedWith(v,obstacle)?overlaps(aligned,v):gap(aligned,v)<1-EPS)))Object.assign(winner,{x:aligned.x,y:aligned.y,heading:aligned.heading});}
    if(obstacle.fleeing){claimStandard(s,obstacle,winner.team);destroyUnit(s,obstacle,'RUN_DOWN',random);}
    else{
     const unfought=obstacle.engaged&&!obstacle.combatResolved;engage(winner,obstacle);
     if(obstacle.id!==originalId){winner.charge={target:obstacle.id,status:'success',distance:moved,face:chargeFace(winner,obstacle),pursuit:true};if(unfought){winner.combatResolved=false;joined=true;winner.pursued=true;}else{winner.pursuitPending=true;winner.combatResolved=obstacle.combatResolved=true;}}
    }
   }else blocked=true;
   break;
  }
  Object.assign(winner,{x:pose.x,y:pose.y,movedThisTurn:true});moved=d;
 }
 // A pursuer is struck by any vortex it passes through.
 const path=[{...winner,x:start.x,y:start.y},{...winner}],vortexHits=winner.x!==null&&moved>0?vortexMoveHits(s,winner,sweptVortices(s,winner,path),random,path):[];
 syncJoined(s);return {distance:moved,contact,blocked,offBoardPursuit,joined,vortexHits};
}
// After the combat result, each losing unit in turn takes its Break test and moves; then each
// winning unit that is no longer touching an enemy follows up, pursues or restrains against one of
// the units it was fighting. A one-on-one combat is a queue of one loser and one winner.
function winnerTarget(s,p,id){
 const former=(p.former?.[id]??[]).filter(f=>f!==id),moved=former.filter(f=>p.results?.[f]&&!p.results[f].noPursuit);
 if(moved.length){const order={break:0,'fall-back':1,'give-ground':2},best=[...moved].sort((a,b)=>order[p.results[a].outcome]-order[p.results[b].outcome]||unitStrength(getUnit(s,b))-unitStrength(getUnit(s,a))||a.localeCompare(b))[0];return {loser:best,outcome:p.results[best].outcome};}
 const dead=former.filter(f=>getUnit(s,f)?.destroyed&&!p.results?.[f]);
 return dead.length&&dead.length===former.length?{loser:dead[0],outcome:'overrun'}:null;
}
function nextWinner(s,p,from){
 for(let i=from;i<(p.winners?.length??0);i++){
  const decl=p.declarations?.[p.winners[i]],w=getUnit(s,p.winners[i]);
  if(decl){if(decl.done||!w||w.x===null||aliveCount(w)===0)continue;
   // A winner still touching an enemy once the losers have moved cannot pursue: its declaration lapses.
   if(opponents(s,w).length){decl.done=true;decl.lapsed=true;continue;}
   const r=p.results[decl.target]??{};Object.assign(p,{stage:'winner-choice',winnerIndex:i,winner:w.id,loser:decl.target,outcome:decl.outcome,retreat:r.retreat??{moved:0,dir:null},retreatDice:r.retreatDice??null,fleeDistance:r.fleeDistance??0,loserDestroyed:!!r.loserDestroyed||!!getUnit(s,decl.target)?.destroyed});return true;}
  // A unit that pursued into another combat this phase does not pursue again.
  if(!w||w.x===null||aliveCount(w)===0||w.role==='warmachine'||w.pursued||opponents(s,w).length)continue;
  const t=winnerTarget(s,p,w.id);if(!t||p.declarations&&t.outcome!=='overrun')continue;const r=p.results[t.loser]??{};
  Object.assign(p,{stage:'winner-choice',winnerIndex:i,winner:w.id,loser:t.loser,outcome:t.outcome,retreat:r.retreat??{moved:0,dir:null},retreatDice:r.retreatDice??null,fleeDistance:r.fleeDistance??0,loserDestroyed:t.outcome==='overrun'||!!r.loserDestroyed||!!getUnit(s,t.loser)?.destroyed});
  return true;
 }
 return false;
}
// The combat is over: no further loser or winner choices.
function endAftermath(s,p,fallback){
 s.pendingCombat=null;
 if(s.lastCombat&&!s.lastCombat.aftermath&&fallback){s.lastCombat={...s.lastCombat,aftermath:fallback};if(s.combatHistory?.length)s.combatHistory[s.combatHistory.length-1]=s.lastCombat;}
 // Units left in contact keep fighting next turn.
 const units=[...new Set([...(p.combat??[]),p.winner,p.loser])].map(id=>getUnit(s,id)).filter(Boolean);
 for(const a of units)for(const b of units)if(a.team==='ash'&&stillTouching(a,b))engage(a,b);
 syncJoined(s);
}
// Move on after a loser has moved: the next loser's Break test, then the winners.
// ---- The aftermath order, for combats built by compareCombat: every losing unit takes its Break
// test (and any Shieldwall choice); then each winner that can pursue declares pursuit or restraint,
// and which single loser it pursues, before any loser rolls its retreat; then every loser moves;
// then the declared pursuits are made, one at a time.
const BREAK_KEYS=['outcome','breakDice','shieldwallAvailable','loserChoice','retreat','retreatDice','fleeDistance','loserDestroyed','stubborn','outnumbered'];
function afterBreak(s,p){
 p.results={...p.results,[p.loser]:{...p.results?.[p.loser],outcome:p.outcome,breakDice:p.breakDice,loserChoice:p.loserChoice??null,stubborn:!!p.stubborn,outnumbered:!!p.outnumbered}};
 const i=p.losers.indexOf(p.loser),next=p.losers.slice(i+1).find(id=>{const u=getUnit(s,id);return u&&u.x!==null&&aliveCount(u)>0&&opponents(s,u).length;});
 if(next){for(const key of BREAK_KEYS)delete p[key];Object.assign(p,{stage:'break',loser:next});p.winner=facingWinner(s,p,next);return;}
 p.declarations={};p.declaring=p.winners.filter(id=>canDeclarePursuit(s,p,id));
 if(p.declaring.length){Object.assign(p,{stage:'declare',winner:p.declaring[0]});return;}
 startRetreats(s,p);
}
function canDeclarePursuit(s,p,id){const w=getUnit(s,id);return !!w&&w.x!==null&&!w.joined&&aliveCount(w)>0&&w.role!=='warmachine'&&!w.pursued&&(p.former?.[id]??[]).some(f=>p.results?.[f]?.outcome&&getUnit(s,f)?.role!=='warmachine');}
// The losers this winner fought, with their Break outcomes: broken units first.
export function pursuitTargets(s,id){const p=s.pendingCombat;if(!p)return [];const order={break:0,'fall-back':1,'give-ground':2};return (p.former?.[id]??[]).filter(f=>p.results?.[f]?.outcome&&getUnit(s,f)?.role!=='warmachine').sort((a,b)=>order[p.results[a].outcome]-order[p.results[b].outcome]||unitStrength(getUnit(s,b))-unitStrength(getUnit(s,a))||a.localeCompare(b)).map(f=>({id:f,outcome:p.results[f].outcome}));}
// A winner declares, before the losers move: pursue (or follow up), pursue and reform, or restrain;
// and which loser. A restraint test is taken now, before any retreat dice are seen.
export function declarePursuit(s,id,choice='follow',targetId=null,random=Math.random){
 const p=s.pendingCombat;if(s.stage!=='combat'||p?.stage!=='declare')throw Error('Pursuit is declared after the Break tests, before the losers move.');
 if(id!==p.winner)throw Error(`${getUnit(s,p.winner)?.name??p.winner} declares next.`);
 if(!['follow','follow-reform','restrain'].includes(choice))throw Error('Choose pursue, pursue and reform, or restrain.');
 const w=getUnit(s,id),targets=pursuitTargets(s,id);if(hasRule(w,'frenzy')&&choice==='restrain')choice='follow';
 const target=targetId??targets[0]?.id;if(!targets.some(t=>t.id===target))throw Error('Choose a losing unit this regiment fought.');
 const decl={choice,target,outcome:p.results[target].outcome,follow:choice!=='restrain'};
 if(choice==='restrain'){const dice=combatDice(2,random),failed=dice[0]+dice[1]>leadership(w,'restraint',s);decl.restraint={dice,passed:!failed};decl.follow=failed;}
 p.declarations[id]=decl;
 if(s.lastCombat){s.lastCombat={...s.lastCombat,declarations:{...s.lastCombat.declarations,[id]:{choice:decl.choice,target,restraint:decl.restraint??null}}};if(s.combatHistory?.length)s.combatHistory[s.combatHistory.length-1]=s.lastCombat;}
 const next=p.declaring[p.declaring.indexOf(id)+1];if(next)p.winner=next;else startRetreats(s,p);
 return {...decl,winner:id};
}
function startRetreats(s,p){const first=p.losers.find(id=>p.results?.[id]?.outcome&&getUnit(s,id)?.x!==null);if(first){loadLoser(s,p,first);return;}if(!nextWinner(s,p,0))endAftermath(s,p);}
// Restore one loser's Break outcome for its retreat.
function loadLoser(s,p,id){for(const key of BREAK_KEYS)delete p[key];const r=p.results[id];Object.assign(p,{stage:'retreat',loser:id,outcome:r.outcome,breakDice:r.breakDice,loserChoice:r.loserChoice,stubborn:r.stubborn,outnumbered:r.outnumbered});p.winner=facingWinner(s,p,id);}
function afterLoser(s,p,fallback){
 if(p.losers){
  const i=p.losers.indexOf(p.loser),next=p.losers.slice(i+1).find(id=>p.results?.[id]?.outcome&&!p.results[id].retreat&&getUnit(s,id)?.x!==null&&aliveCount(getUnit(s,id))>0);
  if(next){loadLoser(s,p,next);return false;}
  if(nextWinner(s,p,0))return false;
  endAftermath(s,p,fallback);return true;
 }
 // A hand-built single pair: its winner chooses next unless it cannot pursue.
 const winner=getUnit(s,p.winner);
 if(winner?.role==='warmachine'||fallback?.hold){endAftermath(s,p,fallback);return true;}
 p.stage='winner-choice';return false;
}
export function moveCombatLoser(s,random=Math.random){
 const p=s.pendingCombat;if(s.stage!=='combat'||p?.stage!=='retreat')throw Error('Resolve the Break test and any Shieldwall choice first.');
 const loser=getUnit(s,p.loser),winner=getUnit(s,p.winner);
 if(loser.role==='warmachine'){
  // A war machine never moves: its crew abandon it if it breaks, otherwise it fights on.
  const abandoned=p.outcome==='break';if(abandoned){loser.wounds=0;loser.crew=0;release(s,loser);destroyUnit(s,loser,'SPECIAL_RULE',random);}
  const move={distance:0,dice:null,outcome:p.outcome,offBoard:false,abandoned};
  p.results={...p.results,[loser.id]:{outcome:p.outcome,retreat:{moved:0,dir:null},noPursuit:true,loserDestroyed:abandoned}};
  if(s.lastCombat){s.lastCombat={...s.lastCombat,loserMove:move};if(s.combatHistory?.length)s.combatHistory[s.combatHistory.length-1]=s.lastCombat;}
  const finished=afterLoser(s,p,{winner:p.winner,loser:p.loser,outcome:p.outcome,choice:abandoned?'restrain':'hold',rolls:{},movement:{loser:0},loserDestroyed:abandoned,hold:true});
  return {loser:loser.id,...move,finished};
 }
 release(s,loser);
 const dice=p.outcome==='give-ground'?null:combatDice(2,random),distance=p.outcome==='give-ground'?2:Math.max(1,(p.outcome==='fall-back'?Math.max(...dice):dice[0]+dice[1])-(FACTIONS[loser.faction??'chaos'].resolute?1:0)+(p.outcome==='give-ground'?0:swift(loser,random)));
 // Only a unit that Breaks can leave the battlefield (fleeing off it, it is lost); one that Gives
 // Ground or Falls Back in Good Order stops at the edge.
 const before={...loser},retreat=p.outcome==='break'?fleeFrom(s,loser,winner,distance,random):retreatPose(s,loser,winner,distance);if(retreat.offBoard&&loser.x!==null)destroyUnit(s,loser,'FLED_OFF_TABLE',random);
 if(p.outcome!=='break'&&loser.x!==null){const crossed=sweptVortices(s,loser,[before,{...loser}]);if(crossed.length)retreat.vortexHits=vortexMoveHits(s,loser,crossed,random,[before,{...loser}]);}
 if(p.outcome==='break'&&loser.x!==null)loser.fleeing=true;
 // Each Break outcome is kept as its own record, apart from the fleeing flag (a unit that Falls Back rallies).
 loser.combatOutcome={kind:{'give-ground':'GAVE_GROUND','fall-back':'FELL_BACK',break:'BROKE'}[p.outcome],round:s.round,outnumbered:!!p.outnumbered};
 // A loser that could not get clear is still fighting whoever it touches.
 for(const e of combatants(s))if(stillTouching(loser,e))engage(loser,e);
 const loserDestroyed=!!retreat.offBoard||!!loser.destroyed;
 p.results={...p.results,[loser.id]:{outcome:p.outcome,retreat,retreatDice:dice,fleeDistance:distance,loserDestroyed}};
 Object.assign(p,{retreat,retreatDice:dice,fleeDistance:distance,loserDestroyed});syncJoined(s);
 if(s.lastCombat){s.lastCombat={...s.lastCombat,loserMove:{distance:retreat.moved,dice,outcome:p.outcome,offBoard:!!retreat.offBoard,flee:retreat.flee??null},loserMoves:{...s.lastCombat.loserMoves,[loser.id]:{distance:retreat.moved,dice,outcome:p.outcome,offBoard:!!retreat.offBoard}},outcomes:{...s.lastCombat.outcomes,[loser.id]:loser.combatOutcome.kind}};if(s.combatHistory?.length)s.combatHistory[s.combatHistory.length-1]=s.lastCombat;}
 const finished=afterLoser(s,p,{winner:p.winner,loser:p.loser,outcome:p.outcome,choice:'restrain',rolls:{},movement:{loser:retreat.moved},loserDestroyed});
 return {loser:loser.id,outcome:p.outcome,distance:retreat.moved,dice,offBoard:!!retreat.offBoard,flee:retreat.flee??null,finished};
}
export function winnerCombat(s,choice='follow',random=Math.random,reformHeading=null){
 const p=s.pendingCombat;if(s.stage!=='combat'||p?.stage!=='winner-choice')throw Error('Move the losing regiment before the winner decides.');
 if(!['follow','follow-reform','restrain'].includes(choice))throw Error('Choose follow, follow and reform, or restrain.');
 const winner=getUnit(s,p.winner),loser=getUnit(s,p.loser),out={winner:p.winner,loser:p.loser,outcome:p.outcome,choice,rolls:{},movement:{loser:p.retreat?.moved??0},loserDestroyed:p.loserDestroyed};
 if(reformHeading!==null&&(!Number.isFinite(reformHeading)||reformHeading<0||reformHeading>=360))throw Error('Choose a facing from 0° to 359°.');
 const reform=()=>{const target={...winner,heading:normalize(reformHeading??heading(winner))},error=checkPosition(s,target,target.x,target.y,false,{moving:true});out.reform={passed:!error,heading:heading(winner),error};if(!error){winner.heading=target.heading;out.reform.heading=winner.heading;}};
 // A declared winner makes the move it declared before the losers moved; its restraint test, if
 // any, was taken then.
 const decl=p.declarations?.[p.winner];if(decl){choice=decl.choice;decl.done=true;}
 if(hasRule(winner,'frenzy')&&choice==='restrain')choice='follow';out.choice=choice;
 let follow=choice!=='restrain';
 if(decl?.restraint){out.rolls.restraint=decl.restraint.dice;follow=decl.follow;out.restraintFailed=follow;}
 else if(choice==='restrain'){const dice=combatDice(2,random);out.rolls.restraint=dice;follow=dice[0]+dice[1]>leadership(winner,'restraint',s);out.restraintFailed=follow;}
 // Restrained: a free reform. With a facing given it is made at once (after an overrun or a Give
 // Ground, as before); otherwise it is offered (reformOffer) for the player to choose the facing.
 if(!follow){if(reformHeading!==null){if(p.outcome==='overrun'||p.outcome==='give-ground')reform();}else out.reformOffer=offerReform(s,winner,'free','restrained');}
 if(follow){
  let advance=p.retreat?.moved??0,dir=p.retreat?.dir??null,chase=0;
  if(p.outcome!=='give-ground'){
   // Pursuit and overrun: the total of 2D6 (Resolute: −1).
   const dice=combatDice(2,random);out.rolls.pursuit=dice;
   chase=Math.max(1,dice[0]+dice[1]-(FACTIONS[winner.faction??'chaos'].resolute?1:0)+swift(winner,random));out.pursuitDistance=chase;advance=chase;
   if(p.outcome==='overrun')dir={x:Math.sin(rad(heading(winner))),y:-Math.cos(rad(heading(winner)))};
   else if(loser.x!==null){
    // A pursuer pivots about its centre toward the unit it pursues, then moves; it catches only by reaching it.
    const dx=loser.x-winner.x,dy=loser.y-winner.y,len=Math.hypot(dx,dy)||1,turned={...winner,heading:normalize(Math.atan2(dx,-dy)*180/Math.PI)};dir={x:dx/len,y:dy/len};
    if(!checkPosition(s,turned,turned.x,turned.y,false,{moving:true}))winner.heading=turned.heading;out.heading=heading(winner);
   }
   dir??={x:Math.sin(rad(heading(winner))),y:-Math.cos(rad(heading(winner)))};out.direction=dir;
  }
  if(advance>0&&dir){
   const moved=pursuitAdvance(s,winner,advance,dir,null,loser.id,random);
   out.movement.winner=moved.distance;out.contact=moved.contact;out.blocked=moved.blocked;out.offBoardPursuit=moved.offBoardPursuit;out.joinedCombat=moved.joined;
   if(p.outcome==='break'&&moved.contact===loser.id&&loser.destroyed){out.loserDestroyed=true;out.runDown=loser.id;}
   // Catching a unit that Fell Back in Good Order does not destroy it: the combat goes on, and the
   // pursuer counts as charging next turn.
   if(p.outcome==='fall-back'&&moved.contact===loser.id&&loser.x!==null){out.caughtInGoodOrder=true;engage(winner,loser);winner.charge={target:loser.id,status:'success',distance:chase,face:chargeFace(winner,loser),pursuit:true};winner.pursuitPending=true;out.countsAsCharging=true;}
   if(moved.contact&&moved.contact!==loser.id&&getUnit(s,moved.contact)?.x!==null)out.countsAsCharging=true;
   if(p.outcome==='give-ground'&&loser.x!==null&&gap(winner,loser)<EPS)engage(winner,loser);
  }
 }
 // Running down a fleeing enemy: an attempt to reform, offered (the facing is chosen afterwards).
 if(follow&&(out.runDown||out.contact&&getUnit(s,out.contact)?.destroyedBy==='RUN_DOWN')&&reformHeading===null&&winner.x!==null)out.reformOffer=offerReform(s,winner,'leadership','ran down');
 else if(choice==='follow-reform'&&out.loserDestroyed&&!opponents(s,winner).length&&winner.x!==null){const dice=combatDice(2,random);out.rolls.reform=dice;if(dice[0]+dice[1]<=leadership(winner,'restraint',s))reform();else out.reform={passed:false,heading:heading(winner),error:'Leadership test failed.'};}
 if(p.outcome==='overrun')out.overrun=follow;
 // A loser that could not move away is still in the fight: the combat continues next turn.
 if(!out.loserDestroyed&&loser&&(stillTouching(winner,loser)||engagedWith(winner,loser))){engage(winner,loser);out.stillEngaged=true;}
 if(s.lastCombat){s.lastCombat={...s.lastCombat,aftermath:out,aftermaths:{...s.lastCombat.aftermaths,[winner.id]:out}};if(s.combatHistory?.length)s.combatHistory[s.combatHistory.length-1]=s.lastCombat;}
 syncJoined(s);if(!(p.winners&&nextWinner(s,p,(p.winnerIndex??0)+1)))endAftermath(s,p,null);
 return out;
}
// ---- Saving and resuming a battle ----
// A battle is plain data, so a save is its JSON with what it is, a version and when it was saved
// (extra carries the app's own settings, such as who plays the opponent). Loading checks the file
// and gives the battle back exactly as it stood.
export const SAVE_VERSION=1;
export function saveSummary(s){return {format:s.format?.name??'Classic battle',points:s.format?.points??null,round:s.round,stage:s.stage,team:s.team,finished:s.stage==='finished'};}
export function saveGame(s,extra={}){return JSON.stringify({app:'Project-TOW',version:SAVE_VERSION,saved:new Date().toISOString(),summary:saveSummary(s),...extra,state:s});}
export function loadGame(text){
 let data;try{data=typeof text==='string'?JSON.parse(text):text;}catch{throw Error('That file is not a saved battle: it could not be read.');}
 if(data?.app!=='Project-TOW'||!data.state)throw Error('That file is not a Project-TOW saved battle.');
 if(!(data.version<=SAVE_VERSION))throw Error('That battle was saved by a newer version of the game.');
 const s=data.state;if(!Array.isArray(s.units)||!s.board||!s.format||![...PHASES,'deployment','finished'].includes(s.stage))throw Error('The saved battle is incomplete.');
 if(s.format.id&&s.format.id!=='classic'&&!FORMAT_RULES[s.format.id])throw Error(`The rules for ${s.format.name??s.format.id} are not loaded.`);
 const extra=Object.fromEntries(Object.entries(data).filter(([k])=>!['app','version','saved','summary','state'].includes(k)));
 return {state:s,saved:data.saved??null,summary:data.summary??saveSummary(s),extra};}
// ---- Reforming after a combat or a run-down ----
// A unit that passes its Restraint test may make a free reform; one that runs down a fleeing enemy
// (with a charge or a pursuit) may attempt to reform by passing a Leadership test. The reform is
// offered once the move is made, and the player then chooses the facing (or keeps its own). An
// offer lasts until the end of the phase.
function offerReform(s,u,test,reason){if(!u||u.x===null||u.destroyed||opponents(s,u).length)return null;s.reformOffers=[...(s.reformOffers??[]).filter(o=>o.unit!==u.id),{unit:u.id,test,reason,turn:`${s.round}:${s.team}`,stage:s.stage}];return test;}
export function reformOffer(s,id){const o=(s.reformOffers??[]).find(o=>o.unit===id),u=getUnit(s,id);if(!o||!u||u.x===null||u.destroyed||u.engaged||u.fleeing||o.turn!==`${s.round}:${s.team}`||o.stage!==s.stage)return null;return o;}
export function reformError(s,id,to){const u=getUnit(s,id);if(!reformOffer(s,id))return 'This unit has no reform to make.';if(!Number.isFinite(to))return 'Choose a facing.';const error=checkPosition(s,{...u,heading:normalize(to)},u.x,u.y,false,{moving:true});return error?`Turned to ${Math.round(normalize(to))}° it would not fit: ${error}`:null;}
export function reformUnit(s,id,to,random=Math.random){
 const error=reformError(s,id,to);if(error)throw Error(error);const o=reformOffer(s,id),u=getUnit(s,id),out={unit:id,test:o.test,reason:o.reason,passed:true,dice:null,from:heading(u)};
 if(o.test==='leadership'){out.dice=rollD6(2,random);out.leadership=leadership(u,'normal',s);out.passed=out.dice[0]+out.dice[1]<=out.leadership;}
 s.reformOffers=s.reformOffers.filter(x=>x!==o);if(out.passed){u.heading=normalize(to);syncJoined(s,u);}out.heading=heading(u);return out;}
export function declineReform(s,id){s.reformOffers=(s.reformOffers??[]).filter(o=>o.unit!==id);}
// Finish the whole aftermath at once: Break tests (Shieldwall when offered), retreats, and every
// winner's choice.
export function finishCombat(s,choice='follow',random=Math.random,reformHeading=null){
 if(s.stage!=='combat'||!s.pendingCombat)throw Error('No combat outcome is waiting.');
 let out=null;
 for(let guard=0;guard<64&&s.pendingCombat;guard++){
  const p=s.pendingCombat;
  if(p.stage==='break')rollCombatBreak(s,random);
  else if(p.stage==='loser-choice')chooseLoserAction(s,'shieldwall');
  else if(p.stage==='retreat'||!p.stage&&p.outcome!=='overrun'){p.stage='retreat';moveCombatLoser(s,random);}
  else if(p.stage==='declare')declarePursuit(s,p.winner,choice,null,random);
  else{if(!p.stage)p.stage='winner-choice';out=winnerCombat(s,choice,random,reformHeading);}
 }
 return out??s.lastCombat?.aftermath;
}
