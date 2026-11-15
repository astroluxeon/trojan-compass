import {
  Accessibility,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Footprints,
  GraduationCap,
  MapPin,
  Search,
  Shuffle,
  Toilet,
  Users,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import {
  BUILDINGS,
  BUILDING_BY_CODE,
  EVENT_COLORS,
  EVENT_LABELS,
  EVENTS,
  type BuildingCode,
  type CampusEvent,
  type EventKind,
} from '../../data/campus'
import { findCell, floorName, getFloorCells, getLevels, type Cell, type Place } from '../../data/floorplan'
import { PlaceIcon, searchPlaces } from './PlacePicker'

export type Persona = 'first-year' | 'transfer'
export type EventFilter = 'all' | EventKind

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">{children}</h3>
      {action}
    </div>
  )
}

const TIPS: Record<Persona, { title: string; tips: string[]; cta: string }> = {
  'first-year': {
    title: 'Welcome to campus, Trojan.',
    tips: [
      'Room numbers start with the floor: LAW 213 is on floor 2. Basement rooms in LAW have one-digit numbers, like LAW 3.',
      'The LAW north entrance has steps. The east ramp entrance is step-free.',
      'Do a practice walk to your first class before day one.',
    ],
    cta: 'Practice walk to LAW 3',
  },
  transfer: {
    title: 'Welcome, transfer Trojans.',
    tips: [
      'Transfer Student Welcome Reception today at 4 PM in the LAW 433 lounge (floor 4).',
      'Pre-law advising drop-in: Student Affairs, LAW 104, all day.',
      'Each end of LAW has stairs. Elevators are in the center and at the south end.',
    ],
    cta: 'Take me to the reception',
  },
}

export function WelcomeCard({
  persona,
  onPersona,
  onCta,
  onAccessible,
}: {
  persona: Persona
  onPersona: (p: Persona) => void
  onCta: () => void
  onAccessible: () => void
}) {
  const t = TIPS[persona]
  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200">
      <div className="relative bg-gradient-to-br from-cardinal-50 to-white p-4">
        <div className="mb-3 inline-flex rounded-full border border-neutral-200 bg-white p-0.5 text-[12px] font-semibold">
          {(['first-year', 'transfer'] as Persona[]).map((p) => (
            <button
              key={p}
              onClick={() => onPersona(p)}
              className={`rounded-full px-3 py-1 transition ${persona === p ? 'bg-cardinal text-white' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              {p === 'first-year' ? 'First-year' : 'Transfer'}
            </button>
          ))}
        </div>
        <h2 className="font-display text-[22px] font-bold leading-tight text-neutral-900">{t.title}</h2>
        <ul key={persona} className="animate-fade-up mt-3 space-y-2">
          {t.tips.map((tip) => (
            <li key={tip} className="flex gap-2 text-[13px] leading-snug text-neutral-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              {tip}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={onCta} className="flex items-center gap-1.5 rounded-lg bg-cardinal px-3 py-2 text-[13px] font-bold text-white transition hover:bg-cardinal-dark">
            {persona === 'first-year' ? <GraduationCap className="h-4 w-4" /> : <Users className="h-4 w-4" />}
            {t.cta}
          </button>
          <button onClick={onAccessible} className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-semibold text-neutral-700 transition hover:border-[#1F5BA8] hover:text-[#1F5BA8]">
            <Accessibility className="h-4 w-4" />
            Accessibility view
          </button>
        </div>
      </div>
    </section>
  )
}

export function eventPlaceId(e: CampusEvent) {
  return e.room
}

function eventWhere(e: CampusEvent) {
  const c = findCell(e.room)
  return c ? `${e.building} ${c.label ?? c.number}` : e.building
}

export function EventList({
  filter,
  onFilter,
  onOpen,
  building,
}: {
  filter: EventFilter
  onFilter: (f: EventFilter) => void
  onOpen: (e: CampusEvent) => void
  building?: BuildingCode
}) {
  const list = EVENTS.filter((e) => (filter === 'all' || e.kind === filter) && (!building || e.building === building))
  return (
    <section>
      <SectionTitle>{building ? `Happening in ${building} today` : 'Happening today'}</SectionTitle>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(['all', 'class', 'club', 'general'] as EventFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => onFilter(f)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold transition ${
              filter === f ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
            }`}
          >
            {f !== 'all' && <span className="h-2 w-2 rounded-full" style={{ background: EVENT_COLORS[f] }} />}
            {f === 'all' ? 'All' : f === 'class' ? 'My classes' : f === 'club' ? 'Clubs' : 'Campus events'}
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="rounded-lg bg-neutral-50 px-3 py-4 text-center text-[13px] text-neutral-500">Nothing scheduled here for this filter.</p>}
      <div className="space-y-2">
        {list.map((e) => (
          <button
            key={e.id}
            onClick={() => onOpen(e)}
            className="group flex w-full items-stretch gap-3 rounded-lg border border-neutral-200 bg-white p-3 text-left transition hover:border-neutral-300 hover:shadow-sm"
          >
            <span className="w-1 shrink-0 rounded-full" style={{ background: EVENT_COLORS[e.kind] }} />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: e.kind === 'club' ? '#9a7600' : EVENT_COLORS[e.kind] }}>
                {EVENT_LABELS[e.kind]}
              </span>
              <span className="block truncate text-[14px] font-semibold text-neutral-900">{e.title}</span>
              <span className="mt-1 flex items-center gap-3 text-[12px] text-neutral-500">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{e.time}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{eventWhere(e)}</span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 self-center text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-cardinal" />
          </button>
        ))}
      </div>
    </section>
  )
}

