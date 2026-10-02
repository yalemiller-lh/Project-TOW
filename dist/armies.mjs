// Costed army entries this engine can play, and Battle March muster validation.
// Costs come from the newrecruit Old World data files (BattleScribe format) named in SOURCES.
export const SOURCES={
 system:{name:'Warhammer The Old World game system (newrecruit)',revision:188},
 chaos:{name:'Chaos Dwarfs – Renegades 2.0 (newrecruit)',revision:10,catalogue:'1681-d51d-8ccc-69cc'},
 empire:{name:'The Empire of Man (newrecruit)',revision:136,catalogue:'7b8f-602e-29cd-5786'},
 orc:{name:'Orc and Goblin Tribes (newrecruit)',revision:192,catalogue:'c997-9d47-72ad-c5f1'},
};
// Player preferences are not rules: they only filter what is offered or generated.
export const PREFERENCES={excluded:[{name:'K’daai Fireborn',faction:'chaos',reason:'Player preference: never included in selectable or generated armies (not a rules restriction).'}]};

// role: the engine model (regiment 'infantry'/'missile', single 'wizard', 'warmachine').
// restricted: counts against Battle March's single "0–X per 1,000 points" selection.
export const ENTRIES={
 chaos:{
  daemonsmith:{name:'Daemonsmith Sorcerer',category:'characters',role:'wizard',base:85,options:{level2:{name:'Wizard Level 2',cost:30,required:true}},general:true,lores:{options:['daemonology','darkMagic','elementalism','battle'],default:'daemonology'}},
  warriors:{name:'Chaos Dwarf Warriors',category:'core',role:'infantry',troop:'heavy',perModel:7,minModels:5,options:{shields:{name:'Shields',perModel:1,required:true}},command:{C:{name:'Veteran Warrior',cost:6},S:{name:'Standard Bearer',cost:6},M:{name:'Musician',cost:6}}},
  decimators:{name:'Blunderbuss Decimators',category:'core',role:'missile',troop:'heavy',perModel:10,minModels:5,options:{shields:{name:'Shields',perModel:1}},command:{C:{name:'Veteran Warrior',cost:6},S:{name:'Standard Bearer',cost:6},M:{name:'Musician',cost:6}}},
  deathshrieker:{name:'Deathshrieker Rocket Launcher',category:'special',role:'warmachine',base:110,restricted:'0–2 per 1,000 points'},
 },
 empire:{
  captain:{name:'Captain of the Empire',category:'characters',role:'character',kind:'empireCaptain',base:45,options:{greatWeapon:{name:'Great weapon',cost:4},fullPlate:{name:'Full plate armour',cost:6}},mounts:{warhorse:{name:'Empire Warhorse',cost:12,us:2},barded:{name:'Barded Warhorse',cost:16,us:2},pegasus:{name:'Pegasus',cost:30,us:3}},general:true},
  masterMage:{name:'Master Mage',category:'characters',role:'wizard',base:60,options:{level2:{name:'Wizard Level 2',cost:30,required:true}},mounts:{warhorse:{name:'Empire Warhorse',cost:12,us:2},pegasus:{name:'Pegasus',cost:30,us:3}},general:true,lores:{options:['battle'],default:'battle'}},
  stateTroops:{name:'State Troops',category:'core',role:'infantry',troop:'regular',perModel:5,minModels:10,options:{spears:{name:'Thrusting spears',perModel:1},shields:{name:'Shields',perModel:1}},command:{C:{name:'Sergeant',cost:5},S:{name:'Standard Bearer',cost:5},M:{name:'Musician',cost:5}}},
  missileTroops:{name:'State Missile Troops (crossbows)',category:'core',role:'missile',troop:'regular',perModel:7,minModels:10,command:{C:{name:'Sergeant',cost:5},S:{name:'Standard Bearer',cost:5},M:{name:'Musician',cost:5}}},
  greatCannon:{name:'Great Cannon',category:'special',role:'warmachine',base:125,restricted:"1 single 'per 1000 points' selection in Battle March"},
 },
 orc:{
  orcMob:{name:'Orc Mob',category:'core',role:'infantry',troop:'regular',perModel:5,minModels:5,command:{C:{name:'Boss',cost:7},S:{name:'Standard Bearer',cost:5},M:{name:'Musician',cost:5}}},
  // Night Goblins: shields are free (a shortbow or thrusting spear is 1 point a model); Fanatics are 25 points each.
  warboss:{name:'Night Goblin Warboss',category:'characters',role:'character',kind:'ngWarboss',base:55,options:{greatWeapon:{name:'Great weapon',cost:4},lightArmour:{name:'Light armour',cost:3},charmedShield:{name:'Charmed Shield',cost:5,notModelled:true},potion:{name:'Potion of Foolhardiness',cost:5,notModelled:true}},mounts:{giantCaveSquig:{name:'Giant Cave Squig',cost:25,us:3}},general:true},
  oddgit:{name:'Goblin Oddgit',category:'characters',role:'wizard',base:60,options:{level2:{name:'Wizard Level 2',cost:30,required:true},rubyRing:{name:'Ruby Ring of Ruin',cost:35}},general:true,lores:{options:['elementalism','waaagh'],default:'elementalism'}},
  nightGoblins:{name:'Night Goblins',category:'core',role:'infantry',kind:'nightGoblin',troop:'regular',perModel:3,minModels:10,options:{shields:{name:'Shields',perModel:0}},command:{C:{name:'Boss',cost:7},S:{name:'Standard Bearer',cost:5},M:{name:'Musician',cost:5}},extras:{fanatics:{name:'Fanatic',cost:25,notModelled:true}}},
 },
};
// Rules of these armies not modelled yet, shown to the player instead of guessing.
export const NOT_MODELLED={chaos:['The Daemonsmith’s ridden monsters (Great Taurus, Bale Taurus, Lammasu) are not modelled: a Level 2 Daemonsmith on one is over the 25% character allowance at 500–750 points anyway.'],empire:['Counter Charge (Barded Warhorse, Pegasus) is not modelled.','A Pegasus flies when it moves; its charges are made on the ground.','A mounted character cannot join an infantry regiment here (it would stand on the flank).']};
// Gaps this engine cannot yet represent; shown to the player instead of guessing.
export const GAPS={
 orc:['Orc Mob warbows have no points cost in the source data (revision 192), so warbow mobs are not offered.'],
};

