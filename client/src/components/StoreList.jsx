import { Fragment } from 'react'
import { site } from '../data/site.js'
import { hasCoords, listOrder, thumbUrl } from '../data/stores.js'

// 별관 주소 줄: "유촌리 1043-4 · 약 3km"
const annexLine = (s) => [s.address.replace(/^간동면\s*/, ''), s.distanceNote?.match(/약 .+$/)?.[0]].filter(Boolean).join(' · ')

export default function StoreList({ stores, onSelect }) {
  const ordered = listOrder(stores)
  const firstAnnex = ordered.find((s) => s.annex)

  return (
    <div>
      <header className="border-b border-black px-4 pb-6 pt-8 lg:px-8 lg:pb-8 lg:pt-12">
        <p className="mb-3 text-xs font-medium tracking-wide text-[#888]">{site.meta}</p>
        <h1 className="text-[2rem] font-extrabold leading-[1.1] tracking-[-0.04em] lg:text-5xl">{site.title}</h1>
        <p className="mt-2 text-base font-semibold tracking-[-0.02em] text-[#222] lg:text-lg">{site.subtitle}</p>
        <p className="mt-5 max-w-[34em] text-sm leading-relaxed text-[#222]">{site.intro}</p>
      </header>

      <ol>
        {ordered.map((s) => (
          <Fragment key={s.id}>
            {s === firstAnnex && (
              <li aria-hidden className="border-b border-t border-[#ccc] bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-[#888] lg:px-8">
                별관 ANNEX
              </li>
            )}
            <li className="border-b border-[#ccc]">
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-[#eee] lg:px-8"
              >
                <img src={thumbUrl(s)} alt="" loading="lazy" className="aspect-[4/5] w-14 shrink-0 bg-[#eee] object-cover" />
                <span className="w-7 shrink-0 text-sm font-bold tabular-nums">{s.id}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold tracking-[-0.02em]">{s.name}</span>
                  <span className="block truncate text-xs text-[#888]">
                    {s.category}
                    {s.annex && ` · ${annexLine(s)}`}
                    {!hasCoords(s) && ' · 위치 미정'}
                  </span>
                </span>
                <span aria-hidden className="text-[#888]">→</span>
              </button>
            </li>
          </Fragment>
        ))}
      </ol>

      <footer className="px-4 py-6 text-xs tabular-nums text-[#888] lg:px-8">
        {stores.length}곳 · 사진 {stores.reduce((n, s) => n + s.photoCount, 0)}장 · {site.collectedAt}
      </footer>
    </div>
  )
}
