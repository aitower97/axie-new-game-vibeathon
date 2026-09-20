// axie.js — el genoma ES el dado.
//
// Un Axie tiene seis partes del cuerpo (eyes, ears, horn, mouth, back, tail) y una
// clase. Cada parte ocupa una cara del dado. Tirar el dado no dice "cuanto pego",
// dice "que puedo hacer este turno".
//
// La Ascension no sube un numero: evoluciona UNA parte concreta y reescribe esa cara.

export const SLOTS = ['eyes', 'ears', 'horn', 'mouth', 'back', 'tail']

export const SLOT_LABEL = {
  eyes: 'Eyes',
  ears: 'Ears',
  horn: 'Horn',
  mouth: 'Mouth',
  back: 'Back',
  tail: 'Tail',
}

export const CLASSES = {
  beast: { label: 'Beast', color: '#f0a04b' },
  aquatic: { label: 'Aquatic', color: '#3fa9e0' },
  plant: { label: 'Plant', color: '#71c14b' },
  bird: { label: 'Bird', color: '#ef6f9c' },
  bug: { label: 'Bug', color: '#e2564d' },
  reptile: { label: 'Reptile', color: '#b476d4' },
}

// Que hace cada tipo de cara.
//   summon  -> fuera del tablero: invoca. Dentro: reposiciona (mueve 2).
//   strike  -> ataque normal, la DEF lo reduce.
//   pierce  -> ataque perforante, ignora la DEF.
//   drain   -> ataque que cura 1 a quien lo lanza.
//   guard   -> escudo, se aplica al tirar. Absorbe dano enemigo.
//   dash    -> mueve hasta 2 casillas y puede atacar al final.
export const FACE_INFO = {
  summon: { glyph: '✦', name: 'Summon', hint: 'Off the board: enters it. On the board: moves 2 or hits 1 if a rival is adjacent.' },
  strike: { glyph: '⚔', name: 'Strike', hint: 'Normal attack, reduced by DEF.' },
  pierce: { glyph: '➤', name: 'Pierce', hint: "Ignores the target's DEF." },
  drain: { glyph: '♥', name: 'Drain', hint: 'Attacks and heals you for 1.' },
  guard: { glyph: '◉', name: 'Guard', hint: 'Instant shield when rolled.' },
  dash: { glyph: '⇉', name: 'Dash', hint: 'Moves up to 2 and can attack.' },
}

// Biblioteca de partes. Cada slot tiene variantes con nombre real de Axie.
// Dos Axies con el mismo esqueleto pero partes distintas juegan distinto: ahi
// esta la variedad, no en las estadisticas.
// Clase de cada parte verificada contra la tabla de genes real de Axie
// (community gene-decoder, github.com/ShaneMaglangit/agp). Varias difieren de la
// intuicion: Little Branch, Goda, Axie Kiss y Timber son Beast, Hermit es Aquatic,
// Papi es Plant. Necesario para que @axieinfinity/mixer encuentre la parte al renderizar.
export const PARTS = {
  eyes: [
    { id: 'chubby', name: 'Chubby', class: 'beast', face: 'summon', power: 0 },
    { id: 'clear', name: 'Clear', class: 'aquatic', face: 'summon', power: 0 },
    { id: 'papi', name: 'Papi', class: 'plant', face: 'summon', power: 0 },
  ],
  ears: [
    { id: 'puppy', name: 'Puppy', class: 'beast', face: 'summon', power: 0 },
    { id: 'nut-cracker', name: 'Nut Cracker', class: 'beast', face: 'guard', power: 1 },
    { id: 'lotus', name: 'Lotus', class: 'plant', face: 'summon', power: 0 },
  ],
  horn: [
    { id: 'little-branch', name: 'Little Branch', class: 'beast', face: 'pierce', power: 2 },
    { id: 'imp', name: 'Imp', class: 'beast', face: 'pierce', power: 3 },
    { id: 'cactus', name: 'Cactus', class: 'plant', face: 'guard', power: 2 },
  ],
  mouth: [
    { id: 'serious', name: 'Serious', class: 'plant', face: 'drain', power: 2 },
    { id: 'goda', name: 'Goda', class: 'beast', face: 'drain', power: 1 },
    { id: 'axie-kiss', name: 'Axie Kiss', class: 'beast', face: 'strike', power: 3 },
  ],
  back: [
    { id: 'hermit', name: 'Hermit', class: 'aquatic', face: 'guard', power: 2 },
    { id: 'balloon', name: 'Balloon', class: 'bird', face: 'guard', power: 1 },
    { id: 'timber', name: 'Timber', class: 'beast', face: 'strike', power: 2 },
  ],
  tail: [
    { id: 'ant', name: 'Ant', class: 'bug', face: 'strike', power: 2 },
    { id: 'hare', name: 'Hare', class: 'beast', face: 'dash', power: 2 },
    { id: 'shrimp', name: 'Shrimp', class: 'aquatic', face: 'dash', power: 1 },
  ],
}

