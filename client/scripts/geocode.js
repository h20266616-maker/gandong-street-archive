// 개발용: OpenStreetMap Nominatim으로 주소를 한 번 조회해 좌표를 출력한다.
// 결과는 src/data/stores.js에 손으로 고정한다. (런타임에는 호출하지 않음)
// 사용: npm run geocode
const BASE = '강원특별자치도 화천군 간동면 간척월명로'
const numbers = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['300', '302', '304', '304-6', '305-1', '306', '307', '309', '311-1', '312']

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

for (const n of numbers) {
  const q = `${BASE} ${n}`
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=kr&q=${encodeURIComponent(q)}`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'gandong-street-archive (dev geocode)' } })
    const [hit] = await res.json()
    console.log(n.padEnd(6), hit ? `${(+hit.lat).toFixed(6)}, ${(+hit.lon).toFixed(6)}  ${hit.display_name}` : '— 결과 없음')
  } catch (e) {
    console.log(n.padEnd(6), '오류:', e.message)
  }
  await sleep(1100) // Nominatim 이용 정책: 초당 1회
}
