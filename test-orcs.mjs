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
 assert.match(A.validateRoster({faction:'orc',entries:[{entry:'oddgit',general:true,options:{rubyRing:true}},{entry:'nightGoblins',models:20,fanatics:1},{entry:'nightGoblins',models:20}]},500).errors.join(' '),/Fanatics are not modelled yet/);
});
test('the partly built list is offered for Green, with what is missing listed',()=>{
 const r=A.defaultRoster('orc',500);assert.equal(r.id,'orc-squig-750');assert.equal(A.rosterCost(r),396,'the Oddgit with its Ruby Ring, the Warboss on his Giant Cave Squig, and both Night Goblin units');assert.ok(r.missing.some(m=>/Mangler Squig/.test(m)));
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
// The Ruby Ring of Ruin: Fireball (Battle Magic) as a bound spell, Power Level 1.
function ringShot(){const s=game();Object.assign(s,{stage:'shooting',team:'iron'});const w=s.units.find(u=>u.team==='iron'&&u.role==='wizard'),t=s.units.find(u=>u.team==='ash'&&u.role==='infantry');
 Object.assign(w,{x:t.x,y:t.y-14,heading:180});for(const u of s.units)if(u.team==='iron'&&u!==w&&u.x!==null&&Math.hypot(u.x-w.x,u.y-w.y)<7)u.x+=9;return {s,w,t};}
const faces=(...f)=>{let i=0;return ()=>(f[Math.min(i++,f.length-1)]-1)/6+.01;};
test('the Ruby Ring casts Fireball at 2D6 + 1, with no Miscast and no Perfect Invocation, once a phase',()=>{
 const {s,w,t}=ringShot();assert.deepEqual(w.bound,[{key:'fireball',power:1,item:'Ruby Ring of Ruin'}]);assert.equal(w.spells.includes('fireball'),false,'not one of its own spells');
 const r=G.castSpell(s,w.id,'fireball',t.id,faces(1,1),{bound:true});assert.equal(r.casting,3);assert.equal(r.cast,false);assert.equal(r.miscast,undefined,'a double 1 just fails');
 assert.match(G.castBlockReason(s,w.id,'fireball',{bound:true}),/one|this phase/);assert.equal(w.castThisTurn.length,0,'its own casting attempts are untouched');
 const p=ringShot();Object.assign(G.getUnit(p.s,'A6'),{x:p.w.x+4,y:p.w.y,heading:0});const q=G.attemptSpell(p.s,p.w.id,'fireball',p.t.id,faces(6,6,6),{bound:true});assert.equal(q.casting,13);assert.equal(q.perfect,false);assert.equal(q.pending,true,'a double 6 can still be dispelled');
 const d=G.resolveDispel(p.s,G.dispelOptions(p.s).wizards[0].id,faces(1,1));assert.equal(d.dispel.miscast,undefined,'no Outclassed in the Art against a bound spell');
});
const AI=await import('./dist/ai.mjs');
test('the bot casts the Ring\'s Fireball when it is worth it',()=>{
 AI.setSide('iron');const {s,w}=ringShot();w.spells=[];for(const u of s.units)if(u.team==='iron'&&u!==w)u.x=null;
 const out=AI.takeStep(s,()=>.5);assert.match(out.message,/Fireball \(bound, Ruby Ring of Ruin\)/);
});
// Random Movement (rulebook) and the Night Goblin Warboss on a Giant Cave Squig.
const warbossGame=()=>{const s=game(750);Object.assign(s,{stage:'movement',team:'iron',movementStep:'declare'});for(const u of s.units)u.charge=null;const w=s.units.find(u=>u.kind==='ngWarboss'),e=s.units.find(u=>u.team==='ash'&&u.role==='infantry');
 Object.assign(w,{x:e.x,y:e.y-G.size(e).h/2-8-1,heading:180});for(const u of s.units)if(u!==w&&u.x!==null&&u.team==='iron'&&Math.hypot(u.x-w.x,u.y-w.y)<9)u.x+=14;return {s,w,e};};
test('the Warboss: 97 points with his kit, Wounds 4 on a 50 mm Giant Cave Squig, light armour, a random mover',()=>{
 assert.equal(A.entryCost('orc',{entry:'warboss',options:{greatWeapon:true,lightArmour:true,charmedShield:true,potion:true},mount:'giantCaveSquig'}),97);
 const {s,w}=warbossGame();assert.equal(G.profile(w).W,4);assert.equal(G.armourSave(w),6);assert.equal(G.troopType(w),'monstrousCavalry');assert.equal(G.unitStrength(w),3);assert.ok(Math.abs(G.size(w).w-50/25.4)<1e-9);
 assert.equal(G.isRandomMover(w),true);assert.equal(G.randomDice(w),3);assert.equal(w.weapon,'greatWeapon');
});
test('a random mover rolls 3D6 in Compulsory Moves and moves first; it cannot declare a charge, march or move back',()=>{
 const {s,w,e}=warbossGame();assert.match(G.chargePlan(s,w,e).error,/cannot declare a charge/);
 G.finishDeclarations(s,faces(1,2,1));assert.equal(s.movementStep,'remaining');assert.deepEqual(w.randomRoll.dice,[1,2,1]);assert.equal(w.randomRoll.total,4);
 const other=s.units.find(u=>u.team==='iron'&&u.kind==='nightGoblin');assert.match(G.orderError(s,other,{kind:'advance',mode:'advance',distance:1}),/random movers move first/);
 assert.match(G.orderError(s,w,{kind:'advance',mode:'march',distance:2}),/cannot march/);assert.match(G.orderError(s,w,{kind:'back',mode:'advance',distance:1}),/wheel and move forward/);
 assert.match(G.orderError(s,w,{kind:'advance',mode:'advance',distance:4.5})??'',/exceeds/,'no more than the roll');assert.equal(G.orderError(s,w,{kind:'advance',mode:'advance',distance:4}),null);
 assert.match(G.randomChargeError(s,w,e),/maximum 4″/,'8″ away: a roll of 4 falls short');
});
test('a random mover whose roll reaches an enemy may move into contact: it counts as charging, and the enemy must Hold',()=>{
 const {s,w,e}=warbossGame();G.finishDeclarations(s,faces(4,5,3));assert.deepEqual(G.randomChargeTargets(s,w).map(t=>t.id),[e.id]);
 const r=G.randomCharge(s,w.id,e.id);assert.equal(w.charge.status,'success');assert.equal(w.charge.random,true);assert.equal(w.charge.reaction,'hold');assert.ok(Math.abs(r.distance-8)<.05);
 assert.ok(G.gap(w,e)<1e-6);assert.deepEqual(e.engaged,[w.id]);assert.equal(G.randomMoversWaiting(s,'iron').length,0,'the others may move now');
 Object.assign(s,{stage:'combat'});G.beginCombat(s,w.id);const init=s.combatSession.initiative;assert.equal(init[w.id+':mount'],3+3,'the Giant Cave Squig strikes for itself at its Initiative 3, +3 for charging');assert.ok(init[w.id]<init[w.id+':mount'],'the Warboss, with a great weapon, strikes last');
});
