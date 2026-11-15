import { Bot, Database, Layers, Map as MapIcon, Network, Plug, ScanLine, ShieldCheck, X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

const PHASES = [
  { tag: 'Now', title: '3D campus and floor plans', body: 'Gray 3D campus, clickable building codes, floor plans, markers, stairs and elevator routing.', current: true },
  { tag: 'Next', title: 'AI wayfinding assistant', body: 'Ask in plain language, like "I\'m at THH 101, how do I get to SGM 305?" Answers come from the same routing graph.' },
  { tag: 'Later', title: 'Connect to USC Maps', body: 'Shared building IDs, deep links and live feeds for schedules, events and elevator outages.' },
  { tag: 'Future', title: 'Indoor positioning', body: 'Scan a room sign or QR code to set "you are here". Optional Wi-Fi positioning.' },
]

function Item({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cardinal-50 text-cardinal">{icon}</span>
      <div>
        <div className="text-[14px] font-semibold text-neutral-900">{title}</div>
        <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-600">{children}</p>
      </div>
    </li>
  )
}

export function RoadmapSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Product roadmap">
      <button aria-label="Close roadmap" className="absolute inset-0 bg-neutral-900/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="animate-fade-up scrollbar-thin relative h-full w-full max-w-[560px] overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-neutral-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-cardinal">Future implementation</div>
            <h2 className="mt-1 font-display text-[26px] font-bold leading-tight">Where Trojan Wayfinder goes next</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-8 px-6 py-6">
          <section>
            <ol className="relative space-y-4 border-l-2 border-neutral-100 pl-5">
              {PHASES.map((p) => (
                <li key={p.tag} className="relative">
                  <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${p.current ? 'bg-cardinal' : 'bg-neutral-300'}`} />
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${p.current ? 'text-cardinal' : 'text-neutral-400'}`}>{p.tag}</span>
                  <div className="text-[15px] font-semibold">{p.title}</div>
                  <p className="text-[13px] leading-relaxed text-neutral-600">{p.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="mb-4 font-display text-[19px] font-bold">Connecting to the USC interactive map</h3>
            <ul className="space-y-4">
              <Item icon={<MapIcon className="h-4 w-4" />} title="One building key">
                Use the three-letter codes from maps.usc.edu (THH, SGM, TCC) as the shared ID. Building cards on the
                current map get a "View floors in 3D" link that opens this view.
              </Item>
              <Item icon={<Layers className="h-4 w-4" />} title="Shared coordinates">
                Align floor plans to the campus GIS coordinates and store them in an indoor-map standard like IMDF/GeoJSON.
                Then the outdoor and indoor routes join up at real building entrances.
              </Item>
              <Item icon={<Plug className="h-4 w-4" />} title="Embed, don't replace">
                Ship the 3D viewer as a layer or web component inside the existing map, reusing its search and USC visual
                style so students only learn one tool.
              </Item>
              <Item icon={<Database className="h-4 w-4" />} title="Live data feeds">
                Pull class locations from the student schedule, events from the campus calendar and club platforms, and
                elevator or restroom outages from Facilities so routes stay accurate.
              </Item>
            </ul>
          </section>

          <section>
            <h3 className="mb-4 font-display text-[19px] font-bold">How AI can use the floor plans</h3>
            <ul className="space-y-4">
              <Item icon={<ScanLine className="h-4 w-4" />} title="Turn floor plans into data">
                The Musick Law Building in this mockup was traced by hand from Gould's PDF building map. Next, vision
                models would read CAD or PDF plans and pull out rooms, doors, corridors, stairs and elevators. Staff review
                the result, and it becomes the same routing graph.
              </Item>
              <Item icon={<Bot className="h-4 w-4" />} title="Plain-language directions">
                A chat assistant turns "I'm at X, how do I get to Y?" into a start, a destination and any limits ("no
                stairs"). It then calls the routing engine, so every answer is a real path drawn on the 3D map.
              </Item>
              <Item icon={<Network className="h-4 w-4" />} title="Landmark-based steps">
                Tagged landmarks in the plans (lounges, murals, vending machines) let the assistant say "past the
                elevators, second door on your left" instead of giving compass directions.
              </Item>
              <Item icon={<ShieldCheck className="h-4 w-4" />} title="Safe and accessible by default">
                Remember a student's step-free preference, reroute around reported outages, and take emergency exit
                guidance only from official plans. Location is never stored.
              </Item>
            </ul>
          </section>
        </div>
      </aside>
    </div>
  )
}
