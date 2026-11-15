import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import type { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { COLORS } from '../types'

/** Animated "marching ants" route polyline. */
export function RouteLine({ points, width = 5 }: { points: [number, number, number][]; width?: number }) {
  const ref = useRef<Line2>(null)
  useFrame((_, dt) => {
    const mat = ref.current?.material as { dashOffset: number } | undefined
    if (mat) mat.dashOffset -= dt * 1.4
  })
  if (points.length < 2) return null
  return (
    <group>
      <Line points={points} color="#ffffff" lineWidth={width + 4} />
      <Line points={points} color={COLORS.gold} lineWidth={width} />
      <Line ref={ref} points={points} color="#ffffff" lineWidth={Math.max(1.5, width * 0.35)} dashed dashSize={0.35} gapSize={0.6} />
    </group>
  )
}

export function EndPin({ position }: { position: [number, number, number] }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = position[1] + 0.25 + Math.sin(clock.elapsedTime * 3) * 0.12
  })
  return (
    <group>
      <group ref={ref} position={position}>
        <mesh position={[0, 1.15, 0]} castShadow>
          <sphereGeometry args={[0.45, 24, 24]} />
          <meshStandardMaterial color={COLORS.cardinal} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.55, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[0.32, 0.9, 24]} />
          <meshStandardMaterial color={COLORS.cardinal} roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.15, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
      <mesh position={[position[0], position[1] + 0.03, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.6, 32]} />
        <meshBasicMaterial color={COLORS.cardinal} transparent opacity={0.35} />
      </mesh>
    </group>
  )
}

export function StartDot({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.16, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.06, 32]} />
        <meshStandardMaterial color={COLORS.cardinal} />
      </mesh>
    </group>
  )
}

