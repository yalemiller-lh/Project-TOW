import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
import * as A from './dist/armies.mjs';
import './dist/battlemarch.mjs';

// Orc & Goblin Tribes (green): the user's squig list of 2 October 2026, built a unit at a time.
// Costs and profiles: Orc and Goblin Tribes (newrecruit, revision 192).
const test=(name,fn)=>{fn();console.log('PASS '+name);};
const game=(points=500)=>{const s=G.createGame('orc',{format:'battle-march',points,terrain:{method:'none'}});G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'ash'});return s;};

test('the list\'s costs: Oddgit 125 with the Ruby Ring, 30 Night Goblins 157 with two Fanatics, 20 Night Goblins 77',()=>{
 assert.equal(A.entryCost('orc',{entry:'oddgit',options:{rubyRing:true}}),60+30+35);
 assert.equal(A.entryCost('orc',{entry:'nightGoblins',models:30,options:{shields:true},command:{C:true,S:true,M:true},fanatics:2}),157);
 assert.equal(A.entryCost('orc',{entry:'nightGoblins',models:20,options:{shields:true},command:{C:true,S:true,M:true}}),77);
 assert.match(A.validateRoster({faction:'orc',entries:[{entry:'oddgit',general:true,options:{rubyRing:true}},{entry:'nightGoblins',models:20,fanatics:1},{entry:'nightGoblins',models:20}]},500).errors.join(' '),/Ruby Ring of Ruin is not modelled yet.*Fanatics are not modelled yet/);
});
test('the partly built list is offered for Green, with what is missing listed',()=>{
 const r=A.defaultRoster('orc',500);assert.equal(r.id,'orc-squig-750');assert.equal(A.rosterCost(r),274);assert.ok(r.missing.some(m=>/Mangler Squig/.test(m)));
 const v=A.validateRoster(r,500);assert.deepEqual(v.errors,['Night Goblins has Unit Strength 30; no mustered unit may exceed 20.'],'only the Battle March Unit Strength cap');
});
test('Night Goblins: their own profile, 25 mm bases, free shields, a Boss with A2 Ld5, Horde, Warband, no Choppas',()=>{
 const s=game(),ng=s.units.filter(u=>u.kind==='nightGoblin');assert.deepEqual(ng.map(u=>[u.name,u.letter,u.models]),[['Night Goblins','A',30],['Night Goblins','B',20]]);
 const [a]=ng;assert.deepEqual(G.profile(a),{M:4,WS:2,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:4,save:7});assert.equal(G.baseSize(a),25);assert.equal(G.armourSave(a),6,'a shield');
 assert.equal(G.championProfile(a).A,2);assert.equal(G.championProfile(a).Ld,5);assert.equal(G.hasWarband(a),true);assert.match(G.equipment(a),/shields/);
 a.deadModels=[];const w=s.units.find(u=>u.team==='iron'&&u.role==='wizard');w.x=null;assert.equal(G.leadership(a,'normal',s),5+3,'the Boss’s Ld 5, and Warband +3 for its ranks (Horde allows a third)');
 const t=s.units.find(u=>u.team==='ash'&&u.role==='infantry'),still=G.saveTarget(t,a);a.charge={status:'success',distance:4};assert.equal(G.saveTarget(t,a),still,'no Choppas Armour Piercing on the charge');a.charge=null;
});
test('the Goblin Oddgit: a Level 2 wizard of Elementalism on a 25 mm base',()=>{
 const s=game(),w=s.units.find(u=>u.team==='iron'&&u.role==='wizard');assert.equal(w.name,'Goblin Oddgit');assert.equal(w.lore,'elementalism');assert.deepEqual(G.profile(w),{M:4,WS:3,BS:3,S:3,T:3,W:2,I:3,A:1,Ld:6,save:7});assert.equal(G.baseSize(w),25);
 assert.equal(G.armyName('iron',s),'Orc & Goblin Tribes · Green');
});
