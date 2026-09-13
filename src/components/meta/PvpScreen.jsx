// PvpScreen.jsx — pantalla meta "PVP": arenas del hueco detectado en el
// mercado (ningun tactico de rejilla con dados en Ronin). Cada arena lleva su
// rival con NOMBRE PROPIO (axies NORMALES de la comunidad, nunca starters:
// starterEnemy=false, sin insignia en el roster) y su config de partida
// (arenaConfig -> startMatch). El ELO/emparejamiento real es vision de
// producto; "Emparejar" de la sala abierta lanza una partida libre.
import { useState } from 'react'
import MetaScreen, { StatChip } from './MetaScreen'
import { PVP_ARENAS, arenaConfig } from '../../gameMissions'

export default function PvpScreen({ onPlay, onPlayFree }) {
  const [pairing, setPairing] = useState(false)
  return (
    <MetaScreen
      icon="🏆"
      title="PVP: Arenas"
      blurb="Duelos locales contra axies normales con nombre, no contra starters. Gana esencia por cada arena; el 'Emparejar' lanza una partida libre como maqueta de combate clasificado mientras no hay liga online."
    >
      <div className="meta-grid">
        <div className="arena-list" style={{ gridColumn: '1 / -1' }}>
          {PVP_ARENAS.map((a) => {
            const cfg = arenaConfig(a.id)
            return (
              <div key={a.id} className="arena-card">
                <div className="arena-card-head">
                  <span className="arena-card-name">{a.name}</span>
                  <span className="arena-card-rival">vs {a.rival}</span>
                </div>
                <p className="meta-note">{a.blurb}</p>
                <div className="meta-panel-actions">
                  <StatChip label="RECOMPENSA" value={`${cfg.reward} esencia`} />
                  <StatChip label="HP RIVAL" value={cfg.hpScale === 1 ? 'normal' : `×${cfg.hpScale.toFixed(2)}`} />
                  <StatChip label="EQUIPO" value={cfg.enemyClasses.map((k) => k.slice(0, 3)).join('/')} />
                  <button type="button" className="ghost meta-action" onClick={() => onPlay(cfg)}>
                    Desafiar
                  </button>
                </div>
              </div>
            )
          })}
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
                  onPlayFree()
                }, 600)
              }}
            >
              {pairing ? 'Buscando…' : 'Emparejar'}
            </button>
          </div>
          <p className="meta-note">
            La partida contra la IA local ocupa el lugar del oponente clasificado mientras no hay red de
            emparejamiento real.
          </p>
        </div>
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
              {[
                { rank: 1, name: 'AlephPioneer', score: 1284 },
                { rank: 2, name: 'KronosVet', score: 1201 },
                { rank: 3, name: 'LunaxMaster', score: 1156 },
              ].map((l) => (
                <tr key={l.rank}>
                  <td>{l.rank}</td>
                  <td>{l.name}</td>
                  <td>{l.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="meta-note">Posiciones de ejemplo; el tracker real es vision de producto.</p>
        </div>
      </div>
    </MetaScreen>
  )
}