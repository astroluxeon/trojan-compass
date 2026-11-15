import { Billboard, Edges, Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useRef } from 'react'
import type { Group } from 'three'
import type { FloorTransition } from '@/features/routing/route-scene'
import { floorName } from '../data/generated/floorplan'
import { MapHtml } from './MapHtml'
import { useReducedMotion } from './useReducedMotion'

/** Symbolic floor-change beacon: upright glass volume and a rising/falling rectangular pad. */
export function FloorTransitionBeacon({ transition, active, onSelectFloor }: {
  transition: FloorTransition
  active: boolean
  onSelectFloor: (floor: number) => void
}) {
  const platform = useRef<Group>(null)
  const reducedMotion = useReducedMotion()
  const { center, size, entry, exit, direction, connectorKind, fromFloor, toFloor } = transition
  const [width, height, depth] = size
  const low = Math.min(entry[1], exit[1]), high = Math.max(entry[1], exit[1])
  const sign = direction === 'up' ? 1 : -1
  const Icon = direction === 'up' ? ArrowUp : ArrowDown
  const caption = `${connectorKind === 'stairs' ? 'Stairs' : connectorKind === 'elevator' ? 'Elevator' : 'Ramp'} · ${direction} to ${floorName(toFloor).toLowerCase()}`
  useFrame(({ clock }) => {
    if (!platform.current) return
    const progress = reducedMotion || !active ? .5 : (clock.elapsedTime * .24) % 1
    platform.current.position.y = entry[1] + (exit[1] - entry[1]) * progress
  })

  return <group>
    <mesh position={center} renderOrder={80}>
      <boxGeometry args={size} />
      <meshBasicMaterial color="#60a5fa" transparent opacity={active ? .16 : .07} depthWrite={false} depthTest={false} toneMapped={false} />
      <Edges color="#3b82f6" lineWidth={1.1} transparent opacity={active ? .7 : .3} depthWrite={false} depthTest={false} renderOrder={81} />
    </mesh>
    {[low, high].map(y => <mesh key={y} position={[center[0], y, center[2]]} renderOrder={82}>
      <boxGeometry args={[width, .07, depth]} />
      <meshBasicMaterial color="#3b82f6" transparent opacity={active ? .32 : .15} depthWrite={false} depthTest={false} toneMapped={false} />
      <Edges color="#2563eb" lineWidth={1.7} transparent opacity={active ? .8 : .4} depthWrite={false} depthTest={false} renderOrder={83} />
    </mesh>)}
    <group ref={platform} position={[center[0], center[1], center[2]]}>
      <mesh renderOrder={84}>
        <boxGeometry args={[width * .94, .09, depth * .94]} />
        <meshBasicMaterial color="#93c5fd" transparent opacity={active ? .5 : .2} depthWrite={false} depthTest={false} toneMapped={false} />
        <Edges color="#2563eb" lineWidth={2} transparent opacity={active ? .9 : .4} depthWrite={false} depthTest={false} renderOrder={85} />
      </mesh>
    </group>
    {/* These small landing pads preserve the true start/end of each green walking leg. */}
    {[entry, exit].map((point, i) => <mesh key={i} position={[point[0], point[1] + .08, point[2]]} renderOrder={103}>
      <boxGeometry args={[.9, .08, .9]} />
      <meshBasicMaterial color="#2563eb" transparent opacity={active ? .6 : .3} depthWrite={false} depthTest={false} toneMapped={false} />
    </mesh>)}
    <Billboard position={center} lockX lockZ>
      {[-1, 0, 1].map(i => <Line key={i} points={[[-.32, i * Math.min(.7, height / 5) - sign * .18, 0], [0, i * Math.min(.7, height / 5) + sign * .18, 0], [.32, i * Math.min(.7, height / 5) - sign * .18, 0]]} color="#1d4ed8" lineWidth={3} transparent opacity={active ? .9 : .4} depthWrite={false} depthTest={false} renderOrder={105} />)}
    </Billboard>
    <MapHtml position={[center[0], high + 1.3, center[2]]} center zIndexRange={[25, 21]}>
      <button type="button" aria-label={caption} title={`${floorName(fromFloor)} → ${floorName(toFloor)}`} onClick={() => onSelectFloor(toFloor)}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-blue-300 bg-blue-50/95 px-2.5 py-1.5 text-left text-blue-800 shadow-sm backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-blue-600">
        <Icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
        <span><span className="block text-[11px] font-bold">{direction === 'up' ? 'Up' : 'Down'} to {floorName(toFloor).toLowerCase()}</span><span className="block text-[10px] capitalize text-blue-600">{connectorKind}</span></span>
      </button>
    </MapHtml>
  </group>
}
