import { useAnimations, useGLTF } from '@react-three/drei'
import { Suspense, useEffect, useMemo } from 'react'
import { Mesh } from 'three'
import { DANGLE_CLIP } from './mascot-motion'

// Exaggerated to twice human scale so the location marker stays visible.
export const TOMMY_MODEL_HEIGHT = 2.4
export const TOMMY_HEIGHT_METERS = 4.1
export const TOMMY_NAPE: [number, number, number] = [0, 1.45, -0.07]
// useGLTF caches by URL; the asset hash makes a rebuilt sculpt load in existing tabs.
const MODEL = '/models/tommy-trojan.glb?v=9642a0157ad3'
const CARRY_ANIMATIONS = [DANGLE_CLIP]

function Mascot({ carried }: { carried: boolean }) {
  const { scene } = useGLTF(MODEL)
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((object) => {
      if (object instanceof Mesh) object.castShadow = true
    })
    return clone
  }, [scene])
  const { actions } = useAnimations(CARRY_ANIMATIONS, model)
  useEffect(() => {
    const action = actions.NapeDangle
    if (!carried || !action) return
    action.reset().fadeIn(.18).play()
    return () => { action.stop() }
  }, [actions, carried])
  return <primitive object={model} dispose={null} />
}

export function TommyTrojanModel({ carried = false }: { carried?: boolean }) {
  return <Suspense fallback={null}><Mascot carried={carried} /></Suspense>
}

