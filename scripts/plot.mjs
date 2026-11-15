/** Regenerate publication-ready SVG figures from the real example-experiment.json.
 * Pure Node.js — no graph libraries. No data is invented or rounded before plotting.
 */
import { readFileSync, writeFileSync } from 'node:fs';
const e=JSON.parse(readFileSync('data/example-experiment.json','utf8'));
const a=e.groups.adaptive,u=e.groups.uniform;
const meanShare=policy=>Array.from({length:e.meta.rounds},(_,i)=>{
  const list=e.runs.filter(r=>r.policy===policy);
  return list.reduce((acc,r)=>acc+r.history[i].probabilities[2],0)/list.length;
});
const adap=meanShare('adaptive'),uni=meanShare('uniform');
const x=step=>636+(step/(e.meta.rounds-1))*555;
const y=v=>374-v*275;
const poly=(values,color)=>`<polyline points="${values.map((v,i)=>`${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`;
const grid=Array.from({length:5},(_,i)=>{const v=i/4;return `<line x1="636" y1="${y(v)}" x2="1191" y2="${y(v)}" stroke="#35445d" stroke-dasharray="3 6"/><text x="616" y="${y(v)+5}" text-anchor="end" fill="#8d9eba" font-size="15">${Math.round(v*100)}%</text>`;}).join('\n');
const leftScale=v=>376-v/6*208;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="470" viewBox="0 0 1240 470" role="img" aria-label="Real reproducible seeded experiment results: adaptive heroes take less damage and choose the safer south corridor more often than uniform heroes on this synthetic fixed map">
<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#191f34"/><stop offset="1" stop-color="#111b2c"/></linearGradient><linearGradient id="mag" x2="1"><stop stop-color="#8957d8"/><stop offset="1" stop-color="#cc9af7"/></linearGradient></defs>
<rect width="1240" height="470" fill="url(#bg)" rx="20"/><rect x="20" y="20" width="1200" height="430" rx="14" fill="none" stroke="#384460"/>
<text x="53" y="57" fill="#ab91ea" font-family="monospace" font-size="15" font-weight="bold" letter-spacing="3">REAL SEEDED SIMULATION • ${e.meta.seeds} SEED PAIRS • ${e.meta.rounds} WAVES</text>
<text x="53" y="98" fill="#ecedf8" font-family="Arial,sans-serif" font-size="26" font-weight="bold">Damage per hero ↓</text>
<text x="53" y="125" fill="#98a9c7" font-family="Arial,sans-serif" font-size="15">Lower is better for heroes on this fixed map</text>
<text x="116" y="160" fill="#c2a1f6" font-family="monospace" font-size="16">Adaptive</text><text x="363" y="160" fill="#80ded3" font-family="monospace" font-size="16">Uniform</text>
<rect x="133" y="${leftScale(a.meanDamage)}" width="92" height="${376-leftScale(a.meanDamage)}" rx="8" fill="url(#mag)"/>
<rect x="369" y="${leftScale(u.meanDamage)}" width="92" height="${376-leftScale(u.meanDamage)}" rx="8" fill="#64d0c3"/>
<text x="179" y="${leftScale(a.meanDamage)-16}" fill="#d4b8fb" text-anchor="middle" font-family="monospace" font-size="28" font-weight="bold">${a.meanDamage.toFixed(2)}</text>
<text x="415" y="${leftScale(u.meanDamage)-16}" fill="#95ebe0" text-anchor="middle" font-family="monospace" font-size="28" font-weight="bold">${u.meanDamage.toFixed(2)}</text>
<line x1="63" y1="376" x2="515" y2="376" stroke="#485571"/>
<text x="179" y="407" fill="#bec7db" text-anchor="middle" font-family="Arial,sans-serif" font-size="14">Online learner</text>
<text x="415" y="407" fill="#bec7db" text-anchor="middle" font-family="Arial,sans-serif" font-size="14">Uniform baseline</text>
<line x1="564" y1="104" x2="564" y2="417" stroke="#374660"/>
<text x="606" y="98" fill="#ecedf8" font-family="Arial,sans-serif" font-size="26" font-weight="bold">Safer south path →</text>
<text x="606" y="125" fill="#98a9c7" font-family="Arial,sans-serif" font-size="15">Mean policy probability after each experimental wave</text>
${grid}
${poly(uni,'#63d4c9')}${poly(adap,'#c999f8')}
<text x="638" y="404" fill="#8d9eba" font-family="monospace" font-size="15">WAVE 1</text>
<text x="1191" y="404" text-anchor="end" fill="#8d9eba" font-family="monospace" font-size="15">WAVE ${e.meta.rounds}</text>
<circle cx="812" cy="436" r="5" fill="#c999f8"/><text x="826" y="441" fill="#d5c7e9" font-family="monospace" font-size="14">Adaptive</text>
<circle cx="953" cy="436" r="5" fill="#63d4c9"/><text x="966" y="441" fill="#d5c7e9" font-family="monospace" font-size="14">Uniform</text>
</svg>`;
writeFileSync('assets/results-chart.svg',svg);
console.log('Wrote assets/results-chart.svg from data/example-experiment.json');
