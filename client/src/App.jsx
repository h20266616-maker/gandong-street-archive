import { useCallback, useEffect, useRef, useState } from 'react'
import { neighbors, stores as initialStores } from './data/stores.js'
import { site } from './data/site.js'
import KakaoMapView from './components/KakaoMapView.jsx'
import MapView from './components/MapView.jsx'
import StoreList from './components/StoreList.jsx'
import StoreDetail from './components/StoreDetail.jsx'
import Lightbox from './components/Lightbox.jsx'

// URL에 ?edit 가 있을 때만 핀 드래그 + 좌표 출력
const isEditMode = new URLSearchParams(window.location.search).has('edit')

// 카카오 키가 있으면 카카오맵, 없거나 로드에 실패하면(도메인 미등록 등) OpenStreetMap으로 폴백
const KAKAO_MAP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY

const DESK_QUERY = '(min-width: 861px)'
// 핀 hover 미리보기는 마우스가 있는 데스크톱에서만
const PREVIEW_QUERY = `${DESK_QUERY} and (hover: hover)`

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

export default function App() {
  const [stores, setStores] = useState(initialStores)
  const [selectedId, setSelectedId] = useState(null)
  const [hover, setHover] = useState(null) // { id, from: 'map' | 'list' }
  const [lightbox, setLightbox] = useState(null) // { storeId, index }
  const [kakaoFailed, setKakaoFailed] = useState(false)
  const panelRef = useRef(null)
  const mapBoxRef = useRef(null)
  const isDesk = useMedia(DESK_QUERY)
  const canPreview = useMedia(PREVIEW_QUERY)

  const useKakao = Boolean(KAKAO_MAP_KEY) && !kakaoFailed
  const handleKakaoError = useCallback(() => setKakaoFailed(true), [])
  const handleHover = useCallback(
    (id, from) => setHover((cur) => (id ? (cur?.id === id && cur?.from === from ? cur : { id, from }) : null)),
    [],
  )

  const selected = stores.find((s) => s.id === selectedId) ?? null
  const { prev, next } = selected ? neighbors(stores, selected) : {}
  const photoTotal = stores.reduce((n, s) => n + s.photoCount, 0)

  // 고르면 패널을 맨 위로. 모바일에서는 지도 바로 아래에 패널 시작이 오게 페이지를 옮긴다
  const select = (id) => {
    setSelectedId(id)
    setHover(null)
    if (isDesk) {
      panelRef.current?.scrollTo({ top: 0 })
    } else if (panelRef.current && mapBoxRef.current) {
      const y = panelRef.current.getBoundingClientRect().top + window.scrollY - mapBoxRef.current.offsetHeight
      window.scrollTo({ top: Math.max(0, y) })
    }
  }

  // 상세에서 ←/→ 이전·다음 가게, ESC 목록. 라이트박스가 열려 있으면 라이트박스가 처리한다
  useEffect(() => {
    if (!selected || lightbox) return undefined
    const onKey = (e) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
      if (e.key === 'Escape') select(null)
      else if (e.key === 'ArrowLeft' && prev) select(prev.id)
      else if (e.key === 'ArrowRight' && next) select(next.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const moveStore = (id, lat, lng) => {
    const moved = stores.map((s) => (s.id === id ? { ...s, lat: +lat.toFixed(6), lng: +lng.toFixed(6) } : s))
    setStores(moved)
    console.log(toStoresSource(moved))
  }

  const mapProps = {
    stores,
    selectedId,
    hoverId: hover?.id ?? null,
    previewId: canPreview && hover?.from === 'map' ? hover.id : null,
    onHover: handleHover,
    onSelect: select,
    editMode: isEditMode,
    onMove: moveStore,
  }

  return (
    <div className={`desk:flex desk:h-dvh desk:flex-col ${isEditMode ? 'edit-mode' : ''}`}>
      <header className="border-b border-black px-4 py-3 desk:flex desk:h-12 desk:shrink-0 desk:items-center desk:justify-between desk:gap-6 desk:px-5 desk:py-0">
        <h1 className="text-xl font-bold leading-tight">{site.title}</h1>
        <p className="mt-0.5 text-xs text-[#888] desk:mt-0 desk:truncate">
          {[...site.meta, `가게 ${stores.length}곳, 사진 ${photoTotal}장`].join(' · ')}
        </p>
      </header>

      <div className="desk:grid desk:min-h-0 desk:flex-1 desk:grid-cols-[minmax(0,1fr)_420px]">
        <div ref={mapBoxRef} className="sticky top-0 z-20 h-[52vh] border-b border-black bg-white desk:static desk:h-auto desk:border-b-0 desk:border-r">
          {useKakao ? <KakaoMapView appKey={KAKAO_MAP_KEY} onLoadError={handleKakaoError} {...mapProps} /> : <MapView {...mapProps} />}
        </div>

        <main ref={panelRef} className="min-w-0 desk:overflow-y-auto">
          {selected ? (
            <StoreDetail
              store={selected}
              prev={prev}
              next={next}
              stickyTop={isDesk ? 0 : '52vh'}
              onBack={() => select(null)}
              onOpenPhoto={(index) => setLightbox({ storeId: selected.id, index })}
              onGo={(s) => select(s.id)}
            />
          ) : (
            <StoreList stores={stores} hoverId={hover?.id ?? null} onHover={handleHover} onSelect={select} />
          )}
        </main>
      </div>

      {isEditMode && (
        <section className="fixed bottom-0 left-0 z-[1500] w-full border-t border-black bg-black p-3 text-white desk:w-[calc(100%-420px)]">
          <p className="mb-2 text-xs font-semibold">편집 모드 — 핀을 드래그해 놓으면 아래 내용이 바뀐다. src/data/stores.js의 stores 배열을 이걸로 교체.</p>
          <textarea
            readOnly
            value={toStoresSource(stores)}
            onFocus={(e) => e.target.select()}
            className="h-40 w-full resize-y border border-[#888] bg-black p-2 font-[inherit] text-[11px] leading-snug text-white"
          />
        </section>
      )}

      {lightbox && (
        <Lightbox
          store={stores.find((s) => s.id === lightbox.storeId)}
          index={lightbox.index}
          onIndexChange={(index) => setLightbox((lb) => ({ ...lb, index }))}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
