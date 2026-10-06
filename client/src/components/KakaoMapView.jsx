import { useCallback, useEffect, useRef } from 'react'
import { CustomOverlayMap, Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk'
import { MAP_CENTER, hasCoords, pinsFor, streetStores } from '../data/stores.js'
import MapControls from './MapControls.jsx'
import PinPreview from './PinPreview.jsx'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ?edit 모드 전용 드래그 핀 (CustomOverlay는 드래그가 안 돼서 MapMarker + SVG로 같은 모양을 그린다)
const editPinImage = (id, unplaced) => {
  const w = 24
  const h = 20
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="${unplaced ? '#888' : '#fff'}" stroke="#000"/>` +
    `<text x="${w / 2}" y="${h / 2}" dy="0.35em" text-anchor="middle" fill="${unplaced ? '#fff' : '#000'}" font-size="11" font-weight="600" ` +
    `font-family="Pretendard Variable, Pretendard, sans-serif">${id}</text></svg>`
  return {
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    size: { width: w, height: h },
    options: { offset: { x: w / 2, y: h / 2 } },
  }
}

// 카카오 오버레이 안에서는 마우스 이벤트가 React까지 올라오지 않아서 네이티브 리스너를 직접 붙인다
function OverlayPin({ store, on, onHover, onLeave, onSelect }) {
  const ref = useRef(null)
  const latest = useRef({ onHover, onLeave, onSelect })
  latest.current = { onHover, onLeave, onSelect }

  useEffect(() => {
    const el = ref.current
    const enter = () => latest.current.onHover(store.id, 'map')
    const leave = () => latest.current.onLeave(store.id)
    const click = () => latest.current.onSelect(store.id)
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    el.addEventListener('focus', enter)
    el.addEventListener('blur', leave)
    el.addEventListener('click', click)
    return () => {
      el.removeEventListener('mouseenter', enter)
      el.removeEventListener('mouseleave', leave)
      el.removeEventListener('focus', enter)
      el.removeEventListener('blur', leave)
      el.removeEventListener('click', click)
    }
  }, [store.id])

  return (
    <button ref={ref} type="button" title={store.name} aria-label={`${store.id} ${store.name}`} className={`pin${on ? ' is-on' : ''}`}>
      {store.annex ? `${store.id} 별관` : store.id}
    </button>
  )
}

export default function KakaoMapView({ appKey, stores, selectedId, hoverId, previewId, onHover, onLeave, onSelect, editMode, onMove, onLoadError }) {
  const [loading, error] = useKakaoLoader({ appkey: appKey })
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (error) onLoadError()
  }, [error, onLoadError])

  // 모바일↔데스크톱 전환처럼 컨테이너 크기가 바뀌면 지도 크기를 다시 계산한다
  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined
    const observer = new ResizeObserver(() => mapRef.current?.relayout())
    observer.observe(el)
    return () => observer.disconnect()
  }, [loading])

  const pins = pinsFor(stores, editMode, MAP_CENTER)
  const annex = stores.find((s) => s.annex && hasCoords(s))
  const selected = stores.find((s) => s.id === selectedId) ?? null

  // 상점가 가게(별관 제외)가 꽉 차게
  const streetRef = useRef(streetStores(stores))
  streetRef.current = streetStores(stores)
  const fitStreet = useCallback((map) => {
    const bounds = new kakao.maps.LatLngBounds()
    streetRef.current.forEach((s) => bounds.extend(new kakao.maps.LatLng(s.lat, s.lng)))
    if (!bounds.isEmpty()) map.setBounds(bounds, 48, 48, 48, 48)
  }, [])

  // onCreate는 참조가 바뀌면 <Map>이 다시 실행하므로 useCallback으로 고정
  const handleCreate = useCallback(
    (map) => {
      if (mapRef.current === map) return
      mapRef.current = map
      requestAnimationFrame(() => {
        map.relayout()
        fitStreet(map)
      })
    },
    [fitStreet],
  )

  // 가게를 고르면 그 핀으로 이동
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selected || !hasCoords(selected)) return
    const target = new kakao.maps.LatLng(selected.lat, selected.lng)
    if (reducedMotion()) map.setCenter(target)
    else map.panTo(target)
  }, [selected?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const zoomBy = (delta) => {
    const map = mapRef.current
    if (map) map.setLevel(map.getLevel() + delta, { animate: !reducedMotion() })
  }

  const backToStreet = () => {
    onSelect(null)
    if (mapRef.current) fitStreet(mapRef.current)
  }

  // 미리보기는 카카오 오버레이로 만들지 않는다. 오버레이를 추가·제거할 때마다 카카오가 핀 요소를 다시 붙여서
  // 커서 아래 핀에 mouseleave/mouseenter가 반복되고 클릭이 사라지기 때문. 대신 지도 위에 일반 div로 띄운다.
  // 핀 오른쪽에 두고, 화면 밖으로 나가면 왼쪽으로, 위·아래 끝이면 안쪽으로 붙인다
  const preview = !editMode && previewId ? pins.find((s) => s.id === previewId) : null
  let previewStyle = null
  if (preview && mapRef.current && containerRef.current) {
    const pt = mapRef.current.getProjection().containerPointFromCoords(new kakao.maps.LatLng(preview.lat, preview.lng))
    const { clientWidth: w, clientHeight: h } = containerRef.current
    const cardW = 182
    const cardH = 172
    const left = pt.x + 18 + cardW > w - 8 ? pt.x - 18 - cardW : pt.x + 18
    const top = Math.min(Math.max(pt.y - cardH / 2, 8), h - cardH - 8)
    previewStyle = { left, top }
  }

  if (error) return null
  if (loading) {
    return <div className="flex h-full w-full items-center justify-center bg-[#f5f5f5] text-xs text-[#888]">지도를 불러오는 중</div>
  }

  return (
    <div ref={containerRef} className="kakao-map relative h-full w-full">
      <MapControls
        annex={annex}
        viewingAnnex={Boolean(selected?.annex)}
        onAnnex={() => onSelect(annex.id)}
        onBack={backToStreet}
        onZoomIn={() => zoomBy(-1)}
        onZoomOut={() => zoomBy(1)}
      />
      <Map center={{ lat: MAP_CENTER[0], lng: MAP_CENTER[1] }} level={3} style={{ width: '100%', height: '100%' }}
        onCreate={handleCreate}
        onDragStart={() => onHover(null)}
        onZoomStart={() => onHover(null)}
      >
        {editMode
          ? pins.map((s) => (
              <MapMarker
                key={s.id}
                position={{ lat: s.lat, lng: s.lng }}
                image={editPinImage(s.id, s.unplaced)}
                title={s.name}
                draggable
                onClick={() => onSelect(s.id)}
                onDragEnd={(marker) => {
                  const p = marker.getPosition()
                  onMove(s.id, p.getLat(), p.getLng())
                }}
              />
            ))
          : pins.map((s) => {
              const on = s.id === selectedId || s.id === hoverId
              return (
                // zIndex를 hover로 바꾸면 카카오가 오버레이를 다시 붙여서 hover가 깜빡이므로 선택 여부로만 정한다
                <CustomOverlayMap key={s.id} position={{ lat: s.lat, lng: s.lng }} xAnchor={0.5} yAnchor={0.5} zIndex={s.id === selectedId ? 3 : 1} clickable>
                  <OverlayPin store={s} on={on} onHover={onHover} onLeave={onLeave} onSelect={onSelect} />
                </CustomOverlayMap>
              )
            })}
      </Map>
      {previewStyle && (
        <div className="pin-preview pointer-events-none absolute z-[900] border border-black" style={previewStyle}>
          <PinPreview store={preview} />
        </div>
      )}
    </div>
  )
}
