import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { AXIE_SAMPLE_GENES } from './Board3D'
import { LORD_DESCRIPTORS, ROSTER_DESCRIPTORS, STARTER_INFO } from './axieGeneCatalog'
import {
  CLASS_STATS,
  faceValue,
  LORD_DIE,
  LORD_STATS,
  rollFace,
  SLOT_LABEL_MVP1,
  standardDie,
  TERRAIN_TYPES,
} from './axie'
import { ROWS, COLS, PLAYER_LORD, ENEMY_LORD } from './gameConstants'
import LoadingCurtain from './components/LoadingCurtain'
import BattleLog from './components/BattleLog'
import VictoryBanner from './components/VictoryBanner'
import Controls from './components/Controls'
import ActionPad from './components/ActionPad'
import Roster from './components/Roster'
import BoardRegion from './components/BoardRegion'
import LunaciaBackdrop from './LunaciaBackdrop'
import { useHashRoute } from './routes'
import { setMusicKey } from './music'
import MusicToggle from './components/MusicToggle'
import MetaNav from './components/MetaNav'
import CoverScreen from './components/meta/CoverScreen'
import ResearchScreen from './components/meta/ResearchScreen'
import PveScreen from './components/meta/PveScreen'
import PvpScreen from './components/meta/PvpScreen'
import LaboratoryScreen from './components/meta/LaboratoryScreen'
import { BATTLE_ARENA_CONFIG } from './arenaConfig'
import { findGridPath } from './core/grid/findPath'
import { ACTOR_ACTIVITY, createActorState } from './core/entities/actor'
import VillageScene from './modes/village/VillageScene'

// Referencia estable: el hover del tablero no debe crear un objeto `lords`
// nuevo y forzar el recalculo de todos los objetivos/axies 3D.
const BATTLE_LORDS = Object.freeze({ player: PLAYER_LORD, enemy: ENEMY_LORD })

// MVP1vinculodelunacia.md, pasos 1-5 del orden de construccion:
//   1. Tablero 8x7, colocacion de Lord y 3 moviles, turnos alternos.
//   2. Movimiento por chasis + zona de control.
//   3. Ataque basico, vida, muerte, victoria por Lord a 0.
//   4. Terreno: piedra, zona lenta, agua, obstaculo bajo.
//   5. Dados de unidad (3 caras) y las 12 partes reales con sus efectos.
// Sin IA todavia (paso 10): los dos bandos se juegan a mano (hotseat) para poder
// probar cada regla por separado antes de automatizar al rival.
// ROWS/COLS/PLAYER_LORD/ENEMY_LORD/CELL_SIZE/EFFECT_GLYPH/LORD_GLYPH viven en
// gameConstants.js (los necesitan tambien los componentes de presentacion).

// Tablero en 3D real (Board3D.jsx, Three.js vanilla + bloques GLB de Kenney,
// Platformer Kit CC0 -kenney.nl/assets/platformer-kit).
// De momento solo hay pieza 3D para "abierto" (block-grass.glb, un bloque de
// cesped por celda); piedra/agua/zona lenta se quedan con su tinte CSS plano.
// Estos flags solo controlan que se renderiza, para poder desactivar una
// pieza sin reconstruir nada si hiciera falta.
const SHOW_BOARD = true
const SHOW_DASHBOARD = true
const SHOW_OVERLAY = true
const BOARD3D_BLOCK_URL = '/models/block-grass.glb'
// Piezas de Kenney por tipo de terreno: el bloque de cesped se queda SIEMPRE
// debajo (nunca se sustituye), y encima va una decoracion propia por terreno.
// "stone": rocks.glb (Platformer Kit, CC0) como prop suelto, a 62% de la celda.
// "slow": patch-dirt.glb (Mini Forest, CC0) -tierra/desierto- casi a tamano
// completo de celda (fit 0.92) para que lea como una capa de tierra encima
// del bloque, no como un objeto suelto.
// Constantes a nivel de modulo a proposito: si fueran objetos literales inline
// en el JSX, Board3D recrearia toda la escena en cada render (ver Board3D.jsx).
const TERRAIN_BLOCK_URLS = {}
// "water": no hay ninguna pieza de agua en los packs de Kenney descargados, asi
// que es un "laguito" dibujado a mano en Three.js (ver makePond en Board3D.jsx:
// un poligono redondeado e irregular, material azul brillante), no un modelo
// cargado. fit 0.44 = radio, no lado -queda un poco mas chico que la celda
// para leer como una laguna, no como una baldosa cuadrada.
const TERRAIN_DECOR_URLS = {
  stone: '/models/rocks.glb',
  slow: { url: '/models/mini-forest/patch-dirt.glb', fit: 0.92 },
  water: { type: 'pond', fit: 0.44 },
  // Obstaculo bajo: bloquea el movimiento pero no la linea de tiro (regla del
  // MVP1) -una caja/crate del Platformer Kit se lee bien como "bulto que no
  // dejar pasar" sin confundirse con la roca de "stone" (que bloquea todo).
  obstacle: '/models/crate.glb',
}
// 16 medios-turno = 8 rondas. Sigue contando MEDIOS-turno (turnCount sube 1
// por cada mitad, jugador y rival por separado, ver passTurn()): Hud.jsx es
// el unico sitio que lo convierte a rondas para mostrarlo.
const TURN_CLOCK = 16

// Banco de Energia (A3, docs/design/combate-dinamico-dado.md seccion 6.4): la
// Energia sale de LAS CARAS DEL DADO -cada cara sin golpe de tu tirada
// (guardia/reposicion/utilidad, ver yieldsEnergy) mete +1 al banco (tope 5)- y
// el banco PERSISTE toda la partida (no se vacia al cambiar de turno): dentro
// de las 8 rondas, guardar para el turno gordo o gastar en cuanto llega es una
// decision real. Gastos: +10 al siguiente golpe (2 E, boostArmed) o mover 1
// casilla extra (2 E, moveBoostArmed). La IA no gasta Energia todavia: su
// medidor es solo informativo.
const ENERGY_CAP = 5
const ENERGY_BOOST_COST = 2
const ENERGY_MOVE_COST = 2

// Afinidad de clases, el triangulo oficial de Axie (Plant/Reptile/Dusk ->
// Aqua/Bird/Dawn -> Beast/Bug/Mech, x1.15 a favor / x0.85 en contra con
// redondeo hacia abajo). Aplica a TODOS los ataques entre unidades (especial,
// basico y contragolpe); contra el Lord es neutro (no tiene clase). Para las
// 4 clases del MVP1: Beast gana a Plant y pierde con Aqua/Bird; Plant gana a
// Aqua/Bird y pierde con Beast; Aqua gana a Beast y pierde con Plant; Bird
// gana a Beast y pierde con Plant. Aqua/Bird y las demas parejas quedan
// neutras (comparten grupo en el triangulo oficial).
const AFFINITY_STRONG = 1.15
const AFFINITY_WEAK = 0.85
const AFFINITY = {
  beast: { strong: ['plant'], weak: ['aqua', 'bird'] },
  plant: { strong: ['aqua', 'bird'], weak: ['beast'] },
  aqua: { strong: ['beast'], weak: ['plant'] },
  bird: { strong: ['beast'], weak: ['plant'] },
}
function affinityMult(attackerKlass, defenderKlass) {
  if (!attackerKlass || !defenderKlass) return 1
  const rel = AFFINITY[attackerKlass]
  if (!rel) return 1
  if (rel.strong.includes(defenderKlass)) return AFFINITY_STRONG
  if (rel.weak.includes(defenderKlass)) return AFFINITY_WEAK
  return 1
}

// Critico genetico: la prob. y el multiplicador salen de la CLASE del Axie
// (su genoma) + la PARTE tirada -la cara que ataca aporta +5% de rafaga y
// +0.25 al multiplicador sobre la base de clase. El golpe basico (sin parte
// en el golpe) solo lleva la base de clase: Beast 20%/x2.0, Bird 25%/x2.5,
// Aqua 15%/x3.0, Plant 5%/x1.5. `critFor` es puro (para preview/UI);
// `rollCrit` decide el impacto real del golpe en el aplicador de dano (nunca
// en la preview, para que la preview mantenga numeros deterministicos).
const CLASS_CRIT = {
  beast: { label: 'Beast', rate: 20, dmg: 2.0 },
  bird: { label: 'Bird', rate: 25, dmg: 2.5 },
  aqua: { label: 'Aqua', rate: 15, dmg: 3.0 },
  plant: { label: 'Plant', rate: 5, dmg: 1.5 },
}
function critFor(attacker, rolled) {
  const base = CLASS_CRIT[attacker?.klass] || { rate: 0, dmg: 1 }
  const withPart = rolled ? { rate: 5, dmg: 0.25 } : { rate: 0, dmg: 0 }
  return { rate: base.rate + withPart.rate, dmg: base.dmg + withPart.dmg }
}
function rollCrit(attacker, rolled) {
  const c = critFor(attacker, rolled)
  return Math.random() * 100 < c.rate ? { ...c, hit: true } : { ...c, hit: false }
}

// Muerte subita / prorroga (solo PVP): al agotar las 8 rondas, ambos bandos
// reciben +2 casillas de movimiento y +50% de dano durante 2 rondas extra, y
// despues tiebreak por vida de Lord igual que hoy. `OVERTIME_ACTIVE` es un
// flag de MODULO como TERRAIN_LAYOUT: los helpers de dano/movimiento puros
// (computeUnitAttack, computeCounterHit, reachableCells) lo leen sin tener
// que recibirlo por parametro.
const OVERTIME_ROUNDS = 2
const OVERTIME_EXTRA = OVERTIME_ROUNDS * 2 // medios-turno: 2 rondas = 4
const OVERTIME_MOVE = 2
const OVERTIME_DMG = 0.5
const OVERTIME_DRAIN = 15 // HP que ambos Lords pierden por ronda de prorroga
let OVERTIME_ACTIVE = false
function effectiveMove(klass) {
  return CLASS_STATS[klass].move + (OVERTIME_ACTIVE ? OVERTIME_MOVE : 0)
}
// Reloj de turno PVP: 35 segundos por medios-turno del jugador en las arenas
// PVP (batallas de ~9 min). Al acabarse se tiran los dados automaticamente (si
// aun no) y se pasa el turno sin mover/atacar. En PVE no hay reloj.
const PVP_TURN_MS = 35000
// Ritmo visual compartido por ataques: la animacion del Axie arranca primero y
// el impacto llega unas décimas después. Las reglas se resuelven al instante;
// estos tiempos sólo ordenan la presentación.
const ATTACK_IMPACT_DELAY_MS = 260
const COUNTER_ATTACK_DELAY_MS = 620

// Aqua entra en la composicion de prueba para poder verificar la regla del
// agua (comprobable del paso 4). El equipo del JUGADOR es fijo para toda la
// app (beast/bird/aqua); lo que cambia por zona de partida es el de los
// ASEDIANTES (matchConfig.enemyClasses).
const PLAYER_TEAM = ['beast', 'bird', 'aqua']

// Mapa de prueba para el paso 4 (los 3 mapas VERSIONADOS del hub llegan segun
// la zona elegida; el mapa real por defecto sigue siendo este): un muro de
// piedra, una zona lenta, un obstaculo bajo en la fila del Lord (fila 3, ahora
// que el tablero es 8x7) y un canal de agua exclusivo para Aqua justo debajo,
// con una fila libre de terreno arriba y abajo para que quede simetrico.
const TEST_TERRAIN = {
  '1,3': 'stone',
  '1,4': 'stone',
  '2,3': 'slow',
  '2,4': 'slow',
  '3,3': 'obstacle',
  '4,3': 'water',
  '4,4': 'water',
  '4,5': 'water',
  '5,2': 'slow',
  '5,3': 'slow',
  '5,4': 'slow',
  '5,5': 'slow',
}
// TERRAIN_LAYOUT es el mapa VIVO de la partida actual: resetMatch(cfg) lo
// reasigna a cfg.terrain (por zona del hub) antes de reconstruir el tablero.
let TERRAIN_LAYOUT = TEST_TERRAIN
function terrainAt(r, c) {
  return TERRAIN_LAYOUT[`${r},${c}`] || 'open'
}

// Config de partida por zona (viene de src/gameMissions.js por su `zone` y el
// nodo elegido en el mapa/hub). Todo lo que diferencia una partida de otra
// vive aqui: mapa, clases enemigas, starters o axies normales, escala de vida,
// recompensa de esencia y las condiciones de la escaramuza. resetMatch(cfg)
// lo guarda para que el render (titulo del roster, contexto) sepa que se juega.
// "libre" es el valor del boton "Partida libre" (la escaramuza clasica).
const MATCH_DEFAULT = {
  zone: 'libre',
  mode: 'pve',
  enemyTitle: 'Besiegers',
  blurb: 'Skirmish in the heart of Lunacia.',
  enemyClasses: [...PLAYER_TEAM],
  starterEnemy: true,
  hpScale: 1,
  reward: 2,
  terrain: TEST_TERRAIN,
}
let CURRENT_MATCH = MATCH_DEFAULT

const GUARD_EFFECTS = new Set(['guard', 'guard-heal', 'guard-push'])

// Dado activo de una unidad: las caras BLOQUEADAS (bloqueo de partes del
// Laboratorio, pantalla de evolucion) no pueden salir en la tirada -asi el
// jugador sube la probabilidad de sus caras favoritas excluyendo las otras.
// Nunca se devuelve vacio: si alguien bloquea todo, la primera cara vuelve
// como respaldo para que la unidad siempre pueda actuar.
function activeDie(u) {
  if (!u || !u.die) return []
  const blocked = u.blockedSlots || {}
  const pool = u.die.filter((f) => !blocked[f.slot])
  return pool.length ? pool : [u.die[0]]
}

function makeUnit(side, klass, id, pos, opts) {
  const o = opts || {}
  // Augments del Laboratorio (meta.augments, persistente por CLASE: el roster
  // de una clase siempre es el mismo axie). `evolved`: la parte de un slot
  // evolucionada sube +10 el valor de su cara (reescribe la cara del dado,
  // regla "ascender no sube un numero, evoluciona UNA parte"). `blocked`: las
  // partes bloqueadas salen de la tirada (activeDie) -el bloqueo no "sube" la
  // parte, sube la PROBABILIDAD de las que dejas dentro.
  const aug = o.augments && o.augments[klass]
  const evolved = (aug && aug.evolved) || {}
  const die = standardDie(klass).map((face) =>
    evolved[face.slot] ? { ...face, evolved: true, value: face.value + 10 } : face,
  )
  const stats = CLASS_STATS[klass]
  const hpScale = o.hpScale || 1
  // marked (Marca del Lord): true = el PROXIMO ataque que impacte a esta
  // unidad hace +20, luego se consume. buffed (Templanza del Lord): true =
  // el PROXIMO ataque que HAGA esta unidad hace +15, luego se consume.
  // broken (Rotura, Fase A de docs/design/combate-dinamico-dado.md): al recibir un
  // golpe con ventaja de relacion, la unidad no puede contraatacar esta vuelta
  // ni la siguiente accion (se limpia en su siguiente tirada). energyMove/
  // energyBoost (banco de Energia, A3): gastos de la banca del turno.
  // `moved`: true = la unidad ya se movio este turno (solo puede atacar, no
  // volver a moverse). Se resetea en la siguiente tirada del bando como
  // acted/shield/broken. `dealtDamage`: true = esta unidad ya hizo daño real
  // este turno -la Energia sale de las caras sin golpe de la tirada (rollDice),
  // asi que este campo queda como registro inerte (se sigue
  // marcando/reseteando como antes, sin lectura).
  // `name`: las unidades del bando enemigo son los starters oficiales con
  // nombre propio (Buba/Momo/Puffy, STARTER_INFO en axieGeneCatalog.js) -solo
  // identidad de UI, no toca stats/combate. En el PVP el rival es "axies
  // normales" (starterEnemy false) y no llevan nombre de starter. Los clones
  // y la reserva heredan la misma config de su bando.
  return {
    ...createActorState({ kind: 'axie', pos }),
    id,
    side,
    klass,
    name: o.starterEnemy ? (STARTER_INFO[klass] ?? {}).name : undefined,
    hp: Math.round(stats.hp * hpScale),
    maxHp: Math.round(stats.hp * hpScale),
    shield: 0,
    pos,
    alive: true,
    acted: false,
    moved: false,
    marked: false,
    buffed: false,
    broken: false,
    energyMove: false,
    energyBoost: false,
    dealtDamage: false,
    blockedSlots: (aug && aug.blocked) || {},
    die,
  }
}

// Genera un id unico para un clon (habilidad "Duplicar" del Lord): cuenta los
// clones ya presentes de ese bando y sigue la numeracion -no hace falta un
// contador aparte, `units` ya es la fuente de verdad.
function nextCloneId(side, units) {
  const prefix = side === 'player' ? 'pc' : 'ec'
  const count = units.filter((u) => u.id.startsWith(prefix)).length
  return `${prefix}${count}`
}

function makeInitialBoard(side, classes, opts) {
  const lord = side === 'player' ? PLAYER_LORD : ENEMY_LORD
  return classes.map((klass, i) =>
    makeUnit(side, klass, `${side === 'player' ? 'p' : 'e'}${i}`, { r: lord.r - 1 + i, c: side === 'player' ? 1 : COLS - 2 }, opts),
  )
}

// Paso 8: reserva de 3 unidades fuera del tablero por bando (regla 3), con la
// misma composicion de clases que el roster inicial. pos:null las mantiene
// fuera del tablero y de cellOccupied/renderizado sin ningun caso especial.
function makeInitialReserve(side, classes, opts) {
  return classes.map((klass, i) => makeUnit(side, klass, `${side === 'player' ? 'pr' : 'er'}${i}`, null, opts))
}

function dist(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c)
}

function adjacent(a, b) {
  return dist(a, b) === 1
}

function cellOccupied(r, c, units, lords) {
  if ((r === lords.player.r && c === lords.player.c) || (r === lords.enemy.r && c === lords.enemy.c)) return true
  return units.some((u) => u.alive && u.pos && u.pos.r === r && u.pos.c === c)
}

function cellPassable(r, c, klass) {
  const terrain = TERRAIN_TYPES[terrainAt(r, c)]
  if (terrain.blocksMove) return false
  if (terrain.aquaOnly && klass !== 'aqua') return false
  return true
}

