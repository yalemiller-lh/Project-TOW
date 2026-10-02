import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

// Elementalism and Dark Magic (The Lores of Magic, newrecruit data), on the shared casting engine.
const test=(name,fn)=>{fn();console.log('PASS '+name);};
// Returns the given D6 faces in order, then repeats the last one.
const dice=(...faces)=>{let i=0;return ()=>(faces[Math.min(i++,faces.length-1)]-1)/6+.01;};
const seq=values=>{let i=0;return ()=>values[Math.min(i++,values.length-1)];};
const clearExcept=(s,keep)=>{for(const p of G.combatants(s))if(!keep.includes(p.id)){p.x=null;p.y=null;}};
const near=(a,b,tol=1e-6)=>Math.abs(a-b)<=tol;
// A classic battle with the Daemonsmith on the given lore, Red to play first.
function battle(spells=null,lore='elementalism'){const s=G.createGame('empire',{lores:{ash:lore}});G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'ash'});for(const u of s.units)u.charge=null;if(spells)Object.assign(G.getUnit(s,'A6'),{spells,castThisTurn:[]});return s;}
const at=(s,stage,team='ash',extra={})=>Object.assign(s,{stage,team,...extra});
// The wizard facing up the table at (30,30) and an Empire regiment 8″ ahead of it, facing it.
function facing(spells,lore,keep=[]){const s=battle(spells,lore);clearExcept(s,['A6','I1',...keep]);Object.assign(G.getUnit(s,'A6'),{x:30,y:30,heading:0});Object.assign(G.getUnit(s,'I1'),{x:30,y:22,heading:180});return {s,w:G.getUnit(s,'A6'),t:G.getUnit(s,'I1')};}
// The wizard in base contact with an enemy, front to front, in the Combat phase.
function duel(spells,lore,enemy='I1',team='ash'){const s=battle(spells,lore);clearExcept(s,['A6',enemy]);const w=G.getUnit(s,'A6'),t=G.getUnit(s,enemy);Object.assign(t,{x:30,y:20,heading:180});Object.assign(w,{x:30,y:20+(G.size(t).h+G.size(w).h)/2,heading:0});w.engaged=[t.id];t.engaged=[w.id];at(s,'combat',team);return {s,w,t};}
const toStep=(s,id)=>{while(s.combatSession.initiative[id]!==s.combatSession.groups[s.combatSession.step])G.fightCombatStep(s,()=>0);};

