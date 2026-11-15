import test from 'node:test';import assert from 'node:assert/strict';
import {ATLAS,PROP,atlasFrame,drawProp} from '../src/art-assets.js';
test('16 sprite frames map onto 4 by 4 grid',()=>{assert.equal(ATLAS.count,16);assert.equal(new Set(Object.values(PROP)).size,16);assert.deepEqual(atlasFrame(15),{sx:96,sy:96,sw:32,sh:32});});
test('invalid indices reject; browser-only art degrades safely in Node',()=>{for(const x of [-1,16,NaN,1.5])assert.throws(()=>atlasFrame(x),RangeError);assert.equal(drawProp({},0,0,0),false);});