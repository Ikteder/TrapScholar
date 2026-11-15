/** Original TrapScholar 4x4 sprite atlas. No internet dependencies during gameplay. */
export const ATLAS={tile:32,columns:4,rows:4,count:16,path:'assets/world/prop-atlas.svg'};
export const PROP={relic:0,torch:1,skull:2,chest:3,crystal:4,mossRock:5,banner:6,book:7,barrel:8,mushrooms:9,rune:10,brazier:11,vines:12,obelisk:13,coins:14,ruins:15};
export function atlasFrame(id){if(!Number.isInteger(id)||id<0||id>=16)throw new RangeError('Invalid sprite id');
return {sx:(id%4)*32,sy:Math.floor(id/4)*32,sw:32,sh:32};}
let sheet;
export function drawProp(g,id,x,y,size=32,opacity=1){
if(typeof Image==='undefined')return false;
if(!sheet){sheet=new Image();sheet.src=ATLAS.path;}
if(!sheet.complete||sheet.naturalWidth!==128)return false;
const f=atlasFrame(id);g.save();g.imageSmoothingEnabled=false;g.globalAlpha=opacity;
g.drawImage(sheet,f.sx,f.sy,f.sw,f.sh,Math.round(x-size/2),Math.round(y-size),size,size);
g.restore();return true;
}
