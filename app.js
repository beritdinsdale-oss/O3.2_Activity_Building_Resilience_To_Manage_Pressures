const crops={
  lettuce:{e:'🥬',n:'Lettuce',facts:['Cool-season crop','Water need: moderate–high','Shallow-rooted; consistent moisture matters','Heat and long days promote bolting'],group:'cool'},
  tomato:{e:'🍅',n:'Tomato',facts:['Warm-season fruiting crop','Water need: moderate','Needs substantial sun','Consistent moisture matters during flowering and fruiting'],group:'warm'},
  cucumber:{e:'🥒',n:'Cucumber',facts:['Warm-season crop','Water need: moderate–high','Needs consistent moisture','Prolonged heat can reduce flowering and fruit set'],group:'warm'},
  bean:{e:'🫘',n:'Bush bean',facts:['Warm-season crop','Water need: moderate','Water stress can reduce pod quality','Needs reliable moisture during flowering and pod fill'],group:'warm'},
  rosemary:{e:'🌿',n:'Rosemary',facts:['Perennial herb','Water need: low once established','Prefers sun and well-drained soil','Established plants have relatively low water needs'],group:'dry'}
};
const months=['may','june','july','august'];
const monthMeta={
  may:{stage:'INITIAL GARDEN',title:'Plan your initial garden',scenario:'It is mid-May. Spring has been cool and moist; nights are still cool and the soil is about 57°F. Decide what to plant now, what to reserve for warmer conditions, and how you want to manage each planting area.',next:'june',nextLabel:'Continue to June →'},
  june:{stage:'ESTABLISHING GARDEN',title:'The soil is warming and rainfall is tapering off',scenario:'It is now June. Soil has warmed and crops you reserved for later are now planted. Reassess how much irrigation each area needs and decide where mulch makes sense as the garden establishes.',next:'july',nextLabel:'Continue to July →'},
  july:{stage:'HEAT FORECAST',title:'A heat wave is forecast',scenario:'July has turned hot and dry. Several unusually hot days are expected. Reassess irrigation amount and mulch together, and decide whether any plants need temporary shade.',next:'august',nextLabel:'Continue to August →'},
  august:{stage:'MATURE GARDEN',title:'The garden is mature—and conditions are still dry',scenario:'Plants are larger and established. Fruiting crops are producing, cool-season crops may be showing heat stress, and rainfall has been limited. Reassess whether the management plan you started with still makes sense.',next:'conclusion',nextLabel:'Finish the season →'}
};
const monthConditions={
  may:[['🌡️','Soil temperature','about 57°F'],['🌙','Night temperatures','still cool'],['🌧️','Soil moisture','moist from spring rain']],
  june:[['🌱','Soil','warmed'],['🌦️','Rainfall','tapering off'],['🪴','Garden','crops establishing']],
  july:[['☀️','Weather','hot and dry'],['🔥','Forecast','several unusually hot days'],['💨','Water loss','higher during heat']],
  august:[['🍅','Garden','mature and producing'],['☀️','Weather','continued dry conditions'],['🥬','Heat risk','cool-season crops stressed']]
};
const freshCell=()=>({plant:null,planned:false,water:null,mulchMonth:null,shade:false});
const S={month:'may',tool:null,crop:null,plantTiming:null,cells:Array.from({length:12},freshCell),history:{}};

function seasonIndex(m){return months.indexOf(m)}
function isMulched(c,m){return c.mulchMonth!==null&&seasonIndex(c.mulchMonth)<=seasonIndex(m)}
function siteShade(i){const col=i%4;return {house:col===0,strong:col===1||col===2,farEast:col===3};}
function resetTemporary(){S.cells.forEach(c=>{c.shade=false})}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}

