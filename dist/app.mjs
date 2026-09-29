import * as G from './game.mjs';
const $=id=>document.getElementById(id),S=15,NS='http://www.w3.org/2000/svg';
const title=s=>s[0].toUpperCase()+s.slice(1),fmt=n=>Number(n.toFixed(2)).toString();
let state=G.createGame('empire'),mode='advance',kind='advance',distance=3,angle=15,rolls=[],drag=null,ordersOpen=false,chargeTarget=null,shootTarget=null,rolling=false,diceHideTimer=null,manualOrders=null,ordersDrag=null,chargeEligibleIds=new Set();
const armyName=team=>G.armyName(team,state);
function svg(tag,attrs,parent,text){const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text!==undefined)e.textContent=text;parent.append(e);return e;}
function currentOrder(){return {kind,mode:kind==='pivot'?'advance':mode,distance:kind==='pivot'?0:distance,angle:kind==='advance'?0:angle};}
function resetOrder(){const u=G.getUnit(state);mode=u?.movementMode??'advance';kind='advance';distance=(u?.spent??0)>0?0:G.movementRemaining(u,mode);angle=15;}
function notify(text,error=false){$('notice').textContent=text;$('notice').classList.toggle('error',error);$('battleHint').textContent=text;$('battleHint').classList.toggle('error',error);}
function safely(fn){try{fn();render();return true;}catch(e){notify(e.message,true);$('orderFeedback').textContent=e.message;return false;}}
function actionCandidates(){
 if(state.stage==='movement'&&state.movementStep==='declare')return state.units.filter(u=>u.team===state.team&&G.canAct(state,u)&&G.availableCharges(state,u).length);
 if(state.stage==='movement'&&state.movementStep==='charges')return state.units.filter(u=>u.team===state.team&&u.charge?.status==='declared');
 if(state.stage==='movement')return state.units.filter(u=>G.canAct(state,u));
 if(state.stage==='shooting')return G.availableShots(state);
 if(state.stage==='combat')return G.combatPairs(state).map(pair=>G.getUnit(state,pair.find(id=>G.getUnit(state,id).team===state.team)??pair[0]));
 return [];
}
function advanceSelection(fromId){
 const candidates=actionCandidates().filter(u=>u.x!==null).sort((a,b)=>a.x-b.x||a.id.localeCompare(b.id));
 if(!candidates.length){ordersOpen=false;return false;}
 const from=G.getUnit(state,fromId),next=candidates.find(u=>u.x>(from?.x??-Infinity)+.001||(Math.abs(u.x-(from?.x??-Infinity))<=.001&&u.id>fromId))??candidates[0];
 state.selected=next.id;chargeTarget=null;shootTarget=null;ordersOpen=true;resetOrder();return true;
}
function select(id,open=true){const current=G.getUnit(state),target=G.getUnit(state,id);if(state.stage==='movement'&&state.movementStep==='declare'&&ordersOpen&&current?.team===state.team&&target?.team!==state.team){chargeTarget=id;render();return;}if(state.stage==='shooting'&&ordersOpen&&G.canShoot(state,current)&&target?.team!==state.team){shootTarget=id;render();return;}chargeTarget=null;shootTarget=null;const u=G.getUnit(state,id);if(!u)return;state.selected=id;resetOrder();ordersOpen=open;$('deployX').value=u.x??18;$('deployY').value=u.y??(u.team==='ash'?42:6);render();}
function doneLabel(u){if(u.destroyed)return 'DESTROYED';if(u.fleeing)return 'FLEEING';if(u.engaged)return u.combatResolved&&state.stage==='combat'?'✓ FOUGHT':'⚔ ENGAGED';if(u.charge?.status==='declared')return 'CHARGE DECLARED';if(u.charge?.status==='failed')return 'CHARGE FAILED';if(state.stage==='deployment')return '20 MODELS';if(u.team!==state.team)return 'WAITING';if(state.stage==='movement'&&state.movementStep==='declare')return chargeEligibleIds.has(u.id)?'CAN CHARGE':'NO CHARGE';if(state.stage==='shooting')return u.role==='missile'?(u.shot?'✓ FIRED':'READY TO FIRE'):'NO MISSILES';if(state.stage!=='movement')return 'NO ACTIONS';return u.moved?'✓ DONE':(u.spent??0)>0?fmt(G.movementRemaining(u))+'″ LEFT':'READY';}
function drawUnit(u,layer,ghost=false){
  const w=G.size(u).w*S,h=G.size(u).h*S;
  if(ghost){const g=svg('g',{transform:`translate(${u.x*S} ${u.y*S}) rotate(${G.heading(u)})`,class:'ghost-unit'},layer);svg('rect',{x:-w/2,y:-h/2,width:w,height:h,class:'ghost'},g);svg('path',{d:`M${-w/2} ${-h/2}h${w}`,class:'preview-heading'},g);return g;}
  const done=G.phaseComplete(state,u),waiting=state.stage!=='deployment'&&u.team!==state.team,color=G.FACTIONS[u.faction].bright,chargeStep=state.stage==='movement'&&state.movementStep==='declare',declared=u.charge?.status==='declared',chargeDim=state.stage==='movement'&&state.movementStep!=='remaining'&&u.team===state.team&&!declared&&(state.movementStep==='charges'||!chargeEligibleIds.has(u.id));
  const group=svg('g',{'data-unit':u.id,tabindex:0,role:'button','aria-label':`${u.id}: ${u.name}, ${doneLabel(u)}. 20 individual models, ${G.aliveCount(u)} surviving, ${G.modelSquares(state,u).filter(m=>m.fighting).length} in fighting ranks. Click for orders.`,class:`unit army-${u.team} army-${u.faction} ${done?'done':''} ${waiting?'waiting':''} ${u.engaged?'engaged':''} ${chargeDim?'charge-ineligible':''} ${chargeStep&&chargeEligibleIds.has(u.id)?'charge-eligible':''} ${declared?'charge-declared':''}`},layer);
  const block=svg('g',{transform:`translate(${u.x*S} ${u.y*S}) rotate(${G.heading(u)})`},group);
  if(u.id===state.selected)svg('rect',{x:-w/2-5,y:-h/2-5,width:w+10,height:h+10,fill:'none',stroke:'#fff6d8','stroke-width':1.5},block);
  svg('rect',{x:-w/2,y:-h/2,width:w,height:h,fill:G.FACTIONS[u.faction].color,stroke:color,'stroke-width':1.5,class:'unit-body'},block);
  if(declared)svg('rect',{x:-w/2-4,y:-h/2-4,width:w+8,height:h+8,rx:2,class:'declared-border'},block);
  const models=G.modelSquares(state,u);
  for(const model of models){
    const cell=svg('rect',{x:model.x*S,y:model.y*S,width:model.size*S,height:model.size*S,fill:G.FACTIONS[u.faction].color,class:'model-square'+(model.fighting?' fighting':'')+(model.contact?' in-contact':'')+(model.dead?' dead':''),'data-model':model.index,'data-fighting':String(model.fighting)},block);
    const commandName=model.command==='M'?'Musician':model.command==='S'?'Standard Bearer':model.command==='C'?{chaos:'Veteran Warrior',orc:'Boss',empire:'Sergeant'}[u.faction]+' (Champion)':null;
    svg('title',{},cell,(commandName??'Warrior '+(model.index+1))+(model.dead?' · dead':'')+(model.fighting?' · fighting rank':'')+(model.contact?' · base contact':''));
    if(model.fighting&&!model.command)svg('path',{d:'M'+(model.x*S+4)+' '+(model.y*S+4)+'l'+(model.size*S-8)+' '+(model.size*S-8)+'m0 '+(-(model.size*S-8))+'l'+(-(model.size*S-8))+' '+(model.size*S-8),class:'fighting-mark'},block);
    if(model.command){const cx=(model.x+model.size/2)*S,cy=(model.y+model.size/2)*S;svg('text',{x:cx,y:cy,transform:`rotate(${-G.heading(u)} ${cx} ${cy})`,'text-anchor':'middle','dominant-baseline':'central',class:'command-letter'+(model.dead?' dead':'')},block,model.command);}
  }
  svg('path',{d:`M${-w/2} ${-h/2}h${w}`,stroke:color,'stroke-width':5,class:'unit-front'},block);
  svg('path',{d:`M0 ${-h/2-16}l-5 7h10Z`,fill:color,class:'unit-arrow'},block);
  svg('text',{x:u.engaged?G.rectangle(u).left*S-10:u.x*S,y:u.engaged?u.y*S-2:G.rectangle(u).bottom*S+16,'text-anchor':u.engaged?'end':'middle',class:'unit-number'},group,u.id);
  const box=G.rectangle(u);svg('text',{x:u.engaged?box.left*S-10:u.x*S,y:u.engaged?u.y*S+12:box.bottom*S+30,'text-anchor':u.engaged?'end':'middle',class:'unit-name'},group,doneLabel(u));
  return group;
}
function draw(){
  hideUnitTooltip();const layer=$('unitsLayer'),measure=$('measureLayer');layer.replaceChildren();measure.replaceChildren();
  state.units.filter(u=>u.x!==null).forEach(u=>drawUnit(u,layer));drawDeclaredCharges(measure);const u=G.getUnit(state);
  if(state.stage==='combat'&&u.engaged){const mate=$('unitsLayer').querySelector('[data-unit="'+u.engaged+'"]');mate?.classList.add('combat-target');}if(ordersOpen&&state.stage==='shooting'&&G.canShoot(state,u)){drawShootingArc(u,measure);return;}if(ordersOpen&&state.stage==='movement'&&state.movementStep!=='remaining'){if(u.team===state.team)drawCharge(u,measure);return;}if(!ordersOpen||!G.canAct(state,u))return;
  const order=currentOrder(),p=G.planMove(u,order),err=G.orderError(state,u,order);
  if(kind==='wheel'&&distance>0)drawUnit(p.afterWheel,measure,true).setAttribute('opacity','.4');
  const ghost=drawUnit(p.end,measure,true);if(err)ghost.querySelector('rect').classList.add('invalid');
  if(p.pivot){svg('circle',{cx:p.pivot.x*S,cy:p.pivot.y*S,r:5,class:'pivot-mark'},measure);let points=[];for(let i=0;i<=24;i++){const pose=kind==='wheel'?G.wheelPose(u,angle*i/24):{...u,heading:G.heading(u)+angle*i/24};const point=kind==='wheel'?G.corners(pose)[angle<0?1:0]:G.localPoint(pose,0,-G.size(u).h/2);points.push(`${point.x*S},${point.y*S}`);}svg('polyline',{points:points.join(' '),class:'preview-path'},measure);}
  if(distance>0&&kind!=='pivot')svg('path',{d:`M${p.afterWheel.x*S} ${p.afterWheel.y*S}L${p.end.x*S} ${p.end.y*S}`,class:'preview-path'},measure);
  const r=G.rectangle(p.end);svg('text',{x:p.end.x*S,y:r.top*S-24,'text-anchor':'middle',class:'measure-label'},measure,kind==='pivot'?`${Math.abs(angle)}° reform`:kind==='wheel'?`${Math.abs(angle)}° · ${fmt(p.cost)}″ total`:`${fmt(distance)}″`);
}
function drawDeclaredCharges(layer){
 if(state.stage!=='movement')return;
 for(const u of state.units.filter(u=>u.charge?.status==='declared'&&u.x!==null)){
  const target=G.getUnit(state,u.charge.target);if(!target||target.x===null)continue;
  const start=G.localPoint(u,0,-G.size(u).h/2),end={x:target.x,y:target.y};
  svg('path',{d:`M${start.x*S} ${start.y*S}L${end.x*S} ${end.y*S}`,class:'declared-charge-line'},layer);
  svg('text',{x:(start.x+end.x)*S/2,y:(start.y+end.y)*S/2-8,'text-anchor':'middle',class:'declared-charge-label'},layer,`${u.id} → ${target.id}`);
  $('unitsLayer').querySelector(`[data-unit="${target.id}"]`)?.classList.add('declared-target');
 }
}
function roster(team){const target=$(team+'Roster');target.replaceChildren();state.units.filter(u=>u.team===team).forEach(u=>{const b=document.createElement('button');b.className=`regiment ${u.team==='iron'?'iron-unit':''} faction-${u.faction} ${u.id===state.selected?'selected':''}`;b.setAttribute('aria-pressed',String(u.id===state.selected));b.innerHTML=`<span class="code">${u.id}</span><span>${u.name}<small>${G.aliveCount(u)} remaining · ${G.baseSize(u)} mm bases</small></span><span class="status">${u.x===null?(u.destroyed?'DESTROYED':'RESERVE'):doneLabel(u)}</span>`;b.onclick=()=>{if(u.x!==null){$('board').querySelector(`[data-unit="${u.id}"]`)?.scrollIntoView({block:'center',behavior:'smooth'});}select(u.id);};target.append(b);});}
function render(){
  const u=G.getUnit(state),deploy=state.stage==='deployment',placed=state.units.filter(u=>u.x!==null).length;
  chargeEligibleIds=new Set(state.stage==='movement'&&state.movementStep==='declare'?state.units.filter(v=>v.team===state.team&&G.canAct(state,v)&&G.availableCharges(state,v).length).map(v=>v.id):[]);
  $('stageLabel').textContent=deploy?'DEPLOYMENT':`ROUND ${state.round} / ${armyName(state.team).toUpperCase()}`;
  $('round').textContent=deploy?`${placed} / 8 PLACED`:`ROUND ${state.round}`;$('turnTitle').textContent=deploy?'Deployment':armyName(state.team);
  const current=G.PHASES.indexOf(state.stage);$('phaseTrack').innerHTML=G.PHASES.map((p,i)=>`<li class="phase-step ${i===current?'active':''}" ${i===current?'aria-current="step"':''}><span>${title(p)}</span></li>`).join('');
  $('phaseTurnLabel').textContent=deploy?'Deployment':`Round ${state.round} · ${armyName(state.team)}${state.stage==='movement'?' · '+movementStepName():''}`;
  $('opponentPicker').hidden=!deploy;$('opponentSelect').value=state.units.find(v=>v.team==='iron').faction;
  $('opponentZone').textContent=armyName('iron').toUpperCase()+' / 12″ DEPLOYMENT';$('opponentZone').setAttribute('class','zone-label '+(state.units[4].faction==='orc'?'orc-text':'iron-text'));$('board').setAttribute('aria-label','Battlefield, 72 by 48 inches. Red deploys at the bottom, '+(state.units[4].faction==='orc'?'green Orcs':'blue Empire State Troops')+' at the top.');$('opponentRosterTitle').textContent=armyName('iron').toUpperCase();$('opponentLegend').textContent=armyName('iron');$('opponentDot').className='dot '+state.units[4].faction;$('opponentRosterDot').className='dot '+state.units[4].faction;
  const moved=state.units.filter(u=>u.team===state.team&&u.moved).length;
  const declared=state.units.filter(v=>v.team===state.team&&v.charge?.status==='declared').length;
  $('turnHint').textContent=deploy?'Both armies deploy. Red takes the first turn.':state.stage==='movement'&&state.movementStep==='declare'?`${chargeEligibleIds.size} can charge · ${declared} declared. Bright blocks can declare; gold marks declared charges.`:state.stage==='movement'&&state.movementStep==='charges'?`${declared} declared charge${declared===1?'':'s'} to roll. Follow the gold lines.`:state.stage==='movement'?`${moved} of 4 regiments finished. Click a block for orders.`:state.stage==='shooting'?'Click a missile regiment to show its front arc and choose a target.':state.stage==='combat'?(state.pendingCombat?'Choose the combat aftermath.':G.combatPairs(state).length?'Click engaged regiments to resolve combat.':'All combats resolved. Advance when ready.'):`${title(state.stage)}: advance when ready.`;
  $('nextButton').textContent=deploy?'Begin battle':state.stage==='combat'?'End turn':`Next: ${title(G.PHASES[current+1])}`;$('nextButton').disabled=deploy&&placed<8;if(state.stage==='combat'&&(state.pendingCombat||G.combatPairs(state).length)){$('nextButton').textContent=state.pendingCombat?'Choose combat aftermath':'Fight all combats first';$('nextButton').disabled=true;}
  if(state.stage==='strategy'&&state.units.some(u=>u.team===state.team&&u.fleeing&&!u.rallyAttempted)){$('nextButton').textContent='Rally fleeing regiments first';$('nextButton').disabled=true;}
  if(state.stage==='movement'&&state.movementStep==='declare')$('nextButton').textContent='Finish declarations';if(state.stage==='movement'&&state.movementStep==='charges'){$('nextButton').textContent='Resolve charges first';$('nextButton').disabled=true;}$('topNextPhase').textContent=$('nextButton').textContent;$('topNextPhase').disabled=$('nextButton').disabled;
  if(state.stage==='movement'&&state.movementStep==='declare'&&state.units.some(v=>v.team===state.team&&v.faction==='orc'&&!v.charge&&G.availableCharges(state,v).length&&v.impetuousTest!==true)){$('topNextPhase').textContent='Test / declare Orc charges first';$('topNextPhase').disabled=true;$('nextButton').textContent=$('topNextPhase').textContent;$('nextButton').disabled=true;}
  $('boardAutoDeploy').hidden=!deploy;$('boardUndo').disabled=state.stage!=='movement'||!state.history.length;
  document.querySelector('.command .turn-panel').hidden=true;
  roster('ash');roster('iron');draw();renderOrders();
}
function clampInputs(){if(kind==='pivot'){mode='advance';distance=0;angle=Math.max(-180,Math.min(180,angle));return;}const u=G.getUnit(state),budget=G.movementRemaining(u,mode);if(kind==='wheel'){const max=Math.floor(2*Math.asin(Math.min(1,budget/(2*G.size(u).w)))*180/Math.PI);angle=Math.max(-max,Math.min(max,angle));}const max=Math.max(0,budget-(kind==='wheel'?G.wheelCost(angle,u):0));distance=Math.max(0,Math.min(distance,Math.floor((max+1e-8)*10)/10));}
function renderOrders(){
  $('unitOrders').hidden=!ordersOpen;if(!ordersOpen)return;
  const u=G.getUnit(state),deploy=state.stage==='deployment',active=G.canAct(state,u);
  renderMovementBar(u);$('unitBadge').textContent=u.id;$('unitName').textContent=u.name;$('unitSubtitle').textContent=`${armyName(u.team)} · ${G.aliveCount(u)} / 20 surviving · facing ${Math.round(G.heading(u))}°`;
  const p=G.profile(u),f=G.FACTIONS[u.faction],keys=['M','WS','BS','S','T','W','I','A','Ld'];$('profileTitle').textContent=u.name+' profile';$('profileSave').textContent=p.save+'+ armour';$('profileStats').replaceChildren();keys.forEach(k=>{const cell=document.createElement('td');cell.textContent=p[k];$('profileStats').append(cell);});$('profileEquipment').textContent=`${G.equipment(u)} · ${f.base} × ${f.base} mm bases · 5 files × 4 ranks`;
  $('deployControls').hidden=!deploy;$('moveControls').hidden=state.stage!=='movement'||state.movementStep!=='remaining';renderChargeControls(u);renderShootingControls(u);renderReactionControls(u);renderCombatControls(u);
  $('rallyControls').hidden=state.stage!=='strategy'||u.team!==state.team||!u.fleeing;
  $('rallyButton').disabled=!!u.rallyAttempted;
  $('rallyButton').textContent=u.rallyAttempted?'Rally attempted':`Rally · 2D6 ≤ Ld${G.leadership(u,'rally')}`;
  $('orderFeedback').textContent=deploy?'Drag this block or click in its deployment zone.':state.stage==='movement'&&state.movementStep==='declare'&&state.units.some(v=>v.charge?.target===u.id&&v.charge.reaction==='pending')?'Choose Hold or Stand & Shoot.':u.team!==state.team?`${armyName(u.team)} is waiting for its turn.`:u.fleeing?'This regiment is fleeing. Rally in your Strategy phase.':state.stage==='combat'?'Click Fight for this engagement.':state.stage==='shooting'?(u.role==='missile'?'Select a target within the highlighted front arc.':'This regiment has no missile weapon.'):state.stage!=='movement'?`No actions in ${title(state.stage)}. Advance the phase above.`:u.moved?'Movement complete. This regiment is gray until its next turn.':'';
  if(state.stage==='combat'&&u.engaged)$('orderFeedback').textContent='';else if(u.engaged)$('orderFeedback').textContent=`Engaged with ${u.engaged} · ${G.modelSquares(state,u).filter(m=>m.fighting).length} highlighted warriors in fighting ranks.`;const plan=G.planMove(u,currentOrder()),error=active?G.orderError(state,u,currentOrder()):null;
  for(const [id,value]of [['forwardKind','advance'],['wheelKind','wheel'],['pivotKind','pivot']]){$(id).setAttribute('aria-pressed',String(kind===value));$(id).disabled=!active||(value==='pivot'&&(u.spent??0)>0);}
  $('advanceMode').setAttribute('aria-pressed',String(mode==='advance'));$('marchMode').setAttribute('aria-pressed',String(mode==='march'));
  $('advanceMode').textContent=`Normal · ${p.M}″`;$('marchMode').textContent=`March · ${2*p.M}″`;
  $('advanceMode').disabled=!active||kind==='pivot'||!!u.movementMode;$('marchMode').disabled=!active||kind==='pivot'||!!u.movementMode||u.marchTest===false;
  $('angleControls').hidden=kind==='advance';$('distanceControls').hidden=kind==='pivot';
  const maxAngle=kind==='pivot'?180:Math.floor(2*Math.asin(Math.min(1,G.movementRemaining(u,mode)/(2*G.size(u).w)))*180/Math.PI);$('angle').min=-maxAngle;$('angle').max=maxAngle;$('angle').value=angle;$('angle').disabled=!active;
  $('angleLabel').textContent=angle===0?'0°':`${Math.abs(angle)}° ${angle<0?'left':'right'}`;
  const presets=kind==='pivot'?[-90,-45,45,90]:[-30,-15,15,30];document.querySelectorAll('[data-angle]').forEach((b,i)=>{b.dataset.angle=presets[i];b.textContent=`${presets[i]>0?'+':''}${presets[i]}°`;b.disabled=!active;});
  const maxDistance=Math.max(0,Math.floor((G.movementRemaining(u,mode)-(kind==='wheel'?plan.wheelCost:0)+1e-8)*10)/10);
  for(const id of ['distance','distanceNumber']){$(id).max=maxDistance;$(id).value=distance;$(id).disabled=!active;}
  $('distanceCaption').textContent=kind==='wheel'?'Advance after wheel':'Forward distance';$('distanceLabel').textContent=`${fmt(distance)}″`;
  $('movementBudget').textContent=kind==='pivot'?'Reform: uses the entire move. No advance.':`This step: ${fmt(plan.cost)}″ · ${fmt(Math.max(0,G.movementRemaining(u,mode)-plan.cost))}″ after confirming`;
  $('movementBudget').classList.toggle('invalid',!!error);
  const needsTest=active&&mode==='march'&&G.needsMarchTest(state,u)&&u.marchTest===null;$('testButton').hidden=!needsTest;$('testButton').textContent=`Roll march test · 2D6 ≤ Ld${G.leadership(u,'march')}`;
  $('moveHelp').textContent=!active?'':error??(kind==='pivot'?'Centre pivot. Formation stays 5 × 4.':kind==='wheel'?'Wheel around the marked front corner, then advance.':mode==='march'?'March preview. Confirm this step; continue with the remaining inches.':'Confirm this step, or finish movement below.');
  $('moveButton').disabled=!active||!!error;$('moveButton').textContent=kind==='pivot'?'Confirm reform':kind==='wheel'?'Confirm wheel & move':'Confirm move';
  $('holdButton').textContent='Finish movement';$('holdButton').disabled=!active;$('undoButton').disabled=state.stage!=='movement'||!state.history.length;
  positionOrders();
}

