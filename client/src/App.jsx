import { useMemo, useRef, useState } from 'react'
import { stores as initialStores } from './data/stores.js'
import MapView from './components/MapView.jsx'
import StoreList from './components/StoreList.jsx'
import StoreDetail from './components/StoreDetail.jsx'
import Lightbox from './components/Lightbox.jsx'

// URL에 ?edit 가 있을 때만 핀 드래그 + 좌표 출력
const isEditMode = new URLSearchParams(window.location.search).has('edit')

// stores.js의 배열 자리에 그대로 붙여넣을 수 있는 형태
const toStoresSource = (list) =>
  'export const stores = [\n' + list.map((s) => `  ${JSON.stringify(s)},`).join('\n') + '\n]'

export default function App() {
  const [stores, setStores] = useState(initialStores)
  const [selectedId, setSelectedId] = useState(null)
  const [lightbox, setLightbox] = useState(null) // { storeId, index }
  const panelRef = useRef(null)

  const selected = useMemo(() => stores.find((s) => s.id === selectedId) ?? null, [stores, selectedId])

  const select = (id) => {
    setSelectedId(id)
    panelRef.current?.scrollTo({ top: 0 })
  }

  const moveStore = (id, lat, lng) => {
    const next = stores.map((s) => (s.id === id ? { ...s, lat: +lat.toFixed(6), lng: +lng.toFixed(6) } : s))
    setStores(next)
    console.log(toStoresSource(next))
  }

  return (
    <div className={`flex h-dvh flex-col lg:flex-row ${isEditMode ? 'edit-mode' : ''}`}>
      <div className="relative h-[45dvh] shrink-0 border-b border-black lg:h-full lg:w-3/5 lg:border-b-0 lg:border-r">
        <MapView stores={stores} selectedId={selectedId} onSelect={select} editMode={isEditMode} onMove={moveStore} />
      </div>

      <main ref={panelRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden lg:w-2/5">
        {selected ? (
          <StoreDetail
            store={selected}
            onBack={() => select(null)}
            onOpenPhoto={(index) => setLightbox({ storeId: selected.id, index })}
          />
        ) : (
          <StoreList stores={stores} onSelect={select} />
        )}

        {isEditMode && (
          <section className="border-t border-black bg-[#111] px-4 py-4 text-[#eee] lg:px-8">
            <p className="mb-2 text-xs font-bold tracking-wide">
              EDIT MODE — 핀을 드래그해 놓으면 아래 내용이 갱신된다. src/data/stores.js의 stores 배열을 이걸로 교체.
            </p>
            <textarea
              readOnly
              value={toStoresSource(stores)}
              onFocus={(e) => e.target.select()}
              className="h-64 w-full resize-y border border-[#888] bg-black p-2 font-mono text-[11px] leading-snug text-[#eee]"
            />
          </section>
        )}
      </main>

      {lightbox && (
        <Lightbox
          store={stores.find((s) => s.id === lightbox.storeId)}
          index={lightbox.index}
          onIndexChange={(index) => setLightbox((lb) => ({ ...lb, index }))}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
