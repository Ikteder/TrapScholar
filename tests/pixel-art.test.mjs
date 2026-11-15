import {test} from 'node:test';
import assert from 'node:assert/strict';
import { availableSprites, pixelSprite, PIXEL_ART_VERSION } from '../src/pixel-art.js';

test('all authored sprites render as 32x32 opaque or transparent canvases', () => {
  let count=0,rects=0;
  globalThis.document={createElement(tag){
    assert.equal(tag,'canvas');count++;
    return {width:0,height:0,getContext(){return {imageSmoothingEnabled:true,fillStyle:'',fillRect(x,y,w,h){
      for(const n of [x,y,w,h])assert.ok(Number.isFinite(n));rects++;
    }};}};
  }};
  for(const id of availableSprites){
    const sprite=pixelSprite(id);
    assert.equal(sprite.width,32);
    assert.equal(sprite.height,32);
    assert.equal(pixelSprite(id),sprite,'should reuse cached sprites');
  }
  assert.ok(count>=20);
  assert.ok(rects>380,'authored tile/sprite artwork should be detailed');
  assert.equal(PIXEL_ART_VERSION,1);
  delete globalThis.document;
});

test('variant floor sprites are cached independently',()=>{
  globalThis.document={createElement:()=>({getContext:()=>({fillRect(){}})})};
  const a=pixelSprite('floor',111);
  const b=pixelSprite('floor',112);
  assert.notEqual(a,b);
  assert.equal(a,pixelSprite('floor',111));
  delete globalThis.document;
});
