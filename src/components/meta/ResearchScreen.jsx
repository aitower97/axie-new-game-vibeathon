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
      title="Research"
      blurb="Each Axie's dice is made of its six parts. Evolving a part rewrites that dice face: the genome is inseparable from the mechanics."
    >
      <div className="meta-panel meta-panel-muted">
        <StatChip label="ESSENCE" value={meta.essence} />
        <StatChip label="UPGRADE COST" value={UPGRADE_COST} />
        <StatChip label="BONUS PER LEVEL" value={`+${UPGRADE_BONUS}`} />
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
                        {level > 0 ? `Lv ${level + 1}` : 'Lv 1'}
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
                      Upgrade ({UPGRADE_COST})
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      <p className="meta-note">
        First-approach: the upgrade only paints the level and the +5 on this screen; the real redesign of
        the face (rewriting the value and description of THAT slot on the die) is the progression
        data model that lands in the next phase.
      </p>
    </MetaScreen>
  )
}