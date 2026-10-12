import { FIGHTERS, COMBAT_VERSION, moveFor, TAP_KEYS, createGame, stepGame, emptyInput } from './engine.mjs';
import { drawFighter, renderGame, renderPreview } from './render.mjs';
import { fillCombatGuide } from './combat-guide.mjs';
import { lessonsFor, setupLesson, updateLesson, simulationSpeed } from './training.mjs';
import { interpolateGame } from './interpolation.mjs';
import { createSeries, chooseFighter, chooseStage, chooseWeapon, chooseRuleSet, setReady, beginMatch, recordResult, returnToSelection } from './versus.mjs';
import { mountVersus } from './versus-ui.mjs';
import { RULES, CONFIG_SIGNATURE, WEAPONS, STAGES } from './game-config.mjs';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
fillCombatGuide($('#guide-dialog'));
const ui = { mode: 'solo', fighter: 'kai', difficulty: 'normal', stage: 'street', dummy: 'idle', sound: false };
let game = null, socket = null, slot = 0, roomCode = '', addresses = [], connectionGeneration = 0;
let input1 = emptyInput(), input2 = emptyInput(), previousTime = performance.now(), accumulator = 0, lastSent = 0, lastPong = 0, lastState = 0;
const pending1 = new Map(), pending2 = new Map();
const isTap = action => TAP_KEYS.includes(action);
let lastEffect = 0, previousPhase = '', toastTimer, audioContext, renderedFinish = false, animationFrame;
let previousSnapshot = null, receivedAt = 0;
let lessonState = null, previousLocal = null;
let series=null,versusLocal=false,viewingInvite=false,latency=null;
const preview = $('#preview').getContext('2d'), portrait = $('#portrait').getContext('2d'), arena = $('#arena').getContext('2d');
const renderVersus=mountVersus($('#versus-screen'),{
  select(i,id){if(versusLocal){chooseFighter(series,i,id);showVersus();}else send({type:'selectFighter',fighter:id});},
  ready(i){if(!series)return;if(versusLocal){setReady(series,i,!series.ready[i],series.revision);const next=beginMatch(series,'local');if(next)startGame(next);else showVersus();}else send({type:'ready',ready:!series.ready[slot],revision:series.revision});},
  weapon(i,weapon){if(versusLocal){chooseWeapon(series,i,weapon);showVersus();}else send({type:'selectWeapon',weapon});},
  rules(ruleSet){if(versusLocal){chooseRuleSet(series,0,ruleSet);showVersus();}else send({type:'selectRuleSet',ruleSet});},
  stage(stage){if(versusLocal){chooseStage(series,0,stage);showVersus();}else send({type:'selectStage',stage});},
  invite:showInvite,exit:exitGame
});
function updateScore(){const active=series&&['lan','local'].includes(game?.mode);$('#match-score').classList.toggle('hidden',!active);if(active)$('#match-score').textContent=`本次 PK · 1P ${series.score[0]} : ${series.score[1]} 2P · 第 ${series.matchNumber} 场`;}
function showVersus(){
  if(!series)return;
  const entering=$('#versus-screen').classList.contains('hidden');
  clearInputs();game=null;previousSnapshot=null;lessonState=null;
  if(!viewingInvite)$('#room-dialog').close();$('#guide-dialog').close();
  $('#lobby').classList.add('hidden');$('#game-screen').classList.add('hidden');$('#versus-screen').classList.remove('hidden');
  renderVersus(series,{local:versusLocal,slot,code:roomCode});updateConnection();
  $('#room-create .waiting-line').textContent=series.fighters.every(Boolean)?'好友已加入，请返回选角并确认准备。':'等待另一位格斗家加入…';
  if(entering)window.scrollTo({top:0,behavior:'instant'});
}
function openLocalVersus(){disconnect();versusLocal=true;series=createSeries(ui.fighter,$('#opponent').value,ui.stage);chooseRuleSet(series,0,$('#rules').value);chooseWeapon(series,0,$('#weapon').value);showVersus();}
function showInvite(){viewingInvite=true;$('#room-create').classList.remove('hidden');$('#join-form').classList.add('hidden');$('#room-code').textContent=roomCode;$('#room-title').textContent='邀请好友加入';$('#room-description').textContent='好友加入后，双方选角并确认准备。';$('#room-error').textContent='';$('#room-dialog').showModal();loadAddresses();}
function connectionLost(message){const score=series?`本次 PK 比分：1P ${series.score[0]} : ${series.score[1]} 2P。`:'';exitGame();$('#disconnect-reason').textContent=`${message} ${score} 重新加入需创建新房间。`;$('#disconnect-dialog').showModal();}
$('#ack-disconnect').addEventListener('click',()=>$('#disconnect-dialog').close());
function updateConnection(){
  if(versusLocal||!series)return;
  const stale=Date.now()-lastPong>6000||(game?.mode==='lan'&&Date.now()-lastState>3000);
  const message=stale?'● 连接不稳定，正在等待响应…':`● 已连接${latency===null?' · 检测延迟中':` · ${latency} ms`}`;
  for(const id of ['#network-ping','#versus-connection']){$(id).textContent=message;$(id).classList.toggle('connection-warning',stale);}
}
const p1Keys = { KeyA:'left',KeyD:'right',KeyW:'jump',KeyS:'crouch',Space:'guard',KeyJ:'punch',KeyK:'kick',KeyL:'special',KeyI:'super',KeyO:'signature',KeyH:'grab',KeyU:'dash',KeyE:'interact' };
const p2Keys = { ArrowLeft:'left',ArrowRight:'right',ArrowUp:'jump',ArrowDown:'crouch',Digit0:'guard',Numpad0:'guard',Digit1:'punch',Numpad1:'punch',Digit2:'kick',Numpad2:'kick',Digit3:'special',Numpad3:'special',Digit5:'super',Numpad5:'super',Digit4:'interact',Numpad4:'interact',Digit6:'signature',Numpad6:'signature',Digit7:'grab',Numpad7:'grab',Digit8:'dash',Numpad8:'dash' };
function toast(message) { $('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3600); }
function sound(type='select') {
  if(!ui.sound)return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if(audioContext.state==='suspended')audioContext.resume();
    const now=audioContext.currentTime,osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.connect(gain);gain.connect(audioContext.destination);
    const notes={select:[550,800,.06],hit:[155,43,.12],blast:[320,42,.23],block:[770,190,.09],cast:[160,610,.13],round:[440,880,.24],ko:[220,45,.45],glass:[2200,110,.18],pickup:[700,1200,.08],toss:[600,220,.1],dash:[210,90,.08],tech:[900,1400,.12],break:[80,35,.2],ultimate:[110,990,.48],slam:[85,28,.3]};const [a,b,duration]=notes[type]||notes.select;
    osc.type=type==='hit'||type==='blast'?'sawtooth':'square';osc.frequency.setValueAtTime(a,now);osc.frequency.exponentialRampToValueAtTime(b,now+duration);gain.gain.setValueAtTime(.035,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);osc.start(now);osc.stop(now+duration);
  } catch { /* Audio may be unavailable on an embedded browser. */ }
}
function selectFighter(id) {
  ui.fighter=id;const f=FIGHTERS.find(f=>f.id===id);
  $('#fighter-word').textContent=f.en;$('#fighter-name').textContent=f.name;$('#fighter-subtitle').textContent=f.title;$('#fighter-index').textContent=String(FIGHTERS.indexOf(f)+1).padStart(2,'0');
  $('#fighter-skill').textContent=`${f.style} · O ${f.skill} · I ${moveFor(f,"super").name}`;
  $$('.fighter-choice').forEach(b=>{const selected=b.dataset.fighter===id;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',selected);});
  $('#fighter-stats').replaceChildren(...['力量','速度','技巧'].map((name,index)=>{const row=document.createElement('div');row.className='stat-row';const label=document.createElement('span');label.textContent=name;const bars=document.createElement('span');bars.className='stat-bars';bars.setAttribute('aria-label',`${f.stats[index]} / 5`);for(let i=0;i<5;i++){const bar=document.createElement('i');if(i<f.stats[index])bar.className='on';bars.append(bar);}row.append(label,bars);return row;}));
  portrait.clearRect(0,0,320,205);drawFighter(portrait,{id,facing:1,action:'idle'},169,196,2.35,0,true);sound();
}
for(const f of FIGHTERS){const b=document.createElement('button');b.className='fighter-choice';b.dataset.fighter=f.id;b.setAttribute('aria-label',`${f.name} · ${f.title}`);const c=document.createElement('canvas');c.width=72;c.height=60;const label=document.createElement('span');label.className='choice-name';label.textContent=f.en;b.append(c,label);$('#fighter-options').append(b);const ctx=c.getContext('2d');drawFighter(ctx,{id:f.id,facing:1,action:'idle'},34,112,1.5,0,true);b.addEventListener('click',()=>selectFighter(f.id));}
selectFighter('kai');
for(const f of FIGHTERS){const option=document.createElement('option');option.value=f.id;option.textContent=`${f.name} / ${f.en}`;$('#opponent').append(option);}$('#opponent').value='rin';
function selectMode(mode) {
  ui.mode=mode;$$('[data-mode]').forEach(b=>{b.classList.toggle('selected',b.dataset.mode===mode);b.setAttribute('aria-pressed',b.dataset.mode===mode);});
  $('#difficulty-block').classList.toggle('hidden',mode!=='solo');$('#practice-block').classList.toggle('hidden',mode!=='practice');$('#lan-block').classList.toggle('hidden',mode!=='lan');
  $('#start-label').textContent={solo:'开始挑战',lan:'创建对战房间',practice:'进入训练场'}[mode];$('#start-caption').textContent={solo:`先赢 ${RULES.match.winsToWin} 回合 · 每回合 ${RULES.match.roundSeconds} 秒`,lan:'局域网直连 · 双方选角并准备后开打',practice:'无限时间 · 自动恢复生命与能量'}[mode];sound();
}
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>selectMode(b.dataset.mode)));
$$('[data-difficulty]').forEach(b=>b.addEventListener('click',()=>{ui.difficulty=b.dataset.difficulty;$$('[data-difficulty]').forEach(v=>{v.classList.toggle('active',v===b);v.setAttribute('aria-pressed',v===b);});sound();}));
$('#stage').innerHTML=STAGES.map(s=>`<option value="${s.id}">${s.name} · ${s.weather}</option>`).join('');
$('#weapon').innerHTML=Object.entries(WEAPONS).map(([id,w])=>`<option value="${id}">${w.name} · ${w.tip}</option>`).join('');
$('#rules').addEventListener('change',()=>{$('#weapon').disabled=$('#rules').value!=='weapons';});
$('#stage').addEventListener('change',e=>{ui.stage=e.target.value;$('#stage-hero-label').textContent=STAGES.find(s=>s.id===ui.stage).name+' / '+STAGES.find(s=>s.id===ui.stage).weather;sound();});
$('#dummy').addEventListener('change',e=>ui.dummy=e.target.value);
function clearInputs(){input1=emptyInput();input2=emptyInput();pending1.clear();pending2.clear();$$('[data-input]').forEach(b=>b.classList.remove('pressed'));if(game?.mode==='lan')send({type:'input',input:input1});}
function startGame(nextGame) {
  game=nextGame;previousSnapshot=null;lastEffect=0;previousPhase='';renderedFinish=false;accumulator=0;clearInputs();
  $('#lobby').classList.add('hidden');$('#game-screen').classList.remove('hidden');$('#game-overlay').classList.add('hidden');$('#training-stats').classList.toggle('hidden',game.mode!=='practice');$('#pause-button').classList.toggle('hidden',game.mode==='lan');$('#resume-button').disabled=false;
  $('#pause-button').innerHTML='暂停 <kbd>Esc</kbd>';
  $('#versus-screen').classList.add('hidden');updateScore();
  $('#game-mode-label').textContent={solo:'单人挑战 / PLAYER VS CPU',practice:'自由练习 / TRAINING',lan:`局域网 PK / 房间 ${roomCode} · 你是 ${slot+1}P`,local:'同键盘 PK / PLAYER VS PLAYER'}[game.mode];
  $('#game-hint').innerHTML='<kbd>W A S D</kbd> 移动 · <kbd>J</kbd> 拳 <kbd>K</kbd> 腿 <kbd>L</kbd> 气功 <kbd>I</kbd> 必杀 <kbd>Space</kbd> 防御<br><kbd>E</kbd> 拾取 / 投瓶 · <kbd>H</kbd> 投技 / 拆投 · <kbd>U</kbd> 闪步 · <kbd>O</kbd> 专属技';
  if(game.mode==='local')$('#game-hint').innerHTML+=' <span class="p2-controls">2P：方向键移动，1 拳 / 2 腿 / 3 气功 / 4 瓶 / 5 必杀 / 6 专属 / 7 投 / 8 闪 / 0 防御</span>';
  if(game.ruleSet==='weapons'){
    $('#game-mode-label').textContent+=' · 武器 PK';
    $('#game-hint').innerHTML='<kbd>J / K</kbd> 武器轻击 / 重击 · <kbd>L / O</kbd> 武器技 · <kbd>I</kbd> 角色奥义 · <kbd>Space</kbd> 防御 · 方向、跳跃、蹲下、投技与闪步保持原键位。'+(game.mode==='local'?' 2P：1 / 2 轻重击，3 / 6 武器技，5 奥义。':'');
  }
  if(game.mode!=='lan')$('#network-ping').textContent='';
  previousLocal=null;lessonState=null;
  if(game.mode==='practice'){
    $('#training-lesson').replaceChildren(...lessonsFor(game.fighters[0].id,game.fighters[0].weapon).map(lesson=>{const option=document.createElement('option');option.value=lesson.id;option.textContent=lesson.name;return option;}));
    $('#training-opponent').value=ui.dummy;configureTraining();
  }
  $('#arena').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});sound('round');
}
function startLocal(mode=ui.mode) { startGame(createGame({ mode,p1:ui.fighter,p2:$('#opponent').value,difficulty:ui.difficulty,stage:ui.stage,dummy:ui.dummy,ruleSet:$('#rules').value,weapons:[$('#weapon').value,'sword'] })); }
function start(){if(ui.mode==='lan')openRoom('create');else startLocal();}
$('#start-button').addEventListener('click',start);$('#hero-start').addEventListener('click',start);$('#local-button').addEventListener('click',openLocalVersus);
function send(message){if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(message));}
function disconnect(){connectionGeneration++;if(socket){send({type:'leave'});socket.close();socket=null;}roomCode='';}
function exitGame(){disconnect();game=null;series=null;versusLocal=false;viewingInvite=false;previousSnapshot=null;clearInputs();$('#versus-screen').classList.add('hidden');$('#room-dialog').close();$('#guide-dialog').close();$('#game-screen').classList.add('hidden');$('#lobby').classList.remove('hidden');$('#game-overlay').classList.add('hidden');$('#start-button').focus({preventScroll:true});sound();}
$('#exit-game').addEventListener('click',exitGame);$('#overlay-exit').addEventListener('click',exitGame);$('#nav-arcade').addEventListener('click',()=>{if(game||series)exitGame();else window.scrollTo({top:0,behavior:'smooth'});});
function showOverlay(kicker,title,description,button){$('#overlay-kicker').textContent=kicker;$('#overlay-title').textContent=title;$('#overlay-description').textContent=description;$('#resume-button').textContent=button;$('#resume-button').disabled=false;$('#game-overlay').classList.remove('hidden');$('#resume-button').focus({preventScroll:true});}
function pause(){if(!game||game.mode==='lan'||!['fight','intro','paused'].includes(game.phase))return;if(game.phase==='paused'){game.phase=game.beforePause||'fight';$('#game-overlay').classList.add('hidden');$('#pause-button').innerHTML='暂停 <kbd>Esc</kbd>';$('#arena').focus();}else{game.beforePause=game.phase;game.phase='paused';clearInputs();showOverlay('TAKE A BREATH','已暂停','调整节奏，准备好下一记重拳。','继续对战 →');$('#pause-button').innerHTML='继续 <kbd>Esc</kbd>';}}
$('#pause-button').addEventListener('click',pause);
$('#resume-button').addEventListener('click',()=>{if(!game)return;if(game.phase==='paused')pause();else if(game.phase==='finished'){if(game.mode==='lan'){send({type:'returnLobby'});$('#resume-button').disabled=true;}else if(game.mode==='local'&&series){returnToSelection(series);showVersus();}else startLocal(game.mode);}});
function configureTraining(){
  if(game?.mode!=='practice')return;
  const course=$('#training-lesson').value;
  lessonState=setupLesson(game,course,course==='free'?$('#training-opponent').value:'idle');
  $('#training-opponent').value=game.dummy;
  previousLocal=null;accumulator=0;clearInputs();$('#arena').focus({preventScroll:true});
}
$('#training-lesson').addEventListener('change',configureTraining);
$('#training-opponent').addEventListener('change',()=>{$('#training-lesson').value='free';configureTraining();});
$('#training-speed').addEventListener('change',()=>{previousLocal=null;accumulator=0;clearInputs();$('#arena').focus({preventScroll:true});});
function reset(){if(game?.mode==='practice'){configureTraining();toast('已归位，重新开始当前练习。');}}
$('#reset-training').addEventListener('click',reset);
function finish(){if(renderedFinish)return;renderedFinish=true;clearInputs();if(game.mode==='local'&&series)recordResult(series,game);updateScore();const winner=FIGHTERS.find(f=>f.id===game.fighters[game.winner].id);const won=game.winner===(game.mode==='lan'?slot:0);const score=series&&['local','lan'].includes(game.mode)?` 本次 PK：1P ${series.score[0]} : ${series.score[1]} 2P。`:'';showOverlay(won?'VICTORY / WELL PLAYED':'DEFEAT / KEEP FIGHTING',game.mode==='local'?`${winner.name} 获胜`:won?'漂亮，拿下！':'再来一局。',`${winner.name} 以 ${game.fighters[game.winner].wins} : ${game.fighters[1-game.winner].wins} 赢得比赛。${score}`,['lan','local'].includes(game.mode)?'换人 / 准备下一场 →':'再战一场 →');sound('ko');}
window.addEventListener('keydown',e=>{
  if(!game||$('dialog[open]')||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.target.closest?.('select,input,textarea'))return;
  if(e.code==='Escape'){e.preventDefault();if(!e.repeat)pause();return;}
  if(e.code==='KeyR'&&game.mode==='practice'){if(!e.repeat)reset();return;}
  if(!['fight','intro'].includes(game.phase))return;
  const action=p1Keys[e.code],action2=game.mode==='local'?p2Keys[e.code]:null;
  if(action||action2){e.preventDefault();if(action){input1[action]=true;if(!e.repeat&&isTap(action))pending1.set(action,{...input1});}if(action2){input2[action2]=true;if(!e.repeat&&isTap(action2))pending2.set(action2,{...input2});}if(game.mode==='lan'&&!e.repeat)send({type:'input',input:input1});}
});
window.addEventListener('keyup',e=>{const a=p1Keys[e.code],b=p2Keys[e.code];if(a)input1[a]=false;if(b)input2[b]=false;if(game?.mode==='lan'&&a)send({type:'input',input:input1});});
window.addEventListener('blur',()=>{clearInputs();if(game&&game.mode!=='lan'&&['fight','intro'].includes(game.phase))pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInputs();if(game&&game.mode!=='lan'&&['fight','intro'].includes(game.phase))pause();}});
for(const b of $$('[data-input]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);input1[b.dataset.input]=true;if(isTap(b.dataset.input))pending1.set(b.dataset.input,{...input1});b.classList.add('pressed');if(game?.mode==='lan')send({type:'input',input:input1});});for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>{input1[b.dataset.input]=false;b.classList.remove('pressed');if(game?.mode==='lan')send({type:'input',input:input1});});}
function openGuide(){if(game&&game.mode!=='lan'&&['fight','intro'].includes(game.phase))pause();clearInputs();$('#guide-dialog').showModal();sound();}
for(const id of ['#nav-guide','#all-controls','#battle-guide'])$(id).addEventListener('click',openGuide);
$$('.close-dialog').forEach(b=>b.addEventListener('click',()=>$('#guide-dialog').close()));
$('#sound-button').addEventListener('click',()=>{ui.sound=!ui.sound;$('#sound-button .sound-slash').classList.toggle('hidden',ui.sound);$('#sound-button').setAttribute('aria-label',ui.sound?'关闭声音':'开启声音');$('#sound-button').title=ui.sound?'关闭声音':'开启声音';sound();toast(ui.sound?'街机音效已开启':'声音已关闭');});
$('#fullscreen-button').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('当前浏览器不支持全屏，请使用 F11。');}});
async function connect() {
  if(socket?.readyState===WebSocket.OPEN)return;
  const generation=++connectionGeneration;
  const version=await fetch('/api/network',{signal:AbortSignal.timeout(5000)}).then(r=>r.json());
  if(version.combatVersion!==COMBAT_VERSION||version.configSignature!==CONFIG_SIGNATURE)throw new Error('游戏或配置已更新：请关闭原启动窗口，重新双击启动游戏，再刷新双方页面。');
  if(generation!==connectionGeneration)throw new Error('连接已取消。');
  await new Promise((resolve,reject)=>{
    const ws=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}`);socket=ws;
    let settled=false;const timeout=setTimeout(()=>{if(!settled){settled=true;ws.close();reject(new Error('连接超时，请确认游戏服务器正在运行。'));}},6000);
    ws.onopen=()=>{if(generation!==connectionGeneration){ws.close();clearTimeout(timeout);reject(new Error('连接已取消。'));return;}settled=true;clearTimeout(timeout);lastPong=Date.now();lastState=Date.now();resolve();};
    ws.onmessage=e=>{if(generation!==connectionGeneration)return;let data;try{data=JSON.parse(e.data);}catch{return;}handleMessage(data);};
    ws.onerror=()=>{if(!settled){settled=true;clearTimeout(timeout);reject(new Error('无法连接服务器。请使用启动窗口显示的游戏地址。'));}};
    ws.onclose=()=>{clearTimeout(timeout);if(!settled){settled=true;reject(new Error('连接已关闭，请重试。'));}if(generation!==connectionGeneration)return;socket=null;$('#confirm-join').disabled=false;if(series&&!versusLocal){connectionLost('与服务器的连接已断开。');}else if($('#room-dialog').open){$('#room-error').textContent='与服务器的连接已断开，请关闭后重试。';}};
  });
}
function handleMessage(data){
  if(data.type==='created'){roomCode=data.code;slot=0;$('#room-code').textContent=data.code;}
  if(data.type==='roomState'){series=data.series;roomCode=data.code;slot=data.slot;versusLocal=false;$('#room-code').textContent=roomCode;$('#confirm-join').disabled=false;if(series.phase==='select')showVersus();}
  if(data.type==='start'){series=data.series;versusLocal=false;roomCode=data.code;slot=data.slot;lastState=Date.now();$('#room-dialog').close();viewingInvite=false;$('#confirm-join').disabled=false;startGame(data.game);updateConnection();}
  if(data.type==='state'&&game?.mode==='lan'){series=data.series;previousSnapshot=game;game=data.game;receivedAt=performance.now();lastState=Date.now();updateScore();}
  if(data.type==='error'){$('#room-error').textContent=data.message;$('#versus-error').textContent=data.message;$('#confirm-join').disabled=false;}
  if(data.type==='closed')connectionLost(data.message);
  if(data.type==='pong'){lastPong=Date.now();latency=Math.max(0,Date.now()-data.at);updateConnection();}
}
async function loadAddresses(){
  $('#network-addresses').textContent='正在获取局域网地址…';
  try{const response=await fetch('/api/network');if(!response.ok)throw new Error();const data=await response.json();addresses=data.addresses;
    $('#network-addresses').replaceChildren();for(const address of addresses){const a=document.createElement('a');a.href=address;a.textContent=address;a.target='_blank';a.rel='noopener';$('#network-addresses').append(a);}if(!addresses.length)$('#network-addresses').textContent='未检测到局域网地址，请先连接 Wi-Fi 或有线网络。';
  }catch{$('#network-addresses').textContent='无法获取局域网地址。请检查服务器连接。';}
}
async function openRoom(kind){
  disconnect();series=null;versusLocal=false;viewingInvite=false;latency=null;$('#room-error').textContent='';$('#room-code').textContent='------';$('#room-input').value='';$('#confirm-join').disabled=false;
  $('#room-create').classList.toggle('hidden',kind!=='create');$('#join-form').classList.toggle('hidden',kind==='create');$('#room-title').textContent=kind==='create'?'擂台就绪，等你好友。':'连接你的对手。';$('#room-description').textContent=kind==='create'?'发送地址和房间码，对方加入后，双方选角并确认准备。':'请先打开房主的局域网地址，再输入房间码。';$('#room-dialog').showModal();sound();
  if(kind==='create'){loadAddresses();try{await connect();if($('#room-dialog').open)send({type:'create',fighter:ui.fighter,stage:ui.stage,ruleSet:$('#rules').value,weapon:$('#weapon').value});}catch(error){$('#room-error').textContent=error.message;}}
  else $('#room-input').focus();
}
$('#join-button').addEventListener('click',()=>openRoom('join'));
function closeRoom(){if(!viewingInvite)disconnect();viewingInvite=false;$('#room-dialog').close();}
$('#close-room').addEventListener('click',closeRoom);$('#room-dialog').addEventListener('cancel',()=>{if(!viewingInvite)disconnect();viewingInvite=false;});
$('#join-form').addEventListener('submit',async e=>{e.preventDefault();const code=$('#room-input').value.trim();if(!/^\d{6}$/.test(code)){$('#room-error').textContent='请输入 6 位数字房间码。';return;}$('#confirm-join').disabled=true;$('#room-error').textContent='';try{await connect();if($('#room-dialog').open)send({type:'join',code,fighter:ui.fighter});}catch(error){$('#room-error').textContent=error.message;$('#confirm-join').disabled=false;}});
$('#copy-invite').addEventListener('click',async()=>{if(!roomCode){toast('房间还未创建成功。');return;}const invite=`来一局 NEON FIST 像素街霸！\n打开 ${addresses[0]||location.origin}\n双人 PK → 加入好友的房间\n房间码：${roomCode}\n请连接同一局域网。`;try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(invite);else{const area=document.createElement('textarea');area.value=invite;$('#room-dialog').append(area);area.select();const copied=document.execCommand('copy');area.remove();if(!copied)throw new Error();}toast('邀请信息已复制，发给好友就能开打。');}catch{toast('复制不可用，请手动发送页面上的地址与房间码。');}});
setInterval(()=>{if(socket?.readyState===WebSocket.OPEN){send({type:'ping',at:Date.now()});updateConnection();if(Date.now()-lastPong>12000){socket.close();}}},2000);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function frame(now){
  const dt=Math.min((now-previousTime)/1000,.1);previousTime=now;const time=now/1000;
  if(!game){renderPreview(preview,ui.stage,reducedMotion?0:time,ui.fighter);}
  else{
    const speed=simulationSpeed(game.mode,$('#training-speed').value);
    if(game.mode!=='lan'){accumulator+=dt*speed;let count=0;while(accumulator>=1/60&&count++<6){const one={...input1,tapContexts:Object.fromEntries(pending1)},two={...input2,tapContexts:Object.fromEntries(pending2)};for(const key of pending1.keys())one[key]=true;for(const key of pending2.keys())two[key]=true;pending1.clear();pending2.clear();if(speed<1)previousLocal=structuredClone(game);stepGame(game,[one,two]);updateLesson(game,lessonState);accumulator-=1/60;}}
    else if(now-lastSent>45){send({type:'input',input:input1});lastSent=now;}
    let drawn=game;
    if(game.mode==='lan'&&previousSnapshot&&game.phase==='fight'&&previousSnapshot.phase==='fight'){
      drawn=interpolateGame(previousSnapshot,game,(now-receivedAt)/33.33);
    }
    else if(game.mode==='practice'&&speed<1)drawn=interpolateGame(previousLocal,game,accumulator*60);
    renderGame(arena,drawn,game.mode==='practice'?game.tick/60:time,{ranges:game.mode==='practice'&&$('#training-ranges').checked});
    for(const e of game.effects){if(e.id>lastEffect){sound(e.kind);lastEffect=e.id;}}
    if(previousPhase!==game.phase){if(game.phase==='fight'&&previousPhase==='intro')sound('round');previousPhase=game.phase;}
    if(game.phase==='finished')finish();
    if(game.mode==='practice'){
      const f=game.fighters[0];$('#stat-hits').textContent=f.hits;$('#stat-damage').textContent=f.lastDamage;$('#stat-combo').textContent=f.maxCombo;$('#stat-total').textContent=f.totalDamage;
      $('#combo-readout').textContent=f.chain.length?f.chain.map(name=>moveFor(f,name).name).join(' → '):'本次出招：等待输入';
      if(lessonState){const state=lessonState;$('#lesson-keys').textContent=state.lesson.keys;$('#lesson-count').textContent=`完成 ${state.successes} 次`;const message=state.lesson.id==='free'&&game.dummy==='counter'?'陪练会防御，并在你收招时出拳。用快招试探，观察重招的风险。':state.feedback;if($('#lesson-status').textContent!==message)$('#lesson-status').textContent=message;$('.lesson-card').classList.toggle('complete',state.successUntil>game.tick);}
    }
  }
  animationFrame=requestAnimationFrame(frame);
}
selectMode(ui.mode);
animationFrame=requestAnimationFrame(frame);
window.addEventListener('pagehide',()=>{cancelAnimationFrame(animationFrame);if(socket)socket.close();});
