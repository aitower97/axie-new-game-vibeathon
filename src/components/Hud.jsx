// Hud.jsx — chips compactos de la barra superior (sesion "ganar espacio al
// tablero"): vida de ambos Lords, su reserva y el reloj de RONDAS, todo en
// tres pastillas de una sola fila para que el canvas gane altura. El lado
// activo queda resaltado con un borde que brilla.
//
// Rondas, no turnos sueltos (pedido 2026-09-11, "cambiaria los turnos a
// rondas, unas 8 rondas, que seria un turno mio y otro del rival una
// ronda"): `turnCount`/`turnClock` (App.jsx) siguen contando MEDIOS-turno
// por debajo -TURN_CLOCK paso de 12 a 16, o sea 8 rondas- porque el resto de
// la logica de partida (passTurn, el log "Turno N...") ya funciona sobre esa
// unidad y tocarla habria sido un cambio mucho mayor del pedido ("simplemente
// con eso es suficiente"). Aqui, en la UNICA pastilla que el jugador lee como
// "cuanto queda", se convierte a rondas solo para mostrar: 2 medios-turno = 1
// ronda.
export default function Hud({
  playerLordHp,
  enemyLordHp,
  lordMaxHp,
  reservePlayerCount,
  reserveEnemyCount,
  turnCount,
  turnClock,
  activeSide,
  overtime,
}) {
  const round = Math.min(Math.ceil(turnCount / 2), Math.ceil(turnClock / 2) + (overtime ? 2 : 0))
  const roundClock = Math.ceil(turnClock / 2) + (overtime ? 2 : 0)
  return (
    <div className="hud">
      <span className={`hud-chip ally ${activeSide === 'player' ? 'active' : ''}`} title="Tu Lord">
        <strong>👑</strong> {playerLordHp}/{lordMaxHp}
        <em>Res. {reservePlayerCount}</em>
      </span>
      <span className={`hud-chip turn ${overtime ? 'overtime' : ''}`} title="Ronda: un turno tuyo + uno del rival">
        <strong>{overtime ? '⚡' : '⏳'}</strong> {round}/{roundClock}
        <em>{overtime ? 'MUERTE SUBITA' : activeSide === 'player' ? 'Player' : 'Enemy'}</em>
      </span>
      <span className={`hud-chip enemy ${activeSide === 'enemy' ? 'active' : ''}`} title="Lord rival">
        <strong>👑</strong> {enemyLordHp}/{lordMaxHp}
        <em>Res. {reserveEnemyCount}</em>
      </span>
    </div>
  )
}