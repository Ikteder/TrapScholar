/** Reproducible, offline experiment for demo docs and research data. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { compare, resultsCSV, SCENARIO } from '../src/research.js';
const e=compare({seed:2026,seeds:40,rounds:12});
mkdirSync('data',{recursive:true});
writeFileSync('data/example-experiment.json',JSON.stringify(e,null,2)+'\n');
writeFileSync('data/example-experiment.csv',resultsCSV(e));
console.log(JSON.stringify({meta:e.meta,groups:e.groups},null,2));
console.log('Wrote data/example-experiment.json + data/example-experiment.csv');
