export const BOARD={width:72,height:48,zone:12};
export const ROCKET_PROFILES={demolition:{name:'Demolition Rockets',template:3,strength:3,centreStrength:6,ap:0,centreAp:3},incendiary:{name:'Infernal Incendiaries',template:5,strength:3,centreStrength:3,ap:0,centreAp:0}};
export const ROCKET_BASE={w:50/25.4,h:75/25.4};
export function rocketFootprint(x,y){return [{x:x-ROCKET_BASE.w/2,y:y-ROCKET_BASE.h/2},{x:x+ROCKET_BASE.w/2,y:y-ROCKET_BASE.h/2},{x:x+ROCKET_BASE.w/2,y:y+ROCKET_BASE.h/2},{x:x-ROCKET_BASE.w/2,y:y+ROCKET_BASE.h/2}];}
export const PROFILE={M:3,WS:4,BS:3,S:3,T:4,W:1,I:2,A:1,Ld:9,save:4};
export const SIZE={w:125/25.4,h:100/25.4};
export const FACTIONS={chaos:{name:'Chaos Dwarf Warriors',army:'Chaos Dwarfs',color:'#b63229',bright:'#ff3f39',base:25,equipment:'Hand weapons · heavy armour · shields',profile:PROFILE,heavy:true,shield:true,shieldwall:true,resolute:true},orc:{name:'Orc Mob',army:'Orc & Goblin Tribes',color:'#418248',bright:'#54ef53',base:30,equipment:'Hand weapons · light armour',profile:{M:4,WS:3,BS:3,S:3,T:4,W:1,I:3,A:1,Ld:6,save:6},choppas:true,furious:true,warband:true,impetuous:true},empire:{name:'State Troops',army:'Empire of Man',color:'#286a9a',bright:'#32aaff',base:25,equipment:'Hand weapons · light armour · shields',profile:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7,save:5},shield:true}};
export const MISSILE={chaos:{name:'Blunderbuss Decimators',equipment:'Hand weapons · blunderbusses · heavy armour',profile:{M:3,WS:3,BS:3,S:3,T:4,W:1,I:2,A:1,Ld:9,save:5},weapon:{name:'Blunderbuss',range:12,strength:3,ap:1,multiple:'D3',volley:true,ignoreLong:true,ignoreStand:true}},empire:{name:'State Missile Troops',equipment:'Hand weapons · crossbows',profile:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7,save:7},weapon:{name:'Crossbow',range:30,strength:4,ap:0}},orc:{name:'Orc Mob · Warbows',equipment:'Hand weapons · warbows · light armour',profile:{M:4,WS:3,BS:3,S:3,T:4,W:1,I:3,A:1,Ld:6,save:6},weapon:{name:'Warbow',range:24,strength:3,ap:0}}};
export const profile=u=>u?.role==='missile'?MISSILE[u.faction].profile:FACTIONS[u?.faction??'chaos'].profile;
export const equipment=u=>u?.role==='missile'?MISSILE[u.faction].equipment:FACTIONS[u?.faction??'chaos'].equipment;
export const missileWeapon=u=>u?.role==='missile'?MISSILE[u.faction].weapon:null;
export const size=u=>{const b=FACTIONS[u?.faction??'chaos'].base/25.4;return {w:5*b,h:4*b};};
export const baseSize=u=>FACTIONS[u?.faction??'chaos'].base;
export const COMMAND_SLOTS={1:'M',2:'S',3:'C'};
export function commandAlive(u,role){const index=Number(Object.keys(COMMAND_SLOTS).find(i=>COMMAND_SLOTS[i]===role));return aliveCount(u)>0&&!(u.deadModels??[]).includes(index);}
export function championProfile(u){return {...profile(u),A:u.role==='missile'&&u.faction==='empire'?1:2,BS:u.role==='missile'&&u.faction==='empire'?4:profile(u).BS,Ld:u.faction==='orc'?7:profile(u).Ld};}
export function setOpponent(s,faction){if(s.stage!=='deployment')throw Error('Choose the opposing army before battle starts.');if(!['orc','empire','chaos'].includes(faction))throw Error('Unknown army.');for(const u of s.units.filter(u=>u.team==='iron')){u.faction=faction;u.name=u.role==='missile'?MISSILE[faction].name:FACTIONS[faction].name;u.x=null;u.y=null;}return faction;}
export const PHASES=['strategy','movement','shooting','combat'];
export const armyName=(team,s)=>team==='ash'?'Chaos Dwarfs · Red':`${FACTIONS[s?.units.find(u=>u.team==='iron')?.faction??'chaos'].army} · ${s?.units.find(u=>u.team==='iron')?.faction==='orc'?'Green':'Blue'}`;
const EPS=1e-8,rad=d=>d*Math.PI/180;
export function createGame(opponent='chaos'){if(!FACTIONS[opponent])throw Error('Unknown army.');return {stage:'deployment',team:'ash',round:1,selected:'A1',rocket:{id:'A5',name:'Deathshrieker Rocket Launcher',x:null,y:null,heading:0,wounds:3,crew:3,shot:false,disabledUntil:0,lastShot:null},units:Array.from({length:8},(_,i)=>{const faction=i<4?'chaos':opponent,role=i%4===3?'missile':'infantry';return {id:(i<4?'A':'I')+(i%4+1),team:i<4?'ash':'iron',faction,role,name:role==='missile'?MISSILE[faction].name:FACTIONS[faction].name,x:null,y:null,heading:i<4?0:180,moved:false,shot:false,spent:0,movementMode:null,marchRequired:null,marchTest:null,engaged:null,charge:null,impetuousTest:null,combatResolved:false,fleeing:false,rallyAttempted:false,rallied:false,shieldwallUsed:false,deadModels:[]};}),history:[]};}
export function getUnit(s,id=s.selected){return s.units.find(u=>u.id===id);}
export function heading(u){return u.heading??(u.team==='ash'?0:180);}
export function normalize(a){return ((a%360)+360)%360;}
export function localPoint(u,x,y){const a=rad(heading(u)),c=Math.cos(a),s=Math.sin(a);return {x:u.x+x*c-y*s,y:u.y+x*s+y*c};}
export function corners(u){const {w,h}=size(u);return [[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([x,y])=>localPoint(u,x,y));}
export function rectangle(u){const p=corners(u);return {left:Math.min(...p.map(v=>v.x)),right:Math.max(...p.map(v=>v.x)),top:Math.min(...p.map(v=>v.y)),bottom:Math.max(...p.map(v=>v.y))};}
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function pointSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;const t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
function intersects(a,b,c,d){const x=cross(a,b,c),y=cross(a,b,d),z=cross(c,d,a),w=cross(c,d,b);if(((x>EPS&&y< -EPS)||(x< -EPS&&y>EPS))&&((z>EPS&&w< -EPS)||(z< -EPS&&w>EPS)))return true;return Math.min(pointSegment(a,c,d),pointSegment(b,c,d),pointSegment(c,a,b),pointSegment(d,a,b))<EPS;}
function inside(p,poly){if(poly.length<3)return false;let sign=0;for(let i=0;i<poly.length;i++){const c=cross(poly[i],poly[(i+1)%poly.length],p);if(Math.abs(c)<EPS)continue;const n=Math.sign(c);if(sign&&sign!==n)return false;sign=n;}return true;}
export function polygonGap(a,b){if(inside(a[0],b)||inside(b[0],a))return 0;let best=Infinity;for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){const p=a[i],q=a[(i+1)%a.length],r=b[j],s=b[(j+1)%b.length];if(intersects(p,q,r,s))return 0;best=Math.min(best,pointSegment(p,r,s),pointSegment(q,r,s),pointSegment(r,p,q),pointSegment(s,p,q));}return best;}
function hull(points){const p=[...points].sort((a,b)=>a.x-b.x||a.y-b.y);const half=items=>{const out=[];for(const v of items){while(out.length>1&&cross(out.at(-2),out.at(-1),v)<=EPS)out.pop();out.push(v);}return out;};return [...half(p).slice(0,-1),...half([...p].reverse()).slice(0,-1)];}
export function gap(a,b){return polygonGap(corners(a),corners(b));}
function offBoard(u){const r=rectangle(u);return r.left< -EPS||r.right>BOARD.width+EPS||r.top< -EPS||r.bottom>BOARD.height+EPS;}
function destroyUnit(u){Object.assign(u,{x:null,y:null,destroyed:true,fleeing:false,engaged:null});}
export function checkPosition(state,unit,x,y,deployment=false){
  if(!Number.isFinite(x)||!Number.isFinite(y))return 'Enter valid coordinates.';
  const candidate={...unit,x,y},r=rectangle(candidate);
  if(offBoard(candidate))return 'The whole regiment must stay on the battlefield.';
  if(deployment&&((unit.team==='ash'&&r.top<36-EPS)||(unit.team==='iron'&&r.bottom>12+EPS)))return 'Keep the entire block inside its own 12″ deployment zone.';
  if(state.units.some(u=>u.id!==unit.id&&u.x!==null&&gap(candidate,u)<1-EPS))return 'Keep at least 1″ between regiments.';
  if(state.rocket?.x!==null&&polygonGap(corners(candidate),rocketFootprint(state.rocket.x,state.rocket.y))<1-EPS)return 'Keep at least 1″ between regiments and the Deathshrieker.';
  return null;
}
export function place(s,id,x,y){if(s.stage!=='deployment')throw Error('Deployment is finished.');const u=getUnit(s,id);if(!u)throw Error('Unknown regiment.');const error=checkPosition(s,u,x,y,true);if(error)throw Error(error);Object.assign(u,{x,y});return u;}
export function placeRocket(s,x,y){if(s.stage!=='deployment')throw Error('Deploy the launcher before battle.');if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Enter valid coordinates.');const r={left:x-ROCKET_BASE.w/2,right:x+ROCKET_BASE.w/2,top:y-ROCKET_BASE.h/2,bottom:y+ROCKET_BASE.h/2};if(r.left<0||r.right>BOARD.width||r.top<36||r.bottom>BOARD.height)throw Error('Keep the whole launcher in the red deployment zone.');const footprint=rocketFootprint(x,y);if(s.units.some(u=>u.x!==null&&polygonGap(corners(u),footprint)<1-EPS))throw Error('Keep the launcher at least 1″ from regiments.');Object.assign(s.rocket,{x,y});return s.rocket;}
export function autoDeploy(s){if(s.stage!=='deployment')throw Error('Deployment is finished.');s.units.forEach((u,i)=>Object.assign(u,{x:[18,36,54,64][i%4],y:u.team==='ash'?42:6}));placeRocket(s,8,42);}
export function begin(s){if(s.stage!=='deployment')throw Error('The battle already started.');if(s.units.some(u=>u.x===null)||s.rocket.x===null)throw Error('Deploy all eight regiments and the Deathshrieker first.');s.stage='strategy';s.selected='A1';s.team='ash';}
export function canAct(s,u){return s.stage==='movement'&&u?.team===s.team&&aliveCount(u)>0&&!u.moved&&!u.engaged&&!u.charge&&!u.fleeing&&u.x!==null;}
export function phaseComplete(s,u){if(s.stage==='deployment'||u.team!==s.team)return false;if(aliveCount(u)===0)return true;if(s.stage==='movement')return u.moved||!!u.engaged;if(s.stage==='shooting')return u.role!=='missile'||u.shot||!!u.engaged||u.fleeing;return true;}
export function needsMarchTest(s,u){if(u.marchRequired!==null&&u.marchRequired!==undefined)return u.marchRequired;return s.units.some(v=>v.team!==u.team&&v.x!==null&&gap(u,v)<=8+EPS);}
export function marchTest(s,id,dice){const u=getUnit(s,id);if(!canAct(s,u))throw Error('Select an unmoved regiment from the active army.');if(!needsMarchTest(s,u))throw Error('No nearby enemy. This march needs no test.');if(u.marchTest!==null)throw Error('This regiment already took its march test this turn.');if(!Array.isArray(dice)||dice.length!==2||dice.some(d=>!Number.isInteger(d)||d<1||d>6))throw Error('A march test requires two D6.');enterRemaining(s);u.marchTest=dice.reduce((a,b)=>a+b,0)<=leadership(u,'march');return u.marchTest;}
export function wheelCost(angle,u){return 2*size(u).w*Math.sin(rad(Math.abs(angle))/2);}
export function maxWheel(mode='advance',u){return 2*Math.asin((mode==='march'?2*profile(u).M:profile(u).M)/(2*size(u).w))*180/Math.PI;}
export function wheelPose(u,angle){const {w,h}=size(u),pivot=localPoint(u,(angle<0?-1:1)*w/2,-h/2),a=rad(angle),x=u.x-pivot.x,y=u.y-pivot.y;return {...u,x:pivot.x+x*Math.cos(a)-y*Math.sin(a),y:pivot.y+x*Math.sin(a)+y*Math.cos(a),heading:normalize(heading(u)+angle)};}
export function forwardPose(u,distance){const a=rad(heading(u));return {...u,x:u.x+Math.sin(a)*distance,y:u.y-Math.cos(a)*distance};}
export function planMove(u,order){const kind=order.kind??'advance',mode=order.mode??'advance',angle=Number(order.angle??0),distance=Number(order.distance??0),side=order.side??1;let after=u,cost=0,pivot=null;
  if(kind==='wheel'){after=wheelPose(u,angle);cost=wheelCost(angle,u);pivot=localPoint(u,(angle<0?-1:1)*size(u).w/2,-size(u).h/2);}
  if(kind==='pivot'){after={...u,heading:normalize(heading(u)+angle)};cost=profile(u).M;pivot={x:u.x,y:u.y};}
  const end=kind==='pivot'?after:kind==='back'?forwardPose(after,-distance):kind==='side'?{...after,...localPoint(after,side*distance,0)}:forwardPose(after,distance);
  return {start:{...u},afterWheel:after,end,cost:cost+(kind==='pivot'?0:['back','side'].includes(kind)?2*distance:distance),wheelCost:kind==='wheel'?cost:0,allowance:mode==='march'?2*profile(u).M:profile(u).M,pivot,kind,mode,angle,distance,side};
}
function forwardError(s,u,start,end){const swept=hull([...corners(start),...corners(end)]);for(const v of s.units){if(v.id===u.id||v.x===null)continue;if(polygonGap(swept,corners(v))<1-EPS)return 'Another regiment blocks this path. Shorten the move.';}if(s.rocket?.x!==null&&polygonGap(swept,rocketFootprint(s.rocket.x,s.rocket.y))<1-EPS)return 'The Deathshrieker blocks this path. Shorten the move.';return null;}
export function orderError(s,u,order){
  if(!canAct(s,u))return 'Select an unmoved regiment from the active army.';
  const {kind='advance',mode='advance',angle=0,distance=0}=order;
  if(!['advance','back','side','wheel','pivot'].includes(kind)||!['advance','march'].includes(mode))return 'Choose a valid movement order.';
  if(!Number.isFinite(angle)||!Number.isFinite(distance)||distance<0)return 'Enter a valid angle and distance.';
  if(kind==='advance'&&(distance<=0||angle!==0))return 'Choose a forward distance.';
  if((kind==='back'||kind==='side')&&(distance<=0||angle!==0))return 'Choose a sideways or backward distance.';
  if(kind==='side'&&![-1,1].includes(order.side))return 'Choose left or right for a sideways move.';
  if(kind==='wheel'&&(angle===0||Math.abs(angle)>90))return 'Choose a wheel angle between −90° and 90°.';
  if(kind==='pivot'&&(angle===0||Math.abs(angle)>180||distance!==0||mode==='march'))return 'A reform pivots up to 180°, uses the whole move, and cannot march.';
  const plan=planMove(u,order);
  if(u.movementMode&&u.movementMode!==mode)return 'Movement mode is locked after the first step. Undo all steps to change it.';
  if(kind==='pivot'&&(u.spent??0)>EPS)return 'A reform requires the whole unused movement allowance.';
  if((u.spent??0)+plan.cost>plan.allowance+EPS)return 'This order exceeds the movement allowance.';
  if(mode==='march'&&needsMarchTest(s,u)&&u.marchTest!==true)return u.marchTest===false?`March test failed. This unit can still advance up to ${profile(u).M}″.`:'Take the march Leadership test first.';
  const error=checkPosition(s,plan.end,plan.end.x,plan.end.y);if(error)return error;
  if(kind==='pivot')return null;
  if(kind==='wheel'){
    // Sweep the leading edge, not the rear ranks (FAQ 1.5.3). The small additional
    // clearance covers the sagitta between 0.25-degree subdivisions of the curve.
    const steps=Math.ceil(Math.abs(angle)/.25);let previous=corners(u).slice(0,2);
    for(let i=1;i<=steps;i++){
      const pose=wheelPose(u,angle*i/steps);if(offBoard(pose))return 'The wheel would leave the battlefield.';
      const front=corners(pose).slice(0,2),sweep=hull([...previous,...front]);
      for(const v of s.units){if(v.id===u.id||v.x===null)continue;if(polygonGap(sweep,corners(v))<1.0001-EPS)return 'Another regiment blocks the leading edge of this wheel.';}
      previous=front;
    }
  }
  if(distance>EPS)return forwardError(s,u,plan.afterWheel,plan.end);
  return null;
}
function remember(s,u){s.history.push({id:u.id,x:u.x,y:u.y,heading:heading(u),moved:u.moved,spent:u.spent??0,movementMode:u.movementMode??null,marchRequired:u.marchRequired??null});}
export function commitOrder(s,id,order){const u=getUnit(s,id);const error=orderError(s,u,order);if(error)throw Error(error);const plan=planMove(u,order);enterRemaining(s);remember(s,u);const marchRequired=needsMarchTest(s,u),spent=(u.spent??0)+plan.cost;Object.assign(u,{x:plan.end.x,y:plan.end.y,heading:plan.end.heading,spent,movementMode:plan.mode,marchRequired,moved:plan.kind==='pivot'||spent>=plan.allowance-EPS});return plan;}
export function movementError(s,u,distance,mode){return orderError(s,u,{kind:'advance',distance,mode,angle:0});}
export function move(s,id,distance,mode){return commitOrder(s,id,{kind:'advance',distance,mode,angle:0});}
export function hold(s,id){const u=getUnit(s,id);if(!canAct(s,u))throw Error('This regiment cannot take orders now.');enterRemaining(s);remember(s,u);u.moved=true;}
export function undo(s){if(s.stage!=='movement')throw Error('Undo is available during Movement only.');const last=s.history.pop();if(!last)throw Error('No move to undo this turn.');const u=getUnit(s,last.id);Object.assign(u,{x:last.x,y:last.y,heading:last.heading,moved:last.moved,spent:last.spent,movementMode:last.movementMode,marchRequired:last.marchRequired});s.selected=u.id;}
export function nextTurn(s){if(s.stage!=='combat')throw Error('Finish the Combat phase first.');s.stage='strategy';s.team=s.team==='ash'?'iron':'ash';if(s.team==='ash')s.round++;s.units.forEach(u=>{u.moved=false;u.shot=false;u.spent=0;u.movementMode=null;u.marchRequired=null;u.marchTest=null;u.charge=null;u.impetuousTest=null;u.combatResolved=false;u.rallyAttempted=false;});s.rocket.shot=false;s.rocket.lastShot=null;s.history=[];s.selected=s.units.find(u=>u.team===s.team).id;}
export function nextPhase(s){if(s.stage==='strategy'&&s.units.some(u=>u.team===s.team&&u.x!==null&&u.fleeing&&!u.rallyAttempted))throw Error('Attempt to rally every fleeing regiment first.');if(s.units.some(u=>u.charge?.status==='declared'))throw Error('Resolve all declared charges first.');if(s.stage==='combat'&&(s.combatSession||s.pendingCombat||combatPairs(s).length))throw Error('Resolve every combat and its outcome first.');const i=PHASES.indexOf(s.stage);if(i<0)throw Error('Begin the battle first.');if(i===3)nextTurn(s);else{s.stage=PHASES[i+1];s.history=[];if(s.stage==='movement')s.movementStep=s.units.some(u=>u.team===s.team&&u.x!==null&&availableCharges(s,u).length)?'declare':'remaining';if(s.stage==='shooting'&&!availableShots(s).length&&!rocketTargets(s).some(t=>!t.error))s.stage='combat';if(s.stage==='combat')s.units.forEach(u=>u.combatResolved=false);}return s.stage;}
export function rally(s,id,random=Math.random){const u=getUnit(s,id);if(s.stage!=='strategy'||u?.team!==s.team||u.x===null||!u.fleeing||u.rallyAttempted)throw Error('Select a fleeing regiment in its own Strategy phase.');const dice=rollD6(2,random),success=dice[0]+dice[1]<=leadership(u,'rally');u.rallyAttempted=true;u.rallied=success;if(success)u.fleeing=false;return {id,dice,success};}
export function rollD6(count,random=Math.random){if(!Number.isInteger(count)||count<1||count>20)throw Error('Choose 1 to 20 dice.');return Array.from({length:count},()=>1+Math.floor(random()*6));}

// Ranged attacks are measured from individual model centres. The front 90-degree
// arc extends from each front base corner; other regiments block a clear shot.
function shootingModels(s,u){const cells=modelSquares(s,u).filter(m=>!m.dead);return cells.filter(m=>m.row===0||(missileWeapon(u)?.volley&&cells.filter(v=>v.row===m.row).indexOf(m)<Math.ceil(cells.filter(v=>v.row===m.row).length/2)));}
function shotPoint(u,m){return localPoint(u,m.x+m.size/2,m.y+m.size/2);}
function sightBlocked(s,u,t,a,b){return s.units.some(v=>v.x!==null&&v.id!==u.id&&v.id!==t.id&&aliveCount(v)>0&&(()=>{const poly=corners(v);return poly.some((p,i)=>intersects(a,b,p,poly[(i+1)%4]))||inside(a,poly)||inside(b,poly);})());}
function modelCanSee(s,u,t,m,range){const origin=shotPoint(u,m),a=rad(-heading(u)),targets=[{x:t.x,y:t.y},...corners(t)];return targets.some(point=>{const dx=point.x-origin.x,dy=point.y-origin.y,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);return ly<0&&Math.abs(lx)<=-ly+m.size/2+EPS&&Math.hypot(dx,dy)<=range+EPS&&!sightBlocked(s,u,t,origin,point);});}
export function canShoot(s,u){return s.stage==='shooting'&&u?.team===s.team&&u.role==='missile'&&u.x!==null&&aliveCount(u)>0&&!u.shot&&!u.engaged&&!u.fleeing&&!u.charge&&u.movementMode!=='march';}
export function shootingPlan(s,u,t,{reaction=false}={}){
 if(!u||!t||u.team===t.team||u.x===null||t.x===null||u.role!=='missile'||aliveCount(u)===0||aliveCount(t)===0)return {error:'Choose an enemy target for a missile regiment.'};
 if(reaction){if(u.engaged||u.fleeing)return {error:'Engaged or fleeing regiments cannot Stand & Shoot.'};if(gap(u,t)+EPS<profile(t).M)return {error:`Charger is too close for Stand & Shoot (less than M${profile(t).M}″).`};}
 else if(!canShoot(s,u))return {error:'This regiment cannot shoot in this phase.'};
 const weapon=missileWeapon(u),range=weapon.range,half=range/2,clear=shootingModels(s,u).filter(m=>modelCanSee(s,u,t,m,reaction?Math.max(range,gap(u,t)+size(t).w):range));
 if(!clear.length)return {error:'Target is outside the front arc, range, or clear line of sight.',range,half};
 const distance=gap(u,t),models=clear.map(m=>{const point=shotPoint(u,m),poly=corners(t),modelDistance=Math.min(...poly.map((p,i)=>pointSegment(point,p,poly[(i+1)%4])));return {index:m.index,bs:m.command==='C'?championProfile(u).BS:profile(u).BS,distance:modelDistance,long:!reaction&&modelDistance>half+EPS};}),long=models.some(m=>m.long),modifiers=[];
 if(!reaction&&(u.moved||(u.spent??0)>0)&&!weapon.ignoreMove)modifiers.push({label:'Moved',value:-1});
 if(long)modifiers.push({label:'Long range',value:weapon.ignoreLong?0:-1});
 if(reaction)modifiers.push({label:'Stand & Shoot',value:weapon.ignoreStand?0:-1});
 if(weapon.multiple)modifiers.push({label:'Multiple Shots D3',value:0});
 const modifier=modifiers.reduce((n,v)=>n+v.value,0),toHit=Math.max(2,Math.min(7,7-profile(u).BS-modifier));
 const hitNumbers=models.map(m=>Math.max(2,Math.min(7,7-m.bs-(modifier+(long&&!m.long&&!weapon.ignoreLong?1:0)))));
 return {target:t.id,weapon,range,half,distance,band:reaction?'Stand & Shoot':models.every(m=>m.long)?'far':long?'mixed':'close',shooters:clear.length,closeShooters:models.filter(m=>!m.long).length,farShooters:models.filter(m=>m.long).length,models,modifiers,modifier,toHit,hitLabel:Math.min(...hitNumbers)===Math.max(...hitNumbers)?`${hitNumbers[0]}+`:`${Math.min(...hitNumbers)}+–${Math.max(...hitNumbers)}+`,reaction};
}
export function shootingTargets(s,u){return s.units.filter(t=>t.team!==u?.team&&t.x!==null&&aliveCount(t)>0).map(t=>({unit:t,plan:shootingPlan(s,u,t)}));}
export function availableShots(s){return s.stage==='shooting'?s.units.filter(u=>canShoot(s,u)&&shootingTargets(s,u).some(t=>!t.plan.error)):[];}
export function finishShooting(s,id){const u=getUnit(s,id);if(!canShoot(s,u))throw Error('This regiment cannot finish shooting now.');u.shot=true;return u;}
function shootDice(count,random){return Array.from({length:count},()=>1+Math.floor(random()*6));}
function fireMissiles(s,u,t,plan,random=Math.random){
 const dice={shots:plan.weapon.multiple?shootDice(plan.shooters,random).map(d=>Math.ceil(d/2)):[],hit:[],wound:[],save:[]};
 const shots=plan.weapon.multiple?dice.shots.reduce((a,b)=>a+b,0):plan.shooters,hitTargets=plan.models.flatMap((m,i)=>Array.from({length:plan.weapon.multiple?dice.shots[i]:1},()=>Math.max(2,Math.min(7,7-m.bs-(plan.modifiers.filter(v=>v.label!=='Long range').reduce((n,v)=>n+v.value,0))-(m.long&&!plan.weapon.ignoreLong? -1:0)))));
 dice.hit=shootDice(shots,random);const hits=dice.hit.filter((n,i)=>n>=hitTargets[i]).length;
 const toWound=Math.max(2,Math.min(6,4+profile(t).T-plan.weapon.strength));dice.wound=shootDice(hits,random);
 const wounds=dice.wound.filter(n=>n>=toWound).length;
 const toSave=Math.min(7,Math.max(2,profile(t).save-(FACTIONS[t.faction].shield&&t.role!=='missile'?1:0)+plan.weapon.ap));dice.save=shootDice(wounds,random);
 const unsaved=Math.min(aliveCount(t),dice.save.filter(n=>n<toSave).length);removeCasualties(s,t,unsaved);if(aliveCount(t)===0){t.destroyed=true;t.engaged=null;u.engaged=null;}
 return {...plan,from:u.id,to:t.id,shots,hits,wounds,unsaved,toWound,toSave,hitTargets,dice};
}
export function shoot(s,id,target,random=Math.random){const u=getUnit(s,id),t=getUnit(s,target),plan=shootingPlan(s,u,t);if(plan.error)throw Error(plan.error);const result=fireMissiles(s,u,t,plan,random);u.shot=true;s.lastShooting=result;return result;}

