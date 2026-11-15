import test from 'node:test';
import assert from 'node:assert/strict';
import { LANES, LANE_NAMES, newBrain, observe, chooseLane, forecasts, checkBrain } from '../src/brain.js';

test('new brain is valid and has three routes', () => {
  const brain = newBrain();
  assert.equal(checkBrain(brain),true);
  assert.deepEqual(LANES,[3,6,9]);
  assert.equal(LANE_NAMES[0],'North');
  assert.equal(brain.total,0);
});
test('probabilities sum to one and start symmetric', () => {
  const f=forecasts(newBrain());
  assert.ok(Math.abs(f.reduce((acc,x)=>acc+x.probability,0)-1)<1e-12);
  for(const x of f) assert.ok(Math.abs(x.probability-1/3)<1e-12);
});
test('records observed damage and survival without reading trap map', () => {
  const b=newBrain();observe(b,0,5,false);
  assert.equal(b.total,1);assert.equal(b.lanes[0].visits,1);
  assert.equal(b.lanes[0].totalDamage,5);assert.equal(b.lanes[0].deaths,1);
  observe(b,0,1,true);assert.equal(b.lanes[0].breaches,1);
});
test('prefers safer routes after repeated exposure, retaining exploration',()=>{
  const b=newBrain();
  for(let i=0;i<20;i++){observe(b,0,7,false);observe(b,1,0,true);observe(b,2,2,true);}
  const f=forecasts(b);
  assert.ok(f[1].probability>f[2].probability);
  assert.ok(f[2].probability>f[0].probability);
  assert.ok(f.every(x=>x.probability>0));
});
test('chooses probabilities deterministically for injected RNG',()=>{
  const b=newBrain();
  assert.equal(chooseLane(b,()=>0),0);
  assert.equal(chooseLane(b,()=>0.5),1);
  assert.equal(chooseLane(b,()=>0.999999),2);
});
test('adaptation responds to a newly safer lane',()=>{
  const b=newBrain();
  for(let i=0;i<10;i++){observe(b,0,9,false);observe(b,1,1,true);observe(b,2,3,true);}
  const prior=forecasts(b)[0].probability;
  for(let i=0;i<18;i++){observe(b,0,0,true);observe(b,1,9,false);}
  assert.ok(forecasts(b)[0].probability>prior);
});
test('invalid outcome rejects rather than corrupting state',()=>{
  const b=newBrain();
  assert.throws(()=>observe(b,-1,1,true),RangeError);
  assert.throws(()=>observe(b,1,-5,true),RangeError);
  assert.throws(()=>observe(b,1,NaN,true),RangeError);
  assert.throws(()=>observe(b,1,1,'yes'),RangeError);
  assert.equal(b.total,0);
});
test('JSON serialization and restore preserve learned state',()=>{
  const b=newBrain();observe(b,2,8,false);
  const restored=JSON.parse(JSON.stringify(b));
  assert.equal(checkBrain(restored),true);
  assert.equal(restored.lanes[2].estimatedDamage,b.lanes[2].estimatedDamage);
});
