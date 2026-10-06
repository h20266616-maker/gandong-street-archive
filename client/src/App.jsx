import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { stores as initialStores } from './data/stores.js'
import { isMtId, mtPlaces as initialMt } from './data/mtPlaces.js'
import { TABS, isPageTab, listSections, placeNeighbors, toPlaces } from './data/places.js'
import { site } from './data/site.js'
import KakaoMain from './components/KakaoMain.jsx'
import BottomSheet from './components/BottomSheet.jsx'
import PlaceList from './components/PlaceList.jsx'
import PlaceDetail from './components/PlaceDetail.jsx'
import { Contacts, Notice, Timetable } from './components/Pages.jsx'
import Lightbox from './components/Lightbox.jsx'
import EditMap from './components/EditMap.jsx'

const params = new URLSearchParams(window.location.search)
// URL에 ?edit 가 있을 때만 카카오맵 핀 드래그 + 좌표 출력
const isEditMode = params.has('edit')
const KAKAO_MAP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY
const validId = (id) => initialStores.some((s) => s.id === id) || isMtId(id)
const TAB_KEYS = TABS.map((t) => t.key)
// 처음 탭: ?tab= 이 있으면 그 탭. ?shop= 으로 들어오면 전체 탭에서 그 장소 (상점가 리스트 탭이고 가게면 그대로)
const initialTab = (() => {
  const t = params.get('tab')
  const shop = validId(params.get('shop')) ? params.get('shop') : null
  if (shop) return t === 'shop' && !isMtId(shop) ? 'shop' : 'all'
  if (TAB_KEYS.includes(t)) return t
  return params.get('view') === 'shop' ? 'shop' : 'all' // 예전 링크(?view=) 호환
})()

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
const moveIn = (list, id, lat, lng) => list.map((s) => (s.id === id ? { ...s, lat: +lat.toFixed(6), lng: +lng.toFixed(6) } : s))

const fab = (on = false) => `flex h-11 w-11 items-center justify-center border border-black text-sm font-semibold ${on ? 'bg-black text-white' : 'bg-white text-black'}`

