'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { BUILDINGS, BUILDING_BY_CODE, type BuildingCode } from '@/data/campus'
import { cellCenter, cellTitle, findPlace, findRoom, getLevels } from '@/data/floorplan'
import { computeRoute, type Route, type RouteMode } from '@/lib/routing'
import { COLORS, type LayerKey, type MapLocation, type View } from '@/lib/types'
import { AppShellFallback, MapLoading } from './AppShellFallback'
import { Header } from './ui/Header'
import { FloorTools, type LocationField } from './ui/FloorTools'
import { Breadcrumb, CampusHint, FloorSelector, LayerPanel, RouteBar } from './ui/MapOverlays'

const MapCanvas = dynamic(() => import('./map/MapCanvas').then((m) => m.MapCanvas), {
  ssr: false,
  loading: () => <MapLoading />,
})

const DEFAULT_LAYERS: LayerKey[] = ['classrooms', 'mensRestrooms', 'womensRestrooms', 'elevators', 'stairs', 'entrances']

function readDeepLink(q: URLSearchParams) {
  const code = q.get('building')?.toUpperCase() as BuildingCode | undefined
  const b = code ? BUILDING_BY_CODE[code] : undefined
  const levels = b ? getLevels(b.code) : [1]
  const wanted = q.get('floor') === 'B' ? 0 : Number(q.get('floor') ?? 1)
  const floor = levels.includes(wanted) ? wanted : levels.includes(1) ? 1 : (levels[0] ?? 1)
  const room = q.get('room') ? findPlace(q.get('room')!.toUpperCase()) : undefined
  const from = q.get('from') ? findPlace(q.get('from')!.toUpperCase()) : undefined
  const to = q.get('to') ? findPlace(q.get('to')!.toUpperCase()) : undefined
  const m = q.get('mode')
  const mode: RouteMode = m === 'stairs' || m === 'elevator' ? m : 'fastest'
  const route = from && to ? computeRoute(from, to, mode) : null
  let view: View = { type: 'campus' }
  if (route?.steps[0]?.building) view = { type: 'building', code: route.steps[0].building, floor: route.steps[0].floor ?? 1 }
  else if (room) view = { type: 'building', code: room.building, floor: room.floor }
  else if (b) view = { type: 'building', code: b.code, floor, allFloors: q.get('floor') === 'all' }
  return { view, room, from: from ?? null, to: to ?? null, mode, route }
}

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
    if (link.view.type === 'campus') window.location.replace('http://localhost:3001')
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

  function searchLocation(query: string) {
    const room = findRoom(query)
    const building = BUILDINGS.find((item) => item.code === query.trim().toUpperCase())
    const code = room?.building ?? building?.code
    if (!code) return false
    setRoute(null)
    setPicking(null)
    setSelectedCell(room?.id)
    setView({ type: 'building', code, floor: room?.floor ?? 1 })
    return true
  }

  if (link.view.type === 'campus') return <AppShellFallback />

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
          onMoveCurrentLocation={() => setPicking('from')}
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
          onSelectFloor={(floor) => view.type === 'building' && setView({ ...view, floor, allFloors: false })}
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
            onSelect={(floor) => setView({ ...view, floor, allFloors: false })}
            onSelectAll={() => {
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
        {view.type === 'building' && <FloorTools locations={locations} picking={picking} onPick={setPicking} onSearch={searchLocation}
          onLocationChange={(field, value) => {
            setLocations((current) => ({ ...current, [field]: value }))
            if (field === 'from') setCurrentLocation(null)
          }} />}
      </main>
    </div>
  )
}
