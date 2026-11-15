import { LANES, LANE_NAMES, checkBrain, forecasts } from './brain.js';
import { GAME_VERSION, TRAPS, HEROES, UPGRADES, MAX_WARD, canBuild, createRun, buyTrap, buyUpgrade,
  waveSize, makeHero, stepHero, finishHero, finishWave, validRun } from './engine.js';
import { compare, resultsCSV, SCENARIO } from './research.js';
import { renderIsometric } from './isometric-renderer.js';
import { pointerToCell, project } from './isometric.js';
import { campaignMetrics } from './metrics.js';

const $=id=>document.getElementById(id);
const canvas=$('world'),ctx=canvas.getContext('2d',{alpha:false});
ctx.imageSmoothingEnabled=false;
const SAVE_KEY='trapscholar-v2',OLD_KEY='trapscholar-v1';
const COLORS=['#c596f5','#6de0cd','#f5b675'];
const PREF_REDUCED=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
const app={state:createRun(),selected:'spikes',phase:'build',active:null,queue:0,summary:null,delay:0,
  paused:false,speed:1,events:[],hovered:null,time:0,particles:[],floaters:[],shake:0,
  research:null,audio:false,audioContext:null,showRisk:false};

function log(message,tone='normal'){
  app.events.unshift({message:String(message).slice(0,260),tone,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})});
  app.events=app.events.slice(0,28);
  renderLog();
}
function renderLog(){
  const area=$('events');area.replaceChildren();
  for(const entry of app.events){
    const node=document.createElement('div');node.className=`event ${['good','bad'].includes(entry.tone)?entry.tone:''}`;
    const time=document.createElement('time');time.textContent=entry.time;
    const text=document.createElement('span');text.textContent=entry.message;node.append(time,text);area.append(node);
  }
  $('log-count').textContent=`${app.events.length} EVENTS`;
}
function save(){
  if(!['build','lost','won'].includes(app.phase))return;
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:GAME_VERSION,state:app.state,phase:app.phase,
    events:app.events.slice(0,20)}));}catch(_){/* Gracefully ignore storage-disabled browsers */}
}
function restore(){
  try{
    const raw=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
    if(raw?.version===2&&validRun(raw.state)){
      app.state=raw.state;
      app.phase=['build','lost','won'].includes(raw.phase)?raw.phase:'build';
      if(app.state.ward===0)app.phase='lost';
      app.events=Array.isArray(raw.events)?raw.events.slice(0,20).filter(e=>e&&typeof e.message==='string')
        .map(e=>({message:e.message.slice(0,260),tone:['good','bad'].includes(e.tone)?e.tone:'normal',time:String(e.time||'').slice(0,10)})):[];
      return 'v2';
    }
    // Import v0.1 browser snapshots non-destructively into v1.0 rules.
    const old=JSON.parse(localStorage.getItem(OLD_KEY)||'null');
    if(old?.version===1&&checkBrain(old.brain)&&Number.isInteger(old.wave)&&old.wave>0&&old.wave<=10000){
      const state=createRun();
      state.wave=old.wave;
      state.souls=Math.max(0,Math.min(100000,Number(old.souls)||0));
      state.ward=Math.max(0,Math.min(12,Number(old.ward)||0));
      state.kills=Math.max(0,Number(old.kills)||0);
      state.breaches=Math.max(0,Number(old.breaches)||0);
      state.brain=old.brain;
      for(const [pos,kind] of Object.entries(old.traps||{})){
        const xy=/^(\d+),(\d+)$/.exec(pos);
        if(xy&&canBuild(+xy[1],+xy[2])&&TRAPS[kind])state.traps[pos]=kind;
      }
      for(const kind of ['spikes','frost','bolt'])state.trapDamage[kind]=Math.max(0,Number(old.trapDamage?.[kind])||0);
      app.state=state;app.phase=state.ward<=0?'lost':'build';return 'v1';
    }
  }catch(_){/* Invalid data stays untouched for recovery */}
  return false;
}
function renderUI(){
  const s=app.state;
  $('wave').textContent=`${String(s.wave).padStart(2,'0')}${s.wave<=15?' / 15':' • ∞'}`;
  $('souls').textContent=s.souls;
  $('ward').textContent=`♥ ${s.ward} / ${MAX_WARD}`;
  $('kills').textContent=s.kills;$('breaches').textContent=s.breaches;
  $('phase-chip').textContent=({build:'BUILD PHASE',raid:'INVASION',lost:'RELIC LOST',won:'VICTORY'})[app.phase];
  $('phase-chip').style.color=app.phase==='raid'?'#ffc0b4':app.phase==='won'?'#81e1b4':'';
  $('start-btn').disabled=app.phase!=='build';
  $('start-btn').innerHTML=app.phase==='won'?'✦ VICTORY ACHIEVED':app.phase==='lost'?'✖ RELIC LOST':'▶ SEND THE HEROES <small>SPACE</small>';
  $('pause-btn').disabled=app.phase!=='raid';
  $('pause-btn').textContent=app.paused?'▶ RESUME':'Ⅱ PAUSE';$('pause-btn').setAttribute('aria-pressed',String(app.paused));
  for(const tool of document.querySelectorAll('.tool')){
    const selected=tool.dataset.tool===app.selected;
    tool.classList.toggle('selected',selected);tool.setAttribute('aria-pressed',String(selected));tool.disabled=app.phase!=='build';
  }
  for(const el of document.querySelectorAll('.upgrade')){
    const kind=el.dataset.upgrade;
    const owned=kind!=='ward'&&s.upgrades[kind];el.classList.toggle('owned',!!owned);
    el.disabled=app.phase!=='build'||!!owned||s.souls<UPGRADES[kind].cost||(kind==='ward'&&s.ward===MAX_WARD);
    el.title=owned?'Upgrade owned':UPGRADES[kind].desc;
  }
  $('kbd-place').disabled=app.phase!=='build';
  const measures = campaignMetrics(s);
  $('metric-defense').textContent = measures.defenseRate === null ? '—' : `${Math.round(100 * measures.defenseRate)}%`;
  $('metric-defense-desc').textContent = measures.resolved ? `${measures.stopped} / ${measures.resolved} stopped` : 'Waiting for battles';
  $('metric-damage').textContent = measures.damagePerHero === null ? '—' : measures.damagePerHero.toFixed(1);
  $('metric-focus').textContent = `${Math.round(100 * measures.routeConcentration)}%`;
  const f=forecasts(s.brain);$('lane-bars').replaceChildren();
  for(const item of f){
    const group=document.createElement('div');
    const info=document.createElement('div');info.className='lane-info';
    const name=document.createElement('span');name.className='lane-name';name.textContent=item.name+' ';
    const visits=document.createElement('small');visits.textContent=`${item.visits} visits`;name.append(visits);
    const percent=document.createElement('strong');percent.className='lane-percent';
    percent.textContent=item.probability<0.005?'<1%':`${Math.round(100*item.probability)}%`;
    info.append(name,percent);
    const track=document.createElement('div');track.className='track';
    const fill=document.createElement('div');fill.className='fill';fill.style.width=`${item.probability*100}%`;
    fill.style.background=`linear-gradient(90deg,${COLORS[item.index]}99,${COLORS[item.index]})`;
    track.append(fill);
    const detail=document.createElement('div');detail.className='lane-sub';
    const left=document.createElement('span');left.textContent=`Risk ${item.estimatedDamage.toFixed(1)}`;
    const right=document.createElement('span');right.textContent=`Lost ${item.deaths} · Breached ${item.breaches}`;
    detail.append(left,right);group.append(info,track,detail);$('lane-bars').append(group);
  }
  const best=f.reduce((a,b)=>a.probability>b.probability?a:b);
  $('strategy').textContent=s.brain.total?
    `The heroes favor ${best.name.toLowerCase()} (${Math.round(best.probability*100)}%). They adapt based on observed harm, while still exploring.`:
    'No raids yet. All routes begin with equal probability and an identical risk prior.';
  if(app.active){
    const h=app.active;
    $('hero-status').textContent=`⚔ ${HEROES[h.className].label} · ${LANE_NAMES[h.lane]} route · ${Math.max(0,h.hp)}/${h.maxHp} HP${h.counter?` · resistant to ${TRAPS[h.counter].label}`:''}`;
  } else $('hero-status').textContent=app.phase==='raid'?'The next invader approaches...':app.phase==='won'?'Victory! The relic has survived fifteen waves.':app.phase==='lost'?'The last ward has shattered.':'The dungeon is quiet. Place your defenses.';
  $('data-chip').textContent=s.history.length?`${s.history.length} WAVES`:'NO DATA';
  updateChart();
}
function placeAt(x,y){
  if(app.phase!=='build')return;
  const result=buyTrap(app.state,x,y,app.selected);
  if(!result.ok){if(result.reason==='Not enough souls')log('Not enough souls. Try a cheaper trap.','bad');return;}
  log(app.selected==='erase'?`Removed trap from ${LANE_NAMES[LANES.indexOf(y)]}. +${result.refund} refunded.`:
    `${TRAPS[app.selected].label} placed in ${LANE_NAMES[LANES.indexOf(y)]} corridor.`);
  renderUI();save();sfx('place');
}
function upgrade(kind){
  if(app.phase!=='build')return;
  const result=buyUpgrade(app.state,kind);
  if(!result.ok){log(result.reason,'bad');return;}
  log(`${UPGRADES[kind].label} purchased!`,'good');renderUI();save();sfx('upgrade');
}
function startRaid(){
  if(app.phase!=='build')return;
  app.phase='raid';app.paused=false;app.queue=waveSize(app.state.wave);
  app.summary={heroes:0,kills:0,breaches:0};app.delay=.25;app.active=null;
  log(`Wave ${app.state.wave}: ${app.queue} heroes challenge your dungeon!`);
  renderUI();sfx('wave');
}
function spawnHero(){
  const h=makeHero(app.state,app.summary.heroes+1);
  app.summary.heroes++;app.active=h;
  log(`${HEROES[h.className].label} enters the ${LANE_NAMES[h.lane].toLowerCase()} corridor${h.counter?` with ${TRAPS[h.counter].label} resistance`:''}.`);
}
function addFloater(x,y,label,color){
  if(PREF_REDUCED)return;
  app.floaters.push({x,y,label,color,life:.85});
  if(app.floaters.length>40)app.floaters.shift();
}
function burst(x,y,color,n=12){
  if(PREF_REDUCED)return;
  for(let i=0;i<n;i++){
    const angle=(i/n)*Math.PI*2;
    const speed=30+(i*17)%54;
    app.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-15,
      life:.45+((i*7)%9)*.05,max:.9,color,size:2+(i%3)});
  }
  if(app.particles.length>120)app.particles.splice(0,app.particles.length-120);
}
function heroFinish(survived){
  const h=app.active;if(!h)return;
  const last=h.route[Math.min(h.index,h.route.length-1)];
  const event=finishHero(app.state,h,survived);
  if(survived){
    app.summary.breaches++;
    log(`${HEROES[h.className].label} breached via ${LANE_NAMES[h.lane]}! Wards: ${app.state.ward}.`,'bad');
    addFloater(project(20,6).x,project(20,6).y-42,'−1 WARD','#ff9fa8');burst(project(20,6).x,project(20,6).y-20,'#df6a8f',18);
    sfx('breach');
  }else{
    app.summary.kills++;
    log(`${HEROES[h.className].label} fell in ${LANE_NAMES[h.lane]}! +${2+(app.state.upgrades.forge?1:0)} souls.`,'good');
    addFloater(project(last.x,last.y).x,project(last.x,last.y).y-38,'+SOULS','#8cf4bc');
    burst(project(last.x,last.y).x,project(last.x,last.y).y-20,'#bb9aff',16);sfx('defeat');
  }
  app.active=null;
  if(app.state.ward<=0){
    endWave();app.phase='lost';$('game-banner').hidden=false;
    $('game-banner').textContent=`☠ THE RELIC IS LOST — ${app.state.wave} waves attempted. Reset to try a new defense.`;
    log('THE RELIC HAS FALLEN. Try a new defense strategy.','bad');
  }else if(app.queue<=0){
    endWave();
    if(app.state.wave>=16&&app.state.history.at(-1)?.wave===15){
      app.phase='won';$('game-banner').hidden=false;
      $('game-banner').replaceChildren();
      const title=document.createElement('strong');title.textContent='✦ VICTORY — Fifteen waves survived! ';
      const more=document.createElement('button');more.className='button';more.textContent='CONTINUE ENDLESS ↗';
      more.addEventListener('click',()=>{app.phase='build';$('game-banner').hidden=true;renderUI();save();});
      $('game-banner').append(title,more);log('Victory! The dungeon survived fifteen waves!','good');sfx('victory');
    } else {app.phase='build';log(`Wave ${app.state.wave} awaits. +4 souls. Rebuild your defenses.`,'good');}
  }else app.delay=.42;
  renderUI();save();
}
function endWave(){
  finishWave(app.state,app.summary);
  app.summary=null;
}
function animate(dt){
  app.time+=dt;
  for(const particle of app.particles){particle.x+=particle.vx*dt;particle.y+=particle.vy*dt;particle.vy+=120*dt;particle.life-=dt;}
  app.particles=app.particles.filter(p=>p.life>0);
  for(const f of app.floaters){f.y-=28*dt;f.life-=dt;}
  app.floaters=app.floaters.filter(f=>f.life>0);
  app.shake=Math.max(0,app.shake-dt*2.5);
  if(app.phase!=='raid'||app.paused)return;
  const amount=dt*app.speed;
  if(!app.active){
    app.delay-=amount;
    if(app.delay<=0&&app.queue>0){app.queue--;spawnHero();renderUI();}
    return;
  }
  let h=app.active;
  const period=h.slow>0?.32:.17;
  h.progress+=amount/period;
  let steps=0;
  while(h.progress>=1&&app.active&&steps++<14){
    h.progress-=1;
    const result=stepHero(app.state,h);
    if(h.slow>0)h.slow--;
    for(const event of result.events){
      if(event.type==='hit'){
        const cell=event.cell;
        addFloater(project(cell.x,cell.y).x,project(cell.x,cell.y).y-32,`−${event.amount}`,TRAPS[event.source].color);
        burst(project(cell.x,cell.y).x,project(cell.x,cell.y).y-16,TRAPS[event.source].color,9);
        app.shake=.4;sfx('hit');
      } else if(event.amount) addFloater(project(h.route[h.index].x,h.route[h.index].y).x,project(h.route[h.index].x,h.route[h.index].y).y-26,`−${event.amount}`,'#a8e9d7');
    }
    if(result.done){heroFinish(result.survived);break;}
  }
}
function drawWorld(){
  renderIsometric(ctx,{traps:app.state.traps,hero:app.active,hovered:app.hovered,
    selected:app.selected,phase:app.phase,time:app.time,reduced:PREF_REDUCED,
    power:app.state.upgrades.power,forecast:forecasts(app.state.brain),
    particles:app.particles,floaters:app.floaters,paused:app.paused,showRisk:app.showRisk});
}
function chartLine(ctx,series,points,colors,maxY=1){
  const left=42,top=14,right=points.width-16,bottom=points.height-28;
  ctx.clearRect(0,0,points.width,points.height);
  ctx.strokeStyle='#35415a';ctx.fillStyle='#8997ae';ctx.lineWidth=1;
  ctx.font='11px ui-monospace,monospace';ctx.textAlign='right';
  for(let n=0;n<=4;n++){
    const v=n/4*maxY,y=bottom-(v/maxY)*(bottom-top);
    ctx.strokeStyle='#324056';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();
    ctx.fillText(`${Math.round(v*100)}%`,left-7,y+4);
  }
  if(!series.length){ctx.textAlign='center';ctx.fillStyle='#98a1ba';ctx.fillText('No observations yet',points.width/2,points.height/2);return;}
  const width=Math.max(1,series.length-1);
  for(let lane=0;lane<3;lane++){
    ctx.strokeStyle=colors[lane];ctx.lineWidth=3;ctx.beginPath();
    series.forEach((p,i)=>{
      const x=left+i/width*(right-left),y=bottom-p[lane]/maxY*(bottom-top);
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    });ctx.stroke();
    series.forEach((p,i)=>{
      const x=left+i/width*(right-left),y=bottom-p[lane]/maxY*(bottom-top);
      ctx.fillStyle=colors[lane];ctx.fillRect(x-2,y-2,4,4);
    });
  }
  ctx.fillStyle='#8b9ab4';ctx.textAlign='center';ctx.font='10px ui-monospace,monospace';
  ctx.fillText('Completed waves →',points.width/2,points.height-7);
}
function updateChart(){
  const canvas=$('history-chart'),c=canvas.getContext('2d');
  chartLine(c,app.state.history.map(h=>h.probabilities),{width:canvas.width,height:canvas.height},COLORS);
  $('chart-note').textContent=app.state.history.length?
    `${app.state.history.length} recorded wave(s) · ${app.state.brain.total} actual hero outcomes · probabilities after each completed wave.`:
    'Finish a wave to display your first data point.';
}
function download(text,mime,filename){
  const url=URL.createObjectURL(new Blob([text],{type:mime}));const anchor=document.createElement('a');
  anchor.href=url;anchor.download=filename;document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function exportSave(){
  if(app.phase==='raid'){log('Finish the active raid before exporting a stable save.','bad');return;}
  const payload={game:'TrapScholar',format:'save-v2',exportedAt:new Date().toISOString(),state:app.state,events:app.events,phase:app.phase};
  download(JSON.stringify(payload,null,2),'application/json',`trapscholar-${app.state.seed}-wave-${app.state.wave}.json`);
  log('Saved run exported as JSON.','good');
}
function importSave(file){
  if(!file||app.phase==='raid')return;
  if(file.size>2*1024*1024){log('Save file too large (2 MB maximum).','bad');return;}
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const raw=JSON.parse(reader.result);
      if(raw.game!=='TrapScholar'||raw.format!=='save-v2'||!validRun(raw.state))throw Error('Unsupported or invalid save');
      const state=raw.state;
      if(!checkBrain(state.brain))throw Error('Invalid AI memory');
      app.state=state;app.phase=state.ward<=0?'lost':['build','won'].includes(raw.phase)?raw.phase:'build';
      app.events=Array.isArray(raw.events)?raw.events.slice(0,24).filter(e=>e&&typeof e.message==='string').map(e=>({
        message:e.message.slice(0,260),tone:['bad','good'].includes(e.tone)?e.tone:'normal',time:String(e.time||'').slice(0,10)})):[];
      $('game-banner').hidden=true;
      renderLog();log('Imported a validated saved game.','good');renderUI();save();
    }catch(err){log(`Import failed: ${err.message}`,'bad');}
  };
  reader.onerror=()=>log('Could not read save file.','bad');
  reader.readAsText(file);
}
function sfx(type){
  if(!app.audio||!app.audioContext)return;
  try{
    const audio=app.audioContext;
    const freq=({place:220,upgrade:450,wave:330,hit:125,defeat:560,breach:95,victory:700})[type]||220;
    const length=type==='victory'?.35:.12;
    const osc=audio.createOscillator(),gain=audio.createGain();
    osc.type=type==='hit'||type==='breach'?'sawtooth':'triangle';osc.frequency.value=freq;
    gain.gain.setValueAtTime(.055,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+length);
    osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+length);
  }catch(_){/* Sound never interrupts gameplay. */}
}
async function toggleSound(){
  app.audio=!app.audio;
  if(app.audio){
    try{app.audioContext??=new (window.AudioContext||window.webkitAudioContext)();await app.audioContext.resume();}
    catch(_){app.audio=false;log('Web Audio unavailable. Silent mode enabled.','bad');}
  }
  $('audio-btn').textContent=app.audio?'♫ SOUND ON':'♫ SOUND OFF';
  $('audio-btn').setAttribute('aria-pressed',String(app.audio));
  try{localStorage.setItem('trapscholar-audio',String(app.audio));}catch(_){}
  if(app.audio)sfx('upgrade');
}
function research(){
  const button=$('lab-run');button.disabled=true;button.textContent='RUNNING...';
  const seed=Number($('lab-seed').value),seeds=Number($('lab-seeds').value),rounds=Number($('lab-rounds').value);
  // Allow the UI to visibly update before a CPU-only computation.
  requestAnimationFrame(()=>setTimeout(()=>{
    try{
      if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw new Error('Seed must be 0–4294967295');
      const result=compare({seed,seeds,rounds});app.research=result;
      const a=result.groups.adaptive,u=result.groups.uniform;
      const output=$('lab-output');output.replaceChildren();
      const cards=document.createElement('div');cards.className='lab-grid';
      for(const [policy,group] of [['Adaptive heroes',a],['Uniform-route baseline',u]]){
        const card=document.createElement('article');card.className=`lab-stat ${policy.startsWith('Uniform')?'uniform':''}`;
        const h=document.createElement('h3');h.textContent=policy;
        const big=document.createElement('strong');big.textContent=group.meanDamage.toFixed(2);
        const body=document.createElement('p');body.textContent='Mean damage per hero attempt (lower means heroes learned safer routes)';
        const small=document.createElement('div');small.className='lab-sub';
        small.textContent=`Hero survival ${(100*group.meanSurvivalRate).toFixed(1)}% · South route ${(100*group.meanSouthShare).toFixed(1)}% · Sample SD ${group.sdDamage.toFixed(2)}`;
        card.append(h,big,body,small);cards.append(card);
      }
      output.append(cards);
      const paragraph=document.createElement('p');paragraph.className='chart-note';paragraph.style.marginTop='12px';
      paragraph.textContent=`${seeds} seed pairs × 2 policies · ${rounds} waves each · fixed scenario: ${SCENARIO.title}. Arena restores wards before each trial to prevent early termination; combat and route decisions use the shared engine.`;
      output.append(paragraph);
      const diff=result.difference;
      const effect=document.createElement('p');effect.className='difference-note';
      effect.textContent=`Mean damage difference (uniform − adaptive): ${diff.mean.toFixed(2)} per hero`+
        (diff.ci95 ? ` · approximate 95% interval [${diff.ci95[0].toFixed(2)}, ${diff.ci95[1].toFixed(2)}]` : ' · interval unavailable for one seed')+
        '. Positive means the adaptive heroes took less damage. Seed streams diverge between policies, so this is descriptive, not a causal estimate.';
      output.append(effect);
      const details=document.createElement('details');details.className='lab-details';
      const summary=document.createElement('summary');summary.textContent='View reproducibility details and individual seeded runs';
      const tbl=document.createElement('table');tbl.className='lab-table';
      const head=document.createElement('thead');const hr=document.createElement('tr');
      for(const label of ['Seed','Policy','Waves','Attempts','Mean damage','Survival %']){
        const th=document.createElement('th');th.textContent=label;hr.append(th);
      }head.append(hr);tbl.append(head);
      const body=document.createElement('tbody');
      for(const r of result.runs){const tr=document.createElement('tr');
        for(const val of [r.seed,r.policy,r.roundsPlayed,r.attempts,r.meanDamage.toFixed(2),(100*r.heroSurvivalRate).toFixed(1)]){const td=document.createElement('td');td.textContent=val;tr.append(td);}
        body.append(tr);
      }tbl.append(body);details.append(summary,tbl);output.append(details);
      $('lab-csv').disabled=false;
    }catch(error){$('lab-output').textContent=`Experiment error: ${error.message}`;}
    finally{button.disabled=false;button.textContent='▶ RUN EXPERIMENT';}
  },0));
}
let last=0;function frame(now){
  if(last&&now-last<1000/30){requestAnimationFrame(frame);return;}
  const dt=last?Math.min(.06,(now-last)/1000):0;last=now;
  animate(dt);drawWorld();requestAnimationFrame(frame);
}
canvas.addEventListener('pointermove',event=>{
  app.hovered=pointerToCell(event.clientX,event.clientY,canvas.getBoundingClientRect());
  canvas.style.cursor=app.phase==='build'&&app.hovered&&canBuild(app.hovered.x,app.hovered.y)?'crosshair':'default';
});
canvas.addEventListener('pointerleave',()=>{app.hovered=null;canvas.style.cursor='default';});
canvas.addEventListener('click',event=>{
  const tile=pointerToCell(event.clientX,event.clientY,canvas.getBoundingClientRect());
  if(tile)placeAt(tile.x,tile.y);
});
for(const tool of document.querySelectorAll('.tool'))tool.addEventListener('click',()=>{app.selected=tool.dataset.tool;renderUI();});
for(const el of document.querySelectorAll('.upgrade'))el.addEventListener('click',()=>upgrade(el.dataset.upgrade));
$('kbd-place').addEventListener('click',()=>placeAt(Number($('kbd-column').value),Number($('kbd-lane').value)));
$('start-btn').addEventListener('click',startRaid);
$('pause-btn').addEventListener('click',()=>{if(app.phase!=='raid')return;app.paused=!app.paused;renderUI();});
$('speed-btn').addEventListener('click',()=>{app.speed=app.speed===1?2:app.speed===2?4:1;$('speed-btn').textContent=`SPEED ${app.speed}×`;});
$('audio-btn').addEventListener('click',toggleSound);
$('risk-btn').addEventListener('click',()=>{
  app.showRisk=!app.showRisk;
  $('risk-btn').textContent=app.showRisk?'◆ RISK OVERLAY ON':'◇ RISK OVERLAY OFF';
  $('risk-btn').setAttribute('aria-pressed',String(app.showRisk));
});
$('reset-btn').addEventListener('click',()=>{
  if(!confirm('Reset your entire saved run? This cannot be undone. Export first if you want to keep it.'))return;
  app.state=createRun();app.phase='build';app.active=null;app.queue=0;app.summary=null;app.events=[];
  app.particles=[];app.floaters=[];app.selected='spikes';$('game-banner').hidden=true;
  log('A new dungeon rises. Build your defense.');renderUI();save();
});
$('export-btn').addEventListener('click',exportSave);
$('import-btn').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',e=>{importSave(e.target.files?.[0]);e.target.value='';});
$('how-btn').addEventListener('click',()=>$('help').showModal());
$('close-help').addEventListener('click',()=>$('help').close());
$('lab-run').addEventListener('click',research);
$('lab-csv').addEventListener('click',()=>{if(app.research)download(resultsCSV(app.research),'text/csv','trapscholar-research.csv');});
document.addEventListener('keydown',event=>{
  if($('help').open||event.ctrlKey||event.metaKey||event.altKey||event.target?.closest?.('input,select,textarea,summary'))return;
  const tool=['spikes','frost','bolt','venom','erase'][Number(event.key)-1];
  if(tool&&app.phase==='build'){app.selected=tool;renderUI();}
  if(event.code==='Space'&&app.phase==='build'&&!(event.target instanceof HTMLButtonElement)){event.preventDefault();startRaid();}
  if(event.key.toLowerCase()==='p'&&app.phase==='raid'){$('pause-btn').click();}
  if(event.key.toLowerCase()==='m'&&!(event.target instanceof HTMLButtonElement))$('audio-btn').click();
});
const restored=restore();
if(restored){renderLog();log(restored==='v1'?'Upgraded your v0.1 dungeon save. Its original save remains untouched.':'Welcome back. The heroes remember your last completed wave.','good');}
else log('Welcome, dungeon keeper. Prepare your traps, then send the heroes.');
try{if(localStorage.getItem('trapscholar-audio')==='true'){
  // Do not auto-play audio; let the user re-enable it by gesture.
  log('Sound is off until you enable it for this session.');
}}catch(_){}
renderUI();requestAnimationFrame(frame);
