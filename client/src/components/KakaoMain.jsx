import { useCallback, useEffect, useRef, useState } from 'react'
import { Circle, CustomOverlayMap, Map, useKakaoLoader } from 'react-kakao-maps-sdk'
import { MAP_CENTER } from '../data/stores.js'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 이름표 너비: 실제 글꼴로 잰다 (캐시)
const widthCache = new globalThis.Map()
const labelWidth = (text) => {
  if (!widthCache.has(text)) {
    const ctx = (labelWidth.canvas ??= document.createElement('canvas')).getContext('2d')
    ctx.font = '700 12px "Pretendard Variable", Pretendard, sans-serif'
    widthCache.set(text, Math.ceil(ctx.measureText(text).width) + 6)
  }
  return widthCache.get(text)
}
const overlap = (a, b) => Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) * Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1))

// MT 이름표 자리 정하기: 오른쪽 → 왼쪽 → 위 → 아래 중 다른 핀·이름표·버튼과 겹치지 않고 보이는 영역 안인 첫 자리.
// 다 겹치면 가장 덜 겹치는 자리
function placeLabels(items, area, blocked) {
  const BADGE = 15
  const H = 16
  const badges = items.map(({ id, x, y }) => ({ id, x1: x - BADGE, y1: y - BADGE, x2: x + BADGE, y2: y + BADGE }))
  const placed = []
  const sides = {}
  for (const it of items) {
    const w = labelWidth(it.name)
    const cand = {
      right: { x1: it.x + BADGE + 4, x2: it.x + BADGE + 4 + w, y1: it.y - H / 2, y2: it.y + H / 2 },
      left: { x1: it.x - BADGE - 4 - w, x2: it.x - BADGE - 4, y1: it.y - H / 2, y2: it.y + H / 2 },
      top: { x1: it.x - w / 2, x2: it.x + w / 2, y1: it.y - BADGE - 3 - H, y2: it.y - BADGE - 3 },
      bottom: { x1: it.x - w / 2, x2: it.x + w / 2, y1: it.y + BADGE + 3, y2: it.y + BADGE + 3 + H },
    }
    let best = null
    for (const [side, r] of Object.entries(cand)) {
      const outside = (r.x1 < area.x1 ? area.x1 - r.x1 : 0) + (r.x2 > area.x2 ? r.x2 - area.x2 : 0) + (r.y1 < area.y1 ? area.y1 - r.y1 : 0) + (r.y2 > area.y2 ? r.y2 - area.y2 : 0)
      const hit = [...badges.filter((b) => b.id !== it.id), ...placed, ...blocked].reduce((n, o) => n + overlap(r, o), 0) + outside * H
      if (!best || hit < best.hit) best = { side, r, hit }
      if (hit === 0) break
    }
    sides[it.id] = best.side
    placed.push(best.r)
  }
  return sides
}

// 카카오 오버레이 안에서는 React 이벤트가 올라오지 않아서 네이티브 click을 직접 단다
function useNativeClick(onClick) {
  const ref = useRef(null)
  const latest = useRef(onClick)
  latest.current = onClick
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const h = (e) => {
      e.stopPropagation()
      latest.current()
    }
    el.addEventListener('click', h)
    return () => el.removeEventListener('click', h)
  }, [])
  return ref
}

// 핀 머리: 대표 종류로 정한다. MT 장소는 검은 사각, 간판 전용 장소는 흰 마름모 (상점가 가게는 태그가 더 있어도 원)
const PinHead = ({ place, on }) =>
  place.kind === 'sign' ? (
    <span className={`pin-sign ${on ? 'is-on' : ''}`}>
      <span>{place.id}</span>
    </span>
  ) : (
    <span className={`pin-mt ${on ? 'is-on' : ''}`}>{place.id}</span>
  )

// 핀. 보이는 크기보다 사방 8px 넓은 터치 영역.
// 이름표는 상자 밖으로 띄운다(absolute): 상자 크기에 들어가면 카카오가 '핀 + 이름표' 전체의 가운데를 좌표에 맞춰서 핀이 밀린다
function FlatPin({ place, on, side = 'right', onPick }) {
  const ref = useNativeClick(() => onPick(place.id))
  const square = place.kind === 'mt' || place.kind === 'sign'
  return (
    <button ref={ref} type="button" aria-label={`${place.label} ${place.name}`} className="pin-hit">
      {square ? (
        <span className="relative block">
          <PinHead place={place} on={on} />
          <span className={`pin-name pin-name-side side-${side}`}>{place.name}</span>
        </span>
      ) : (
        <span className="flex flex-col items-center">
          <span className="relative block">
            <span className={`pin-shop ${on ? 'is-on' : ''}`}>{place.id}</span>
            {on && <span className={`pin-name pin-name-side side-${side}`}>{place.name}</span>}
          </span>
          <span className="pin-tail" />
        </span>
      )}
    </button>
  )
}

