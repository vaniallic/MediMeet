export const rupiah = (n) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID')

const pad = (n) => String(n).padStart(2, '0')

/** 'YYYY-MM-DD' for a Date in the user's local time zone. */
export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Parse 'YYYY-MM-DD' as a local date (not UTC). */
export const fromISODate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayISO = () => toISODate(new Date())

export const addDays = (iso, n) => {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export const formatDate = (iso, opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) =>
  fromISODate(iso).toLocaleDateString('en-GB', opts)

export const shortDate = (iso) => formatDate(iso, { day: 'numeric', month: 'short', year: 'numeric' })

export const formatTimestamp = (ts) =>
  new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/** Whole days from today to iso (negative = past). */
export const daysUntil = (iso) => Math.round((fromISODate(iso) - fromISODate(todayISO())) / 86400000)

export const isSlotPast = (iso, time) => {
  if (iso !== todayISO()) return iso < todayISO()
  const now = new Date()
  return time <= `${pad(now.getHours())}:${pad(now.getMinutes())}`
}

export const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n))

export const initials = (name = '') =>
  name
    .replace(/^(dr\.?|drg\.?)\s+/i, '')
    .split(/[\s,]+/)
    .filter((w) => w && !w.includes('.'))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

export const firstName = (name = '') => name.trim().split(/\s+/)[0] || 'there'

/** Distance in km between two lat/lng points (haversine). */
export const distanceKm = (a, b) => {
  const R = 6371
  const toRad = (x) => (x * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export const formatDistance = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`)
