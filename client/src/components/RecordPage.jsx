import { useEffect, useRef } from 'react'
import { site } from '../data/site.js'
import { categoryOf, countLabel, fullAddress, neighbors, photoUrls } from '../data/stores.js'
import CategoryDot from './CategoryDot.jsx'

export default function RecordPage({ store, photo, siblings, lightboxOpen, onPhoto, onNavigate, onClose, onOpenLightbox }) {
  const photos = photoUrls(store)
  const total = photos.length
  const index = Math.min(Math.max(photo, 0), total - 1)
  const c = categoryOf(store)
  const { prev, next } = neighbors(siblings, store)
  const scrollRef = useRef(null)

  // 기록이 바뀌면 맨 위로
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [store.id])

  // 뒤 페이지가 같이 스크롤되지 않게
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  // ←/→ 사진, ESC 닫기. 라이트박스가 열려 있으면 라이트박스가 먼저 처리한다
  useEffect(() => {
    if (lightboxOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onPhoto((index - 1 + total) % total)
      else if (e.key === 'ArrowRight') onPhoto((index + 1) % total)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, index, total, onPhoto, onClose])

  const rows = [
    ['소장번호', <span className="font-mono">{store.acc}</span>],
    ['업종', store.type],
    ['분류', <span className="inline-flex items-center gap-2"><CategoryDot color={c?.color} />{c?.label}</span>],
    ['주소', fullAddress(store) || '미정'],
    ...(store.annex && store.distanceNote ? [['위치', store.distanceNote]] : []),
    ['수집일', <span className="font-mono">{site.collectedDate}</span>],
    ['매체', `${site.medium} · ${total}점`],
  ]

  return (
    <div ref={scrollRef} role="dialog" aria-modal="true" aria-label={`${store.name} 기록`} className="fixed inset-0 z-[1500] overflow-y-auto overflow-x-hidden bg-paper">
      <div className="sticky top-0 z-10 border-b border-ink bg-paper">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-3 md:px-8">
          <nav aria-label="위치" className="min-w-0 truncate font-mono text-[11px] tracking-wide">
            <span className="text-pencil">아카이브 / {store.annex ? '별관' : c?.label} / </span>
            <span>{store.acc}</span>
          </nav>
          <button type="button" onClick={onClose} className="shrink-0 font-mono text-xs hover:text-accent">
            [닫기 ✕]
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1320px] gap-8 px-4 py-6 md:px-8 md:py-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-14">
        <section className="min-w-0">
          <button
            type="button"
            onClick={() => onOpenLightbox(index)}
            className="flex h-[52vh] w-full items-center justify-center bg-line md:h-[68vh]"
            aria-label="사진 크게 보기"
          >
            <img key={photos[index]} src={photos[index]} alt={`${store.name} ${index + 1}`} className="h-full w-full object-contain" />
          </button>
          {total > 1 && (
            <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {photos.map((src, i) => (
                <li key={src} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => onPhoto(i)}
                    aria-label={`사진 ${i + 1}`}
                    aria-current={i === index}
                    className={`block w-14 md:w-16 ${i === index ? 'outline outline-1 outline-offset-2 outline-ink' : 'opacity-40 hover:opacity-80'}`}
                  >
                    <img src={src} alt="" loading="lazy" className="aspect-[4/5] w-full bg-line object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="min-w-0">
          <p className="font-mono text-xs text-accent">
            {store.acc} · {countLabel(index + 1)} / {countLabel(total)}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold leading-tight break-keep md:text-4xl">{store.name}</h2>

          <dl className="mt-6 border-t border-ink text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[5.5rem_1fr] gap-x-3 border-b border-line py-2.5">
                <dt className="font-mono text-[11px] uppercase tracking-wider text-pencil">{k}</dt>
                <dd className="min-w-0 break-keep">{v}</dd>
              </div>
            ))}
          </dl>

          {store.memo && (
            <div className="mt-8">
              <p className="font-mono text-[11px] uppercase tracking-wider text-pencil">관찰 기록</p>
              <p className="mt-2 border-l-2 border-accent pl-4 text-sm leading-relaxed break-keep">{store.memo}</p>
            </div>
          )}

          {prev && next && (
            <div className="mt-10 grid grid-cols-2 border border-ink text-sm">
              <button type="button" onClick={() => onNavigate(prev)} className="min-w-0 truncate px-3 py-3 text-left hover:bg-card">
                ← <span className="font-mono">{prev.id}</span> {prev.name}
              </button>
              <button type="button" onClick={() => onNavigate(next)} className="min-w-0 truncate border-l border-ink px-3 py-3 text-right hover:bg-card">
                <span className="font-mono">{next.id}</span> {next.name} →
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
