import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
import * as A from './dist/armies.mjs';

// The Lore of Daemonology (the user's brief of 1 October 2026), on the shared casting engine.
const test=(name,fn)=>{fn();console.log('PASS '+name);};
// Returns the given D6 faces in order, then repeats the last one.
const dice=(...faces)=>{let i=0;return ()=>(faces[Math.min(i++,faces.length-1)]-1)/6+.01;};
const seq=values=>{let i=0;return ()=>values[Math.min(i++,values.length-1)];};
const clearExcept=(s,keep)=>{for(const p of G.combatants(s))if(!keep.includes(p.id)){p.x=null;p.y=null;}};
// A classic battle with the Daemonsmith on Daemonology, Red to play first.
function battle(spells=null){const s=G.createGame('empire');G.getUnit(s,'A6').lore='daemonology';G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'ash'});for(const u of s.units)u.charge=null;if(spells)Object.assign(G.getUnit(s,'A6'),{spells,castThisTurn:[]});return s;}
const at=(s,stage,team='ash',extra={})=>Object.assign(s,{stage,team,...extra});
// The wizard and an enemy unit in base contact, front to front.
function duel(enemy='I1',team='ash'){const s=battle(['familiars','vessel']);clearExcept(s,['A6',enemy]);const w=G.getUnit(s,'A6'),t=G.getUnit(s,enemy);Object.assign(t,{x:30,y:20,heading:180});Object.assign(w,{x:30,y:20+(G.size(t).h+G.size(w).h)/2,heading:0});w.engaged=[t.id];t.engaged=[w.id];at(s,'combat',team);return {s,w,t};}
const toStep=(s,id)=>{while(s.combatSession.initiative[id]!==s.combatSession.groups[s.combatSession.step])G.fightCombatStep(s,()=>0);};

