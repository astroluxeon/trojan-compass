import { ChevronDown, ChevronRight, MessageCircle, Route, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { RouteMode } from '../../routing/legacy/routing.generated'
import { SearchPanel } from '@/features/search/components/SearchPanel'
import { RoutePlanner } from '@/features/routing/components/RoutePlanner'
import { ChatPanel, type ChatMessage } from '@/features/chat/components/ChatPanel'
import type { LocationField } from '@/features/routing/types'
export type { LocationField } from '@/features/routing/types'

const TOOLS = [
  { id: 'search', label: 'Search', description: 'Find a building or room', icon: Search },
  { id: 'chat', label: 'Chat', description: 'Ask Compass', icon: MessageCircle },
  { id: 'directions', label: 'Directions', description: 'Plan your way there', icon: Route },
] as const

type Tool = typeof TOOLS[number]['id']

export function FloorTools({ locations, onLocationChange, picking, onPick, onSearch }: {
  locations: Record<LocationField, string>
  onLocationChange: (field: LocationField, value: string) => void
  picking: LocationField | null
  onPick: (field: LocationField | null) => void
  onSearch: (query: string) => boolean
}) {
  const [active, setActive] = useState<Tool | null>(null)
  const [width, setWidth] = useState(336)
  const drag = useRef<{ x: number; width: number } | null>(null)
  const [query, setQuery] = useState('')
  const [travelMode, setTravelMode] = useState<RouteMode>('stairs')
  const [accessibleOnly, setAccessibleOnly] = useState(false)
  const lastPick = useRef<LocationField | null>(null)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Hi, Trojan! I’m Compass. Looking for a room or planning your next stop? Ask me anything about getting around campus.' },
  ])
  const [notice, setNotice] = useState('')
  const menu = useRef<HTMLDetailsElement>(null)
  const sidebar = useRef<HTMLElement>(null)
  const conversation = useRef<HTMLDivElement>(null)
  const tool = TOOLS.find((item) => item.id === active)

  useEffect(() => {
    if (picking) setActive('directions')
  }, [picking])

  useEffect(() => {
    if (active && !picking) {
      sidebar.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(lastPick.current ? `#directions-${lastPick.current}` : 'input, textarea')?.focus()
      lastPick.current = null
    }
  }, [active, picking])

  useEffect(() => {
    if (!picking) return
    const cancel = (event: KeyboardEvent) => { if (event.key === 'Escape') onPick(null) }
    window.addEventListener('keydown', cancel)
    return () => window.removeEventListener('keydown', cancel)
  }, [picking, onPick])

  useEffect(() => {
    conversation.current?.scrollTo({ top: conversation.current.scrollHeight })
  }, [messages, active])

  function selectTool(next: Tool | null) {
    if (active === 'directions' && next !== 'directions') onLocationChange('from', '')
    onPick(null)
    lastPick.current = null
    setActive(next)
  }

  function close() {
    selectTool(null)
    if (menu.current) menu.current.open = false
    menu.current?.querySelector('summary')?.focus()
  }

  return (
    <div style={{ width: active ? width : 0 }} className={`relative order-first z-50 shrink-0 max-w-[calc(100%-16rem)] max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:max-w-[calc(100%-4.75rem)] ${picking ? 'max-md:top-[60%]' : ''}`}>
      <details ref={menu} className={`group absolute bottom-4 left-full z-[60] ml-4 w-56 rounded-xl border border-neutral-200 bg-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.08)] backdrop-blur ${active ? 'max-md:w-11' : 'max-md:w-52'}`}
        onKeyDown={(event) => { if (event.key === 'Escape') close() }}>
        <summary aria-label="Search & tools" className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-[13px] font-bold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cardinal [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2"><Search className="h-4 w-4 shrink-0 text-cardinal" /><span className={active ? 'max-md:hidden' : ''}>Search & tools</span></span>
          <ChevronDown className={`h-4 w-4 -rotate-90 text-neutral-400 transition group-open:rotate-0 ${active ? 'max-md:hidden' : ''}`} />
        </summary>
        <div className={`border-t border-neutral-100 px-1.5 pb-2 pt-1 ${active ? 'max-md:absolute max-md:bottom-full max-md:right-0 max-md:mb-2 max-md:w-52 max-md:rounded-xl max-md:border max-md:border-neutral-200 max-md:bg-white max-md:shadow-lg' : ''}`}>
          {TOOLS.map(({ id, label, description, icon: Icon }) => (
            <button key={id} aria-controls="floor-tools-sidebar" aria-expanded={active === id}
              onClick={() => {
                selectTool(id)
                setNotice('')
                if (menu.current) menu.current.open = false
                if (active === id) sidebar.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')?.focus()
              }}
              className={`flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition hover:bg-neutral-50 ${active === id ? 'bg-cardinal-50 text-cardinal' : 'text-neutral-700'}`}>
              <Icon className="h-4 w-4 shrink-0 text-cardinal" />
              <span className="flex-1"><span className="block text-[13px] font-semibold">{label}</span><span className="block text-[11px] text-neutral-500">{description}</span></span>
              <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
            </button>
          ))}
        </div>
      </details>

      {tool && (
        <aside ref={sidebar} id="floor-tools-sidebar" aria-labelledby="floor-tools-title"
          onKeyDown={(event) => { if (event.key === 'Escape') close() }}
          className="absolute inset-0 flex flex-col border-r border-neutral-200 bg-white max-md:shadow-xl">
          <div role="separator" tabIndex={0} aria-label="Resize tools sidebar" aria-orientation="vertical" aria-valuemin={240} aria-valuemax={640} aria-valuenow={width}
            onPointerDown={(event) => {
              if (event.button !== 0) return
              drag.current = { x: event.clientX, width: sidebar.current?.offsetWidth ?? width }
              event.currentTarget.setPointerCapture(event.pointerId)
              event.preventDefault()
            }}
            onPointerMove={(event) => {
              if (drag.current) setWidth(Math.max(240, Math.min(640, drag.current.width + event.clientX - drag.current.x)))
            }}
            onPointerUp={(event) => {
              drag.current = null
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
            }}
            onLostPointerCapture={() => { drag.current = null }}
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
              event.preventDefault()
              setWidth((current) => event.key === 'Home' ? 240 : event.key === 'End' ? 640 : Math.max(240, Math.min(640, current + (event.key === 'ArrowRight' ? 16 : -16))))
            }}
            className="group absolute inset-y-0 -right-1 z-10 flex w-2 cursor-col-resize touch-none select-none items-center justify-center outline-none hover:bg-cardinal/10 focus-visible:bg-cardinal/10">
            <span className="h-10 w-1 rounded-full bg-neutral-300 transition group-hover:bg-cardinal group-focus-visible:bg-cardinal" />
          </div>
          <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-cardinal-50 text-cardinal"><tool.icon className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1"><h2 id="floor-tools-title" className="text-[16px] font-bold">{tool.label}</h2><p className="text-[12px] text-neutral-500">{tool.description}</p></div>
            <button onClick={close} aria-label="Close tools sidebar" className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"><X className="h-4 w-4" /></button>
          </div>
          <div className={active === 'chat' ? 'flex min-h-0 flex-1 flex-col px-5 pb-3 pt-5' : 'min-h-0 flex-1 overflow-y-auto p-5'}>
            {active === 'search' && <SearchPanel query={query} setQuery={setQuery} onSearch={onSearch} setNotice={setNotice} />}
            {active === 'directions' && <RoutePlanner locations={locations} onLocationChange={onLocationChange}
              picking={picking} onPick={onPick} accessibleOnly={accessibleOnly} setAccessibleOnly={setAccessibleOnly}
              travelMode={travelMode} setTravelMode={setTravelMode} lastPick={lastPick} setNotice={setNotice} />}
            {active === 'chat' && <ChatPanel conversation={conversation} messages={messages} setMessages={setMessages} draft={draft} setDraft={setDraft} />}
            {notice && <p role="status" className="mt-4 rounded-lg bg-cardinal-50 p-3 text-[12px] leading-relaxed text-cardinal">{notice}</p>}
          </div>
          {active !== 'chat' && <p className="px-5 pb-4 pt-3 text-[11px] text-neutral-400">Preview · AI and routes aren’t connected yet.</p>}
        </aside>
      )}
    </div>
  )
}
