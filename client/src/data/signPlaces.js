// 간판 작업 장소 (상점가가 아닌 곳). 지도에 흰 마름모 핀(S1, S2, …)으로 그린다.
// - tags: 지도 필터 카테고리. 상점가 가게 중 간판 작업을 하는 곳은 stores.js에서 tags에 'sign'을 단다
// - S1·S2는 예전 MT 장소 B·C였던 곳이라 좌표를 그대로 쓴다 (카카오 주소 검색으로 확인한 값)
// - lat/lng가 null이면 지도 핀 없이 카드에만 나오고, 부제는 '간판 · 위치 확인 필요'. 좌표를 넣으면 핀이 자동으로 생긴다
// - 사진: public/photos/sign/ 에 `${id}_${name}_${순번}.jpg`로 넣고 photoCount만 고친다
export const signPlaces = [
  { id: 'S1', name: '너래안', tags: ['sign'], address: '화천군 간동면 간척월명로 281-13', lat: 38.0516, lng: 127.8165, photoCount: 0, memo: '' },
  { id: 'S2', name: '스테이 수페', tags: ['sign'], address: '화천군 간동면 동림길 175-50', lat: 38.0488, lng: 127.8344, photoCount: 0, memo: '' },
  { id: 'S3', name: '오월농원', tags: ['sign'], address: '', lat: null, lng: null, photoCount: 0, memo: '' },
]

export const isSignId = (id) => signPlaces.some((p) => p.id === id)

// 부제용 짧은 주소: "간척월명로 281-13". 주소가 없으면 ''
export const signShortAddress = (p) => p.address.replace(/^화천군\s*간동면\s*/, '').replace(/\s*\(.*\)$/, '')

export const signPhotoUrls = (p) =>
  Array.from({ length: p.photoCount }, (_, i) => encodeURI(`/photos/sign/${p.id}_${p.name}_${i + 1}.jpg`))
