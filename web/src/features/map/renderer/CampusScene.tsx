import { Edges, Line } from '@react-three/drei'
import { MapHtml } from './MapHtml'
import { useMemo, useState } from 'react'
import * as THREE from 'three'
import {
  BUILDINGS,
  FLOOR_HEIGHT_CAMPUS,
  WALKWAYS,
  type Building,
  type BuildingCode,
} from '../data/generated/campus'
import type { OutdoorLeg } from '../../routing/legacy/routing.generated'
import { COLORS } from '../types'
import { EndPin, RouteLine, StartDot } from './RouteLine'

interface Props {
  emphasized: BuildingCode[]
  outdoor?: OutdoorLeg
  onSelect: (code: BuildingCode) => void
}

export function CampusScene({ emphasized, outdoor, onSelect }: Props) {
  const [hover, setHover] = useState<BuildingCode | null>(null)
  return (
    <group>
      <Ground />
      {WALKWAYS.map((w, i) => (
        <group key={i}>
          <mesh position={[w.x, 0.01, w.z]} receiveShadow>
            <boxGeometry args={[w.w, 0.02, w.d]} />
            <meshStandardMaterial color="#efeff1" />
          </mesh>
          {w.label && (
            <MapHtml
              position={w.vertical ? [w.x, 0.05, -24] : [27, 0.05, w.z]}
              center
              zIndexRange={[5, 0]}
              style={{ pointerEvents: 'none' }}
            >
              <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                {w.label}
              </span>
            </MapHtml>
          )}
        </group>
      ))}
      <Trees />
      {BUILDINGS.map((b) => (
        <BuildingMass
          key={b.code}
          b={b}
          hovered={hover === b.code}
          emphasized={emphasized.includes(b.code)}
          onHover={(h) => setHover((cur) => (h ? b.code : cur === b.code ? null : cur))}
          onSelect={() => onSelect(b.code)}
        />
      ))}
      {outdoor && outdoor.points[0] && (
        <>
          <RouteLine points={outdoor.points.map(([x, z]) => [x, 0.12, z] as [number, number, number])} width={6} />
          <StartDot position={[outdoor.points[0][0], 0.02, outdoor.points[0][1]]} />
        </>
      )}
    </group>
  )
}

function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <shadowMaterial opacity={0.12} />
      </mesh>
    </>
  )
}

function Trees() {
  const spots = useMemo(() => {
    const out: [number, number][] = []
    for (let z = -26; z <= 26; z += 3.6) {
      if (Math.abs(z - 10) < 2.2) continue
      out.push([6.85, z], [9.15, z])
    }
    for (let x = -30; x <= 30; x += 4) {
      if (Math.abs(x - 8) < 2.5) continue
      out.push([x, 8.6], [x, 11.4])
    }
    return out
  }, [])
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
            <meshStandardMaterial color="#b9b9be" />
          </mesh>
          <mesh position={[0, 0.75, 0]} castShadow>
            <icosahedronGeometry args={[0.42 + (i % 3) * 0.05, 0]} />
            <meshStandardMaterial color="#e2e2e5" flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function BuildingMass({
  b,
  hovered,
  emphasized,
  onHover,
  onSelect,
}: {
  b: Building
  hovered: boolean
  emphasized: boolean
  onHover: (h: boolean) => void
  onSelect: () => void
}) {
  const height = b.floors * FLOOR_HEIGHT_CAMPUS
  const geometry = useMemo(() => {
    const shape = new THREE.Shape(b.footprint.map(([x, z]) => new THREE.Vector2(x, -z)))
    const g = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false })
    g.rotateX(-Math.PI / 2)
    return g
  }, [b, height])
  const floorLines = useMemo(() => {
    const loop = b.footprint.length ? [...b.footprint, b.footprint[0]!] : []
    return Array.from({ length: b.floors - 1 }, (_, k) =>
      loop.map(([x, z]) => [x * 1.002, (k + 1) * FLOOR_HEIGHT_CAMPUS, z * 1.002] as [number, number, number]),
    )
  }, [b])
  const active = hovered || emphasized
  const topY = height + (b.tower ? 2.4 : 0)
  return (
    <group position={[b.position[0], 0, b.position[1]]}>
      <mesh
        geometry={geometry}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          onHover(false)
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        <meshStandardMaterial color={active ? COLORS.modelHover : COLORS.model} roughness={0.85} />
        <Edges threshold={20} color={active ? COLORS.cardinal : COLORS.edge} lineWidth={active ? 2 : 1} />
      </mesh>
      {floorLines.map((pts, i) => (
        <Line key={i} points={pts} color={active ? '#c08080' : '#bdbdc2'} lineWidth={1} />
      ))}
      {b.tower && (
        <mesh position={[0, height + 1.2, b.code === 'VKC' ? -2 : 0]} castShadow>
          <boxGeometry args={[1.8, 2.4, 1.8]} />
          <meshStandardMaterial color={active ? COLORS.modelHover : COLORS.model} roughness={0.85} />
          <Edges color={active ? COLORS.cardinal : COLORS.edge} />
        </mesh>
      )}
      {emphasized && <EndPin position={[0, topY + 0.1, 0]} />}
      <MapHtml position={[0, topY + (emphasized ? 3.4 : 1.4), 0]} center zIndexRange={[20, 0]}>
        <button
          onClick={onSelect}
          onMouseEnter={() => onHover(true)}
          onMouseLeave={() => onHover(false)}
          className={`group relative flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] font-bold tracking-wide shadow-sm transition ${
            active
              ? 'border-[#990000] bg-[#990000] text-white'
              : 'border-neutral-300 bg-white text-neutral-800 hover:border-[#990000]'
          }`}
        >
          {b.code}
          {b.featured && (
            <span className={`whitespace-nowrap rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wider ${active ? 'bg-white/20 text-white' : 'bg-[#FFCC00] text-neutral-900'}`}>
              Floor plans
            </span>
          )}
          {hovered && (
            <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2.5 py-1.5 text-left text-xs font-medium tracking-normal text-white shadow-lg">
              {b.name}
              <span className="block text-[11px] font-normal text-neutral-300">
                {b.subtitle ? `${b.subtitle} · ` : ''}
                {b.levels?.includes(0) ? `${b.floors} floors + basement` : `${b.floors} floors`} · Click to explore
              </span>
            </span>
          )}
        </button>
      </MapHtml>
    </group>
  )
}

