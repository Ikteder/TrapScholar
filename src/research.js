/** Deterministic research arena powered by the SAME hero combat and learning rules.
 * The arena resets wards between experimental trials, unlike a playable campaign;
 * this prevents a defeated dungeon from censoring subsequent learning observations.
 */
import { createRun, buyTrap, makeHero, stepHero, finishHero, waveSize, START_WARD } from './engine.js';
import { forecasts } from './brain.js';

export const SCENARIO = Object.freeze({
  title:'Fixed-lane pressure test',
  description:'North: four heavy traps; central: two medium traps; south: one light trap. All routes and initial trap layouts are fixed for the comparison.',
});
export function seedScenario(seed,policy){
  const state=createRun(seed,policy);
  state.souls=160;
  for(const [lane,patterns] of [[3,['bolt','bolt','spikes','bolt']], [6,['spikes','frost']], [9,['spikes']]]){
    patterns.forEach((kind,i)=>buyTrap(state,4+i*4,lane,kind));
  }
  state.souls=12;
  return state;
}
/** Continuous arena with a fixed number of hero attempts per wave.
 * Damage, resistance, route choices, DoT and brain observations are identical
 * to normal gameplay. Wards are replenished per hero to avoid early termination.
 */
export function simulate({seed=2026,rounds=12,policy='adaptive'}={}){
  if(!Number.isInteger(rounds)||rounds<1||rounds>100)throw new RangeError('rounds 1–100');
  const s=seedScenario(seed,policy);
  const visits=[0,0,0],samples=[];
  let damageTotal=0;
  for(let wave=1;wave<=rounds;wave++){
    let breaches=0,kills=0,damage=0;
    s.wave=wave;
    for(let i=0;i<waveSize(wave);i++){
      s.ward=START_WARD; // Replenished trial ward; NOT part of normal campaign behavior.
      const hero=makeHero(s,i+1);visits[hero.lane]++;
      while(!hero.finished)stepHero(s,hero);
      const survived=!hero.dead;
      finishHero(s,hero,survived);
      if(survived)breaches++;else kills++;
      damage+=hero.damage;damageTotal+=hero.damage;
    }
    samples.push({wave,breaches,kills,meanDamage:damage/(breaches+kills),
      probabilities:policy==='uniform'?[1/3,1/3,1/3]:forecasts(s.brain).map(x=>x.probability)});
  }
  const count=s.kills+s.breaches;
  return {seed:s.seed,policy,roundsRequested:rounds,roundsPlayed:rounds,
    attempts:count,kills:s.kills,breaches:s.breaches,meanDamage:damageTotal/count,
    heroSurvivalRate:s.breaches/count,visits,history:samples,
    finalProbabilities:samples.at(-1).probabilities};
}
/** Pair numerical seeds. Random streams diverge across policies, so seed matching
 * does not guarantee a common-random-numbers causal comparison.
 */
export function compare({seed=2026,seeds=12,rounds=12}={}){
  if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw new RangeError('seed 0–2^32-1');
  if(!Number.isInteger(seeds)||seeds<1||seeds>100)throw new RangeError('seeds 1–100');
  const runs=[];
  for(let i=0;i<seeds;i++)for(const policy of ['adaptive','uniform'])runs.push(simulate({seed:(seed+i*1009)>>>0,rounds,policy}));
  const groups={};
  for(const policy of ['adaptive','uniform']){
    const values=runs.filter(r=>r.policy===policy);
    const n=values.length,avg=fn=>values.reduce((a,b)=>a+fn(b),0)/n;
    const meanDamage=avg(r=>r.meanDamage);
    const sampleSD=n>1?Math.sqrt(values.reduce((a,b)=>a+(b.meanDamage-meanDamage)**2,0)/(n-1)):0;
    groups[policy]={meanBreaches:avg(r=>r.breaches),meanKills:avg(r=>r.kills),
      meanDamage,sdDamage:sampleSD,meanSurvivalRate:avg(r=>r.heroSurvivalRate),
      meanNorthShare:avg(r=>r.visits[0]/r.attempts),
      meanCentralShare:avg(r=>r.visits[1]/r.attempts),
      meanSouthShare:avg(r=>r.visits[2]/r.attempts)};
  }
  return {meta:{seed,seeds,rounds,scenario:SCENARIO.title,engine:'shared-v2',synthetic:true,
    arena:'Fixed layout and equal hero counts; ward restored before each experimental hero (not campaign gameplay)',
    note:'Deterministic for fixed seeds. This is a simple illustrative heuristic comparison, not a published benchmark.'},groups,runs};
}
export function resultsCSV(experiment){
  const lines=['seed,policy,waves,hero_attempts,heroes_stopped,hero_breaches,hero_survival_rate,mean_damage_per_hero,north_share,central_share,south_share'];
  for(const run of experiment.runs)lines.push([run.seed,run.policy,run.roundsPlayed,run.attempts,run.kills,run.breaches,
    run.heroSurvivalRate.toFixed(6),run.meanDamage.toFixed(6),...run.visits.map(v=>(v/run.attempts).toFixed(6))].join(','));
  return lines.join('\n')+'\n';
}
