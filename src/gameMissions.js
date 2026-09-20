// gameMissions.js — contenido del hub/mapa: el mundo navegable estilo NFS
// Carbon del PVE (regiones con nodos -> partidas) y las
// arenas PVP contra axies NORMALES (sin nombre de starter). Todo se resuelve
// en configs de partida (matchConfig) que App.jsx aplica en resetMatch():
// este modulo NO lleva logica de combate, solo datos. El mapa de prueba del
// MVP1 (TEST_TERRAIN en App.jsx) existe aparte como "escarmuza de prueba".

// Los mapas de las zonas. Terreno 8x7 (rows 0-7, cols 0-6). Reglas del terreno
// (axie.js/A1): 'stone' bloquea, 'slow' = +10 guardia a quien recibe dentro,
// 'obstacle' bajo = +1 alcance a quien dispara desde una casilla pegada,
// 'water' = solo lo cruza un Aqua. Cualquier celda no listada es 'open'.
export const TERRAIN_ZONES = {
  // Vega del Alba: agua en el centro-lateral, una isleta de obstaculos y zona
  // lenta en los flancos -el canal divide pero no bloquea a nadie.
  canal: {
    '1,2': 'water',
    '1,3': 'water',
    '1,4': 'water',
    '2,3': 'slow',
    '3,2': 'obstacle',
    '3,3': 'obstacle',
    '4,4': 'slow',
    '4,5': 'slow',
    '5,2': 'water',
    '6,3': 'water',
  },
  // Desfiladero Roto: paredes de piedra en cruz con un corredor libre por el
  // centro y zonas lentas obligando a rodear la cresta.
  roca: {
    '1,2': 'stone',
    '1,3': 'stone',
    '1,4': 'stone',
    '2,2': 'slow',
    '2,4': 'slow',
    '3,3': 'obstacle',
    '4,2': 'stone',
    '4,3': 'stone',
    '4,4': 'stone',
    '5,2': 'slow',
    '5,4': 'slow',
    '6,3': 'stone',
  },
  // Cumbre del Relampago / Arenas PVP: campo abierto con lagunas lentas y un
  // obstaculo a cada lado -poco terreno, los dados deciden la escaramuza.
  llanura: {
    '1,2': 'slow',
    '1,4': 'slow',
    '3,1': 'obstacle',
    '4,5': 'obstacle',
    '6,2': 'slow',
    '6,3': 'slow',
    '6,4': 'slow',
  },
}

// REGIONS (PVE): regiones del mapa, en coordenadas acotadas 0-100 (LunaciaMap
// las coloca). regiones desbloqueadas de entrada: la primera. Las demas se
// desbloquean al ganar los nodos de la anterior (hub->partida->victoria).
export const REGIONS = [
  {
    id: 'vega',
    name: 'Dawn Meadow',
    x: 24,
    y: 66,
    color: '#79c26a',
    terrain: 'canal',
    zones: [
      {
        id: 'vega-ronda',
        name: 'Meadow Patrol',
        blurb: 'The starters Buba, Momo and Puffy patrol the shore.',
        enemyTitle: 'Starter gang',
        starterEnemy: true,
        enemyClasses: ['beast', 'bird', 'aqua'],
        // hpScale 0.9: el nodo de apertura debe poder ganarse -en vivo medimos
        // que a escala 1 la partida se decide por un golpe (tiebreak 110/110).
        // El resto de zonas recupera dureza (1.0 en adelante).
        hpScale: 0.9,
        reward: 2,
      },
      {
        id: 'vega-arboleda',
        name: 'Red Grove',
        blurb: 'Doubled wild Axies: two beasts and a bird.',
        enemyTitle: 'Forest pack',
        starterEnemy: false,
        enemyClasses: ['beast', 'beast', 'bird'],
        hpScale: 1,
        reward: 3,
      },
      {
        id: 'vega-sendero',
        name: 'River Trail',
        blurb: 'The current rewards whoever crosses it: pure aquatics.',
        enemyTitle: 'River shoal',
        starterEnemy: false,
        enemyClasses: ['aqua', 'aqua', 'bird'],
        hpScale: 1.08,
        reward: 3,
      },
    ],
  },
  {
    id: 'desfiladero',
    name: 'Broken Gorge',
    x: 52,
    y: 40,
    color: '#a3a49a',
    terrain: 'roca',
    zones: [
      {
        id: 'rim-atalaya',
        name: 'Edge Watchtower',
        blurb: 'Stone walls narrow the pass; the rival mix is total.',
        enemyTitle: 'Edge sentinels',
        starterEnemy: false,
        enemyClasses: ['beast', 'bird', 'aqua'],
        hpScale: 1.15,
        reward: 4,
      },
      {
        id: 'rim-cueva',
        name: 'Echo Cave',
        blurb: 'Doubled beasts under the ridge, with more HP.',
        enemyTitle: 'Troglodyte horde',
        starterEnemy: false,
        enemyClasses: ['beast', 'beast', 'aqua'],
        hpScale: 1.2,
        reward: 5,
      },
    ],
  },
  {
    id: 'cumbre',
    name: 'Lightning Summit',
    x: 78,
    y: 20,
    color: '#c9a86a',
    terrain: 'roca',
    zones: [
      {
        id: 'cumbre-ruta',
        name: 'North Wind Route',
        blurb: 'The last gate on the map: a stern, fast rival.',
        enemyTitle: 'North wind stalkers',
        starterEnemy: false,
        enemyClasses: ['bird', 'bird', 'beast'],
        hpScale: 1.3,
        reward: 8,
      },
    ],
  },
]

