import type { LocationRef, RouteRequest } from '@trojan-compass/shared/api'
import { compassApi } from '@/lib/api-client'
import { BUILDINGS, type BuildingCode } from '@/features/map/data/generated/campus'
import { floorY, metersPerUnit } from '@/features/map/data/generated/floorplan'
import type { MapLocation } from '@/features/map/types'
import type { LocationField } from './types'

export function mapLocationRef(location: MapLocation): LocationRef {
  if (location.placeId) return { kind: 'place', buildingId: location.building, placeId: location.placeId }
  const scale = metersPerUnit(location.building)
  return { kind: 'position', buildingId: location.building, floorId: String(location.floor), position: { x: location.x * scale, y: floorY(location.floor), z: location.z * scale } }
}

/** Text is resolved against server records; picked locations keep their exact identity/coordinates. */
export async function directionsInput(input: {
  labels: Record<LocationField, string>
  selections: Record<LocationField, MapLocation | null>
  building: BuildingCode
  mode: RouteRequest['mode']
  stepFree: boolean
}, signal: AbortSignal): Promise<Omit<RouteRequest, 'dataVersion' | 'clientRequestId'>> {
  const version = 'prototype-v1'
  await compassApi.building(input.building, version, signal)
  async function resolve(field: LocationField): Promise<LocationRef> {
    const text = input.labels[field].trim(), picked = input.selections[field]
    if (!text) throw new Error(field === 'from' ? 'Choose your current location first.' : 'Choose a destination first.')
    if (picked && picked.label === input.labels[field]) return mapLocationRef(picked)
    const building = BUILDINGS.find(b => b.code === text.toUpperCase())
    if (building || (field === 'from' && /^(outside|outside the building)$/i.test(text))) {
      const result = await compassApi.buildingPlaces(building?.code ?? input.building, { kind: 'entrance', dataVersion: version, limit: 50 }, signal)
      const entrance = (input.stepFree ? result.items.find(p => p.access.isRamp) : undefined) ?? result.items.find(p => p.access.entryAllowed !== false)
      if (!entrance) throw new Error('Select a building entrance on the map.')
      return { kind: 'place', buildingId: entrance.buildingId, placeId: entrance.id }
    }
    const code = BUILDINGS.find(b => text.toUpperCase().startsWith(b.code))?.code ?? input.building
    const result = await compassApi.places({ q: text, buildingId: code, dataVersion: version, limit: 10 }, signal)
    const exact = result.items.filter(p => p.matchType === 'exact')
    const matches = exact.length ? exact : result.items
    if (matches.length !== 1 || (!exact.length && result.nextCursor)) throw new Error(matches.length ? `Several locations match “${text}”. Select the specific room or amenity on the map.` : `No location matches “${text}”. Try a room code or select it on the map.`)
    const place = matches[0]!.place
    return { kind: 'place', buildingId: place.buildingId, placeId: place.id }
  }
  const [origin, destination] = await Promise.all([resolve('from'), resolve('to')])
  return { origin, destination, mode: input.mode, stepFree: input.stepFree, accessProfile: 'public' }
}
