import { site } from '../data/site.js'
import { photoUrls } from '../data/stores.js'

export default function StoreDetail({ store, onBack, onOpenPhoto }) {
  return (
    <article>
      <div className="sticky top-0 z-10 border-b border-black bg-white px-4 py-3 lg:px-8">
        <button type="button" onClick={onBack} className="text-sm font-semibold hover:underline">
          ← 전체 목록
        </button>
      </div>

      <header className="border-b border-black px-4 pb-6 pt-6 lg:px-8 lg:pt-10">
        <p className="text-5xl font-extrabold leading-none tracking-[-0.04em] tabular-nums lg:text-6xl">{store.id}</p>
        <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.03em] lg:text-3xl">{store.name}</h2>
        <dl className="mt-5 grid grid-cols-[4.5rem_1fr] gap-y-1.5 text-sm">
          <dt className="text-[#888]">분류</dt>
          <dd>
            {store.category}
            {store.note && <span className="text-[#888]"> · {store.note}</span>}
          </dd>
          <dt className="text-[#888]">주소</dt>
          <dd>{store.address ? `${site.addressPrefix} ${store.address}` : '미정'}</dd>
          <dt className="text-[#888]">사진</dt>
          <dd className="tabular-nums">{store.photoCount}장</dd>
        </dl>
      </header>

      <ul className="grid grid-cols-2 gap-px bg-[#ccc] p-px">
        {photoUrls(store).map((src, i) => (
          <li key={src} className="bg-white">
            <button type="button" onClick={() => onOpenPhoto(i)} className="block w-full" aria-label={`${store.name} 사진 ${i + 1} 크게 보기`}>
              <img src={src} alt={`${store.name} ${i + 1}`} loading="lazy" className="aspect-[4/5] w-full bg-[#eee] object-cover" />
            </button>
          </li>
        ))}
      </ul>
    </article>
  )
}
