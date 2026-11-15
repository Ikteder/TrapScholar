import test from 'node:test';
import assert from 'node:assert/strict';
import { ISO, COLS, ROWS, ROUTES, project, inverse, pickCell, pointerToCell, isCorridor, isTrapSlot } from '../src/isometric.js';

test('isometric projection is invertible for all 286 logical cells',()=>{
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const p=project(x,y),q=inverse(p.x,p.y);
    assert.ok(Math.abs(q.x-x)<1e-9&&Math.abs(q.y-y)<1e-9);
    assert.deepEqual(pickCell(p.x,p.y),{x,y});
  }
});
test('unprojected click chooses diamond and never a wall face',()=>{
  assert.equal(pickCell(-25,12),null);
  const p=project(9,6);
  assert.deepEqual(pointerToCell(300+p.x/2,100+p.y/2,{left:300,top:100,width:480,height:270}),{x:9,y:6});
  assert.equal(isCorridor(pickCell(p.x,p.y+ISO.depth).x,pickCell(p.x,p.y+ISO.depth).y),false,'cliff-side projection must not point to a trap slot');
  assert.equal(pointerToCell(0,0,{width:0,height:0,left:0,top:0}),null);
});
test('build diamonds match legacy trap placement rules',()=>{
  assert.deepEqual(ROUTES,[3,6,9]);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    assert.equal(isTrapSlot(x,y),x>=2&&x<=19&&ROUTES.includes(y));
    if(isTrapSlot(x,y))assert.ok(isCorridor(x,y));
  }
});
test('isometric render source does not change engine module', async()=>{
  const engine=await import('../src/engine.js');
  const s=engine.createRun();assert.equal(s.wave,1);assert.ok(engine.canBuild(5,3));
});
