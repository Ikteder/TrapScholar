/** TrapScholar's deliberately small, inspectable online route learner.
 * No model downloads, network calls, training data, or LLM required.
 * Observations are actual damage encountered by heroes, not perfect map knowledge.
 */
export const LANES = Object.freeze([3, 6, 9]);
export const LANE_NAMES = Object.freeze(['North', 'Central', 'South']);
const EXPLORATION = 1.8;
const TEMPERATURE = 0.9;
const PRIOR_RISK = 2.0;

export function newBrain() {
  return {
    version: 1,
    total: 0,
    lanes: LANES.map(() => ({visits: 0, estimatedDamage: PRIOR_RISK, lastDamage: null,
      totalDamage: 0, deaths: 0, breaches: 0})),
  };
}

export function forecasts(brain) {
  if (!brain || !Array.isArray(brain.lanes) || brain.lanes.length !== 3) {
    throw new TypeError('Expected a valid three-lane brain');
  }
  const n = Math.max(0, brain.total);
  const scores = brain.lanes.map(lane => {
    const visits = Math.max(0, lane.visits);
    const risk = Number.isFinite(lane.estimatedDamage) ? lane.estimatedDamage : PRIOR_RISK;
    return risk - EXPLORATION * Math.sqrt(Math.log(n + 2) / (visits + 1));
  });
  const min = Math.min(...scores);
  const raw = scores.map(s => Math.exp(-(s - min) / TEMPERATURE));
  const denom = raw.reduce((a,b) => a+b, 0);
  return brain.lanes.map((lane, index) => ({
    index, name: LANE_NAMES[index], estimatedDamage: lane.estimatedDamage,
    visits: lane.visits, deaths: lane.deaths, breaches: lane.breaches,
    probability: raw[index] / denom, score: scores[index]
  }));
}

export function chooseLane(brain, rng = Math.random) {
  const options = forecasts(brain);
  const sample = Math.min(0.999999999, Math.max(0, Number(rng()) || 0));
  let acc = 0;
  for (const option of options) {
    acc += option.probability;
    if (sample < acc) return option.index;
  }
  return 2;
}

/** Record one hero's outcome. A Bayesian prior is used until observations arrive,
 * then a smoothed recent-risk estimate tracks changing player trap layouts.
 */
export function observe(brain, laneIndex, damage, survived) {
  if (!Number.isInteger(laneIndex) || laneIndex < 0 || laneIndex > 2 ||
      !Number.isFinite(damage) || damage < 0 || typeof survived !== 'boolean') {
    throw new RangeError('Invalid hero outcome');
  }
  const lane = brain.lanes[laneIndex];
  const last = lane.estimatedDamage;
  const sample = damage + (survived ? -0.4 : 0.6);
  lane.estimatedDamage = Math.max(0, lane.visits === 0 ? sample : last * 0.55 + sample * 0.45);
  lane.visits += 1;
  lane.totalDamage += damage;
  lane.lastDamage = damage;
  if (survived) lane.breaches += 1;
  else lane.deaths += 1;
  brain.total += 1;
  return lane;
}

export function checkBrain(brain) {
  return !!brain && brain.version === 1 && Number.isInteger(brain.total) && brain.total >= 0 &&
    Array.isArray(brain.lanes) && brain.lanes.length === 3 && brain.lanes.every(l =>
      Number.isInteger(l.visits) && l.visits >= 0 && Number.isFinite(l.estimatedDamage) &&
      l.estimatedDamage >= 0 && Number.isFinite(l.totalDamage));
}
