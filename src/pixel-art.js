/**
 * TrapScholar hand-authored pixel art. No image requests, runtime dependencies or external assets.
 * Every sprite is painted once onto an offscreen 32×32 canvas and reused with nearest-neighbor rendering.
 * Canvas and the art API are browser-only; combat/research modules remain pure JavaScript.
 */
export const PIXEL_ART_VERSION = 1;
const SIZE = 32;
const cache = new Map();
const PALETTE = Object.freeze({
  ink:'#101321', deepest:'#15182a', shadow:'#22233a', slate:'#302d43',
  stone:'#454052', lit:'#5f576b', bevel:'#75677d', shine:'#93849c',
  gold:'#dca15c', lightGold:'#ffdc86', rose:'#de6b78', ruby:'#9e3d58',
  violet:'#a66beb', lilac:'#d5a7ff', mint:'#8ce6bd', aqua:'#83ddea',
  sea:'#4aaeb9', poison:'#76d88d', ice:'#c1f3ff', cream:'#f8e5c5',
});
const {ink,shadow,slate,stone,lit,bevel,shine,gold,lightGold,rose,ruby,violet,lilac,mint,aqua,sea,poison,ice,cream}=PALETTE;
const hash = n => {let v=(n*1597334677+3812015801)|0;v^=v>>>13;v=Math.imul(v,1274126177);return v>>>0;};
function paint(ctx,id,variant=0){
  const b=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x|0,y|0,w|0,h|0);};
  const d=(cx,cy,r,color)=>{for(let k=-r;k<=r;k++){const half=Math.floor((r-Math.abs(k))*.85)+1;b(cx-half,cy+k,half*2+1,1,color);}};
  const mark=(x,y,color)=>{b(x,y,2,1,color);b(x+1,y-1,1,3,color);};
  const crack=(x,y,color)=>{b(x,y,1,3,color);b(x+1,y+2,3,1,color);b(x+3,y+3,1,2,color);};
  const gem=(x,y,c1,c2)=>{b(x-2,y-4,4,2,c1);b(x-4,y-2,8,5,c1);b(x-2,y+3,4,2,c1);b(x,y-2,2,4,c2);b(x-2,y-3,2,2,c2);};
  // All tiles have a 1px ink outline and stone lighting from the upper left.
  if(id==='floor'||id==='floor-build'){
    b(0,0,32,32,ink);b(1,1,30,29,variant%3===0?'#4b4258':variant%3===1?'#48435a':'#464251');
    b(1,1,30,2,'#71657a');b(1,3,2,26,'#6b5e74');b(3,29,28,2,'#292738');
    b(16,3,1,11,'#393347');b(5,15,24,1,'#322e42');b(9,16,1,13,'#352f43');
    b(3,5,10,1,'#625a6f');b(18,19,10,1,'#65596c');
    const r=hash(variant+3);
    if(r%3===0)crack(23,8,'#353043');
    if(r%4===1){b(6,23,3,2,'#62596c');b(5,24,1,2,'#292838');}
    if(r%5===0){b(27,4,3,2,'#527569');b(25,6,3,1,'#435b56');}
    if(id==='floor-build'){
      b(4,4,4,1,'#9c7a90');b(4,4,1,4,'#9c7a90');
      b(24,4,4,1,'#9c7a90');b(27,4,1,4,'#9c7a90');
      b(4,27,4,1,'#765c7d');b(4,24,1,4,'#765c7d');
      b(24,27,4,1,'#765c7d');b(27,24,1,4,'#765c7d');
      b(14,13,4,1,'#7e6b8d');b(13,14,1,4,'#7e6b8d');b(18,14,1,4,'#7e6b8d');b(14,18,4,1,'#7e6b8d');
    }
    return;
  }
  if(id==='wall'){
    b(0,0,32,32,'#101727');b(0,0,32,13,'#202337');
    b(1,2,16,10,'#333246');b(18,2,13,10,'#3c354c');
    b(2,2,15,2,'#53495f');b(19,2,12,2,'#5b4c60');
    b(2,15,9,12,'#373346');b(12,15,19,12,'#393449');
    b(2,15,9,2,'#5b5267');b(12,15,19,2,'#594e62');
    b(0,27,32,5,'#171b2c');b(0,28,32,1,'#302a41');
    if(variant%3===0){b(2,5,4,2,'#485a56');b(4,4,3,2,'#64816a');b(23,18,5,2,'#465854');}
    if(variant%4===1)crack(23,18,'#212234');
    if(variant%7===3){b(8,20,2,2,'#865c68');b(8,19,1,1,'#c77b77');}
    return;
  }
  if(id==='gate'){
    // Double door cut into a gothic block, with pixel-cut battlements.
    b(1,4,30,28,ink);b(3,3,26,27,slate);b(5,6,22,24,lit);
    b(8,10,16,22,ink);b(10,8,12,24,'#28243e');b(12,7,8,4,'#28243e');
    b(12,11,8,19,'#6e425e');b(15,11,2,19,'#c18a70');
    b(10,14,12,2,'#8d5d70');b(11,20,10,1,'#a06f7b');
    b(8,3,16,3,bevel);b(5,5,4,4,bevel);b(23,5,4,4,bevel);
    b(11,0,10,5,slate);b(14,2,4,5,lightGold);
    b(15,3,2,4,cream);b(14,7,4,1,rose);
    b(2,28,28,3,'#211e31');return;
  }
  if(id==='vault'){
    b(3,23,26,6,ink);b(5,22,22,4,slate);b(8,19,16,4,lit);b(10,18,12,3,bevel);
    b(6,10,4,13,slate);b(22,10,4,13,slate);b(5,8,6,4,bevel);b(21,8,6,4,bevel);
    b(11,12,10,3,'#9c5fbe');b(12,9,8,8,violet);b(14,5,4,20,lilac);
    b(9,13,14,4,'#8155b6');b(15,4,2,20,ice);b(12,12,8,2,cream);
    b(16,3,2,3,lightGold);b(7,8,2,2,lightGold);b(25,16,2,2,lilac);
    b(5,27,22,2,gold);return;
  }
  if(id==='torch'){
    b(11,23,10,8,ink);b(13,22,6,8,slate);b(8,18,16,5,ink);b(9,17,14,4,bevel);
    b(12,7,9,12,'#8b3949');b(13,5,6,13,'#da694a');b(14,2,5,14,'#ffa64d');
    b(15,6,3,10,cream);b(12,14,4,5,'#ffcb69');b(18,17,2,3,'#bf6745');return;
  }
  if(id==='banner'){
    b(8,1,16,3,gold);b(10,4,12,22,'#83374c');b(11,5,10,19,'#b05369');
    b(10,26,4,3,'#83374c');b(18,26,4,3,'#83374c');b(14,12,4,8,lightGold);
    b(12,14,8,3,lightGold);b(11,5,10,2,rose);return;
  }
  if(id==='spikes'){
    b(3,24,26,6,ink);b(4,22,24,4,'#823d57');b(5,24,22,3,'#c15c61');
    for(let j=0;j<3;j++){const x=5+j*8;
      b(x+1,20,6,5,'#3b354d');b(x+2,12,4,10,'#a8a7bb');b(x+3,7,2,7,ice);
      b(x+2,15,1,7,'#f1d5d3');b(x+5,16,1,6,'#66667f');
      b(x+1,22,7,2,'#29283d');
    }
    b(4,27,24,1,lightGold);return;
  }
  if(id==='frost'){
    b(3,24,26,5,ink);b(5,23,22,4,'#33677b');b(7,25,18,2,'#75d8ed');
    b(11,18,3,6,'#61b6d9');b(15,10,4,14,'#89d9fa');b(16,7,2,17,ice);
    b(20,15,3,9,'#67bdda');b(18,18,1,4,'#e5fbff');b(14,18,2,4,ice);
    b(7,15,3,3,'#95e4ed');b(24,10,3,3,ice);b(25,7,1,8,ice);
    b(8,8,1,5,'#b1f2fa');b(5,11,6,1,'#b1f2fa');
    b(18,5,1,4,'#e9fbff');b(16,7,5,1,'#e9fbff');return;
  }
  if(id==='bolt'){
    b(5,24,22,6,ink);b(7,22,18,5,'#654858');b(10,12,12,13,slate);
    b(11,11,10,12,bevel);b(12,7,8,10,'#725093');b(14,5,4,13,violet);
    b(10,9,12,3,'#d7ac70');b(9,14,14,4,'#d3a75e');
    b(3,16,26,4,ink);b(4,15,24,3,lit);b(23,13,6,3,gold);
    gem(16,12,violet,ice);b(11,24,10,2,gold);b(7,27,18,2,'#332a38');return;
  }
  if(id==='venom'){
    b(3,24,26,6,ink);b(4,23,24,4,'#264d4b');b(6,26,20,2,'#618a5b');
    b(10,14,12,11,'#295c50');b(8,15,16,8,'#3e8562');
    b(11,10,10,6,poison);b(13,6,6,8,'#477855');b(14,8,4,6,'#d0ed99');
    b(7,19,3,4,'#a0d579');b(23,17,3,5,'#a0d579');
    for(const [x,y] of [[7,8],[24,7],[19,3]]){b(x,y,4,4,'#35765b');b(x+1,y+1,2,2,'#a8f9a6');}
    return;
  }
  if(id.startsWith('hero-')){
    const role=id.slice(5).replace(/-walk$/,'');const walk=id.endsWith('-walk');
    // Shadows and silhouette (all characters fit in the 32×32 logical tile).
    b(7,29,18,2,'#171a2ac0');
    const step=walk?1:0;
    b(9,24,6,6+step,'#27233a');b(18,25-step,6,5+step,'#27233a');
    const clothes=role==='scout'?'#347861':role==='guardian'?'#61768b':role==='arcanist'?'#684a9a':'#a8495c';
    const highlight=role==='scout'?'#87c3a2':role==='guardian'?'#d3cbb3':role==='arcanist'?'#b38edc':'#eb8a7e';
    b(8,13,18,13,ink);b(10,13,14,13,clothes);b(11,14,12,4,highlight);
    b(9,18,5,5,'#392f4c');b(20,18,5,6,clothes);
    b(12,6,10,9,'#dfa985');b(14,9,6,5,'#f3c69d');
    b(14,11,2,2,'#30263b');b(20,11,2,2,'#30263b');
    if(role==='raider'){
      b(8,6,15,5,ink);b(11,3,11,5,'#adb8c9');b(12,4,8,2,cream);b(10,8,4,5,'#a8aaba');
      b(21,16,8,3,'#e3d4b2');b(26,10,2,17,'#c7c4d5');b(27,8,1,7,'#ffffff');
      b(4,16,7,9,'#5e5777');b(5,17,5,7,'#d6b778');b(6,18,3,5,'#823f56');
      b(12,15,7,7,'#d7c6b4');b(13,16,5,5,'#9c4c69');
    } else if(role==='scout'){
      b(8,5,17,9,'#184838');b(11,3,11,5,'#3c9669');b(6,10,6,7,'#306f53');
      b(8,12,5,3,'#7bbf80');b(10,17,13,2,'#9bce93');
      b(23,17,7,2,'#d1b58f');b(26,15,2,13,'#bab9ad');b(27,13,1,6,cream);
    } else if(role==='guardian'){
      b(8,4,16,6,ink);b(10,2,12,9,'#acbacc');b(12,3,8,3,cream);
      b(7,11,6,11,'#96a4b5');b(21,11,6,11,'#899cae');
      b(11,15,12,8,'#b8b6b4');b(13,16,8,5,'#788fa7');
      b(5,16,7,12,'#424b68');b(6,17,5,10,'#dfcc9c');b(7,20,3,3,rose);
      b(25,16,3,12,'#e8d2b9');
    } else if(role==='arcanist'){
      b(7,7,19,5,'#543175');b(11,2,12,8,violet);b(14,0,6,8,'#c18af3');
      b(6,10,23,4,'#403056');b(11,12,15,2,'#9f69d6');
      b(13,15,9,6,'#b578dd');b(14,16,7,3,lilac);
      b(26,7,2,22,'#c9a177');gem(27,5,violet,ice);b(25,10,4,2,'#d5b38d');
    }
    b(8,27,7,3,ink);b(19,27,7,3,ink);return;
  }
  if(id==='rune'){
    for(const [x,y] of [[15,5],[7,14],[23,14],[15,24]])gem(x,y,'#6c4d85',lilac);
    b(11,11,10,2,'#9971bb');b(9,14,14,2,'#8f61b3');b(12,18,8,2,'#a779c7');return;
  }
}
export function pixelSprite(id,variant=0){
  const key=`${id}:${variant}`;
  if(!cache.has(key)){
    const element=document.createElement('canvas');element.width=SIZE;element.height=SIZE;
    const c=element.getContext('2d');c.imageSmoothingEnabled=false;
    paint(c,id,variant);cache.set(key,element);
  }
  return cache.get(key);
}
export function drawPixelSprite(context,id,x,y,variant=0){
  context.drawImage(pixelSprite(id,variant),Math.round(x),Math.round(y),SIZE,SIZE);
}
export const availableSprites = Object.freeze(['floor','floor-build','wall','gate','vault','torch','banner','spikes','frost','bolt','venom','hero-raider','hero-raider-walk','hero-scout','hero-scout-walk','hero-guardian','hero-guardian-walk','hero-arcanist','hero-arcanist-walk','rune']);
