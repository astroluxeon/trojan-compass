'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { cellCenter, cellTitle, findCell, getLevels, metersPerUnit } from '../data/generated/floorplan'
import { readDeepLink } from '../map-link'
import { mapLocationFromQuery } from '../map-location'
import type { Route } from '../../routing/legacy/routing.generated'
import { COLORS, type LayerKey, type MapLocation, type View } from '../types'
import { AppShellFallback, MapLoading } from '../../../components/layout/AppShellFallback'
import { Header } from '../../../components/layout/Header'
import { FloorTools, type LocationField } from './FloorTools'
import { Breadcrumb, CampusHint, FloorSelector, LayerPanel, RouteBar } from './MapOverlays'
import { prototypeMapAction } from '@/features/chat/map-action-adapter'
import { useRoute } from '@/features/routing/hooks/useRoute'
import { directionsInput, mapLocationRef } from '@/features/routing/directions-input'
import type { RouteMode } from '@trojan-compass/shared/api'
import type { BuildingCode } from '../data/generated/campus'

const MapCanvas = dynamic(() => import('../renderer/MapCanvas').then((m) => m.MapCanvas), {
  ssr: false,
  loading: () => <MapLoading />,
})

const DEFAULT_LAYERS: LayerKey[] = ['classrooms', 'mensRestrooms', 'womensRestrooms', 'ramps', 'elevators', 'stairs', 'entrances']

