// MT 때 머무는 곳·작업하는 곳. 지도에 검은 사각 핀(A/D)으로 상점가 핀과 구분해 그린다.
// (예전 B 너래안·C 스테이 수페는 간판 장소 S1·S2로 옮겼다 → signPlaces.js)
// - tags: 지도 필터 카테고리. MT 식사 장소인 상점가 가게(11 오매가매)는 stores.js에서 tags에 'mt'를 단다
// - 좌표: 카카오 주소·장소 검색으로 확인한 값. A는 주소가 '죽엽산길 81-68'이고(18-68은 없는 번지),
//   처음 받은 좌표가 카카오 시설 위치와 274m 달라서 카카오 장소 좌표로 고쳤다. D는 15m 이내라 그대로.
// - 사진: public/photos/mt/ 에 `${id}_${name}_${순번}.jpg`로 넣고 photoCount만 고치면 잡힌다 (npm run check:photos)
// - 위치를 고치려면 `?edit`에서 핀을 옮긴 뒤 출력된 mtPlaces 배열로 교체한다.
export const mtPlaces = [
  { id: 'A', name: '월남파병용사만남의장', type: '숙소', tags: ['mt'], address: '화천군 간동면 죽엽산길 81-68 (오음리)', lat: 38.055273, lng: 127.834911, photoCount: 0, memo: '' },
  { id: 'D', name: '간동종합문화센터', type: '작업 장소', tags: ['mt'], address: '화천군 간동면 오음리 574-5', lat: 38.0534, lng: 127.8168, photoCount: 0, memo: '' },
]

export const isMtId = (id) => mtPlaces.some((p) => p.id === id)

// 부제용 짧은 주소: "죽엽산길 81-68", "오음리 574-5"
export const mtShortAddress = (p) => p.address.replace(/^화천군\s*간동면\s*/, '').replace(/\s*\(.*\)$/, '')

export const mtPhotoUrls = (p) =>
  Array.from({ length: p.photoCount }, (_, i) => encodeURI(`/photos/mt/${p.id}_${p.name}_${i + 1}.jpg`))