const US_PER_MODEL={regular:1,heavy:1};
export function entryOf(faction,key){const e=ENTRIES[faction]?.[key];if(!e)throw Error(`Unknown army entry "${key}" for ${faction}.`);return e;}
export function entryCost(faction,item){
 const e=entryOf(faction,item.entry),models=e.perModel?item.models:1;let cost=(e.base??0)+(e.perModel??0)*models;
 for(const [k,o]of Object.entries(e.options??{}))if(o.required||item.options?.[k])cost+=(o.cost??0)+(o.perModel??0)*models;
 for(const [k,c]of Object.entries(e.command??{}))if(item.command?.[k])cost+=c.cost;
 if(item.mount)cost+=e.mounts?.[item.mount]?.cost??0;
 for(const [k,x]of Object.entries(e.extras??{}))cost+=(item[k]??0)*x.cost;
 return cost;
}
export function entryUnitStrength(faction,item){const e=entryOf(faction,item.entry);return e.role==='warmachine'?3:e.role==='wizard'||e.role==='character'?(e.mounts?.[item.mount]?.us??1):item.models*(US_PER_MODEL[e.troop]??1);}
export function rosterCost(roster){return roster.entries.reduce((n,item)=>n+entryCost(roster.faction,item),0);}

// Battle March muster rules, as given in the Battle March brief, plus the Grand Army category
// limits from the game-system data. Percentages are of the agreed points limit.
export const BATTLE_MARCH_LIMITS={entry:{characters:25,core:35,special:30,rare:25,mercenaries:25},category:{characters:{max:50},core:{min:25},special:{max:50},rare:{max:25},mercenaries:{max:20}},maxUnitStrength:20,minUnits:2,restrictedSelections:1};
const CATEGORY_NAME={characters:'character',core:'Core unit',special:'Special unit',rare:'Rare unit',mercenaries:'Mercenary unit'};
const fmt=n=>Number.isInteger(n)?String(n):n.toFixed(1);
// Lores of Magic by key; the engine implements all four a Daemonsmith may know.
export const LORE_NAMES={battle:'Battle Magic',daemonology:'Daemonology',darkMagic:'Dark Magic',elementalism:'Elementalism',waaagh:'Waaagh! Magic'};
export const LORES_IMPLEMENTED=['battle','daemonology','darkMagic','elementalism'];
export function validateRoster(roster,points,{format='battle-march'}={}){
 const errors=[],faction=roster.faction,entries=roster.entries,total=rosterCost(roster),L=BATTLE_MARCH_LIMITS;
 for(const gap of format==='battle-march'&&!Object.values(ENTRIES[faction]??{}).some(e=>e.general)?GAPS[faction]??[]:[])errors.push(gap);
 if(total>points)errors.push(`The army costs ${total} points; the limit is ${points}.`);
 for(const item of entries){
  const e=entryOf(faction,item.entry),cost=entryCost(faction,item),label=item.label??e.name;
  if(PREFERENCES.excluded.some(x=>x.name===e.name))errors.push(`${e.name} is excluded by player preference.`);
  if(e.perModel&&(!Number.isInteger(item.models)||item.models<e.minModels))errors.push(`${label} needs at least ${e.minModels} models; it has ${item.models}.`);
  if(item.mount&&!e.mounts?.[item.mount])errors.push(`${label} cannot ride that mount.`);
  for(const [k,o]of Object.entries(e.options??{}))if(o.notModelled&&item.options?.[k])errors.push(`${label}: ${o.name} is not modelled yet.`);
  for(const [k,x]of Object.entries(e.extras??{}))if(x.notModelled&&item[k])errors.push(`${label}: ${x.name}s are not modelled yet.`);
  if(e.maxModels&&item.models>e.maxModels)errors.push(`${label} may have at most ${e.maxModels} models; it has ${item.models}.`);
  if(e.lores){const lore=item.lore??e.lores.default;if(!e.lores.options.includes(lore))errors.push(`${label} cannot use ${LORE_NAMES[lore]??lore}.`);else if(!LORES_IMPLEMENTED.includes(lore))errors.push(`${LORE_NAMES[lore]} is not implemented yet.`);}
  if(format!=='battle-march')continue;
  const cap=points*L.entry[e.category]/100;
  if(cost>cap)errors.push(`${label} costs ${cost} points; the ${CATEGORY_NAME[e.category]} ceiling is ${fmt(cap)} (${L.entry[e.category]}% of ${points}).`);
  const us=entryUnitStrength(faction,item);if(us>L.maxUnitStrength)errors.push(`${label} has Unit Strength ${us}; no mustered unit may exceed ${L.maxUnitStrength}.`);
 }
 if(format==='battle-march'){
  const generals=entries.filter(i=>i.general);
  if(generals.length!==1)errors.push(generals.length?'Only one character may be the General.':'Choose one eligible character as the General.');
  for(const g of generals)if(!entryOf(faction,g.entry).general)errors.push(`${entryOf(faction,g.entry).name} is not eligible to be the General.`);
  const units=entries.filter(i=>entryOf(faction,i.entry).category!=='characters');
  if(units.length<L.minUnits)errors.push(`The army needs at least ${L.minUnits} non-character units; it has ${units.length}.`);
  const restricted=entries.filter(i=>entryOf(faction,i.entry).restricted);
  if(restricted.length>L.restrictedSelections)errors.push(`${restricted.length} restricted per-1,000 selections taken (${restricted.map(i=>entryOf(faction,i.entry).name).join(', ')}); only one is permitted.`);
  for(const [cat,rule]of Object.entries(L.category)){
   const spent=entries.filter(i=>entryOf(faction,i.entry).category===cat).reduce((n,i)=>n+entryCost(faction,i),0),limit=points*(rule.max??rule.min)/100;
   if(rule.max!==undefined&&spent>limit)errors.push(`${cat[0].toUpperCase()+cat.slice(1)} total ${spent} points is over the ${rule.max}% allowance (${fmt(limit)}).`);
   if(rule.min!==undefined&&spent<limit)errors.push(`Core total ${spent} points is under the ${rule.min}% minimum (${fmt(limit)}).`);
  }
 }
 return {legal:errors.length===0,errors,total,points};
}

