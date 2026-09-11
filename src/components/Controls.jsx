// Controls.jsx — botonera de turno: tirar dados, pasar turno, reiniciar.
// `busy` congela la botonera mientras la secuencia animada del rival (enemyTurnRunning
// en App.jsx) esta en marcha, para que no se pueda interrumpir a mitad.
export default function Controls({ status, rolled, rolling, busy, activeSide, onRoll, onPass, onReset }) {
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
    </div>
  )
}
