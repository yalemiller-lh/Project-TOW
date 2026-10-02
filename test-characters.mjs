import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
import * as A from './dist/armies.mjs';

const test=(name,fn)=>{fn();console.log('PASS '+name);};
const game500=()=>G.createGame('empire',{format:'battle-march',points:500});
// Put a and b in frontal contact (a charging b if charged is set) in the Combat phase.
function engage(s,a,b,charged=false){Object.assign(a,{x:24,y:20,heading:0,engaged:b.id});Object.assign(b,{x:24,y:20-(G.size(a).h+G.size(b).h)/2,heading:180,engaged:a.id});if(charged)a.charge={target:b.id,status:'success',distance:4,face:'front'};s.stage='combat';}

test('the 500-point lists build as legal armies with their characters, options and command',()=>{
 const s=game500();assert.equal(s.armies.ash.roster.name,'Chaos Dwarfs · 500');assert.equal(s.armies.iron.roster.name,'Empire of Man · 500');assert.ok(s.armies.ash.validation.legal&&s.armies.iron.validation.legal);
 const captain=s.units.find(u=>u.role==='character');assert.deepEqual([captain.id,captain.general,captain.weapon,captain.armour,captain.cost],['I12',true,'greatWeapon','fullPlate',55]);
 const spears=s.units.find(u=>u.entry==='stateTroops');assert.deepEqual([spears.models,spears.spears,spears.shields,spears.cost],[20,true,true,155]);
 const bows=s.units.find(u=>u.entry==='missileTroops');assert.deepEqual([bows.models,bows.command],[10,{C:false,S:false,M:true}]);
 const dec=s.units.find(u=>u.entry==='decimators');assert.deepEqual([dec.models,dec.shields,dec.cost],[9,true,105]);assert.equal(s.units.find(u=>u.entry==='warriors').models,19);
 assert.equal(A.defaultRoster('orc',500).id,'orc-squig-750','the squig list, partly built');
});
test('the Captain has his profile, full plate armour, and a great weapon at S+2 that strikes last',()=>{
 const s=game500(),captain=s.units.find(u=>u.role==='character'),warriors=s.units.find(u=>u.entry==='warriors');
 assert.deepEqual(G.profile(captain),{M:4,WS:5,BS:5,S:4,T:4,W:2,I:4,A:2,Ld:9,save:4});assert.equal(G.unitStrength({...captain,x:1}),1);assert.equal(G.startingWounds(captain),2);
 assert.equal(G.woundTarget(captain,warriors),2);assert.equal(G.saveTarget(warriors,captain),5,'3+ with Parry, worsened by AP -2');
 engage(s,captain,warriors);const c=G.beginCombat(s,captain.id);assert.equal(c.initiative[captain.id],1);assert.equal(c.initiative[warriors.id],2);
});
test('thrusting spears fight in an extra rank, but not in a turn they charged, and brace against a frontal charge',()=>{
 {const s=game500(),spears=s.units.find(u=>u.entry==='stateTroops'),foe=s.units.find(u=>u.entry==='warriors');engage(s,spears,foe);assert.equal(G.modelSquares(s,spears).filter(m=>m.fighting).length,15);}
 {const s=game500(),spears=s.units.find(u=>u.entry==='stateTroops'),foe=s.units.find(u=>u.entry==='warriors');engage(s,spears,foe,true);assert.equal(G.modelSquares(s,spears).filter(m=>m.fighting).length,5);}
 {const s=game500(),spears=s.units.find(u=>u.entry==='stateTroops'),foe=s.units.find(u=>u.entry==='warriors');engage(s,foe,spears,true);const c=G.beginCombat(s,foe.id);assert.equal(c.initiative[spears.id],4,'I3 +1 when charged in the front');}
});
test('Decimators with shields save one better; hailshot rerolls 1s to wound only when ten or more fire',()=>{
 const s=game500(),dec=s.units.find(u=>u.entry==='decimators'),troops=s.units.find(u=>u.entry==='stateTroops');assert.equal(G.hasShield(dec),true);assert.equal(G.saveTarget(dec,troops),4);
 const fire=models=>{const t=G.createGame('empire',{format:'battle-march',points:500,rosters:{ash:{faction:'chaos',entries:[{entry:'daemonsmith',general:true},{entry:'decimators',models},{entry:'warriors',models:10}]}}});const d=t.units.find(u=>u.entry==='decimators'),target=t.units.find(u=>u.entry==='stateTroops');
  Object.assign(d,{x:24,y:30,heading:0});Object.assign(target,{x:24,y:22});for(const u of t.units)if(u!==d&&u!==target){u.x=null;u.y=null;}t.cannons.forEach(c=>c.x=null);t.rocket.x=null;Object.assign(t,{stage:'shooting',team:'ash'});return G.shoot(t,d.id,target.id,()=>0);};
 assert.ok(fire(20).dice.woundReroll,'20 Decimators: more than ten fire');assert.equal(fire(9).dice.woundReroll,undefined,'9 Decimators: fewer than ten fire');
});