function renderMovementBar(u){
 const total=(u.movementMode??mode)==='march'?2*G.profile(u).M:G.profile(u).M,remaining=G.movementRemaining(u,u.movementMode??mode),spent=total-remaining;
 const step=state.stage==='movement'&&state.movementStep==='remaining'&&G.canAct(state,u)?G.planMove(u,currentOrder()).cost:0;
 const preview=Math.min(remaining,step);const bar=$('movementInches');bar.replaceChildren();
 bar.setAttribute('aria-label',fmt(remaining)+' of '+total+' inches remaining');bar.setAttribute('aria-valuemax',total);bar.setAttribute('aria-valuenow',remaining);
 for(let i=0;i<total;i++){
 const cell=document.createElement('span');cell.className='inch-cell';cell.title='Movement inch '+(i+1);
 const available=Math.max(0,Math.min(1,total-i-spent)),after=Math.max(0,Math.min(1,total-i-spent-preview));
 cell.style.setProperty('--available',(available*100)+'%');cell.style.setProperty('--after',(after*100)+'%');cell.textContent=(i+1)+'″';bar.append(cell);
 }
 $('movementInchesLabel').textContent=fmt(remaining)+'″ remaining / '+total+'″';
 $('movementInchesKey').textContent=u.engaged?'Engaged — no movement':u.moved?'Movement finished':step>0?'Green: left after preview · gold: planned step · gray: spent':'Each square = 1″ · partial squares show fractions';
}

