import { useEffect, useRef, useState } from 'react'
import { directionsUrl } from '../data/places.js'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 장소 상세: 아래에서 올라오는 전체 화면 (760px 이상은 오른쪽 440px 패널).
// 맨 위에서 아래로 90px 이상 끌면 닫힌다
export default function PlaceSheet({ place, index, total, prev, next, open, onClose, onGo, onOpenPhoto }) {
  const scrollRef = useRef(null)
  const trackRef = useRef(null)
  const [photo, setPhoto] = useState(0)
  const [dragY, setDragY] = useState(0)
  const drag = useRef(null)

  // 다른 장소로 바뀌면 맨 위·첫 사진으로
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
    trackRef.current?.scrollTo({ left: 0 })
    setPhoto(0)
  }, [place?.id])

  if (!place) return null
  const n = place.photos.length

  const onTrackScroll = () => {
    const t = trackRef.current
    if (t) setPhoto(Math.min(n - 1, Math.max(0, Math.round(t.scrollLeft / t.clientWidth))))
  }

  // 아래로 끌어 닫기: 맨 위에 있을 때만
  const onTouchStart = (e) => {
    drag.current = scrollRef.current.scrollTop <= 0 ? { y: e.touches[0].clientY, x: e.touches[0].clientX, dir: null } : null
  }
  const onTouchMove = (e) => {
    const d = drag.current
    if (!d) return
    const dy = e.touches[0].clientY - d.y
    const dx = e.touches[0].clientX - d.x
    if (!d.dir) d.dir = Math.abs(dy) > Math.abs(dx) + 4 ? 'y' : Math.abs(dx) > 8 ? 'x' : null
    if (d.dir === 'y' && dy > 0 && scrollRef.current.scrollTop <= 0) setDragY(dy)
  }
  const onTouchEnd = () => {
    if (dragY > 90) onClose()
    setDragY(0)
    drag.current = null
  }

  const btn = 'flex h-12 min-w-12 items-center justify-center px-3 text-[15px] font-semibold'

  return (
    <article
      ref={scrollRef}
      aria-label={`${place.name} 상세`}
      aria-hidden={!open}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="fixed inset-0 z-[70] overflow-y-auto overflow-x-hidden bg-white desk:left-auto desk:w-[440px] desk:border-l desk:border-black"
      style={{
        overscrollBehavior: 'contain',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
        transform: open ? `translateY(${dragY}px)` : 'translateY(100%)',
        transition: dragY ? 'none' : reducedMotion() ? 'none' : 'transform .32s cubic-bezier(.2,.8,.2,1)',
        visibility: open ? 'visible' : 'hidden',
      }}
    >
      <div className="sticky top-0 z-10 flex items-end justify-between border-b border-black bg-white px-1" style={{ height: 'calc(52px + env(safe-area-inset-top))', paddingTop: 'env(safe-area-inset-top)' }}>
        <button type="button" onClick={onClose} className={btn}>
          ← 지도
        </button>
        <span className="mb-[15px] text-[13px] text-[#888]">
          {index + 1} / {total}
        </span>
        <button type="button" onClick={onClose} aria-label="닫기" className={btn}>
          ✕
        </button>
      </div>

      {n ? (
        <>
          <div ref={trackRef} onScroll={onTrackScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto" style={{ overscrollBehaviorX: 'contain' }}>
            {place.photos.map((src, i) => (
              <button key={src} type="button" onClick={() => onOpenPhoto(i)} className="w-full shrink-0 snap-center" aria-label={`사진 ${i + 1} 크게 보기`}>
                <img src={src} alt={`${place.name} ${i + 1}`} loading={i < 2 ? 'eager' : 'lazy'} draggable={false} className="block aspect-[4/3] w-full bg-[#f5f5f5] object-cover" />
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between px-5 pt-2 text-xs text-[#888]">
            <span>
              {photo + 1} / {n}
            </span>
            <span className="flex gap-[5px]" aria-hidden>
              {place.photos.map((src, i) => (
                <i key={src} className={`block h-1.5 w-1.5 border border-black ${i === photo ? 'bg-black' : ''}`} />
              ))}
            </span>
          </div>
        </>
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center bg-[#f5f5f5] text-sm text-[#888]">사진 준비 중</div>
      )}

      <div className="px-5 pb-[18px] pt-4">
        <p className="text-[13px] text-[#888]">{place.label}</p>
        <h2 className="text-[30px] font-bold leading-tight break-keep">{place.name}</h2>
        <p className="mt-1 text-[15px] text-[#333]">{place.subNoPhotos}</p>
        {place.distanceNote && <p className="text-[15px] text-[#333]">{place.distanceNote}</p>}
        {place.memo && <p className="mt-2 text-[15px] leading-relaxed break-keep">{place.memo}</p>}
      </div>

      <div className="mx-5 grid grid-cols-2 border border-black">
        {place.lat != null && place.lng != null ? (
          <a href={directionsUrl(place)} target="_blank" rel="noopener noreferrer" className="flex h-14 items-center justify-center bg-black text-base font-bold text-white">
            길찾기
          </a>
        ) : (
          <span className="flex h-14 items-center justify-center bg-[#f5f5f5] text-base font-bold text-[#888]">위치 확인 중</span>
        )}
        <button type="button" onClick={onClose} className="flex h-14 items-center justify-center border-l border-black text-base font-bold">
          지도에서 보기
        </button>
      </div>

      {prev && next && (
        <nav aria-label="다른 장소" className="mx-5 mt-3.5 grid grid-cols-2 border border-black">
          <button type="button" onClick={() => onGo(prev.id)} className="h-16 min-w-0 px-3.5 text-left text-[15px] font-semibold">
            <small className="block text-[11px] font-normal text-[#888]">이전</small>
            <span className="block truncate">{prev.name}</span>
          </button>
          <button type="button" onClick={() => onGo(next.id)} className="h-16 min-w-0 border-l border-black px-3.5 text-right text-[15px] font-semibold">
            <small className="block text-[11px] font-normal text-[#888]">다음</small>
            <span className="block truncate">{next.name}</span>
          </button>
        </nav>
      )}

      {n > 0 && (
        <section className="px-5 pt-6">
          <h3 className="mb-2.5 text-[13px] text-[#888]">사진 전체</h3>
          {place.photos.map((src, i) => (
            <button key={src} type="button" onClick={() => onOpenPhoto(i)} className="mb-2.5 block w-full" aria-label={`사진 ${i + 1} 크게 보기`}>
              <img src={src} alt={`${place.name} ${i + 1}`} loading="lazy" className="block h-auto w-full" />
            </button>
          ))}
        </section>
      )}
    </article>
  )
}
