import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import { MAP_CENTER as FALLBACK_CENTER, hasCoords, pinsFor, streetStores } from '../data/stores.js'
import AnnexToggle from './AnnexToggle.jsx'

const pinIcon = (id, { active, unplaced }) =>
  L.divIcon({
    className: 'pin-icon',
    html: `<div class="pin${active ? ' is-active' : ''}${unplaced ? ' is-unplaced' : ''}">${id}</div>`,
    iconSize: [26, 20],
    iconAnchor: [13, 10],
  })

const annexIcon = (id, { active }) =>
  L.divIcon({
    className: 'pin-icon',
    html: `<div class="pin-annex${active ? ' is-active' : ''}">${id} 별관</div>`,
    iconSize: [54, 20],
    iconAnchor: [27, 10],
  })

const fitStreet = (map, points) => {
  if (points.length) map.fitBounds(points, { padding: [40, 40], maxZoom: 18 })
}

// 처음 한 번만 상점가 핀(별관 제외)이 다 보이게 맞춘다
function FitStreet({ points }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (done.current || points.length === 0) return
    done.current = true
    fitStreet(map, points)
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

export default function MapView({ stores, activeIds, selectedId, onSelect, editMode, onMove }) {
  const [map, setMap] = useState(null)
  const path = streetStores(stores).map((s) => [s.lat, s.lng])
  const annex = stores.find((s) => s.annex && hasCoords(s))
  const visible = pinsFor(stores, editMode, FALLBACK_CENTER)
  const selected = stores.find((s) => s.id === selectedId) ?? null

  return (
    <div className="relative h-full w-full">
      <AnnexToggle
        annex={annex}
        viewing={Boolean(selected?.annex)}
        onGo={() => onSelect(annex.id)}
        onBack={() => {
          onSelect(null)
          if (map) fitStreet(map, path)
        }}
      />
      <MapContainer center={FALLBACK_CENTER} zoom={17} scrollWheelZoom className="h-full w-full" ref={setMap}>
        <TileLayer
          className="map-tiles-bw"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        <Polyline positions={path} pathOptions={{ color: '#1E1E1C', weight: 1.5, dashArray: '2 6', opacity: 0.8 }} />
        {visible.map((s) => (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={s.annex ? annexIcon(s.id, { active: s.id === selectedId }) : pinIcon(s.id, { active: s.id === selectedId, unplaced: s.unplaced })}
            opacity={!activeIds || activeIds.has(s.id) ? 1 : 0.2}
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
        <FitStreet points={path} />
        <FlyToSelected store={selected} />
      </MapContainer>
    </div>
  )
}
