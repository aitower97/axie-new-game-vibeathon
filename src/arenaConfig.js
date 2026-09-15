// Configuración visual de una arena. El renderer 3D sigue siendo único; cada
// modo puede elegir una configuración distinta sin duplicar Board3D.
export const BATTLE_ARENA_CONFIG = {
  sky: {
    color: 0xa8c4b0,
    fogNear: 70,
    fogFar: 340,
  },
  lighting: {
    ambientColor: 0xffffff,
    ambientIntensity: 0.9,
    hemisphereSkyColor: 0xb9e6d0,
    hemisphereGroundColor: 0x49634f,
    hemisphereIntensity: 0.45,
    directionalColor: 0xffffff,
    directionalIntensity: 0.9,
    directionalPosition: [4, 10, 6],
    rimColor: 0x9bdcff,
    rimIntensity: 0.55,
    rimPosition: [-7, 6, -10],
  },
  camera: {
    elevationDeg: 30,
    azimuthDeg: -10,
    distance: 30,
    initialZoom: 1.08,
    combatFocusZoom: 1.06,
    combatFocusDuration: 0.55,
  },
  island: {
    bobSpeed: 0.5,
    bobAmplitude: 0.06,
  },
  // Identidad cromática de esta arena: tablero rojo con brillo cálido.
  board: {
    tint: 0xff3030,
    glow: 0xff4545,
    glowPower: 0.38,
  },
  world: {
    snowBlockUrl: '/models/block-snow.glb',
    decorUrls: {
      treeA: '/models/mini-forest/tree.glb',
      treeB: '/models/mini-forest/tree-high.glb',
      rockA: '/models/mini-forest/rocks-high.glb',
      rockB: '/models/mini-forest/rocks-low.glb',
      rockC: '/models/mini-forest/stones.glb',
      plant: '/models/mini-forest/plant.glb',
      patch: '/models/mini-forest/patch-grass.glb',
      patchDirt: '/models/mini-forest/patch-dirt.glb',
    },
    worldUrls: {
      slopeSteep: '/models/block-grass-large-slope-steep.glb',
      pine: '/models/tree-pine.glb',
      pineSmall: '/models/tree-pine-small.glb',
      grass: '/models/grass.glb',
      flowers: '/models/flowers.glb',
      mushrooms: '/models/mushrooms.glb',
    },
    fieldRadius: 300,
    lattice: 5,
    levels: 4,
  },
}

export const VILLAGE_ARENA_CONFIG = {
  ...BATTLE_ARENA_CONFIG,
  sceneProfile: 'village',
  sky: { ...BATTLE_ARENA_CONFIG.sky, color: 0x9ccf88, fogNear: 80, fogFar: 300 },
  lighting: {
    ...BATTLE_ARENA_CONFIG.lighting,
    hemisphereSkyColor: 0xd9f0b0,
    hemisphereGroundColor: 0x48643e,
    rimColor: 0xffe19a,
  },
  camera: { ...BATTLE_ARENA_CONFIG.camera, initialZoom: 1.02, combatFocusZoom: 1.02 },
  board: { tint: 0x79b957, glow: 0x9ddd69, glowPower: 0.22 },
}
