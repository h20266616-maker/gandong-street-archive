import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { stores as initialStores } from './data/stores.js'
import { isMtId, mtPlaces as initialMt } from './data/mtPlaces.js'
import { TABS, cardOrder, placeNeighbors, toPlaces } from './data/places.js'
import { site } from './data/site.js'
import KakaoMain from './components/KakaoMain.jsx'
import TabBar from './components/TabBar.jsx'
import CardStrip from './components/CardStrip.jsx'
import PlaceSheet from './components/PlaceSheet.jsx'
import { Contacts, Notice, ShopGrid, Timetable } from './components/Pages.jsx'
import Lightbox from './components/Lightbox.jsx'
import EditMap from './components/EditMap.jsx'

const params = new URLSearchParams(window.location.search)
// URL에 ?edit 가 있을 때만 카카오맵 핀 드래그 + 좌표 출력
const isEditMode = params.has('edit')
const KAKAO_MAP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY
const validId = (id) => initialStores.some((s) => s.id === id) || isMtId(id)
const TAB_KEYS = TABS.map((t) => t.key)
const linkShop = validId(params.get('shop')) ? params.get('shop') : null
// 처음 탭: ?shop= 이 있으면 지도 탭에서 그 장소 상세. 아니면 ?tab=, 없으면 지도 (예전 링크의 tab=all은 지도로)
const initialTab = linkShop ? 'map' : TAB_KEYS.includes(params.get('tab')) ? params.get('tab') : 'map'

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

const tool = (on = false) => `flex h-11 w-11 items-center justify-center border border-black text-[13px] font-bold ${on ? 'bg-black text-white' : 'bg-white text-black'}`

