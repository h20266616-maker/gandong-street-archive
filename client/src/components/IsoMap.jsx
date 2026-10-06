import { useCallback, useEffect, useRef, useState } from 'react'
import { boxFaces, makeProjector, toPoints } from '../iso.js'

const THETA0 = -1.1 // 기본 회전: 길이 화면 왼쪽 세로로 서도록
const ZOOM_MIN = 0.55
const ZOOM_MAX = 2.4
const EASE = 0.14 // 카메라가 매 프레임 목표값으로 다가가는 비율
const clampZoom = (z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z))
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const btn = 'h-9 w-9 border border-black bg-white text-base leading-none hover:bg-black hover:text-white'

export default function IsoMap({ world, selectedId, activeIds, isMobile, anchorRef, kickKey, onPick }) {
  const wrapRef = useRef(null)
  const svgRef = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [, setTick] = useState(0)
  const cam = useRef(null)
  const loop = useRef({ raf: 0, until: 0 })
  const drag = useRef(null)

  const shop = world.shops.find((s) => s.id === selectedId)
  if (!cam.current) {
    const [fx, fy] = shop ? shop.pos : [0, 0]
    cam.current = { cur: { fx, fy, theta: THETA0, zoom: 1 }, tgt: { fx, fy, theta: THETA0, zoom: 1 } }
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

  // 가게를 고르면 카메라가 그 가게로 (별관은 지도에 없으니 그대로)
  useEffect(() => {
    if (shop) {
      cam.current.tgt.fx = shop.pos[0]
      cam.current.tgt.fy = shop.pos[1]
    }
    kick(900)
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

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
      cam.current.tgt.zoom = clampZoom(cam.current.tgt.zoom * Math.exp(-e.deltaY * 0.0015))
      kick()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [kick, size.w])

  const zoomBy = (f) => {
    cam.current.tgt.zoom = clampZoom(cam.current.tgt.zoom * f)
    kick()
  }
  const reset = () => {
    Object.assign(cam.current.tgt, { theta: THETA0, zoom: 1 })
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
  const base = isMobile ? Math.min(w, h * 0.62) / 150 : Math.min(w * 0.5, h) / 150
  const proj = makeProjector({
    cx: isMobile ? w * 0.5 : w * 0.36,
    cy: isMobile ? h * 0.34 : h * 0.58,
    scale: base * cur.zoom,
    theta: cur.theta,
    fx: cur.fx,
    fy: cur.fy,
  })

  // 격자 (10m 간격)
  const grid = []
  if (w) {
    for (let k = -16; k <= 16; k++) {
      const a = proj.project(k * 10, -160)
      const b = proj.project(k * 10, 160)
      const c = proj.project(-160, k * 10)
      const d = proj.project(160, k * 10)
      grid.push(<line key={`gx${k}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />, <line key={`gy${k}`} x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]} />)
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
  ].sort((a, b) => a.depth - b.depth)

  const pinOf = (b) => {
    const roof = proj.project(b.pos[0], b.pos[1], b.height)
    return { roof, head: [roof[0], roof[1] - 30] }
  }
  const pinEl = (b, on) => {
    const { roof, head } = pinOf(b)
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

  // 연결선: 선택된 핀 머리 → 사진 스택 맨 앞 카드의 왼쪽 가운데
  let connector = null
  const anchor = anchorRef.current
  if (shop && anchor && wrapRef.current) {
    const a = anchor.getBoundingClientRect()
    const s = wrapRef.current.getBoundingClientRect() // SVG가 이 상자를 꽉 채운다
    const { head } = pinOf(shop)
    const end = [a.left - s.left, a.top + a.height / 2 - s.top]
    connector = (
      <g pointerEvents="none">
        <line x1={head[0]} y1={head[1]} x2={end[0]} y2={end[1]} stroke="#000" strokeWidth="0.8" strokeDasharray="3 3" />
        <circle cx={end[0]} cy={end[1]} r="2.5" fill="#000" />
      </g>
    )
  }

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
          {world.sideRoads.map((r, i) => roadEl(r, `side${i}`))}
          {roadEl(world.road, 'main')}
          {items.map(({ kind, b, key }) => {
            const { sides, roof } = boxFaces(b, proj)
            if (kind === 'decor') {
              return (
                <g key={key} fill="#fff" stroke="#ccc" strokeWidth="1" strokeLinejoin="round">
                  {sides.map((f, i) => (
                    <polygon key={i} points={toPoints(f)} />
                  ))}
                  <polygon points={toPoints(roof)} />
                </g>
              )
            }
            const on = b.id === selectedId
            return (
              <g key={key} data-shop={b.id} className="cursor-pointer" opacity={activeIds.has(b.id) ? 1 : 0.25}>
                <g fill="#fff" stroke={on ? '#000' : '#888'} strokeWidth="1" strokeLinejoin="round">
                  {sides.map((f, i) => (
                    <polygon key={i} points={toPoints(f)} />
                  ))}
                  <polygon points={toPoints(roof)} />
                </g>
                {!on && pinEl(b, false)}
              </g>
            )
          })}
          {shop && (
            <g data-shop={shop.id} className="cursor-pointer" opacity={activeIds.has(shop.id) ? 1 : 0.25}>
              {pinEl(shop, true)}
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
