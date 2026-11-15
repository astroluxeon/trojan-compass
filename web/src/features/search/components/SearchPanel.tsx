import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { MapAction } from '@trojan-compass/shared/api'
import { compassApi, CompassApiError } from '@/lib/api-client'
import { INPUT, ACTION } from '@/components/ui/form-styles'

export function SearchPanel({ query, setQuery, buildingId, onActions, setNotice }: {
  query: string
  setQuery: (value: string) => void
  buildingId: string
  onActions: (actions: MapAction[], dataVersion: string) => void
  setNotice: (message: string) => void
}) {
  type Result = { label: string; action: MapAction; dataVersion: string }
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const version = useRef<string | null>(null)
  const sequence = useRef(0)
  const active = useRef<AbortController | null>(null)
  const actions = useRef(onActions); actions.current = onActions
  const notice = useRef(setNotice); notice.current = setNotice
  async function search(text: string, autoOpen = false) {
    active.current?.abort(); const controller = new AbortController(), current = ++sequence.current
    active.current = controller; setLoading(true); notice.current('')
    try {
      if (!version.current) version.current = (await compassApi.building(buildingId, undefined, controller.signal)).dataVersion
      const params = { q: text.trim(), dataVersion: version.current, limit: 10 }
      const [buildings, places] = await Promise.all([compassApi.buildings(params, controller.signal), compassApi.places(params, controller.signal)])
      if (current !== sequence.current || controller.signal.aborted) return
      const next: Result[] = [
        ...buildings.items.map(b => ({ label: `${b.code} · ${b.name}`, action: { type: 'focus_building' as const, buildingId: b.id }, dataVersion: buildings.dataVersion })),
        ...places.items.map(p => ({ label: `${p.matchLabel} · Floor ${p.place.floorId}`, action: { type: 'focus_place' as const, buildingId: p.place.buildingId, floorId: p.place.floorId, placeId: p.place.id }, dataVersion: places.dataVersion })),
      ]
      setResults(next); setHasMore(!!buildings.nextCursor || !!places.nextCursor)
      if (!next.length) notice.current('No matching building or room. Try a building code and room number.')
      if (autoOpen && next.length === 1 && !buildings.nextCursor && !places.nextCursor) actions.current([next[0]!.action], next[0]!.dataVersion)
    } catch (failure) {
      if (current !== sequence.current || controller.signal.aborted) return
      if (failure instanceof CompassApiError && ['DATA_VERSION_UNAVAILABLE', 'DATA_VERSION_MISMATCH'].includes(failure.code)) version.current = null
      setResults([]); notice.current(failure instanceof Error ? failure.message : 'Search is unavailable.')
    } finally { if (current === sequence.current) { active.current = null; setLoading(false) } }
  }
  const searchRef = useRef(search); searchRef.current = search
  useEffect(() => {
    sequence.current++; active.current?.abort(); setResults([]); setHasMore(false); setLoading(false)
    if (!query.trim()) return
    const timer = setTimeout(() => { void searchRef.current(query) }, 200)
    return () => { clearTimeout(timer); sequence.current++; active.current?.abort() }
  }, [query, buildingId])
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault()
      if (query.trim()) void search(query, true)
    }}>
      <p className="text-[13px] leading-relaxed text-neutral-500">Find your next class, meeting, or study spot.</p>
      <div>
        <label htmlFor="room-search" className="block text-[12px] font-semibold text-neutral-700">Building and room code</label>
        <input id="room-search" value={query} onChange={event => { setQuery(event.target.value); setNotice('') }} placeholder="e.g. LAW 101" maxLength={200} required className={INPUT} autoComplete="off" />
      </div>
      <button className={ACTION} disabled={loading || !query.trim()}><Search className="h-4 w-4" /> {loading ? 'Searching…' : 'Search rooms'}</button>
      <ul aria-label="Search results" className="space-y-2">
        {results.map((result, index) => <li key={index}><button type="button" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-left text-sm hover:bg-neutral-50" onClick={() => {
          try { onActions([result.action], result.dataVersion); setNotice('') } catch (failure) { setNotice(failure instanceof Error ? failure.message : 'This location cannot be opened.') }
        }}>{result.label}</button></li>)}
      </ul>
      {hasMore && <p className="text-xs text-neutral-500">More matches are available. Add a building code or room number to narrow your search.</p>}
    </form>
  )
}