// Charge routes use one measured leading-corner wheel, then a free alignment wheel.
// Face selection is fixed by the charger's starting position.
export function chargeFace(u,t){
 const a=rad(-heading(t)),c=Math.cos(a),si=Math.sin(a),{w}=size(u),b=w/5,counts={front:0,rear:0,'left flank':0,'right flank':0};
 for(let i=0;i<5;i++){const p=localPoint(u,(i-2)*b,-size(u).h/2),dx=p.x-t.x,dy=p.y-t.y,x=dx*c-dy*si,y=dx*si+dy*c;counts[Math.abs(x)<=Math.abs(y)?y<0?'front':'rear':x<0?'left flank':'right flank']++;}
 return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
}
function directChargePlan(s,u,t){
 if(!u||!t||u.x===null||t.x===null||u.team===t.team)return {error:'Choose an enemy regiment.'};
 if(u.rallied)return {error:'A regiment that rallied this turn cannot charge.'};
 if(u.engaged||t.engaged||u.fleeing||u.deadModels?.length===20||t.deadModels?.length===20)return {error:'Already engaged. Multiple-unit combats are not supported yet.'};
 if(gap(u,t)>profile(u).M+6+EPS)return {error:`Beyond the maximum ${profile(u).M+6}″ charge range.`};
 const a=rad(-heading(u)),dx=t.x-u.x,dy=t.y-u.y,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);
 if(ly>=0||Math.abs(lx)>-ly+EPS)return {error:'Target centre is outside the front arc in this prototype.'};
 const face=chargeFace(u,t),offset={'front':0,'rear':180,'left flank':-90,'right flank':90}[face],out=normalize(heading(t)+offset),desired=normalize(out+180),angle=((desired-heading(u)+540)%360)-180;
 if(Math.abs(angle)>90+EPS)return {error:'This charge needs more than a 90° wheel.'};
 const after=Math.abs(angle)>EPS?wheelPose(u,angle):{...u},a2=rad(desired),f={x:Math.sin(a2),y:-Math.cos(a2)},right={x:Math.cos(a2),y:Math.sin(a2)};
 const own=size(u),theirs=size(t),targetDepth=face.includes('flank')?theirs.w:theirs.h,targetWidth=face.includes('flank')?theirs.h:theirs.w;
 const rel={x:t.x-after.x,y:t.y-after.y},distance=rel.x*f.x+rel.y*f.y-(own.h+targetDepth)/2,lateral=rel.x*right.x+rel.y*right.y;
 if(distance< -EPS)return {error:'No forward approach to the target face.'};
 // Require maximum possible frontage; do not silently slide a unit sideways.
 if(Math.abs(lateral)>Math.abs(own.w-targetWidth)/2+.02)return {error:'Line up the frontages first. Offset / closing-the-door charges are not supported yet.'};
 const end=forwardPose(after,Math.max(0,distance)),cost=wheelCost(angle,u)+Math.max(0,distance),plan={start:{...u},afterWheel:after,contact:end,end,angle,distance:Math.max(0,distance),wheelCost:wheelCost(angle,u),alignAngle:0,cost,face,target:t.id};
 if(cost>profile(u).M+6+EPS)return {...plan,error:`The wheel and approach exceed the maximum ${profile(u).M+6}″ charge range.`};
 if(offBoard(end))return {...plan,error:'Charge ends off the battlefield.'};
 const others=s.units.filter(v=>v.x!==null&&v.id!==u.id&&v.id!==t.id);
 if(others.some(v=>gap(end,v)<1-EPS))return {...plan,error:'Another regiment blocks the contact position.'};
 const steps=Math.max(1,Math.ceil(Math.abs(angle)/.25));let prev=corners(u).slice(0,2);
 for(let i=1;i<=steps;i++){
  const pose=wheelPose(u,angle*i/steps),front=corners(pose).slice(0,2),sweep=hull([...prev,...front]);
  if(offBoard(pose)||polygonGap(sweep,corners(t))<EPS||others.some(v=>polygonGap(sweep,corners(v))<1-EPS))return {...plan,error:'The charge wheel is obstructed.'};prev=front;
 }
 const swept=hull([...corners(after),...corners(end)]);
 if(others.some(v=>polygonGap(swept,corners(v))<1-EPS))return {...plan,error:'Another regiment blocks the charge path.'};
 return plan;
}
export function chargePlan(s,u,t){
 const direct=directChargePlan(s,u,t);if(!direct.error)return direct;
 if(!u||!t||u.x===null||t.x===null||u.team===t.team||u.engaged||t.engaged||u.fleeing||u.rallied||gap(u,t)>profile(u).M+6+EPS||/front arc/.test(direct.error))return direct;
 const face=chargeFace(u,t),offset={front:0,rear:180,'left flank':-90,'right flank':90}[face],out=normalize(heading(t)+offset),desired=normalize(out+180),own=size(u),theirs=size(t),depth=face.includes('flank')?theirs.w:theirs.h,width=face.includes('flank')?theirs.h:theirs.w;
 const oa=rad(out),normal={x:Math.sin(oa),y:-Math.cos(oa)},right={x:Math.cos(oa),y:Math.sin(oa)},others=s.units.filter(v=>v.x!==null&&v.id!==u.id&&v.id!==t.id),limit=profile(u).M+6;
 let best=null;
 for(let angle=-90;angle<=90;angle+=5){
  const after=Math.abs(angle)>EPS?wheelPose(u,angle):{...u},wheel=wheelCost(angle,u);if(wheel>=limit||offBoard(after))continue;
  let blocked=false,previous=corners(u).slice(0,2);
  for(let i=1,n=Math.ceil(Math.abs(angle)/2);i<=n;i++){const pose=wheelPose(u,angle*i/n),front=corners(pose).slice(0,2),sweep=hull([...previous,...front]);if(offBoard(pose)||polygonGap(sweep,corners(t))<EPS||others.some(v=>polygonGap(sweep,corners(v))<1-EPS)){blocked=true;break;}previous=front;}
  if(blocked)continue;
  const remaining=limit-wheel;
  for(let d=.1;d<=remaining+.1;d+=.1){
   const contact=forwardPose(after,Math.min(d,remaining));if(offBoard(contact)||others.some(v=>gap(contact,v)<1-EPS)){blocked=true;break;}
   if(gap(contact,t)>.12)continue;
   if(chargeFace(contact,t)!==face)break;
   const rel={x:contact.x-t.x,y:contact.y-t.y},lateral=rel.x*right.x+rel.y*right.y,centering=Math.max(-Math.abs(own.w-width)/2,Math.min(Math.abs(own.w-width)/2,lateral));
   const end={...u,x:t.x+normal.x*(own.h+depth)/2+right.x*centering,y:t.y+normal.y*(own.h+depth)/2+right.y*centering,heading:desired};
   const alignAngle=((desired-heading(contact)+540)%360)-180;
   if(Math.abs(alignAngle)>90+EPS||Math.hypot(end.x-contact.x,end.y-contact.y)>.2+2*own.w*Math.sin(rad(Math.abs(alignAngle))/2)||offBoard(end)||gap(end,t)>.02||others.some(v=>gap(end,v)<1-EPS))break;
   const swept=hull([...corners(after),...corners(contact)]);if(others.some(v=>polygonGap(swept,corners(v))<1-EPS))break;
   const plan={start:{...u},afterWheel:after,contact,end,angle,distance:Math.min(d,remaining),wheelCost:wheel,alignAngle,cost:wheel+Math.min(d,remaining),face,target:t.id};
   if(!best||plan.cost<best.cost)best=plan;break;
  }
 }
 return best??direct;
}
export function declareCharge(s,id,target){
 const u=getUnit(s,id),t=getUnit(s,target);
 if(s.stage!=='movement'||s.movementStep!=='declare'||!canAct(s,u))throw Error('Declare charges before Remaining Moves with an unengaged regiment.');
 if(FACTIONS[u.faction??'chaos'].impetuous&&u.impetuousTest===null)throw Error('Roll this Orc Mob’s Impetuous test before declaring a charge.');
 if(s.units.some(v=>v.charge?.status==='declared'&&v.charge.target===target))throw Error('Only one charger per target is supported.');
 const p=chargePlan(s,u,t);if(p.error)throw Error(p.error);
 u.charge={target,status:'declared',reaction:'pending',initialPlan:p};s.history=[];return {...p,reaction:'pending'};
}
export function canStandShoot(s,defender,charger){return !!defender&&!!charger&&defender.role==='missile'&&!defender.engaged&&!defender.fleeing&&aliveCount(defender)>0&&gap(defender,charger)+EPS>=profile(charger).M&&!shootingPlan(s,defender,charger,{reaction:true}).error;}
export function chargeReaction(s,chargerId,choice,random=Math.random){
 const charger=getUnit(s,chargerId),defender=getUnit(s,charger?.charge?.target);
 if(s.stage!=='movement'||s.movementStep!=='declare'||charger?.charge?.status!=='declared'||charger.charge.reaction!=='pending')throw Error('No charge reaction is pending.');
 if(!['hold','stand-shoot','flee'].includes(choice))throw Error('Choose Hold, Stand & Shoot, or Flee.');
 if(choice==='hold'&&defender.fleeing)throw Error('A fleeing regiment must Flee.');
 if(choice==='stand-shoot'&&!canStandShoot(s,defender,charger))throw Error('This regiment cannot Stand & Shoot against this charge.');
 if(choice==='flee'&&defender.engaged)throw Error('An engaged regiment must Hold.');
 let report=null,fleeDice=null,fleeDistance=0;
 if(choice==='stand-shoot'){const plan=shootingPlan(s,defender,charger,{reaction:true});report=fireMissiles(s,defender,charger,plan,random);defender.reacted=true;}
 if(choice==='flee'){
  fleeDice=rollD6(2,random);fleeDistance=fleeDice[0]+fleeDice[1];
  const dx=defender.x-charger.x,dy=defender.y-charger.y;
  defender.heading=normalize(Math.atan2(dx,-dy)*180/Math.PI);
  const end=forwardPose(defender,fleeDistance);
  if(offBoard(end))destroyUnit(defender);
  else{defender.x=end.x;defender.y=end.y;}
  defender.fleeing=!defender.destroyed;defender.moved=true;
 }
 charger.charge.reaction=choice;charger.charge.reactionReport=report;charger.charge.fleeDice=fleeDice;
 if(aliveCount(charger)===0){charger.charge.status='stopped';charger.moved=true;}
 return {choice,report,fleeDice,fleeDistance,fledOffBoard:choice==='flee'&&!!defender.destroyed,charger:chargerId,defender:defender.id,stopped:charger.charge.status==='stopped'};
}
export function cancelCharge(s,id){if(s.movementStep!=='declare')throw Error('Declarations are locked after rolling begins.');const u=getUnit(s,id);if(u?.charge?.status==='declared'&&u.charge.reaction!=='pending')throw Error('A charge cannot be cancelled after its defender reacts.');if(u?.charge?.status==='declared')u.charge=null;}
export function availableCharges(s,u){return s.units.filter(v=>v.team!==u.team&&v.x!==null&&!s.units.some(other=>other.id!==u.id&&other.charge?.status==='declared'&&other.charge.target===v.id)&&!chargePlan(s,u,v).error);}
export function impetuousTest(s,id,dice){const u=getUnit(s,id);if(s.stage!=='movement'||s.movementStep!=='declare'||u?.team!==s.team||u.faction!=='orc'||u.impetuousTest!==null||!availableCharges(s,u).length)throw Error('Select an Orc Mob with an available charge.');if(!Array.isArray(dice)||dice.length!==2||dice.some(d=>!Number.isInteger(d)||d<1||d>6))throw Error('An Impetuous test requires two D6.');u.impetuousTest=dice[0]+dice[1]<=profile(u).Ld;return u.impetuousTest;}
export function finishDeclarations(s){if(s.stage!=='movement'||s.movementStep!=='declare')throw Error('Not declaring charges.');if(s.units.some(u=>u.charge?.reaction==='pending'))throw Error('Choose every defender’s charge reaction first.');for(const u of s.units.filter(u=>u.team===s.team&&u.faction==='orc'&&!u.charge&&availableCharges(s,u).length)){if(u.impetuousTest===null)throw Error('Roll Impetuous for each Orc Mob able to charge.');if(u.impetuousTest===false)throw Error('An Impetuous Orc Mob must declare a charge.');}s.movementStep=s.units.some(u=>u.charge?.status==='declared')?'charges':'remaining';s.history=[];}
export function enterRemaining(s){
 if(s.units.some(u=>u.charge?.status==='declared'))throw Error('Resolve all declared charges before Remaining Moves.');
 s.movementStep='remaining';
}
export function resolveCharge(s,id,dice){
 const u=getUnit(s,id);if(s.stage!=='movement'||s.movementStep!=='charges'||u?.charge?.status!=='declared')throw Error('Select a declared charge to resolve.');
 if(!Array.isArray(dice)||dice.length!==2||dice.some(d=>!Number.isInteger(d)||d<1||d>6))throw Error('A charge roll requires two D6.');
 if(u.charge.reaction==='pending')throw Error('Choose the defender’s reaction first.');
 const t=getUnit(s,u.charge.target),fled=u.charge.reaction==='flee',p=t?.x!==null?chargePlan(s,u,t):{error:'Target fled off the table.'},route=p.error?u.charge.initialPlan:p,roll=Math.max(...dice),range=profile(u).M+roll,success=!p.error&&range+EPS>=p.cost;
 let end={...u},travel=0;
 if(success){end=p.end;travel=p.cost;if(fled)destroyUnit(t);else{u.engaged=t.id;t.engaged=u.id;}}
 else if(route?.start){
  const budget=fled?range:roll;
  const wheelAngle=route.wheelCost<=budget?route.angle:Math.sign(route.angle)*2*Math.asin(Math.min(1,budget/(2*size(u).w)))*180/Math.PI;
  const wheelEnd=wheelPose(u,wheelAngle),straight=Math.max(0,budget-wheelCost(wheelAngle,u));
  // Stop a failed charge short of units or table edges; never enter combat on failure.
  for(let i=1;i<=100;i++){const pose=i/100<=wheelCost(wheelAngle,u)/budget?wheelPose(u,wheelAngle*(i/100)*budget/Math.max(wheelCost(wheelAngle,u),EPS)):forwardPose(wheelEnd,Math.min(straight,(i/100)*budget-wheelCost(wheelAngle,u)));if(checkPosition(s,pose,pose.x,pose.y))break;end=pose;travel=budget*i/100;}
 }
 Object.assign(u,{x:end.x,y:end.y,heading:heading(end),moved:true});
 u.charge={...u.charge,status:success?'success':'failed',dice:[...dice],roll,range,distance:travel,face:route?.face};s.history=[];
 if(!s.units.some(v=>v.charge?.status==='declared'))s.movementStep='remaining';
 return {success,runDown:success&&fled,dice,roll,range,distance:travel,target:t.id,reason:p.error??null};
}

