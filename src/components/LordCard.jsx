// LordCard.jsx — carta del Lord (paso 8, seccion 4.2, rediseñado 2026-09-10
// dos veces): no es un Axie de partes, asi que su dado NO es el cubo de
// ranuras de cuerpo sino su propio dado de 6 caras (LORD_DIE): 1 ataque + 4
// habilidades de apoyo (Muro/Marca/Cura/Templanza) + Duplicar, la UNICA
// que mete una unidad nueva en el tablero. Sin ninguna mencion a "torre"
// -pedido explicito del usuario, el Lord ya no se llama asi en ningun sitio.
import Portrait3D from '../Portrait3D'
import LordDie3D from '../LordDie3D'
import { AXIE_SAMPLE_GENES } from '../Board3D'
import { LORD_DESCRIPTORS } from '../axieGeneCatalog'
import { LORD_DIE, LORD_STATS } from '../axie'
import { LORD_GLYPH } from '../gameConstants'
import { HpBar, CrownEmblem } from './Emblems'

// Color dorado del Lord, deliberadamente distinto del naranja de Beast
// (#f0a04b) y del --amber de seleccion/HUD (#e3a857) -pedido explicito del
// usuario: "meterle un color dorado llamativo que se diferencia del color
// del beast que son iguales".
const LORD_ACCENT = '#ffc233'

function lordFaceTip(face) {
  switch (face.effect) {
    case 'lord-attack':
      return <span>Ataque del Lord: {LORD_STATS.atk} de dano a alcance {LORD_STATS.range}.</span>
    case 'lord-shield':
      return <span>Muro: da {face.value} de escudo a un aliado propio a alcance {face.range}.</span>
    case 'lord-mark':
      return (
        <span>
          Marca: un enemigo a alcance {face.range} queda marcado -el proximo ataque que le impacte
          (de cualquier atacante) hace +{face.value}. Se consume al primer golpe.
        </span>
      )
    case 'lord-heal':
      return <span>Cura: {face.value} de vida a un aliado propio a alcance {face.range}.</span>
    case 'lord-buff':
      return (
        <span>
          Templanza: bendice a un aliado propio a alcance {face.range} -su proximo ataque hace
          +{face.value}. Se consume al golpear.
        </span>
      )
    case 'lord-clone':
      return (
        <>
          <span>
            Duplicar: clona a un aliado propio vivo a alcance {face.range} (sale a vida llena
            junto al Lord, no adyacente al original).
          </span>
          <em className="tip-affinity">
            ★ O toca una casilla libre junto al Lord para sacar a alguien de la reserva en vez de
            clonar -es la unica cara que mete una unidad nueva en el tablero.
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
          <span className="lord-crown-badge" title="Lord del mando">
            <CrownEmblem />
          </span>
        </div>
        <div className="card-title">
          <div className="card-id-line">
            <strong title="Lord del mando">LORD</strong>
          </div>
          <span className="class-line">
            Puesto de mando · Reserva {reserveCount}
            <span className="class-stats">
              <b className="stat-ico" title="Alcance: 2 casillas a distancia">
                <span className="flat-emoji">🏹</span> {LORD_STATS.range}
              </b>
              <b className="stat-ico" title="Ataque del Lord: 30 de dano">
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
        <div className="lord-die-3d-wrap" title={rolled ? `Ha salido ${rolled.name}` : 'Dado de mando del Lord'}>
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
              Sale <b>{rolled.name}</b>
              {acted && <span className="done"> · ya ha actuado</span>}
            </div>
          )}
          {!acted && isActive && rolled && status === 'playing' && !rolling && !enemyTurn && (
            <button className="small" onClick={onSelect}>
              {selected === 'lord' ? 'Deseleccionar' : 'Seleccionar'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