function positionOrders(){
  if(!ordersOpen)return;const panel=$('unitOrders'),u=G.getUnit(state),r=$('board').querySelector(`[data-unit="${u.id}"]`)?.getBoundingClientRect();
  const toolbar=document.querySelector('.phase-ribbon').getBoundingClientRect();const minY=Math.max(8,Math.min(innerHeight*.35,toolbar.bottom+8));
  panel.style.maxHeight=Math.max(160,innerHeight-minY-10)+'px';const width=panel.offsetWidth,height=panel.offsetHeight;
  if(manualOrders){const x=Math.max(8,Math.min(innerWidth-width-8,manualOrders.x)),y=Math.max(minY,Math.min(innerHeight-height-8,manualOrders.y));panel.style.left=x+'px';panel.style.top=y+'px';manualOrders={x,y};return;}
  let x=r?r.right+14:innerWidth-width-16,y=r?r.top-30:minY+8;
  if(x+width>innerWidth-8)x=r?r.left-width-14:8;
  x=Math.max(8,Math.min(innerWidth-width-8,x));y=Math.max(minY,Math.min(innerHeight-height-8,y));panel.style.left=x+'px';panel.style.top=y+'px';
}
const ordersHandle=$('ordersDragHandle');
ordersHandle.addEventListener('pointerdown',e=>{if(e.button!==0||!ordersOpen)return;const r=$('unitOrders').getBoundingClientRect();ordersDrag={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};ordersHandle.setPointerCapture(e.pointerId);e.preventDefault();});
ordersHandle.addEventListener('pointermove',e=>{if(ordersDrag?.id!==e.pointerId)return;manualOrders={x:e.clientX-ordersDrag.dx,y:e.clientY-ordersDrag.dy};positionOrders();});
for(const event of ['pointerup','pointercancel'])ordersHandle.addEventListener(event,e=>{if(ordersDrag?.id!==e.pointerId)return;ordersDrag=null;if(ordersHandle.hasPointerCapture(e.pointerId))ordersHandle.releasePointerCapture(e.pointerId);});
ordersHandle.addEventListener('keydown',e=>{const change={ArrowLeft:[-24,0],ArrowRight:[24,0],ArrowUp:[0,-24],ArrowDown:[0,24]}[e.key];if(!change||!ordersOpen)return;e.preventDefault();const r=$('unitOrders').getBoundingClientRect();manualOrders={x:(manualOrders?.x??r.left)+change[0],y:(manualOrders?.y??r.top)+change[1]};positionOrders();});
function closeOrders(){ordersOpen=false;$('unitOrders').hidden=true;hideUnitTooltip();draw();}
function refreshPreview(){clampInputs();hideUnitTooltip();draw();renderOrders();}
function placeSelected(x,y){return safely(()=>{const id=state.selected;G.place(state,id,x,y);notify(`${id} deployed. Drag to adjust; select another reserve below, or use Quick deploy.`);const next=state.units.find(u=>u.x===null);if(next){state.selected=next.id;$('deployX').value=18;$('deployY').value=next.team==='ash'?42:6;}ordersOpen=false;});}
function showDice(dice,label){const total=dice.reduce((a,b)=>a+b,0);rolls.unshift({dice,total,label});rolls=rolls.slice(0,8);$('diceResults').replaceChildren();dice.forEach(d=>{const span=document.createElement('span');span.className='die';span.textContent=['','⚀','⚁','⚂','⚃','⚄','⚅'][d];span.setAttribute('aria-label',String(d));$('diceResults').append(span);});$('diceSummary').textContent=`${total} total · ${label}`;$('boardRoll').textContent=`${dice.join(' + ')} = ${total}`;$('rollHistory').replaceChildren();rolls.forEach(r=>{const li=document.createElement('li');li.textContent=`${r.label}: ${r.dice.join(' + ')} = ${r.total}`;$('rollHistory').append(li);});}
function nextPhase(){safely(()=>{const before=state.stage,previous=state.selected;ordersOpen=false;if(state.stage==='deployment')G.begin(state);else if(state.stage==='movement'&&state.movementStep==='declare')G.finishDeclarations(state);else G.nextPhase(state);advanceSelection(previous);resetOrder();const skipped=before==='movement'&&state.stage==='combat';notify(skipped?'No legal shots: Shooting was skipped. '+(G.combatPairs(state).length?'Select an engaged regiment to fight.':'No combats remain.'):state.stage==='combat'?G.combatPairs(state).length?'Combat: click an engaged unit and fight each clash.':'Combat: no engaged units.':state.stage==='movement'?`${movementStepName()}: ${state.movementStep==='declare'?'bright regiments can charge; gold lines mark declarations.':state.movementStep==='charges'?'follow the gold lines and roll each charge.':'click a regiment to move. Gray means finished.'}`:`${armyName(state.team)} · ${title(state.stage)}. Advance when ready.`);});}
$('nextButton').onclick=nextPhase;$('topNextPhase').onclick=nextPhase;
function autoDeploy(){safely(()=>{G.autoDeploy(state);ordersOpen=false;notify('All eight regiments deployed. Drag any block to adjust it, or begin battle above.');});}
$('autoButton').onclick=autoDeploy;$('boardAutoDeploy').onclick=autoDeploy;
$('placeButton').onclick=()=>placeSelected(Number($('deployX').value),Number($('deployY').value));
$('closeOrders').onclick=closeOrders;
for(const [id,value]of [['forwardKind','advance'],['wheelKind','wheel'],['pivotKind','pivot']])$(id).onclick=()=>{kind=value;if(kind==='advance')distance=G.profile(G.getUnit(state)).M*(mode==='march'?2:1);else if(kind==='wheel'){angle=15;distance=0;}else{angle=90;distance=0;mode='advance';}refreshPreview();};
$('advanceMode').onclick=()=>{mode='advance';refreshPreview();};$('marchMode').onclick=()=>{mode='march';if(kind==='advance')distance=2*G.profile(G.getUnit(state)).M;refreshPreview();};
for(const id of ['distance','distanceNumber'])$(id).oninput=e=>{distance=Number(e.target.value);refreshPreview();};
$('angle').oninput=e=>{angle=Number(e.target.value);refreshPreview();};
document.querySelectorAll('[data-angle]').forEach(b=>b.onclick=()=>{angle=Number(b.dataset.angle);refreshPreview();});
$('moveButton').onclick=()=>safely(()=>{const id=state.selected;const plan=G.commitOrder(state,id,currentOrder()),u=G.getUnit(state,id);notify(id+' spent '+fmt(plan.cost)+'″. '+(u.moved?'Movement complete.':fmt(G.movementRemaining(u))+'″ remaining — continue moving or finish.'));if(u.moved)advanceSelection(id);else resetOrder();});
$('holdButton').onclick=()=>safely(()=>{const id=state.selected;G.hold(state,id);notify(`${id} finished movement.`);advanceSelection(id);});
function undo(){safely(()=>{G.undo(state);resetOrder();ordersOpen=true;notify('Move undone. Any march-test result still stands.');});}
$('undoButton').onclick=undo;$('boardUndo').onclick=undo;
$('testButton').onclick=async()=>{if(rolling)return;const id=state.selected;try{const dice=await animatedRoll(2,id+' · March Leadership test');safely(()=>{const pass=G.marchTest(state,id,dice);showDice(dice,id+' march: '+(pass?'passed':'failed'));if(!pass){mode='advance';clampInputs();}notify(id+': '+dice.join(' + ')+'. March test '+(pass?'passed':'failed; normal movement remains available')+'.',!pass);});}catch(e){notify(e.message,true);}};
$('rollButton').onclick=()=>freeRoll(Number($('diceCount').value));
$('boardDice').onclick=()=>freeRoll(2);
function point(e){const p=$('board').createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform($('board').getScreenCTM().inverse());return {x:q.x/S,y:q.y/S};}
$('board').addEventListener('pointerdown',e=>{
  if(e.button!==0)return;const g=e.target.closest('[data-unit]'),p=point(e);hideUnitTooltip();
  if(g){const id=g.dataset.unit;select(id,state.stage!=='deployment');if(state.stage==='deployment'){const u=G.getUnit(state);drag={id,dx:p.x-u.x,dy:p.y-u.y,startX:e.clientX,startY:e.clientY,moving:false,pointerId:e.pointerId};$('board').setPointerCapture(e.pointerId);}}
  else if(state.stage==='deployment'){closeOrders();placeSelected(p.x,p.y);}else closeOrders();
});
$('board').addEventListener('pointermove',e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>4)drag.moving=true;if(!drag.moving)return;const p=point(e),u=G.getUnit(state,drag.id);drag.x=Math.round((p.x-drag.dx)*2)/2;drag.y=Math.round((p.y-drag.dy)*2)/2;$('ghostLayer').replaceChildren();const ghost=drawUnit({...u,x:drag.x,y:drag.y},$('ghostLayer'),true);if(G.checkPosition(state,u,drag.x,drag.y,true))ghost.querySelector('rect').classList.add('invalid');});
function endDrag(e,cancel=false){if(!drag)return;const d=drag;drag=null;$('ghostLayer').replaceChildren();if($('board').hasPointerCapture(d.pointerId))$('board').releasePointerCapture(d.pointerId);if(cancel)return;if(d.moving)safely(()=>{G.place(state,d.id,d.x,d.y);$('deployX').value=d.x;$('deployY').value=d.y;notify(`${d.id} repositioned.`);});else{ordersOpen=true;renderOrders();}}
$('board').addEventListener('pointerup',e=>endDrag(e));$('board').addEventListener('pointercancel',e=>endDrag(e,true));
$('rulesButton').onclick=()=>$('rulesDialog').showModal();$('closeRules').onclick=()=>$('rulesDialog').close();$('resetButton').onclick=()=>$('resetDialog').showModal();$('cancelReset').onclick=()=>$('resetDialog').close();
$('confirmReset').onclick=()=>{$('diceAnimation').hidden=true;chargeTarget=null;shootTarget=null;manualOrders=null;state=G.createGame($('opponentSelect').value);rolls=[];ordersOpen=false;resetOrder();$('diceResults').innerHTML='<span class="empty-die">?</span><span class="empty-die">?</span>';$('diceSummary').textContent='';$('boardRoll').textContent='';$('rollHistory').innerHTML='<li>No rolls yet.</li>';$('resetDialog').close();render();notify('Choose an opponent, then place the regiments or use Quick deploy.');};
$('opponentSelect').onchange=()=>safely(()=>{G.setOpponent(state,$('opponentSelect').value);ordersOpen=false;state.selected='A1';resetOrder();notify('Opponent selected: '+armyName('iron')+'. Place the regiments or use Quick deploy.');});
function hideUnitTooltip(){const tip=$('unitTooltip');tip.hidden=true;document.querySelectorAll('[data-unit][aria-describedby]').forEach(e=>e.removeAttribute('aria-describedby'));}
function showUnitTooltip(group){if(!group||drag||ordersOpen)return;const u=G.getUnit(state,group.dataset.unit);if(!u)return;const tip=$('unitTooltip'),keys=['M','WS','BS','S','T','W','I','A','Ld'],p=G.profile(u),f=G.FACTIONS[u.faction];tip.innerHTML=`<div class="tooltip-title">${u.name}</div><div class="tooltip-meta">${u.id} · ${armyName(u.team)} · ${G.aliveCount(u)} / 20 surviving · ${doneLabel(u)}</div><table aria-label="Unit characteristics"><thead><tr>${keys.map(k=>'<th scope="col">'+k+'</th>').join('')}</tr></thead><tbody><tr>${keys.map(k=>'<td>'+p[k]+'</td>').join('')}</tr></tbody></table><p><b>Armour: ${p.save}+</b> · ${G.equipment(u)}<br>${f.base} × ${f.base} mm bases · 5 files × 4 ranks<br>Click for orders.</p>`;tip.hidden=false;group.setAttribute('aria-describedby','unitTooltip');const bounds=group.getBoundingClientRect(),box=tip.getBoundingClientRect();const left=Math.max(8,Math.min(innerWidth-box.width-8,bounds.left+bounds.width/2-box.width/2));let top=bounds.top-box.height-12;if(top<8)top=bounds.bottom+12;tip.style.left=left+'px';tip.style.top=Math.max(8,Math.min(innerHeight-box.height-8,top))+'px';}
$('board').addEventListener('pointerover',e=>{if(e.pointerType==='mouse')showUnitTooltip(e.target.closest('[data-unit]'));});
$('board').addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const group=e.target.closest('[data-unit]');if(group&&!drag)showUnitTooltip(group);else hideUnitTooltip();});
$('board').addEventListener('pointerleave',hideUnitTooltip);$('board').addEventListener('focusin',e=>showUnitTooltip(e.target.closest('[data-unit]')));$('board').addEventListener('focusout',hideUnitTooltip);
$('board').addEventListener('keydown',e=>{const g=e.target.closest('[data-unit]');if(!g)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();select(g.dataset.unit);$('closeOrders').focus({preventScroll:true});}});
document.addEventListener('pointerdown',e=>{if(e.target.closest('#unitOrders')||e.target.closest('#board'))return;hideUnitTooltip();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeOrders();hideUnitTooltip();}});
window.addEventListener('scroll',()=>{hideUnitTooltip();positionOrders();},{passive:true});window.addEventListener('resize',()=>{hideUnitTooltip();positionOrders();});
new ResizeObserver(()=>{const width=$('board').getBoundingClientRect().width;$('screenScale').textContent=`Scale: 1″ = ${(width/72).toFixed(1)} screen px`;positionOrders();}).observe($('board'));


