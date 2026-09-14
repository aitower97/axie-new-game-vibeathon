// diceTurn.js — quien baraja el cubo 3D de su carta ahora mismo. Solo el
// bando al que le toca tirar: durante el turno propio (`activeSide`), solo
// las cartas de ese bando; durante la secuencia animada del rival
// (`enemyTurn`), solo el bando rival. Bug real: `activeSide` es constante
// 'player' en App.jsx, asi que la formula antigua
// `side === activeSide || (enemyTurn && side === 'enemy')` hacia que los
// dados PROPIOS tambien se barajaran durante la tirada del rival. Ahora el
// `!enemyTurn` explicito corta esa rama.
export function diceTumbling(rolling, activeSide, enemyTurn, unitSide) {
  if (!rolling) return false
  if (enemyTurn) return unitSide === 'enemy'
  return unitSide === activeSide
}