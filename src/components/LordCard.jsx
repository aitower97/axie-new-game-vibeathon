// LordCard.jsx — carta del Lord (paso 8, seccion 4.2): no es un Axie de
// partes, asi que su dado NO es el cubo de ranuras de cuerpo sino su propio
// dado de 6 caras (LORD_DIE): 1 ataque + 4 habilidades de apoyo
// (Muro/Marca/Cura/Templanza) + Duplicar, la UNICA que mete una unidad nueva
// en el tablero. Sin ninguna mencion a "torre": el Lord no se llama asi en
// ningun sitio.
import Portrait3D from '../Portrait3D'
import LordDie3D from '../LordDie3D'
import { AXIE_SAMPLE_GENES } from '../Board3D'
import { LORD_DESCRIPTORS } from '../axieGeneCatalog'
import { LORD_DIE, LORD_STATS } from '../axie'
import { LORD_GLYPH } from '../gameConstants'
import { HpBar, CrownEmblem } from './Emblems'

// Color dorado del Lord, deliberadamente distinto del naranja de Beast
// (#f0a04b) y del --amber de seleccion/HUD (#e3a857): un dorado llamativo
// que se diferencia del de Beast, no el mismo tono.
const LORD_ACCENT = '#ffc233'

function lordFaceTip(face) {
  switch (face.effect) {
    case 'lord-attack':
      return <span>Lord Attack: {LORD_STATS.atk} damage at range {LORD_STATS.range}.</span>
    case 'lord-shield':
      return <span>Wall: gives {face.value} shield to an allied unit within range {face.range}.</span>
    case 'lord-mark':
      return (
        <span>
          Mark: an enemy within range {face.range} is marked - the next attack that hits it
          (from any attacker) deals +{face.value}. Consumed on the first hit.
        </span>
      )
    case 'lord-heal':
      return <span>Heal: {face.value} HP to an allied unit within range {face.range}.</span>
    case 'lord-buff':
      return (
        <span>
          Temperance: blesses an allied unit within range {face.range} - its next attack deals
          +{face.value}. Consumed on striking.
        </span>
      )
    case 'lord-clone':
      return (
        <>
          <span>
            Duplicate: clones a living allied unit within range {face.range} (appears at full HP
            next to the Lord, not adjacent to the original).
          </span>
          <em className="tip-affinity">
            ★ Or tap a free tile next to the Lord to bring someone out of reserve instead of
            cloning - it is the only face that puts a new unit on the board.
          </em>
        </>
      )
    default:
      return null
  }
}

export default function LordCard({
  side,
  hp,
  reserveCount,
  rolled,
  acted,
  isActive,
  rollTick,
  selected,
  status,
  rolling,
  enemyTurn,
  onSelect,
}) {
  return (
    <div
      className={`card lord-card ${selected === 'lord' && isActive ? 'selected' : ''}`}
      style={{ '--card-accent': LORD_ACCENT }}
    >
      <div className="card-head">
        <div className="lord-portrait-wrap">
          <Portrait3D
            className="axie-sprite"
            size={56}
            descriptor={LORD_DESCRIPTORS[side]}
            genes={AXIE_SAMPLE_GENES}
          />
          <span className="lord-crown-badge" title="Command Lord">
            <CrownEmblem />
          </span>
        </div>
        <div className="card-title">
          <div className="card-id-line">
            <strong title="Command Lord">LORD</strong>
          </div>
          <span className="class-line">
            Command post · Reserve {reserveCount}
            <span className="class-stats">
              <b className="stat-ico" title="Range: 2 tiles at a distance">
                <span className="flat-emoji">🏹</span> {LORD_STATS.range}
              </b>
              <b className="stat-ico" title="Lord Attack: 30 damage">
                <span className="flat-emoji">⚔</span> {LORD_STATS.atk}
              </b>
            </span>
          </span>
        </div>
      </div>
      <div className="card-vitals">
        <HpBar hp={Math.max(hp, 0)} maxHp={LORD_STATS.hp} showValue />
      </div>

      <div className="die-unit lord-die-unit">
        <div className="lord-die-3d-wrap" title={rolled ? `Rolled ${rolled.name}` : 'Lord command die'}>
          <LordDie3D
            rolling={rolling}
            rollTick={rollTick}
            rolledEffect={rolled ? rolled.effect : null}
            size={78}
          />
        </div>
        <div className="die-list lord-die-list">
          {LORD_DIE.map((face, idx) => {
            const active = rolled && rolled.id === face.id
            return (
              <div
                key={active ? `${face.id}-${rollTick}` : face.id}
                style={{ '--i': idx }}
                className={`face-card ${active ? 'active' : ''}`}
              >
                <span className="face-glyph lord-face-glyph">{LORD_GLYPH[face.effect]}</span>
                <div className="face-info">
                  <span className="face-part">{face.name}</span>
                </div>
                <div className="part-tip">
                  <b>{face.name}</b>
                  {lordFaceTip(face)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {(hp > 0 && (rolled || (isActive && status === 'playing'))) && (
        <div className="card-foot">
          {rolled && (
            <div className="roll-result">
              Rolled <b>{rolled.name}</b>
              {acted && <span className="done"> · already acted</span>}
            </div>
          )}
          {!acted && isActive && rolled && status === 'playing' && !rolling && !enemyTurn && (
            <button className="small" onClick={onSelect}>
              {selected === 'lord' ? 'Deselect' : 'Select'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
