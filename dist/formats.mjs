// Game formats: battlefield, deployment zones, game length and scoring for each way to play.
// Battlefield coordinates are inches; model bases are converted from millimetres.
export const MM_PER_INCH=25.4;
export const rect=(x0,y0,x1,y1)=>[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];

// Battle March deployment maps. The published coordinates are for a 44″ × 30″ battlefield (origin
// top-left, x right, y down), and every zone below reproduces them exactly there. Zone A and zone
// B are labels only: the players choose which zone each takes. On 48″ × 36″ the same distances from
// the centre lines are used — an agreed adaptation, not a published map. Mirroring reflects an
// asymmetric map left to right, which changes its geometry (Close Encounter's quarters, the
// triangles' slopes, which end of Meeting Engagement is cut off).
const arc=(cx,cy,r,from,to,steps=24)=>Array.from({length:steps+1},(_,i)=>{const a=(from+(to-from)*i/steps)*Math.PI/180;return {x:Math.round((cx+r*Math.cos(a))*1e9)/1e9,y:Math.round((cy+r*Math.sin(a))*1e9)/1e9};});
// The heading each zone deploys facing by default (0 faces the top edge): toward the other zone.
// Players can still turn every unit as they deploy it.
const ACROSS={A:180,B:0};
export const DEFAULT_SIDES={ash:'B',iron:'A'};
export const DEPLOYMENT_MAPS=[
 {id:'pitched-battle',name:'Pitched Battle',roll:1,symmetric:true,zoneNames:{A:'the top long edge',B:'the bottom long edge'},summary:'zones along the long edges, 7.5″ deep on 44″ × 30″, leaving a 15″ central strip.',
  zones:b=>{const d=b.height/2-7.5;return {A:rect(0,0,b.width,d),B:rect(0,b.height-d,b.width,b.height)};}},
 {id:'close-encounter',name:'Close Encounter',roll:2,facing:{A:135,B:315},zoneNames:{A:'the top-left quarter',B:'the bottom-right quarter'},mirrorNames:{A:'the top-right quarter',B:'the bottom-left quarter'},summary:'opposite quarters, minus a central circle 15″ across (7.5″ radius) that no unit may enter.',
  zones:b=>{const cx=b.width/2,cy=b.height/2,r=7.5;return {A:[{x:0,y:0},{x:cx,y:0},...arc(cx,cy,r,270,180),{x:0,y:cy}],B:[{x:b.width,y:b.height},{x:cx,y:b.height},...arc(cx,cy,r,90,0),{x:b.width,y:cy}]};}},
 {id:'opposed-flanks',name:'Opposed Flanks',roll:3,zoneNames:{A:'the top edge, deepest on the left',B:'the bottom edge, deepest on the right'},mirrorNames:{A:'the top edge, deepest on the right',B:'the bottom edge, deepest on the left'},summary:'opposite triangles along the long edges, their diagonal boundaries 18″ apart measured vertically.',
  zones:b=>{const leg=b.height-18;return {A:[{x:0,y:0},{x:b.width,y:0},{x:0,y:leg}],B:[{x:0,y:b.height},{x:b.width,y:b.height},{x:b.width,y:b.height-leg}]};}},
 {id:'meeting-engagement',name:'Meeting Engagement',roll:4,zoneNames:{A:'the top edge, stopping 11″ short of the right edge',B:'the bottom edge, starting 11″ from the left edge'},mirrorNames:{A:'the top edge, starting 11″ from the left edge',B:'the bottom edge, stopping 11″ short of the right edge'},summary:'Pitched Battle’s 15″ central strip, each zone stopping 11″ short of opposite side edges. No reserve rule is added.',
  zones:b=>{const d=b.height/2-7.5;return {A:rect(0,0,b.width-11,d),B:rect(11,b.height-d,b.width,b.height)};}},
 {id:'mountain-pass',name:'Mountain Pass',roll:5,symmetric:true,facing:{A:90,B:270},zoneNames:{A:'the left short edge',B:'the right short edge'},summary:'zones on the opposite short edges, 11″ either side of the centre line (a 22″ central strip). The table edges stay open.',
  zones:b=>{const d=b.width/2-11;return {A:rect(0,0,d,b.height),B:rect(b.width-d,0,b.width,b.height)};}},
 {id:'outflank',name:'Outflank',roll:6,facing:{A:90,B:270},zoneNames:{A:'the top-left triangle (left short edge)',B:'the bottom-right triangle (right short edge)'},mirrorNames:{A:'the top-right triangle (right short edge)',B:'the bottom-left triangle (left short edge)'},summary:'opposite triangles on the short edges, their diagonal boundaries 22″ apart measured horizontally.',
  zones:b=>{const leg=b.width-22;return {A:[{x:0,y:0},{x:leg,y:0},{x:0,y:b.height}],B:[{x:b.width,y:0},{x:b.width,y:b.height},{x:22,y:b.height}]};}},
].map(m=>({official:true,available:true,facing:ACROSS,...m}));
DEPLOYMENT_MAPS.push({id:'custom-long-edges',name:'Custom preset: long-edge zones (not an official map)',official:false,available:true,adjustable:true,symmetric:true,facing:ACROSS,zoneNames:{A:'the top long edge',B:'the bottom long edge'},summary:'long-edge zones of the chosen depth.',
 zones:(board,depth)=>({A:rect(0,0,board.width,depth),B:rect(0,board.height-depth,board.width,board.height)})});
