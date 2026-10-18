import { LuNavigation, LuPhone, LuTriangleAlert } from 'react-icons/lu'
import { findNearby, directionsUrl } from '../lib/osm'
import { formatDistance } from '../lib/format'
import { useAsync } from '../hooks/useAsync'
import { useGeo } from '../context/GeoContext'
import { illo } from '../components/icons'
import { ErrorState, Skeleton, TopBar } from '../components/ui'

const NUMBERS = [
  ['112', 'Emergency (all services)'],
  ['119', 'Ambulance / medical'],
  ['110', 'Police'],
  ['113', 'Fire'],
]

export default function Emergency() {
  const geo = useGeo({ autoLocate: true })
  const er = useAsync(
    async () => (await findNearby('hospital', geo.coords, 8000)).filter((p) => p.type === 'hospital').slice(0, 6),
    [geo.coords.lat, geo.coords.lng],
  )

  return (
    <div className="pb-10">
      <TopBar title="Emergency" />
      <div className="mx-5 flex items-center gap-3 overflow-hidden rounded-3xl bg-coral-light p-4 shadow-press">
        <img src={illo('ambulance')} alt="" className="w-32 shrink-0" />
        <div>
          <p className="font-display text-xl font-bold text-coral">Need help now?</p>
          <a href="tel:112" className="mt-2 inline-flex items-center gap-2 rounded-xl bg-coral px-5 py-2 font-display text-xl font-bold text-white shadow-press">
            <LuPhone /> Call 112
          </a>
        </div>
      </div>
      <p className="mx-5 mt-3 flex items-start gap-2 text-xs text-muted">
        <LuTriangleAlert className="mt-0.5 shrink-0 text-coral" /> If someone is unconscious, not breathing, or bleeding heavily, call first — don’t
        wait to book.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 px-5">
        {NUMBERS.map(([n, l]) => (
          <a key={n} href={`tel:${n}`} className="card flex flex-col p-4 transition hover:-translate-y-0.5">
            <span className="font-display text-3xl font-bold text-brand">{n}</span>
            <span className="text-xs text-muted">{l}</span>
          </a>
        ))}
      </div>

      <h2 className="section-title mt-8 mb-1 px-5">Nearest hospitals</h2>
      <p className="mb-3 px-5 text-xs text-muted">Near {geo.label} · from OpenStreetMap</p>
      <div className="space-y-2 px-5">
        {er.loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
        {er.error && <ErrorState message={er.error} onRetry={er.reload} />}
        {er.data?.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-mist-light p-3">
            <img src={illo('hospital')} alt="" className="h-11 w-11 object-contain" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              <p className="text-xs text-muted">{formatDistance(p.distance)}{p.emergency ? ' · 24h emergency' : ''}</p>
            </div>
            {p.phone && (
              <a href={`tel:${p.phone}`} aria-label={`Call ${p.name}`} className="grid h-10 w-10 place-items-center rounded-full bg-white text-brand">
                <LuPhone />
              </a>
            )}
            <a href={directionsUrl(p)} target="_blank" rel="noreferrer" aria-label={`Directions to ${p.name}`} className="grid h-10 w-10 place-items-center rounded-full bg-brand text-white">
              <LuNavigation />
            </a>
          </div>
        ))}
        {er.data?.length === 0 && <p className="text-sm text-muted">No hospitals found within 8 km.</p>}
      </div>
    </div>
  )
}
