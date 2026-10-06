import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { categories, distanceShort, filterByCat, listOrder, neighbors, shortAddress, stores as initialStores } from './data/stores.js'
import { site } from './data/site.js'
import { makeWorld } from './iso.js'
import IsoMap from './components/IsoMap.jsx'
import PhotoStack from './components/PhotoStack.jsx'
import AllPhotos from './components/AllPhotos.jsx'
import Lightbox from './components/Lightbox.jsx'
import EditMap from './components/EditMap.jsx'

const params = new URLSearchParams(window.location.search)
// URL에 ?edit 가 있을 때만 카카오맵 핀 드래그 + 좌표 출력
const isEditMode = params.has('edit')
const KAKAO_MAP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY
const DEFAULT_SHOP = '08'

function useMedia(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

// stores.js의 배열 자리에 그대로 붙여넣을 수 있는 형태
const toStoresSource = (list) =>
  'export const stores = [\n' + list.map((s) => `  ${JSON.stringify(s)},`).join('\n') + '\n]'

// 별관 안내: "← 서쪽 3km, 유촌리"
const annexLabel = (s) => {
  const dir = s.distanceNote?.match(/([동서남북])쪽/)?.[1]
  const village = s.address.match(/(\S+리)/)?.[1]
  return `← ${[dir && `${dir}쪽`, distanceShort(s)].filter(Boolean).join(' ')}${village ? `, ${village}` : ''}`
}

const link = 'underline underline-offset-4 hover:no-underline'

export default function App() {
  const [stores, setStores] = useState(initialStores)
  const [shopId, setShopId] = useState(() => (initialStores.some((s) => s.id === params.get('shop')) ? params.get('shop') : DEFAULT_SHOP))
  const [photo, setPhoto] = useState(0)
  const [cat, setCat] = useState('all')
  const [allOpen, setAllOpen] = useState(false)
  const [lightbox, setLightbox] = useState(null) // 사진 번호
  const frontRef = useRef(null)
  const isMobile = useMedia('(max-width: 700px)')

  const world = useMemo(() => makeWorld(initialStores), [])
  const filtered = useMemo(() => filterByCat(stores, cat), [stores, cat])
  const activeIds = useMemo(() => new Set(filtered.map((s) => s.id)), [filtered])
  const store = stores.find((s) => s.id === shopId)
  const n = store.photoCount
  const { prev, next } = neighbors(activeIds.has(store.id) ? filtered : stores, store)

  // 현재 가게를 ?shop=08 로 남긴다 (다른 파라미터는 그대로)
  useEffect(() => {
    if (isEditMode) return
    const q = new URLSearchParams(window.location.search)
    q.set('shop', shopId)
    history.replaceState(history.state, '', `${window.location.pathname}?${q}`)
  }, [shopId])

  const select = useCallback((id) => {
    setShopId(id)
    setPhoto(0)
  }, [])
  const nextPhoto = useCallback(() => setPhoto((i) => (i + 1) % n), [n])
  const prevPhoto = useCallback(() => setPhoto((i) => (i - 1 + n) % n), [n])

  // 핀: 다른 가게면 고르고, 이미 고른 가게면 다음 사진
  const pick = useCallback((id) => (id === shopId ? nextPhoto() : select(id)), [shopId, nextPhoto, select])

  const chooseCat = (key) => {
    setCat(key)
    const inCat = listOrder(filterByCat(stores, key))
    if (inCat.length && !inCat.some((s) => s.id === shopId)) select(inCat[0].id)
  }

  // 키보드: ←/→ 이전·다음 가게(필터 안에서), 스페이스 다음 사진, Enter 전체 사진, ESC 닫기
  useEffect(() => {
    if (isEditMode) return undefined
    const onKey = (e) => {
      if (lightbox != null) return // 라이트박스가 직접 처리
      if (allOpen) {
        if (e.key === 'Escape') setAllOpen(false)
        return
      }
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return
      if (e.key === 'ArrowLeft' && prev) select(prev.id)
      else if (e.key === 'ArrowRight' && next) select(next.id)
      else if (e.key === ' ') {
        e.preventDefault()
        nextPhoto()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        setAllOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, allOpen, prev, next, select, nextPhoto])

  const moveStore = (id, lat, lng) => {
    const moved = stores.map((s) => (s.id === id ? { ...s, lat: +lat.toFixed(6), lng: +lng.toFixed(6) } : s))
    setStores(moved)
    console.log(toStoresSource(moved))
  }

  const header = (
    <header className="flex shrink-0 flex-col gap-0.5 border-b border-black px-4 py-3 wide:flex-row wide:items-baseline wide:justify-between wide:gap-6 wide:px-6">
      <h1 className="text-[22px] font-bold leading-tight">{site.title}</h1>
      <p className="truncate text-xs text-[#888]">{site.meta.join(' · ')}</p>
    </header>
  )

  if (isEditMode) {
    return (
      <div className="flex h-dvh flex-col">
        {header}
        <div className="min-h-0 flex-1">
          {KAKAO_MAP_KEY ? <EditMap appKey={KAKAO_MAP_KEY} stores={stores} onMove={moveStore} /> : <p className="p-4 text-sm">client/.env에 VITE_KAKAO_MAP_KEY가 없다.</p>}
        </div>
        <section className="shrink-0 border-t border-black bg-black p-3 text-white">
          <p className="mb-2 text-xs font-semibold">편집 모드 — 핀을 드래그해 놓으면 아래 내용이 바뀐다. src/data/stores.js의 stores 배열을 이걸로 교체.</p>
          <textarea
            readOnly
            value={toStoresSource(stores)}
            onFocus={(e) => e.target.select()}
            className="h-40 w-full resize-y border border-[#888] bg-black p-2 font-[inherit] text-[11px] leading-snug text-white"
          />
        </section>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {header}

      <nav aria-label="분류" className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-black px-4 py-2.5 wide:px-6">
        {[{ key: 'all', label: '전체' }, ...categories].map((c) => (
          <button
            key={c.key}
            type="button"
            aria-pressed={cat === c.key}
            onClick={() => chooseCat(c.key)}
            className={`shrink-0 whitespace-nowrap border border-black px-3 py-1 text-[13px] ${cat === c.key ? 'bg-black text-white' : 'bg-white hover:bg-black hover:text-white'}`}
          >
            {c.label}
          </button>
        ))}
      </nav>

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <IsoMap world={world} selectedId={shopId} activeIds={activeIds} isMobile={isMobile} anchorRef={frontRef} kickKey={`${shopId}:${photo}`} onPick={pick} />

        {store.annex && (
          <button
            type="button"
            onClick={() => select(listOrder(stores)[0].id)}
            className="absolute left-4 top-4 z-20 border border-black bg-white px-3 py-2 text-[13px] font-semibold hover:bg-black hover:text-white"
          >
            {annexLabel(store)}
          </button>
        )}

        <div className="stack-wrap">
          <PhotoStack key={store.id} store={store} index={photo} onIndex={setPhoto} onNext={nextPhoto} onPrev={prevPhoto} frontRef={frontRef} />
          <p className="mt-3 text-[11px] text-[#888]">
            {photo + 1} / {n}
          </p>
        </div>

        <section className="stack-info bg-white/85 py-1 wide:py-2">
          <p className="text-xs text-[#888]">{store.id}</p>
          <h2 className="truncate text-[24px] font-bold leading-tight wide:text-[30px]">{store.name}</h2>
          <p className="truncate text-[13px] text-[#333]">{[store.type, shortAddress(store), `사진 ${n}장`].join(' · ')}</p>
          {store.memo && <p className="mt-1 truncate text-[13px]">{store.memo}</p>}
          <p className="mt-2 flex flex-wrap gap-x-2 text-[13px]">
            <button type="button" onClick={nextPhoto} className={link}>
              다음 사진
            </button>
            <span aria-hidden>·</span>
            <button type="button" onClick={() => setAllOpen(true)} className={link}>
              전체 사진
            </button>
            {next && (
              <>
                <span aria-hidden>·</span>
                <button type="button" onClick={() => select(next.id)} className={link}>
                  다음 가게 →
                </button>
              </>
            )}
          </p>
        </section>
      </main>

      {allOpen && <AllPhotos store={store} onOpen={setLightbox} onClose={() => setAllOpen(false)} />}
      {lightbox != null && <Lightbox store={store} index={lightbox} onIndexChange={setLightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}
