import { BUILDING_BY_CODE, type BuildingCode } from './data/generated/campus'
import { findPlace, getLevels } from './data/generated/floorplan'
import { computeRoute, type RouteMode } from '../routing/legacy/routing.generated'
import type { View } from './types'

export function readDeepLink(q: URLSearchParams) {
  const code = q.get('building')?.toUpperCase() as BuildingCode | undefined
  const b = code ? BUILDING_BY_CODE[code] : undefined
  const levels = b ? getLevels(b.code) : [1]
  const wanted = q.get('floor') === 'B' ? 0 : Number(q.get('floor') ?? 1)
  const floor = levels.includes(wanted) ? wanted : levels.includes(1) ? 1 : (levels[0] ?? 1)
  let room = findPlace(q.get('room') ?? '')
  // Older links can retain a room after the user switches to another floor.
  if (room && room.building === b?.code && q.has('floor') && levels.includes(wanted) && room.floor !== floor) room = undefined
  const from = findPlace(q.get('from') ?? '')
  const to = findPlace(q.get('to') ?? '')
  const m = q.get('mode')
  const mode: RouteMode = m === 'stairs' || m === 'elevator' ? m : 'fastest'
  const route = from && to ? computeRoute(from, to, mode) : null
  let view: View = { type: 'campus' }
  if (route) {
    const first = route.steps[0]
    if (first?.building) view = { type: 'building', code: first.building, floor: first.floor ?? 1 }
  } else if (room) view = { type: 'building', code: room.building, floor: room.floor, allFloors: q.get('floor') === 'all' }
  else if (b) view = { type: 'building', code: b.code, floor, allFloors: q.get('floor') === 'all' }
  return { view, room, from: from ?? null, to: to ?? null, mode, route }
}
