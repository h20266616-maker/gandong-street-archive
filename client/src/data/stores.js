// 거리 순서대로 정렬된 가게 목록.
// - slug: 사진 파일명에 쓰인 이름 (파일명 규칙: `${id}_${slug}_${순번}.jpg`)
// - photoCount: public/photos 안의 사진 수 (npm run check:photos 로 검증)
// - lat/lng: 카카오 주소 검색(번지 단위)으로 조회해 고정한 값. 런타임에는 조회하지 않는다.
//   07은 306 번지가 검색되지 않아 우체국 옆에, 312의 세 가게(11·12·13)는 같은 건물 안에서 조금씩 떨어뜨려 놓았다.
//   위치를 고치려면 `?edit` 모드에서 핀을 옮긴 뒤 출력된 배열로 이 파일의 stores를 교체한다.
// - lat/lng가 null인 가게는 목록에만 나오고 지도 핀은 숨겨진다.
export const stores = [
  { id: '01', name: '식물의정석', slug: '식물의정석', address: '', category: '꽃·식물', photoCount: 7, lat: null, lng: null, note: '주소 확인 필요 (카카오맵 검색: 간동면 유촌리 1043-4)' },
  { id: '02', name: '간동식육점', slug: '간동식육점', address: '간척월명로 300', category: '정육점', photoCount: 3, lat: 38.054012, lng: 127.817375, note: '' },
  { id: '03', name: '낭천고을', slug: '낭천고을', address: '간척월명로 302', category: '식당', photoCount: 4, lat: 38.054222, lng: 127.817429, note: '' },
  { id: '04', name: '꽃돼지국밥', slug: '꽃돼지국밥', address: '간척월명로 304', category: '식당', photoCount: 2, lat: 38.054315, lng: 127.817465, note: '' },
  { id: '05', name: '형제떡방앗간', slug: '형제떡방앗간', address: '간척월명로 304-6', category: '떡·방앗간', photoCount: 2, lat: 38.054407, lng: 127.817704, note: '' },
  { id: '06', name: '무래이커피 (MOORAEE COFFEE)', slug: '무래이커피', address: '간척월명로 305-1', category: '카페', photoCount: 3, lat: 38.054531, lng: 127.817186, note: '' },
  { id: '07', name: '다올미용실', slug: '다올미용실', address: '간척월명로 306 부근', category: '미용실', photoCount: 2, lat: 38.05458, lng: 127.81708, note: '우체국 옆' },
  { id: '08', name: '간동우체국', slug: '간동우체국', address: '간척월명로 307', category: '공공기관', photoCount: 3, lat: 38.054629, lng: 127.816974, note: '' },
  { id: '09', name: '서울식당', slug: '서울식당', address: '간척월명로 309', category: '한식', photoCount: 3, lat: 38.054964, lng: 127.817263, note: '생선구이·불고기' },
  { id: '10', name: '남가식당', slug: '남가식당', address: '간척월명로 311-1', category: '한식뷔페', photoCount: 4, lat: 38.05512, lng: 127.817338, note: '가정식백반' },
  { id: '11', name: '오매가매', slug: '오매가매', address: '간척월명로 312', category: '한식', photoCount: 3, lat: 38.05504, lng: 127.81768, note: '닭도리탕·찌개' },
  { id: '12', name: '또래오래 간동점', slug: '또래오래', address: '간척월명로 312', category: '치킨·피자', photoCount: 2, lat: 38.0551, lng: 127.81775, note: '오매가매 바로 옆' },
  { id: '13', name: '미정이네', slug: '미정이네', address: '간척월명로 312', category: '분식', photoCount: 2, lat: 38.05518, lng: 127.81766, note: '김밥·라면·돈까스' },
]

export const hasCoords = (s) => s.lat != null && s.lng != null

// 상점가 한가운데 (간동우체국 부근). 지도 초기 중심이자 편집 모드에서 미정 핀을 놓는 기준점
export const MAP_CENTER = [38.0546, 127.8173]

// 지도에 찍을 핀 목록. 편집 모드에서는 좌표 없는 가게도 기준점 근처에 회색 핀(unplaced)으로 띄워서 옮길 수 있게 한다.
export const pinsFor = (list, editMode, anchor) => {
  if (!editMode) return list.filter(hasCoords)
  let n = 0
  return list.map((s) =>
    hasCoords(s) ? s : { ...s, lat: anchor[0] - 0.0004, lng: anchor[1] - 0.0004 + n++ * 0.0004, unplaced: true },
  )
}

// 사진 경로는 데이터로부터 만든다. 파일명이 한글이라 encodeURI 필수.
export const photoUrl = (store, n) => encodeURI(`/photos/${store.id}_${store.slug}_${n}.jpg`)
export const photoUrls = (store) =>
  Array.from({ length: store.photoCount }, (_, i) => photoUrl(store, i + 1))
export const thumbUrl = (store) => photoUrl(store, 1)
