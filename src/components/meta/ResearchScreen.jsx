// ResearchScreen.jsx — pantalla meta "Investigacion" (first-approach): la
// promesa de Axie Core. Cada Axie es sus seis partes; ascender NO sube un
// numero, evoluciona UNA parte y reescribe ESA cara del dado. Aqui se muestran
// las 4 ranuras de combate de cada unidad viva con su cara actual y un nodo de
// mejora payable en Esencia (funcional en sesion: guarda el nivel en
// meta.upgrades y muestra el +5 aplicado). El coste real y el rediseno de la
// cara al evolucionar se implementan cuando exista el modelo de datos de
// progresion.
import MetaScreen, { StatChip } from './MetaScreen'
import { CLASS_STATS, SLOT_LABEL_MVP1, faceValue } from '../../axie'

const UPGRADE_COST = 2
const UPGRADE_BONUS = 5

export default function ResearchScreen({ units, meta, invest }) {
  const squad = units.filter((u) => u.side === 'player' && u.alive)
  return (
    <MetaScreen
      icon="🔬"
      title="Investigacion"
      blurb="El dado de cada Axie esta hecho de sus seis partes. Evolucionar una parte reescribe esa cara del dado: la genoma es inseparable de la mecanica."
    >
      <div className="meta-panel meta-panel-muted">
        <StatChip label="ESENCIA" value={meta.essence} />
        <StatChip label="COSTE MEJORA" value={UPGRADE_COST} />
        <StatChip label="BONUS POR NIVEL" value={`+${UPGRADE_BONUS}`} />
      </div>
      {squad.map((u) => {
        const stats = CLASS_STATS[u.klass]
        return (
          <div key={u.id} className="meta-panel">
            <div className="meta-panel-title">
              <span className="meta-unit-emb" style={{ color: stats.color }}>
                #{u.id.toUpperCase()}
              </span>{' '}
              {stats.label}
            </div>
            <div className="meta-research-grid">
              {u.die.map((face) => {
                const key = `${u.id}:${face.slot}`
                const level = meta.upgrades[key] || 0
                const next = faceValue(face) + (level + 1) * UPGRADE_BONUS
                return (
                  <div key={key} className={`meta-node ${level > 0 ? 'upgraded' : ''}`}>
                    <div className="meta-node-head">
                      <b>{SLOT_LABEL_MVP1[face.slot]}</b>
                      <span className="meta-node-level">
                        {level > 0 ? `Nv ${level + 1}` : 'Nv 1'}
                      </span>
                    </div>
                    <div className="meta-node-face">{face.name}</div>
                    <div className="meta-node-value">
                      {faceValue(face)} ‣ {level > 0 ? next : `${next} (+${UPGRADE_BONUS})`}
                    </div>
                    <button
                      type="button"
                      className="ghost meta-action"
                      disabled={meta.essence < UPGRADE_COST}
                      onClick={() => invest(key)}
                    >
                      Mejorar ({UPGRADE_COST})
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      <p className="meta-note">
        First-approach: la mejora solo pinta el nivel y el +5 en esta pantalla; el rediseno real de
        la cara (reescribir el valor y la descripcion de ESA ranura en el dado) es el modelo de
        datos de progresion que aterriza en la siguiente fase.
      </p>
    </MetaScreen>
  )
}