import { forwardRef, useEffect, useRef } from 'react'

// 지도 아래 장소 카드 줄. 가로로 넘기면 맨 앞에 온 카드가 선택되고(지도가 따라감),
// 선택이 바뀌면(핀을 누르는 등) 그 카드로 스크롤한다. 선택된 카드를 한 번 더 누르면 상세
const CardStrip = forwardRef(function CardStrip({ places, selectedId, onSelect, onOpen }, ref) {
  const trackRef = useRef(null)
  const settle = useRef(0)
  // 스크롤이 멈출 때 비교할 지금 선택 (타이머 안에서 옛 값을 보지 않게)
  const selectedRef = useRef(selectedId)
  selectedRef.current = selectedId

  // 선택된 카드로 스크롤 (이미 그 자리면 그대로)
  useEffect(() => {
    const track = trackRef.current
    const el = selectedId && track?.querySelector(`[data-id="${selectedId}"]`)
    if (!el) return
    const target = el.offsetLeft - 12
    if (Math.abs(track.scrollLeft - target) < 4) return
    track.scrollTo({ left: target, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [selectedId, places])

  // 스크롤이 멈추면 맨 앞 카드를 선택. 선택한 카드로 옮겨 간 스크롤이면 이미 선택돼 있어서 아무 일도 없다
  const onScroll = () => {
    clearTimeout(settle.current)
    settle.current = setTimeout(() => {
      const track = trackRef.current
      if (!track) return
      const cards = [...track.children]
      const anchor = track.scrollLeft + 12
      const nearest = cards.reduce((a, b) => (Math.abs(b.offsetLeft - anchor) < Math.abs(a.offsetLeft - anchor) ? b : a), cards[0])
      const id = nearest?.dataset.id
      if (id && id !== selectedRef.current) onSelect(id)
    }, 120)
  }

  return (
    <div ref={ref} className="fixed inset-x-0 z-30" style={{ bottom: 'calc(60px + env(safe-area-inset-bottom))' }}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 pb-3 pt-2.5 desk:px-5"
        style={{ scrollPaddingInline: 12, overscrollBehaviorX: 'contain' }}
      >
        {places.map((p) => {
          const on = p.id === selectedId
          const n = p.photos.length
          return (
            <button
              key={p.id}
              data-id={p.id}
              type="button"
              onClick={() => (on ? onOpen(p.id) : onSelect(p.id))}
              aria-pressed={on}
              className="grid h-[104px] w-[calc(100%-40px)] max-w-[380px] shrink-0 snap-start grid-cols-[104px_1fr] border border-black bg-white text-left desk:w-[340px]"
              style={on ? { outline: '2px solid #000', outlineOffset: -3 } : undefined}
            >
              {p.thumb ? (
                <img src={p.thumb} alt="" loading="lazy" width="102" height="102" className="block h-[102px] w-[102px] object-cover" />
              ) : (
                <span className="flex h-[102px] w-[102px] items-center justify-center bg-[#f5f5f5] text-[11px] text-[#888]">사진 준비 중</span>
              )}
              <span className="flex min-w-0 flex-col px-3 py-2.5">
                <span className="text-[11px] text-[#888]">{p.label}</span>
                <span className="truncate text-lg font-bold leading-snug">{p.name}</span>
                <span className="truncate text-xs text-[#555]">{p.subNoPhotos}</span>
                <span className="mt-auto text-[13px] font-bold">{n ? `사진 ${n}장 보기 →` : '자세히 보기 →'}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
})

export default CardStrip
