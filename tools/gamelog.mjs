// One bot-vs-bot Battle March game with every bot message: node gamelog.mjs <redAI> <blueAI> [seed]
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const dir='C:/Users/MillYa/Desktop/Project-TOW/dist/';
const [redFile,blueFile,seedArg]=process.argv.slice(2);
const G=await import(pathToFileURL(dir+'game.mjs').href),BM=await import(pathToFileURL(dir+'battlemarch.mjs').href);
const RED=await import(pathToFileURL(path.resolve(dir,redFile)).href+'?red'),BLUE=await import(pathToFileURL(path.resolve(dir,blueFile)).href+'?blue');
RED.setSide('ash');BLUE.setSide('iron');const bot=t=>t==='ash'?RED:BLUE;
const rng=seed=>{let x=seed%2147483647||1;return ()=>{x=(x*16807)%2147483647;return (x-1)/2147483646;};};
const r=rng(Number(seedArg??3)),s=G.createGame('empire',{format:'battle-march',points:500,random:r}),d=s.deployOrder;
for(const t of ['ash','iron'])if(bot(t).deploymentChoice(s)==='zone')bot(t).takeDeploymentStep(s,r);G.deploymentRollOff(s,r);
for(const t of ['ash','iron'])if(bot(t).deploymentChoice(s)==='deploy-order')bot(t).takeDeploymentStep(s,r);
for(let g=0;g<80&&!d.complete;g++){for(const t of ['ash','iron'])if(bot(t).deploymentChoice(s)==='deploy'){bot(t).takeDeploymentStep(s,r);break;}}
G.firstTurnRollOff(s,r);for(const t of ['ash','iron'])if(bot(t).deploymentChoice(s)==='first-turn')bot(t).takeDeploymentStep(s,r);G.begin(s,r);
console.log('objectives',s.objectives.kind,s.objectives.items.map(o=>`${o.id}@${o.x.toFixed(0)},${o.y.toFixed(0)}`).join(' '),'first',s.team);
let last='';
for(let step=0;step<4000&&s.stage!=='finished';step++){const a=bot(s.team),o=bot(s.team==='ash'?'iron':'ash'),who=a.shouldAct(s)?a:o.shouldAct(s)?o:null;if(!who)break;const head=`R${s.round} ${s.team} ${s.stage}`;if(head!==last){console.log('--',head);last=head;}const out=who.takeStep(s,r);console.log(`  ${who===BLUE?'B':'R'}: ${out.message}${out.judged?' '+JSON.stringify(out.judged):''}`);G.skipEmptySteps(s);}
const sc=BM.score?.(s);console.log('RESULT',JSON.stringify(s.result?.totals));
for(const u of G.combatants(s))console.log(u.id,u.team,u.name,'alive',G.aliveCount(u),u.destroyed?'DESTROYED':'',u.fleeing?'fleeing':'');
