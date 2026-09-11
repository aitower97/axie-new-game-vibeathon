// axie.js — el genoma ES el dado.
//
// Un Axie tiene seis partes del cuerpo (eyes, ears, horn, mouth, back, tail) y una
// clase. Cada parte ocupa una cara del dado. Tirar el dado no dice "cuanto pego",
// dice "que puedo hacer este turno".
//
// La Ascension no sube un numero: evoluciona UNA parte concreta y reescribe esa cara.

export const SLOTS = ['eyes', 'ears', 'horn', 'mouth', 'back', 'tail']

export const SLOT_LABEL = {
  eyes: 'Ojos',
  ears: 'Orejas',
  horn: 'Cuerno',
  mouth: 'Boca',
  back: 'Lomo',
  tail: 'Cola',
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
  summon: { glyph: '✦', name: 'Invocacion', hint: 'Fuera: entra al tablero. Dentro: mueve 2 o golpea 1 si tienes un rival al lado.' },
  strike: { glyph: '⚔', name: 'Golpe', hint: 'Ataque normal, la DEF lo reduce.' },
  pierce: { glyph: '➤', name: 'Perforante', hint: 'Ignora la DEF del objetivo.' },
  drain: { glyph: '♥', name: 'Drenaje', hint: 'Ataca y te cura 1.' },
  guard: { glyph: '◉', name: 'Guardia', hint: 'Escudo inmediato al tirar.' },
  dash: { glyph: '⇉', name: 'Impulso', hint: 'Mueve hasta 2 y puede atacar.' },
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

// --- MVP1 (MVP1vinculodelunacia.md) ---
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
  plant: { label: 'Plant', role: 'Tanque', hp: 120, move: 1, range: 1, atk: 10, color: '#71c14b' },
  beast: { label: 'Beast', role: 'Soldado', hp: 90, move: 2, range: 1, atk: 20, color: '#f0a04b' },
  bird: { label: 'Bird', role: 'Arquero', hp: 70, move: 2, range: 3, atk: 10, color: '#ef6f9c' },
  aqua: { label: 'Aqua', role: 'Asesino', hp: 70, move: 3, range: 1, atk: 20, color: '#3fa9e0' },
}

export const LORD_STATS = { hp: 240, move: 0, range: 2, atk: 30 }

// Paso 8 (rediseñado 2026-09-10 dos veces, ambas a pedido explicito del
// usuario): el dado del Lord, 6 caras.
//
// Primer rediseño: la version original (seccion 4.2 del documento) era 1
// ataque + 2 invocacion + 3 ranuras bloqueadas que, sin desbloquear (paso 12,
// sistema de Esencia no implementado en el MVP1), se comportaban TAMBIEN
// como invocacion -> 5 caras de 6 invocaban. El usuario reporto que eso
// alarga la partida sin sentido. Las 3 ranuras bloqueadas se sustituyeron
// por las 3 habilidades de apoyo del documento (seccion 4.3), con "Llamada"
// cambiada por "Duplicar".
//
// Segundo rediseño (mismo dia): el usuario pidio ir mas lejos -"quiero que
// las habilidades no sean meter mas axies... el que haya invocacion solo
// sea en la de duplicar"- y ademas quitar toda mencion a "torre" (el Lord ya
// no se llama "torre" en ningun sitio, ni el ataque ni el subtitulo de la
// carta). Las 2 caras de Invocacion desaparecen del todo: se sustituyen por
// dos buffs pequeños para el equipo (Cura, Templanza). La reserva de 3
// unidades no se queda huerfana -Duplicar pasa a cubrir TANTO clonar un
// aliado en el tablero COMO sacar de la reserva (el jugador elige con el
// click: toca un aliado para clonarlo, o toca una casilla libre junto al
// Lord para sacar al siguiente de la reserva), asi que "invocacion" sigue
// existiendo pero unicamente dentro de esta cara.
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
  { id: 'lord-attack', name: 'Ataque del Lord', effect: 'lord-attack' },
  { id: 'lord-shield', name: 'Muro', effect: 'lord-shield', value: 30, range: 3 },
  { id: 'lord-mark', name: 'Marca', effect: 'lord-mark', value: 20, range: 3 },
  { id: 'lord-heal', name: 'Cura', effect: 'lord-heal', value: 15, range: 3 },
  { id: 'lord-buff', name: 'Templanza', effect: 'lord-buff', value: 15, range: 3 },
  { id: 'lord-clone', name: 'Duplicar', effect: 'lord-clone', range: 3 },
]

