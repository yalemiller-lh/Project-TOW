import assert from 'node:assert/strict';
import * as G from './dist/game.mjs';
import './dist/battlemarch.mjs';
const RED=await import('./dist/ai.mjs?save-red'),BLUE=await import('./dist/ai.mjs?save-blue');
RED.setSide('ash');BLUE.setSide('iron');

// Saving and resuming: a battle saved at any moment and loaded again plays on exactly as the
// original does with the same dice.
const test=async(name,fn)=>{await fn();console.log('PASS '+name);};
const rng=seed=>{let x=seed%2147483647||1;return ()=>{x=(x*16807)%2147483647;return (x-1)/2147483646;};};
const bot=team=>team==='ash'?RED:BLUE;
function deploy(s,r){
 const d=s.deployOrder;
 for(const team of ['ash','iron'])if(bot(team).deploymentChoice(s)==='zone')bot(team).takeDeploymentStep(s,r);
 G.deploymentRollOff(s,r);for(const team of ['ash','iron'])if(bot(team).deploymentChoice(s)==='deploy-order')bot(team).takeDeploymentStep(s,r);
 for(let guard=0;guard<80&&!d.complete;guard++){for(const team of ['ash','iron'])if(bot(team).deploymentChoice(s)==='deploy'){bot(team).takeDeploymentStep(s,r);break;}}
 G.firstTurnRollOff(s,r);for(const team of ['ash','iron'])if(bot(team).deploymentChoice(s)==='first-turn')bot(team).takeDeploymentStep(s,r);G.begin(s,r);
}
function step(s,r){const active=bot(s.team),other=bot(s.team==='ash'?'iron':'ash');if(active.shouldAct(s))active.takeStep(s,r);else if(other.shouldAct(s))other.takeStep(s,r);else return false;G.skipEmptySteps(s,r);return true;}
function playOn(s,r,limit=4000){for(let i=0;i<limit&&s.stage!=='finished';i++)if(!step(s,r))break;return s;}
// Every value in the battle survives JSON: no Infinity, NaN, undefined in a list, Map or Set.
function plain(v,path='state'){if(typeof v==='number')assert.ok(Number.isFinite(v),`${path} is ${v}`);else if(Array.isArray(v))v.forEach((x,i)=>{assert.notEqual(x,undefined,`${path}[${i}] is undefined`);plain(x,`${path}[${i}]`);});else if(v&&typeof v==='object'){assert.equal(Object.getPrototypeOf(v),Object.prototype,`${path} is a ${v.constructor?.name}`);for(const [k,x]of Object.entries(v))if(x!==undefined)plain(x,`${path}.${k}`);}else assert.ok(['string','boolean','undefined'].includes(typeof v)||v===null,`${path} is a ${typeof v}`);}

await test('a battle saved mid-game and loaded again plays on identically with the same dice',()=>{
 const r=rng(4242),s=G.createGame('empire',{format:'battle-march',points:500,random:r});deploy(s,r);
 let checked=0;
 for(let i=0;i<3000&&s.stage!=='finished';i++){
  if(i%20===5){plain(s);const saved=G.saveGame(s,{aiMode:'ai'}),out=G.loadGame(saved);assert.equal(out.extra.aiMode,'ai');assert.equal(out.summary.round,s.round);
   if(checked<4&&s.stage!=='finished'){const a=playOn(structuredClone(s),rng(i+1),12),b=playOn(out.state,rng(i+1),12);assert.equal(JSON.stringify(b),JSON.stringify(a),`step ${i}: the loaded copy plays on as the original`);checked++;}}
  if(!step(s,r))break;
 }
 assert.ok(checked>=4);assert.equal(s.stage,'finished');plain(s);assert.deepEqual(G.loadGame(G.saveGame(s)).state.result,JSON.parse(JSON.stringify(s.result)));
});
await test('a classic battle saves and loads; what is not a save is refused with a reason',()=>{
 const s=G.createGame('empire');G.autoDeploy(s);G.begin(s,()=>0,{firstPlayer:'ash'});const out=G.loadGame(G.saveGame(s));assert.equal(out.state.stage,'strategy');assert.equal(out.summary.format,'Classic battle');
 assert.throws(()=>G.loadGame('not json'),/could not be read/);assert.throws(()=>G.loadGame('{"app":"Other","state":{}}'),/not a Project-TOW/);
 assert.throws(()=>G.loadGame(JSON.stringify({app:'Project-TOW',version:G.SAVE_VERSION+1,state:s})),/newer version/);assert.throws(()=>G.loadGame(JSON.stringify({app:'Project-TOW',version:1,state:{units:[]}})),/incomplete/);
});
