// EnergyGauge.jsx — medidor de la banca de Energia (A3) en la esquina del
// tablero: un anillo de progreso SVG (no un numero suelto en un chip) que se
// llena hasta el tope ENERGY_CAP.
//
// Como funciona (A3, docs/design/combate-dinamico-dado.md seccion 6.4):
//   - La Energia sale de TU tirada: cada cara sin golpe que asientas
//     (guardia/reposicion/utilidad, ver yieldsEnergy) mete +1 en la banca.
//   - La banca PERSISTE toda la partida: ya NO se vacia al cambiar de turno
//     ni se recalcula de golpe. Tope de capacidad ENERGY_CAP = 5.
//   - Con 2 de Energia puedes gastarla en una de dos cosas, justo antes de
//     usarla (se activa en el ActionPad del Axie seleccionado):
//       * "+10 al golpe": el proximo ataque de esa unidad hace +10 (boostArmed).
//       * "+1 casilla": el presupuesto de movimiento de esa unidad crece en 1
//         para este movimiento (moveBoostArmed, se cobra al completar el moverlo).
// Este componente es SOLO presentacion: los gastos y la generacion los decide
// App.jsx (rollDice/attack/moveTo/passTurn).
//
// `side`/`label`: con dos medidores en pantalla a la vez, el del rival
// necesita distinguirse a simple vista -mismo tratamiento que el resto de la
// UI del bando enemigo (rojo/rosa, `.energy-enemy` en App.css) y un titulo
// propio en vez de "Energia" a secas. El del jugador tambien pierde los
// gastos armables (2E: +10 golpe...): la IA no gasta Energia todavia (A3
// solo cubre al jugador), asi que en el medidor del rival esas dos lineas no
// aplicarian y se sustituyen por una nota aclaratoria.
export default function EnergyGauge({ bank, cap, side = 'player', label }) {
  const R = 26
  const C = 2 * Math.PI * R
  const pct = Math.max(0, Math.min(1, bank / cap))
  const cls = bank >= 2 ? 'ready' : bank > 0 ? 'some' : 'empty'
  const isEnemy = side === 'enemy'
  return (
    <div className={`energy-gauge energy-${cls} ${isEnemy ? 'energy-enemy' : ''}`}>
      <div className="energy-ring-wrap">
        <svg viewBox="0 0 64 64" className="energy-ring" aria-hidden="true">
          <circle className="energy-ring-track" cx="32" cy="32" r={R} />
          <circle
            className="energy-ring-arc"
            cx="32"
            cy="32"
            r={R}
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
          />
        </svg>
        <span className="energy-ring-num">{bank}</span>
      </div>
      <div className="energy-gauge-info">
        <span className="energy-gauge-title">{label ?? 'Energy'} {bank}/{cap}</span>
        {isEnemy ? (
          <span className="energy-gauge-tip">What the enemy gathers from its rolls</span>
        ) : (
          <>
            <span className="energy-gauge-costs">2E: +10 hit · 2E: +1 tile</span>
            <span className="energy-gauge-tip">{bank >= 2 ? 'Ready to spend' : 'Non-strike rolls = +1 (persists)'}</span>
          </>
        )}
      </div>
    </div>
  )
}