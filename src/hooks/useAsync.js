import { useCallback, useEffect, useRef, useState } from 'react'
import { friendlyError } from '../lib/api'

/** Runs an async loader on mount / when deps change. Returns { data, loading, error, reload, setData }. */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const alive = useRef(true)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const reload = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await loaderRef.current()
      if (alive.current) setState({ data, loading: false, error: null })
    } catch (e) {
      if (alive.current) setState((s) => ({ ...s, loading: false, error: friendlyError(e) }))
    }
  }, [])

  useEffect(() => {
    alive.current = true
    reload()
    return () => {
      alive.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const setData = useCallback((updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })), [])

  return { ...state, reload, setData }
}
