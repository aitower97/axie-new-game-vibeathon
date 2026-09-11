// gameConstants.js — constantes de modulo puras que los componentes hoja del
// dashboard/tablero necesitan directamente (geometria del tablero y glifos).
// El resto de constantes de configuracion (TERRAIN_LAYOUT, GUARD_EFFECTS, etc.)
// y TODA la logica de partida se quedan en App.jsx (orquestador) -ver el plan
// de refactor: solo se mueve lo que un componente de presentacion necesita.

// Filas impares (7, no 6): el Lord cae exacto en la fila central en vez de
// quedar descentrado un lado, a peticion del usuario.
export const ROWS = 7
export const COLS = 8
export const PLAYER_LORD = { r: 3, c: 0 }
export const ENEMY_LORD = { r: 3, c: COLS - 1 }
export const CELL_SIZE = 90

// Glifo por tipo de efecto, para el dado en la carta (paso 5).
export const EFFECT_GLYPH = {
  pierce: '➤',
  'pierce-execute': '➤',
  'ranged-bonus': '➤',
  'ranged-fixed': '➤',
  'strike-shield-self': '⚔',
  'strike-self-damage': '⚔',
  'strike-combo': '⚔',
  guard: '◉',
  'guard-heal': '◉',
  'guard-push': '◉',
  'dash-attack': '⇉',
  'reposition-ally': '✦',
}
export const LORD_GLYPH = {
  'lord-attack': '⚔',
  'lord-shield': '◉',
  'lord-mark': '◎',
  'lord-heal': '♥',
  'lord-buff': '⬆',
  'lord-clone': '⧉',
}
