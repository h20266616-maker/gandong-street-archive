import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import { hasCoords } from '../data/stores.js'

const FALLBACK_CENTER = [38.0546, 127.8173]

const pinIcon = (id, { active, unplaced }) =>
  L.divIcon({
    className: 'pin-icon',
    html: `<div class="pin${active ? ' is-active' : ''}${unplaced ? ' is-unplaced' : ''}">${Number(id)}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })

// 처음 한 번만 전체 핀이 보이게 맞춘다
function FitAll({ points }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (done.current || points.length === 0) return
    done.current = true
    map.fitBounds(points, { padding: [40, 40], maxZoom: 18 })
  }, [map, points])
  return null
}

function FlyToSelected({ store }) {
  const map = useMap()
  const lat = store?.lat
  const lng = store?.lng
  useEffect(() => {
    if (lat != null && lng != null) map.flyTo([lat, lng], Math.max(map.getZoom(), 18), { duration: 0.6 })
  }, [map, store?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export default function MapView({ stores, selectedId, onSelect, editMode, onMove }) {
  const placed = stores.filter(hasCoords)
  const path = placed.map((s) => [s.lat, s.lng])

  // 편집 모드에서는 좌표 없는 가게도 회색 핀으로 띄워서 옮길 수 있게 한다
  let unplacedIndex = 0
  const visible = editMode
    ? stores.map((s) => {
        if (hasCoords(s)) return s
        const offset = unplacedIndex++ * 0.0004
        return { ...s, lat: FALLBACK_CENTER[0] - 0.0004, lng: FALLBACK_CENTER[1] - 0.0004 + offset, unplaced: true }
      })
    : placed

  const selected = stores.find((s) => s.id === selectedId) ?? null

  return (
    <MapContainer center={FALLBACK_CENTER} zoom={17} scrollWheelZoom className="h-full w-full">
      <TileLayer
        className="map-tiles-bw"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      <Polyline positions={path} pathOptions={{ color: '#000', weight: 1.5, dashArray: '2 6', opacity: 0.8 }} />
      {visible.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={pinIcon(s.id, { active: s.id === selectedId, unplaced: s.unplaced })}
          zIndexOffset={s.id === selectedId ? 1000 : 0}
          title={s.name}
          draggable={editMode}
          eventHandlers={{
            click: () => onSelect(s.id),
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng()
              onMove(s.id, lat, lng)
            },
          }}
        />
      ))}
      <FitAll points={path} />
      <FlyToSelected store={selected} />
    </MapContainer>
  )
}
