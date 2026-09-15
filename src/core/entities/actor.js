// Estado común de entidades móviles. Combate y aldea pueden compartir esta
// forma sin compartir sus reglas de gameplay.

export const ACTOR_ACTIVITY = Object.freeze({
  IDLE: 'idle',
  MOVING: 'moving',
  WORKING: 'working',
  CARRYING: 'carrying',
  DISABLED: 'disabled',
})

export function createActorState({ kind = 'actor', pos = null } = {}) {
  return {
    entityKind: kind,
    pos,
    activity: ACTOR_ACTIVITY.IDLE,
    movePath: null,
    task: null,
    carrying: null,
  }
}

export function actorAt(actor, pos) {
  return { ...actor, pos }
}

export function actorWithActivity(actor, activity, extra = {}) {
  return { ...actor, activity, ...extra }
}
