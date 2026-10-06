import { categoryOf, fullAddress, photoUrls } from '../data/stores.js'
import CategoryDot from './CategoryDot.jsx'

// 01 지도 탭의 미리보기 패널. 자세한 내용은 [기록 열람 →]으로 기록 페이지에서
export default function StoreDetail({ store, onBack, onOpenPhoto, onOpenRecord }) {
  const c = categoryOf(store)
  return (
    <article>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink bg-paper px-4 py-3 lg:px-6">
        <button type="button" onClick={onBack} className="font-mono text-xs hover:text-accent">
          ← 전체 목록
        </button>
        <button type="button" onClick={onOpenRecord} className="border border-ink bg-card px-2.5 py-1 font-mono text-xs hover:bg-ink hover:text-white">
          [기록 열람 →]
        </button>
      </div>

      <header className="border-b border-ink px-4 pb-6 pt-6 lg:px-6">
        <p className="font-mono text-xs text-accent">{store.acc}</p>
        <h2 className="mt-2 font-serif text-2xl font-bold break-keep lg:text-3xl">{store.name}</h2>
        <dl className="mt-5 grid grid-cols-[4.5rem_1fr] gap-y-1.5 text-sm">
          <dt className="font-mono text-[11px] uppercase tracking-wider text-pencil">분류</dt>
          <dd className="flex flex-wrap items-center gap-x-2">
            <CategoryDot color={c?.color} />
            {store.type}
            {store.note && <span className="text-pencil">· {store.note}</span>}
          </dd>
          <dt className="font-mono text-[11px] uppercase tracking-wider text-pencil">주소</dt>
          <dd className="break-keep">
            {fullAddress(store) || '미정'}
            {store.distanceNote && <span className="block text-pencil">{store.distanceNote}</span>}
          </dd>
          <dt className="font-mono text-[11px] uppercase tracking-wider text-pencil">사진</dt>
          <dd className="font-mono">{store.photoCount}점</dd>
        </dl>
      </header>

      <ul className="grid grid-cols-2 gap-px bg-line p-px">
        {photoUrls(store).map((src, i) => (
          <li key={src} className="bg-card">
            <button type="button" onClick={() => onOpenPhoto(i)} className="block w-full" aria-label={`${store.name} 사진 ${i + 1} 크게 보기`}>
              <img src={src} alt={`${store.name} ${i + 1}`} loading="lazy" className="aspect-[4/5] w-full bg-line object-cover" />
            </button>
          </li>
        ))}
      </ul>
    </article>
  )
}
