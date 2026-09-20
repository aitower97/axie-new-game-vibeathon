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
      blurb="Local duels against named regular Axies, not starters. Earn essence for each arena; 'Matchmake' launches a free match as a mock-up of ranked combat until there is an online league."
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
                  <StatChip label="REWARD" value={`${cfg.reward} essence`} />
                  <StatChip label="ENEMY HP" value={cfg.hpScale === 1 ? 'normal' : `×${cfg.hpScale.toFixed(2)}`} />
                  <StatChip label="TEAM" value={cfg.enemyClasses.map((k) => k.slice(0, 3)).join('/')} />
                  <button type="button" className="ghost meta-action" onClick={() => onPlay(cfg)}>
                    Challenge
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <div className="meta-panel">
          <div className="meta-panel-title">Matchmaking</div>
          <div className="meta-big-number">
            {pairing ? '…' : 'Ready'}
            <div className="meta-big-cap">{pairing ? 'looking for a rival' : 'room open'}</div>
          </div>
          <div className="meta-panel-actions">
            <StatChip label="STATUS" value="local mock-up" />
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
              {pairing ? 'Searching…' : 'Matchmake'}
            </button>
          </div>
          <p className="meta-note">
            The match against the local AI stands in for the ranked opponent until there is a real
            matchmaking network.
          </p>
        </div>
        <div className="meta-panel">
          <div className="meta-panel-title">League board</div>
          <table className="meta-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Lunacian</th>
                <th>Points</th>
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
          <p className="meta-note">Sample rankings; the real tracker is product vision.</p>
        </div>
      </div>
    </MetaScreen>
  )
}