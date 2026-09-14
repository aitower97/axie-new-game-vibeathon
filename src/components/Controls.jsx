// Controls.jsx — botonera de turno: tirar dados, pasar turno, reiniciar.
// `busy` congela la botonera mientras la secuencia animada del rival (enemyTurnRunning
// en App.jsx) esta en marcha, para que no se pueda interrumpir a mitad.
// `timer`: cronometro del turno PVP (35 s). Solo se muestra en las
// arenas mientras es el turno del jugador; al agotarse App.jsx tira por ti y
// pasa el turno sin mover/atacar.
export default function Controls({ status, rolled, rolling, busy, activeSide, timer, onRoll, onPass, onReset }) {
  const danger = timer != null && timer <= 5
  return (
    <div className="controls">
      <button onClick={onRoll} disabled={status !== 'playing' || rolled || rolling || busy}>
        {rolling ? 'Lanzando dados…' : busy ? 'Turno rival…' : `Tirar dados (${activeSide === 'player' ? 'Player' : 'Enemy'})`}
      </button>
      <button onClick={onPass} disabled={status !== 'playing' || rolling || busy}>
        {busy ? 'Resolviendo turno rival…' : 'Pasar turno'}
      </button>
      <button className="ghost" onClick={onReset}>
        Reiniciar partida
      </button>
      {timer != null && (
        <span className={`turn-timer ${danger ? 'danger' : ''}`} title="Tic-tac PVP: al llegar a 0 se tiran los dados y se pasa el turno.">
          ⏱ {timer}s
        </span>
      )}
    </div>
  )
}
