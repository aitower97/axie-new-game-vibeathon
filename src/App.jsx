import { useState } from 'react'
import './App.css'
import AxieSprite from './AxieSprite'
import LunaciaBackdrop from './LunaciaBackdrop'
import { CLASS_STATS, LORD_STATS, buildGenome, dominantClass } from './axie'

// MVP1vinculodelunacia.md, pasos 1-3 del orden de construccion:
//   1. Tablero 8x6, colocacion de Lord y 3 moviles, turnos alternos.
//   2. Movimiento por chasis + zona de control.
//   3. Ataque basico, vida, muerte, victoria por Lord a 0.
// Sin dados todavia (paso 5) ni IA (paso 10): los dos bandos se juegan a mano
// (hotseat) para poder probar cada regla por separado antes de automatizar al rival.
const ROWS = 6
const COLS = 8
const PLAYER_LORD = { r: 2, c: 0 }
const ENEMY_LORD = { r: 2, c: COLS - 1 }
const TURN_CLOCK = 12

// Los Lords son Axies misticos de verdad (renderizados con el mixer); las tres clases
// moviles todavia no tienen partes propias (llegan en el paso 5), asi que se ven como
// fichas de chasis por ahora: color de clase + HP, sin sprite.
const PLAYER_LORD_GENOME = buildGenome(['papi', 'lotus', 'cactus', 'axie-kiss', 'timber', 'shrimp'])
const ENEMY_LORD_GENOME = buildGenome(['chubby', 'nut-cracker', 'imp', 'goda', 'balloon', 'ant'])

const STARTING_CLASSES = ['plant', 'beast', 'bird']

function makeUnit(side, klass, id, pos) {
  const stats = CLASS_STATS[klass]
  return { id, side, klass, hp: stats.hp, maxHp: stats.hp, pos, alive: true, acted: false }
}

function initialUnits() {
  const player = STARTING_CLASSES.map((klass, i) => makeUnit('player', klass, `p${i}`, { r: i + 1, c: 1 }))
  const enemy = STARTING_CLASSES.map((klass, i) => makeUnit('enemy', klass, `e${i}`, { r: i + 1, c: COLS - 2 }))
  return [...player, ...enemy]
}

function dist(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c)
}

function adjacent(a, b) {
  return dist(a, b) === 1
}

// Casillas alcanzables por movimiento respetando la zona de control: al entrar en una
// casilla adyacente a un enemigo vivo, esa rama del recorrido se para ahi (regla 6).
function reachableCells(unit, units, lords) {
  const stats = CLASS_STATS[unit.klass]
  const occupied = (r, c) => {
    if ((r === lords.player.r && c === lords.player.c) || (r === lords.enemy.r && c === lords.enemy.c)) return true
    return units.some((u) => u.alive && u.pos && u.pos.r === r && u.pos.c === c)
  }
  const enemyAdjacentTo = (r, c) => {
    const enemyLord = unit.side === 'player' ? lords.enemy : lords.player
    if (adjacent({ r, c }, enemyLord)) return true
    return units.some((u) => u.alive && u.side !== unit.side && u.pos && adjacent({ r, c }, u.pos))
  }
  const visited = new Map()
  const key = (r, c) => `${r},${c}`
  visited.set(key(unit.pos.r, unit.pos.c), 0)
  const queue = [{ r: unit.pos.r, c: unit.pos.c, cost: 0, stopped: false }]
  const out = []
  while (queue.length) {
    const cur = queue.shift()
    if (cur.stopped) continue
    const deltas = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]
    for (const [dr, dc] of deltas) {
      const nr = cur.r + dr
      const nc = cur.c + dc
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
      if (occupied(nr, nc)) continue
      const cost = cur.cost + 1
      if (cost > stats.move) continue
      const k = key(nr, nc)
      if (visited.has(k) && visited.get(k) <= cost) continue
      visited.set(k, cost)
      const stopped = enemyAdjacentTo(nr, nc)
      out.push({ r: nr, c: nc })
      queue.push({ r: nr, c: nc, cost, stopped })
    }
  }
  return out
}

function attackTargets(unit, units, lords) {
  const stats = CLASS_STATS[unit.klass]
  const targets = []
  const enemyLord = unit.side === 'player' ? lords.enemy : lords.player
  if (dist(unit.pos, enemyLord) <= stats.range) targets.push({ kind: 'lord', pos: enemyLord })
  units
    .filter((u) => u.alive && u.side !== unit.side && u.pos && dist(unit.pos, u.pos) <= stats.range)
    .forEach((u) => targets.push({ kind: 'unit', id: u.id, pos: u.pos }))
  return targets
}