export function modelSquares(s,u){
 const base=baseSize(u)/25.4,footprint=size(u),enemy=u.engaged?getUnit(s,u.engaged):null,face=enemy?chargeFace(enemy,u):null,depth=u.charge?.status==='success'?1:2;
 return Array.from({length:20},(_,i)=>{const row=Math.floor(i/5),col=i%5,x=-footprint.w/2+col*base,y=-footprint.h/2+row*base;
 const poly=[[x,y],[x+base,y],[x+base,y+base],[x,y+base]].map(([a,b])=>localPoint(u,a,b));
 const edge=face==='front'?row:face==='rear'?3-row:face==='left flank'?col:face==='right flank'?4-col:Infinity;
 const dead=(u.deadModels??[]).includes(i);
 const fighting=!dead&&!!enemy&&edge<depth&&polygonGap(poly,corners(enemy))<=profile(u).M+EPS;
 return {index:i,row,col,x,y,size:base,command:COMMAND_SLOTS[i]??null,dead,fighting,contact:!dead&&!!enemy&&polygonGap(poly,corners(enemy))<EPS};
 });
}

export function movementRemaining(u,mode=u.movementMode??'advance'){return u.moved||u.engaged||u.charge||u.fleeing?0:Math.max(0,(mode==='march'?2*profile(u).M:profile(u).M)-(u.spent??0));}

