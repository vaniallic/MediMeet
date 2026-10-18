// Real-world data from OpenStreetMap: nearby hospitals and pharmacies (Overpass API)
// and a readable label for the user's location (Nominatim). Both are free and keyless.
import { distanceKm } from './format'

const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']

export const JAKARTA = { lat: -6.1754, lng: 106.8272, label: 'Central Jakarta' }

const cacheGet = (k) => {
  try {
    const v = JSON.parse(sessionStorage.getItem(k))
    if (v && Date.now() - v.t < 30 * 60000) return v.d
  } catch {
    /* ignore */
  }
  return null
}
const cacheSet = (k, d) => {
  try {
    sessionStorage.setItem(k, JSON.stringify({ t: Date.now(), d }))
  } catch {
    /* ignore */
  }
}

function addressOf(tags = {}) {
  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' No. ')
  return [street, tags['addr:suburb'] || tags['addr:district'], tags['addr:city']].filter(Boolean).join(', ')
}

/**
 * kind: 'hospital' | 'pharmacy'. Returns places sorted by distance.
 * Hospitals include clinics so smaller areas still show results.
 */
export async function findNearby(kind, center, radius = 5000, signal) {
  const key = `osm:${kind}:${center.lat.toFixed(3)},${center.lng.toFixed(3)}:${radius}`
  const cached = cacheGet(key)
  if (cached) return cached

  const filter = kind === 'pharmacy' ? '["amenity"="pharmacy"]' : '["amenity"~"^(hospital|clinic)$"]'
  const around = `(around:${radius},${center.lat},${center.lng})`
  const query = `[out:json][timeout:20];(node${filter}${around};way${filter}${around};);out center tags 60;`

  let lastErr
  for (const url of OVERPASS) {
    try {
      const res = await fetch(url, { method: 'POST', body: new URLSearchParams({ data: query }), signal })
      if (!res.ok) throw new Error(`Overpass ${res.status}`)
      const json = await res.json()
      const places = json.elements
        .map((el) => {
          const lat = el.lat ?? el.center?.lat
          const lng = el.lon ?? el.center?.lon
          const t = el.tags ?? {}
          const name = t.name || t['name:en'] || t['name:id']
          if (!lat || !lng || !name) return null
          return {
            id: `osm-${el.type}-${el.id}`,
            name,
            type: t.amenity,
            lat,
            lng,
            address: addressOf(t) || 'Address not listed on OpenStreetMap',
            phone: t.phone || t['contact:phone'] || null,
            emergency: t.emergency === 'yes',
            distance: distanceKm(center, { lat, lng }),
          }
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance)
      cacheSet(key, places)
      return places
    } catch (e) {
      if (e.name === 'AbortError') throw e
      lastErr = e
    }
  }
  throw lastErr ?? new Error('OpenStreetMap is not responding')
}

export async function reverseGeocode({ lat, lng }) {
  const key = `osm:rev:${lat.toFixed(3)},${lng.toFixed(3)}`
  const cached = cacheGet(key)
  if (cached) return cached
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&lat=${lat}&lon=${lng}&accept-language=en`,
  )
  if (!res.ok) throw new Error('Reverse geocoding failed')
  const j = await res.json()
  const a = j.address ?? {}
  const label = [a.road, a.suburb || a.village || a.city_district, a.city || a.town].filter(Boolean).slice(0, 2).join(', ')
  const out = label || j.display_name?.split(',').slice(0, 2).join(',') || 'Your location'
  cacheSet(key, out)
  return out
}

export const directionsUrl = ({ lat, lng }) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
