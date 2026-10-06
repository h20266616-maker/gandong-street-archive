import { thumbUrl } from '../data/stores.js'

// 핀 hover 미리보기 내용: 대표 사진(4:3, 원본 색) + "09 서울식당 · 사진 3장"
export default function PinPreview({ store }) {
  return (
    <div className="w-[180px] bg-white">
      <img src={thumbUrl(store)} alt="" className="block aspect-[4/3] w-full object-cover" />
      <p className="px-2 py-1.5 text-xs leading-snug">
        <span className="font-semibold">
          {store.id} {store.name}
        </span>
        <span className="text-[#888]"> · 사진 {store.photoCount}장</span>
      </p>
    </div>
  )
}
