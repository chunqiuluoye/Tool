import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import { randomInt } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { stepGame, emptyInput, FIGHTERS, TAP_KEYS, COMBAT_VERSION } from './public/engine.mjs';
import { findRunningGame } from './startup.mjs';
import { CONFIG_SIGNATURE } from './public/game-config.mjs';
import { createSeries, chooseFighter, chooseStage, chooseWeapon, chooseRuleSet, setReady, beginMatch, recordResult, returnToSelection } from './public/versus.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), 'public');
const PORT = Number(process.env.PORT || 8787);
const windowOwned = process.argv.includes('--window-owned');
const windowOwnerPid = process.ppid;
let ownerWatch;
const rooms = new Map();
const addresses = () => Object.values(networkInterfaces()).flat().filter(n => n.family === 'IPv4' && !n.internal).map(n => `http://${n.address}:${PORT}`);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/network') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ app: 'neon-fist', combatVersion: COMBAT_VERSION, configSignature: CONFIG_SIGNATURE, addresses: addresses(), port: PORT })); return;
    }
    const path = resolve(root, '.' + (decodeURIComponent(url.pathname) === '/' ? '/index.html' : decodeURIComponent(url.pathname)));
    if (!path.startsWith(root + sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    const content = await readFile(path);
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(404); res.end('Not found'); }
});
const wss = new WebSocketServer({ server, maxPayload: 4096 });
const send = (ws, data) => { if (ws?.readyState === WebSocket.OPEN && ws.bufferedAmount < 256000) ws.send(JSON.stringify(data)); };
const broadcast = (room, data) => room.players.forEach(p => send(p, data));
const roomState = room => room.players.forEach((p,slot)=>send(p,{type:'roomState',code:room.code,slot,series:room.series}));
function launch(room) {
  const game=beginMatch(room.series);if(!game)return;
  room.game=game;room.inputs=[emptyInput(),emptyInput()];room.pending=[new Map(),new Map()];room.inputAt=[Date.now(),Date.now()];
  room.players.forEach((p,slot)=>send(p,{type:'start',code:room.code,slot,game,series:room.series}));
}
const validFighter = id => FIGHTERS.some(f => f.id === id) ? id : 'kai';
function leave(ws) {
  const room = rooms.get(ws.room);
  if (room) {
    broadcast(room, { type: 'closed', message: '对方已离开房间。本次对战已结束。' });
    for (const player of room.players) player.room = null;
    rooms.delete(room.code);
  }
  ws.room = null;
}
wss.on('connection', ws => {
  ws.alive = true; ws.lastMessage = 0; ws.windowAt = Date.now(); ws.messageCount = 0;
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', raw => {
    const now = Date.now();
    if (now - ws.windowAt > 1000) { ws.windowAt = now; ws.messageCount = 0; }
    if (++ws.messageCount > 180) { ws.close(1008, 'Too many messages'); return; }
    let data;
    try { data = JSON.parse(raw); } catch { return send(ws, { type: 'error', message: '无效的请求格式。' }); }
    if (!data || typeof data !== 'object') return;
    if (data.type === 'ping') return send(ws, { type: 'pong', at: data.at });
    if (data.type === 'leave') { leave(ws); return; }
    if (data.type === 'create') {
      if (ws.room) return send(ws, { type: 'error', message: '请先离开当前房间。' });
      if (rooms.size >= 100) return send(ws, { type: 'error', message: '房间已满，请稍后重试。' });
      let code; do { code = String(randomInt(100000, 1000000)); } while (rooms.has(code));
      ws.room = code; ws.slot = 0; ws.fighter = validFighter(data.fighter);
      const room = { code, players: [ws], inputs: [emptyInput(), emptyInput()], pending: [new Map(), new Map()], inputAt: [now, now], game: null, series:createSeries(ws.fighter,null,data.stage), created: now };
      chooseRuleSet(room.series,0,data.ruleSet);chooseWeapon(room.series,0,data.weapon);
      rooms.set(code, room);
      send(ws, { type: 'created', code, slot: 0 }); roomState(room); return;
    }
    if (data.type === 'join') {
      if (ws.room) return send(ws, { type: 'error', message: '请先离开当前房间。' });
      const room = rooms.get(String(data.code));
      if (!room) return send(ws, { type: 'error', message: '房间不存在，请检查 6 位房间码。' });
      if (room.players.length >= 2) return send(ws, { type: 'error', message: '房间已有两名玩家。' });
      ws.room = room.code; ws.slot = 1; ws.fighter = validFighter(data.fighter);
      room.players.push(ws);
      chooseFighter(room.series,1,ws.fighter);roomState(room);return;
    }
    const room = rooms.get(ws.room);
    if (!room) return;
    if(data.type==='selectFighter'){
      if(!chooseFighter(room.series,ws.slot,data.fighter))return send(ws,{type:'error',message:'当前不能更换角色。'});
      roomState(room);return;
    }
    if(data.type==='selectStage'){
      if(!chooseStage(room.series,ws.slot,data.stage))return send(ws,{type:'error',message:'只有房主可以在准备阶段选择场景。'});
      roomState(room);return;
    }
    if(data.type==='selectWeapon'||data.type==='selectRuleSet'){
      const ok=data.type==='selectWeapon'?chooseWeapon(room.series,ws.slot,data.weapon):chooseRuleSet(room.series,ws.slot,data.ruleSet);
      if(!ok)return send(ws,{type:'error',message:'当前无法更改武器或模式；模式仅由房主在准备阶段选择。'});
      roomState(room);return;
    }
    if(data.type==='ready'){
      if(!setReady(room.series,ws.slot,data.ready,data.revision))return send(ws,{type:'error',message:'选角已更新或玩家尚未到齐，请确认后重新准备。'});
      roomState(room);launch(room);return;
    }
    if(data.type==='returnLobby'){
      if(!returnToSelection(room.series))return;
      room.game=null;room.created=now;room.inputs=[emptyInput(),emptyInput()];room.pending=[new Map(),new Map()];roomState(room);return;
    }
    if (data.type === 'input' && room.series.phase==='playing' && data.input && typeof data.input === 'object') {
      const input = emptyInput();
      for (const key of Object.keys(input)) input[key] = data.input[key] === true;
      for (const key of TAP_KEYS) if (input[key] && !room.inputs[ws.slot][key]) room.pending[ws.slot].set(key, { ...input });
      room.inputs[ws.slot] = input; room.inputAt[ws.slot] = now;
    }
  });
  ws.on('close', () => leave(ws));
  ws.on('error', () => {});
});
let lastTick = performance.now(), accumulator = 0, ticks = 0;
const loop = setInterval(() => {
  const now = performance.now(); accumulator += Math.min((now - lastTick) / 1000, .1); lastTick = now;
  while (accumulator >= 1 / 60) {
    accumulator -= 1 / 60; ticks++;
    for (const room of rooms.values()) {
      if (!room.game) {
        if (Date.now() - room.created > 30 * 60 * 1000) leave(room.players[0]);
        continue;
      }
      for (let i = 0; i < 2; i++) if (Date.now() - room.inputAt[i] > 600) room.inputs[i] = emptyInput();
      const effectiveInputs = room.inputs.map((input, i) => {
        const effective = { ...input };
        effective.tapContexts = Object.fromEntries(room.pending[i]); for (const key of room.pending[i].keys()) effective[key] = true;
        room.pending[i].clear();
        return effective;
      });
      stepGame(room.game, effectiveInputs);
      recordResult(room.series,room.game);
      if (ticks % 2 === 0) broadcast(room, { type: 'state', game: room.game, series:room.series });
    }
  }
}, 1000 / 60);
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) { if (!ws.alive) ws.terminate(); else { ws.alive = false; ws.ping(); } }
}, 15000);
let handlingServerError = false;
async function handleServerError(error) {
  // ws forwards HTTP listen errors, so both emitters need a listener.
  if (handlingServerError) return;
  handlingServerError = true;
  clearInterval(loop); clearInterval(heartbeat); clearInterval(ownerWatch);
  if (error.code === 'EADDRINUSE') {
    const running = await findRunningGame(PORT);
    if (running) {
      if (windowOwned) {
        console.error(`\n  NEON FIST 已在另一个窗口运行。\n  当前窗口没有启动服务，请关闭当前窗口。\n  要停止游戏，请关闭原来的游戏服务窗口，然后重新双击启动。\n`);
        process.exit(2);
      }
      console.log(`\n  NEON FIST 已在运行，无需重复启动。\n  本机: http://localhost:${PORT}\n  局域网: ${running.addresses.join('  ')}\n  直接打开上述地址即可。可以关闭当前这个重复启动的窗口。\n`);
      process.exit(0);
    }
    console.error(`\n  端口 ${PORT} 被其他程序占用，未停止或修改该程序。\n  请在 PowerShell 设置 $env:PORT=8788 后运行 npm start，\n  或选择其他空闲端口。\n`);
  } else {
    console.error(`游戏服务启动失败: ${error.code || ''} ${error.message}`);
  }
  process.exit(1);
}
server.on('error', handleServerError);
wss.on('error', handleServerError);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  NEON FIST / 像素街霸\n  本机: http://localhost:${PORT}\n  局域网: ${addresses().join('  ')}\n  ${windowOwned ? '关闭本窗口即停止服务并断开所有玩家。' : '按 Ctrl+C 停止服务'}\n`);
});
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  clearInterval(loop); clearInterval(heartbeat); clearInterval(ownerWatch);
  for (const ws of wss.clients) ws.terminate();
  wss.close();
  server.close(() => process.exit(0));
  server.closeAllConnections();
  setTimeout(() => process.exit(0), 1000).unref();
}
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown); process.on('SIGHUP', shutdown);
if (windowOwned) {
  // A window close normally terminates its console processes. Also stop if a
  // terminal host terminates only the launcher, preventing an orphan server.
  ownerWatch = setInterval(() => {
    try { process.kill(windowOwnerPid, 0); }
    catch (error) { if (error.code === 'ESRCH') shutdown(); }
  }, 250);
  ownerWatch.unref();
}
