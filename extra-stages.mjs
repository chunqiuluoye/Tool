// Native pixel scenery: cached 480×240 layers, with lightweight weather overlays.
const cache=new Map();
const colors={snow:['#506d98','#c7dce7','#e9f2f0'],desert:['#643655','#edb772','#9b694e'],shrine:['#525e84','#e5b6bf','#685470'],harbor:['#101f36','#536b7d','#384653'],foundry:['#201c32','#944d43','#34303c']};
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function poly(c,pts,color){c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function stageLayer(id){
 if(cache.has(id))return cache.get(id);
 const canvas=document.createElement('canvas');canvas.width=480;canvas.height=240;const c=canvas.getContext('2d'),[sky,horizon,floor]=colors[id];
 const gradient=c.createLinearGradient(0,0,0,210);gradient.addColorStop(0,sky);gradient.addColorStop(1,horizon);c.fillStyle=gradient;c.fillRect(0,0,480,240);
 if(id==='snow'){
  rect(c,365,22,25,25,'#ebf0e5');
  for(let i=0;i<6;i++){let x=i*100-30;poly(c,[[x-60,160],[x+45,35+(i%3)*20],[x+140,165]],i%2?'#92afc5':'#7796b6');poly(c,[[x+45,35+(i%3)*20],[x+12,92],[x+43,79],[x+68,99]],'#e1ebee');}
  for(const x of [18,44,418,452]){rect(c,x,96,4,100,'#454758');for(let j=0;j<3;j++)poly(c,[[x-22-j*5,168-j*22],[x+2,99-j*11],[x+27+j*5,168-j*22]],'#d1e3e4');}
  rect(c,129,106,224,88,'#584854');rect(c,141,118,200,65,'#c8b7a5');
  poly(c,[[110,112],[241,63],[370,112]],'#344557');poly(c,[[109,109],[241,60],[371,109],[339,105],[241,75],[140,108]],'#edf6f1');
  for(let x=148;x<340;x+=24){rect(c,x,123,17,58,'#485669');rect(c,x+7,123,2,58,'#bba995');}
  rect(c,116,190,250,7,'#acb8ba');
 }else if(id==='desert'){
  rect(c,325,33,51,47,'#ffcc7a');
  for(let i=0;i<4;i++)poly(c,[[i*155-100,168],[i*155+30,113+i%2*17],[i*155+160,177]],i%2?'#bb815e':'#cb966b');
  for(const x of [18,82,326,394]){rect(c,x,80,47,117,'#9f624f');rect(c,x-4,77,55,9,'#e0a779');for(let k=0;k<4;k++)rect(c,x+k*13,66,7,14,'#ce9469');for(let y=97;y<187;y+=18)rect(c,x+4,y,37,2,'#865547');rect(c,x+15,111,16,35,'#503e48');}
  rect(c,139,97,152,97,'#c38b63');poly(c,[[171,195],[171,133],[214,108],[260,134],[260,195]],'#513b48');
  for(const x of [130,277]){rect(c,x,92,14,105,'#e1ad78');rect(c,x-3,90,20,7,'#754b45');}
  for(let x=155;x<275;x+=20)rect(c,x,90,10,13,'#e8b481');
 }else if(id==='shrine'){
  for(let i=0;i<4;i++)poly(c,[[i*180-80,181],[i*170+90,64],[i*170+225,182]],i%2?'#6a728a':'#8e91a1');
  for(const x of [36,418]){rect(c,x,83,11,114,'#634451');poly(c,[[x+4,146],[x-31,103],[x-27,97],[x+9,125],[x+41,82],[x+46,86]],'#634451');for(let i=0;i<12;i++){const xx=x+Math.sin(i*2.4)*49,yy=69+Math.cos(i*2.1)*27;rect(c,xx,yy,27,23,i%2?'#efb8cc':'#cc88ab');}}
  rect(c,140,93,12,103,'#aa4d51');rect(c,329,93,12,103,'#aa4d51');rect(c,125,82,232,12,'#a64a51');rect(c,119,77,244,6,'#423c53');rect(c,134,111,214,8,'#c06461');rect(c,229,91,24,29,'#453f54');
  for(const x of [95,372]){rect(c,x,162,7,33,'#949099');rect(c,x-8,146,22,17,'#ffdfac');poly(c,[[x-15,147],[x+4,134],[x+23,147]],'#595469');}
 }else if(id==='harbor'){
  rect(c,0,147,480,49,'#28495a');for(let i=0;i<33;i++)rect(c,(i*73)%480,150+(i*11)%45,24,2,'#729299');
  for(const x of [72,366]){rect(c,x,42,7,134,'#283142');rect(c,x-47,40,136,6,'#273040');poly(c,[[x-47,40],[x,9],[x+89,40]],'#344658');rect(c,x+69,45,2,59,'#202b3c');rect(c,x+62,101,15,8,'#a29073');}
  for(let i=0;i<5;i++){let x=15+i*98,y=171-i%2*31;rect(c,x,y,91,26,i%2?'#66585b':'#456974');for(let j=0;j<10;j++)rect(c,x+j*9,y+3,2,20,'#293c4a');}
  rect(c,196,110,70,35,'#344253');rect(c,214,95,31,18,'#697779');poly(c,[[165,142],[303,142],[280,165],[188,165]],'#202e40');rect(c,205,122,48,3,'#e4c686');
 }else{
  for(const x of [18,73,394,444]){rect(c,x,22,20,173,'#373341');rect(c,x-4,53,28,9,'#5a4b4d');rect(c,x-4,115,28,9,'#5a4b4d');}
  rect(c,153,79,164,117,'#503b40');poly(c,[[143,83],[176,59],[292,59],[327,83]],'#74605b');rect(c,181,110,109,84,'#ed8550');rect(c,191,122,89,65,'#ffd080');for(let x=190;x<290;x+=15)rect(c,x,111,6,85,'#45373b');
  for(let y=34;y<181;y+=35){rect(c,0,y,480,5,'#2b2d3b');for(let x=0;x<480;x+=70)poly(c,[[x,y],[x+6,y],[x+60,y+35],[x+54,y+35]],'#3c3540');}
 }
 rect(c,0,198,480,42,floor);rect(c,0,198,480,4,id==='snow'?'#f8f8ee':'#ac9c94');
 for(let x=0;x<480;x+=40){rect(c,x,204,1,36,id==='snow'?'#a9c3d3':'#2b293e');rect(c,x,220,40,1,id==='snow'?'#a9c3d3':'#2b293e');}
 if(id==='foundry')for(let x=0;x<480;x+=24)poly(c,[[x,201],[x+12,201],[x+20,207],[x+8,207]],'#d9a25c');
 cache.set(id,canvas);return canvas;
}
export function drawExtraStage(c,id,time){
 if(!colors[id])return false;
 c.imageSmoothingEnabled=false;c.drawImage(stageLayer(id),0,0,960,480);
 const t=typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches?0:time;
 c.save();c.globalAlpha=id==='harbor'?.28:.65;
 for(let i=0;i<65;i++){
  let x=(i*137+t*(id==='desert'?105:22))%1000-20,y=((i*79+t*(id==='harbor'?280:id==='foundry'?-45:35))%430+430)%430;
  if(id==='harbor')rect(c,x,y,2,13,'#c2dbe5');
  else if(id==='snow')rect(c,x+Math.sin(t+i)*8,y,i%3+2,3,'#f5fafb');
  else if(id==='desert')rect(c,x,y,12+i%10,1,'#f0c891');
  else if(id==='shrine')poly(c,[[x,y],[x+5,y-2],[x+9,y+2],[x+4,y+5]],'#ffd1e0');
  else rect(c,x,y,2,i%3+2,i%3?'#b2938d':'#ffc16b');
 }
 c.restore();return true;
}
