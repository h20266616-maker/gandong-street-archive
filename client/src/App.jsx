import { useCallback, useMemo, useRef, useState } from 'react'
import { filterByCat, stores as initialStores } from './data/stores.js'
import { useRoute } from './route.js'
import { Masthead, Topbar } from './components/Masthead.jsx'
import Toolbar from './components/Toolbar.jsx'
import KakaoMapView from './components/KakaoMapView.jsx'
import MapView from './components/MapView.jsx'
import StoreList from './components/StoreList.jsx'
import StoreDetail from './components/StoreDetail.jsx'
import IndexTable from './components/IndexTable.jsx'
import ContactSheet from './components/ContactSheet.jsx'
import RecordPage from './components/RecordPage.jsx'
import Lightbox from './components/Lightbox.jsx'

// URL에 ?edit 가 있을 때만 핀 드래그 + 좌표 출력
const isEditMode = new URLSearchParams(window.location.search).has('edit')

// 카카오 키가 있으면 카카오맵, 없거나 로드에 실패하면(도메인 미등록 등) OpenStreetMap으로 폴백
const KAKAO_MAP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY

// stores.js의 배열 자리에 그대로 붙여넣을 수 있는 형태
const toStoresSource = (list) =>
  'export const stores = [\n' + list.map((s) => `  ${JSON.stringify(s)},`).join('\n') + '\n]'

export default function App() {
  const { view, cat, record, setQuery, openRecord, closeRecord } = useRoute()
  const [stores, setStores] = useState(initialStores)
  const [selectedId, setSelectedId] = useState(null)
  const [lightbox, setLightbox] = useState(null) // { storeId, index, fromRecord }
  const panelRef = useRef(null)
  const [kakaoFailed, setKakaoFailed] = useState(false)
  const useKakao = Boolean(KAKAO_MAP_KEY) && !kakaoFailed
  const handleKakaoError = useCallback(() => setKakaoFailed(true), [])

  const filtered = useMemo(() => filterByCat(stores, cat), [stores, cat])
  const activeIds = useMemo(() => new Set(filtered.map((s) => s.id)), [filtered])
  const selected = stores.find((s) => s.id === selectedId) ?? null
  const recordStore = record ? stores.find((s) => s.acc === record.acc) : null

  const select = (id) => {
    setSelectedId(id)
    panelRef.current?.scrollTo({ top: 0 })
  }

  const moveStore = (id, lat, lng) => {
    const next = stores.map((s) => (s.id === id ? { ...s, lat: +lat.toFixed(6), lng: +lng.toFixed(6) } : s))
    setStores(next)
    console.log(toStoresSource(next))
  }

  const openRecordFor = (store, photo = 0) => openRecord(store.acc, photo)
  const setRecordPhoto = useCallback((i) => openRecord(record.acc, i, { replace: true }), [openRecord, record?.acc]) // eslint-disable-line react-hooks/exhaustive-deps

  const mapProps = { stores, activeIds, selectedId, onSelect: select, editMode: isEditMode, onMove: moveStore }

  return (
    <div className={isEditMode ? 'edit-mode' : ''}>
      <Topbar />
      <Masthead stores={stores} />
      <Toolbar view={view} cat={cat} onView={(v) => setQuery({ view: v })} onCat={(c) => setQuery({ cat: c })} />

      <main className="mx-auto max-w-[1320px] px-4 pb-16 md:px-8">
        {view === 'map' && (
          <>
            <div className="grid border border-ink bg-card lg:h-[min(78vh,760px)] lg:grid-cols-[3fr_2fr]">
              <div className="relative h-[45dvh] min-h-[260px] border-b border-ink lg:h-full lg:border-b-0 lg:border-r">
                {useKakao ? (
                  <KakaoMapView appKey={KAKAO_MAP_KEY} onLoadError={handleKakaoError} {...mapProps} />
                ) : (
                  <MapView {...mapProps} />
                )}
              </div>
              <div ref={panelRef} className="min-w-0 bg-paper lg:overflow-y-auto">
                {selected ? (
                  <StoreDetail
                    store={selected}
                    onBack={() => select(null)}
                    onOpenPhoto={(index) => setLightbox({ storeId: selected.id, index })}
                    onOpenRecord={() => openRecordFor(selected)}
                  />
                ) : (
                  <StoreList stores={filtered} onSelect={select} />
                )}
              </div>
            </div>

            {isEditMode && (
              <section className="mt-6 border border-ink bg-ink px-4 py-4 text-paper">
                <p className="mb-2 font-mono text-xs font-semibold tracking-wide">
                  EDIT MODE — 핀을 드래그해 놓으면 아래 내용이 갱신된다. src/data/stores.js의 stores 배열을 이걸로 교체.
                </p>
                <textarea
                  readOnly
                  value={toStoresSource(stores)}
                  onFocus={(e) => e.target.select()}
                  className="h-64 w-full resize-y border border-pencil bg-black p-2 font-mono text-[11px] leading-snug text-paper"
                />
              </section>
            )}
          </>
        )}

        {view === 'index' && <IndexTable stores={filtered} onOpen={(s) => openRecordFor(s)} />}
        {view === 'sheet' && <ContactSheet stores={filtered} onOpen={openRecordFor} />}
      </main>

      {recordStore && (
        <RecordPage
          store={recordStore}
          photo={record.photo}
          siblings={activeIds.has(recordStore.id) ? filtered : stores}
          lightboxOpen={Boolean(lightbox)}
          onPhoto={setRecordPhoto}
          onNavigate={(s) => openRecord(s.acc, 0, { replace: true })}
          onClose={closeRecord}
          onOpenLightbox={(index) => setLightbox({ storeId: recordStore.id, index, fromRecord: true })}
        />
      )}

      {lightbox && (
        <Lightbox
          store={stores.find((s) => s.id === lightbox.storeId)}
          index={lightbox.index}
          onIndexChange={(index) => {
            setLightbox((lb) => ({ ...lb, index }))
            if (lightbox.fromRecord) setRecordPhoto(index)
          }}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
