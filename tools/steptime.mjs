// Times every bot step in one bot-vs-bot Battle March game: node steptime.mjs <blueAI.mjs> [seed]
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const dir='C:/Users/MillYa/Desktop/Project-TOW/dist/';
const [blueFile,seedArg]=process.argv.slice(2);
const G=await import(pathToFileURL(dir+'game.mjs').href);
const RED=await import(pathToFileURL(dir+'zz-ai-base.mjs').href+'?red'),BLUE=await import(pathToFileURL(path.resolve(dir,blueFile)).href+'?blue');
RED.setSide('ash');BLUE.setSide('iron');const bot=t=>t==='ash'?RED:BLUE;
const rng=seed=>{let x=seed%2147483647||1;return ()=>{x=(x*16807)%2147483647;return (x-1)/2147483646;};};
const r=rng(Number(seedArg??3)),s=G.createGame('empire',{format:'battle-march',points:500,random:r}),d=s.deployOrder;
for(const t of ['ash','iron'])if(bot(t).deploymentChoice(s)==='zone')bot(t).takeDeploymentStep(s,r);G.deploymentRollOff(s,r);
for(const t of ['ash','iron'])if(bot(t).deploymentChoice(s)==='deploy-order')bot(t).takeDeploymentStep(s,r);
for(let g=0;g<80&&!d.complete;g++){for(const t of ['ash','iron'])if(bot(t).deploymentChoice(s)==='deploy'){bot(t).takeDeploymentStep(s,r);break;}}
G.firstTurnRollOff(s,r);for(const t of ['ash','iron'])if(bot(t).deploymentChoice(s)==='first-turn')bot(t).takeDeploymentStep(s,r);G.begin(s,r);
const times=[];
for(let step=0;step<4000&&s.stage!=='finished';step++){const a=bot(s.team),o=bot(s.team==='ash'?'iron':'ash'),who=a.shouldAct(s)?a:o.shouldAct(s)?o:null;if(!who)break;const t0=performance.now(),stage=s.stage+'/'+(s.movementStep??'');who.takeStep(s,r);const ms=performance.now()-t0;if(who===BLUE)times.push([ms,stage]);G.skipEmptySteps(s);}
times.sort((a,b)=>b[0]-a[0]);const total=times.reduce((n,t)=>n+t[0],0);
console.log(JSON.stringify({steps:times.length,totalMs:Math.round(total),slowest:times.slice(0,8).map(([m,st])=>[Math.round(m),st]),result:s.result?.totals}));
