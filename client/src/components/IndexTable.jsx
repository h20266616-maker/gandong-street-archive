import { Fragment } from 'react'
import { categoryOf, countLabel, listOrder, shortAddress, thumbUrl } from '../data/stores.js'
import CategoryDot from './CategoryDot.jsx'

// 모바일: 소장번호 | 상호 | 점수, md 이상: 전체 열
const GRID = 'grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-x-4 md:grid-cols-[8.5rem_3.5rem_1.2fr_8rem_1.4fr_3rem]'

export default function IndexTable({ stores, onOpen }) {
  const ordered = listOrder(stores)
  const firstAnnex = ordered.find((s) => s.annex)

  if (!ordered.length) return <p className="py-16 text-center text-sm text-pencil">이 분류에 해당하는 기록이 없다.</p>

  return (
    <div className="border-y border-ink">
      <div className={`${GRID} border-b border-ink py-2.5 font-mono text-[11px] uppercase tracking-wider text-pencil`}>
        <span>소장번호</span>
        <span className="hidden md:block">썸네일</span>
        <span>상호</span>
        <span className="hidden md:block">분류</span>
        <span className="hidden md:block">주소</span>
        <span className="text-right">점수</span>
      </div>

      {ordered.map((s) => {
        const c = categoryOf(s)
        return (
          <Fragment key={s.id}>
            {s === firstAnnex && (
              <div className="border-b border-ink py-2 font-mono text-[11px] uppercase tracking-widest text-pencil">별관 ANNEX</div>
            )}
            <button
              type="button"
              onClick={() => onOpen(s)}
              className={`${GRID} group w-full border-b border-line py-3 text-left last:border-b-0 hover:bg-card`}
            >
              <span className="font-mono text-xs">{s.acc}</span>
              <img src={thumbUrl(s)} alt="" loading="lazy" className="hidden aspect-[4/5] w-12 bg-line object-cover md:block" />
              <span className="min-w-0 truncate font-serif text-base font-bold group-hover:text-accent">{s.name}</span>
              <span className="hidden items-center gap-2 text-xs md:flex">
                <CategoryDot color={c?.color} />
                {c?.label}
              </span>
              <span className="hidden truncate text-xs text-pencil md:block">{shortAddress(s)}</span>
              <span className="text-right font-mono text-xs">{countLabel(s.photoCount)}</span>
            </button>
          </Fragment>
        )
      })}
    </div>
  )
}
