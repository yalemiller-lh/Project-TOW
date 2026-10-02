import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
import * as A from './dist/armies.mjs';
import './dist/battlemarch.mjs';

// Mounted characters (The Empire of Man data: Empire Warhorse, Barded Warhorse, Pegasus; core rules:
// Split Profile (Cavalry), Barding, Swiftstride, First Charge, Fly (X), Targeting Lone Characters).
const test=(name,fn)=>{fn();console.log('PASS '+name);};
const dice=(...faces)=>{let i=0;return ()=>(faces[Math.min(i++,faces.length-1)]-1)/6+.01;};
const near=(a,b,tol=1e-6)=>Math.abs(a-b)<=tol;
const clearExcept=(s,keep)=>{for(const p of G.allPieces(s))if(!keep.includes(p.id)){p.x=null;p.y=null;}};
const roster=mount=>({faction:'empire',entries:A.LISTS['empire-500'].entries.map(e=>e.entry==='captain'?{...e,mount}:e)});
function game(mount){const s=G.createGame('empire',{format:'battle-march',points:750,rosters:{iron:roster(mount)}});G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'iron'});for(const u of s.units)u.charge=null;return {s,c:G.getUnit(s,'I12')};}

test('a mount is bought with its character: its points and Unit Strength',()=>{
 assert.equal(A.entryCost('empire',{entry:'captain',options:{fullPlate:true},mount:'barded'}),45+6+16);assert.equal(A.entryCost('empire',{entry:'masterMage',mount:'pegasus'}),60+30+30);
 assert.equal(A.entryUnitStrength('empire',{entry:'captain',mount:'warhorse'}),2);assert.equal(A.entryUnitStrength('empire',{entry:'captain',mount:'pegasus'}),3);
 assert.match(A.validateRoster({faction:'empire',entries:[{entry:'masterMage',general:true,mount:'barded'},{entry:'stateTroops',models:20},{entry:'missileTroops',models:10}]},750).errors.join(' '),/cannot ride/);
});
test('a mounted character: the mount\'s Movement and base, the rider\'s armour (barding +1), cavalry Unit Strength',()=>{
 const {s,c}=game('barded');assert.equal(c.mount,'barded');assert.equal(G.profile(c).M,7);assert.equal(G.profile(c).WS,5,'the rider\'s Weapon Skill');assert.equal(G.armourSave(c),3,'full plate 4+, barding 3+');
 assert.ok(near(G.size(c).w,30/25.4)&&near(G.size(c).h,60/25.4));assert.equal(G.troopType(c),'heavyCavalry');assert.equal(G.unitStrength(c),2);assert.match(G.equipment(c),/Barded Warhorse/);
 const p=game('pegasus');assert.equal(G.profile(p.c).W,3);assert.equal(p.c.wounds,3);assert.deepEqual(G.flyValues(p.c),[10]);assert.equal(G.unitStrength(p.c),3);
});
test('in combat the mount strikes for itself at its own Initiative, against the rider\'s enemy',()=>{
 const {s,c}=game('pegasus');clearExcept(s,['I12','A1']);const a=G.getUnit(s,'A1');Object.assign(a,{x:22,y:15,heading:0});Object.assign(c,{x:22,y:15-G.size(a).h/2-G.size(c).h/2,heading:180});c.engaged=['A1'];a.engaged=['I12'];Object.assign(s,{stage:'combat',team:'iron'});
 G.beginCombat(s,'I12');assert.equal(s.combatSession.initiative['I12:mount'],4);while(s.combatSession.phase==='attacks')G.fightCombatStep(s,()=>.5);
 const mount=s.combatSession.stages.find(st=>st.mount);assert.ok(mount,'a mount stage');assert.equal(mount.from,'I12');assert.equal(mount.attacks,2);assert.equal(mount.toWound,G.woundTarget(G.mountProxy(c),a));
 const rider=s.combatSession.stages.find(st=>st.from==='I12'&&!st.mount);assert.equal(rider.attacks,G.profile(c).A);
});
test('Swiftstride: 3″ more charge range and +D6 on the Charge roll; First Charge disrupts the target of the first charge only',()=>{
 const {s,c}=game('barded');clearExcept(s,['I12','A1']);const a=G.getUnit(s,'A1');assert.equal(G.chargeReach(c),7+6+3);
 Object.assign(a,{x:22,y:12,heading:180});Object.assign(c,{x:22,y:12+G.size(a).h/2+14+G.size(c).h/2,heading:0});Object.assign(s,{stage:'movement',team:'iron',movementStep:'declare'});
 assert.equal(G.chargePlan(s,c,a).error,undefined,'14″ away is within 16″');G.declareCharge(s,'I12','A1');G.chargeReaction(s,'I12','hold');G.finishDeclarations(s);
 const r=G.resolveCharge(s,'I12',[6,1],dice(3));assert.equal(r.swift,3);assert.equal(r.range,7+6+3);assert.equal(r.success,true);
 assert.equal(a.firstChargeDisrupted,'1:iron');assert.ok(G.disruption(s,a).some(d=>d.kind==='firstCharge'));assert.equal(c.firstChargeTried,true);
});
test('a mounted Lone character is not protected by infantry nearby; it cannot join an infantry regiment',()=>{
 const {s,c}=game('warhorse');clearExcept(s,['I12','I1','A2']);const u=G.getUnit(s,'I1'),d=G.getUnit(s,'A2');Object.assign(u,{x:22,y:10,heading:180});Object.assign(c,{x:22+G.size(u).w/2+1+G.size(c).w/2,y:10,heading:180});Object.assign(d,{x:30,y:24,heading:0});
 assert.equal(G.screenedCharacter(s,d,c),false,'infantry does not screen a cavalry character');const f=game();clearExcept(f.s,['I12','I1','A2']);const fu=G.getUnit(f.s,'I1'),fd=G.getUnit(f.s,'A2');Object.assign(fu,{x:22,y:10,heading:180});Object.assign(f.c,{x:22+G.size(fu).w/2+1+G.size(f.c).w/2,y:10,heading:180});Object.assign(fd,{x:30,y:24,heading:0});
 assert.equal(G.screenedCharacter(f.s,fd,f.c),true,'on foot it is screened by the regiment');
 Object.assign(s,{stage:'movement',team:'iron',movementStep:'remaining'});c.moved=false;assert.match(G.joinError(s,'I12','I1'),/mounted/);
});
