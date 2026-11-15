/** Read-only gameplay telemetry. Every value is derived from recorded game state. */
import { forecasts } from './brain.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function routeConcentration(probabilities) {
  if (!Array.isArray(probabilities) || probabilities.length !== 3 ||
      probabilities.some(p => !Number.isFinite(p) || p < 0 || p > 1) ||
      Math.abs(probabilities.reduce((a,b)=>a+b,0)-1) > 0.000001) {
    throw new RangeError('Expected three normalized route probabilities');
  }
  // 1 - normalized Shannon entropy: 0 for uniform, 1 for a certain route.
  const entropy = -probabilities.reduce((s,p) => s + (p === 0 ? 0 : p * Math.log(p)), 0);
  return clamp(1 - entropy / Math.log(3), 0, 1);
}

export function campaignMetrics(state) {
  const resolved = state.kills + state.breaches;
  const recordedDamage = Object.values(state.trapDamage).reduce((sum,v) => sum + v, 0);
  const forecast = forecasts(state.brain);
  const probabilities = forecast.map(l => l.probability);
  return {
    resolved,
    stopped: state.kills,
    breached: state.breaches,
    defenseRate: resolved ? state.kills / resolved : null,
    damagePerHero: resolved ? recordedDamage / resolved : null,
    recordedDamage,
    routeConcentration: routeConcentration(probabilities),
    preferredRoute: forecast.reduce((best,l) => l.probability > best.probability ? l : best, forecast[0]),
    probabilities,
    latestWave: state.history.at(-1) ?? null,
  };
}
