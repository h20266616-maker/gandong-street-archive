// stores.js의 photoCount와 public/photos 안의 실제 파일이 맞는지 검사한다.
// 사용: npm run check:photos
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { stores } from '../src/data/stores.js'

const dir = fileURLToPath(new URL('../public/photos/', import.meta.url))
const files = new Set(readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.jpg')).map((f) => f.normalize('NFC')))
const expected = new Set()
let problems = 0

for (const s of stores) {
  const prefix = `${s.id}_${s.slug}_`
  const actual = [...files].filter((f) => f.startsWith(prefix)).length
  for (let n = 1; n <= s.photoCount; n++) {
    const name = `${prefix}${n}.jpg`
    expected.add(name)
    if (!files.has(name)) { console.log(`✗ 없음: ${name}`); problems++ }
  }
  const mark = actual === s.photoCount ? '✓' : '✗'
  if (actual !== s.photoCount) problems++
  console.log(`${mark} ${s.id} ${s.name.padEnd(12)} photoCount ${s.photoCount} / 실제 ${actual}`)
}

for (const f of files) if (!expected.has(f)) { console.log(`✗ stores.js에 없는 파일: ${f}`); problems++ }

console.log(`\n총 ${expected.size}장 기대, 폴더에 ${files.size}장.`)
if (problems) { console.log(`문제 ${problems}건`); process.exit(1) }
console.log('모든 사진 경로가 맞습니다.')
