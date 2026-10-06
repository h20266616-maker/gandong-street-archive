import { fullAddress, photoUrls, shortAddress } from '../data/stores.js'

// 오른쪽 패널 상세 상태. 사진은 패널 너비에 맞춰 원본 비율·원본 색 그대로 한 장씩 쌓는다
export default function StoreDetail({ store, prev, next, stickyTop, onBack, onOpenPhoto, onGo }) {
  const photos = photoUrls(store)
  const line = [store.type, shortAddress(store), `사진 ${store.photoCount}장`].filter(Boolean).join(' · ')

  return (
    <article>
      <div className="sticky z-10 flex items-center justify-between gap-4 border-b border-black bg-white px-4 py-3 desk:px-5" style={{ top: stickyTop }}>
        <button type="button" onClick={onBack} className="shrink-0 text-sm underline underline-offset-4 hover:no-underline">
          ← 전체 목록
        </button>
        <span className="min-w-0 truncate text-xs">{fullAddress(store)}</span>
      </div>

      <header className="px-4 pb-6 pt-6 desk:px-5">
        <p className="text-sm text-[#888]">{store.id}</p>
        <h2 className="mt-1 text-[30px] font-bold leading-tight break-keep">{store.name}</h2>
        <p className="mt-2 text-sm text-[#333]">{line}</p>
        {store.distanceNote && <p className="text-sm text-[#333]">{store.distanceNote}</p>}
        {store.memo && <p className="mt-4 text-sm leading-relaxed break-keep">{store.memo}</p>}
      </header>

      <ol className="px-4 desk:px-5">
        {photos.map((src, i) => (
          <li key={src} className="mb-6">
            <button type="button" onClick={() => onOpenPhoto(i)} className="block w-full" aria-label={`${store.name} 사진 ${i + 1} 크게 보기`}>
              <img src={src} alt={`${store.name} ${i + 1}`} loading="lazy" className="block h-auto w-full" />
            </button>
            <p className="mt-1.5 text-[11px] text-[#888]">
              {i + 1} / {photos.length}
            </p>
          </li>
        ))}
      </ol>

      {prev && next && (
        <nav aria-label="다른 가게" className="grid grid-cols-2 border-t border-black">
          <button type="button" onClick={() => onGo(prev)} className="min-w-0 px-4 py-4 text-left hover:bg-black hover:text-white desk:px-5">
            <span className="block text-xs">이전 가게</span>
            <span className="block truncate text-sm font-semibold">
              {prev.id} {prev.name}
            </span>
          </button>
          <button type="button" onClick={() => onGo(next)} className="min-w-0 border-l border-black px-4 py-4 text-right hover:bg-black hover:text-white desk:px-5">
            <span className="block text-xs">다음 가게</span>
            <span className="block truncate text-sm font-semibold">
              {next.id} {next.name}
            </span>
          </button>
        </nav>
      )}
    </article>
  )
}
