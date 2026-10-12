/**
 * 格斗调参统一入口（本地、练习、AI、联机和动画共用）。
 * 修改后：npm run check:config → 重启启动游戏.cmd → 双方刷新网页。
 * 时间单位：秒（10 / 60 表示 60 Hz 下 10 帧）；距离：游戏逻辑像素。
 * speed/lunge：像素/秒；power/reach：倍率，1 为原值。
 * 常改项：MOVES.kick、RULES.air、RULES.guard、RULES.input。
 * 本文件不包含页面布局、像素关节坐标和网络基础设施参数。
 */
// 引擎协议版本，日常调数值不用修改；配置变化会自动生成指纹。
export const COMBAT_VERSION = 11;

// ① 角色：速度 speed、伤害倍率 power、距离倍率 reach。
export const FIGHTERS = [{
  id: 'kai',
  name: '赤焰',
  en: 'KAI',
  title: '烈火之拳',
  color: '#f35851',
  dark: '#9e303e',
  hair: '#252036',
  skin: '#f6bd91',
  speed: 174,
  power: 1,
  reach: 1,
  stats: [4, 4, 3],
  signature: 'flameRush',
  skill: '焰冲拳',
  style: '空手道 · 突进压制'
},
{
  id: 'rin',
  name: '凛',
  en: 'RIN',
  title: '疾风之影',
  color: '#68d3d6',
  dark: '#306887',
  hair: '#e3e9ed',
  skin: '#efd0bc',
  speed: 202,
  power: .87,
  reach: .96,
  stats: [3, 5, 3],
  signature: 'cyclone',
  skill: '疾风旋踢',
  style: '忍术 · 连续踢击'
},
{
  id: 'rex',
  name: '雷克斯',
  en: 'REX',
  title: '钢铁重拳',
  color: '#e5b859',
  dark: '#876335',
  hair: '#694429',
  skin: '#c68d6a',
  speed: 146,
  power: 1.2,
  reach: 1.08,
  stats: [5, 2, 4],
  signature: 'shoulder',
  skill: '铁山靠',
  style: '摔跤 · 重击破防'
},
{
  id: 'yuna',
  name: '月影',
  en: 'YUNA',
  title: '紫电流派',
  color: '#b69cf7',
  dark: '#6a448a',
  hair: '#342342',
  skin: '#edbcaf',
  speed: 185,
  power: .95,
  reach: 1.02,
  stats: [3, 4, 5],
  female: true,
  look: 'ninja',
  signature: 'crescent',
  skill: '月牙刃',
  style: '影舞 · 远程牵制'
},
{
  id: 'mei',
  name: '绯樱',
  en: 'MEI',
  title: '咏春玫瑰',
  color: '#f479a6',
  dark: '#922951',
  hair: '#292436',
  skin: '#f5c5a3',
  speed: 188,
  power: .93,
  reach: 1.04,
  stats: [3, 4, 5],
  female: true,
  look: 'qipao',
  signature: 'palm',
  skill: '樱花三叠掌',
  style: '咏春 · 贴身三连掌'
},
{
  id: 'vexa',
  name: '薇莎',
  en: 'VEXA',
  title: '赤金拳后',
  color: '#ffb461',
  dark: '#995239',
  hair: '#a34740',
  skin: '#ca8f6c',
  speed: 167,
  power: 1.12,
  reach: 1,
  stats: [5, 3, 4],
  female: true,
  look: 'boxer',
  signature: 'rising',
  skill: '彗星上勾拳',
  style: '拳击 · 浮空追击'
},
{
  id: 'aoi',
  name: '霜华',
  en: 'AOI',
  title: '冰蓝华尔兹',
  color: '#91d9f4',
  dark: '#426d9f',
  hair: '#e4eef7',
  skin: '#f0cfbf',
  speed: 178,
  power: .91,
  reach: 1.1,
  stats: [3, 4, 5],
  female: true,
  look: 'coat',
  signature: 'frost',
  skill: '寒霜波',
  style: '冰舞 · 命中减速'
},
{
  id: 'luna',
  name: '露娜',
  en: 'LUNA',
  title: '日落舞姬',
  color: '#aadc80',
  dark: '#4a7e66',
  hair: '#46303f',
  skin: '#b47a61',
  speed: 208,
  power: .86,
  reach: 1.03,
  stats: [3, 5, 4],
  female: true,
  look: 'dancer',
  signature: 'flip',
  skill: '落日翻踢',
  style: '卡波耶拉 · 翻身压顶'
},
];
// ② 通用招式：时间均为秒；收招 = duration - end。
export const MOVES = {
  punch: {
    name: '刺拳',
    duration: .28,
    active: .085,
    end: .17,
    range: 69,
    damage: 6,
    stun: .23,
    push: 4,
    level: 'high'
  },
  cross: {
    name: '直拳',
    duration: .34,
    active: .10,
    end: .20,
    range: 78,
    damage: 8,
    stun: .28,
    push: 5,
    lunge: 80
  },
  kick: {
    name: '侧踢',
    duration: .60, // 总时长：增大后连续踢腿更慢，收招破绽更大
    active: .18, // 前摇：出招后多久开始攻击判定
    end: .26, // 判定结束：必须 active <= end <= duration
    range: 96, // 攻击距离（还会乘角色 reach）
    damage: 10, // 基础伤害（还会乘角色 power 和连击衰减）
    stun: .25, // 命中后的受击硬直
    push: 14, // 命中后推开距离
    blockPush: 6, // 被挡后推开距离
  },
  roundhouse: {
    name: '回旋终结',
    duration: .53,
    active: .17,
    end: .30,
    range: 108,
    damage: 15,
    stun: .43,
    push: 30,
    launch: 190
  },
  uppercut: {
    name: '升龙拳',
    duration: .60,
    active: .14,
    end: .31,
    range: 77,
    damage: 12,
    stun: .47,
    push: 8,
    launch: 365,
    lift: 250
  },
  sweep: {
    name: '扫堂腿',
    duration: .57,
    active: .19,
    end: .31,
    range: 102,
    damage: 11,
    stun: .58,
    push: 18,
    level: 'low',
    knockdown: .5
  },
  airkick: {
    name: '飞踢',
    duration: .44,
    active: .09,
    end: .29,
    range: 103,
    damage: 11,
    stun: .35,
    push: 15,
    level: 'overhead'
  },
  airpunch: {
    name: '空中拳',
    duration: .31,
    active: .075,
    end: .20,
    range: 77,
    damage: 7,
    stun: .26,
    push: 6
  },
  grab: {
    name: '过肩摔',
    duration: .72,
    active: .15,
    end: .23,
    range: 55,
    damage: 16,
    stun: .65,
    push: 70,
    knockdown: .55,
    kind: 'throw'
  },
  dash: {
    name: '闪步',
    duration: .23,
    active: 1,
    end: 1,
    damage: 0
  },
  pickup: {
    name: '拾取碎瓶',
    duration: .48,
    active: .27,
    end: .32,
    damage: 0
  },
  bottle: {
    name: '碎瓶投掷',
    duration: .62,
    active: .28,
    end: .35,
    damage: 12,
    stun: .32,
    push: 20,
    kind: 'projectile'
  },
  special: {
    name: '气功',
    duration: .60,
    active: .21,
    end: .3,
    damage: 13,
    cost: 25,
    kind: 'projectile'
  },
  super: {
    name: '专属奥义',
    duration: 1.15,
    active: .26,
    end: .4,
    damage: 29,
    cost: 100,
    kind: 'melee',
    range: 95,
    stun: .4,
    push: 10,
    blockPush: 7
  },
  flameRush: {
    name: '焰冲拳',
    duration: .62,
    active: .20,
    end: .38,
    range: 82,
    damage: 19,
    stun: .40,
    push: 28,
    cost: 35,
    lunge: 250
  },
  cyclone: {
    name: '疾风旋踢',
    duration: .74,
    active: .14,
    end: .57,
    range: 101,
    damage: 7,
    stun: .27,
    push: 4,
    cost: 35,
    strikes: [.14, .30, .46]
  },
  shoulder: {
    name: '铁山靠',
    duration: .78,
    active: .30,
    end: .46,
    range: 75,
    damage: 21,
    stun: .55,
    push: 43,
    cost: 35,
    lunge: 170,
    guardBreak: true
  },
  crescent: {
    name: '月牙刃',
    duration: .54,
    active: .16,
    end: .24,
    damage: 15,
    cost: 35,
    kind: 'projectile',
    projectileSpeed: 465
  },
  palm: {
    name: '樱花三叠掌',
    duration: .70,
    active: .12,
    end: .52,
    range: 83,
    damage: 7,
    stun: .27,
    push: 3,
    cost: 35,
    strikes: [.12, .27, .42],
    lunge: 42
  },
  rising: {
    name: '彗星上勾拳',
    duration: .70,
    active: .17,
    end: .35,
    range: 84,
    damage: 19,
    stun: .58,
    push: 10,
    cost: 35,
    launch: 420,
    lift: 310
  },
  frost: {
    name: '寒霜波',
    duration: .68,
    active: .25,
    end: .32,
    damage: 13,
    cost: 35,
    kind: 'projectile',
    slow: 1.7,
    projectileSpeed: 310
  },
  flip: {
    name: '落日翻踢',
    duration: .70,
    active: .24,
    end: .48,
    range: 100,
    damage: 18,
    stun: .45,
    push: 25,
    cost: 35,
    level: 'overhead',
    lift: 210,
    lunge: 120
  },
};
// ③ 角色专属覆盖：优先于 MOVES，也影响对应动画时间。
export const MOVE_STYLES = {
  mei: {
    punch: {
      name: '日字冲拳',
      duration: .25,
      active: .07,
      end: .14,
      range: 67,
      push: 3
    },
    cross: {
      name: '进步连掌',
      duration: .30,
      active: .09,
      end: .18,
      damage: 7,
      lunge: 70
    },
    palm: {
      duration: .76,
      end: .49
    }
  },
  vexa: {
    punch: {
      name: '拳击刺拳',
      duration: .31,
      active: .10,
      end: .17,
      damage: 7
    },
    cross: {
      name: '转腰重直拳',
      duration: .43,
      active: .14,
      end: .22,
      damage: 11,
      push: 12,
      lunge: 100
    },
    rising: {
      duration: .84,
      end: .33
    }
  },
};

