// attackAnimNames.js — nombres de clip de animacion de ataque por slot, sin
// depender de @axieinfinity/mixer (extraido de axieMixer.js, el puente 2D
// descartado: Board3D.jsx solo necesitaba estas 3 constantes, no el resto del
// puente 2D/pixi-spine).
// Verificado contra el catalogo de animaciones reales que usa Axie Origins
// (axie-origins-asset-kit, Documentation~/MixerAnimations.md). Solo horn/mouth/
// tail atacan en este prototipo (eyes/ears siempre son invocacion, back
// siempre es guardia), asi que no hace falta cubrir los seis slots.
export const SLOT_ATTACK_ANIM = {
  horn: 'attack/melee/horn-gore',
  mouth: 'attack/melee/mouth-bite',
  tail: 'attack/melee/tail-smash',
}
export const FALLBACK_ATTACK_ANIM = 'attack/melee/normal-attack'
export const IDLE_ANIM = 'action/idle/normal'
