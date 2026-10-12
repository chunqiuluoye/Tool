import {RULES,MOVES,FIGHTERS,MOVE_STYLES} from './game-config.mjs';
export function fillCombatGuide(dialog){
  const weaponNote=document.createElement('div');weaponNote.className='guide-tip';weaponNote.innerHTML='<b>武器 PK · 双方独立选武器</b><p>准备页选择武器 PK，再各自选择双截棍、长枪或剑。J / K 为武器轻击与重击，L / O 为武器技；本地 2P 对应 1 / 2、3 / 6。I / 5 继续释放角色奥义。蹲下与空中的拳脚沿用原招式。</p><p>双截棍：近身快速多段；长枪：远距离牵制，收招较长；剑：中距离斩击。武器招式可被格挡和截击。更换武器、规则或地图后，双方需重新准备。</p>';dialog.append(weaponNote);
  const table=dialog.querySelector('.guide-table');
  const rows=[['移动 / 跳跃 / 下蹲','A D / W / S'],['刺拳 / 侧踢','J / K'],['升龙拳 / 扫堂腿','S + J / S + K'],['飞踢（先跳起）','W → K'],['闪步（可配合 A / D）','U'],['近身过肩摔 / 拆投','H'],['拾取碎瓶 / 投掷碎瓶','E'],['角色专属技 · 35 能量','O'],['气功 / 必杀 · 25 / 100 能量','L / I'],['站防 / 蹲防','Space / S + Space'],['暂停 / 训练重置','Esc / R']];
  const costs=[...new Set(FIGHTERS.map(f=>MOVE_STYLES[f.id]?.[f.signature]?.cost??MOVES[f.signature].cost))];
  rows[3][0]=RULES.air.kickLimit?`飞踢（每次腾空最多 ${RULES.air.kickLimit} 次）`:'普通飞踢（已禁用）';
  rows[7][0]=`角色专属技 · ${costs.length===1?costs[0]+' 能量':'能耗依角色而定'}`;
  rows[8][0]=`气功 / 专属奥义 · ${MOVES.special.cost} / ${MOVES.super.cost} 能量`;
  table.replaceChildren(...rows.map(([label,keys])=>{const row=document.createElement('div'),b=document.createElement('b'),span=document.createElement('span');b.textContent=label;span.textContent=keys;span.className='guide-keys';row.append(b,span);return row;}));
  const tips=dialog.querySelectorAll('.guide-tip');
  tips[0].querySelector('p').textContent='方向键移动；1 拳、2 腿、3 气功、4 拾取/投瓶、5 必杀、6 专属技、7 投技/拆投、8 闪步、0 防御。支持主键盘和数字小键盘。';
  const combos=document.createElement('div');combos.className='guide-tip combo-recipes';combos.innerHTML='<b>命中确认连招</b><p><kbd>J → J → K</kbd> 刺拳 → 直拳 → 回旋终结。看到命中火花再按下一键，可提前约 0.2 秒输入。</p><p><kbd>S + J → K</kbd> 升龙浮空 → 飞踢追击；<kbd>J → L</kbd> 轻拳接气功，推开对手。</p><p>扫堂腿克制站防，蹲防可以挡住；飞踢与落日翻踢克制蹲防。投技需要贴身，可在对方抓取时按 H 拆投。倒地起身有短暂无敌，连招越长伤害越低。</p><p>拾瓶会短暂弯腰，受击会掉落；瓶子沿弧线飞行，可防御或跳跃躲避，用过的瓶子约 9 秒刷新。</p>';
  combos.innerHTML=combos.innerHTML.replace('看到命中火花再按下一键','看到命中火花再按下一键，被防住或挥空不能提前取消').replace('用过的瓶子约 9 秒刷新','中央两处碎瓶用过后约 12 秒刷新，场上显示倒计时');
  const tactics=document.createElement('p');tactics.textContent='绯樱：J → J → O 贴身五连击；薇莎：O → K 上勾拳命中后接飞踢。绯樱出手快，薇莎重拳强但收招更长。';combos.prepend(tactics);
  const defense=document.createElement('p');defense.textContent='趁重招收招用快拳反击，成功显示「收招惩罚」。过肩摔会翻身换边，落地才结算伤害；浮空最多受击三次。拾瓶和投瓶有明显前摇，可以被打断。练习场可勾选「招式距离」，亮黄色表示有效攻击阶段。';combos.append(defense);
  table.after(combos);
  const training=document.createElement('div');training.className='guide-tip';
  training.innerHTML='<b>循序练习，把连招带进 PK</b><p>训练场可选择基础三连、升龙追击和当前角色的专属课程，命中后逐段确认并记录完成次数。被防住、挥空和超时都不算完成。</p><p>赤焰与月影：J → J → O；凛：K → O。雷克斯练 O 破站防，霜华练中距离寒霜波，露娜练 O 破蹲防。</p><p>选择「防御后反击」，观察哪些重招会被惩罚；切换 0.75× 或 0.5× 练习速度，看清出招和衔接时机。R 重置当前课程并归位，PK 始终保持正常速度。</p>';
  combos.after(training);
  const supers=document.createElement('div');supers.className='guide-tip';
  const title=document.createElement('b');title.textContent='专属奥义 · I / 本地 2P 按 5';supers.append(title);
  for(const f of FIGHTERS){const m=MOVE_STYLES[f.id].super;const p=document.createElement('p');p.textContent=f.name+' · '+m.name+'：'+m.hint;supers.append(p);}
  const note=document.createElement('p');note.textContent='满能量、站在地面时释放。角色卡演出暂停双方和回合计时；起手可防守、躲避或打断；有效命中后攻击段不可打断，多段锁定目标。被挡和打空不触发保护，收招仍可反击。按住按键不会连续释放。练习场选择「专属奥义」，R 归位并充满能量。';supers.append(note);training.after(supers);
  const ground=document.createElement('p');ground.textContent='普通侧踢被挡或踢空后，收腿时间较长，可以靠近用快拳反击。按住 Space 时按攻击键，硬直结束后会放开防御出招；出招期间不能同时防御。近身用 J，中距离可以用 K，远处轻拳够不到时先靠近，不要原地连续挥空。';training.append(ground);
  ground.textContent=`普通侧踢收招 ${Math.max(0,MOVES.kick.duration-MOVES.kick.end).toFixed(2)} 秒，被挡或踢空后可以靠近反击。${RULES.input.attackFromGuard?'按住 Space 时按攻击键，硬直结束后会放开防御出招；出招期间不能同时防御。':'需先松开 Space 再出招。'}近身用 J，中距离可以用 K，远处轻拳够不到时先靠近。`;
  combos.innerHTML=combos.innerHTML.replace('约 12 秒刷新',`约 ${RULES.items.respawnSeconds} 秒刷新`).replace('浮空最多受击三次',`浮空最多受击 ${RULES.air.juggleLimit} 次`);
  const aerial=document.createElement('p');aerial.textContent=`每次腾空普通飞踢上限：${RULES.air.kickLimit} 次。飞踢落地后至少收招 ${RULES.air.kickLandingSeconds.toFixed(2)} 秒，期间无法出招、跳跃或防御。对手在空中时用站防或 S + J 升龙应对，也可以抓落地收招反击。`;training.append(aerial);
}
