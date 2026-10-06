import { useEffect, useState } from 'react'
import { timetable } from '../data/timetable.js'
import { notices } from '../data/notice.js'
import { contacts, emergency, smsHref, telHref } from '../data/contacts.js'

const WEEK = '일월화수목금토'
const dayLabel = (d) => {
  const [y, m, dd] = d.date.split('-').map(Number)
  const w = WEEK[new Date(y, m - 1, dd).getDay()]
  return `${d.day}일차 · ${m}월 ${dd}일 (${w})`
}
const today = () => {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}
const toMin = (t) => (/^\d{1,2}:\d{2}$/.test(t) ? Number(t.split(':')[0]) * 60 + Number(t.split(':')[1]) : null)

function PageHead({ title, aside }) {
  return (
    <div className="flex items-baseline justify-between px-4 pb-3 pt-1">
      <h2 className="text-base font-bold">{title}</h2>
      {aside && <span className="text-xs text-[#888]">{aside}</span>}
    </div>
  )
}

// 타임테이블. MT 당일에는 지금 시각에 해당하는 일정을 반전한다
export function Timetable({ onShowPlace }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const todayStr = today()

  return (
    <div className="pb-8">
      <PageHead title="타임테이블" />
      {timetable.map((d) => {
        // 오늘이면: 시작 시간이 지난 일정 중 마지막 것이 '지금'
        let current = -1
        if (d.date === todayStr) d.items.forEach((it, i) => toMin(it.time) != null && toMin(it.time) <= nowMin && (current = i))
        return (
          <section key={d.date} className="mb-4">
            <h3 className="border-b border-black px-4 pb-1.5 text-xs text-[#888]">{dayLabel(d)}</h3>
            <ol>
              {d.items.map((it, i) => {
                const on = i === current
                return (
                  <li key={i} className={`flex min-h-[64px] items-center gap-3 border-b border-[#ccc] px-4 py-2.5 ${on ? 'bg-black text-white' : ''}`}>
                    <span className="w-12 shrink-0 text-sm font-bold">{it.time}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold leading-snug break-keep">{it.title}</span>
                      <span className={`block truncate text-xs ${on ? 'text-[#ccc]' : 'text-[#888]'}`}>{it.where}</span>
                    </span>
                    {it.place && (
                      <button
                        type="button"
                        onClick={() => onShowPlace(it.place)}
                        aria-label={`${it.where} 지도에서 보기`}
                        className="flex h-11 shrink-0 items-center"
                      >
                        <span className={`flex h-9 items-center border px-2.5 text-[13px] ${on ? 'border-white bg-black text-white' : 'border-black bg-white text-black'}`}>지도</span>
                      </button>
                    )}
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}

// 공지: 고정 항목이 맨 위, 왼쪽에 검은 선
export function Notice() {
  const sorted = [...notices.filter((n) => n.pin), ...notices.filter((n) => !n.pin)]
  return (
    <div className="pb-8">
      <PageHead title="공지" />
      <ul className="border-t border-black">
        {sorted.map((n, i) => (
          <li key={i} className={`border-b border-[#ccc] py-4 pr-4 ${n.pin ? 'border-l-4 border-l-black pl-3' : 'pl-4'}`}>
            <p className="text-[11px] text-[#888]">{n.label}</p>
            <p className="mt-1 text-[15px] leading-[1.55] break-keep">{n.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

// 비상연락망: 누르면 바로 전화·문자
export function Contacts() {
  return (
    <div className="pb-8">
      <PageHead title="비상연락망" aside="누르면 바로 전화" />
      <ul className="border-t border-black">
        {contacts.map((c) => (
          <li key={c.phone} className="border-b border-black">
            <div className="px-4 pb-3 pt-4">
              <p className="text-xs text-[#888]">{c.role}</p>
              <p className="mt-0.5 text-[22px] font-bold leading-tight">{c.name}</p>
              <p className="mt-1 text-base">{c.phone}</p>
            </div>
            <div className="grid grid-cols-2 border-t border-black">
              <a href={telHref(c.phone)} className="flex h-[52px] items-center justify-center bg-black text-[15px] font-semibold text-white">
                전화
              </a>
              <a href={smsHref(c.phone)} className="flex h-[52px] items-center justify-center border-l border-black text-[15px] font-semibold active:bg-black active:text-white">
                문자
              </a>
            </div>
          </li>
        ))}
      </ul>
      <div className="mx-4 mt-6 border border-black px-4 py-2 text-sm">
        긴급 상황:{' '}
        {emergency.map((e, i) => (
          <span key={e.phone}>
            {i > 0 && ' · '}
            <a href={telHref(e.phone)} className="inline-flex min-h-11 min-w-11 items-center justify-center font-bold underline underline-offset-4">
              {e.phone}
            </a>{' '}
            ({e.label})
          </span>
        ))}
      </div>
    </div>
  )
}