function renderCombatControls(u){
 const panel=$('combatControls'),pair=u.engaged?G.getUnit(state,u.engaged):null,session=state.combatSession,pending=state.pendingCombat,combat=[...(state.combatHistory??[])].reverse().find(c=>c.a===u.id||c.b===u.id),inSession=session&&[session.a,session.b].includes(u.id),inPending=pending&&[pending.winner,pending.loser].includes(u.id);
 panel.hidden=state.stage!=='combat'||(!pair&&!combat&&!inSession&&!inPending);if(panel.hidden)return;
 const current=inSession?session:combat;$('combatPair').textContent=current?current.a+' vs '+current.b:pair?u.id+' vs '+pair.id:'';
 const active=!!pair&&!u.combatResolved&&!session&&!pending,control=inSession||inPending||active;
 $('fightButton').hidden=!control||pending?.stage==='loser-choice'||pending?.stage==='winner-choice';$('fightButton').disabled=!control;
 $('fightButton').textContent=inSession?session.phase==='attacks'?`Roll I${session.groups[session.step]} attacks · ${Object.entries(session.initiative).filter(([,v])=>v===session.groups[session.step]).map(([id])=>id).join(' + ')}`:'Compare combat result':pending?.stage==='break'?`Roll Break test · ${pending.loser}`:pending?.stage==='retreat'?`Move ${pending.loser} · ${pending.outcome.replace('-',' ')}`:'Show Initiative order';
 $('combatLoserChoice').hidden=!inPending||pending.stage!=='loser-choice';$('combatAftermath').hidden=!inPending||pending.stage!=='winner-choice';
 const report=$('combatReport');report.replaceChildren();const source=inSession?session:combat;
 if(source&&[source.a,source.b].includes(u.id)){
  const lines=[];if(source.initiative){const sorted=Object.entries(source.initiative).sort((a,b)=>b[1]-a[1]);lines.push('INITIATIVE · '+sorted.map(([id,i])=>id+' I'+i).join(' → ')+(sorted[0][1]===sorted[1][1]?' · simultaneous':''));}
  lines.push(...source.stages.map(v=>v.from+' (I'+v.initiative+'): '+v.attacks+' attacks · hit '+v.toHit+'+ ('+v.hits+') · wound '+v.toWound+'+ ('+v.wounds+') · save '+v.toSave+'+ ('+v.saved+') · '+v.unsaved+' slain'+(v.dice.reroll?.length?' · '+v.dice.reroll.length+' Choppa rerolls':'')));
  if(source.score)lines.push(...Object.entries(source.score).map(([id,sc])=>id+' result '+sc.total+' = '+sc.wounds+' wounds + '+sc.ranks+' ranks + '+sc.closeOrder+' Close Order + '+sc.flank+' flank/rear + '+sc.massed+' Massed Infantry + '+sc.standard+' Standard + '+sc.musician+' Musician'),source.winner?source.winner+' wins by '+source.margin:'Draw — both hold');
  if(source.breakDice)lines.push('Break test: '+source.breakDice.join(' + ')+' · '+source.loser+' '+source.outcome.replace('-',' '));
  if(source.loserMove)lines.push(source.loser+' moves back '+fmt(source.loserMove.distance)+'″');
  if(source.aftermath)lines.push(source.winner+' chooses '+source.aftermath.choice+(source.aftermath.loserDestroyed?' · defeated unit destroyed':''));
  lines.forEach(line=>{const p=document.createElement('p');p.textContent=line;report.append(p);});
 }
 $('combatSummary').textContent=inSession?session.phase==='attacks'?'Higher Initiative fights first. Roll this tier, then continue.':'All attacks made. Compare the combat results.':inPending?pending.stage==='break'?'The loser must take a Break test.':pending.stage==='loser-choice'?'The loser may use Shieldwall or Fall Back in Good Order.':pending.stage==='retreat'?'Move the losing regiment before the winner decides.':`Loser moved. ${pending.winner} chooses follow up / pursuit or restraint.`:active?u.id+' has '+G.modelSquares(state,u).filter(m=>m.fighting).length+' fighting models · '+G.aliveCount(u)+' surviving.':combat?.aftermath?'Combat resolved.':u.combatResolved?'Fight complete.':'';
}
$('fightButton').onclick=async()=>{
 if(rolling)return;try{
  if(state.pendingCombat?.stage==='break'){const r=G.rollCombatBreak(state);await animatedRoll(2,r.loser+' · Break test',r.dice);showDice(r.dice,r.loser+' Break test');notify(r.loser+' '+r.outcome.replace('-',' ')+'.');}
  else if(state.pendingCombat?.stage==='retreat'){const r=G.moveCombatLoser(state);if(r.dice)await animatedRoll(2,r.loser+' · retreat',r.dice);notify(r.loser+' moves back '+fmt(r.distance)+'″. Winner chooses next.');}
  else if(state.combatSession?.phase==='attacks'){const r=G.fightCombatStep(state);for(const stage of r.stages){if(stage.dice.hit.length){await animatedRoll(stage.dice.hit.length,stage.from+' · I'+r.initiative+' attacks',stage.dice.hit);showDice(stage.dice.hit,stage.from+' attacks');}}notify(r.stages.map(v=>v.from+' inflicts '+v.unsaved+' casualty'+(v.unsaved===1?'':'ies')).join(' · ')||'No attacks in this Initiative tier.');}
  else if(state.combatSession?.phase==='compare'){const id=state.selected,r=G.compareCombat(state);if(!state.pendingCombat)advanceSelection(id);notify(r.winner?r.winner+' wins by '+r.margin+'. Roll the loser’s Break test.':'Combat drawn. Both sides hold.');}
  else{const r=G.beginCombat(state,state.selected);notify('Initiative: '+Object.entries(r.initiative).sort((a,b)=>b[1]-a[1]).map(([id,i])=>id+' I'+i).join(' → ')+'.');}
  render();
 }catch(e){notify(e.message,true);}
};
function loserAction(choice){try{const r=G.chooseLoserAction(state,choice);render();notify(r.choice==='shieldwall'?'Shieldwall: loser Gives Ground.':'Loser Falls Back in Good Order.');}catch(e){notify(e.message,true);}}
$('combatShieldwall').onclick=()=>loserAction('shieldwall');$('combatFallBack').onclick=()=>loserAction('fall-back');
async function combatAfter(choice){if(rolling)return;try{const id=state.selected,out=G.winnerCombat(state,choice);const dice=out.rolls.restraint??out.rolls.pursuit;if(dice)await animatedRoll(2,'Winner · '+choice,dice);advanceSelection(id);render();notify(out.winner+' '+(out.choice==='follow'?'follows up / pursues.':out.restraintFailed?'fails to restrain and follows.':'restrains.')+(out.loserDestroyed?' Losing unit destroyed.':''));}catch(e){notify(e.message,true);}}
$('combatFollow').onclick=()=>combatAfter('follow');$('combatRestrain').onclick=()=>combatAfter('restrain');
$('rallyButton').onclick=async()=>{if(rolling)return;try{const id=state.selected,ld=G.leadership(G.getUnit(state,id),'rally'),result=G.rally(state,id);await animatedRoll(2,'Rally · Leadership '+ld,result.dice);showDice(result.dice,'Rally '+result.id);render();notify(result.id+(result.success?' rallies and can act normally this turn, except charging.':' fails to rally and continues fleeing.'));}catch(e){notify(e.message,true);}};

