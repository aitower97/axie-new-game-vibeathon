// Roster.jsx — columna de un bando: titulo + carta del Lord + escuadra de
// cartas de unidad + panel de detalle compartido. Resuelve internamente los
// valores por `side` para que los dos call sites en App.jsx sean simetricos.
//
// El hover de que unidad mostrar en el panel de detalle (cartas compactas +
// detalle desplegable al pasar el cursor o al seleccionar) es estado
// puramente de UI, sin efecto en la partida -por eso
// vive aqui como useState local, no en App.jsx (que solo guarda estado de
// partida). Selected SI viene de App.jsx (afecta a la partida) y actua como
// resultado por defecto cuando no hay hover activo.
import { memo, useState } from 'react'
import LordCard from './LordCard'
import UnitCard from './UnitCard'
import UnitDetailPanel from './UnitDetailPanel'
import { diceTumbling } from '../diceTurn'

function Roster({
  side,
  title,
  titleClassName,
  units,
  rolls,
  rolling,
  activeSide,
  enemyTurn,
  rollTick,
  selected,
  status,
  playerLordHp,
  enemyLordHp,
  reservePlayerCount,
  reserveEnemyCount,
  lordRoll,
  lordActed,
  onSelectUnit,
  onSelectLord,
}) {
  const sideUnits = units.filter((u) => u.side === side)
  const [detailId, setDetailId] = useState(null)
  const detailUnit = sideUnits.find((u) => u.id === detailId) || sideUnits.find((u) => u.id === selected) || null
  const rollingHere = diceTumbling(rolling, activeSide, enemyTurn, side)

  return (
    <div className={`roster-col ${side === 'player' ? 'player-col' : 'enemy-col'}`}>
      <div className={`roster-title ${titleClassName}`}>{title}</div>
      <LordCard
        side={side}
        hp={side === 'player' ? playerLordHp : enemyLordHp}
        reserveCount={side === 'player' ? reservePlayerCount : reserveEnemyCount}
        rolled={lordRoll[side]}
        acted={lordActed[side]}
        isActive={side === activeSide}
        rollTick={rollTick}
        selected={selected}
        status={status}
        rolling={rollingHere}
        enemyTurn={enemyTurn}
        onSelect={onSelectLord}
      />
      <div className="roster-squad">
        {sideUnits.map((u) => (
          <UnitCard
            key={u.id}
            unit={u}
            rolledFace={rolls[u.id]}
            rolling={rolling}
            activeSide={activeSide}
            enemyTurn={enemyTurn}
            rollTick={rollTick}
            selected={selected === u.id || detailId === u.id ? u.id : selected}
            status={status}
            onSelect={() => {
              setDetailId(u.id)
              onSelectUnit(u)
            }}
            onCardClick={() => {
              setDetailId(u.id)
            }}
          />
        ))}
      </div>
      <UnitDetailPanel unit={detailUnit} rolledFace={detailUnit ? rolls[detailUnit.id] : null} rollTick={rollTick} />
    </div>
  )
}

// El tablero actualiza `hoverCell` en cada cambio de casilla. Ese estado no
// pertenece al roster: las cards y sus canvas 3D no deben volver a renderizar
// por mover el raton sobre el tablero.
export default memo(Roster, (prev, next) => (
  prev.side === next.side &&
  prev.title === next.title &&
  prev.titleClassName === next.titleClassName &&
  prev.units === next.units &&
  prev.rolls === next.rolls &&
  prev.rolling === next.rolling &&
  prev.activeSide === next.activeSide &&
  prev.enemyTurn === next.enemyTurn &&
  prev.rollTick === next.rollTick &&
  prev.selected === next.selected &&
  prev.status === next.status &&
  prev.playerLordHp === next.playerLordHp &&
  prev.enemyLordHp === next.enemyLordHp &&
  prev.reservePlayerCount === next.reservePlayerCount &&
  prev.reserveEnemyCount === next.reserveEnemyCount &&
  prev.lordRoll === next.lordRoll &&
  prev.lordActed === next.lordActed
))