// ③b 专属大招：I / 本地 2P 的 5。数值和动作类型仍集中在本文件。
// pose 为动画模板；finisher 覆盖最后一击；field 在发动时锁定位置，不追踪对手。
export const ULTIMATES = {
  kai: { name:'红莲破阵', subtitle:'CRIMSON BARRAGE', hint:'突进三拳 · 站防或拉开距离', pose:'flameRush', duration:1.12, active:.22, end:.65, range:94, damage:11, stun:.28, push:2, lunge:180, strikes:[.22,.39,.56], finisher:{damage:21,push:42}, theme:'fire' },
  rin: { name:'天岚四连脚', subtitle:'TEMPEST DANCE', hint:'四段旋踢 · 站防，收招后反击', pose:'cyclone', duration:1.35, active:.24, end:.9, range:111, damage:10, stun:.25, push:1, lunge:70, strikes:[.24,.43,.62,.81], finisher:{damage:17,push:34}, theme:'wind' },
  rex: { name:'山崩地裂', subtitle:'TITAN FALL', hint:'近身抓投 · 跳起或后撤躲避，可拆投', pose:'grab', duration:1.22, active:.28, end:.39, range:65, damage:34, kind:'throw', knockdown:.65, throwDuration:.8, throwHeight:190, theme:'earth' },
  yuna: { name:'胧月一闪', subtitle:'MOONLIT SEVER', hint:'高速穿身斩 · 提前防守，远距离可避开', pose:'crescent', duration:1.16, active:.30, end:.46, range:112, damage:34, stun:.48, push:25, lunge:680, lungeBegin:.12, crossThrough:true, theme:'moon' },
  mei: { name:'百花八卦掌', subtitle:'BLOSSOM CHAIN', hint:'贴身六连掌 · 保持距离或站防', pose:'palm', duration:1.46, active:.20, end:1.01, range:90, damage:8, stun:.24, push:0, blockPush:3, lunge:25, strikes:[.20,.35,.50,.65,.80,.95], finisher:{damage:18,push:38}, theme:'petal' },
  vexa: { name:'陨星升龙', subtitle:'METEOR UPPERCUT', hint:'重拳浮空 · 站防后惩罚落地', pose:'rising', duration:1.28, active:.27, end:.44, range:100, damage:36, stun:.65, launch:490, liftOnStrike:350, verticalRange:160, push:18, theme:'meteor' },
  aoi: { name:'极寒王座', subtitle:'FROZEN THRONE', hint:'锁定位置冰柱 · 看地面预警，走出范围', pose:'frost', duration:1.42, active:.57, end:.70, range:78, damage:34, stun:.5, slow:2.2, push:15, field:true, fieldReach:360, verticalRange:170, theme:'ice' },
  luna: { name:'落日回旋舞', subtitle:'SOLAR CAPOEIRA', hint:'三段翻踢 · 站防，不能蹲防', pose:'flip', duration:1.32, active:.28, end:.84, range:108, damage:13, stun:.30, push:2, lunge:95, level:'overhead', verticalRange:165, strikes:[.28,.51,.74], finisher:{damage:21,push:36}, theme:'sun' }
};
for (const [id, ultimate] of Object.entries(ULTIMATES)) {
  MOVE_STYLES[id] ||= {};
  MOVE_STYLES[id].super = ultimate;
}

