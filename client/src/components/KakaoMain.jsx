import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Circle, CustomOverlayMap, Map, useKakaoLoader } from 'react-kakao-maps-sdk'
import { MAP_CENTER } from '../data/stores.js'

const TILT = (52 * Math.PI) / 180
const THETA = -0.4
const PERSPECTIVE = 1000
const TILT_MS = 400
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

// 평면 핀. 보이는 크기보다 사방 8px 넓은 터치 영역.
// 이름표는 상자 밖으로 띄운다(absolute): 상자 크기에 들어가면 카카오가 '핀 + 이름표' 전체의 가운데를 좌표에 맞춰서 핀이 밀린다
function FlatPin({ place, on, dim, side = 'right', onPick }) {
  const ref = useNativeClick(() => onPick(place.id))
  const isMt = place.kind === 'mt'
  return (
    <button ref={ref} type="button" aria-label={`${place.label} ${place.name}`} className={`pin-hit ${dim ? 'is-dim' : ''}`}>
      {isMt ? (
        <span className="relative block">
          <span className={`pin-mt ${on ? 'is-on' : ''}`}>{place.id}</span>
          <span className={`pin-name pin-name-side side-${side}`}>{place.name}</span>
        </span>
      ) : (
        <span className="flex flex-col items-center">
          <span className="relative block">
            <span className={`pin-shop ${on ? 'is-on' : ''}`}>{place.id}</span>
            {on && <span className="pin-name pin-name-side">{place.name}</span>}
          </span>
          <span className="pin-tail" />
        </span>
      )}
    </button>
  )
}

// 3D 모드 핀: 기울인 지도 위에 따로 그린다. 바닥 점에서 막대가 서고 머리에 번호
function TiltPin({ place, x, y, on, dim, onPick }) {
  const isMt = place.kind === 'mt'
  const stick = isMt ? 56 : 40
  return (
    <button
      type="button"
      aria-label={`${place.label} ${place.name}`}
      onClick={() => onPick(place.id)}
      className={`pin-hit absolute ${dim ? 'is-dim' : ''}`}
      style={{ left: x, top: y, transform: 'translate(-50%, -100%)', pointerEvents: 'auto', zIndex: on ? 3 : isMt ? 2 : 1 }}
    >
      <span className="flex flex-col items-center">
        <span className="relative block">
          {isMt ? <span className={`pin-mt ${on ? 'is-on' : ''}`}>{place.id}</span> : <span className={`pin-shop ${on ? 'is-on' : ''}`}>{place.id}</span>}
          {(isMt || on) && <span className="pin-name pin-name-side">{place.name}</span>}
        </span>
        <span className="pin-stick" style={{ height: stick }} />
        <span className="pin-foot" />
      </span>
    </button>
  )
}

