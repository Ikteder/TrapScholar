import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignMetrics, routeConcentration } from '../src/metrics.js';
import { createRun, buyTrap, runWave } from '../src/engine.js';
import { observe } from '../src/brain.js';

test('uniform route selection has zero concentration', () => {
  assert.ok(Math.abs(routeConcentration([1/3,1/3,1/3])) < 1e-10);
  assert.ok(Math.abs(routeConcentration([1,0,0])-1) < 1e-10);
});
test('invalid route probability arrays reject', () => {
  assert.throws(() => routeConcentration([0.8,0.8,-0.6]), RangeError);
  assert.throws(() => routeConcentration([0.2,0.2,0.2]), RangeError);
  assert.throws(() => routeConcentration([0.5,NaN,0.5]), RangeError);
});
test('zero-hero telemetry reports no invented defense or damage numbers', () => {
  const m = campaignMetrics(createRun());
  assert.equal(m.resolved, 0);
  assert.equal(m.defenseRate, null);
  assert.equal(m.damagePerHero, null);
  assert.ok(m.routeConcentration < 1e-10);
});
test('telemetry aggregates actual resolved combat outcomes and trap damage', () => {
  const s = createRun(56);
  for(const lane of [3,6,9])for(const x of [4,7])assert.ok(buyTrap(s,x,lane,'spikes').ok);
  runWave(s);
  const m = campaignMetrics(s);
  assert.equal(m.resolved, s.kills + s.breaches);
  assert.equal(m.defenseRate, s.kills / m.resolved);
  assert.equal(m.damagePerHero, Object.values(s.trapDamage).reduce((a,b)=>a+b,0)/m.resolved);
  assert.ok(m.routeConcentration >= 0 && m.routeConcentration <= 1);
});
test('route concentration responds to observations', () => {
  const s = createRun();
  observe(s.brain,0,15,false);
  observe(s.brain,1,2,true);
  const m = campaignMetrics(s);
  assert.ok(m.routeConcentration > 0);
  assert.ok(m.preferredRoute.probability > 1/3);
});
