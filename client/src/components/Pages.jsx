import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { timetable } from '../data/timetable.js'
import { notices } from '../data/notice.js'
import { contacts, emergency, smsHref, telHref } from '../data/contacts.js'

// 탭바 위를 채우는 페이지. 안쪽만 스크롤된다. 머리는 스크롤해도 위에 붙어 있다
function Page({ kicker, title, children, onHeadHeight }) {
  const headRef = useRef(null)
  useLayoutEffect(() => {
    if (!onHeadHeight || !headRef.current) return undefined
    const ro = new ResizeObserver(() => onHeadHeight(headRef.current.offsetHeight))
    ro.observe(headRef.current)
    return () => ro.disconnect()
  }, [onHeadHeight])
  return (
    <section
      className="fixed inset-x-0 top-0 z-40 overflow-y-auto overflow-x-hidden bg-white"
      style={{ bottom: 'calc(60px + env(safe-area-inset-bottom))', paddingTop: 'env(safe-area-inset-top)', overscrollBehavior: 'contain' }}
    >
      <div className="mx-auto max-w-[640px]">
        <header ref={headRef} className="sticky top-0 z-20 border-b border-black bg-white px-5 pb-3.5 pt-[22px]">
          <small className="text-xs text-[#888]">{kicker}</small>
          <h2 className="mt-0.5 text-[28px] font-bold leading-[1.15]">{title}</h2>
        </header>
        {children}
      </div>
    </section>
  )
}

// ---------- 타임테이블 ----------
export const TEAMS = [
  { key: 'all', label: '전체' },
  { key: 'street', label: '상점가 거리' },
  { key: 'mosaic', label: '모자이크' },
  { key: 'sign', label: '간판' },
]
const TEAM_KEY = 'gandong-tt-team'
export const readTeam = () => {
  const q = new URLSearchParams(window.location.search).get('team')
  if (TEAMS.some((t) => t.key === q)) return q
  try {
    const saved = localStorage.getItem(TEAM_KEY)
    if (TEAMS.some((t) => t.key === saved)) return saved
  } catch {
    // 저장소를 못 쓰는 환경이면 기본값
  }
  return 'all'
}

// [지도] 버튼은 장소가 확실한 일정에만. 마을회관은 아직 지도에 없어서 달지 않는다
const PLACE_BY_TITLE = {
  '숙소 이동': 'A',
  '체크인·휴식': 'A',
  기상: 'A',
  체크아웃: 'A',
  '현장 스케치': '02',
}
const placeFor = (team, title) => PLACE_BY_TITLE[title] ?? (team === 'all' && title === '활동 시작' ? '02' : null)

