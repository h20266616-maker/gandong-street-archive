// 3D 아이소메트릭 지도용 계산. 화면과 무관한 순수 함수만 둔다.
// 평면 좌표는 미터 단위, x = 동쪽, y = 남쪽 (θ = 0일 때 북쪽이 화면 오른쪽 위로 간다)

const M_PER_DEG_LAT = 110574

export function makeWorld(stores) {
  const street = stores.filter((s) => !s.annex && s.lat != null)
  const lat0 = street.reduce((a, s) => a + s.lat, 0) / street.length
  const lng0 = street.reduce((a, s) => a + s.lng, 0) / street.length
  const mPerDegLng = 111320 * Math.cos((lat0 * Math.PI) / 180)
  const toXY = (lat, lng) => [(lng - lng0) * mPerDegLng, -(lat - lat0) * M_PER_DEG_LAT]

  // 간척월명로 중심선: 상점가 가게 좌표에 맞춘 직선 (주성분 방향)
  const pts = street.map((s) => toXY(s.lat, s.lng))
  let sxx = 0
  let syy = 0
  let sxy = 0
  for (const [x, y] of pts) {
    sxx += x * x
    syy += y * y
    sxy += x * y
  }
  const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy)
  let u = [Math.cos(ang), Math.sin(ang)]
  if (u[1] > 0) u = [-u[0], -u[1]] // 남→북 방향
  const n = [-u[1], u[0]]
  const along = (p) => p[0] * u[0] + p[1] * u[1]
  const across = (p) => p[0] * n[0] + p[1] * n[1]
  const ts = pts.map(along)
  const tMin = Math.min(...ts) - 30
  const tMax = Math.max(...ts) + 30
  const at = (t, d = 0) => [u[0] * t + n[0] * d, u[1] * t + n[1] * d]

  const ROAD_HALF = 4
  const road = {
    poly: [at(tMin, -ROAD_HALF), at(tMax, -ROAD_HALF), at(tMax, ROAD_HALF), at(tMin, ROAD_HALF)],
    center: [at(tMin), at(tMax)],
  }

  // 옆길: 북쪽 끝에서 동서로 가로지르는 길(파로호로), 남쪽에서 동남쪽으로 빠지는 길(동림길)
  const sideRoad = (origin, dir, from, to, half = 3) => {
    const len = Math.hypot(dir[0], dir[1])
    const d = [dir[0] / len, dir[1] / len]
    const nn = [-d[1], d[0]]
    const p = (t, o) => [origin[0] + d[0] * t + nn[0] * o, origin[1] + d[1] * t + nn[1] * o]
    return { poly: [p(from, -half), p(to, -half), p(to, half), p(from, half)], center: [p(from, 0), p(to, 0)], origin, d, from, to, half }
  }
  const sideRoads = [
    sideRoad(toXY(38.0554, 127.81725), [1, 0], -95, 75),
    sideRoad(toXY(38.05365, 127.81738), [0.94, 0.34], 4, 95),
  ]

  // 가게 박스: 길 옆으로 밀어서 길과 겹치지 않게 하고, 길 방향에 맞춰 놓는다
  const hash = (id) => [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7)
  const shops = street.map((s) => {
    const p = toXY(s.lat, s.lng)
    const t = along(p)
    let d = across(p)
    if (Math.abs(d) < 9) d = (d < 0 ? -1 : 1) * 9
    const h = hash(s.id)
    return { id: s.id, pos: at(t, d), half: [3.6, 3.4], height: 6 + (h % 6), axes: [u, n] }
  })

  // 주변 장식 건물: 고정 시드 난수로 매번 같은 배치
  let seed = 20261006
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  const nearSide = (p) =>
    sideRoads.some((r) => {
      const q = [p[0] - r.origin[0], p[1] - r.origin[1]]
      const t = q[0] * r.d[0] + q[1] * r.d[1]
      const o = -q[0] * r.d[1] + q[1] * r.d[0]
      return t > r.from - 8 && t < r.to + 8 && Math.abs(o) < 11
    })
  const decor = []
  for (let i = 0; i < 400 && decor.length < 34; i++) {
    const p = [(rand() - 0.5) * 240, (rand() - 0.5) * 240]
    const t = along(p)
    const d = across(p)
    if (Math.abs(d) < 15 && t > tMin - 6 && t < tMax + 6) continue
    if (nearSide(p)) continue
    if (shops.some((b) => Math.hypot(b.pos[0] - p[0], b.pos[1] - p[1]) < 13)) continue
    if (decor.some((b) => Math.hypot(b.pos[0] - p[0], b.pos[1] - p[1]) < 12)) continue
    decor.push({ pos: p, half: [2.5 + rand() * 3, 2.5 + rand() * 3], height: 3 + rand() * 6, axes: [u, n] })
  }

  return { toXY, road, sideRoads, shops, decor, roadDir: u }
}

// 카메라: 기준점(focus)을 화면의 (cx, cy)에 두고 θ만큼 돌린 뒤 투영
export function makeProjector({ cx, cy, scale, theta, fx, fy }) {
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  const rot = (x, y) => {
    const dx = x - fx
    const dy = y - fy
    return [dx * c - dy * s, dx * s + dy * c]
  }
  const project = (x, y, z = 0) => {
    const [rx, ry] = rot(x, y)
    return [cx + (rx - ry) * 0.866 * scale, cy + (rx + ry) * 0.5 * scale - z * scale]
  }
  // 화면 앞쪽일수록 큰 값 (그리는 순서용)
  const depth = (x, y) => {
    const [rx, ry] = rot(x, y)
    return rx + ry
  }
  // 회전된 평면에서 방향 벡터가 보는 쪽(화면 아래)을 향하는지
  const facing = (vx, vy) => vx * c - vy * s + (vx * s + vy * c) > 0
  return { project, depth, facing }
}

// 박스의 보이는 면(옆면들 + 지붕)을 화면 좌표 다각형으로
export function boxFaces(box, proj) {
  const [u, n] = box.axes
  const [hu, hn] = box.half
  const [px, py] = box.pos
  const corner = (a, b) => [px + u[0] * a + n[0] * b, py + u[1] * a + n[1] * b]
  const base = [corner(-hu, -hn), corner(hu, -hn), corner(hu, hn), corner(-hu, hn)]
  const faces = []
  for (let i = 0; i < 4; i++) {
    const a = base[i]
    const b = base[(i + 1) % 4]
    // 바깥쪽 법선 (꼭짓점이 시계 반대 방향이라고 보고 오른쪽 법선)
    const ex = b[0] - a[0]
    const ey = b[1] - a[1]
    const mid = [(a[0] + b[0]) / 2 - px, (a[1] + b[1]) / 2 - py]
    let nx = ey
    let ny = -ex
    if (nx * mid[0] + ny * mid[1] < 0) {
      nx = -nx
      ny = -ny
    }
    if (proj.facing(nx, ny)) {
      faces.push([proj.project(a[0], a[1], 0), proj.project(b[0], b[1], 0), proj.project(b[0], b[1], box.height), proj.project(a[0], a[1], box.height)])
    }
  }
  const roof = base.map(([x, y]) => proj.project(x, y, box.height))
  return { sides: faces, roof }
}

export const toPoints = (pts) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
