import {FIGHTERS} from './game-config.mjs';
import {moveFor} from './engine.mjs';
let portraits;
export function preloadUltimateArt(){
  if(!portraits&&typeof Image!=='undefined'){
    portraits=new Image();portraits.src=new URL('./assets/ultimate-portraits.png',import.meta.url).href;
  }
  return portraits;
}
const reduced=()=>typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function poly(c,p,color){c.fillStyle=color;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function label(c,s,x,y,size,color){c.font=`bold ${size}px "Microsoft YaHei", sans-serif`;c.fillStyle=color;c.textAlign='left';c.fillText(s,x,y);}

// Dedicated atlas portraits, independent from the small battle sprites.
export function drawUltimateCutin(c,g){
  const scene=g.cinematic;if(!scene)return;
  const atlas=preloadUltimateArt(), dual=scene.owners.length===2;
  c.save();c.fillStyle='#090c21b8';c.fillRect(0,84,960,349);
  scene.owners.forEach((owner,row)=>{
    const f=g.fighters[owner],d=FIGHTERS.find(v=>v.id===f.id),m=moveFor(f,'super');
    const t=scene.time,enter=Math.min(1,t/.17),leave=Math.max(0,(t-(scene.duration-.14))/.14);
    const x=48+(reduced()?0:((1-enter)**3+leave**2)*(owner?980:-980));
    const y=dual?94+row*165:132,h=dual?153:244,portraitSize=h;
    c.save();c.translate(x,y);
    poly(c,[[0,0],[864,0],[842,h],[0,h]],'#111729');
    poly(c,[[0,0],[864,0],[860,5],[0,5]],d.color);
    if(atlas?.complete&&atlas.naturalWidth){
      const index=FIGHTERS.findIndex(v=>v.id===f.id),w=atlas.naturalWidth/4,ah=atlas.naturalHeight/2;
      c.save();c.beginPath();c.rect(0,5,portraitSize,h-10);c.clip();c.imageSmoothingEnabled=false;
      c.drawImage(atlas,(index%4)*w,Math.floor(index/4)*ah,w,ah,0,0,portraitSize,portraitSize);c.restore();
    }else {label(c,d.en,22,h/2,32,d.color);}
    for(let k=0;k<7;k++){c.fillStyle=d.color+'18';c.fillRect(portraitSize+20+k*76,17,40,2);}
    const tx=portraitSize+26;
    label(c,`${owner+1}P  /  ${d.en} · ${d.name}`,tx,dual?30:44,14,d.color);
    label(c,m.name,tx,dual?73:111,dual?32:46,'#fff1dc');
    label(c,m.subtitle,tx,dual?99:143,12,d.color);
    label(c,m.hint,tx,dual?130:202,13,'#d3d8e7');
    c.fillStyle=d.color;c.fillRect(0,h-4,864*Math.min(1,t/scene.duration),4);
    c.restore();
  });
  c.restore();
}

export function drawUltimateEffects(c,g){
  for(const f of g.fighters){
    if(f.attack!=='super')continue;
    const m=moveFor(f),d=FIGHTERS.find(v=>v.id===f.id),t=f.actionTime;
    c.save();c.strokeStyle=d.color;c.lineWidth=3;c.fillStyle=d.color;
    if(m.field){
      const x=f.ultimateTarget,r=m.range*d.reach;
      if(t<m.active){
        c.globalAlpha=.6;c.fillRect(x-r,410,r*2,4);
        for(let k=-2;k<=2;k++)poly(c,[[x+k*25-5,401],[x+k*25,395],[x+k*25+5,401]],'#d3f5ff');
        label(c,'冰柱落点',x-29,391,11,'#d3f5ff');
      }else if(t<m.end+.26){
        const growth=Math.min(1,(t-m.active)/.08),fade=Math.max(0,1-(t-m.end)/.26);c.globalAlpha=fade;
        for(let k=-2;k<=2;k++){const xx=x+k*29,height=(145-Math.abs(k)*25)*growth;
          poly(c,[[xx-17,415],[xx-10,415-height*.7],[xx+5,415-height],[xx+17,415]],'#74c6e9');
          poly(c,[[xx+5,415-height],[xx+2,415],[xx+12,415]],'#e0fcff');}
      }
      c.restore();continue;
    }
    c.translate(f.x,350-f.y);c.scale(f.facing,1);
    const active=t>=m.active&&t<=m.end;
    if(!active){
      if(t<m.active){c.globalAlpha=.35;for(let k=0;k<6;k++){const a=k*Math.PI/3;c.fillRect(Math.cos(a)*36,Math.sin(a)*50,4,8);}}
      c.restore();continue;
    }
    const pulse=(t-m.active)*20;
    if(m.theme==='earth'){
      c.lineWidth=5;c.beginPath();c.arc(0,-25,56,pulse,pulse+Math.PI*1.3);c.stroke();
    }else if(m.theme==='moon'){
      poly(c,[[-140,18],[-32,-38],[102,-53],[42,-34],[-34,-21]],'#d7c2ffb0');
      poly(c,[[-110,35],[26,-12],[95,-50],[44,-6]],'#fff0ff');
    }else if(m.theme==='meteor'){
      poly(c,[[5,44],[20,-25],[44,-117],[46,-43],[31,36]],'#ffb453b0');
      poly(c,[[24,10],[38,-103],[41,-53]],'#fff1c5');
    }else if(m.theme==='wind'||m.theme==='sun'){
      for(let k=0;k<3;k++){c.globalAlpha=1-k*.23;c.lineWidth=5-k;c.beginPath();c.ellipse(12,0,67+k*7,48+k*8,0,pulse+k,pulse+k+Math.PI*1.4);c.stroke();}
    }else if(m.theme==='petal'){
      for(let k=0;k<9;k++){const a=k*2.4+t*6,x=35+Math.cos(a)*50,y=Math.sin(a)*52;poly(c,[[x-6,y],[x,y-4],[x+7,y],[x,y+6]],k%2?'#ffbbd4':'#ef729e');}
    }else{
      for(let k=0;k<5;k++){const x=22+k*10,y=Math.sin(pulse+k)*20;poly(c,[[x-35,y+12],[x+17,y-10],[x+8,y-26],[x+33,y+1],[x+6,y+22]],k%2?'#ffb657a0':'#f45f4fa0');}
    }
    c.restore();
  }
}
