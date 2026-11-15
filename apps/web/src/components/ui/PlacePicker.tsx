import { Building2, DoorOpen, MapPin, Search, Toilet, ArrowUpDown, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { BUILDINGS } from '../../data/campus'
import { getBuildingPlaces, type Place } from '../../data/floorplan'

const ALL_PLACES: Place[] = BUILDINGS.flatMap((b) => getBuildingPlaces(b.code))

export function searchPlaces(q: string, limit = 8): Place[] {
  const s = q.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!s) return []
  const compact = s.replace(/\s/g, '')
  return ALL_PLACES.filter((p) => {
    const label = p.label.toLowerCase()
    return label.includes(s) || label.replace(/\s/g, '').includes(compact) || p.sub.toLowerCase().includes(s)
  }).slice(0, limit)
}

export function PlaceIcon({ place, className = 'h-4 w-4' }: { place: Place; className?: string }) {
  if (place.kind === 'restroom') return <Toilet className={className} />
  if (place.kind === 'elevator') return <ArrowUpDown className={className} />
  if (place.kind === 'entrance') return <DoorOpen className={className} />
  if (place.kind === 'room') return <MapPin className={className} />
  return <Building2 className={className} />
}

interface Props {
  label: string
  value: Place | null
  onChange: (p: Place | null) => void
  placeholder: string
  dot: 'start' | 'end'
  suggestions?: Place[]
}

export function PlacePicker({ label, value, onChange, placeholder, dot, suggestions = [] }: Props) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const results = useMemo(() => (q ? searchPlaces(q) : suggestions.slice(0, 6)), [q, suggestions])
  return (
    <div className="relative">
      <label className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2 transition focus-within:border-cardinal focus-within:ring-2 focus-within:ring-cardinal/15">
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot === 'start' ? 'border-[2.5px] border-cardinal bg-white' : 'bg-cardinal'}`}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">{label}</span>
          <input
            ref={inputRef}
            value={open ? q : (value?.label ?? '')}
            onChange={(e) => {
              setQ(e.target.value)
              setOpen(true)
            }}
            onFocus={() => {
              setQ('')
              setOpen(true)
            }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={placeholder}
            className="w-full bg-transparent text-[14px] font-semibold text-neutral-900 outline-none placeholder:font-normal placeholder:text-neutral-400"
          />
        </span>
        {value && !open && (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={(e) => {
              e.preventDefault()
              onChange(null)
            }}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </label>
      {open && (
        <div className="animate-fade-up absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl">
          {!q && results.length > 0 && (
            <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              Suggested
            </div>
          )}
          {results.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-3 text-[13px] text-neutral-500">
              <Search className="h-4 w-4" />
              {q ? 'No matches. Try "LAW 107" or "courtroom".' : 'Type a room, building or "restrooms".'}
            </div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(p)
                  setOpen(false)
                  inputRef.current?.blur()
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-cardinal-50"
              >
                <span className="grid h-7 w-7 place-items-center rounded-md bg-neutral-100 text-neutral-600">
                  <PlaceIcon place={p} className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold">{p.label}</span>
                  <span className="block truncate text-[12px] text-neutral-500">{p.sub}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