function buildMonth(id){
  const m=monthMeta[id],host=document.getElementById(id);
  const previous=seasonIndex(id)>0?months[seasonIndex(id)-1]:null;
  host.innerHTML=`<div class="paper wide season-screen">
    <header class="season-header revised-season-header">
      <div class="month-stage"><span class="month-word">${id.toUpperCase()}</span><span class="month-step">${m.stage}</span></div>
      <div class="month-story"><h2>${m.title}</h2></div>
      <div class="season-header-actions">${previous?`<button class="quiet previous-results" data-review-previous="${previous}" data-return="${id}">← Previous results</button>`:''}<button class="quiet" data-go="intro">Overview</button></div>
    </header>
    <section class="month-conditions" aria-label="This month in your garden">
      <div class="conditions-heading"><span>This month in your garden</span><p>${m.scenario}</p></div>
      <div class="condition-chips">${monthConditions[id].map(c=>`<div class="condition-chip"><span>${c[0]}</span><div><b>${c[1]}</b><small>${c[2]}</small></div></div>`).join('')}</div>
      <p class="conditions-prompt">Use these conditions to decide whether your irrigation, mulch, and heat protection still make sense.</p>
    </section>
    <div class="fixed-context"><div><b>🏠 Site</b><span>House shade reaches the west edge late in the day; the center gets the longest direct sun.</span></div><div><b>🪱 Soil</b><span>Well-drained loam. Mulch can be added to individual planting areas as the season progresses.</span></div></div>
    <div class="season-layout three-step-layout">
      <aside class="cropcolumn step-column"><section class="stepbox crops"><div class="stephead"><span>1</span><h3>${id==='may'?'Select crops':'Crop reference'}</h3></div><p>${id==='may'?'Flip a crop card, choose Plant now or Plant later, then click a garden space.':'The crop cards stay available as references while you manage the garden.'}</p><div id="cards-${id}" class="cropcards horizontal"></div></section></aside>
      <div class="mapcolumn"><section class="gardenarea"><h3 class="garden-heading">Your garden</h3>${gardenMarkup(`grid-${id}`)}
        ${id==='may'?`<div class="edit-tools"><span class="edit-label">Edit garden</span><button class="editbutton" data-tool="erase">⌫ Remove crop</button><button class="editbutton eraserbutton" data-clear="${id}"><span class="erasericon"></span> Clear garden</button></div>`:''}
        <div id="feedback-${id}" class="inline-alert" aria-live="polite"></div>
        <button class="run" data-run="${id}">▶ Check ${cap(id)} garden</button>
      </section></div>
      <aside class="managementcolumn step-column">${managementPanel(id,'design')}</aside>
    </div>
  </div>`;
}
function gardenMarkup(gridId){return `<div class="bedrow"><div class="dir westdir">← <b>W</b></div><div class="bedmiddle"><div class="dir northdir">↑ <b>N</b></div><div class="gardenframe sitegarden"><div class="house"><span>HOUSE</span><small>late-day shade</small></div><div id="${gridId}" class="grid"></div></div><div class="dir southdir">↓ <b>S</b></div></div><div class="dir eastdir"><b>E</b> →</div></div>`}
function managementPanel(month,mode){return `<section class="stepbox management-panel redesigned-management"><div class="stephead"><span>2</span><h3>Select management decisions</h3></div>
  <div class="irrigation-explainer"><b>Choose an irrigation approach</b><p>For drip, Low, Moderate, and High represent the <strong>amount of water delivered to this planting area</strong>. Imagine changing the number or flow rate of emitters. Hand watering is an alternative to drip.</p></div>
  <div class="management-group irrigation-group"><h4>Irrigation</h4><div class="water-level-grid">
    <button data-tool="drip-low"><span class="water-dot">💧</span><span><b>Low drip</b><small>less water delivered</small></span></button>
    <button data-tool="drip-medium"><span class="water-dot">💧</span><span><b>Moderate drip</b><small>middle amount</small></span></button>
    <button data-tool="drip-high"><span class="water-dot">💧</span><span><b>High drip</b><small>more water delivered</small></span></button>
    <button data-tool="hand"><span class="water-dot">✋</span><span><b>Hand water</b><small>as needed</small></span></button>
    <button data-tool="none"><span class="water-dot">○</span><span><b>No irrigation</b><small>remove current irrigation</small></span></button>
  </div><p class="group-note irrigation-note">Choose one irrigation approach, then click a planted or planned area. A new choice replaces the previous irrigation setting.</p></div>
  <div class="other-management"><h4>Other management strategies</h4><div class="tool-grid management-only" data-toolbox="${month}-${mode}">
    <button data-tool="mulch">🍂 <span><b>Organic mulch</b><small>add / remove</small></span></button><button data-tool="shade">▧ <span><b>Temporary shade</b><small>add / remove</small></span></button>
  </div></div><p class="microcopy management-tip"><b>Watch the outcome, not just the setting.</b> Mulch slows water loss; irrigation supplies new water. The same crop may need a different irrigation amount with or without mulch as weather changes.</p></section>`}
