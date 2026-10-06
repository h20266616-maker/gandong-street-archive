import { Fragment } from 'react'
import { listOrder } from '../data/stores.js'

// 오른쪽 패널 기본 상태: 가게 목록. 행과 지도 핀은 hover가 서로 연동된다
export default function StoreList({ stores, hoverId, onHover, onSelect }) {
  const ordered = listOrder(stores)
  const firstAnnex = ordered.find((s) => s.annex)

  return (
    <ol>
      {ordered.map((s) => {
        const on = s.id === hoverId
        return (
          <Fragment key={s.id}>
            {s === firstAnnex && (
              <li aria-hidden className="border-b border-black px-4 pb-2 pt-6 text-xs text-[#888] desk:px-5">
                상점가 밖
              </li>
            )}
            <li className="border-b border-black">
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                onMouseEnter={() => onHover(s.id, 'list')}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(s.id, 'list')}
                onBlur={() => onHover(null)}
                className={`group flex w-full items-center gap-4 px-4 py-3.5 text-left desk:px-5 ${on ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}`}
              >
                <span className="w-6 shrink-0 text-xs">{s.id}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-semibold leading-snug">{s.name}</span>
                  <span className={`block truncate text-xs ${on ? 'text-[#ccc]' : 'text-[#888] group-hover:text-[#ccc]'}`}>{s.type}</span>
                </span>
                <span className="shrink-0 text-xs">사진 {s.photoCount}</span>
              </button>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}
