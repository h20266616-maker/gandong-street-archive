// 목록용 400px 썸네일을 만든다: public/photos/**/*.jpg → public/photos/thumb/**/*.jpg (같은 이름)
// 사진을 새로 넣으면 다시 실행한다. 사용: npm run thumbs
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = fileURLToPath(new URL('../public/photos/', import.meta.url))
const out = join(root, 'thumb')
let made = 0
let kept = 0

async function walk(dir, rel = '') {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name !== 'thumb') await walk(full, join(rel, name))
      continue
    }
    if (!name.toLowerCase().endsWith('.jpg')) continue
    const target = join(out, rel, name)
    if (existsSync(target) && statSync(target).mtimeMs >= statSync(full).mtimeMs) {
      kept++
      continue
    }
    mkdirSync(join(out, rel), { recursive: true })
    await sharp(full).rotate().resize(400, 400, { fit: 'inside' }).jpeg({ quality: 78, mozjpeg: true }).toFile(target)
    made++
  }
}

await walk(root)
console.log(`썸네일 ${made}장 새로 만듦, ${kept}장 그대로.`)