export default function App() {
  const [units, setUnits] = useState(initialUnits)
  const [playerLordHp, setPlayerLordHp] = useState(LORD_STATS.hp)
  const [enemyLordHp, setEnemyLordHp] = useState(LORD_STATS.hp)
  const [activeSide, setActiveSide] = useState('player')
  const [turnCount, setTurnCount] = useState(1)
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('playing')
  const [log, setLog] = useState(['Empieza el asedio. Le toca a Player.'])

  const lords = { player: PLAYER_LORD, enemy: ENEMY_LORD }
  const pushLog = (line) => setLog((l) => [line, ...l].slice(0, 7))

  const selectedUnit = selected ? units.find((u) => u.id === selected) : null
  const moveCells = selectedUnit ? reachableCells(selectedUnit, units, lords) : []
  const targets = selectedUnit ? attackTargets(selectedUnit, units, lords) : []

  function selectUnit(u) {
    if (status !== 'playing' || u.side !== activeSide || u.acted) return
    setSelected(u.id === selected ? null : u.id)
  }

  function moveTo(r, c) {
    if (!selectedUnit) return
    if (!moveCells.some((cell) => cell.r === r && cell.c === c)) return
    setUnits((us) => us.map((u) => (u.id === selectedUnit.id ? { ...u, pos: { r, c }, acted: true } : u)))
    pushLog(`${labelOf(selectedUnit)} se mueve.`)
    setSelected(null)
  }

  function attack(target) {
    if (!selectedUnit) return
    const dmg = CLASS_STATS[selectedUnit.klass].atk
    if (target.kind === 'lord') {
      // attackTargets solo devuelve el Lord contrario, nunca el propio.
      const attackingPlayerLord = selectedUnit.side === 'enemy'
      const setHp = attackingPlayerLord ? setPlayerLordHp : setEnemyLordHp
      const current = attackingPlayerLord ? playerLordHp : enemyLordHp
      const next = Math.max(0, current - dmg)
      setHp(next)
      pushLog(`${labelOf(selectedUnit)} golpea al Lord rival (-${dmg}).`)
      if (next <= 0) setStatus(attackingPlayerLord ? 'enemy-won' : 'player-won')
    } else {
      setUnits((us) =>
        us.map((u) => {
          if (u.id !== target.id) return u
          const nextHp = Math.max(0, u.hp - dmg)
          return { ...u, hp: nextHp, alive: nextHp > 0, pos: nextHp > 0 ? u.pos : null }
        })
      )
      const victim = units.find((u) => u.id === target.id)
      const killed = victim.hp - dmg <= 0
      pushLog(
        `${labelOf(selectedUnit)} ataca a ${labelOf(victim)} (-${dmg}).` + (killed ? ` ${labelOf(victim)} cae.` : '')
      )
    }
    setUnits((us) => us.map((u) => (u.id === selectedUnit.id ? { ...u, acted: true } : u)))
    setSelected(null)
  }

  function cellClick(r, c) {
    if (status !== 'playing') return
    if (selectedUnit) {
      const target = targets.find((t) => t.pos.r === r && t.pos.c === c)
      if (target) {
        attack(target)
        return
      }
      if (r === selectedUnit.pos.r && c === selectedUnit.pos.c) {
        setSelected(null)
        return
      }
      const otherOwn = units.find(
        (u) => u.alive && u.side === activeSide && u.pos && u.pos.r === r && u.pos.c === c && !u.acted
      )
      if (otherOwn) {
        setSelected(otherOwn.id)
        return
      }
      moveTo(r, c)
      return
    }
    const own = units.find((u) => u.alive && u.side === activeSide && u.pos && u.pos.r === r && u.pos.c === c)
    if (own) selectUnit(own)
  }

  function passTurn() {
    const nextSide = activeSide === 'player' ? 'enemy' : 'player'
    const nextTurn = turnCount + 1
    setUnits((us) => us.map((u) => (u.side === nextSide ? { ...u, acted: false } : u)))
    setActiveSide(nextSide)
    setSelected(null)
    pushLog(`Turno ${nextTurn}. Le toca a ${nextSide === 'player' ? 'Player' : 'Enemy'}.`)
    if (nextTurn > TURN_CLOCK) {
      const playerPct = playerLordHp / LORD_STATS.hp
      const enemyPct = enemyLordHp / LORD_STATS.hp
      // Regla 5: empate exacto lo gana el defensor (aqui, Enemy).
      setStatus(playerPct > enemyPct ? 'player-won' : 'enemy-won')
      pushLog('Se acaba el reloj de 12 turnos.')
      return
    }
    setTurnCount(nextTurn)
  }

  function labelOf(u) {
    return `${CLASS_STATS[u.klass].label} ${u.side === 'player' ? 'propio' : 'rival'}`
  }

  return (
    <div className="app">
      <LunaciaBackdrop />
      <header>
        <h1>Vinculo de Lunacia</h1>
        <p className="subtitle">MVP1: asedio a una torre. Lord fijo + 3 Axies moviles por bando.</p>
      </header>

      <div className="hud">
        <div className="lord">Tu Lord: {playerLordHp}/{LORD_STATS.hp}</div>
        <div className="turn">Turno {Math.min(turnCount, TURN_CLOCK)}/{TURN_CLOCK} · {activeSide === 'player' ? 'Player' : 'Enemy'}</div>
        <div className="lord">Lord rival: {enemyLordHp}/{LORD_STATS.hp}</div>
      </div>

      {status !== 'playing' && (
        <div className={`banner ${status === 'player-won' ? 'won' : 'lost'}`}>
          {status === 'player-won' ? 'Player gana el asedio.' : 'Enemy gana el asedio.'}
        </div>
      )}

      {selectedUnit && (
        <div className="action-bar">
          <b>{labelOf(selectedUnit)}</b> seleccionado · movimiento {CLASS_STATS[selectedUnit.klass].move} · alcance{' '}
          {CLASS_STATS[selectedUnit.klass].range} · ataque {CLASS_STATS[selectedUnit.klass].atk}
        </div>
      )}

      <div className="board" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {Array.from({ length: ROWS }).map((_, r) =>
          Array.from({ length: COLS }).map((_, c) => {
            const isPLord = r === PLAYER_LORD.r && c === PLAYER_LORD.c
            const isELord = r === ENEMY_LORD.r && c === ENEMY_LORD.c
            const unit = units.find((u) => u.alive && u.pos && u.pos.r === r && u.pos.c === c)
            const canMoveHere = moveCells.some((cell) => cell.r === r && cell.c === c)
            const canAttackHere = targets.some((t) => t.pos.r === r && t.pos.c === c)
            const isSelected = unit && selected === unit.id
            return (
              <div
                key={`${r}-${c}`}
                data-r={r}
                data-c={c}
                className={[
                  'cell',
                  'terrain-grass',
                  canMoveHere ? 'summon-zone' : '',
                  canAttackHere ? 'in-range' : '',
                  isSelected ? 'selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => cellClick(r, c)}
              >
                {isPLord && (
                  <div className="lord-unit own-lord">
                    <AxieSprite genome={PLAYER_LORD_GENOME} dominantClass={dominantClass(PLAYER_LORD_GENOME)} size={52} />
                    <small>{playerLordHp}</small>
                  </div>
                )}
                {isELord && (
                  <div className="lord-unit enemy-lord">
                    <AxieSprite genome={ENEMY_LORD_GENOME} dominantClass={dominantClass(ENEMY_LORD_GENOME)} size={52} />
                    <small>{enemyLordHp}</small>
                  </div>
                )}
                {unit && (
                  <div
                    className={`unit ${unit.side === 'player' ? 'own' : 'enemy'} ${unit.acted ? 'spent' : ''}`}
                    style={{ borderColor: CLASS_STATS[unit.klass].color, background: `${CLASS_STATS[unit.klass].color}30` }}
                  >
                    <span>{CLASS_STATS[unit.klass].label[0]}</span>
                    <small>{unit.hp}</small>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <section className="roster">
        {units.map((u) => {
          const stats = CLASS_STATS[u.klass]
          return (
            <div
              key={u.id}
              className={`card ${!u.alive ? 'down' : ''} ${selected === u.id ? 'selected' : ''}`}
              style={{ borderColor: stats.color }}
            >
              <div className="card-head">
                <div className="card-title">
                  <strong>
                    {stats.label} ({stats.role}) · {u.side === 'player' ? 'Player' : 'Enemy'}
                  </strong>
                  <span className="klass" style={{ background: stats.color }}>
                    {u.side}
                  </span>
                </div>
              </div>
              <div className="stat-row">
                <span>HP {Math.max(u.hp, 0)}/{u.maxHp}</span>
                <span>Mov {stats.move}</span>
                <span>Alc {stats.range}</span>
                <span>Atq {stats.atk}</span>
              </div>
              {u.alive && u.side === activeSide && !u.acted && status === 'playing' && (
                <button className="small" onClick={() => selectUnit(u)}>
                  {selected === u.id ? 'Deseleccionar' : 'Seleccionar'}
                </button>
              )}
              {!u.alive && <div className="hint">Caida. Perdida definitiva.</div>}
              {u.alive && u.acted && <div className="done">Ya ha actuado</div>}
            </div>
          )
        })}
      </section>

      <div className="controls">
        <button onClick={passTurn} disabled={status !== 'playing'}>
          Pasar turno ({activeSide === 'player' ? 'Player' : 'Enemy'})
        </button>
      </div>

      <section className="log">
        {log.map((l, i) => (
          <div key={i} className="log-line">
            {l}
          </div>
        ))}
      </section>
    </div>
  )
}
