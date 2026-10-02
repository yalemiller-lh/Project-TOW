// Bot-vs-bot self-play on Battle March, paired seeds. Usage:
//   node selfplay.mjs <redAI.mjs> <blueAI.mjs> [games=20] [firstSeed=1] [map]
// Each AI module is a copy of dist/ai.mjs (imports ./game.mjs and ./battlemarch.mjs beside it).
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const dir='C:/Users/MillYa/Desktop/Project-TOW/dist/';
const [redFile,blueFile,gamesArg,seedArg,map]=process.argv.slice(2);
const G=await import(pathToFileURL(dir+'game.mjs').href);
const RED=await import(pathToFileURL(path.resolve(dir,redFile)).href+'?red'),BLUE=await import(pathToFileURL(path.resolve(dir,blueFile)).href+'?blue');
RED.setSide('ash');BLUE.setSide('iron');
const bot=team=>team==='ash'?RED:BLUE;
const rng=seed=>{let x=seed%2147483647||1;return ()=>{x=(x*16807)%2147483647;return (x-1)/2147483646;};};
function deploy(s,r){
 const d=s.deployOrder;
 for(const team of ['ash','iron'])if(bot(team).deploymentChoice(s)==='zone')bot(team).takeDeploymentStep(s,r);
 G.deploymentRollOff(s,r);
 for(const team of ['ash','iron'])if(bot(team).deploymentChoice(s)==='deploy-order')bot(team).takeDeploymentStep(s,r);
 for(let guard=0;guard<80&&!d.complete;guard++){let acted=false;for(const team of ['ash','iron'])if(bot(team).deploymentChoice(s)==='deploy'){bot(team).takeDeploymentStep(s,r);acted=true;break;}if(!acted)throw Error('deployment stalled');}
 G.firstTurnRollOff(s,r);for(const team of ['ash','iron'])if(bot(team).deploymentChoice(s)==='first-turn')bot(team).takeDeploymentStep(s,r);
 G.begin(s,r);
}
function play(seed){
 const r=rng(seed),s=G.createGame('empire',{format:'battle-march',points:500,random:r,...(map?{deployment:{map}}:{})});deploy(s,r);
 let idle=0;
 for(let step=0;step<4000&&s.stage!=='finished';step++){
  const active=bot(s.team),other=bot(s.team==='ash'?'iron':'ash');
  if(active.shouldAct(s))active.takeStep(s,r);else if(other.shouldAct(s))other.takeStep(s,r);
  else{idle++;if(idle>3)throw Error(`seed ${seed}: neither bot acts (round ${s.round}, ${s.team} ${s.stage} ${s.movementStep??''}) ${JSON.stringify(active.humanDecision(s))}`);continue;}
  idle=0;G.skipEmptySteps(s);
 }
 if(s.stage!=='finished')throw Error(`seed ${seed}: did not finish`);
 return {seed,ash:s.result.totals.ash,iron:s.result.totals.iron};
}
const games=Number(gamesArg??20),first=Number(seedArg??1),rows=[];
for(let i=0;i<games;i++){const seed=first+i*7919;try{rows.push(play(seed));}catch(e){rows.push({seed,error:e.message.slice(0,200)});}}
const ok=rows.filter(r=>!r.error),margin=ok.map(r=>r.iron-r.ash),mean=margin.reduce((a,b)=>a+b,0)/Math.max(1,margin.length);
console.log(JSON.stringify({red:redFile,blue:blueFile,games:ok.length,errors:rows.filter(r=>r.error),blueWins:margin.filter(m=>m>0).length,draws:margin.filter(m=>m===0).length,redWins:margin.filter(m=>m<0).length,meanMargin:+mean.toFixed(1),rows:ok.map(r=>[r.seed,r.ash,r.iron])}));
