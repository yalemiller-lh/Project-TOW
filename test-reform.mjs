import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';

// Reforming after combat (core rules: Restrain & Reform, Catching the Curs!, Running Down the Foe):
// the reform is offered after the move, and the facing is chosen then.
const test=(name,fn)=>{fn();console.log('PASS '+name);};
const seq=values=>{let i=0;return ()=>values[i++]??0;};
const face=n=>(n-.5)/6,faces=(...n)=>seq(n.map(face));
function engaged(){const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0);for(const p of G.combatants(s))if(!['A1','I1'].includes(p.id)){p.x=null;p.y=null;}
 const a=G.getUnit(s,'A1'),b=G.getUnit(s,'I1');Object.assign(b,{x:36,y:20,heading:180});Object.assign(a,{x:36,y:20+(G.size(a).h+G.size(b).h)/2,heading:0});a.engaged=['I1'];b.engaged=['A1'];Object.assign(s,{stage:'combat',team:'ash'});return {s,a,b};}
function breakFor(s,winner,loser,margin=3){const w=G.getUnit(s,winner),l=G.getUnit(s,loser);s.pendingCombat={combat:[winner,loser],winnerSide:w.team,loserSide:l.team,margin,stage:'break',winners:[winner],losers:[loser],results:{},former:{[winner]:[loser],[loser]:[winner]},loser,winner};}

test('a unit that passes its Restraint test is offered a free reform, and chooses its facing afterwards',()=>{
 const {s,a}=engaged();breakFor(s,'A1','I1');G.finishCombat(s,'restrain',faces(6,6,1,1,3,3));assert.equal(s.pendingCombat,null);
 assert.equal(G.reformOffer(s,'A1')?.test,'free');const out=G.reformUnit(s,'A1',90);assert.equal(out.passed,true);assert.equal(out.dice,null,'no test');assert.equal(a.heading,90);assert.equal(G.reformOffer(s,'A1'),null,'one reform');
});
test('a pursuit that runs down a fleeing enemy offers an attempt to reform: a Leadership test',()=>{
 for(const [roll,passed]of [[[6,6],false],[[2,3],true]]){const {s,a}=engaged();breakFor(s,'A1','I1');const out=G.finishCombat(s,'follow',faces(6,6,1,1,6,6));assert.equal(out.loserDestroyed,true);assert.equal(out.reformOffer,'leadership');
  const before=a.heading,r=G.reformUnit(s,'A1',before+90,faces(...roll));assert.equal(r.passed,passed);assert.equal(a.heading,passed?(before+90)%360:before);}
});
test('a charge that runs down a fleeing target offers an attempt to reform; offers end with the phase',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'ash'});for(const p of G.combatants(s))if(!['A1','I1'].includes(p.id)){p.x=null;p.y=null;}const a=G.getUnit(s,'A1'),b=G.getUnit(s,'I1');
 Object.assign(a,{x:36,y:30,heading:0});Object.assign(b,{x:36,y:30-G.size(a).h/2-3-G.size(b).h/2,heading:180});Object.assign(s,{stage:'movement',team:'ash',movementStep:'declare'});for(const u of s.units)u.charge=null;
 G.declareCharge(s,'A1','I1');G.chargeReaction(s,'A1','flee',faces(1,1));G.finishDeclarations(s);assert.equal(G.resolveCharge(s,'A1',[6,6]).runDown,true);assert.equal(G.reformOffer(s,'A1')?.test,'leadership');
 assert.match(G.reformError(s,'A1',NaN),/facing/);G.nextPhase(s);assert.equal(G.reformOffer(s,'A1'),null);
});
