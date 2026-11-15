import { Send, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from 'react'
import type { Candidate, ChatContext, ChatResponse, MapAction } from '@trojan-compass/shared/api'
import { clientRequestId, compassApi, CompassApiError } from '@/lib/api-client'
import { INPUT } from '@/components/ui/form-styles'

export type ChatMessage = { role: 'assistant' | 'user'; text: string }

export function ChatPanel({ conversation, messages, setMessages, draft, setDraft, context, onActions }: {
  conversation: RefObject<HTMLDivElement | null>
  messages: ChatMessage[]
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>
  draft: string
  setDraft: (value: string) => void
  context: ChatContext
  onActions: (actions: MapAction[], dataVersion: string) => void
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [clarification, setClarification] = useState<ChatResponse['clarification']>(null)
  const activeRequest = useRef<AbortController | null>(null)
  const sequence = useRef(0)
  const dataVersion = useRef<string | null>(null)
  const contextKey = JSON.stringify(context)
  useEffect(() => {
    sequence.current++; activeRequest.current?.abort(); activeRequest.current = null
    setPending(false); setClarification(null)
    return () => { sequence.current++; activeRequest.current?.abort(); activeRequest.current = null }
  }, [contextKey])

  async function send(text: string, choice?: Candidate) {
    if (!text.trim() || activeRequest.current) return
    const controller = new AbortController(), current = ++sequence.current
    activeRequest.current = controller; setPending(true); setError(''); setClarification(null)
    const history = messages.slice(-20).map(message => ({ role: message.role, content: message.text.slice(0, 4000) }))
    setMessages(previous => [...previous, { role: 'user', text }]); setDraft('')
    try {
      if (!dataVersion.current) dataVersion.current = (await compassApi.building(context.buildingId!, undefined, controller.signal)).dataVersion
      const requestContext = choice?.kind === 'place' ? { ...context, selectedPlace: choice.location } : choice?.kind === 'building' ? { ...context, buildingId: choice.buildingId, floorId: null, selectedPlace: null } : context
      const result = await compassApi.chat({ clientRequestId: clientRequestId(), dataVersion: dataVersion.current, message: text, history, context: requestContext, preferences: { mode: 'fastest', stepFree: false, accessProfile: 'public' } }, controller.signal)
      if (current !== sequence.current || controller.signal.aborted) return
      if (result.status === 'resolved') onActions(result.actions, result.dataVersion)
      setMessages(previous => [...previous, { role: 'assistant', text: result.message }]); setClarification(result.clarification)
    } catch (failure) {
      if (current !== sequence.current || controller.signal.aborted) return
      if (failure instanceof CompassApiError && ['DATA_VERSION_UNAVAILABLE', 'DATA_VERSION_MISMATCH'].includes(failure.code)) dataVersion.current = null
      setError(failure instanceof Error ? failure.message : 'Compass could not complete the request.')
    } finally {
      if (current === sequence.current) { activeRequest.current = null; setPending(false) }
    }
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div ref={conversation} role="log" aria-label="Compass conversation" aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((message, index) => (
          <div key={index} className={`rounded-xl px-3 py-2.5 text-[13px] leading-relaxed ${message.role === 'user' ? 'ml-6 bg-cardinal text-white' : 'mr-3 bg-neutral-100 text-neutral-700'}`}>
            <span className={`mb-1 flex items-center gap-1.5 text-[11px] font-bold ${message.role === 'user' ? 'text-white/70' : 'text-cardinal'}`}>{message.role === 'assistant' && <Sparkles className="h-3 w-3" />}{message.role === 'user' ? 'You' : 'Compass'}</span>
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          </div>
        ))}
      </div>
      {clarification?.candidates.map((candidate, index) => <button key={index} type="button" disabled={pending} className="rounded-lg border border-neutral-200 px-3 py-2 text-left text-sm hover:bg-neutral-50" onClick={() => {
        const previous = messages.findLast(message => message.role === 'user')?.text ?? ''
        const id = candidate.kind === 'building' ? candidate.buildingId : candidate.location.placeId
        void send(`For my previous request: ${previous.slice(0, 2800)}. I choose ${id}.`, candidate)
      }}>{candidate.label}</button>)}
      {pending && <p role="status" className="text-xs text-neutral-500">Finding your location…</p>}
      {error && <p role="alert" className="rounded-lg bg-cardinal-50 p-3 text-xs text-cardinal">{error}</p>}
      <form className="flex shrink-0 items-end gap-2" onSubmit={(event) => {
        event.preventDefault()
        void send(draft.trim())
      }}>
        <label className="min-w-0 flex-1"><span className="sr-only">Message</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
          maxLength={4000} placeholder="Ask Compass…" rows={2} className={`${INPUT} mt-0 resize-none`} /></label>
        <button aria-label="Send message" disabled={!draft.trim() || pending} className="mb-1 rounded-lg bg-cardinal p-3 text-white transition hover:bg-cardinal-dark disabled:opacity-40"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  )
}
