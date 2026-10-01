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
test('the basic Battle March setup: 500 points on 44″ × 30″, Pitched Battle zones 7.5″ deep at the long edges',()=>{
 const s=bm();assert.equal(s.format.points,500);assert.deepEqual([s.board.width,s.board.height],[44,30]);assert.equal(s.format.rounds,5);assert.equal(s.format.deployment.map,'pitched-battle');
 assert.deepEqual(G.zoneBounds(s,'ash'),{left:0,right:44,top:22.5,bottom:30});assert.deepEqual(G.zoneBounds(s,'iron'),{left:0,right:44,top:0,bottom:7.5});
 const big=bm({points:750});assert.deepEqual([big.board.width,big.board.height],[48,36]);assert.deepEqual(G.zoneBounds(big,'iron'),{left:0,right:48,top:0,bottom:10.5},'10.5″ deep on 48″ × 36″');
 const small=bm({points:600});assert.deepEqual([small.board.width,small.board.height],[44,30]);
 const chosen=bm({points:500,board:'48x36'});assert.deepEqual([chosen.board.width,chosen.board.height],[48,36]);
});
test('the six maps use the published 44″ × 30″ coordinates; zones A and B, mirroring and a D6 roll',()=>{
 const map=(id,o={})=>bm({deployment:{map:id,...(o.mirrored?{mirrored:true}:{})},...(o.points?{points:o.points}:{})}),inside=(s,team,x,y)=>G.insideZone(s,team,{x,y}),zones=(id,mirrored=false)=>F.mapZones(F.deploymentMap(id),{width:44,height:30},{mirrored}),bounds=poly=>({left:Math.min(...poly.map(p=>p.x)),right:Math.max(...poly.map(p=>p.x)),top:Math.min(...poly.map(p=>p.y)),bottom:Math.max(...poly.map(p=>p.y))});
 assert.deepEqual(F.DEPLOYMENT_MAPS.filter(m=>m.official).map(m=>[m.roll,m.name,m.available]),[[1,'Pitched Battle',true],[2,'Close Encounter',true],[3,'Opposed Flanks',true],[4,'Meeting Engagement',true],[5,'Mountain Pass',true],[6,'Outflank',true]]);
 assert.equal(F.exactMapBoard({width:44,height:30}),true);assert.equal(F.exactMapBoard({width:48,height:36}),false,'48″ × 36″ is an adaptation');
 // Pitched Battle: A 0–7.5 at the top, B 22.5–30 at the bottom (Red takes B unless the zone choice says otherwise).
 assert.deepEqual(bounds(zones('pitched-battle').A),{left:0,right:44,top:0,bottom:7.5});assert.deepEqual(bounds(zones('pitched-battle').B),{left:0,right:44,top:22.5,bottom:30});
 // Close Encounter: A top-left, B bottom-right, minus a circle of radius 7.5 (not 15).
 const ce=map('close-encounter');assert.deepEqual(G.zoneBounds(ce,'ash'),{left:22,right:44,top:15,bottom:30});assert.deepEqual(G.zoneBounds(ce,'iron'),{left:0,right:22,top:0,bottom:15});
 assert.ok(inside(ce,'ash',40,26));assert.ok(!inside(ce,'ash',24,17),'inside the central circle');assert.ok(inside(ce,'ash',30,15.5),'just outside it');assert.ok(inside(ce,'iron',4,4));
 for(const p of G.zoneOf(ce,'iron').filter(p=>p.x>0&&p.x<22&&p.y>0&&p.y<15))assert.ok(Math.abs(Math.hypot(p.x-22,p.y-15)-7.5)<1e-9,'radius 7.5');
 const u=G.getUnit(ce,'A1');assert.equal(Math.hypot(30-22,23-15)>7.5,true);assert.match(G.checkPosition(ce,{...u,heading:0},28.5,19.5,true)??'',/zone/,'a centre outside the circle still fails when a base crosses into it');
 const cem=map('close-encounter',{mirrored:true});assert.deepEqual(G.zoneBounds(cem,'ash'),{left:0,right:22,top:15,bottom:30},'mirrored: bottom-left');assert.deepEqual(G.zoneBounds(cem,'iron'),{left:22,right:44,top:0,bottom:15},'and top-right');
 // Opposed Flanks: y = 12 − (12/44)x above, y = 30 − (12/44)x below: 18″ apart vertically.
 const of=map('opposed-flanks');assert.ok(inside(of,'iron',.2,11.8));assert.ok(!inside(of,'iron',.2,12.2));assert.ok(inside(of,'ash',43.8,18.2));assert.ok(!inside(of,'ash',43.8,17.8));
 for(const x of [0,11,22,33,44]){const top=12-12/44*x,bottom=30-12/44*x;assert.ok(Math.abs(bottom-top-18)<1e-9);}
 const ofm=map('opposed-flanks',{mirrored:true});assert.ok(inside(ofm,'iron',43.8,11.8),'mirrored: deepest on the right');assert.ok(!inside(ofm,'iron',.2,11.8));
 // Meeting Engagement: A x 0–33 at the top, B x 11–44 at the bottom; mirrored the other way round.
 assert.deepEqual(bounds(zones('meeting-engagement').A),{left:0,right:33,top:0,bottom:7.5});assert.deepEqual(bounds(zones('meeting-engagement').B),{left:11,right:44,top:22.5,bottom:30});
 assert.deepEqual(bounds(zones('meeting-engagement',true).A),{left:11,right:44,top:0,bottom:7.5});assert.deepEqual(bounds(zones('meeting-engagement',true).B),{left:0,right:33,top:22.5,bottom:30});
 // Mountain Pass: the short edges, a 22″ strip; armies face along the table.
 const mp=map('mountain-pass');assert.deepEqual(G.zoneBounds(mp,'iron'),{left:0,right:11,top:0,bottom:30});assert.deepEqual(G.zoneBounds(mp,'ash'),{left:33,right:44,top:0,bottom:30});assert.equal(G.getUnit(mp,'A1').heading,270);assert.equal(G.getUnit(mp,'I1').heading,90);assert.equal(mp.rocket.heading,270);
 // Outflank: x = 22 − (22/30)y and x = 44 − (22/30)y: 22″ apart horizontally.
 const ou=map('outflank');assert.ok(inside(ou,'iron',21.5,.2));assert.ok(!inside(ou,'iron',22.5,.2));assert.ok(inside(ou,'ash',22.5,29.8));assert.ok(!inside(ou,'ash',21.5,29.8));
 for(const y of [0,10,20,30]){const l=22-22/30*y,r=44-22/30*y;assert.ok(Math.abs(r-l-22)<1e-9);}
 const oum=map('outflank',{mirrored:true});assert.ok(inside(oum,'iron',43.8,.5),'mirrored: top-right');assert.ok(!inside(oum,'iron',.2,.5));
 // A D6 for the map: 4 is Meeting Engagement; the roll is recorded.
 const rolled=bm({deployment:{map:'roll'},random:()=>.5});assert.equal(rolled.format.deployment.map,'meeting-engagement');assert.equal(rolled.format.deployment.roll,4);
 // A depth only shapes the custom preset; Quick deploy fits every army in every map's zones.
 assert.deepEqual(G.zoneBounds(bm({deployment:{map:'pitched-battle',depth:14}}),'iron').bottom,7.5);
 for(const m of F.DEPLOYMENT_MAPS)for(const points of [500,750])for(const mirrored of [false,true]){const s=map(m.id,{points,mirrored});G.autoDeploy(s);for(const p of G.combatants(s))assert.ok(p.x!==null&&G.inZone(s,p.team,G.corners(p)),`${m.id} ${points}${mirrored?' mirrored':''}: ${p.id}`);}
});
test('the custom long-edge preset stays labelled and adjustable',()=>{
 const custom=F.DEPLOYMENT_MAPS.find(m=>!m.official);assert.match(custom.name,/not an official map/);
 const s=bm({deployment:{map:custom.id,depth:10}});assert.deepEqual(G.zoneBounds(s,'iron'),{left:0,right:44,top:0,bottom:10});assert.throws(()=>bm({deployment:{map:custom.id,depth:20}}),/depth/);
});
test('the whole footprint, rotated or not, must be inside the zone, including concave zones',()=>{
 const s=bm({points:750}),u=G.getUnit(s,'A1'),{w,h}=G.size(u);
 assert.equal(G.checkPosition(s,u,10,25.5+h/2,true),null);assert.match(G.checkPosition(s,u,10,25.5+h/2-.2,true),/zone/);
 assert.match(G.checkPosition(s,{...u,heading:30},10,25.5+h/2,true)??'',/zone/);
 s.zones.ash=[{x:0,y:24},{x:20,y:24},{x:20,y:30},{x:48,y:30},{x:48,y:36},{x:0,y:36}];
 assert.equal(G.checkPosition(s,u,8,30,true),null);assert.match(G.checkPosition(s,u,20,27,true),/zone/);
});
test('Quick deploy puts war machines at the back of the zone and varies the line from game to game',()=>{
 const rng=seed=>()=>{seed=seed*16807%2147483647;return seed/2147483647;};
 for(const m of ['pitched-battle','mountain-pass','meeting-engagement','outflank'])for(const seed of [3,7]){
  const s=bm({points:750,deployment:{map:m}});G.autoDeploy(s,{random:rng(seed)});
  for(const p of G.combatants(s).filter(p=>p.role==='warmachine')){
   const a=G.deploymentFacing(s,p.team)*Math.PI/180,depth=q=>q.x*Math.sin(a)-q.y*Math.cos(a),back=Math.min(...G.zoneOf(s,p.team).map(depth));
   assert.ok(Math.min(...G.corners(p).map(depth))-back<.6,`${m}: ${p.id} stands on the back edge of its zone`);
  }
 }
 // Close Encounter faces diagonally into the centre: there the machines stand behind the line.
 {const s=bm({points:750,deployment:{map:'close-encounter'}});G.autoDeploy(s,{random:rng(3)});for(const team of ['ash','iron']){const a=G.deploymentFacing(s,team)*Math.PI/180,depth=q=>q.x*Math.sin(a)-q.y*Math.cos(a),line=s.units.filter(u=>u.team===team&&!G.isCharacter(u));for(const m of G.combatants(s).filter(p=>p.team===team&&p.role==='warmachine'))assert.ok(line.every(u=>depth(m)<depth(u)),`${m.id} behind its battle line`);}}
 const layout=seed=>{const s=bm();G.autoDeploy(s,seed?{random:rng(seed)}:{});return JSON.stringify(G.combatants(s).map(p=>[p.id,Math.round(p.x*2),Math.round(p.y*2)]));};
 assert.notEqual(layout(3),layout(11),'different games deploy differently');assert.equal(layout(0),layout(0),'without a random source the plan is fixed');
 const classic=G.createGame('empire');G.autoDeploy(classic,{random:rng(5)});assert.ok(classic.rocket.y>45&&classic.cannons.every(c=>c.y<3),'classic Quick deploy: machines on the back edges');
});
test('manual deployment: place any piece, turn it where it stands or pick it up; a confirmed piece stays put',()=>{
 const s=bm();G.chooseDeploymentZone(s,'iron','A');G.deploymentRollOff(s,()=>.9);
 G.placeAt(s,'A1',15,24.5);assert.equal(s.deployOrder.pending,'A1');
 assert.throws(()=>G.turnDeployed(s,'A1',30),/fit/,'at the front edge of the zone a 30° turn would leave the zone');assert.equal(G.getUnit(s,'A1').heading,0,'a refused turn leaves the facing alone');
 G.placeAt(s,'A1',15,26.5);G.turnDeployed(s,'A1',30);assert.equal(G.getUnit(s,'A1').heading,30);
 G.unplace(s,'A1');assert.equal(G.getUnit(s,'A1').x,null);assert.equal(s.deployOrder.pending,null);
 G.placeAt(s,'A5',8,28);G.turnDeployed(s,'A5',345);assert.equal(s.rocket.heading,345);assert.match(G.deployError(s,s.rocket,8,23),/zone/);assert.equal(G.deployError(s,s.rocket,8,28),null);
 G.confirmDeployment(s);assert.equal(s.rocket.deployed,true);assert.throws(()=>G.unplace(s,'A5'),/already deployed/);assert.throws(()=>G.turnDeployed(s,'A5',0));
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