// Casillas alcanzables por movimiento respetando el terreno (regla 6) y la zona de
// control: al entrar en una casilla adyacente a un enemigo vivo, esa rama del
// recorrido se para ahi (regla 6, seccion 5). moveBudget parametriza el presupuesto de
// movimiento: por defecto el del chasis, pero Shrimp (Impulso) usa el suyo propio (2).
function reachableCells(unit, units, lords, moveBudget = effectiveMove(unit.klass)) {
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
      if (cellOccupied(nr, nc, units, lords)) continue
      if (!cellPassable(nr, nc, unit.klass)) continue
      const cost = cur.cost + TERRAIN_TYPES[terrainAt(nr, nc)].moveCost
      if (cost > moveBudget) continue
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

// Bresenham entre dos celdas, extremos incluidos: sirve para saber que casillas
// atraviesa un disparo. Solo la piedra bloquea la linea de tiro (regla 6); el
// obstaculo bajo bloquea el movimiento pero no el disparo.
function lineCells(a, b) {
  let r0 = a.r
  let c0 = a.c
  const dr = Math.abs(b.r - r0)
  const dc = Math.abs(b.c - c0)
  const sr = r0 < b.r ? 1 : -1
  const sc = c0 < b.c ? 1 : -1
  let err = dr - dc
  const cells = []
  for (;;) {
    cells.push({ r: r0, c: c0 })
    if (r0 === b.r && c0 === b.c) break
    const e2 = 2 * err
    if (e2 > -dc) {
      err -= dc
      r0 += sr
    }
    if (e2 < dr) {
      err += dr
      c0 += sc
    }
  }
  return cells
}

function hasLineOfSight(from, to) {
  const between = lineCells(from, to).slice(1, -1)
  return between.every((cell) => !TERRAIN_TYPES[terrainAt(cell.r, cell.c)].blocksLine)
}

// Alcance efectivo de la cara: Feather Spear suma al del chasis, Nut Throw lo
// sustituye por uno fijo, el resto usa el del chasis tal cual.
function effectiveRange(rolled, stats) {
  if (rolled.effect === 'ranged-bonus') return stats.range + rolled.rangeBonus
  if (rolled.effect === 'ranged-fixed') return rolled.fixedRange
  return stats.range
}

// Shrimp (Impulso): mueve hasta su propio presupuesto (2) y ataca al final con el
// alcance del chasis desde la casilla de llegada. `landing` es la casilla concreta
// donde aterriza para poder golpear a ese objetivo.
function dashTargets(unit, rolled, units, lords) {
  const stats = CLASS_STATS[unit.klass]
  const cells = reachableCells(unit, units, lords, rolled.moveRange)
  const landingSpots = [{ r: unit.pos.r, c: unit.pos.c }, ...cells]
  const targets = []
  const tryTarget = (kind, id, pos) => {
    // A5: si la casilla de aterrizaje esta pegada a un obstaculo, ese tiro
    // concreto llega 1 mas lejos (terrainRangeBonus).
    const landing = landingSpots.find((cell) => dist(cell, pos) <= stats.range + terrainRangeBonus(cell) && hasLineOfSight(cell, pos))
    if (landing) targets.push({ kind, id, pos, landing })
  }
  const enemyLord = unit.side === 'player' ? lords.enemy : lords.player
  tryTarget('lord', null, enemyLord)
  units.filter((u) => u.alive && u.side !== unit.side && u.pos).forEach((u) => tryTarget('unit', u.id, u.pos))
  return targets
}

// Regla 2.1: toda unidad puede atacar siempre con el ataque basico de su clase, salga
// la cara que salga -ninguna combinacion de partes deja a una unidad sin poder actuar.
// Guardia y Swallow no traen ataque propio, asi que caen aqui como respaldo.
function basicAttackTargets(unit, units, lords) {
  if (!unit || !unit.pos) return []
  const stats = CLASS_STATS[unit.klass]
  // A5: obstaculo bajo pegado a la propia casilla = +1 de alcance a este tiro.
  const range = stats.range + terrainRangeBonus(unit.pos)
  const targets = []
  const enemyLord = unit.side === 'player' ? lords.enemy : lords.player
  if (dist(unit.pos, enemyLord) <= range && hasLineOfSight(unit.pos, enemyLord)) {
    targets.push({ kind: 'lord', pos: enemyLord, basic: true })
  }
  units
    .filter((u) => u.alive && u.side !== unit.side && u.pos && dist(unit.pos, u.pos) <= range && hasLineOfSight(unit.pos, u.pos))
    .forEach((u) => targets.push({ kind: 'unit', id: u.id, pos: u.pos, basic: true }))
  return targets
}

// Ataques de la cara tirada (el "especial" de cada face). Las caras de
// guardia y Swallow no devuelven el ataque basico como respaldo: el basico es
// una OPCION explicita del jugador (boton "Basico" en el ActionPad) y de la
// IA, asi que estas caras no traen especial propio y solo se banquea (+1
// Energia).
function attackTargetsForFace(unit, rolled, units, lords) {
  if (!rolled) return []
  if (!unit || !unit.pos) return []
  if (GUARD_EFFECTS.has(rolled.effect) || rolled.effect === 'reposition-ally') {
    return []
  }
  if (rolled.effect === 'dash-attack') return dashTargets(unit, rolled, units, lords)
  const stats = CLASS_STATS[unit.klass]
  // A5: obstaculo bajo pegado a la propia casilla = +1 de alcance a este tiro.
  const range = effectiveRange(rolled, stats) + terrainRangeBonus(unit.pos)
  const targets = []
  const enemyLord = unit.side === 'player' ? lords.enemy : lords.player
  if (dist(unit.pos, enemyLord) <= range && hasLineOfSight(unit.pos, enemyLord)) {
    targets.push({ kind: 'lord', pos: enemyLord })
  }
  units
    .filter((u) => u.alive && u.side !== unit.side && u.pos && dist(unit.pos, u.pos) <= range && hasLineOfSight(unit.pos, u.pos))
    .forEach((u) => targets.push({ kind: 'unit', id: u.id, pos: u.pos }))
  return targets
}

// Paso 8: ataque del Lord (cara 1 de su dado, seccion 4.2). El Lord no se
// mueve nunca (regla 18), asi que dispara siempre desde su casilla fija.
function lordAttackTargets(side, units, lords) {
  const pos = lords[side]
  const range = LORD_STATS.range
  const targets = []
  const enemyLord = side === 'player' ? lords.enemy : lords.player
  if (dist(pos, enemyLord) <= range && hasLineOfSight(pos, enemyLord)) {
    targets.push({ kind: 'lord', pos: enemyLord })
  }
  units
    .filter((u) => u.alive && u.side !== side && u.pos && dist(pos, u.pos) <= range && hasLineOfSight(pos, u.pos))
    .forEach((u) => targets.push({ kind: 'unit', id: u.id, pos: u.pos }))
  return targets
}

// Paso 8: invocacion del Lord (caras 2-6). Los refuerzos del Lord aparecen junto al
// Lord (regla 16), en una casilla ortogonal libre. reserveKlass filtra el agua para
// que no se ofrezca una casilla que la siguiente unidad de la reserva no podria pisar.
function lordSummonTargets(side, units, lords, reserveKlass) {
  if (!reserveKlass) return []
  const pos = lords[side]
  const deltas = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]
  const cells = []
  for (const [dr, dc] of deltas) {
    const nr = pos.r + dr
    const nc = pos.c + dc
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
    if (cellOccupied(nr, nc, units, lords)) continue
    if (!cellPassable(nr, nc, reserveKlass)) continue
    cells.push({ r: nr, c: nc })
  }
  return cells
}

// Habilidades de apoyo del Lord: las 5 comparten alcance 3 desde la casilla
// fija del Lord -es apoyo, no el ataque corto del Lord, asi que llega mas
// lejos.
const LORD_SUPPORT_RANGE = 3

// Aliado propio VIVO en el tablero a alcance 3 -misma forma para Muro, Cura,
// Templanza y Duplicar (las 4 apuntan a un aliado; Duplicar ademas puede
// apuntar a una casilla vacia junto al Lord, ver lordSummonTargets).
function lordAllyTargets(side, units, lords) {
  const pos = lords[side]
  return units
    .filter((u) => u.alive && u.side === side && u.pos && dist(pos, u.pos) <= LORD_SUPPORT_RANGE)
    .map((u) => ({ kind: 'unit', id: u.id, pos: u.pos }))
}
const lordShieldTargets = lordAllyTargets
const lordHealTargets = lordAllyTargets
const lordBuffTargets = lordAllyTargets
const lordCloneTargets = lordAllyTargets

// Marca: enemigo VIVO en el tablero a alcance 3 (solo unidades, no el Lord
// rival -mantiene la marca contenida al mismo tipo de objetivo que el resto
// de habilidades de apoyo, sin tocar el HP del Lord fuera del ataque
// propio). Requiere linea de tiro, igual que un ataque real.
function lordMarkTargets(side, units, lords) {
  const pos = lords[side]
  const enemySide = side === 'player' ? 'enemy' : 'player'
  return units
    .filter((u) => u.alive && u.side === enemySide && u.pos && dist(pos, u.pos) <= LORD_SUPPORT_RANGE && hasLineOfSight(pos, u.pos))
    .map((u) => ({ kind: 'unit', id: u.id, pos: u.pos }))
}

// Swallow (Reposiciona): aliados adyacentes que se pueden mover. Simplificacion
// deliberada del prototipo: el destino lo elige el juego (primera casilla libre en
// horario desde arriba), no el jugador -evita un segundo paso de seleccion.
function repositionableAllies(unit, units) {
  return units.filter((u) => u.alive && u.side === unit.side && u.id !== unit.id && u.pos && adjacent(unit.pos, u.pos))
}
function firstFreeNeighbor(pos, klass, units, lords) {
  const deltas = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]
  for (const [dr, dc] of deltas) {
    const nr = pos.r + dr
    const nc = pos.c + dc
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
    if (cellOccupied(nr, nc, units, lords)) continue
    if (!cellPassable(nr, nc, klass)) continue
    return { r: nr, c: nc }
  }
  return null
}

const labelOf = (u) => `${CLASS_STATS[u.klass].label} ${u.side === 'player' ? 'ally' : 'enemy'}`
const sideLabel = (side) => (side === 'player' ? 'Allied' : 'Enemy')

// Un dado por unidad, tirado una vez al inicio del turno (regla 7), mas el dado del
// Lord (paso 8). Resuelve enseguida las caras de guardia (regla 11: se aplican
// solas, sin gastar la accion). Funcion pura para poder compartir el mismo calculo
// entre el boton manual de Player y el resolutor automatico de Enemy (paso 10).
function rollSideDice(units, side, lords) {
  // A1: la Rotura se limpia cuando la unidad rota de nuevo (la siguiente vez
  // que tira, ya puede contraatacar). Igual para player (rollDice) y enemy.
  // dealtDamage es un registro inerte (ver makeUnit).
  let next = units.map((u) => (u.side === side ? { ...u, shield: 0, broken: false, moved: false, dealtDamage: false } : u))
  const newRolls = {}
  const lines = []
  const lordFace = rollFace(LORD_DIE)
  lines.push(`${sideLabel(side)} Lord: ${lordFace.name}.`)
  next.forEach((u) => {
    if (!u.alive || u.side !== side) return
    const face = rollFace(activeDie(u))
    newRolls[u.id] = face
    lines.push(`${labelOf(u)}: ${SLOT_LABEL_MVP1[face.slot]} (${face.name}) - ${face.text}`)
  })
  next.forEach((u, idx) => {
    if (!u.alive || u.side !== side) return
    const face = newRolls[u.id]
    if (!GUARD_EFFECTS.has(face.effect)) return
    const val = faceValue(face)
    next[idx] = { ...next[idx], shield: val }
    if (face.effect === 'guard-heal') {
      next[idx] = { ...next[idx], hp: Math.min(next[idx].maxHp, next[idx].hp + face.heal) }
    }
    if (face.effect === 'guard-push') {
      const enemy = next.find((x) => x.alive && x.side !== u.side && x.pos && adjacent(next[idx].pos, x.pos))
      if (enemy) {
        const dr = Math.sign(enemy.pos.r - next[idx].pos.r)
        const dc = Math.sign(enemy.pos.c - next[idx].pos.c)
        const dest = { r: enemy.pos.r + dr, c: enemy.pos.c + dc }
        const inBounds = dest.r >= 0 && dest.r < ROWS && dest.c >= 0 && dest.c < COLS
        const blocked = !inBounds || !cellPassable(dest.r, dest.c, enemy.klass)
        const occupied = inBounds && cellOccupied(dest.r, dest.c, next.filter((x) => x.id !== enemy.id), lords)
        if (!blocked && !occupied) {
          const eIdx = next.findIndex((x) => x.id === enemy.id)
          next[eIdx] = { ...next[eIdx], pos: dest }
          lines.push(`${labelOf(next[idx])} pushes ${labelOf(enemy)}.`)
        }
      }
    }
  })
  return { next, newRolls, lines, lordFace }
}

// Calculo puro del dano de un ataque de unidad (no del Lord): mismas reglas que la
// funcion attack() del componente (perforante, remate de Imp, combos, autoefectos),
// pero sin tocar el estado de React -asi la puede usar tambien el resolutor de IA.
//
// Orden de aplicacion de los multiplicadores: base -> prorroga (+50%, ambos
// bandos) -> afinidad (x1.15/x0.85, solo contra unidades) -> critico (solo si
// `critMult` se pasa, nunca en la preview) -> flats de Marca/Templanza/Energia
// (se SUMAN despues, limpias: un buff de +20 es +20 siempre, los
// multiplicadores solo hinchen el golpe de la parte en si). `critMult` se pasa
// desde applyUnitAttackLocal con el resultado de rollCrit; describeExchange lo
// omite y deja la preview determinista en el dano base.
function computeUnitAttack(attacker, rolled, target, units, playerLordHp, enemyLordHp, critMult = 1) {
  let damage
  let actionName
  let ignoresShield = false
  let selfDamage = 0
  let attackerShieldGain = 0
  const targetMaxHp = target.kind === 'lord' ? LORD_STATS.hp : units.find((u) => u.id === target.id).maxHp
  const targetHp =
    target.kind === 'lord' ? (attacker.side === 'player' ? enemyLordHp : playerLordHp) : units.find((u) => u.id === target.id).hp
  if (target.basic) {
    damage = CLASS_STATS[attacker.klass].atk
    actionName = 'a basic strike'
  } else {
    damage = faceValue(rolled)
    actionName = rolled.name
    switch (rolled.effect) {
      case 'pierce':
        ignoresShield = true
        break
      case 'pierce-execute':
        ignoresShield = true
        if (targetHp < targetMaxHp / 2) damage += 10
        break
      case 'strike-shield-self':
        attackerShieldGain = rolled.shieldGain
        break
      case 'strike-self-damage':
        selfDamage = rolled.selfDamage
        break
      case 'strike-combo':
      case 'ranged-fixed':
        if (attacker.die.some((f) => f.id === rolled.comboWith)) damage += rolled.comboBonus
        break
      default:
        break
    }
  }
  // Multiplicadores sobre el dano del golpe: prorroga PVP (+50% a ambos
  // bandos), afinidad por clases (triangulo oficial) y critico genetico.
  damage = Math.floor(damage * (OVERTIME_ACTIVE ? 1 + OVERTIME_DMG : 1))
  const defenderKlass = target.kind === 'unit' ? units.find((u) => u.id === target.id)?.klass : null
  const affinity = affinityMult(attacker.klass, defenderKlass)
  damage = Math.floor(damage * affinity)
  if (critMult !== 1) damage = Math.floor(damage * critMult)
  // Marca del Lord: el PROXIMO ataque que impacte a una unidad marcada hace
  // +20, sea de quien sea. Se consume aqui (el que aplica el resultado
  // limpia `marked`), no importa si mata o no al objetivo.
  const wasMarked = target.kind === 'unit' && units.find((u) => u.id === target.id)?.marked
  if (wasMarked) damage += 20
  // Templanza del Lord: el PROXIMO ataque que HAGA un aliado bendecido hace
  // +15. Se consume igual que Marca, aqui mismo (attacker.buffed ya viene del
  // estado actual, el caller limpia `buffed` en el propio atacante).
  const wasBuffed = !!attacker.buffed
  if (wasBuffed) damage += 15
  // Banco de Energia (A3): la banca del turno compra +10 al proximo golpe de
  // esta unidad. Se consume al impactar igual que marked/buffed.
  const energyHit = !!attacker.energyBoost
  if (energyHit) damage += 10
  return { damage, actionName, ignoresShield, selfDamage, attackerShieldGain, wasMarked, wasBuffed, energyHit, affinity }
}

// --- Fase A (docs/design/combate-dinamico-dado.md) ---
// El "tratado" de integracion: el triángulo de efectos (A1), el intercambio
// con contragolpe (A2), el terreno defensivo (A5) y el banco de Energia (A3).
// Se resuelven en helpers compartidos entre la IA (applyUnitAttackLocal) y el
// ataque manual del jugador (attack()), para que la preview y el golpe real
// nunca se desincronicen.

// A1: las caras se agrupan en tres familias (todos efectos ya existentes) y se
// relacionan Perforar > Guardar > Golpear > Perforar (seccion 6.2.1). Las
// caras de Cola (dash/distancias fijas) y Reposicion quedan NEUTRAS a
// proposito: quemar la Cola es la unica forma de "no entrar en el ciclo"
// cuando el rival te tiene leido (6.2.1).
const EFFECT_FAMILY = {
  pierce: 'pierce',
  'pierce-execute': 'pierce',
  guard: 'guard',
  'guard-heal': 'guard',
  'guard-push': 'guard',
  strike: 'strike',
  'strike-shield-self': 'strike',
  'strike-self-damage': 'strike',
  'strike-combo': 'strike',
  drain: 'strike',
  'ranged-bonus': 'strike',
  'ranged-fixed': 'strike',
}
const TRIANGLE = { pierce: 'guard', guard: 'strike', strike: 'pierce' }
// 'advantage'/'disadvantage'/'neutral'. El ataque basico (regla 2.1) pega como
// familia Golpear (Boca): es un "golpe seco" de la clase.
function relationGain(attackerEffect, defenderEffect) {
  const a = EFFECT_FAMILY[attackerEffect]
  const d = EFFECT_FAMILY[defenderEffect]
  if (!a || !d) return 'neutral'
  if (TRIANGLE[a] === d) return 'advantage'
  if (TRIANGLE[d] === a) return 'disadvantage'
  return 'neutral'
}

// A1: la Rotura. La ventaja de relacion NO modifica el dano (6.2.2): su unico
// efecto es negarle la vuelta al objetivo en este intercambio y en su siguiente
// accion. Solo se concede contra otro UNIDAD (contra el Lord todo es neutral).
// A 0 de dano real (todo absorbido) no hay rotura: golpe que no duele no rompe.
function grantsBreak(relation, dealtDamage, targetKind) {
  return targetKind === 'unit' && relation === 'advantage' && dealtDamage > 0
}

// A5: zona lenta = trinchera (seccion 6.6). Quien recibe un golpe estando sobre
// una casilla de zona lenta suma +10 de guardia a su escudo real SOLO para ese
// golpe. Una sola fuente de verdad para que ataque y contragolpe lean el mismo
// bonus (se premian las casillas que ya se pisan por obligacion, sin crear
// fortalezas inexpugnables: 6.6 "Riesgo mitigado").
function terrainGuardBonus(r, c) {
  return terrainAt(r, c) === 'slow' ? 10 : 0
}

// A5: obstaculo bajo = refugio (seccion 6.6). Disparar desde una casilla
// ortogonalmente pegada a un obstaculo da +1 de alcance a ESE tiro -"el
// arquero se esconde y amplia su ventana de no contraataque". Mismo bonus en
// ataque, ataque basico, Impulso y contragolpe (una sola fuente de verdad:
// quien dispara desde ahi lo tiene siempre, sea cual sea el lado de la
// accion), igual que terrainGuardBonus arriba.
function terrainRangeBonus(pos) {
  const deltas = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]
  for (const [dr, dc] of deltas) {
    const nr = pos.r + dr
    const nc = pos.c + dc
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
    if (terrainAt(nr, nc) === 'obstacle') return 1
  }
  return 0
}

// A2: una cara de defensor puede devolver el golpe del intercambio con su
// propio dano SOLO si es una cara de golpe (familias Perforar/Golpear del
// triangulo). Guardar/Reposicion tienen `value` (escudo) pero no son golpes:
// un defensor que guardo nunca contesta, porque su cara no tiene dano que
// devolver (6.3.1). Swallow (reposition-ally) tampoco.
function canCounterWith(face) {
  if (!face) return false
  const family = EFFECT_FAMILY[face.effect]
  return family === 'pierce' || family === 'strike'
}

