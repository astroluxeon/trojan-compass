import type { MapAction, Route, ResolvedEndpoint } from '@trojan-compass/shared/api'
import { BUILDINGS } from '../map/data/generated/campus'
import { cellTitle, entrancePlaces, getFloorCells, getLevels, metersPerUnit } from '../map/data/generated/floorplan'
import type { MapLocation, View } from '../map/types'

function knownFloor(buildingId: string, floorId: string) {
  const building = BUILDINGS.find(b => b.code === buildingId)
  if (!building || !getLevels(building.code).includes(Number(floorId))) throw new Error('This route references a building or floor unavailable in the current viewer.')
  return building.code
}

export function routeMapLocation(endpoint: ResolvedEndpoint): MapLocation {
  const building = knownFloor(endpoint.buildingId, endpoint.floorId)
  const cell = endpoint.placeId ? getFloorCells(building, Number(endpoint.floorId)).find(c => c.id === endpoint.placeId) : undefined
  const entrance = entrancePlaces(building).find(p => p.id === endpoint.placeId && String(p.floor) === endpoint.floorId)
  if (endpoint.placeId && !cell && !entrance) throw new Error('This route references a location unavailable in the current viewer.')
  if (![endpoint.position.x, endpoint.position.y, endpoint.position.z].every(Number.isFinite)) throw new Error('Invalid route position.')
  const scale = metersPerUnit(building)
  return { building, floor: Number(endpoint.floorId), x: endpoint.position.x / scale, z: endpoint.position.z / scale, label: cell ? cellTitle(cell) : entrance?.label ?? `${building} Floor ${endpoint.floorId} · open area`, ...(endpoint.placeId ? { placeId: endpoint.placeId } : {}) }
}

/** Temporary bridge for the existing renderer. New publications require its scene adapter. */
export function prototypeMapAction(action: MapAction, dataVersion: string): { view: View; selectedCell?: string; route?: Route } {
  if (dataVersion !== 'prototype-v1') throw new Error('This map needs an updated viewer for the published building data.')
  if (action.type === 'show_route') {
    const route = action.route
    const origin = routeMapLocation(route.origin), destination = routeMapLocation(route.destination)
    if (origin.building !== destination.building || !route.legs.length || !route.steps.length) throw new Error('This viewer needs a complete route within one building.')
    for (const leg of route.legs) {
      if (leg.kind === 'outdoor' || leg.buildingId !== origin.building) throw new Error('Outdoor route drawing is not available in this viewer.')
      for (const floor of leg.kind === 'indoor' ? [leg.floorId] : [leg.fromFloorId, leg.toFloorId]) knownFloor(leg.buildingId, floor)
      if (!leg.points.length || leg.points.some(p => ![p.x, p.y, p.z].every(Number.isFinite))) throw new Error('Invalid route geometry.')
    }
    for (const step of route.steps) {
      const leg = route.legs.find(l => l.id === step.legId)
      if (!leg || !Number.isInteger(step.pointIndex) || step.pointIndex < 0 || step.pointIndex >= leg.points.length || step.buildingId !== origin.building || step.floorId === null) throw new Error('Invalid route instruction.')
      knownFloor(step.buildingId, step.floorId)
    }
    return { view: { type: 'building', code: destination.building, floor: destination.floor }, selectedCell: destination.placeId, route }
  }
  if (!['focus_building', 'focus_floor', 'focus_place'].includes(action.type)) throw new Error('Unknown map action.')
  const building = BUILDINGS.find(b => b.code === action.buildingId)
  if (!building) throw new Error('This building is not available in the current viewer.')
  const floor = action.type === 'focus_building' ? 1 : Number(action.floorId)
  if (!getLevels(building.code).includes(floor)) throw new Error('This floor is not available in the current viewer.')
  if (action.type === 'focus_place' && !getFloorCells(building.code, floor).some(cell => cell.id === action.placeId) && !entrancePlaces(building.code).some(p => p.id === action.placeId && p.floor === floor)) throw new Error('This location is not available in the current viewer.')
  return { view: { type: 'building', code: building.code, floor }, selectedCell: action.type === 'focus_place' ? action.placeId : undefined }
}