/** 角色的 speed/power/reach 决定移动速度/伤害倍率/攻击距离倍率。
 * stats 是选角面板的 1～5 展示评级，不参与战斗计算。
 * MOVE_STYLES 是指定角色对 MOVES 的覆盖，修改通用招式时请同时留意这里。
 * 招式字段：
 * duration 总时长；active 首次判定时刻；end 判定结束时刻。
 * 收招时间 = duration - end；必须 0 <= active <= end <= duration。
 * range 中心距离，乘角色 reach；damage 基础伤害，乘 power 和连击衰减。
 * stun 受击硬直；push 命中推开；blockPush 被挡推开（未填用全局默认）。
 * cost 能量消耗；launch 对手浮空初速度；lift 自身腾空初速度。
 * strikes 多段判定时刻；level: low 扫腿 / overhead 破蹲防 / high 高位拳。
 * guardBreak 破防；slow 减速持续时间；projectileSpeed 飞行速度。
 * dash 的 active/end=1 是无攻击判定的占位值，不需要调整。
 */
// ④ 公共规则。
export const RULES = {
  ultimate: { cutinSeconds: .85, confirmProtection: true }, // 命中后保护攻击段并锁定多段目标；收招不受保护。
  match: {
    maxHealth: 100, // 满血值（血条、练习恢复也跟随）
    roundSeconds: 99, // 每回合时限
    winsToWin: 2, // 先赢几回合算一场，1～7
    introSeconds: 2.2, // 开场倒计时
    roundOverSeconds: 2.8, // 回合结束停留
  },
  meter: {
    max: 100,
    initial: 50,
    roundMinimum: 30,
    regen: 2.1,
    practiceRegen: 22, // 每秒恢复
    onHit: 6,
    onBlock: 2,
    onHurt: 4, // 命中/被挡/受击获得能量
  },
  guard: {
    chipMultiplier: .12, // 防御削血比例，最终伤害最低为 1
    stun: .12, // 格挡硬直
    push: 12, // 招式没有 blockPush 时的默认推开距离
  },
  input: {
    bufferSeconds: .22,
    jumpBufferSeconds: .15,
    attackFromGuard: true, // 按住防御时允许主动出招，出招即放弃防御
  },
  air: {
    kickLimit: 1, // 每次腾空普通飞踢次数，0 禁用普通飞踢
    kickLandingSeconds: 10 / 60, // 飞踢后落地最短收招，剩余收招更长则保留
    juggleLimit: 3, // 浮空最多追击次数
    juggleLaunchDecay: .17, // 逐次降低浮空高度的比例
  },
  motion: {
    jumpVelocity: 435,
    gravity: 1000,
    dashSpeed: 490,
    dashCooldown: .62,
    slowMultiplier: .58, // 寒霜减速后的速度倍率
    wakeupInvulnerability: .22, // 倒地起身保护
  },
  combo: {
    damageDecay: .10,
    minimumDamageMultiplier: .4,
    resetSeconds: .75,
    stunGrace: .16,
    chainSeconds: .68,
    cancelEndMargin: .02, // 收招末尾停止接受取消的时间
  },
  hit: {
    defaultStun: .32,
    defaultPush: 18,
    hitstop: .04,
    heavyHitstop: .065,
    blockHitstop: .025,
    heavyDamage: 15, // 重击停顿阈值（基础伤害）
    strikeWindow: .13, // 每段判定最长持续时间，仍受招式 end 限制
    verticalRange: 82,
    uppercutVerticalRange: 125,
    throwVerticalRange: 24,
    crouchHighVerticalRange: 24,
    lowAvoidHeight: 22, // 高于此高度可避开扫腿
  },
  practice: {
    healthRecoveryDelay: 2
  }, // 停止受击多久后自动恢复
  arena: {
    left: 48,
    right: 912,
    spawn: [315, 645],
    bodySpacing: 38,
    bodyVerticalRange: 72,
  },
  items: {
    spawns: [400, 560],
    respawnSeconds: 12,
    pickupRange: 48,
    dropOffset: 20,
    left: 65,
    right: 895,
  },
  throws: {
    techWindow: .18,
    techStun: .22,
    techPush: 25,
    duration: .46,
    attackerRecovery: .16,
  },
  projectiles: {
    defaultSpeed: 340,
    superSpeed: 510,
    bottleSpeed: 475,
    bottleVelocityY: -100,
    bottleGravity: 280,
    life: 3,
    hitRadius: 25,
    superHitRadius: 35,
    bottleHitRadius: 21,
    verticalRadius: 43,
    superVerticalRadius: 63,
  },
  ai: {
    reaction: {
      easy: .35,
      normal: .21,
      hard: .12
    },
    guardChance: {
      easy: .15,
      normal: .38,
      hard: .65
    },
    coachReaction: .06,
    approachDistance: 84,
  },
};

