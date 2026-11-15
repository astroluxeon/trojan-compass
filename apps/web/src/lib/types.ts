import type { BuildingCode } from '../data/campus'

export type LayerKey = 'classrooms' | 'events' | 'mensRestrooms' | 'womensRestrooms' | 'accessible' | 'stairs' | 'elevators' | 'exits' | 'entrances'

export type View = { type: 'campus' } | { type: 'building'; code: BuildingCode; floor: number; allFloors?: boolean }

export interface MapLocation {
  label: string
  building: BuildingCode
  floor: number
  x: number
  z: number
}

export const ALL_LAYERS: LayerKey[] = ['classrooms', 'events', 'mensRestrooms', 'womensRestrooms', 'accessible', 'stairs', 'elevators', 'exits', 'entrances']

export const COLORS = {
  cardinal: '#990000',
  cardinalDark: '#7a0000',
  gold: '#FFCC00',
  accessible: '#1F5BA8',
  exit: '#DC2626',
  entrance: '#15803D',
  restroom: '#2563EB',
  model: '#d6d6da',
  modelHover: '#c5c5ca',
  edge: '#a8a8ae',
}