function findPart(slot, id) {
  const part = PARTS[slot].find((p) => p.id === id)
  if (!part) throw new Error(`Parte desconocida: ${slot}/${id}`)
  return part
}

// Construye el genoma a partir de una lista de ids, uno por slot en el orden de SLOTS.
export function buildGenome(ids) {
  const genome = {}
  SLOTS.forEach((slot, i) => {
    genome[slot] = { ...findPart(slot, ids[i]), slot, evolved: false }
  })
  return genome
}

// El dado: seis caras, una por parte, en el orden de SLOTS.
// Una parte evolucionada suma +1 de potencia a su cara.
export function makeDie(genome) {
  return SLOTS.map((slot) => {
    const part = genome[slot]
    return {
      slot,
      partId: part.id,
      partName: part.name,
      partClass: part.class,
      face: part.face,
      power: part.power + (part.evolved ? 1 : 0),
      evolved: part.evolved,
    }
  })
}

export function rollDie(die) {
  return die[Math.floor(Math.random() * die.length)]
}

// La clase del Axie es la que mas se repite entre sus partes. Igual que en Axie:
// el cuerpo lo determina la mayoria del genoma.
export function dominantClass(genome) {
  const count = {}
  SLOTS.forEach((slot) => {
    const c = genome[slot].class
    count[c] = (count[c] || 0) + 1
  })
  return Object.entries(count).sort((a, b) => b[1] - a[1])[0][0]
}

// Ascension: evoluciona la parte cuya cara acaba de usarse mas, o la primera sin
// evolucionar. Devuelve { genome, slot } con el slot que ha evolucionado.
export function ascend(genome, preferredSlot) {
  const order = preferredSlot ? [preferredSlot, ...SLOTS.filter((s) => s !== preferredSlot)] : SLOTS
  const slot = order.find((s) => !genome[s].evolved)
  if (!slot) return { genome, slot: null }
  const next = { ...genome, [slot]: { ...genome[slot], evolved: true } }
  return { genome: next, slot }
}

export function isAttackFace(face) {
  return face === 'strike' || face === 'pierce' || face === 'drain' || face === 'dash'
}

// Cuantas casillas puede recorrer una criatura con esta cara.
export function moveRange(face) {
  if (face === 'dash' || face === 'summon') return 2
  return 1
}

// Dano de un ataque contra un objetivo con def dada.
export function damageFrom(rolled, targetDef) {
  if (rolled.face === 'pierce') return Math.max(1, rolled.power)
  if (!isAttackFace(rolled.face)) return 1
  return Math.max(1, rolled.power - (targetDef || 0))
}

// --- MVP1 (docs/design/MVP1vinculodelunacia.md) ---
// Asedio a un mando fijo: Lord fijo + 3 Axies moviles por bando. Las 4 clases son
// deliberadamente incompatibles entre si (tanque/soldado/arquero/asesino). Los 12
// nombres de parte reales (paso 5 del documento) llegan mas adelante; de momento solo
// hace falta el chasis para tablero, movimiento, zona de control y ataque basico
// (pasos 1-3 del orden de construccion). Sin estadistica de defensa: el dano es el
// ataque basico del atacante, sin reduccion, hasta que las partes lo cambien.
// Vida y ataque en escala x10 (120/90/70/70 en vez de 12/9/7/7): numeros de una
// cifra hacian que un golpe se comiera medio bloque de vida de un tiro. La escala
// no cambia el balance (golpes-para-matar identico), solo la sensacion de barra de
// vida. Orden de vida deliberado: Beast (soldado) mas duro que Aqua (asesino) -
// arquetipo por encima del dato real de Axie Classic, que en Classic tiene a
// Aquatic casi tan tanque como Plant.
export const CLASS_STATS = {
  plant: { label: 'Plant', role: 'Tank', hp: 120, move: 1, range: 1, atk: 10, color: '#71c14b' },
  beast: { label: 'Beast', role: 'Soldier', hp: 90, move: 2, range: 1, atk: 20, color: '#f0a04b' },
  bird: { label: 'Bird', role: 'Archer', hp: 70, move: 2, range: 3, atk: 10, color: '#ef6f9c' },
  aqua: { label: 'Aqua', role: 'Assassin', hp: 70, move: 3, range: 1, atk: 20, color: '#3fa9e0' },
}

