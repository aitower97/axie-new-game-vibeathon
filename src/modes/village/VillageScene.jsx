import { useEffect, useMemo, useRef, useState } from 'react'
import Board3D from '../../Board3D'
import { ROSTER_DESCRIPTORS } from '../../axieGeneCatalog'
import { VILLAGE_ARENA_CONFIG } from '../../arenaConfig'
import { findGridPath } from '../../core/grid/findPath'
import { ACTOR_ACTIVITY } from '../../core/entities/actor.js'
import { createInitialVillageState, VILLAGE_COLS, VILLAGE_ROWS } from './villageState'

const BLOCK_URL = '/models/block-grass.glb'
const CELL_SIZE = 64
const OPEN_TERRAIN = () => 'open'
const EMPTY_URLS = Object.freeze({})
const NO_FX = Object.freeze([])
const NO_TWEEN = () => {}

const BUILDING_LABELS = {
  'town-hall': 'Town Hall',
  house: 'House',
  storage: 'Storage',
  warehouse: 'Warehouse',
  farm: 'Farm',
  mine: 'Mine',
}

const RESOURCE_LABELS = { wood: 'Wood', stone: 'Stone', food: 'Food' }
const ACTIVITY_LABELS = {
  [ACTOR_ACTIVITY.IDLE]: 'Available',
  [ACTOR_ACTIVITY.MOVING]: 'Moving',
  [ACTOR_ACTIVITY.WORKING]: 'Working',
  [ACTOR_ACTIVITY.CARRYING]: 'Carrying',
}

