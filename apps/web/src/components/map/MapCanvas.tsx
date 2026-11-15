import { CameraControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Compass, Minus, Plus, RotateCcw } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { BuildingCode } from '../../data/campus'
import { floorY, planBounds, type Cell } from '../../data/floorplan'
import type { Route } from '../../lib/routing'
import type { LayerKey, View } from '../../lib/types'
import { BuildingScene } from './BuildingScene'
import { LabelLayerContext } from './MapHtml'
import { CampusScene } from './CampusScene'

interface Props {
  view: View
  layers: Set<LayerKey>
  route: Route | null
  highlights: Map<string, string>
  selectedCell?: string
  onSelectBuilding: (code: BuildingCode) => void
  onSelectCell: (cell: Cell) => void
  onSelectFloor: (floor: number) => void
}

function frame(controls: CameraControls, view: View, animate = true) {
  if (view.type === 'campus') {
    controls.setLookAt(40, 62, 70, 0, 0, 3, animate)
  } else {
    const y = floorY(view.floor)
    const b = planBounds(view.code)
    const cx = (b.x0 + b.x1) / 2
    const cz = (b.z0 + b.z1) / 2
    // Scale the camera distance to the floor plan size (template plan is 24 x 12).
    const k = Math.max((b.x1 - b.x0) / 25, (b.z1 - b.z0) / 13)
    controls.setLookAt(cx + 4 * k, y + 31 * k, cz + 33 * k, cx, y - 1, cz + 1, animate)
  }
}

export function MapCanvas(props: Props) {
  const { view, route, layers } = props
  const controls = useRef<CameraControls>(null)
  const labelLayer = useRef<HTMLDivElement>(null)


  const outdoor = route?.legs.find((l) => l.kind === 'outdoor')
  const indoorLegs = route?.legs.filter((l) => l.kind === 'indoor') ?? []
  const leg = view.type === 'building' ? indoorLegs.find((l) => l.building === view.code) : undefined
  const isFinalLeg = !!leg && route?.to.building === leg.building
  const emphasized: BuildingCode[] = route ? [...new Set([route.from.building, route.to.building])] : []

  return (
    <div className="relative h-full w-full">
      <LabelLayerContext.Provider value={labelLayer}>
      <Canvas
        shadows="percentage"
        dpr={[1, 2]}
        flat
        camera={{ position: [40, 62, 70], fov: 32, near: 0.5, far: 600 }}
        onPointerMissed={() => (document.body.style.cursor = '')}
      >
        <color attach="background" args={['#ffffff']} />
        <hemisphereLight args={['#ffffff', '#dcdce2', 1.0]} />
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[30, 60, 25]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-45}
          shadow-camera-right={45}
          shadow-camera-top={45}
          shadow-camera-bottom={-45}
          shadow-camera-far={160}
          shadow-bias={-0.0004}
        />
        {view.type === 'campus' ? (
          <CampusScene
            emphasized={emphasized}
            outdoor={outdoor?.kind === 'outdoor' ? outdoor : undefined}
            onSelect={props.onSelectBuilding}
          />
        ) : (
          <BuildingScene
            code={view.code}
            floor={view.floor}
            layers={layers}
            highlights={props.highlights}
            selectedCell={props.selectedCell}
            leg={leg?.kind === 'indoor' ? leg : undefined}
            isFinalLeg={isFinalLeg}
            onSelectCell={props.onSelectCell}
            onSelectFloor={props.onSelectFloor}
          />
        )}
        <CameraControls
          ref={controls}
          makeDefault
          minDistance={12}
          maxDistance={160}
          maxPolarAngle={Math.PI / 2.3}
          smoothTime={0.45}
        />
        <CameraRig view={view} controls={controls} />
      </Canvas>
      </LabelLayerContext.Provider>
      {/* Labels opt back into pointer events individually, so the layer never blocks the canvas. */}
      <div ref={labelLayer} className="pointer-events-none absolute inset-0 overflow-hidden" />

      <div className="absolute right-4 top-4 z-30 flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        <MapButton label="Zoom in" onClick={() => controls.current?.dolly(8, true)}>
          <Plus className="h-4 w-4" />
        </MapButton>
        <MapButton label="Zoom out" onClick={() => controls.current?.dolly(-8, true)}>
          <Minus className="h-4 w-4" />
        </MapButton>
        <MapButton label="Rotate view" onClick={() => controls.current?.rotate(Math.PI / 4, 0, true)}>
          <Compass className="h-4 w-4" />
        </MapButton>
        <MapButton label="Reset view" onClick={() => controls.current && frame(controls.current, view)}>
          <RotateCcw className="h-4 w-4" />
        </MapButton>
      </div>
    </div>
  )
}

function MapButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center border-b border-neutral-100 text-neutral-600 transition last:border-0 hover:bg-neutral-50 hover:text-[#990000]"
    >
      {children}
    </button>
  )
}

/** Lives inside the Canvas so the CameraControls ref is attached before framing. */
function CameraRig({ view, controls }: { view: View; controls: React.RefObject<CameraControls | null> }) {
  const first = useRef(true)
  const viewKey = view.type === 'campus' ? 'campus' : `${view.code}-${view.floor}`
  useEffect(() => {
    if (!controls.current) return
    frame(controls.current, view, !first.current)
    first.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey])
  return null
}
