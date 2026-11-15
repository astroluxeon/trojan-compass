import { BUILDING_BY_CODE, type BuildingCode } from '../data/campus'
import { accessibleEntrancePlace, cellCenter, cellTitle, findCell, findRoom, floorName, getLayout, type FloorLayout } from '../data/floorplan'
import type { MapLocation } from './types'

export function mapLocationFromQuery(query: string): MapLocation | null {
  const code = query.trim().toUpperCase() as BuildingCode
  const place = findRoom(query) ?? (BUILDING_BY_CODE[code] ? accessibleEntrancePlace(code) : undefined)
  if (!place) return null
  const cell = findCell(place.id)
  const entrance = cell ? undefined : getLayout(place.building, place.floor).entrances.find(entry => entry.id === place.node)
  const point = cell ? cellCenter(cell) : entrance ? [entrance.x, entrance.z] as const : null
  if (!point) return null
  const [x, z] = point
  return { building: place.building, floor: place.floor, label: place.label, x, z }
}

/** Snap the carried mascot to entrances and rooms; keep open floor points where dropped. */
export function mapLocationAt(layout: FloorLayout, x: number, z: number): MapLocation | null {
  const base = { building: layout.building, floor: layout.floor }
  const entrance = layout.entrances.find((entry) => Math.hypot(entry.x - x, entry.z - z) < 1.2)
  if (entrance) return { ...base, label: `${layout.building} ${entrance.label}`, x: entrance.x, z: entrance.z }
  const cell = layout.cells.find((item) => x >= item.x0 && x <= item.x1 && z >= item.z0 && z <= item.z1)
  if (cell?.kind === 'block') return null
  if (cell) {
    const [cx, cz] = cellCenter(cell)
    return { ...base, label: cellTitle(cell), x: cx, z: cz }
  }
  if (!layout.slabs.some(([x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1)) return null
  return { ...base, label: `${layout.building} ${floorName(layout.floor)} · open area`, x, z }
}
