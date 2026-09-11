// VictoryBanner.jsx — banner de victoria/derrota, solo visible cuando la
// partida ya no esta en curso.
export default function VictoryBanner({ status, onReset }) {
  if (status === 'playing') return null
  return (
    <div className={`banner ${status === 'player-won' ? 'won' : 'lost'}`}>
      {status === 'player-won' ? 'Player gana el asedio.' : 'Enemy gana el asedio.'}
      <button onClick={onReset}>Reiniciar partida</button>
    </div>
  )
}
