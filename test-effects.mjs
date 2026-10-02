import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

// Temporary effects (spells, a landmark's property) and the General's Inspiring Presence.
const test=(name,fn)=>{fn();console.log('PASS '+name);};
const clearExcept=(s,keep)=>{for(const p of G.combatants(s))if(!keep.includes(p.id)){p.x=null;p.y=null;}};
function battle(first='ash'){const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:first});return s;}
const effect=(mods,extra={})=>({spell:'test',source:{kind:'spell',caster:'A6',team:'ash'},mods,rules:[],stack:null,expiry:{kind:'END_CURRENT_PLAYER_TURN',at:'1:ash'},...extra});

test('characteristic modifiers add up and are held to their limits, in any order',()=>{
 const s=battle(),u=G.getUnit(s,'A1');assert.deepEqual([G.profile(u).M,G.profile(u).T,G.profile(u).I],[3,4,2]);
 G.addEffect(s,[u],effect([{stat:'M',add:1,max:10},{stat:'T',add:1,max:10},{stat:'I',add:1,max:10}]));
 const p=G.profile(u);assert.deepEqual([p.M,p.T,p.I,p.S,p.A],[4,5,3,3,1]);assert.equal(G.baseProfile(u).M,3,'the printed profile is untouched');
 for(const order of [[{stat:'I',add:1,max:10},{stat:'I',add:-2,min:1}],[{stat:'I',add:-2,min:1},{stat:'I',add:1,max:10}]]){const v=G.getUnit(battle(),'A2');v.effects=order.map(m=>effect([m]));assert.equal(G.profile(v).I,1);}
 const w=G.getUnit(s,'A3');w.effects=[effect([{stat:'T',add:8,max:10},{stat:'Ld',add:-9,min:2}])];assert.equal(G.profile(w).T,10);assert.equal(G.profile(w).Ld,2);
});
test('the same effect twice counts once; a recast replaces the earlier record',()=>{
 const s=battle(),u=G.getUnit(s,'A1');u.effects=[effect([{stat:'M',add:1}],{stack:'spell:vigour'}),effect([{stat:'M',add:1}],{stack:'spell:vigour'})];assert.equal(G.profile(u).M,4);
 u.effects=[];G.addEffect(s,[u],effect([{stat:'M',add:1}],{stack:'spell:vigour'}));G.addEffect(s,[u],effect([{stat:'M',add:1}],{stack:'spell:vigour'}));assert.equal(u.effects.length,1);assert.equal(G.profile(u).M,4);
});
test('a regiment\'s effect shows in its champion\'s profile',()=>{
 const s=battle(),u=G.getUnit(s,'A1'),before=G.championProfile(u).A;G.addEffect(s,[u],effect([{stat:'A',add:1,max:10}]));assert.equal(G.championProfile(u).A,before+1);
});
test('effects end with the current turn, or at the start of the casting side\'s next turn',()=>{
 for(const first of ['ash','iron']){
  const s=battle(first),second=first==='ash'?'iron':'ash';
  for(const team of [first,second]){
   s.stage='combat';if(s.team!==team)G.nextTurn(s);s.stage='strategy';
   const u=G.getUnit(s,team==='ash'?'A1':'I1');u.effects=[];
   G.addEffect(s,[u],effect([{stat:'M',add:1}],{stack:'a',expiry:G.expiryAt(s,'END_CURRENT_PLAYER_TURN',team)}));
   G.addEffect(s,[u],effect([{stat:'T',add:1}],{stack:'b',expiry:G.expiryAt(s,'START_OF_CASTING_PLAYER_NEXT_TURN',team)}));
   s.stage='combat';G.nextTurn(s);assert.deepEqual(u.effects.map(e=>e.stack),['b'],`${team} (first ${first}): this turn's effect is gone; the other survives the enemy turn`);
   s.stage='combat';G.nextTurn(s);assert.equal(s.team,team);assert.deepEqual(u.effects,[],`${team}: gone as its side's next turn begins`);
  }
 }
});
test('effects can grant a Ward save and improve Armour Piercing, which spells do not use',()=>{
 const s=battle(),w=G.getUnit(s,'A6'),t=G.getUnit(s,'I1');assert.equal(G.wardSave(w),7);G.addEffect(s,[w],effect([],{rules:[{rule:'ward',value:5}]}));assert.equal(G.wardSave(w),5);
 const before=G.saveTarget(t,w);G.addEffect(s,[w],effect([],{ap:1,stack:'vessel'}));assert.equal(G.saveTarget(t,w),Math.min(7,before+1));
 clearExcept(s,['A6','I1']);Object.assign(s,{stage:'shooting',team:'ash'});Object.assign(w,{x:30,y:30,heading:0,spells:['fireball'],castThisTurn:[]});Object.assign(t,{x:30,y:20,heading:180});
 const r=G.castSpell(s,'A6','fireball','I1',(()=>{let i=0;const f=[5,5,6,6,6,1];return ()=>(f[Math.min(i++,f.length-1)]-1)/6+.01;})());assert.equal(r.effect.toSave,G.profile(t).save,'Fireball has no AP, and the caster\'s AP bonus does not apply to it');
});
test('a spell that adds Movement does not change which models fight',()=>{
 const s=battle();clearExcept(s,['A1','I1']);const a=G.getUnit(s,'A1'),b=G.getUnit(s,'I1');Object.assign(b,{x:30,y:20,heading:180});Object.assign(a,{x:33.5,y:20+(G.size(a).h+G.size(b).h)/2,heading:0});a.engaged=['I1'];b.engaged=['A1'];
 const count=()=>G.modelSquares(s,a).filter(m=>m.fighting).length,before=count();G.addEffect(s,[a],effect([{stat:'M',add:1,max:10}]));assert.equal(count(),before);
});
test('Inspiring Presence: within the General\'s Command range a unit uses the General\'s Leadership',()=>{
 const s=G.createGame('empire',{format:'battle-march',points:500});G.autoDeploy(s);const g=G.getUnit(s,'I12'),u=s.units.find(v=>v.team==='iron'&&v.entry==='stateTroops');
 assert.equal(g.general,true);assert.equal(G.profile(g).Ld,9);assert.equal(G.profile(u).Ld,7);
 Object.assign(g,{x:20,y:10,heading:180});Object.assign(u,{x:20,y:10+G.size(g).h/2+2+G.size(u).h/2,heading:180});assert.ok(Math.abs(G.gap(g,u)-2)<1e-6);
 assert.equal(G.leadership(u,'normal',s),9);assert.equal(G.leadership(u),7,'without the battle state, its own');
 G.addEffect(s,[u],effect([{stat:'Ld',add:-2,min:2}],{rules:[{block:'inspiringPresence'}]}));assert.equal(G.leadership(u,'normal',s),5,'Gathering Darkness: Ld -2 and no Inspiring Presence');u.effects=[];
 u.y=10+G.size(g).h/2+12+G.size(u).h/2;assert.equal(G.leadership(u,'normal',s),9,'12″ away: the General’s Command range is 12″, whatever its Leadership');u.y+=.5;assert.equal(G.leadership(u,'normal',s),7,'beyond 12″');
 u.y=10+G.size(g).h/2+2+G.size(u).h/2;g.fleeing=true;assert.equal(G.leadership(u,'normal',s),7,'a fleeing General inspires no one');
});
test('spells on a unit are listed with their caster and exact expiry',()=>{
 const s=battle();Object.assign(s,{stage:'strategy',team:'ash'});const w=G.getUnit(s,'A6');Object.assign(w,{spells:['shield'],castThisTurn:[]});
 G.castSpell(s,'A6','shield','A6',()=>.8);const tag=G.activeSpells(w)[0];assert.equal(tag.key,'shield');assert.equal(tag.caster,'A6');assert.deepEqual(tag.expiry,{kind:'START_OF_CASTING_PLAYER_NEXT_TURN',at:'2:ash'});
});