months.forEach(buildMonth);

function buildCards(month){
  const el=document.getElementById(`cards-${month}`);
  el.innerHTML=Object.entries(crops).map(([k,c])=>`<div class="cropcard" data-crop="${k}" tabindex="0" role="button" aria-label="${c.n}. Flip card for crop information."><div class="cardinner"><div class="cardfront"><span>${c.e}</span><b>${c.n}</b><small>${c.facts[0]}</small><em>Flip for details ↻</em></div><div class="cardback"><b>${c.e} ${c.n}</b>${c.facts.map(f=>`<p>${f}</p>`).join('')}${month==='may'?`<div class="card-plant-actions"><span>When will you plant it?</span><button type="button" data-plant="${k}" data-timing="now">🌱 Plant now</button><button type="button" data-plant="${k}" data-timing="later">🗓 Plant later</button></div>`:`<span class="reference-note">Reference card</span>`}</div></div></div>`).join('');
  el.querySelectorAll('.cropcard').forEach(card=>{
    card.addEventListener('click',e=>{if(!e.target.closest('[data-plant]'))card.classList.toggle('flipped')});
    card.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('button')){e.preventDefault();card.classList.toggle('flipped')}});
  });
  if(month==='may')el.querySelectorAll('[data-plant]').forEach(b=>b.addEventListener('click',e=>{
    e.stopPropagation();S.crop=b.dataset.plant;S.plantTiming=b.dataset.timing;S.tool='plant';
    document.querySelectorAll(`#${month} .cropcard`).forEach(x=>x.classList.toggle('selected',x.dataset.crop===S.crop));
    el.querySelectorAll('[data-plant]').forEach(x=>x.classList.toggle('selected',x===b));
    clearToolHighlights(month);
  }));
}

function managementIcons(c,m){const tags=[];if(c.water==='drip-low')tags.push('<span class="mgmt-tag">💧 L</span>');if(c.water==='drip-medium')tags.push('<span class="mgmt-tag">💧 M</span>');if(c.water==='drip-high')tags.push('<span class="mgmt-tag">💧 H</span>');if(c.water==='hand')tags.push('<span class="mgmt-tag">✋</span>');if(isMulched(c,m))tags.push('<span class="mgmt-tag">🍂</span>');if(c.shade)tags.push('<span class="mgmt-tag">▧</span>');return tags.join('');}
function managementText(c,m){const a=[];if(c.water)a.push(irrigationLabel(c));if(isMulched(c,m))a.push('organic mulch');if(c.shade)a.push('temporary shade');return a.length?a.join(', '):'none';}
function cellContent(c,month){if(!c.plant)return '<span class="emptyplot">+</span>';const cp=crops[c.plant],icons=managementIcons(c,month);return `<span class="plantemoji">${cp.e}</span><span class="plantname">${cp.n}</span>${c.planned?'<small class="planned-label">Planned for later</small>':''}<small class="cell-icons">${icons}</small>`}
function outcomeCellContent(c,r){
  if(!c.plant)return '';
  const cp=crops[c.plant];
  const marker=!r||r.status==='planned'?'':`<span class="plantstate ${r.status}" aria-label="${r.status==='good'?'Doing well':r.status==='watch'?'Needs attention':'Significant stress'}">${r.status==='good'?'✓':r.status==='watch'?'!':'×'}</span>`;
  return `<span class="plantemoji">${cp.e}</span><span class="plantname">${cp.n}</span>${c.planned?'<small class="planned-label">Planned for later</small>':''}${marker}<small class="outcome-management-icons" aria-label="Selected management: ${managementText(c, S.month)}">${managementIcons(c,S.month)}</small>`;
}
function renderGrid(el,month,clickable=true,vals=null,cells=S.cells){
  el.innerHTML='';cells.forEach((c,i)=>{const node=document.createElement(clickable?'button':'div');if(clickable)node.type='button';node.className='cell';if(c.planned)node.classList.add('planned-cell');node.innerHTML=vals?outcomeCellContent(c,vals[i]):cellContent(c,month);if(clickable)node.addEventListener('click',()=>applyToCell(month,i));el.appendChild(node)});
}
function draw(month){const el=document.getElementById(`grid-${month}`);if(el)renderGrid(el,month,true)}
function drawAll(){months.forEach(draw)}