// The published maps are exact on 44″ × 30″ only.
export const exactMapBoard=b=>b?.width===44&&b?.height===30;
export function zoneName(m,zone,mirrored=false){return (mirrored&&!m.symmetric&&m.mirrorNames?m.mirrorNames:m.zoneNames)?.[zone]??`zone ${zone}`;}
const flip=(poly,b)=>poly.map(p=>({x:b.width-p.x,y:p.y}));
// Zones A and B of a map on this battlefield, mirrored if asked.
export function mapZones(m,board,{depth=null,mirrored=false}={}){const z=m.adjustable?m.zones(board,depth):m.zones(board);return mirrored&&!m.symmetric?{A:flip(z.A,board),B:flip(z.B,board)}:z;}
export function deploymentMap(id){const m=DEPLOYMENT_MAPS.find(m=>m.id===id);if(!m)throw Error(`Unknown deployment map "${id}".`);return m;}

// ---- Terrain (the Battle March terrain brief of 1 October 2026) ----
// A piece's movement class (open, difficult, dangerous, impassable) and its effect on line of sight
// are separate: 'wood' blocks sight across it between two models outside it and gives partial cover
// to a unit mostly inside; 'hill' blocks sight across it between models off it and lifts those
// wholly on it; 'blocks' is opaque (buildings, rocks, high walls); 'obscures' gives cover only (low
// walls and hedges). Sizes are inches; a line is a linear obstacle of that length. The starter
// collection is the brief's suggested digital set, not an official layout.
export const TERRAIN_PIECES={
 hill:{name:'Gentle hill',kind:'hill',shape:{type:'ellipse',w:8,h:6},movement:'open',sight:'hill'},
 steepHill:{name:'Steep, rocky hill (difficult)',kind:'hill',shape:{type:'ellipse',w:8,h:6},movement:'difficult',sight:'hill'},
 wood:{name:'Woodland (difficult)',kind:'wood',shape:{type:'ellipse',w:7,h:5},movement:'difficult',sight:'wood'},
 darkWood:{name:'Dark woodland (dangerous)',kind:'wood',shape:{type:'ellipse',w:7,h:5},movement:'dangerous',sight:'wood'},
 wall:{name:'Low wall',kind:'lowWall',shape:{type:'line',length:6},movement:'difficult',sight:'obscures',low:true},
 hedge:{name:'Hedge',kind:'lowWall',shape:{type:'line',length:6},movement:'difficult',sight:'obscures',low:true},
 highWall:{name:'High wall',kind:'highWall',shape:{type:'line',length:6},movement:'impassable',sight:'blocks',high:true},
 building:{name:'Building (impassable)',kind:'building',shape:{type:'rect',w:5,h:4},movement:'impassable',sight:'blocks'},
 rocks:{name:'Rock formation (impassable)',kind:'rocks',shape:{type:'rect',w:5,h:4},movement:'impassable',sight:'blocks'},
};
export const STARTER_COLLECTION=['hill','wood','wall','building'];
// How the terrain is set up. 'free' is an agreed or organiser layout: no placement restrictions.
export const TERRAIN_METHODS={
 alternate:{name:'Normal placement: roll off, then alternate one feature each',official:true},
 scatter:{name:'Scattered: the roll-off winner places all, the loser scatters D3',official:true},
 free:{name:'Agreed layout: place freely (organiser or custom, not the rulebook method)',official:false},
 none:{name:'No terrain',official:true},
};
// One feature per 12″ of the longest edge, rounding up. A piece counts by its widest extent:
// under 2″ is a decoration (0), up to 8″ one feature, up to 12″ two, beyond three (avoid in Battle
// March). A piece exactly 8″ or 12″ counts as the smaller: an agreed reading of the boundary.
export const terrainAllowance=board=>Math.ceil(Math.max(board.width,board.height)/12);
export const terrainSizeClass=w=>w<2?0:w<=8?1:w<=12?2:3;
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
  // The opponent of the player who selected the map chooses a zone; the roll-off winner deploys the
  // first unit; the armies then alternate (a regiment a turn, all war machines together, characters last).
  // The basic setup: Pitched Battle. The depth applies only to the custom preset.
  deployment:{map:'pitched-battle',depth:12,minDepth:6,maxDepth:14,order:'alternate',rollOff:'winner-deploys'},
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
// The zones each army deploys in: the map’s zones A and B, mirrored if asked, given to the
// armies by sides (Red takes B, the bottom or right, unless the zone choice says otherwise).
export function deploymentZones(f,board,{map=null,depth=null,mirrored=false,sides=DEFAULT_SIDES}={}){
 const fmt=typeof f==='string'?format(f):f;
 if(fmt.id==='classic')return fmt.deployment.zones(board);
 const chosen=deploymentMap(map??fmt.deployment.map);
 if(!chosen.available)throw Error(`${chosen.name}: ${chosen.unavailable}`);
 let d=null;if(chosen.adjustable){d=depth??fmt.deployment.depth;if(d<fmt.deployment.minDepth||d>fmt.deployment.maxDepth)throw Error(`Deployment depth must be ${fmt.deployment.minDepth}–${fmt.deployment.maxDepth}″.`);}
 const z=mapZones(chosen,board,{depth:d,mirrored});return {ash:z[sides.ash],iron:z[sides.iron]};
}
// The heading each army deploys facing on this map (reflected when the map is mirrored).
export function deploymentFacing(f,{map=null,mirrored=false,sides=DEFAULT_SIDES}={}){const fmt=typeof f==='string'?format(f):f;if(fmt.id==='classic')return {ash:0,iron:180};const m=deploymentMap(map??fmt.deployment.map),face=zone=>{const h=m.facing[zone];return mirrored&&!m.symmetric?(360-h)%360:h;};return {ash:face(sides.ash),iron:face(sides.iron)};}
