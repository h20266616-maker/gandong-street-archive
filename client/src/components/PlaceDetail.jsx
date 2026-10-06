import { useRef, useState } from 'react'
import { directionsUrl } from '../data/places.js'

const cell = 'flex h-12 min-w-0 items-center justify-center px-2 text-sm font-semibold active:bg-black active:text-white hover:bg-black hover:text-white'

// 시트 상세 상태
export default function PlaceDetail({ place, prev, next, onBack, onGo, onAllPhotos, onOpenPhoto, allPhotosRef }) {
  const n = place.photos.length
  const [index, setIndex] = useState(0)
  const trackRef = useRef(null)

  // 가로 스와이프 캐러셀: 스크롤 위치로 지금 사진 번호를 계산
  const onScroll = () => {
    const el = trackRef.current
    const first = el?.firstElementChild
    if (!first) return
    const step = first.getBoundingClientRect().width + 8
    setIndex(Math.min(n - 1, Math.max(0, Math.round(el.scrollLeft / step))))
  }

  return (
    <article>
      <header className="px-4 pb-4 pt-1">
        <p className="text-sm text-[#888]">{place.label}</p>
        <h2 className="mt-0.5 text-[26px] font-bold leading-tight break-keep">{place.name}</h2>
        <p className="mt-1 text-sm text-[#333]">{place.sub}</p>
        {place.distanceNote && <p className="text-sm text-[#333]">{place.distanceNote}</p>}
        {place.memo && <p className="mt-2 text-sm leading-relaxed break-keep">{place.memo}</p>}
      </header>

      <div className="grid grid-cols-3 border-y border-black">
        <button type="button" onClick={onBack} className={cell}>
          ← 목록
        </button>
        <a href={directionsUrl(place)} target="_blank" rel="noopener noreferrer" className={`${cell} border-x border-black`}>
          길찾기
        </a>
        <button type="button" onClick={onAllPhotos} disabled={!n} className={`${cell} disabled:text-[#888] disabled:hover:bg-white`}>
          {n ? `사진 ${n}장` : '사진 없음'}
        </button>
      </div>

      {n ? (
        <>
          <div
            ref={trackRef}
            onScroll={onScroll}
            className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-4 px-4"
            style={{ overscrollBehaviorX: 'contain' }}
          >
            {place.photos.map((src, i) => (
              <button key={src} type="button" onClick={() => onOpenPhoto(i)} className="w-[82%] shrink-0 snap-start border border-black" aria-label={`사진 ${i + 1} 크게 보기`}>
                <img src={src} alt={`${place.name} ${i + 1}`} loading={i < 2 ? 'eager' : 'lazy'} draggable={false} className="block aspect-[4/3] w-full object-cover" />
              </button>
            ))}
            <span className="w-2 shrink-0" aria-hidden />
          </div>
          <div className="mt-2 flex items-center gap-3 px-4">
            <span className="text-xs text-[#888]">
              {index + 1} / {n}
            </span>
            <span className="flex gap-1" aria-hidden>
              {place.photos.map((src, i) => (
                <span key={src} className={`block h-1.5 w-1.5 ${i === index ? 'bg-black' : 'bg-[#ccc]'}`} />
              ))}
            </span>
          </div>
        </>
      ) : (
        <div className="mx-4 mt-4 flex aspect-[4/3] items-center justify-center border border-[#ccc] text-sm text-[#888]">사진 준비 중</div>
      )}

      {prev && next && (
        <nav aria-label="다른 장소" className="mt-5 grid grid-cols-2 border-y border-black">
          <button type="button" onClick={() => onGo(prev.id)} className="flex h-14 min-w-0 flex-col justify-center px-4 text-left hover:bg-black hover:text-white active:bg-black active:text-white">
            <span className="text-[11px]">이전</span>
            <span className="truncate text-sm font-semibold">
              {prev.id} {prev.name}
            </span>
          </button>
          <button type="button" onClick={() => onGo(next.id)} className="flex h-14 min-w-0 flex-col justify-center border-l border-black px-4 text-right hover:bg-black hover:text-white active:bg-black active:text-white">
            <span className="text-[11px]">다음</span>
            <span className="truncate text-sm font-semibold">
              {next.id} {next.name}
            </span>
          </button>
        </nav>
      )}

      {n > 0 && (
        <section ref={allPhotosRef} className="px-4 pb-8 pt-6">
          <h3 className="mb-3 text-xs text-[#888]">전체 사진</h3>
          {place.photos.map((src, i) => (
            <button key={src} type="button" onClick={() => onOpenPhoto(i)} className="mb-3 block w-full" aria-label={`사진 ${i + 1} 크게 보기`}>
              <img src={src} alt={`${place.name} ${i + 1}`} loading="lazy" className="block h-auto w-full" />
            </button>
          ))}
        </section>
      )}
      {!n && <div className="h-8" />}
    </article>
  )
}
