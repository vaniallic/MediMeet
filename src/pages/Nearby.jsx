import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LuChevronLeft, LuLocateFixed, LuMapPin, LuPhone, LuSlidersHorizontal } from 'react-icons/lu'
import { TbMapPinFilled } from 'react-icons/tb'
import { api } from '../lib/api'
import { directionsUrl, findNearby } from '../lib/osm'
import { distanceKm, formatDistance } from '../lib/format'
import { useAsync } from '../hooks/useAsync'
import { useGeo } from '../context/GeoContext'
import MapView from '../components/MapView'
import { ErrorState, Skeleton, TopBar } from '../components/ui'

const RADII = [2000, 5000, 10000]

/** Place card from the Figma "Nearest Hospital" sheet: photo on top, grey-green panel below. */
export function PlaceCard({ place, active, onSelect, action }) {
  const partner = place.kind === 'partner'
  return (
    <div
      onClick={() => onSelect(place)}
      className={`flex w-[180px] shrink-0 cursor-pointer snap-start flex-col overflow-hidden rounded-[20px] bg-[#8fa9a8] shadow-press transition ${
        active ? 'ring-[3px] ring-brand' : ''
      }`}
    >
      <div className="h-[110px] bg-mist-light">
        {place.image ? (
          <img src={place.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <img
            src={`/img/icon-${place.kind === 'pharmacy' ? 'medicine' : 'hospital'}.png`}
            alt=""
            className="mx-auto h-full w-[70%] object-contain"
          />
        )}
      </div>
      <div className="-mt-3 flex flex-1 flex-col rounded-t-[16px] bg-[#8fa9a8] px-3 pt-2.5 pb-3 text-white">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 font-display text-[15px] leading-tight font-semibold">{place.name}</p>
          <span className="shrink-0 text-xs">{formatDistance(place.distance)}</span>
        </div>
        <p className="mt-0.5 flex items-start gap-1 text-[11px] text-brand">
          <TbMapPinFilled className="mt-0.5 shrink-0" /> <span className="line-clamp-1">{place.address}</span>
        </p>
        <div className="mt-auto flex items-end gap-2 pt-3">
          {action ?? (
            <a
              href={directionsUrl(place)}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 rounded-full bg-mist py-1.5 text-center text-xs font-semibold text-brand shadow-press"
            >
              Direction
            </a>
          )}
          {partner && !action && (
            <Link to={`/hospitals/${place.id}`} onClick={(e) => e.stopPropagation()} className="flex flex-col items-center text-[9px] text-white">
              <img src="/img/icon-doctor.png" alt="" className="h-9 w-9 rounded-lg bg-white/80 object-contain p-0.5" />
              See Doctor
            </Link>
          )}
          {!partner && place.phone && !action && (
            <a href={`tel:${place.phone}`} onClick={(e) => e.stopPropagation()} aria-label={`Call ${place.name}`} className="grid h-8 w-8 place-items-center rounded-full bg-mist text-brand">
              <LuPhone className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Nearby() {
  const [params, setParams] = useSearchParams()
  const type = params.get('type') === 'pharmacy' ? 'pharmacy' : 'hospital'
  const [radius, setRadius] = useState(5000)
  const [activeId, setActiveId] = useState(null)
  const geo = useGeo({ autoLocate: true })
  const cat = useAsync(() => api.getCatalog(), [])
  const osm = useAsync(() => findNearby(type, geo.coords, radius), [type, geo.coords.lat, geo.coords.lng, radius])

  const places = useMemo(() => {
    const partners =
      type === 'hospital'
        ? (cat.data?.hospitals ?? []).map((h) => ({ ...h, kind: 'partner', distance: distanceKm(geo.coords, h) }))
        : []
    const real = (osm.data ?? []).map((p) => ({ ...p, kind: type }))
    return [...partners.filter((p) => p.distance <= radius / 1000 + 15), ...real].sort((a, b) => a.distance - b.distance)
  }, [cat.data, osm.data, geo.coords, type, radius])

  const active = places.find((p) => p.id === activeId)
  useEffect(() => setActiveId(null), [type])

  const select = (p) => {
    setActiveId(p.id)
    document.getElementById(`place-${p.id}`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative">
        <MapView
          center={active ?? geo.coords}
          you={geo.status === 'granted' ? geo.coords : null}
          places={places.slice(0, 40)}
          activeId={activeId}
          onSelect={select}
          zoom={radius > 5000 ? 12 : 14}
          className="h-[46vh] min-h-[300px] md:h-[340px]"
        />
        <div className="absolute inset-x-0 top-0 z-[400] flex items-center gap-2 px-4 pt-5">
          <button onClick={() => window.history.back()} aria-label="Go back" className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-brand">
            <LuChevronLeft className="h-7 w-7" />
          </button>
          <div className="flex h-11 flex-1 items-center justify-between rounded-full border-2 border-brand bg-white px-5 shadow-soft">
            <span className="text-[15px] text-ink">{type === 'pharmacy' ? 'Nearest Pharmacy' : 'Nearest Hospital'}</span>
            <LuSlidersHorizontal className="h-5 w-5 text-ink" />
          </div>
        </div>
        <button
          onClick={geo.locate}
          className="absolute right-3 bottom-8 z-[400] grid h-11 w-11 place-items-center rounded-full bg-white text-brand shadow-soft"
          aria-label="Use my location"
        >
          <LuLocateFixed className={`h-5 w-5 ${geo.status === 'locating' ? 'animate-pulse' : ''}`} />
        </button>
      </div>

      <section className="relative z-[401] -mt-8 flex flex-1 flex-col rounded-t-[32px] bg-mist pt-5 pb-8">
        <div className="flex items-start justify-between gap-3 px-5">
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold text-brand">{type === 'pharmacy' ? 'Nearest Pharmacy' : 'Nearest Hospital'}</h1>
            <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-ink">
              <LuMapPin className="h-4 w-4 shrink-0 text-brand" /> {geo.label}
            </p>
          </div>
          <label className="flex shrink-0 items-center font-display text-lg font-bold text-brand">
            <span aria-hidden>&lt;</span>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="cursor-pointer appearance-none bg-transparent px-1 outline-none"
              aria-label="Search radius"
            >
              {RADII.map((r) => (
                <option key={r} value={r}>
                  {r / 1000} km
                </option>
              ))}
            </select>
          </label>
        </div>
        {geo.status === 'fallback' && (
          <p className="mx-5 mt-2 text-xs text-muted">Location is off, so we’re showing Central Jakarta. Tap the target button to try again.</p>
        )}

        <div className="mt-4 flex gap-2 px-5">
          {['hospital', 'pharmacy'].map((t) => (
            <button key={t} onClick={() => setParams({ type: t })} className={`chip ${type === t ? 'chip-active' : ''}`}>
              {t === 'hospital' ? 'Hospitals & clinics' : 'Pharmacies'}
            </button>
          ))}
        </div>

        {osm.error && <ErrorState message={`Couldn’t load OpenStreetMap results. ${osm.error}`} onRetry={osm.reload} />}

        <div className="no-scrollbar mt-4 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-3">
          {(osm.loading || cat.loading) && places.length === 0
            ? [0, 1].map((i) => <Skeleton key={i} className="h-[230px] w-[180px] shrink-0" />)
            : places.slice(0, 30).map((p) => (
                <div key={p.id} id={`place-${p.id}`}>
                  <PlaceCard place={p} active={p.id === activeId} onSelect={select} />
                </div>
              ))}
        </div>
        {!osm.loading && !osm.error && places.length === 0 && (
          <p className="px-5 text-sm text-muted">Nothing found within {radius / 1000} km. Try a bigger radius.</p>
        )}

        <p className="mt-auto px-5 pt-4 text-[11px] leading-relaxed text-muted">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand" /> MediMeet partner (with doctors) ·{' '}
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#3b8a9b]" /> Hospital/clinic ·{' '}
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#5fa39a]" /> Pharmacy. Live data © OpenStreetMap
          contributors.
        </p>
      </section>
    </div>
  )
}
