/** Screen-space, deterministic atmospherics. No simulation or model dependencies. */
export function atmosphereLights(){return Object.freeze([
{x:279,y:73,r:112,color:[255,160,76],strength:.23},
{x:335,y:72,r:110,color:[255,146,72],strength:.19},
{x:580,y:257,r:100,color:[255,167,74],strength:.15},
{x:736,y:312,r:124,color:[203,116,255],strength:.24},
{x:490,y:316,r:84,color:[131,210,240],strength:.11}]);}
export function ambientRim(g,t=0,reduced=false){
g.save();let radial=g.createRadialGradient(475,32,20,475,250,670);
radial.addColorStop(0,'rgba(124,91,189,0.11)');radial.addColorStop(.6,'rgba(41,37,70,0.04)');
radial.addColorStop(1,'rgba(4,6,18,0.22)');g.fillStyle=radial;g.fillRect(0,0,960,540);
for(const L of atmosphereLights()){const pulse=reduced?1:1+.08*Math.sin(t*2.4+L.x*.02);
const [r,gr,b]=L.color;const c=a=>`rgba(${r},${gr},${b},${a})`;
radial=g.createRadialGradient(L.x,L.y,2,L.x,L.y,L.r*pulse);
radial.addColorStop(0,c(L.strength));radial.addColorStop(.28,c(L.strength*.37));radial.addColorStop(1,c(0));
g.fillStyle=radial;g.fillRect(L.x-L.r-25,L.y-L.r-25,(L.r+25)*2,(L.r+25)*2);}
for(let i=0;i<27;i++){const x=(i*181+31)%950,y=(i*83+45+(reduced?0:Math.floor(t*6+i*17)%90))%500;
g.globalAlpha=.18+(i%4)*.11;g.fillStyle=i%3?'#e0b1ff':'#ffc879';g.fillRect(x,y,1+(i%3===0),1);}
g.globalAlpha=1;radial=g.createRadialGradient(475,260,190,475,270,615);
radial.addColorStop(0,'rgba(4,7,17,0)');radial.addColorStop(.62,'rgba(4,7,17,0.05)');
radial.addColorStop(1,'rgba(2,5,13,0.46)');g.fillStyle=radial;g.fillRect(0,0,960,540);g.restore();
}
export function paintChasm(g,time=0,reduced=false){
g.save();for(let i=0;i<12;i++){const x=(i*101+23)%1030-25,peak=420+(i*37)%75,h=90+(i*17)%110;
g.fillStyle=i%2?'#17182c':'#211b31';g.fillRect(x,peak,23+(i%4)*9,h);
g.fillStyle='#5f3a52';g.fillRect(x,peak,23+(i%4)*9,2);
g.fillStyle='#0b1223';g.fillRect(x+3,peak+4,7,h-4);}
const wave=reduced?0:Math.sin(time*1.4)*3;
for(let i=0;i<28;i++){const x=(i*89+44)%970-8,y=492+(i*11)%46+wave;
g.fillStyle=i%5?'#753549':'#c85e4b';g.globalAlpha=i%3?.44:.73;g.fillRect(x,y,15+(i%4)*8,2);g.fillRect(x+7,y+5,4+i%7,1);}
g.globalAlpha=1;g.restore();}