test('spell generation: one D6 per level, duplicates rerolled; the numbers are spells, not levels',()=>{
 assert.deepEqual(G.generateSpells(dice(6),{lore:'daemonology',level:1}),['vigour'],'a Level 1 wizard can know spell 6');
 const r=G.rollSpells(dice(4,4,2),{lore:'daemonology',level:2});assert.deepEqual(r.spells,['vessel','darkness']);assert.deepEqual(r.rolls,[4,4,2]);assert.equal(r.rerolled.length,1);
 assert.deepEqual(G.generateSpells(()=>0,{lore:'daemonology'}),['steed','darkness']);assert.deepEqual(G.generateSpells(()=>0),['fireball','arrow']);
 assert.deepEqual(battle().units.find(u=>u.id==='A6').spells,['steed','darkness'],'begin() rolls the Daemonsmith\'s lore');
});
test('The Summoning is Daemonology\'s signature spell; a Daemonsmith may also take a Lore of Hashut spell, once',()=>{
 const s=battle();at(s,'strategy');const w=G.getUnit(s,'A6');
 assert.deepEqual(G.signatureChoices(w),['summoning','hashutCurse','ashStorm','hashutFlames']);assert.deepEqual(G.signatureChoices(G.getUnit(s,'I7')),['hammerhand']);
 assert.throws(()=>G.exchangeSignature(s,'A6','steed','hammerhand'),/Exchange/,'Hammerhand is Battle Magic\'s');
 assert.deepEqual(G.exchangeSignature(s,'A6','steed','summoning'),['summoning','darkness']);assert.throws(()=>G.exchangeSignature(s,'A6','darkness','ashStorm'),/Exchange/,'only one exchange');
});
test('a Daemonsmith roster may choose Daemonology or Battle Magic; other lores are not implemented',()=>{
 const roster=lore=>({faction:'chaos',entries:[{entry:'daemonsmith',general:true,lore},{entry:'warriors',models:19},{entry:'decimators',models:9}]});
 const errors=lore=>A.validateRoster(roster(lore),500).errors??A.validateRoster(roster(lore),500);const text=lore=>JSON.stringify(errors(lore));
 assert.doesNotMatch(text('daemonology'),/lore|implemented|Daemonology/i);assert.doesNotMatch(text('battle'),/implemented/);assert.match(text('darkMagic'),/not implemented/);
 const s=G.createGame('empire',{format:'battle-march',points:500,rosters:{ash:roster('daemonology')}});assert.equal(G.getUnit(s,'A6').lore,'daemonology');
});
test('casting: Level 2 adds 1; exactly the value succeeds; a tied dispel fails',()=>{
 const s=battle(['darkness','vessel']);at(s,'strategy');clearExcept(s,['A6','I1','I7']);const w=G.getUnit(s,'A6'),t=G.getUnit(s,'I1');Object.assign(w,{x:30,y:30,heading:0});Object.assign(t,{x:30,y:22,heading:180});Object.assign(G.getUnit(s,'I7'),{x:36,y:20});
 const r=G.attemptSpell(s,'A6','darkness','I1',dice(4,4));assert.equal(r.casting,9);assert.deepEqual(r.modifiers,[{label:'Level 2',value:1}]);assert.equal(r.pending,true);
 const out=G.resolveDispel(s,'I7',dice(4,4));assert.equal(out.dispel.total,9);assert.equal(out.dispel.success,false);assert.equal(G.profile(t).I,1);
});
test('The Summoning: 2D6 Strength 4 hits at AP −1 on an enemy in sight and not in combat; no models appear',()=>{
 const s=battle(['summoning']);at(s,'shooting');clearExcept(s,['A6','I1','I2']);const w=G.getUnit(s,'A6'),t=G.getUnit(s,'I1'),units=s.units.length;Object.assign(w,{x:30,y:30,heading:0});Object.assign(t,{x:30,y:20,heading:180});
 const r=G.castSpell(s,'A6','summoning','I1',dice(5,5,3,3,...Array(6).fill([6,5]).flat()));
 assert.equal(r.effect.hits,6);assert.equal(r.effect.toSave,G.profile(t).save+1,'AP −1');assert.equal(G.aliveCount(t),14);assert.equal(s.units.length,units);
 const i2=G.getUnit(s,'I2');Object.assign(i2,{x:50,y:30,heading:270});assert.match(G.targetReason(s,'A6','summoning',i2),/vision arc/);
 Object.assign(i2,{x:24,y:22,heading:180});i2.engaged=['A1'];assert.match(G.targetReason(s,'A6','summoning',i2),/Engaged/);
 w.castThisTurn=[];w.engaged=['I1'];assert.match(G.castBlockReason(s,'A6','summoning'),/Engaged/);w.engaged=null;w.movementMode='march';assert.match(G.castBlockReason(s,'A6','summoning'),/Marched/);
});
test('Steed of Shadows: friendly infantry that has not moved gains Fly (12) until the caster\'s next Start of Turn, and is not moved',()=>{
 const s=battle(['steed']);at(s,'movement','ash',{movementStep:'remaining'});const w=G.getUnit(s,'A6'),a=G.getUnit(s,'A1');Object.assign(a,{x:w.x,y:w.y-5,heading:0});
 for(const [change,why] of [[{moved:true},/already moved/],[{spent:1},/already moved/],[{fleeing:true},/Fleeing/],[{troop:'cavalry'},/infantry/]]){const keep={...a};Object.assign(a,change);assert.match(G.targetReason(s,'A6','steed',a),why,JSON.stringify(change));Object.assign(a,keep);delete a.troop;}
 assert.match(G.targetReason(s,'A6','steed',s.rocket)??'',/infantry|friendly/);
 const before={x:a.x,y:a.y,moved:a.moved,spent:a.spent};G.castSpell(s,'A6','steed','A1',dice(4,4));
 assert.equal(G.effectRule(a,'fly').value,12);assert.deepEqual({x:a.x,y:a.y,moved:a.moved,spent:a.spent},before,'a way to move, not a move');assert.deepEqual(G.activeSpells(a)[0].expiry,{kind:'START_OF_CASTING_PLAYER_NEXT_TURN',at:'2:ash'});
 s.stage='combat';G.nextTurn(s);assert.equal(G.hasRule(a,'fly'),true,'through the opponent\'s turn');s.stage='combat';G.nextTurn(s);assert.equal(G.hasRule(a,'fly'),false,'gone at Red\'s next Start of Turn');
});
test('Gathering Darkness: an engaged enemy may be the target, but an engaged caster cannot cast it; limits and no stacking',()=>{
 const s=battle(['darkness','vessel']);at(s,'strategy');clearExcept(s,['A6','A1','I1']);const w=G.getUnit(s,'A6'),t=G.getUnit(s,'I1');Object.assign(w,{x:30,y:32,heading:0});Object.assign(t,{x:30,y:22,heading:180});t.engaged=['A1'];
 assert.equal(G.targetReason(s,'A6','darkness',t),null);at(s,'shooting');assert.match(G.targetReason(s,'A6','summoning',t),/Engaged/);at(s,'strategy');
 w.engaged=['I1'];assert.match(G.castBlockReason(s,'A6','darkness'),/Engaged/);assert.equal(G.castBlockReason(s,'A6','vessel'),null);w.engaged=null;
 G.castSpell(s,'A6','darkness','I1',dice(5,5));assert.deepEqual([G.profile(t).I,G.profile(t).Ld],[1,5]);assert.equal(G.blocksRule(t,'inspiringPresence'),true);
 w.castThisTurn=[];G.castSpell(s,'A6','darkness','I1',dice(5,5));assert.equal(t.effects.filter(e=>e.spell==='darkness').length,1);assert.equal(G.profile(t).Ld,5,'does not stack to −4');
 s.stage='combat';G.nextTurn(s);assert.equal(G.profile(t).I,1,'through Blue\'s turn');s.stage='combat';G.nextTurn(s);assert.equal(G.profile(t).I,3);
});
test('Daemonic Familiars: cast when the wizard fights, in either turn; 2D6 Strength 2 hits, no armour saves, counted in the result',()=>{
 for(const team of ['ash','iron']){
  const {s,t}=duel('I1',team);assert.match(G.castBlockReason(s,'A6','familiars'),/fights/);G.beginCombat(s,team==='ash'?'A6':'I1');toStep(s,'A6');assert.equal(G.castBlockReason(s,'A6','familiars'),null,team);
  const before=G.aliveCount(t),r=G.castSpell(s,'A6','familiars','I1',dice(4,4,4,4,...Array(8).fill(6)));assert.equal(r.effect.hits,8);assert.deepEqual(r.effect.dice.save,[],'no armour saves');assert.equal(G.aliveCount(t),before,'removed with the step');
  G.fightCombatStep(s,()=>0);G.compareCombat(s);assert.ok(s.lastCombat.stages.some(st=>st.spell==='familiars'));assert.ok(s.lastCombat.score.ash.wounds>=r.effect.unsaved);
 }
 {const {s}=duel();G.beginCombat(s,'A6');toStep(s,'A6');const w=G.getUnit(s,'A6');w.effects=[];G.addEffect(s,[w],{spell:'vessel',mods:[{stat:'S',add:1,max:10}],stack:'spell:vessel',expiry:{kind:'END_CURRENT_PLAYER_TURN',at:'1:ash'}});
  const r=G.castSpell(s,'A6','familiars','I1',dice(4,4,...Array(8).fill(4)));assert.equal(r.effect.wounds,0,'Vessel does not raise the spell\'s Strength 2: 4s do not wound T3');}
 {const {s,w,t}=duel();const i2=G.getUnit(s,'I2'),a1=G.getUnit(s,'A1');Object.assign(a1,{x:t.x+G.size(t).w/2+G.size(a1).w/2,y:t.y,heading:270});Object.assign(i2,{x:a1.x,y:a1.y-G.size(a1).h/2-G.size(i2).h/2,heading:180});
  t.engaged=['A6','A1'];a1.engaged=['I1','I2'];i2.engaged=['A1'];G.beginCombat(s,'A6');toStep(s,'A6');assert.match(G.targetReason(s,'A6','familiars',i2),/Not fighting/);}
});
test('Daemonic Vessel: Self, even in combat; Strength and Attacks +1, AP improved by 1, until the end of this turn',()=>{
 const {s,w,t}=duel();at(s,'strategy');const save=G.saveTarget(t,w);assert.equal(G.castBlockReason(s,'A6','vessel'),null);
 G.castSpell(s,'A6','vessel',undefined,dice(5,5));const p=G.profile(w);assert.deepEqual([p.S,p.A,p.T],[5,3,4]);assert.deepEqual(w.effects.map(e=>e.spell),['vessel']);assert.equal(G.saveTarget(t,w),Math.min(7,save+1));
 s.stage='combat';G.nextTurn(s);assert.equal(G.profile(w).S,4,'gone in Blue\'s turn');
});
test('Daemonic Vigour: a friendly unit not in combat; Movement, Toughness and Initiative +1, never past 10; not stacking',()=>{
 const s=battle(['vigour','vessel']);at(s,'strategy');const w=G.getUnit(s,'A6'),a=G.getUnit(s,'A1');Object.assign(a,{x:w.x,y:w.y-6,heading:0});
 a.engaged=['I1'];assert.match(G.targetReason(s,'A6','vigour',a),/Engaged/);a.engaged=null;
 G.castSpell(s,'A6','vigour','A1',dice(5,5));const p=G.profile(a);assert.deepEqual([p.M,p.T,p.I,p.S,p.A],[4,5,3,3,1]);
 at(s,'movement','ash',{movementStep:'remaining'});clearExcept(s,['A1','A6']);assert.equal(G.orderError(s,a,{kind:'advance',mode:'advance',distance:4,angle:0}),null,'a 4″ advance for an M3 regiment');
 at(s,'strategy');w.castThisTurn=[];G.castSpell(s,'A6','vessel',undefined,dice(5,5));w.castThisTurn=[];G.castSpell(s,'A6','vigour','A6',dice(5,5));assert.deepEqual(w.effects.map(e=>e.spell).sort(),['vessel','vigour'],'Vigour and Vessel together on the wizard');
 const big=G.getUnit(s,'A2');big.effects=[{spell:'x',mods:[{stat:'T',add:6}],stack:'x'}];G.addEffect(s,[big],{spell:'vigour',mods:[{stat:'T',add:1,max:10}],stack:'spell:vigour'});assert.equal(G.profile(big).T,10);
});
test('Vortex of Chaos: a 3″ template within 15″ touching no base; it scatters at every Start of Turn and strikes friend and foe',()=>{
 const s=battle(['vortexChaos']);at(s,'shooting');clearExcept(s,['A6','I1']);const w=G.getUnit(s,'A6'),t=G.getUnit(s,'I1');Object.assign(w,{x:20,y:40,heading:0});Object.assign(t,{x:20,y:25,heading:180});
 const edge=G.size(w).w/2,front=t.y+G.size(t).h/2;
 assert.match(G.templatePlacementError(s,'A6','vortexChaos',{x:20,y:front+1.5})??'',/touch/);assert.match(G.templatePlacementError(s,'A6','vortexChaos',{x:20-edge-15.2,y:40})??'',/15″/);assert.equal(G.templatePlacementError(s,'A6','vortexChaos',{x:20-edge-15,y:40}),null);
 const r=G.castSpell(s,'A6','vortexChaos','A6',dice(5,5),{point:{x:20,y:30}});assert.deepEqual(r.modifiers,[{label:'Level 2',value:1}],'no Magic Resistance: it has no target');const v=s.vortices[0];assert.equal(v.radius,1.5);assert.equal(v.spell,'vortexChaos');
 s.stage='combat';G.nextTurn(s,dice(3,1,1));assert.equal(s.vortexReports.length,1);s.stage='combat';G.nextTurn(s,dice(3,1,1));assert.equal(s.vortexReports.length,1,'it moves at both players\' Start of Turn');
});
test('a scattering Vortex of Chaos rolls damage once for each unit it crosses; a Hit leaves it where it is',()=>{
 const s=battle();clearExcept(s,['A6','A1','I1']);const a=G.getUnit(s,'A1'),t=G.getUnit(s,'I1');Object.assign(G.getUnit(s,'A6'),{x:4,y:44});
 Object.assign(a,{x:24,y:30+1.2+G.size(a).h/2,heading:0});Object.assign(t,{x:24,y:30-1.2-G.size(t).h/2,heading:180});
 s.vortices=[{id:'V1',spell:'vortexChaos',caster:'A6',team:'ash',x:16,y:30,radius:1.5}];
 // No Hit (.5), the arrow due east (.3 → 90°), 6″... then the hits and their dice.
 let out=G.driftVortices(s,seq([.5,.3,.99,.4]));assert.equal(out[0].distance,6);assert.deepEqual(out[0].affected.map(x=>x.id).sort(),['A1','I1'],'friend and foe');for(const x of out[0].affected)assert.equal(x.hits,4,'D6+1 for each unit');
 s.vortices=[{id:'V2',spell:'vortexChaos',caster:'A6',team:'ash',x:14,y:30,radius:1.5}];out=G.driftVortices(s,seq([.1,.3,.99]));assert.equal(out[0].hit,true);assert.equal(out[0].distance,0);assert.deepEqual(out[0].affected,[]);
});
test('a Vortex of Chaos that ends over a unit is moved the least distance that clears it',()=>{
 const s=battle();clearExcept(s,['A6','I1']);const t=G.getUnit(s,'I1');Object.assign(t,{x:30,y:20,heading:180});Object.assign(G.getUnit(s,'A6'),{x:4,y:44});const front=t.y+G.size(t).h/2;
 s.vortices=[{id:'V1',spell:'vortexChaos',caster:'A6',team:'ash',x:30,y:front+1,radius:1.5}];const out=G.driftVortices(s,seq([.1,.3,.5]));
 assert.ok(Math.abs(out[0].displaced.distance-.505)<.01,`moved ${out[0].displaced.distance}`);assert.ok(Math.abs(s.vortices[0].x-30)<.01);assert.ok(s.vortices[0].y>front+1.5);
});
test('a vortex is difficult terrain: Movement −1 for the whole move, a reform is still allowed, and a charge keeps the lower die',()=>{
 const s=battle();clearExcept(s,['A6','I1']);at(s,'movement','iron',{movementStep:'remaining'});const t=G.getUnit(s,'I1');Object.assign(t,{x:30,y:12,heading:180,moved:false,spent:0,movementMode:null});Object.assign(G.getUnit(s,'A6'),{x:4,y:44});
 s.vortices=[{id:'V1',spell:'vortexChaos',caster:'A6',team:'ash',x:30,y:20,radius:1.5}];
 assert.match(G.orderError(s,t,{kind:'advance',mode:'march',distance:7.5,angle:0})??'',/allowance/);assert.equal(G.orderError(s,t,{kind:'advance',mode:'march',distance:6,angle:0}),null,'(4 − 1) × 2');
 G.commitOrder(s,'I1',{kind:'advance',mode:'march',distance:5,angle:0},dice(3,6,6,6));assert.equal(s.lastVortexHits.length,1,'struck once');assert.match(G.orderError(s,t,{kind:'advance',mode:'march',distance:2.5,angle:0})??'',/allowance/,'still −1');
 if(G.aliveCount(t)>0){G.commitOrder(s,'I1',{kind:'advance',mode:'march',distance:1,angle:0},dice(3,6));assert.equal(s.lastVortexHits.length,0,'not struck again in the same movement');}
 const r=battle();clearExcept(r,['A6','I1']);at(r,'movement','iron',{movementStep:'remaining'});const u=G.getUnit(r,'I1');Object.assign(u,{x:30,y:12,heading:180,moved:false,spent:0,movementMode:null});Object.assign(G.getUnit(r,'A6'),{x:4,y:44});
 r.vortices=[{id:'V1',spell:'vortexChaos',caster:'A6',team:'ash',x:30+G.size(u).w/2+1.6,y:12,radius:1.5}];assert.equal(G.orderError(r,u,{kind:'pivot',mode:'advance',distance:0,angle:90}),null,'a reform beside a vortex');
 const c=battle();clearExcept(c,['A1','I1','A6']);const ch=G.getUnit(c,'A1'),tg=G.getUnit(c,'I1');Object.assign(G.getUnit(c,'A6'),{x:4,y:44});Object.assign(ch,{x:30,y:36,heading:0});Object.assign(tg,{x:30,y:24,heading:180});
 c.vortices=[{id:'V1',spell:'vortexChaos',caster:'A6',team:'ash',x:30,y:30,radius:1.5}];at(c,'movement','ash',{movementStep:'declare'});G.declareCharge(c,'A1','I1');G.finishDeclarations(c);
 if(c.movementStep==='reactions'){G.chargeReaction(c,'A1','hold');G.finishReactions(c);}const out=G.resolveCharge(c,'A1',[2,6],dice(3));assert.equal(out.difficult,true);assert.equal(out.roll,2,'the lower die');assert.equal(out.range,2+2);
});
test('a vortex is dispelled later by beating 8, and ends with its caster',()=>{
 const s=battle();clearExcept(s,['A6','I7']);at(s,'strategy','iron');s.vortices=[{id:'V1',spell:'vortexChaos',caster:'A6',team:'ash',x:30,y:24,radius:1.5}];
 assert.equal(G.dispelVortex(s,'V1',dice(4,4),'fated').success,false,'8 does not beat 8');s.round++;assert.throws(()=>G.dispelVortex(s,'V1',dice(5,4),'fated'),/Fated Dispel already used/,'one Fated Dispel per side each turn');
 s.round++;s.fatedDispelUsed={ash:false,iron:false};assert.equal(G.dispelVortex(s,'V1',dice(5,4),'fated').success,true);
 const t=battle();s.vortices=[];t.vortices=[{id:'V1',spell:'vortexChaos',caster:'A6',team:'ash',x:30,y:24,radius:1.5}];const w=G.getUnit(t,'A6');w.wounds=1;at(t,'shooting','iron');Object.assign(w,{x:30,y:30});
 t.units.forEach(u=>{if(u.id!=='A6')u.engaged=null;});G.removeCasualties(t,w,1);assert.deepEqual(t.vortices,[],'the caster is slain');
});
// A Chaos Dwarf regiment with Steed of Shadows' Fly (12), in Red's Remaining Moves.
function flyer(keep=[]){const s=battle();clearExcept(s,['A1','A6',...keep]);at(s,'movement','ash',{movementStep:'remaining'});const a=G.getUnit(s,'A1');Object.assign(a,{x:30,y:40,heading:0,moved:false,spent:0,movementMode:null});Object.assign(G.getUnit(s,'A6'),{x:6,y:44});
 G.addEffect(s,[a],{spell:'steed',source:{kind:'spell',caster:'A6',team:'ash'},rules:[{rule:'fly',value:12}],stack:'spell:steed',expiry:G.expiryAt(s,'START_OF_CASTING_PLAYER_NEXT_TURN','ash')});return {s,a};}
