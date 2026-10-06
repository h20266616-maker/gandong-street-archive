// MT 때 머문 곳·간 곳. 지도에 검은 사각 핀(A/B/C/D)으로 상점가 핀과 구분해 그린다.
// - 좌표: 카카오 주소·장소 검색으로 확인한 값. A는 주소가 '죽엽산길 81-68'이고(18-68은 없는 번지),
//   처음 받은 좌표가 카카오 시설 위치와 274m 달라서 카카오 장소 좌표로 고쳤다. B·C·D는 15m 이내라 그대로.
// - 사진: public/photos/mt/ 에 `${id}_${name}_${순번}.jpg`로 넣고 photoCount만 고치면 잡힌다 (npm run check:photos)
// - 위치를 고치려면 `?edit`에서 핀을 옮긴 뒤 출력된 mtPlaces 배열로 교체한다.
export const mtPlaces = [
  { id: 'A', name: '월남파병용사만남의장', type: '숙소', address: '화천군 간동면 죽엽산길 81-68 (오음리)', lat: 38.055273, lng: 127.834911, photoCount: 0, memo: '' },
  { id: 'B', name: '너래안', type: 'MT 장소', address: '화천군 간동면 간척월명로 281-13', lat: 38.0516, lng: 127.8165, photoCount: 0, memo: '' },
  { id: 'C', name: '스테이 수페', type: 'MT 장소', address: '화천군 간동면 동림길 175-50', lat: 38.0488, lng: 127.8344, photoCount: 0, memo: '' },
  { id: 'D', name: '간동종합문화센터', type: 'MT 장소 · 작업', address: '화천군 간동면 오음리 574-5', lat: 38.0534, lng: 127.8168, photoCount: 0, memo: '' },
]

export const isMtId = (id) => mtPlaces.some((p) => p.id === id)

// 부제용 짧은 주소: "죽엽산길 81-68", "오음리 574-5"
export const mtShortAddress = (p) => p.address.replace(/^화천군\s*간동면\s*/, '').replace(/\s*\(.*\)$/, '')

export const mtPhotoUrls = (p) =>
  Array.from({ length: p.photoCount }, (_, i) => encodeURI(`/photos/mt/${p.id}_${p.name}_${i + 1}.jpg`))
