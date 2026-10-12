const lerp=(a,b,t)=>a+(b-a)*t;
export function interpolateGame(previous,current,amount) {
  if(current.cinematic||previous?.cinematic||!previous||previous.round!==current.round||previous.phase!==current.phase||current.phase!=='fight')return current;
  const t=Math.max(0,Math.min(1,amount));
  const oldProjectiles=new Map(previous.projectiles.filter(p=>p.id!==undefined).map(p=>[p.id,p]));
  return {...current,
    fighters:current.fighters.map((f,i)=>{
      const old=previous.fighters[i];if(!old||old.id!==f.id)return f;
      const sameAction=old.action===f.action&&old.attack===f.attack&&old.moveSerial===f.moveSerial;
      return {...f,x:lerp(old.x,f.x,t),y:lerp(old.y,f.y,t),
        actionTime:sameAction?lerp(old.actionTime,f.actionTime,t):f.actionTime,
        throwRotation:sameAction?lerp(old.throwRotation||0,f.throwRotation||0,t):(f.throwRotation||0),
        walkCycle:lerp(old.walkCycle||0,f.walkCycle||0,t)};
    }),
    projectiles:current.projectiles.map(p=>{const old=oldProjectiles.get(p.id);return old&&old.owner===p.owner&&old.move===p.move?{...p,x:lerp(old.x,p.x,t),y:lerp(old.y,p.y,t),age:lerp(old.age,p.age,t)}:p;})
  };
}
