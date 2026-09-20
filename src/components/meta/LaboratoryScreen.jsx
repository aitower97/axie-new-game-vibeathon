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
      title="Parts Lab"
      blurb="Each Axie's dice is made of its six parts. Here you forge yours: EVOLVE rewrites a dice face (+10, irreversible, 1 essence) and LOCK takes that part out of the roll so the faces you use come up more often. Both apply when you press Play."
    >
      <div className="meta-panel meta-panel-muted lab-hud">
        <StatChip label="ESSENCE" value={essence} />
        <StatChip label="EVOLVE COST" value={EVOLVE_COST} />
        <StatChip label="LOCK" value="free" title="Locking/unlocking a part costs no essence" />
        <button type="button" className="ghost meta-action" onClick={onPlay} title="Close the lab and play a free match">
          Try in combat ⚔
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
                  Roll: {live.length}/{die.length} faces · each one ≈ {chance}%
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
                              ? 'Already evolved (irreversible)'
                              : `Rewrite the face (${face.name}) with +${EVOLVE_COST}0 · ${EVOLVE_COST} essence`
                          }
                        >
                          Evolve
                        </button>
                        <button
                          type="button"
                          className={`ghost meta-action ${isBlocked ? 'is-blocked' : ''}`}
                          disabled={isEvolved}
                          onClick={() => onToggleBlock(klass, face.slot)}
                          title={
                            isEvolved
                              ? 'Evolved parts cannot be locked'
                              : isBlocked
                                ? 'Put it back into the roll'
                                : 'Take it out of the roll: raises the odds of the others'
                          }
                        >
                          {isBlocked ? 'Unlock' : 'Lock'}
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
        Unlocking always costs 0 essence; evolving costs {EVOLVE_COST} and is forever. An Axie with ALL
        its parts evolved is its best version: no face gets locked, all hit for +10.
      </p>
    </MetaScreen>
  )
}