import type { Route, Vector3 } from '@trojan-compass/shared/api'
import type { BuildingCode } from '@/features/map/data/generated/campus'
import { getLevels, metersPerUnit } from '@/features/map/data/generated/floorplan'

export type ScenePoint = [number, number, number]
export type WalkingSegment = { kind: 'indoor'; id: string; floors: number[]; points: ScenePoint[] }
export type FloorTransition = {
  kind: 'vertical'
  id: string
  floors: number[]
  connectorKind: 'stairs' | 'elevator' | 'ramp'
  fromFloor: number
  toFloor: number
  direction: 'up' | 'down'
  entry: ScenePoint
  exit: ScenePoint
  center: ScenePoint
  size: ScenePoint
}

/** Canonical meters -> the existing model's explicit horizontal scale; Y is already in meters. */
export function scenePosition(code: BuildingCode, p: Vector3, lift = .36): [number, number, number] {
  const scale = metersPerUnit(code)
  return [p.x / scale, p.y + lift, p.z / scale]
}
export function sceneRoute(route: Pick<Route, 'legs'>, code: BuildingCode) {
  const segments: (WalkingSegment | FloorTransition)[] = []
  for (const leg of route.legs) {
    if (leg.kind === 'outdoor' || leg.buildingId !== code || leg.points.length < 2) continue
    const floors = leg.kind === 'indoor' ? [Number(leg.floorId)] : getLevels(code).filter(f => f >= Math.min(Number(leg.fromFloorId), Number(leg.toFloorId)) && f <= Math.max(Number(leg.fromFloorId), Number(leg.toFloorId)))
    const points = leg.points.map(p => scenePosition(code, p))
    if (leg.kind === 'indoor') {
      segments.push({ kind: 'indoor', id: leg.id, floors, points })
    } else {
      const entry = points[0]!, exit = points.at(-1)!
      // A symbolic upright volume encloses the connector landings. It does not redraw
      // misaligned floor anchors as a diagonal walking path or move the route endpoints.
      const minX = Math.min(...points.map(p => p[0])), maxX = Math.max(...points.map(p => p[0]))
      const minZ = Math.min(...points.map(p => p[2])), maxZ = Math.max(...points.map(p => p[2]))
      segments.push({ kind: 'vertical', id: leg.id, floors, connectorKind: leg.connectorKind,
        fromFloor: Number(leg.fromFloorId), toFloor: Number(leg.toFloorId), direction: exit[1] > entry[1] ? 'up' : 'down', entry, exit,
        center: [(minX + maxX) / 2, (entry[1] + exit[1]) / 2, (minZ + maxZ) / 2],
        size: [Math.max(1.8, maxX - minX + 1.4), Math.max(.1, Math.abs(exit[1] - entry[1])), Math.max(1.8, maxZ - minZ + 1.4)] })
    }
  }
  return segments
}

/** Arrow tips follow ordered walking points, including reversed routes and short turns. */
export function routeChevrons(points: ScenePoint[]): ScenePoint[][] {
  const arrows: ScenePoint[][] = []
  for (let i = 1; i < points.length && arrows.length < 64; i++) {
    const a = points[i - 1]!, b = points[i]!, dx = b[0] - a[0], dz = b[2] - a[2]
    const distance = Math.hypot(dx, dz)
    if (distance < .55 || Math.abs(b[1] - a[1]) > .05) continue
    const ux = dx / distance, uz = dz / distance, count = Math.max(1, Math.floor(distance / 2.5))
    for (let k = 0; k < count && arrows.length < 64; k++) {
      const along = distance * (k + .5) / count, x = a[0] + ux * along, z = a[2] + uz * along
      const size = Math.min(.36, distance * .25), y = a[1] + .025
      arrows.push([[x - ux * size - uz * size * .8, y, z - uz * size + ux * size * .8], [x + ux * size * .35, y, z + uz * size * .35], [x - ux * size + uz * size * .8, y, z - uz * size - ux * size * .8]])
    }
  }
  return arrows
}
