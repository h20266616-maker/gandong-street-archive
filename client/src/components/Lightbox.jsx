import { useEffect, useRef } from 'react'
// title 예: "10 남가식당 — 간척월명로 311-1"
export default function Lightbox({ title, name, photos, index, onIndexChange, onClose }) {
  const total = photos.length
  const touchX = useRef(null)

  const go = (delta) => onIndexChange((index + delta + total) % total)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // 글자는 밑줄 텍스트, 누르는 영역은 44px 이상
  const link = 'inline-flex min-h-11 min-w-11 items-center justify-center px-2 underline underline-offset-4 hover:no-underline'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name} 사진`}
      className="fixed inset-0 z-[2000] flex flex-col bg-black text-white"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        touchX.current = null
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
      }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-1 text-sm desk:px-6">
        <p className="min-w-0 truncate">
          {title}
        </p>
        <button type="button" onClick={onClose} className={`shrink-0 ${link}`}>
          닫기
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <img key={photos[index]} src={photos[index]} alt={`${name} ${index + 1}`} draggable={false} className="max-h-full max-w-full select-none object-contain" />
      </div>

      <div className="flex items-center justify-center gap-1 px-4 py-2 text-sm">
        <button type="button" onClick={() => go(-1)} className={link}>
          이전
        </button>
        <span>·</span>
        <span>
          {index + 1} / {total}
        </span>
        <span>·</span>
        <button type="button" onClick={() => go(1)} className={link}>
          다음
        </button>
      </div>
    </div>
  )
}
