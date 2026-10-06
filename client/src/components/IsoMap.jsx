import { useCallback, useEffect, useRef, useState } from 'react'
import { boxFaces, makeProjector, toPoints, unproject } from '../iso.js'

const THETA0 = -1.1 // 기본 회전: 길이 화면 왼쪽 세로로 서도록
const ZOOM_MIN = 0.15
const ZOOM_MAX = 2.4
const MT_ZOOM = 0.5 // MT 장소를 고르면 이 줌으로
const EASE = 0.14 // 카메라가 매 프레임 목표값으로 다가가는 비율
// 전체 보기가 0.15보다 더 멀리 맞춰졌으면 그 값까지는 손으로도 줄일 수 있게 한다
const clampZoom = (z, min = ZOOM_MIN) => Math.min(ZOOM_MAX, Math.max(min, z))
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// MT 핀 크기 (화면 px)
const MT_STICK = 78
const MT_STICK_ON = 96
const MT_BADGE = 22
// 이름표가 차지하는 너비 (전체 보기에서 잘리지 않게 맞출 때 쓴다): 배지 옆 여백 + 글자 수 × 12px 남짓
const labelWidth = (name = '') => MT_BADGE / 2 + 6 + name.length * 12.5

const btn = 'h-9 w-9 border border-black bg-white text-base leading-none hover:bg-black hover:text-white'

