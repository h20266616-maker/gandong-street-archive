// 상점가 가게와 MT 장소를 목록·지도·상세에서 같은 모양으로 다루기 위한 묶음
import { fullAddress, photoUrls, shortAddress, thumbOf } from './stores.js'
import { mtPhotoUrls, mtShortAddress } from './mtPlaces.js'
import { signPhotoUrls, signShortAddress } from './signPlaces.js'

// 아래 탭바 (엄지로 누르기 쉽게 화면 아래). 처음엔 지도
export const TABS = [
  { key: 'tt', label: '타임테이블' },
  { key: 'map', label: '지도' },
  { key: 'shop', label: '상점가' },
  { key: 'notice', label: '공지' },
  { key: 'call', label: '비상연락망' },
]

// 지도 아래 카드 줄 순서: 상점가 01~10 → D → A → 간판 S1~S4
const MT_ORDER = ['D', 'A']
export const cardOrder = (places) => [
  ...places.filter((p) => p.kind === 'shop'),
  ...MT_ORDER.map((id) => places.find((p) => p.id === id)).filter(Boolean),
  ...places.filter((p) => p.kind === 'mt' && !MT_ORDER.includes(p.id)),
  ...places.filter((p) => p.kind === 'sign').sort((a, b) => a.no.localeCompare(b.no, 'en', { numeric: true })),
]

// 지도 탭 카테고리 필터. 장소 하나가 여러 카테고리에 들 수 있다 (tags)
export const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'shop', label: '상점가' },
  { key: 'mt', label: 'MT 장소' },
  { key: 'sign', label: '간판' },
]
export const inFilter = (f, p) => f === 'all' || p.tags.includes(f)

// 좌표가 있어야 지도에 핀이 생긴다
export const onMap = (p) => p.lat != null && p.lng != null

// 상점가 가게에 붙은 다른 태그를 부제에 쓸 때의 이름: "상점가 · 간판 · …", "상점가 · MT 식사 · …"
const SHOP_TAG_LABEL = { sign: '간판', mt: 'MT 식사' }

// 담당자 줄: "담당 이신우", 둘 이상이면 "담당 이예다 · 홍길동". 없으면 null (줄을 그리지 않는다)
export const staffLine = (p) => (p.staff?.length ? `담당 ${p.staff.join(' · ')}` : null)

// 목록 행·상세 부제: "상점가 · 간척월명로 300 · 사진 3", "숙소 · 죽엽산길 81-68"
const subtitle = (head, short, n) => [head, short, n ? `사진 ${n}` : null].filter(Boolean).join(' · ')

const card = (p, photos) => ({ ...p, photos, thumb: photos[0] ? thumbOf(photos[0]) : null })

// 화면 번호(no): 상점가는 데이터 순서대로 01부터, 상점가가 아닌 가게는 signNo, MT·간판 장소는 id
export const toPlaces = (stores, mts, signs = []) => {
  let n = 0
  return [
  ...stores.map((s) => {
    const photos = photoUrls(s)
    const tags = s.tags ?? ['shop']
    if (!tags.includes('shop')) {
      // 간판 장소인 가게 (식물의정석): 사진·위치는 stores.js 그대로, 모양과 번호는 간판 장소
      const no = s.signNo ?? s.id
      return card({
        ...s,
        tags,
        kind: 'sign',
        no,
        label: `간판 · ${no}`,
        short: shortAddress(s),
        sub: subtitle('간판', shortAddress(s), photos.length),
        subNoPhotos: subtitle('간판', shortAddress(s), 0),
        full: fullAddress(s),
      }, photos)
    }
    const no = String(++n).padStart(2, '0')
    const head = [s.annex ? '상점가 밖' : '상점가', ...tags.filter((t) => t !== 'shop').map((t) => SHOP_TAG_LABEL[t])].join(' · ')
    return card({
      ...s,
      tags,
      kind: 'shop',
      no,
      label: no,
      short: shortAddress(s),
      sub: subtitle(head, shortAddress(s), photos.length),
      subNoPhotos: subtitle(head, shortAddress(s), 0),
      full: fullAddress(s),
    }, photos)
  }),
  ...mts.map((p) => {
    const photos = mtPhotoUrls(p)
    return card({
      ...p,
      tags: p.tags ?? ['mt'],
      kind: 'mt',
      no: p.id,
      label: `MT · ${p.id}`,
      short: mtShortAddress(p),
      sub: subtitle(p.type, mtShortAddress(p), photos.length),
      subNoPhotos: subtitle(p.type, mtShortAddress(p), 0),
      full: `강원특별자치도 ${p.address.replace(/\s*\(.*\)$/, '')}`,
    }, photos)
  }),
  ...signs.map((p) => {
    const photos = signPhotoUrls(p)
    const short = onMap(p) ? signShortAddress(p) || '' : '위치 확인 필요'
    return card({
      ...p,
      tags: p.tags ?? ['sign'],
      kind: 'sign',
      no: p.id,
      label: `간판 · ${p.id}`,
      short,
      sub: subtitle('간판', short, photos.length),
      subNoPhotos: subtitle('간판', short, 0),
      full: p.address ? `강원특별자치도 ${p.address}` : '',
    }, photos)
  }),
  ]
}

// 카드 순서에서 이전·다음 장소 (끝에서 처음으로 돈다)
export function placeNeighbors(order, id) {
  const i = order.findIndex((p) => p.id === id)
  if (i < 0 || order.length < 2) return { prev: null, next: null }
  return { prev: order[(i - 1 + order.length) % order.length], next: order[(i + 1) % order.length] }
}

// 카카오맵 길찾기 링크
export const directionsUrl = (p) => `https://map.kakao.com/link/to/${encodeURIComponent(p.name)},${p.lat},${p.lng}`
