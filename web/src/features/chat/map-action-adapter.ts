import type { MapAction } from '@trojan-compass/shared/api'
import { BUILDINGS } from '../map/data/generated/campus'
import { getFloorCells, getLevels } from '../map/data/generated/floorplan'
import type { View } from '../map/types'

/** Temporary bridge for the existing renderer. New publications require its scene adapter. */
export function prototypeMapAction(action: MapAction, dataVersion: string): { view: View; selectedCell?: string } {
  if (dataVersion !== 'prototype-v1') throw new Error('This map needs an updated viewer for the published building data.')
  if (action.type === 'show_route') throw new Error('Route drawing is not enabled for this prototype map.')
  if (!['focus_building', 'focus_floor', 'focus_place'].includes(action.type)) throw new Error('Unknown map action.')
  const building = BUILDINGS.find(b => b.code === action.buildingId)
  if (!building) throw new Error('This building is not available in the current viewer.')
  const floor = action.type === 'focus_building' ? 1 : Number(action.floorId)
  if (!getLevels(building.code).includes(floor)) throw new Error('This floor is not available in the current viewer.')
  if (action.type === 'focus_place' && !getFloorCells(building.code, floor).some(cell => cell.id === action.placeId)) throw new Error('This location is not available in the current viewer.')
  return { view: { type: 'building', code: building.code, floor }, selectedCell: action.type === 'focus_place' ? action.placeId : undefined }
}
