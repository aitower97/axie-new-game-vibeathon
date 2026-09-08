import { useState, useCallback } from 'react'
import './App.css'
import {
  SLOTS,
  SLOT_LABEL,
  CLASSES,
  FACE_INFO,
  buildGenome,
  makeDie,
  rollDie,
  dominantClass,
  ascend,
  moveRange,
  damageFrom,
} from './axie'

const ROWS = 5
const COLS = 7
const PLAYER_LORD = { r: 2, c: 0 }
const ENEMY_LORD = { r: 2, c: 6 }
const LORD_HP = 3
const AXP_PER_ASCENSION = 3

// Dos Axies con genomas deliberadamente opuestos:
// Ascua es agresiva (perforante + drenaje), Musgo es defensiva (guardia + alcance).
const STARTING_GENOMES = [
  {
    id: 'p1',
    name: 'Cria de Ascua',
    hp: 6,
    def: 1,
    parts: ['chubby', 'puppy', 'imp', 'goda', 'balloon', 'hare'],
  },
  {
    id: 'p2',
    name: 'Cria de Musgo',
    hp: 7,
    def: 2,
    parts: ['clear', 'nut-cracker', 'little-branch', 'serious', 'hermit', 'ant'],
  },
]

function makeCreature(spec) {
  const genome = buildGenome(spec.parts)
  return {
    id: spec.id,
    name: spec.name,
    genome,
    die: makeDie(genome),
    klass: dominantClass(genome),
    hp: spec.hp,
    maxHp: spec.hp,
    def: spec.def,
    shield: 0,
    axp: 0,
    ascLevel: 0,
    pos: null,
    alive: true,
  }
}

function adjacent(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1
}

function dist(a, r, c) {
  return Math.abs(a.r - r) + Math.abs(a.c - c)
}

