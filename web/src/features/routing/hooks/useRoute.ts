import { useCallback, useEffect, useRef, useState } from 'react'
import type { Route, RouteRequest } from '@trojan-compass/shared/api'
import { clientRequestId, compassApi } from '@/lib/api-client'

type Input = Omit<RouteRequest, 'dataVersion' | 'clientRequestId'>
/** Resolve inputs and request a path under one cancellable generation. No fallback between modes. */
export function useRoute(dataVersion: string, source: 'published' | 'preview' = 'published') {
  const [route, setRoute] = useState<Route | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const active = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const clear = useCallback(() => { generation.current++; active.current?.abort(); active.current = null; setRoute(null); setError(null); setLoading(false) }, [])
  useEffect(() => { clear(); return () => { generation.current++; active.current?.abort() } }, [dataVersion, clear])
  const calculate = useCallback(async (input: Input | ((signal: AbortSignal) => Promise<Input>)) => {
    active.current?.abort(); const controller = new AbortController(), current = ++generation.current
    active.current = controller; setLoading(true); setError(null); setRoute(null)
    try {
      const resolved = typeof input === 'function' ? await input(controller.signal) : input
      if (current !== generation.current || controller.signal.aborted) return
      const request = source === 'preview' ? compassApi.previewRoute : compassApi.route
      const response = await request({ ...resolved, dataVersion, clientRequestId: clientRequestId() }, controller.signal)
      if (current === generation.current && !controller.signal.aborted) setRoute(response.route)
    } catch (failure) {
      if (current === generation.current && !controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Route unavailable.')
    } finally { if (current === generation.current) { active.current = null; setLoading(false) } }
  }, [dataVersion, source])
  const accept = useCallback((next: Route) => { clear(); setRoute(next) }, [clear])
  return { route, error, loading, calculate, clear, accept }
}