function applyToCell(month,i){
  S.month=month;const c=S.cells[i];
  if(S.tool==='plant'){
    if(month!=='may'||!S.crop||!S.plantTiming)return;
    S.cells[i]={plant:S.crop,planned:S.plantTiming==='later',water:null,mulchMonth:null,shade:false};
  }else if(['drip-low','drip-medium','drip-high'].includes(S.tool)&&c.plant)c.water=S.tool;
  else if(S.tool==='hand'&&c.plant)c.water='hand';
  else if(S.tool==='none'&&c.plant)c.water=null;
  else if(S.tool==='mulch'&&c.plant)c.mulchMonth=isMulched(c,month)?null:month;
  else if(S.tool==='shade'&&c.plant)c.shade=!c.shade;
  else if(S.tool==='erase'&&month==='may')S.cells[i]=freshCell();
  drawAll();
  const outGrid=document.getElementById(`outcome-edit-grid-${month}`);if(outGrid)renderGrid(outGrid,month,true);
}
function clearToolHighlights(month){document.querySelectorAll(`#${month} [data-tool]`).forEach(b=>b.classList.remove('active'))}
function selectManagementTool(month,tool,scope){S.tool=tool;S.crop=null;S.plantTiming=null;document.querySelectorAll(`#${scope} [data-tool]`).forEach(b=>b.classList.toggle('active',b.dataset.tool===tool));if(scope===month)document.querySelectorAll(`#${month} .cropcard`).forEach(x=>x.classList.remove('selected'))}

function moistureState(c,month){
  // Illustrative root-zone water balance for this scenario. Mulch reduces loss; it never supplies water.
  const base={may:1.9,june:0.75,july:0.10,august:0.05}[month];
  let score=base;
  if(isMulched(c,month))score+=month==='may'?0.25:month==='june'?0.40:0.60;
  const irrigation={
    'drip-low':0.55,
    'drip-medium':0.78,
    'drip-high':1.35,
    'hand':0.95
  };
  if(c.water)score+=irrigation[c.water]||0;
  if(c.plant==='lettuce')score-=0.15;
  if(c.plant==='cucumber')score-=0.12;
  if(c.plant==='tomato'||c.plant==='bean')score-=0.08;
  if(c.plant==='rosemary')score+=0.20;
  if(score<0.85)return {key:'dry',label:'Dry'};
  if(score>2.45)return {key:'very-moist',label:'Very moist'};
  if(score>1.65)return {key:'moist',label:'Moist'};
  return {key:'adequate',label:'Adequate'};
}

function irrigationLabel(c){
  return {'drip-low':'low drip','drip-medium':'moderate drip','drip-high':'high drip','hand':'hand watering'}[c.water]||'no irrigation';
}

function waterMulchInsight(c,month){
  if(!c.plant||c.planned||seasonIndex(month)<1)return null;
  const mulched=isMulched(c,month),moist=moistureState(c,month),crop=crops[c.plant].n.toLowerCase();
  if(!c.water){
    return mulched
      ? `Mulch is slowing water loss around the ${crop}, but the root zone is still ${moist.label.toLowerCase()}. Mulch conserves water that is already in the soil; it does not replace irrigation.`
      : `With no irrigation and no mulch, the ${crop} root zone is ${moist.label.toLowerCase()}. Water is being used by the crop and lost from the soil surface without either a new supply or a mulch layer to slow that loss.`;
  }
  if(c.water==='hand'){
    return mulched
      ? `Hand watering plus mulch can work well when watering responds to root-zone moisture. The mulch slows evaporation, so the interval between waterings may be longer than it would be on bare soil.`
      : `Hand watering can maintain this ${crop}, but bare soil loses moisture faster. Checking the root zone matters because the same hand-watering routine may need to be repeated sooner without mulch.`;
  }
  if(moist.key==='dry'){
    return mulched
      ? `Even with mulch, ${irrigationLabel(c)} is not supplying enough water for this ${crop} under ${cap(month)} conditions. The mulch reduces loss, but the irrigation amount still has to meet crop demand.`
      : `${cap(irrigationLabel(c))} leaves this ${crop} too dry on bare soil. Without mulch, more water is lost between irrigations. You could increase irrigation, add mulch, or use both depending on root-zone moisture.`;
  }
  if(mulched){
    if(c.water==='drip-high'&&(moist.key==='moist'||moist.key==='very-moist'))return `High drip plus mulch is leaving the ${crop} root zone ${moist.label.toLowerCase()}. Because mulch slows evaporation, a lower irrigation amount may maintain similar moisture; check the soil before continuing at the higher setting.`;
    return `${cap(irrigationLabel(c))} plus mulch is maintaining ${moist.label.toLowerCase()} root-zone moisture for this ${crop}. The mulch is helping more of the applied water remain available between irrigations.`;
  }
  if(c.water==='drip-high')return `High drip is maintaining ${moist.label.toLowerCase()} moisture for this ${crop} without mulch. This design is relying on additional irrigation to offset faster water loss from bare soil; mulch could reduce that loss and may allow a lower irrigation amount.`;
  return `${cap(irrigationLabel(c))} is maintaining ${moist.label.toLowerCase()} moisture for this ${crop} on bare soil right now. Because bare soil loses water faster, this same irrigation amount is less buffered against hotter or drier conditions than it would be with mulch.`;
}

