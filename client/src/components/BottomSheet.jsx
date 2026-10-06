import { useEffect, useRef, useState } from 'react'

// peek·half는 화면 높이 비율, full은 위쪽 바·탭을 가리지 않게 100dvh − 116px
const ORDER = ['peek', 'half', 'full']
const TOP_RESERVED = 116
const heightOf = (snap, vh) => (snap === 'full' ? vh - TOP_RESERVED : Math.round(vh * (snap === 'half' ? 0.52 : 0.36)))

function useViewportHeight() {
  const [h, setH] = useState(() => window.visualViewport?.height ?? window.innerHeight)
  useEffect(() => {
    const vv = window.visualViewport
    const on = () => setH(vv?.height ?? window.innerHeight)
    window.addEventListener('resize', on)
    vv?.addEventListener('resize', on)
    return () => {
      window.removeEventListener('resize', on)
      vv?.removeEventListener('resize', on)
    }
  }, [])
  return h
}

// 모바일: 화면 아래 3단계 시트 (손잡이를 끌거나 탭). 데스크톱: 왼쪽 420px 패널
// onHeight로 지금 높이(px)를 알려서 지도 여백·떠 있는 버튼이 따라오게 한다
export default function BottomSheet({ snap, onSnap, desktop, onHeight, scrollRef, children }) {
  const vh = useViewportHeight()
  const [drag, setDrag] = useState(null) // { startY, startH, h, moved }
  const height = drag ? drag.h : heightOf(snap, vh)

  useEffect(() => {
    if (!desktop) onHeight(height)
  }, [height, desktop, onHeight])

  const onDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ startY: e.clientY, startH: height, h: height, moved: false })
  }
  const onMove = (e) => {
    if (!drag) return
    const dy = drag.startY - e.clientY
    const h = Math.min(vh - TOP_RESERVED, Math.max(vh * 0.2, drag.startH + dy))
    setDrag({ ...drag, h, moved: drag.moved || Math.abs(dy) > 6 })
  }
  const onUp = () => {
    if (!drag) return
    if (!drag.moved) {
      // 탭: 한 단계 위로, 맨 위면 맨 아래로
      onSnap(ORDER[(ORDER.indexOf(snap) + 1) % ORDER.length])
    } else {
      const nearest = ORDER.reduce((a, b) => (Math.abs(heightOf(b, vh) - drag.h) < Math.abs(heightOf(a, vh) - drag.h) ? b : a))
      onSnap(nearest)
    }
    setDrag(null)
  }

  if (desktop) {
    return (
      <aside className="fixed bottom-3 left-3 top-[118px] z-30 flex w-[420px] flex-col border border-black bg-white">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </aside>
    )
  }

  return (
    <section
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col border-t border-black bg-white"
      style={{ height, transition: drag ? 'none' : 'height .25s ease-out', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        role="slider"
        aria-label="목록 높이"
        aria-valuetext={snap}
        tabIndex={0}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => setDrag(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') onSnap(ORDER[Math.min(2, ORDER.indexOf(snap) + 1)])
          if (e.key === 'ArrowDown') onSnap(ORDER[Math.max(0, ORDER.indexOf(snap) - 1)])
        }}
        className="flex h-11 shrink-0 cursor-grab items-center justify-center"
        style={{ touchAction: 'none' }}
      >
        <span className="block h-1 w-10 bg-black" />
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </section>
  )
}