export default function Wayfinder() {
  const searchParams = useSearchParams()
  const [link] = useState(() => readDeepLink(new URLSearchParams(searchParams.toString())))
  const [view, setView] = useState<View>(link.view)
  const [layers, setLayers] = useState<Set<LayerKey>>(() => new Set(DEFAULT_LAYERS))
  const [route, setRoute] = useState<Route | null>(link.route)
  const [activeStep, setActiveStep] = useState(0)
  const [selectedCell, setSelectedCell] = useState<string | undefined>(link.room?.id ?? link.to?.id)
  const [locations, setLocations] = useState({ from: '', to: '' })
  const [picking, setPicking] = useState<LocationField | null>(null)
  const [currentLocation, setCurrentLocation] = useState<MapLocation | null>(null)
  const [selections, setSelections] = useState<Record<LocationField, MapLocation | null>>({ from: null, to: null })
  const directions = useRoute('prototype-v1', 'preview')
  const [directionStep, setDirectionStep] = useState(0)
  const [activeLegId, setActiveLegId] = useState<string | null>(null)

  function clearDirections() { directions.clear(); setActiveLegId(null); setDirectionStep(0); setRoute(null) }
  function calculateDirections(mode: RouteMode, stepFree: boolean) {
    if (view.type !== 'building') return
    setRoute(null); setPicking(null); setActiveLegId(null); setDirectionStep(0)
    void directions.calculate(signal => directionsInput({ labels: locations, selections, building: view.code, mode, stepFree }, signal))
  }
  function followDirection(index: number) {
    const step = directions.route?.steps[index]
    if (!step || !step.buildingId || step.floorId === null) return
    setDirectionStep(index); setActiveLegId(step.legId)
    setView({ type: 'building', code: step.buildingId as BuildingCode, floor: Number(step.floorId) })
  }
  useEffect(() => {
    if (!directions.route) return
    const { origin, destination } = directions.route
    const code = origin.buildingId as BuildingCode, scale = metersPerUnit(code)
    setCurrentLocation({ building: code, floor: Number(origin.floorId), x: origin.position.x / scale, z: origin.position.z / scale, label: 'Current location' })
    if (destination.placeId && findCell(destination.placeId)) setSelectedCell(destination.placeId)
    setView({ type: 'building', code: destination.buildingId as BuildingCode, floor: Number(destination.floorId) })
  }, [directions.route])

  useEffect(() => {
    if (link.view.type === 'campus' && !link.route) window.location.replace('http://localhost:3001')
  }, [link])

  const highlights = useMemo(() => {
    const result = new Map<string, string>()
    if (route?.to.kind === 'room') result.set(route.to.id, COLORS.cardinal)
    return result
  }, [route])

  useEffect(() => {
    const q = new URLSearchParams()
    if (route) {
      q.set('from', route.from.id)
      q.set('to', route.to.id)
      if (route.mode !== 'fastest') q.set('mode', route.mode)
    } else if (view.type === 'building') {
      q.set('building', view.code)
      q.set('floor', view.allFloors ? 'all' : view.floor === 0 ? 'B' : String(view.floor))
      if (selectedCell) q.set('room', selectedCell)
    }
    const query = q.toString() ? `?${q}` : ''
    if (query !== window.location.search) window.history.replaceState(null, '', window.location.pathname + query)
  }, [view, selectedCell, route])

  const goToStep = (i: number) => {
    const step = route?.steps[i]
    if (!step) return
    setActiveStep(i)
    setView(step.building ? { type: 'building', code: step.building, floor: step.floor ?? 1 } : { type: 'campus' })
  }

  const routeFloors = directions.route && view.type === 'building'
    ? [...new Set(directions.route.legs.flatMap(leg => leg.kind === 'indoor' && leg.buildingId === view.code ? [Number(leg.floorId)] : leg.kind === 'vertical' && leg.buildingId === view.code ? getLevels(view.code).filter(f => f >= Math.min(Number(leg.fromFloorId), Number(leg.toFloorId)) && f <= Math.max(Number(leg.fromFloorId), Number(leg.toFloorId))) : []))]
    : route && view.type === 'building'
    ? route.legs.flatMap((leg) => leg.kind === 'indoor' && leg.building === view.code ? leg.floors : [])
    : []

  function selectLocation(location: MapLocation) {
    if (!picking) return
    clearDirections()
    setLocations((current) => ({ ...current, [picking]: location.label }))
    setSelections((current) => ({ ...current, [picking]: location }))
    if (picking === 'from') setCurrentLocation(location)
    if (picking === 'to') setSelectedCell(location.placeId)
    setPicking(null)
  }

  function startPicking(field: LocationField | null) {
    if (field) clearDirections()
    if (field && view.type === 'building' && view.allFloors) setView({ ...view, allFloors: false })
    setPicking(field)
  }

  function selectFloor(floor: number) {
    if (view.type !== 'building') return
    if (floor !== view.floor) setSelectedCell(undefined)
    setView({ ...view, floor, allFloors: false })
  }

  if (link.view.type === 'campus' && !link.route) return <AppShellFallback />

  return (
    <div className="flex h-full flex-col">
      <Header />
      <main id="main" className="relative flex min-h-0 flex-1 bg-white">
        <div className="relative min-w-0 flex-1">
        <MapCanvas
          view={view}
          layers={layers}
          route={route}
          apiRoute={directions.route}
          activeLegId={activeLegId}
          highlights={highlights}
          selectedCell={selectedCell}
          currentLocation={currentLocation}
          placingCurrentLocation={picking === 'from'}
          onMoveCurrentLocation={() => startPicking('from')}
          onSelectLocation={picking ? (location) => {
            setSelectedCell(undefined)
            selectLocation(location)
          } : undefined}
          onSelectBuilding={(code) => {
            clearDirections()
            setView({ type: 'building', code, floor: 1 })
            setSelectedCell(undefined)
          }}
          onSelectCell={(cell) => {
            setSelectedCell(cell.id)
            setView({ type: 'building', code: cell.building, floor: cell.floor })
            if (picking) {
              const [x, z] = cellCenter(cell)
              selectLocation({ label: cellTitle(cell), building: cell.building, floor: cell.floor, x, z, placeId: cell.id })
            }
          }}
          onSelectFloor={selectFloor}
        />
        <Breadcrumb view={view} onCampus={() => {
          window.location.assign('http://localhost:3001')
        }} />
        {view.type === 'campus' && !route && <CampusHint />}
        {route && <RouteBar route={route} active={activeStep} onStep={goToStep} onClose={() => {
          setRoute(null)
          setActiveStep(0)
        }} />}
        {view.type === 'building' && (
          <FloorSelector levels={getLevels(view.code)} floor={view.floor} allFloors={view.allFloors} routeFloors={routeFloors}
            currentFloor={currentLocation?.building === view.code ? currentLocation.floor : undefined}
            onSelect={selectFloor}
            onSelectAll={() => {
              setPicking(null)
              setView({ ...view, allFloors: true })
              setSelectedCell(undefined)
            }} />
        )}
        <LayerPanel layers={layers} view={view} onToggle={(key) => setLayers((current) => {
          const next = new Set(current)
          if (next.has(key)) next.delete(key)
          else next.add(key)
          return next
        })} />
        </div>
        {view.type === 'building' && <FloorTools locations={locations} picking={picking} onPick={startPicking}
          directions={{ route: directions.route, loading: directions.loading, error: directions.error, activeStep: directionStep, onStep: followDirection, onCalculate: calculateDirections, onClear: clearDirections }}
          chatContext={{ buildingId: view.code, floorId: String(view.floor), selectedPlace: selectedCell ? { kind: 'place', buildingId: view.code, placeId: selectedCell } : null, origin: selections.from ? mapLocationRef(selections.from) : null }}
          onChatActions={(actions, dataVersion) => {
            // Validate every action before mutating the viewer; never mix snapshot coordinates.
            const updates = actions.map(action => prototypeMapAction(action, dataVersion))
            if (!updates.length) return
            const update = updates.at(-1)!
            clearDirections(); setPicking(null); setView(update.view); setSelectedCell(update.selectedCell)
          }}
          onLocationChange={(field, value) => {
            clearDirections()
            setLocations((current) => ({ ...current, [field]: value }))
            setSelections((current) => ({ ...current, [field]: mapLocationFromQuery(value) }))
            if (field === 'from') {
              const location = mapLocationFromQuery(value)
              setCurrentLocation(location)
              if (location) {
                setSelectedCell(undefined)
                setView((current) => ({ type: 'building', code: location.building, floor: location.floor, allFloors: current.type === 'building' && current.allFloors }))
              }
            }
          }} />}
      </main>
    </div>
  )
}
