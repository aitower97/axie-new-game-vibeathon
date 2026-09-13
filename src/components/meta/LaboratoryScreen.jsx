// LaboratoryScreen.jsx — pantalla del Laboratorio ("Evolucion", la promesa de
// Axie Core hecha mecanica): el dado de cada clase con sus 4 ranuras de combate
// (cuerno, boca, lomo, cola). Dos acciones reales, ambas persistentes en
// meta.augments y aplicadas por makeUnit en la proxima partida:
//  - EVOLUCIONAR (coste 1 esencia, irreversible): la parte de esa ranura queda
//    evolucionada y su cara del dado reescribe su valor (+10). La premisa del
//    juego: "ascender no sube un numero, evoluciona UNA parte y reescribe esa
//    cara del dado". Una parte evolucionada no puede bloquearse: queda SIEMPRE
//    en la tirada.
//  - BLOQUEAR/DESBLOQUEAR (gratis): la parte bloqueada sale del dado al tirar
//    (activeDie en App.jsx), asi las caras que te gustan suben su probabilidad
//    real. El dado nunca se queda vacio (respaldo de la primera cara).
// El objetivo del bloqueo es moldear la distribucion: el jugador no compra
// poder, compra certidumbre sobre que cara va a salir.
import { useState } from 'react'
import MetaScreen, { StatChip } from './MetaScreen'
import { CLASS_STATS, SLOT_LABEL_MVP1, standardDie, faceValue } from '../../axie'
import { EFFECT_GLYPH } from '../../gameConstants'
import { PartLogo } from '../Emblems'

const EVOLVE_COST = 1

export default function LaboratoryScreen({ essence, augments, onEvolve, onToggleBlock, onPlay }) {
  const [hover, setHover] = useState(null)
  const classes = Object.keys(CLASS_STATS).filter((k) => ['beast', 'bird', 'aqua'].includes(k))

  return (
    <MetaScreen
      icon="🔧"
      title="Laboratorio de partes"
      blurb="El dado de cada Axie esta hecho de sus seis partes. Aqui forjas el tuyo: EVOLUCIONAR recrea una cara del dado (+10, irreversible, 1 esencia) y BLOQUEAR saca esa parte de la tirada para que las caras que usas salgan mas veces. Ambas se aplican al pulsar Jugar."
    >
      <div className="meta-panel meta-panel-muted lab-hud">
        <StatChip label="ESENCIA" value={essence} />
        <StatChip label="COSTE EVOLUCION" value={EVOLVE_COST} />
        <StatChip label="BLOQUEO" value="gratis" title="Bloquear/desbloquear una parte no cuesta esencia" />
        <button type="button" className="ghost meta-action" onClick={onPlay} title="Cerrar el laboratorio y tirar una partida libre">
          Probar en combate ⚔
        </button>
      </div>

      <div className="lab-grid">
        {classes.map((klass) => {
          const stats = CLASS_STATS[klass]
          const aug = augments[klass] || {}
          const evolved = aug.evolved || {}
          const blocked = aug.blocked || {}
          const base = standardDie(klass)
          const die = base.map((f) => (evolved[f.slot] ? { ...f, evolved: true, value: f.value + 10 } : f))
          const live = die.filter((f) => !blocked[f.slot])
          const chance = live.length ? Math.round(100 / live.length) : 100
          return (
            <div key={klass} className="lab-class" style={{ '--acc': stats.color }}>
              <div className="lab-class-head">
                <span className="meta-unit-emb" style={{ color: stats.color }}>
                  {stats.label}
                </span>
                <span className="lab-die-odds">
                  Tirada: {live.length}/{die.length} caras · cada una ≈ {chance}%
                </span>
              </div>
              <div className="lab-die">
                {die.map((face) => {
                  const isEvolved = !!evolved[face.slot]
                  const isBlocked = !!blocked[face.slot]
                  const val = faceValue(face)
                  return (
                    <div
                      key={face.slot}
                      className={`lab-face ${isEvolved ? 'evolved' : ''} ${isBlocked ? 'blocked' : ''}`}
                      onMouseEnter={() => setHover(face)}
                      onMouseLeave={() => setHover(null)}
                    >
                      <div className="lab-face-logo">
                        <PartLogo slot={face.slot} />
                      </div>
                      <div className="lab-face-name">{face.name}</div>
                      <div className="lab-face-value">
                        <span className="face-glyph">{EFFECT_GLYPH[face.effect]}</span>
                        {val != null ? val : '—'}
                        {isEvolved && <em className="lab-evolved-badge">+10</em>}
                      </div>
                      <div className="lab-face-slot">{SLOT_LABEL_MVP1[face.slot]}</div>
                      <div className="lab-face-actions">
                        <button
                          type="button"
                          className="ghost meta-action"
                          disabled={isEvolved || essence < EVOLVE_COST}
                          onClick={() => onEvolve(klass, face.slot)}
                          title={
                            isEvolved
                              ? 'Ya evolucionada (irreversible)'
                              : `Reescribir la cara (${face.name}) con +${EVOLVE_COST}0 · ${EVOLVE_COST} esencia`
                          }
                        >
                          Evolucionar
                        </button>
                        <button
                          type="button"
                          className={`ghost meta-action ${isBlocked ? 'is-blocked' : ''}`}
                          disabled={isEvolved}
                          onClick={() => onToggleBlock(klass, face.slot)}
                          title={
                            isEvolved
                              ? 'Las partes evolucionadas no se pueden bloquear'
                              : isBlocked
                                ? 'Volver a meterla en la tirada'
                                : 'Sacarla de la tirada: sube la probabilidad de las demas'
                          }
                        >
                          {isBlocked ? 'Desbloquear' : 'Bloquear'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {hover && (
        <div className="lab-tooltip">
          <b>{hover.name} · {SLOT_LABEL_MVP1[hover.slot]}</b>
          <span>{hover.text}</span>
        </div>
      )}

      <p className="meta-note">
        Desbloquear siempre cuesta 0 esencia; evolucionar cuesta {EVOLVE_COST} y es para siempre. Un axie con TODAS
        sus partes evolucionadas es su mejor version: ninguna cara se bloquea, todas pegan +10.
      </p>
    </MetaScreen>
  )
}