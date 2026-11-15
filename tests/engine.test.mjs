import test from 'node:test';
import assert from 'node:assert/strict';
import { LANES } from '../src/brain.js';
import { TRAPS, HEROES, MAX_WARD, canBuild, pathFor, createRun, nextRandom, buyTrap, buyUpgrade,
  waveSize, makeHero, stepHero, finishHero, finishWave, runWave, validRun } from '../src/engine.js';

test('build region and route geometry are safe',()=>{
  for(const y of LANES){assert.equal(canBuild(2,y),true);assert.equal(canBuild(19,y),true);assert.equal(canBuild(20,y),false);}
  assert.equal(canBuild(5,5),false);
  for(let lane=0;lane<3;lane++){
    const path=pathFor(lane);
    assert.deepEqual(path[0],{x:1,y:6});assert.deepEqual(path.at(-1),{x:20,y:6});
    for(let i=1;i<path.length;i++)assert.equal(Math.abs(path[i].x-path[i-1].x)+Math.abs(path[i].y-path[i-1].y),1);
  }
  assert.throws(()=>pathFor(8),RangeError);
});
test('seeded random sequences match and differ by seed',()=>{
  const a=createRun(101),b=createRun(101),c=createRun(102);
  const first=Array.from({length:16},()=>nextRandom(a));
  assert.deepEqual(first,Array.from({length:16},()=>nextRandom(b)));
  assert.notDeepEqual(first,Array.from({length:16},()=>nextRandom(c)));
  assert.ok(first.every(x=>x>=0&&x<1));
});
test('trap purchase, replacement refund, and erasure obey economy',()=>{
  const s=createRun();
  assert.equal(buyTrap(s,4,3,'bolt').ok,true);assert.equal(s.souls,14);
  assert.equal(buyTrap(s,4,3,'venom').ok,true);assert.equal(s.souls,11); // refund 2, pay 5
  assert.equal(buyTrap(s,4,3,'erase').ok,true);assert.equal(s.souls,13);
  assert.equal(buyTrap(s,1,3,'bolt').ok,false);
  assert.equal(buyTrap(s,4,3,'bogus').ok,false);
  assert.equal(buyTrap(s,4,3,'spikes').ok,true);assert.equal(s.souls,11);
});
test('upgrades cost souls, respect ownership, and protect ward cap',()=>{
  const s=createRun();s.souls=40;s.ward=MAX_WARD-1;
  assert.equal(buyUpgrade(s,'ward').ok,true);assert.equal(s.ward,MAX_WARD);
  assert.equal(buyUpgrade(s,'ward').ok,false);
  assert.equal(buyUpgrade(s,'forge').ok,true);assert.equal(buyUpgrade(s,'forge').ok,false);
  assert.equal(buyUpgrade(s,'power').ok,true);assert.equal(s.upgrades.power,true);
});
test('hero roles are real and deterministic and state is inspectable',()=>{
  const a=createRun(9),b=createRun(9);
  a.wave=b.wave=8;
  for(let i=0;i<20;i++){
    const h=makeHero(a,i+1),j=makeHero(b,i+1);
    assert.deepEqual([h.lane,h.className,h.hp],[j.lane,j.className,j.hp]);
    assert.ok(HEROES[h.className]);
  }
});
test('traps deal damage, dot effects resolve over subsequent tiles',()=>{
  const s=createRun(15);s.traps['4,6']='frost';
  const hero={lane:1,route:pathFor(1),index:0,progress:0,hp:20,maxHp:20,damage:0,counter:null,className:'raider',
    dots:[],slow:0,dead:false,finished:false,triggered:{}};
  for(let i=0;i<3;i++)stepHero(s,hero);
  assert.equal(hero.damage,1);assert.equal(hero.dots.length,1);
  stepHero(s,hero);stepHero(s,hero);
  assert.equal(hero.damage,3);assert.equal(hero.dots.length,0);
  assert.equal(s.trapDamage.frost,3);
});
test('scout mitigates spikes; arcanist mitigates bolt; guardian mitigates poison dot',()=>{
  for(const [kind,role,expected] of [['spikes','scout',1],['bolt','arcanist',2],['venom','guardian',1]]){
    const s=createRun(10);s.traps['4,6']=kind;
    const h={lane:1,route:pathFor(1),index:0,progress:0,hp:50,maxHp:50,damage:0,counter:null,className:role,
      dots:[],slow:0,dead:false,finished:false,triggered:{}};
    for(let i=0;i<6;i++)stepHero(s,h);
    assert.equal(h.damage,expected,`wrong ${kind}/${role} damage`);
  }
});
test('power upgrade adds damage and dominant damage counter activates after wave four',()=>{
  const s=createRun(9);s.wave=5;s.trapDamage.spikes=20;s.upgrades.power=true;s.traps['2,6']='spikes';
  const h=makeHero(s,1);assert.equal(h.counter,'spikes');
  assert.ok([0,1,2].includes(h.lane));
  assert.equal(waveSize(1),2);assert.equal(waveSize(4),3);assert.equal(waveSize(11),5);
});
test('whole waves and save state are reproducible',()=>{
  const a=createRun(1234),b=createRun(1234);
  for(const state of [a,b]){
    state.souls=80;
    for(const y of LANES){buyTrap(state,5,y,'bolt');buyTrap(state,10,y,'frost');}
    for(let i=0;i<12&&state.ward>0;i++)runWave(state);
  }
  assert.deepEqual(a,b);assert.ok(a.brain.total>0);
  assert.ok(a.history.length>0);
  assert.equal(validRun(a),true);
  assert.equal(validRun(JSON.parse(JSON.stringify(a))),true);
});
test('invalid saves are rejected, including poisoned trap coordinates',()=>{
  const s=createRun(100);
  assert.equal(validRun(s),true);
  assert.equal(validRun({...s,ward:100}),false);
  assert.equal(validRun({...s,traps:{'__proto__':'bolt','9,12':'spikes'}}),false);
  assert.equal(validRun({...s,policy:'all-knowing'}),false);
  assert.equal(validRun({...s,history:Array.from({length:500},()=>null)}),false);
});
test('live hero step loop agrees with batch wave outcomes',()=>{
  const a=createRun(42),b=createRun(42);
  for(const s of [a,b]){s.traps['2,3']='spikes';s.traps['3,6']='frost';s.traps['5,9']='venom';}
  const actual=runWave(a),summary={heroes:0,kills:0,breaches:0};
  for(let n=0;n<waveSize(b.wave)&&b.ward>0;n++){
    const h=makeHero(b,n+1);summary.heroes++;
    while(!h.finished)stepHero(b,h);
    const survived=!h.dead;finishHero(b,h,survived);
    summary[survived?'breaches':'kills']++;
  }
  finishWave(b,summary);assert.deepEqual(summary,actual);assert.deepEqual(a,b);
});
test('15-wave campaign is winnable with strategic trap investment on a public fixed seed',()=>{
  const s=createRun(42);
  while(s.wave<=15&&s.ward>0){
    if(s.wave>=5&&s.souls>=12)buyUpgrade(s,'power');
    for(let i=0;i<6;i++)for(const y of LANES)buyTrap(s,3+i*2,y,'bolt');
    runWave(s);
  }
  assert.equal(s.wave,16);
  assert.ok(s.ward>0);
  assert.equal(s.history.length,15);
  assert.equal(validRun(s),true);
});
test('invalid history and invalid brain are rejected from imported saves',()=>{
  const s=createRun(51);
  runWave(s);
  assert.equal(validRun({...s,history:[{wave:1,probabilities:[NaN,1,1]}]}),false);
  assert.equal(validRun({...s,brain:{...s.brain,total:-1}}),false);
  assert.equal(validRun({...s,rng:-1}),false);
});
