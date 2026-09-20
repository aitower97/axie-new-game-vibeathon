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
    label: 'Essence',
    desc: 'Session currency for healing, researching and recruiting. Earned by collecting in this demo; the real model decides its origin.',
  },
  {
    key: 'axp',
    icon: '✨',
    label: 'AXP',
    desc: 'Roster experience. Demo abstraction: the real system is off-chain AXP and on-chain levels at 10/20/30 with a signature.',
  },
]

export default function ResourcesScreen({ meta, collect }) {
  const [gained, setGained] = useState(0)
  return (
    <MetaScreen
      icon="⚖"
      title="Resources"
      blurb="Every match feeds the meta loop. This screen is the first-approach skeleton of the session economy (no on-chain connection)."
    >
      <div className="meta-grid">
        {CURRENCIES.map((c) => (
          <div key={c.key} className="meta-panel">
            <div className="meta-panel-title">
              <span aria-hidden="true">{c.icon}</span> {c.label}
            </div>
            <div className="meta-big-number">
              {meta[c.key]}
              <div className="meta-big-cap">this session</div>
            </div>
            <div className="meta-panel-actions">
              <StatChip label="GAINED +" value={gained} />
              <button
                type="button"
                className="ghost meta-action"
                onClick={() => {
                  collect(c.key)
                  setGained((g) => g + 1)
                }}
              >
                Collect 1
              </button>
            </div>
            <p className="meta-note">{c.desc}</p>
          </div>
        ))}
      </div>
      <div className="meta-panel">
        <div className="meta-panel-title">Where the revenue comes from</div>
        <ul className="meta-list">
          <li>Troops are destroyed permanently: every loss is a real resource sink, not a paper cost.</li>
          <li>The Lord is only wounded and healed: the collectible asset is protected so the player invests in it.</li>
          <li>The minting subscription (items are in-game by default, minting costs a fee) is the proposed recurring revenue.</li>
          <li>Golden rule: the game only pays out what actually comes in. No new token.</li>
        </ul>
      </div>
    </MetaScreen>
  )
}