export default function IsoMap({ world, mtPlaces, selectedId, activeIds, overview, isMobile, anchorRef, kickKey, onPick }) {
  const wrapRef = useRef(null)
  const svgRef = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [, setTick] = useState(0)
  const cam = useRef(null)
  const loop = useRef({ raf: 0, until: 0 })
  const drag = useRef(null)
  const prevMode = useRef(null)
  const fitZoom = useRef(ZOOM_MIN)
  const minZoom = () => Math.min(ZOOM_MIN, fitZoom.current)

  const shop = world.shops.find((s) => s.id === selectedId)
  const mt = world.mts.find((m) => m.id === selectedId)
  const target = shop ?? mt
  if (!cam.current) {
    const [fx, fy] = target ? target.pos : [0, 0]
    const zoom = mt ? MT_ZOOM : 1
    cam.current = { cur: { fx, fy, theta: THETA0, zoom }, tgt: { fx, fy, theta: THETA0, zoom } }
  }

  // 카메라가 목표에 닿거나 정해진 시간(사진 카드가 움직이는 동안)이 지날 때까지만 프레임을 돈다
  const step = useCallback(() => {
    const { cur, tgt } = cam.current
    let moving = false
    for (const k of ['fx', 'fy', 'theta', 'zoom']) {
      const d = tgt[k] - cur[k]
      if (Math.abs(d) > (k === 'zoom' || k === 'theta' ? 0.0005 : 0.01)) {
        cur[k] += reducedMotion() ? d : d * EASE
        moving = true
      } else cur[k] = tgt[k]
    }
    setTick((t) => t + 1)
    loop.current.raf = moving || performance.now() < loop.current.until ? requestAnimationFrame(step) : 0
  }, [])
  const kick = useCallback(
    (ms = 0) => {
      loop.current.until = Math.max(loop.current.until, performance.now() + ms)
      if (!loop.current.raf) loop.current.raf = requestAnimationFrame(step)
    },
    [step],
  )
  useEffect(
    () => () => {
      cancelAnimationFrame(loop.current.raf)
      loop.current.raf = 0 // 0으로 돌려놔야 다시 붙을 때(StrictMode 등) kick이 루프를 새로 시작한다
    },
    [],
  )

  const base = (w, h) => (isMobile ? Math.min(w, h * 0.62) / 150 : Math.min(w * 0.5, h) / 150)

  // 전체 보기: 상점가와 MT 장소가 핀 막대·이름표까지 한 화면에 들어오게 줌·중심·회전을 맞춘다 (화면 가운데 기준).
  // 회전각을 여러 개 시험해서 가장 크게 보이는 방향을 고른다 (세로 화면이면 동서가 세로로 선다)
  const fitAll = useCallback(() => {
    const { w, h } = size
    if (!w) return
    const margin = isMobile ? 16 : 32
    // 점마다 화면에서 차지하는 여유 (px): 왼쪽, 오른쪽, 위, 아래
    const marks = [
      ...world.shops.map((b) => ({ pos: b.pos, l: 14, r: 14, t: 44, d: 6 })),
      ...world.mts.map((b) => ({ pos: b.pos, l: MT_BADGE / 2 + 2, r: labelWidth(mtPlaces.find((p) => p.id === b.id)?.name), t: MT_STICK + MT_BADGE, d: 8 })),
    ]
    const extents = (us, sc) => {
      let x0 = Infinity
      let x1 = -Infinity
      let y0 = Infinity
      let y1 = -Infinity
      us.forEach(([ux, uy], i) => {
        const m = marks[i]
        x0 = Math.min(x0, ux * sc - m.l)
        x1 = Math.max(x1, ux * sc + m.r)
        y0 = Math.min(y0, uy * sc - m.t)
        y1 = Math.max(y1, uy * sc + m.d)
      })
      return { x0, x1, y0, y1 }
    }
    let best = null
    for (let k = 0; k < 60; k++) {
      const theta = THETA0 + (k * Math.PI) / 30
      const proj = makeProjector({ cx: 0, cy: 0, scale: 1, theta, fx: 0, fy: 0 })
      const us = marks.map((m) => proj.project(m.pos[0], m.pos[1]))
      let lo = 0.001
      let hi = base(w, h) * ZOOM_MAX
      for (let i = 0; i < 30; i++) {
        const mid = (lo + hi) / 2
        const e = extents(us, mid)
        if (e.x1 - e.x0 <= w - margin * 2 && e.y1 - e.y0 <= h - margin * 2) lo = mid
        else hi = mid
      }
      // 기본 방향에서 많이 돌수록 감점: 크게 이득일 때만 지도를 뒤집는다
      const turn = Math.abs(Math.atan2(Math.sin(theta - THETA0), Math.cos(theta - THETA0))) / Math.PI
      const score = lo * (1 - 0.35 * turn)
      if (!best || score > best.score) best = { sc: lo, theta, us, score }
    }
    const { sc, theta, us } = best
    const e = extents(us, sc)
    // 화면 좌표 = 가운데 + sc × (점 − 기준점) 이므로, 차지하는 상자의 가운데가 화면 가운데에 오도록 기준점을 잡는다
    const [fx, fy] = unproject({ theta, fx: 0, fy: 0 }, (e.x0 + e.x1) / 2 / sc, (e.y0 + e.y1) / 2 / sc)
    const zoom = Math.min(ZOOM_MAX, sc / base(w, h))
    fitZoom.current = zoom
    // 회전은 가까운 쪽으로 돌게 현재 각도 근처 값으로 맞춘다
    const curTheta = cam.current.tgt.theta
    const t = theta + Math.round((curTheta - theta) / (2 * Math.PI)) * 2 * Math.PI
    Object.assign(cam.current.tgt, { fx, fy, zoom, theta: t })
  }, [size, world, isMobile, mtPlaces]) // eslint-disable-line react-hooks/exhaustive-deps

  // 고른 곳으로 카메라 이동. MT 장소는 줌 0.5, 전체 보기나 MT에서 상점가로 돌아오면 줌 1
  useEffect(() => {
    const mode = overview ? 'overview' : mt ? 'mt' : shop ? 'shop' : 'annex'
    const t = cam.current.tgt
    if (mode === 'overview') fitAll()
    else if (target) {
      t.fx = target.pos[0]
      t.fy = target.pos[1]
      if (mode === 'mt') t.zoom = MT_ZOOM
      else if (prevMode.current === 'mt' || prevMode.current === 'overview') t.zoom = 1
      // 전체 보기에서 돌려 둔 방향은 기본으로 되돌린다
      if (prevMode.current === 'overview') t.theta = THETA0
    }
    prevMode.current = mode
    kick(900)
  }, [selectedId, overview]) // eslint-disable-line react-hooks/exhaustive-deps

  // 화면 크기가 바뀌면 전체 보기를 다시 맞춘다
  useEffect(() => {
    if (overview) {
      fitAll()
      kick()
    }
  }, [size.w, size.h]) // eslint-disable-line react-hooks/exhaustive-deps

  // 사진 카드가 움직이는 동안 연결선이 따라가게
  useEffect(() => kick(900), [kickKey, kick])

  useEffect(() => {
    const el = wrapRef.current
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight })
      kick(200)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [kick])

  // 휠 줌 (기본 스크롤을 막아야 해서 passive: false로 직접 단다)
  useEffect(() => {
    const el = svgRef.current
    if (!el) return undefined
    const onWheel = (e) => {
      e.preventDefault()
      cam.current.tgt.zoom = clampZoom(cam.current.tgt.zoom * Math.exp(-e.deltaY * 0.0015), minZoom())
      kick()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [kick, size.w])

  const zoomBy = (f) => {
    cam.current.tgt.zoom = clampZoom(cam.current.tgt.zoom * f, minZoom())
    kick()
  }
  const reset = () => {
    if (overview) fitAll()
    else Object.assign(cam.current.tgt, { theta: THETA0, zoom: mt ? MT_ZOOM : 1 })
    kick()
  }

  // 드래그로 회전. 조금이라도 끌었으면 놓을 때 클릭으로 치지 않는다
  const onPointerDown = (e) => {
    drag.current = { x: e.clientX, theta: cam.current.tgt.theta, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > 4) d.moved = true
    if (!d.moved) return
    cam.current.tgt.theta = cam.current.cur.theta = d.theta + dx * 0.008
    kick()
  }
  const onPointerUp = (e) => {
    if (drag.current && !drag.current.moved) {
      // 끌지 않았으면 그 자리의 핀·박스를 고른 것으로 본다
      const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-shop]')
      if (hit) onPick(hit.getAttribute('data-shop'))
    }
    drag.current = null
  }

  const { w, h } = size
  const { cur } = cam.current
  const scale = base(w, h) * cur.zoom
  const proj = makeProjector({
    cx: overview || isMobile ? w * 0.5 : w * 0.36,
    cy: overview ? h * 0.5 : isMobile ? h * 0.34 : h * 0.58,
    scale,
    theta: cur.theta,
    fx: cur.fx,
    fy: cur.fy,
  })

  // 격자: 상점가와 MT 장소를 모두 덮는다. 멀리서 볼 때는 간격을 넓혀서 회색 덩어리가 되지 않게
  const grid = []
  if (w) {
    const step = scale < 1.6 ? 50 : 10
    const { minX, maxX, minY, maxY } = world.bounds
    const x0 = Math.floor(minX / step) * step
    const y0 = Math.floor(minY / step) * step
    for (let x = x0; x <= maxX; x += step) {
      const a = proj.project(x, minY)
      const b = proj.project(x, maxY)
      grid.push(<line key={`gx${x}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />)
    }
    for (let y = y0; y <= maxY; y += step) {
      const a = proj.project(minX, y)
      const b = proj.project(maxX, y)
      grid.push(<line key={`gy${y}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />)
    }
  }

  const roadEl = (r, key) => {
    const [p, q] = r.center.map(([x, y]) => proj.project(x, y))
    return (
      <g key={key}>
        <polygon points={toPoints(r.poly.map(([x, y]) => proj.project(x, y)))} fill="#fff" stroke="#000" strokeWidth="1" />
        <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="#888" strokeWidth="1" strokeDasharray="5 5" />
      </g>
    )
  }

  // 깊이순으로 정렬해서 그린다. 선택된 핀은 맨 마지막에
  const items = [
    ...world.decor.map((b, i) => ({ kind: 'decor', b, key: `d${i}`, depth: proj.depth(...b.pos) })),
    ...world.shops.map((b) => ({ kind: 'shop', b, key: b.id, depth: proj.depth(...b.pos) })),
    ...world.mts.map((b) => ({ kind: 'mt', b, key: `mt${b.id}`, depth: proj.depth(...b.pos) })),
  ].sort((a, b) => a.depth - b.depth)

  // 핀 머리 위치 (연결선 시작점)
  const headOf = (b, kind) => {
    const roof = proj.project(b.pos[0], b.pos[1], b.height)
    if (kind === 'mt') return [roof[0], roof[1] - (b.id === selectedId ? MT_STICK_ON : MT_STICK)]
    return [roof[0], roof[1] - 30]
  }

  const pinEl = (b, on) => {
    const roof = proj.project(b.pos[0], b.pos[1], b.height)
    const head = [roof[0], roof[1] - 30]
    return (
      <g key={`pin${b.id}`}>
        <ellipse cx={roof[0]} cy={roof[1]} rx="5" ry="2.5" fill="#ccc" />
        <line x1={roof[0]} y1={roof[1]} x2={head[0]} y2={head[1] + 11} stroke="#000" strokeWidth="1" />
        <circle cx={head[0]} cy={head[1]} r="11" fill={on ? '#000' : '#fff'} stroke="#000" strokeWidth="1" />
        <text x={head[0]} y={head[1]} dy="0.35em" textAnchor="middle" fontSize="10" fontWeight="700" fill={on ? '#fff' : '#000'}>
          {b.id}
        </text>
      </g>
    )
  }

  // MT 핀: 굵고 긴 막대 + 검은 정사각형 배지(선택 시 반전) + 오른쪽 이름표
  const mtPinEl = (b, on) => {
    const place = mtPlaces.find((p) => p.id === b.id)
    const roof = proj.project(b.pos[0], b.pos[1], b.height)
    const head = headOf(b, 'mt')
    const half = MT_BADGE / 2
    const halo = { stroke: '#fff', strokeWidth: 3, paintOrder: 'stroke', strokeLinejoin: 'round' }
    return (
      <g key={`mtpin${b.id}`}>
        <line x1={roof[0]} y1={roof[1]} x2={head[0]} y2={head[1] + half} stroke="#000" strokeWidth="1.6" />
        <rect x={head[0] - half} y={head[1] - half} width={MT_BADGE} height={MT_BADGE} fill={on ? '#fff' : '#000'} stroke="#000" strokeWidth="1.6" />
        <text x={head[0]} y={head[1]} dy="0.35em" textAnchor="middle" fontSize="12" fontWeight="700" fill={on ? '#000' : '#fff'}>
          {b.id}
        </text>
        <text x={head[0] + half + 6} y={head[1] - 2} fontSize="12" fontWeight="700" fill="#000" {...halo}>
          {place?.name}
        </text>
        <text x={head[0] + half + 6} y={head[1] + 11} fontSize="11" fill="#888" {...halo}>
          {place?.type}
        </text>
      </g>
    )
  }

  const boxEl = (b, stroke, fill = '#fff') => {
    const { sides, roof } = boxFaces(b, proj)
    return (
      <g fill={fill} stroke={stroke} strokeWidth="1" strokeLinejoin="round">
        {sides.map((f, i) => (
          <polygon key={i} points={toPoints(f)} />
        ))}
        <polygon points={toPoints(roof)} />
      </g>
    )
  }

  // 연결선: 선택된 핀 머리 → 사진 스택 맨 앞 카드의 왼쪽 가운데 (전체 보기에서는 스택이 없다)
  let connector = null
  const anchor = anchorRef.current
  if (!overview && target && anchor && wrapRef.current) {
    const a = anchor.getBoundingClientRect()
    const s = wrapRef.current.getBoundingClientRect() // SVG가 이 상자를 꽉 채운다
    const head = headOf(target, mt ? 'mt' : 'shop')
    const end = [a.left - s.left, a.top + a.height / 2 - s.top]
    connector = (
      <g pointerEvents="none">
        <line x1={head[0]} y1={head[1]} x2={end[0]} y2={end[1]} stroke="#000" strokeWidth="0.8" strokeDasharray="3 3" />
        <circle cx={end[0]} cy={end[1]} r="2.5" fill="#000" />
      </g>
    )
  }

  const selectedEl = shop ? pinEl(shop, true) : mt ? mtPinEl(mt, true) : null

  return (
    <div ref={wrapRef} className="absolute inset-0">
      {w > 0 && (
        <svg
          ref={svgRef}
          width={w}
          height={h}
          className="block cursor-grab select-none active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (drag.current = null)}
        >
          <rect width={w} height={h} fill="#fff" />
          <g stroke="#f0f0f0" strokeWidth="1">{grid}</g>
          {world.mtRoads.map((r, i) => roadEl(r, `mtroad${i}`))}
          {world.sideRoads.map((r, i) => roadEl(r, `side${i}`))}
          {roadEl(world.road, 'main')}
          {items.map(({ kind, b, key }) => {
            if (kind === 'decor') return <g key={key}>{boxEl(b, '#ccc')}</g>
            const on = b.id === selectedId
            const dim = activeIds.has(b.id) ? 1 : 0.25
            if (kind === 'mt') {
              return (
                <g key={key} data-shop={b.id} className="cursor-pointer" opacity={dim}>
                  {boxEl(b, '#000', '#000')}
                  {!on && mtPinEl(b, false)}
                </g>
              )
            }
            return (
              <g key={key} data-shop={b.id} className="cursor-pointer" opacity={dim}>
                {boxEl(b, on ? '#000' : '#888')}
                {!on && pinEl(b, false)}
              </g>
            )
          })}
          {selectedEl && (
            <g data-shop={selectedId} className="cursor-pointer" opacity={activeIds.has(selectedId) ? 1 : 0.25}>
              {selectedEl}
            </g>
          )}
          {connector}
        </svg>
      )}

      <div className={`absolute z-10 flex ${isMobile ? 'right-3 top-3 flex-col' : 'bottom-4 left-4'}`}>
        <button type="button" aria-label="확대" onClick={() => zoomBy(1.25)} className={btn}>
          +
        </button>
        <button type="button" aria-label="축소" onClick={() => zoomBy(1 / 1.25)} className={`${btn} ${isMobile ? '-mt-px' : '-ml-px'}`}>
          −
        </button>
        <button type="button" aria-label="기본 보기" onClick={reset} className={`${btn} ${isMobile ? '-mt-px' : '-ml-px'}`}>
          ↺
        </button>
      </div>
    </div>
  )
}
