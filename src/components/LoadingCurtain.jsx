// LoadingCurtain.jsx — cortina de carga (T4): el tablero 3D tarda un instante
// en montarse (cargan los bloques GLB del terreno y los axies con el mixer).
// Mientras tanto, una cortina con marca de agua cubre la pantalla para que no
// se vea la escena a medio construir.
export default function LoadingCurtain({ visible }) {
  if (!visible) return null
  return (
    <div className="loading-curtain">
      <div className="loading-die">
        {['eyes', 'ears', 'horn', 'mouth', 'back', 'tail'].map((slot, i) => (
          <span key={slot} className="loading-die-cell" style={{ '--i': i }} />
        ))}
      </div>
      <p className="loading-title">Axie</p>
      <p className="loading-sub">Tactic Dice · forging the die and the board…</p>
    </div>
  )
}
