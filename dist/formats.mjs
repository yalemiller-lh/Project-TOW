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
  // Players deploy one unit at a time; the deployment roll-off winner chooses who starts.
  deployment:{map:'custom-long-edges',depth:12,minDepth:6,maxDepth:14,order:'alternate'},
  objectives:'roll',
  rounds:5,scoring:'battle-march',terrainMaxWidth:12,eventTerrainMaxWidth:8,
  // Result classification for Battle March is not confirmed by the brief; the default reuses the
  // core rulebook's Victory Points rule and is shown as unconfirmed.
  resultPolicy:{id:'core-100',margin:100,crushingRatio:2,confirmed:false},
  optional:{raidAndBurn:false,baggageCarts:false,randomHappenings:false,magicItems:false,secretObjectives:false,narrative:false,event:false},
 },
};

// Optional Battle March rules. All start switched off; only those with complete rules can be
// switched on, and the rest say which source material is still needed.
export const OPTIONAL_RULES={
 raidAndBurn:{name:'Raid & Burn',available:true,summary:'A unit of Unit Strength 5+ that moves into base contact with a treasure trove in Remaining Moves may start destroying it. It cannot shoot and may cast only Combat or Self spells. At its next Start of Turn it burns the trove for 30 VP if still in contact, Unit Strength 5+, not engaged and not fleeing.'},
 baggageCarts:{name:'Baggage Carts',available:false,reason:'the cart profile, movement and scoring rules have not been supplied'},
 randomHappenings:{name:'Random Happenings',available:false,reason:'the Disruptive Weather, Wilderness Terrain and Chaos of War tables have not been supplied'},
 magicItems:{name:'Battle March magic items',available:false,reason:'the item costs, restrictions and effects have not been supplied'},
 secretObjectives:{name:'Secret objectives',available:false,reason:'the secret objective cards and reveal procedure have not been supplied'},
 narrative:{name:'Narrative scenarios',available:false,reason:'the scenario rules have not been supplied'},
 event:{name:'Event / tournament rules',available:false,reason:'the event pack has not been supplied'},
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