export const LORD_STATS = { hp: 240, move: 0, range: 2, atk: 30 }

// Paso 8: el dado del Lord, 6 caras -1 ataque + 5 habilidades de apoyo.
// Invocar una unidad nueva ocurre SOLO a traves de Duplicar (el jugador
// elige con el click: toca un aliado para clonarlo, o toca una casilla
// libre junto al Lord para sacar al siguiente de la reserva), asi que la
// reserva de 3 unidades nunca se queda sin forma de entrar en juego pese a
// no haber una cara de invocacion dedicada. El Lord no tiene "torre" en
// ningun nombre (ni el ataque ni el subtitulo de la carta).
//   - Muro: 30 de escudo a un aliado propio a alcance 3.
//   - Marca: un enemigo a alcance 3 queda marcado -el PROXIMO ataque que lo
//     impacte (de cualquier atacante) hace +20. Se consume al primer golpe.
//   - Cura: cura 15 de vida a un aliado propio a alcance 3.
//   - Templanza: bendice a un aliado propio a alcance 3 -su PROXIMO ataque
//     este turno hace +15. Se consume al golpear (o se pierde si no llega a
//     atacar).
//   - Duplicar: clona a un aliado propio VIVO a alcance 3 a vida llena (el
//     clon aparece junto al Lord, no adyacente al original, misma regla 16
//     que la invocacion), o -si el jugador toca una casilla libre junto al
//     Lord en vez de a un aliado- saca al siguiente de la reserva. La UNICA
//     cara del dado que mete una unidad nueva en el tablero.
export const LORD_DIE = [
  { id: 'lord-attack', name: 'Lord Attack', effect: 'lord-attack' },
  { id: 'lord-shield', name: 'Wall', effect: 'lord-shield', value: 30, range: 3 },
  { id: 'lord-mark', name: 'Mark', effect: 'lord-mark', value: 20, range: 3 },
  { id: 'lord-heal', name: 'Heal', effect: 'lord-heal', value: 15, range: 3 },
  { id: 'lord-buff', name: 'Temperance', effect: 'lord-buff', value: 15, range: 3 },
  { id: 'lord-clone', name: 'Duplicate', effect: 'lord-clone', range: 3 },
]

// Paso 4: los 4 tipos de terreno (seccion 6 del documento). El layout concreto de
// celdas vive en App.jsx (es un mapa de prueba: los 3 mapas reales son el paso 11).
//   blocksMove  -> nadie entra (piedra, obstaculo bajo).
//   blocksLine  -> tampoco se puede disparar a traves (solo piedra).
//   aquaOnly    -> solo entran unidades Aqua (agua).
//   moveCost    -> puntos de movimiento que cuesta entrar (zona lenta cuesta 2).
export const TERRAIN_TYPES = {
  open: { label: 'Open', blocksMove: false, blocksLine: false, aquaOnly: false, moveCost: 1 },
  stone: { label: 'Stone', blocksMove: true, blocksLine: true, aquaOnly: false, moveCost: Infinity },
  slow: { label: 'Slow zone', blocksMove: false, blocksLine: false, aquaOnly: false, moveCost: 2 },
  water: { label: 'Water', blocksMove: false, blocksLine: false, aquaOnly: true, moveCost: 1 },
  obstacle: { label: 'Low obstacle', blocksMove: true, blocksLine: false, aquaOnly: false, moveCost: Infinity },
}

// Paso 5: las 12 partes de combate reales (seccion 3 del documento). Los nombres son
// del catalogo real de Axie; habilidades y valores son los del documento, no
// inventados aqui. Cada clase tiene exactamente 3 partes propias -una por cada slot
// menos uno, nunca las 4- asi que el dado "estandar" de una clase (seccion 4.1, 3
// caras de combate) es siempre esas 3 partes, siempre con afinidad (seccion 3.6: +10
// si la clase de la parte coincide con el chasis). Ojos/orejas no producen carta en
// el MVP1 (seccion 3.5, paso MVP2).
export const PART_SLOTS = ['horn', 'mouth', 'back', 'tail']
export const SLOT_LABEL_MVP1 = {
  horn: 'Horn',
  mouth: 'Mouth',
  back: 'Back',
  tail: 'Tail',
  eyes: 'Eyes',
  ears: 'Ears',
}

