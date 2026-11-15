/** TrapScholar simulation rules. Pure JavaScript, deterministic for a given seed.
 * One engine powers BOTH the interactive game and the offline research simulator.
 */
import { LANES, newBrain, chooseLane, observe, forecasts, checkBrain } from './brain.js';

export const GAME_VERSION = 2;
export const START_WARD = 12;
export const START_SOULS = 18;
export const MAX_WARD = 16;
export const TRAPS = Object.freeze({
  spikes: Object.freeze({cost:2,damage:2,label:'Spikes',color:'#ff9e86', icon:'▲'}),
  frost: Object.freeze({cost:3,damage:1,label:'Frost rune',color:'#8fe3f9',icon:'❄'}),
  bolt: Object.freeze({cost:4,damage:3,label:'Arcane bolt',color:'#ecc890',icon:'✦'}),
  venom: Object.freeze({cost:5,damage:1,label:'Venom coil',color:'#9ee6a1',icon:'☣'}),
});
export const HEROES = Object.freeze({
  raider: Object.freeze({label:'Raider',hp:0,bonus:0,tint:'#9c81df',detail:'No special resistance'}),
  scout: Object.freeze({label:'Scout',hp:-1,bonus:0,tint:'#75ddc9',detail:'Spikes deal 1 less damage'}),
  guardian: Object.freeze({label:'Guardian',hp:3,bonus:0,tint:'#e2b77b',detail:'Extra health; reduced venom damage'}),
  arcanist: Object.freeze({label:'Arcanist',hp:0,bonus:0,tint:'#ee91c1',detail:'Bolt deals 1 less damage'}),
});
export const UPGRADES = Object.freeze({
  ward: Object.freeze({label:'Reinforce wards',cost:9,desc:'Restore +3 ward, up to 16'}),
  forge: Object.freeze({label:'Soulforge',cost:10,desc:'+1 soul for each hero defeated; permanent'}),
  power: Object.freeze({label:'Overcharge',cost:12,desc:'+1 spike / bolt base damage; permanent'}),
});
const TILE_LEFT = 2, TILE_RIGHT=19;
export function canBuild(x,y){return Number.isInteger(x)&&x>=TILE_LEFT&&x<=TILE_RIGHT&&LANES.includes(y);}
export function pathFor(index){
  if(!Number.isInteger(index)||index<0||index>2)throw new RangeError('Invalid lane');
  const lane=LANES[index],path=[{x:1,y:6}];
  for(let y=6;y!==lane;y+=Math.sign(lane-y))path.push({x:1,y:y+Math.sign(lane-y)});
  for(let x=2;x<=20;x++)path.push({x,y:lane});
  for(let y=lane;y!==6;y+=Math.sign(6-y))path.push({x:20,y:y+Math.sign(6-y)});
  return path;
}
/** xorshift32: inspectable seeded PRNG. Zero seeds are mapped to a nonzero state. */
export function nextRandom(state){
  let x=state.rng>>>0;
  x^=x<<13;x^=x>>>17;x^=x<<5;
  state.rng=x>>>0;
  return (state.rng>>>0)/4294967296;
}
export function createRun(seed=2026,policy='adaptive'){
  if(!['adaptive','uniform'].includes(policy))throw new RangeError('Unknown policy');
  const normalized=Number(seed)>>>0;
  return {version:GAME_VERSION,seed:normalized,rng:normalized||0x9e3779b9,policy,
    wave:1,souls:START_SOULS,ward:START_WARD,kills:0,breaches:0,brain:newBrain(),traps:{},
    trapDamage:{spikes:0,frost:0,bolt:0,venom:0},upgrades:{forge:false,power:false},
    history:[],heroesResolved:0};
}
export function buyTrap(state,x,y,kind){
  if(!canBuild(x,y))return {ok:false,reason:'Not a buildable corridor'};
  if(kind!=='erase'&&!TRAPS[kind])return {ok:false,reason:'Unknown trap'};
  const pos=`${x},${y}`,old=state.traps[pos];
  if(kind==='erase'){
    if(!old)return {ok:false,reason:'No trap here'};
    const refund=Math.floor(TRAPS[old].cost/2);
    delete state.traps[pos];state.souls+=refund;
    return {ok:true,kind,refund};
  }
  if(kind===old)return {ok:false,reason:'Already placed'};
  const refund=old?Math.floor(TRAPS[old].cost/2):0;
  if(state.souls+refund<TRAPS[kind].cost)return {ok:false,reason:'Not enough souls'};
  state.souls+=refund-TRAPS[kind].cost;state.traps[pos]=kind;
  return {ok:true,kind,refund};
}
export function buyUpgrade(state,kind){
  const spec=UPGRADES[kind];
  if(!spec)return {ok:false,reason:'Unknown upgrade'};
  if(kind!=='ward'&&state.upgrades[kind])return {ok:false,reason:'Already owned'};
  if(kind==='ward'&&state.ward>=MAX_WARD)return {ok:false,reason:'Wards full'};
  if(state.souls<spec.cost)return {ok:false,reason:'Not enough souls'};
  state.souls-=spec.cost;
  if(kind==='ward')state.ward=Math.min(MAX_WARD,state.ward+3);
  else state.upgrades[kind]=true;
  return {ok:true};
}
export function waveSize(wave){return 2+Math.min(3,Math.floor((wave-1)/3));}
export function chooseHeroClass(state){
  const roll=nextRandom(state);
  if(state.wave<3)return roll<0.72?'raider':'scout';
  if(state.wave<6)return roll<0.35?'raider':roll<0.68?'scout':'guardian';
  return roll<0.25?'raider':roll<0.5?'scout':roll<0.76?'guardian':'arcanist';
}
export function makeHero(state,ordinal=1){
  const lane=state.policy==='uniform'?Math.min(2,Math.floor(nextRandom(state)*3)):chooseLane(state.brain,()=>nextRandom(state));
  const className=chooseHeroClass(state);
  const maxHp=Math.max(2,6+Math.floor((state.wave-1)/3)+HEROES[className].hp);
  const dominant=Object.entries(state.trapDamage).sort((a,b)=>b[1]-a[1]);
  const counter=state.wave>=4&&dominant[0][1]>=5?dominant[0][0]:null;
  return {lane,route:pathFor(lane),index:0,progress:0,hp:maxHp,maxHp,damage:0,
    counter,className,ordinal,dots:[],slow:0,dead:false,finished:false,triggered:{}};
}
function hurt(hero,n,source,state){
  const amount=Math.max(0,n);hero.hp-=amount;hero.damage+=amount;
  state.trapDamage[source]+=amount;
  return amount;
}
/** Move exactly one tile, resolve effects, emit serializable events. */
export function stepHero(state,hero){
  if(hero.finished)throw new Error('Hero already finished');
  const events=[];
  hero.index++;
  // Over-time trap effects tick on every subsequent tile, even between corridors.
  hero.dots=hero.dots.filter(effect=>{
    const d=effect.source==='venom'&&hero.className==='guardian'?0:1;
    const actual=hurt(hero,d,effect.source,state);
    if(actual)events.push({type:'dot',amount:actual,source:effect.source});
    effect.remaining--;
    return effect.remaining>0;
  });
  if(hero.hp<=0){hero.dead=true;hero.finished=true;return {done:true,survived:false,events};}
  if(hero.index>=hero.route.length-1){hero.finished=true;return {done:true,survived:true,events};}
  const cell=hero.route[hero.index];
  const kind=state.traps[`${cell.x},${cell.y}`];
  if(kind){
    const base=TRAPS[kind].damage+(state.upgrades.power&&['spikes','bolt'].includes(kind)?1:0);
    const reduction=(hero.counter===kind?1:0)+(hero.className==='scout'&&kind==='spikes'?1:0)+
      (hero.className==='arcanist'&&kind==='bolt'?1:0);
    const dealt=hurt(hero,Math.max(0,base-reduction),kind,state);
    events.push({type:'hit',source:kind,amount:dealt,cell});
    hero.triggered[kind]=(hero.triggered[kind]||0)+1;
    if(kind==='frost'&&hero.counter!=='frost'){
      hero.dots.push({source:'frost',remaining:2});hero.slow=Math.max(hero.slow,2);
    }
    if(kind==='venom'&&hero.counter!=='venom')hero.dots.push({source:'venom',remaining:3});
  }
  if(hero.hp<=0){hero.dead=true;hero.finished=true;return {done:true,survived:false,events};}
  return {done:false,events};
}
/** Commit a single hero outcome and update the visible route learner. */
export function finishHero(state,hero,survived){
  if(!hero.finished)throw new Error('Cannot score an unfinished hero');
  observe(state.brain,hero.lane,hero.damage,survived);
  if(survived){state.breaches++;state.ward=Math.max(0,state.ward-1);}
  else {state.kills++;state.souls+=2+(state.upgrades.forge?1:0);}
  state.heroesResolved++;
  return {lane:hero.lane,damage:hero.damage,survived,role:hero.className};
}
/** Finish a wave, award currency, and record the actual observed probabilities. */
export function finishWave(state,summary){
  const data={wave:state.wave,heroes:summary.heroes,kills:summary.kills,breaches:summary.breaches,
    ward:state.ward,souls:state.souls,probabilities:forecasts(state.brain).map(x=>x.probability),
    estimates:state.brain.lanes.map(x=>x.estimatedDamage), totalKills:state.kills,totalBreaches:state.breaches};
  state.history.push(data);
  if(state.history.length>300)state.history.shift();
  if(state.ward>0){state.wave++;state.souls+=4;}
  return data;
}
/** Resolve a complete wave without rendering; same makeHero/stepHero/finishHero path as live game. */
export function runWave(state){
  const summary={heroes:0,kills:0,breaches:0};
  for(let n=0;n<waveSize(state.wave)&&state.ward>0;n++){
    const hero=makeHero(state,n+1);summary.heroes++;
    while(!hero.finished)stepHero(state,hero);
    const survived=!hero.dead;
    finishHero(state,hero,survived);
    if(survived)summary.breaches++;else summary.kills++;
  }
  finishWave(state,summary);
  return summary;
}
/** Numerical/layout validation for untrusted imported saves; no executable content. */
export function validRun(obj){
  if(!obj||typeof obj!=='object'||obj.version!==2||
    !Number.isInteger(obj.seed)||obj.seed<0||obj.seed>4294967295||
    !Number.isInteger(obj.rng)||obj.rng<0||obj.rng>4294967295||
    !['adaptive','uniform'].includes(obj.policy)||
    !Number.isInteger(obj.wave)||obj.wave<1||obj.wave>100000||
    !Number.isInteger(obj.souls)||obj.souls<0||obj.souls>1000000||
    !Number.isInteger(obj.ward)||obj.ward<0||obj.ward>MAX_WARD||
    !Number.isInteger(obj.kills)||obj.kills<0||obj.kills>1000000||
    !Number.isInteger(obj.breaches)||obj.breaches<0||obj.breaches>1000000||
    !Number.isInteger(obj.heroesResolved)||obj.heroesResolved<0||obj.heroesResolved>1000000||
    !checkBrain(obj.brain)||
    !obj.traps||Array.isArray(obj.traps)||typeof obj.traps!=='object'||
    !obj.upgrades||typeof obj.upgrades.forge!=='boolean'||typeof obj.upgrades.power!=='boolean'||
    !obj.trapDamage||typeof obj.trapDamage!=='object')return false;
  const traps=Object.entries(obj.traps);
  if(traps.length>54||!traps.every(([pos,kind])=>{
    const match=/^(\d+),(\d+)$/.exec(pos);
    return !!match&&canBuild(+match[1],+match[2])&&!!TRAPS[kind];
  }))return false;
  if(!Object.keys(TRAPS).every(k=>Number.isFinite(obj.trapDamage[k])&&obj.trapDamage[k]>=0&&obj.trapDamage[k]<=1000000))return false;
  if(!Array.isArray(obj.history)||obj.history.length>300)return false;
  return obj.history.every(h=>h&&Number.isInteger(h.wave)&&h.wave>=1&&h.wave<obj.wave+1&&
    Number.isInteger(h.heroes)&&h.heroes>0&&h.heroes<=10&&
    Number.isInteger(h.kills)&&Number.isInteger(h.breaches)&&
    Array.isArray(h.probabilities)&&h.probabilities.length===3&&
    h.probabilities.every(p=>Number.isFinite(p)&&p>=0&&p<=1)&&
    Array.isArray(h.estimates)&&h.estimates.length===3&&h.estimates.every(Number.isFinite));
}
