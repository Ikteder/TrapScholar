import test from 'node:test';
import assert from 'node:assert/strict';
import { compare, simulate, seedScenario, resultsCSV } from '../src/research.js';

test('seeded experiment is bit-exact reproducible',()=>{
  const args={seed:2026,seeds:10,rounds:12};
  assert.deepEqual(compare(args),compare(args));
});
test('research uses both actual policies and preserves the fixed trap scenario',()=>{
  const a=seedScenario(13,'adaptive'),b=seedScenario(13,'uniform');
  assert.deepEqual(a.traps,b.traps);
  const e=compare({seed:13,seeds:3,rounds:8});
  assert.equal(e.runs.length,6);assert.deepEqual(Object.keys(e.groups),['adaptive','uniform']);
  assert.equal(e.meta.synthetic,true);
  assert.ok(e.runs.every(r=>r.roundsPlayed>=1&&r.roundsPlayed<=8));
  assert.ok(e.runs.every(r=>r.history.length===r.roundsPlayed));
});
test('CSV export has a complete header and one row per run',()=>{
  const e=compare({seed:42,seeds:3,rounds:6});
  const csv=resultsCSV(e).trim().split('\n');
  assert.equal(csv.length,7);
  assert.ok(csv[0].startsWith('seed,policy,'));
});
test('unbounded seed pair count and waves reject',()=>{
  assert.throws(()=>compare({seeds:101}),RangeError);
  assert.throws(()=>simulate({rounds:101}),RangeError);
  assert.throws(()=>simulate({rounds:-2}),RangeError);
});
test('12-wave research arena includes exactly 42 uncensored hero attempts',()=>{
  for(const policy of ['adaptive','uniform']){
    const r=simulate({seed:42,rounds:12,policy});
    assert.equal(r.attempts,42);
    assert.equal(r.kills+r.breaches,42);
    assert.equal(r.visits.reduce((a,b)=>a+b,0),42);
    assert.ok(r.history.every((h,i)=>h.wave===i+1));
    if(policy==='uniform')assert.deepEqual(r.finalProbabilities,[1/3,1/3,1/3]);
  }
});

test('difference summary equals observed policy means',()=>{
  const e=compare({seed:81,seeds:8,rounds:10});
  assert.equal(e.difference.n,8);
  assert.ok(Math.abs(e.difference.mean-(e.groups.uniform.meanDamage-e.groups.adaptive.meanDamage))<1e-9);
  assert.ok(e.difference.ci95[0]<=e.difference.mean&&e.difference.mean<=e.difference.ci95[1]);
});
test('one-seed comparison explicitly omits unavailable interval',()=>{
  const e=compare({seed:81,seeds:1,rounds:4});
  assert.equal(e.difference.ci95,null);
  assert.equal(e.difference.sd,null);
});
