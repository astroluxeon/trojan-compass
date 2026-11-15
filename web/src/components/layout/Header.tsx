import Image from 'next/image'

export function Header({ campusHref = 'http://localhost:3001/' }: { campusHref?: string }) {
  return (
    <header className="compass-header relative z-40 shrink-0 bg-cardinal text-white">
      <a href={campusHref} className="flex h-16 w-fit items-center gap-4 px-4 md:px-6" aria-label="Trojan Compass campus map">
        <Image src="/images/trojan-compass.png" alt="" width={48} height={48} priority className="h-12 w-12 rounded-lg" />
        <span aria-hidden="true" className="h-7 w-px bg-white/30" />
        <span className="font-display text-lg font-semibold tracking-tight text-gold">Trojan Compass</span>
      </a>
    </header>
  )
}
