// stores.js의 photoCount와 public/photos 안의 실제 파일이 맞는지 검사한다.
// 사용: npm run check:photos
import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { stores } from '../src/data/stores.js'
import { mtPlaces } from '../src/data/mtPlaces.js'

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

// MT 장소 사진 (public/photos/mt/, 폴더가 없으면 0장)
const mtDir = fileURLToPath(new URL('../public/photos/mt/', import.meta.url))
const mtFiles = existsSync(mtDir) ? readdirSync(mtDir).filter((f) => f.toLowerCase().endsWith('.jpg')).map((f) => f.normalize('NFC')) : []
const mtExpected = new Set()
for (const p of mtPlaces) {
  const prefix = `${p.id}_${p.name}_`
  const actual = mtFiles.filter((f) => f.startsWith(prefix)).length
  for (let n = 1; n <= p.photoCount; n++) {
    const name = `${prefix}${n}.jpg`
    mtExpected.add(name)
    if (!mtFiles.includes(name)) { console.log(`✗ 없음: mt/${name}`); problems++ }
  }
  if (actual !== p.photoCount) problems++
  console.log(`${actual === p.photoCount ? '✓' : '✗'} MT ${p.id} ${p.name.padEnd(12)} photoCount ${p.photoCount} / 실제 ${actual}`)
}
for (const f of mtFiles) if (!mtExpected.has(f)) { console.log(`✗ mtPlaces.js에 없는 파일: mt/${f}`); problems++ }

console.log(`\n총 ${expected.size + mtExpected.size}장 기대, 폴더에 ${files.size + mtFiles.length}장.`)
if (problems) { console.log(`문제 ${problems}건`); process.exit(1) }
console.log('모든 사진 경로가 맞습니다.')