export function aliveCount(u){return u.destroyed?0:20-(u.deadModels?.length??0);}
export function combatPairs(s){return s.units.filter(u=>u.engaged&&u.x!==null&&!u.combatResolved&&u.id< u.engaged).map(u=>[u.id,u.engaged]);}
function combatDice(count,random){return count?rollD6(count,random):[];}
function combatInitiative(u){if(u.charge?.status!=='success')return profile(u).I;return profile(u).I+Math.min(u.charge.face==='front'?3:4,Math.floor(u.charge.distance+EPS));}
export function hitTarget(attacker,defender){const a=profile(attacker).WS,d=profile(defender).WS;return a>2*d?2:a>d?3:d>2*a?5:4;}
export function woundTarget(attacker,defender){return Math.max(2,Math.min(6,4+profile(defender).T-profile(attacker).S));}
export function saveTarget(defender,attacker){let target=profile(defender).save-(defender.role!=='missile'&&FACTIONS[defender.faction??'chaos'].shield?1:0)+(FACTIONS[attacker.faction??'chaos'].choppas&&attacker.charge?.status==='success'?1:0);return Math.max(2,Math.min(7,target));}
function rankBonus(u){return Math.min(2,Math.max(0,Math.floor((aliveCount(u)-1)/5)));}
export function leadership(u,kind='normal'){const base=commandAlive(u,'C')?Math.max(profile(u).Ld,championProfile(u).Ld):profile(u).Ld;return Math.min(10,base+(FACTIONS[u.faction??'chaos'].warband&&kind!=='restraint'&&!u.fleeing?rankBonus(u):0)+(commandAlive(u,'M')&&(kind==='march'||kind==='rally')?1:0));}
function attackStage(s,attacker,defender,random){
 const fighting=modelSquares(s,attacker).filter(m=>m.fighting),faction=FACTIONS[attacker.faction??'chaos'],chopping=faction.choppas&&attacker.charge?.status==='success',dice={hit:[],wound:[],reroll:[],save:[]};
 const furious=faction.furious&&attacker.charge?.status==='success'&&attacker.charge.distance>=3?1:0;
 const attacks=fighting.reduce((total,model)=>total+(model.command==='C'?championProfile(attacker).A:profile(attacker).A)+furious,0);dice.hit=combatDice(attacks,random);
 const toHit=hitTarget(attacker,defender),toWound=woundTarget(attacker,defender),toSave=saveTarget(defender,attacker),hits=dice.hit.filter(n=>n>=toHit).length;dice.wound=combatDice(hits,random);
 if(chopping){dice.reroll=combatDice(dice.wound.filter(n=>n===1).length,random);}
 const wounds=dice.wound.filter(n=>n>=toWound).length+dice.reroll.filter(n=>n>=toWound).length;dice.save=combatDice(wounds,random);
 const unsaved=Math.min(aliveCount(defender),dice.save.filter(n=>n<toSave).length);
 return {from:attacker.id,to:defender.id,initiative:combatInitiative(attacker),fighters:fighting.length,attacks,hits,wounds,saved:wounds-unsaved,unsaved,toHit,toWound,toSave,dice};
}
function removeCasualties(s,u,count){
 const n=Math.min(count,aliveCount(u));for(let i=0;i<n;i++){
  const live=modelSquares(s,u).filter(m=>!m.dead);
  // The struck fighting rank loses models first; empty positions stay dark for a readable record.
  const ordinary=live.filter(m=>!m.command),victim=ordinary.find(m=>m.contact)??ordinary.find(m=>m.fighting)??ordinary[0]??live.find(m=>m.command==='M')??live.find(m=>m.command==='S')??live[0];
  u.deadModels.push(victim.index);
 }
}
// The Deathshrieker is a separately based war machine. Its three crew bases are
// drawn beside it; this first war-machine pass does not put crew into melee.
export function canFireRocket(s){return s.stage==='shooting'&&s.team==='ash'&&s.rocket.x!==null&&s.rocket.wounds>0&&!s.rocket.shot&&s.round>s.rocket.disabledUntil;}
export function rocketPlan(s,target,{indirect=false}={}){
 const r=s.rocket;if(r.x===null)return {error:'Deploy the launcher first.'};if(!target||target.x===null||target.team==='ash'||aliveCount(target)===0)return {error:'Choose a surviving enemy regiment.'};if(target.engaged)return {error:'Cannot target a regiment in combat.'};
 const distance=polygonGap(rocketFootprint(r.x,r.y),corners(target)),dx=target.x-r.x,dy=target.y-r.y;
 if(distance<12-EPS||distance>48+EPS)return {error:'Target must be between 12″ and 48″ away.',distance};
 if(dy>=0||Math.abs(dx)>-dy+EPS)return {error:'Target is outside the launcher’s front arc.',distance};
 if(!indirect&&sightBlocked(s,r,target,{x:r.x,y:r.y},{x:target.x,y:target.y}))return {error:'Another regiment blocks line of sight. Choose Indirect Fire.',distance};
 return {target:target.id,distance,aim:{x:target.x,y:target.y},indirect};
}
export function rocketTargets(s,options={}){if(!canFireRocket(s))return [];return s.units.filter(u=>u.team==='iron'&&u.x!==null&&aliveCount(u)>0).map(u=>({unit:u,...rocketPlan(s,u,options)}));}
export function rollRocketDice(random=Math.random){const face=Math.floor(random()*6),hit=Math.floor(random()*3)===0,angle=Math.floor(random()*8)*45;return {artillery:face===5?'misfire':(face+1)*2,scatter:hit?'hit':angle,hitArrow:angle};}
function blastCells(s,point,radius){const out=[];for(const unit of s.units.filter(u=>u.x!==null&&aliveCount(u)>0)){
 const a=rad(heading(unit)),c=Math.cos(a),sn=Math.sin(a),dx=point.x-unit.x,dy=point.y-unit.y,lx=dx*c+dy*sn,ly=-dx*sn+dy*c;
 for(const model of modelSquares(s,unit).filter(m=>!m.dead)){const x=Math.max(model.x,Math.min(lx,model.x+model.size)),y=Math.max(model.y,Math.min(ly,model.y+model.size));if(Math.hypot(lx-x,ly-y)>radius+EPS)continue;
 const centre=lx>=model.x-EPS&&lx<=model.x+model.size+EPS&&ly>=model.y-EPS&&ly<=model.y+model.size+EPS;
 const fully=[[model.x,model.y],[model.x+model.size,model.y],[model.x,model.y+model.size],[model.x+model.size,model.y+model.size]].every(([mx,my])=>Math.hypot(lx-mx,ly-my)<=radius+EPS);
 out.push({unit,model:model.index,centre,fully});
 }
 }return out;}
