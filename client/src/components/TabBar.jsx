import { TABS } from '../data/places.js'

// 22px 선 아이콘
const ICONS = {
  tt: (
    <>
      <rect x="4" y="5" width="16" height="15" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  map: (
    <>
      <path d="M12 21s-6-6.2-6-11a6 6 0 0 1 12 0c0 4.8-6 11-6 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </>
  ),
  shop: <path d="M4 9l1.5-5h13L20 9M4 9h16v11H4zM9 20v-6h6v6" />,
  notice: (
    <>
      <path d="M4 9v6h3l7 4V5L7 9z" />
      <path d="M17 9.5a3.5 3.5 0 0 1 0 5" />
    </>
  ),
  call: <path d="M6 3h4l1.5 4.5-2.5 1.5a11 11 0 0 0 6 6l1.5-2.5L21 14v4a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2z" />,
}

// 화면 아래 탭바: 높이 60 + 홈 인디케이터 자리, 5등분
// dot: 탭 키 → 아이콘 오른쪽 위 작은 검은 점 (고정 공지가 있으면 공지 탭에)
export default function TabBar({ tab, onTab, dot = {} }) {
  return (
    <nav
      aria-label="탭"
      className="fixed inset-x-0 bottom-0 z-[60] grid grid-cols-5 border-t border-black bg-white"
      style={{ height: 'calc(60px + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map((t) => {
        const on = tab === t.key
        return (
          <button
            key={t.key}
            type="button"
            aria-current={on ? 'page' : undefined}
            onClick={() => onTab(t.key)}
            className={`relative flex flex-col items-center justify-center gap-[3px] text-[11px] ${on ? 'font-bold text-black' : 'text-[#888]'}`}
          >
            {on && <span aria-hidden className="absolute -top-px left-[22%] right-[22%] h-[3px] bg-black" />}
            <span className="relative">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={on ? '#000' : '#888'} strokeWidth={on ? 2 : 1.6} aria-hidden>
                {ICONS[t.key]}
              </svg>
              {dot[t.key] && <span aria-label="새 공지" className="absolute -right-1 -top-0.5 block h-1.5 w-1.5 rounded-full bg-black" />}
            </span>
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}
