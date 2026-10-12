import { FIGHTERS, moveFor } from './engine.mjs';
import { RULES } from './game-config.mjs';
import {drawExtraStage} from './extra-stages.mjs';
import { drawFighter, drawBottle } from './fighter-art.mjs';
import {drawUltimateCutin,drawUltimateEffects,preloadUltimateArt} from './ultimate-art.mjs';
preloadUltimateArt();
export { drawFighter } from './fighter-art.mjs';
const palettes = { street: { sky: '#191a30', horizon: '#544056', back: '#282538', front: '#292633', window: '#d39b7e', glow: '#b45568', floor: '#302b3c' }, rooftop: { sky: '#121d32', horizon: '#384460', back: '#242e47', front: '#293448', window: '#d9bd86', glow: '#5797a4', floor: '#30384d' } };
const backgrounds = new Map();
function rand(seed) { let n = seed; return () => { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; }; }
function poly(c, points, color) { c.fillStyle = color; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); }
function rect(c, x, y, w, h, color) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function neon(c, text, x, y, color, size = 12, vertical = false) {
  c.save(); c.fillStyle = color; c.shadowColor = color; c.shadowBlur = 6; c.font = `bold ${size}px "Microsoft YaHei", sans-serif`; c.textAlign = 'center';
  if (vertical) [...text].forEach((v, i) => c.fillText(v, x, y + i * (size + 4))); else c.fillText(text, x, y);
  c.shadowBlur = 0; c.restore();
}
function background(stage) {
  if (backgrounds.has(stage)) return backgrounds.get(stage);
  const canvas = document.createElement('canvas'); canvas.width = 480; canvas.height = 240;
  const c = canvas.getContext('2d'), p = palettes[stage] || palettes.street, r = rand(8781);
  c.imageSmoothingEnabled = false;
  const sky = c.createLinearGradient(0, 0, 0, 195); sky.addColorStop(0, p.sky); sky.addColorStop(1, p.horizon); c.fillStyle = sky; c.fillRect(0, 0, 480, 240);
  for (let i = 0; i < 65; i++) rect(c, r() * 480, r() * 110, 1, 1, ['#8d7994', '#6c6580', '#a896a9'][i % 3]);
  rect(c, 344, 27, 29, 25, '#b4a5a7'); rect(c, 340, 32, 36, 16, '#b4a5a7'); rect(c, 348, 24, 20, 31, '#b4a5a7'); rect(c, 347, 30, 6, 6, '#a196a2'); rect(c, 360, 41, 9, 6, '#c8b5ac');
  for (let i = 0; i < 16; i++) { const x = i * 34 - 5, h = 30 + r() * 80; rect(c, x, 155 - h, 25 + r() * 14, h, p.back); for (let wx = x + 4; wx < x + 23; wx += 6) for (let wy = 160 - h; wy < 148; wy += 9) if (r() > .6) rect(c, wx, wy, 2, 3, '#887583'); }
  if (stage === 'street') {
    // Layered shopfronts, utility lines and apartment windows.
    rect(c, 0, 21, 93, 172, '#302a3e'); rect(c, 6, 21, 84, 4, '#4b3847');
    rect(c, 95, 58, 63, 135, '#2b283a'); rect(c, 98, 53, 58, 6, '#59404a');
    rect(c, 168, 71, 81, 124, '#393040'); rect(c, 167, 69, 83, 4, '#71505c');
    rect(c, 256, 88, 65, 105, '#3b2e3e'); rect(c, 261, 83, 57, 5, '#5f4850');
    rect(c, 331, 66, 85, 132, '#3c303f'); rect(c, 329, 64, 90, 4, '#67505b');
    rect(c, 429, 29, 58, 173, '#2e293b'); rect(c, 427, 29, 53, 5, '#54404d');
    for (const b of [{ x: 5, y: 34, w: 83, h: 83 }, { x: 104, y: 65, w: 47, h: 53 }, { x: 176, y: 81, w: 66, h: 35 }, { x: 340, y: 76, w: 67, h: 38 }, { x: 439, y: 41, w: 39, h: 88 }]) {
      for (let y = b.y; y < b.y + b.h; y += 23) for (let x = b.x; x < b.x + b.w - 10; x += 20) {
        rect(c, x, y, 12, 16, '#1e2030'); const light = r() > .4 ? '#b88279' : '#55516a'; rect(c, x + 2, y + 2, 8, 11, light); rect(c, x + 5, y + 2, 1, 12, '#382c3a'); rect(c, x, y + 16, 13, 2, '#64505b');
      }
    }
    for (let i = 0; i < 12; i++) rect(c, 0, 123 + i * 5, 90, 1, '#493547');
    rect(c, 7, 131, 70, 53, '#1b1d2a'); rect(c, 10, 133, 62, 43, '#574052'); rect(c, 17, 136, 4, 38, '#bf7077'); rect(c, 46, 133, 4, 43, '#251f30');
    rect(c, 83, 103, 24, 72, '#1f1d2c'); rect(c, 86, 105, 19, 62, '#a84f68'); rect(c, 89, 108, 13, 56, '#412b44'); neon(c, '遊戲厅', 96, 123, '#f6a3a4', 10, true);
    rect(c, 117, 135, 40, 49, '#1e202d'); for (let y = 138; y < 183; y += 3) rect(c, 119, y, 35, 1, '#444154'); rect(c, 117, 129, 42, 7, '#5e4756');
    rect(c, 170, 125, 78, 16, '#4a2d43'); rect(c, 173, 128, 72, 10, '#724250'); neon(c, '夜 市 食 堂', 209, 136, '#ffc696', 8);
    rect(c, 174, 142, 70, 41, '#201e2e'); rect(c, 177, 146, 22, 30, '#a76565'); rect(c, 203, 146, 35, 29, '#89585e'); rect(c, 185, 145, 2, 30, '#372536'); rect(c, 215, 145, 3, 31, '#302837');
    for (let x = 169; x < 250; x += 12) { rect(c, x, 140, 11, 5, '#b37672'); rect(c, x + 6, 140, 5, 6, '#553344'); }
    rect(c, 260, 144, 57, 43, '#272331'); for (let y = 145; y < 185; y += 3) rect(c, 262, y, 53, 1, '#594454');
    rect(c, 267, 128, 43, 11, '#222536'); neon(c, 'OPEN 24H', 287, 136, '#6fc4c1', 7);
    rect(c, 330, 120, 90, 20, '#222431'); rect(c, 332, 122, 86, 16, '#59344d'); neon(c, '龍  虎  道  場', 375, 134, '#f8a697', 10);
    rect(c, 335, 142, 80, 44, '#211f2d'); rect(c, 340, 146, 29, 34, '#8f6a6d'); rect(c, 376, 146, 32, 34, '#9c7a78');
    for (let x = 340; x < 412; x += 10) rect(c, x, 144, 2, 39, '#382a3b'); rect(c, 336, 160, 78, 2, '#3e2e3f');
    rect(c, 416, 89, 22, 62, '#181c2a'); rect(c, 418, 91, 18, 56, '#538789'); rect(c, 420, 93, 14, 52, '#25414c'); neon(c, '格闘', 427, 113, '#a4e1d0', 12, true);
    rect(c, 444, 143, 32, 43, '#1d1c2a'); rect(c, 448, 146, 25, 31, '#674557'); neon(c, 'BAR', 460, 139, '#ba81c2', 8);
    // Air conditioners and rooftop clutter.
    for (const [x, y] of [[37, 91], [127, 109], [224, 106], [386, 106], [456, 113]]) { rect(c, x, y, 17, 9, '#77616d'); rect(c, x + 2, y + 2, 8, 5, '#403745'); for (let k = 0; k < 4; k++)rect(c, x + 12, y + 1 + k * 2, 4, 1, '#3c3544'); }
    c.strokeStyle = '#171b2a'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 55); c.quadraticCurveTo(245, 130, 480, 55); c.stroke(); c.beginPath(); c.moveTo(0, 76); c.quadraticCurveTo(270, 120, 480, 65); c.stroke(); c.beginPath(); c.moveTo(67, 0); c.lineTo(72, 196); c.moveTo(316, 0); c.lineTo(321, 195); c.stroke();
    rect(c, 65, 0, 3, 191, '#212332'); rect(c, 59, 48, 15, 3, '#5c4856'); rect(c, 314, 21, 4, 174, '#292331'); rect(c, 308, 58, 17, 3, '#69515d');
    for (let i = 0; i < 8; i++) { const x = 140 + i * 30, y = 107 + Math.sin(i / 7 * Math.PI) * 10; rect(c, x, y, 7, 9, '#bb626a'); rect(c, x + 1, y + 1, 5, 6, '#e8a079'); rect(c, x + 3, y + 9, 1, 3, '#b97175'); }
    // Street objects, a vending machine, bicycle and plants.
    rect(c, 108, 160, 16, 31, '#b25361'); rect(c, 110, 163, 12, 14, '#78a7ad'); for (let y = 165; y < 176; y += 4)for (let x = 111; x < 121; x += 4)rect(c, x, y, 2, 2, '#d5cdb2'); rect(c, 113, 183, 8, 4, '#322837');
    rect(c, 290, 182, 18, 8, '#805c64'); rect(c, 294, 164, 2, 20, '#2d514e'); poly(c, [[294, 177], [282, 169], [288, 167], [294, 171], [292, 158], [297, 162], [299, 173], [307, 165], [309, 170], [298, 181]], '#4a7665');
    for (const x of [151, 175]) { c.strokeStyle = '#151d2a'; c.lineWidth = 2; c.beginPath(); c.arc(x, 181, 9, 0, Math.PI * 2); c.stroke(); } c.strokeStyle = '#bd7d7b'; c.lineWidth = 1; c.beginPath(); c.moveTo(151, 181); c.lineTo(158, 168); c.lineTo(175, 181); c.lineTo(163, 181); c.lineTo(155, 165); c.moveTo(151, 181); c.lineTo(163, 181); c.lineTo(171, 164); c.lineTo(176, 164); c.stroke();
    rect(c, 0, 189, 480, 5, '#7b6274'); rect(c, 0, 194, 480, 4, '#252533'); for (let x = 0; x < 480; x += 24)rect(c, x, 190, 1, 3, '#3c3446');
  } else {
    for (let i = 0; i < 8; i++) { const x = i * 67, h = 35 + r() * 55; rect(c, x, 186 - h, 57, h, '#303449'); for (let y = 190 - h; y < 177; y += 8)for (let wx = x + 5; wx < x + 50; wx += 8)if (r() > .3) rect(c, wx, y, 3, 4, '#ad977e'); }
    rect(c, 0, 175, 480, 5, '#646780'); rect(c, 0, 180, 480, 17, '#242b3d'); for (let x = 0; x < 480; x += 17) { rect(c, x, 151, 2, 26, '#242b3d'); } rect(c, 0, 151, 480, 2, '#72768c'); rect(c, 30, 138, 34, 37, '#465064'); rect(c, 34, 141, 26, 20, '#30394a'); for (let y = 143; y < 159; y += 3)rect(c, 36, y, 22, 1, '#74778a');
    rect(c, 401, 108, 3, 66, '#86838b'); rect(c, 379, 121, 50, 2, '#8f8892'); rect(c, 387, 115, 36, 2, '#8f8892'); rect(c, 390, 112, 1, 16, '#8f8892'); rect(c, 413, 110, 1, 20, '#8f8892'); neon(c, 'NEON FIST', 249, 145, '#70c4c5', 12); rect(c, 211, 146, 76, 2, '#497580');
  }
  rect(c, 0, 198, 480, 42, p.floor); rect(c, 0, 200, 480, 1, '#695166'); rect(c, 0, 221, 480, 1, '#554054');
  for (let i = 0; i < 25; i++) { let x = r() * 480, y = 201 + r() * 38; rect(c, x, y, 10 + r() * 60, 1, ['#79536d', '#49394e', '#34505b', '#9c6b77'][i % 4]); }
  for (let x = -80; x < 600; x += 62)poly(c, [[x, 199], [x + 2, 199], [240 + (x - 240) * 1.4 + 2, 240], [240 + (x - 240) * 1.4, 240]], '#1e2330');
  rect(c, 0, 231, 480, 2, '#2c2638'); for (let x = 0; x < 480; x += 80)rect(c, x, 230, 31, 2, '#ab797c');
  // Wet asphalt catches the shop signs.
  c.globalAlpha = .22; for (let i = 0; i < 90; i++) { const x = r() * 480, y = 202 + r() * 24; rect(c, x, y, r() * 19 + 2, 1, x > 330 ? '#b6b9aa' : x > 240 ? '#73c8c5' : '#ef95a7'); } c.globalAlpha = 1;
  backgrounds.set(stage, canvas); return canvas;
}

