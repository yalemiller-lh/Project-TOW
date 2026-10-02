import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

const test=(name,fn)=>{fn();console.log('PASS '+name);};
// Only the two artillery pieces on the table: the Deathshrieker and a Great Cannon 22″ apart.
function duel(team){const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0);for(const u of G.combatants(s))if(!['A5','I5'].includes(u.id)){u.x=null;u.y=null;}Object.assign(s.rocket,{x:36,y:42,heading:0});Object.assign(G.getUnit(s,'I5'),{x:36,y:16,heading:180});s.stage='shooting';s.team=team;return s;}

test('enemy war machines are among the artillery targets',()=>{
 const s=duel('ash'),t=G.rocketTargets(s).find(t=>t.unit.id==='I5');assert.ok(t,'the Deathshrieker can target a Great Cannon');assert.equal(t.error,undefined);
 const i=duel('iron'),c=G.cannonTargets(i,'I5',{mode:'ball',aimShort:6}).find(t=>t.unit.id==='A5');assert.ok(c,'a Great Cannon can target the Deathshrieker');assert.equal(c.error,undefined);
 const close=duel('ash');G.getUnit(close,'I5').y=34;assert.match(G.rocketTargets(close).find(t=>t.unit.id==='I5').error,/12″ and 48″/,'the usual range limits apply');
});
test('a rocket on a war machine hits machine and crew as one model: Toughness 6, crew armour, Multiple Wounds',()=>{
 const s=duel('ash'),cannon=G.getUnit(s,'I5');
 const report=G.fireRocket(s,'I5','demolition',{artillery:2,scatter:'hit'},()=>.99);
 const hit=report.affected.find(a=>a.unit==='I5');assert.ok(hit.centre);assert.equal(hit.toWound,2,'S8 (Renegades 2.0 centre hole) against Toughness 6');assert.equal(hit.toSave,7,'the crew has no armour save here');
 assert.equal(hit.multiple,6);assert.equal(hit.wounds,3,'Multiple Wounds capped at the 3 Wounds left');assert.equal(report.affected.filter(a=>a.unit==='I5').length,1,'one model, not machine and crew separately');
 assert.equal(cannon.wounds,0);assert.equal(cannon.x,null,'the whole machine and crew are removed');assert.equal(cannon.crew,0);
});
test('a cannonball through the Deathshrieker wounds it once on 2+; grapeshot needs 6s',()=>{
 const s=duel('iron');const report=G.fireCannon(s,'I5','A5','ball',{strike:6,bounce:2},()=>.99,{aimShort:6});
 const hit=report.affected.find(a=>a.unit==='A5');assert.ok(hit,'the ball strikes the launcher');assert.equal(hit.toWound,2);assert.ok(hit.multiple>=2&&hit.multiple<=4,'Multiple Wounds (D3+1)');assert.equal(s.rocket.wounds,Math.max(0,3-hit.wounds));assert.equal(s.rocket.crew,Math.min(3,s.rocket.wounds));
 const g=duel('iron');Object.assign(G.getUnit(g,'I5'),{y:32});const shot=G.fireCannon(g,'I5','A5','grape',{strike:6},()=>.99);
 assert.equal(shot.affected[0].toWound,6,'S4 against Toughness 6');assert.equal(g.rocket.wounds,0);assert.equal(g.rocket.x,null);assert.equal(shot.unsaved,3,'no more wounds than it has');
});
