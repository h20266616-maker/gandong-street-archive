import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { MAP_CENTER as FALLBACK_CENTER, hasCoords, pinsFor, streetStores } from '../data/stores.js'
import MapControls from './MapControls.jsx'
import PinPreview from './PinPreview.jsx'

// 카카오맵을 못 쓸 때(키 없음·도메인 미등록) 쓰는 OpenStreetMap 지도. 모양과 동작은 카카오 쪽과 같다

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const pinIcon = (s, { on }) => {
  const label = s.annex ? `${s.id} 별관` : s.id
  const w = s.annex ? 52 : 24
  return L.divIcon({
    className: 'pin-icon',
    html: `<div class="pin${on ? ' is-on' : ''}${s.unplaced ? ' is-unplaced' : ''}">${label}</div>`,
    iconSize: [w, 20],
    iconAnchor: [w / 2, 10],
  })
}

const fitStreet = (map, points) => {
  if (points.length) map.fitBounds(points, { padding: [48, 48], maxZoom: 18, animate: false })
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

// 지도를 끌거나 확대하면 미리보기를 닫는다
function ClosePreviewOnMove({ onHover }) {
  useMapEvents({ movestart: () => onHover(null), zoomstart: () => onHover(null) })
  return null
}

function PanToSelected({ store }) {
  const map = useMap()
  const lat = store?.lat
  const lng = store?.lng
  useEffect(() => {
    if (lat != null && lng != null) map.panTo([lat, lng], { animate: !reducedMotion() })
  }, [map, store?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export default function MapView({ stores, selectedId, hoverId, previewId, onHover, onLeave, onSelect, editMode, onMove }) {
  const [map, setMap] = useState(null)
  const path = streetStores(stores).map((s) => [s.lat, s.lng])
  const annex = stores.find((s) => s.annex && hasCoords(s))
  const pins = pinsFor(stores, editMode, FALLBACK_CENTER)
  const selected = stores.find((s) => s.id === selectedId) ?? null

  // 미리보기: 카카오 쪽과 같이 지도 위 일반 div. 핀 오른쪽, 화면 밖이면 왼쪽, 위·아래 끝이면 안쪽으로
  const preview = !editMode && previewId ? pins.find((s) => s.id === previewId) : null
  let previewStyle = null
  if (preview && map) {
    const pt = map.latLngToContainerPoint([preview.lat, preview.lng])
    const { x: w, y: h } = map.getSize()
    const cardW = 182
    const cardH = 172
    previewStyle = {
      left: pt.x + 18 + cardW > w - 8 ? pt.x - 18 - cardW : pt.x + 18,
      top: Math.min(Math.max(pt.y - cardH / 2, 8), h - cardH - 8),
    }
  }

  return (
    <div className="relative h-full w-full">
      <MapControls
        annex={annex}
        viewingAnnex={Boolean(selected?.annex)}
        onAnnex={() => onSelect(annex.id)}
        onBack={() => {
          onSelect(null)
          if (map) fitStreet(map, path)
        }}
        onZoomIn={() => map?.zoomIn()}
        onZoomOut={() => map?.zoomOut()}
      />
      <MapContainer center={FALLBACK_CENTER} zoom={17} zoomControl={false} scrollWheelZoom className="h-full w-full" ref={setMap}>
        <TileLayer
          className="map-tiles-bw"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        {pins.map((s) => {
          const on = s.id === selectedId || s.id === hoverId
          return (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              icon={pinIcon(s, { on })}
              zIndexOffset={on ? 1000 : 0}
              title={s.name}
              draggable={editMode}
              eventHandlers={{
                click: () => onSelect(s.id),
                mouseover: () => onHover(s.id, 'map'),
                mouseout: () => onLeave(s.id),
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng()
                  onMove(s.id, lat, lng)
                },
              }}
            />
          )
        })}
        <FitStreet points={path} />
        <PanToSelected store={selected} />
        <ClosePreviewOnMove onHover={onHover} />
      </MapContainer>
      {previewStyle && (
        <div className="pin-preview pointer-events-none absolute z-[900] border border-black" style={previewStyle}>
          <PinPreview store={preview} />
        </div>
      )}
    </div>
  )
}
