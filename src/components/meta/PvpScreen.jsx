// PvpScreen.jsx — pantalla meta "PVP" (first-approach): el hueco detectado en
// el mercado (ningun tactico de rejilla con dados en Ronin) y un esqueleto de
// liga. Solo hay Interfaz y un "Emparejar" que reinicia la partida en vivo
// como maqueta de combate clasificado; no hay MV (emparejamiento/seguimiento
// real) hasta la vision de producto.
import { useState } from 'react'
import MetaScreen, { StatChip } from './MetaScreen'

const LADDER = [
  { rank: 1, name: 'AlephPioneer', score: 1284 },
  { rank: 2, name: 'KronosVet', score: 1201 },
  { rank: 3, name: 'LunaxMaster', score: 1156 },
  { rank: 4, name: 'VidaPlayer', score: 1103 },
  { rank: 5, name: 'RoninGhost', score: 1048 },
]

export default function PvpScreen({ onPlay }) {
  const [pairing, setPairing] = useState(false)
  return (
    <MetaScreen
      icon="🏆"
      title="PVP: Liga"
      blurb="El hueco confirmado: no hay ningun tactico de rejilla con dados en Ronin. Esqueleto first-approach: el 'Emparejar' lanza la partida en vivo como maqueta de combate clasificado; el ELO real y el tracker son vision de producto."
    >
      <div className="meta-grid">
        <div className="meta-panel">
          <div className="meta-panel-title">Tablon de la liga</div>
          <table className="meta-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Lunaciano</th>
                <th>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {LADDER.map((l) => (
                <tr key={l.rank}>
                  <td>{l.rank}</td>
                  <td>{l.name}</td>
                  <td>{l.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="meta-panel">
          <div className="meta-panel-title">Emparejamiento</div>
          <div className="meta-big-number">
            {pairing ? '…' : 'Listo'}
            <div className="meta-big-cap">{pairing ? 'buscando rival' : 'sala abierta'}</div>
          </div>
          <div className="meta-panel-actions">
            <StatChip label="STATUS" value="maqueta local" />
            <button
              type="button"
              className="ghost meta-action"
              disabled={pairing}
              onClick={() => {
                setPairing(true)
                setTimeout(() => {
                  setPairing(false)
                  onPlay()
                }, 600)
              }}
            >
              {pairing ? 'Buscando…' : 'Emparejar'}
            </button>
          </div>
          <p className="meta-note">
            La partida contra la IA local ocupa el lugar del oponente clasificado mientras no hay
            red de emparejamiento real.
          </p>
        </div>
      </div>
    </MetaScreen>
  )
}