export default function VillageScene({ onResourcesChange }) {
  const initialState = useMemo(() => createInitialVillageState(), [])
  const [state, setState] = useState(initialState)
  const stateRef = useRef(initialState)
  useEffect(() => {
    stateRef.current = state
  }, [state])
  useEffect(() => {
    onResourcesChange?.(state.resources)
  }, [onResourcesChange, state.resources])
  const [selectedAxieId, setSelectedAxieId] = useState(null)
  const [selectedResourceId, setSelectedResourceId] = useState(null)
  const [selectedBuildingId, setSelectedBuildingId] = useState(null)
  const overlayElRef = useRef(null)
  const buildingByCell = new Map(state.buildings.map((building) => [`${building.pos.r},${building.pos.c}`, building]))
  const resourceByCell = new Map(state.resourceNodes.map((node) => [`${node.pos.r},${node.pos.c}`, node]))
  const roadCells = new Set(state.roads.map((road) => `${road.r},${road.c}`))
  const axieUnits = state.axies.map((axie) => ({
    id: axie.id,
    r: axie.pos.r,
    c: axie.pos.c,
    descriptor: ROSTER_DESCRIPTORS.player?.[axie.klass],
    isLord: false,
    facing: { r: 9, c: 9 },
    side: 'player',
    selected: axie.id === selectedAxieId,
    movePath: axie.movePath,
  }))

  const buildingCells = new Set()
  for (const building of state.buildings) {
    for (let r = building.pos.r; r < building.pos.r + building.footprint.rows; r++) {
      for (let c = building.pos.c; c < building.pos.c + building.footprint.cols; c++) buildingCells.add(`${r},${c}`)
    }
  }
  const axieByCell = new Map(state.axies.map((axie) => [`${axie.pos.r},${axie.pos.c}`, axie]))
  const selectedAxie = state.axies.find((axie) => axie.id === selectedAxieId)

  function stopSelectedTask() {
    if (!selectedAxie || selectedAxie.activity === ACTOR_ACTIVITY.CARRYING) return
    setState((current) => ({
      ...current,
      axies: current.axies.map((axie) => axie.id === selectedAxie.id
        ? { ...axie, activity: ACTOR_ACTIVITY.IDLE, movePath: null, task: null }
        : axie),
    }))
  }

  function handleVillageCellClick(r, c) {
    const key = `${r},${c}`
    const occupant = axieByCell.get(key)
    if (occupant) {
      setSelectedAxieId((current) => (current === occupant.id ? null : occupant.id))
      return
    }
    const resource = resourceByCell.get(key)
    const building = buildingByCell.get(key)
    if (!selectedAxieId) {
      if (resource && resource.available) {
        setSelectedResourceId(resource.id)
        setSelectedBuildingId(null)
      } else if (building) {
        setSelectedBuildingId(building.id)
        setSelectedResourceId(null)
      }
      return
    }
    const selectedAxie = state.axies.find((axie) => axie.id === selectedAxieId)
    if (!selectedAxie || buildingCells.has(key)) return
    // Un Axie ocupado conserva su tarea; una orden fallida sobre otra celda
    // nunca debe reciclarlo ni cambiarle el destino accidentalmente.
    if (selectedAxie.activity !== ACTOR_ACTIVITY.IDLE) return
    if (resource && !resource.available) return
    const path = findGridPath(selectedAxie.pos, { r, c }, {
      rows: VILLAGE_ROWS,
      cols: VILLAGE_COLS,
      isPassable: (cell) => !buildingCells.has(`${cell.r},${cell.c}`),
      canEnter: (cell) => !state.axies.some((axie) => axie.id !== selectedAxie.id && axie.pos.r === cell.r && axie.pos.c === cell.c),
    })
    if (!path || path.length < 2) return
    const task = resource
      ? { type: resource.type === 'wood' ? 'woodcutter' : resource.type === 'stone' ? 'miner' : 'farmer', resourceNodeId: resource.id }
      : null
    const storage = state.buildings.find((building) => building.type === 'storage' || building.type === 'warehouse')
    const storageDropCandidates = storage ? [
      { r: storage.pos.r - 1, c: storage.pos.c + storage.footprint.cols },
      { r: storage.pos.r + storage.footprint.rows, c: storage.pos.c },
      { r: storage.pos.r - 1, c: storage.pos.c - 1 },
      { r: storage.pos.r + storage.footprint.rows, c: storage.pos.c + storage.footprint.cols - 1 },
    ] : []
    const storageDropCell = storageDropCandidates.find((cell) => (
      cell.r >= 0 && cell.r < VILLAGE_ROWS && cell.c >= 0 && cell.c < VILLAGE_COLS &&
      !buildingCells.has(`${cell.r},${cell.c}`) &&
      !state.axies.some((axie) => axie.id !== selectedAxie.id && axie.pos.r === cell.r && axie.pos.c === cell.c)
    )) || null
    const returnPath = task && storageDropCell
      ? findGridPath({ r, c }, storageDropCell, {
          rows: VILLAGE_ROWS,
          cols: VILLAGE_COLS,
          isPassable: (cell) => !buildingCells.has(`${cell.r},${cell.c}`),
          canEnter: (cell) => !state.axies.some((axie) => axie.id !== selectedAxie.id && axie.pos.r === cell.r && axie.pos.c === cell.c),
        })
      : null
    const resourceType = task?.type === 'woodcutter' ? 'wood' : task?.type === 'miner' ? 'stone' : 'food'
    const repeatResourceCycle = task && storageDropCell && returnPath
      ? () => {
          const pathToResource = findGridPath(storageDropCell, { r, c }, {
            rows: VILLAGE_ROWS,
            cols: VILLAGE_COLS,
            isPassable: (cell) => !buildingCells.has(`${cell.r},${cell.c}`),
            canEnter: (cell) => !state.axies.some((axie) => axie.id !== selectedAxie.id && axie.pos.r === cell.r && axie.pos.c === cell.c),
          })
          if (!pathToResource || pathToResource.length < 2) return
          setState((current) => ({
            ...current,
            axies: current.axies.map((axie) => axie.id === selectedAxie.id
              ? { ...axie, pos: { r, c }, movePath: pathToResource, activity: ACTOR_ACTIVITY.MOVING, task }
              : axie),
          }))
          window.setTimeout(() => {
            setState((current) => ({
              ...current,
              axies: current.axies.map((axie) => axie.id === selectedAxie.id && axie.task?.resourceNodeId === task.resourceNodeId
                ? { ...axie, movePath: null, activity: ACTOR_ACTIVITY.WORKING }
                : axie),
            }))
            window.setTimeout(() => {
              const liveAxie = stateRef.current.axies.find((axie) => axie.id === selectedAxie.id)
              if (liveAxie?.task?.resourceNodeId !== task.resourceNodeId) return
              const liveNode = stateRef.current.resourceNodes.find((entry) => entry.id === task.resourceNodeId)
              if (!liveNode || !liveNode.available || liveNode.amount <= 0) {
                setState((current) => ({ ...current, axies: current.axies.map((axie) => axie.id === selectedAxie.id ? { ...axie, activity: ACTOR_ACTIVITY.IDLE, task: null } : axie) }))
                return
              }
              const amount = Math.min(10, liveNode.amount)
              setState((current) => ({
                ...current,
                resourceNodes: current.resourceNodes.map((entry) => entry.id === task.resourceNodeId
                  ? { ...entry, amount: Math.max(0, entry.amount - amount), available: entry.amount - amount > 0 }
                  : entry),
                axies: current.axies.map((axie) => axie.id === selectedAxie.id
                  ? { ...axie, pos: storageDropCell, movePath: returnPath, activity: ACTOR_ACTIVITY.CARRYING, carrying: { type: resourceType, amount } }
                  : axie),
              }))
              window.setTimeout(() => {
                setState((current) => ({
                  ...current,
                  resources: { ...current.resources, [resourceType]: current.resources[resourceType] + amount },
                  axies: current.axies.map((axie) => axie.id === selectedAxie.id
                    ? { ...axie, pos: storageDropCell, movePath: null, activity: ACTOR_ACTIVITY.IDLE, carrying: null, task: null }
                    : axie),
                }))
                window.setTimeout(repeatResourceCycle, 0)
              }, Math.max(700, (returnPath.length - 1) * 650))
            }, 2000)
          }, Math.max(700, (pathToResource.length - 1) * 650))
        }
      : null
    if (resource) setSelectedResourceId(resource.id)
    setState((current) => ({
      ...current,
      axies: current.axies.map((axie) => axie.id === selectedAxie.id
        ? { ...axie, pos: { r, c }, movePath: path, activity: ACTOR_ACTIVITY.MOVING, task }
        : axie),
    }))
    window.setTimeout(() => {
      setState((current) => ({
        ...current,
        axies: current.axies.map((axie) => axie.id === selectedAxie.id
          ? (() => {
              if (!task || axie.task?.resourceNodeId !== task.resourceNodeId) return { ...axie, movePath: null, activity: ACTOR_ACTIVITY.IDLE }
              return { ...axie, movePath: null, activity: ACTOR_ACTIVITY.WORKING }
            })()
          : axie),
      }))
      if (task) {
        const node = state.resourceNodes.find((entry) => entry.id === task.resourceNodeId)
        const workAmount = Math.min(10, node?.amount ?? 0)
        window.setTimeout(() => {
          const liveAxie = stateRef.current.axies.find((axie) => axie.id === selectedAxie.id)
          if (liveAxie?.task?.resourceNodeId !== task.resourceNodeId) return
          setState((current) => ({
            ...current,
            resourceNodes: current.resourceNodes.map((entry) => entry.id === task.resourceNodeId
              ? { ...entry, amount: Math.max(0, entry.amount - workAmount), available: entry.amount - workAmount > 0 }
              : entry),
            axies: current.axies.map((axie) => axie.id === selectedAxie.id && axie.task?.resourceNodeId === task.resourceNodeId
              ? { ...axie, ...(returnPath ? { pos: storageDropCell, movePath: returnPath } : {}), activity: ACTOR_ACTIVITY.CARRYING, carrying: { type: task.type === 'woodcutter' ? 'wood' : task.type === 'miner' ? 'stone' : 'food', amount: workAmount } }
              : axie),
          }))
          if (returnPath && storageDropCell) {
            window.setTimeout(() => {
              const remaining = node ? Math.max(0, node.amount - workAmount) : 0
              setState((current) => ({
                ...current,
                resources: {
                  ...current.resources,
                  [resourceType]: current.resources[resourceType] + workAmount,
                },
                axies: current.axies.map((axie) => axie.id === selectedAxie.id && axie.task?.resourceNodeId === task.resourceNodeId
                  ? { ...axie, pos: storageDropCell, movePath: null, activity: ACTOR_ACTIVITY.IDLE, carrying: null, task: remaining > 0 ? task : null }
                  : axie),
              }))
              if (remaining > 0) repeatResourceCycle?.()
            }, Math.max(700, (returnPath.length - 1) * 650))
          }
        }, Math.max(500, (node?.workTime ?? 2) * 1000))
      }
    }, Math.max(700, (path.length - 1) * 650))
  }

  // El decorado estatico no debe cambiar cuando cambia la posicion de un Axie.
  // Si cambiara de referencia, Board3D desmontaria y volveria a cargar toda la
  // escena: ese era el efecto de desaparicion/teletransporte que se veia.
  const villageObjects = useMemo(() => [
    ...initialState.buildings.map((building) => ({
      kind: 'building',
      id: building.id,
      type: building.type,
      pos: building.pos,
      footprint: building.footprint,
    })),
    ...initialState.resourceNodes.map((node) => ({
      kind: 'resource',
      id: node.id,
      type: node.type,
      pos: node.pos,
    })),
    ...initialState.roads.map((road, index) => ({
      kind: 'path',
      id: `road-${index}`,
      type: 'path',
      pos: road,
    })),
  ], [initialState])
  const selectedResource = state.resourceNodes.find((node) => node.id === selectedResourceId)
  const selectedBuilding = state.buildings.find((building) => building.id === selectedBuildingId)

  return (
    <div className="village-scene-screen">
      <div className="village-scene-head">
        <div className="village-meta-heading">
          <span className="meta-icon" aria-hidden="true">⌂</span>
          <img className="village-brand-logo" src="/brand/axie-tactics-dice-brand.png" alt="Axie Infinity Tactics Dice" />
          <span className="eyebrow">LUNACIA · PROTOTIPO</span>
          <span className="village-title-kicker">AXIE INFINITY TACTICS DICE</span>
          <h1 className="meta-title">Lunacia Village</h1>
          <p>20×20 tiles · 5 Axies available · resources ready</p>
        </div>
        <div className="village-resource-summary">
          {Object.entries(state.resources).map(([type, amount]) => (
            <span key={type}>{RESOURCE_LABELS[type]} <b>{amount}</b></span>
          ))}
        </div>
        <nav className="village-hud-nav" aria-label="Village menu">
          <a className="active" href="#/aldea">Village</a>
          <a href="#/pve">PVE</a>
          <a href="#/pvp">PVP</a>
          <a href="#/partida">Battle</a>
        </nav>
      </div>
      {(selectedAxie || selectedResource || selectedBuilding) && (
        <aside className="village-inspector">
          {selectedAxie && <>
            <span className="eyebrow">SELECTED AXIE</span>
            <strong>{selectedAxie.id}</strong>
            <span>Status: {ACTIVITY_LABELS[selectedAxie.activity] || selectedAxie.activity}</span>
            {selectedAxie.task && <span>Task: {selectedAxie.task.type}</span>}
            {selectedAxie.carrying && <span>Carrying: {RESOURCE_LABELS[selectedAxie.carrying.type]} {selectedAxie.carrying.amount}</span>}
          </>}
          {!selectedAxie && selectedResource && <>
            <span className="eyebrow">RESOURCE</span>
            <strong>{RESOURCE_LABELS[selectedResource.type]}</strong>
            <span>Amount: {selectedResource.amount}/{selectedResource.maxAmount}</span>
            <span>Work time: {selectedResource.workTime}s</span>
          </>}
          {!selectedAxie && selectedBuilding && <>
            <span className="eyebrow">BUILDING</span>
            <strong>{BUILDING_LABELS[selectedBuilding.type]}</strong>
            <span>Status: {selectedBuilding.state}</span>
            <span>Footprint: {selectedBuilding.footprint.rows}×{selectedBuilding.footprint.cols}</span>
          </>}
        </aside>
      )}
      <aside className="village-work-panel">
        <span className="eyebrow">JOBS</span>
        {state.axies.map((axie) => (
          <button
            key={axie.id}
            className={`village-work-row ${axie.id === selectedAxieId ? 'active' : ''}`}
            type="button"
            onClick={() => setSelectedAxieId(axie.id)}
          >
            <span>{axie.id.replace('villager-', 'Axie ')}</span>
            <b>{ACTIVITY_LABELS[axie.activity] || axie.activity}</b>
          </button>
        ))}
      </aside>
      <div className="village-board-host">
        <Board3D
          rows={VILLAGE_ROWS}
          cols={VILLAGE_COLS}
          blockUrl={BLOCK_URL}
          cellSizePx={CELL_SIZE}
          overlayElRef={overlayElRef}
          terrainAt={OPEN_TERRAIN}
          terrainBlockUrls={EMPTY_URLS}
          decorUrls={EMPTY_URLS}
          axieUnits={axieUnits}
          fx={NO_FX}
          arenaConfig={VILLAGE_ARENA_CONFIG}
          villageObjects={villageObjects}
          onTween={NO_TWEEN}
        />
        <div className="village-overlay" ref={overlayElRef}>
          {Array.from({ length: VILLAGE_ROWS }).map((_, r) =>
            Array.from({ length: VILLAGE_COLS }).map((__, c) => {
              const key = `${r},${c}`
              const building = buildingByCell.get(key)
              const resource = resourceByCell.get(key)
              return (
                <div
                  key={key}
                  className={`village-cell ${roadCells.has(key) ? 'road' : ''} ${axieByCell.has(key) ? 'has-axie' : ''} ${axieByCell.get(key)?.id === selectedAxieId ? 'selected-axie' : ''}`}
                  style={{ left: c * CELL_SIZE, top: r * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
                  data-r={r}
                  data-c={c}
                  aria-label={`Tile ${r + 1}, ${c + 1}`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => handleVillageCellClick(r, c)}
                >
                  {axieByCell.get(key)?.id === selectedAxieId && (
                    <>
                      <span className="village-selection">{ACTIVITY_LABELS[axieByCell.get(key)?.activity] || 'Selected'}</span>
                      {[ACTOR_ACTIVITY.MOVING, ACTOR_ACTIVITY.WORKING].includes(axieByCell.get(key)?.activity) && (
                        <button
                          className="village-stop-floating"
                          type="button"
                          onClick={(event) => { event.stopPropagation(); stopSelectedTask() }}
                        >
                          Parar tarea
                        </button>
                      )}
                    </>
                  )}
                  {building && <span className={`village-building building-${building.type}`}>{BUILDING_LABELS[building.type]}</span>}
                  {resource && <span className={`village-resource resource-${resource.type} ${resource.id === selectedResourceId ? 'selected-resource' : ''} ${!resource.available ? 'depleted-resource' : ''}`}>
                    {resource.available ? RESOURCE_LABELS[resource.type] : 'Agotado'} {resource.amount}/{resource.maxAmount}
                  </span>}
                </div>
              )
            }),
          )}
        </div>
      </div>
    </div>
  )
}
