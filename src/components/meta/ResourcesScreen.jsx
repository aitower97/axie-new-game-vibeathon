// ResourcesScreen.jsx — pantalla meta "Recursos" (first-approach): el molino
// economico de sesion. Dos monedas: Esencia (recurso del meta-estado de sesion,
// se gana al jugar/vender) y AXP (la abstraccion del documento: el modelo REAL
// de Axie es 10/20/30 con firma on-chain, ver CLAUDE.md/decision-de-producto).
// Ambas solo viven en React state: puro esqueleto interactivo para iterar.
import { useState } from 'react'
import MetaScreen, { StatChip } from './MetaScreen'

const CURRENCIES = [
  {
    key: 'essence',
    icon: '🫙',
    label: 'Esencia',
    desc: 'Moneda de sesion para curar, investigar y reclutar. Se gana coleccionando en esta demo; el modelo real decide su origen.',
  },
  {
    key: 'axp',
    icon: '✨',
    label: 'AXP',
    desc: 'Experiencia del roster. Abstraccion de la demo: el sistema real es AXP off-chain y niveles on-chain en 10/20/30 con firma.',
  },
]

export default function ResourcesScreen({ meta, collect }) {
  const [gained, setGained] = useState(0)
  return (
    <MetaScreen
      icon="⚖"
      title="Recursos"
      blurb="Cada partida alimenta el ciclo de meta. Esta pantalla es el esqueleto first-approach de la economia de sesion (sin conexion on-chain)."
    >
      <div className="meta-grid">
        {CURRENCIES.map((c) => (
          <div key={c.key} className="meta-panel">
            <div className="meta-panel-title">
              <span aria-hidden="true">{c.icon}</span> {c.label}
            </div>
            <div className="meta-big-number">
              {meta[c.key]}
              <div className="meta-big-cap">en sesion</div>
            </div>
            <div className="meta-panel-actions">
              <StatChip label="GANADO +" value={gained} />
              <button
                type="button"
                className="ghost meta-action"
                onClick={() => {
                  collect(c.key)
                  setGained((g) => g + 1)
                }}
              >
                Recolectar 1
              </button>
            </div>
            <p className="meta-note">{c.desc}</p>
          </div>
        ))}
      </div>
      <div className="meta-panel">
        <div className="meta-panel-title">De donde sale la renta</div>
        <ul className="meta-list">
          <li>La tropa se destruye de forma permanente: cada baja es un sumidero real de recursos, no un coste de papel.</li>
          <li>El Lord solo se hiere y se cura: el activo coleccionable se protege para que el jugador invierta en el.</li>
          <li>La suscripcion por acunado (objetos de juego por defecto, acunar cuesta cuota) es el ingreso recurrente propuesto.</li>
          <li>Regla de oro: el juego solo paga lo que realmente ingresa. Nada de token nuevo.</li>
        </ul>
      </div>
    </MetaScreen>
  )
}