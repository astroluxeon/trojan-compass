import type { BuildingCode } from '../data/campus'

export type LayerKey = 'classrooms' | 'events' | 'toilets' | 'accessible' | 'stairs' | 'elevators' | 'exits'

export type View = { type: 'campus' } | { type: 'building'; code: BuildingCode; floor: number }

export const ALL_LAYERS: LayerKey[] = ['classrooms', 'events', 'toilets', 'accessible', 'stairs', 'elevators', 'exits']

export const COLORS = {
  cardinal: '#990000',
  cardinalDark: '#7a0000',
  gold: '#FFCC00',
  accessible: '#1F5BA8',
  exit: '#15803D',
  model: '#d6d6da',
  modelHover: '#c5c5ca',
  edge: '#a8a8ae',
}
