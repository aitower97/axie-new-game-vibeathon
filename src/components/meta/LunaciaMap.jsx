// LunaciaMap.jsx — mapa navegable del PVE (estilo NFS Carbon): un mundo con
// REGIONS como nodos conectados (lineas en SVG); al elegir una region se abre
// su lista de ZONES, cada una con su boton Jugar que arranca esa partida
// (nodeConfig -> startMatch en App.jsx). El desbloqueo es progresivo: la
// primera region se juega desde el principe; la siguiente se habilita al
// ganar cualquier zona de la anterior (meta.wins['pve-<region>']).
import { useState } from 'react'
import MetaScreen, { StatChip } from './MetaScreen'
import { REGIONS, nodeConfig } from '../../gameMissions'

export default function LunaciaMap({ wins, onPlay, onPlayFree }) {
  const [activeId, setActiveId] = useState(REGIONS[0].id)
  const region = REGIONS.find((r) => r.id === activeId)
  const isDone = (rid) => (wins[`pve-${rid}`] || 0) > 0
  const isOpen = (idx) => idx === 0 || isDone(REGIONS[idx - 1].id)

  const links = REGIONS.slice(0, -1).map((r, i) => [r, REGIONS[i + 1]])

  return (
    <MetaScreen
      icon="🤖"
      title="PVE: Mapa de Lunacia"
      blurb="Recorre Lunacia de punta a punta: cada region esconde escaramuzas contra starters y axies salvajes. Gana una zona para abrir la siguiente region; cada victoria regala esencia."
    >
      <div className="map-scene">
        <svg className="map-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {links.map(([a, b]) => (
            <line key={`${a.id}-${b.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="map-link" />
          ))}
        </svg>
        {REGIONS.map((r, idx) => {
          const open = isOpen(idx)
          const done = isDone(r.id)
          return (
            <button
              key={r.id}
              type="button"
              className={`map-node ${r.id === activeId ? 'active' : ''} ${done ? 'done' : ''}`}
              style={{ left: `${r.x}%`, top: `${r.y}%`, '--node': r.color }}
              disabled={!open}
              onClick={() => setActiveId(r.id)}
              title={open ? `${r.name} — ${done ? 'despejada' : 'por despejar'}` : 'Gana la region anterior para abrirla'}
            >
              <span className="map-node-dot" />
              <span className="map-node-name">{r.name}</span>
              {done && <span className="map-node-check">✓</span>}
            </button>
          )
        })}
      </div>

      {region && (
        <div className="map-region-panel" style={{ '--acc': region.color }}>
          <div className="map-region-head">
            <div className="map-region-title">{region.name}</div>
            <div className="map-region-actions">
              <span className="map-region-difficulty">
                {isDone(region.id) ? 'Despejada' : REGIONS.indexOf(region) === 0 ? 'Zona inicial' : 'Abierta'}
              </span>
              <button type="button" className="ghost meta-action" onClick={onPlayFree}>
                Partida libre ⚔
              </button>
            </div>
          </div>
          <div className="map-zone-list">
            {region.zones.map((z) => {
              const cfg = nodeConfig(region.id, z.id)
              const won = (wins[cfg.winKey || cfg.zone] || 0) > 0
              return (
                <div key={z.id} className="map-zone">
                  <div className="map-zone-info">
                    <div className="map-zone-name">{z.name}</div>
                    <div className="map-zone-blurb">{z.blurb}</div>
                    <div className="map-zone-chips">
                      <StatChip label="RECOMPENSA" value={`${cfg.reward} esencia`} />
                      <StatChip label="HP RIVAL" value={cfg.hpScale === 1 ? 'normal' : `×${cfg.hpScale.toFixed(2)}`} />
                      <StatChip label="RIVAL" value={cfg.starterEnemy ? 'starters' : 'salvajes'} />
                    </div>
                  </div>
                  <button type="button" className="ghost meta-action map-zone-play" onClick={() => onPlay(cfg)}>
                    {won ? 'Repetir ✓' : 'Jugar'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </MetaScreen>
  )
}