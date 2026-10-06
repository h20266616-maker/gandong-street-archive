import { listOrder, photoCode, photoUrls } from '../data/stores.js'

function Frames({ stores, onOpen }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-4 lg:grid-cols-6">
      {stores.flatMap((s) =>
        photoUrls(s).map((src, i) => (
          <li key={src} className="min-w-0">
            <button type="button" onClick={() => onOpen(s, i)} className="group block w-full text-left" aria-label={`${s.name} 사진 ${i + 1} 기록 열기`}>
              <img src={src} alt={`${s.name} ${i + 1}`} loading="lazy" className="aspect-[4/5] w-full bg-line object-cover group-hover:opacity-85" />
              <span className="mt-1.5 flex items-baseline justify-between gap-2">
                <span className="shrink-0 font-mono text-[10px] md:text-[11px]">{photoCode(s, i + 1)}</span>
                <span className="truncate text-[11px] text-pencil">{s.name}</span>
              </span>
            </button>
          </li>
        )),
      )}
    </ul>
  )
}

export default function ContactSheet({ stores, onOpen }) {
  const ordered = listOrder(stores)
  const street = ordered.filter((s) => !s.annex)
  const annex = ordered.filter((s) => s.annex)

  if (!ordered.length) return <p className="py-16 text-center text-sm text-pencil">이 분류에 해당하는 기록이 없다.</p>

  return (
    <div className="border-t border-ink pt-5">
      {street.length > 0 && <Frames stores={street} onOpen={onOpen} />}
      {annex.length > 0 && (
        <>
          <h2 className={`mb-4 border-b border-ink pb-2 font-mono text-[11px] uppercase tracking-widest text-pencil ${street.length ? 'mt-10' : ''}`}>
            ANNEX — {annex.map((s) => s.name).join(', ')}
          </h2>
          <Frames stores={annex} onOpen={onOpen} />
        </>
      )}
    </div>
  )
}
