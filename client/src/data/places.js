// 상점가 가게와 MT 장소를 목록·지도·상세에서 같은 모양으로 다루기 위한 묶음
import { fullAddress, photoUrls, shortAddress, thumbOf } from './stores.js'
import { mtPhotoUrls, mtShortAddress } from './mtPlaces.js'

// 위쪽 탭. map: 지도 목록 탭, page: 시트를 full로 올려 페이지를 보여주는 탭
export const TABS = [
  { key: 'tt', label: '타임테이블', page: true },
  { key: 'all', label: '전체', title: '전체' },
  { key: 'shop', label: '상점가 리스트', title: '간척월명로 상점가' },
  { key: 'notice', label: '공지', page: true },
  { key: 'call', label: '비상연락망', page: true },
]
export const isPageTab = (key) => Boolean(TABS.find((t) => t.key === key)?.page)

// 목록 행·상세 부제: "상점가 · 간척월명로 300 · 사진 3", "숙소 · 죽엽산길 81-68"
const subtitle = (head, short, n) => [head, short, n ? `사진 ${n}` : null].filter(Boolean).join(' · ')

export const toPlaces = (stores, mts) => [
  ...stores.map((s) => {
    const photos = photoUrls(s)
    return {
      ...s,
      kind: s.annex ? 'annex' : 'shop',
      label: s.id,
      short: shortAddress(s),
      sub: subtitle(s.annex ? '상점가 밖' : '상점가', shortAddress(s), photos.length),
      full: fullAddress(s),
      photos,
      thumb: photos[0] ? thumbOf(photos[0]) : null,
    }
  }),
  ...mts.map((p) => {
    const photos = mtPhotoUrls(p)
    return {
      ...p,
      kind: 'mt',
      label: `MT · ${p.id}`,
      short: mtShortAddress(p),
      sub: subtitle(p.type, mtShortAddress(p), photos.length),
      full: `강원특별자치도 ${p.address.replace(/\s*\(.*\)$/, '')}`,
      photos,
      thumb: photos[0] ? thumbOf(photos[0]) : null,
    }
  }),
]

// 목록 순서와 구분: 상점가 → MT 장소 → 상점가 밖(별관). 'shop' 탭이면 MT 장소를 뺀다.
// 반환: [{ title | null, items }]
export function listSections(places, tab) {
  const of = (kind) => places.filter((p) => p.kind === kind)
  const sections = [{ title: null, items: of('shop') }]
  if (tab !== 'shop') sections.push({ title: 'MT 장소', items: of('mt') })
  sections.push({ title: '상점가 밖', items: of('annex') })
  return sections.filter((s) => s.items.length)
}

// 칩 안에서 이전·다음 장소 (목록 순서대로 돈다)
export function placeNeighbors(sections, id) {
  const order = sections.flatMap((s) => s.items)
  const i = order.findIndex((p) => p.id === id)
  if (i < 0 || order.length < 2) return { prev: null, next: null }
  return { prev: order[(i - 1 + order.length) % order.length], next: order[(i + 1) % order.length] }
}

// 카카오맵 길찾기 링크
export const directionsUrl = (p) => `https://map.kakao.com/link/to/${encodeURIComponent(p.name)},${p.lat},${p.lng}`
