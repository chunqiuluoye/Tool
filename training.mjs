import { FIGHTERS, resetPractice, moveFor } from './engine.mjs';
import {RULES,WEAPONS} from './game-config.mjs';

const specialties = {
  kai: { keys:'J → J → O', moves:['punch','cross','flameRush'], tip:'两拳命中后接焰冲拳，用突进维持贴身压力。' },
  rin: { keys:'K → O', moves:['kick','cyclone','cyclone','cyclone'], tip:'侧踢命中后接三段旋踢；被挡住时先停手观察。' },
  rex: { keys:'O', moves:['shoulder'], dummy:'guard', tip:'用铁山靠破解站防。出手较慢，观察距离再进攻。' },
  yuna: { keys:'J → J → O', moves:['punch','cross','crescent'], tip:'近身两拳命中后，用月牙刃结束连段。' },
  mei: { keys:'J → J → O', moves:['punch','cross','palm','palm','palm'], tip:'看到命中火花后再接连掌，完成贴身五连击。' },
  vexa: { keys:'O → K', moves:['rising','airkick'], tip:'上勾命中并浮空后按 K；挥空时无法提前取消收招。' },
  aoi: { keys:'O', moves:['frost'], distance:230, tip:'保持中距离释放寒霜波，命中后对手移动减速。' },
  luna: { keys:'O', moves:['flip'], dummy:'crouchGuard', tip:'用落日翻踢突破蹲防；对手站防时不要反复使用。' },
};
export function lessonsFor(id,weapon=null) {
  const f=FIGHTERS.find(f=>f.id===id)||FIGHTERS[0];
  return [
    {id:'free',name:'自由练习',keys:'自由出招',moves:[],tip:'选择一门课程，或自由测试距离、道具与攻防。'},
    {id:'basic',name:'基础三连',keys:'J → J → K',moves:['punch','cross','roundhouse'],tip:'每次松开按键，命中后再接下一招。'},
    {id:'air',name:'升龙追击',keys:'S + J → K',moves:['uppercut','airkick'],tip:'按住 S 出拳，命中浮空后接 K。'},
    {id:'signature',name:weapon?WEAPONS[weapon].name+' · 武器技':f.name+' · 专属训练',...(weapon?{keys:'O',moves:Array(WEAPONS[weapon].moves.weaponSkill.strikes?.length||1).fill('weaponSkill'),tip:WEAPONS[weapon].tip}:specialties[f.id])},
    {id:'ultimate',name:f.name+' · 专属奥义',keys:'I',moves:['super'],distance:f.id==='aoi'?230:55,tip:moveFor(f,'super').hint+'。满能量开局，按 R 可归位再试。'},
  ];
}
export function setupLesson(game, id='free', dummy='idle') {
  if(game.mode!=='practice') return null;
  const lesson=lessonsFor(game.fighters[0].id,game.fighters[0].weapon).find(l=>l.id===id)||lessonsFor(game.fighters[0].id,game.fighters[0].weapon)[0];
  resetPractice(game); game.coach=null; game.aiInput={}; game.aiClock=0;
  if(id==='ultimate')game.fighters[0].meter=RULES.meter.max;
  game.dummy=lesson.dummy||dummy;
  if(id!=='free'||dummy==='counter') {game.fighters[0].x=430;game.fighters[1].x=430+(lesson.distance||55);}
  return {lesson,index:0,successes:0,lastEvent:game.eventId,successUntil:0,feedback:lesson.tip};
}
export function updateLesson(game, state) {
  if(!state||!state.lesson.moves.length) return;
  const expected=state.lesson.moves;
  for(const e of game.effects) {
    if(e.id<=state.lastEvent) continue;
    state.lastEvent=e.id;
    if(e.attacker===1&&e.kind!=='block'&&e.move){state.index=0;state.feedback='受到反击，重新起手。';continue;}
    if(e.attacker!==0||!e.move) continue;
    if(state.lesson.id==='ultimate'&&e.move==='super'&&e.combo>1)continue;
    if(e.kind==='block'){state.index=0;state.feedback='这一招被防住了，不能算命中连招。';continue;}
    if(state.index&&e.combo<=1) state.index=0;
    if(e.move===expected[state.index]) state.index++;
    else {state.index=e.move===expected[0]?1:0;state.feedback='招式顺序不对，按上方顺序重新尝试。';}
    if(state.index===expected.length) {
      state.successes++;state.index=0;state.successUntil=game.tick+100;state.feedback='完成！可以重复练习，或切换下一门课程。';
    } else if(state.index) state.feedback=`已命中 ${state.index} / ${expected.length} 段，继续衔接。`;
  }
  if(state.index&&game.fighters[0].comboTime<=0){state.index=0;state.feedback='衔接超时，靠近对手后重新起手。';}
}
export function simulationSpeed(mode, value) {return mode==='practice'&&[.5,.75,1].includes(Number(value))?Number(value):1;}