export function drawStage(c, stage = 'street', time = 0) {
  if(drawExtraStage(c,stage,time))return;
  c.imageSmoothingEnabled = false; c.drawImage(background(stage), 0, 0, 960, 480);
  // Tiny moving rain streaks, deterministic placement avoids frame noise.
  c.fillStyle = '#b9a7ce30'; for (let i = 0; i < 37; i++) { let x = (i * 83 + time * 33) % 960, y = (i * 137 + time * 170) % 430; c.fillRect(Math.floor(x / 2) * 2, Math.floor(y / 2) * 2, 2, 6); }
  c.fillStyle = '#f596a009'; c.fillRect(0, 0, 960, 480);
}
function text(c, t, x, y, size, color = '#f4ece9', align = 'left', font = '"Microsoft YaHei", monospace') { c.font = `bold ${size}px ${font}`; c.fillStyle = color; c.textAlign = align; c.fillText(t, x, y); }
function shadow(c, f) { c.fillStyle = '#12152188'; c.beginPath(); c.ellipse(f.x, 419, 43 - Math.min(16, f.y * .12), 7, 0, 0, Math.PI * 2); c.fill(); }
export function renderGame(c, g, time, { preview = false, ranges = false } = {}) {
  c.clearRect(0, 0, 960, 480);c.save();if(g.shake>0&&!matchMedia('(prefers-reduced-motion: reduce)').matches)c.translate(Math.sin(g.tick*3)*g.shake,Math.cos(g.tick*2)*g.shake*.4); drawStage(c, g.stage, time);
  for(const item of g.items||[]){if(!item.available)continue;rect(c,item.x-13,417,26,3,'#a0f0cb42');drawBottle(c,item.x,411,1,-1.12);for(let k=0;k<3;k++)rect(c,item.x+8+k*4,416-k%2*3,3,2,'#8ecbbb');const close=g.fighters.some(f=>f.item===null&&Math.abs(f.x-item.x)<RULES.items.pickupRange&&f.y===0);if(close)text(c,'E 拾取',item.x,437,10,'#bdedcd','center','"Microsoft YaHei", sans-serif');}
  for (const f of g.fighters) shadow(c, f);
  for (const item of g.items || []) if (!item.available && item.owner === null && item.respawn > 0) {
    text(c, `碎瓶 ${Math.ceil(item.respawn)}s`, item.home, 414, 11, '#99bcae', 'center', '"Microsoft YaHei", sans-serif');
  }
  if (ranges) for (const [i, f] of g.fighters.entries()) {
    const m = moveFor(f, f.attack || 'punch'); if (!m?.range) continue;
    const d = FIGHTERS.find(d => d.id === f.id), end = f.x + f.facing * m.range * d.reach;
    c.save(); c.strokeStyle = f.actionTime >= m.active && f.actionTime <= m.end && f.attack ? '#ffe68d' : '#adbecf88';
    c.lineWidth = 2; c.beginPath(); c.moveTo(f.x, 401); c.lineTo(end, 401); c.moveTo(end, 394); c.lineTo(end, 408); c.stroke();
    text(c, m.name + ' · 距离 ' + Math.round(m.range * d.reach), i ? 925 : 35, 181, 12, '#e8d4b6', i ? 'right' : 'left', '"Microsoft YaHei", sans-serif'); c.restore();
  }
  for (const f of [...g.fighters].sort((a, b) => a.y - b.y)) {
    if(f.attack&&f.actionTime>.06&&['dash','flameRush','cyclone','rising','flip','roundhouse','super'].includes(f.attack)){c.save();c.globalAlpha=.16;drawFighter(c,{...f,actionTime:Math.max(0,f.actionTime-.06)},f.x-f.facing*17,416,1.95,time-.06);c.restore();}
    if(f.slow>0){c.fillStyle='#8bdeff30';c.fillRect(f.x-22,288-f.y,44,130);}
    drawFighter(c, f, f.x, 416, 1.95, time);
  }
  drawUltimateEffects(c,g);
  for (const p of g.projectiles) {
    if(p.move==='bottle'){drawBottle(c,p.x,p.y,1.5,p.age*14*p.direction);continue;}
    const def = FIGHTERS.find(f => f.id === g.fighters[p.owner].id); c.save(); c.translate(p.x, p.y); c.scale(p.direction, 1); c.shadowColor = def.color; c.shadowBlur = 16;
    if(p.move==='crescent'){poly(c,[[-13,-31],[9,-23],[23,0],[9,23],[-13,31],[0,15],[6,0],[0,-15]],'#d3b3ff');poly(c,[[1,-20],[17,0],[1,20],[7,0]],'#fff0fc');}
    else if(p.move==='frost'){poly(c,[[-26,0],[-8,-20],[26,0],[-8,20]],'#74cbed');poly(c,[[-15,0],[0,-10],[23,0],[0,10]],'#e6fbff');for(let i=0;i<3;i++)rect(c,-45-i*9,-10+i*9,5,3,'#abdff0');}
    else{rect(c,-27,-10,39,20,def.color);rect(c,-19,-17,35,34,def.color);rect(c,-11,-12,34,24,'#fff1ce');rect(c,-5,-7,32,14,'#ffffff');rect(c,-46,-5,18,10,def.dark);if(p.super){rect(c,-18,-25,26,8,'#fdf0c4');rect(c,-18,17,26,8,'#fdf0c4');rect(c,-65,-3,26,6,def.color);}}c.restore();
  }
  for (const e of g.effects) {if(e.kind==='ko')continue;const progress=Math.max(0,1-e.life/(e.kind==='glass'?.55:.38)),color=['glass','pickup'].includes(e.kind)?'#b1f5db':e.kind==='block'?'#90def1':e.kind==='cast'?'#ddcafa':'#ffe5a3';c.save();c.translate(e.x,e.y);c.globalAlpha=Math.min(1,e.life*4);for(let i=0;i<8;i++){const a=i*Math.PI/4,dist=12+progress*38;rect(c,Math.cos(a)*dist,Math.sin(a)*dist+(e.kind==='glass'?progress*progress*45:0),e.kind==='glass'?3:4+e.life*9,3,color);}const label=e.label||(e.kind==='block'?'GUARD':e.damage?`−${e.damage}`:'');if(label)text(c,label,0,-25-progress*22,14,color,'center','"Microsoft YaHei", sans-serif');c.restore();}
  c.restore();
  if (preview) return;
  // Arcade HUD.
  rect(c, 22, 17, 393, 62, '#151725d9'); rect(c, 545, 17, 393, 62, '#151725d9');
  const [a, b] = g.fighters;
  g.fighters.forEach((f,i)=>{const x=i?924:36,align=i?'right':'left';if(f.moveLabelTime>0)text(c,f.lastMove,x,103,13,'#f5cbda',align,'"Microsoft YaHei", sans-serif');if(f.feedbackTime>0)text(c,f.feedback,x,123,11,'#ffe1a3',align,'"Microsoft YaHei", sans-serif');if(f.item!==null&&f.item!==undefined)text(c,'◆ 碎瓶在手 · E 投掷',x,424,11,'#bdedcd',align,'"Microsoft YaHei", sans-serif');});
  g.fighters.forEach((f, i) => { const d = FIGHTERS.find(d => d.id === f.id), x = i ? 556 : 34; text(c, `${i + 1}P`, x, 36, 12, i ? '#85dadc' : '#ff9288'); text(c, d.en + ' / ' + d.name, i ? 924 : 67, 36, 14, '#f1e6e2', i ? 'right' : 'left', '"Microsoft YaHei", sans-serif'); rect(c, x, 45, 370, 16, '#472d41'); const w = 366 * f.hp / RULES.match.maxHealth; rect(c, i ? x + 368 - w : x + 2, 47, w, 12, f.hp < RULES.match.maxHealth * .25 ? '#ef655f' : i ? '#8ad1c5' : '#ebbf94'); rect(c, i ? x + 368 - w : x + 2, 47, w, 3, f.hp < RULES.match.maxHealth * .25 ? '#ffb69b' : '#ffedc8'); text(c, Math.ceil(f.hp).toString(), i ? x : x + 370, 73, 9, '#c8b4bc', i ? 'left' : 'right'); for (let k = 0; k < RULES.match.winsToWin; k++) { const xx = i ? x + 345 - k * 14 : x + 5 + k * 14; poly(c, [[xx, 65], [xx + 4, 69], [xx, 73], [xx - 4, 69]], k < f.wins ? '#f7cd81' : '#51404f'); } });
  poly(c, [[436, 12], [524, 12], [535, 70], [480, 89], [425, 70]], '#1b1928'); poly(c, [[440, 16], [520, 16], [530, 68], [480, 84], [430, 68]], '#665064'); poly(c, [[442, 18], [518, 18], [528, 66], [480, 82], [432, 66]], '#252031'); text(c, g.mode === 'practice' ? '∞' : String(Math.ceil(g.time)).padStart(2, '0'), 480, 57, 38, '#f6e4d5', 'center'); text(c, 'ROUND ' + g.round, 480, 75, 8, '#c5acba', 'center');
  g.fighters.forEach((f, i) => { const x = i ? 738 : 32; rect(c, x, 443, 190, 12, '#1b1c2a'); rect(c, x + 2, 445, 186 * f.meter / RULES.meter.max, 8, f.meter >= moveFor(f,'super').cost ? '#edb8e6' : i ? '#85cbd3' : '#ec8078'); for (let k = 1; k < 4; k++)rect(c, x + k * 47, 445, 2, 8, '#2d2737'); text(c, f.meter >= moveFor(f,'super').cost ? `${g.mode==='local'&&i===1?'5':'I'} · ${moveFor(f,'super').name} 就绪` : `${moveFor(f,'super').name} ${Math.floor(f.meter)}/${moveFor(f,'super').cost}`, i ? 927 : 32, 469, 11, f.meter >= moveFor(f,'super').cost ? '#ffdcf8' : '#c1adbe', i ? 'right' : 'left'); if (f.combo > 1 && f.comboTime > 0) { text(c, f.combo + ' HIT', i ? 897 : 62, 143, 29, '#ffe4b6', i ? 'right' : 'left'); text(c, 'COMBO', i ? 897 : 62, 158, 10, '#e58c8e', i ? 'right' : 'left'); } });
  drawUltimateCutin(c,g);
  if (g.phase === 'intro') { c.fillStyle = '#14132260'; c.fillRect(0, 170, 960, 121); const ready = g.phaseTime > .7; text(c, ready ? 'ROUND ' + g.round : 'FIGHT!', 480, 245, ready ? 51 : 69, ready ? '#f7e6d9' : '#ff8072', 'center', 'Impact, sans-serif'); text(c, ready ? 'GET READY' : '让拳头说话', 480, 275, 12, '#e4c3cd', 'center', '"Microsoft YaHei", sans-serif'); }
  if (g.phase === 'roundOver') { c.fillStyle = '#1613207a'; c.fillRect(0, 163, 960, 142); text(c, g.roundWinner < 0 ? 'DRAW' : g.time <= 0 ? 'TIME UP' : 'K.O.', 480, 237, 75, '#ffb1a0', 'center', 'Impact, sans-serif'); text(c, g.roundWinner < 0 ? '平局 · 再战一回合' : `${FIGHTERS.find(d => d.id === g.fighters[g.roundWinner].id).name} 赢得本回合`, 480, 278, 17, '#f8e8d8', 'center', '"Microsoft YaHei", sans-serif'); }
}
export function renderPreview(c, stage, time, selected) {
  const f1 = { id: selected, x: 570, y: 0, facing: 1, action: 'idle', stun: 0 }, f2 = { id: selected === 'rin' ? 'yuna' : 'rin', x: 790, y: 0, facing: -1, action: 'idle', stun: 0 };
  drawStage(c, stage, time); shadow(c, f1); shadow(c, f2); drawFighter(c, f1, 570, 418, 2.25, time); drawFighter(c, f2, 790, 418, 2.25, time + .7);
}
