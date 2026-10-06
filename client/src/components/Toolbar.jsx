import { categories } from '../data/stores.js'
import CategoryDot from './CategoryDot.jsx'

const TABS = [
  ['map', '01 지도'],
  ['index', '02 목록'],
  ['sheet', '03 전체 사진'],
]

export default function Toolbar({ view, cat, onView, onCat }) {
  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-4 py-4 md:px-8 lg:flex-row lg:items-center lg:justify-between">
      <div role="tablist" aria-label="보기" className="flex w-full border border-ink sm:w-auto">
        {TABS.map(([key, label], i) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={view === key}
            onClick={() => onView(key)}
            className={`flex-1 whitespace-nowrap px-3 py-2 font-mono text-xs sm:flex-none sm:px-4 ${i ? 'border-l border-ink' : ''} ${
              view === key ? 'bg-ink text-white' : 'bg-card hover:bg-paper'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5" aria-label="분류 필터">
        {[{ key: 'all', label: '전체' }, ...categories].map((c) => {
          const on = cat === c.key
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={on}
              onClick={() => onCat(c.key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                on ? 'border-ink bg-ink text-white' : 'border-line bg-card hover:border-ink'
              }`}
            >
              {c.color && <CategoryDot color={c.color} />}
              {c.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
