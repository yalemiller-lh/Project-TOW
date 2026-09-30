import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
import * as F from './dist/formats.mjs';
import './dist/battlemarch.mjs';

const test=(name,fn)=>{fn();console.log('PASS '+name);};
const bm=(options={})=>G.createGame('empire',{format:'battle-march',...options});
// Finish every remaining phase of the game without taking actions.
function playOut(s){let turns=0,guard=0;while(s.stage!=='finished'&&guard++<500){const before=s.team;G.nextPhase(s);G.skipEmptySteps(s);if(s.team!==before||s.stage==='finished')turns++;}return turns;}

test('classic games keep the 72″ × 48″ table, 12″ zones and open-ended rounds',()=>{
 const s=G.createGame('empire');assert.deepEqual([s.board.width,s.board.height],[72,48]);assert.deepEqual(G.zoneBounds(s,'ash'),{left:0,right:72,top:36,bottom:48});assert.equal(s.format.rounds,null);
 G.autoDeploy(s);assert.equal(G.getUnit(s,'A1').x,18);G.begin(s,()=>0);for(let i=0;i<8;i++)G.nextPhase(s);assert.equal(s.round,2);assert.equal(s.stage,'strategy');
});
test('Battle March defaults to 750 points on a 48″ × 36″ battlefield; 600 points or fewer use 44″ × 30″',()=>{
 const s=bm();assert.equal(s.format.points,750);assert.deepEqual([s.board.width,s.board.height],[48,36]);assert.equal(s.format.rounds,5);
 const small=bm({points:600});assert.deepEqual([small.board.width,small.board.height],[44,30]);
 const chosen=bm({points:500,board:'48x36'});assert.deepEqual([chosen.board.width,chosen.board.height],[48,36]);
});
test('official deployment maps stay unavailable until their geometry is supplied; the custom preset is labelled',()=>{
 for(const map of F.DEPLOYMENT_MAPS.filter(m=>m.official)){assert.equal(map.available,false);assert.throws(()=>bm({deployment:{map:map.id,depth:12}}),/geometry has not been supplied/);}
 const custom=F.DEPLOYMENT_MAPS.find(m=>m.available);assert.match(custom.name,/not an official map/);
 const s=bm({deployment:{map:custom.id,depth:10}});assert.deepEqual(G.zoneBounds(s,'iron'),{left:0,right:48,top:0,bottom:10});assert.throws(()=>bm({deployment:{map:custom.id,depth:20}}),/depth/);
});
test('the whole footprint, rotated or not, must be inside the zone, including concave zones',()=>{
 const s=bm(),u=G.getUnit(s,'A1'),{w,h}=G.size(u);
 assert.equal(G.checkPosition(s,u,10,24+h/2,true),null);assert.match(G.checkPosition(s,u,10,24+h/2-.2,true),/zone/);
 assert.match(G.checkPosition(s,{...u,heading:30},10,24+h/2,true)??'',/zone/);
 s.zones.ash=[{x:0,y:24},{x:20,y:24},{x:20,y:30},{x:48,y:30},{x:48,y:36},{x:0,y:36}];
 assert.equal(G.checkPosition(s,u,8,30,true),null);assert.match(G.checkPosition(s,u,20,27,true),/zone/);
});
test('Quick deploy finds legal places for every unit and war machine on the Battle March table',()=>{
 const s=bm();G.autoDeploy(s);for(const u of s.units)assert.equal(G.checkPosition(s,u,u.x,u.y,true),null,u.id);assert.ok(s.cannons.every(c=>c.x!==null));assert.ok(s.rocket.x!==null);
});
for(const first of ['ash','iron'])test(`with ${first} first, the game ends after exactly five complete rounds`,()=>{
 const s=bm();G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:first});assert.equal(s.team,first);assert.equal(s.firstPlayer,first);
 const turns=playOut(s);assert.equal(turns,10);assert.equal(s.stage,'finished');assert.equal(s.round,5);assert.deepEqual(s.turnLog,[1,1,2,2,3,3,4,4,5,5].map((r,i)=>`${r}:${i%2?(first==='ash'?'iron':'ash'):first}`));
 assert.throws(()=>G.nextPhase(s),/over/);assert.deepEqual(G.skipEmptySteps(s),[]);
});
test('each player turn is processed once, however often it is asked for',()=>{
 const s=bm();G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'ash'});assert.equal(G.endOfPlayerTurn(s,'ash'),true);assert.equal(G.endOfPlayerTurn(s,'ash'),false);assert.deepEqual(s.turnLog,['1:ash']);
});
