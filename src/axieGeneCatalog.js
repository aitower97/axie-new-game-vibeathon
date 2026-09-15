// axieGeneCatalog.js — genomas 3D para el roster y los Lords.
//
// Antes esto guardaba genomas REALES sacados en vivo del marketplace de Axie
// (graphql-gateway.axieinfinity.com/graphql). Se probaron 45 IDs reales
// distintos -las 4 clases del MVP1, precio suelo y la coleccion especial
// Mystic- y los 45 fallaron: 5 o 6 de sus 6 partes sin asset local. El pack
// que trae @jaatster/threejs-axie-mixer3d-public (public/assets/axie/,
// content-integrity.json: 5821 ficheros, 521 MB -todo lo que su propio
// copy-assets.mjs tiene para copiar, no hay una version "completa" mayor) es
// una demo con cobertura muy limitada de partes, no un espejo del universo
// real de Axies. Coincide con el aviso explicito de axie-vibeathon-brief.md:
// "Evitar el Three.js Axie Mixer -esta en beta y avisan de inestabilidad".
//
// En su lugar: AxieDescriptor de clase pura (mismo patron que ya usaba
// axieMixer.js para el mixer 2D, "Axie de clase pura... sin genoma propio,
// solo una clase de chasis"), con partValue/variant confirmados a mano contra
// public/assets/axie/manifest.json (grep de "standard-parts/S00_<Clase><NN>_
// L1_<Slot>.glb" para las 6 ranuras) antes de usarlos -variant 2 y 4 son los
// dos valores que SI tienen las 6 piezas (ojo/boca/oreja/cuerno/lomo/cola)
// presentes para las 6 clases del pack (Aquatic, Beast, Bird, Bug, Plant,
// Reptile); 6 y 12 estan incompletos (sin ojo ni boca) y se evitan.

const PART_TYPES = ['eye', 'mouth', 'ear', 'horn', 'back', 'tail']

// colorVariant NO es un indice dentro de la paleta de cada clase (eso es el
// campo "colorValue" del manifest) -es el indice GLOBAL y PLANO de
// manifest.json -> creator.colorVariants ("index"), que recorre las 6 clases
// una detras de otra (beast 0-5, plant 6-10, aquatic 11-16, bug 17-21, bird
// 22-26, reptile 27-32...). Pasar colorValue (p.ej. 4) directamente como
// colorVariant hacia que TODAS las clases cayeran en el rango de indices de
// Beast (todo salia naranja) -habia que sacar el "index" real de cada color
// que se queria. Elegidos a mano por ser el tono mas reconocible de cada
// clase (primary1 de cada entrada): naranja para Beast, azul vivo para
// Aquatic, rosa para Bird, rojo para Bug, morado para Reptile, verde para
// Plant. Verificados con missingParts vacio antes de usarlos.
const CLASS_COLOR_VARIANT = {
  Beast: 4, // index 4 -> beast-04, f5a037
  Aquatic: 15, // index 15 -> aquatic-04, 00b8ff
  Bird: 24, // index 24 -> bird-02, ff99b0
  Bug: 20, // index 20 -> bug-03, ff433e
  Reptile: 29, // index 29 -> reptile-02, c569cf
  Plant: 8, // index 8 -> plant-02, afdb1b
}

function pureClassDescriptor(resourceClass, variant, body = 'normal') {
  return {
    colorVariant: CLASS_COLOR_VARIANT[resourceClass] ?? 0,
    body,
    parts: PART_TYPES.map((type) => ({ type, skin: 0, class: resourceClass, variant, level: 1 })),
  }
}

// Clase del pack (color del chasis) por clase del MVP1.
const MVP1_PACK_CLASS = { plant: 'Plant', beast: 'Beast', bird: 'Bird', aqua: 'Aquatic' }

// Las caras del dado (PARTS_MVP1 en axie.js) ponen el NOMBRE real de la parte
// (Shrimp, Imp, Pumpkin...), asi que cada ranura del modelo tiene que usar la
// variante = id real de esa parte (no una generica 2/4 que no se corresponda:
// la cola Aquatic v2 es Koi, v4 Nimo, no Shrimp) -decoder agp,
// github.com/ShaneMaglangit/agp, cruzado con PART_GENE ya verificado en
// axieMixer.js: shrimp tail=12,
// hermit back=2, balloon back=2, serious mouth=2, imp horn=4, little-branch
// horn=2...). En el pack del mixer 3D las variantes por (clase, ranura) son
// los pares (ojos/bocas solo 2/4/8/10, el resto ademas 6/12 - verificado en
// public/assets/axie/manifest.json), asi que la variante ES la parte real: la
// cola Aquatic v12 se ve como un Shrimp de verdad, el lomo Bird v2 como un
// Balloon. Todas las ranuras estan mapeadas, tambien las que NO tienen carta
// en el dado (ojo/oreja y el 4.º slot de combate de cada clase): llevan una
// parte real coherente del chasis -Jaguar de lomo Beast, Hungry Bird de boca
// Bird, Anemone de cuerno Aquatic, Carrot de cola Plant...
const ROSTER_PARTS = {
  plant: {
    horn: { class: 'Beast', variant: 2 }, // Little Branch (real: cuerno de Beast)
    mouth: { class: 'Plant', variant: 2 }, // Serious
    back: { class: 'Plant', variant: 12 }, // Pumpkin
    tail: { class: 'Plant', variant: 2 }, // Carrot (sin carta en el dado)
  },
  beast: {
    horn: { class: 'Beast', variant: 4 }, // Imp
    mouth: { class: 'Beast', variant: 2 }, // Nut Cracker
    back: { class: 'Beast', variant: 6 }, // Jaguar (sin carta)
    tail: { class: 'Beast', variant: 10 }, // Nut Throw (id 10 en agp)
  },
  bird: {
    horn: { class: 'Bird', variant: 12 }, // Feather Spear
    mouth: { class: 'Bird', variant: 8 }, // Hungry Bird (sin carta)
    back: { class: 'Bird', variant: 2 }, // Balloon
    tail: { class: 'Bird', variant: 2 }, // Swallow (renombrada desde Pigeon Post,
    // cuyo modelo real es lomo id 8, no cola)
  },
  aqua: {
    horn: { class: 'Aquatic', variant: 8 }, // Anemone (sin carta)
    mouth: { class: 'Aquatic', variant: 8 }, // Risky Fish
    back: { class: 'Aquatic', variant: 2 }, // Hermit (renombrada desde Clam Shell,
    // cuyo modelo real es cuerno id 6, no lomo)
    tail: { class: 'Aquatic', variant: 12 }, // Shrimp
  },
}

