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
  { route: 'pve', Icon: MapIcon, title: 'PVE · Map of Lunacia', text: 'Regions, nodes and essence per win.', accent: '#3fa9e0' },
  { route: 'pvp', Icon: TrophyIcon, title: 'PVP · Arenas', text: 'Duels against regular community Axies.', accent: '#e0544f' },
  { route: 'evolucion', Icon: FlaskIcon, title: 'Lab', text: 'Evolve parts and lock die faces.', accent: '#e3a857' },
  { route: 'investigacion', Icon: SearchIcon, title: 'Research', text: 'Genome details and upgrades.', accent: '#7fe7c4' },
  { route: 'recursos', Icon: ScaleIcon, title: 'Resources', text: "The post's session economy.", accent: '#c9a86a' },
]

export default function BaseScreen({ units, playerLordHp, essence, augments, onHealLord, navigate, onPlay }) {
  const squad = units.filter((u) => u.side === 'player' && u.alive)
  const dead = units.filter((u) => u.side === 'player' && !u.alive)
  const evolvedCount = Object.values(augments).reduce((n, a) => n + Object.keys((a && a.evolved) || {}).length, 0)
  return (
    <MetaScreen
      icon="🏰"
      title="Command post"
      blurb="The Lord is the only Axie that survives between matches: the troops are destroyed permanently (asymmetric sink). The center is your team; the sides, the world."
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
              <b>Free match</b>
              <em>The classic MVP1 skirmish, as is.</em>
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
                <b>LORD</b> · Command post
              </div>
              <HpBar hp={Math.max(playerLordHp, 0)} maxHp={LORD_STATS.hp} showValue />
              <div className="meta-lord-stats">
                <StatChip label="RNG" value={LORD_STATS.range} title="Attack range" />
                <StatChip label="ATK" value={LORD_STATS.atk} title="Damage of the Lord Attack" />
                <StatChip label="HP" value={`${Math.max(playerLordHp, 0)}/${LORD_STATS.hp}`} />
              </div>
              <button
                type="button"
                className="ghost meta-action"
                disabled={essence < HEAL_COST || playerLordHp >= LORD_STATS.hp}
                onClick={onHealLord}
                title={essence < HEAL_COST ? `You need ${HEAL_COST} essence` : `Heals ${HEAL_AMOUNT} HP`}
              >
                Heal Lord +{HEAL_AMOUNT} ({HEAL_COST} essence)
              </button>
            </div>
          </div>

          <div className="meta-panel hub3-squad">
            <div className="meta-panel-title">
              Squad on guard
              <span className="hub3-essence">
                🪙 {essence} essence · {evolvedCount} evolved part{evolvedCount === 1 ? '' : 's'}
              </span>
            </div>
            {squad.length === 0 && <p className="meta-note">No Axies left standing.</p>}
            {squad.map((u) => (
              <MetaUnitRow key={u.id} u={u} />
            ))}
            {dead.length > 0 && (
              <p className="meta-note">
                {dead.length} fallen, permanently lost.
                Recruiting replacements is a future screen.
              </p>
            )}
          </div>
        </div>

        <div className="hub3-rail hub3-rail-right">
          <div className="hub3-note">
            <b>Golden rule</b>
            <p>Locking parts does not buy power: it buys certainty about which face comes up on the roll. Evolving
            buys real power, one part at a time.</p>
          </div>
          <div className="hub3-note">
            <b>Rewards</b>
            <p>Every win on the map (PVE) or in an arena (PVP) gives the zone's essence; map regions
            unlock by winning the previous one.</p>
          </div>
          <div className="hub3-note">
            <b>Before playing</b>
            <p>Stop by the Lab: pick your faces, lock what is left over and let the die work for you.</p>
          </div>
        </div>
      </div>
    </MetaScreen>
  )
}