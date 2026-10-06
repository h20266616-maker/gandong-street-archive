import { useCallback, useEffect, useRef } from 'react'
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk'
import { MAP_CENTER, pinsFor, streetStores } from '../data/stores.js'

// ?edit 전용: 카카오맵에서 핀을 끌어 실제 위치를 맞춘다
const pinImage = (id, unplaced) => {
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

export default function EditMap({ appKey, stores, onMove }) {
  const [loading, error] = useKakaoLoader({ appkey: appKey })
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const streetRef = useRef(streetStores(stores))
  streetRef.current = streetStores(stores)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined
    const observer = new ResizeObserver(() => mapRef.current?.relayout())
    observer.observe(el)
    return () => observer.disconnect()
  }, [loading])

  const handleCreate = useCallback((map) => {
    if (mapRef.current === map) return
    mapRef.current = map
    requestAnimationFrame(() => {
      map.relayout()
      const bounds = new kakao.maps.LatLngBounds()
      streetRef.current.forEach((s) => bounds.extend(new kakao.maps.LatLng(s.lat, s.lng)))
      if (!bounds.isEmpty()) map.setBounds(bounds, 48, 48, 48, 48)
    })
  }, [])

  if (error) return <p className="p-4 text-sm">카카오맵을 불러오지 못했다. 이 주소가 카카오 앱의 JavaScript SDK 도메인에 등록돼 있는지 확인.</p>
  if (loading) return <p className="p-4 text-sm text-[#888]">지도를 불러오는 중</p>

  return (
    <div ref={containerRef} className="kakao-map h-full w-full">
      <Map center={{ lat: MAP_CENTER[0], lng: MAP_CENTER[1] }} level={3} style={{ width: '100%', height: '100%' }} onCreate={handleCreate}>
        {pinsFor(stores, true, MAP_CENTER).map((s) => (
          <MapMarker
            key={s.id}
            position={{ lat: s.lat, lng: s.lng }}
            image={pinImage(s.id, s.unplaced)}
            title={s.name}
            draggable
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
