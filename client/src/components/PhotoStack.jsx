import { useEffect, useRef, useState } from 'react'
import { photoUrls } from '../data/stores.js'

const VISIBLE = 5
const EASE = 'cubic-bezier(.2,.75,.2,1)'
const slot = (d) => `translate3d(${d * 24}px, ${-d * 16}px, ${-d * 90}px) rotateY(-18deg) rotateX(4deg)`
const ENTER = 'translate3d(-80px,40px,-320px) rotateY(-40deg)'
const LEAVE = 'translate3d(-120px,60px,140px) rotateY(10deg)'
const LEAVE_MS = 420

// 한 가게의 사진 더미. 가게가 바뀌면 부모가 key로 새로 만들어서 카드가 날아 들어온다.
// index = 맨 앞 사진. 다음 사진으로 넘기면 맨 앞 카드가 빠지며 사라지고, 맨 뒤로 순환한다
export default function PhotoStack({ store, index, onIndex, onNext, onPrev, frontRef }) {
  const photos = photoUrls(store)
  const n = photos.length
  const [entered, setEntered] = useState(false)
  const [leaving, setLeaving] = useState(null)
  const [snap, setSnap] = useState(null)
  const prevIndex = useRef(index)
  const touchX = useRef(null)

  // 처음엔 날아오기 전 자리에 두고, 다음 프레임에 제자리로 보낸다
  useEffect(() => {
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setEntered(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [])

  // 한 장 넘겼을 때만 빠지는 애니메이션. 끝나면 전환 없이 맨 뒤로 옮긴 뒤 다시 보이게 한다
  useEffect(() => {
    const old = prevIndex.current
    prevIndex.current = index
    if (n < 2 || index !== (old + 1) % n) return undefined
    setLeaving(old)
    let raf = 0
    const t = setTimeout(() => {
      setLeaving(null)
      setSnap(old)
      raf = requestAnimationFrame(() => requestAnimationFrame(() => setSnap(null)))
    }, LEAVE_MS)
    return () => {
      clearTimeout(t)
      cancelAnimationFrame(raf)
    }
  }, [index, n])

  return (
    <div
      className="relative aspect-[4/3] w-full"
      style={{ perspective: '1400px' }}
      onTouchStart={(e) => {
        e.stopPropagation()
        touchX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        e.stopPropagation()
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        touchX.current = null
        if (Math.abs(dx) > 40) (dx < 0 ? onNext : onPrev)()
      }}
    >
      {photos.map((src, i) => {
        const d = (i - index + n) % n
        let transform = slot(Math.min(d, VISIBLE))
        let opacity = d < VISIBLE ? 1 : 0
        // 제자리로 갈 때는 뒤 카드일수록 조금씩 늦게 (shorthand 안에 지연을 넣는다)
        const delay = `${Math.min(d, VISIBLE) * 45}ms`
        let transition = `transform .6s ${EASE} ${delay}, opacity .6s ${EASE} ${delay}`
        if (!entered) {
          transform = ENTER
          opacity = 0
          transition = 'none'
        } else if (leaving === i) {
          transform = LEAVE
          opacity = 0
          transition = `transform ${LEAVE_MS}ms ${EASE}, opacity ${LEAVE_MS}ms ${EASE}`
        } else if (snap === i) {
          opacity = 0
          transition = 'none'
        }
        const isFront = d === 0 && leaving !== i
        return (
          <button
            key={src}
            ref={isFront ? frontRef : undefined}
            type="button"
            onClick={() => (d === 0 ? onNext() : onIndex(i))}
            aria-label={d === 0 ? '다음 사진' : `${i + 1}번째 사진 앞으로`}
            className="absolute inset-0 block border border-black bg-white"
            style={{
              transform,
              opacity,
              transition,
              zIndex: leaving === i ? 20 : 10 - Math.min(d, VISIBLE),
              transformOrigin: '50% 50%',
              pointerEvents: d < VISIBLE ? 'auto' : 'none',
            }}
          >
            <img src={src} alt={`${store.name} ${i + 1}`} draggable={false} className="block h-full w-full object-cover" />
          </button>
        )
      })}
    </div>
  )
}