export default function App() {
  const [stores, setStores] = useState(initialStores)
  const [mts, setMts] = useState(initialMt)
  const [tab, setTab] = useState(initialTab)
  const [selectedId, setSelectedId] = useState(linkShop)
  const [detailOpen, setDetailOpen] = useState(Boolean(linkShop))
  const [threeD, setThreeD] = useState(false)
  const [me, setMe] = useState(null)
  const [locating, setLocating] = useState(false)
  const [toast, setToast] = useState(null)
  const [lightbox, setLightbox] = useState(null) // 사진 번호
  const [kakaoFailed, setKakaoFailed] = useState(false)
  const wide = useMedia('(min-width: 760px)')
  const titleRef = useRef(null)
  const stripRef = useRef(null)
  const watchId = useRef(null)

  const places = useMemo(() => toPlaces(stores, mts), [stores, mts])
  const order = useMemo(() => cardOrder(places), [places])
  const allIds = useMemo(() => new Set(places.map((p) => p.id)), [places])
  const selected = places.find((p) => p.id === selectedId) ?? null
  const { prev, next } = selected ? placeNeighbors(order, selected.id) : {}

  // 지금 탭(과 열린 상세)을 URL에: ?tab=map&shop=06. 단톡방에 그대로 공유할 수 있게
  useEffect(() => {
    if (isEditMode) return
    const q = new URLSearchParams(window.location.search)
    q.set('tab', tab)
    if (tab !== 'tt') q.delete('team') // 팀은 타임테이블 탭에서만 (localStorage에도 남는다)
    if (detailOpen && selectedId) q.set('shop', selectedId)
    else q.delete('shop')
    q.delete('view')
    history.replaceState(history.state, '', `${window.location.pathname}?${q}`)
  }, [tab, selectedId, detailOpen])

  const toastTimer = useRef(0)
  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }, [])

  const select = useCallback((id) => setSelectedId(id), [])
  const open = useCallback((id) => {
    setSelectedId(id)
    setDetailOpen(true)
  }, [])
  const closeDetail = useCallback(() => setDetailOpen(false), [])

  // 핀: 다른 곳이면 고르고(카드 줄이 따라옴), 이미 고른 곳이면 상세
  const pick = useCallback((id) => (id === selectedId ? setDetailOpen(true) : setSelectedId(id)), [selectedId])

  const chooseTab = (key) => {
    setTab(key)
    setDetailOpen(false)
  }
  // 타임테이블 [지도]: 지도 탭에서 그 장소를 고른다
  const showOnMap = (id) => {
    setTab('map')
    setDetailOpen(false)
    setSelectedId(id)
  }
  // 상점가 그리드: 지도 탭에서 그 장소 상세를 바로 연다
  const openFromGrid = (id) => {
    setTab('map')
    open(id)
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

  // 키보드: 상세에서 ←/→ 이전·다음 장소, ESC 닫기 (라이트박스가 열려 있으면 라이트박스가 처리)
  useEffect(() => {
    if (isEditMode) return undefined
    const onKey = (e) => {
      if (lightbox != null || !detailOpen) return
      if (e.key === 'Escape') closeDetail()
      else if (e.key === 'ArrowLeft' && prev) select(prev.id)
      else if (e.key === 'ArrowRight' && next) select(next.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, detailOpen, prev, next, select, closeDetail])

  // 지도 초점 영역: 제목 박스 아래 ~ 카드 줄 위 (실제 요소 위치를 재서 safe-area까지 맞춘다)
  const [frame, setFrame] = useState({ top: 76, bottom: 196, vw: window.innerWidth })
  useEffect(() => {
    const measure = () => {
      const t = titleRef.current?.getBoundingClientRect()
      const s = stripRef.current?.getBoundingClientRect()
      setFrame({ top: t ? t.bottom + 8 : 76, bottom: s ? window.innerHeight - s.top : 196, vw: window.innerWidth })
    }
    measure()
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
    }
  }, [tab])
  const insets = useMemo(
    () => ({ top: frame.top, bottom: frame.bottom, left: 0, right: wide && detailOpen ? 440 : 64 }),
    [frame, wide, detailOpen],
  )
  // 이름표가 가리면 안 되는 자리: 오른쪽 위 버튼 2개
  const blocked = useMemo(() => [{ x1: frame.vw - 12 - 44 - 4, x2: frame.vw, y1: 0, y2: frame.top + 44 }], [frame])

  if (isEditMode) {
    return (
      <div className="flex h-dvh flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-black px-4">
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

  const onMap = tab === 'map'

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* 지도: 화면 전체. 다른 탭에서도 뒤에 남아 있다 */}
      <div className="fixed inset-0">
        {KAKAO_MAP_KEY && !kakaoFailed ? (
          <KakaoMain
            appKey={KAKAO_MAP_KEY}
            places={places}
            selectedId={selectedId}
            activeIds={allIds}
            insets={insets}
            blocked={blocked}
            fitKey="all:0"
            threeD={threeD}
            me={me}
            onPick={pick}
            onLoadError={() => setKakaoFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#f5f5f5] px-8 text-center text-[15px] text-[#888]">지도를 불러오지 못했어요. 상점가 탭에서 장소를 볼 수 있어요.</div>
        )}
      </div>

      {onMap && (
        <>
          {/* 왼쪽 위 제목 박스 */}
          <header
            ref={titleRef}
            className="fixed left-3 right-[68px] z-30 border border-black bg-white px-3 py-[7px] desk:right-auto desk:w-[360px]"
            style={{ top: 'calc(env(safe-area-inset-top) + 10px)' }}
          >
            <small className="block text-[11px] text-[#888]">
              {site.org} · {site.term}
            </small>
            <h1 className="truncate text-base font-bold">{site.title}</h1>
          </header>

          {/* 오른쪽 위: 내 위치, 3D (확대·축소는 핀치) */}
          <div className="fixed right-3 z-30 flex flex-col" style={{ top: 'calc(env(safe-area-inset-top) + 10px)' }}>
            <button type="button" aria-pressed={locating} aria-label="내 위치" onClick={toggleLocate} className={`${tool(locating)} text-lg`}>
              ◎
            </button>
            <button type="button" aria-pressed={threeD} aria-label="3D 보기" onClick={() => setThreeD((v) => !v)} className={`${tool(threeD)} -mt-px`}>
              3D
            </button>
          </div>

          <CardStrip ref={stripRef} places={order} selectedId={selectedId} onSelect={select} onOpen={open} />
        </>
      )}

      {tab === 'tt' && <Timetable onShowPlace={showOnMap} />}
      {tab === 'shop' && <ShopGrid places={places} onOpen={openFromGrid} />}
      {tab === 'notice' && <Notice />}
      {tab === 'call' && <Contacts />}

      <PlaceSheet
        place={selected}
        index={selected ? order.findIndex((p) => p.id === selected.id) : 0}
        total={order.length}
        prev={prev}
        next={next}
        open={detailOpen && Boolean(selected)}
        onClose={closeDetail}
        onGo={select}
        onOpenPhoto={setLightbox}
      />

      <TabBar tab={tab} onTab={chooseTab} />

      {toast && (
        <div role="status" className="fixed left-1/2 z-[90] -translate-x-1/2 whitespace-nowrap bg-black px-4 py-3 text-sm text-white" style={{ top: 'calc(env(safe-area-inset-top) + 70px)' }}>
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