export function SearchBox({ onPlace, onBuilding }: { onPlace: (p: Place) => void; onBuilding: (c: BuildingCode) => void }) {
  const [q, setQ] = useState('')
  const places = useMemo(() => searchPlaces(q, 6), [q])
  const buildings = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    return BUILDINGS.filter((b) => b.code.toLowerCase().includes(s) || b.name.toLowerCase().includes(s)).slice(0, 4)
  }, [q])
  return (
    <div className="relative">
      <label className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 transition focus-within:border-cardinal focus-within:ring-2 focus-within:ring-cardinal/15">
        <Search className="h-4 w-4 text-neutral-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search rooms, buildings or codes (e.g. LAW 107)"
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-neutral-400"
        />
      </label>
      {q && (buildings.length > 0 || places.length > 0) && (
        <div className="animate-fade-up absolute inset-x-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-xl">
          {buildings.map((b) => (
            <button key={b.code} onClick={() => { onBuilding(b.code); setQ('') }} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-cardinal-50">
              <CodeTile code={b.code} small />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold">{b.name}</span>
                <span className="block text-[12px] text-neutral-500">{getLevels(b.code).length} levels · Building</span>
              </span>
            </button>
          ))}
          {places.map((p) => (
            <button key={p.id} onClick={() => { onPlace(p); setQ('') }} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-cardinal-50">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-neutral-100 text-neutral-600"><PlaceIcon place={p} /></span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold">{p.label}</span>
                <span className="block truncate text-[12px] text-neutral-500">{p.sub}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function CodeTile({ code, small, large }: { code: string; small?: boolean; large?: boolean }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-md bg-cardinal font-bold tracking-wide text-white ${
        large ? 'h-14 w-14 text-[18px]' : small ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-[13px]'
      }`}
    >
      {code}
    </span>
  )
}

export function BuildingGrid({ onOpen }: { onOpen: (c: BuildingCode) => void }) {
  return (
    <section>
      <SectionTitle>Buildings</SectionTitle>
      <div className="grid grid-cols-1 gap-1">
        {[...BUILDINGS].sort((a, b) => Number(!!b.featured) - Number(!!a.featured)).map((b) => {
          const n = EVENTS.filter((e) => e.building === b.code).length
          return (
            <button key={b.code} onClick={() => onOpen(b.code)} className={`group flex items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-neutral-50 ${b.featured ? 'bg-[#FFCC00]/10 ring-1 ring-[#FFCC00]/60' : ''}`}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-neutral-200 bg-white text-[13px] font-bold tracking-wide text-neutral-800 transition group-hover:border-cardinal group-hover:bg-cardinal group-hover:text-white">
                {b.code}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{b.name}</span>
                <span className="block truncate text-[12px] text-neutral-500">
                  {b.subtitle ?? `${b.floors} floors · ${b.tags.join(' · ')}`}
                </span>
              </span>
              {b.featured ? (
                <span className="rounded-full bg-[#FFCC00] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-900">Real plans</span>
              ) : (
                n > 0 && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">{n} today</span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function BuildingHeader({ code, onBack }: { code: BuildingCode; onBack: () => void }) {
  const b = BUILDING_BY_CODE[code]
  const levels = getLevels(code)
  const features = b.features ?? [
    { icon: 'access', label: 'Step-free entrance' },
    { icon: 'elevator', label: `Elevator to all ${levels.length} floors` },
    { icon: 'restroom', label: 'All-gender restrooms' },
  ]
  const icons = {
    access: <Accessibility className="h-4 w-4" />,
    elevator: <ArrowUpDown className="h-4 w-4" />,
    restroom: <Toilet className="h-4 w-4" />,
    steps: <Footprints className="h-4 w-4" />,
  }
  return (
    <section>
      <button onClick={onBack} className="mb-3 flex items-center gap-1 text-[13px] font-semibold text-neutral-500 transition hover:text-cardinal">
        <ChevronLeft className="h-4 w-4" /> All buildings
      </button>
      <div className="flex gap-3">
        <CodeTile code={code} large />
        <div className="min-w-0">
          {b.subtitle && <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-cardinal">{b.subtitle}</div>}
          <h2 className="font-display text-[22px] font-bold leading-tight">{b.name}</h2>
          <p className="mt-1 text-[13px] leading-snug text-neutral-600">{b.blurb}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {features.map((f) => (
          <Feature key={f.label} icon={icons[f.icon as keyof typeof icons]} label={f.label} color={f.icon === 'access' ? '#1F5BA8' : '#3f3f46'} />
        ))}
      </div>
      {b.source ? (
        <a href={b.source.url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1.5 text-[12px] text-neutral-500 hover:text-cardinal">
          <FileText className="h-3.5 w-3.5" />
          Floor plans traced from the {b.source.label}
        </a>
      ) : (
        <p className="mt-2 text-[12px] text-neutral-400">Sample floor plan. Real plans can be added the way LAW was.</p>
      )}
    </section>
  )
}

function Feature({ icon, label, color }: { icon: ReactNode; label: string; color: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 px-2 py-2">
      <span style={{ color }}>{icon}</span>
      <span className="mt-1 block text-[11px] font-semibold leading-tight text-neutral-700">{label}</span>
    </div>
  )
}

export function SelectedRoomCard({
  cellId,
  onDirectionsTo,
  onStartHere,
  onClose,
}: {
  cellId: string
  onDirectionsTo: () => void
  onStartHere: () => void
  onClose: () => void
}) {
  const c = findCell(cellId)
  if (!c) return null
  const events = EVENTS.filter((e) => eventPlaceId(e) === c.id)
  const title = c.kind === 'room' ? (c.number ? `${c.building} ${c.number}` : c.name) : c.name
  return (
    <section className="animate-fade-up rounded-xl border-2 border-cardinal/80 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-cardinal">{floorName(c.floor)} · Selected</div>
          <h3 className="mt-0.5 font-display text-[20px] font-bold leading-tight">{title}</h3>
          <p className="text-[13px] text-neutral-600">
            {c.kind === 'room' ? (c.number ? c.name : BUILDING_BY_CODE[c.building].name) : BUILDING_BY_CODE[c.building].name}
            {c.capacity ? ` · Seats ${c.capacity}` : ''}
            {c.area ? ` · ${c.area.toLocaleString()} sq ft` : ''}
          </p>
        </div>
        <button onClick={onClose} className="rounded-md px-2 py-1 text-[12px] font-semibold text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
          Close
        </button>
      </div>
      {events.map((e) => (
        <div key={e.id} className="mt-3 flex gap-2 rounded-lg bg-neutral-50 p-2.5">
          <span className="w-1 rounded-full" style={{ background: EVENT_COLORS[e.kind] }} />
          <div className="text-[13px]">
            <div className="font-semibold">{e.title}</div>
            <div className="text-neutral-500">{e.time} · {e.host}</div>
          </div>
        </div>
      ))}
      <div className="mt-3 flex gap-2">
        <button onClick={onDirectionsTo} className="flex-1 rounded-lg bg-cardinal py-2 text-[13px] font-bold text-white transition hover:bg-cardinal-dark">Directions here</button>
        <button onClick={onStartHere} className="flex-1 rounded-lg border border-neutral-200 py-2 text-[13px] font-semibold text-neutral-700 transition hover:bg-neutral-50">I'm here</button>
      </div>
    </section>
  )
}

export function FloorDirectory({
  code,
  floor,
  highlights,
  selected,
  onSelect,
  onRandom,
}: {
  code: BuildingCode
  floor: number
  highlights: Map<string, string>
  selected?: string
  onSelect: (c: Cell) => void
  onRandom: () => void
}) {
  const cells = getFloorCells(code, floor).filter((c) => c.kind !== 'stairs' && c.kind !== 'block')
  const sorted = [...cells].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }))
  return (
    <section>
      <SectionTitle
        action={
          <button onClick={onRandom} className="flex items-center gap-1 text-[12px] font-semibold text-neutral-500 hover:text-cardinal">
            <Shuffle className="h-3 w-3" /> Random room
          </button>
        }
      >
        {floorName(floor)} directory
      </SectionTitle>
      <div className="grid grid-cols-2 gap-1.5">
        {sorted.map((c) => {
          const hl = highlights.get(c.id)
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${
                selected === c.id ? 'border-cardinal bg-cardinal-50' : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              {c.kind === 'room' ? (
                <span className="text-[13px] font-bold tabular-nums">{c.number || c.label}</span>
              ) : c.kind === 'restroom' ? (
                <Toilet className="h-4 w-4 text-neutral-600" />
              ) : (
                <ArrowUpDown className="h-4 w-4 text-neutral-600" />
              )}
              <span className="min-w-0 flex-1 truncate text-[12px] text-neutral-600" title={c.name}>{c.kind === 'room' ? (c.number ? c.name : '') : c.name}</span>
              {hl && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: hl }} />}
            </button>
          )
        })}
      </div>
    </section>
  )
}
