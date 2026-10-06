// 상점가 가게와 MT 장소를 목록·지도·상세에서 같은 모양으로 다루기 위한 묶음
import { filterByCat, fullAddress, photoUrls, shortAddress, thumbOf } from './stores.js'
import { mtPhotoUrls, mtShortAddress } from './mtPlaces.js'

export const toPlaces = (stores, mts) => [
  ...stores.map((s) => {
    const photos = photoUrls(s)
    return {
      ...s,
      kind: s.annex ? 'annex' : 'shop',
      label: s.id,
      short: shortAddress(s),
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
      full: `강원특별자치도 ${p.address.replace(/\s*\(.*\)$/, '')}`,
      photos,
      thumb: photos[0] ? thumbOf(photos[0]) : null,
    }
  }),
]

// 목록 순서와 구분: 상점가 → MT 장소 → 상점가 밖(별관). 칩 필터를 따른다.
// 반환: [{ title | null, items }]
export function listSections(places, chip) {
  if (chip === 'mt') return [{ title: null, items: places.filter((p) => p.kind === 'mt') }]
  const shops = places.filter((p) => p.kind !== 'mt')
  const inChip = chip === 'all' ? shops : filterByCat(shops, chip)
  const sections = [{ title: null, items: inChip.filter((p) => p.kind === 'shop') }]
  if (chip === 'all') sections.push({ title: 'MT 장소', items: places.filter((p) => p.kind === 'mt') })
  sections.push({ title: '상점가 밖', items: inChip.filter((p) => p.kind === 'annex') })
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
