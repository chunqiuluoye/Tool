import { FIGHTERS, createGame } from './engine.mjs';
import {WEAPONS,STAGES} from './game-config.mjs';
const valid=id=>FIGHTERS.some(f=>f.id===id);
export function createSeries(p1='kai',p2=null,stage='street') {
  return {phase:'select',ruleSet:'classic',weapons:['nunchaku','sword'],fighters:[valid(p1)?p1:'kai',valid(p2)?p2:null],ready:[false,false],score:[0,0],stage:STAGES.some(s=>s.id===stage)?stage:'street',revision:1,matchNumber:0,lastResult:null};
}
export function chooseFighter(series,slot,id) {
  if(series.phase!=='select'||![0,1].includes(slot)||!valid(id))return false;
  if(series.fighters[slot]!==id){series.fighters[slot]=id;series.ready=[false,false];series.revision++;}return true;
}
export function chooseStage(series,slot,stage) {
  if(slot!==0||series.phase!=='select'||!STAGES.some(s=>s.id===stage))return false;
  if(series.stage!==stage){series.stage=stage;series.ready=[false,false];series.revision++;}return true;
}
export function chooseRuleSet(s,slot,value){
 if(slot!==0||s.phase!=='select'||!['classic','weapons'].includes(value))return false;
 if(s.ruleSet!==value){s.ruleSet=value;s.ready=[false,false];s.revision++;}return true;
}
export function chooseWeapon(s,slot,value){
 if(s.phase!=='select'||![0,1].includes(slot)||!Object.hasOwn(WEAPONS,value)||!s.fighters[slot])return false;
 if(s.weapons[slot]!==value){s.weapons[slot]=value;s.ready=[false,false];s.revision++;}return true;
}
export function setReady(series,slot,ready,revision) {
  if(series.phase!=='select'||![0,1].includes(slot)||!series.fighters.every(valid)||revision!==series.revision||typeof ready!=='boolean')return false;
  series.ready[slot]=ready;return true;
}
export function beginMatch(series,mode='lan') {
  if(series.phase!=='select'||!series.ready.every(Boolean)||!series.fighters.every(valid))return null;
  series.phase='playing';series.matchNumber++;
  return createGame({mode,p1:series.fighters[0],p2:series.fighters[1],stage:series.stage,ruleSet:series.ruleSet,weapons:series.weapons});
}
export function recordResult(series,game) {
  if(series.phase!=='playing'||game.phase!=='finished'||![0,1].includes(game.winner))return false;
  series.score[game.winner]++;series.phase='result';series.ready=[false,false];
  series.lastResult={matchNumber:series.matchNumber,winner:game.winner,rounds:game.fighters.map(f=>f.wins),fighters:[...series.fighters]};return true;
}
export function returnToSelection(series) {
  if(series.phase!=='result')return false;
  series.phase='select';series.ready=[false,false];series.revision++;return true;
}