// Descriptor del roster con TODAS las ranuras puestas a partes reales (ver
// ROSTER_PARTS). Lo unico que distingue a los dos lados son los OJOS y las
// OREJAS: `fallbackVariant` (2 jugador / 4 enemigo) elige una parte real de la
// misma clase pero distinta por bando (Beast eyes 2 Zeal / 4 Little Peas,
// Bird ears 2 Pink Cheek / 4 Early Bird...), como antes -cuerpo de clase pura
// con un valor distinto para que no se vean identicos los dos lados.
function rosterDescriptor(klassMvp1, fallbackVariant) {
  const packClass = MVP1_PACK_CLASS[klassMvp1] || 'Beast'
  const namedParts = ROSTER_PARTS[klassMvp1] || {}
  return {
    colorVariant: CLASS_COLOR_VARIANT[packClass] ?? 0,
    body: 'normal',
    parts: PART_TYPES.map((type) => {
      if (type === 'eye' || type === 'ear') {
        return { type, skin: 0, class: packClass, variant: fallbackVariant, level: 1 }
      }
      const named = namedParts[type]
      return {
        type,
        skin: 0,
        class: named ? named.class : packClass,
        variant: named ? named.variant : fallbackVariant,
        level: 1,
      }
    }),
  }
}

// Starters oficiales de Axie como rivales del PvE (reconstruidos con partes,
// no como modelo completo): el roster enemigo no es un clon generico del
// nuestro, es la pandilla de starters con nombre propio -Buba (Beast), Momo
// (Bird) y Puffy (Aquatic)-, las mismas
// mascotas que el repos oficial 3D (axie-starter-3d-assets) trae como
// modelos completos. NO se cargan como modelos enteros (romperia la premisa
// del dado de 6 partes), se RE-CONSTRUYEN con las partes reales de su clase
// (ROSTER_PARTS: mismas caras de dado ya verificadas) y se distinguen del
// roster propio por su color real -cada starter usa un colorVariant que
// existe de verdad en manifest.json y que ningun otro bando usa (antes TODOS
// los colores de clase eran identicos en los dos lados y solo ojos/orejas
// 2 vs 4 los separaban). Los spines 2D oficiales confirman que los starters
// son mascotas con skeleton propio (slots genericos back/horn/mouth/tail,
// sin nombres de parte reales), no criaturas modulares.
export const STARTER_INFO = {
  beast: { name: 'Buba', colorVariant: 3 }, // beast-03, fdb014 (naranja mas dorado)
  bird: { name: 'Momo', colorVariant: 26 }, // bird-04, ff78b4 (rosa mas intenso)
  aqua: { name: 'Puffy', colorVariant: 14 }, // aquatic-03, 00dff3 (cian)
}

function starterDescriptor(klassMvp1, fallbackVariant) {
  const d = rosterDescriptor(klassMvp1, fallbackVariant)
  const starter = STARTER_INFO[klassMvp1]
  if (starter) d.colorVariant = starter.colorVariant
  return d
}

// side -> clase MVP1 (beast/bird/aqua) -> AxieDescriptor con TODAS las partes
// reales de esa clase (ver ROSTER_PARTS) + ojos/orejas por bando (2/4).
export const ROSTER_DESCRIPTORS = {
  player: {
    plant: rosterDescriptor('plant', 2),
    beast: rosterDescriptor('beast', 2),
    bird: rosterDescriptor('bird', 2),
    aqua: rosterDescriptor('aqua', 2),
  },
  enemy: {
    beast: starterDescriptor('beast', 4),
    bird: starterDescriptor('bird', 4),
    aqua: starterDescriptor('aqua', 4),
  },
}

// Los Lords no tienen clase propia en el MVP1 (2D siguen con su genoma fijo,
// PLAYER_LORD_GENOME/ENEMY_LORD_GENOME en App.jsx) -para el tablero 3D basta
// con dos clases que el roster NO usa (Bug, Reptile) para que se distingan
// de un vistazo del resto de unidades. Cuerpo "sumo" (mas grande/imponente,
// para diferenciar al Lord del roster) -las 8 formas de cuerpo
// (AXIE_BODY_TYPES) tienen su malla completa en el pack local
// (manifest.json -> assets.bodies.sumo.lods), y las partes de clase pura se
// enganchan sin problema (missingParts vacio, verificado antes de usarlo).
export const LORD_DESCRIPTORS = {
  player: pureClassDescriptor('Bug', 2, 'sumo'),
  enemy: pureClassDescriptor('Reptile', 2, 'sumo'),
}
