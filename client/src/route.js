import { useCallback, useEffect, useState } from 'react'

// 화면 상태를 URL에 둔다.
// - 쿼리: ?view=map|index|sheet & cat=food… (새로고침해도 유지, ?edit 같은 다른 파라미터는 건드리지 않음)
// - 해시: #/record/GD-2026-010 또는 #/record/GD-2026-010/02 (기록 페이지, 공유·뒤로가기 가능)
export const VIEWS = ['map', 'index', 'sheet']

const read = () => {
  const q = new URLSearchParams(window.location.search)
  const view = VIEWS.includes(q.get('view')) ? q.get('view') : 'map'
  const cat = q.get('cat') || 'all'
  const m = window.location.hash.match(/^#\/record\/([^/]+)(?:\/(\d+))?$/)
  const record = m ? { acc: decodeURIComponent(m[1]), photo: m[2] ? Number(m[2]) - 1 : 0 } : null
  return { view, cat, record }
}

export const recordHash = (acc, photo = 0) => `#/record/${acc}${photo > 0 ? `/${String(photo + 1).padStart(2, '0')}` : ''}`

export function useRoute() {
  const [route, setRoute] = useState(read)

  useEffect(() => {
    const sync = () => setRoute(read())
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  // 탭·필터는 기록을 남기지 않고 교체
  const setQuery = useCallback((patch) => {
    const q = new URLSearchParams(window.location.search)
    for (const [k, v] of Object.entries(patch)) {
      const isDefault = (k === 'view' && v === 'map') || (k === 'cat' && v === 'all')
      if (isDefault || v == null) q.delete(k)
      else q.set(k, v)
    }
    // URLSearchParams는 값 없는 ?edit 를 edit= 로 바꾸므로 되돌린다
    const search = q.toString().replace(/(^|&)edit=(?=&|$)/, '$1edit')
    history.replaceState(history.state, '', `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`)
    setRoute(read())
  }, [])

  // 기록 열기: 처음 열 때는 기록을 남기고(뒤로가기로 닫힘), 기록 안에서 이동할 때는 교체
  const openRecord = useCallback((acc, photo = 0, { replace = false } = {}) => {
    const hash = recordHash(acc, photo)
    if (replace) {
      history.replaceState({ ...history.state, inApp: history.state?.inApp }, '', hash)
      setRoute(read())
    } else {
      history.pushState({ inApp: true }, '', hash)
      setRoute(read())
    }
  }, [])

  // 닫기: 사이트 안에서 연 기록이면 뒤로가기, 해시로 바로 들어왔으면 해시만 지운다
  const closeRecord = useCallback(() => {
    if (history.state?.inApp) {
      history.back()
    } else {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
      setRoute(read())
    }
  }, [])

  return { ...route, setQuery, openRecord, closeRecord }
}
