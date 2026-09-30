import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
{
 const s=G.createGame();G.autoDeploy(s);G.begin(s,()=>0);G.nextPhase(s);
 const u=G.getUnit(s,'A1'),start={x:u.x,y:u.y,heading:u.heading};
 const back=G.commitOrder(s,'A1',{kind:'back',mode:'advance',distance:1,angle:0});
 assert.equal(back.cost,2);assert.equal(u.y,start.y+1);assert.equal(u.heading,start.heading);
 assert.match(G.orderError(s,u,{kind:'side',side:-1,mode:'advance',distance:1,angle:0}),/allowance/);
 G.undo(s);
 const side=G.commitOrder(s,'A1',{kind:'side',side:-1,mode:'advance',distance:1,angle:0});
 assert.equal(side.cost,2);assert.equal(u.x,start.x-1);assert.equal(u.y,start.y);assert.equal(u.heading,start.heading);
 G.undo(s);
 assert.equal(G.orderError(s,u,{kind:'side',side:0,mode:'advance',distance:1,angle:0}), 'Choose left or right for a sideways move.');
}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
function ready(){const s=G.createGame();G.autoDeploy(s);s.rocket.wounds=0;G.begin(s,()=>0);G.nextPhase(s);return s;}
test('wheel cost uses the straight-line chord from the outer front corner',()=>{near(G.wheelCost(30),2*G.SIZE.w*Math.sin(Math.PI/12));near(G.wheelCost(-30),G.wheelCost(30));near(G.wheelCost(G.maxWheel('advance')),3);near(G.wheelCost(G.maxWheel('march')),6);});
test('left and right wheel keep their respective leading corner fixed',()=>{const s=ready(),u=G.getUnit(s);for(const angle of [-30,30]){const original=G.localPoint(u,(angle<0?-1:1)*G.SIZE.w/2,-G.SIZE.h/2);const next=G.wheelPose(u,angle);const pinned=G.localPoint(next,(angle<0?-1:1)*G.SIZE.w/2,-G.SIZE.h/2);near(original.x,pinned.x);near(original.y,pinned.y);near(next.heading,G.normalize(angle));}});
test('wheel and advance share a single allowance',()=>{const s=ready(),u=G.getUnit(s);assert.equal(G.orderError(s,u,{kind:'wheel',mode:'advance',angle:30,distance:.4}),null);assert.match(G.orderError(s,u,{kind:'wheel',mode:'advance',angle:30,distance:1}),/allowance/);const p=G.commitOrder(s,u.id,{kind:'wheel',mode:'advance',angle:30,distance:.4});assert.equal(u.moved,false);near(u.spent,p.cost);near(u.x,p.afterWheel.x+.2);near(u.y,p.afterWheel.y-Math.sqrt(3)/2*.4);});
test('forward movement follows changed facing on the next turn',()=>{const s=ready(),u=G.getUnit(s);G.commitOrder(s,u.id,{kind:'pivot',mode:'advance',angle:90,distance:0});for(let i=0;i<6;i++)G.nextPhase(s);assert.equal(s.stage,'movement');const x=u.x,y=u.y;G.move(s,u.id,3,'advance');near(u.x,x+3);near(u.y,y);});
test('centre reform keeps centre, completes move and disallows marching',()=>{const s=ready(),u=G.getUnit(s);assert.match(G.orderError(s,u,{kind:'pivot',mode:'march',angle:90,distance:0}),/cannot march/);assert.match(G.orderError(s,u,{kind:'pivot',mode:'advance',angle:90,distance:1}),/whole move/);const x=u.x,y=u.y;G.commitOrder(s,u.id,{kind:'pivot',mode:'advance',angle:180,distance:0});near(u.x,x);near(u.y,y);assert.equal(u.heading,180);assert.ok(u.moved);assert.throws(()=>G.move(s,u.id,1,'advance'),/active/);});
test('rotated bounding footprint and separation are correct',()=>{const s=ready(),u=G.getUnit(s);u.heading=90;const r=G.rectangle(u);near(r.right-r.left,G.SIZE.h);near(r.bottom-r.top,G.SIZE.w);const b=G.getUnit(s,'A2');Object.assign(b,{x:u.x+G.SIZE.h+1,y:u.y,heading:90});near(G.gap(u,b),1);assert.equal(G.checkPosition(s,u,u.x,u.y),null);b.x-=.1;assert.match(G.checkPosition(s,u,u.x,u.y),/between/);});
test('pivot endpoint cannot overlap another unit or leave board',()=>{const s=ready(),u=G.getUnit(s),v=G.getUnit(s,'A2');Object.assign(u,{x:20,y:20});Object.assign(v,{x:25.95,y:20});assert.equal(G.checkPosition(s,u,u.x,u.y),null);assert.match(G.orderError(s,u,{kind:'pivot',mode:'advance',angle:45,distance:0}),/between/);u.x=2.5;v.x=45;assert.match(G.orderError(s,u,{kind:'pivot',mode:'advance',angle:45,distance:0}),/battlefield/);});
test('front-edge obstruction prevents wheeling',()=>{const s=ready(),u=G.getUnit(s),v=G.getUnit(s,'A2');Object.assign(u,{x:20,y:25});Object.assign(v,{x:20,y:19.5});assert.match(G.orderError(s,u,{kind:'wheel',mode:'advance',angle:30,distance:0}),/between|leading/);});
test('undo restores x y and facing after a wheel',()=>{const s=ready(),u=G.getUnit(s);const before={x:u.x,y:u.y,heading:u.heading};G.commitOrder(s,u.id,{kind:'wheel',mode:'advance',angle:-30,distance:.2});G.undo(s);assert.deepEqual({x:u.x,y:u.y,heading:u.heading},before);assert.equal(u.moved,false);});
test('done state tracks actual phase availability and resets next turn',()=>{const s=ready(),u=G.getUnit(s),enemy=G.getUnit(s,'I1');assert.equal(G.phaseComplete(s,u),false);G.hold(s,u.id);assert.equal(G.phaseComplete(s,u),true);assert.equal(G.phaseComplete(s,enemy),false);G.undo(s);assert.equal(G.phaseComplete(s,u),false);G.nextPhase(s);assert.equal(G.phaseComplete(s,u),true);for(let i=0;i<5;i++)G.nextPhase(s);assert.equal(s.stage,'movement');assert.equal(G.phaseComplete(s,u),false);});
test('failed march test still permits a normal wheel and cannot be retried',()=>{const s=ready(),u=G.getUnit(s),v=G.getUnit(s,'I1');Object.assign(u,{x:18,y:25});Object.assign(v,{x:18,y:14});G.marchTest(s,u.id,[6,6]);assert.match(G.orderError(s,u,{kind:'wheel',mode:'march',angle:30,distance:0}),/failed/);G.commitOrder(s,u.id,{kind:'wheel',mode:'advance',angle:15,distance:0});G.undo(s);assert.equal(u.marchTest,false);assert.throws(()=>G.marchTest(s,u.id,[1,1]),/already/);});
console.log(`${count} manoeuvre checks passed.`);
