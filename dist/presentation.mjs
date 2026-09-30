export const THEMES={
 ash:{primary:'#7a2f22',hover:'#933c2b',ink:'#5a2418',soft:'#f0ddd3',softHover:'#e6c7b8',line:'#9a5a48',inch:'#c46a52',done:'#8a4434'},
 empire:{primary:'#274b66',hover:'#34617f',ink:'#1d3a50',soft:'#dbe6ee',softHover:'#c4d6e3',line:'#56768c',inch:'#5f8fb0',done:'#3d5f78'},
 orc:{primary:'#3f522c',hover:'#526539',ink:'#344527',soft:'#e0e3c8',softHover:'#d8dfbb',line:'#7f8864',inch:'#899d5b',done:'#56663f'}
};

export const PHASE_SUBSTEPS={
 strategy:['Start of turn & magic','Rally fleeing troops'],
 movement:['Declare charges','Roll charges','Remaining moves & magic'],
 shooting:['Missiles & magic','Roll to hit & wound','Remove casualties'],
 combat:['Magic & fight by Initiative','Combat result','Break test','Pursuit']
};

export function themeFor(state){return THEMES[state.team==='ash'?'ash':state.units.find(u=>u.team==='iron')?.faction??'empire'];}
export function unitName(unit){
 if(!unit)return 'No unit selected';
 if(unit.role==='wizard')return unit.name;
 if(unit.role==='missile')return unit.name;
 return `${unit.name} ${'ABC'[Number(unit.id.slice(1))-1]??unit.id}`;
}
export function shortName(unit){
 if(!unit)return '';
 if(unit.role==='wizard')return unit.faction==='chaos'?'Daemonsmith':'Battlemage';
 if(unit.role==='missile')return unit.faction==='chaos'?'Decimators':unit.faction==='empire'?'Missile Troops':'Warbows';
 return `${unit.faction==='chaos'?'Warriors':unit.faction==='empire'?'State Troops':'Orc Mob'} ${'ABC'[Number(unit.id.slice(1))-1]??''}`;
}
export function scoreRows(state,game){
 const opponent=state.units.find(u=>u.team==='iron')?.faction??'empire';
 return ['ash','iron'].map(team=>{
  const mine=state.units.filter(u=>u.team===team),enemy=state.units.filter(u=>u.team!==team),rocket=team==='ash';
  const cannons=team==='iron'?state.cannons??[]:[],enemyCannons=team==='ash'?state.cannons??[]:[];
  return {team,name:team==='ash'?'Chaos Dwarfs':opponent==='orc'?'Orc & Goblin Tribes':'Empire of Man',faction:team==='ash'?'chaos':opponent,units:mine.filter(u=>!u.destroyed&&game.aliveCount(u)>0).length+(rocket&&state.rocket.wounds>0?1:0)+cannons.filter(c=>c.wounds>0).length,models:mine.reduce((n,u)=>n+game.aliveCount(u),0)+(rocket&&state.rocket.wounds>0?state.rocket.crew:0)+cannons.reduce((n,c)=>n+(c.wounds>0?c.crew:0),0),engaged:mine.filter(u=>u.engaged&&u.x!==null).length,vp:(enemy.filter(u=>u.destroyed||u.fleeing).length+enemyCannons.filter(c=>c.wounds<=0).length)*100};
 });
}
// Signed rotation in degrees (−180 to 180) that animations take between two headings,
// so a left wheel from 0° to 330° turns 30° left instead of spinning 330° right.
export function shortestTurn(from,to){return ((((to-from)%360)+540)%360)-180;}
export function substepIndex(state,uiSub=0){
 if(state.stage==='movement')return {declare:0,charges:1,remaining:2}[state.movementStep]??2;
 if(state.stage==='combat'){
  if(state.combatSession)return state.combatSession.phase==='attacks'?0:1;
  if(state.pendingCombat)return state.pendingCombat.stage==='winner-choice'?3:2;
 }
 return Math.min(Math.max(uiSub,0),(PHASE_SUBSTEPS[state.stage]?.length??1)-1);
}