// PVP_ARENAS (PVP): rivales "axes normales" (nombres de la comunidad, nunca
// nombre de starter). starterEnemy=false para que no lleven insignia.
export const PVP_ARENAS = [
  {
    id: 'novata',
    name: 'Rookie Arena',
    rival: 'Nilo of the Meadow',
    enemyTitle: "Nilo's team",
    blurb: 'A friendly challenge against a team of regular Axies.',
    enemyClasses: ['beast', 'bird', 'aqua'],
    hpScale: 1,
    reward: 3,
  },
  {
    id: 'mercader',
    name: 'Merchant Arena',
    rival: 'Kaori',
    enemyTitle: "Kaori's squad",
    blurb: 'Kaori trains aquatics and birds: fast pace and little guard.',
    enemyClasses: ['aqua', 'bird', 'aqua'],
    hpScale: 1.12,
    reward: 5,
  },
  {
    id: 'faro',
    name: 'Lighthouse Arena',
    rival: 'Vanth',
    enemyTitle: "Vanth's crew",
    blurb: 'The house duel: two beasts and a bird, well armed.',
    enemyClasses: ['beast', 'beast', 'bird'],
    hpScale: 1.22,
    reward: 7,
  },
]

function regionById(id) {
  return REGIONS.find((r) => r.id === id)
}
function zoneById(regionId, zoneId) {
  const region = regionById(regionId)
  return region && region.zones.find((z) => z.id === zoneId)
}

// Config de partida para un nodo PVE del mapa (la mismisima que usa
// startMatch(cfg) en App.jsx -> resetMatch). terreno = el mapa de su region.
export function nodeConfig(regionId, zoneId) {
  const region = regionById(regionId)
  const zone = zoneById(regionId, zoneId)
  if (!region || !zone) return null
  return {
    zone: `pve-${region.id}`,
    winKey: `pve-${region.id}-${zone.id}`,
    mode: 'pve',
    name: `${region.name} - ${zone.name}`,
    enemyTitle: zone.enemyTitle || 'Besiegers',
    blurb: zone.blurb || `${region.name}: ${zone.name}.`,
    enemyClasses: zone.enemyClasses || ['beast', 'bird', 'aqua'],
    starterEnemy: zone.starterEnemy !== false,
    hpScale: zone.hpScale || 1,
    reward: zone.reward || 2,
    terrain: TERRAIN_ZONES[region.terrain] || TERRAIN_ZONES.llanura,
  }
}

// Config de partida para una arena PVP (el rival siempre es axies normales).
export function arenaConfig(arenaId) {
  const arena = PVP_ARENAS.find((a) => a.id === arenaId)
  if (!arena) return null
  return {
    zone: `pvp-${arena.id}`,
    winKey: `pvp-${arena.id}`,
    mode: 'pvp',
    name: arena.name,
    enemyTitle: arena.enemyTitle || 'PVP rival',
    blurb: arena.blurb || `${arena.name}: ${arena.rival}.`,
    enemyClasses: arena.enemyClasses,
    starterEnemy: false,
    hpScale: arena.hpScale || 1,
    reward: arena.reward || 3,
    terrain: TERRAIN_ZONES.llanura,
  }
}