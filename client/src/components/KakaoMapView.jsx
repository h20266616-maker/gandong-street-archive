import { useCallback, useEffect, useRef, useState } from 'react'
import { Map, MapMarker, Polyline, useKakaoLoader } from 'react-kakao-maps-sdk'
import { MAP_CENTER, hasCoords, pinsFor, streetStores } from '../data/stores.js'
import AnnexToggle from './AnnexToggle.jsx'

// 카카오 레벨은 숫자가 작을수록 확대. 가게를 고르면 이 레벨까지 확대한다
const FOCUS_LEVEL = 1

const svgImage = (svg, width, height) => ({
  src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  size: { width, height },
  options: { offset: { x: width / 2, y: height / 2 } },
})

const INK = '#1E1E1C'
const ACCENT = '#E0705D'
const FONT = 'font-family="IBM Plex Mono, ui-monospace, Consolas, monospace" font-weight="600"'

// 모노 번호 사각 라벨: 흰 배경 + 검은 1px 테두리, 선택·hover 시 코랄. 별관은 점선 테두리 "01 별관"
// (MapMarker는 드래그가 되므로 SVG 이미지로 그린다)
const pinImage = (s, { on, unplaced }) => {
  const label = s.annex ? `${s.id} 별관` : s.id
  const w = s.annex ? 54 : 26
  const h = 20
  const fill = on ? ACCENT : unplaced ? '#85827B' : '#fff'
  const stroke = on ? ACCENT : INK
  const text = on || unplaced ? '#fff' : INK
  return svgImage(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="${fill}" stroke="${stroke}" stroke-width="1"${s.annex ? ' stroke-dasharray="3 2"' : ''}/>` +
      `<text x="${w / 2}" y="${h / 2}" dy="0.35em" text-anchor="middle" fill="${text}" font-size="11" ${FONT}>${label}</text></svg>`,
    w,
    h,
  )
}

export default function KakaoMapView({ appKey, stores, activeIds, selectedId, onSelect, editMode, onMove, onLoadError }) {
  const [hoverId, setHoverId] = useState(null)
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

  const street = streetStores(stores)
  const annex = stores.find((s) => s.annex && hasCoords(s))
  const visible = pinsFor(stores, editMode, MAP_CENTER)
  const selected = stores.find((s) => s.id === selectedId) ?? null

  // 상점가 가게(별관 제외)가 다 보이게 범위를 맞춘다
  const streetRef = useRef(street)
  streetRef.current = street
  const fitStreet = useCallback((map) => {
    const bounds = new kakao.maps.LatLngBounds()
    streetRef.current.forEach((s) => bounds.extend(new kakao.maps.LatLng(s.lat, s.lng)))
    if (!bounds.isEmpty()) map.setBounds(bounds, 40, 40, 40, 40)
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
    // 애니메이션 줌 도중에 panTo를 하면 줌이 취소되므로, 줌은 즉시 하고 이동만 부드럽게
    if (map.getLevel() > FOCUS_LEVEL) map.setLevel(FOCUS_LEVEL)
    map.panTo(new kakao.maps.LatLng(selected.lat, selected.lng))
  }, [selected?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const zoomBy = (delta) => {
    const map = mapRef.current
    if (map) map.setLevel(map.getLevel() + delta, { animate: true })
  }

  const backToStreet = () => {
    onSelect(null)
    if (mapRef.current) fitStreet(mapRef.current)
  }

  if (error) return null
  if (loading) {
    return <div className="flex h-full w-full items-center justify-center bg-line text-xs text-pencil">지도를 불러오는 중…</div>
  }

  return (
    <div ref={containerRef} className="kakao-map-bw relative h-full w-full">
      {/* 카카오 기본 줌 컨트롤은 파란색이라 흑백 톤에 맞춘 버튼을 직접 둔다 */}
      <div className="absolute left-2.5 top-2.5 z-10 flex flex-col border border-ink bg-card">
        <button type="button" aria-label="확대" onClick={() => zoomBy(-1)} className="h-8 w-8 border-b border-ink text-lg leading-none hover:bg-paper">+</button>
        <button type="button" aria-label="축소" onClick={() => zoomBy(1)} className="h-8 w-8 text-lg leading-none hover:bg-paper">−</button>
      </div>
      <AnnexToggle annex={annex} viewing={Boolean(selected?.annex)} onGo={() => onSelect(annex.id)} onBack={backToStreet} />
      <Map center={{ lat: MAP_CENTER[0], lng: MAP_CENTER[1] }} level={3} style={{ width: '100%', height: '100%' }} onCreate={handleCreate}>
        <Polyline
          path={street.map((s) => ({ lat: s.lat, lng: s.lng }))}
          strokeWeight={2}
          strokeColor={INK}
          strokeOpacity={0.8}
          strokeStyle="shortdot"
        />
        {visible.map((s) => (
          <MapMarker
            key={s.id}
            position={{ lat: s.lat, lng: s.lng }}
            image={pinImage(s, { on: s.id === selectedId || s.id === hoverId, unplaced: s.unplaced })}
            opacity={!activeIds || activeIds.has(s.id) ? 1 : 0.2}
            zIndex={s.id === selectedId ? 10 : 1}
            title={s.name}
            clickable
            draggable={editMode}
            onClick={() => onSelect(s.id)}
            onMouseOver={() => setHoverId(s.id)}
            onMouseOut={() => setHoverId((id) => (id === s.id ? null : id))}
            onDragEnd={(marker) => {
              const p = marker.getPosition()
              onMove(s.id, p.getLat(), p.getLng())
            }}
          />
        ))}
      </Map>
    </div>
  )
}
