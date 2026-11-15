import {
  Accessibility,
  ArrowDownUp,
  ArrowUpDown,
  DoorOpen,
  Flag,
  Footprints,
  LogOut,
  Navigation,
  Route as RouteIcon,
  Shuffle,
  TreePine,
  Zap,
} from 'lucide-react'
import { floorName, type Place } from '../../data/floorplan'
import { formatDuration, type Route, type RouteMode, type StepIcon } from '../../lib/routing'
import { PlacePicker } from './PlacePicker'

const MODES: { key: RouteMode; label: string; icon: typeof Zap; hint: string }[] = [
  { key: 'fastest', label: 'Fastest', icon: Zap, hint: 'Shortest walk' },
  { key: 'stairs', label: 'Stairs', icon: Footprints, hint: 'Avoid waiting' },
  { key: 'elevator', label: 'Elevator', icon: Accessibility, hint: 'Step-free' },
]

interface Props {
  from: Place | null
  to: Place | null
  mode: RouteMode
  route: Route | null
  activeStep: number
  suggestions: Place[]
  onFrom: (p: Place | null) => void
  onTo: (p: Place | null) => void
  onMode: (m: RouteMode) => void
  onSwap: () => void
  onGo: () => void
  onRandom: () => void
  onClear: () => void
  onStep: (i: number) => void
}

export function DirectionsCard(p: Props) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between px-4 pt-4">
        <h3 className="flex items-center gap-2 text-[15px] font-bold">
          <Navigation className="h-4 w-4 text-cardinal" />
          Directions
        </h3>
        <button
          onClick={p.onRandom}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold text-neutral-600 transition hover:bg-neutral-100 hover:text-cardinal"
          title="Pick a random classroom to practice finding"
        >
          <Shuffle className="h-3.5 w-3.5" />
          Practice a random route
        </button>
      </div>
      <div className="relative space-y-2 p-4 pb-3">
        <PlacePicker label="From" dot="start" value={p.from} onChange={p.onFrom} placeholder="Where are you now?" suggestions={p.suggestions} />
        <PlacePicker label="To" dot="end" value={p.to} onChange={p.onTo} placeholder="Room, restroom, entrance…" suggestions={p.suggestions} />
        <button
          onClick={p.onSwap}
          aria-label="Swap start and destination"
          className="absolute right-7 top-[52px] z-10 grid h-7 w-7 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm transition hover:text-cardinal"
        >
          <ArrowDownUp className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="px-4">
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-neutral-100 p-1" role="radiogroup" aria-label="Route preference">
          {MODES.map(({ key, label, icon: Icon, hint }) => (
            <button
              key={key}
              role="radio"
              aria-checked={p.mode === key}
              onClick={() => p.onMode(key)}
              className={`rounded-md px-2 py-1.5 text-left transition ${
                p.mode === key ? 'bg-white shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <span className={`flex items-center gap-1.5 text-[13px] font-bold ${p.mode === key ? 'text-cardinal' : ''}`}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
              <span className="block text-[11px] text-neutral-500">{hint}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 p-4">
        <button
          disabled={!p.from || !p.to}
          onClick={p.onGo}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cardinal py-2.5 text-[14px] font-bold text-white transition hover:bg-cardinal-dark disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          <RouteIcon className="h-4 w-4" />
          Show route in 3D
        </button>
        {p.route && (
          <button onClick={p.onClear} className="rounded-lg border border-neutral-200 px-3 text-[13px] font-semibold text-neutral-600 hover:bg-neutral-50">
            Clear
          </button>
        )}
      </div>
      {p.route && <RouteSteps route={p.route} active={p.activeStep} onStep={p.onStep} />}
    </section>
  )
}

export const STEP_ICONS: Record<StepIcon, typeof Zap> = {
  start: DoorOpen,
  walk: Footprints,
  stairs: Footprints,
  elevator: ArrowUpDown,
  arrive: Flag,
  outdoor: TreePine,
  exit: LogOut,
}

function RouteSteps({ route, active, onStep }: { route: Route; active: number; onStep: (i: number) => void }) {
  return (
    <div className="animate-fade-up border-t border-neutral-100">
      <div className="flex items-end justify-between px-4 pb-2 pt-3">
        <div>
          <div className="font-display text-[22px] font-bold leading-none">{formatDuration(route.seconds)}</div>
          <div className="mt-1 text-[12px] text-neutral-500">
            {route.meters} m ·{' '}
            {route.usesElevator ? 'Elevator' : route.usesStairs ? 'Uses stairs' : 'No level changes'}
            {route.entranceSteps ? ' · Entrance has steps' : ''}
          </div>
        </div>
        {!route.usesStairs && !route.entranceSteps ? (
          <span className="flex items-center gap-1 rounded-full bg-[#1F5BA8]/10 px-2 py-1 text-[11px] font-bold text-[#1F5BA8]">
            <Accessibility className="h-3 w-3" /> Accessible
          </span>
        ) : null}
      </div>
      <ol className="px-2 pb-3">
        {route.steps.map((s, i) => {
          const Icon = STEP_ICONS[s.icon]
          const on = i === active
          return (
            <li key={i}>
              <button
                onClick={() => onStep(i)}
                className={`group flex w-full gap-3 rounded-lg px-2 py-2 text-left transition ${on ? 'bg-cardinal-50' : 'hover:bg-neutral-50'}`}
              >
                <span className="relative flex flex-col items-center">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full ${
                      s.icon === 'arrive'
                        ? 'bg-cardinal text-white'
                        : on
                          ? 'bg-cardinal text-white'
                          : s.icon === 'elevator'
                            ? 'bg-[#1F5BA8]/10 text-[#1F5BA8]'
                            : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                </span>
                <span className="min-w-0 flex-1 pt-0.5">
                  <span className={`block text-[13px] leading-snug ${on ? 'font-semibold text-neutral-900' : 'text-neutral-700'}`}>{s.text}</span>
                  {s.building && (
                    <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      {s.building} · {floorName(s.floor ?? 1)}
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
