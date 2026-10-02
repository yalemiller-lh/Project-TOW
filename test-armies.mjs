import assert from 'node:assert/strict';
import * as A from './dist/armies.mjs';
import * as G from './dist/game.mjs';

const test=(name,fn)=>{fn();console.log('PASS '+name);};
const chaos=(...entries)=>({faction:'chaos',entries:[{entry:'daemonsmith',general:true},...entries]});
const warriors=(models,command={C:true,S:true,M:true})=>({entry:'warriors',models,command});
const errors=(roster,points=750)=>A.validateRoster(roster,points).errors;

test('entry costs include every purchased upgrade and command model',()=>{
 assert.equal(A.entryCost('chaos',{entry:'daemonsmith'}),115);assert.equal(A.entryCost('chaos',warriors(20)),178);assert.equal(A.entryCost('chaos',warriors(20,{})),160);
 assert.equal(A.entryCost('chaos',{entry:'decimators',models:15,command:{C:true,S:true,M:true}}),168);assert.equal(A.entryCost('empire',{entry:'stateTroops',models:20,options:{shields:true},command:{C:true,S:true,M:true}}),135);assert.equal(A.entryCost('empire',{entry:'stateTroops',models:20,command:{C:true,S:true,M:true}}),115);
});
test('the preset armies pass Battle March validation at 750 points',()=>{
 for(const faction of ['chaos','empire']){const v=A.validateRoster(A.PRESETS[faction],750);assert.deepEqual(v.errors,[],faction);assert.ok(v.total<=750&&v.total>=740,faction+' '+v.total);}
});
test('single-entry ceilings compare exact percentages without rounding up',()=>{
 assert.deepEqual(errors(chaos(warriors(10),warriors(10)),460),[]);
 assert.match(errors(chaos(warriors(10),warriors(10)),450).join('\n'),/Daemonsmith Sorcerer costs 115 points; the character ceiling is 112\.5 \(25% of 450\)/);
 assert.match(errors({faction:'empire',entries:[{entry:'masterMage',general:true},{entry:'stateTroops',models:10},{entry:'greatCannon'}]},400).join('\n'),/Great Cannon costs 125 points; the Special unit ceiling is 120 \(30% of 400\)/);
 assert.match(errors(chaos({entry:'decimators',models:15,command:{C:true,S:true,M:true}},warriors(5)),400).join('\n'),/Blunderbuss Decimators costs 168 points; the Core unit ceiling is 140/);
});
test('Unit Strength 20 is accepted and 21 rejected',()=>{
 assert.equal(errors(chaos(warriors(20),warriors(10))).filter(e=>/Unit Strength/.test(e)).length,0);
 assert.match(errors(chaos(warriors(21),warriors(10))).join('\n'),/Unit Strength 21; no mustered unit may exceed 20/);
});
test('the army needs a General and two non-character units; war machines count',()=>{
 assert.match(errors({faction:'chaos',entries:[{entry:'daemonsmith'},warriors(10),warriors(10)]}).join('\n'),/Choose one eligible character as the General/);
 assert.match(errors(chaos(warriors(10))).join('\n'),/at least 2 non-character units; it has 1/);
 assert.equal(errors(chaos(warriors(20),{entry:'deathshrieker'})).filter(e=>/non-character/.test(e)).length,0);
});
test('one restricted per-1,000 selection is allowed across the army; a second is rejected',()=>{
 assert.equal(errors(chaos(warriors(20),{entry:'deathshrieker'})).filter(e=>/restricted/.test(e)).length,0);
 assert.match(errors(chaos(warriors(20),{entry:'deathshrieker'},{entry:'deathshrieker'})).join('\n'),/2 restricted per-1,000 selections taken .*; only one is permitted/);
});
test('the army total and the category allowances are checked',()=>{
 assert.match(errors(chaos(warriors(20),warriors(20),warriors(20),warriors(20)),750).join('\n'),/The army costs 827 points; the limit is 750/);
 assert.match(errors({faction:'chaos',entries:[{entry:'daemonsmith',general:true},{entry:'deathshrieker'},{entry:'decimators',models:5}]},400).join('\n'),/Core total 50 points is under the 25% minimum/);
});
test('an Orc & Goblin army takes its Goblin Oddgit as General; Orc Mobs alone cannot field one',()=>{
 assert.match(errors({faction:'orc',entries:[{entry:'orcMob',models:20},{entry:'orcMob',models:20}]}).join('\n'),/Choose one eligible character as the General/);
 assert.equal(G.createGame('orc',{format:'battle-march'}).armies.iron.roster.id,'orc-squig-750');
});
test('K’daai Fireborn are never offered, by player preference',()=>{
 assert.ok(!Object.values(A.ENTRIES).some(f=>Object.values(f).some(e=>/K.daai/.test(e.name))));assert.match(A.PREFERENCES.excluded[0].reason,/preference/);
});
test('Battle March games are built from the rosters, with costs and real sizes',()=>{
 const s=G.createGame('empire',{format:'battle-march',points:750});
 assert.deepEqual(s.units.filter(u=>u.team==='ash').map(u=>[u.id,u.name,u.models??1,u.cost]),[['A6','Daemonsmith Sorcerer',1,115],['A1','Chaos Dwarf Warriors',20,178],['A2','Chaos Dwarf Warriors',20,178],['A3','Blunderbuss Decimators',15,168]]);
 assert.equal(s.rocket.cost,110);assert.equal(s.cannons.length,1);assert.equal(s.cannons[0].cost,125);assert.equal(G.getUnit(s,'A6').general,true);assert.equal(s.armies.ash.validation.legal,true);assert.equal(s.armies.ash.source.revision,10);
 const noRocket=G.createGame('empire',{format:'battle-march',rosters:{ash:chaos(warriors(20),warriors(20))}});assert.equal(noRocket.rocket.absent,true);G.autoDeploy(noRocket);G.begin(noRocket,()=>0,{firstPlayer:'ash'});assert.equal(noRocket.stage,'strategy');
});
