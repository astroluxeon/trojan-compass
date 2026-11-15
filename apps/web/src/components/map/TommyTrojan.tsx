import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Group, Mesh, MeshBasicMaterial, Plane, Quaternion, Raycaster, Shape, Vector2, Vector3 } from 'three'
import { cellCenter, cellTitle, floorY, type FloorLayout } from '../../data/floorplan'
import { mapLocationAt } from '../../lib/map-location'
import type { MapLocation } from '../../lib/types'
import { MapHtml } from './MapHtml'

const BRONZE = '#a67b3e'
const GOLD = '#d2a858'
type Point = [number, number, number]

function Limb({ from, to, radius = 0.12 }: { from: Point; to: Point; radius?: number }) {
  const start = new Vector3(...from)
  const end = new Vector3(...to)
  const direction = end.clone().sub(start)
  const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize())
  return (
    <mesh position={start.add(end).multiplyScalar(0.5)} quaternion={rotation} castShadow>
      <capsuleGeometry args={[radius, Math.max(0.01, direction.length() - radius * 2), 4, 10]} />
      <meshStandardMaterial color={BRONZE} metalness={0.65} roughness={0.4} />
    </mesh>
  )
}

// Original miniature modeled after USC's photos: https://www.marshall.usc.edu/posts/marshall-welcomes-21-new-faculty-2024
export function TommyTrojanModel() {
  const crest = useMemo(() => new Shape()
    .moveTo(-0.36, 0).quadraticCurveTo(-0.6, 0.48, 0.1, 0.65)
    .quadraticCurveTo(0.48, 0.68, 0.5, 0.3).quadraticCurveTo(0.1, 0.42, -0.36, 0), [])
  return (
    <group rotation={[0, -0.35, 0]}>
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.52, 0.58, 0.12, 24]} />
        <meshStandardMaterial color="#625139" roughness={0.85} />
      </mesh>
      <mesh position={[0.25, 0.21, 0.12]} castShadow><boxGeometry args={[0.4, 0.3, 0.5]} /><meshStandardMaterial color="#85745b" roughness={0.85} /></mesh>
      <Limb from={[-0.23, 0.23, 0]} to={[-0.19, 0.86, -0.05]} radius={0.13} />
      <Limb from={[-0.19, 0.86, -0.05]} to={[-0.17, 1.37, 0]} radius={0.18} />
      <Limb from={[0.27, 0.4, 0.2]} to={[0.43, 0.93, 0.38]} radius={0.14} />
      <Limb from={[0.43, 0.93, 0.38]} to={[0.2, 1.4, 0]} radius={0.19} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.24, side === 1 ? 0.42 : 0.2, 0.16]} scale={[0.16, 0.1, 0.29]} castShadow><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#72532e" metalness={0.7} roughness={0.4} /></mesh>
          <mesh position={[side * 0.19, 1.84, 0.16]} scale={[0.22, 0.22, 0.16]} castShadow><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color={BRONZE} metalness={0.6} roughness={0.4} /></mesh>
          {[1.47, 1.62].map((y) => <mesh key={y} position={[side * 0.1, y, 0.18]} scale={[0.11, 0.09, 0.08]}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color={BRONZE} metalness={0.6} roughness={0.4} /></mesh>)}
        </group>
      ))}
      <mesh position={[0, 1.68, 0]} scale={[0.35, 0.46, 0.22]} castShadow><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color={BRONZE} metalness={0.65} roughness={0.38} /></mesh>
      <mesh position={[0, 1.29, 0]}><cylinderGeometry args={[0.27, 0.34, 0.3, 12]} /><meshStandardMaterial color="#76512b" metalness={0.5} roughness={0.55} /></mesh>
      {Array.from({ length: 10 }, (_, index) => (
        <group key={index} rotation={[0, index * Math.PI / 5, 0]}>
          <mesh position={[0, 1.21, 0.3]} rotation={[-0.15, 0, 0]} castShadow><boxGeometry args={[0.15, 0.32, 0.05]} /><meshStandardMaterial color={BRONZE} metalness={0.65} roughness={0.5} /></mesh>
        </group>
      ))}
      <Limb from={[-0.36, 1.98, 0]} to={[-0.61, 1.54, 0.09]} radius={0.15} />
      <Limb from={[-0.61, 1.54, 0.09]} to={[-0.78, 1.2, 0.26]} radius={0.115} />
      <Limb from={[0.35, 1.98, 0]} to={[0.64, 1.83, 0.2]} radius={0.16} />
      <Limb from={[0.64, 1.83, 0.2]} to={[0.64, 2.08, 0.45]} radius={0.12} />
      <group position={[0.65, 1.96, 0.48]} rotation={[0, -0.3, -0.2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 1.12]} castShadow><cylinderGeometry args={[0.45, 0.45, 0.09, 32]} /><meshStandardMaterial color={BRONZE} metalness={0.75} roughness={0.32} /></mesh>
        <mesh position={[0, 0, 0.055]}><torusGeometry args={[0.42, 0.025, 6, 32]} /><meshStandardMaterial color={GOLD} metalness={0.75} roughness={0.3} /></mesh>
        <mesh position={[0, 0, 0.07]} scale={[1, 1, 0.4]}><sphereGeometry args={[0.1, 12, 8]} /><meshStandardMaterial color={GOLD} metalness={0.75} roughness={0.3} /></mesh>
      </group>
      <group position={[-0.8, 1.21, 0.3]} rotation={[0, 0, -0.9]}>
        <mesh position={[0, -0.37, 0]} castShadow><cylinderGeometry args={[0.06, 0.005, 0.76, 4]} /><meshStandardMaterial color="#d3b87d" metalness={0.8} roughness={0.25} /></mesh>
        <mesh><boxGeometry args={[0.26, 0.05, 0.07]} /><meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.35} /></mesh>
      </group>
      <Limb from={[0, 2.02, 0]} to={[0, 2.26, 0]} radius={0.12} />
      <group position={[0, 2.36, 0]} rotation={[0, -0.2, 0]}>
        <mesh scale={[0.2, 0.25, 0.19]} castShadow><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color={BRONZE} metalness={0.6} roughness={0.4} /></mesh>
        <mesh position={[0, 0.1, -0.01]} castShadow><sphereGeometry args={[0.25, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.35} /></mesh>
        <mesh position={[0, 0.06, 0.23]}><boxGeometry args={[0.05, 0.2, 0.06]} /><meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.35} /></mesh>
        {[-1, 1].map((side) => <mesh key={side} position={[side * 0.2, -0.12, 0.06]} rotation={[0, 0, side * -0.2]}><boxGeometry args={[0.05, 0.26, 0.16]} /><meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.35} /></mesh>)}
        <mesh position={[-0.05, 0.22, 0]} rotation={[0, Math.PI / 2, 0]} castShadow><extrudeGeometry args={[crest, { depth: 0.1, bevelEnabled: false }]} /><meshStandardMaterial color="#5a3d22" metalness={0.5} roughness={0.6} /></mesh>
      </group>
    </group>
  )
}

