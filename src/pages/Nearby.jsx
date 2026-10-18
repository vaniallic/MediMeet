import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LuChevronLeft, LuLoaderCircle, LuLocateFixed, LuMapPin, LuPhone, LuSearch, LuX } from 'react-icons/lu'
import { TbMapPinFilled } from 'react-icons/tb'
import { api } from '../lib/api'
import { directionsUrl, findNearby, searchPlaces } from '../lib/osm'
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
      className={`flex h-full w-[180px] shrink-0 cursor-pointer snap-start flex-col overflow-hidden rounded-[20px] bg-[#8fa9a8] shadow-press transition ${
        active ? 'ring-[3px] ring-brand' : ''
      }`}
    >
      <div className="relative h-[110px] bg-mist-light">
        {partner && (
          <span className="absolute top-2 left-2 z-10 rounded-full bg-brand px-2.5 py-1 text-[10px] font-semibold text-white shadow-press">
            MediMeet partner
          </span>
        )}
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
          <p className="line-clamp-2 min-h-[2.5rem] font-display text-[15px] leading-tight font-semibold">{place.name}</p>
          <span className="shrink-0 text-xs">{formatDistance(place.distance)}</span>
        </div>
        <p className="mt-0.5 flex items-start gap-1 text-[11px] text-brand">
          <TbMapPinFilled className="mt-0.5 shrink-0" /> <span className="line-clamp-1">{place.address}</span>
        </p>
        {place.kind === 'hospital' && (
          <p className="mt-1.5 text-[10px] leading-tight text-white/85">Directions only. No doctors to book here yet.</p>
        )}
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
  const [query, setQuery] = useState('')
  const [partnersOnly, setPartnersOnly] = useState(false)
  const [areas, setAreas] = useState(null) // null = nothing searched yet
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [focus, setFocus] = useState(null) // { lat, lng, label } chosen from search, overrides GPS
  const geo = useGeo({ autoLocate: true })
  const origin = focus ?? geo.coords
  const cat = useAsync(() => api.getCatalog(), [])
  const osm = useAsync(() => findNearby(type, origin, radius), [type, origin.lat, origin.lng, radius])

  const places = useMemo(() => {
    const partners =
      type === 'hospital'
        ? (cat.data?.hospitals ?? []).map((h) => ({ ...h, kind: 'partner', distance: distanceKm(origin, h) }))
        : []
    const real = (osm.data ?? []).map((p) => ({ ...p, kind: type }))
    return [...partners.filter((p) => p.distance <= radius / 1000 + 15), ...real].sort((a, b) => a.distance - b.distance)
  }, [cat.data, osm.data, origin.lat, origin.lng, type, radius])

  // Typing filters the places already loaded by name or address.
  const term = query.trim().toLowerCase()
  const shown = useMemo(() => {
    const base = partnersOnly && type === 'hospital' ? places.filter((p) => p.kind === 'partner') : places
    return term ? base.filter((p) => `${p.name} ${p.address ?? ''}`.toLowerCase().includes(term)) : base
  }, [places, term, partnersOnly, type])

  const active = shown.find((p) => p.id === activeId)
  useEffect(() => setActiveId(null), [type])

  const select = (p) => {
    setActiveId(p.id)
    document.getElementById(`place-${p.id}`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  const submitSearch = async (e) => {
    e.preventDefault()
    if (term.length < 3) {
      setSearchError('Type at least 3 letters to search an area.')
      setAreas(null)
      return
    }
    setSearching(true)
    setSearchError('')
    try {
      setAreas(await searchPlaces(query))
    } catch (err) {
      setAreas(null)
      setSearchError(err.message || 'Search failed. Try again.')
    } finally {
      setSearching(false)
    }
  }

  const pickArea = (a) => {
    setFocus({ lat: a.lat, lng: a.lng, label: a.label })
    setAreas(null)
    setQuery('')
    setActiveId(null)
  }

  const clearSearch = () => {
    setQuery('')
    setAreas(null)
    setSearchError('')
  }

  const backToMe = () => {
    setFocus(null)
    clearSearch()
    geo.locate()
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative">
        <MapView
          center={active ?? origin}
          you={geo.status === 'granted' ? geo.coords : null}
          places={shown.slice(0, 40)}
          activeId={activeId}
          onSelect={select}
          zoom={radius > 5000 ? 12 : 14}
          className="h-[46vh] min-h-[300px] md:h-[340px]"
        />
        <div className="absolute inset-x-0 top-0 z-[400] px-4 pt-page-top">
          <div className="flex items-center gap-2">
            <button onClick={() => window.history.back()} aria-label="Go back" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/90 text-brand shadow-soft">
              <LuChevronLeft className="h-7 w-7" />
            </button>
            <form onSubmit={submitSearch} role="search" className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border-2 border-brand bg-white pr-1.5 pl-4 shadow-soft">
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSearchError('')
                }}
                placeholder={type === 'pharmacy' ? 'Search pharmacy or area' : 'Search hospital or area'}
                aria-label="Search places or an area"
                enterKeyHint="search"
                className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted/70"
              />
              {query && (
                <button type="button" onClick={clearSearch} aria-label="Clear search" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-mist-light">
                  <LuX className="h-4 w-4" />
                </button>
              )}
              <button type="submit" aria-label="Search" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-white">
                {searching ? <LuLoaderCircle className="h-4 w-4 animate-spin" /> : <LuSearch className="h-4 w-4" />}
              </button>
            </form>
          </div>
          {(areas || searchError) && (
            <div className="mt-2 ml-12 max-h-[220px] overflow-y-auto rounded-2xl bg-white shadow-card">
              {searchError && <p className="px-4 py-3 text-xs text-coral">{searchError}</p>}
              {areas && areas.length === 0 && <p className="px-4 py-3 text-xs text-muted">No area found for “{query.trim()}”.</p>}
              {areas && areas.length > 0 && (
                <>
                  <p className="px-4 pt-3 pb-1 text-[11px] font-bold tracking-wider text-muted uppercase">Move the map to</p>
                  <ul>
                    {areas.map((a) => (
                      <li key={a.id}>
                        <button onClick={() => pickArea(a)} className="flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm text-ink hover:bg-mist-light">
                          <LuMapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> <span>{a.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
        <button
          onClick={backToMe}
          className="absolute right-3 bottom-8 z-[400] grid h-11 w-11 place-items-center rounded-full bg-white text-brand shadow-soft"
          aria-label="Use my location"
        >
          <LuLocateFixed className={`h-5 w-5 ${geo.status === 'locating' ? 'animate-pulse' : ''}`} />
        </button>
      </div>

      <section className="relative z-[401] -mt-8 flex flex-1 flex-col rounded-t-[32px] bg-mist pt-5 pb-page-bottom">
        <div className="flex items-start justify-between gap-3 px-5">
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold text-brand">{type === 'pharmacy' ? 'Nearest Pharmacy' : 'Nearest Hospital'}</h1>
            <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-ink">
              <LuMapPin className="h-4 w-4 shrink-0 text-brand" /> {focus?.label ?? geo.label}
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
        {focus && (
          <button onClick={backToMe} className="mx-5 mt-2 self-start text-xs font-semibold text-brand underline">
            Back to my location
          </button>
        )}
        {!focus && geo.status === 'fallback' && (
          <p className="mx-5 mt-2 text-xs text-muted">Location is off, so we’re showing Central Jakarta. Tap the target button to try again.</p>
        )}

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5">
          {['hospital', 'pharmacy'].map((t) => (
            <button key={t} onClick={() => setParams({ type: t })} className={`chip ${type === t ? 'chip-active' : ''}`}>
              {t === 'hospital' ? 'Hospitals & clinics' : 'Pharmacies'}
            </button>
          ))}
          {type === 'hospital' && (
            <button onClick={() => setPartnersOnly((v) => !v)} aria-pressed={partnersOnly} className={`chip ${partnersOnly ? 'chip-active' : ''}`}>
              With doctors
            </button>
          )}
        </div>

        {osm.error && <ErrorState message={`Couldn’t load OpenStreetMap results. ${osm.error}`} onRetry={osm.reload} />}

        <div className="no-scrollbar mt-4 flex snap-x scroll-px-5 items-stretch gap-3 overflow-x-auto px-5 pb-3">
          {(osm.loading || cat.loading) && shown.length === 0
            ? [0, 1].map((i) => <Skeleton key={i} className="h-[230px] w-[180px] shrink-0" />)
            : shown.slice(0, 30).map((p) => (
                <div key={p.id} id={`place-${p.id}`} className="flex">
                  <PlaceCard place={p} active={p.id === activeId} onSelect={select} />
                </div>
              ))}
        </div>
        {!osm.loading && !osm.error && shown.length === 0 && (
          <p className="px-5 text-sm text-muted">
            {term
              ? `No place named “${query.trim()}” within ${radius / 1000} km. Press the search button to look for that area instead.`
              : `Nothing found within ${radius / 1000} km. Try a bigger radius.`}
          </p>
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