export default function App() {
  const [stores, setStores] = useState(initialStores)
  const [mts, setMts] = useState(initialMt)
  const [tab, setTab] = useState(initialTab)
  // 페이지 탭(타임테이블·공지·비상연락망)을 보는 동안에도 지도는 마지막 지도 탭 상태로 남는다
  const [mapTab, setMapTab] = useState(isPageTab(initialTab) ? 'all' : initialTab)
  const [selectedId, setSelectedId] = useState(() => (validId(params.get('shop')) ? params.get('shop') : null))
  const [snap, setSnap] = useState(() => (isPageTab(initialTab) ? 'full' : validId(params.get('shop')) ? 'half' : 'peek'))
  const [sheetH, setSheetH] = useState(0)
  const [fitTick, setFitTick] = useState(0)
  const [threeD, setThreeD] = useState(false)
  const [me, setMe] = useState(null)
  const [locating, setLocating] = useState(false)
  const [toast, setToast] = useState(null)
  const [lightbox, setLightbox] = useState(null) // 사진 번호
  const [kakaoFailed, setKakaoFailed] = useState(false)
  const desktop = useMedia('(min-width: 900px)')
  const sheetScroll = useRef(null)
  const allPhotosRef = useRef(null)
  const mapApi = useRef(null)
  const watchId = useRef(null)

  const places = useMemo(() => toPlaces(stores, mts), [stores, mts])
  const onPage = isPageTab(tab)
  const sections = useMemo(() => listSections(places, mapTab), [places, mapTab])
  const activeIds = useMemo(() => new Set(sections.flatMap((s) => s.items.map((p) => p.id))), [sections])
  const selected = places.find((p) => p.id === selectedId) ?? null
  const { prev, next } = selected ? placeNeighbors(activeIds.has(selected.id) ? sections : listSections(places, 'all'), selected.id) : {}

  // 지금 탭과 장소를 ?tab=all&shop=10 으로. 단톡방에 링크를 그대로 공유할 수 있게
  useEffect(() => {
    if (isEditMode) return
    const q = new URLSearchParams(window.location.search)
    q.set('tab', tab)
    if (selectedId && !onPage) q.set('shop', selectedId)
    else q.delete('shop')
    q.delete('view')
    history.replaceState(history.state, '', `${window.location.pathname}?${q}`)
  }, [selectedId, tab, onPage])

  const toastTimer = useRef(0)
  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }, [])

  const select = useCallback((id) => {
    setSelectedId(id)
    setSnap((s) => (s === 'full' ? 'full' : 'half'))
    sheetScroll.current?.scrollTo({ top: 0 })
  }, [])
  const backToList = useCallback(() => {
    setSelectedId(null)
    setSnap('peek')
    sheetScroll.current?.scrollTo({ top: 0 })
  }, [])

  const chooseTab = (key) => {
    setTab(key)
    sheetScroll.current?.scrollTo({ top: 0 })
    if (isPageTab(key)) {
      setSnap('full')
      return
    }
    setMapTab(key)
    setSelectedId(null)
    setSnap('peek')
    setFitTick((t) => t + 1)
  }

  // 페이지 탭에서 시트를 내리면 지도 탭으로 돌아간다
  const onSnap = (s) => {
    setSnap(s)
    if (onPage && s !== 'full') setTab(mapTab)
  }

  // 타임테이블 [지도]: 장소면 전체 탭에서 그 장소 상세, 'shop'이면 상점가 리스트 탭
  const showFromTimetable = (place) => {
    if (place === 'shop') {
      chooseTab('shop')
      return
    }
    setTab('all')
    if (mapTab !== 'all') {
      setMapTab('all')
      setFitTick((t) => t + 1)
    }
    setSelectedId(place)
    setSnap('half')
    sheetScroll.current?.scrollTo({ top: 0 })
  }

  const openAllPhotos = () => {
    setSnap('full')
    setTimeout(() => allPhotosRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 280)
  }

  // 내 위치: 켜면 watchPosition, 다시 누르면 끈다
  const toggleLocate = () => {
    if (locating) {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
      setLocating(false)
      setMe(null)
      return
    }
    if (!('geolocation' in navigator)) {
      showToast('위치를 확인할 수 없어요')
      return
    }
    setLocating(true)
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }),
      () => {
        showToast('위치를 확인할 수 없어요')
        if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
        setLocating(false)
        setMe(null)
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    )
  }
  useEffect(() => () => watchId.current != null && navigator.geolocation.clearWatch(watchId.current), [])

  // 키보드: ←/→ 이전·다음 장소, ESC 목록으로 (라이트박스가 열려 있으면 라이트박스가 처리)
  useEffect(() => {
    if (isEditMode) return undefined
    const onKey = (e) => {
      if (lightbox != null) return
      if (onPage) {
        if (e.key === 'Escape') onSnap('peek')
        return
      }
      if (!selected) return
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return
      if (e.key === 'Escape') backToList()
      else if (e.key === 'ArrowLeft' && prev) select(prev.id)
      else if (e.key === 'ArrowRight' && next) select(next.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, selected, prev, next, select, backToList, onPage]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSheetHeight = useCallback((h) => setSheetH(h), [])
  // 지도 위 오른쪽 떠 있는 버튼 자리 (이름표가 여기 가리지 않게)
  const [vw, setVw] = useState(() => window.innerWidth)
  const [vh, setVh] = useState(() => window.innerHeight)
  useEffect(() => {
    const on = () => {
      setVw(window.innerWidth)
      setVh(window.innerHeight)
    }
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  const fabRect = useMemo(() => {
    const bottom = vh - (desktop ? 12 : sheetH + 12)
    return { x1: vw - 12 - 44 - 4, x2: vw, y1: bottom - 44 * 4 - 4, y2: bottom + 4 }
  }, [vw, vh, desktop, sheetH])
  const blocked = useMemo(() => [fabRect], [fabRect])
  const insets = useMemo(
    () => (desktop ? { top: 12, right: 68, bottom: 12, left: 444 } : { top: 128, right: 60, bottom: sheetH, left: 0 }),
    [desktop, sheetH],
  )

  if (isEditMode) {
    return (
      <div className="flex h-dvh flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-black px-4">
          <h1 className="truncate text-lg font-bold">{site.fullName}</h1>
          <p className="shrink-0 text-xs text-[#888]">편집 모드</p>
        </header>
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

  const fabBottom = desktop ? 12 : sheetH + 12

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* 지도: 화면 전체 */}
      <div className="fixed inset-0">
        {KAKAO_MAP_KEY && !kakaoFailed ? (
          <KakaoMain
            ref={mapApi}
            appKey={KAKAO_MAP_KEY}
            places={places}
            selectedId={selectedId}
            activeIds={activeIds}
            insets={insets}
            blocked={blocked}
            fitKey={`${mapTab === 'all' ? 'all' : 'street'}:${fitTick}`}
            threeD={threeD}
            me={me}
            onPick={select}
            onLoadError={() => setKakaoFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#f5f5f5] px-8 text-center text-sm text-[#888]">지도를 불러오지 못했어요. 목록에서 장소를 볼 수 있어요.</div>
        )}
      </div>

      {/* 위쪽 떠 있는 바 + 칩 */}
      {/* 위쪽 바와 탭은 시트보다 위: full로 올려도 가리지 않는다 */}
      <div className="fixed left-3 right-3 z-[60] desk:right-auto desk:w-[420px]" style={{ top: 'calc(env(safe-area-inset-top) + 10px)' }}>
        {/* 두 줄 바: 하얀도화지 · 26-2학기 / 화천 간동면 로컬 봉사 MT (모자라면 말줄임) */}
        <header className="flex h-14 flex-col justify-center border border-black bg-white px-4">
          <p className="text-[11px] leading-tight text-[#888]">
            {site.org} · {site.term}
          </p>
          <h1 className="truncate text-[17px] font-bold leading-snug">{site.title}</h1>
        </header>
        <nav aria-label="탭" className="no-scrollbar -mx-3 flex gap-1.5 overflow-x-auto px-3 desk:mx-0 desk:px-0">
          {TABS.map((t) => (
            <button key={t.key} type="button" aria-pressed={tab === t.key} onClick={() => chooseTab(t.key)} className="flex h-11 min-w-11 shrink-0 items-center justify-center">
              <span className={`flex h-9 items-center whitespace-nowrap border border-black px-2.5 text-[13px] ${tab === t.key ? 'bg-black text-white' : 'bg-white'}`}>{t.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 오른쪽 떠 있는 버튼: 시트 높이를 따라 움직인다 */}
      {/* 시트가 full이면 버튼 자리가 없어서 숨긴다 */}
      <div className={`fixed right-3 z-40 flex flex-col ${!desktop && snap === 'full' ? 'invisible' : ''}`} style={{ bottom: fabBottom, transition: 'bottom .25s ease-out' }}>
        <button type="button" aria-pressed={threeD} onClick={() => setThreeD((v) => !v)} className={fab(threeD)}>
          3D
        </button>
        <button type="button" aria-pressed={locating} aria-label="내 위치" onClick={toggleLocate} className={`${fab(locating)} -mt-px text-lg`}>
          ◎
        </button>
        <button type="button" aria-label="확대" onClick={() => mapApi.current?.zoomIn()} className={`${fab()} -mt-px text-lg`}>
          +
        </button>
        <button type="button" aria-label="축소" onClick={() => mapApi.current?.zoomOut()} className={`${fab()} -mt-px text-lg`}>
          −
        </button>
      </div>

      <BottomSheet snap={snap} onSnap={onSnap} desktop={desktop} onHeight={onSheetHeight} scrollRef={sheetScroll}>
        {tab === 'tt' ? (
          <Timetable onShowPlace={showFromTimetable} />
        ) : tab === 'notice' ? (
          <Notice />
        ) : tab === 'call' ? (
          <Contacts />
        ) : selected ? (
          <PlaceDetail
            key={selected.id}
            place={selected}
            prev={prev}
            next={next}
            onBack={backToList}
            onGo={select}
            onAllPhotos={openAllPhotos}
            onOpenPhoto={setLightbox}
            allPhotosRef={allPhotosRef}
          />
        ) : (
          <PlaceList title={TABS.find((t) => t.key === mapTab).title} sections={sections} onPick={select} />
        )}
      </BottomSheet>

      {toast && (
        <div role="status" className="fixed left-1/2 z-[70] -translate-x-1/2 bg-black px-4 py-3 text-sm text-white" style={{ top: 'calc(env(safe-area-inset-top) + 138px)' }}>
          {toast}
        </div>
      )}

      {lightbox != null && selected && (
        <Lightbox
          title={`${selected.label} ${selected.name} — ${selected.short}`}
          name={selected.name}
          photos={selected.photos}
          index={lightbox}
          onIndexChange={setLightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
