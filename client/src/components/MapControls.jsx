import { distanceShort } from '../data/stores.js'

const square = 'border border-black bg-white hover:bg-black hover:text-white'

// 지도 위 버튼: 왼쪽 위 별관 이동, 오른쪽 위 줌
export default function MapControls({ annex, viewingAnnex, onAnnex, onBack, onZoomIn, onZoomOut }) {
  const km = annex ? distanceShort(annex) : ''
  return (
    <>
      {annex && (
        <button
          type="button"
          onClick={viewingAnnex ? onBack : onAnnex}
          className={`absolute left-3 top-3 z-[1000] px-3 py-2 text-[13px] font-semibold ${square}`}
        >
          {viewingAnnex ? '← 상점가로' : `별관 · ${annex.name}${km ? ` (${km})` : ''} →`}
        </button>
      )}
      <div className="absolute right-3 top-3 z-[1000] flex flex-col">
        <button type="button" aria-label="확대" onClick={onZoomIn} className={`h-9 w-9 text-lg leading-none ${square}`}>
          +
        </button>
        <button type="button" aria-label="축소" onClick={onZoomOut} className={`-mt-px h-9 w-9 text-lg leading-none ${square}`}>
          −
        </button>
      </div>
    </>
  )
}