// Paso 4: los 4 tipos de terreno (seccion 6 del documento). El layout concreto de
// celdas vive en App.jsx (es un mapa de prueba: los 3 mapas reales son el paso 11).
//   blocksMove  -> nadie entra (piedra, obstaculo bajo).
//   blocksLine  -> tampoco se puede disparar a traves (solo piedra).
//   aquaOnly    -> solo entran unidades Aqua (agua).
//   moveCost    -> puntos de movimiento que cuesta entrar (zona lenta cuesta 2).
export const TERRAIN_TYPES = {
  open: { label: 'Abierto', blocksMove: false, blocksLine: false, aquaOnly: false, moveCost: 1 },
  stone: { label: 'Piedra', blocksMove: true, blocksLine: true, aquaOnly: false, moveCost: Infinity },
  slow: { label: 'Zona lenta', blocksMove: false, blocksLine: false, aquaOnly: false, moveCost: 2 },
  water: { label: 'Agua', blocksMove: false, blocksLine: false, aquaOnly: true, moveCost: 1 },
  obstacle: { label: 'Obstaculo bajo', blocksMove: true, blocksLine: false, aquaOnly: false, moveCost: Infinity },
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
  horn: 'Cuerno',
  mouth: 'Boca',
  back: 'Lomo',
  tail: 'Cola',
  eyes: 'Ojos',
  ears: 'Orejas',
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
    effect: 'pierce', value: 20, text: 'Perforante: ignora el escudo del objetivo.',
  },
  imp: {
    id: 'imp', name: 'Imp', slot: 'horn', class: 'beast',
    effect: 'pierce-execute', value: 30,
    text: 'Perforante: ignora el escudo. +10 si el objetivo esta por debajo de la mitad de su vida maxima.',
  },
  'feather-spear': {
    id: 'feather-spear', name: 'Feather Spear', slot: 'horn', class: 'bird',
    effect: 'ranged-bonus', value: 20, rangeBonus: 1,
    text: 'Ataque a distancia con +1 de alcance sobre el del chasis.',
  },
  serious: {
    id: 'serious', name: 'Serious', slot: 'mouth', class: 'plant',
    effect: 'strike-shield-self', value: 20, shieldGain: 20,
    text: 'Golpe. El atacante gana 20 de escudo.',
  },
  'risky-fish': {
    id: 'risky-fish', name: 'Risky Fish', slot: 'mouth', class: 'aqua',
    effect: 'strike-self-damage', value: 40, selfDamage: 10,
    text: 'Golpe fuerte. El atacante se hace 10 de dano (ignora su propio escudo).',
  },
  'nut-crack': {
    id: 'nut-crack', name: 'Nut Crack', slot: 'mouth', class: 'beast',
    effect: 'strike-combo', value: 30, comboWith: 'nut-throw', comboBonus: 20,
    text: 'Golpe. +20 si este mismo Axie lleva tambien Nut Throw.',
  },
  pumpkin: {
    id: 'pumpkin', name: 'Pumpkin', slot: 'back', class: 'plant',
    effect: 'guard', value: 30, text: 'Guardia. Se aplica al tirar y no gasta la accion.',
  },
  'clam-shell': {
    id: 'clam-shell', name: 'Clam Shell', slot: 'back', class: 'aqua',
    effect: 'guard-heal', value: 20, heal: 10,
    text: 'Guardia y cura 10 de vida. Se aplica al tirar, no gasta la accion.',
  },
  balloon: {
    id: 'balloon', name: 'Balloon', slot: 'back', class: 'bird',
    effect: 'guard-push', value: 20, push: 1,
    text: 'Guardia y empuja 1 casilla a un enemigo adyacente, en linea recta. Se aplica al tirar, no gasta la accion.',
  },
  'nut-throw': {
    id: 'nut-throw', name: 'Nut Throw', slot: 'tail', class: 'beast',
    effect: 'ranged-fixed', value: 20, fixedRange: 2, comboWith: 'nut-crack', comboBonus: 20,
    text: 'Ataque a distancia 2 (independiente del alcance del chasis). +20 si lleva tambien Nut Crack.',
  },
  shrimp: {
    id: 'shrimp', name: 'Shrimp', slot: 'tail', class: 'aqua',
    effect: 'dash-attack', value: 20, moveRange: 2,
    text: 'Impulso: mueve hasta 2 y ataca al final. El movimiento sigue sujeto a zona de control.',
  },
  'pigeon-post': {
    id: 'pigeon-post', name: 'Pigeon Post', slot: 'tail', class: 'bird',
    effect: 'reposition-ally', value: null, moveAlly: 1,
    text: 'Reposiciona: mueve 1 casilla a un aliado adyacente. No ataca.',
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
// vida/dano). Pigeon Post no tiene valor numerico (no ataca), asi que no hay nada
// que subir.
export function faceValue(face) {
  if (face.value == null) return null
  return face.value + (face.affinity ? 10 : 0)
}