// Golpe del contragolpe, PURO: condiciones + numeros, sin mutar nada. null si
// no hay contragolpe. El triángulo NO se materializa aqui (6.2.2): la ventaja
// solo vale al INICIAR el combate, la vuelta es un golpe seco del defensor.
// Tampoco arrastra efectos propios del atacante (sin combos, sin escudo-auto
// de Serious, sin auto-dano de Risky Fish): la respuesta es un golpe, no una
// repeticion de la accion.
//
// La vuelta es "un golpe de unidad" como cualquier otro, asi que lleva
// prorroga (+50% ambos bandos), afinidad (desde el punto de vista del
// DEFENSOR que contesta contra el atacante original) y critico genetico del
// que contesta (critMult, pasado por applyCounterLocal -nunca por la preview,
// misma regla que computeUnitAttack).
function computeCounterHit(defender, rolled, attacker, critMult = 1) {
  if (!defender || !defender.alive) return null
  if (defender.broken) return null
  if (!canCounterWith(rolled)) return null
  // A5: el defensor tambien se beneficia del refugio si su casilla esta
  // pegada a un obstaculo -misma regla que un ataque normal, la vuelta es
  // un disparo como cualquier otro.
  const range = effectiveRange(rolled, CLASS_STATS[defender.klass]) + terrainRangeBonus(defender.pos)
  if (dist(defender.pos, attacker.pos) > range || !hasLineOfSight(defender.pos, attacker.pos)) return null
  let damage = faceValue(rolled)
  let ignoresShield = false
  if (rolled.effect === 'pierce' || rolled.effect === 'pierce-execute') ignoresShield = true
  if (rolled.effect === 'pierce-execute' && attacker.hp < attacker.maxHp / 2) damage += 10
  // Multiplicadores (prorroga, afinidad y critico) antes de las flats, mismo
  // orden que computeUnitAttack.
  damage = Math.floor(damage * (OVERTIME_ACTIVE ? 1 + OVERTIME_DMG : 1))
  const affinity = affinityMult(defender.klass, attacker.klass)
  damage = Math.floor(damage * affinity)
  if (critMult !== 1) damage = Math.floor(damage * critMult)
  // Marca y Templanza se consumen igual que en cualquier ataque (mismas reglas
  // marked/buffed que computeUnitAttack): el contraatacante las lee y el
  // aplicador las limpia.
  const wasMarked = !!attacker.marked
  if (wasMarked) damage += 20
  const wasBuffed = !!defender.buffed
  if (wasBuffed) damage += 15
  const terrainBonus = terrainGuardBonus(attacker.pos.r, attacker.pos.c)
  let absorbed = 0
  let dealt = damage
  if (!ignoresShield) {
    absorbed = Math.min(attacker.shield + terrainBonus, damage)
    dealt = damage - absorbed
  }
  const killed = attacker.hp - dealt <= 0
  return { name: rolled.name, damage, affinity, ignoresShield, absorbed, dealt, killed, wasMarked, wasBuffed, terrainBonus }
}

// Aplica el contragolpe sobre un estado local (units + hps por lado), mutacion
// pura como applyUnitAttackLocal. Devuelve el estado siguiente + lines/
// floatEvents; si no hay contragolpe devuelve el estado sin tocar.
function applyCounterLocal(state, defender, rolled, attackerId) {
  const attacker = state.units.find((u) => u.id === attackerId)
  if (!attacker || !attacker.alive) return { ...state, lines: [], floatEvents: [] }
  // Critico genetico de la vuelta: el defensor que contesta es el golpeador,
  // asi que su cara/parte tambien puede criticar. Tirada solo aqui, nunca en
  // la preview (misma regla que applyUnitAttackLocal).
  const crit = rollCrit(defender, rolled)
  const hit = computeCounterHit(defender, rolled, attacker, crit.hit ? crit.dmg : 1)
  if (!hit) return { ...state, lines: [], floatEvents: [] }
  const lines = []
  const floatEvents = []
  lines.push(`${labelOf(defender)} counters with ${rolled.name} on ${labelOf(attacker)} (-${hit.dealt}).`)
  floatEvents.push({ text: rolled.name, variant: 'cast', ...defender.pos })
  floatEvents.push({ text: `-${hit.dealt}`, variant: 'damage', ...attacker.pos })
  if (crit.hit) {
    lines.push(`CRITICAL! ${crit.dmg.toFixed(2)}x.`)
    floatEvents.push({ text: `CRITICAL x${crit.dmg}`, variant: 'crit', ...defender.pos })
  }
  if (hit.affinity !== 1) {
    floatEvents.push({ text: hit.affinity > 1 ? 'Affinity +' : 'Affinity -', variant: 'relation', ...defender.pos })
  }
  if (hit.terrainBonus > 0 && hit.absorbed > 0) {
    lines.push(`${labelOf(attacker)}'s terrain absorbs ${hit.terrainBonus} of the counter.`)
    floatEvents.push({ text: `+${hit.terrainBonus} terrain guard`, variant: 'shield', ...attacker.pos })
  }
  if (hit.wasMarked) {
    lines.push(`${labelOf(attacker)} was marked: +20 damage.`)
    floatEvents.push({ text: '+20 marked', variant: 'buff', ...attacker.pos })
  }
  if (hit.wasBuffed) {
    lines.push(`${labelOf(defender)} was blessed: +15 damage.`)
    floatEvents.push({ text: '+15 Temperance', variant: 'buff', ...defender.pos })
  }
  if (hit.killed) lines.push(`${labelOf(attacker)} falls.`)
  // El contraatacante ha golpeado: consume su Templanza. El atacante original
  // recibe el golpe y, si estaba marcado, pierde la Marca.
  const shieldConsumed = Math.min(attacker.shield, hit.absorbed)
  const units = state.units.map((u) => {
    if (u.id === attacker.id) {
      return {
        ...u,
        hp: Math.max(0, u.hp - hit.dealt),
        shield: u.shield - shieldConsumed,
        alive: u.hp - hit.dealt > 0,
        pos: u.hp - hit.dealt > 0 ? u.pos : null,
        marked: hit.wasMarked ? false : u.marked,
      }
    }
    if (u.id === defender.id && hit.wasBuffed) return { ...u, buffed: false }
    return u
  })
  return { units, playerLordHp: state.playerLordHp, enemyLordHp: state.enemyLordHp, lines, floatEvents, victory: null }
}

// A3: banco de Energia (seccion 6.4). La cara que no produce golpe (Guardia,
// Invocacion, Reposicion, utilidad) da +1 a la banca del turno. En el MVP1 las
// unicas caras sin golpe son las de guardia (4 de las 12 partes) y Swallow;
// el resto (incluido el Impulso de la Cola) golpean y no banquean.
function yieldsEnergy(effect) {
  if (!effect) return false
  if (effect.startsWith('guard')) return true
  if (effect === 'reposition-ally') return true
  return false
}

// Relacion de una cara de ataque contra la cara tirada del objetivo (para A1
// y la preview del intercambio). Contra el Lord todo es neutral (6.2.4).
function relationFor(rolled, target, rolls) {
  if (target.kind !== 'unit') return 'neutral'
  const defenderFace = rolls?.[target.id]
  return relationGain(target.basic ? 'strike' : rolled?.effect, defenderFace?.effect)
}

// Numeros completos de un ataque (golpe + posible vuelta) para la preview del
// intercambio (6.3.3): la pieza que vuelve competitiva la decision. Pura: la
// UI del ActionPad y el golpe real (attack) calculan con la misma funcion.
function describeExchange(attacker, rolled, target, units, playerLordHp, enemyLordHp, rolls) {
  const primary = computeUnitAttack(attacker, rolled, target, units, playerLordHp, enemyLordHp)
  const victim = target.kind === 'unit' ? units.find((u) => u.id === target.id) : null
  let dealt = primary.damage
  let absorbed = 0
  let terrainAbsorbed = 0
  if (victim && !primary.ignoresShield) {
    const tBonus = terrainGuardBonus(victim.pos.r, victim.pos.c)
    absorbed = Math.min(victim.shield + tBonus, primary.damage)
    dealt = primary.damage - absorbed
    terrainAbsorbed = Math.max(0, absorbed - Math.min(victim.shield, absorbed))
  }
  const killed = !!victim && victim.hp - dealt <= 0
  let relation = 'neutral'
  let broke = false
  let counter = null
  if (victim) {
    const defenderFace = rolls?.[target.id]
    relation = relationFor(rolled, target, rolls)
    broke = grantsBreak(relation, dealt, 'unit')
    if (!killed && !broke && canCounterWith(defenderFace)) {
      const survivor = { ...victim, hp: victim.hp - dealt }
      counter = computeCounterHit(survivor, defenderFace, attacker)
    }
  }
  return {
    targetLabel: victim ? labelOf(victim) : null,
    actionName: primary.actionName,
    damage: primary.damage,
    absorbed,
    terrainAbsorbed,
    dealt,
    killed,
    relation,
    broke,
    // Preview de afinidad y critico. La afinidad YA esta en el dano
    // (computeUnitAttack la aplico); el critico solo se MUESTRA como
    // probabilidad/multiplicador (la tirada real la decide rollCrit en el
    // aplicador de dano, nunca aqui).
    affinity: primary.affinity,
    crit: critFor(attacker, rolled),
    defenderFace: victim ? (rolls?.[target.id] ?? null) : null,
    counter,
  }
}

// Aplica un ataque de unidad sobre un estado local (units/playerLordHp/enemyLordHp)
// y devuelve el siguiente estado mas las lineas de log, sin usar setState -para
// poder encadenar varias acciones de la IA en un solo turno antes de confirmar nada.
function applyUnitAttackLocal(state, attacker, rolled, target) {
  // Critico genetico: se tira AQUI, en el aplicador de dano real, nunca en la
  // preview -describeExchange (que comparte computeUnitAttack) pide el
  // resultado con critMult=1 para que la preview mantenga numeros
  // deterministas.
  const crit = rollCrit(attacker, rolled)
  const { damage, actionName, ignoresShield, selfDamage, attackerShieldGain, wasMarked, wasBuffed, energyHit, affinity } = computeUnitAttack(
    attacker, rolled, target, state.units, state.playerLordHp, state.enemyLordHp, crit.hit ? crit.dmg : 1
  )
  const lines = []
  // Floats de combate generados por ESTE ataque (los consume runEnemyTurn para
  // apilarlos en el paso correspondiente de la secuencia del rival).
  const floatEvents = []
  const castPos = target.landing || attacker.pos
  const victimPos = target.kind === 'lord' ? (attacker.side === 'player' ? ENEMY_LORD : PLAYER_LORD) : state.units.find((u) => u.id === target.id)?.pos || castPos
  // A1: relacion de este golpe con la cara tirada del defensor. Solo entre
  // unidades; contra el Lord todo es neutral (6.2.4). Se calcula ANTES de
  // cualquier float: declararlo mas abajo causa un ReferenceError de TDZ al
  // usarse aqui, que hace fallar CADA ataque de unidad en silencio.
  const relation = relationFor(rolled, target, state.rolls)
  floatEvents.push({ text: actionName === 'a basic strike' ? `Basic attack (${CLASS_STATS[attacker.klass].label})` : actionName, variant: 'cast', ...castPos })
  // Afinidad por clases y critico, ambos solo contra unidades (al Lord no hay
  // afinidad; el critico es del golpeador y aplica a cualquier objetivo, pero
  // se anuncia igual sobre el atacante).
  if (affinity !== 1 && target.kind === 'unit') {
    floatEvents.push({ text: affinity > 1 ? 'Affinity +' : 'Affinity -', variant: 'relation', ...castPos })
  }
  if (crit.hit) {
    lines.push(`CRITICAL! ${crit.dmg.toFixed(2)}x.`)
    floatEvents.push({ text: `CRITICAL x${crit.dmg}`, variant: 'crit', ...castPos })
  }
  // A1: si la relacion de este golpe es ventajosa o desventajosa, se anuncia
  // sobre el atacante -es la pieza que hace visible el PORQUE del triangulo
  // Perforar > Guardar > Golpear > Perforar.
  if (relation === 'advantage' && target.kind === 'unit') floatEvents.push({ text: 'Advantage', variant: 'relation', ...castPos })
  if (relation === 'disadvantage' && target.kind === 'unit') floatEvents.push({ text: 'Disadvantage', variant: 'relation', ...castPos })
  let units = state.units
  let playerLordHp = state.playerLordHp
  let enemyLordHp = state.enemyLordHp
  let victory = null
  let broke = false

  if (target.kind === 'lord') {
    const attackingPlayerLord = attacker.side === 'enemy'
    const current = attackingPlayerLord ? playerLordHp : enemyLordHp
    const next = Math.max(0, current - damage)
    if (attackingPlayerLord) playerLordHp = next
    else enemyLordHp = next
    lines.push(`${labelOf(attacker)} uses ${actionName} on the enemy Lord (-${damage}).`)
    floatEvents.push({ text: `-${damage}`, variant: 'damage', ...victimPos })
    if (next <= 0) victory = attackingPlayerLord ? 'enemy-won' : 'player-won'
  } else {
    const victim = units.find((u) => u.id === target.id)
    let dealt = damage
    let absorbed = 0
    let shieldConsumed = 0
    let terrainAbsorbed = 0
    if (!ignoresShield) {
      // A5: el terreno de zona lenta suma 10 de guardia al escudo real solo
      // para este golpe (trinchera). Absorbido = escudo real + bonus terreno.
      const tBonus = terrainGuardBonus(victim.pos.r, victim.pos.c)
      absorbed = Math.min(victim.shield + tBonus, damage)
      dealt = damage - absorbed
      shieldConsumed = Math.min(victim.shield, absorbed)
      terrainAbsorbed = Math.max(0, absorbed - shieldConsumed)
      if (shieldConsumed > 0) lines.push(`${labelOf(victim)}'s shield absorbs ${shieldConsumed}.`)
      if (terrainAbsorbed > 0) lines.push(`${labelOf(victim)}'s terrain absorbs ${terrainAbsorbed} of the guard.`)
    }
    const killed = victim.hp - dealt <= 0
    lines.push(`${labelOf(attacker)} uses ${actionName} on ${labelOf(victim)} (-${dealt}).`)
    floatEvents.push({ text: `-${dealt}`, variant: 'damage', ...victimPos })
    if (shieldConsumed > 0) floatEvents.push({ text: `shield -${shieldConsumed}`, variant: 'shield', ...victimPos })
    if (terrainAbsorbed > 0) floatEvents.push({ text: `+${terrainAbsorbed} terrain guard`, variant: 'shield', ...victimPos })
    if (wasMarked) lines.push(`${labelOf(victim)} was marked: +20 damage.`)
    if (wasMarked) floatEvents.push({ text: '+20 marked', variant: 'buff', ...victimPos })
    if (killed) lines.push(`${labelOf(victim)} falls.`)
    // A1: la Rotura se decide con el dano real ya calculado.
    broke = grantsBreak(relation, dealt, target.kind)
    if (broke) {
      lines.push(`${labelOf(victim)} suffers Break: cannot counter.`)
      floatEvents.push({ text: 'Break', variant: 'break', ...victimPos })
    }
    units = units.map((u) =>
      u.id === target.id
        ? { ...u, hp: Math.max(0, u.hp - dealt), shield: Math.max(0, u.shield - shieldConsumed), alive: u.hp - dealt > 0, pos: u.hp - dealt > 0 ? u.pos : null, marked: false, broken: broke ? true : u.broken }
        : u
    )
  }
  if (ignoresShield) lines.push("Ignores the target's shield.")
  if (attackerShieldGain > 0) lines.push(`${labelOf(attacker)} gains ${attackerShieldGain} shield.`)
  if (attackerShieldGain > 0) floatEvents.push({ text: `+${attackerShieldGain} shield`, variant: 'shield', ...castPos })
  if (selfDamage > 0) lines.push(`${labelOf(attacker)} takes ${selfDamage} self-damage.`)
  if (selfDamage > 0) floatEvents.push({ text: `-${selfDamage}`, variant: 'damage', ...castPos })
  if (wasBuffed) lines.push(`${labelOf(attacker)} was blessed: +15 damage.`)
  if (wasBuffed) floatEvents.push({ text: '+15 Temperance', variant: 'buff', ...castPos })
  if (energyHit) lines.push(`${labelOf(attacker)} spends 2 Energy: +10 to the strike.`)
  if (energyHit) floatEvents.push({ text: '+10 Energy', variant: 'buff', ...castPos })

  units = units.map((u) => {
    if (u.id !== attacker.id) return u
    // dealtDamage: marca que esta unidad ataco de verdad este turno (registro
    // inerte, ver makeUnit).
    let next = { ...u, acted: true, buffed: false, energyBoost: false, dealtDamage: true }
    if (target.landing && (target.landing.r !== next.pos.r || target.landing.c !== next.pos.c)) next.pos = target.landing
    if (attackerShieldGain > 0) next.shield = Math.max(next.shield, attackerShieldGain)
    if (selfDamage > 0) {
      next.hp = Math.max(0, next.hp - selfDamage)
      next.alive = next.hp > 0
      if (!next.alive) next.pos = null
    }
    return next
  })

  // A2: el contragolpe. Tras resolver el golpe primario, si el objetivo es una
  // unidad que sobrevive, tiene alcance y NO tiene Rotura, contesta UNA vez con
  // su propia cara tirada (6.3). Un golpe mortal no concede contraataque; la
  // Rotura (A1) se lo niega. Se aplica sobre el estado ya actualizado (escudo
  // ganado por Serious incluido) y no toca `acted` del defensor (es una
  // respuesta, no su accion).
  let counterFx = null
  if (target.kind === 'unit' && !broke) {
    const defenderAfter = units.find((u) => u.id === target.id)
    const defenderRoll = state.rolls?.[target.id]
    if (defenderAfter && defenderAfter.alive && canCounterWith(defenderRoll)) {
      const counter = applyCounterLocal({ units, playerLordHp, enemyLordHp }, defenderAfter, defenderRoll, attacker.id)
      if (counter.lines.length > 0) {
        units = counter.units
        playerLordHp = counter.playerLordHp
        enemyLordHp = counter.enemyLordHp
        lines.push(...counter.lines)
        floatEvents.push(...counter.floatEvents)
        counterFx = {
          kind: 'attack', unitId: target.id, slot: defenderRoll.slot ?? null,
          delay: COUNTER_ATTACK_DELAY_MS,
          targetR: attacker.pos.r, targetC: attacker.pos.c,
        }
      }
    }
  }

  // Impacto visual: celdas que reciben anillo de impacto + sacudida -el golpe
  // primario sobre el objetivo y, si hay contragolpe, el golpe de vuelta sobre
  // el atacante. BoardRegion los consume como feedback (ring + shake), igual
  // que lineas y floats. Cada impacto lleva ademas la clase+efecto del
  // golpeador y la casilla del atacante, para que el overlay de VFX del Axie
  // Origins Battle Kit elija el clip y ancle el origen (ver
  // originsVfx.js/vfxIdFor).
  const strikeKlass = attacker.klass
  const counterDefenderKlass = state.units.find((u) => u.id === target.id)?.klass
  const impacts = [
    {
      r: victimPos.r, c: victimPos.c, kind: target.kind === 'lord' ? 'lord' : 'strike',
      klass: strikeKlass, effect: rolled?.effect, atkR: attacker.pos.r, atkC: attacker.pos.c,
      delay: ATTACK_IMPACT_DELAY_MS,
    },
  ]
  if (counterFx) {
    impacts.push({
      r: attacker.pos.r, c: attacker.pos.c, kind: 'counter',
      klass: counterDefenderKlass, effect: state.rolls?.[target.id]?.effect,
      atkR: victimPos.r, atkC: victimPos.c,
      delay: COUNTER_ATTACK_DELAY_MS,
    })
  }

  return { units, playerLordHp, enemyLordHp, lines, victory, floatEvents, counterFx, impacts }
}

