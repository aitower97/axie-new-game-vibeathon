// VictoryBanner.jsx — banner de victoria/derrota flotando SOBRE el tablero
// (position:fixed centrado, no consume altura del layout). El fondo es
// interactivo detras (la partida ya termino), el
// banner y su boton si reciben clics.
export default function VictoryBanner({ status, onReset }) {
  if (status === 'playing') return null
  return (
    <div className="victory-overlay" role="alert">
      <div className={`banner ${status === 'player-won' ? 'won' : 'lost'}`}>
        {status === 'player-won' ? 'Player gana el asedio.' : 'Enemy gana el asedio.'}
        <button onClick={onReset}>Reiniciar partida</button>
      </div>
    </div>
  )
}