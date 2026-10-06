import { photoUrls } from '../data/stores.js'

// 한 가게의 사진 전체. 원본 비율·원본 색 그대로 2단으로 쌓는다
export default function AllPhotos({ store, onOpen, onClose }) {
  const photos = photoUrls(store)
  return (
    <div role="dialog" aria-modal="true" aria-label={`${store.name} 전체 사진`} className="fixed inset-0 z-[1500] overflow-y-auto overflow-x-hidden bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-black bg-white px-4 py-3 wide:px-6">
        <p className="min-w-0 truncate text-sm">
          <span className="text-[#888]">{store.id}</span> <span className="font-bold">{store.name}</span>
          <span className="text-[#888]"> · 사진 {photos.length}장</span>
        </p>
        <button type="button" onClick={onClose} className="shrink-0 text-sm underline underline-offset-4 hover:no-underline">
          닫기
        </button>
      </div>
      <div className="columns-2 gap-2 px-2 py-2 wide:gap-4 wide:px-6 wide:py-6">
        {photos.map((src, i) => (
          <button key={src} type="button" onClick={() => onOpen(i)} className="mb-2 block w-full break-inside-avoid wide:mb-4" aria-label={`사진 ${i + 1} 크게 보기`}>
            <img src={src} alt={`${store.name} ${i + 1}`} loading="lazy" className="block h-auto w-full" />
          </button>
        ))}
      </div>
    </div>
  )
}
