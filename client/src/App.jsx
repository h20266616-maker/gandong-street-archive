import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { categories, filterByCat, listOrder, neighbors, photoUrls, shortAddress, distanceShort, stores as initialStores } from './data/stores.js'
import { isMtId, mtPhotoUrls, mtPlaces as initialMt, mtShortAddress } from './data/mtPlaces.js'
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
const validId = (id) => initialStores.some((s) => s.id === id) || isMtId(id)

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

// data 파일의 배열 자리에 그대로 붙여넣을 수 있는 형태
const toSource = (name, list) => `export const ${name} = [\n` + list.map((s) => `  ${JSON.stringify(s)},`).join('\n') + '\n]'

// 별관 안내: "← 서쪽 3km, 유촌리"
const annexLabel = (s) => {
  const dir = s.distanceNote?.match(/([동서남북])쪽/)?.[1]
  const village = s.address.match(/(\S+리)/)?.[1]
  return `← ${[dir && `${dir}쪽`, distanceShort(s)].filter(Boolean).join(' ')}${village ? `, ${village}` : ''}`
}

// MT 장소 순서 A → B → C → A
const mtNeighbors = (list, place) => {
  const i = list.findIndex((p) => p.id === place.id)
  return { prev: list[(i - 1 + list.length) % list.length], next: list[(i + 1) % list.length] }
}

const link = 'underline underline-offset-4 hover:no-underline'
const moveIn = (list, id, lat, lng) => list.map((s) => (s.id === id ? { ...s, lat: +lat.toFixed(6), lng: +lng.toFixed(6) } : s))

