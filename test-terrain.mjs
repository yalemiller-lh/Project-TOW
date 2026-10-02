import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
import * as F from './dist/formats.mjs';
import * as BM from './dist/battlemarch.mjs';

// Battle March terrain set-up (the user's terrain brief of 1 October 2026, sections 1–5 and 18).
const test=(name,fn)=>{fn();console.log('PASS '+name);};
const dice=(...faces)=>{let i=0;return ()=>(faces[Math.min(i++,faces.length-1)]-1)/6+.01;};
const seq=values=>{let i=0;return ()=>values[Math.min(i++,values.length-1)];};
const game=(terrain={method:'alternate'},extra={})=>G.createGame('empire',{format:'battle-march',points:500,objectives:'troves2',terrain,...extra});

test('the allowance: one feature per 12″ of the longest edge, pieces counted by their widest extent',()=>{
 assert.equal(F.terrainAllowance({width:44,height:30}),4);assert.equal(F.terrainAllowance({width:48,height:36}),4);assert.equal(F.terrainAllowance({width:72,height:48}),6);
 assert.deepEqual([1.9,2,8,8.5,12,13].map(F.terrainSizeClass),[0,1,1,2,2,3]);
 assert.deepEqual(F.STARTER_COLLECTION,['hill','wood','wall','building']);assert.equal(F.TERRAIN_METHODS.free.official,false);
});
test('normal placement: the roll-off winner places first, then the players alternate; the centre and the other player\'s features keep 12″ clear',()=>{
 const s=game();assert.equal(G.terrainPending(s),true);assert.match(G.terrainPlacementError(s,'ash','hill',5,5)??'',/Roll off/);G.terrainRollOff(s,dice(2,5));assert.equal(s.terrainSetup.next,'iron');
 assert.match(G.terrainPlacementError(s,'ash','hill',5,5),/places the next/);assert.match(G.terrainPlacementError(s,'iron','hill',22,9),/12″ of the centre/);
 const h=G.placeTerrain(s,'iron','hill',5,5);assert.equal(h.owner,'iron');assert.equal(s.terrainSetup.next,'ash');assert.ok(h.points.length>=12&&h.top);
 assert.match(G.terrainPlacementError(s,'ash','wood',5,15)??'',/other player placed/,'5″ from the enemy-placed hill');assert.equal(G.terrainPlacementError(s,'ash','wood',39,25),null);
 G.placeTerrain(s,'ash','wood',39,25);assert.equal(G.terrainPlacementError(s,'iron','building',5,14),null,'its own hill may be near');
 assert.deepEqual(s.terrain.filter(t=>t.owner).map(t=>[t.key,t.owner]),[['hill','iron'],['wood','ash']]);
});
test('the allowance limits what is placed; a side may pass, and two passes end placement',()=>{
 const s=game({method:'alternate',pieces:['hill','wood','wall','building','rocks']});G.terrainRollOff(s,dice(6,1));
 for(const [team,key,x,y]of [['ash','hill',5,5],['iron','wood',39,25],['ash','wall',5,15],['iron','building',39,5]])G.placeTerrain(s,team,key,x,y);
 assert.equal(G.terrainPending(s),false,'four features: the allowance is placed');assert.ok(!s.terrain.some(t=>t.key==='rocks'),'unused pieces are set aside');
 const p=game();G.terrainRollOff(s.terrainSetup?p:p,dice(6,1));G.passTerrain(p,'ash');assert.equal(p.terrainSetup.next,'iron');G.passTerrain(p,'iron');assert.equal(G.terrainPending(p),false);
});
test('scattered placement: the winner places all, then the loser scatters D3; each stops on touching a feature or the edge',()=>{
 const s=game({method:'scatter',pieces:['hill','wood']});G.terrainRollOff(s,dice(6,1));G.placeTerrain(s,'ash','hill',5,8);assert.equal(s.terrainSetup.next,'ash','the winner places every feature');
 assert.equal(G.terrainPlacementError(s,'ash','wood',5,20),null,'no 12″ rule between features in this method');G.placeTerrain(s,'ash','wood',5,20);
 assert.equal(s.terrainSetup.scatter.by,'iron');assert.equal(G.scatterTerrainCount(s,dice(5)),2,'D3: a 5 is 3, but only two features stand');
 const hill=s.terrain.find(t=>t.key==='hill');const reports=G.scatterTerrain(s,'iron',[hill.id,s.terrain.find(t=>t.key==='wood').id],seq([.5,0,.99,.99,.5,0,.99,.99]));
 assert.equal(reports[0].stop,'edge','scattered straight up, the hill stops at the edge');assert.ok(Math.min(...hill.points.map(p=>p.y))<.2);assert.ok(reports[0].moved<reports[0].distance);
 assert.equal(reports[1].stop,'feature','scattered up after it, the wood stops on touching the hill');assert.equal(G.terrainPending(s),false);
});
test('an agreed layout has no placement restrictions; treasure troves then keep 3″ from terrain',()=>{
 const s=game({method:'free'});assert.equal(G.terrainPlacementError(s,'ash','hill',22,9),null,'near the centre is allowed');
 const t=s.objectives.items[0];G.placeTerrain(s,'ash','building',t.x,t.y+t.r+1+2);G.passTerrain(s,'ash');assert.equal(G.terrainPending(s),false);
 const b=s.terrain.find(f=>f.key==='building');assert.ok(G.featureDistance(b,t)-t.r>=3-1e-6,'shifted the least distance to clear the trove');assert.equal(b.shifted,true);
 assert.match(BM.objectivePlacementError(s,t.id,b.x,b.y-3)??'',/3″/);
});
test('deployment waits for the terrain; Quick deploy places it first; a landmark and troves are set apart',()=>{
 const s=game();assert.throws(()=>G.chooseDeploymentZone(s,'iron','A'),/terrain/);assert.equal(BM.canPlaceObjectives(s),false,'objectives come after terrain');
 G.autoDeploy(s,{random:dice(3)});assert.equal(G.terrainPending(s),false);assert.ok(s.terrain.length>=1);assert.equal(G.deploymentComplete(s),true);
 for(const f of s.terrain)assert.equal(G.featureDistance(f,{x:s.board.width/2,y:s.board.height/2})>12,true,`${f.name} is more than 12″ from the centre`);
 const l=game({method:'none'},{objectives:'landmark'});assert.equal(G.terrainPending(l),false);const lm=l.terrain.find(t=>t.kind==='landmark');assert.ok(lm&&lm.impassable);
 assert.ok(G.terrainBlocks(l,[{x:lm.x-.5,y:lm.y-.5},{x:lm.x+.5,y:lm.y-.5},{x:lm.x+.5,y:lm.y+.5},{x:lm.x-.5,y:lm.y+.5}]));const tr=game({method:'none'});assert.equal(tr.terrain.some(t=>t.kind==='trove'),false,'troves are objectives, not terrain');
});
