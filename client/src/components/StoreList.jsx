import { Fragment } from 'react'
import { categoryOf, hasCoords, listOrder, shortAddress, thumbUrl } from '../data/stores.js'
import CategoryDot from './CategoryDot.jsx'

// 01 지도 탭 오른쪽 패널의 가게 목록 (분류 필터가 적용된 목록을 받는다)
export default function StoreList({ stores, onSelect }) {
  const ordered = listOrder(stores)
  const firstAnnex = ordered.find((s) => s.annex)

  if (!ordered.length) return <p className="px-4 py-12 text-center text-sm text-pencil">이 분류에 해당하는 기록이 없다.</p>

  return (
    <ol>
      {ordered.map((s) => (
        <Fragment key={s.id}>
          {s === firstAnnex && (
            <li aria-hidden className="border-b border-t border-ink px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-pencil lg:px-6">
              별관 ANNEX
            </li>
          )}
          <li className="border-b border-line">
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              className="group flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-card lg:px-6"
            >
              <img src={thumbUrl(s)} alt="" loading="lazy" className="aspect-[4/5] w-12 shrink-0 bg-line object-cover" />
              <span className="w-6 shrink-0 font-mono text-xs">{s.id}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-serif text-base font-bold group-hover:text-accent">{s.name}</span>
                <span className="flex items-center gap-1.5 truncate text-xs text-pencil">
                  <CategoryDot color={categoryOf(s)?.color} />
                  <span className="truncate">
                    {s.type}
                    {s.annex && ` · ${shortAddress(s)}`}
                    {!hasCoords(s) && ' · 위치 미정'}
                  </span>
                </span>
              </span>
              <span aria-hidden className="text-pencil">→</span>
            </button>
          </li>
        </Fragment>
      ))}
    </ol>
  )
}
