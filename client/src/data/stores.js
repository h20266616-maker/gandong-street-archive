// 거리 순서대로 정렬된 가게 목록.
// - slug: 사진 파일명에 쓰인 이름 (파일명 규칙: `${id}_${slug}_${순번}.jpg`)
// - photoCount: public/photos 안의 사진 수 (npm run check:photos 로 검증)
// - lat/lng: 307 간동우체국만 Nominatim 번지 단위로 잡힘. 나머지는 OSM 기준점
//   (292 오음보건진료소, 307 간동우체국) 사이를 번지 순서대로 보간한 근사값.
//   정확한 위치는 `?edit` 모드에서 핀을 옮긴 뒤 출력된 배열로 이 파일을 교체한다.
// - lat/lng가 null인 가게는 목록에만 나오고 지도 핀은 숨겨진다.
export const stores = [
  { id: '01', name: '식물의정석', slug: '식물의정석', address: '', category: '꽃·식물', photoCount: 7, lat: null, lng: null, note: '주소 미정 (TODO)' },
  { id: '02', name: '간동식육점', slug: '간동식육점', address: '간척월명로 300', category: '정육점', photoCount: 3, lat: 38.054047, lng: 127.81735, note: '' },
  { id: '03', name: '낭천고을', slug: '낭천고을', address: '간척월명로 302', category: '식당', photoCount: 4, lat: 38.054234, lng: 127.81739, note: '' },
  { id: '04', name: '꽃돼지국밥', slug: '꽃돼지국밥', address: '간척월명로 304', category: '식당', photoCount: 2, lat: 38.05442, lng: 127.81743, note: '' },
  { id: '05', name: '형제떡방앗간', slug: '형제떡방앗간', address: '간척월명로 304-6', category: '떡·방앗간', photoCount: 2, lat: 38.05449, lng: 127.81751, note: '' },
  { id: '06', name: '무래이커피 (MOORAEE COFFEE)', slug: '무래이커피', address: '간척월명로 305-1', category: '카페', photoCount: 3, lat: 38.05456, lng: 127.8173, note: '' },
  { id: '07', name: '다올미용실', slug: '다올미용실', address: '간척월명로 306 부근', category: '미용실', photoCount: 2, lat: 38.05464, lng: 127.81722, note: '우체국 옆' },
  { id: '08', name: '간동우체국', slug: '간동우체국', address: '간척월명로 307', category: '공공기관', photoCount: 3, lat: 38.054704, lng: 127.817149, note: '' },
  { id: '09', name: '서울식당', slug: '서울식당', address: '간척월명로 309', category: '한식', photoCount: 3, lat: 38.054887, lng: 127.81733, note: '생선구이·불고기' },
  { id: '10', name: '남가식당', slug: '남가식당', address: '간척월명로 311-1', category: '한식뷔페', photoCount: 4, lat: 38.05507, lng: 127.81738, note: '가정식백반' },
  { id: '11', name: '오매가매', slug: '오매가매', address: '간척월명로 312', category: '한식', photoCount: 3, lat: 38.055167, lng: 127.81756, note: '닭도리탕·찌개' },
  { id: '12', name: '또래오래 간동점', slug: '또래오래', address: '간척월명로 312', category: '치킨·피자', photoCount: 2, lat: 38.0553, lng: 127.81762, note: '오매가매 바로 옆' },
  { id: '13', name: '미정이네', slug: '미정이네', address: '', category: '분식', photoCount: 2, lat: null, lng: null, note: '김밥·라면·돈까스 · 주소 미정 (TODO)' },
]

export const hasCoords = (s) => s.lat != null && s.lng != null

// 사진 경로는 데이터로부터 만든다. 파일명이 한글이라 encodeURI 필수.
export const photoUrl = (store, n) => encodeURI(`/photos/${store.id}_${store.slug}_${n}.jpg`)
export const photoUrls = (store) =>
  Array.from({ length: store.photoCount }, (_, i) => photoUrl(store, i + 1))
export const thumbUrl = (store) => photoUrl(store, 1)
