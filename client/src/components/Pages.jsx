import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { timetable } from '../data/timetable.js'
import { notices } from '../data/notice.js'
import { contacts, emergency, smsHref, telHref } from '../data/contacts.js'

const WEEK = '일월화수목금토'
const parseDate = (d) => d.split('-').map(Number)
const dayLabel = (d) => {
  const [y, m, dd] = parseDate(d.date)
  return `${d.day}일차 · ${m}월 ${dd}일 (${WEEK[new Date(y, m - 1, dd).getDay()]})`
}
const shortDate = (d) => {
  const [, m, dd] = parseDate(d)
  return `${m}.${dd}`
}
const today = () => {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}
const toMin = (t) => (/^\d{1,2}:\d{2}$/.test(t) ? Number(t.split(':')[0]) * 60 + Number(t.split(':')[1]) : null)

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

// 타임테이블. MT 당일에는 지금 시각에 해당하는 일정을 반전한다
export function Timetable({ onShowPlace }) {
  const [now, setNow] = useState(() => new Date())
  const [headH, setHeadH] = useState(86)
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const todayStr = today()
  const range = `${shortDate(timetable[0].date)} – ${shortDate(timetable.at(-1).date)}`

  return (
    <Page kicker={range} title="타임테이블" onHeadHeight={setHeadH}>
      {timetable.map((d) => {
        let current = -1
        if (d.date === todayStr) d.items.forEach((it, i) => toMin(it.time) != null && toMin(it.time) <= nowMin && (current = i))
        return (
          <section key={d.date} className="pb-2">
            <h3 className="sticky z-10 border-b border-black bg-white px-5 pb-2 pt-[18px] text-[13px] font-bold" style={{ top: headH }}>
              {dayLabel(d)}
            </h3>
            <ol>
              {d.items.map((it, i) => {
                const on = i === current
                return (
                  <li key={i} className={`grid min-h-[68px] grid-cols-[58px_1fr_auto] items-center gap-3 border-b border-[#e5e5e5] px-5 py-3.5 ${on ? 'bg-black text-white' : ''}`}>
                    <span className="text-[15px] font-bold">{it.time}</span>
                    <span className="min-w-0">
                      <span className="block text-[17px] font-semibold leading-snug break-keep">{it.title}</span>
                      <span className={`mt-0.5 block truncate text-[13px] ${on ? 'text-[#ccc]' : 'text-[#888]'}`}>{it.where}</span>
                    </span>
                    {it.place ? (
                      <button type="button" onClick={() => onShowPlace(it.place)} aria-label={`${it.where} 지도에서 보기`} className="flex h-11 items-center">
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
        )
      })}
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