// Las 6 ranuras del cuerpo del Axie, en el mismo orden que se ven en el modelo
// 3D, para el dado del dashboard (regla "las caras del dado son las partes").
// Ojos y orejas NO producen carta en el MVP1 (seccion 3.5, paso MVP2): en el
// dado salen como huecos vacios, nunca se tiran (u.die solo contiene las 4
// ranuras de combate de arriba).
export const DIE_SLOTS = ['eyes', 'ears', 'horn', 'mouth', 'back', 'tail']

export const PARTS_MVP1 = {
  'little-branch': {
    id: 'little-branch', name: 'Little Branch', slot: 'horn', class: 'plant',
    effect: 'pierce', value: 20, text: "Pierce: ignores the target's shield.",
  },
  imp: {
    id: 'imp', name: 'Imp', slot: 'horn', class: 'beast',
    effect: 'pierce-execute', value: 30,
    text: 'Pierce: ignores shield. +10 if the target is below half of its max HP.',
  },
  'feather-spear': {
    id: 'feather-spear', name: 'Feather Spear', slot: 'horn', class: 'bird',
    effect: 'ranged-bonus', value: 20, rangeBonus: 1,
    text: 'Ranged attack with +1 range over the chassis range.',
  },
  serious: {
    id: 'serious', name: 'Serious', slot: 'mouth', class: 'plant',
    effect: 'strike-shield-self', value: 20, shieldGain: 20,
    text: 'Strike. The attacker gains 20 shield.',
  },
  'risky-fish': {
    id: 'risky-fish', name: 'Risky Fish', slot: 'mouth', class: 'aqua',
    effect: 'strike-self-damage', value: 40, selfDamage: 10,
    text: 'Heavy strike. The attacker takes 10 damage (ignores its own shield).',
  },
  'nut-crack': {
    id: 'nut-crack', name: 'Nut Crack', slot: 'mouth', class: 'beast',
    effect: 'strike-combo', value: 30, comboWith: 'nut-throw', comboBonus: 20,
    text: 'Strike. +20 if this same Axie also carries Nut Throw.',
  },
  pumpkin: {
    id: 'pumpkin', name: 'Pumpkin', slot: 'back', class: 'plant',
    effect: 'guard', value: 30, text: 'Guard. Applied when rolled and does not spend the action.',
  },
  hermit: {
    id: 'hermit', name: 'Hermit', slot: 'back', class: 'aqua',
    effect: 'guard-heal', value: 20, heal: 10,
    text: 'Guard and heal 10 HP. Applied when rolled, does not spend the action.',
  },
  balloon: {
    id: 'balloon', name: 'Balloon', slot: 'back', class: 'bird',
    effect: 'guard-push', value: 20, push: 1,
    text: 'Guard and push an adjacent enemy 1 tile in a straight line. Applied when rolled, does not spend the action.',
  },
  'nut-throw': {
    id: 'nut-throw', name: 'Nut Throw', slot: 'tail', class: 'beast',
    effect: 'ranged-fixed', value: 20, fixedRange: 2, comboWith: 'nut-crack', comboBonus: 20,
    text: 'Ranged attack at range 2 (independent of chassis range). +20 if it also carries Nut Crack.',
  },
  shrimp: {
    id: 'shrimp', name: 'Shrimp', slot: 'tail', class: 'aqua',
    effect: 'dash-attack', value: 20, moveRange: 2,
    text: 'Dash: moves up to 2 and attacks at the end. Movement is still subject to zone of control.',
  },
  swallow: {
    id: 'swallow', name: 'Swallow', slot: 'tail', class: 'bird',
    effect: 'reposition-ally', value: null, moveAlly: 1,
    text: 'Reposition: moves an adjacent ally 1 tile. Does not attack.',
  },
}

export function standardDie(klass) {
  return Object.values(PARTS_MVP1)
    .filter((p) => p.class === klass)
    .map((p) => ({ ...p, affinity: true }))
    .sort((a, b) => PART_SLOTS.indexOf(a.slot) - PART_SLOTS.indexOf(b.slot))
}

export function rollFace(die) {
  return die[Math.floor(Math.random() * die.length)]
}

// Valor efectivo de una cara: +10 si hay afinidad (regla 3.6, en la escala x10 de
// vida/dano). Swallow no tiene valor numerico (no ataca), asi que no hay nada
// que subir.
export function faceValue(face) {
  if (face.value == null) return null
  return face.value + (face.affinity ? 10 : 0)
}