export default function App() {
  const [stores, setStores] = useState(initialStores)
  const [mts, setMts] = useState(initialMt)
  const [shopId, setShopId] = useState(() => (validId(params.get('shop')) ? params.get('shop') : DEFAULT_SHOP))
  const [overview, setOverview] = useState(() => params.get('view') === 'mt')
  const [cat, setCat] = useState(() => (params.get('view') === 'mt' || isMtId(params.get('shop')) ? 'mt' : 'all'))
  const [photo, setPhoto] = useState(0)
  const [allOpen, setAllOpen] = useState(false)
  const [lightbox, setLightbox] = useState(null) // 사진 번호
  const frontRef = useRef(null)
  const lastStreet = useRef(isMtId(shopId) ? DEFAULT_SHOP : shopId)
  const isMobile = useMedia('(max-width: 700px)')

  const world = useMemo(() => makeWorld(initialStores, initialMt), [])
  const isMt = isMtId(shopId)
  const item = isMt ? mts.find((p) => p.id === shopId) : stores.find((s) => s.id === shopId)
  const photos = isMt ? mtPhotoUrls(item) : photoUrls(item)
  const n = photos.length
  const filtered = useMemo(() => filterByCat(stores, cat === 'mt' ? 'all' : cat), [stores, cat])

  // 흐리게 하지 않을 핀: MT 칩이면 MT 장소만, 전체면 모두, 다른 분류면 그 분류 가게만
  const activeIds = useMemo(() => {
    if (cat === 'mt') return new Set(mts.map((p) => p.id))
    if (cat === 'all') return new Set([...stores.map((s) => s.id), ...mts.map((p) => p.id)])
    return new Set(filtered.map((s) => s.id))
  }, [cat, stores, mts, filtered])

  const { prev, next } = isMt ? mtNeighbors(mts, item) : neighbors(activeIds.has(item.id) && cat !== 'mt' ? filtered : stores, item)

  // 현재 곳을 ?shop=08 (전체 보기면 &view=mt) 로 남긴다. 다른 파라미터는 그대로
  useEffect(() => {
    if (isEditMode) return
    const q = new URLSearchParams(window.location.search)
    q.set('shop', shopId)
    if (overview) q.set('view', 'mt')
    else q.delete('view')
    history.replaceState(history.state, '', `${window.location.pathname}?${q}`)
  }, [shopId, overview])

  const select = useCallback((id) => {
    if (!isMtId(id)) lastStreet.current = id
    setShopId(id)
    setPhoto(0)
  }, [])
  const nextPhoto = useCallback(() => n && setPhoto((i) => (i + 1) % n), [n])
  const prevPhoto = useCallback(() => n && setPhoto((i) => (i - 1 + n) % n), [n])

  // 핀: 전체 보기에서는 그곳으로 들어가고, 다른 곳이면 고르고, 이미 고른 곳이면 다음 사진
  const pick = useCallback(
    (id) => {
      if (!isMtId(id) && cat === 'mt') setCat('all') // 상점가 핀을 누르면 상점가 보기로
      if (overview) {
        setOverview(false)
        select(id)
      } else if (id === shopId) nextPhoto()
      else select(id)
    },
    [overview, shopId, cat, nextPhoto, select],
  )

  const chooseCat = (key) => {
    setCat(key)
    if (key === 'mt') {
      setOverview(true)
      return
    }
    setOverview(false)
    const inCat = listOrder(filterByCat(stores, key))
    if (isMt) select(key === 'all' ? lastStreet.current : inCat[0].id)
    else if (inCat.length && !inCat.some((s) => s.id === shopId)) select(inCat[0].id)
  }

  // 키보드: ←/→ 이전·다음 가게(분류 안에서), 스페이스 다음 사진, Enter 전체 사진, ESC 닫기
  useEffect(() => {
    if (isEditMode) return undefined
    const onKey = (e) => {
      if (lightbox != null) return // 라이트박스가 직접 처리
      if (allOpen) {
        if (e.key === 'Escape') setAllOpen(false)
        return
      }
      if (overview) return
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return
      if (e.key === 'ArrowLeft' && prev) select(prev.id)
      else if (e.key === 'ArrowRight' && next) select(next.id)
      else if (e.key === ' ') {
        e.preventDefault()
        nextPhoto()
      } else if (e.key === 'Enter' && n) {
        e.preventDefault()
        setAllOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, allOpen, overview, prev, next, n, select, nextPhoto])

  const label = isMt ? `MT · ${item.id}` : item.id
  const short = isMt ? mtShortAddress(item) : shortAddress(item)
  const infoLine = [item.type, short, n ? `사진 ${n}장` : null].filter(Boolean).join(' · ')

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
          {KAKAO_MAP_KEY ? (
            <EditMap
              appKey={KAKAO_MAP_KEY}
              stores={stores}
              mtPlaces={mts}
              onMove={(id, lat, lng) => {
                const moved = moveIn(stores, id, lat, lng)
                setStores(moved)
                console.log(toSource('stores', moved))
              }}
              onMoveMt={(id, lat, lng) => {
                const moved = moveIn(mts, id, lat, lng)
                setMts(moved)
                console.log(toSource('mtPlaces', moved))
              }}
            />
          ) : (
            <p className="p-4 text-sm">client/.env에 VITE_KAKAO_MAP_KEY가 없다.</p>
          )}
        </div>
        <section className="shrink-0 border-t border-black bg-black p-3 text-white">
          <p className="mb-2 text-xs font-semibold">
            편집 모드 — 핀을 드래그해 놓으면 아래 내용이 바뀐다. 위 배열은 src/data/stores.js, 아래 배열은 src/data/mtPlaces.js에 교체.
          </p>
          <textarea
            readOnly
            value={`${toSource('stores', stores)}\n\n${toSource('mtPlaces', mts)}`}
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
        {[{ key: 'all', label: '전체' }, { key: 'mt', label: 'MT 장소' }, ...categories].map((c) => (
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
        <IsoMap
          world={world}
          mtPlaces={mts}
          selectedId={shopId}
          activeIds={activeIds}
          overview={overview}
          isMobile={isMobile}
          anchorRef={frontRef}
          kickKey={`${shopId}:${photo}:${overview}`}
          onPick={pick}
        />

        {!overview && item.annex && (
          <button
            type="button"
            onClick={() => select(listOrder(stores)[0].id)}
            className="absolute left-4 top-4 z-20 border border-black bg-white px-3 py-2 text-[13px] font-semibold hover:bg-black hover:text-white"
          >
            {annexLabel(item)}
          </button>
        )}

        {!overview && (
          <>
            <div className="stack-wrap">
              <PhotoStack key={item.id} name={item.name} photos={photos} index={photo} onIndex={setPhoto} onNext={nextPhoto} onPrev={prevPhoto} frontRef={frontRef} />
              {n > 0 && (
                <p className="mt-3 text-[11px] text-[#888]">
                  {photo + 1} / {n}
                </p>
              )}
            </div>

            <section className="stack-info bg-white/85 py-1 wide:py-2">
              <p className="text-xs text-[#888]">{label}</p>
              <h2 className="truncate text-[24px] font-bold leading-tight wide:text-[30px]">{item.name}</h2>
              <p className="truncate text-[13px] text-[#333]">{infoLine}</p>
              {item.memo && <p className="mt-1 truncate text-[13px]">{item.memo}</p>}
              <p className="mt-2 flex flex-wrap gap-x-2 text-[13px]">
                {n > 0 && (
                  <>
                    <button type="button" onClick={nextPhoto} className={link}>
                      다음 사진
                    </button>
                    <span aria-hidden>·</span>
                    <button type="button" onClick={() => setAllOpen(true)} className={link}>
                      전체 사진
                    </button>
                  </>
                )}
                {next && (
                  <>
                    {n > 0 && <span aria-hidden>·</span>}
                    <button type="button" onClick={() => select(next.id)} className={link}>
                      {isMt ? '다음 장소 →' : '다음 가게 →'}
                    </button>
                  </>
                )}
              </p>
            </section>
          </>
        )}
      </main>

      {allOpen && <AllPhotos label={label} name={item.name} photos={photos} onOpen={setLightbox} onClose={() => setAllOpen(false)} />}
      {lightbox != null && (
        <Lightbox title={`${label} ${item.name} — ${short}`} name={item.name} photos={photos} index={lightbox} onIndexChange={setLightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}