// Casilla alcanzable que mas acerca a la unidad al Lord rival (aproximacion a "la
// ruta mas corta que no este bloqueada", regla de IA #3): reachableCells ya para el
// recorrido en seco al entrar en zona de control (regla 6), asi que basta escoger,
// de entre lo alcanzable, lo que minimiza la distancia Manhattan al Lord rival.
function bestAdvanceCell(unit, units, lords) {
  const cells = reachableCells(unit, units, lords)
  if (cells.length === 0) return null
  const enemyLord = unit.side === 'player' ? lords.enemy : lords.player
  return cells.reduce((best, cell) => (dist(cell, enemyLord) < dist(best, enemyLord) ? cell : best))
}

// Rematar al objetivo con menos vida al alcance (prioridad 1 de la IA), o al Lord
// si no hay unidades (prioridad 2). null si no hay nada al alcance.
function pickWeakestTarget(options, units) {
  const unitTargets = options.filter((t) => t.kind === 'unit')
  if (unitTargets.length > 0) {
    return unitTargets.reduce((best, t) =>
      units.find((u) => u.id === t.id).hp < units.find((u) => u.id === best.id).hp ? t : best
    )
  }
  return options.find((t) => t.kind === 'lord') || null
}

// IA enemiga minima (paso 10, seccion "IA enemiga minima" del documento), en su
// orden: (1) rematar al objetivo con menos vida al alcance, (2) atacar al Lord
// rival si esta al alcance, (3) avanzar hacia el Lord rival por la ruta mas corta
// disponible. La 4a prioridad del documento ("si esta bloqueada, atacar a quien
// bloquea") ya queda cubierta por la 1a: la regla 2.1 garantiza que cualquier
// enemigo adyacente es siempre un objetivo valido de ataque basico, asi que un
// bloqueador nunca llega a la fase de movimiento sin haber sido ya atacado antes.
// La IA favorece el especial de su cara tirada y, si no tiene targets, cae al
// ataque basico explicito (misma regla que el jugador).
function decideUnitAction(unit, rolled, units, lords) {
  let target = pickWeakestTarget(attackTargetsForFace(unit, rolled, units, lords), units)
  if (target) return { kind: 'attack', target }
  target = pickWeakestTarget(basicAttackTargets(unit, units, lords), units)
  if (target) return { kind: 'attack', target }
  const cell = bestAdvanceCell(unit, units, lords)
  if (cell) return { kind: 'move', cell }
  return { kind: 'none' }
}

// Resuelve el turno de Enemy entero -tirada, guardia, y la accion de cada unidad
// mas el Lord- sobre un estado local, sin tocar React hasta que el componente
// confirma el resultado. Enemy ya no se juega a mano (paso 10). Devuelve
// `steps`: la secuencia ordenada de pasos { units, playerLordHp, enemyLordHp,
// reserve, lines, fx } (paso 0 = la tirada) para que passTurn() la reproduzca
// de uno en uno con su pausa visible, en vez de confirmar todo de un tiron.
// `lines`/`fx` globales se mantienen porque algunos pasos se capturan a mitad
// de rama y conviene que sigan siendo la acumulacion total para el log final.
function runEnemyTurn(startUnits, startReserve, startPlayerLordHp, startEnemyLordHp, startRolls = {}) {
  const lords = BATTLE_LORDS
  const { next: rolledUnits, newRolls, lines: rollLines, lordFace } = rollSideDice(startUnits, 'enemy', lords)
  // Fase A: para leer relacion y contragolpe, la IA necesita la cara tirada del
  // DEFENSOR -si ataca a una unidad del jugador, esa cara esta en las tiradas
  // del bando propio (startRolls), no en las del rival (newRolls).
  const allRolls = { ...startRolls, ...newRolls }
  // Banco de Energia del rival (solo informativo, ver el estado en App()):
  // mismo calculo que rollDice() hace para el jugador, +1 por cara sin golpe.
  const enemyEnergyGained = Object.values(newRolls).filter((f) => yieldsEnergy(f.effect)).length
  let units = rolledUnits
  let playerLordHp = startPlayerLordHp
  let enemyLordHp = startEnemyLordHp
  let reserve = startReserve
  const lines = [...rollLines]
  let victory = null
  const fxEvents = []
  const floatEvents = []
  // Impactos de combate del rival: misma acumulacion que floatEvents, para
  // reproducirse por paso en passTurn().
  const impacts = []
  // Floats de la tirada del rival: caras de guardia que se aplican solas
  // (escudo ganado / cura inmediata) visibles en el paso 0.
  const rollFloats = []
  rolledUnits.forEach((u) => {
    if (!u.alive || u.side !== 'enemy') return
    const face = newRolls[u.id]
    if (!face || !GUARD_EFFECTS.has(face.effect)) return
    if (face.effect === 'guard-heal' && face.heal > 0) rollFloats.push({ text: `+${face.heal} HP`, variant: 'heal', ...u.pos })
    const val = faceValue(face)
    if (val > 0) rollFloats.push({ text: `+${val} shield`, variant: 'shield', ...u.pos })
  })
  // Paso 0: la tirada del rival. El estado es el que ha dejado rollSideDice
  // (escudos restablecidos, guardas aplicadas); pasos posteriores aplican sus
  // deltas sobre el resultado del paso anterior.
  const steps = [{ units, playerLordHp, enemyLordHp, reserve, lines: [...rollLines], fx: [], floatEvents: rollFloats }]
  // Captura el estado justo despues de cada accion: las nuevas lineas
  // generadas en esa rama y sus eventos fx van en el paso; `units`/hps son ya
  // los hagamos que el jugador debe ver al terminar el paso.
  const stepFrom = (mark, markFx, actor) =>
    steps.push({ units, playerLordHp, enemyLordHp, reserve, lines: lines.slice(mark), fx: fxEvents.slice(markFx), floatEvents: floatEvents.slice(markFx), impacts: impacts.slice(markFx), actor })

  const order = units.filter((u) => u.side === 'enemy' && u.alive && newRolls[u.id]).map((u) => u.id)
  for (const id of order) {
    if (victory) break
    const current = units.find((x) => x.id === id)
    if (!current || !current.alive || current.acted) continue
    const rolled = newRolls[id]
    const decision = decideUnitAction(current, rolled, units, lords)
    if (decision.kind === 'attack') {
      const mark = lines.length
      const markFx = fxEvents.length
      const result = applyUnitAttackLocal({ units, playerLordHp, enemyLordHp, rolls: allRolls }, current, rolled, decision.target)
      units = result.units
      playerLordHp = result.playerLordHp
      enemyLordHp = result.enemyLordHp
      lines.push(...result.lines)
      fxEvents.push({
        kind: 'attack', unitId: current.id, slot: rolled.slot ?? null,
        targetR: decision.target.pos?.r ?? PLAYER_LORD.r,
        targetC: decision.target.pos?.c ?? PLAYER_LORD.c,
      })
      if (result.counterFx) fxEvents.push(result.counterFx)
      floatEvents.push(...result.floatEvents)
      impacts.push(...result.impacts)
      stepFrom(mark, markFx, current.id)
      if (result.victory) victory = result.victory
      continue
    }
    if (rolled.effect === 'reposition-ally') {
      const allies = repositionableAllies(current, units)
      if (allies.length > 0) {
        const ally = allies[0]
        const dest = firstFreeNeighbor(ally.pos, ally.klass, units, lords)
        const mark = lines.length
        units = units.map((x) => (x.id === current.id ? { ...x, acted: true } : x))
        if (dest) {
          units = units.map((x) => (x.id === ally.id ? { ...x, pos: dest } : x))
          lines.push(`${labelOf(current)} repositions ${labelOf(ally)}.`)
        }
        stepFrom(mark, fxEvents.length, current.id)
        continue
      }
    }
    if (decision.kind === 'move') {
      const mark = lines.length
      // Mover no gasta la accion (mismo cambio que en el jugador). Tras
      // avanzar, la IA intenta un ataque -primero con su cara tirada
      // (especial) y si no hay objetivo, con el basico explicito.
      units = units.map((x) => (x.id === current.id ? { ...x, pos: decision.cell } : x))
        lines.push(`${labelOf(current)} advances.`)
      const movedUnit = units.find((x) => x.id === current.id)
      let followup = pickWeakestTarget(attackTargetsForFace(movedUnit, rolled, units, lords), units)
      const followupIsBasic = !followup
      if (!followup) followup = pickWeakestTarget(basicAttackTargets(movedUnit, units, lords), units)
      if (!followup) {
        units = units.map((x) => (x.id === current.id ? { ...x, acted: true } : x))
      }
      stepFrom(mark, fxEvents.length, current.id)
      if (followup) {
        const mark2 = lines.length
        const markFx2 = fxEvents.length
        const result = applyUnitAttackLocal({ units, playerLordHp, enemyLordHp, rolls: allRolls }, movedUnit, followupIsBasic ? null : rolled, followup)
        units = result.units
        playerLordHp = result.playerLordHp
        enemyLordHp = result.enemyLordHp
        lines.push(...result.lines)
        fxEvents.push({
          kind: 'attack', unitId: current.id, slot: followupIsBasic ? null : rolled.slot ?? null,
          targetR: followup.pos?.r ?? PLAYER_LORD.r,
          targetC: followup.pos?.c ?? PLAYER_LORD.c,
        })
        if (result.counterFx) fxEvents.push(result.counterFx)
        floatEvents.push(...result.floatEvents)
        impacts.push(...result.impacts)
        stepFrom(mark2, markFx2, current.id)
        if (result.victory) victory = result.victory
      }
    }
  }

  const lordMark = lines.length
  const lordMarkFx = fxEvents.length
  if (!victory && lordFace.effect === 'lord-attack') {
    const target = pickWeakestTarget(lordAttackTargets('enemy', units, lords), units)
    if (target) {
      let damage = LORD_STATS.atk
      const lordPos = lords.enemy
      const victimPos = target.kind === 'lord' ? PLAYER_LORD : units.find((u) => u.id === target.id).pos
      floatEvents.push({ text: 'Lord Attack', variant: 'cast', ...lordPos })
      if (target.kind === 'lord') {
        const next = Math.max(0, playerLordHp - damage)
        playerLordHp = next
        lines.push(`Enemy Lord fires at your Lord (-${damage}).`)
        floatEvents.push({ text: `-${damage}`, variant: 'damage', ...victimPos })
        if (next <= 0) victory = 'enemy-won'
      } else {
        const victim = units.find((u) => u.id === target.id)
        const marked = !!victim.marked
        if (marked) damage += 20
        let absorbed = 0
        let shieldConsumed = 0
        let terrainAbsorbed = 0
        // A5: la trinchera de zona lenta cubre a la unidad aunque el golpe venga
        // del Lord (misma regla que un ataque de unidad).
        const tBonus = terrainGuardBonus(victim.pos.r, victim.pos.c)
        absorbed = Math.min(victim.shield + tBonus, damage)
        const dealt = damage - absorbed
        shieldConsumed = Math.min(victim.shield, absorbed)
        terrainAbsorbed = Math.max(0, absorbed - shieldConsumed)
        if (shieldConsumed > 0) lines.push(`${labelOf(victim)}'s shield absorbs ${shieldConsumed}.`)
        if (terrainAbsorbed > 0) lines.push(`${labelOf(victim)}'s terrain absorbs ${terrainAbsorbed} of the guard.`)
        const killed = victim.hp - dealt <= 0
        lines.push(`Enemy Lord fires at ${labelOf(victim)} (-${dealt}).`)
        floatEvents.push({ text: `-${dealt}`, variant: 'damage', ...victimPos })
        if (shieldConsumed > 0) floatEvents.push({ text: `shield -${shieldConsumed}`, variant: 'shield', ...victimPos })
        if (terrainAbsorbed > 0) floatEvents.push({ text: `+${terrainAbsorbed} terrain guard`, variant: 'shield', ...victimPos })
        if (marked) lines.push(`${labelOf(victim)} was marked: +20 damage.`)
        if (marked) floatEvents.push({ text: '+20 marked', variant: 'buff', ...victimPos })
        if (killed) lines.push(`${labelOf(victim)} falls.`)
        units = units.map((u) =>
          u.id === target.id
            ? { ...u, hp: Math.max(0, u.hp - dealt), shield: Math.max(0, u.shield - shieldConsumed), alive: u.hp - dealt > 0, pos: u.hp - dealt > 0 ? u.pos : null, marked: false }
            : u
        )
        fxEvents.push({ kind: 'attack', unitId: 'lord-enemy', slot: null, targetR: target.pos.r, targetC: target.pos.c })
        impacts.push({ r: victimPos.r, c: victimPos.c, kind: 'lord', klass: 'lord', effect: 'lord-attack', atkR: lordPos.r, atkC: lordPos.c })
      }
    }
  } else if (!victory && lordFace.effect === 'lord-shield') {
    // Muro: protege al aliado propio con menos vida al alcance -quien mas lo
    // necesita, no el primero de la lista.
    const choices = lordShieldTargets('enemy', units, lords)
    if (choices.length > 0) {
      const weakest = choices.reduce((best, c) =>
        units.find((u) => u.id === c.id).hp < units.find((u) => u.id === best.id).hp ? c : best
      )
      const ally = units.find((u) => u.id === weakest.id)
      units = units.map((u) => (u.id === weakest.id ? { ...u, shield: Math.max(u.shield, 30) } : u))
      lines.push(`Enemy Lord shields ${labelOf(ally)} with Wall.`)
      floatEvents.push({ text: 'Wall', variant: 'cast', ...lords.enemy }, { text: '+30 shield', variant: 'shield', ...ally.pos })
    } else {
      lines.push('Enemy Lord has no one to protect with Wall.')
    }
  } else if (!victory && lordFace.effect === 'lord-mark') {
    // Marca: al enemigo (bando propio, desde el punto de vista de Enemy) con
    // menos vida al alcance -mismo criterio que pickWeakestTarget para ataques.
    const choices = lordMarkTargets('enemy', units, lords)
    if (choices.length > 0) {
      const weakest = choices.reduce((best, c) =>
        units.find((u) => u.id === c.id).hp < units.find((u) => u.id === best.id).hp ? c : best
      )
      const victim = units.find((u) => u.id === weakest.id)
      units = units.map((u) => (u.id === weakest.id ? { ...u, marked: true } : u))
      lines.push(`Enemy Lord marks ${labelOf(victim)}.`)
      floatEvents.push({ text: 'Mark', variant: 'cast', ...lords.enemy }, { text: 'Marked', variant: 'buff', ...victim.pos })
    } else {
      lines.push('Enemy Lord has no one to mark.')
    }
  } else if (!victory && lordFace.effect === 'lord-heal') {
    // Cura: al aliado propio con menos vida al alcance -mismo criterio que Muro.
    const choices = lordHealTargets('enemy', units, lords)
    if (choices.length > 0) {
      const weakest = choices.reduce((best, c) =>
        units.find((u) => u.id === c.id).hp < units.find((u) => u.id === best.id).hp ? c : best
      )
      const ally = units.find((u) => u.id === weakest.id)
      units = units.map((u) => (u.id === weakest.id ? { ...u, hp: Math.min(u.maxHp, u.hp + 15) } : u))
      lines.push(`Enemy Lord heals ${labelOf(ally)}.`)
      floatEvents.push({ text: 'Heal', variant: 'cast', ...lords.enemy }, { text: '+15 HP', variant: 'heal', ...ally.pos })
    } else {
      lines.push('Enemy Lord has no one to heal.')
    }
  } else if (!victory && lordFace.effect === 'lord-buff') {
    // Templanza: al aliado propio con MAS vida al alcance -el que mas
    // probable es que llegue a atacar y aproveche el bonus, no el herido
    // (para eso ya esta Cura/Muro).
    const choices = lordBuffTargets('enemy', units, lords)
    if (choices.length > 0) {
      const strongest = choices.reduce((best, c) =>
        units.find((u) => u.id === c.id).hp > units.find((u) => u.id === best.id).hp ? c : best
      )
      const ally = units.find((u) => u.id === strongest.id)
      units = units.map((u) => (u.id === strongest.id ? { ...u, buffed: true } : u))
      lines.push(`Enemy Lord blesses ${labelOf(ally)} with Temperance.`)
      floatEvents.push({ text: 'Temperance', variant: 'cast', ...lords.enemy }, { text: '+15 damage', variant: 'buff', ...ally.pos })
    } else {
      lines.push('Enemy Lord has no one to bless.')
    }
  } else if (!victory && lordFace.effect === 'lord-clone') {
    // Duplicar: al aliado propio con MAS vida al alcance -refuerza la punta de
    // lanza, para reponer al herido ya esta Cura/Muro. Si no hay a quien
    // clonar, cae a la reserva (misma cara cubre las dos, ver LORD_DIE en
    // axie.js).
    const choices = lordCloneTargets('enemy', units, lords)
    if (choices.length > 0) {
      const strongest = choices.reduce((best, c) =>
        units.find((u) => u.id === c.id).hp > units.find((u) => u.id === best.id).hp ? c : best
      )
      const original = units.find((u) => u.id === strongest.id)
      const cells = lordSummonTargets('enemy', units, lords, original.klass)
      if (cells.length > 0) {
        units = [...units, makeUnit('enemy', original.klass, nextCloneId('enemy', units), cells[0], { starterEnemy: !!original.name })]
        lines.push(`Enemy Lord duplicates ${labelOf(original)}.`)
        floatEvents.push({ text: 'Duplicate', variant: 'cast', ...lords.enemy }, { text: 'Clone', variant: 'info', ...cells[0] })
      } else {
        lines.push('Enemy Lord has no free cell next to it to duplicate.')
      }
    } else if (reserve.enemy.length > 0) {
      const cells = lordSummonTargets('enemy', units, lords, reserve.enemy[0].klass)
      if (cells.length > 0) {
        const [summoned, ...rest] = reserve.enemy
        reserve = { ...reserve, enemy: rest }
        units = [...units, { ...summoned, pos: cells[0] }]
        lines.push(`Enemy Lord summons ${labelOf(summoned)}.`)
        floatEvents.push({ text: 'Summon', variant: 'cast', ...cells[0] })
      } else {
        lines.push('Enemy Lord has no free cell to summon.')
      }
    } else {
      lines.push('Enemy Lord has nothing to duplicate and no reserve to summon.')
    }
  }
  // El paso del Lord se captura solo si la rama genero algo que mostrar (un
  // ataque, una habilidad aplicada o un "no tiene a quien" informativo).
  if (lines.length > lordMark || fxEvents.length > lordMarkFx) stepFrom(lordMark, lordMarkFx, 'lord-enemy')

  // rolls: newRolls SI se calculaba aqui (rollSideDice, arriba) y se usaba
  // para decidir la IA y armar `lines`, pero si no sale de la funcion,
  // passTurn() nunca puede llamar a setRolls con el resultado del rival -y
  // rolls[u.id] del rival se queda siempre null: Die3D nunca recibe un
  // rolledSlot valido y el cubo nunca llega a "aterrizar" de verdad en la cara
  // correcta (se queda con la pose que tuviera de antes).
  return { units, reserve, playerLordHp, enemyLordHp, lines, victory, fx: fxEvents, rolls: newRolls, steps, lordFace, enemyEnergyGained }
}

