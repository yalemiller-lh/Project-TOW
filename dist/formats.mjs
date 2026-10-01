// Game formats: battlefield, deployment zones, game length and scoring for each way to play.
// Battlefield coordinates are inches; model bases are converted from millimetres.
export const MM_PER_INCH=25.4;
export const rect=(x0,y0,x1,y1)=>[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];

// Battle March deployment maps, built from the measurements of the six official diagrams (supplied
// 1 October 2026). Boundaries sit at fixed distances from the centre lines, so the zones follow the
// battlefield: Pitched Battle zones are 7.5″ deep on 44″ × 30″ and 10.5″ deep on 48″ × 36″.
// Red (ash) takes the bottom zone, or the left one in Mountain Pass. Which corner or side each army
// takes on the asymmetric maps is a mirror choice the measurements leave open, and the triangular
// zones are read as running corner to corner.
const arc=(cx,cy,r,from,to,steps=24)=>Array.from({length:steps+1},(_,i)=>{const a=(from+(to-from)*i/steps)*Math.PI/180;return {x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)};});
// Headings armies deploy facing: 0 faces the top edge.
const UPRIGHT={ash:0,iron:180},SIDEWAYS={ash:90,iron:270};
export const DEPLOYMENT_MAPS=[
 {id:'pitched-battle',name:'Pitched Battle',roll:1,summary:'zones along the long edges; each boundary is 7.5″ from the centre line, leaving a 15″ gap.',
  zones:b=>{const d=b.height/2-7.5;return {ash:rect(0,b.height-d,b.width,b.height),iron:rect(0,0,b.width,d)};}},
 {id:'close-encounter',name:'Close Encounter',roll:2,summary:'opposite quarters, excluding a 15″-diameter circle centred on the battlefield.',
  zones:b=>{const cx=b.width/2,cy=b.height/2,r=7.5;return {ash:[{x:0,y:cy},...arc(cx,cy,r,180,90),{x:cx,y:b.height},{x:0,y:b.height}],iron:[{x:cx,y:0},{x:b.width,y:0},{x:b.width,y:cy},...arc(cx,cy,r,0,-90)]};}},
 {id:'opposed-flanks',name:'Opposed Flanks',roll:3,summary:'opposite triangles along the long edges; their diagonal boundaries leave an 18″ gap along each side edge.',
  zones:b=>{const leg=b.height-18;return {ash:[{x:0,y:b.height},{x:b.width,y:b.height},{x:b.width,y:b.height-leg}],iron:[{x:0,y:0},{x:b.width,y:0},{x:0,y:leg}]};}},
 {id:'meeting-engagement',name:'Meeting Engagement',roll:4,summary:'Pitched Battle’s 15″ central gap, each zone stopping 11″ short of one side edge, on opposite sides.',
  zones:b=>{const d=b.height/2-7.5;return {ash:rect(0,b.height-d,b.width-11,b.height),iron:rect(11,0,b.width,d)};}},
 {id:'mountain-pass',name:'Mountain Pass',roll:5,facing:SIDEWAYS,summary:'zones on the opposite short edges; each boundary is 11″ from the centre line, leaving a 22″ gap.',
  zones:b=>{const d=b.width/2-11;return {ash:rect(0,0,d,b.height),iron:rect(b.width-d,0,b.width,b.height)};}},
 {id:'outflank',name:'Outflank',roll:6,summary:'opposite triangles on the short edges, with a diagonal central strip 22″ wide along the top and bottom edges.',
  zones:b=>{const leg=b.width-22;return {ash:[{x:b.width-leg,y:b.height},{x:b.width,y:b.height},{x:b.width,y:0}],iron:[{x:0,y:0},{x:leg,y:0},{x:0,y:b.height}]};}},
].map(m=>({official:true,available:true,facing:UPRIGHT,...m}));
DEPLOYMENT_MAPS.push({id:'custom-long-edges',name:'Custom preset: long-edge zones (not an official map)',official:false,available:true,adjustable:true,facing:UPRIGHT,summary:'long-edge zones of the chosen depth.',
 zones:(board,depth)=>({ash:rect(0,board.height-depth,board.width,board.height),iron:rect(0,0,board.width,depth)})});
export function deploymentMap(id){const m=DEPLOYMENT_MAPS.find(m=>m.id===id);if(!m)throw Error(`Unknown deployment map "${id}".`);return m;}

export const FORMATS={
 classic:{
  id:'classic',name:'Classic battle',rulesVersion:'Old World prototype',
  boards:[{id:'72x48',width:72,height:48}],defaultBoard:'72x48',
  deployment:{map:'classic',depth:12,zones:board=>({ash:rect(0,board.height-12,board.width,board.height),iron:rect(0,0,board.width,12)})},
  rounds:null,scoring:'classic',
 },
 'battle-march':{
  id:'battle-march',name:'Battle March',rulesVersion:'Battle March brief, 30 September 2026',
  points:{min:400,max:750,step:50,default:500},
  // Displayed width x depth. The smaller board suits 400-600 points, the larger bigger games.
  boards:[{id:'44x30',width:44,height:30,maxPoints:600},{id:'48x36',width:48,height:36}],defaultBoard:'48x36',
  // Players deploy one unit at a time; the deployment roll-off winner chooses who starts.
  // The basic setup: Pitched Battle. The depth applies only to the custom preset.
  deployment:{map:'pitched-battle',depth:12,minDepth:6,maxDepth:14,order:'alternate'},
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
 const limit=points??fmt.points?.default??null,chosen=board?fmt.boards.find(b=>b.id===board):limit!==null?fmt.boards.find(b=>b.maxPoints&&limit<=b.maxPoints)??fmt.boards.find(b=>b.id===fmt.defaultBoard):fmt.boards.find(b=>b.id===fmt.defaultBoard);
 if(!chosen)throw Error(`Unknown battlefield "${board}" for ${fmt.name}.`);return {id:chosen.id,width:chosen.width,height:chosen.height};
}
export function deploymentZones(f,board,{map=null,depth=null}={}){
 const fmt=typeof f==='string'?format(f):f;
 if(fmt.id==='classic')return fmt.deployment.zones(board);
 const chosen=deploymentMap(map??fmt.deployment.map);
 if(!chosen.available)throw Error(`${chosen.name}: ${chosen.unavailable}`);
 if(!chosen.adjustable)return chosen.zones(board);
 const d=depth??fmt.deployment.depth;if(d<fmt.deployment.minDepth||d>fmt.deployment.maxDepth)throw Error(`Deployment depth must be ${fmt.deployment.minDepth}–${fmt.deployment.maxDepth}″.`);
 return chosen.zones(board,d);
}
// The heading each army deploys facing on this map.
export function deploymentFacing(f,{map=null}={}){const fmt=typeof f==='string'?format(f):f;return fmt.id==='classic'?{ash:0,iron:180}:deploymentMap(map??fmt.deployment.map).facing;}
