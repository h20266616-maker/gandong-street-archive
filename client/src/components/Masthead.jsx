import { site } from '../data/site.js'

export function Topbar() {
  return (
    <div className="border-b border-ink">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-2.5 font-mono text-[11px] tracking-wide md:px-8">
        <span className="truncate">{site.topbarLeft}</span>
        <span className="hidden shrink-0 sm:inline">{site.topbarRight}</span>
      </div>
    </div>
  )
}

export function Masthead({ stores }) {
  const photos = stores.reduce((n, s) => n + s.photoCount, 0)
  const rows = [...site.colophon, ['소장', `${stores.length}건 · ${photos}점`], ['매체', site.medium]]

  return (
    <header className="border-b border-ink">
      <div className="mx-auto grid max-w-[1320px] gap-8 px-4 pb-8 pt-8 md:px-8 md:pb-12 md:pt-12 lg:grid-cols-[1fr_380px] lg:gap-16">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-medium tracking-wider text-accent">{site.label}</p>
          <h1 className="mt-4 font-serif text-[2rem] font-bold leading-[1.2] tracking-[-0.02em] break-keep md:text-5xl">{site.title}</h1>
          <p className="mt-3 font-mono text-[11px] tracking-wider text-pencil md:text-xs">{site.titleEn}</p>
          <p className="mt-6 max-w-[36em] text-sm leading-relaxed break-keep">{site.intro}</p>
        </div>

        <dl className="self-end border-t border-ink text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[5.5rem_1fr] border-b border-line py-2.5">
              <dt className="font-mono text-[11px] uppercase tracking-wider text-pencil">{k}</dt>
              <dd className={k === '소장' ? 'font-mono' : ''}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  )
}