export default function App() {
  const [roster, setRoster] = useState(() => STARTING_GENOMES.map(makeCreature))
  const [enemies, setEnemies] = useState([])
  const [playerLordHp, setPlayerLordHp] = useState(LORD_HP)
  const [enemyLordHp, setEnemyLordHp] = useState(LORD_HP)
  const [rolls, setRolls] = useState(null)
  const [acted, setActed] = useState({})
  const [selected, setSelected] = useState(null)
  const [log, setLog] = useState(['Tira los dados para empezar la ronda.'])
  const [turn, setTurn] = useState(1)
  const [status, setStatus] = useState('playing')
  const [ascensionToast, setAscensionToast] = useState(null)

  const pushLog = useCallback((line) => {
    setLog((l) => [line, ...l].slice(0, 7))
  }, [])

  function occupied(r, c) {
    if ((r === PLAYER_LORD.r && c === PLAYER_LORD.c) || (r === ENEMY_LORD.r && c === ENEMY_LORD.c)) return true
    if (roster.some((cr) => cr.alive && cr.pos && cr.pos.r === r && cr.pos.c === c)) return true
    if (enemies.some((e) => e.alive && e.pos.r === r && e.pos.c === c)) return true
    return false
  }

  // Se tira por TODAS las criaturas vivas, esten o no en el tablero.
  // Fuera del tablero solo actua la cara de invocacion; dentro, la cara dice
  // que puede hacer la criatura este turno.
  function rollDice() {
    const alive = roster.filter((c) => c.alive)
    const result = {}
    alive.forEach((c) => {
      result[c.id] = rollDie(c.die)
    })
    setRolls(result)

    // La guardia se aplica sola al tirar.
    const guarded = alive.filter((c) => c.pos && result[c.id].face === 'guard')
    if (guarded.length) {
      setRoster(
        roster.map((cr) =>
          guarded.some((g) => g.id === cr.id) ? { ...cr, shield: cr.shield + result[cr.id].power } : cr
        )
      )
    }

    const summonable = alive.filter((c) => !c.pos && result[c.id].face === 'summon')
    const lines = []
    alive.forEach((c) => {
      const f = result[c.id]
      lines.push(`${c.name}: ${SLOT_LABEL[f.slot]} (${f.partName}) - ${FACE_INFO[f.face].name}`)
    })
    pushLog(lines.join(' · '))
    if (summonable.length) {
      pushLog(`Puedes invocar a ${summonable.map((c) => c.name).join(' y ')}.`)
    }
  }

  const summonableIds = rolls
    ? roster.filter((c) => c.alive && !c.pos && rolls[c.id]?.face === 'summon' && !acted[c.id]).map((c) => c.id)
    : []

  function summon(creatureId, r, c) {
    if (occupied(r, c) || c > 1) return
    setRoster((rs) => rs.map((cr) => (cr.id === creatureId ? { ...cr, pos: { r, c } } : cr)))
    setActed((a) => ({ ...a, [creatureId]: true }))
    const cr = roster.find((x) => x.id === creatureId)
    pushLog(`${cr.name} entra al tablero.`)
  }

  // Puro: devuelve la criatura actualizada y, si toca, el aviso de Ascension.
  // La Ascension evoluciona la parte que se acaba de usar, no un numero.
  function withAxp(cr, amount, usedSlot) {
    const next = { ...cr, axp: cr.axp + amount }
    let toast = null
    if (next.axp >= AXP_PER_ASCENSION) {
      next.axp -= AXP_PER_ASCENSION
      const res = ascend(cr.genome, usedSlot)
      if (res.slot) {
        next.genome = res.genome
        next.die = makeDie(res.genome)
        next.ascLevel = cr.ascLevel + 1
        toast = `${cr.name} asciende: ${SLOT_LABEL[res.slot]} (${res.genome[res.slot].name}) evoluciona y su cara mejora.`
      }
    }
    return { creature: next, toast }
  }

  function attackEnemy(creature, enemy, rolled) {
    const dmg = damageFrom(rolled, enemy.def)
    const newHp = enemy.hp - dmg
    const killed = newHp <= 0
    const lines = [`${creature.name} usa ${FACE_INFO[rolled.face].name} sobre ${enemy.name} (-${dmg}).`]

    setEnemies(
      enemies.map((e) => (e.id === enemy.id ? (killed ? { ...e, alive: false } : { ...e, hp: newHp }) : e))
    )
    if (killed) lines.push(`${enemy.name} cae. ${creature.name} gana AXP.`)

    let toast = null
    setRoster(
      roster.map((cr) => {
        if (cr.id !== creature.id) return cr
        let base = cr
        if (rolled.face === 'drain') {
          base = { ...cr, hp: Math.min(cr.maxHp, cr.hp + 1) }
          lines.push(`${creature.name} drena 1 de vida.`)
        }
        const res = withAxp(base, killed ? 2 : 1, rolled.slot)
        toast = res.toast
        return res.creature
      })
    )
    if (toast) setAscensionToast(toast)
    setLog((l) => [...lines.reverse(), ...l].slice(0, 7))
    setActed((a) => ({ ...a, [creature.id]: true }))
    setSelected(null)
  }

  function moveOrAttack(creature, r, c) {
    const rolled = rolls?.[creature.id]
    if (!rolled || acted[creature.id]) return

    const d = dist(creature.pos, r, c)

    const enemyHere = enemies.find((e) => e.alive && e.pos.r === r && e.pos.c === c)
    if (enemyHere) {
      if (d !== 1) return
      if (rolled.face === 'summon') {
        pushLog(`${creature.name} no puede atacar con una cara de invocacion.`)
        return
      }
      attackEnemy(creature, enemyHere, rolled)
      return
    }

    if (r === ENEMY_LORD.r && c === ENEMY_LORD.c) {
      if (d !== 1 || rolled.face === 'summon') return
      const dmg = damageFrom(rolled, 0)
      const newHp = enemyLordHp - dmg
      setEnemyLordHp(newHp)
      pushLog(`${creature.name} golpea al Lord rival (-${dmg}).`)
      let toast = null
      setRoster(
        roster.map((cr) => {
          if (cr.id !== creature.id) return cr
          const res = withAxp(cr, 1, rolled.slot)
          toast = res.toast
          return res.creature
        })
      )
      if (toast) setAscensionToast(toast)
      setActed((a) => ({ ...a, [creature.id]: true }))
      if (newHp <= 0) setStatus('won')
      setSelected(null)
      return
    }

    if (d < 1 || d > moveRange(rolled.face)) return
    if (occupied(r, c)) return
    setRoster((rs) => rs.map((cr) => (cr.id === creature.id ? { ...cr, pos: { r, c } } : cr)))
    setActed((a) => ({ ...a, [creature.id]: true }))
    setSelected(null)
  }

  function cellClick(r, c) {
    if (status !== 'playing' || !rolls) return
    if (selected) {
      const creature = roster.find((cr) => cr.id === selected)
      // Volver a tocar la criatura seleccionada la deselecciona.
      if (creature && creature.pos && creature.pos.r === r && creature.pos.c === c) {
        setSelected(null)
        return
      }
      if (creature) moveOrAttack(creature, r, c)
      return
    }
    const own = roster.find((cr) => cr.alive && cr.pos && cr.pos.r === r && cr.pos.c === c)
    if (own && !acted[own.id]) {
      setSelected(own.id)
      return
    }
    if (c <= 1 && summonableIds.length > 0 && !occupied(r, c)) {
      summon(summonableIds[0], r, c)
    }
  }

  // El turno enemigo se calcula entero antes de tocar el estado. Nada de setters
  // dentro de otros setters: con StrictMode los updaters se invocan dos veces y el
  // dano se aplicaba por duplicado.
  function endTurn() {
    const nextRoster = roster.map((c) => ({ ...c }))
    const nextEnemies = enemies.map((e) => ({ ...e, pos: { ...e.pos } }))
    let lordHp = playerLordHp
    const lines = []

    const busy = (r, c) => {
      if ((r === PLAYER_LORD.r && c === PLAYER_LORD.c) || (r === ENEMY_LORD.r && c === ENEMY_LORD.c)) return true
      if (nextRoster.some((cr) => cr.alive && cr.pos && cr.pos.r === r && cr.pos.c === c)) return true
      if (nextEnemies.some((e) => e.alive && e.pos.r === r && e.pos.c === c)) return true
      return false
    }

    nextEnemies.forEach((e) => {
      if (!e.alive) return

      // Prioriza rematar a la criatura mas herida que tenga al lado.
      const reachable = nextRoster.filter((c) => c.alive && c.pos && adjacent(e.pos, c.pos))
      const target = reachable.sort((a, b) => a.hp - b.hp)[0]

      if (target) {
        const absorbed = Math.min(target.shield, e.atk)
        const dealt = Math.max(0, e.atk - absorbed - Math.floor(target.def / 2))
        target.shield -= absorbed
        target.hp -= dealt
        if (absorbed > 0) lines.push(`El escudo de ${target.name} absorbe ${absorbed}.`)
        lines.push(`${e.name} ataca a ${target.name} (-${dealt}).`)
        if (target.hp <= 0) {
          target.alive = false
          target.pos = null
          lines.push(`${target.name} cae y se pierde para siempre.`)
        }
        return
      }

      if (adjacent(e.pos, PLAYER_LORD)) {
        lordHp -= e.atk
        lines.push(`${e.name} golpea tu Lord (-${e.atk}).`)
        return
      }

      const nc = e.pos.c - 1
      if (nc >= 0 && !busy(e.pos.r, nc)) e.pos = { r: e.pos.r, c: nc }
    })

    if (turn % 3 === 0) {
      // La fila del Lord rival y las ocupadas no valen como punto de aparicion.
      const free = []
      for (let r = 0; r < ROWS; r++) {
        if (r === ENEMY_LORD.r) continue
        if (!busy(r, COLS - 1)) free.push(r)
      }
      if (free.length) {
        nextEnemies.push({
          id: `e${turn}-${Math.random().toString(36).slice(2, 6)}`,
          name: 'Axie salvaje',
          hp: 4,
          def: 0,
          atk: 1,
          pos: { r: free[Math.floor(Math.random() * free.length)], c: COLS - 1 },
          alive: true,
        })
        lines.push('Un Axie salvaje aparece por el flanco este.')
      }
    }

    // Los escudos duran un turno.
    setRoster(nextRoster.map((c) => ({ ...c, shield: 0 })))
    setEnemies(nextEnemies)
    setPlayerLordHp(lordHp)
    if (lordHp <= 0) setStatus('lost')
    if (lines.length) setLog((l) => [...lines.reverse(), ...l].slice(0, 7))
    setTurn(turn + 1)
    setRolls(null)
    setActed({})
    setSelected(null)
  }

  const selectedCreature = selected ? roster.find((c) => c.id === selected) : null
  const selectedRoll = selectedCreature ? rolls?.[selectedCreature.id] : null

  return (
    <div className="app">
      <header>
        <h1>Vinculo de Lunacia</h1>
        <p className="subtitle">
          Las seis caras del dado son las seis partes del cuerpo del Axie. Ascender evoluciona una parte y reescribe su
          cara.
        </p>
      </header>

      <div className="hud">
        <div className="lord">Tu Lord: {'♥'.repeat(Math.max(playerLordHp, 0))}</div>
        <div className="turn">Turno {turn}</div>
        <div className="lord">Lord rival: {'♥'.repeat(Math.max(enemyLordHp, 0))}</div>
      </div>

      {status !== 'playing' && (
        <div className={`banner ${status}`}>
          {status === 'won' ? 'Victoria. El Lord rival ha caido.' : 'Derrota. Tu Lord ha caido.'}
        </div>
      )}

      {selectedRoll && (
        <div className="action-bar">
          <b>{selectedCreature.name}</b> tiene <b>{FACE_INFO[selectedRoll.face].name}</b> ·{' '}
          {FACE_INFO[selectedRoll.face].hint} · alcance {moveRange(selectedRoll.face)}
        </div>
      )}

      <div className="board" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {Array.from({ length: ROWS }).map((_, r) =>
          Array.from({ length: COLS }).map((_, c) => {
            const isPLord = r === PLAYER_LORD.r && c === PLAYER_LORD.c
            const isELord = r === ENEMY_LORD.r && c === ENEMY_LORD.c
            const own = roster.find((cr) => cr.alive && cr.pos && cr.pos.r === r && cr.pos.c === c)
            const enemy = enemies.find((e) => e.alive && e.pos.r === r && e.pos.c === c)
            const summonZone = c <= 1 && !isPLord
            const inRange =
              selectedCreature && selectedRoll
                ? dist(selectedCreature.pos, r, c) >= 1 && dist(selectedCreature.pos, r, c) <= moveRange(selectedRoll.face)
                : false
            return (
              <div
                key={`${r}-${c}`}
                className={[
                  'cell',
                  summonZone && summonableIds.length ? 'summon-zone' : '',
                  inRange ? 'in-range' : '',
                  selected && own?.id === selected ? 'selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => cellClick(r, c)}
              >
                {isPLord && <span className="lord-icon">◆</span>}
                {isELord && <span className="lord-icon enemy">◆</span>}
                {own && (
                  <div
                    className={`unit own ${own.ascLevel > 0 ? 'ascended' : ''} ${acted[own.id] ? 'spent' : ''}`}
                    style={{ borderColor: CLASSES[own.klass].color }}
                  >
                    <span>{own.name.split(' ').pop()[0]}</span>
                    <small>{own.hp}</small>
                    {own.shield > 0 && <em className="shield">{own.shield}</em>}
                  </div>
                )}
                {enemy && (
                  <div className="unit enemy">
                    <span>W</span>
                    <small>{enemy.hp}</small>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <section className="roster">
        {roster.map((c) => {
          const rolled = rolls?.[c.id]
          return (
            <div
              key={c.id}
              className={`card ${!c.alive ? 'down' : ''} ${selected === c.id ? 'selected' : ''}`}
              style={{ borderColor: CLASSES[c.klass].color }}
            >
              <div className="card-head">
                <strong>{c.name}</strong>
                <span className="klass" style={{ background: CLASSES[c.klass].color }}>
                  {CLASSES[c.klass].label}
                </span>
              </div>
              <div className="stat-row">
                <span>HP {Math.max(c.hp, 0)}/{c.maxHp}</span>
                <span>DEF {c.def}</span>
                <span>Asc. {c.ascLevel}</span>
                {c.shield > 0 && <span className="shield-tag">Escudo {c.shield}</span>}
              </div>
              <div className="axp-bar" title={`AXP ${c.axp}/${AXP_PER_ASCENSION}`}>
                <div className="axp-fill" style={{ width: `${(c.axp / AXP_PER_ASCENSION) * 100}%` }} />
              </div>

              {/* El dado del genoma: una cara por parte. Es la pantalla que explica el juego. */}
              <div className="die-grid">
                {SLOTS.map((slot) => {
                  const face = c.die.find((f) => f.slot === slot)
                  const active = rolled && rolled.slot === slot
                  return (
                    <div
                      key={slot}
                      className={`face-card ${face.evolved ? 'evolved' : ''} ${active ? 'active' : ''}`}
                      title={FACE_INFO[face.face].hint}
                    >
                      <span className="face-slot">{SLOT_LABEL[slot]}</span>
                      <span className="face-glyph">{FACE_INFO[face.face].glyph}</span>
                      <span className="face-part">{face.partName}</span>
                      <span className="face-effect">
                        {FACE_INFO[face.face].name}
                        {face.power > 0 ? ` ${face.power}` : ''}
                      </span>
                    </div>
                  )
                })}
              </div>

              {rolled && c.alive && (
                <div className="roll-result">
                  Sale <b>{SLOT_LABEL[rolled.slot]}</b> — {FACE_INFO[rolled.face].name}
                  {acted[c.id] && <span className="done"> · ya ha actuado</span>}
                  {!c.pos && rolled.face === 'summon' && !acted[c.id] && (
                    <div className="hint">Toca una casilla marcada para invocar</div>
                  )}
                  {!c.pos && rolled.face !== 'summon' && <div className="hint">Espera fuera del tablero</div>}
                </div>
              )}
              {c.pos && c.alive && !acted[c.id] && rolls && (
                <button className="small" onClick={() => setSelected(c.id)}>
                  Seleccionar en tablero
                </button>
              )}
            </div>
          )
        })}
      </section>

      <div className="controls">
        <button onClick={rollDice} disabled={status !== 'playing' || !!rolls}>
          Tirar dados
        </button>
        <button onClick={endTurn} disabled={status !== 'playing' || !rolls}>
          Terminar turno
        </button>
      </div>

      {ascensionToast && (
        <div className="toast" onAnimationEnd={() => setAscensionToast(null)}>
          {ascensionToast}
        </div>
      )}

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
