// Game formats: battlefield, deployment zones, game length and scoring for each way to play.
// Battlefield coordinates are inches; model bases are converted from millimetres.
export const MM_PER_INCH=25.4;
export const rect=(x0,y0,x1,y1)=>[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];

// Red (ash) always deploys along the bottom edge and the opponent (iron) along the top.
export const DEPLOYMENT_MAPS=[
 ...['Pitched Battle','Close Encounter','Opposed Flanks','Meeting Engagement','Mountain Pass','Outflank'].map((name,i)=>({
  id:name.toLowerCase().replace(/ /g,'-'),name,roll:i+1,official:true,available:false,
  unavailable:'The official diagram geometry has not been supplied yet, so this map cannot be used.'})),
 {id:'custom-long-edges',name:'Custom preset: long-edge zones (not an official map)',official:false,available:true,adjustable:true,
  zones:(board,depth)=>({ash:rect(0,board.height-depth,board.width,board.height),iron:rect(0,0,board.width,depth)})},
];

export const FORMATS={
 classic:{
  id:'classic',name:'Classic battle',rulesVersion:'Old World prototype',
  boards:[{id:'72x48',width:72,height:48}],defaultBoard:'72x48',
  deployment:{map:'classic',depth:12,zones:board=>({ash:rect(0,board.height-12,board.width,board.height),iron:rect(0,0,board.width,12)})},
  rounds:null,scoring:'classic',
 },
 'battle-march':{
  id:'battle-march',name:'Battle March',rulesVersion:'Battle March brief, 30 September 2026',
  points:{min:400,max:750,step:50,default:750},
  // Displayed width x depth. The smaller board suits 400-600 points, the larger bigger games.
  boards:[{id:'44x30',width:44,height:30,maxPoints:600},{id:'48x36',width:48,height:36}],defaultBoard:'48x36',
  deployment:{map:'custom-long-edges',depth:12,minDepth:6,maxDepth:14},
  rounds:5,scoring:'battle-march',terrainMaxWidth:12,eventTerrainMaxWidth:8,
  // Result classification for Battle March is not confirmed by the brief; the default reuses the
  // core rulebook's Victory Points rule and is shown as unconfirmed.
  resultPolicy:{id:'core-100',margin:100,crushingRatio:2,confirmed:false},
  optional:{raidAndBurn:false,baggageCarts:false,randomHappenings:false,magicItems:false,secretObjectives:false,narrative:false,event:false},
 },
};

export function format(id='classic'){const f=FORMATS[id];if(!f)throw Error(`Unknown game format "${id}".`);return f;}
export function boardFor(f,{board=null,points=null}={}){
 const fmt=typeof f==='string'?format(f):f;
 const chosen=board?fmt.boards.find(b=>b.id===board):points!==null?fmt.boards.find(b=>b.maxPoints&&points<=b.maxPoints)??fmt.boards.find(b=>b.id===fmt.defaultBoard):fmt.boards.find(b=>b.id===fmt.defaultBoard);
 if(!chosen)throw Error(`Unknown battlefield "${board}" for ${fmt.name}.`);return {id:chosen.id,width:chosen.width,height:chosen.height};
}
export function deploymentZones(f,board,{map=null,depth=null}={}){
 const fmt=typeof f==='string'?format(f):f;
 if(fmt.id==='classic')return fmt.deployment.zones(board);
 const chosen=DEPLOYMENT_MAPS.find(m=>m.id===(map??fmt.deployment.map));
 if(!chosen)throw Error(`Unknown deployment map "${map}".`);
 if(!chosen.available)throw Error(`${chosen.name}: ${chosen.unavailable}`);
 const d=depth??fmt.deployment.depth;if(d<fmt.deployment.minDepth||d>fmt.deployment.maxDepth)throw Error(`Deployment depth must be ${fmt.deployment.minDepth}–${fmt.deployment.maxDepth}″.`);
 return chosen.zones(board,d);
}
