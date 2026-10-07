// 상점가 가게와 MT 장소를 목록·지도·상세에서 같은 모양으로 다루기 위한 묶음
import { fullAddress, photoUrls, shortAddress, thumbOf } from './stores.js'
import { mtPhotoUrls, mtShortAddress } from './mtPlaces.js'

// 아래 탭바 (엄지로 누르기 쉽게 화면 아래). 처음엔 지도
export const TABS = [
  { key: 'tt', label: '타임테이블' },
  { key: 'map', label: '지도' },
  { key: 'shop', label: '상점가' },
  { key: 'notice', label: '공지' },
  { key: 'call', label: '비상연락망' },
]

// 지도 아래 카드 줄 순서: 상점가 02~13 → 식물의정석(01) → D → B → A → C
const MT_ORDER = ['D', 'B', 'A', 'C']
export const cardOrder = (places) => [
  ...places.filter((p) => p.kind === 'shop'),
  ...places.filter((p) => p.kind === 'annex'),
  ...MT_ORDER.map((id) => places.find((p) => p.id === id)).filter(Boolean),
]

// 지도 탭 카테고리 필터. 상점가는 별관(식물의정석)까지 포함
export const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'shop', label: '상점가' },
  { key: 'mt', label: 'MT 장소' },
]
export const inFilter = (f, p) => f === 'all' || (f === 'mt' ? p.kind === 'mt' : p.kind !== 'mt')

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
      subNoPhotos: subtitle(s.annex ? '상점가 밖' : '상점가', shortAddress(s), 0),
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
      subNoPhotos: subtitle(p.type, mtShortAddress(p), 0),
      full: `강원특별자치도 ${p.address.replace(/\s*\(.*\)$/, '')}`,
      photos,
      thumb: photos[0] ? thumbOf(photos[0]) : null,
    }
  }),
]

// 카드 순서에서 이전·다음 장소 (끝에서 처음으로 돈다)
export function placeNeighbors(order, id) {
  const i = order.findIndex((p) => p.id === id)
  if (i < 0 || order.length < 2) return { prev: null, next: null }
  return { prev: order[(i - 1 + order.length) % order.length], next: order[(i + 1) % order.length] }
}

// 카카오맵 길찾기 링크
export const directionsUrl = (p) => `https://map.kakao.com/link/to/${encodeURIComponent(p.name)},${p.lat},${p.lng}`