// ⑤ 连招路线：命中才允许取消收招接下一招；被挡和挥空不能取消。
export const CANCEL_ROUTES = {
  punch: ['cross', 'kick', 'uppercut', 'special'],
  cross: ['roundhouse', 'uppercut', 'special'],
  kick: ['uppercut', 'special'],
  uppercut: ['airkick'],
  rising: ['airkick'],
  airpunch: ['airkick'],
};
export const CHARACTER_CANCEL_ROUTES = {
  mei: {
    cross: ['palm']
  },
  kai: {
    cross: ['flameRush']
  },
  yuna: {
    cross: ['crescent']
  },
  rin: {
    kick: ['cyclone']
  },
};

// 兼容现有引擎和动画的引用；日常修改上面的 RULES 即可。
export const AIR_KICK_LANDING = RULES.air.kickLandingSeconds;
export const BOTTLE_RESPAWN = RULES.items.respawnSeconds;

// 以下是配置自检和联机指纹，通常不需要修改。
export function validateConfig({
  fighters = FIGHTERS,
  moves = MOVES,
  styles = MOVE_STYLES,
  rules = RULES,
  routes = CANCEL_ROUTES,
  characterRoutes = CHARACTER_CANCEL_ROUTES
} = {}) {
  const fail = (path, why) => {
    throw new Error('游戏配置错误：' + path + ' ' + why);
  };
  const number = (path, n, min = 0) => {
    if (typeof n !== 'number' || !Number.isFinite(n) || n < min) fail(path, '必须是 >= ' + min + ' 的有效数字');
  };
  const walk = (value, path) => {
    if (['RULES.input.attackFromGuard','RULES.ultimate.confirmProtection'].includes(path)) {
      if (typeof value !== 'boolean') fail(path, '必须是 true 或 false');
      return;
    }
    if (value && typeof value === 'object') {
      for (const [key, v] of Object.entries(value)) walk(v, path + '.' + key);
    } else number(path, value, path === 'RULES.projectiles.bottleVelocityY' ? -Infinity : 0);
  };
  walk(rules, 'RULES');
  for (const [path, value] of [
    ['match.maxHealth', rules.match.maxHealth],
    ['match.roundSeconds', rules.match.roundSeconds],
    ['meter.max', rules.meter.max],
    ['motion.gravity', rules.motion.gravity],
    ['motion.jumpVelocity', rules.motion.jumpVelocity]
  ]) number('RULES.' + path, value, Number.EPSILON);
  if (!Number.isInteger(rules.match.winsToWin) || rules.match.winsToWin < 1 || rules.match.winsToWin > 7) fail('RULES.match.winsToWin', '必须是 1～7 的整数');
  for (const k of ['kickLimit', 'juggleLimit'])
    if (!Number.isInteger(rules.air[k])) fail('RULES.air.' + k, '必须是非负整数');
  if (rules.meter.initial > rules.meter.max || rules.meter.roundMinimum > rules.meter.max) fail('RULES.meter', '初始/回合最低能量不能超过上限');
  if (rules.guard.chipMultiplier > 1 || rules.combo.minimumDamageMultiplier > 1 || rules.combo.damageDecay > 1) fail('RULES', '削血/伤害衰减倍率不能超过 1');
  if (rules.arena.left >= rules.arena.right) fail('RULES.arena', 'left 必须小于 right');
  if (rules.arena.spawn.length !== 2 || rules.arena.spawn.some(x => x < rules.arena.left || x > rules.arena.right)) fail('RULES.arena.spawn', '需要两个位于边界内的出生位置');
  const checkMove = (move, path, key) => {
    for (const field of ['duration', 'active', 'end', 'damage']) number(path + '.' + field, move[field]);
    if (move.duration <= 0) fail(path + '.duration', '必须大于 0');
    if (key !== 'dash' && (move.active > move.end || move.end > move.duration)) fail(path, '需满足 active <= end <= duration');
    for (const field of ['range', 'stun', 'push', 'blockPush', 'cost', 'lunge', 'launch', 'lift', 'slow', 'projectileSpeed', 'lungeBegin', 'liftOnStrike', 'verticalRange', 'throwDuration', 'throwHeight', 'fieldReach'])
      if (move[field] !== undefined) number(path + '.' + field, move[field]);
    if(move.finisher)for(const [field,value] of Object.entries(move.finisher))number(path+'.finisher.'+field,value);
    if(move.pose&&!moves[move.pose])fail(path+'.pose','需要有效的动画招式');
    for(const field of ['field','crossThrough'])if(move[field]!==undefined&&typeof move[field]!=='boolean')fail(path+'.'+field,'必须是布尔值');
    if (move.strikes && (!Array.isArray(move.strikes) || move.strikes.some((t, i) => !Number.isFinite(t) || t < move.active || t > move.end || (i > 0 && t < move.strikes[i - 1])))) fail(path + '.strikes', '必须是判定区间内按时间递增的数组');
    if (move.level !== undefined && !['high', 'low', 'overhead'].includes(move.level)) fail(path + '.level', '只能是 high / low / overhead');
  };
  for (const [key, move] of Object.entries(moves)) checkMove(move, 'MOVES.' + key, key);
  for(const [id,w] of Object.entries(WEAPONS)){number('WEAPONS.'+id+'.length',w.length,1);for(const [key,m] of Object.entries(w.moves))checkMove(m,'WEAPONS.'+id+'.'+key,key);}
  const ids = new Set();
  for (const f of fighters) {
    if (ids.has(f.id)) fail('FIGHTERS.' + f.id, '角色 ID 重复');
    ids.add(f.id);
    for (const k of ['speed', 'power', 'reach']) number('FIGHTERS.' + f.id + '.' + k, f[k], Number.EPSILON);
    if (!moves[f.signature]) fail('FIGHTERS.' + f.id + '.signature', '不存在该招式');
  }
  for (const [id, overrides] of Object.entries(styles)) {
    if (!ids.has(id)) fail('MOVE_STYLES.' + id, '不存在该角色');
    for (const [key, value] of Object.entries(overrides)) {
      if (!moves[key]) fail('MOVE_STYLES.' + id + '.' + key, '不存在该招式');
      checkMove({
        ...moves[key],
        ...value
      }, 'MOVE_STYLES.' + id + '.' + key, key);
    }
  }
  const checkRoutes = (map, path) => {
    for (const [key, next] of Object.entries(map)) {
      if (!moves[key] || !Array.isArray(next) || next.some(k => !moves[k])) fail(path + '.' + key, '必须引用现有招式');
    }
  };
  checkRoutes(routes, 'CANCEL_ROUTES');
  for (const [id, map] of Object.entries(characterRoutes)) {
    if (!ids.has(id)) fail('CHARACTER_CANCEL_ROUTES.' + id, '不存在该角色');
    checkRoutes(map, 'CHARACTER_CANCEL_ROUTES.' + id);
  }
  return true;
}

