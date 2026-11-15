import { Send, Sparkles } from 'lucide-react'
import type { Dispatch, RefObject, SetStateAction } from 'react'
import { INPUT } from '@/components/ui/form-styles'

export type ChatMessage = { role: 'assistant' | 'user'; text: string }

// The existing demo conversation; Eddie's chat API will replace its canned response.
export function ChatPanel({ conversation, messages, setMessages, draft, setDraft }: {
  conversation: RefObject<HTMLDivElement | null>
  messages: ChatMessage[]
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>
  draft: string
  setDraft: (value: string) => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div ref={conversation} role="log" aria-label="Demo conversation" aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((message, index) => (
          <div key={index} className={`rounded-xl px-3 py-2.5 text-[13px] leading-relaxed ${message.role === 'user' ? 'ml-6 bg-cardinal text-white' : 'mr-3 bg-neutral-100 text-neutral-700'}`}>
            <span className={`mb-1 flex items-center gap-1.5 text-[11px] font-bold ${message.role === 'user' ? 'text-white/70' : 'text-cardinal'}`}>{message.role === 'assistant' && <Sparkles className="h-3 w-3" />}{message.role === 'user' ? 'You' : 'Compass'}</span>
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          </div>
        ))}
      </div>
      <form className="flex shrink-0 items-end gap-2" onSubmit={(event) => {
        event.preventDefault()
        if (!draft.trim()) return
        // shortcut: canned replies only, replace when the assistant service is connected.
        setMessages((current) => [...current, { role: 'user', text: draft.trim() }, { role: 'assistant', text: 'Happy to help! This is a demo conversation for now. You can try the Search and Directions panels to enter a room or plan your next stop.' }])
        setDraft('')
      }}>
        <label className="min-w-0 flex-1"><span className="sr-only">Message</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
          placeholder="Ask Compass…" rows={2} className={`${INPUT} mt-0 resize-none`} /></label>
        <button aria-label="Send message" disabled={!draft.trim()} className="mb-1 rounded-lg bg-cardinal p-3 text-white transition hover:bg-cardinal-dark disabled:opacity-40"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  )
}
