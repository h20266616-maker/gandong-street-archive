import { useEffect, useRef } from 'react'
import { photoUrls, shortAddress } from '../data/stores.js'

export default function Lightbox({ store, index, onIndexChange, onClose }) {
  const photos = photoUrls(store)
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

  const link = 'underline underline-offset-4 hover:no-underline'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${store.name} 사진`}
      className="fixed inset-0 z-[2000] flex flex-col bg-black text-white"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        touchX.current = null
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
      }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm wide:px-6">
        <p className="min-w-0 truncate">
          {store.id} {store.name} — {shortAddress(store)}
        </p>
        <button type="button" onClick={onClose} className={`shrink-0 ${link}`}>
          닫기
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <img key={photos[index]} src={photos[index]} alt={`${store.name} ${index + 1}`} draggable={false} className="max-h-full max-w-full select-none object-contain" />
      </div>

      <div className="flex items-center justify-center gap-3 px-4 py-4 text-sm">
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
