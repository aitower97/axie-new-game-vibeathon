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

// side -> clase MVP1 (beast/bird/aqua) -> AxieDescriptor. variant 2 para
// player y 4 para enemy -mismo individuo "de clase pura" pero un valor
// distinto, para que el roster no se vea identico a los dos lados del
// tablero (mismo espiritu que se intento con genomas reales).
export const ROSTER_DESCRIPTORS = {
  player: {
    beast: pureClassDescriptor('Beast', 2),
    bird: pureClassDescriptor('Bird', 2),
    aqua: pureClassDescriptor('Aquatic', 2),
  },
  enemy: {
    beast: pureClassDescriptor('Beast', 4),
    bird: pureClassDescriptor('Bird', 4),
    aqua: pureClassDescriptor('Aquatic', 4),
  },
}

// Los Lords no tienen clase propia en el MVP1 (2D siguen con su genoma fijo,
// PLAYER_LORD_GENOME/ENEMY_LORD_GENOME en App.jsx) -para el tablero 3D basta
// con dos clases que el roster NO usa (Bug, Reptile) para que se distingan
// de un vistazo del resto de unidades. Cuerpo "sumo" (mas grande/imponente,
// pedido explicito para diferenciar al Lord del roster) -las 8 formas de
// cuerpo (AXIE_BODY_TYPES) tienen su malla completa en el pack local
// (manifest.json -> assets.bodies.sumo.lods), y las partes de clase pura se
// enganchan sin problema (missingParts vacio, verificado antes de usarlo).
export const LORD_DESCRIPTORS = {
  player: pureClassDescriptor('Bug', 2, 'sumo'),
  enemy: pureClassDescriptor('Reptile', 2, 'sumo'),
}
