// Pathfinding común para combate y aldea.
//
// El sistema actual de combate conserva su búsqueda de celdas alcanzables.
// Esta función resuelve una necesidad distinta: obtener la ruta ordenada que
// una entidad debe recorrer hasta una celda concreta. No conoce Axies, turnos,
// recursos ni edificios; sólo recibe las reglas de la grid por configuración.

const CARDINAL_DIRECTIONS = [
  { r: -1, c: 0 },
  { r: 1, c: 0 },
  { r: 0, c: -1 },
  { r: 0, c: 1 },
]

const keyOf = (cell) => `${cell.r},${cell.c}`
const heuristic = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c)

// Devuelve [origen, ..., destino] o null si no existe una ruta.
//
// options:
// - rows, cols: límites de la grid.
// - isPassable(cell): indica si una celda puede atravesarse.
// - getCost(from, to): coste de entrar en `to`; por defecto 1.
// - canEnter(cell): filtro opcional para ocupación dinámica.
export function findGridPath(start, goal, options) {
  const { rows, cols, isPassable, getCost = () => 1, canEnter = () => true } = options
  if (!start || !goal || !isPassable) return null
  if (start.r < 0 || start.r >= rows || start.c < 0 || start.c >= cols) return null
  if (goal.r < 0 || goal.r >= rows || goal.c < 0 || goal.c >= cols) return null
  if (!isPassable(goal) || !canEnter(goal)) return null

  const startKey = keyOf(start)
  const goalKey = keyOf(goal)
  const open = [{ cell: { ...start }, g: 0, f: heuristic(start, goal) }]
  const bestCost = new Map([[startKey, 0]])
  const cameFrom = new Map()

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f)
    const current = open.shift()
    const currentKey = keyOf(current.cell)
    if (currentKey === goalKey) {
      const path = [current.cell]
      let cursor = currentKey
      while (cameFrom.has(cursor)) {
        const previous = cameFrom.get(cursor)
        path.push(previous)
        cursor = keyOf(previous)
      }
      return path.reverse()
    }

    for (const direction of CARDINAL_DIRECTIONS) {
      const next = { r: current.cell.r + direction.r, c: current.cell.c + direction.c }
      if (next.r < 0 || next.r >= rows || next.c < 0 || next.c >= cols) continue
      if (!isPassable(next)) continue
      if (keyOf(next) !== goalKey && !canEnter(next)) continue

      const cost = getCost(current.cell, next)
      if (!Number.isFinite(cost) || cost < 0) continue
      const nextKey = keyOf(next)
      const nextCost = current.g + cost
      if (nextCost >= (bestCost.get(nextKey) ?? Infinity)) continue

      bestCost.set(nextKey, nextCost)
      cameFrom.set(nextKey, current.cell)
      open.push({ cell: next, g: nextCost, f: nextCost + heuristic(next, goal) })
    }
  }

  return null
}