function waterMulchFeedback(month,vals,cells=S.cells){
  if(seasonIndex(month)<1)return '';
  const active=cells.map((c,i)=>({c,r:vals[i]})).filter(x=>x.c.plant&&!x.c.planned&&x.r);
  if(!active.length)return '';
  const mulched=active.filter(x=>isMulched(x.c,month));
  const bare=active.filter(x=>!isMulched(x.c,month));
  const dryMulched=mulched.filter(x=>x.r.moisture&&x.r.moisture.key==='dry').length;
  const dryBare=bare.filter(x=>x.r.moisture&&x.r.moisture.key==='dry').length;
  const highBare=bare.filter(x=>x.c.water==='drip-high'&&x.r.moisture&&x.r.moisture.key!=='dry').length;
  const moderateMulched=mulched.filter(x=>x.c.water==='drip-medium'&&x.r.moisture&&x.r.moisture.key!=='dry').length;
  let msg='Mulch slows water loss, while irrigation replaces water used by plants and lost from the soil.';
  if(dryBare>0&&dryMulched===0&&mulched.length) msg='Bare planting areas are drying faster; mulched areas are holding applied water longer under the same seasonal conditions.';
  else if(dryMulched>0) msg='Mulch is slowing water loss, but some mulched root zones are still dry—mulch cannot replace an adequate water supply.';
  else if(highBare>0&&moderateMulched>0) msg='You are maintaining moisture in two ways: some bare areas need higher water delivery, while mulch is helping other areas stay moist with a moderate amount.';
  else if(moderateMulched>0) msg='Mulch is helping some planting areas maintain moisture with moderate water delivery.';
  return `<p class="water-mulch-brief"><b>💧 + 🍂 Water + mulch:</b> ${msg}</p>`;
}

