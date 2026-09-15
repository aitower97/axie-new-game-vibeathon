import { ACTOR_ACTIVITY, createActorState } from '../../core/entities/actor.js'

export const VILLAGE_ROWS = 20
export const VILLAGE_COLS = 20

export const VILLAGE_RESOURCES = Object.freeze({
  WOOD: 'wood',
  STONE: 'stone',
  FOOD: 'food',
})

export const VILLAGE_BUILDING_TYPES = Object.freeze({
  TOWN_HALL: 'town-hall',
  HOUSE: 'house',
  STORAGE: 'storage',
  WAREHOUSE: 'warehouse',
  FARM: 'farm',
  MINE: 'mine',
})

const cell = (r, c) => ({ r, c })

const INITIAL_BUILDINGS = [
  { id: 'town-hall-1', type: VILLAGE_BUILDING_TYPES.TOWN_HALL, pos: cell(9, 9), footprint: { rows: 2, cols: 2 } },
  { id: 'house-1', type: VILLAGE_BUILDING_TYPES.HOUSE, pos: cell(7, 8), footprint: { rows: 1, cols: 1 } },
  { id: 'house-2', type: VILLAGE_BUILDING_TYPES.HOUSE, pos: cell(7, 11), footprint: { rows: 1, cols: 1 } },
  { id: 'storage-1', type: VILLAGE_BUILDING_TYPES.STORAGE, pos: cell(11, 9), footprint: { rows: 2, cols: 2 } },
  { id: 'farm-1', type: VILLAGE_BUILDING_TYPES.FARM, pos: cell(14, 9), footprint: { rows: 2, cols: 3 } },
  { id: 'mine-1', type: VILLAGE_BUILDING_TYPES.MINE, pos: cell(15, 14), footprint: { rows: 2, cols: 2 } },
]

const INITIAL_RESOURCE_NODES = [
  { id: 'wood-1', type: VILLAGE_RESOURCES.WOOD, pos: cell(3, 3), amount: 120, maxAmount: 120, workTime: 2, available: true },
  { id: 'wood-2', type: VILLAGE_RESOURCES.WOOD, pos: cell(5, 4), amount: 120, maxAmount: 120, workTime: 2, available: true },
  { id: 'wood-3', type: VILLAGE_RESOURCES.WOOD, pos: cell(7, 2), amount: 120, maxAmount: 120, workTime: 2, available: true },
  { id: 'stone-1', type: VILLAGE_RESOURCES.STONE, pos: cell(3, 16), amount: 120, maxAmount: 120, workTime: 2.5, available: true },
  { id: 'stone-2', type: VILLAGE_RESOURCES.STONE, pos: cell(5, 15), amount: 120, maxAmount: 120, workTime: 2.5, available: true },
  { id: 'food-1', type: VILLAGE_RESOURCES.FOOD, pos: cell(15, 4), amount: 120, maxAmount: 120, workTime: 1.5, available: true },
  { id: 'food-2', type: VILLAGE_RESOURCES.FOOD, pos: cell(16, 6), amount: 120, maxAmount: 120, workTime: 1.5, available: true },
]

const INITIAL_ROADS = [
  ...Array.from({ length: 9 }, (_, i) => cell(10, 5 + i)),
  ...Array.from({ length: 6 }, (_, i) => cell(11 + i, 10)),
  ...Array.from({ length: 7 }, (_, i) => cell(9 - i, 10)),
]

const INITIAL_AXIES = [
  { id: 'villager-1', klass: 'plant', pos: cell(8, 9) },
  { id: 'villager-2', klass: 'beast', pos: cell(8, 10) },
  { id: 'villager-3', klass: 'aqua', pos: cell(9, 8) },
  { id: 'villager-4', klass: 'bird', pos: cell(10, 8) },
  { id: 'villager-5', klass: 'plant', pos: cell(10, 11) },
]

function makeVillageAxie({ id, klass, pos }) {
  return {
    ...createActorState({ kind: 'axie', pos }),
    id,
    klass,
    side: 'player',
    activity: ACTOR_ACTIVITY.IDLE,
    task: null,
    carrying: null,
  }
}

export function createInitialVillageState() {
  return {
    mode: 'village',
    dimensions: { rows: VILLAGE_ROWS, cols: VILLAGE_COLS },
    resources: {
      [VILLAGE_RESOURCES.WOOD]: 0,
      [VILLAGE_RESOURCES.STONE]: 0,
      [VILLAGE_RESOURCES.FOOD]: 0,
    },
    buildings: INITIAL_BUILDINGS.map((building) => ({ ...building, state: 'built' })),
    resourceNodes: INITIAL_RESOURCE_NODES.map((node) => ({ ...node, gridPosition: { ...node.pos } })),
    roads: INITIAL_ROADS.map((road) => ({ ...road })),
    axies: INITIAL_AXIES.map(makeVillageAxie),
    population: {
      current: 5,
      capacity: 10,
    },
    selectedEntityId: null,
  }
}
