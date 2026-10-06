import { useCallback, useEffect, useRef } from 'react'
import { Map, MapMarker, Polyline, useKakaoLoader } from 'react-kakao-maps-sdk'
import { MAP_CENTER, hasCoords, pinsFor } from '../data/stores.js'

// 카카오 레벨은 숫자가 작을수록 확대. 가게를 고르면 이 레벨까지 확대한다
const FOCUS_LEVEL = 1

// 번호 핀: 검은 원 + 흰 숫자, 선택되면 흰 원 + 검은 숫자로 살짝 크게. (MapMarker는 드래그가 되므로 SVG 이미지로 그린다)
const pinImage = (id, { active, unplaced }) => {
  const size = active ? 34 : 26
  const c = size / 2
  const fill = active ? '#fff' : unplaced ? '#888' : '#000'
  const text = active ? '#000' : '#fff'
  const stroke = active ? '#000' : '#fff'
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<circle cx="${c}" cy="${c}" r="${c - 1}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>` +
    `<text x="${c}" y="${c}" dy="0.36em" text-anchor="middle" fill="${text}" font-size="${active ? 14 : 11}" font-weight="700" ` +
    `font-family="Pretendard Variable, Pretendard, sans-serif">${Number(id)}</text></svg>`
  return {
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    size: { width: size, height: size },
    options: { offset: { x: c, y: c } },
  }
}

export default function KakaoMapView({ appKey, stores, selectedId, onSelect, editMode, onMove, onLoadError }) {
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

  const placed = stores.filter(hasCoords)
  const visible = pinsFor(stores, editMode, MAP_CENTER)
  const selected = stores.find((s) => s.id === selectedId) ?? null

  // 처음 한 번 전체 핀이 다 보이게. onCreate는 참조가 바뀌면 <Map>이 다시 실행하므로 useCallback으로 고정
  const placedRef = useRef(placed)
  placedRef.current = placed
  const handleCreate = useCallback((map) => {
    if (mapRef.current === map) return
    mapRef.current = map
    requestAnimationFrame(() => {
      map.relayout()
      const bounds = new kakao.maps.LatLngBounds()
      placedRef.current.forEach((s) => bounds.extend(new kakao.maps.LatLng(s.lat, s.lng)))
      if (!bounds.isEmpty()) map.setBounds(bounds, 40, 40, 40, 40)
    })
  }, [])

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

  if (error) return null
  if (loading) {
    return <div className="flex h-full w-full items-center justify-center bg-[#eee] text-xs text-[#888]">지도를 불러오는 중…</div>
  }

  return (
    <div ref={containerRef} className="kakao-map-bw relative h-full w-full">
      {/* 카카오 기본 줌 컨트롤은 파란색이라 흑백 톤에 맞춘 버튼을 직접 둔다 */}
      <div className="absolute left-2.5 top-2.5 z-10 flex flex-col border border-black bg-white">
        <button type="button" aria-label="확대" onClick={() => zoomBy(-1)} className="h-8 w-8 border-b border-black text-lg leading-none hover:bg-[#eee]">+</button>
        <button type="button" aria-label="축소" onClick={() => zoomBy(1)} className="h-8 w-8 text-lg leading-none hover:bg-[#eee]">−</button>
      </div>
      <Map center={{ lat: MAP_CENTER[0], lng: MAP_CENTER[1] }} level={3} style={{ width: '100%', height: '100%' }} onCreate={handleCreate}>
        <Polyline
          path={placed.map((s) => ({ lat: s.lat, lng: s.lng }))}
          strokeWeight={2}
          strokeColor="#000"
          strokeOpacity={0.8}
          strokeStyle="shortdot"
        />
        {visible.map((s) => (
          <MapMarker
            key={s.id}
            position={{ lat: s.lat, lng: s.lng }}
            image={pinImage(s.id, { active: s.id === selectedId, unplaced: s.unplaced })}
            zIndex={s.id === selectedId ? 10 : 1}
            title={s.name}
            clickable
            draggable={editMode}
            onClick={() => onSelect(s.id)}
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
