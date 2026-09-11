// axieMixer.js — puente entre el genoma del juego y @axieinfinity/mixer.
//
// El mixer no acepta nombres de parte ("Imp", "Goda"): quiere un genoma binario real
// o, mas directo, un AxieBodyStructure con clase + partValue numerico por parte.
// PART_GENE trae ese partValue verificado contra la tabla de genes real de Axie
// (github.com/ShaneMaglangit/agp/blob/main/assets/traits.json) para cada parte que
// usa el prototipo. No es un endpoint ni un paquete inventado: es el mismo dato que
// decodifica cualquier gene string 256-bit real, aplicado a mano porque el prototipo
// no parte de un gene on-chain sino de partes elegidas por diseno.
import {
  initAxieMixer,
  genesStuff,
  getAxieSpineFromCombo,
} from '@axieinfinity/mixer'
import GenesData from '@axieinfinity/mixer/dist/data/axie-2d-v3-stuff-genes.json'
import SamplesData from '@axieinfinity/mixer/dist/data/axie-2d-v3-stuff-samples.json'
import VariantsData from '@axieinfinity/mixer/dist/data/axie-2d-v3-stuff-variant.json'
import AnimationsData from '@axieinfinity/mixer/dist/data/axie-2d-v3-stuff-animations.json'

initAxieMixer(GenesData, SamplesData, VariantsData, AnimationsData)

// class con mayuscula inicial: asi los espera el enum CharacterClass del mixer.
const MIXER_CLASS = {
  beast: 'Beast',
  aquatic: 'Aquatic',
  plant: 'Plant',
  bird: 'Bird',
  bug: 'Bug',
  reptile: 'Reptile',
}

// slot en minuscula (axie.js) -> AxiePartType del mixer (mayuscula inicial).
const MIXER_SLOT = {
  eyes: 'Eyes',
  ears: 'Ears',
  horn: 'Horn',
  mouth: 'Mouth',
  back: 'Back',
  tail: 'Tail',
}

// partValue real por parte (clase real de la parte, no la clase dominante del Axie).
const PART_GENE = {
  eyes: {
    chubby: { class: 'beast', value: 10 },
    clear: { class: 'aquatic', value: 4 },
    papi: { class: 'plant', value: 2 },
  },
  ears: {
    puppy: { class: 'beast', value: 10 },
    'nut-cracker': { class: 'beast', value: 4 },
    lotus: { class: 'plant', value: 12 },
  },
  horn: {
    'little-branch': { class: 'beast', value: 2 },
    imp: { class: 'beast', value: 4 },
    cactus: { class: 'plant', value: 10 },
  },
  mouth: {
    serious: { class: 'plant', value: 2 },
    goda: { class: 'beast', value: 4 },
    'axie-kiss': { class: 'beast', value: 8 },
  },
  back: {
    hermit: { class: 'aquatic', value: 2 },
    balloon: { class: 'bird', value: 2 },
    timber: { class: 'beast', value: 10 },
  },
  tail: {
    ant: { class: 'bug', value: 2 },
    hare: { class: 'beast', value: 8 },
    shrimp: { class: 'aquatic', value: 12 },
  },
}

function partStructure(mixerClass, value) {
  const group = { class: mixerClass, value }
  return {
    stageCap: 2,
    stage: 0,
    reservation: 0,
    skinInheritability: false,
    skin: 0,
    groups: [group, group, group],
  }
}

// Construye el AxieBodyStructure que el mixer necesita para generar el combo de
// partes. El cuerpo base (forma, colores) se deja en su variante por defecto: lo que
// varia con el genoma del juego son las seis partes, que es donde vive el diseno.
function buildBodyStructure(genome, dominantClass) {
  const bodyClass = MIXER_CLASS[dominantClass] || 'Beast'
  const parts = {}
  for (const [slot, mixerSlot] of Object.entries(MIXER_SLOT)) {
    const part = genome[slot]
    const gene = PART_GENE[slot][part.id]
    parts[mixerSlot] = partStructure(MIXER_CLASS[gene.class] || bodyClass, gene.value)
  }
  return {
    class: bodyClass,
    body: [0, 0, 0],
    bodySkin: 0,
    primaryColors: [0, 0, 0],
    secondaryColors: [0, 0, 0],
    parts,
  }
}

// Nombre de clip de ataque por slot, verificado contra el catalogo de animaciones
// reales que usa Axie Origins (axie-origins-asset-kit, Documentation~/MixerAnimations.md).
// Solo horn/mouth/tail atacan en este prototipo (eyes/ears siempre son invocacion,
// back siempre es guardia), asi que no hace falta cubrir los seis slots.
export const SLOT_ATTACK_ANIM = {
  horn: 'attack/melee/horn-gore',
  mouth: 'attack/melee/mouth-bite',
  tail: 'attack/melee/tail-smash',
}
export const FALLBACK_ATTACK_ANIM = 'attack/melee/normal-attack'
export const IDLE_ANIM = 'action/idle/normal'

const spineCache = new Map()

// Devuelve { skeletonDataAsset, variant } listo para pixi-spine. Cachea por genoma
// (clase dominante + parte por slot + evolucion) para no reconstruir el spine en
// cada render de React.
export function getAxieSprite(genome, dominantClass) {
  const key = [
    dominantClass,
    ...Object.entries(genome).map(([slot, p]) => `${slot}:${p.id}:${p.evolved ? 1 : 0}`),
  ].join('|')
  if (spineCache.has(key)) return spineCache.get(key)

  const bodyStructure = buildBodyStructure(genome, dominantClass)
  const combo = genesStuff.getAdultCombo(bodyStructure)
  const result = getAxieSpineFromCombo(combo, 0, false)
  spineCache.set(key, result)
  return result
}

// mapa clase MVP1 (axie.js, CLASS_STATS) -> CharacterClass del mixer. 'aqua' del
// MVP1 es 'aquatic' en el catalogo real de Axie.
const MVP1_CLASS_TO_MIXER = { plant: 'Plant', beast: 'Beast', bird: 'Bird', aqua: 'Aquatic' }

// Axie "de clase pura" para las unidades moviles del MVP1 (paso 5: no tienen un
// genoma de seis partes propio, solo una clase de chasis). partValue 2 en las seis
// ranuras porque es el unico valor presente en las seis a la vez para las cuatro
// clases en la tabla real de muestras del paquete (genesStuff.partSamples, el mismo
// dato que trae @axieinfinity/mixer para generar combos -no es un genoma inventado,
// es el paquete resolviendo su propia clase con su propio dato real).
// Sin cache: puede haber varias unidades vivas de la misma clase a la vez (tablero
// + carta), cada una con su propio Spine, y SkeletonJson.readSkeletonData muta el
// skeletonDataAsset que recibe -reusar el mismo objeto entre Spines rompia el
// segundo que lo tocaba. getAdultCombo es una tabla en memoria, no una red; recalcular
// es barato.
export function getClassSprite(klass) {
  const mixerClass = MVP1_CLASS_TO_MIXER[klass] || 'Beast'
  const parts = {}
  for (const mixerSlot of Object.values(MIXER_SLOT)) {
    parts[mixerSlot] = partStructure(mixerClass, 2)
  }
  const bodyStructure = { class: mixerClass, body: [0, 0, 0], bodySkin: 0, primaryColors: [0, 0, 0], secondaryColors: [0, 0, 0], parts }
  const combo = genesStuff.getAdultCombo(bodyStructure)
  return getAxieSpineFromCombo(combo, 0, false)
}