test('Elementalism and Dark Magic: six numbered spells and a signature spell each',()=>{
 assert.deepEqual(G.generateSpells(dice(1,6),{lore:'elementalism'}),['flamingSword','pathway']);
 assert.deepEqual(G.generateSpells(dice(4,5),{lore:'darkMagic'}),['phantasmagoria','battleLust']);
 assert.equal(G.LORES.elementalism.signature,'stormCall');assert.equal(G.LORES.darkMagic.signature,'doombolt');
 const s=battle(null,'darkMagic');at(s,'strategy');assert.deepEqual(G.signatureChoices(G.getUnit(s,'A6')),['doombolt','hashutCurse','ashStorm','hashutFlames']);
 for(const key of [...Object.keys(G.ELEMENTALISM),...Object.keys(G.DARK_MAGIC)])assert.ok(G.SPELL_TEXT[key],key+' has its text');
});
test('Storm Call: Movement and Initiative −1 (minimum 1), and every other Hex on the target ends',()=>{
 const {s,t}=facing(['stormCall']);at(s,'strategy');
 G.addEffect(s,[t],{spell:'darkness',source:{kind:'spell',caster:'A6',team:'ash'},mods:[{stat:'I',add:-2,min:1}],stack:'spell:darkness',expiry:{kind:'START_OF_CASTING_PLAYER_NEXT_TURN',at:'2:ash'}});
 G.addEffect(s,[t],{spell:'vigour',source:{kind:'spell',caster:'I7',team:'iron'},mods:[{stat:'T',add:1,max:10}],stack:'spell:vigour',expiry:{kind:'END_CURRENT_PLAYER_TURN',at:'1:ash'}});
 const r=G.castSpell(s,'A6','stormCall','I1',dice(3,3));assert.equal(r.cast,true);assert.deepEqual(r.effect.ended,['darkness']);
 assert.equal(G.profile(t).M,3);assert.equal(G.profile(t).I,2,'Darkness ended; Storm Call alone');assert.equal(G.profile(t).T,4,'an Enchantment is not a Hex');
 t.y=30-.49-13.2-G.size(t).h/2;G.getUnit(s,'A6').castThisTurn=[];assert.match(G.targetReason(s,'A6','stormCall',t),/12″/);
});
test('Plague of Rust: the armour value is 2 worse, even for a unit in combat; Word of Pain: S and T −1',()=>{
 const {s,t}=facing(['plagueRust'],'elementalism',['A1']);at(s,'strategy');t.engaged=['A1'];G.getUnit(s,'A1').engaged=['I1'];
 assert.equal(G.armourSave(t),5);assert.equal(G.targetReason(s,'A6','plagueRust',t),null,'it may target a unit in combat');
 G.castSpell(s,'A6','plagueRust','I1',dice(5,5));assert.equal(G.armourSave(t),7);assert.equal(G.wardSave(t),7,'Ward saves are not armour');
 const d=facing(['wordOfPain'],'darkMagic');at(d.s,'strategy');G.castSpell(d.s,'A6','wordOfPain','I1',dice(5,5));assert.equal(G.profile(d.t).S,2);assert.equal(G.profile(d.t).T,2);
 G.addEffect(d.s,[d.t],{spell:'x',mods:[{stat:'S',add:-3,min:1}],stack:'x',expiry:{kind:'END_CURRENT_PLAYER_TURN',at:'1:ash'}});assert.equal(G.profile(d.t).S,1,'never below 1');
});
test('Flaming Sword: D6+1 Strength 3 Flaming hits at the wizard\'s Initiative step',()=>{
 const {s}=duel(['flamingSword'],'elementalism');G.beginCombat(s,'A6');toStep(s,'A6');
 const r=G.castSpell(s,'A6','flamingSword','I1',dice(3,4,5,...Array(6).fill(6)));assert.equal(r.effect.hits,6);
 assert.ok(s.combatSession.spellStages.some(st=>st.spell==='flamingSword'&&st.to==='I1'),'its wounds join the step');
});
test('Soul Eater: one hit with Multiple Wounds (3) and no armour save; a regiment loses one model',()=>{
 const m=duel(['soulEater'],'darkMagic','I7');G.beginCombat(m.s,'A6');toStep(m.s,'A6');
 const r=G.castSpell(m.s,'A6','soulEater','I7',dice(3,4,6));assert.equal(r.effect.hits,1);assert.deepEqual(r.effect.dice.save,[]);assert.equal(r.effect.unsaved,2,'the Master Mage has 2 Wounds');
 const u=duel(['soulEater'],'darkMagic','I1');G.beginCombat(u.s,'A6');toStep(u.s,'A6');const q=G.castSpell(u.s,'A6','soulEater','I1',dice(3,4,6));assert.equal(q.effect.unsaved,1,'excess wounds do not spill over');
});
test('Stream of Corruption: an 8″ flame template from the caster\'s base; friend and foe under it are hit; friendly losses do not score',()=>{
 const poly=G.flameTemplate({x:0,y:0},{x:0,y:-10});assert.ok(near(Math.max(...poly.map(p=>Math.hypot(p.x,p.y))),8,1e-3),'8″ long');assert.ok(near(Math.max(...poly.map(p=>p.x))-Math.min(...poly.map(p=>p.x)),3,1e-2),'3″ broad end (a convention)');
 const {s,t}=duel(['streamCorruption'],'darkMagic');const a=G.getUnit(s,'A2');Object.assign(a,{x:30,y:t.y-G.size(t).h/2-G.size(a).h/2-.2,heading:180});
 G.beginCombat(s,'A6');toStep(s,'A6');const r=G.castSpell(s,'A6','streamCorruption','I1',()=>.5);
 const foe=r.effect.affected.find(x=>x.id==='I1'),friend=r.effect.affected.find(x=>x.id==='A2');assert.ok(foe?.hits>0);assert.ok(friend?.hits>0,'a friend under the template is hit');assert.equal(friend.friendly,true);
 assert.ok(s.combatSession.spellStages.every(st=>st.to==='I1'&&st.rear),'only the unit in this combat waits for the step; its losses come from the rear');
 G.fightCombatStep(s,()=>0);while(s.combatSession?.phase==='attacks')G.fightCombatStep(s,()=>0);G.compareCombat(s);assert.equal(s.lastCombat.score.ash.wounds,foe.unsaved+s.lastCombat.stages.filter(st=>st.from==='A6'&&!st.spell).reduce((n,st)=>n+st.unsaved,0));
});
test('Doombolt: a 3″ blast centred on the target strikes only enemy models',()=>{
 const s=battle(['doombolt'],'darkMagic');at(s,'shooting');clearExcept(s,['A6','A1','I7']);const w=G.getUnit(s,'A6'),t=G.getUnit(s,'I7'),a=G.getUnit(s,'A1');Object.assign(w,{x:30,y:30,heading:0});Object.assign(t,{x:30,y:20,heading:180});Object.assign(a,{x:30-.49-.1-G.size(a).w/2,y:20,heading:0});
 const r=G.castSpell(s,'A6','doombolt','I7',dice(4,4,6,1));assert.equal(r.cast,true);assert.deepEqual(r.effect.affected.map(x=>x.id),['I7']);assert.equal(t.wounds,1);assert.equal(G.aliveCount(a),20,'a friend under the blast is not hit');
});
test('Wind Blast: D3+3 Strength 5 hits, then the unit Gives Ground 2″ directly away from the caster, keeping its facing',()=>{
 const {s,t}=facing(['windBlast']);at(s,'shooting');const r=G.castSpell(s,'A6','windBlast','I1',dice(4,4,6,...Array(20).fill(6)));
 assert.equal(r.effect.hits,6);assert.ok(near(t.y,20,1e-9)&&near(t.x,30,1e-9),'2″ away from the caster');assert.equal(t.heading,180);assert.ok(r.effect.giveGround.moved>1.9);
});
test('Summon Elemental Spirit: no line of sight across it; it scatters and strikes enemies with D3+3 Strength 4 hits',()=>{
 const s=battle(null);at(s,'shooting');clearExcept(s,['A6','A4','I7']);const d=G.getUnit(s,'A4'),t=G.getUnit(s,'I7');Object.assign(G.getUnit(s,'A6'),{x:10,y:40});Object.assign(d,{x:30,y:30,heading:0});Object.assign(t,{x:30,y:20,heading:180});
 assert.equal(G.shootingPlan(s,d,t).error,undefined);s.vortices=[{id:'V1',spell:'elementalSpirit',caster:'A6',team:'ash',x:30,y:22,radius:1.5}];assert.match(G.shootingPlan(s,d,t).error,/line of sight/);
 const r=battle(null);clearExcept(r,['A6','I1']);Object.assign(G.getUnit(r,'A6'),{x:10,y:40});Object.assign(G.getUnit(r,'I1'),{x:30,y:20,heading:180});r.vortices=[{id:'V1',spell:'elementalSpirit',caster:'A6',team:'ash',x:30,y:28,radius:1.5}];
 const out=G.driftVortices(r,seq([.5,0,.99]));assert.equal(out[0].distance,6);assert.equal(out[0].affected[0].hits,6);assert.equal(G.VORTEX_RULES.elementalSpirit.enemiesOnly,true);
});
test('Earthen Ramparts: a 5+ Ward; it cannot march or charge; charging it is a disordered charge',()=>{
 const s=battle(['ramparts']);at(s,'strategy');clearExcept(s,['A6','A1','I1']);const a=G.getUnit(s,'A1'),e=G.getUnit(s,'I1');Object.assign(G.getUnit(s,'A6'),{x:30,y:36,heading:0});Object.assign(a,{x:30,y:30,heading:0});Object.assign(e,{x:30,y:22,heading:180});
 G.castSpell(s,'A6','ramparts','A1',dice(5,5));assert.equal(G.wardSave(a),5);
 at(s,'movement','ash',{movementStep:'remaining'});assert.match(G.orderError(s,a,{kind:'advance',mode:'march',distance:4}),/cannot march/);assert.match(G.chargePlan(s,a,e).error,/cannot charge/);
 at(s,'movement','iron',{movementStep:'declare'});G.declareCharge(s,'I1','A1');G.chargeReaction(s,'I1','hold');G.finishDeclarations(s);const out=G.resolveCharge(s,'I1',[6,6]);assert.equal(out.success,true);assert.equal(e.charge.disordered,'Earthen Ramparts');
 at(s,'combat','iron');G.beginCombat(s,'I1');assert.equal(s.combatSession.initiative.I1,G.profile(e).I,'no Initiative bonus for charging');
});
test('Travel Mystical Pathway: wholly within 12″, more than 6″ from enemies; the unit cannot move again',()=>{
 const s=battle(['pathway']);at(s,'movement','ash',{movementStep:'remaining'});clearExcept(s,['A6','A1','I1']);const a=G.getUnit(s,'A1');Object.assign(G.getUnit(s,'A6'),{x:30,y:30,heading:0});Object.assign(a,{x:30,y:25,heading:0});Object.assign(G.getUnit(s,'I1'),{x:30,y:8,heading:180});
 assert.match(G.relocationError(s,'A6','pathway','A1',{x:30,y:14}),/6″ of an enemy/);assert.match(G.relocationError(s,'A6','pathway','A1',{x:44,y:25}),/within 12″/);assert.equal(G.relocationError(s,'A6','pathway','A1',{x:30,y:19,heading:90}),null);
 assert.throws(()=>G.castSpell(s,'A6','pathway','A1',dice(5,5)),/Choose where/);
 const r=G.castSpell(s,'A6','pathway','A1',dice(5,5),{point:{x:30,y:19,heading:90}});assert.equal(r.cast,true);assert.deepEqual([a.x,a.y,a.heading],[30,19,90]);assert.equal(a.moved,true);assert.match(G.orderError(s,a,{kind:'advance',distance:1}),/unmoved/);
 const m=battle(['pathway']);at(m,'movement','ash',{movementStep:'remaining'});const b=G.getUnit(m,'A1');b.spent=1;assert.match(G.targetReason(m,'A6','pathway',b),/already moved/);
});
test('Infernal Gateway: a friendly character only, and it may leave its combat',()=>{
 const s=G.createGame('empire',{format:'battle-march',points:500});G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'iron'});clearExcept(s,['I7','I12','A1']);
 const w=G.getUnit(s,'I7'),c=G.getUnit(s,'I12'),a=G.getUnit(s,'A1');Object.assign(w,{x:20,y:20,heading:180,spells:['gateway'],castThisTurn:[],engaged:null});Object.assign(a,{x:20,y:30,heading:0});Object.assign(c,{x:20,y:30-G.size(a).h/2-G.size(c).h/2,heading:180});c.engaged=['A1'];a.engaged=['I12'];
 at(s,'movement','iron',{movementStep:'remaining'});assert.match(G.targetReason(s,'I7','gateway',G.getUnit(s,'I1'))??'',/character|Not on/);assert.equal(G.targetReason(s,'I7','gateway',c),null,'a character in combat');
 G.castSpell(s,'I7','gateway','I12',dice(5,5),{point:{x:26,y:22}});assert.equal(c.engaged,null);assert.equal(a.engaged,null,'its enemy is free');assert.deepEqual([c.x,c.y],[26,22]);
});
test('Phantasmagoria: it never moves; it is dangerous terrain for every unit; enemies ending a move within 12″ test for Panic or become Impetuous',()=>{
 const s=battle(null,'darkMagic');clearExcept(s,['A6','A1','I1']);Object.assign(G.getUnit(s,'A6'),{x:8,y:44,heading:0});const a=G.getUnit(s,'A1'),e=G.getUnit(s,'I1');Object.assign(a,{x:30,y:36,heading:0});Object.assign(e,{x:50,y:12,heading:180});
 s.vortices=[{id:'V1',spell:'phantasmagoria',caster:'A6',team:'ash',x:30,y:31,radius:1.5}];assert.deepEqual(G.driftVortices(s,()=>.99),[]);assert.deepEqual([s.vortices[0].x,s.vortices[0].y],[30,31]);
 at(s,'movement','ash',{movementStep:'remaining'});G.commitOrder(s,'A1',{kind:'advance',mode:'advance',distance:2},dice(1));const hit=s.lastVortexHits[0];
 assert.equal(hit.dangerous,true);assert.ok(hit.tests>0&&hit.tests<=5,'the front rank models that entered it test');assert.equal(G.aliveCount(a),20-hit.tests,'each 1 costs a Wound');assert.equal(G.profile(a).M,3);
 at(s,'movement','iron',{movementStep:'remaining'});e.moved=false;e.spent=0;Object.assign(e,{x:30,y:12});G.commitOrder(s,'I1',{kind:'advance',mode:'advance',distance:4},dice(6,6));
 assert.equal(s.lastPhantasm?.[0]?.cause,'Phantasmagoria');assert.equal(s.lastPhantasm[0].passed,false);assert.equal(s.lastPhantasm[0].outcome,'fall-back');assert.ok(e.y<16,'away from the template');
 const p=battle(null,'darkMagic');clearExcept(p,['A6','I1']);Object.assign(G.getUnit(p,'A6'),{x:8,y:44});const f=G.getUnit(p,'I1');Object.assign(f,{x:30,y:12,heading:180});p.vortices=[{id:'V1',spell:'phantasmagoria',caster:'A6',team:'ash',x:30,y:31,radius:1.5}];
 at(p,'movement','iron',{movementStep:'remaining'});assert.equal(G.isImpetuous(p,f),false);G.commitOrder(p,'I1',{kind:'advance',mode:'advance',distance:4},dice(1,1));assert.equal(p.lastPhantasm[0].passed,true);assert.equal(G.isImpetuous(p,f),true);
 f.y=4;assert.equal(G.isImpetuous(p,f),false,'only while within 12″');
});
test('Battle Lust: Frenzy and Hatred; misses are re-rolled in the first round; losing a round loses Frenzy only',()=>{
 const s=battle(['battleLust'],'darkMagic');at(s,'strategy');clearExcept(s,['A6','A1','I1']);const a=G.getUnit(s,'A1'),e=G.getUnit(s,'I1');Object.assign(G.getUnit(s,'A6'),{x:30,y:40,heading:0});Object.assign(a,{x:30,y:30,heading:0});
 G.castSpell(s,'A6','battleLust','A1',dice(5,5));assert.ok(G.hasRule(a,'frenzy')&&G.hasRule(a,'hatred'));
 Object.assign(e,{x:30,y:30-G.size(a).h,heading:180});a.engaged=['I1'];e.engaged=['A1'];a.charge={target:'I1',status:'success',distance:3,face:'front'};at(s,'combat','ash');
 G.beginCombat(s,'A1');while(s.combatSession.phase==='attacks')G.fightCombatStep(s,()=>.2);const st=s.combatSession.stages.find(x=>x.from==='A1');assert.ok(st.dice.hitReroll?.length>0,'failed rolls To Hit re-rolled');
 const q=battle(null,'darkMagic');clearExcept(q,['A1','I1']);const b=G.getUnit(q,'A1'),f=G.getUnit(q,'I1');Object.assign(b,{x:30,y:30,heading:0});Object.assign(f,{x:30,y:30-G.size(b).h,heading:180});b.engaged=['I1'];f.engaged=['A1'];f.deadModels=Array.from({length:15},(_,i)=>i+5);
 G.addEffect(q,[f],{spell:'battleLust',rules:[{rule:'frenzy'},{rule:'hatred'}],stack:'spell:battleLust',expiry:{kind:'END_CURRENT_PLAYER_TURN',at:'1:ash'}});at(q,'combat','ash');
 G.beginCombat(q,'A1');while(q.combatSession.phase==='attacks')G.fightCombatStep(q,()=>.5);G.compareCombat(q);assert.equal(q.lastCombat.loserSide,'iron');assert.equal(G.hasRule(f,'frenzy'),false);assert.equal(G.hasRule(f,'hatred'),true);
 const n=battle(null,'darkMagic');clearExcept(n,['A1','I1']);const c=G.getUnit(n,'A1'),g=G.getUnit(n,'I1');Object.assign(c,{x:30,y:30,heading:0});Object.assign(g,{x:30,y:30-G.size(c).h,heading:180});c.engaged=['I1'];g.engaged=['A1'];
 G.addEffect(n,[c],{spell:'battleLust',rules:[{rule:'hatred'}],stack:'spell:battleLust',expiry:{kind:'END_CURRENT_PLAYER_TURN',at:'1:ash'}});at(n,'combat','ash');G.beginCombat(n,'A1');while(n.combatSession.phase==='attacks')G.fightCombatStep(n,()=>.2);assert.equal(n.combatSession.stages.find(x=>x.from==='A1').dice.hitReroll,undefined,'not after the first round');
});