// 카카오맵 기본 평면 모드. 이동·핀치 확대는 카카오가 처리하고, 핀은 지도 위 CustomOverlayMap으로 그린다
export default function KakaoMain({ appKey, places, selectedId, insets, blocked = [], fitKey, fitSkipFocus = false, me, onPick, onLoadError }) {
  const [loading, error] = useKakaoLoader({ appkey: appKey })
  const outerRef = useRef(null)
  const mapRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  // 이름표 자리는 지도가 멈췄을 때(idle)만 다시 계산한다. 끄는 동안 매 프레임 다시 그리면 폰에서 버벅인다
  const [, setIdleTick] = useState(0)
  const insetsRef = useRef(insets)
  insetsRef.current = insets

  useEffect(() => {
    if (error) onLoadError()
  }, [error, onLoadError])

  // 지도 컨테이너 크기가 바뀌면(화면 회전 등) 중심을 지킨 채 다시 계산.
  // relayout만 하면 카카오는 왼쪽 위를 고정해서 중심이 밀린다
  useEffect(() => {
    const el = outerRef.current
    if (!el) return undefined
    const ro = new ResizeObserver(() => {
      const map = mapRef.current
      if (!map) return
      const c = map.getCenter()
      map.relayout()
      map.setCenter(c)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [loading])

  // ----- 화면 맞추기 (시트·패널에 가리지 않는 영역 기준) -----
  // 여백: 위는 제목·필터 아래, 아래는 카드 줄·탭바 위, 좌우 80px (MT 이름표가 화면 밖으로 잘리지 않게)
  const fitPlaces = useCallback((list) => {
    const map = mapRef.current
    if (!map || !list.length) return
    const b = new kakao.maps.LatLngBounds()
    list.forEach((p) => b.extend(new kakao.maps.LatLng(p.lat, p.lng)))
    const { top, right, bottom } = insetsRef.current
    map.setBounds(b, top + 8, Math.max(80, right), bottom + 4, 80)
  }, [])

  // 보이는 영역의 가운데에 좌표가 오도록 panTo
  const focusOn = useCallback((lat, lng) => {
    const map = mapRef.current
    const el = outerRef.current
    if (!map || !el) return
    const { top, right, bottom, left } = insetsRef.current
    const w = el.clientWidth
    const h = el.clientHeight
    const proj = map.getProjection()
    const p = proj.containerPointFromCoords(new kakao.maps.LatLng(lat, lng))
    const want = { x: left + (w - left - right) / 2, y: top + (h - top - bottom) / 2 }
    const center = proj.coordsFromContainerPoint(new kakao.maps.Point(w / 2 + (p.x - want.x), h / 2 + (p.y - want.y)))
    if (reducedMotion()) map.setCenter(center)
    else map.panTo(center)
  }, [])

  const handleCreate = useCallback((map) => {
    if (mapRef.current === map) return
    mapRef.current = map
    map.setDraggable(true)
    map.setZoomable(true)
    requestAnimationFrame(() => {
      map.relayout()
      setMapReady(true)
    })
  }, [])

  // 처음 화면과 필터 전환: 보이는 핀이 다 들어오게 (places는 이미 필터되고 좌표 있는 곳만)
  // 별관(식물의정석)은 3km 떨어져 있어서 범위에서 뺀다. 간판 필터에서는 간판 장소라서 넣는다
  // 필터를 눌러 맨 앞 카드가 골라졌을 때는 그 카드로 지도를 옮기지 않는다 (범위가 우선)
  const fitSelected = useRef(null)
  useEffect(() => {
    if (!mapReady) return
    fitPlaces(fitKey?.startsWith('sign:') ? places : places.filter((p) => p.kind !== 'annex'))
    fitSelected.current = fitSkipFocus ? selectedId : null
  }, [fitKey, mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // 고르면 보이는 영역 가운데로. 시트 높이가 바뀌어도 다시 맞춘다
  const selected = places.find((p) => p.id === selectedId)
  // (처음 범위 맞추기와 같은 프레임이면 바뀌기 전 화면 기준으로 계산되므로 한 박자 늦춘다)
  // 멀리서 보고 있었으면 고른 곳 근처로 확대한다 (상점가는 골목이 보이게, MT·간판 장소는 주변이 보이게)
  useEffect(() => {
    if (!mapReady || !selected) return undefined
    if (fitSelected.current === selectedId) return undefined
    fitSelected.current = null
    const map = mapRef.current
    const maxLevel = selected.kind === 'mt' || selected.kind === 'sign' ? 5 : 3
    if (map.getLevel() > maxLevel) map.setLevel(maxLevel)
    const t = setTimeout(() => focusOn(selected.lat, selected.lng), 60)
    return () => clearTimeout(t)
  }, [selectedId, mapReady, insets.bottom, insets.top, insets.left]) // eslint-disable-line react-hooks/exhaustive-deps

  // 내 위치를 처음 받으면 그리로
  const meOn = Boolean(me)
  useEffect(() => {
    if (mapReady && me) focusOn(me.lat, me.lng)
  }, [meOn, mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return null
  if (loading) return <div className="flex h-full w-full items-center justify-center bg-[#f5f5f5] text-sm text-[#888]">지도를 불러오는 중</div>

  // MT·간판 이름표 자리
  let sides = {}
  const el = outerRef.current
  if (mapReady && el) {
    const proj = mapRef.current.getProjection()
    const items = places
      .filter((p) => p.kind === 'mt' || p.kind === 'sign')
      .map((p) => {
        const pt = proj.containerPointFromCoords(new kakao.maps.LatLng(p.lat, p.lng))
        return { id: p.id, name: p.name, x: pt.x, y: pt.y }
      })
    const area = { x1: insets.left + 4, y1: insets.top, x2: el.clientWidth - 4, y2: el.clientHeight - insets.bottom }
    // 상점가 핀(꼬리 8px 위에 지름 28, 고르면 34)과 고른 상점가 핀의 이름표도 피한다
    const shopRects = places
      .filter((p) => p.kind === 'shop' || p.kind === 'annex')
      .flatMap((p) => {
        const pt = proj.containerPointFromCoords(new kakao.maps.LatLng(p.lat, p.lng))
        const r = p.id === selectedId ? 17 : 14
        const cy = pt.y - 8 - r
        const pin = { x1: pt.x - r, x2: pt.x + r, y1: cy - r, y2: cy + r }
        if (p.id !== selectedId) return [pin]
        // 고른 상점가 핀 이름표: 오른쪽에 안 들어가면 왼쪽으로 (긴 이름이 화면 밖으로 잘리지 않게)
        const w = labelWidth(p.name)
        const right = pt.x + r + 4 + w <= area.x2
        sides[p.id] = right ? 'right' : 'left'
        return [pin, right ? { x1: pt.x + r + 4, x2: pt.x + r + 4 + w, y1: cy - 8, y2: cy + 8 } : { x1: pt.x - r - 4 - w, x2: pt.x - r - 4, y1: cy - 8, y2: cy + 8 }]
      })
    sides = { ...sides, ...placeLabels(items, area, [...blocked, ...shopRects]) }
  }

  return (
    <div ref={outerRef} className="absolute inset-0 overflow-hidden bg-[#f5f5f5]">
      <Map
        center={{ lat: MAP_CENTER[0], lng: MAP_CENTER[1] }}
        level={4}
        style={{ width: '100%', height: '100%' }}
        onCreate={handleCreate}
        onIdle={() => setIdleTick((n) => n + 1)}
      >
        {places.map((p) => (
          <CustomOverlayMap key={p.id} position={{ lat: p.lat, lng: p.lng }} xAnchor={0.5} yAnchor={p.kind === 'mt' || p.kind === 'sign' ? 0.5 : 1} zIndex={p.id === selectedId ? 4 : p.kind === 'mt' || p.kind === 'sign' ? 3 : 2} clickable>
            <FlatPin place={p} on={p.id === selectedId} side={sides[p.id]} onPick={onPick} />
          </CustomOverlayMap>
        ))}
        {me && (
          <>
            <Circle center={{ lat: me.lat, lng: me.lng }} radius={Math.max(me.acc, 10)} strokeWeight={0} fillColor="#000" fillOpacity={0.08} />
            <CustomOverlayMap position={{ lat: me.lat, lng: me.lng }} zIndex={5}>
              <span className="me-dot" />
            </CustomOverlayMap>
          </>
        )}
      </Map>
    </div>
  )
}