function specificCauses(c,i,month){
  const sh=siteShade(i),mulched=isMulched(c,month),moist=moistureState(c,month),neg=[];
  if(month==='may'&&!c.planned){
    if(['cucumber','bean'].includes(c.plant))neg.push({sev:2,msg:`${crops[c.plant].n} is a warm-season crop. With soil around 57°F and cool nights, planting now limits establishment. Waiting for warmer soil is the stronger choice; irrigation is not the main problem.`});
    if(c.plant==='tomato')neg.push({sev:1,msg:'These specific May conditions are cool for a tomato transplant. It may establish slowly even with appropriate irrigation; waiting for warmer soil and nights would reduce establishment stress.'});
  }
  if(month==='may'&&c.planned){
    if(mulched&&['tomato','cucumber','bean'].includes(c.plant))neg.push({sev:1,msg:`This ${crops[c.plant].n.toLowerCase()} is planned for later, but the space is already mulched. Organic mulch can slow soil warming in spring, so leaving this warm-season planting area uncovered for now may help it warm sooner.`});
    if(c.shade)neg.push({sev:1,msg:`This ${crops[c.plant].n.toLowerCase()} is not planted yet, so temporary shade is not doing useful work in this space right now.`});
    return neg;
  }

  // Water feedback is driven by estimated soil moisture, not by mulch alone.
  if(seasonIndex(month)>=1&&moist.key==='dry'&&['lettuce','tomato','bean','cucumber'].includes(c.plant)){
    const amount=irrigationLabel(c);
    const mulchText=mulched?'Mulch is slowing evaporation, but the irrigation amount still is not enough to meet crop demand.':`Without mulch, more of the soil water is being lost between irrigations.`;
    neg.push({sev:2,msg:`The root zone around this ${crops[c.plant].n.toLowerCase()} is dry under the current conditions with ${amount}. ${mulchText} Reassess irrigation amount, mulch, or both.`});
  }
  if(c.plant==='rosemary'&&c.water==='drip-high'&&seasonIndex(month)>=2)neg.push({sev:1,msg:'Established rosemary generally has lower water needs than actively producing vegetables. High drip irrigation may provide more water than it needs; a lower amount or individualized hand watering is worth considering.'});
  if(['tomato','rosemary'].includes(c.plant)&&sh.house)neg.push({sev:1,msg:`This ${crops[c.plant].n.toLowerCase()} is on the house-shaded west edge, which receives less direct sun than this crop generally prefers.`});
  if(month==='may'&&mulched&&['tomato','cucumber','bean'].includes(c.plant))neg.push({sev:1,msg:`Mulch is conserving moisture, but in this cool May scenario it can also slow soil warming around a warm-season ${crops[c.plant].n.toLowerCase()}.`});
  if((month==='may'||month==='june')&&c.shade)neg.push({sev:1,msg:`Current ${cap(month)} conditions do not call for temporary shade on this ${crops[c.plant].n.toLowerCase()}.`});

  if(month==='july'||month==='august'){
    if(c.plant==='lettuce'&&!c.shade)neg.push({sev:1,msg:`This lettuce is facing midsummer heat without temporary shade. Even when the root zone has enough moisture${sh.house?', late-day house shade only reduces part of the exposure':''}, high temperatures can promote bolting and bitter leaves. Temporary shade can reduce peak heat stress; water and mulch alone cannot prevent this response.`});
  }
  return neg;
}
function evaluateCell(c,i,month){
  if(!c.plant)return null;
  const moist=moistureState(c,month),neg=specificCauses(c,i,month);
  if(c.planned&&!neg.length)return {status:'planned',planned:true,explanation:'Reserved for later; no specific management problem is evident in this space.',moisture:moist};
  if(c.planned&&neg.length)return {status:neg.some(x=>x.sev>=2)?'bad':'watch',planned:true,explanation:neg[0].msg,moisture:moist};
  if(!neg.length)return {status:'good',planned:false,explanation:null,moisture:moist};
  const severe=neg.filter(x=>x.sev>=2).length;
  return {status:severe>=1&&neg.length>=2?'bad':'watch',planned:false,explanation:neg.map(x=>x.msg).join(' '),moisture:moist};
}
function cropLevelFeedback(month,vals,cells=S.cells){
  const groups={};vals.forEach((r,i)=>{if(!r)return;const p=cells[i].plant;(groups[p]??=[]).push({r,i})});const lines=[];
  Object.entries(groups).forEach(([p,items])=>{
    const cp=crops[p],problems=items.filter(x=>x.r.status==='watch'||x.r.status==='bad'),plannedGood=items.filter(x=>x.r.status==='planned');
    if(!problems.length){
      if(plannedGood.length===items.length)lines.push(`<p class="resultnote plannednote"><b>${cp.e} ${cp.n}</b> — Planned for later. No management change is needed in these reserved spaces right now.</p>`);
      else lines.push(`<p class="resultnote cropsummary"><span class="summaryicon goodicon">✓</span><b>${cp.e} ${cp.n}</b> — These plants are doing well.</p>`);
      return;
    }
    const by={};problems.forEach(x=>(by[x.r.explanation]??=[]).push(x));
    Object.entries(by).forEach(([msg,a])=>{const plantedCount=items.filter(x=>!x.r.planned).length;let label;if(a.length===items.length&&items.length>1)label=`${cp.n} planting areas`;else if(a.length>1)label=`${a.length} ${cp.n.toLowerCase()} planting areas`;else label=`One ${cp.n.toLowerCase()} area`;lines.push(`<p class="resultnote attention"><b>${cp.e} ${label}:</b> ${msg}</p>`)});
  });
  return lines.join('');
}