export function TommyTrojanMarker({ location, onGrab }: { location: MapLocation; onGrab: () => void }) {
  const body = useRef<Group>(null)
  const fall = useRef({ height: 1.8, velocity: 0 })
  useFrame((_, delta) => {
    const state = fall.current
    const dt = Math.min(delta, 1 / 30)
    state.velocity += (-115 * state.height - 13 * state.velocity) * dt
    state.height += state.velocity * dt
    if (body.current) {
      body.current.position.y = Math.max(0, state.height)
      const squash = Math.max(0, -state.height)
      body.current.scale.set(1 + squash, 1 - squash * 1.5, 1 + squash)
    }
  })
  return (
    <group position={[location.x, floorY(location.floor) + 0.04, location.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.63, 0.75, 32]} /><meshBasicMaterial color="#990000" transparent opacity={0.7} depthWrite={false} /></mesh>
      <group ref={body} onPointerDown={(event) => { event.stopPropagation(); onGrab() }}><TommyTrojanModel /></group>
      <MapHtml position={[0, 0, 0.6]} center zIndexRange={[25, 21]}>
        <button onPointerDown={onGrab} onClick={onGrab} aria-label="Move Tommy Trojan to a new current location" className="whitespace-nowrap rounded-full bg-cardinal px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
          <span role="img" aria-label={`Tommy Trojan · Current location: ${location.label}`}>You are here</span>
        </button>
      </MapHtml>
    </group>
  )
}

