import { Search } from 'lucide-react'
import { LocationAutocomplete } from './LocationAutocomplete'
import { INPUT, ACTION } from '@/components/ui/form-styles'

export function SearchPanel({ query, setQuery, onSearch, setNotice }: {
  query: string
  setQuery: (value: string) => void
  onSearch: (query: string) => boolean
  setNotice: (message: string) => void
}) {
  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault()
      setNotice(onSearch(query) ? '' : 'No matching building or room. Try LAW 101 or THH 201.')
    }}>
      <p className="text-[13px] leading-relaxed text-neutral-500">Find your next class, meeting, or study spot.</p>
      <div>
        <label htmlFor="room-search" className="block text-[12px] font-semibold text-neutral-700">Building and room code</label>
        <LocationAutocomplete id="room-search" value={query} onChange={(value) => { setQuery(value); setNotice('') }} placeholder="e.g. LAW 101" required className={INPUT} />
      </div>
      <button className={ACTION}><Search className="h-4 w-4" /> Search rooms</button>
    </form>
  )
}