function rootZoneSummary(vals,cells=S.cells){
  const groups={};
  vals.forEach((r,i)=>{if(!r||!cells[i].plant||cells[i].planned||!r.moisture)return;const key=r.moisture.label;(groups[key]??=[]).push(crops[cells[i].plant].n)});
  const order=['Dry','Adequate','Moist','Very moist'];
  const parts=order.filter(k=>groups[k]).map(k=>`<span class="moisture-summary-item ${k.toLowerCase().replace(' ','-')}"><b>${k}:</b> ${[...new Set(groups[k])].join(', ')}</span>`);
  return parts.length?`<div class="root-zone-summary"><h3>Root-zone moisture</h3><div>${parts.join('')}</div></div>`:'';
}

function runMonth(month){
  const occupied=S.cells.filter(c=>c.plant);const alert=document.getElementById(`feedback-${month}`);
  if(!occupied.length){alert.innerHTML='<p><b>Add at least one crop before checking the garden.</b></p>';return;}alert.innerHTML='';
  const vals=S.cells.map((c,i)=>evaluateCell(c,i,month));S.history[month]={vals:vals,cells:S.cells.map(c=>({...c}))};renderOutcome(month,vals,S.cells);show(`${month}-outcome`);
}
function renderOutcome(month,vals,cells=S.cells,reviewReturn=null){
  const host=document.getElementById(`${month}-outcome`),good=vals.filter(r=>r&&r.status==='good').length,watch=vals.filter(r=>r&&r.status==='watch').length,bad=vals.filter(r=>r&&r.status==='bad').length,planned=vals.filter(r=>r&&r.status==='planned').length;
  host.innerHTML=`<div class="paper wide outcome-page"><header class="outcome-page-header"><div class="month-stage"><span class="month-word">${month.toUpperCase()}</span><span class="month-step">OUTCOMES</span></div><div><h2>Here’s what happened in your garden</h2><p>Review the outcomes and the specific causes below. You can go back with all of your choices preserved, or continue to the next month.</p></div></header>
    <section class="feedback-first"><div class="outcome-map"><div id="outcome-grid-${month}" class="grid result-outcome-grid clean-outcome-grid"></div><p class="outcome-map-note">The map shows what happened and the management choices you made. Root-zone moisture and explanations are kept outside the plots for readability.</p></div><div class="outcome-feedback"><div class="outcome-summary"><span class="statebadge good">✓</span> ${good} doing well &nbsp; <span class="statebadge watch">!</span> ${watch} needs attention &nbsp; <span class="statebadge bad">×</span> ${bad} struggling ${planned?`&nbsp; <span class="planned-chip">${planned} planned for later</span>`:''}</div>${rootZoneSummary(vals,cells)}<h3>What happened</h3>${cropLevelFeedback(month,vals,cells)}${waterMulchFeedback(month,vals,cells)}</div></section>
    <div class="outcome-actions simple-outcome-actions">${reviewReturn?`<button type="button" class="primary" data-return-current="${reviewReturn}">Return to ${cap(reviewReturn)} →</button>`:`<button type="button" class="secondary" data-full-design="${month}">← Go back and make changes</button><button type="button" class="primary" data-accept="${month}">${monthMeta[month].nextLabel}</button>`}</div>
  </div>`;
  renderGrid(document.getElementById(`outcome-grid-${month}`),month,false,vals,cells);
  const backEdit=host.querySelector('[data-full-design]');if(backEdit)backEdit.addEventListener('click',()=>show(month));
  const accept=host.querySelector('[data-accept]');if(accept)accept.addEventListener('click',()=>advance(month));
  const returnCurrent=host.querySelector('[data-return-current]');if(returnCurrent)returnCurrent.addEventListener('click',()=>show(reviewReturn));
}

function reviewPrevious(month,returnTo){
  const h=S.history[month];
  if(!h){
    const alert=document.getElementById(`feedback-${returnTo}`);
    if(alert)alert.innerHTML=`<p><b>No saved ${cap(month)} results yet.</b> Check that month's garden first.</p>`;
    return;
  }
  renderOutcome(month,h.vals,h.cells,returnTo);
  show(`${month}-outcome`);
}

