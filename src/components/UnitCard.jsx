// UnitCard.jsx — carta COMPACTA de unidad en el dashboard: retrato 3D,
// stats, HP y el cubo del dado (Die3D). El detalle en texto de
// las 6 ranuras YA NO vive aqui -se despliega en UnitDetailPanel.jsx, un
// panel compartido debajo de las 3 cartas del bando, al pasar el cursor o al
// seleccionar la unidad (ver Roster.jsx, que gestiona ese hover).
import Portrait3D from '../Portrait3D'
import Die3D from '../Die3D'
import { AXIE_SAMPLE_GENES } from '../Board3D'
import { ROSTER_DESCRIPTORS } from '../axieGeneCatalog'
import { CLASS_STATS, DIE_SLOTS } from '../axie'
import { diceTumbling } from '../diceTurn'
import { HpBar, ShieldBar, ClassEmblem } from './Emblems'
import FaceRow from './FaceRow'

export default function UnitCard({ unit: u, rolledFace, rolling, activeSide, enemyTurn, rollTick, selected, status, onSelect, onMouseEnter, onMouseLeave }) {
  const stats = CLASS_STATS[u.klass]
  // `rolling` es un unico flag global (vale para todo el turno, no por
  // bando), pero solo el bando activo tira dados ahora mismo. Con la
  // excepcion de la secuencia animada del rival
  // (enemyTurn), donde es el rival quien tira y sus dados deben barajarse.
  // Caido: el dado ya no se baraja (bug: los dados de los muertos se giraban
  // cada turno del bando aunque rollDice los excluye; la animacion se guiaba
  // solo por el lado y el flag global de tirada).
  const isRollingNow = u.alive && diceTumbling(rolling, activeSide, enemyTurn, u.side)
  return (
    <div
      className={`card mini ${!u.alive ? 'down' : ''} ${selected === u.id ? 'selected' : ''} ${u.marked ? 'marked' : ''} ${u.buffed ? 'buffed' : ''}`}
      style={{ '--card-accent': stats.color }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="card-head">
        <Portrait3D
          className="axie-sprite"
          size={30}
          descriptor={ROSTER_DESCRIPTORS[u.side]?.[u.klass]}
          genes={AXIE_SAMPLE_GENES}
        />
        <div className="card-title">
          <div className="card-id-line">
            <span className="card-insignia" style={{ color: stats.color }}>
              <ClassEmblem klass={u.klass} />
            </span>
            <strong title={stats.label}>#{u.id.toUpperCase()}</strong>
            {u.name && (
              <span className="starter-name" title="Official Axie starter">
                {u.name}
              </span>
            )}
          </div>
          <span className="class-line">
            {stats.label}
            <span className="class-stats">
              <b
                className="stat-ico"
                title={`Movement: ${stats.move} step${stats.move > 1 ? 's' : ''}`}
              >
                <span className="flat-emoji">👣</span> {stats.move}
              </b>
              <b
                className="stat-ico"
                title={
                  stats.range > 1
                    ? `Range: ${stats.range} tiles at a distance`
                    : 'Range: melee (1 tile)'
                }
              >
                <span className="flat-emoji">{stats.range > 1 ? '🏹' : '🤜'}</span> {stats.range}
              </b>
            </span>
          </span>
        </div>
      </div>
      <div className="card-vitals">
        <HpBar hp={Math.max(u.hp, 0)} maxHp={u.maxHp} showValue />
        {u.shield > 0 && <ShieldBar value={u.shield} />}
      </div>

      {/* Solo el cubo (Die3D): el detalle en texto de sus 6 ranuras vive
          ahora en UnitDetailPanel.jsx, compartido por las 3 cartas del
          bando. */}
      <div className="die-unit mini-die-unit compact">
        <Die3D
          klass={u.klass}
          slots={DIE_SLOTS.map((slot) => ({ slot }))}
          rolling={isRollingNow}
          rollTick={rollTick}
          rolledSlot={rolledFace ? rolledFace.slot : null}
          size={64}
        />
      </div>

      {/* Pie de la carta, ya en flujo normal (no absoluto, se superponia con
          el cubo). La cara tirada se muestra como FaceRow -la misma fila
          visual que el panel de detalle de abajo, pero solo la que ha
          tocado-, no como texto suelto. */}
      {u.alive && ((rolledFace) || (u.side === activeSide && !u.acted && status === 'playing')) && (
        <div className="card-foot">
          {rolledFace && (
            <div className="card-foot-face">
              <FaceRow slot={rolledFace.slot} face={rolledFace} active />
              {u.acted && <span className="done">Already acted</span>}
            </div>
          )}
          {u.side === activeSide && !u.acted && rolledFace && status === 'playing' && (
            <button className="small" onClick={onSelect}>
              {selected === u.id ? 'Deselect' : 'Select'}
            </button>
          )}
        </div>
      )}
      {!u.alive && <div className="hint">Fallen. Lost for good.</div>}
    </div>
  )
}
