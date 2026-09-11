// Hud.jsx — chips compactos de la barra superior (sesion "ganar espacio al
// tablero"): vida de ambos Lords, su reserva y el reloj de turnos, todo en tres
// pastillas de una sola fila para que el canvas gane altura. El lado activo
// queda resaltado con un borde que brilla.
export default function Hud({
  playerLordHp,
  enemyLordHp,
  lordMaxHp,
  reservePlayerCount,
  reserveEnemyCount,
  turnCount,
  turnClock,
  activeSide,
}) {
  return (
    <div className="hud">
      <span className={`hud-chip ally ${activeSide === 'player' ? 'active' : ''}`} title="Tu Lord">
        <strong>👑</strong> {playerLordHp}/{lordMaxHp}
        <em>Res. {reservePlayerCount}</em>
      </span>
      <span className="hud-chip turn">
        <strong>⏳</strong> {Math.min(turnCount, turnClock)}/{turnClock}
        <em>{activeSide === 'player' ? 'Player' : 'Enemy'}</em>
      </span>
      <span className={`hud-chip enemy ${activeSide === 'enemy' ? 'active' : ''}`} title="Lord rival">
        <strong>👑</strong> {enemyLordHp}/{lordMaxHp}
        <em>Res. {reserveEnemyCount}</em>
      </span>
    </div>
  )
}