export function TommyTrojanPlacement({ layout, onDrop }: { layout: FloorLayout; onDrop: (location: MapLocation) => void }) {
  const { camera, gl } = useThree()
  const preview = useRef<Group>(null)
  const body = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const pointer = useRef<{ x: number; z: number; valid: boolean } | null>(null)
  useEffect(() => {
    const ray = new Raycaster()
    const plane = new Plane(new Vector3(0, 1, 0), -floorY(layout.floor))
    const point = new Vector3()
    const root = gl.domElement.closest('[data-floor-map]')
    function resolve(event: PointerEvent) {
      if (!root?.contains(event.target as Node)) return null
      const rect = gl.domElement.getBoundingClientRect()
      ray.setFromCamera(new Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera)
      if (!ray.ray.intersectPlane(plane, point)) return null
      const button = (event.target as Element).closest('button')
      const cell = button?.title ? layout.cells.find((item) => item.name === button.title && (item.label ?? item.number) === button.textContent?.trim()) : undefined
      const entrance = layout.entrances.find((item) => button?.getAttribute('aria-label') === `Select ${layout.building} ${item.label}`)
      if (cell) {
        const [x, z] = cellCenter(cell)
        return { building: layout.building, floor: layout.floor, label: cellTitle(cell), x, z }
      }
      if (entrance) return { building: layout.building, floor: layout.floor, label: `${layout.building} ${entrance.label}`, x: entrance.x, z: entrance.z }
      if (button) return null
      const location = mapLocationAt(layout, point.x, point.z)
      pointer.current = { x: location?.x ?? point.x, z: location?.z ?? point.z, valid: !!location }
      return location
    }
    const move = (event: PointerEvent) => {
      const location = resolve(event)
      if (!root?.contains(event.target as Node)) pointer.current = null
      else if (location) pointer.current = { x: location.x, z: location.z, valid: true }
    }
    const drop = (event: PointerEvent) => {
      if (event.button !== 0 || event.target !== gl.domElement) return
      const location = resolve(event)
      if (location) {
        // The release places Tommy; its following click must not select a ghost floor.
        const swallowClick = (click: MouseEvent) => click.stopImmediatePropagation()
        gl.domElement.addEventListener('click', swallowClick, { capture: true, once: true })
        window.setTimeout(() => gl.domElement.removeEventListener('click', swallowClick, true), 500)
        onDrop(location)
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', drop)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', drop) }
  }, [camera, gl, layout, onDrop])
  useFrame(({ clock }, delta) => {
    if (!preview.current) return
    const target = pointer.current
    preview.current.visible = !!target
    if (!target) return
    const previousX = preview.current.position.x
    preview.current.position.set(target.x, floorY(layout.floor) + 0.05, target.z)
    if (body.current) {
      body.current.position.y = 0.9 + Math.sin(clock.elapsedTime * 4) * 0.08
      body.current.rotation.z += (Math.max(-0.18, Math.min(0.18, (previousX - target.x) * 0.15)) - body.current.rotation.z) * Math.min(1, delta * 10)
    }
    if (ring.current) (ring.current.material as MeshBasicMaterial).color.set(target.valid ? '#990000' : '#a3a3a3')
  })
  return (
    <group ref={preview} visible={false}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.6, 0.78, 32]} /><meshBasicMaterial color="#990000" transparent opacity={0.65} depthWrite={false} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.56, 32]} /><meshBasicMaterial color="#000000" transparent opacity={0.12} depthWrite={false} /></mesh>
      <group ref={body}><TommyTrojanModel /></group>
    </group>
  )
}