// "Day 1 · 10/9(금)" → 2026-10-09, "10/9 (금)"
const MT_YEAR = 2026
const dayDate = (title) => {
  const m = title.match(/(\d{1,2})\/(\d{1,2})\s*\(([^)]+)\)/)
  if (!m) return null
  return { iso: `${MT_YEAR}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`, short: `${m[1]}/${m[2]} (${m[3]})` }
}
const todayIso = (n) => `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
const startMin = (t) => {
  const m = t.match(/^(\d{1,2}):(\d{2})/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}
// "10:00~10:30" → "10:00" / "~10:30" 두 줄
const timeText = (t) => t.replace('~', '\n~')

export function Timetable({ onShowPlace }) {
  const [team, setTeamState] = useState(readTeam)
  const [now, setNow] = useState(() => new Date())
  const [headH, setHeadH] = useState(86)
  const nowRef = useRef(null)
  const scrolled = useRef(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const setTeam = (key) => {
    setTeamState(key)
    try {
      localStorage.setItem(TEAM_KEY, key)
    } catch {
      // 저장 못 해도 화면은 바뀐다
    }
    const q = new URLSearchParams(window.location.search)
    if (key === 'all') q.delete('team')
    else q.set('team', key)
    history.replaceState(history.state, '', `${window.location.pathname}?${q}`)
  }

  const days = timetable[team] ?? timetable.all
  const dates = days.map((d) => dayDate(d.title))
  const range = dates[0] && dates.at(-1) ? `${dates[0].short} – ${dates.at(-1).short}` : ''

  // 지금 일정: MT 당일이면 시작 시각이 지난 가장 마지막 행
  const today = todayIso(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  let current = null
  days.forEach((d, di) => {
    if (dates[di]?.iso !== today) return
    d.items.forEach((it, i) => {
      const s = startMin(it.time)
      if (s != null && s <= nowMin) current = `${di}:${i}`
    })
  })

  // 처음 열 때 지금 일정으로 스크롤
  useEffect(() => {
    if (current && nowRef.current && !scrolled.current) {
      scrolled.current = true
      nowRef.current.scrollIntoView({ block: 'center' })
    }
  }, [current])

  return (
    <Page kicker={range} title="타임테이블" onHeadHeight={setHeadH}>
      <div className="px-5 pt-4">
        <div role="radiogroup" aria-label="팀" className="grid grid-cols-4 border border-black">
          {TEAMS.map((t, i) => (
            <button
              key={t.key}
              type="button"
              role="radio"
              aria-checked={team === t.key}
              onClick={() => setTeam(t.key)}
              className={`h-11 min-w-0 px-1 text-[14px] font-semibold ${i ? 'border-l border-black' : ''} ${team === t.key ? 'bg-black text-white' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {team !== 'all' && (
          <p className="mt-2.5 flex items-center gap-2 text-xs text-[#888]">
            <span aria-hidden className="inline-block h-3.5 w-1 bg-black" />
            표시된 칸은 우리 팀만의 일정이에요
          </p>
        )}
      </div>

      {days.map((d, di) => (
        <section key={d.title} className="pb-2 pt-2">
          <h3 className="sticky z-10 border-b border-black bg-white px-5 pb-2 pt-4 text-[13px] font-bold" style={{ top: headH }}>
            {d.title}
          </h3>
          <ol>
            {d.items.map((it, i) => {
              const on = current === `${di}:${i}`
              const mine = team !== 'all' && it.team
              const place = placeFor(team, it.title)
              return (
                <li
                  key={i}
                  ref={on ? nowRef : undefined}
                  aria-current={on ? 'time' : undefined}
                  className={`grid min-h-[68px] grid-cols-[58px_1fr_auto] items-center gap-3 border-b border-[#e5e5e5] py-3.5 pr-5 ${
                    mine ? 'border-l-4 border-l-black pl-4' : 'pl-5'
                  } ${on ? 'bg-black text-white' : mine ? 'bg-[#f5f5f5]' : ''}`}
                >
                  <span className="whitespace-pre-line text-sm font-bold leading-tight">{timeText(it.time)}</span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[17px] font-semibold leading-snug break-keep">{it.title}</span>
                      {mine && <span className={`border px-1.5 py-px text-[11px] font-semibold leading-tight ${on ? 'border-white' : 'border-black'}`}>우리 팀</span>}
                    </span>
                    {it.note && <span className={`mt-1 block whitespace-pre-line text-sm leading-normal break-keep ${on ? 'text-[#ddd]' : 'text-[#444]'}`}>{it.note}</span>}
                  </span>
                  {place ? (
                    <button type="button" onClick={() => onShowPlace(place)} aria-label={`${it.title} 장소 지도에서 보기`} className="flex h-11 items-center">
                      <span className={`flex h-10 items-center border px-3 text-[13px] font-semibold ${on ? 'border-white' : 'border-black'}`}>지도</span>
                    </button>
                  ) : (
                    <span />
                  )}
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </Page>
  )
}

// 상점가: 2열 사진 그리드 (넓은 화면 3열). 누르면 지도 탭에서 그 장소 상세
export function ShopGrid({ places, onOpen }) {
  const shops = places.filter((p) => p.kind === 'shop')
  const annex = places.filter((p) => p.kind === 'annex')
  const card = (p) => (
    <button key={p.id} type="button" onClick={() => onOpen(p.id)} className="min-w-0 text-left">
      {p.thumb ? (
        <img src={p.thumb} alt="" loading="lazy" className="block aspect-square w-full bg-[#f5f5f5] object-cover" />
      ) : (
        <span className="flex aspect-square w-full items-center justify-center border border-[#ddd] bg-[#f5f5f5] text-xs text-[#888]">사진 준비 중</span>
      )}
      <span className="mt-[7px] block text-[11px] text-[#888]">
        {p.id} · 사진 {p.photos.length}
      </span>
      <span className="block text-base font-bold leading-tight break-keep">{p.name}</span>
      <span className="block truncate text-xs text-[#888]">{p.short}</span>
    </button>
  )
  return (
    <Page kicker={`간척월명로 · ${shops.length + annex.length}곳`} title="상점가 리스트">
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-4 px-5 pb-7 pt-4 desk:grid-cols-3">{shops.map(card)}</div>
      {annex.length > 0 && (
        <>
          <h3 className="px-5 text-[13px] font-bold">상점가 밖</h3>
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-4 px-5 pb-7 pt-3 desk:grid-cols-3">{annex.map(card)}</div>
        </>
      )}
    </Page>
  )
}

// 공지. 없으면 빈 화면
export function Notice() {
  const sorted = [...notices.filter((n) => n.pin), ...notices.filter((n) => !n.pin)]
  return (
    <Page kicker="하얀도화지" title="공지">
      {sorted.length === 0 ? (
        <div className="px-5 py-20 text-center text-[15px] leading-relaxed text-[#888]">
          <b className="mb-1 block text-[17px] text-black">아직 공지가 없어요</b>
          공지가 올라오면 여기에 보여요.
        </div>
      ) : (
        <ul>
          {sorted.map((n, i) => (
            <li key={i} className={`border-b border-[#e5e5e5] py-4 pr-5 ${n.pin ? 'border-l-4 border-l-black pl-4' : 'pl-5'}`}>
              <p className="text-[11px] text-[#888]">{n.label}</p>
              <p className="mt-1 text-[15px] leading-[1.55] break-keep">{n.text}</p>
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}

// 비상연락망: 누르면 바로 전화·문자
export function Contacts() {
  return (
    <Page kicker="누르면 바로 전화" title="비상연락망">
      {contacts.map((c) => (
        <div key={c.phone} className="border-b border-[#e5e5e5] p-5">
          <p className="text-[13px] text-[#888]">{c.role}</p>
          <p className="text-2xl font-bold leading-tight">{c.name}</p>
          <p className="mt-0.5 text-[17px]">{c.phone}</p>
          <div className="mt-3.5 grid grid-cols-[2fr_1fr] border border-black">
            <a href={telHref(c.phone)} className="flex h-14 items-center justify-center bg-black text-base font-bold text-white">
              전화
            </a>
            <a href={smsHref(c.phone)} className="flex h-14 items-center justify-center border-l border-black text-base font-bold">
              문자
            </a>
          </div>
        </div>
      ))}
      <div className="m-5 grid grid-cols-2 border border-black">
        {emergency.map((e, i) => (
          <a key={e.phone} href={telHref(e.phone)} className={`flex h-14 flex-col items-center justify-center text-lg font-bold leading-tight ${i ? 'border-l border-black' : ''}`}>
            {e.phone}
            <small className="text-[11px] font-normal text-[#888]">{e.label}</small>
          </a>
        ))}
      </div>
    </Page>
  )
}
