import { useEffect, useRef } from 'react'
import { photoUrls } from '../data/stores.js'

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
      <div className="flex justify-end p-2">
        <button type="button" onClick={onClose} className="px-3 py-2 text-3xl leading-none" aria-label="닫기 (ESC)">
          ×
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <img
          key={photos[index]}
          src={photos[index]}
          alt={`${store.name} ${index + 1}`}
          draggable={false}
          className="max-h-full max-w-full select-none object-contain"
        />
        {total > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="이전 사진" className="absolute left-0 top-1/2 -translate-y-1/2 px-3 py-6 text-4xl text-[#ccc] hover:text-white lg:px-6">
              ‹
            </button>
            <button type="button" onClick={() => go(1)} aria-label="다음 사진" className="absolute right-0 top-1/2 -translate-y-1/2 px-3 py-6 text-4xl text-[#ccc] hover:text-white lg:px-6">
              ›
            </button>
          </>
        )}
      </div>

      <p className="px-4 py-4 text-center text-sm tabular-nums text-[#ccc]">
        {store.name} · {index + 1} / {total}
      </p>
    </div>
  )
}
