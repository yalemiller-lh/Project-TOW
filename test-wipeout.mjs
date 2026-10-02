import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
import * as BM from './dist/battlemarch.mjs';

// The battle ends as soon as one army has no units left (the user's request of 2 October 2026).
const test=(name,fn)=>{fn();console.log('PASS '+name);};
test('a classic battle ends when every enemy unit, character and war machine is destroyed',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'ash'});
 const blue=G.allPieces(s).filter(p=>p.team==='iron'),last=blue.pop();for(const p of blue){if(p.role==='warmachine'){p.wounds=0;p.x=null;}else G.destroyUnit(s,p,'COMBAT_CASUALTIES');}
 G.skipEmptySteps(s);assert.notEqual(s.stage,'finished','one Blue piece is left');assert.equal(G.armyDestroyed(s,'iron'),false);
 if(last.role==='warmachine'){last.wounds=0;last.x=null;}else G.destroyUnit(s,last,'COMBAT_CASUALTIES');
 assert.equal(G.armyDestroyed(s,'iron'),true);G.skipEmptySteps(s);assert.equal(s.stage,'finished');assert.match(s.result.reason,/no units left/);
 assert.throws(()=>G.nextPhase(s),/over/);
});
test('a Battle March ends and is scored at once; a unit held in reserve keeps its army in the battle',()=>{
 const s=G.createGame('empire',{format:'battle-march',points:500,terrain:{method:'none'}});G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'ash'});
 const keep=s.units.find(u=>u.team==='iron'&&u.role==='infantry');for(const p of G.allPieces(s).filter(p=>p.team==='iron'&&p!==keep)){if(p.role==='warmachine'){p.wounds=0;p.x=null;}else G.destroyUnit(s,p,'COMBAT_CASUALTIES');}
 Object.assign(keep,{x:null,y:null,reserve:{arriving:false}});assert.equal(G.armyDestroyed(s,'iron'),false,'in reserve, not destroyed');
 G.destroyUnit(s,keep,'COMBAT_CASUALTIES');G.nextPhase(s);assert.equal(s.stage,'finished');assert.ok(s.result.totals,'scored');assert.ok(s.result.totals.ash>s.result.totals.iron);
});
