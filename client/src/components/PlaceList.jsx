// 시트 기본 상태: 장소 목록. 상점가 → MT 장소 → 상점가 밖
export default function PlaceList({ sections, onPick }) {
  const count = sections.reduce((n, s) => n + s.items.length, 0)
  return (
    <div>
      <div className="flex items-baseline justify-between px-4 pb-2 pt-1">
        <h2 className="text-base font-bold">간척월명로 상점가</h2>
        <span className="text-xs text-[#888]">{count}곳</span>
      </div>
      {sections.map((sec, si) => (
        <section key={si}>
          {sec.title && <h3 className="mt-3 border-t border-black px-4 pb-1 pt-3 text-xs text-[#888]">{sec.title}</h3>}
          <ul>
            {sec.items.map((p) => (
              <li key={p.id} className="border-t border-[#ccc] first:border-t-0">
                <button type="button" onClick={() => onPick(p.id)} className="flex min-h-[84px] w-full items-center gap-3 px-4 py-2.5 text-left active:bg-[#f5f5f5]">
                  <span className="w-6 shrink-0 text-sm font-bold">{p.id}</span>
                  {p.thumb ? (
                    <img src={p.thumb} alt="" loading="lazy" width="64" height="64" className="h-16 w-16 shrink-0 border border-black object-cover" />
                  ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center border border-[#ccc] text-center text-[10px] leading-tight text-[#888]">
                      사진
                      <br />
                      준비 중
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px] font-bold leading-snug">{p.name}</span>
                    <span className="block truncate text-xs text-[#888]">{[p.type, p.short, p.photos.length ? `사진 ${p.photos.length}` : null].filter(Boolean).join(' · ')}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div className="h-6" />
    </div>
  )
}
