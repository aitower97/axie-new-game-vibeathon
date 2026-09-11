// Hud.jsx — franja superior con HP/reserva de ambos Lords y el reloj de turnos.
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
      <div className="lord">Tu Lord: {playerLordHp}/{lordMaxHp} · Reserva {reservePlayerCount}</div>
      <div className="turn">Turno {Math.min(turnCount, turnClock)}/{turnClock} · {activeSide === 'player' ? 'Player' : 'Enemy'}</div>
      <div className="lord">Lord rival: {enemyLordHp}/{lordMaxHp} · Reserva {reserveEnemyCount}</div>
    </div>
  )
}
