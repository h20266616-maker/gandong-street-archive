// 지도 오른쪽 위 별관 토글. 별관을 보고 있으면 상점가로 돌아가는 버튼이 된다
export default function AnnexToggle({ annex, viewing, onGo, onBack }) {
  if (!annex) return null
  return (
    <button
      type="button"
      onClick={viewing ? onBack : onGo}
      className="absolute right-2.5 top-2.5 z-[1000] border border-black bg-white px-2.5 py-1.5 font-mono text-[11px] leading-none tracking-tight hover:bg-[#eee]"
    >
      {viewing ? '[← 상점가로 돌아가기]' : `[별관 ↗ ${annex.name}]`}
    </button>
  )
}
