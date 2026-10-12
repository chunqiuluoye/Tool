import { WEAPONS, STAGES, FIGHTERS, MOVES, MOVE_STYLES, RULES as C, CANCEL_ROUTES, CHARACTER_CANCEL_ROUTES } from './game-config.mjs';
export { FIGHTERS, MOVES, COMBAT_VERSION, AIR_KICK_LANDING, BOTTLE_RESPAWN } from './game-config.mjs';
export function moveFor(f, name = f.attack) { const armed = WEAPONS[f.weapon]?.moves[name]; if(armed)return {...armed,key:name}; const move = MOVES[name]; return move && { ...move, ...MOVE_STYLES[f.id]?.[name], key:name }; }

export const TAP_KEYS = ['jump', 'punch', 'kick', 'special', 'super', 'signature', 'grab', 'dash', 'interact'];
export const emptyInput = () => Object.fromEntries(['left', 'right', 'crouch', 'guard', ...TAP_KEYS].map(k => [k, false]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const definition = f => FIGHTERS.find(d => d.id === f.id);
const newItems = () => C.items.spawns.map((x, id) => ({ id, x, home: x, available: true, owner: null, respawn: 0 }));
function fighter(id, index) { return { id: FIGHTERS.some(f => f.id === id) ? id : FIGHTERS[index].id, x: C.arena.spawn[index], y: 0, vy: 0, facing: index ? -1 : 1, hp: C.match.maxHealth, meter: C.meter.initial, wins: 0, action: 'idle', actionTime: 0, stun: 0, attack: null, attackHit: false, struck: [], guard: false, crouch: false, moving: false, combo: 0, comboTime: 0, lastDamage: 0, totalDamage: 0, hits: 0, maxCombo: 0, recover: 0, prev: emptyInput(), buffer: null, item: null, knockdown: 0, invulnerable: 0, slow: 0, juggle: 0, techWindow: 0, dashCooldown: 0, chain: [], chainTime: 0, lastMove: '', moveLabelTime: 0, feedback: '', feedbackTime: 0, airKickUsed: false, airKickCount: 0, landingRecovery: 0 }; }
export function createGame({ mode = 'solo', p1 = 'kai', p2 = 'rin', difficulty = 'normal', stage = 'street', dummy = 'idle', ruleSet='classic', weapons=['nunchaku','sword'] } = {}) { const armed=ruleSet==='weapons'; return { mode, ruleSet:armed?'weapons':'classic', difficulty, stage:STAGES.some(s=>s.id===stage)?stage:'street', dummy, fighters: [fighter(p1, 0), fighter(p2, 1)].map((f,i)=>({...f,weapon:armed?(Object.hasOwn(WEAPONS,weapons?.[i])?weapons[i]:'sword'):null})), phase: 'intro', phaseTime: C.match.introSeconds, round: 1, time: C.match.roundSeconds, tick: 0, projectiles: [], items: newItems(), effects: [], eventId: 0, hitstop: 0, shake: 0, roundWinner: -1, winner: -1, aiClock: 0, aiInput: emptyInput() }; }
function effect(g, kind, x, y, extra = {}) { g.effects.push({ id: ++g.eventId, kind, x, y, life: .38, ...extra }); if (g.effects.length > 45) g.effects.shift(); }
function feedback(f, message) { f.feedback = message; f.feedbackTime = 1.1; }
export function resetPractice(g) { g.fighters = g.fighters.map((f, i) => ({...fighter(f.id, i),weapon:f.weapon})); g.cinematic = null; g.grapple = null; g.projectiles = []; g.items = newItems(); g.effects = []; g.hitstop = 0; g.shake = 0; g.time = C.match.roundSeconds; }
function nextRound(g) { g.fighters = g.fighters.map((f, i) => ({ ...fighter(f.id, i), weapon:f.weapon, wins: f.wins, meter: Math.max(C.meter.roundMinimum, f.meter) })); g.round++; g.time = C.match.roundSeconds; g.phase = 'intro'; g.phaseTime = C.match.introSeconds; g.cinematic = null; g.grapple = null; g.projectiles = []; g.items = newItems(); g.hitstop = 0; }
function dropItem(g, f) { if (f.item === null) return; const item = g.items.find(v => v.id === f.item); if (item) { item.owner = null; item.available = true; item.x = clamp(f.x - f.facing * C.items.dropOffset, C.items.left, C.items.right); } f.item = null; }
function protectedUltimate(f) {
  return C.ultimate.confirmProtection && f.attack === 'super' && f.ultimateConfirmed && f.actionTime <= moveFor(f).end;
}
function ultimateCaptor(g, victim) {
  const owner = g.fighters.find(f => f !== victim);
  return protectedUltimate(owner) && owner.ultimateCaptureOffset ? owner : null;
}
function hit(g, attacker, defender, move, projectile = false, direction = attacker.facing, defense = defender) {
  // Confirmed supers consume incoming projectiles without damage or interruption.
  // Startup, blocked supers and recovery are deliberately not protected.
  if (protectedUltimate(defender)) return 'absorbed';
  const capturedHit = move.key === 'super' && ultimateCaptor(g, defender) === attacker;
  if (defense.hp <= 0 || defense.invulnerable > 0 || defense.knockdown > 0 || (!capturedHit && defense.y > 0 && defense.juggle >= C.air.juggleLimit) || (g.grapple && move.kind !== 'slam')) return false;
  if (move.kind === 'throw' && defender.techWindow > 0) { attacker.attack = null; defender.attack = null; attacker.stun = defender.stun = C.throws.techStun; attacker.x = clamp(attacker.x - direction * C.throws.techPush, C.arena.left, C.arena.right); defender.x = clamp(defender.x + direction * C.throws.techPush, C.arena.left, C.arena.right); effect(g, 'tech', defender.x, 335, { label: '拆投！' }); return true; }
  const correctGuard = move.level === 'low' ? defense.crouch : move.level === 'overhead' ? !defense.crouch : true;
  const blocked = defense.guard && !defense.attack && defense.y === 0 && defense.facing === -direction && correctGuard && !['throw', 'slam'].includes(move.kind) && !move.guardBreak;
  const opposingMove = moveFor(defense);
  const punish = !blocked && ((opposingMove && defense.actionTime > opposingMove.end) || defense.landingRecovery > 0);
  const counter = !blocked && opposingMove && defense.actionTime < opposingMove.active;
  const broken = defender.guard && move.guardBreak, comboActive = attacker.comboTime > 0;
  const scaling = blocked ? 1 : Math.max(C.combo.minimumDamageMultiplier, 1 - (comboActive ? attacker.combo : 0) * C.combo.damageDecay);
  const damage = Math.max(1, Math.round(move.damage * definition(attacker).power * scaling * (blocked ? C.guard.chipMultiplier : 1)));
  defender.hp = Math.max(0, defender.hp - damage); defender.recover = C.practice.healthRecoveryDelay; defender.stun = blocked ? C.guard.stun : (move.stun ?? C.hit.defaultStun); defender.blockstun = blocked ? C.guard.stun : 0;
  if (!blocked) {
    defender.attack = null; defender.buffer = null; defender.landingRecovery = 0; defender.action = 'hurt'; defender.actionTime = 0; defender.guard = false; dropItem(g, defender);
    if (defense.y > 0 || move.launch) defender.juggle++;
    if (move.launch && defender.juggle <= C.air.juggleLimit) { defender.vy = move.launch * (1 - (defender.juggle - 1) * C.air.juggleLaunchDecay); defender.y = Math.max(1, defender.y); }
    if (move.knockdown) { defender.knockdown = move.knockdown; defender.action = 'down'; }
    if (move.slow) defender.slow = move.slow;
    attacker.combo = comboActive ? attacker.combo + 1 : 1; attacker.comboTime = Math.max(C.combo.resetSeconds, defender.stun + C.combo.stunGrace); attacker.lastDamage = damage; attacker.totalDamage += damage; attacker.hits++; attacker.maxCombo = Math.max(attacker.maxCombo, attacker.combo);
  }
  const push = blocked ? (move.blockPush ?? C.guard.push) : (move.push ?? C.hit.defaultPush), beforeX = defender.x;
  defender.x = clamp(defender.x + direction * push, C.arena.left, C.arena.right);
  // At a wall, transfer the unspent pushback to the attacker to preserve space.
  attacker.x = clamp(attacker.x - direction * Math.max(0, push - Math.abs(defender.x - beforeX)), C.arena.left, C.arena.right);
  attacker.meter = clamp(attacker.meter + (blocked ? C.meter.onBlock : C.meter.onHit), 0, C.meter.max); defender.meter = clamp(defender.meter + C.meter.onHurt, 0, C.meter.max);
  g.hitstop = Math.max(g.hitstop, blocked ? C.hit.blockHitstop : move.damage >= C.hit.heavyDamage ? C.hit.heavyHitstop : C.hit.hitstop); g.shake = blocked ? 1 : move.damage >= C.hit.heavyDamage ? 5 : 2;
  const label = broken ? '破防！' : punish ? '收招惩罚' : counter ? '截击！' : undefined;
  if (label) feedback(attacker, label);
  effect(g, blocked ? 'block' : broken ? 'break' : projectile ? 'blast' : 'hit', defender.x - direction * 15, 344 - defender.y, { damage, combo: attacker.combo, label, attacker:g.fighters.indexOf(attacker), move:move.key }); return blocked ? 'block' : 'hit';
}
function chooseMove(f, key, input) {
  if (key === 'interact') return f.item === null ? 'pickup' : 'bottle'; if (key === 'signature') return f.weapon?'weaponSkill':definition(f).signature;
  if (key === 'punch') { if (f.y > 0) return 'airpunch'; if (input.crouch) return 'uppercut'; return f.chainTime > 0 && f.chain.at(-1) === 'punch' ? 'cross' : 'punch'; }
  if (key === 'kick') { if (f.y > 0) return 'airkick'; if (input.crouch) return 'sweep'; return f.chainTime > 0 && f.chain.at(-1) === 'cross' ? 'roundhouse' : 'kick'; } return key;
}
function canCancel(f, next) { if (!f.attack) return true; const m = moveFor(f); if (!f.attackHit || f.actionTime < m.active || f.actionTime > m.duration - C.combo.cancelEndMargin) return false; return (CANCEL_ROUTES[f.attack] || []).includes(next) || (CHARACTER_CANCEL_ROUTES[f.id]?.[f.attack] || []).includes(next); }
function beginMove(g, f, key, input) {
  if(f.landingRecovery>0)return false;
  if(key==='kick'&&f.y>0&&(f.airKickCount||0)>=C.air.kickLimit){f.buffer=null;return false;}
  const name = chooseMove(f, key, input), m = moveFor(f, name); if (!m) return false; if (name === 'dash' && f.dashCooldown > 0) return false; if (['pickup', 'grab', 'sweep', 'dash', 'super'].includes(name) && f.y > 0) return false;
  if (name === 'pickup' && !g.items.some(item => item.available && Math.abs(item.x - f.x) < C.items.pickupRange)) { feedback(f, '靠近地上的碎瓶再按 E'); return false; }
  if (m.cost && f.meter < m.cost) { feedback(f, `能量不足 · 需要 ${m.cost}`); return false; } if (!canCancel(f, name)) return false;
  if (m.cost) f.meter -= m.cost; f.transition = { attack: f.attack, action: f.action, actionTime: f.actionTime }; f.moveSerial = (f.moveSerial || 0) + 1; f.attack = name; f.action = name; f.actionTime = 0; f.attackHit = false; f.struck = []; f.guard = false; f.crouch = false; f.lastMove = m.name; f.moveLabelTime = 1.05; f.chain = [...f.chain.slice(-2), name]; f.chainTime = C.combo.chainSeconds;
  if(name==='airkick'){f.airKickUsed=true;f.airKickCount=(f.airKickCount||0)+1;}
  if(name==='super'){
    f.ultimateConfirmed=false;f.ultimateCaptureOffset=null;
    const enemy=g.fighters.find(v=>v!==f);
    f.ultimateTarget=clamp(enemy.x,Math.max(C.arena.left,f.x-(m.fieldReach??960)),Math.min(C.arena.right,f.x+(m.fieldReach??960)));
    f.ultimateOrigin=f.x;
  }
  if (name === 'dash') { f.dashDirection = input.left ? -1 : input.right ? 1 : f.facing; f.dashCooldown = C.motion.dashCooldown; effect(g, 'dash', f.x, 410, { life: .22 }); } if (name === 'grab') f.techWindow = C.throws.techWindow; if (m.lift && f.y === 0) { f.y = 1; f.vy = m.lift; } return true;
}
function ai(g, dt) {
  const [a, b] = g.fighters;
  if (g.mode === 'practice') {
    if (g.dummy === 'guard' || g.dummy === 'crouchGuard') return {...emptyInput(),guard:true,crouch:g.dummy==='crouchGuard'};
    if (g.dummy === 'counter') {
      const input=emptyInput(),move=moveFor(a),jab=moveFor(b,'punch');
      g.coach ||= {reaction:0,seen:0,attempted:-1};
      if(g.coach.seen!==a.moveSerial){g.coach.seen=a.moveSerial;g.coach.reaction=0;}
      const opening=move&&a.actionTime>move.end&&a.y===0&&Math.abs(a.x-b.x)<=jab.range*definition(b).reach;
      if(opening)g.coach.reaction+=dt;else g.coach.reaction=0;
      if(opening&&g.coach.reaction>=C.ai.coachReaction&&move.duration-a.actionTime>=jab.active+1/60&&!b.attack&&b.stun<=0&&g.coach.attempted!==a.moveSerial){input.punch=true;g.coach.attempted=a.moveSerial;}
      else {input.guard=true;input.crouch=move?.level==='low';}
      return input;
    }
    if (g.dummy !== 'ai') return emptyInput();
  }
  g.aiClock -= dt; if (g.aiClock > 0) return g.aiInput; const hard = g.difficulty === 'hard', easy = g.difficulty === 'easy', r = Math.random(), dist = Math.abs(a.x - b.x), input = emptyInput(); g.aiClock = C.ai.reaction[g.difficulty] ?? C.ai.reaction.normal;
  if (b.attack === 'punch' && b.attackHit) input.punch = !g.aiInput.punch; else if (b.attack === 'cross' && b.attackHit) input.kick = true;
  else if (b.item !== null && dist > 130) input.interact = !g.aiInput.interact;
  else if (a.attack && dist < 120 && r < (C.ai.guardChance[g.difficulty] ?? C.ai.guardChance.normal)) { input.guard = true; input.crouch = a.attack === 'sweep'; if (a.attack === 'grab') input.grab = true; }
  else if (g.items.some(v => v.available && Math.abs(v.x - b.x) < 44) && b.item === null && dist > 150 && r < .55) input.interact = true;
  else if (dist > C.ai.approachDistance) { input.left = a.x < b.x; input.right = a.x > b.x; if (dist > 200 && r < .16) input.special = true; else if (dist > 170 && r > .83) input.dash = true; if (g.projectiles.some(p => p.owner === 0 && Math.abs(p.x - b.x) < 160)) input.jump = r < .8; }
  else { if (r < .27) input.punch = !g.aiInput.punch; else if (r < .49) input.kick = !g.aiInput.kick; else if (r < .60) { input.crouch = true; input.kick = true; } else if (r < .7) input.signature = true; else if (r < .81) input.grab = true; else if (r < .89) { input.crouch = true; input.punch = true; } else input.jump = true; if (b.meter >= MOVES.super.cost && r > .9) input.super = true; }
  g.aiInput = input; return input;
}
function advanceAttack(g, f, enemy, i, dt) {
  const name = f.attack, m = moveFor(f); if (!m) return;
  if(m.liftOnStrike&&f.actionTime>=m.active&&!f.struck.includes('lift')){f.y=Math.max(1,f.y);f.vy=m.liftOnStrike;f.struck.push('lift');}
  if (m.lunge && f.actionTime >= (m.lungeBegin??0) && f.actionTime < m.end) f.x = clamp(f.x + f.facing * m.lunge * dt, C.arena.left, C.arena.right);
  if (name === 'dash') f.x = clamp(f.x + f.dashDirection * C.motion.dashSpeed * dt, C.arena.left, C.arena.right);
  if (f.actionTime >= m.active && !f.struck.includes('spawn')) {
    if (name === 'pickup') { const item = g.items.filter(v => v.available && Math.abs(v.x - f.x) < C.items.pickupRange).sort((a, b) => Math.abs(a.x - f.x) - Math.abs(b.x - f.x))[0]; if (item) { item.available = false; item.owner = i; f.item = item.id; effect(g, 'pickup', f.x, 382, { label: '碎瓶入手', life: .6 }); } f.struck.push('spawn'); }
    else if (m.kind === 'projectile') {
      if (name === 'bottle') { const item = g.items.find(v => v.id === f.item); if (!item) { f.struck.push('spawn'); return; } item.owner = null; item.respawn = C.items.respawnSeconds; f.item = null; }
      g.projectileId = (g.projectileId || 0) + 1; g.projectiles.push({ id:g.projectileId, owner: i, move: name, x: f.x + f.facing * 43, y: 350 - f.y, direction: f.facing, speed: name === 'bottle' ? C.projectiles.bottleSpeed : m.projectileSpeed || (name === 'super' ? C.projectiles.superSpeed : C.projectiles.defaultSpeed), vy: name === 'bottle' ? C.projectiles.bottleVelocityY : 0, life: C.projectiles.life, age: 0, super: name === 'super' }); f.struck.push('spawn'); effect(g, name === 'bottle' ? 'toss' : 'cast', f.x + f.facing * 40, 350 - f.y);
    }
  }
  if (f.actionTime >= m.duration) { f.attack = null; f.action = 'idle'; f.actionTime = 0; }
}
function resolveMelee(g) {
  const contacts = [], confirmed = new Set();
  for (let i = 0; i < 2; i++) {
    const f = g.fighters[i], enemy = g.fighters[1 - i], name = f.attack, m = moveFor(f);
    if (!m?.range || g.grapple) continue;
    const strikes = m.strikes || [m.active]; for (let k = 0; k < strikes.length; k++) {
      if (f.struck.includes(k) || f.actionTime < strikes[k] || f.actionTime > Math.min(m.end, strikes[k] + C.hit.strikeWindow)) continue;
      const vertical = m.verticalRange ?? (name === 'uppercut' || name === 'rising' ? C.hit.uppercutVerticalRange : m.kind === 'throw' ? C.hit.throwVerticalRange : enemy.crouch && m.level === 'high' ? C.hit.crouchHighVerticalRange : C.hit.verticalRange);
      const center=m.field?f.ultimateTarget:f.x;
      const inRange = (m.field||m.crossThrough||(enemy.x-f.x)*f.facing>0) && Math.abs(enemy.x-center)<=m.range*definition(f).reach && Math.abs(enemy.y-f.y)<vertical;
      if (inRange && !(m.level === 'low' && enemy.y > C.hit.lowAvoidHeight) && !(m.kind === 'throw' && (enemy.y > 0 || enemy.stun > 0))) contacts.push({ f, enemy, m:k===strikes.length-1?{...m,...m.finisher}:m, k, i, defense: { ...enemy } });
    }
  }
  // Both players' contacts are collected before either hit can interrupt the other.
  for (const { f, enemy, m, k, i, defense } of contacts) {
    if (m.kind === 'throw') {
      if (!f.attack) continue;
      if (contacts.some(c => c.f === enemy && c.m.kind !== 'throw')) continue;
      if(m.key==='super'&&contacts.some(c=>c.f===enemy&&c.m.kind==='throw'&&c.m.key==='super')){
        f.attack=enemy.attack=null;f.stun=enemy.stun=C.throws.techStun;
        effect(g,'tech',(f.x+enemy.x)/2,335,{label:'同时抓取 · 拆投'});continue;
      }
      if (defense.invulnerable > 0 || defense.knockdown > 0 || g.grapple) continue;
      if (defense.techWindow > 0) { hit(g, f, enemy, m); continue; }
      g.grapple = { attacker: i, defender: 1 - i, time: 0, duration: m.throwDuration ?? C.throws.duration, height:m.throwHeight ?? 120, move:m.key, x: f.x, direction: f.facing };
      f.attackHit = true; f.struck.push(k); enemy.attack = null; enemy.buffer = null; enemy.guard = false;
      enemy.action = 'thrown'; dropItem(g, enemy); effect(g, 'pickup', f.x, 334, { label: '抓取', life: .2 });
    } else {
      const direction=m.crossThrough?(enemy.x>=f.x?1:-1):f.facing;
      const result = hit(g, f, enemy, m, false, direction, defense);
      if (result) { f.struck.push(k); f.attackHit = result === 'hit'; }
      if (result === 'hit' && m.key === 'super') confirmed.add(f);
    }
  }
  // Commit after both same-frame contacts: trades do not favor player one.
  for (const f of confirmed) {
    if (f.attack !== 'super' || f.ultimateConfirmed || !C.ultimate.confirmProtection) continue;
    f.ultimateConfirmed = true;
    const m = moveFor(f), enemy = g.fighters.find(v => v !== f);
    if (m.strikes?.length > 1) {
      const reach = m.range * definition(f).reach - 4;
      f.ultimateCaptureOffset = { x:clamp(enemy.x-f.x,-reach,reach), y:enemy.y-f.y };
      enemy.buffer=null;enemy.jumpBuffered=0;enemy.vy=0;
    }
    feedback(f, '奥义命中 · 连段锁定');
  }
}
function advanceGrapple(g, dt) {
  const grab = g.grapple; if (!grab) return;
  const a = g.fighters[grab.attacker], b = g.fighters[grab.defender];
  grab.time += dt; const t = Math.min(1, grab.time / grab.duration);
  a.x = grab.x; a.action = 'grab'; a.actionTime = .15 + t * .36;
  b.x = clamp(grab.x + grab.direction * (35 - 110 * t), C.arena.left, C.arena.right);
  b.y = Math.sin(t * Math.PI) * grab.height; b.vy = 0; b.action = 'thrown'; b.throwRotation = -grab.direction * Math.PI * t;
  if (t >= 1) {
    b.y = 0; b.throwRotation = 0; g.grapple = null;
    hit(g, a, b, { ...moveFor(a,grab.move), kind: 'slam', push: 0 }, false, -grab.direction);
    a.attack = null; a.action = 'idle'; a.stun = C.throws.attackerRecovery;
    effect(g, 'slam', b.x, 413, { label: grab.move==='super'?'山崩地裂':'摔击', life: .45 });
  }
}
export function stepGame(g, inputs = [], dt = 1 / 60) {
  dt = clamp(dt, 0, 1 / 30); if (g.phase === 'paused' || g.phase === 'finished') return g; g.tick++; for (const e of g.effects) e.life -= dt; g.effects = g.effects.filter(e => e.life > 0); g.shake = Math.max(0, g.shake - dt * 30);
  if (g.phase === 'intro') { g.phaseTime -= dt; if (g.phaseTime <= 0) g.phase = 'fight'; return g; } if (g.phase === 'roundOver') { g.phaseTime -= dt; if (g.phaseTime <= 0) { if (g.winner >= 0) g.phase = 'finished'; else nextRound(g); } return g; }
  // Server-owned super freeze. Input edges are consumed, held defense remains available
  // when time resumes. Neither player, projectiles nor the round clock advance.
  if(g.cinematic){
    g.cinematic.time+=dt;
    for(let i=0;i<2;i++)g.fighters[i].prev={...(inputs[i]||emptyInput())};
    if(g.cinematic.time>=g.cinematic.duration)g.cinematic=null;
    return g;
  }
  const actual = [inputs[0] || emptyInput(), g.mode === 'solo' || g.mode === 'practice' ? ai(g, dt) : inputs[1] || emptyInput()];
  for (let i = 0; i < 2; i++) { const f = g.fighters[i], input = actual[i]; for (const key of ['interact', 'super', 'signature', 'grab', 'special', 'kick', 'punch', 'dash']) if (input[key] && !f.prev[key]) { f.buffer = { key, input: { ...(input.tapContexts?.[key] || input) }, life: C.input.bufferSeconds }; break; } if (input.jump && !f.prev.jump) f.jumpBuffered = C.input.jumpBufferSeconds; if (input.grab && !f.prev.grab) f.techWindow = C.throws.techWindow; f.prev = { ...input }; }
  // Resolve both activation requests together before either player advances.
  // No invulnerability is granted after the shared freeze.
  if(!g.grapple&&g.hitstop<=0){
    const owners=[];
    for(let i=0;i<2;i++){
      const f=g.fighters[i];
      if(f.buffer?.key!=='super'||f.hp<=0||f.stun>0||f.knockdown>0||f.y>0||f.landingRecovery>0)continue;
      if(!f.attack)f.facing=g.fighters[1-i].x>=f.x?1:-1;
      if(beginMove(g,f,'super',f.buffer.input)){f.buffer=null;owners.push(i);}
    }
    if(owners.length){
      g.cinematic={id:++g.eventId,owners,time:0,duration:C.ultimate.cutinSeconds};
      for(const i of owners)effect(g,'ultimate',g.fighters[i].x,320,{attacker:i,life:C.ultimate.cutinSeconds+.2});
      return g;
    }
  }
  if (g.hitstop > 0) { g.hitstop = Math.max(0, g.hitstop - dt); return g; } if (g.mode !== 'practice') g.time = Math.max(0, g.time - dt);
  for (const item of g.items) if (!item.available && item.owner === null && item.respawn > 0) { item.respawn -= dt; if (item.respawn <= 0) { item.available = true; item.x = item.home; } }
  // Snapshot capture ownership before either player's clock advances.
  const captors = g.fighters.map(f => ultimateCaptor(g, f));
  for (let i = 0; i < 2; i++) { const f = g.fighters[i], input = actual[i]; f.guard = !!input.guard && (f.stun <= 0 || f.blockstun > 0) && !f.attack && f.y === 0 && !(f.landingRecovery>0); f.crouch = !!input.crouch && f.y === 0 && !f.attack; f.blockstun = Math.max(0, (f.blockstun || 0) - dt); }
  for (let i = 0; i < 2; i++) {
    const f = g.fighters[i], enemy = g.fighters[1 - i], input = actual[i], def = definition(f), oldX = f.x; f.actionTime += dt;
    for (const key of ['stun', 'comboTime', 'recover', 'invulnerable', 'slow', 'techWindow', 'dashCooldown', 'chainTime', 'moveLabelTime', 'feedbackTime']) f[key] = Math.max(0, f[key] - dt);
    f.jumpBuffered = Math.max(0, (f.jumpBuffered || 0) - dt); if (f.buffer) { f.buffer.life -= dt; if (f.buffer.life <= 0) f.buffer = null; }
    f.landingRecovery=Math.max(0,(f.landingRecovery||0)-dt);
    if (g.grapple) { f.guard = false; f.buffer = null; f.jumpBuffered = 0; continue; }
    if (captors[i]) {
      f.guard=false;f.crouch=false;f.buffer=null;f.jumpBuffered=0;f.vy=0;
      f.stun=Math.max(f.stun,dt*2);f.action='hurt';f.moving=false;
      continue;
    }
    if (f.knockdown > 0) { f.knockdown = Math.max(0, f.knockdown - dt); if (f.knockdown === 0) { f.invulnerable = C.motion.wakeupInvulnerability; f.action = 'idle'; } }
    f.meter = clamp(f.meter + dt * (g.mode === 'practice' ? C.meter.practiceRegen : C.meter.regen), 0, C.meter.max); if (f.comboTime <= 0) f.combo = 0; if (f.chainTime <= 0) f.chain = []; if (!f.attack) f.facing = enemy.x >= f.x ? 1 : -1; f.moving = false;
    if (f.y > 0 || f.vy > 0) { f.y += f.vy * dt; f.vy -= C.motion.gravity * dt; if (f.y <= 0) {
      f.y = 0; f.vy = 0; f.juggle = 0;
      if(f.airKickUsed&&f.stun<=0&&f.knockdown<=0){
        f.landingRecovery=Math.max(C.air.kickLandingSeconds,f.attack?moveFor(f).duration-f.actionTime:0);
        f.transition={attack:f.attack,action:f.action,actionTime:f.actionTime};
        f.attack=null;f.action='landing';f.actionTime=0;f.guard=false;f.crouch=false;f.jumpBuffered=0;
      }
      f.airKickUsed=false;f.airKickCount=0;
      // Airborne repeat inputs must not turn into a free grounded kick on landing.
      if(f.buffer?.key==='kick')f.buffer=null;
    } }
    if (f.stun <= 0 && f.knockdown <= 0 && f.landingRecovery<=0) {
      if (!f.attack) { if (f.jumpBuffered > 0 && f.y === 0 && !f.guard) { f.vy = C.motion.jumpVelocity; f.y = 1; f.jumpBuffered = 0; } const direction = Number(!!input.right) - Number(!!input.left); if (direction && !f.guard && !f.crouch) { f.x = clamp(f.x + direction * def.speed * (f.slow > 0 ? C.motion.slowMultiplier : 1) * dt, C.arena.left, C.arena.right); f.moving = true; } }
      // Once stun has ended, a deliberate attack takes priority over held guard.
      // beginMove drops guard only on success; invalid or unaffordable moves do not.
      if (f.buffer && (!f.guard || C.input.attackFromGuard)) { const { key, input: context } = f.buffer; if (key!=='super' && beginMove(g, f, key, context)) f.buffer = null; } if (!f.attack) f.action = f.y > 0 ? 'jump' : f.guard ? 'guard' : f.crouch ? 'crouch' : f.moving ? 'walk' : 'idle';
    }
    if (f.attack) advanceAttack(g, f, enemy, i, dt);
    if (f.moving) f.walkCycle = (f.walkCycle || 0) + Math.abs(f.x - oldX) * (f.id === 'mei' ? .10 : .075);
  }
  advanceGrapple(g, dt);
  for (const [i,f] of g.fighters.entries()) {
    const owner=captors[i];if(!owner)continue;
    f.x=clamp(owner.x+owner.ultimateCaptureOffset.x,C.arena.left,C.arena.right);
    f.y=Math.max(0,owner.y+owner.ultimateCaptureOffset.y);
  }
  const [a, b] = g.fighters; if (!g.grapple && ![a,b].some(f=>f.attack&&moveFor(f)?.crossThrough&&f.actionTime<=moveFor(f).end) && Math.abs(a.x - b.x) < C.arena.bodySpacing && Math.abs(a.y - b.y) < C.arena.bodyVerticalRange) { const shift = (C.arena.bodySpacing - Math.abs(a.x - b.x)) / 2, dir = a.x < b.x ? -1 : 1; a.x = clamp(a.x + dir * shift, C.arena.left, C.arena.right); b.x = clamp(b.x - dir * shift, C.arena.left, C.arena.right); }
  resolveMelee(g);
  for (const p of g.projectiles) { p.x += p.direction * p.speed * dt; p.life -= dt; p.age += dt; if (p.move === 'bottle') { p.y += p.vy * dt; p.vy += C.projectiles.bottleGravity * dt; } const target = g.fighters[1 - p.owner]; if (Math.abs(p.x - target.x) < (p.super ? C.projectiles.superHitRadius : p.move === 'bottle' ? C.projectiles.bottleHitRadius : C.projectiles.hitRadius) && Math.abs(p.y - (350 - target.y + (target.crouch ? 14 : 0))) < (p.super ? C.projectiles.superVerticalRadius : C.projectiles.verticalRadius)) { if (hit(g, g.fighters[p.owner], target, moveFor(g.fighters[p.owner],p.move), true, p.direction)) { p.life = 0; if (p.move === 'bottle') effect(g, 'glass', p.x, p.y, { life: .55 }); } } if (p.y > 411) { p.life = 0; effect(g, 'glass', p.x, 413, { life: .55 }); } }
  g.projectiles = g.projectiles.filter(p => p.life > 0 && p.x > -60 && p.x < 1020);
  if (g.mode === 'practice') { for (const f of g.fighters) if (f.hp <= 0 || f.recover <= 0) f.hp = C.match.maxHealth; }
  else if (a.hp <= 0 || b.hp <= 0 || g.time <= 0) { g.roundWinner = a.hp === b.hp ? -1 : a.hp > b.hp ? 0 : 1; if (g.roundWinner >= 0) g.fighters[g.roundWinner].wins++; g.winner = g.fighters.findIndex(f => f.wins >= C.match.winsToWin); g.phase = 'roundOver'; g.phaseTime = C.match.roundOverSeconds; effect(g, 'ko', 480, 270, { life: C.match.roundOverSeconds }); } return g;
}