// HpBar, ShieldBar, ClassEmblem, CrownEmblem, ShieldEmblem, PartLogo,
// HeartEmblem viven en components/Emblems.jsx (sin closures sobre estado de
// partida, movidos tal cual).

export default function App() {
  const [units, setUnits] = useState(() => [
    ...makeInitialBoard('player', PLAYER_TEAM, { starterEnemy: false }),
    ...makeInitialBoard('enemy', MATCH_DEFAULT.enemyClasses, { starterEnemy: true }),
  ])
  const [playerLordHp, setPlayerLordHp] = useState(LORD_STATS.hp)
  const [enemyLordHp, setEnemyLordHp] = useState(LORD_STATS.hp)

  // Meta-estado de sesion (first-approach de las pantallas meta, no toca la
  // partida): monedas y mejoras visibles en Base/Recursos/Investigacion. Vive
  // aqui para que sobreviva a los cambios de pestana; se reinicia solo si se
  // recarga el navegador. Sin on-chain (CLAUDE.md: nada de cadena en prototipo).
  // `augments` es la memoria del Laboratorio persistente por CLASE (el roster
  // de una clase siempre es el mismo axie): {beast:{evolved:{horn:true},
  // blocked:{tail:true}}}, etc. El equipo en tablero lo ACOPLA makeUnit en cada
  // resetMatch (los cambios del laboratorio aplican cuando tocas "Jugar").
  // `essence` arranca en 2 monedas de regalo (la primera evolucion o bloqueo
  // cuesta 1) para que el laboratorio sea utilizable desde la primera sesion.
  const [meta, setMeta] = useState({ essence: 2, axp: 0, upgrades: {}, augments: {}, wins: {} })
  const [villageResources, setVillageResources] = useState({ wood: 0, stone: 0, food: 0 })
  // Partida cargada: config de la zona desde la que se entro (MAP on `Jugar`
  // desde el hub/mapa). La usan Roster (titulo del bando enemigo) y el render.
  const [matchInfo, setMatchInfo] = useState(MATCH_DEFAULT)
  // Contador de partidas empieza en 1 (el useRef se inicializa con null y el
  // primer matchId real es (count-1)+1=1). Sube en cada resetMatch; se pasa a
  // BoardRegion como key para que el tablero 3D se reconstruya con el terreno
  // NUEVO de la zona (sin key, Three.js reutilizaria la escena vieja).
  const [matchSeq, setMatchSeq] = useState(0)
  const { route: hashRoute, navigate } = useHashRoute()
  const [sessionStarted, setSessionStarted] = useState(false)
  // La portada es la puerta de entrada de la demo. Si el navegador conserva
  // #/partida o se abre esa ruta directamente, no se debe montar el tablero
  // antes de que el usuario haya entrado en la sesion.
  const route = hashRoute === 'partida' && !sessionStarted ? 'portada' : hashRoute
  const isMeta = route !== 'partida'
  // Portada: pantalla de titulo, sin la barra de la app encima (ni HUD ni
  // pestanas de MetaNav tienen sentido antes de "entrar").
  const isCover = route === 'portada'
  const invest = (key) =>
    setMeta((m) =>
      m.essence >= 2
        ? { ...m, essence: m.essence - 2, upgrades: { ...m.upgrades, [key]: (m.upgrades[key] || 0) + 1 } }
        : m,
    )
  // Laboratorio (pantalla de evolucion): evolve(klass, slot) marca la parte de
  // esa clase como EVOLUCIONADA (cuesta 1 esencia; es irreversible -reescribe
  // esa cara del dado con +10, la premisa "ascender reescribe una cara").
  // toggleBlock(klass, slot) bloquea/desbloquea esa parte para la tirada
  // (activeDie la excluye, asi sube la probabilidad de las caras utiles).
  // Las partes evolucionadas NO se pueden bloquear (quedan siempre en el dado).
  const evolve = (klass, slot) =>
    setMeta((m) => {
      if (m.essence < 1) return m
      const aug = m.augments[klass] || {}
      const blocked = { ...(aug.blocked || {}) }
      delete blocked[slot]
      return {
        ...m,
        essence: m.essence - 1,
        augments: {
          ...m.augments,
          [klass]: { ...aug, evolved: { ...(aug.evolved || {}), [slot]: true }, blocked },
        },
      }
    })
  const toggleBlock = (klass, slot) =>
    setMeta((m) => {
      const aug = m.augments[klass] || {}
      if ((aug.evolved || {})[slot]) return m
      const blocked = { ...(aug.blocked || {}) }
      if (blocked[slot]) delete blocked[slot]
      else blocked[slot] = true
      return { ...m, augments: { ...m.augments, [klass]: { ...aug, blocked } } }
    })
  // Entrar desde el hub/mapa a una partida CONCRETA: startMatch(cfg) resetea la
  // partida con esa config del mapa. goPlay() es el boton de "Partida libre"
  // clasica (escarmuza de prueba del MVP1, sin cambios).
  const startMatch = (cfg) => {
    setSessionStarted(true)
    resetMatch(cfg)
    navigate('partida')
  }
  const goPlay = () => startMatch(MATCH_DEFAULT)
  // PVP "Emparejar": el boton de la sala abierta lanzaba una partida PVE
  // (goPlay -> MATCH_DEFAULT.mode:'pve'), asi que nunca se veia el timer de
  // turno ni la prorroga en el PVP. Construye una config PVP real (modo pvp +
  // rival normal, sin starters) con el mismo rival/equipo del PVE clasico.
  const goPlayPvp = () => startMatch({
    zone: 'pvp-libre',
    mode: 'pvp',
    enemyTitle: 'PVP Rival',
    blurb: 'Local matchmaking against the AI (ranked combat mockup).',
    enemyClasses: [...PLAYER_TEAM],
    starterEnemy: false,
    hpScale: 1,
    reward: 2,
    terrain: TEST_TERRAIN,
  })
  // Fin de partida centralizado: la recompensa de esencia y el desbloqueo de
  // regiones del hub/mapa se conceden UNA vez por partida (guarda de ref -la
  // victoria solo debe liquidarse una vez aunque el estado toque setStatus por
  // varios caminos). cfg.reward es la recompensa de la zona (gameMissions).
  // meta.wins[cfg.zone] alimenta el mapa: al ganar una zona PVE se habilita
  // la siguiente region (LunaciaMap).
  const endOfMatchRef = useRef(false)
  const endOfMatch = (nextStatus) => {
    if (nextStatus !== 'playing' && !endOfMatchRef.current) {
      endOfMatchRef.current = true
      if (nextStatus === 'player-won') {
        const r = matchInfo.reward || 0
        if (r > 0) {
          setMeta((m) => ({
            ...m,
            essence: m.essence + r,
            wins: {
              ...m.wins,
              [matchInfo.zone]: (m.wins[matchInfo.zone] || 0) + 1,
              [matchInfo.winKey || matchInfo.zone]: (m.wins[matchInfo.winKey || matchInfo.zone] || 0) + 1,
            },
          }))
          pushLog(
            matchInfo.mode === 'pve'
              ? `Victory in ${matchInfo.name}: +${r} essence and the zone is cleared.`
              : `Victory in ${matchInfo.name}: +${r} essence.`,
          )
        }
      }
    }
    setStatus(nextStatus)
  }
  const META_SCREENS = {
    portada: <CoverScreen onEnter={() => { setSessionStarted(true); navigate('aldea') }} onPlay={goPlay} />,
    base: <VillageScene onResourcesChange={setVillageResources} />,
    aldea: <VillageScene onResourcesChange={setVillageResources} />,
    recursos: <VillageScene onResourcesChange={setVillageResources} />,
    investigacion: <ResearchScreen units={units} meta={meta} invest={invest} />,
    evolucion: (
      <LaboratoryScreen essence={meta.essence} augments={meta.augments} onEvolve={evolve} onToggleBlock={toggleBlock} onPlay={goPlay} />
    ),
    pve: (
      <PveScreen
        wins={meta.wins}
        onPlay={(cfg) => startMatch(cfg || MATCH_DEFAULT)}
        onPlayFree={goPlay}
      />
    ),
    pvp: <PvpScreen onPlay={(cfg) => startMatch(cfg || MATCH_DEFAULT)} onPlayFree={goPlayPvp} />,
  }
  const [reserve, setReserve] = useState(() => ({
    player: makeInitialReserve('player', PLAYER_TEAM, { starterEnemy: false }),
    enemy: makeInitialReserve('enemy', MATCH_DEFAULT.enemyClasses, { starterEnemy: true }),
  }))
  const [lordRoll, setLordRoll] = useState({ player: null, enemy: null })
  const [lordActed, setLordActed] = useState({ player: false, enemy: false })
  // Sube en cada tirada de Player para que la cara ganadora reinicie su animacion
  // de giro (paso "pulido visual"): forzar un key distinto es lo que hace que el
  // CSS vuelva a reproducirse aunque sea la misma cara que la ultima vez.
  const [rollTick, setRollTick] = useState(0)
  // El tablero es una escena 3D real (Board3D.jsx, Three.js vanilla + bloques GLB
  // de Kenney), no un truco de CSS. Board3D se encarga solo de su propio tamano
  // (ResizeObserver interno) y nos avisa (onBoard3DTransform) con una matriz CSS
  // `matrix(a,b,c,d,e,f)` -la camara es ortografica (sin escorzo de perspectiva),
  // asi que la proyeccion 3D->pantalla es una transformacion afin: esa unica
  // matriz alinea TODO el grid interactivo de golpe con la escena renderizada,
  // sin recalcular nada celda por celda.
  const boardColRef = useRef(null)
  // Cortina de carga (T4): el tablero 3D tarda un instante en montarse (cargan
  // los bloques GLB del terreno y los axies con el mixer). boardReady lo pone en
  // true Board3D la primera vez que el terreno esta listo y ya no quedan unidades
  // pendientes (onReady en Board3D.jsx) -mientras tanto, una cortina con marca
  // de agua cubre la pantalla para que no se vea la escena a medio construir.
  const [boardReady, setBoardReady] = useState(false)
  // Canal fx (T1, animaciones): App.jsx no sabe nada de Three.js, pero los eventos
  // que hacen que el tablero "reaccione" (quien ataca y con que parte) se emiten
  // aqui como objetos {kind:'attack', unitId, slot} y Board3D los convierte en
  // clips de animacion (attack/melee/<slot>). Los ids crecen siempre; Board3D solo
  // consume los que todavia no ha visto.
  const [fxQueue, setFxQueue] = useState([])
  const fxIdRef = useRef(1)
  function pushFx(events) {
    if (!events || events.length === 0) return
    for (const event of events) {
      const { delay = 0, ...payload } = event
      window.setTimeout(() => {
        setFxQueue((prev) => prev.concat({ id: fxIdRef.current++, ...payload }))
      }, delay)
    }
  }
  // Feedback visual de combate (T3): numeros que flotan sobre las casillas del
  // tablero (dano, escudo absorbido, curaciones, marcas, nombre de la habilidad
  // que se esta usando). Nota: NO sirve el array de estados de dentro del
  // renderer 3D; estos floats viven en el overlay de React (BoardRegion.jsx),
  // alineados por la MISMA matriz CSS que el grid interactivo, asi que las
  // posiciones son celdas (r,c), no coordenadas del canvas.
  const COMBAT_FLOAT_MS = 1500
  const [floats, setFloats] = useState([])
  const floatIdRef = useRef(1)
  function pushFloats(items) {
    if (!items || items.length === 0) return
    for (const item of items) {
      const delay = item.delay ?? ((item.variant === 'damage' || item.variant === 'shield') ? ATTACK_IMPACT_DELAY_MS : 0)
      const { delay: _ignored, ...float } = item
      window.setTimeout(() => {
        const stamped = { id: floatIdRef.current++, ...float }
        setFloats((prev) => prev.concat(stamped))
        window.setTimeout(() => {
          setFloats((prev) => prev.filter((f) => f.id !== stamped.id))
        }, COMBAT_FLOAT_MS)
      }, delay)
    }
  }
  // Impactos de combate: celdas que reciben anillo de impacto y sacudida del
  // tablero (golpe primario, contragolpe, ataque del Lord). Canal aparte de
  // floats: viven mas poco (IMPACT_MS) y disparan la clase .board-shake en
  // BoardRegion.
  const IMPACT_MS = 650
  const [impacts, setImpacts] = useState([])
  const impactIdRef = useRef(1)
  function pushImpacts(items) {
    if (!items || items.length === 0) return
    for (const item of items) {
      const { delay = 0, ...impact } = item
      window.setTimeout(() => {
        const stamped = { id: impactIdRef.current++, ...impact }
        setImpacts((prev) => prev.concat(stamped))
        pushFx([
          { kind: 'camera-impact' },
          { kind: 'impact-particles', r: impact.r, c: impact.c, impactKind: impact.kind },
        ])
        window.setTimeout(() => {
          setImpacts((prev) => prev.filter((i) => i.id !== stamped.id))
        }, IMPACT_MS)
      }, delay)
    }
  }
  // Paso 10: Enemy ya no se juega a mano, su turno entero se resuelve dentro de
  // passTurn() -activeSide se queda fijo en 'player' para toda la UI interactiva.
  const activeSide = 'player'
  const [turnCount, setTurnCount] = useState(1)
  const [rolls, setRolls] = useState({})
  // Banco de Energia (A3, seccion 6.4): +1 por cada cara sin golpe tirada en
  // este turno (guarda/invocacion/reposicion/utilidad), tope ENERGY_CAP (5), se
  // vacia al iniciar el turno propio. `boostArmed`: el jugador gasta 2 Energia
  // para que el siguiente golpe de la unidad seleccionada haga +10 (se consume
  // al impactar igual que marked/buffed).
  const [energyBank, setEnergyBank] = useState(0)
  // Banco de Energia del RIVAL: mismo calculo (+1 por cara sin golpe) pero
  // sobre la tirada del enemigo dentro de runEnemyTurn, ver
  // `enemyEnergyGained` en su retorno. Solo informativo -la IA no gasta
  // Energia en nada todavia (A3 solo cubre el gasto del jugador), asi que
  // este numero no se consume, solo se vuelve a calcular entero en cada turno
  // del rival (se resetea a 0 en su tirada, igual que el del jugador se
  // resetea en la suya).
  const [enemyEnergyBank, setEnemyEnergyBank] = useState(0)
  const [boostArmed, setBoostArmed] = useState(false)
  // `moveBoostArmed`: el jugador gasta 2 Energia para que la unidad
  // seleccionada mueva 1 casilla extra este turno (independiente de
  // boostArmed -una unidad puede mover+1 y despues, si gana el remate de
  // "primer contacto", tambien golpear+10, si le llega la banca).
  const [moveBoostArmed, setMoveBoostArmed] = useState(false)
  // Preview del intercambio (A2.3): la celda bajo el cursor marca sobre que
  // objetivo se calcula el desglose del ActionPad (no es estado de partida).
  const [hoverCell, setHoverCell] = useState(null)
  const [selected, setSelected] = useState(null)
  // Que ataque se resuelve al tocar un objetivo. 'special' = la cara tirada
  // de la unidad; 'basic' = el golpe basico de su clase (regla 2.1). El modo
  // efectivo cae a basic si la cara no trae especial (guardia/reposicion).
  const [attackMode, setAttackMode] = useState('special')
  const [status, setStatus] = useState('playing')
  // Fase de "lanzamiento de dados": las caras se ven barajandose un instante y
  // al commit cae la cara ganadora con la animacion de aterrizaje.
  // rollPendingRef guarda el timeout para poder cancelarlo si se reinicia la
  // partida a mitad de tirada.
  const [rolling, setRolling] = useState(false)
  const rollPendingRef = useRef(null)
  // Turno del rival en vivo (secuencia animada): mientras pasa, toda la UI
  // interactiva queda congelada (paso 10).
  const [enemyTurnRunning, setEnemyTurnRunning] = useState(false)
  const [enemyActing, setEnemyActing] = useState(null)
  // Token de cancelacion: reiniciar la partida a mitad de la secuencia del
  // rival aborta la cola de pasos pendientes (mismo patron que rollPendingRef).
  const enemyTurnTokenRef = useRef(0)
  // Referencia a las versiones MAS RECIENTES de passTurn/rollDice: el
  // cronometro PVP las llama desde un setInterval que se crea una sola vez
  // por turno; si capturara las funciones directamente, ejecutaria el
  // auto-pase con estado obsoleto (una partida que cambio durante la espera).
  const autoPassRef = useRef(null)
  // MUERTE SUBITA / prorroga PVP: estado de UI (banner + HUD) que refleja el
  // flag de modulo OVERTIME_ACTIVE -se activa al pasar de la ronda 8 en
  // partidas pvp y apaga al reiniciar. El flag real vive fuera de React para
  // que effectiveMove() y el daño lo lean sin re-render (mismo patron que
  // TERRAIN_LAYOUT).
  const [overtime, setOvertime] = useState(false)
  // Cronometro del turno del jugador en PVP (20 s). turnSecondsLeft cuenta en
  // segundos para la UI; el efecto de App.jsx lo cuenta y, al llegar a 0,
  // tira los dados si no se habia tirado y pasa el turno (sin mover/atacar).
  const [turnSecondsLeft, setTurnSecondsLeft] = useState(PVP_TURN_MS / 1000)
  const turnSecondsRef = useRef(PVP_TURN_MS / 1000)
  const [log, setLog] = useState(['The siege begins. Roll the dice, Player.'])

  const lords = BATTLE_LORDS
  const pushLog = (line) => setLog((l) => [line, ...l].slice(0, 7))

  const selectedUnit = selected && selected !== 'lord' ? units.find((u) => u.id === selected && u.alive && u.pos) : null
  const selectedRoll = selectedUnit ? rolls[selectedUnit.id] : null
  const isReposition = selectedRoll?.effect === 'reposition-ally'
  // Una unidad que YA se movio este turno (`moved`) no puede volver a
  // moverse -solo atacar. La seleccion no se cierra al moverse, asi que el
  // ataque basico o especial se decide con la unidad ya en su casilla nueva.
  //
  // Cualquier unidad puede moverse con cualquier cara: la reposicion (mover a
  // un aliado) es una opcion ADEMAS del propio movimiento, no en su lugar.
  const moveCells =
    selectedUnit && selectedRoll && !selectedUnit.moved
      ? reachableCells(selectedUnit, units, lords, effectiveMove(selectedUnit.klass) + (moveBoostArmed ? 1 : 0))
      : []

  const lordSelected = selected === 'lord'
  const activeLordRoll = lordRoll[activeSide]
  const nextReserveKlass = reserve[activeSide][0]?.klass
  const lordAttackable = lordSelected && !lordActed[activeSide] && activeLordRoll?.effect === 'lord-attack'
  // Muro/Cura/Templanza/Duplicar apuntan a un aliado propio, igual que
  // Swallow -por eso comparten el mismo resaltado que `allyChoices` mas
  // abajo, en vez de inventar un color de casilla nuevo por cada una.
  const lordShieldable = lordSelected && !lordActed[activeSide] && activeLordRoll?.effect === 'lord-shield'
  const lordMarkable = lordSelected && !lordActed[activeSide] && activeLordRoll?.effect === 'lord-mark'
  const lordHealable = lordSelected && !lordActed[activeSide] && activeLordRoll?.effect === 'lord-heal'
  const lordBuffable = lordSelected && !lordActed[activeSide] && activeLordRoll?.effect === 'lord-buff'
  const lordCloneable = lordSelected && !lordActed[activeSide] && activeLordRoll?.effect === 'lord-clone'
  const lordTargets = useMemo(() => (
    lordAttackable
      ? lordAttackTargets(activeSide, units, lords)
      : lordMarkable
        ? lordMarkTargets(activeSide, units, lords)
        : []
  ), [lordAttackable, lordMarkable, activeSide, units, lords])
  // Duplicar es la UNICA cara que puede meter una unidad nueva en el
  // tablero. Cubre tanto clonar un aliado (allyChoices, abajo) como sacar de
  // la reserva (estas celdas) -el jugador elige con el click cual de las dos
  // quiere. Por eso lordSummonCells depende de Duplicar, no de una cara de
  // invocacion propia.
  const lordSummonCells = lordCloneable ? lordSummonTargets(activeSide, units, lords, nextReserveKlass) : []

  // Aliado a elegir: reposicion (Swallow) si hay una unidad seleccionada
  // con esa cara, o si no, la habilidad de apoyo del Lord que toque -son
  // mutuamente excluyentes (solo una fuente de seleccion activa a la vez),
  // asi que comparten esta lista y su resaltado en el tablero sin conflicto.
  const allyChoices =
    selectedUnit && isReposition
      ? repositionableAllies(selectedUnit, units)
      : lordShieldable
        ? lordShieldTargets(activeSide, units, lords)
        : lordHealable
          ? lordHealTargets(activeSide, units, lords)
          : lordBuffable
            ? lordBuffTargets(activeSide, units, lords)
            : lordCloneable
              ? lordCloneTargets(activeSide, units, lords)
              : []

  // Objetivos de ataque del jugador: se calculan los dos juegos -la cara
  // tirada (`specialTargets`, el "especial") y el golpe basico de la clase
  // (`basicTgts`, regla 2.1)- y el modo elegido decide cual resaltar y contra
  // cual atacar. Si la cara no trae especial (guardia/reposicion), el modo
  // efectivo cae solo a basico para que nunca se cierre la posibilidad de
  // actuar.
  const specialTargets = useMemo(
    () => (selectedUnit && selectedRoll ? attackTargetsForFace(selectedUnit, selectedRoll, units, lords) : []),
    [selectedUnit, selectedRoll, units, lords],
  )
  const basicTgts = useMemo(
    () => (selectedUnit ? basicAttackTargets(selectedUnit, units, lords) : []),
    [selectedUnit, units, lords],
  )
  const hasSpecial = specialTargets.length > 0
  const hasBasic = basicTgts.length > 0
  const effectiveMode = selectedUnit && hasSpecial && attackMode !== 'basic' ? 'special' : 'basic'

  const targets = useMemo(
    () => (selectedUnit && !isReposition ? (effectiveMode === 'basic' ? basicTgts : specialTargets) : lordTargets),
    [selectedUnit, isReposition, effectiveMode, basicTgts, specialTargets, lordTargets],
  )

  // Proyección táctica: al pasar el cursor por una casilla de movimiento no se
  // cambia la posición real. Se simula esa posición y se recalculan los
  // objetivos desde allí para que el jugador vea el siguiente paso antes de
  // confirmar el movimiento.
  const projectedMoveCell = selectedUnit && hoverCell && moveCells.some((cell) => cell.r === hoverCell.r && cell.c === hoverCell.c)
    ? hoverCell
    : null
  const projectedUnit = projectedMoveCell ? { ...selectedUnit, pos: projectedMoveCell } : null
  const projectedPath = projectedMoveCell
    ? findGridPath(selectedUnit.pos, projectedMoveCell, {
        rows: ROWS,
        cols: COLS,
        isPassable: (cell) => cellPassable(cell.r, cell.c, selectedUnit.klass),
        getCost: (_from, to) => TERRAIN_TYPES[terrainAt(to.r, to.c)]?.moveCost ?? Infinity,
        canEnter: (cell) => !cellOccupied(cell.r, cell.c, units, lords),
      })
    : null
  const projectedSpecialTargets = projectedUnit && selectedRoll
    ? attackTargetsForFace(projectedUnit, selectedRoll, units, lords)
    : []
  const projectedBasicTargets = projectedUnit ? basicAttackTargets(projectedUnit, units, lords) : []
  const projectedTargets = projectedUnit && !isReposition
    ? (effectiveMode === 'basic' ? projectedBasicTargets : projectedSpecialTargets)
    : []
  const projectedAttackInfo = projectedUnit && projectedTargets.length > 0 && (effectiveMode === 'basic' || selectedRoll)
    ? projectedTargets.map((target) => {
        const rolled = effectiveMode === 'basic' ? null : selectedRoll
        const ex = describeExchange(projectedUnit, rolled, target, units, playerLordHp, enemyLordHp, rolls)
        const targetUnit = target.kind === 'unit' ? units.find((u) => u.id === target.id) : null
        return {
          target: target.kind === 'lord' ? 'Lord' : targetUnit ? labelOf(targetUnit) : 'Objetivo',
          dealt: ex.dealt,
          counter: ex.counter?.dealt ?? 0,
          killed: ex.killed,
          relation: ex.relation,
        }
      })
    : []

  // Preview del intercambio (6.3.3): cuando el cursor esta sobre una casilla de
  // ataque, se calcula el desglose del golpe (dano real, rotura y vuelta del
  // rival) para el ActionPad. Es puro: describeExchange comparte la misma
  // resolucion que el golpe real, asi la preview nunca miente.
  const exchangeInfo = useMemo(() => {
    if (!hoverCell || !selectedUnit) return null
    const target = targets.find((t) => t.pos.r === hoverCell.r && t.pos.c === hoverCell.c)
    if (!target) return null
    const rolled = effectiveMode === 'basic' ? null : selectedRoll
    if (effectiveMode !== 'basic' && !rolled) return null
    const ex = describeExchange(selectedUnit, rolled, target, units, playerLordHp, enemyLordHp, rolls)
    const items = []
    const shieldNote =
      ex.terrainAbsorbed > 0 ? ` (shield absorbs ${ex.absorbed - ex.terrainAbsorbed} + ${ex.terrainAbsorbed} from terrain)` : ex.absorbed > 0 ? ` (shield absorbs ${ex.absorbed})` : ''
    items.push(`${ex.actionName}: ${ex.dealt} damage of ${ex.damage}${shieldNote}.`)
    if (ex.relation === 'advantage') {
      items.push(ex.broke ? `Advantage (face ${ex.defenderFace?.name ?? 'unknown'}): BREAK, cannot counter.` : 'Advantage, but Break does not apply (no real damage).')
    } else if (ex.relation === 'disadvantage') {
      items.push(`Disadvantage (face ${ex.defenderFace?.name ?? 'unknown'}): this strike does not break and its counter will still land.`)
    } else if (ex.relation === 'neutral') {
      items.push('Neutral exchange (no advantage).')
    }
    if (ex.killed) {
      items.push('Target falls: no counter.')
    } else if (ex.counter) {
      items.push(`Enemy counter: ${ex.counter.name} -${ex.counter.dealt}.`)
    } else if (ex.broke) {
      items.push('No counter (Break).')
    } else {
      items.push('No counter.')
    }
    // La preview tambien entrega la afinidad ya aplicada y la estadistica de
    // critico (probabilidad y multiplicador de la clase + parte del
    // golpeador), para que el ActionPad las muestre como chips. La tirada
    // real del critico NO vive aqui (la decide rollCrit en el aplicador).
    return { lines: items, affinity: ex.affinity, crit: ex.crit }
  }, [hoverCell, selectedUnit, selectedRoll, effectiveMode, targets, units, playerLordHp, enemyLordHp, rolls])

  // Axies 3D reales del tablero (Board3D.jsx): todo el roster vivo + los dos
  // Lords, cada uno en su celda real. Por defecto cada unidad mira hacia el
  // Lord rival; si es la unidad seleccionada AHORA MISMO y tiene objetivos de
  // ataque disponibles (`targets`, ya calculado arriba para el resaltado del
  // grid), mira al mas cercano de esos objetivos en su lugar. Genes reales por
  // unidad (axieGeneCatalog.js, sacados en vivo del marketplace de Axie, no
  // inventados) -AXIE_SAMPLE_GENES se queda solo de red de seguridad por si
  // `klass` no tuviera entrada en el catalogo.
  const axieUnits = useMemo(() => {
    const nearestPos = (fromPos, list) => {
      let best = null
      let bestDist = Infinity
      for (const t of list) {
        const d = Math.max(Math.abs(t.pos.r - fromPos.r), Math.abs(t.pos.c - fromPos.c))
        if (d < bestDist) {
          bestDist = d
          best = t.pos
        }
      }
      return best
    }

    const list = []
    units.forEach((u) => {
      if (!u.alive) return
      const rivalLordPos = u.side === 'player' ? ENEMY_LORD : PLAYER_LORD
      const isActing = selectedUnit && selectedUnit.id === u.id && targets.length > 0
      const facing = isActing ? nearestPos(u.pos, targets) || rivalLordPos : rivalLordPos
      const descriptor = ROSTER_DESCRIPTORS[u.side]?.[u.klass]
      list.push(
        descriptor
          ? { id: u.id, r: u.pos.r, c: u.pos.c, descriptor, isLord: false, facing, side: u.side, hp: u.hp, maxHp: u.maxHp, movePath: u.movePath }
          : { id: u.id, r: u.pos.r, c: u.pos.c, genes: AXIE_SAMPLE_GENES, isLord: false, facing, side: u.side, hp: u.hp, maxHp: u.maxHp, movePath: u.movePath },
      )
    })

    const playerActing = lordSelected && activeSide === 'player' && targets.length > 0
    list.push({
      id: 'lord-player',
      r: PLAYER_LORD.r,
      c: PLAYER_LORD.c,
      descriptor: LORD_DESCRIPTORS.player,
      isLord: true,
      facing: playerActing ? nearestPos(PLAYER_LORD, targets) || ENEMY_LORD : ENEMY_LORD,
      side: 'player',
      hp: playerLordHp,
      maxHp: LORD_STATS.hp,
    })

    const enemyActing = lordSelected && activeSide === 'enemy' && targets.length > 0
    list.push({
      id: 'lord-enemy',
      r: ENEMY_LORD.r,
      c: ENEMY_LORD.c,
      descriptor: LORD_DESCRIPTORS.enemy,
      isLord: true,
      facing: enemyActing ? nearestPos(ENEMY_LORD, targets) || PLAYER_LORD : PLAYER_LORD,
      side: 'enemy',
      hp: enemyLordHp,
      maxHp: LORD_STATS.hp,
    })

    return list
  }, [units, selectedUnit, targets, lordSelected, playerLordHp, enemyLordHp])

  // Un dado por unidad, tirado una vez al inicio del turno (regla 7). Los escudos
  // dan hasta el final del siguiente turno rival (regla 12): como ya paso un turno
  // rival entero desde la ultima vez que tiro este bando, caducan aqui, antes de la
  // tirada nueva. Las caras de guardia se aplican solas, sin gastar la accion (regla 11).
  function rollDice() {
    // El bando rival tambien guarda su tirada en `rolls`, asi que `rolls` no
    // se vacia entre turnos -"ya ha tirado" hay que mirarlo SOLO para el
    // bando activo, no para cualquier entrada que quede de un turno anterior
    // del otro bando.
    if (status !== 'playing' || units.some((u) => u.side === activeSide && u.alive && rolls[u.id])) return
    setRollTick((t) => t + 1)
    let next = units.map((u) => (u.side === activeSide ? { ...u, shield: 0, broken: false, moved: false, dealtDamage: false } : u))
    const newRolls = {}
    const lines = []
    const lordFace = rollFace(LORD_DIE)
    lines.push(`${sideLabel(activeSide)} Lord: ${lordFace.name}.`)
    next.forEach((u) => {
      if (!u.alive || u.side !== activeSide) return
      const face = rollFace(activeDie(u))
      newRolls[u.id] = face
      lines.push(`${labelOf(u)}: ${SLOT_LABEL_MVP1[face.slot]} (${face.name}) - ${face.text}`)
    })
    next.forEach((u, idx) => {
      if (!u.alive || u.side !== activeSide) return
      const face = newRolls[u.id]
      if (!GUARD_EFFECTS.has(face.effect)) return
      const val = faceValue(face)
      next[idx] = { ...next[idx], shield: val }
      if (face.effect === 'guard-heal') {
        next[idx] = { ...next[idx], hp: Math.min(next[idx].maxHp, next[idx].hp + face.heal) }
      }
      if (face.effect === 'guard-push') {
        const enemy = next.find((x) => x.alive && x.side !== u.side && x.pos && adjacent(next[idx].pos, x.pos))
        if (enemy) {
          const dr = Math.sign(enemy.pos.r - next[idx].pos.r)
          const dc = Math.sign(enemy.pos.c - next[idx].pos.c)
          const dest = { r: enemy.pos.r + dr, c: enemy.pos.c + dc }
          const inBounds = dest.r >= 0 && dest.r < ROWS && dest.c >= 0 && dest.c < COLS
          const blocked = !inBounds || !cellPassable(dest.r, dest.c, enemy.klass)
          const occupied = inBounds && cellOccupied(dest.r, dest.c, next.filter((x) => x.id !== enemy.id), lords)
          if (!blocked && !occupied) {
            const eIdx = next.findIndex((x) => x.id === enemy.id)
            next[eIdx] = { ...next[eIdx], pos: dest }
            lines.push(`${labelOf(u)} pushes ${labelOf(enemy)}.`)
          }
        }
      }
    })
    // Revelado visual del lanzamiento: primero se ven las caras barajandose un
    // instante (estado `rolling`, animacion CSS de la tirada) y al hacer commit
    // encaja la cara ganadora con su animacion de aterrizaje.
    setRolling(true)
    rollPendingRef.current = window.setTimeout(() => {
      rollPendingRef.current = null
      setLordRoll((r) => ({ ...r, [activeSide]: lordFace }))
      setUnits(next)
      setRolls(newRolls)
      pushLog(lines.join(' · '))
      // La Energia sale de LA TIRADA -cada cara sin golpe de este turno
      // (guardia o reposicion, ver yieldsEnergy) mete +1- y el banco no se
      // vacia al cambiar de turno: persiste toda la partida (tope ENERGY_CAP)
      // para que guardar de un turno a otro sea una decision real dentro de
      // las 8 rondas.
      const energyGained = next.filter((u) => u.side === activeSide && u.alive && yieldsEnergy(newRolls[u.id]?.effect)).length
      if (energyGained > 0) {
        setEnergyBank((b) => Math.min(ENERGY_CAP, b + energyGained))
        pushLog(`+${energyGained} Energy (non-strike faces from your roll).`)
      }
      // Floats de las caras de guardia (se aplican solas al tirar): escudo que
      // se gana y curas inmediatas, sobre la propia unidad.
      const guardFloats = []
      next.forEach((u) => {
        if (!u.alive || u.side !== activeSide) return
        const face = newRolls[u.id]
        if (!face || !GUARD_EFFECTS.has(face.effect)) return
        if (face.effect === 'guard-heal' && face.heal > 0) guardFloats.push({ text: `+${face.heal} HP`, variant: 'heal', ...u.pos })
        const val = faceValue(face)
        if (val > 0) guardFloats.push({ text: `+${val} shield`, variant: 'shield', ...u.pos })
      })
      if (guardFloats.length) pushFloats(guardFloats)
      setRolling(false)
    }, 700)
  }

  // Si una unidad ya no tiene nada util que hacer este turno (no puede
  // moverse mas, no tiene objetivos de basico ni de especial, o su cara de
  // reposicion no ve a ningun aliado), se le acaba el turno en el acto en vez
  // de quedarse seleccionable/atascada: al seleccionarla (selectUnit) o justo
  // tras moverse (moveTo) se marca acted y se cierra la seleccion.
  //
  // El movimiento se comprueba SIEMPRE primero, para cualquier cara (guardia,
  // reposicion, ataque): ninguna cara bloquea el mover.
  function unitCanAct(u) {
    const roll = rolls[u.id]
    if (!roll) return false
    if (!u.moved && reachableCells(u, units, lords, effectiveMove(u.klass)).length > 0) return true
    if (GUARD_EFFECTS.has(roll.effect)) {
      // Cara de guardia: su efecto (escudo/empuje/cura) ya se aplico al tirar.
      // Si ya se movio, solo le queda el golpe basico si tiene alguien al alcance.
      return basicAttackTargets(u, units, lords).length > 0
    }
    if (roll.effect === 'reposition-ally') return repositionableAllies(u, units).length > 0
    if (attackTargetsForFace(u, roll, units, lords).length > 0) return true
    if (basicAttackTargets(u, units, lords).length > 0) return true
    return false
  }

  // Cierra el turno de una unidad del bando activo sin haber atacado: se marca
  // acted y se anuncia en el log. Usado por el auto-end de unidades atascadas.
  function endUnitTurn(u, reason) {
    if (!u || u.side !== activeSide || u.acted) return
    setUnits((us) => us.map((x) => (x.id === u.id ? { ...x, acted: true } : x)))
    pushLog(`${labelOf(u)} ${reason}`)
    setSelected((s) => (s === u.id ? null : s))
  }

  // El Lord puede salir sin objetivos validos (p. ej. Ataque del Lord con
  // nadie a alcance 2): en ese caso se le acaba el turno al intentar
  // seleccionarlo (lordCanAct = false -> endLordTurn), igual que cualquier
  // unidad atascada.
  function lordCanAct() {
    const face = lordRoll[activeSide]
    if (!face || lordActed[activeSide]) return false
    if (face.effect === 'lord-attack') return lordAttackTargets(activeSide, units, lords).length > 0
    if (face.effect === 'lord-mark') return lordMarkTargets(activeSide, units, lords).length > 0
    return true
  }
  function endLordTurn(reason) {
    if (lordActed[activeSide]) return
    setLordActed((a) => ({ ...a, [activeSide]: true }))
    pushLog(`${sideLabel(activeSide)} Lord ${reason}`)
    setSelected(null)
  }
  // Selecciona el Lord con su chequeo de "puede actuar"; si no puede, se le
  // acaba el turno. Sirve tanto para el click en tablero como para el Roster.
  function selectLord() {
    if (status !== 'playing' || enemyTurnRunning) return
    if (selected === 'lord') {
      setSelected(null)
      return
    }
    if (!lordCanAct()) {
      endLordTurn('cannot act this turn.')
      return
    }
    if (!lordRoll[activeSide] || lordActed[activeSide]) return
    setSelected('lord')
  }

  function selectUnit(u) {
    if (status !== 'playing' || enemyTurnRunning || u.side !== activeSide || u.acted || !rolls[u.id]) return
    if (selected !== u.id && !unitCanAct(u)) {
      endUnitTurn(u, 'cannot do anything this turn.')
      return
    }
    const next = u.id === selected ? null : u.id
    // A3: los boosts armados son de la unidad seleccionada en ese momento -si
    // se cambia de seleccion sin gastarlos, no deben colarse en la siguiente.
    // El modo de ataque vuelve a 'special' por si la anterior seleccion habia
    // pedido basico de una cara sin especial.
    if (next !== selected) {
      setBoostArmed(false)
      setMoveBoostArmed(false)
      setAttackMode('special')
    }
    setSelected(next)
  }

  function moveTo(r, c) {
    if (!selectedUnit) return
    if (!moveCells.some((cell) => cell.r === r && cell.c === c)) return
    // A3: se cobra el gasto de moveBoost al completar el movimiento (mismo
    // criterio de "chequeo real al consumir" que boostArmed en attack()).
    const moveBoosted = moveBoostArmed && energyBank >= ENERGY_MOVE_COST
    if (moveBoosted) {
      setEnergyBank((b) => Math.max(0, b - ENERGY_MOVE_COST))
      setMoveBoostArmed(false)
      pushLog(`${labelOf(selectedUnit)} spends 2 Energy: +1 cell.`)
      pushFloats([{ text: '+1 cell', variant: 'buff', r, c }])
    }
    // La unidad se mueve, queda marcada como moved y SIGUE seleccionada -el
    // siguiente click sobre un objetivo resuelve el ataque (modo elegido en
    // el ActionPad), sin pasos extra de remate.
    const movePath = findGridPath(selectedUnit.pos, { r, c }, {
      rows: ROWS,
      cols: COLS,
      isPassable: (cell) => cellPassable(cell.r, cell.c, selectedUnit.klass),
      getCost: (_from, to) => TERRAIN_TYPES[terrainAt(to.r, to.c)]?.moveCost ?? Infinity,
      canEnter: (cell) => !cellOccupied(cell.r, cell.c, units, lords),
    })?.slice(1) || [{ r, c }]
    setUnits((us) => us.map((u) => (u.id === selectedUnit.id ? { ...u, pos: { r, c }, moved: true, movePath, activity: ACTOR_ACTIVITY.MOVING } : u)))
    // El path sólo describe esta transición visual. Se limpia después de que
    // el renderer haya tenido tiempo de completar los segmentos.
    window.setTimeout(() => {
      setUnits((us) => us.map((u) => u.id === selectedUnit.id ? { ...u, movePath: undefined, activity: ACTOR_ACTIVITY.IDLE } : u))
    }, Math.max(700, movePath.length * 700))
    // Si al llegar a la casilla nueva no tiene ningun objetivo (basico ni
    // especial) al alcance, no puede hacer nada mas este turno: se le acaba
    // del tiron en vez de quedar seleccionada y atascada hasta el final del
    // turno.
    const movedUnit = { ...selectedUnit, pos: { r, c }, moved: true }
    // Tras mover, la unidad se queda seleccionada si aun le queda algo (atacar
    // con su cara, golpe basico, o reposicionar a un aliado si su cara lo
    // dice). Solo se le acaba el turno si de verdad no queda nada: ninguna
    // cara le corta el movimiento al Axie (ver unitCanAct).
    if (!unitCanAct(movedUnit)) {
      endUnitTurn(movedUnit, 'moves but sees no enemies: its turn ends.')
      return
    }
    pushLog(`${labelOf(selectedUnit)} moves.`)
  }

  function repositionAlly(ally) {
    if (!selectedUnit) return
    const dest = firstFreeNeighbor(ally.pos, ally.klass, units, lords)
    setUnits((us) => us.map((u) => (u.id === selectedUnit.id ? { ...u, acted: true } : u)))
    if (dest) {
      setUnits((us) => us.map((u) => (u.id === ally.id ? { ...u, pos: dest } : u)))
      pushLog(`${labelOf(selectedUnit)} repositions ${labelOf(ally)}.`)
    } else {
      pushLog(`${labelOf(selectedUnit)} finds no room to reposition ${labelOf(ally)}.`)
    }
    setSelected(null)
  }

  // Resuelve el efecto de la cara de ataque activa: perforante ignora escudo (regla
  // 13), Imp remata por debajo de la mitad de vida, Serious/Risky Fish tienen efectos
  // sobre el propio atacante, Nut Crack/Nut Throw se combinan entre si. Toda la
  // resolucion vive en applyUnitAttackLocal (compartida con la IA enemiga y con la
  // preview del intercambio), de modo que Fase A (triangulo, Rotura, contragolpe,
  // terreno defensivo) e intercambio manual nunca divergen.
  function attack(target) {
    if (!selectedUnit || !selectedRoll) return
    const rolled = selectedRoll
    const isBasic = target.basic
    // A3: el banco de Energia puede comprar +10 al golpe de esta unidad (cara
    // de ataque de cualquier tipo; se consume al impactar en el propio
    // resolutor, como marked/buffed).
    const boosted = boostArmed && energyBank >= ENERGY_BOOST_COST
    const attacker = boosted ? { ...selectedUnit, energyBoost: true } : selectedUnit
    const result = applyUnitAttackLocal({ units, playerLordHp, enemyLordHp, rolls }, attacker, rolled, target)
    setUnits(result.units)
    setEnemyLordHp(result.enemyLordHp)
    setPlayerLordHp(result.playerLordHp)
    if (result.victory) endOfMatch(result.victory)
    if (boosted) {
      setEnergyBank((b) => Math.max(0, b - ENERGY_BOOST_COST))
      setBoostArmed(false)
    }
    pushLog(result.lines.join(' · '))
    setSelected(null)
    const attackTargetPos = target.kind === 'lord' ? ENEMY_LORD : target.pos
    pushFx([
      {
        kind: 'attack', unitId: selectedUnit.id, slot: isBasic ? null : rolled.slot ?? null,
        targetR: attackTargetPos.r, targetC: attackTargetPos.c,
      },
      ...(result.counterFx ? [result.counterFx] : []),
    ])
    pushFloats(result.floatEvents)
    pushImpacts(result.impacts)
  }

  // Paso 8, cara 1: ataque del Lord. Mismo dano fijo del chasis del Lord, misma
  // absorcion de escudo que un ataque basico normal; el Lord no tiene partes.
  function lordAttack(target) {
    // Prorroga PVP: el Lord es parte del equipo, asi que sus tiros tambien
    // suben +50% en muerte subita. Sin afinidad ni critico: el Lord no tiene
    // clase ni partes.
    let damage = Math.floor(LORD_STATS.atk * (OVERTIME_ACTIVE ? 1 + OVERTIME_DMG : 1))
    const lines = []
    // Igual que en attack(): hoisted para los floats fuera de los bloques.
    let victim = null
    let absorbed = 0
    let dealt = 0
    let shieldConsumed = 0
    let terrainAbsorbed = 0
    let marked = false
    if (target.kind === 'lord') {
      const attackingPlayerLord = activeSide === 'enemy'
      const current = attackingPlayerLord ? playerLordHp : enemyLordHp
      const next = Math.max(0, current - damage)
      ;(attackingPlayerLord ? setPlayerLordHp : setEnemyLordHp)(next)
      lines.push(`${sideLabel(activeSide)} Lord fires at the opposing Lord (-${damage}).`)
      if (next <= 0) endOfMatch(attackingPlayerLord ? 'enemy-won' : 'player-won')
    } else {
      victim = units.find((u) => u.id === target.id)
      // Marca del Lord: se consume aqui igual que en attack()/computeUnitAttack.
      marked = !!victim.marked
      if (marked) damage += 20
      // A5: la trinchera de zona lenta cubre al objetivo aunque el golpe venga
      // del Lord (misma regla que un ataque de unidad: +10 de guardia).
      const tBonus = terrainGuardBonus(victim.pos.r, victim.pos.c)
      absorbed = Math.min(victim.shield + tBonus, damage)
      dealt = damage - absorbed
      shieldConsumed = Math.min(victim.shield, absorbed)
      terrainAbsorbed = Math.max(0, absorbed - shieldConsumed)
      if (shieldConsumed > 0) lines.push(`${labelOf(victim)}'s shield absorbs ${shieldConsumed}.`)
      if (terrainAbsorbed > 0) lines.push(`${labelOf(victim)}'s terrain absorbs ${terrainAbsorbed} of the guard.`)
      const killed = victim.hp - dealt <= 0
      lines.push(`${sideLabel(activeSide)} Lord fires at ${labelOf(victim)} (-${dealt}).`)
      if (marked) lines.push(`${labelOf(victim)} was marked: +20 damage.`)
      if (killed) lines.push(`${labelOf(victim)} falls.`)
      setUnits((us) =>
        us.map((u) =>
          u.id === target.id
            ? { ...u, hp: Math.max(0, u.hp - dealt), shield: Math.max(0, u.shield - shieldConsumed), alive: u.hp - dealt > 0, pos: u.hp - dealt > 0 ? u.pos : null, marked: false }
            : u
        )
      )
    }
    setLordActed((a) => ({ ...a, [activeSide]: true }))
    pushLog(lines.join(' · '))
    setSelected(null)
    pushFx([{
      kind: 'attack',
      unitId: activeSide === 'player' ? 'lord-player' : 'lord-enemy',
      slot: null,
      targetR: victimPos.r,
      targetC: victimPos.c,
    }])

    const lordPos = lords[activeSide]
    const victimPos = target.kind === 'lord' ? (activeSide === 'player' ? ENEMY_LORD : PLAYER_LORD) : victim ? victim.pos : lordPos
    pushFloats([
      { text: 'Lord Attack', variant: 'cast', ...lordPos },
      { text: `-${dealt ?? damage}`, variant: 'damage', ...victimPos },
      ...(shieldConsumed > 0 ? [{ text: `shield -${shieldConsumed}`, variant: 'shield', ...victimPos }] : []),
      ...(terrainAbsorbed > 0 ? [{ text: `+${terrainAbsorbed} terrain guard`, variant: 'shield', ...victimPos }] : []),
      ...(marked ? [{ text: '+20 marked', variant: 'buff', ...victimPos }] : []),
    ])
    pushImpacts([{ r: victimPos.r, c: victimPos.c, kind: 'lord', klass: 'lord', effect: 'lord-attack', atkR: lordPos.r, atkC: lordPos.c }])
  }

  // Paso 8, caras 2-6: invocacion. Saca la primera unidad de la reserva (regla 15) a
  // la casilla elegida junto al Lord (regla 16). No tira dado este turno: ya paso la
  // tirada del bando cuando esta unidad seguia fuera del tablero (regla 7).
  function lordSummon(cell) {
    const queue = reserve[activeSide]
    if (queue.length === 0) {
      pushLog(`${sideLabel(activeSide)} Lord has no reserve to summon.`)
    } else {
      const [summoned, ...rest] = queue
      setReserve((r) => ({ ...r, [activeSide]: rest }))
      setUnits((us) => [...us, { ...summoned, pos: cell }])
      pushLog(`${sideLabel(activeSide)} Lord summons ${labelOf(summoned)}.`)
      pushFloats([{ text: 'Summon', variant: 'cast', ...cell }])
    }
    setLordActed((a) => ({ ...a, [activeSide]: true }))
    setSelected(null)
  }

  // Muro: 30 de escudo a un aliado propio a alcance 3. Mismo criterio de "no
  // se acumula, sustituye si es mayor" que cualquier otro escudo (regla 12)
  // -Math.max, no suma.
  function lordShield(target) {
    const ally = units.find((u) => u.id === target.id)
    setUnits((us) => us.map((u) => (u.id === target.id ? { ...u, shield: Math.max(u.shield, 30) } : u)))
    pushLog(`${sideLabel(activeSide)} Lord shields ${labelOf(ally)} with Wall (+30 shield).`)
    pushFloats([{ text: 'Wall', variant: 'cast', ...lords[activeSide] }, { text: '+30 shield', variant: 'shield', ...target.pos }])
    setLordActed((a) => ({ ...a, [activeSide]: true }))
    setSelected(null)
  }

  // Marca: no hace dano por si misma, deja al objetivo marcado para el
  // PROXIMO ataque que lo impacte (computeUnitAttack/attack()/lordAttack ya
  // saben leer y consumir `marked`).
  function lordMark(target) {
    const victim = units.find((u) => u.id === target.id)
    setUnits((us) => us.map((u) => (u.id === target.id ? { ...u, marked: true } : u)))
    pushLog(`${sideLabel(activeSide)} Lord marks ${labelOf(victim)}.`)
    pushFloats([{ text: 'Mark', variant: 'cast', ...lords[activeSide] }, { text: 'Marked', variant: 'buff', ...target.pos }])
    setLordActed((a) => ({ ...a, [activeSide]: true }))
    setSelected(null)
  }

  // Cura (sustituye a una de las 2 caras de Invocacion): 15 de vida a un
  // aliado propio a alcance 3, sin pasar de su vida maxima.
  function lordHeal(target) {
    const ally = units.find((u) => u.id === target.id)
    setUnits((us) => us.map((u) => (u.id === target.id ? { ...u, hp: Math.min(u.maxHp, u.hp + 15) } : u)))
    pushLog(`${sideLabel(activeSide)} Lord heals ${labelOf(ally)} (+15 HP).`)
    pushFloats([{ text: 'Heal', variant: 'cast', ...lords[activeSide] }, { text: '+15 HP', variant: 'heal', ...target.pos }])
    setLordActed((a) => ({ ...a, [activeSide]: true }))
    setSelected(null)
  }

  // Templanza (sustituye a la otra cara de Invocacion): bendice a un aliado
  // propio a alcance 3 -su PROXIMO ataque este turno (o el que sea, no
  // caduca solo por pasar de turno) hace +15. Se consume al atacar
  // (attack()/computeUnitAttack ya saben leer y limpiar `buffed`).
  function lordBuff(target) {
    const ally = units.find((u) => u.id === target.id)
    setUnits((us) => us.map((u) => (u.id === target.id ? { ...u, buffed: true } : u)))
    pushLog(`${sideLabel(activeSide)} Lord blesses ${labelOf(ally)} with Temperance.`)
    pushFloats([{ text: 'Temperance', variant: 'cast', ...lords[activeSide] }, { text: '+15 damage', variant: 'buff', ...target.pos }])
    setLordActed((a) => ({ ...a, [activeSide]: true }))
    setSelected(null)
  }

  // Duplicar clona a un aliado propio vivo a alcance 3 -el clon aparece junto
  // al LORD (regla 16, misma logica que la invocacion), a vida llena, no
  // comparte HP/escudo/acted con el original. Es una unidad nueva. La reserva
  // sigue entrando por esta MISMA cara: si el jugador toca una casilla libre
  // junto al Lord en vez de a un aliado, cellClick llama a lordSummon() en su
  // lugar (ver mas abajo) -asi la reserva de 3 tiene forma de entrar en juego
  // pese a que no hay caras de Invocacion dedicadas.
  function lordClone(target) {
    const original = units.find((u) => u.id === target.id)
    const cells = lordSummonTargets(activeSide, units, lords, original.klass)
    if (cells.length === 0) {
      pushLog(`${sideLabel(activeSide)} Lord has no free cell next to it to duplicate ${labelOf(original)}.`)
    } else {
      const clone = makeUnit(activeSide, original.klass, nextCloneId(activeSide, units), cells[0], {
        starterEnemy: false,
        augments: meta.augments,
      })
      setUnits((us) => [...us, clone])
      pushLog(`${sideLabel(activeSide)} Lord duplicates ${labelOf(original)}.`)
      pushFloats([{ text: 'Duplicate', variant: 'cast', ...lords[activeSide] }, { text: 'Clone', variant: 'info', ...cells[0] }])
    }
    setLordActed((a) => ({ ...a, [activeSide]: true }))
    setSelected(null)
  }

  function cellClick(r, c) {
    if (status !== 'playing' || enemyTurnRunning) return
    if (selectedUnit) {
      if (isReposition) {
        const ally = allyChoices.find((a) => a.pos.r === r && a.pos.c === c)
        if (ally) {
          repositionAlly(ally)
          return
        }
      }
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
        (u) => u.alive && u.side === activeSide && u.pos && u.pos.r === r && u.pos.c === c && !u.acted && rolls[u.id]
      )
      if (otherOwn) {
        selectUnit(otherOwn)
        return
      }
      const myLord = lords[activeSide]
      if (r === myLord.r && c === myLord.c && lordRoll[activeSide] && !lordActed[activeSide]) {
        selectLord()
        return
      }
      moveTo(r, c)
      return
    }
    if (lordSelected) {
      const target = targets.find((t) => t.pos.r === r && t.pos.c === c)
      if (target) {
        if (lordMarkable) {
          lordMark(target)
        } else {
          lordAttack(target)
        }
        return
      }
      // Muro/Cura/Templanza/Duplicar: mismo `allyChoices` que Swallow, solo
      // activo cuando el Lord esta seleccionado con esa cara.
      const ally = allyChoices.find((a) => a.pos.r === r && a.pos.c === c)
      if (ally) {
        if (lordShieldable) {
          lordShield(ally)
        } else if (lordHealable) {
          lordHeal(ally)
        } else if (lordBuffable) {
          lordBuff(ally)
        } else if (lordCloneable) {
          lordClone(ally)
        }
        return
      }
      const summonCell = lordSummonCells.find((cell) => cell.r === r && cell.c === c)
      if (summonCell) {
        lordSummon(summonCell)
        return
      }
      const myLord = lords[activeSide]
      if (r === myLord.r && c === myLord.c) {
        setSelected(null)
        return
      }
      const otherOwn = units.find(
        (u) => u.alive && u.side === activeSide && u.pos && u.pos.r === r && u.pos.c === c && !u.acted && rolls[u.id]
      )
      if (otherOwn) selectUnit(otherOwn)
      return
    }
    const own = units.find((u) => u.alive && u.side === activeSide && u.pos && u.pos.r === r && u.pos.c === c)
    if (own) {
      selectUnit(own)
      return
    }
    const myLord = lords[activeSide]
    if (r === myLord.r && c === myLord.c && lordRoll[activeSide] && !lordActed[activeSide]) {
      selectLord()
    }
  }

  // Regla 5: empate exacto en el reloj lo gana el defensor (aqui, Enemy).
  function clockTiebreak(pHp, eHp) {
    return pHp / LORD_STATS.hp > eHp / LORD_STATS.hp ? 'player-won' : 'enemy-won'
  }

  // Cierra el turno de Player y resuelve el turno de Enemy paso a paso (paso
  // 10: la IA ya no se juega a mano). Cada paso (tirada, y luego cada accion de
  // cada unidad y del Lord) se aplica a React con su pausa, para que se vea la
  // secuencia en vez de confirmar todo de un tiron. Al terminar, vuelve al
  // turno de Player.
  const ENEMY_ROLL_MS = 1150
  const ENEMY_STEP_MS = 900
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  async function passTurn() {
    if (status !== 'playing' || enemyTurnRunning) return
    const token = enemyTurnTokenRef.current
    let nextTurn = turnCount + 1
    // Muerte subita / prorroga (solo PVP): la primera vez que el reloj supera
    // las 8 rondas (turnCount pasa de las 16 medias-turno) se activa AQUI,
    // antes del corte: en PVP se amplia el techo a 8+2 rondas en vez de saltar
    // al tiebreak; en PVE el corte de abajo tira del reloj de siempre.
    if (!OVERTIME_ACTIVE && nextTurn > TURN_CLOCK && matchInfo.mode === 'pvp') {
      OVERTIME_ACTIVE = true
      setOvertime(true)
      pushLog('SUDDEN DEATH (PVP): 2-round overtime. Both sides gain +2 movement cells and +50% damage.')
      // Bang visual sobre los dos Lords; vfxIdFor('lord','overtime') cae al
      // slash generico del kit, valido para el anuncio.
      pushImpacts([
        { r: PLAYER_LORD.r, c: PLAYER_LORD.c, kind: 'lord', klass: 'lord', effect: 'overtime' },
        { r: ENEMY_LORD.r, c: ENEMY_LORD.c, kind: 'lord', klass: 'lord', effect: 'overtime' },
      ])
    }
    const clockCap = TURN_CLOCK + (OVERTIME_ACTIVE ? OVERTIME_EXTRA : 0)
    if (nextTurn > clockCap) {
      endOfMatch(clockTiebreak(playerLordHp, enemyLordHp))
      setTurnCount(nextTurn)
      pushLog(`The ${clockCap / 2}-round clock runs out.`)
      return
    }

    // Energia del jugador: no se calcula aqui. Se gana al tirar los dados
    // (caras sin golpe de la tirada, ver rollDice) y el banco persiste toda la
    // partida en vez de vaciarse/recargarse cada turno -gastar ahora o guardar
    // para el turno gordo es una decision real dentro de las 8 rondas.

    const resetEnemyActed = units.map((u) => (u.side === 'enemy' ? { ...u, acted: false } : u))
    const result = runEnemyTurn(resetEnemyActed, reserve, playerLordHp, enemyLordHp, rolls)

    setEnemyTurnRunning(true)
    // El turno enemigo se reproduce en vivo mientras el jugador no puede
    // actuar: no tiene sentido que la seleccion del jugador siga viva durante
    // la secuencia del rival (si el rival mata a esa unidad, el render la
    // seguira usando con pos:null y reventara -ver selectedUnit abajo).
    setSelected(null)
    try {
      // Paso 0: tirada del rival. Se ve el barajado un instante y luego encaja.
      setRolling(true)
      await sleep(ENEMY_ROLL_MS)
      if (token !== enemyTurnTokenRef.current) return
      setRolling(false)
      setUnits(result.steps[0].units)
      setLordRoll((r) => ({ ...r, enemy: result.lordFace }))
      // Importante: reemplaza `rolls` entero (no mezcla) para que Die3D del
      // rival aterrice en su cara correcta.
      setRolls(result.rolls)
      // Banco de Energia del rival (solo informativo, ver el estado arriba):
      // mismo criterio que el jugador -se acumula desde su tirada de cada
      // turno, no se resetea (la IA no gasta Energia todavia, A3 solo cubre al
      // jugador).
      setEnemyEnergyBank((b) => Math.min(ENERGY_CAP, b + result.enemyEnergyGained))
      pushLog(result.steps[0].lines.join(' · '))
      if (result.steps[0].floatEvents.length) pushFloats(result.steps[0].floatEvents)

      // Pasos 1..n: cada accion de cada unidad y el Lord, de uno en uno.
      for (const step of result.steps.slice(1)) {
        if (token !== enemyTurnTokenRef.current) return
        // Resaltar quien actua (unidad rival o Lord rival) para que el jugador
        // pueda seguir la secuencia sin que todo pase de golpe.
        setEnemyActing(step.actor ?? null)
        await sleep(ENEMY_STEP_MS)
        if (token !== enemyTurnTokenRef.current) return
        setUnits(step.units)
        setPlayerLordHp(step.playerLordHp)
        setEnemyLordHp(step.enemyLordHp)
        setReserve(step.reserve)
        if (step.lines.length) pushLog(step.lines.join(' · '))
        if (step.fx.length) pushFx(step.fx)
        if (step.floatEvents.length) pushFloats(step.floatEvents)
        if (step.impacts && step.impacts.length) pushImpacts(step.impacts)
      }
    } finally {
      setEnemyActing(null)
      setEnemyTurnRunning(false)
    }
    if (token !== enemyTurnTokenRef.current) return
    setSelected(null)

    if (result.victory) {
      endOfMatch(result.victory)
      setTurnCount(nextTurn)
      return
    }

    // Desgaste de la prorroga: cada ronda de prorroga, ambos Lords pierden
    // vida tras terminar el turno del rival. Es lo que hace que la prorroga
    // no termine en empate pasivo: si nadie remata, el RELOJ se come los
    // Lords. Se aplica sobre las vidas FINALES del turno (result.*), despues
    // de que la IA haya actuado, para no pisar su dano con un setState
    // posterior.
    let drainPHp = result.playerLordHp
    let drainEHp = result.enemyLordHp
    if (OVERTIME_ACTIVE) {
      drainPHp = result.playerLordHp - OVERTIME_DRAIN
      drainEHp = result.enemyLordHp - OVERTIME_DRAIN
      setPlayerLordHp(drainPHp)
      setEnemyLordHp(drainEHp)
      if (drainPHp <= 0 && drainEHp <= 0) {
        endOfMatch('enemy-won') // empate exacto: lo gana el defensor (Regla 5)
        setTurnCount(nextTurn)
        pushLog('SUDDEN DEATH: both Lords bleed out at once. The defender (Rival) wins.')
        return
      }
      if (drainPHp <= 0) {
        endOfMatch('enemy-won')
        setTurnCount(nextTurn)
        pushLog('SUDDEN DEATH: your Lord falls to overtime attrition.')
        return
      }
      if (drainEHp <= 0) {
        endOfMatch('player-won')
        setTurnCount(nextTurn)
        pushLog('SUDDEN DEATH: the enemy Lord falls to overtime attrition.')
        return
      }
      pushLog(`Overtime: both Lords lose ${OVERTIME_DRAIN} HP to attrition (your Lord ${drainPHp} / rival ${drainEHp}).`)
    }

    nextTurn += 1
    const postCap = TURN_CLOCK + (OVERTIME_ACTIVE ? OVERTIME_EXTRA : 0)
    if (nextTurn > postCap) {
      endOfMatch(clockTiebreak(
        OVERTIME_ACTIVE ? drainPHp : result.playerLordHp,
        OVERTIME_ACTIVE ? drainEHp : result.enemyLordHp,
      ))
      setTurnCount(nextTurn)
      pushLog(`The ${postCap / 2}-round clock runs out.`)
      return
    }
    setUnits((us) => us.map((u) => (u.side === 'player' ? { ...u, acted: false } : u)))
    setLordRoll({ player: null, enemy: null })
    setLordActed({ player: false, enemy: false })
    // El banco de Energia YA no se toca aqui (persiste de turno en turno desde
    // su ganancia en rollDice; resetMatch lo vuelve a 0). Solo se desarman los
    // gastos del turno que termina.
    setBoostArmed(false)
    setMoveBoostArmed(false)
    setTurnCount(nextTurn)
    // El turno del jugador empieza de nuevo: el reloj PVP vuelve a los 20 s
    // completos (lo consume el effect del cronometro de arriba).
    turnSecondsRef.current = PVP_TURN_MS / 1000
    setTurnSecondsLeft(PVP_TURN_MS / 1000)
    pushLog(`Turn ${nextTurn}. Roll the dice, Player.`)
  }

  // Igual que en rollDice: `rolls` ya no se vacia entre turnos (la tirada del
  // rival se queda ahi para que Die3D pueda aterrizar en su cara), asi que
  // "ya ha tirado" es solo sobre el bando activo.
  const rolled = units.some((u) => u.side === activeSide && u.alive && rolls[u.id])

  // Enlaza las funciones vivas al ref del cronometro cada render: el interval
  // siempre llama a las ultimas versiones (ver autoPassRef arriba).
  autoPassRef.current = { passTurn, rollDice }

  // Cronometro PVP: reloj por turno del jugador en las arenas. Solo corre
  // mientras es el turno jugable del jugador (no durante la reproduccion en
  // vivo del turno rival ni fuera de partida). Al agotarse se tiran los dados
  // si no se habia tirado y se pasa el turno sin mover/atacar. El conteo vive
  // en turnSecondsRef (no re-render por segundo); el effect se recrea en cada
  // cambio de estado relevante y limpia el interval al pasar el turno
  // (enemyTurnRunning se vuelve true y el countdown se detiene).
  useEffect(() => {
    if (status !== 'playing' || matchInfo.mode !== 'pvp' || enemyTurnRunning) return
    const id = window.setInterval(() => {
      if (turnSecondsRef.current <= 0) return
      turnSecondsRef.current -= 1
      setTurnSecondsLeft(turnSecondsRef.current)
      if (turnSecondsRef.current === 0) {
        turnSecondsRef.current = PVP_TURN_MS / 1000
        setTurnSecondsLeft(turnSecondsRef.current)
        if (!rolled) {
          pushLog('Time is up: automatic roll.')
          autoPassRef.current.rollDice()
        }
        autoPassRef.current.passTurn()
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [status, matchInfo.mode, enemyTurnRunning, rolled, turnCount])

  // Musica ambiental: el motor de music.js elige pista segun el estado. Meta
  // (hub/mapa/laboratorio...) -> hub; dentro de partida: PVE/PVP, y en la
  // prorroga PVP la pista PVP sube a 1.35x (OVERTIME). Victorias y derrotas
  // tienen su propia pieza. El motor guarda silencio sin muted y se desbloquea
  // con el primer gesto del usuario (autoplay policy).
  useEffect(() => {
    const key = isMeta
      ? 'hub'
      : status !== 'playing'
        ? status === 'player-won'
          ? 'victory'
          : 'defeat'
        : matchInfo.mode === 'pvp'
          ? overtime
            ? 'overtime'
            : 'pvp'
          : 'pve'
    setMusicKey(key)
  }, [isMeta, route, status, matchInfo.mode, overtime])

  // Nueva partida desde cero (boton "Reiniciar partida", y cada "Jugar" desde el
  // hub/mapa): resetea todo el estado de combate. cfg (matchConfig) decide el
  // terreno VIVO (TERRAIN_LAYOUT, que el tablero 3D lee via terrainAt), las
  // clases/starters enemigos, la escala de vida y la recompensa de esencia.
  // Los augments del Laboratorio (meta.augments) se acoplan aqui a cada unidad
  // del equipo propio -por eso los cambios del laboratorio aplican al pulsar
  // "Jugar", no a mitad de partida. BoardRegion se remonta via key={matchSeq}
  // para que Three.js reconstruya la escena con el terreno nuevo.
  function resetMatch(cfg) {
    const c = cfg || CURRENT_MATCH
    CURRENT_MATCH = c
    TERRAIN_LAYOUT = c.terrain || TEST_TERRAIN
    setMatchInfo(c)
    setMatchSeq((n) => n + 1)
    if (rollPendingRef.current) {
      clearTimeout(rollPendingRef.current)
      rollPendingRef.current = null
    }
    // Aborta una secuencia del rival en curso (si la hay) y descongela la UI.
    enemyTurnTokenRef.current += 1
    setEnemyTurnRunning(false)
    setRolling(false)
    setBoardReady(false)
    const playerOpts = { starterEnemy: false, augments: meta.augments }
    const enemyOpts = { starterEnemy: c.starterEnemy !== false, augments: {}, hpScale: c.hpScale || 1 }
    setUnits([
      ...makeInitialBoard('player', PLAYER_TEAM, playerOpts),
      ...makeInitialBoard('enemy', c.enemyClasses || PLAYER_TEAM, enemyOpts),
    ])
    setPlayerLordHp(LORD_STATS.hp)
    setEnemyLordHp(LORD_STATS.hp)
    setReserve({
      player: makeInitialReserve('player', PLAYER_TEAM, playerOpts),
      enemy: makeInitialReserve('enemy', c.enemyClasses || PLAYER_TEAM, enemyOpts),
    })
    setLordRoll({ player: null, enemy: null })
    setLordActed({ player: false, enemy: false })
    setRollTick((t) => t + 1)
    setTurnCount(1)
    setRolls({})
    setSelected(null)
    setAttackMode('special')
    // A3: la banca se vacia en cada partida nueva (igual que pasa al empezar
    // cada turno propio).
    setEnergyBank(0)
    setEnemyEnergyBank(0)
    setBoostArmed(false)
    setMoveBoostArmed(false)
    // Muerte subita (PVP): el flag de modulo y la UI vuelven a apagarse en cada
    // partida nueva; el reloj PVP vuelve a los 20 s de inicio.
    OVERTIME_ACTIVE = false
    setOvertime(false)
    turnSecondsRef.current = PVP_TURN_MS / 1000
    setTurnSecondsLeft(PVP_TURN_MS / 1000)
    endOfMatchRef.current = false
    setStatus('playing')
    setLog([`The battle begins: ${c.blurb || 'Skirmish in the heart of Lunacia.'} Roll the dice, Player.`])
    setFloats([])
    setImpacts([])
  }

  // renderLordCard/renderUnitCard se movieron a components/LordCard.jsx y
  // components/UnitCard.jsx (via components/Roster.jsx, que compone ambos
  // por bando). La logica de estado se queda aqui; las cartas solo reciben
  // props ya resueltas.

  return (
    <div className={`app ${route === 'aldea' || route === 'base' ? 'app-village' : ''} ${route === 'partida' ? 'app-combat' : ''} ${route === 'partida' && !boardReady ? 'app-combat-loading' : ''}`}>
      <LunaciaBackdrop />
      <LoadingCurtain visible={!isMeta && !boardReady} />
      {SHOW_DASHBOARD && !isCover && (
      <>
      <header className="topbar">
        <a className="brand" href="#/portada" title="Back to the cover">
          <img src="/brand/axie-infinity-tactics-dices.png" alt="Axie Tactics Dices" className="brand-logo-img" />
        </a>

        <MetaNav route={route} compressed={false} />
        <MusicToggle />

        {(route === 'aldea' || route === 'base') && (
          <>
            <div className="topbar-village-resources" aria-label="Village resources">
              <span>Wood <b>{villageResources.wood}</b></span>
              <span>Stone <b>{villageResources.stone}</b></span>
              <span>Food <b>{villageResources.food}</b></span>
            </div>
            <span className="topbar-village-label">Village</span>
          </>
        )}

        {!isMeta && route !== 'partida' && (
        <div className="topbar-actions">
          <Controls
            status={status}
            rolled={rolled}
            rolling={rolling}
            busy={enemyTurnRunning}
            activeSide={activeSide}
            // Cronometro PVP solo visible en arenas mientras es el turno
            // jugable del jugador (el rival reproduce su secuencia en vivo,
            // no consume segundo del reloj).
            timer={matchInfo.mode === 'pvp' && status === 'playing' && !enemyTurnRunning ? turnSecondsLeft : null}
            onRoll={rollDice}
            onPass={passTurn}
            onReset={resetMatch}
          />
        </div>
        )}
      </header>

      {!isMeta && <>
      <BattleLog log={log} slim />

      <VictoryBanner status={status} onReset={resetMatch} />
      </>}
      </>
      )}

      <div className={isMeta ? 'meta-view' : 'combat-shell'}>
      {isMeta ? (
        META_SCREENS[route]
      ) : (
        <>
      <div className="layout">
      {SHOW_DASHBOARD && (
      <Roster
        side="player"
        title="Your command"
        titleClassName="ally"
        units={units}
        rolls={rolls}
        rolling={rolling}
        activeSide={activeSide}
        enemyTurn={enemyTurnRunning}
        rollTick={rollTick}
        selected={selected}
        status={status}
        playerLordHp={playerLordHp}
        enemyLordHp={enemyLordHp}
        reservePlayerCount={reserve.player.length}
        reserveEnemyCount={reserve.enemy.length}
        lordRoll={lordRoll}
        lordActed={lordActed}
        onSelectUnit={selectUnit}
        onSelectLord={selectLord}
      />
      )}
      {SHOW_BOARD && (
      <div className="board-col" ref={boardColRef}>
      <BoardRegion
        key={matchSeq}
        showDashboard={SHOW_DASHBOARD}
        board3d={{
          blockUrl: BOARD3D_BLOCK_URL,
          terrainAt,
          terrainBlockUrls: TERRAIN_BLOCK_URLS,
          decorUrls: TERRAIN_DECOR_URLS,
          arenaConfig: BATTLE_ARENA_CONFIG,
          axieUnits,
          fx: fxQueue,
          onReady: () => setBoardReady(true),
        }}
        overlay={{
          visible: SHOW_OVERLAY,
          units,
          lords,
          activeSide,
          selected,
          lordSelected,
          moveCells,
          targets,
          projectedTargets,
          projectedMoveCell,
          projectedPath,
          projectedAttackInfo,
          allyChoices,
          lordSummonCells,
          lordRoll,
          lordActed,
          playerLordHp,
          enemyLordHp,
          rollTick,
          floats,
          impacts,
          enemyActing,
          turnLabel: `Turn: ${activeSide === 'player' ? 'Player' : 'Enemy'}`,
          energyBank,
          enemyEnergyBank,
          energyCap: ENERGY_CAP,
          exchangeInfo: exchangeInfo && hoverCell ? { cell: hoverCell, lines: exchangeInfo.lines, affinity: exchangeInfo.affinity, crit: exchangeInfo.crit } : null,
          onCellClick: cellClick,
          onCellHover: setHoverCell,
          // El recuerdo de turno y el timer viven TAMBIEN sobre el canvas (el
          // chip del topbar se pierde jugando); la prorroga PVP se anuncia en
          // el mismo banner para que se vea sin mirar el HUD.
          status,
          rolled,
          rolling,
          overtime,
          timer: matchInfo.mode === 'pvp' && status === 'playing' && !enemyTurnRunning ? turnSecondsLeft : null,
        }}
      />

      <ActionPad
        unitLabel={selectedUnit ? labelOf(selectedUnit) : null}
        rolled={selectedRoll ? { slotLabel: SLOT_LABEL_MVP1[selectedRoll.slot], name: selectedRoll.name, text: selectedRoll.text } : null}
        isReposition={isReposition}
        moved={!!selectedUnit?.moved}
        canAct={hasBasic || hasSpecial}
        hasSpecial={hasSpecial}
        hasBasic={hasBasic}
        mode={effectiveMode}
        onMode={setAttackMode}
        lordSelected={lordSelected}
        lordLabel={sideLabel(activeSide)}
        activeLordRoll={activeLordRoll}
        nextReserveLabel={nextReserveKlass ? CLASS_STATS[nextReserveKlass].label : null}
        energyBank={energyBank}
        energyCap={ENERGY_CAP}
        boostArmed={boostArmed}
        canBoost={status === 'playing' && energyBank >= ENERGY_BOOST_COST && !!selectedUnit && !!selectedRoll && selectedUnit.side === activeSide && !selectedUnit.acted}
        onToggleBoost={() => setBoostArmed((a) => !a)}
        moveBoostArmed={moveBoostArmed}
        canMoveBoost={status === 'playing' && energyBank >= ENERGY_MOVE_COST && !!selectedUnit && !!selectedRoll && !selectedUnit.moved && selectedUnit.side === activeSide && !selectedUnit.acted}
        onToggleMoveBoost={() => setMoveBoostArmed((a) => !a)}
        exchangeAffinity={exchangeInfo && hoverCell ? exchangeInfo.affinity : null}
        exchangeCrit={exchangeInfo && hoverCell ? exchangeInfo.crit : null}
        overtime={overtime}
      />
      <div className="canvas-controls">
        <Controls
          status={status}
          rolled={rolled}
          rolling={rolling}
          busy={enemyTurnRunning}
          activeSide={activeSide}
          timer={matchInfo.mode === 'pvp' && status === 'playing' && !enemyTurnRunning ? turnSecondsLeft : null}
          onRoll={rollDice}
          onPass={passTurn}
          onReset={resetMatch}
        />
      </div>
      </div>
      )}

      {SHOW_DASHBOARD && (
      <Roster
        side="enemy"
        title={matchInfo.enemyTitle || 'Besiegers'}
        titleClassName="enemy"
        units={units}
        rolls={rolls}
        rolling={rolling}
        activeSide={activeSide}
        enemyTurn={enemyTurnRunning}
        rollTick={rollTick}
        selected={selected}
        status={status}
        playerLordHp={playerLordHp}
        enemyLordHp={enemyLordHp}
        reservePlayerCount={reserve.player.length}
        reserveEnemyCount={reserve.enemy.length}
        lordRoll={lordRoll}
        lordActed={lordActed}
        onSelectUnit={selectUnit}
        onSelectLord={selectLord}
      />
      )}
      </div>
      </>
      )}
      </div>
    </div>
  )
}