export function fireRocket(s,targetId,profileKey,dice,random=Math.random,{indirect=false}={}){
 if(!canFireRocket(s))throw Error('The Deathshrieker cannot fire in this Shooting phase.');
 const profile=ROCKET_PROFILES[profileKey],target=getUnit(s,targetId),plan=rocketPlan(s,target,{indirect});if(!profile)throw Error('Choose a rocket profile.');if(plan.error)throw Error(plan.error);
 if(!dice||!([2,4,6,8,10,'misfire'].includes(dice.artillery))||!(dice.scatter==='hit'||Number.isInteger(dice.scatter)&&dice.scatter>=0&&dice.scatter<360))throw Error('Roll valid Artillery and Scatter dice.');
 const report={profile:profileKey,from:'A5',target:targetId,aim:plan.aim,impact:null,template:profile.template,artillery:dice.artillery,scatter:dice.scatter,indirect,misfire:null,affected:[],hits:0,unsaved:0};
 s.rocket.shot=true;
 if(dice.artillery==='misfire'){
  const result=rollD6(1,random)[0];report.misfire=result;
  if(result===1){s.rocket.wounds=0;s.rocket.x=null;s.rocket.y=null;s.rocket.crew=0;}
  else if(result<=4){s.rocket.wounds--;s.rocket.crew=Math.min(s.rocket.crew,s.rocket.wounds);s.rocket.disabledUntil=s.round+1;if(s.rocket.wounds<=0){s.rocket.x=null;s.rocket.y=null;s.rocket.crew=0;}}
  s.rocket.lastShot=report;return report;
 }
 let angle=dice.scatter,travel=dice.artillery;
 if(angle==='hit'&&!indirect)travel=0;
 else if(angle==='hit'){angle=dice.hitArrow??0;travel=Math.max(0,dice.artillery-3);}
 const direction=rad(angle==='hit'?0:angle),impact={x:plan.aim.x+Math.sin(direction)*travel,y:plan.aim.y-Math.cos(direction)*travel};report.impact=impact;report.scatterDistance=travel;
 const cells=blastCells(s,impact,profile.template/2),centrals=cells.filter(c=>c.centre),central=centrals.find(c=>c.unit.id===targetId)??centrals[0];
 for(const cell of cells){const isCentre=cell===central,hitRoll=cell.fully||isCentre?null:rollD6(1,random)[0];if(hitRoll!==null&&hitRoll<4)continue;
  report.hits++;const strength=isCentre?profile.centreStrength:profile.strength,ap=isCentre?profile.centreAp:profile.ap,woundRoll=rollD6(1,random)[0],toWound=Math.max(2,Math.min(6,4+GprofileT(cell.unit)-strength));
  const saveRoll=woundRoll>=toWound?rollD6(1,random)[0]:null,toSave=Math.max(2,Math.min(7,profileOfSave(cell.unit)+ap));const slain=aliveCount(cell.unit)>0&&saveRoll!==null&&saveRoll<toSave?1:0;
  report.affected.push({unit:cell.unit.id,model:cell.model,centre:isCentre,hitRoll,woundRoll,saveRoll,toWound,toSave,slain});
  if(slain){removeCasualties(s,cell.unit,1);report.unsaved++;if(aliveCount(cell.unit)===0){if(cell.unit.engaged)getUnit(s,cell.unit.engaged).engaged=null;cell.unit.destroyed=true;cell.unit.engaged=null;cell.unit.x=null;cell.unit.y=null;}}
 }
 if(profileKey==='incendiary')for(const unit of s.units.filter(u=>report.affected.some(a=>a.unit===u.id&&a.slain)&&u.x!==null)){
  const panic=rollD6(2,random);report.panic??=[];report.panic.push({unit:unit.id,dice:panic,passed:panic[0]+panic[1]<=leadership(unit)});
  if(panic[0]+panic[1]>leadership(unit)){unit.fleeing=true;unit.moved=true;const away=Math.atan2(unit.x-s.rocket.x,-(unit.y-s.rocket.y))*180/Math.PI;unit.heading=normalize(away);const flee=rollD6(2,random);const end=forwardPose(unit,flee[0]+flee[1]),fledOffBoard=offBoard(end);if(fledOffBoard)destroyUnit(unit);else Object.assign(unit,{x:end.x,y:end.y});Object.assign(report.panic.at(-1),{fleeDice:flee,fledOffBoard});}
 }
 s.rocket.lastShot=report;return report;
}
function GprofileT(u){return profile(u).T;}
function profileOfSave(u){return profile(u).save-(u.role!=='missile'&&FACTIONS[u.faction].shield?1:0);}
function combatScore(s,u,enemy,inflicted){
 const alive=aliveCount(u),face=chargeFace(enemy,u),disrupted=(face==='left flank'||face==='right flank'||face==='rear')&&aliveCount(enemy)>=10;
 const ranks=disrupted?0:rankBonus(u);
 const closeOrder=alive>=10&&!(u.role==='missile'&&u.faction==='chaos')?1:0,flank=chargeFace(u,enemy)==='left flank'||chargeFace(u,enemy)==='right flank'?1:chargeFace(u,enemy)==='rear'?2:0;
 const massed=alive>aliveCount(enemy)?1:0,standard=commandAlive(u,'S')?1:0;
 return {wounds:inflicted,ranks,closeOrder,flank,massed,standard,musician:0,total:inflicted+ranks+closeOrder+flank+massed+standard};
}
function breakTieWithMusician(a,b,scoreA,scoreB){if(scoreA.total!==scoreB.total)return;const aMusic=commandAlive(a,'M'),bMusic=commandAlive(b,'M');if(aMusic!==bMusic){const score=aMusic?scoreA:scoreB;score.musician=1;score.total++;}}
export function resolveCombat(s,id,random=Math.random){
 if(s.stage!=='combat'||s.pendingCombat)throw Error('Finish the current combat outcome first.');
 const a=getUnit(s,id),b=getUnit(s,a?.engaged);
 if(!a||!b||!a.engaged||a.combatResolved||b.combatResolved)throw Error('Select an unresolved engaged regiment.');
 const groups=[...new Set([combatInitiative(a),combatInitiative(b)])].sort((x,y)=>y-x),stages=[],damage={[a.id]:0,[b.id]:0};
 for(const init of groups){
  const simultaneous=[];
  if(combatInitiative(a)===init&&aliveCount(a)>0)simultaneous.push(attackStage(s,a,b,random));
  if(combatInitiative(b)===init&&aliveCount(b)>0)simultaneous.push(attackStage(s,b,a,random));
  for(const stage of simultaneous){stages.push(stage);damage[stage.to]+=stage.unsaved;}
  for(const stage of simultaneous)removeCasualties(s,getUnit(s,stage.to),stage.unsaved);
 }
 const scoreA=combatScore(s,a,b,damage[b.id]),scoreB=combatScore(s,b,a,damage[a.id]);breakTieWithMusician(a,b,scoreA,scoreB);
 let winner=null,loser=null,outcome='draw',breakDice=null,margin=Math.abs(scoreA.total-scoreB.total);
 if(aliveCount(a)===0||aliveCount(b)===0){winner=aliveCount(a)>0?a.id:aliveCount(b)>0?b.id:null;loser=winner===a.id?b.id:a.id;outcome='destroyed';}
 else if(scoreA.total!==scoreB.total){winner=scoreA.total>scoreB.total?a.id:b.id;loser=winner===a.id?b.id:a.id;breakDice=combatDice(2,random);const natural=breakDice[0]+breakDice[1],lost=getUnit(s,loser),ld=leadership(lost);outcome=breakDice[0]===1&&breakDice[1]===1||natural+margin<=ld?'give-ground':natural>ld?'break':'fall-back';
  if(outcome==='fall-back'&&FACTIONS[lost.faction??'chaos'].shieldwall&&!lost.shieldwallUsed&&lost.charge?.status!=='success'&&getUnit(s,winner).charge?.status==='success'){outcome='give-ground';lost.shieldwallUsed=true;}
 }
 a.combatResolved=b.combatResolved=true;
 const result={a:a.id,b:b.id,stages,damage,score:{[a.id]:scoreA,[b.id]:scoreB},winner,loser,outcome,breakDice,margin,round:s.round};
 s.lastCombat=result;(s.combatHistory??=[]).push(result);
 if(outcome==='destroyed'){for(const dead of [a,b].filter(u=>aliveCount(u)===0)){dead.x=null;dead.y=null;dead.destroyed=true;dead.engaged=null;}if(winner)getUnit(s,winner).engaged=null;}
 else if(outcome!=='draw')s.pendingCombat={winner,loser,outcome,margin};
 return result;
}
export function beginCombat(s,id){
 if(s.stage!=='combat'||s.combatSession||s.pendingCombat)throw Error('Finish the current combat first.');
 const a=getUnit(s,id),b=getUnit(s,a?.engaged);if(!a||!b||a.combatResolved||b.combatResolved)throw Error('Select an unresolved engaged regiment.');
 const groups=[...new Set([combatInitiative(a),combatInitiative(b)])].sort((x,y)=>y-x);
 return s.combatSession={a:a.id,b:b.id,initiative:{[a.id]:combatInitiative(a),[b.id]:combatInitiative(b)},groups,step:0,phase:'attacks',stages:[],damage:{[a.id]:0,[b.id]:0}};
}
export function fightCombatStep(s,random=Math.random){
 const c=s.combatSession;if(s.stage!=='combat'||c?.phase!=='attacks')throw Error('Show Initiative before rolling attacks.');
 const a=getUnit(s,c.a),b=getUnit(s,c.b),initiative=c.groups[c.step],stages=[];
 if(c.initiative[a.id]===initiative&&aliveCount(a)>0)stages.push(attackStage(s,a,b,random));
 if(c.initiative[b.id]===initiative&&aliveCount(b)>0)stages.push(attackStage(s,b,a,random));
 for(const stage of stages){c.stages.push(stage);c.damage[stage.to]+=stage.unsaved;}
 for(const stage of stages)removeCasualties(s,getUnit(s,stage.to),stage.unsaved);
 c.step++;if(c.step>=c.groups.length)c.phase='compare';
 return {initiative,stages,next:c.phase};
}
export function compareCombat(s){
 const c=s.combatSession;if(s.stage!=='combat'||c?.phase!=='compare')throw Error('Finish all Initiative steps first.');
 const a=getUnit(s,c.a),b=getUnit(s,c.b),scoreA=combatScore(s,a,b,c.damage[b.id]),scoreB=combatScore(s,b,a,c.damage[a.id]);breakTieWithMusician(a,b,scoreA,scoreB);
 const winner=aliveCount(a)===0&&aliveCount(b)===0?null:aliveCount(a)===0?b.id:aliveCount(b)===0?a.id:scoreA.total>scoreB.total?a.id:scoreB.total>scoreA.total?b.id:null;
 const loser=winner===a.id?b.id:winner===b.id?a.id:null,margin=Math.abs(scoreA.total-scoreB.total),outcome=aliveCount(a)===0||aliveCount(b)===0?'destroyed':winner?'await-break':'draw';
 const result={a:a.id,b:b.id,initiative:c.initiative,stages:c.stages,damage:c.damage,score:{[a.id]:scoreA,[b.id]:scoreB},winner,loser,outcome,breakDice:null,margin,round:s.round};
 a.combatResolved=b.combatResolved=true;s.lastCombat=result;(s.combatHistory??=[]).push(result);s.combatSession=null;
 if(outcome==='destroyed'){for(const dead of [a,b].filter(u=>aliveCount(u)===0)){dead.x=null;dead.y=null;dead.destroyed=true;dead.engaged=null;}if(winner)getUnit(s,winner).engaged=null;}
 else if(winner)s.pendingCombat={winner,loser,margin,stage:'break'};
 return result;
}
export function rollCombatBreak(s,random=Math.random){
 const p=s.pendingCombat;if(s.stage!=='combat'||p?.stage!=='break')throw Error('Compare combat results before the Break test.');
 const loser=getUnit(s,p.loser),winner=getUnit(s,p.winner),dice=combatDice(2,random),natural=dice[0]+dice[1],ld=leadership(loser);
 p.outcome=dice[0]===1&&dice[1]===1||natural+p.margin<=ld?'give-ground':natural>ld?'break':'fall-back';p.breakDice=dice;
 p.shieldwallAvailable=p.outcome==='fall-back'&&FACTIONS[loser.faction??'chaos'].shieldwall&&!loser.shieldwallUsed&&loser.charge?.status!=='success'&&winner.charge?.status==='success';
 p.stage=p.shieldwallAvailable?'loser-choice':'retreat';s.lastCombat={...s.lastCombat,outcome:p.outcome,breakDice:dice};s.combatHistory[s.combatHistory.length-1]=s.lastCombat;
 return {dice,outcome:p.outcome,loser:p.loser,leadership:ld,shieldwallAvailable:p.shieldwallAvailable};
}
export function chooseLoserAction(s,choice){
 const p=s.pendingCombat;if(s.stage!=='combat'||p?.stage!=='loser-choice')throw Error('No loser choice is available.');
 if(!['shieldwall','fall-back'].includes(choice))throw Error('Choose Shieldwall or Fall Back in Good Order.');
 if(choice==='shieldwall'){getUnit(s,p.loser).shieldwallUsed=true;p.outcome='give-ground';s.lastCombat={...s.lastCombat,outcome:p.outcome};s.combatHistory[s.combatHistory.length-1]=s.lastCombat;}
 p.loserChoice=choice;p.stage='retreat';return {choice,outcome:p.outcome};
}
function retreatPose(s,u,enemy,distance,stopNear=true){
 const dx=u.x-enemy.x,dy=u.y-enemy.y,len=Math.hypot(dx,dy)||1,dir={x:dx/len,y:dy/len},start={x:u.x,y:u.y};let moved=0;
 for(let i=1;i<=Math.ceil(distance*20);i++){
  const d=Math.min(distance,i/20),pose={...u,x:start.x+dir.x*d,y:start.y+dir.y*d};
  if(offBoard(pose))return {moved,offBoard:true,dir};
  const obstructed=s.units.some(v=>v.x!==null&&v.id!==u.id&&v.id!==enemy.id&&gap(pose,v)<(v.team===u.team?0:1)-EPS);
  if(obstructed)break;
  Object.assign(u,{x:pose.x,y:pose.y});moved=d;
 }
 return {moved,offBoard:false,dir};
}
export function moveCombatLoser(s,random=Math.random){
 const p=s.pendingCombat;if(s.stage!=='combat'||p?.stage!=='retreat')throw Error('Resolve the Break test and any Shieldwall choice first.');
 const loser=getUnit(s,p.loser),winner=getUnit(s,p.winner);winner.engaged=null;loser.engaged=null;
 const dice=p.outcome==='give-ground'?null:combatDice(2,random),distance=p.outcome==='give-ground'?2:Math.max(1,(p.outcome==='fall-back'?Math.max(...dice):dice[0]+dice[1])-(FACTIONS[loser.faction??'chaos'].resolute?1:0));
 const retreat=retreatPose(s,loser,winner,distance);if(retreat.offBoard){loser.x=null;loser.y=null;loser.destroyed=true;}
 if(p.outcome==='break'&&loser.x!==null)loser.fleeing=true;
 Object.assign(p,{stage:'winner-choice',retreat,retreatDice:dice,fleeDistance:distance,loserDestroyed:!!retreat.offBoard});
 s.lastCombat={...s.lastCombat,loserMove:{distance:retreat.moved,dice,outcome:p.outcome,offBoard:!!retreat.offBoard}};s.combatHistory[s.combatHistory.length-1]=s.lastCombat;
 return {loser:p.loser,outcome:p.outcome,distance:retreat.moved,dice,offBoard:!!retreat.offBoard};
}
export function winnerCombat(s,choice='follow',random=Math.random){
 const p=s.pendingCombat;if(s.stage!=='combat'||p?.stage!=='winner-choice')throw Error('Move the losing regiment before the winner decides.');
 if(!['follow','restrain'].includes(choice))throw Error('Choose follow or restrain.');
 const winner=getUnit(s,p.winner),loser=getUnit(s,p.loser),out={winner:p.winner,loser:p.loser,outcome:p.outcome,choice,rolls:{},movement:{loser:p.retreat.moved},loserDestroyed:p.loserDestroyed};
 let follow=choice==='follow';if(choice==='restrain'){const dice=combatDice(2,random);out.rolls.restraint=dice;follow=dice[0]+dice[1]>leadership(winner,'restraint');out.restraintFailed=follow;}
 if(follow&&loser.x!==null){
  let advance=p.retreat.moved;
  if(p.outcome!=='give-ground'){const dice=combatDice(2,random);out.rolls.pursuit=dice;const chase=Math.max(1,dice[0]+dice[1]-(FACTIONS[winner.faction??'chaos'].resolute?1:0));out.pursuitDistance=chase;
   if(chase>=p.fleeDistance&&p.outcome==='break'){loser.x=null;loser.y=null;loser.destroyed=true;out.loserDestroyed=true;advance=0;}
   else if(chase>=p.fleeDistance&&p.outcome==='fall-back')out.caughtInGoodOrder=true;
   else advance=Math.min(chase,Math.max(0,p.retreat.moved-1));
  }
  if(advance>0){const x=winner.x,y=winner.y;winner.x+=p.retreat.dir.x*advance;winner.y+=p.retreat.dir.y*advance;
   const blocked=offBoard(winner)||s.units.some(v=>v.x!==null&&v.id!==winner.id&&v.id!==loser.id&&gap(winner,v)<1-EPS);
   if(blocked){winner.x=x;winner.y=y;out.caughtInGoodOrder=false;}else{out.movement.winner=advance;if((p.outcome==='give-ground'||out.caughtInGoodOrder)&&gap(winner,loser)<EPS){winner.engaged=loser.id;loser.engaged=winner.id;}}
  }
 }
 s.pendingCombat=null;s.lastCombat={...s.lastCombat,aftermath:out};s.combatHistory[s.combatHistory.length-1]=s.lastCombat;return out;
}
export function finishCombat(s,choice='follow',random=Math.random){
 const pending=s.pendingCombat;if(s.stage!=='combat'||!pending)throw Error('No combat outcome is waiting.');
 if(!['follow','restrain'].includes(choice))throw Error('Choose follow or restrain.');
 const winner=getUnit(s,pending.winner),loser=getUnit(s,pending.loser),out={...pending,choice,rolls:{},movement:{}};
 let follow=choice==='follow';
 if(choice==='restrain'){const dice=combatDice(2,random);out.rolls.restraint=dice;follow=dice[0]+dice[1]>leadership(winner,'restraint');out.restraintFailed=follow;}
 winner.engaged=null;loser.engaged=null;
 if(pending.outcome==='give-ground'){
  const retreat=retreatPose(s,loser,winner,2);out.movement.loser=retreat.moved;
  if(retreat.offBoard){loser.x=null;loser.y=null;loser.destroyed=true;out.loserDestroyed=true;}
  else if(follow&&retreat.moved>0){const x=winner.x,y=winner.y;winner.x+=retreat.dir.x*retreat.moved;winner.y+=retreat.dir.y*retreat.moved;const blocked=offBoard(winner)||s.units.some(v=>v.x!==null&&v.id!==winner.id&&v.id!==loser.id&&gap(winner,v)<1-EPS);if(blocked){winner.x=x;winner.y=y;}else{out.movement.winner=retreat.moved;if(gap(winner,loser)<EPS){winner.engaged=loser.id;loser.engaged=winner.id;}}}
 }else{
  const dice=combatDice(2,random);out.rolls.flee=dice;const flee=Math.max(1,(pending.outcome==='fall-back'?Math.max(...dice):dice[0]+dice[1])-(FACTIONS[loser.faction??'chaos'].resolute?1:0));const retreat=retreatPose(s,loser,winner,flee);out.movement.loser=retreat.moved;
  if(retreat.offBoard){loser.x=null;loser.y=null;loser.destroyed=true;out.loserDestroyed=true;}
  if(follow){const pursuit=combatDice(2,random);out.rolls.pursuit=pursuit;const chase=Math.max(1,pursuit[0]+pursuit[1]-(FACTIONS[winner.faction??'chaos'].resolute?1:0));if(chase>=flee&&loser.x!==null){if(pending.outcome==='break'){loser.x=null;loser.y=null;loser.destroyed=true;out.loserDestroyed=true;}else{out.caughtInGoodOrder=true;const advance=retreat.moved,oldX=winner.x,oldY=winner.y;winner.x+=retreat.dir.x*advance;winner.y+=retreat.dir.y*advance;if(offBoard(winner)||s.units.some(v=>v.x!==null&&v.id!==winner.id&&v.id!==loser.id&&gap(winner,v)<1-EPS)){winner.x=oldX;winner.y=oldY;out.caughtInGoodOrder=false;}else{out.movement.winner=advance;winner.engaged=loser.id;loser.engaged=winner.id;}}}else if(loser.x!==null){const advance=Math.min(chase,Math.max(0,retreat.moved-1)),oldX=winner.x,oldY=winner.y;winner.x+=retreat.dir.x*advance;winner.y+=retreat.dir.y*advance;if(offBoard(winner)||s.units.some(v=>v.x!==null&&v.id!==winner.id&&v.id!==loser.id&&gap(winner,v)<1-EPS)){winner.x=oldX;winner.y=oldY;}else out.movement.winner=advance;}}
  if(pending.outcome==='break'&&loser.x!==null)loser.fleeing=true;
 }
 s.pendingCombat=null;s.lastCombat={...s.lastCombat,aftermath:out};s.combatHistory[s.combatHistory.length-1]=s.lastCombat;return out;
}