function advance(month){
  const next=monthMeta[month].next;if(next==='conclusion'){buildConclusion();show('conclusion');return;}
  if(month==='may'&&next==='june')S.cells.forEach(c=>{if(c.planned)c.planned=false});
  resetTemporary();S.month=next;S.crop=null;S.plantTiming=null;S.tool=null;drawAll();show(next);
}
function clearGarden(){if(confirm('Clear the entire garden and start over?')){S.cells=Array.from({length:12},freshCell);S.history={};S.crop=null;S.plantTiming=null;S.tool=null;drawAll()}}
function buildConclusion(){const planted=S.cells.filter(c=>c.plant),byMulch={};planted.forEach(c=>{const n=crops[c.plant].n;(byMulch[c.mulchMonth||'not mulched']??=[]).push(n)});const parts=Object.entries(byMulch).map(([m,names])=>`<p><b>${m==='not mulched'?'Not mulched':`Mulched in ${cap(m)}`}:</b> ${[...new Set(names)].join(', ')}</p>`).join('');document.getElementById('seasonSummary').innerHTML=`<h3>Your season at a glance</h3><p><b>${planted.length}</b> planted areas finished the season.</p>${parts||'<p>No crops were planted.</p>'}`;loadJournalEntry()}
const JOURNAL_KEY='gardenJournal.module3.waterMulchPlan';
function journalData(){return {
  mulch:document.getElementById('journalMulch')?.value.trim()||'',
  irrigation:document.querySelector('input[name="journalIrrigation"]:checked')?.value||'',
  irrigationNotes:document.getElementById('journalIrrigationNotes')?.value.trim()||'',
  watch:document.getElementById('journalWatch')?.value.trim()||'',
  savedAt:new Date().toISOString()
}}
function saveJournalEntry(){
  const d=journalData();
  try{localStorage.setItem(JOURNAL_KEY,JSON.stringify(d));}catch(e){}
  try{window.parent.postMessage({type:'garden-journal-entry',section_id:'water',item_id:'module3-water-mulch-plan',data:d},'*');}catch(e){}
  const msg=document.getElementById('journalSaved');if(msg)msg.textContent='Saved ✓ Your water + mulch plan is recorded in this browser.';
}
function loadJournalEntry(){
  let d={};try{d=JSON.parse(localStorage.getItem(JOURNAL_KEY)||'{}')}catch(e){}
  const mulch=document.getElementById('journalMulch'),notes=document.getElementById('journalIrrigationNotes'),watch=document.getElementById('journalWatch');
  if(mulch)mulch.value=d.mulch||'';if(notes)notes.value=d.irrigationNotes||'';if(watch)watch.value=d.watch||'';
  if(d.irrigation){const r=document.querySelector(`input[name="journalIrrigation"][value="${d.irrigation}"]`);if(r)r.checked=true}
}
function resetAll(){S.month='may';S.tool=null;S.crop=null;S.plantTiming=null;S.cells=Array.from({length:12},freshCell);S.history={};drawAll();show('intro')}
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===id));window.scrollTo(0,0);if(months.includes(id)){S.month=id;draw(id)}}

months.forEach(m=>{
  buildCards(m);
  document.querySelectorAll(`#${m} [data-tool]`).forEach(b=>b.addEventListener('click',()=>selectManagementTool(m,b.dataset.tool,m)));
  document.querySelector(`[data-run="${m}"]`).addEventListener('click',()=>runMonth(m));
  const clearBtn=document.querySelector(`[data-clear="${m}"]`);if(clearBtn)clearBtn.addEventListener('click',clearGarden);
});
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.go)));
document.querySelectorAll('[data-review-previous]').forEach(b=>b.addEventListener('click',()=>reviewPrevious(b.dataset.reviewPrevious,b.dataset.return)));
document.getElementById('startNew').addEventListener('click',resetAll);
const reviewAugust=document.getElementById('reviewAugust');if(reviewAugust)reviewAugust.addEventListener('click',()=>reviewPrevious('august','conclusion'));
const journalSave=document.getElementById('saveJournal');if(journalSave)journalSave.addEventListener('click',saveJournalEntry);document.querySelectorAll('.journal-entry input,.journal-entry textarea').forEach(el=>el.addEventListener('change',saveJournalEntry));
drawAll();show('intro');
