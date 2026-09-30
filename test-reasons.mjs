import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

const test=(name,fn)=>{fn();console.log('PASS '+name);};
function battle(){const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0);return s;}

test('units that can act have no reason; units that cannot say why',()=>{
 const s=battle();G.nextPhase(s);const a1=G.getUnit(s,'A1'),i1=G.getUnit(s,'I1');
 assert.equal(G.inactionReason(s,a1),null);assert.match(G.inactionReason(s,i1),/other army/);
 G.move(s,'A1',3,'advance');assert.match(G.inactionReason(s,a1),/Already moved/);
 Object.assign(G.getUnit(s,'A2'),{engaged:'I2'});assert.match(G.inactionReason(s,G.getUnit(s,'A2')),/Engaged in combat/);
 Object.assign(G.getUnit(s,'A3'),{fleeing:true});assert.match(G.inactionReason(s,G.getUnit(s,'A3')),/Fleeing/);
});
test('the Shooting phase explains marching, charging, non-missile units and missing targets',()=>{
 const s=battle();G.nextPhase(s);G.move(s,'A4',6,'march');G.nextPhase(s);assert.equal(s.stage,'shooting');
 assert.match(G.inactionReason(s,G.getUnit(s,'A4')),/Marched this turn/);assert.match(G.inactionReason(s,G.getUnit(s,'A1')),/Not a missile unit/);
 G.getUnit(s,'A4').movementMode=null;assert.match(G.inactionReason(s,G.getUnit(s,'A4')),/No target/);
});
test('charge declarations explain why a unit cannot charge',()=>{
 const s=battle();G.nextPhase(s);s.movementStep='declare';assert.match(G.inactionReason(s,G.getUnit(s,'A1')),/Cannot charge: no enemy within its 9″ maximum charge range/);
});
test('Combat explains units that are not engaged or have already fought',()=>{
 const s=battle();s.stage='combat';assert.match(G.inactionReason(s,G.getUnit(s,'A1')),/Not engaged/);Object.assign(G.getUnit(s,'A1'),{engaged:'I1',combatResolved:true});assert.match(G.inactionReason(s,G.getUnit(s,'A1')),/Already fought/);
});
