import { FIGHTERS, moveFor, AIR_KICK_LANDING } from './engine.mjs';
import {WEAPONS} from './game-config.mjs';

const base = {hip:[0,-28],neck:[0,-51],head:[3,-63],backElbow:[-16,-39],backHand:[-12,-29],elbow:[17,-38],hand:[25,-48],backKnee:[-13,-14],backFoot:[-19,0],knee:[9,-13],foot:[20,0]};
const mix=(a,b,t)=>Object.fromEntries(Object.keys(a).map(k=>[k,[a[k][0]+(b[k][0]-a[k][0])*t,a[k][1]+(b[k][1]-a[k][1])*t]]));
const pose=changes=>({...base,...changes});
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const punches=['punch','cross','airpunch','palm','flameRush'];
const kicks=['kick','roundhouse','airkick','cyclone','flip'];
const stances={
  kai:pose({hip:[-1,-28],neck:[0,-51],head:[3,-63],backElbow:[-12,-37],backHand:[-5,-31],elbow:[14,-40],hand:[22,-49],backFoot:[-23,0],foot:[22,0]}),
  rin:pose({hip:[-5,-26],neck:[-5,-48],head:[-1,-61],backElbow:[-20,-35],backHand:[-28,-31],elbow:[13,-40],hand:[25,-50],knee:[16,-20],foot:[21,0]}),
  rex:pose({hip:[-2,-24],neck:[1,-44],head:[5,-58],backElbow:[-22,-34],backHand:[-12,-47],elbow:[23,-33],hand:[24,-49],backKnee:[-20,-12],backFoot:[-29,0],knee:[20,-12],foot:[29,0]}),
  yuna:pose({hip:[-4,-28],neck:[1,-50],head:[6,-62],backElbow:[-18,-46],backHand:[-11,-58],elbow:[20,-39],hand:[31,-46],backFoot:[-26,0],foot:[19,0]}),
  mei:pose({neck:[2,-51],head:[5,-63],elbow:[15,-42],hand:[25,-52],backElbow:[0,-39],backHand:[15,-45],backFoot:[-14,0],foot:[17,0]}),
  vexa:pose({hip:[-2,-26],neck:[1,-48],head:[5,-60],elbow:[16,-39],hand:[18,-57],backElbow:[-10,-40],backHand:[4,-54],backFoot:[-23,0],foot:[23,0]}),
  aoi:pose({hip:[1,-31],neck:[0,-54],head:[4,-66],backElbow:[-17,-42],backHand:[-4,-50],elbow:[18,-46],hand:[30,-54],backFoot:[-13,0],foot:[15,0]}),
  luna:pose({hip:[-3,-23],neck:[-8,-46],head:[-3,-59],backElbow:[-22,-35],backHand:[-28,-43],elbow:[16,-36],hand:[25,-43],backKnee:[-20,-11],backFoot:[-27,0],knee:[16,-15],foot:[29,0]}),
};
export function samplePose(f,time=0){
  const action=f.attack||f.action||'idle',m=moveFor(f,action),name=m?.pose||action,t=f.actionTime||0;
  const mei=f.id==='mei',boxer=f.id==='vexa';
  const neutral=stances[f.id]||base;
  let p=neutral;
  if(name==='walk'){
    const s=Math.sin(f.walkCycle??time*13),stride=mei?.65:boxer?.8:f.id==='rex'?.6:f.id==='luna'?1.2:1,bounce=Math.abs(s)*(boxer?3:f.id==='rex'?.6:1);
    p=pose({...neutral,hip:[neutral.hip[0]+s,neutral.hip[1]+bounce],neck:[neutral.neck[0]+s,neutral.neck[1]+bounce],head:[neutral.head[0]+s,neutral.head[1]+bounce],backKnee:[neutral.backKnee[0]-s*8*stride,-14],backFoot:[neutral.backFoot[0]-s*12*stride,Math.min(0,s*5)],knee:[neutral.knee[0]+s*8*stride,-13],foot:[neutral.foot[0]+s*12*stride,Math.min(0,-s*5)]});
    if(f.id==='luna'){p.neck=[neutral.neck[0]+s*4,neutral.neck[1]+bounce];p.hand=[25+s*8,-43];p.backHand=[-28+s*6,-43];}
  }
  else if(name==='jump')p=pose({backKnee:[-17,-29],backFoot:[-25,-18],knee:[16,-32],foot:[24,-17],elbow:[18,-47],hand:[25,-61]});
  else if(name==='landing'){
    const planted=pose({...neutral,hip:[-3,-19],neck:[-3,-41],head:[1,-54],knee:[17,-10],foot:[25,0],backKnee:[-19,-9],backFoot:[-25,0]});
    const duration=Math.max(AIR_KICK_LANDING,t+(f.landingRecovery||0));
    p=mix(planted,neutral,ease((t-.04)/Math.max(.01,duration-.04)));
    if(f.transition&&t<.04)p=mix(samplePose({...f,...f.transition,transition:null},time),planted,ease(t/.04));
  }
  else if(name==='guard')p=pose({neck:[-4,-50],head:[-1,-63],elbow:[14,-42],hand:[13,-61],backElbow:[-7,-45],backHand:[5,-59]});
  else if(name==='hurt')p=pose({hip:[-4,-27],neck:[-12,-49],head:[-12,-61],elbow:[9,-36],hand:[22,-34],backElbow:[-23,-40],backHand:[-25,-29]});
  else if(name==='thrown')p=pose({hip:[0,-28],neck:[-4,-47],head:[-2,-60],elbow:[18,-39],hand:[27,-53],backElbow:[-17,-41],backHand:[-22,-54],knee:[22,-25],foot:[35,-12],backKnee:[-15,-28],backFoot:[-25,-18]});
  else if(name==='down')p=pose({hip:[-6,-9],neck:[-27,-13],head:[-39,-15],backKnee:[5,-6],backFoot:[23,-1],knee:[17,-8],foot:[37,-1],elbow:[-24,-4],hand:[-11,-2],backElbow:[-36,-7],backHand:[-44,-2]});
  else if(name==='crouch')p=pose({hip:[-7,-16],neck:[-3,-36],head:[1,-48],backKnee:[-19,-8],backFoot:[-23,0],knee:[15,-9],foot:[26,0],elbow:[17,-25],hand:[25,-36]});
  if(m){
    let wind=pose({hip:[-3,-26],neck:[-6,-49],head:[-3,-61],elbow:[4,-41],hand:[8,-51]});
    let strike=pose({neck:[8,-49],head:[12,-61],elbow:[29,-46],hand:[47,-46]});
    if(punches.includes(name)){
      const rear=name==='cross';strike=pose({hip:[5,-28],neck:[10,-49],head:[12,-62],elbow:[31,-48],hand:[name==='flameRush'?49:45,-48],backElbow:[-4,-37],backHand:[5,-43],backFoot:[-25,0],foot:[25,0]});
      if(rear)strike=pose({...strike,backElbow:[28,-46],backHand:[47,-45],elbow:[13,-40],hand:[9,-49]});
      if(name==='palm'&&t>.24){const s=Math.sin((t-.12)*Math.PI/ .15);strike=mix(strike,pose({neck:[7,-50],head:[11,-62],elbow:[8,-36],hand:[12,-44],backElbow:[24,-46],backHand:[43,-48]}),(s+1)/2);}
      if(name==='airpunch')strike=pose({...strike,knee:[17,-24],foot:[28,-14],backKnee:[-10,-29],backFoot:[-20,-17]});
    }else if(kicks.includes(name)){
      wind=pose({hip:[-5,-28],neck:[-7,-51],head:[-3,-63],knee:[13,-35],foot:[9,-22],hand:[18,-51]});
      strike=pose({hip:[-3,-29],neck:[-16,-51],head:[-12,-63],knee:[23,-39],foot:[50,-43],backKnee:[-11,-14],backFoot:[-16,0],elbow:[1,-39],hand:[13,-49],backElbow:[-30,-43],backHand:[-34,-30]});
      if(name==='roundhouse'||name==='cyclone'){strike.foot=[52,-53];strike.knee=[23,-45];strike.neck=[-13,-51];if(name==='cyclone'){const s=Math.sin(t*36);strike.foot[1]+=s*16;strike.knee[1]+=s*5;}}
      if(name==='airkick'||name==='flip'){strike.backKnee=[-21,-25];strike.backFoot=[-34,-16];strike.foot=[48,-29];}
    }else if(name==='uppercut'||name==='rising'){
      wind=pose({hip:[-5,-20],neck:[-5,-40],head:[0,-53],elbow:[15,-26],hand:[11,-39],knee:[17,-11]});
      strike=pose({hip:[4,-28],neck:[7,-54],head:[11,-66],elbow:[24,-66],hand:[19,-86],backElbow:[-9,-41],backHand:[-5,-31],knee:[19,-30],foot:[26,-18],backKnee:[-7,-14],backFoot:[-13,0]});
    }else if(name==='sweep'){
      wind=pose({hip:[-9,-16],neck:[-9,-35],head:[-5,-47],knee:[17,-11],foot:[27,0]});
      strike=pose({hip:[-4,-12],neck:[-17,-31],head:[-12,-43],knee:[25,-7],foot:[51,-5],backKnee:[-18,-6],backFoot:[-29,0],elbow:[4,-20],hand:[14,-31],backElbow:[-26,-17],backHand:[-31,-3]});
    }else if(name==='pickup'){
      strike=pose({hip:[-9,-17],neck:[6,-30],head:[16,-40],elbow:[17,-17],hand:[25,-3],backKnee:[-17,-7],backFoot:[-23,0],knee:[16,-9],foot:[26,0]});wind=base;
    }else if(name==='bottle'){
      wind=pose({neck:[-8,-52],head:[-3,-64],elbow:[-20,-54],hand:[-19,-75]});strike=pose({neck:[10,-50],head:[14,-61],elbow:[32,-53],hand:[43,-47],backFoot:[-27,0]});
    }else if(name==='grab'){
      wind=pose({neck:[7,-49],head:[11,-61],elbow:[25,-40],hand:[36,-44],backElbow:[19,-48],backHand:[30,-52]});strike=pose({hip:[-2,-25],neck:[-9,-47],head:[-6,-59],elbow:[-8,-62],hand:[-24,-74],backElbow:[-17,-58],backHand:[-32,-67]});
    }else if(name==='dash'){
      const target=pose({hip:[-5,-24],neck:[11,-44],head:[17,-56],elbow:[-3,-31],hand:[-14,-36],backElbow:[-18,-38],backHand:[-29,-48],backFoot:[-32,0],knee:[15,-16],foot:[25,0]});return mix(neutral,target,Math.sin(Math.min(1,t/m.duration)*Math.PI));
    }else if(name==='shoulder')strike=pose({hip:[5,-26],neck:[16,-46],head:[14,-59],elbow:[25,-41],hand:[17,-48],backElbow:[0,-36],backHand:[8,-30],backFoot:[-25,0]});
    else {wind=pose({neck:[-6,-50],head:[-3,-62],elbow:[0,-36],hand:[-5,-42],backHand:[0,-48]});strike=pose({neck:[7,-50],head:[9,-63],elbow:[25,-42],hand:[40,-44],backElbow:[20,-50],backHand:[36,-49]});}
    // The extended limb reaches the same near edge of the opponent as the hit rule.
    const reach=(m.range*(FIGHTERS.find(d=>d.id===f.id)?.reach||1)-18)/1.95-(WEAPONS[f.weapon]?.moves[f.attack]?WEAPONS[f.weapon].length:0);
    if(punches.includes(name)){const key=name==='cross'?'backHand':'hand';strike[key]=[reach,strike[key][1]];const joint=name==='cross'?'backElbow':'elbow';strike[joint]=[Math.min(strike[joint][0],reach-9),strike[joint][1]];if(boxer){wind=pose({...neutral,hip:[-5,-25],neck:[-8,-47],head:[-4,-59],hand:[8,-57]});strike.hip=[7,-27];strike.neck=[12,-48];}if(mei){wind=neutral;strike.backFoot=[-14,0];strike.foot=[20,0];}}
    if(kicks.includes(name)||name==='sweep')strike.foot=[reach,strike.foot[1]];
    if(name==='flameRush'){wind=pose({...neutral,hip:[-8,-25],neck:[-12,-45],head:[-8,-57],hand:[-1,-38]});strike.backHand=[-9,-33];}
    if(name==='cyclone'){strike.backHand=[-35,-41];strike.backElbow=[-25,-46];strike.head=[-15,-63];}
    if(name==='shoulder'){wind=pose({...neutral,hip:[-9,-19],neck:[-5,-37],head:[0,-51],hand:[18,-42]});strike.hip=[10,-24];strike.knee=[25,-12];strike.foot=[32,0];}
    if(name==='crescent'){wind=pose({...neutral,hand:[-20,-62],elbow:[-11,-47],backHand:[12,-43]});strike=pose({...strike,hand:[43,-58],elbow:[24,-48],backHand:[-22,-39],backElbow:[-16,-31],head:[8,-63]});}
    if(name==='frost'){wind=pose({...neutral,hand:[17,-71],elbow:[22,-57],backHand:[-6,-69],backElbow:[-16,-54]});strike=pose({...strike,hand:[39,-56],elbow:[22,-48],backHand:[34,-42],backElbow:[20,-39],neck:[3,-54],head:[7,-66],foot:[18,0]});}
    if(name==='flip')strike=pose({hip:[-3,-40],neck:[-18,-22],head:[-28,-15],elbow:[-30,-12],hand:[-32,0],backElbow:[-6,-23],backHand:[9,-25],knee:[16,-57],foot:[reach,-70],backKnee:[-9,-46],backFoot:[-20,-35]});
    if(t<m.active*.6)p=mix(neutral,wind,ease(t/(m.active*.6)));
    else if(t<m.active)p=mix(wind,strike,ease((t-m.active*.6)/(m.active*.4)));
    else if(t<m.end){
      p=strike;
      if(action==='super'&&m.strikes){
        const beat=m.strikes.filter(v=>v<=t).at(-1)??m.active;
        const phase=Math.min(1,(t-beat)/.14);
        p=mix(strike,wind,ease(phase)*.72);
        if(name==='palm'&&Math.floor((t-m.active)/.15)%2){[p.hand,p.backHand]=[p.backHand,p.hand];[p.elbow,p.backElbow]=[p.backElbow,p.elbow];}
      }
    }
    else if(name==='kick'){
      const chamber=pose({...neutral,hip:[-3,-27],knee:[13,-29],foot:[11,-15],backFoot:[-21,0]});
      const recovery=t-m.end,retract=Math.min(.10,(m.duration-m.end)/2);
      p=recovery<retract?mix(strike,chamber,ease(recovery/retract)):mix(chamber,neutral,ease((recovery-retract)/Math.max(.001,m.duration-m.end-retract)));
    }
    else p=mix(strike,neutral,ease((t-m.end)/(m.duration-m.end)));
  }
  if(f.crouch&&name==='guard')p=Object.fromEntries(Object.entries(p).map(([k,[x,y]])=>[k,[x,y+(k.includes('Foot')||k==='foot'?0:12)]]));
  if(f.transition&&t<.065&&m){const prior=samplePose({...f,...f.transition,transition:null},time);p=mix(prior,p,ease(t/.065));}
  return p;
}
let surface;
function polygon(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill();}
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
function bone(c,a,b,width,color){const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,nx=-dy/len*width/2,ny=dx/len*width/2;polygon(c,[[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]],color);rect(c,b[0]-width/2,b[1]-width/2,width,width,color);}
export function drawBottle(c,x,y,scale=1,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);polygon(c,[[-4,-8],[-1,-11],[1,-8],[4,-11],[5,-5],[5,8],[-5,8],[-5,-5]],'#264e55');polygon(c,[[-3,-6],[0,-9],[1,-5],[3,-8],[3,6],[-3,6]],'#82d4b9');rect(c,-2,-3,2,6,'#d7f3d5');rect(c,-3,2,7,3,'#e9cf9d');c.restore();}
export function drawFighter(c,f,x,ground,scale=2,time=0,portrait=false){
  surface ||= document.createElement('canvas');surface.width=156;surface.height=132;const s=surface.getContext('2d');s.translate(66,119);s.imageSmoothingEnabled=false;
  const d=FIGHTERS.find(v=>v.id===f.id)||FIGHTERS[0],p=samplePose(f,time),female=d.female,heavy=d.id==='rex';
  const ink='#1b1a30',skin=d.skin,shade=female?'#b87977':'#a46960',cloth=d.color,dark=d.dark,light='#ffe3c4';
  const pants=d.id==='kai'?'#e3dbe1':d.id==='rin'?'#d7e6ed':d.look==='dancer'?'#eee0b6':dark;
  const legWidth=heavy?12:female?7:10,hip=p.hip,neck=p.neck,h=p.head,sw=Math.sin(time*4+(f.x||0)*.02)*2;
  const shoulder=[neck[0]+(female?6:heavy?12:9),neck[1]+3],rear=[neck[0]-(female?6:heavy?11:8),neck[1]+3];
  const limb=(a,b,w,color)=>{bone(s,a,b,w+2,ink);bone(s,a,b,w,color);};
  // Hair and ribbons follow the head with a delayed sway.
  if(female){
    if(d.look==='coat'||d.look==='ninja')polygon(s,[[h[0]-8,h[1]-8],[h[0]-15,h[1]+2],[h[0]-15+sw,h[1]+33],[h[0]-22+sw,h[1]+38],[h[0]-7,h[1]+28],[h[0],h[1]+5]],d.hair);
    if(d.look==='boxer')for(let i=0;i<7;i++)rect(s,h[0]-11+Math.sin(i*.7+time*5)*2,h[1]+i*4,6,6,d.hair);
    if(d.look==='dancer')for(let i=0;i<5;i++)rect(s,h[0]-14+(i%2)*4,h[1]-10+i*5,10,11,d.hair);
    if(d.look==='qipao'){rect(s,h[0]-14,h[1]-9,8,9,ink);rect(s,h[0]-13,h[1]-8,6,7,d.hair);rect(s,h[0]-14,h[1]-2,8,2,'#ffe0ac');polygon(s,[[h[0]-13,h[1]], [h[0]-19-sw,h[1]+21],[h[0]-13-sw,h[1]+18]],cloth);}
  }
  limb([hip[0]-5,hip[1]],p.backKnee,legWidth,pants);limb(p.backKnee,p.backFoot,legWidth-1,pants);
  rect(s,p.backFoot[0]-6,p.backFoot[1]-3,12,5,ink);rect(s,p.backFoot[0]-5,p.backFoot[1]-3,10,3,dark);
  limb(rear,p.backElbow,female?6:9,skin);limb(p.backElbow,p.backHand,female?5:8,skin);
  limb([hip[0]+5,hip[1]],p.knee,legWidth,pants);limb(p.knee,p.foot,legWidth-1,d.look==='coat'||d.look==='qipao'?'#282842':pants);
  rect(s,p.foot[0]-4,p.foot[1]-3,14,5,ink);rect(s,p.foot[0]-3,p.foot[1]-3,12,3,dark);rect(s,p.foot[0]-2,p.foot[1],12,1,'#e1bca2');
  // Distinct silhouettes: jacket, martial-arts gi, dress panels, coat or dance suit.
  const waist=female?6:heavy?12:9,bust=female?9:heavy?15:12;
  polygon(s,[[neck[0]-bust,neck[1]],[neck[0]+bust,neck[1]],[hip[0]+waist+2,hip[1]+3],[hip[0]-waist-2,hip[1]+3]],ink);
  polygon(s,[[neck[0]-bust+2,neck[1]+1],[neck[0]+bust-2,neck[1]+1],[hip[0]+waist,hip[1]+1],[hip[0]-waist,hip[1]+1]],cloth);
  polygon(s,[[neck[0]-bust+2,neck[1]+4],[neck[0]-bust+6,neck[1]+7],[hip[0]-waist+3,hip[1]],[hip[0]-waist,hip[1]]],dark);
  if(d.id==='kai'){polygon(s,[[neck[0]-4,neck[1]],[neck[0]+5,neck[1]+1],[hip[0],hip[1]-7]],skin);bone(s,[neck[0]-5,neck[1]],[hip[0]-1,hip[1]-2],3,'#fff0db');}
  else if(heavy){rect(s,neck[0]-9,neck[1]+3,19,16,skin);rect(s,neck[0]-8,neck[1]+12,16,2,shade);}
  else if(d.look==='qipao'){bone(s,[neck[0]+2,neck[1]+1],[hip[0]+6,hip[1]],2,'#ffe3a3');for(let i=0;i<3;i++)rect(s,neck[0]+4,neck[1]+5+i*5,4,1,'#ffe3a3');polygon(s,[[hip[0]-7,hip[1]],[hip[0]+7,hip[1]],[hip[0]+12+sw,hip[1]+15],[hip[0]+2,hip[1]+11],[hip[0]-9,hip[1]+18]],dark);bone(s,[hip[0]+7,hip[1]],[hip[0]+11+sw,hip[1]+14],2,cloth);}
  else if(d.look==='coat'){polygon(s,[[neck[0]-8,neck[1]],[neck[0]-4,neck[1]+1],[hip[0],hip[1]],[hip[0]-13+sw,hip[1]+23],[hip[0]-18+sw,hip[1]+19]],'#ddeefa');polygon(s,[[hip[0]+2,hip[1]],[hip[0]+7,hip[1]-4],[hip[0]+19+sw,hip[1]+18],[hip[0]+8,hip[1]+16]],cloth);bone(s,[neck[0]+1,neck[1]+2],[hip[0]+1,hip[1]],3,'#eef5f8');}
  else if(d.look==='boxer'){rect(s,neck[0]-3,neck[1]+1,7,11,'#332638');bone(s,[neck[0]-5,neck[1]+2],[hip[0]-5,hip[1]-4],3,'#ffdcac');}
  else if(d.look==='dancer'){bone(s,[neck[0]-5,neck[1]+2],[hip[0]+4,hip[1]],4,'#fbe8bb');polygon(s,[[hip[0]-7,hip[1]],[hip[0]+7,hip[1]],[hip[0]+21+sw,hip[1]+10],[hip[0]+10,hip[1]+13]],cloth);}
  else {bone(s,[neck[0]-1,neck[1]+2],[hip[0],hip[1]],3,'#e8ddf0');}
  bone(s,[hip[0]-waist,hip[1]],[hip[0]+waist,hip[1]],4,female?'#f2c699':'#553048');
  // Face, sculpted hair, eyes and accessories; adult sporting silhouettes.
  rect(s,h[0]-7,h[1]-7,16,18,ink);rect(s,h[0]-6,h[1]-5,13,15,skin);rect(s,h[0]-4,h[1]+9,7,4,skin);rect(s,h[0]+7,h[1]+1,3,5,skin);rect(s,h[0]-6,h[1]+4,3,5,shade);
  if(female){polygon(s,[[h[0]-9,h[1]+3],[h[0]-10,h[1]-8],[h[0]-5,h[1]-12],[h[0]+5,h[1]-11],[h[0]+10,h[1]-6],[h[0]+8,h[1]-1],[h[0]+1,h[1]-4],[h[0]-3,h[1]+2],[h[0]-5,h[1]+7]],d.hair);rect(s,h[0]+1,h[1]+1,7,1,ink);rect(s,h[0]+5,h[1]+2,2,2,d.look==='coat'?'#418cbe':'#592b54');rect(s,h[0]+7,h[1],2,1,ink);rect(s,h[0]+3,h[1]+7,4,1,'#b65469');rect(s,h[0]+1,h[1]+5,2,1,'#e79991');rect(s,h[0]-6,h[1]+7,2,2,'#ffde98');}
  else{polygon(s,[[h[0]-9,h[1]+2],[h[0]-10,h[1]-8],[h[0]-5,h[1]-8],[h[0]-3,h[1]-13],[h[0]+1,h[1]-10],[h[0]+5,h[1]-14],[h[0]+9,h[1]-6],[h[0]+7,h[1]-2],[h[0]-1,h[1]-3],[h[0]-4,h[1]+4]],d.hair);rect(s,h[0]+2,h[1]+1,6,2,ink);rect(s,h[0]+5,h[1]+7,4,1,'#844f59');}
  if(d.id==='kai'){rect(s,h[0]-10,h[1]-4,19,3,cloth);polygon(s,[[h[0]-8,h[1]-3],[h[0]-22-sw,h[1]+3],[h[0]-28-sw,h[1]+1],[h[0]-22,h[1]+6]],cloth);}
  if(d.id==='rin')polygon(s,[[neck[0]-8,neck[1]+1],[neck[0]-30-sw,neck[1]+8],[neck[0]-35-sw,neck[1]+3]],cloth);
  if(d.look==='ninja')rect(s,h[0]-8,h[1]-4,5,3,'#f5b4c9');
  if(d.look==='coat')rect(s,h[0]-8,h[1]-3,5,3,'#659fdb');
  limb(shoulder,p.elbow,female?6:heavy?11:9,skin);limb(p.elbow,p.hand,female?5:heavy?10:8,skin);
  const glove=d.look==='boxer'?10:female?6:8;rect(s,p.hand[0]-glove/2-1,p.hand[1]-glove/2-1,glove+2,glove+2,ink);rect(s,p.hand[0]-glove/2,p.hand[1]-glove/2,glove,glove,d.look==='boxer'?cloth:skin);rect(s,p.hand[0]-glove/2,p.hand[1]-glove/2,glove,2,light);rect(s,p.hand[0]-glove/2-1,p.hand[1]+glove/2-2,glove,3,cloth);
  if(f.item!==null&&f.item!==undefined)drawBottle(s,p.hand[0]+3,p.hand[1]-9,.7,-.3);
  c.save();c.imageSmoothingEnabled=false;const bob=portrait||f.attack||f.stun>0||f.y>0?0:Math.sin(time*3.6)*.7;
  c.translate(x,ground-(f.y||0)+bob*scale);if(f.throwRotation){c.translate(0,-55);c.rotate(f.throwRotation);c.translate(0,55);}c.scale(f.facing||1,1);if(f.invulnerable>0)c.globalAlpha=.7;
  c.drawImage(surface,-66*scale,-119*scale,156*scale,132*scale);
  if(WEAPONS[f.weapon]){
    const w=WEAPONS[f.weapon],m=moveFor(f),active=!!w.moves[f.attack],t=f.actionTime||0;
    let angle=-.9;
    if(active){const phase=Math.min(1,t/Math.max(.01,m.active));angle=f.weapon==='spear'?-.8*(1-phase):-.9+Math.sin(phase*Math.PI/2)*.9;}
    if(active&&f.weapon==='sword'&&t>=m.active&&t<=m.end)angle=Math.sin((t-m.active)/Math.max(.01,m.end-m.active)*Math.PI)*.9;
    if(active&&t>m.end)angle=-.9*Math.min(1,(t-m.end)/Math.max(.01,m.duration-m.end));
    c.save();c.translate(p.hand[0]*scale,p.hand[1]*scale);c.rotate(angle);c.scale(scale,scale);
    bone(c,[-7,0],[w.length-7,0],f.weapon==='spear'?3:4,'#352735');
    if(f.weapon==='spear'){
      bone(c,[-19,0],[w.length-9,0],2,'#bf9663');polygon(c,[[w.length-13,-4],[w.length,0],[w.length-13,4]],'#d9eef0');polygon(c,[[w.length-15,1],[w.length-22,12],[w.length-11,6]],'#d75d65');
    }else if(f.weapon==='sword'){
      polygon(c,[[5,-3],[w.length-6,-3],[w.length,0],[w.length-6,3],[5,3]],'#b0dce8');bone(c,[5,0],[w.length-3,0],1,'#f1ffff');bone(c,[4,-7],[4,7],3,'#d3af69');
    }else{
      bone(c,[-6,0],[8,0],4,w.color);const spin=active?t*32:-.6;
      const joint=[12+Math.cos(spin)*5,Math.sin(spin)*5],end=[joint[0]+Math.cos(spin)*15,joint[1]+Math.sin(spin)*15];
      bone(c,[8,0],joint,1,'#dfdbe0');bone(c,joint,end,4,w.color);
    }
    if(active&&t>=m.active&&t<=m.end){c.globalAlpha=.35;bone(c,[12,-5],[w.length,-5],3,w.color);}
    c.restore();
  }
  c.restore();
}