// 武器招式为完整覆盖，不继承角色拳脚的特殊属性。天气只影响画面。
export const STAGES = [
 {id:'street',name:'霓虹夜街',weather:'夜雨'}, {id:'rooftop',name:'月下天台',weather:'晴夜'},
 {id:'snow',name:'雪山道场',weather:'飘雪'}, {id:'desert',name:'落日古城',weather:'风沙'},
 {id:'shrine',name:'樱林神社',weather:'落樱'}, {id:'harbor',name:'风暴码头',weather:'暴雨'},
 {id:'foundry',name:'熔炉工厂',weather:'飞灰火星'}
];
const weaponMove=(name,duration,active,end,range,damage,extra={})=>({name,duration,active,end,range,damage,stun:.26,push:8,blockPush:10,kind:'melee',pose:'punch',...extra});
export const WEAPONS = {
 nunchaku:{name:'双截棍',tip:'近身快攻、二连抽击；距离短，防住后可反击',length:25,color:'#e7ba67',moves:{
  punch:weaponMove('短棍点打',.30,.08,.15,87,6),cross:weaponMove('换手抽击',.38,.11,.21,94,9),
  kick:weaponMove('双棍连打',.66,.16,.40,104,7,{strikes:[.16,.32],push:2}),
  special:weaponMove('疾风棍阵',.85,.16,.61,104,7,{strikes:[.16,.34,.52],cost:25,push:2,lunge:35}),
  weaponSkill:weaponMove('盘龙三叠',.95,.20,.72,113,9,{strikes:[.20,.41,.62],cost:35,push:2,lunge:45})}},
 spear:{name:'长枪',tip:'长距离直刺、横扫；起手慢，贴身容易被截击',length:62,color:'#dc8465',moves:{
  punch:weaponMove('探枪直刺',.53,.20,.28,164,9),cross:weaponMove('进步穿刺',.63,.23,.33,180,12,{lunge:45}),
  kick:weaponMove('横扫千军',.82,.29,.41,176,16,{push:28}),
  special:weaponMove('破阵突刺',.88,.30,.47,186,19,{cost:25,lunge:100}),
  weaponSkill:weaponMove('回马枪',1.02,.34,.48,195,23,{cost:35,push:38})}},
 sword:{name:'剑',tip:'中距离斩击、突进终结；速度与距离均衡',length:37,color:'#b3e3ef',moves:{
  punch:weaponMove('拔剑横斩',.38,.12,.21,118,8),cross:weaponMove('回身连斩',.46,.15,.25,125,10),
  kick:weaponMove('断空重斩',.72,.24,.36,138,17,{push:24}),
  special:weaponMove('踏步突剑',.69,.21,.34,144,16,{cost:25,lunge:110}),
  weaponSkill:weaponMove('流光双斩',.91,.22,.57,139,12,{strikes:[.22,.47],cost:35,push:4,lunge:55})}}
};
MOVES.weaponSkill=weaponMove('武器技',.7,.2,.3,100,15,{cost:35});
for(const w of Object.values(WEAPONS))w.moves.roundhouse={...w.moves.kick,name:w.name+' · 终结击'};

validateConfig();

// 指纹只用于发现两端配置不一致，不是安全认证。
export function configSignature(value = {
  WEAPONS, STAGES,
  FIGHTERS,
  MOVES,
  MOVE_STYLES,
  RULES,
  CANCEL_ROUTES,
  CHARACTER_CANCEL_ROUTES
}) {
  let hash = 2166136261;
  for (const c of JSON.stringify(value)) {
    hash ^= c.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
export const CONFIG_SIGNATURE = configSignature();

