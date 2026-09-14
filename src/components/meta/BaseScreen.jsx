// BaseScreen.jsx — pantalla "Base": el HUB del juego, equipo principal en el
// centro y los menus/pantallas en los laterales, como los juegos de Axie. El
// centro muestra el Lord (Portrait3D compartido con el tablero) y la
// escuadra viva con sus mejoras de sesion;
// los laterales son los accesos a PVE/PVP/Laboratorio y a la partida libre.
import MetaScreen, { MetaUnitRow, StatChip } from './MetaScreen'
import Portrait3D from '../../Portrait3D'
import { AXIE_SAMPLE_GENES } from '../../Board3D'
import { LORD_DESCRIPTORS } from '../../axieGeneCatalog'
import { LORD_STATS } from '../../axie'
import { HpBar } from '../Emblems'
import { MapIcon, TrophyIcon, FlaskIcon, SearchIcon, ScaleIcon, SwordIcon } from '../LineIcons'

const HEAL_COST = 1
const HEAL_AMOUNT = 30

// Iconos de trazo fino (retoque tras feedback: "los emojis en colores los
// evitaria, los haria con lineas finas y con un color acorde") -ver
// LineIcons.jsx, cada uno hereda el acento de su tarjeta via `color`.
const NAV = [
  { route: 'pve', Icon: MapIcon, title: 'PVE · Mapa de Lunacia', text: 'Regiones, nodos y esencia por victoria.', accent: '#3fa9e0' },
  { route: 'pvp', Icon: TrophyIcon, title: 'PVP · Arenas', text: 'Duelos contra axies normales de la comunidad.', accent: '#e0544f' },
  { route: 'evolucion', Icon: FlaskIcon, title: 'Laboratorio', text: 'Evoluciona partes y bloquea caras del dado.', accent: '#e3a857' },
  { route: 'investigacion', Icon: SearchIcon, title: 'Investigacion', text: 'El detalle del genoma y las mejoras.', accent: '#7fe7c4' },
  { route: 'recursos', Icon: ScaleIcon, title: 'Recursos', text: 'La economia de sesion del puesto.', accent: '#c9a86a' },
]

export default function BaseScreen({ units, playerLordHp, essence, augments, onHealLord, navigate, onPlay }) {
  const squad = units.filter((u) => u.side === 'player' && u.alive)
  const dead = units.filter((u) => u.side === 'player' && !u.alive)
  const evolvedCount = Object.values(augments).reduce((n, a) => n + Object.keys((a && a.evolved) || {}).length, 0)
  return (
    <MetaScreen
      icon="🏰"
      title="Puesto de mando"
      blurb="El Lord es el unico axie que sobrevive entre partidas: la tropa se destruye de forma permanente (sumidero asimetrico). El centro es tu equipo; los laterales, el mundo."
    >
      <div className="hub3">
        <div className="hub3-rail">
          {NAV.map((n) => (
            <button
              key={n.route}
              type="button"
              className="hub3-card"
              style={{ '--card-accent': n.accent }}
              onClick={() => navigate(n.route)}
            >
              <span className="hub3-card-icon" aria-hidden="true">
                <n.Icon size={17} />
              </span>
              <span className="hub3-card-text">
                <b>{n.title}</b>
                <em>{n.text}</em>
              </span>
            </button>
          ))}
          <button type="button" className="hub3-card hub3-play" style={{ '--card-accent': '#5cc23a' }} onClick={() => onPlay()}>
            <span className="hub3-card-icon" aria-hidden="true">
              <SwordIcon size={17} />
            </span>
            <span className="hub3-card-text">
              <b>Partida libre</b>
              <em>La escaramuza clasica del MVP1, tal cual.</em>
            </span>
          </button>
        </div>

        <div className="hub3-center">
          <div className="meta-panel meta-lord-panel">
            <div className="meta-lord-portrait">
              <Portrait3D className="axie-sprite" size={96} descriptor={LORD_DESCRIPTORS.player} genes={AXIE_SAMPLE_GENES} />
            </div>
            <div className="meta-lord-info">
              <div className="meta-lord-title">
                <b>LORD</b> · Puesto de mando
              </div>
              <HpBar hp={Math.max(playerLordHp, 0)} maxHp={LORD_STATS.hp} showValue />
              <div className="meta-lord-stats">
                <StatChip label="RNG" value={LORD_STATS.range} title="Alcance del ataque" />
                <StatChip label="ATK" value={LORD_STATS.atk} title="Dano del Ataque del Lord" />
                <StatChip label="HP" value={`${Math.max(playerLordHp, 0)}/${LORD_STATS.hp}`} />
              </div>
              <button
                type="button"
                className="ghost meta-action"
                disabled={essence < HEAL_COST || playerLordHp >= LORD_STATS.hp}
                onClick={onHealLord}
                title={essence < HEAL_COST ? `Necesitas ${HEAL_COST} de esencia` : `Cura ${HEAL_AMOUNT} de vida`}
              >
                Curar Lord +{HEAL_AMOUNT} ({HEAL_COST} esencia)
              </button>
            </div>
          </div>

          <div className="meta-panel hub3-squad">
            <div className="meta-panel-title">
              Escuadra en guardia
              <span className="hub3-essence">
                🪙 {essence} esencia · {evolvedCount} parte{evolvedCount === 1 ? '' : 's'} evolucionada
                {evolvedCount === 1 ? '' : 's'}
              </span>
            </div>
            {squad.length === 0 && <p className="meta-note">No quedan axies en pie.</p>}
            {squad.map((u) => (
              <MetaUnitRow key={u.id} u={u} />
            ))}
            {dead.length > 0 && (
              <p className="meta-note">
                {dead.length} caido{dead.length > 1 ? 's' : ''} perdido{dead.length > 1 ? 's' : ''} de forma permanente.
                Reclutar reemplazos es una pantalla futura.
              </p>
            )}
          </div>
        </div>

        <div className="hub3-rail hub3-rail-right">
          <div className="hub3-note">
            <b>Regla de oro</b>
            <p>Bloquear partes no compra poder: compra certidumbre sobre que cara sale en la tirada. Evolucionar
            compra poder de verdad, una parte cada vez.</p>
          </div>
          <div className="hub3-note">
            <b>Recompensas</b>
            <p>Cada victoria en el mapa (PVE) o arena (PVP) da la esencia de la zona; las regiones del mapa se
            desbloquean ganando la anterior.</p>
          </div>
          <div className="hub3-note">
            <b>Antes de jugar</b>
            <p>Pasa por el Laboratorio: elige tus caras, bloquea lo que sobra y deja que el dado trabaje para ti.</p>
          </div>
        </div>
      </div>
    </MetaScreen>
  )
}