import test from 'node:test';import assert from 'node:assert/strict';
import {atmosphereLights} from '../src/visual-effects.js';
test('atmospheric light points are reproducible and bounded',()=>{const a=atmosphereLights();assert.deepEqual(a,atmosphereLights());for(const p of a){assert.ok(p.x>=0&&p.x<=960&&p.y>=0&&p.y<=540&&p.r>0&&p.strength>0&&p.strength<1);}});