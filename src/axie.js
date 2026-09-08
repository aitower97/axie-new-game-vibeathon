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
