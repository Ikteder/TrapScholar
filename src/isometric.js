/** Pure projection + hit testing. The game retains its existing grid combat rules. */
export const ISO = Object.freeze({originX: 426, originY: 65, halfW: 23, halfH: 11.5, depth: 31, width: 960, height: 540});
export const COLS = 22, ROWS = 13;
export const ROUTES = Object.freeze([3, 6, 9]);
export function isCorridor(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=1&&x<=20&&(ROUTES.includes(y)||((x===1||x===20)&&y>=3&&y<=9));}
export function isTrapSlot(x,y){return Number.isInteger(x)&&x>=2&&x<=19&&ROUTES.includes(y);}
export function project(x,y,options=ISO){return {x:options.originX+(x-y)*options.halfW,y:options.originY+(x+y)*options.halfH};}
export function inverse(screenX,screenY,options=ISO){
  const dx=(screenX-options.originX)/options.halfW,dy=(screenY-options.originY)/options.halfH;
  return {x:(dx+dy)/2,y:(dy-dx)/2};
}
export function pickCell(screenX,screenY,options=ISO){
  if(!Number.isFinite(screenX)||!Number.isFinite(screenY))return null;
  const p=inverse(screenX,screenY,options);
  const x=Math.round(p.x),y=Math.round(p.y);
  if(x<0||x>=COLS||y<0||y>=ROWS)return null;
  const dx=Math.abs(screenX-project(x,y,options).x)/options.halfW;
  const dy=Math.abs(screenY-project(x,y,options).y)/options.halfH;
  // Exact diamond: this prevents selecting a tile through a cliff face.
  if(dx+dy>1.00001)return null;
  return {x,y};
}
/** Browser pointer positions, expressed in the canvas' internal coordinate system. */
export function pointerToCell(clientX,clientY,rect,options=ISO){
  if(!rect||rect.width<=0||rect.height<=0)return null;
  return pickCell((clientX-rect.left)/rect.width*options.width,(clientY-rect.top)/rect.height*options.height,options);
}
