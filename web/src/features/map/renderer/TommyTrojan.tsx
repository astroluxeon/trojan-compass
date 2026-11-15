import { useFrame, useThree } from '@react-three/fiber'
import { Grab, MapPin } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Group, Mesh, MeshBasicMaterial, Plane, Raycaster, Vector2, Vector3 } from 'three'
import { cellCenter, cellTitle, floorName, floorY, metersPerUnit, type FloorLayout } from '../data/generated/floorplan'
import { mapLocationAt } from '../map-location'
import { advanceCarrySwing, createCarrySwing } from './mascot-motion'
import type { MapLocation } from '../types'
import { MapHtml } from './MapHtml'
import { TOMMY_HEIGHT_METERS, TOMMY_MODEL_HEIGHT, TOMMY_NAPE, TommyTrojanModel } from './TommyTrojanModel'

export function CurrentLocationPin({ location, onSelect }: { location: MapLocation; onSelect: () => void }) {
  return (
    <MapHtml position={[location.x, floorY(location.floor) + 0.08, location.z]} center zIndexRange={[25, 21]}>
      <button type="button" onClick={onSelect} aria-label={`Current location: ${location.label} · ${floorName(location.floor)}`}
        className="flex -translate-y-1/2 flex-col items-center rounded-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-cardinal">
        <MapPin className="h-8 w-8 fill-gold text-cardinal drop-shadow" />
        <span className="whitespace-nowrap rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-neutral-900 shadow-sm">Current location · {floorName(location.floor)}</span>
      </button>
    </MapHtml>
  )
}

export function TommyTrojanMarker({ location, onGrab }: { location: MapLocation; onGrab: () => void }) {
  const scale = TOMMY_HEIGHT_METERS / (TOMMY_MODEL_HEIGHT * metersPerUnit(location.building))
  const body = useRef<Group>(null)
  const fall = useRef({ height: scale * 0.7, velocity: 0 })
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={scale}><ringGeometry args={[0.26, 0.3, 32]} /><meshBasicMaterial color="#990000" transparent opacity={0.7} depthWrite={false} /></mesh>
      <group ref={body} onPointerDown={(event) => { event.stopPropagation(); onGrab() }}><group scale={scale}><TommyTrojanModel /></group></group>
      <MapHtml position={[0, 0, scale * 0.38]} center zIndexRange={[25, 21]}>
        <button onPointerDown={onGrab} onClick={onGrab} aria-label="Move Trojan guide to a new current location" className="whitespace-nowrap rounded-full bg-cardinal px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
          <span role="img" aria-label={`Trojan guide · Current location: ${location.label}`}>You are here</span>
        </button>
      </MapHtml>
    </group>
  )
}

export function TommyTrojanPlacement({ layout, onDrop }: { layout: FloorLayout; onDrop: (location: MapLocation) => void }) {
  const scale = TOMMY_HEIGHT_METERS / (TOMMY_MODEL_HEIGHT * metersPerUnit(layout.building))
  const gripHeight = (TOMMY_NAPE[1] + 0.45) * scale
  const { camera, gl } = useThree()
  const preview = useRef<Group>(null)
  const body = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const pointer = useRef<{ x: number; z: number; grabX: number; grabZ: number; valid: boolean } | null>(null)
  const previousGrip = useRef<{ x: number; z: number } | null>(null)
  const swing = useRef(createCarrySwing())
  const gripIcon = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const ray = new Raycaster()
    const plane = new Plane(new Vector3(0, 1, 0), -floorY(layout.floor))
    const point = new Vector3()
    const gripPlane = new Plane(new Vector3(0, 1, 0), -(floorY(layout.floor) + 0.05 + gripHeight))
    const gripPoint = new Vector3()
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
      return location
    }
    const move = (event: PointerEvent) => {
      const location = resolve(event)
      if (!root?.contains(event.target as Node)) pointer.current = null
      else if (ray.ray.intersectPlane(gripPlane, gripPoint)) pointer.current = {
        x: location?.x ?? point.x, z: location?.z ?? point.z,
        grabX: gripPoint.x, grabZ: gripPoint.z, valid: !!location,
      }
    }
    const drop = (event: PointerEvent) => {
      if (event.button !== 0 || event.target !== gl.domElement) return
      const location = resolve(event)
      if (location) {
        // The release places the guide; its following click must not select a ghost floor.
        const swallowClick = (click: MouseEvent) => click.stopImmediatePropagation()
        gl.domElement.addEventListener('click', swallowClick, { capture: true, once: true })
        window.setTimeout(() => gl.domElement.removeEventListener('click', swallowClick, true), 500)
        onDrop(location)
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', drop)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', drop) }
  }, [camera, gl, layout, onDrop, gripHeight])
  useFrame((_, delta) => {
    if (!preview.current) return
    const target = pointer.current
    preview.current.visible = !!target
    if (gripIcon.current) gripIcon.current.style.opacity = target ? '1' : '0'
    if (!target) { previousGrip.current = null; return }
    preview.current.position.set(target.x, floorY(layout.floor) + 0.05, target.z)
    if (body.current) {
      // Keep the nape under the pointer; the rest of the suit swings below that pivot.
      body.current.position.set(target.grabX - target.x, gripHeight, target.grabZ - target.z)
      const previous = previousGrip.current ?? { x: target.grabX, z: target.grabZ }
      const dt = Math.max(delta, 1 / 240)
      advanceCarrySwing(swing.current, (target.grabX - previous.x) / dt, (target.grabZ - previous.z) / dt, delta)
      body.current.rotation.set(.28 + swing.current.x, swing.current.z * .15, swing.current.z)
      previousGrip.current = { x: target.grabX, z: target.grabZ }
    }
    if (ring.current) (ring.current.material as MeshBasicMaterial).color.set(target.valid ? '#990000' : '#a3a3a3')
  })
  return (
    <group ref={preview} visible={false}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} scale={scale}><ringGeometry args={[0.27, 0.34, 32]} /><meshBasicMaterial color="#990000" transparent opacity={0.65} depthWrite={false} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={scale}><circleGeometry args={[0.25, 32]} /><meshBasicMaterial color="#000000" transparent opacity={0.12} depthWrite={false} /></mesh>
      <group ref={body}>
        <group scale={scale}><group position={[-TOMMY_NAPE[0], -TOMMY_NAPE[1], -TOMMY_NAPE[2]]}><TommyTrojanModel carried /></group></group>
        <MapHtml center style={{ pointerEvents: 'none' }} zIndexRange={[30, 26]}>
          <span ref={gripIcon} aria-hidden="true" style={{ opacity: 0 }} className="block -translate-x-2 -translate-y-2 text-cardinal drop-shadow-sm"><Grab className="h-3 w-3 fill-white" /></span>
        </MapHtml>
      </group>
    </group>
  )
}
