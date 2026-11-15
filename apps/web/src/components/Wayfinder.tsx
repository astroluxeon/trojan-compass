'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { BUILDINGS } from '@/data/campus'
import { cellCenter, cellTitle, findRoom, getLevels } from '@/data/floorplan'
import { readDeepLink } from '@/lib/map-link'
import { mapLocationFromQuery } from '@/lib/map-location'
import type { Route } from '@/lib/routing'
import { COLORS, type LayerKey, type MapLocation, type View } from '@/lib/types'
import { AppShellFallback, MapLoading } from './AppShellFallback'
import { Header } from './ui/Header'
import { FloorTools, type LocationField } from './ui/FloorTools'
import { Breadcrumb, CampusHint, FloorSelector, LayerPanel, RouteBar } from './ui/MapOverlays'

const MapCanvas = dynamic(() => import('./map/MapCanvas').then((m) => m.MapCanvas), {
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

  const routeFloors = route && view.type === 'building'
    ? route.legs.flatMap((leg) => leg.kind === 'indoor' && leg.building === view.code ? leg.floors : [])
    : []

  function selectLocation(location: MapLocation) {
    if (!picking) return
    setLocations((current) => ({ ...current, [picking]: location.label }))
    if (picking === 'from') setCurrentLocation(location)
    setPicking(null)
  }

  function startPicking(field: LocationField | null) {
    if (field && view.type === 'building' && view.allFloors) setView({ ...view, allFloors: false })
    setPicking(field)
  }

  function selectFloor(floor: number) {
    if (view.type !== 'building') return
    if (floor !== view.floor) setSelectedCell(undefined)
    setView({ ...view, floor, allFloors: false })
  }

  function searchLocation(query: string) {
    const room = findRoom(query)
    const building = BUILDINGS.find((item) => item.code === query.trim().toUpperCase())
    const code = room?.building ?? building?.code
    if (!code) return false
    setRoute(null)
    setPicking(null)
    setSelectedCell(room?.id)
    setView((current) => ({ type: 'building', code, floor: room?.floor ?? 1, allFloors: !!room && current.type === 'building' && current.allFloors }))
    return true
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
            setView({ type: 'building', code, floor: 1 })
            setSelectedCell(undefined)
          }}
          onSelectCell={(cell) => {
            setSelectedCell(cell.id)
            setView({ type: 'building', code: cell.building, floor: cell.floor })
            if (picking) {
              const [x, z] = cellCenter(cell)
              selectLocation({ label: cellTitle(cell), building: cell.building, floor: cell.floor, x, z })
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
        {view.type === 'building' && <FloorTools locations={locations} picking={picking} onPick={startPicking} onSearch={searchLocation}
          onLocationChange={(field, value) => {
            setLocations((current) => ({ ...current, [field]: value }))
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