function movementStepName(){return {declare:'Declare Charges',charges:'Charge Moves',remaining:'Remaining Moves'}[state.movementStep]??'Remaining Moves';}
function drawShootingArc(u,layer){
 const weapon=G.missileWeapon(u),{w,h}=G.size(u),poly=range=>[[-w/2,-h/2],[-w/2-range,-h/2-range],[w/2+range,-h/2-range],[w/2,-h/2]].map(([x,y])=>G.localPoint(u,x,y)).map(p=>`${p.x*S},${p.y*S}`).join(' ');
 svg('polygon',{points:poly(weapon.range),class:'shooting-arc far-arc'},layer);svg('polygon',{points:poly(weapon.range/2),class:'shooting-arc close-arc'},layer);
 const mid=G.localPoint(u,0,-h/2-weapon.range/2),end=G.localPoint(u,0,-h/2-weapon.range);
 svg('text',{x:mid.x*S,y:mid.y*S-6,'text-anchor':'middle',class:'measure-label arc-label'},layer,`${weapon.range/2}″ · 50% / CLOSE`);
 svg('text',{x:end.x*S,y:end.y*S-6,'text-anchor':'middle',class:'measure-label arc-label'},layer,`${weapon.range}″ · MAX / FAR`);
 for(const {unit,plan} of G.shootingTargets(state,u)){const group=$('unitsLayer').querySelector(`[data-unit="${unit.id}"]`);if(!plan.error)group?.classList.add('shooting-target');if(unit.id===shootTarget)group?.classList.add('chosen-shoot-target');}
}
function renderShootingControls(u){
 const panel=$('shootingControls'),active=G.canShoot(state,u);panel.hidden=state.stage!=='shooting'||u.team!==state.team||u.role!=='missile';if(panel.hidden)return;
 const weapon=G.missileWeapon(u);$('shootingHelp').textContent=`${weapon.name} · ${weapon.range}″ range · ${weapon.range/2}″ close / 50% · ${weapon.strength} Strength · AP −${weapon.ap}. ${weapon.multiple?'D3 shots per model; Volley Fire. ':''}Click a highlighted enemy on the board.`;
 const targets=G.shootingTargets(state,u);$('shootingTargets').replaceChildren();for(const {unit,plan} of targets){const b=document.createElement('button');b.className='charge-choice';b.textContent=unit.id+' · '+unit.name+' · '+(plan.error??`${fmt(plan.distance)}″ ${plan.band} · ${plan.shooters} firing models`);b.disabled=!!plan.error;b.setAttribute('aria-pressed',String(shootTarget===unit.id));b.onclick=()=>{shootTarget=unit.id;render();};$('shootingTargets').append(b);}
 const t=G.getUnit(state,shootTarget),plan=t?G.shootingPlan(state,u,t):null;
 $('shootingPreview').textContent=plan?.error??(plan?`${plan.band.toUpperCase()} RANGE · ${plan.shooters} shooters${plan.band==='mixed'?` (${plan.closeShooters} close / ${plan.farShooters} far)`:''} · hit ${plan.hitLabel} (${plan.modifiers.map(m=>`${m.label} ${m.value<0?m.value:'0'}`).join(', ')||'no modifiers'}; per-model BS/range) · wound against T${G.profile(t).T}: ${Math.max(2,Math.min(6,4+G.profile(t).T-weapon.strength))}+`:'Select a target to inspect its range and modifiers.');
 $('shootButton').disabled=!active||!plan||!!plan.error;$('shootHold').disabled=!active;
 const report=state.lastShooting;$('shootingReport').textContent=report?.from===u.id?`${report.from} → ${report.to}: ${report.shots} shots · ${report.hits} hits · ${report.wounds} wounds · ${report.unsaved} slain.`:'';
}
function renderReactionControls(u){const pending=state.units.find(v=>v.charge?.status==='declared'&&v.charge.target===u.id&&v.charge.reaction==='pending'),panel=$('reactionControls');panel.hidden=!pending;if(!pending)return;const plan=G.shootingPlan(state,u,pending,{reaction:true});$('reactionHelp').textContent=`${pending.id} charges ${u.id}. ${u.name} may Hold or Stand & Shoot. Gap ${fmt(G.gap(u,pending))}″ ≥ charger M${G.profile(pending).M}″. ${plan.shooters} models fire; hit ${plan.hitLabel} (${plan.modifiers.map(m=>`${m.label} ${m.value<0?m.value:'0'}`).join(', ')}). Long-range penalty does not apply.`;panel.dataset.charger=pending.id;}
async function animateVolley(report,label){for(const [step,values] of [['D3 shots',report.dice.shots],['to hit',report.dice.hit],['to wound',report.dice.wound],['armour saves',report.dice.save]]){if(!values.length)continue;const visible=values.slice(0,20);await animatedRoll(visible.length,`${label} · ${step}${values.length>20?` · first 20 of ${values.length}`:''}`,visible);showDice(visible,`${label} · ${step}${values.length>20?` (${values.length} total)`:''}`);}}
$('shootButton').onclick=async()=>{if(rolling)return;try{const id=state.selected,target=shootTarget,report=G.shoot(state,id,target);await animateVolley(report,id+' · '+report.weapon.name);advanceSelection(id);render();notify(`${id} → ${target}: ${report.shots} shots, ${report.hits} hits, ${report.wounds} wounds, ${report.unsaved} slain.`);}catch(e){notify(e.message,true);}};
$('shootHold').onclick=()=>safely(()=>{const id=state.selected;G.finishShooting(state,id);advanceSelection(id);notify(id+' finishes the Shooting phase without firing.');});
async function react(choice){if(rolling)return;try{const id=$('reactionControls').dataset.charger,result=G.chargeReaction(state,id,choice);if(result.report)await animateVolley(result.report,result.defender+' · Stand & Shoot');advanceSelection(result.charger);render();notify(choice==='hold'?result.defender+' Holds.':`${result.defender} Stands & Shoots: ${result.report.unsaved} slain${result.stopped?' — charge stopped.':''}.`);}catch(e){notify(e.message,true);}}
$('reactionHold').onclick=()=>react('hold');$('reactionStand').onclick=()=>react('stand-shoot');
function drawCharge(u,layer){
 const id=u.charge?.target??chargeTarget,t=G.getUnit(state,id);if(!t)return;const p=G.chargePlan(state,u,t);
 svg('path',{d:'M'+u.x*S+' '+u.y*S+'L'+t.x*S+' '+t.y*S,class:'charge-line'},layer);
 const group=$('unitsLayer').querySelector('[data-unit="'+t.id+'"]');group?.classList.add('charge-target');
 if(p.end&&!p.error){if(Math.abs(p.alignAngle)>1)drawUnit(p.contact,layer,true);drawUnit(p.end,layer,true);svg('text',{x:(u.x+t.x)*S/2,y:(u.y+t.y)*S/2-12,'text-anchor':'middle',class:'measure-label'},layer,fmt(p.cost)+'″ · '+p.face+' · '+Math.round(p.angle)+'° wheel + '+Math.round(p.alignAngle)+'° free align');}
}
function renderChargeControls(u){
 const show=state.stage==='movement'&&state.movementStep!=='remaining'&&u.team===state.team;
 $('chargeControls').hidden=!show;if(!show)return;
 $('chargeStep').textContent=movementStepName();const declared=u.charge?.status==='declared',available=G.canAct(state,u),resolving=state.movementStep==='charges';
 $('chargeHelp').textContent=u.engaged?'This regiment is engaged.':declared?'Target '+u.charge.target+' · reaction '+u.charge.reaction+'.':resolving?'This regiment has no declared charge. Select a charger on the board.':'Click an enemy on the board, or choose below. One measured approach wheel and one free alignment wheel.';
 const impetuous=u.faction==='orc'&&!resolving&&!declared&&available&&G.availableCharges(state,u).length>0;$('impetuousButton').hidden=!impetuous||u.impetuousTest!==null;if(impetuous&&u.impetuousTest===false)$('chargeHelp').textContent='Impetuous failed: this Orc Mob must declare a charge.';else if(impetuous&&u.impetuousTest===null)$('chargeHelp').textContent='This Orc Mob can charge. Test Impetuous first; on failure it must charge.';
 $('chargeTargets').replaceChildren();
 if(!declared&&!resolving&&available)for(const t of state.units.filter(v=>v.team!==u.team)){
  const p=G.chargePlan(state,u,t),reserved=state.units.some(v=>v.id!==u.id&&v.charge?.status==='declared'&&v.charge.target===t.id),b=document.createElement('button');b.className='charge-choice';b.dataset.chargeTarget=t.id;b.setAttribute('aria-pressed',String(chargeTarget===t.id));b.textContent=t.id+' · '+(reserved?'Already targeted':p.error??(fmt(p.cost)+'″ · '+p.face));b.disabled=reserved||!!p.error;b.onclick=()=>{chargeTarget=t.id;render();};$('chargeTargets').append(b);
 }
 const t=G.getUnit(state,u.charge?.target??chargeTarget),p=t?G.chargePlan(state,u,t):null,targetReserved=!!t&&state.units.some(v=>v.id!==u.id&&v.charge?.status==='declared'&&v.charge.target===t.id);
 $('chargePreview').textContent=declared?'Declared against '+u.charge.target+' · reaction: '+u.charge.reaction:targetReserved?'That enemy is already the target of a declared charge.':p?(p.error??('Need '+fmt(p.cost)+'″ · range = '+G.profile(u).M+' + highest D6')):'Maximum charge range: '+(G.profile(u).M+6)+'″.';
 $('declareCharge').hidden=resolving||declared;$('declareCharge').disabled=!available||!p||!!p.error||targetReserved||(impetuous&&u.impetuousTest===null);
 $('cancelCharge').hidden=!declared||resolving;$('resolveCharge').hidden=!declared||!resolving;
 $('finishDeclarations').hidden=resolving;
}
$('declareCharge').onclick=()=>safely(()=>{const attacker=state.selected,target=chargeTarget,p=G.declareCharge(state,attacker,target);notify(attacker+' declares a charge on '+target+'. '+(p.reaction==='pending'?'Defender chooses Hold or Stand & Shoot.':'Defender Holds.'));if(p.reaction==='pending'){state.selected=target;chargeTarget=null;ordersOpen=true;}else advanceSelection(attacker);});
$('impetuousButton').onclick=async()=>{if(rolling)return;const id=state.selected;try{const dice=await animatedRoll(2,id+' · Impetuous test');safely(()=>{const passed=G.impetuousTest(state,id,dice);showDice(dice,id+' Impetuous');notify(passed?id+' holds discipline; charging is optional.':id+' fails Impetuous and must declare a charge.');});}catch(e){notify(e.message,true);}};
$('cancelCharge').onclick=()=>safely(()=>G.cancelCharge(state,state.selected));
$('finishDeclarations').onclick=nextPhase;
$('resolveCharge').onclick=async()=>{
 if(rolling)return;const id=state.selected;
 try{const unit=G.getUnit(state,id),first=await animatedRoll(2,id+' · Charge roll · keep highest'),plan=G.chargePlan(state,unit,G.getUnit(state,unit.charge.target)),m=G.profile(unit).M,rerolled=unit.faction==='orc'&&!plan.error&&m+Math.max(...first)<plan.cost,dice=rerolled?await animatedRoll(2,id+' · Warband charge reroll'):first;safely(()=>{const r=G.resolveCharge(state,id,dice);const label=id+' charge: '+(r.success?'SUCCESS':'FAILED');showDice(dice,label);$('diceSummary').textContent=(rerolled?'Warband reroll · ':'')+'Kept '+r.roll+' + M'+m+' = '+r.range+'″ · '+label;document.querySelectorAll('#animatedDice .animated-die').forEach((el,i)=>el.classList.toggle('kept',dice[i]===r.roll));$('diceAnimationResult').textContent=m+' + '+r.roll+' = '+r.range+'″ · '+(r.success?'CHARGE!':'Failed charge');$('boardRoll').textContent=dice.join(', ')+' → '+r.range+'″ charge';notify(id+' → '+r.target+': '+m+' + '+r.roll+' = '+r.range+'″. '+(rerolled?'Warband reroll. ':'')+(r.success?'Charge successful — engaged!':'Failed charge; moved '+fmt(r.distance)+'″.')+(state.movementStep==='remaining'?' Remaining Moves.':''));advanceSelection(id);});}catch(e){notify(e.message,true);}
};
const faces=['','⚀','⚁','⚂','⚃','⚄','⚅'];
async function animatedRoll(count,label,preset=null){
 if(rolling)throw Error('Wait for the current roll to finish.');clearTimeout(diceHideTimer);const dice=preset??G.rollD6(count);rolling=true;
 const panel=$('diceAnimation'),tray=$('animatedDice');panel.hidden=false;panel.classList.add('rolling');$('diceAnimationLabel').textContent=label;$('diceAnimationResult').textContent='Rolling…';tray.replaceChildren();
 const pieces=dice.map((d,i)=>{const el=document.createElement('span');el.className='animated-die';el.style.setProperty('--delay',(i%5)*-80+'ms');el.textContent=faces[(i%6)+1];el.setAttribute('aria-hidden','true');tray.append(el);return el;});
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;let frame=0;
 const timer=reduce?null:setInterval(()=>pieces.forEach((e,i)=>e.textContent=faces[(++frame+i)%6+1]),75);
 await new Promise(resolve=>setTimeout(resolve,reduce?100:900));if(timer)clearInterval(timer);
 pieces.forEach((e,i)=>{e.textContent=faces[dice[i]];e.setAttribute('aria-label',String(dice[i]));e.removeAttribute('aria-hidden');});
 panel.classList.remove('rolling');$('diceAnimationResult').textContent=dice.join(' + ')+' = '+dice.reduce((x,y)=>x+y,0);rolling=false;diceHideTimer=setTimeout(()=>{panel.hidden=true;},4500);
 return dice;
}
async function freeRoll(count){if(rolling)return;try{const dice=await animatedRoll(count,'Dice roller');showDice(dice,'Free roll');}catch(e){notify(e.message,true);}}
for(const event of ['click','pointerdown','keydown'])document.addEventListener(event,e=>{if(rolling){e.preventDefault();e.stopImmediatePropagation();}},true);

render();
if(document.modelContext?.registerTool){const life=new AbortController();const tools=[{name:'read_battle',description:'Read units, facing angles, phase completion and current movement state.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>JSON.parse(JSON.stringify(state))},{name:'roll_battle_dice',description:'Roll independent D6 in the dice tray and battlefield HUD. Does not perform a march test.',inputSchema:{type:'object',properties:{count:{type:'integer',minimum:1,maximum:20}},required:['count'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async input=>{if(!input||Object.keys(input).some(k=>k!=='count'))throw Error('Expected only count.');const dice=await animatedRoll(input.count,'Free roll');showDice(dice,'Free roll');return {dice,total:dice.reduce((a,b)=>a+b,0)};}}];for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:life.signal})).catch(()=>{});}catch{}}window.addEventListener('pagehide',()=>life.abort(),{once:true});}
