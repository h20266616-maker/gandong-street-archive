// 거리 순서대로 정렬된 가게 목록.
// - slug: 사진 파일명에 쓰인 이름 (파일명 규칙: `${id}_${slug}_${순번}.jpg`)
// - photoCount: public/photos 안의 사진 수 (npm run check:photos 로 검증)
// - group: 'shop' (상점가). tags: 지도 필터 카테고리 (상점가는 모두 'shop', 간판 작업 가게는 'sign', MT 식사 장소는 'mt'도).
//   tags에 'shop'이 없는 곳(01 식물의정석)은 간판 장소로 다룬다: ◇ 핀, 상점가 탭·필터에서 빠지고 signNo(S4)로 표시
// - staff: 담당자 이름 배열. 상점가 탭·지도 카드·상세에 '담당 이름 · 이름'으로 나온다 (없으면 줄이 안 나온다)
// - id: 사진 파일명·링크(?shop=06)에 쓰는 내부 번호라 바꾸지 않는다. 화면 번호는 상점가 순서대로 01부터 다시 매긴다 (places.js)
//   (03 낭천고을, 09 서울식당은 2026-10-08에 삭제) memo: 상세에 라벨 없이 한 줄로 나오는 기록 (없으면 '')
// - lat/lng: 카카오 주소 검색(번지 단위)으로 조회해 고정한 값. 런타임에는 조회하지 않는다.
//   07은 306 번지가 검색되지 않아 우체국 옆에, 312의 세 가게(11·12·13)는 312 좌표를 가운데(12)로 두고
//   도로 방향(북북동)을 따라 약 12m 간격으로 벌려 놓았다.
//   위치를 고치려면 `?edit` 모드에서 핀을 옮긴 뒤 출력된 배열로 이 파일의 stores를 교체한다.
// - annex: 상점가에서 3km 떨어진 곳. 전체 필터의 지도 범위에서 빠진다 (간판 필터에서는 들어간다).
// - lat/lng가 null인 가게는 목록에만 나오고 지도 핀은 숨겨진다.
export const stores = [
  { id: '01', group: 'sign', tags: ['sign'], signNo: 'S4', memo: '', name: '식물의정석', slug: '식물의정석', address: '간동면 유촌리 1043-4', photoCount: 7, lat: 38.045355, lng: 127.783793, note: '', annex: true, distanceNote: '상점가에서 서쪽 약 3km' },
  { id: '02', group: 'shop', tags: ['shop'], staff: ['이예다'], memo: '', name: '간동식육점', slug: '간동식육점', address: '간척월명로 300', photoCount: 3, lat: 38.054012, lng: 127.817375, note: '' },
  { id: '04', group: 'shop', tags: ['shop'], staff: ['이신우'], memo: '', name: '꽃돼지국밥', slug: '꽃돼지국밥', address: '간척월명로 304', photoCount: 2, lat: 38.054315, lng: 127.817465, note: '' },
  { id: '05', group: 'shop', tags: ['shop'], staff: ['이건희'], memo: '', name: '형제떡방앗간', slug: '형제떡방앗간', address: '간척월명로 304-6', photoCount: 2, lat: 38.054407, lng: 127.817704, note: '' },
  { id: '06', group: 'shop', tags: ['shop', 'sign'], staff: ['엄예준'], memo: '', name: '무래이커피 (MOORAEE COFFEE)', slug: '무래이커피', address: '간척월명로 305-1', photoCount: 3, lat: 38.054531, lng: 127.817186, note: '' },
  { id: '07', group: 'shop', tags: ['shop'], staff: ['이해찬'], memo: '', name: '다올미용실', slug: '다올미용실', address: '간척월명로 306 부근', photoCount: 2, lat: 38.05458, lng: 127.81708, note: '우체국 옆' },
  { id: '08', group: 'shop', tags: ['shop'], staff: ['이예다'], memo: '', name: '간동우체국', slug: '간동우체국', address: '간척월명로 307', photoCount: 3, lat: 38.054629, lng: 127.816974, note: '' },
  { id: '10', group: 'shop', tags: ['shop'], staff: ['주이준'], memo: '붉은 기와지붕 아래 가정식 백반 뷔페.', name: '남가식당', slug: '남가식당', address: '간척월명로 311-1', photoCount: 4, lat: 38.05512, lng: 127.817338, note: '가정식백반' },
  { id: '11', group: 'shop', tags: ['shop', 'mt'], staff: ['엄예준'], memo: '', name: '오매가매', slug: '오매가매', address: '간척월명로 312', photoCount: 3, lat: 38.054983, lng: 127.817594, note: '닭도리탕·찌개' },
  { id: '12', group: 'shop', tags: ['shop'], staff: ['김연우'], memo: '', name: '또래오래 간동점', slug: '또래오래', address: '간척월명로 312', photoCount: 2, lat: 38.055084, lng: 127.817643, note: '오매가매 바로 옆' },
  { id: '13', group: 'shop', tags: ['shop'], staff: ['안치윤'], memo: '', name: '미정이네', slug: '미정이네', address: '간척월명로 312', photoCount: 2, lat: 38.055185, lng: 127.817692, note: '김밥·라면·돈까스' },
]

export const hasCoords = (s) => s.lat != null && s.lng != null

// 지도 첫 화면 범위에 쓰는 상점가 가게 (별관 제외)
export const streetStores = (list) => list.filter((s) => hasCoords(s) && !s.annex)


// 짧은 주소: 상점가는 "간척월명로 311-1", 별관은 "유촌리 1043-4"
export const shortAddress = (s) => s.address.replace(/^간동면\s*/, '')

const PROVINCE = '강원특별자치도 화천군'
export const fullAddress = (s) =>
  !s.address ? '' : s.address.startsWith('간동면') ? `${PROVINCE} ${s.address}` : `${PROVINCE} 간동면 ${s.address}`


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
// 목록용 400px 썸네일 (npm run thumbs 로 public/photos/thumb/ 에 만든다)
export const thumbOf = (url) => url.replace('/photos/', '/photos/thumb/')

