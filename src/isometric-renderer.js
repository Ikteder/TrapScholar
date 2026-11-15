import { ISO, COLS, ROWS, ROUTES, isCorridor, isTrapSlot, project } from './isometric.js';
import { pixelSprite } from './pixel-art.js';

const P={void:'#0a0d1c',shadow:'#13182b',edge:'#22283c',stone:'#58516b',light:'#9d8698',gold:'#e8b36b',purple:'#bf79ff',mint:'#94efc4',ice:'#a1eafa'};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

// Decorative shoulder masonry thickens bridges without changing the underlying
// three-lane grid. Only glowing sockets on the three central lanes are interactive.
function isPlatform(x,y){
  if(isCorridor(x,y))return true;
  if(!Number.isInteger(x)||x<2||x>19)return false;
  if(y===2||y===10)return x>=3&&x<=18;
  if(y===4)return (x>=3&&x<=8)||(x>=13&&x<=18);
  if(y===5)return (x>=3&&x<=9)||(x>=12&&x<=18);
  if(y===7)return (x>=3&&x<=8)||(x>=12&&x<=18);
  if(y===8)return (x>=3&&x<=9)||(x>=13&&x<=18);
  return false;
}
const hash=(a,b)=>{let v=Math.imul(a+73,13325331)^Math.imul(b+173,832141);v^=v>>>13;return (v>>>0)/4294967296;};
const rect=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
function poly(g,points,fill,stroke=null){g.beginPath();g.moveTo(points[0][0],points[0][1]);for(const p of points.slice(1))g.lineTo(...p);g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.lineWidth=1;g.strokeStyle=stroke;g.stroke();}}
function diamond(g,x,y,hw,hh,color,border=null){poly(g,[[x,y-hh],[x+hw,y],[x,y+hh],[x-hw,y]],color,border);}
function star(g,x,y,r,color){rect(g,x-1,y-r,2,2*r,color);rect(g,x-r,y-1,2*r,2,color);rect(g,x-2,y-2,4,4,'#f4e9ff');}
function brick(g,x,y,w,h,seed){rect(g,x,y,w,h,'#282b40');for(let j=0;j<3;j++){const by=y+j*(h/3)|0;rect(g,x,by,w-1,1,'#655773');for(let i=0;i<5;i++){const bx=x+i*w/5+((j%2)*w/10);rect(g,bx,by+2,1,Math.max(2,h/3-3),'#10192e');}}}
function background(g,time,reduced){
  const grad=g.createLinearGradient(0,0,0,540);grad.addColorStop(0,'#171327');grad.addColorStop(.42,'#101527');grad.addColorStop(1,'#070e1e');g.fillStyle=grad;g.fillRect(0,0,960,540);
  // Stylized subterranean backdrop: no copyrighted or external runtime textures.
  for(let i=0;i<29;i++){
    const x=30+Math.floor(hash(i,19)*900),y=22+Math.floor(hash(i,23)*350),sz=1+Math.floor(hash(i,37)*2);
    rect(g,x,y,sz,sz,i%4?'#3f375c':'#7a5380');
  }
  for(let i=0;i<12;i++){
    const x=(i*113+41)%960,h=85+(i*29)%112;
    rect(g,x,0,31+(i%3)*20,h,'#1b1c30');brick(g,x,0,30+(i%3)*20,h,i);
    rect(g,x-5,h,42+(i%3)*20,5,'#3d3450');rect(g,x-2,h+5,35+(i%3)*20,12,'#151b2c');
  }
  for(let i=0;i<13;i++){
    const x=(i*167+89)%960, y=462+(i%3)*13;
    rect(g,x,y,35,92,'#18192a');rect(g,x+6,y,24,3,'#65546d');
  }
  // Remote shattered arcade, glowing windows, chained masonry and pixel banners.
  for(const x of [120,790,900]){
    rect(g,x,56,15,170,'#343044');rect(g,x-6,49,29,10,'#74677a');
    rect(g,x+89,56,15,170,'#343044');rect(g,x+83,49,29,10,'#74677a');
    rect(g,x+8,45,90,13,'#5e4e67');
    rect(g,x+17,59,4,47,'#a27973');rect(g,x+27,59,4,35,'#a27973');
    rect(g,x+36,60,4,22,'#a27973');
    rect(g,x+44,78,25,54,'#3e203c');rect(g,x+48,84,17,42,'#6b3150');
    rect(g,x+54,87,3,20,'#ebb276');
  }
  // Lava beneath floating platforms: ambient warmth, with an occasional glowing ember.
  const lava=g.createRadialGradient(500,565,10,500,565,385);lava.addColorStop(0,'#b44543aa');lava.addColorStop(.5,'#582a45aa');lava.addColorStop(1,'#10122600');
  g.fillStyle=lava;g.fillRect(0,300,960,240);
  for(let i=0;i<24;i++){const x=70+(i*53)%840,y=495+(i*19)%40,blink=reduced?.6:.45+.3*Math.sin(time*3+i);g.globalAlpha=blink;rect(g,x,y,1+(i%2),3+i%4,'#ffb76d');}g.globalAlpha=1;
  for(const [x,y] of [[120,461],[389,492],[726,477]]){
    poly(g,[[x-62,y+26],[x-30,y+14],[x+8,y+23],[x+60,y+10],[x+70,y+34],[x-57,y+44]],'#3a2439','#6a3345');
    poly(g,[[x-36,y+26],[x-5,y+21],[x+38,y+25],[x+14,y+32]],'#b34e43','#ec8156');
    rect(g,x+10,y+22,17,2,'#ed9a65');rect(g,x-25,y+34,10,2,'#f2ad6c');
  }
}
function floorTile(g,x,y,time){
  const {halfW:w,halfH:h,depth:d}=ISO;const c=project(x,y);const p=c.x,q=c.y;
  // Tile supports are below the floor; the visible southeast/southwest cliffs produce depth.
  if(!isPlatform(x+1,y))poly(g,[[p+w,q],[p,q+h],[p,q+h+d],[p+w,q+d]],'#352d42','#463954');
  if(!isPlatform(x,y+1))poly(g,[[p-w,q],[p,q+h],[p,q+h+d],[p-w,q+d]],'#403349','#554257');
  if(!isPlatform(x+1,y)||!isPlatform(x,y+1)){
    rect(g,p-1,q+h+d-2,3,2,'#a27b68');
    if(hash(x,y)>.65)rect(g,p-4,q+h+8,3,6,'#6f5868');
  }
  const mix=hash(x,y),main=isCorridor(x,y);diamond(g,p,q,w,h,main?(mix<.32?'#62566d':mix<.66?'#76627a':'#826e7e'):(mix<.42?'#54485e':'#665366'),'#413649');
  // Pixel highlights and masonry seams on the tile surface.
  poly(g,[[p-w+3,q-1],[p,q-h+1],[p+w-3,q-1]],'#00000000','#a18a8b');
  if(mix>.72){rect(g,p+4,q-2,4,1,'#403547');rect(g,p+6,q-1,1,3,'#403547');}
  if(mix<.18){rect(g,p-9,q-1,4,1,'#768d78');rect(g,p-6,q-2,4,1,'#70896d');}
  if(!main){if(mix>.35){rect(g,p-12,q-4,5,2,'#312b40');rect(g,p-2,q+3,3,1,'#b3938f');}if(mix<.24){rect(g,p+8,q-3,4,2,'#3a5b59');rect(g,p+6,q-5,2,3,'#678775');}}
  if(isTrapSlot(x,y)){
    diamond(g,p,q,12,5,'#28253a','#9c7d93');
    rect(g,p-2,q-1,4,2,'#b998b9');
  }
  if(ROUTES.includes(y)&&x>=2&&x<=19){rect(g,p-2,q+h-2,4,1,['#bd9ae5','#68c8c3','#ecb47f'][ROUTES.indexOf(y)]);}
}
function column(g,x,y,h=62){
  const p=project(x,y);const a=p.x,b=p.y-9;
  poly(g,[[a-13,b],[a,b-7],[a+13,b],[a+13,b-h],[a,b-h-7],[a-13,b-h]],'#382c45');
  rect(g,a-8,b-h-23,16,h+12,'#564660');rect(g,a-8,b-h-23,16,3,'#a18390');
  rect(g,a-13,b-h-26,26,6,'#796779');rect(g,a-13,b-h-26,4,7,'#b49a9c');
  rect(g,a-12,b-10,25,6,'#42364d');rect(g,a-11,b-13,23,3,'#7a6172');
  // Purple banner.
  rect(g,a-7,b-h-15,14,22,'#6d365f');rect(g,a-5,b-h-13,10,16,'#aa477b');
  rect(g,a-1,b-h-11,2,9,'#edd08f');
}
function torch(g,x,y,t,reduced){
  rect(g,x-6,y-7,12,5,'#8e6b68');rect(g,x-3,y-13,6,7,'#624055');
  const flick=reduced?0:Math.round(Math.sin(t*8+x)*2);
  poly(g,[[x-5,y-14],[x-3,y-24+flick],[x,y-33+flick],[x+5,y-23],[x+5,y-14]],'#f29143');
  poly(g,[[x-2,y-15],[x-1,y-21],[x+2,y-27],[x+3,y-17]],'#ffdf8d');
  g.save();const gr=g.createRadialGradient(x,y-19,0,x,y-19,29);gr.addColorStop(0,'#ff9a5160');gr.addColorStop(1,'#ff9a5100');g.fillStyle=gr;g.fillRect(x-29,y-48,58,58);g.restore();
}
function crystal(g,x,y,t,scale=1){
  const pulse=Math.sin(t*3)*2;
  g.save();g.translate(x,y);g.scale(scale,scale);
  const glow=g.createRadialGradient(0,-15,2,0,-15,45);glow.addColorStop(0,'#dd95fd80');glow.addColorStop(1,'#bb65fd00');g.fillStyle=glow;g.fillRect(-45,-60,90,90);
  poly(g,[[-11,-16],[0,-37-pulse],[12,-17],[8,-2],[0,7],[-9,-3]],'#783bc6','#e7b5fb');
  poly(g,[[0,-36-pulse],[12,-17],[0,-11]],'#d9a4ff');poly(g,[[0,-11],[12,-17],[8,-2],[0,7]],'#a663f5');
  poly(g,[[-11,-16],[0,-37-pulse],[0,-11]],'#b576ed');rect(g,-2,-27,3,17,'#fff5ff');
  for(let i=0;i<4;i++){const a=t*1.2+i*Math.PI/2,rad=29;rect(g,Math.cos(a)*rad,Math.sin(a)*8-14,3,3,'#ffe6a0');}
  g.restore();
}
function relic(g,t,reduced){
  const c=project(20,6),x=c.x,y=c.y;
  // Gold shrine on a stepped raised dais.
  diamond(g,x,y+3,34,17,'#3d2a4c','#d39a68');
  diamond(g,x,y-9,28,14,'#68526e','#e8b47b');
  diamond(g,x,y-16,22,11,'#9e667f','#ffcf91');
  rect(g,x-30,y-24,6,25,'#67506c');rect(g,x+24,y-24,6,25,'#67506c');
  rect(g,x-33,y-28,12,5,'#ce9872');rect(g,x+21,y-28,12,5,'#ce9872');
  crystal(g,x,y-23,reduced?0:t,1.28);
  if(!reduced){star(g,x+36,y-52,4,'#f7c985');star(g,x-33,y-61,3,'#eac0fc');}
}
function entryGate(g,t,reduced){const p=project(1,6);const x=p.x,y=p.y;
  column(g,1,5,43);column(g,1,7,43);
  poly(g,[[x-26,y-8],[x-21,y-54],[x+23,y-54],[x+30,y-8]],'#362d43','#ac8893');
  poly(g,[[x-11,y-7],[x-11,y-31],[x-6,y-40],[x+8,y-40],[x+14,y-31],[x+14,y-7]],'#1a1932','#ac7292');
  rect(g,x-21,y-59,42,7,'#7e697c');rect(g,x-22,y-60,6,10,'#b99a96');
  rect(g,x+17,y-60,6,10,'#b99a96');
  torch(g,x-30,y-50,t,reduced);torch(g,x+29,y-50,t,reduced);
}
function trap(g,x,y,kind,t,reduced,alpha=1,power=false){
  const c=project(x,y),cx=c.x,cy=c.y;
  g.save();g.globalAlpha=alpha;
  // Shadow / floor plate.
  diamond(g,cx,cy-2,16,7,'#322a43','#ac8b91');
  const shimmer=reduced?0:Math.sin(t*5+x*2.5+y)*2;
  if(kind==='spikes'){
    diamond(g,cx,cy-3,15,6,'#a85369','#fc9d88');
    for(const [dx,dy,sz] of [[-9,-1,14],[0,-4,19],[8,1,13]]){
      poly(g,[[cx+dx-4,cy+dy-1],[cx+dx,cy+dy-sz],[cx+dx+4,cy+dy-1]],'#aeb5c6','#24213b');
      poly(g,[[cx+dx,cy+dy-sz],[cx+dx+4,cy+dy-1],[cx+dx+1,cy+dy-1]],'#f0d9d8');
    }
  }else if(kind==='bolt'){
    rect(g,cx-8,cy-17,16,17,'#302b49');rect(g,cx-8,cy-17,16,4,'#8b7186');
    diamond(g,cx,cy-19,14,6,'#7d637b','#deae7a');
    poly(g,[[cx-8,cy-24],[cx,cy-36],[cx+7,cy-24],[cx+3,cy-15]],'#965cda','#fad1ff');
    rect(g,cx,cy-32,2,15,'#f3d6ff');rect(g,cx+3,cy-39+shimmer,3,3,'#eb9fff');
    rect(g,cx+8,cy-23,15,5,'#c79d70');rect(g,cx+17,cy-25,7,9,'#4c3d5c');
  }else if(kind==='frost'){
    diamond(g,cx,cy-4,15,7,'#377e9d','#92eeff');
    for(const [dx,dy,hh] of [[-7,0,14],[0,-3,25],[8,0,13]]){
      poly(g,[[cx+dx-5,cy+dy-1],[cx+dx,cy+dy-hh],[cx+dx+5,cy+dy-1]],'#60afde','#ddfbff');
      poly(g,[[cx+dx,cy+dy-hh],[cx+dx+5,cy+dy-1],[cx+dx,cy+dy-2]],'#b9f5ff');
    }
    rect(g,cx+12,cy-22+shimmer,2,2,'#fff');
  }else if(kind==='venom'){
    diamond(g,cx,cy-4,15,7,'#2e695d','#9bd695');
    rect(g,cx-5,cy-19,10,15,'#365e52');
    poly(g,[[cx-10,cy-21],[cx,cy-32],[cx+10,cy-21],[cx+5,cy-14],[cx-6,cy-14]],'#69bc78','#defbb5');
    for(let i=0;i<4;i++){const a=i*Math.PI/2+t*.8;rect(g,cx+Math.cos(a)*12,cy-19+Math.sin(a)*5,3,3,'#b1f39d');}
  }
  if(power)star(g,cx-14,cy-28,2,'#ffd77d');
  g.restore();
}
function hero(g,h,t,reduced){
  const a=h.route[h.index],b=h.route[Math.min(h.index+1,h.route.length-1)];
  const x=a.x+(b.x-a.x)*h.progress,y=a.y+(b.y-a.y)*h.progress;
  const p=project(x,y),bob=reduced?0:Math.sin(t*11)*2;
  // Hero is hand-authored 32x32 pixel sprite, viewed from the same fixed diagonal camera.
  g.save();g.fillStyle='#10172ca8';g.beginPath();g.ellipse(p.x,p.y+3,17,6,0,0,Math.PI*2);g.fill();
  const step=!reduced&&Math.floor(t*7)%2===1;
  const sprite=`hero-${h.className}${step?'-walk':''}`;
  g.imageSmoothingEnabled=false;g.drawImage(pixelSprite(sprite),Math.round(p.x-24),Math.round(p.y-49+bob),48,48);
  if(h.counter){rect(g,p.x-14,p.y-12,25,2,'#9de3f0');}
  if(h.dots.some(d=>d.source==='venom'))rect(g,p.x+13,p.y-28,4,4,'#b2ef97');
  if(h.dots.some(d=>d.source==='frost'))rect(g,p.x-18,p.y-19,4,4,'#b2f4fc');
  rect(g,p.x-19,p.y-52,38,5,'#151827');
  rect(g,p.x-18,p.y-51,36,3,'#6a354e');
  rect(g,p.x-18,p.y-51,Math.round(36*clamp(h.hp/h.maxHp,0,1)),3,h.hp/h.maxHp>.38?'#8fe8ac':'#ff838b');
  g.restore();
}
function routeSigns(g,forecast){
  const colors=['#cfa5ef','#77f1c8','#f0be88'];
  for(let i=0;i<ROUTES.length;i++){
    const p=project(7,ROUTES[i]),f=forecast?.[i];
    const cx=p.x-2,cy=p.y-43;
    rect(g,cx-40,cy-10,83,18,'#141526de');rect(g,cx-39,cy-9,81,1,colors[i]);
    g.textAlign='center';g.fillStyle=colors[i];g.font='bold 11px monospace';
    g.fillText(`${['NORTH','CENTRAL','SOUTH'][i]}  ${f?Math.round(f.probability*100)+'%':'33%'}`,cx+1,cy+3);
  }
}
function gargoyle(g,x,y){
  const p=project(x,y),a=p.x,b=p.y;
  // Winged stone gargoyle perched at the edge of a bridge.
  rect(g,a-6,b-17,12,15,'#46415b');rect(g,a-8,b-21,16,6,'#7f6e83');
  poly(g,[[a-5,b-20],[a-23,b-34],[a-17,b-18],[a-5,b-14]],'#50495f','#9c8290');
  poly(g,[[a+5,b-20],[a+23,b-34],[a+17,b-18],[a+5,b-14]],'#50495f','#9c8290');
  rect(g,a-5,b-25,10,8,'#958291');rect(g,a-2,b-24,2,2,'#ec9cc6');rect(g,a+3,b-24,2,2,'#ec9cc6');
  rect(g,a-13,b-5,26,4,'#2e2a41');
}
function floorRune(g,x,y,t,color='#ac88ff'){
  const p=project(x,y),cx=p.x,cy=p.y;
  g.save();g.globalAlpha=.74;
  diamond(g,cx,cy,15,7,'#563e7c','#d4aaff');
  diamond(g,cx,cy,9,4,'#2d274f',color);
  star(g,cx,cy-2,5,color);g.globalAlpha=1;g.restore();
  if(Math.sin(t*4+x*3+y)>0.8)rect(g,cx+8,cy-14,2,2,'#f4d5ff');
}
function stoneStairs(g,x,y){
  const p=project(x,y);
  for(let i=0;i<3;i++){
    diamond(g,p.x+i*6,p.y+i*4,15-i*2,6-i,'#9f7b79','#d9a58b');
  }
}
function rubble(g,x,y){
  const p=project(x,y);
  for(let i=0;i<3;i++){
    const rx=p.x-11+i*9,ry=p.y-4+(i%2)*4;
    poly(g,[[rx-5,ry],[rx,ry-4],[rx+6,ry],[rx,ry+3]],i%2?'#716176':'#9891a0','#403447');
    rect(g,rx-3,ry-2,3,1,'#ddbd9d');
  }
}
function lightPool(g,x,y,color){
  const p=project(x,y);const glow=g.createRadialGradient(p.x,p.y,5,p.x,p.y,85);
  glow.addColorStop(0,color);glow.addColorStop(1,'#00000000');g.fillStyle=glow;
  g.fillRect(p.x-90,p.y-90,180,180);
}
function environment(g,t,reduced){
  // Structural set dressing on non-interactive platforms.
  for(const [x,y] of [[4,2],[9,10],[17,2],[17,10]]){
    const p=project(x,y);lightPool(g,x,y,'#df93531f');torch(g,p.x,p.y-5,t,reduced);
  }
  for(const [x,y] of [[11,2],[6,10],[16,5]])floorRune(g,x,y,t);
  for(const [x,y] of [[4,4],[18,8]])rubble(g,x,y);
  for(const [x,y] of [[11,5],[9,8]])gargoyle(g,x,y);
  stoneStairs(g,20,5);
  // A few azure runes and mossy bricks make the platforms feel lived in.
  for(const [x,y] of [[13,7],[7,2],[15,10]]){
    const p=project(x,y);star(g,p.x,p.y-4,4,'#a6eaff');
    rect(g,p.x-12,p.y+2,6,2,'#507b70');
  }
}
export function renderIsometric(g,{traps={},hero:active=null,hovered=null,selected='spikes',phase='build',time=0,reduced=false,power=false,forecast=null,particles=[],floaters=[],paused=false,showRisk=false}){
  g.save();g.imageSmoothingEnabled=false;
  background(g,time,reduced);
  // Mountains and distant pillars; gameplay tiles are all lifted above a lava chasm.
  for(const [x,y,h] of [[2,1,46],[13,0,56],[0,11,64],[22,11,52]]){
    const p=project(x,y);rect(g,p.x-17,p.y-h,32,h,'#282337');rect(g,p.x-21,p.y-h,40,6,'#69546b');
  }
  const positions=[];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(isPlatform(x,y))positions.push({x,y});
  positions.sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.y-b.y);
  for(const {x,y} of positions)floorTile(g,x,y,time);
  // Optional interpretation layer. Uses OBSERVED model risk, not actual hidden trap map.
  // It is intentionally drawn below structures, traps and heroes to avoid obscuring play.
  if(showRisk && Array.isArray(forecast) && forecast.some(l=>l.visits>0)){
    const max=Math.max(...forecast.map(l=>l.estimatedDamage),0.001);
    for(let lane=0;lane<ROUTES.length;lane++){
      const risk=forecast[lane].estimatedDamage/max;
      const ink=risk>.66?'#ff817d':risk>.33?'#edc38c':'#83e8ce';
      for(let x=3;x<=19;x++){
        const p=project(x,ROUTES[lane]);
        diamond(g,p.x,p.y,ISO.halfW-7,ISO.halfH-5,'#00000000',ink);
        rect(g,p.x-2,p.y+2,4,2,ink);
      }
    }
  }
  // Vertical architecture, localized to the route entrance and relic.
  entryGate(g,time,reduced);
  environment(g,time,reduced);
  for(const [x,y] of [[4,2],[12,5],[17,8],[7,10]]){
    const p=project(x,y);column(g,x,y,33);torch(g,p.x,p.y-44,time,reduced);
  }
  for(const {x,y} of positions){
    const kind=traps[`${x},${y}`];if(kind)trap(g,x,y,kind,time,reduced,1,power&&['spikes','bolt'].includes(kind));
  }
  relic(g,time,reduced);
  if(hovered&&isTrapSlot(hovered.x,hovered.y)&&phase==='build'){
    const p=project(hovered.x,hovered.y);
    diamond(g,p.x,p.y,ISO.halfW-2,ISO.halfH-1,'#ffffff12','#edcaff');
    if(selected!=='erase'&&!traps[`${hovered.x},${hovered.y}`])trap(g,hovered.x,hovered.y,selected,time,reduced,.63,power);
    if(selected==='erase')star(g,p.x,p.y-7,7,'#ffabb8');
  }
  if(active)hero(g,active,time,reduced);
  for(const p of particles){g.globalAlpha=clamp(p.life/p.max,0,1);rect(g,p.x,p.y,p.size,p.size,p.color);}g.globalAlpha=1;
  for(const f of floaters){g.globalAlpha=clamp(f.life,0,1);g.font='bold 14px monospace';g.textAlign='center';g.fillStyle=f.color;g.fillText(f.label,f.x,f.y);}g.globalAlpha=1;
  routeSigns(g,forecast);
  // Small HUD helps teach players to interact with the 2.5D diamond tiles.
  rect(g,18,18,258,52,'#0d1324d9');rect(g,18,18,258,2,'#b18ce3');
  g.fillStyle='#ead7ff';g.textAlign='left';g.font='bold 15px monospace';g.fillText('SHADOW VAULT  //  ISO',29,40);
  g.fillStyle='#a6a8bf';g.font='11px monospace';g.fillText('CLICK HIGHLIGHTED DIAMONDS TO BUILD',29,58);
  rect(g,17,494,324,30,'#141425dd');g.fillStyle='#a2ebd4';g.font='bold 11px monospace';g.fillText('▸ THREE ROADS  •  ONE RELIC  •  LEARNING HEROES',28,512);
  if(paused&&phase==='raid'){
    rect(g,0,0,960,540,'#090e1cb8');g.textAlign='center';g.font='bold 35px monospace';g.fillStyle='#e2b4fa';g.fillText('PAUSED',480,260);
  }
  if(phase==='won'||phase==='lost'){
    rect(g,0,0,960,540,'#0b1020b9');g.textAlign='center';g.font='bold 41px monospace';g.fillStyle=phase==='won'?'#99f3bc':'#f59ab0';
    g.fillText(phase==='won'?'VICTORY — RELIC DEFENDED':'THE RELIC HAS FALLEN',480,266);
    g.font='16px monospace';g.fillStyle='#e5d6e7';g.fillText(phase==='won'?'Fifteen waves survived':'Reset and rebuild your defense',480,295);
  }
  g.restore();
}