const KakaoMain = forwardRef(function KakaoMain({ appKey, places, selectedId, activeIds, insets, blocked = [], fitKey, threeD, me, onPick, onLoadError }, ref) {
  const [loading, error] = useKakaoLoader({ appkey: appKey })
  const outerRef = useRef(null)
  const mapRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const [tilt, setTilt] = useState({ phi: 0, theta: 0 }) // 지금 기울기 (애니메이션 중간값 포함)
  const [enlarged, setEnlarged] = useState(false) // 3D일 때 지도를 두 배로 키워 기울여도 빈 곳이 안 보이게
  const [, setFrame] = useState(0)
  const rafRef = useRef(0)
  const insetsRef = useRef(insets)
  insetsRef.current = insets
  const enlargedRef = useRef(false)
  enlargedRef.current = enlarged

  useEffect(() => {
    if (error) onLoadError()
  }, [error, onLoadError])

  // 핀 다시 그리기는 프레임당 한 번으로 묶는다
  const redraw = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      setFrame((f) => f + 1)
    })
  }, [])
  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  // 지도 컨테이너 크기가 바뀌면(화면 회전, 3D에서 두 배로 키울 때) 중심을 지킨 채 다시 계산.
  // relayout만 하면 카카오는 왼쪽 위를 고정해서 중심이 밀린다
  useEffect(() => {
    const el = outerRef.current?.firstElementChild
    if (!el) return undefined
    const ro = new ResizeObserver(() => {
      const map = mapRef.current
      if (!map) return
      const c = map.getCenter()
      map.relayout()
      map.setCenter(c)
      redraw()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [loading, redraw])

  // ----- 화면 맞추기 (시트·패널에 가리지 않는 영역 기준) -----
  // labelRight: 핀 오른쪽으로 뻗는 이름표 몫 (MT 핀은 이름이 늘 붙어 있다)
  const fitPlaces = useCallback((list, labelRight = 0) => {
    const map = mapRef.current
    if (!map || !list.length) return
    const b = new kakao.maps.LatLngBounds()
    list.forEach((p) => b.extend(new kakao.maps.LatLng(p.lat, p.lng)))
    const { top, right, bottom, left } = insetsRef.current
    map.setBounds(b, top + 24, right + 16 + labelRight, bottom + 24, left + 24)
  }, [])

  // 보이는 영역의 가운데에 좌표가 오도록 이동
  const focusOn = useCallback((lat, lng, animate = true) => {
    const map = mapRef.current
    const el = outerRef.current
    if (!map || !el) return
    const target = new kakao.maps.LatLng(lat, lng)
    if (enlargedRef.current) {
      // 3D에서는 화면 가운데로 (기울어진 평면이라 여백 보정은 생략)
      if (animate && !reducedMotion()) map.panTo(target)
      else map.setCenter(target)
      return
    }
    const { top, right, bottom, left } = insetsRef.current
    const w = el.clientWidth
    const h = el.clientHeight
    const proj = map.getProjection()
    const p = proj.containerPointFromCoords(target)
    const want = { x: left + (w - left - right) / 2, y: top + (h - top - bottom) / 2 }
    const c = new kakao.maps.Point(w / 2 + (p.x - want.x), h / 2 + (p.y - want.y))
    const center = proj.coordsFromContainerPoint(c)
    if (animate && !reducedMotion()) map.panTo(center)
    else map.setCenter(center)
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => mapRef.current?.setLevel(mapRef.current.getLevel() - 1, { animate: !reducedMotion() }),
      zoomOut: () => mapRef.current?.setLevel(mapRef.current.getLevel() + 1, { animate: !reducedMotion() }),
      focus: (lat, lng) => focusOn(lat, lng),
    }),
    [focusOn],
  )

  const handleCreate = useCallback(
    (map) => {
      if (mapRef.current === map) return
      mapRef.current = map
      requestAnimationFrame(() => {
        map.relayout()
        setMapReady(true)
      })
    },
    [],
  )

  // 처음 화면과 칩 전환: 정해진 장소들이 다 보이게
  const fitList = fitKey?.split(':')[0]
  useEffect(() => {
    if (!mapReady) return
    // MT 보기: 상점가와 MT 장소가 다 보이게 (이름표는 겹치지 않는 쪽으로 따로 놓는다)
    if (fitList === 'mt') fitPlaces(places.filter((p) => p.kind !== 'annex'))
    else fitPlaces(places.filter((p) => p.kind === 'shop'))
  }, [fitKey, mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // 고르면 보이는 영역 가운데로. 시트 높이가 바뀌어도 다시 맞춘다
  const selected = places.find((p) => p.id === selectedId)
  // (처음 범위 맞추기와 같은 프레임이면 바뀌기 전 화면 기준으로 계산되므로 한 박자 늦춘다)
  useEffect(() => {
    if (!mapReady || !selected) return undefined
    const t = setTimeout(() => focusOn(selected.lat, selected.lng), 60)
    return () => clearTimeout(t)
  }, [selectedId, mapReady, insets.bottom, insets.left]) // eslint-disable-line react-hooks/exhaustive-deps

  // 내 위치를 처음 받으면 그리로
  const meOn = Boolean(me)
  useEffect(() => {
    if (mapReady && me) focusOn(me.lat, me.lng)
  }, [meOn, mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // ----- 3D: 0.4초 동안 기울기·회전을 바꾼다 -----
  useEffect(() => {
    if (!mapReady) return undefined
    const map = mapRef.current
    const from = { ...tilt }
    const to = threeD ? { phi: TILT, theta: THETA } : { phi: 0, theta: 0 }
    if (threeD) {
      setEnlarged(true) // 크기 변경은 ResizeObserver가 중심을 지키며 처리한다
      map.setDraggable(false)
      map.setZoomable(false)
    }
    const start = performance.now()
    const dur = reducedMotion() ? 0 : TILT_MS
    let raf = 0
    const tick = (t) => {
      const k = dur ? Math.min(1, (t - start) / dur) : 1
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2
      setTilt({ phi: from.phi + (to.phi - from.phi) * e, theta: from.theta + (to.theta - from.theta) * e })
      if (k < 1) raf = requestAnimationFrame(tick)
      else if (!threeD) {
        setEnlarged(false)
        map.setDraggable(true)
        map.setZoomable(true)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [threeD, mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // 3D 투영: 키운 지도 안의 점 → 화면 점 (CSS perspective · rotateX · rotateZ와 같은 계산)
  const project = (lat, lng) => {
    const map = mapRef.current
    const el = outerRef.current
    if (!map || !el) return null
    const inner = el.firstElementChild
    const cw = inner.clientWidth
    const ch = inner.clientHeight
    const p = map.getProjection().containerPointFromCoords(new kakao.maps.LatLng(lat, lng))
    const lx = p.x - cw / 2
    const ly = p.y - ch / 2
    const { phi, theta } = tilt
    const x1 = lx * Math.cos(theta) - ly * Math.sin(theta)
    const y1 = lx * Math.sin(theta) + ly * Math.cos(theta)
    const y2 = y1 * Math.cos(phi)
    const z2 = y1 * Math.sin(phi)
    const s = PERSPECTIVE / (PERSPECTIVE - z2)
    return { x: el.clientWidth / 2 + x1 * s, y: el.clientHeight / 2 + y2 * s, behind: z2 >= PERSPECTIVE * 0.9 }
  }

  // ----- 3D 제스처: 한 손가락 이동, 두 손가락 확대·회전 -----
  const touches = useRef(new globalThis.Map())
  const gesture = useRef(null)
  const onGestureDown = (e) => {
    if (e.target.closest('.pin-hit')) return // 핀을 누른 것은 제스처가 아니라 클릭
    e.currentTarget.setPointerCapture(e.pointerId)
    touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    gesture.current = null
  }
  const onGestureMove = (e) => {
    const map = mapRef.current
    if (!map || !touches.current.has(e.pointerId)) return
    const prev = touches.current.get(e.pointerId)
    const cur = { x: e.clientX, y: e.clientY }
    touches.current.set(e.pointerId, cur)
    const pts = [...touches.current.values()]
    if (pts.length === 1) {
      // 화면에서 끈 만큼을 기울어진 평면 위 이동으로 되돌려서 지도 중심을 옮긴다
      const { phi, theta } = tilt
      const dx = cur.x - prev.x
      const dy = (cur.y - prev.y) / Math.max(Math.cos(phi), 0.2)
      const px = dx * Math.cos(theta) + dy * Math.sin(theta)
      const py = -dx * Math.sin(theta) + dy * Math.cos(theta)
      const inner = outerRef.current.firstElementChild
      const proj = map.getProjection()
      map.setCenter(proj.coordsFromContainerPoint(new kakao.maps.Point(inner.clientWidth / 2 - px, inner.clientHeight / 2 - py)))
      redraw()
    } else if (pts.length === 2) {
      const [a, b] = pts
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const ang = Math.atan2(b.y - a.y, b.x - a.x)
      const g = gesture.current ?? (gesture.current = { dist, ang })
      const ratio = dist / g.dist
      if (ratio > 1.35) {
        map.setLevel(map.getLevel() - 1)
        g.dist = dist
      } else if (ratio < 0.74) {
        map.setLevel(map.getLevel() + 1)
        g.dist = dist
      }
      setTilt((t) => ({ ...t, theta: t.theta + (ang - g.ang) }))
      g.ang = ang
    }
  }
  const onGestureUp = (e) => {
    touches.current.delete(e.pointerId)
    gesture.current = null
  }

  if (error) return null
  if (loading) return <div className="flex h-full w-full items-center justify-center bg-[#f5f5f5] text-sm text-[#888]">지도를 불러오는 중</div>

  const inTilt = enlarged

  // 평면 모드 MT 이름표 자리 (지도가 움직이면 다시 계산된다)
  let sides = {}
  const el = outerRef.current
  if (!inTilt && mapReady && el) {
    const proj = mapRef.current.getProjection()
    const items = places
      .filter((p) => p.kind === 'mt')
      .map((p) => {
        const pt = proj.containerPointFromCoords(new kakao.maps.LatLng(p.lat, p.lng))
        return { id: p.id, name: p.name, x: pt.x, y: pt.y }
      })
    const area = { x1: insets.left + 4, y1: insets.top, x2: el.clientWidth - 4, y2: el.clientHeight - insets.bottom }
    sides = placeLabels(items, area, blocked)
  }
  // 3D 핀은 화면 아래쪽(가까운 쪽)일수록 나중에 그려서 위에 오게 한다
  const pins3d = inTilt && mapReady
    ? places.map((p) => ({ p, pt: project(p.lat, p.lng) })).filter((x) => x.pt && !x.pt.behind).sort((a, b) => a.pt.y - b.pt.y)
    : []
  const mePt = inTilt && me && mapReady ? project(me.lat, me.lng) : null

  return (
    <div ref={outerRef} className="absolute inset-0 overflow-hidden bg-[#f5f5f5]">
      <div
        className="absolute"
        style={
          inTilt
            ? {
                left: '-50%',
                top: '-50%',
                width: '200%',
                height: '200%',
                transform: `perspective(${PERSPECTIVE}px) rotateX(${tilt.phi}rad) rotateZ(${tilt.theta}rad)`,
                transformOrigin: '50% 50%',
              }
            : { inset: 0 }
        }
      >
        <Map
          center={{ lat: MAP_CENTER[0], lng: MAP_CENTER[1] }}
          level={4}
          style={{ width: '100%', height: '100%' }}
          onCreate={handleCreate}
          onCenterChanged={redraw}
          onZoomChanged={redraw}
          onBoundsChanged={redraw}
        >
          {!inTilt &&
            places.map((p) => (
              <CustomOverlayMap key={p.id} position={{ lat: p.lat, lng: p.lng }} xAnchor={0.5} yAnchor={p.kind === 'mt' ? 0.5 : 1} zIndex={p.id === selectedId ? 4 : p.kind === 'mt' ? 3 : 2} clickable>
                <FlatPin place={p} on={p.id === selectedId} dim={!activeIds.has(p.id)} side={sides[p.id]} onPick={onPick} />
              </CustomOverlayMap>
            ))}
          {me && (
            <>
              <Circle center={{ lat: me.lat, lng: me.lng }} radius={Math.max(me.acc, 10)} strokeWeight={0} fillColor="#000" fillOpacity={0.08} />
              {!inTilt && (
                <CustomOverlayMap position={{ lat: me.lat, lng: me.lng }} zIndex={5}>
                  <span className="me-dot" />
                </CustomOverlayMap>
              )}
            </>
          )}
        </Map>
      </div>

      {inTilt && (
        <div
          className="absolute inset-0"
          style={{ touchAction: 'none' }}
          onPointerDown={onGestureDown}
          onPointerMove={onGestureMove}
          onPointerUp={onGestureUp}
          onPointerCancel={onGestureUp}
        >
          {pins3d.map(({ p, pt }) => (
            <TiltPin key={p.id} place={p} x={pt.x} y={pt.y} on={p.id === selectedId} dim={!activeIds.has(p.id)} onPick={onPick} />
          ))}
          {mePt && <span className="me-dot absolute" style={{ left: mePt.x, top: mePt.y, transform: 'translate(-50%,-50%)' }} />}
        </div>
      )}
    </div>
  )
})

export default KakaoMain
