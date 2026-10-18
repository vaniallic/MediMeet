import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { JAKARTA, reverseGeocode } from '../lib/osm'

const GeoContext = createContext(null)
const KEY = 'medimeet-geo'

function readSaved() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY))
  } catch {
    return null
  }
}

export function GeoProvider({ children }) {
  const saved = readSaved()
  const [coords, setCoords] = useState(saved?.coords ?? { lat: JAKARTA.lat, lng: JAKARTA.lng })
  const [label, setLabel] = useState(saved?.label ?? JAKARTA.label)
  // idle → never asked, locating, granted, fallback (denied / unavailable)
  const [status, setStatus] = useState(saved ? 'granted' : 'idle')

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('fallback')
      return
    }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoords(c)
        setStatus('granted')
        let l = 'Your location'
        try {
          l = await reverseGeocode(c)
        } catch {
          /* keep generic label */
        }
        setLabel(l)
        try {
          sessionStorage.setItem(KEY, JSON.stringify({ coords: c, label: l }))
        } catch {
          /* ignore */
        }
      },
      () => {
        setStatus('fallback')
        setCoords({ lat: JAKARTA.lat, lng: JAKARTA.lng })
        setLabel(JAKARTA.label)
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60000 },
    )
  }, [])

  const value = useMemo(() => ({ coords, label, status, locate }), [coords, label, status, locate])
  return <GeoContext.Provider value={value}>{children}</GeoContext.Provider>
}

/** Shared location. Pass autoLocate to ask the browser once when the page mounts. */
export function useGeo({ autoLocate = false } = {}) {
  const ctx = useContext(GeoContext)
  useEffect(() => {
    if (autoLocate && ctx.status === 'idle') ctx.locate()
  }, [autoLocate, ctx])
  return ctx
}