// The player's 500-point Battle March lists.
export const LISTS={
 'chaos-500':{name:'Chaos Dwarfs · 500',faction:'chaos',points:500,entries:[
  {entry:'daemonsmith',general:true},
  {entry:'warriors',models:19,command:{C:true,S:true,M:true}},
  {entry:'decimators',models:9,options:{shields:true},command:{M:true}},
  {entry:'deathshrieker'},
 ]},
 'empire-500':{name:'Empire of Man · 500',faction:'empire',points:500,entries:[
  {entry:'captain',general:true,options:{greatWeapon:true,fullPlate:true}},
  {entry:'masterMage'},
  {entry:'stateTroops',models:20,options:{spears:true,shields:true},command:{C:true,S:true,M:true}},
  {entry:'missileTroops',models:10,command:{M:true}},
  {entry:'greatCannon'},
 ]},
 // The user's squig list of 2 October 2026 (748 points), built a unit at a time: what is not modelled
 // yet is left out and listed in `missing`.
 'orc-squig-750':{name:'Orc & Goblin Tribes · 750 (squigs, partly built)',faction:'orc',points:750,entries:[
  {entry:'oddgit',general:true,lore:'elementalism',options:{rubyRing:true}},
  {entry:'warboss',options:{greatWeapon:true,lightArmour:true},mount:'giantCaveSquig'},
  {entry:'nightGoblins',models:30,options:{shields:true},command:{C:true,S:true,M:true}},
  {entry:'nightGoblins',models:20,options:{shields:true},command:{C:true,S:true,M:true}},
 ],missing:['2 Fanatics with the 30 Night Goblins (50 points)','the Warboss’s Charmed Shield and Potion of Foolhardiness (5 points each)','2 Night Goblin Squig Herds, 5 Cave Squigs and 1 Herder each (53 points each)','7 Night Goblin Squig Hoppers with cavalry spears (91 points)','Mangler Squig (95 points)']},
};
// Every roster offered for a faction, best match for the points limit first.
export function rostersFor(faction,points){const all=[...Object.entries(LISTS).filter(([,l])=>l.faction===faction).map(([id,l])=>({id,...l})),...Object.entries(PRESETS).filter(([,l])=>l.faction===faction).map(([id,l])=>({id:'sample-'+id,points:750,...l,name:l.name+' · 750 sample'}))];return all.sort((x,y)=>(x.points<=points?0:1)-(y.points<=points?0:1)||Math.abs(points-x.points)-Math.abs(points-y.points));}
export function defaultRoster(faction,points){return rostersFor(faction,points).find(r=>r.playable!==false)??null;}
// Sample 750-point Battle March armies; validated before they are ever shown as legal.
export const PRESETS={
 chaos:{name:'Chaos Dwarf warband',faction:'chaos',entries:[
  {entry:'daemonsmith',general:true},
  {entry:'warriors',models:20,command:{C:true,S:true,M:true}},
  {entry:'warriors',models:20,command:{C:true,S:true,M:true}},
  {entry:'decimators',models:15,command:{C:true,S:true,M:true}},
  {entry:'deathshrieker'},
 ]},
 empire:{name:'Empire gun line',faction:'empire',entries:[
  {entry:'masterMage',general:true},
  {entry:'stateTroops',models:20,options:{shields:true},command:{C:true,S:true,M:true}},
  {entry:'stateTroops',models:20,options:{shields:true},command:{C:true,S:true,M:true}},
  {entry:'stateTroops',models:15,options:{shields:true},command:{C:true,S:true,M:true}},
  {entry:'missileTroops',models:20,command:{C:true,S:true,M:true}},
  {entry:'greatCannon'},
 ]},
};