const fwd=(distance,medium='fly',mode='advance')=>({kind:'advance',mode,medium,distance,angle:0});
test('Fly (12): a flyer moves 12″ (24″ marching), over units in its way, and lands clear of them',()=>{
 const {s,a}=flyer(['A3']),h=G.size(a).h,front=a.y-h/2,a3=G.getUnit(s,'A3');Object.assign(a3,{x:30,y:front-1.5-h/2,heading:0});
 assert.deepEqual(G.flyValues(a),[12]);assert.equal(G.moveValue(a,'fly'),12);assert.equal(G.moveValue(a),3);
 assert.ok(G.orderError(s,a,fwd(1,'ground')),'on foot, the friendly regiment 1.5″ ahead is in the way');
 assert.equal(G.orderError(s,a,fwd(11)),null,'flying over it');assert.match(G.orderError(s,a,fwd(12.5))??'',/allowance/);
 assert.ok(G.orderError(s,a,fwd(7)),'it cannot land on the other regiment');
 a3.x=50;assert.equal(G.orderError(s,a,fwd(3,'ground')),null,'it may still move on foot');
});
test('a flyer may march within 8″ of the enemy without a test; on foot it needs one',()=>{
 const {s,a}=flyer(['I1']),t=G.getUnit(s,'I1');Object.assign(t,{x:a.x+G.size(a).w/2+5+G.size(t).w/2,y:a.y,heading:180});assert.equal(G.needsMarchTest(s,a),true);
 assert.match(G.orderError(s,a,fwd(6,'ground','march'))??'',/march Leadership test/);assert.equal(G.orderError(s,a,fwd(24,'fly','march')),null);
});
test('flying or on foot is chosen with the first step; a flyer\'s wheel still stops at the table edge',()=>{
 const {s,a}=flyer();G.commitOrder(s,'A1',fwd(2));assert.equal(a.movementMedium,'fly');assert.match(G.orderError(s,a,fwd(1,'ground'))??'',/Undo/);assert.equal(G.movementRemaining(a),10);
 G.undo(s);assert.equal(a.movementMedium,null);assert.equal(G.orderError(s,a,fwd(1,'ground')),null,'undone: free to choose again');
 Object.assign(a,{y:G.size(a).h/2+.05});assert.match(G.orderError(s,a,{kind:'wheel',mode:'advance',medium:'fly',angle:30,distance:0})??'',/battlefield/,'the front edge just inside the table');
 assert.ok(Number.isFinite(G.maxWheel('march',a,'fly')));
});
test('Fly lasts until the caster\'s next Start of Turn; Vigour\'s +1 Movement does not change it',()=>{
 const {s,a}=flyer();G.addEffect(s,[a],{spell:'vigour',mods:[{stat:'M',add:1,max:10}],stack:'spell:vigour',expiry:G.expiryAt(s,'END_CURRENT_PLAYER_TURN')});assert.equal(G.moveValue(a,'fly'),12);assert.equal(G.moveValue(a),4);
 s.stage='combat';G.nextTurn(s);assert.deepEqual(G.flyValues(a),[12],'in Blue\'s turn');s.stage='combat';G.nextTurn(s);assert.deepEqual(G.flyValues(a),[]);
});
test('a flyer crossing a vortex is struck by it, but loses Movement only by landing in it',()=>{
 {const {s,a}=flyer();s.vortices=[{id:'V1',spell:'vortexChaos',caster:'A6',team:'ash',x:30,y:a.y-G.size(a).h/2-5,radius:1.5}];G.commitOrder(s,'A1',fwd(11),dice(3,1));assert.equal(s.lastVortexHits.length,1);assert.equal(a.difficultThisMove,undefined);assert.equal(G.movementRemaining(a),1);}
 {const {s,a}=flyer();s.vortices=[{id:'V1',spell:'vortexChaos',caster:'A6',team:'ash',x:30,y:a.y-G.size(a).h/2-9-1,radius:1.5}];G.commitOrder(s,'A1',fwd(9),dice(3,1));assert.equal(a.difficultThisMove,true,'landed in it');assert.equal(G.movementRemaining(a),2,'12 − 1 − 9');}
});
test('the Daemonsmith uses Daemonology by default; a Battle March roster may choose Battle Magic',()=>{
 assert.equal(G.getUnit(G.createGame('empire'),'A6').lore,'daemonology');
 const s=G.createGame('empire',{format:'battle-march',points:500,rosters:{ash:{faction:'chaos',entries:[{entry:'daemonsmith',general:true,lore:'battle'},{entry:'warriors',models:19},{entry:'decimators',models:9}]}}});assert.equal(G.getUnit(s,'A6').lore,'battle');
});
