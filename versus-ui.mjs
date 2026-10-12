import { FIGHTERS, moveFor } from './engine.mjs';
import { drawFighter } from './fighter-art.mjs';
import { RULES, WEAPONS, STAGES } from './game-config.mjs';
export function mountVersus(root,actions) {
  root.innerHTML=`<div class="versus-heading"><div><span class="eyebrow">VERSUS / READY CHECK</span><h1>选好角色，等你开打。</h1><p id="versus-room"></p></div><button id="versus-exit" class="secondary-button">离开本次 PK</button></div>
  <div class="series-banner"><div><span>本次 PK · 获胜场数</span><strong id="versus-score">0 : 0</strong><small>1P / 2P · 先赢 ${RULES.match.winsToWin} 回合算一场</small></div><div><b id="versus-match"></b><p id="versus-last"></p><span id="versus-connection"></span></div></div>
  <div class="versus-players">${[0,1].map(i=>`<article class="versus-player" id="versus-player-${i}"><div class="player-heading"><b>${i+1}P</b><span id="versus-role-${i}"></span><strong id="versus-ready-${i}" role="status"></strong></div><canvas width="240" height="190" id="versus-portrait-${i}" aria-label="${i+1}P 角色预览"></canvas><label>${i+1}P 角色<select id="versus-fighter-${i}"><option value="" disabled>等待好友加入</option>${FIGHTERS.map(f=>`<option value="${f.id}">${f.name} / ${f.en}</option>`).join('')}</select></label><label class="weapon-choice">选择武器<select id="versus-weapon-${i}">${Object.entries(WEAPONS).map(([id,w])=>`<option value="${id}">${w.name}</option>`).join("")}</select></label><p id="versus-weapon-tip-${i}"></p><p id="versus-style-${i}"></p><button id="versus-confirm-${i}" class="primary-button">准备好了</button></article>`).join('')}</div>
  <div class="versus-bottom"><label>对战规则<select id="versus-rules"><option value="classic">经典格斗</option><option value="weapons">武器 PK</option></select></label><label>对战场景<select id="versus-stage">${STAGES.map(s=>`<option value="${s.id}">${s.name} · ${s.weather}</option>`).join('')}</select></label><div><p id="versus-status" role="status"></p><small>换角色或场景后，双方需要重新确认准备。</small></div><button id="versus-invite" class="secondary-button">查看邀请信息</button></div><p id="versus-error" class="error-message" role="alert"></p>`;
  for(const i of [0,1]){
    root.querySelector(`#versus-fighter-${i}`).addEventListener('change',e=>actions.select(i,e.target.value));
    root.querySelector(`#versus-weapon-${i}`).addEventListener('change',e=>actions.weapon(i,e.target.value));
    root.querySelector(`#versus-confirm-${i}`).addEventListener('click',()=>actions.ready(i));
  }
  root.querySelector('#versus-rules').addEventListener('change',e=>actions.rules(e.target.value));
  root.querySelector('#versus-stage').addEventListener('change',e=>actions.stage(e.target.value));
  root.querySelector('#versus-invite').addEventListener('click',actions.invite);
  root.querySelector('#versus-exit').addEventListener('click',actions.exit);
  return (s,{local=false,slot=0,code=''}={})=>{
    const q=id=>root.querySelector(id);
    q('#versus-room').textContent=local?'同键盘对战 · 两位玩家分别确认准备':`房间 ${code} · 你是 ${slot+1}P`;
    q('#versus-score').textContent=s.score.join(' : ');q('#versus-match').textContent=`下一场 · 第 ${s.matchNumber+1} 场`;
    q('#versus-last').textContent=s.lastResult?`上一场：${s.lastResult.winner+1}P 获胜，回合比分 ${s.lastResult.rounds.join(' : ')}`:'双方确认准备后进入比赛。';
    q('#versus-stage').value=s.stage;q('#versus-stage').disabled=!local&&slot!==0;
    q('#versus-rules').value=s.ruleSet;q('#versus-rules').disabled=!local&&slot!==0;
    q('#versus-invite').hidden=local;
    if(local){q('#versus-connection').textContent='同键盘 · 无需网络连接';q('#versus-connection').classList.remove('connection-warning');}
    const joined=s.fighters.every(Boolean);
    q('#versus-status').textContent=!joined?'等待好友加入房间…':s.ready.every(Boolean)?'双方已准备，正在进入比赛…':s.ready.some(Boolean)?'等待另一位玩家确认准备…':'双方选好角色后，分别点击准备。';
    q('#versus-error').textContent='';
    for(const i of [0,1]){
      const f=FIGHTERS.find(f=>f.id===s.fighters[i]),own=local||i===slot;
      q(`#versus-role-${i}`).textContent=local?(i?'方向键 + 数字键':'WASD + J / K'):own?'你':'对手';
      q(`#versus-ready-${i}`).textContent=!f?'尚未加入':s.ready[i]?'已准备':'选角中';
      q(`#versus-player-${i}`).classList.toggle('ready',s.ready[i]);
      const weapon=q(`#versus-weapon-${i}`);weapon.value=s.weapons[i];weapon.disabled=!own||!f||s.ruleSet!=='weapons';
      q(`#versus-weapon-tip-${i}`).textContent=s.ruleSet==='weapons'?WEAPONS[s.weapons[i]].tip+' · J 轻击 / K 重击 / L、O 武器技':'经典模式使用角色拳脚';
      const select=q(`#versus-fighter-${i}`);select.value=f?.id||'';select.disabled=!own||!f;
      const button=q(`#versus-confirm-${i}`);button.disabled=!own||!joined;button.textContent=!own?(s.ready[i]?'对方已准备':'等待对方准备'):s.ready[i]?'取消准备':'准备好了';button.setAttribute('aria-pressed',String(s.ready[i]));
      q(`#versus-style-${i}`).textContent=f?`${f.style} · ${local&&i===1?'6':'O'} ${s.ruleSet==='weapons'?WEAPONS[s.weapons[i]].moves.weaponSkill.name:f.skill} · ${local&&i===1?'5':'I'} ${moveFor(f,'super').name}`:'把房间码和局域网地址发给好友。';
      const c=q(`#versus-portrait-${i}`).getContext('2d');c.clearRect(0,0,240,190);
      if(f)drawFighter(c,{id:f.id,weapon:s.ruleSet==='weapons'?s.weapons[i]:null,facing:i?-1:1,action:'idle'},120,181,2.15,0,true);
      else {c.font='bold 52px monospace';c.fillStyle='#69616e';c.textAlign='center';c.fillText('?',120,115);}
    }
  };
}
