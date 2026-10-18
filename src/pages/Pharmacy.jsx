import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LuChevronDown, LuChevronLeft, LuCircleHelp, LuLocateFixed, LuMapPin, LuNavigation, LuSearch } from 'react-icons/lu'
import { PlaceCard } from './Nearby'
import { api, friendlyError } from '../lib/api'
import { directionsUrl, findNearby } from '../lib/osm'
import { distanceKm, formatDistance, formatTimestamp, rupiah, shortDate } from '../lib/format'
import { useAsync } from '../hooks/useAsync'
import { useGeo } from '../context/GeoContext'
import { useToast } from '../context/ToastContext'
import MapView from '../components/MapView'
import PaymentMethods from '../components/PaymentMethods'
import { Avatar, EmptyState, ErrorState, InfoNote, Sheet, Skeleton, Spinner, TopBar } from '../components/ui'

function Items({ items, highlight = '' }) {
  return (
    <ul className="divide-y divide-mist">
      {items.map((i) => {
        const hit = highlight && i.name.toLowerCase().includes(highlight.toLowerCase())
        return (
          <li key={i.name} className={`flex items-start gap-3 py-2.5 ${hit ? 'rounded-lg bg-amber-50' : ''}`}>
            <img src="/img/icon-medicine.png" alt="" className="h-9 w-9 shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{i.name}</p>
              <p className="text-xs text-muted">{i.dose}</p>
            </div>
            <p className="shrink-0 text-right text-xs text-muted">
              ×{i.qty}
              <br />
              <span className="font-semibold text-ink">{rupiah(i.qty * i.price)}</span>
            </p>
          </li>
        )
      })}
    </ul>
  )
}

const hospitalPhoto = (name = '') =>
  [
    ['Ciputra', '/img/hospitals/ciputra.jpg'],
    ['Siloam', '/img/hospitals/siloam.jpg'],
    ['Tzu Chi', '/img/hospitals/tzuchi.jpg'],
  ].find(([k]) => name.includes(k))?.[1]

/** Photo of the pick-up place: the partner hospital photo, or a pharmacy illustration for OSM places. */
function PickupImage({ name }) {
  const photo = hospitalPhoto(name)
  return photo ? (
    <img src={photo} alt="" className="h-[128px] w-[128px] shrink-0 rounded-[20px] object-cover shadow-press" />
  ) : (
    <div className="grid h-[150px] w-[150px] shrink-0 place-items-center rounded-[22px] bg-brand-light shadow-press">
      <img src="/img/icon-medicine.png" alt="" className="h-24 w-24 object-contain" />
    </div>
  )
}

function PrescriptionCard({ p, onPay, highlight }) {
  const [open, setOpen] = useState(p.status === 'unpaid')
  const unpaid = p.status === 'unpaid'
  return (
    <article className="overflow-hidden rounded-3xl border-2 border-brand bg-white shadow-card">
      <div className="m-3 mb-3 flex items-center gap-3 rounded-2xl border border-brand/60 p-3">
        <Avatar name={p.doctor.name} photo={p.doctor.photo} size="h-14 w-14 text-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold">{p.doctor.name}</p>
          <p className="text-xs text-muted">{p.doctor.specialtyName}</p>
          <p className="text-[11px] text-muted">{formatTimestamp(p.created_at)}</p>
        </div>
      </div>

      <div className="mx-4 flex gap-3">
        <PickupImage name={p.pickup_name} />
        <div className="min-w-0 flex-1 text-xs">
          <p className="flex items-center gap-1 font-bold text-brand">
            <LuMapPin /> Pick Up Location
          </p>
          <p className="mt-1 font-semibold text-ink">{p.pickup_name}</p>
          <p className="line-clamp-3 text-mint">{p.pickup_address}</p>
          <a
            href={directionsUrl({ lat: p.pickup_lat, lng: p.pickup_lng })}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 block w-[120px] rounded-full bg-brand py-1 text-center text-[11px] font-semibold text-white"
          >
            Check Map
          </a>
          {unpaid && (
            <>
              <p className="mt-2 flex items-center gap-1 font-bold text-brand">
                <LuCircleHelp /> Change pick up location
              </p>
              <Link to={`/pharmacy/${p.id}/pickup`} className="mt-1 block w-[120px] rounded-full bg-brand py-1 text-center text-[11px] font-semibold text-white">
                Change Now
              </Link>
            </>
          )}
        </div>
      </div>

      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center gap-2 rounded-2xl border border-brand/60 bg-white px-4 py-3 text-left text-xs font-medium text-ink">
        <span className="flex-1">{unpaid ? 'The check up result and the medical prescription.' : 'Medical prescription'}</span>
        <LuChevronDown className={`h-5 w-5 text-brand transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mx-4 mt-2 rounded-2xl bg-mist-light px-4 py-2">
          <Items items={p.items} highlight={highlight} />
          <p className="flex justify-between border-t border-mist pt-2 pb-1 text-sm font-bold">
            <span>Total</span>
            <span className="text-brand">{rupiah(p.total)}</span>
          </p>
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-ink">
            Payment Status: <span className={unpaid ? 'text-coral' : 'text-brand'}>{unpaid ? 'Not Paid' : 'Paid'}</span>
          </p>
          <p className="text-[11px] text-muted">{shortDate(p.created_at.slice(0, 10))}</p>
        </div>
        {unpaid ? (
          <button onClick={() => onPay(p)} className="rounded-xl bg-coral px-6 py-2.5 text-sm font-bold text-white shadow-press transition active:scale-95">
            Pay now
          </button>
        ) : (
          <span className="rounded-xl bg-mint px-7 py-2.5 text-sm font-bold text-white">Paid</span>
        )}
      </div>
    </article>
  )
}

export function Pharmacy() {
  const toast = useToast()
  const list = useAsync(() => api.listPrescriptions(), [])
  const [q, setQ] = useState('')
  const [paying, setPaying] = useState(null)
  const [method, setMethod] = useState('QRIS')
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    const all = list.data ?? []
    if (!q.trim()) return all
    const t = q.trim().toLowerCase()
    return all.filter((p) => p.items.some((i) => i.name.toLowerCase().includes(t)) || p.doctor.name.toLowerCase().includes(t))
  }, [list.data, q])
  const active = filtered.filter((p) => p.status === 'unpaid')
  const past = filtered.filter((p) => p.status === 'paid')

  const pay = async () => {
    setBusy(true)
    try {
      await api.payPrescription(paying.id, method)
      toast('Paid — your medicine will be ready for pick-up')
      setPaying(null)
      list.reload({ silent: true })
    } catch (e) {
      toast(friendlyError(e), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex-1 pb-page-bottom">
      <TopBar title="Pharmacy" />
      <label className="mx-5 mt-4 flex h-12 items-center gap-3 rounded-full border-2 border-brand bg-white px-4 shadow-soft">
        <LuSearch className="h-6 w-6 text-brand" />
        <span className="sr-only">Search your medicine</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find the medicine you need here…" className="h-full flex-1 bg-transparent text-sm outline-none" />
      </label>

      {list.error && <ErrorState message={list.error} onRetry={list.reload} />}

      <section className="mt-6 px-5">
        <h2 className="section-title mb-3 text-lg">Active Prescription</h2>
        {list.loading ? (
          <Skeleton className="h-96" />
        ) : active.length ? (
          <div className="space-y-4">
            {active.map((p) => (
              <PrescriptionCard key={p.id} p={p} onPay={setPaying} highlight={q} />
            ))}
          </div>
        ) : (
          <EmptyState image="/img/icon-firstaid.png" title={q ? 'No matches' : 'No active prescriptions'} text={q ? 'Try another medicine name.' : 'After a visit, your doctor’s prescription appears here.'} />
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-8 px-5">
          <h2 className="section-title mb-3 text-lg">Past Prescription</h2>
          <div className="space-y-4">
            {past.map((p) => (
              <PrescriptionCard key={p.id} p={p} onPay={setPaying} highlight={q} />
            ))}
          </div>
        </section>
      )}

      <Sheet open={!!paying} onClose={() => setPaying(null)} title="Pay for medicine">
        {paying && (
          <>
            <div className="mb-4 flex items-center justify-between rounded-2xl bg-mist-light px-4 py-3">
              <span className="text-sm text-muted">{paying.items.length} item(s)</span>
              <span className="font-display text-xl font-bold text-brand">{rupiah(paying.total)}</span>
            </div>
            <PaymentMethods value={method} onChange={setMethod} />
            <InfoNote className="mt-4">Simulated payment — no money is charged.</InfoNote>
            <button className="btn-primary mt-4 h-12" onClick={pay} disabled={busy}>
              {busy ? <Spinner /> : `Pay ${rupiah(paying.total)}`}
            </button>
          </>
        )}
      </Sheet>
    </div>
  )
}

export function ChangePickup() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const geo = useGeo()
  const rx = useAsync(async () => {
    const all = await api.listPrescriptions()
    const p = all.find((x) => x.id === id)
    if (!p) throw new Error('Prescription not found')
    return p
  }, [id])
  const cat = useAsync(() => api.getCatalog(), [])
  const [origin, setOrigin] = useState('pickup') // search around the current pick-up or around the user
  const center = rx.data
    ? origin === 'me'
      ? geo.coords
      : { lat: rx.data.pickup_lat, lng: rx.data.pickup_lng }
    : geo.coords
  const nearby = useAsync(
    () => (rx.data ? findNearby('pharmacy', center, 3000) : Promise.resolve([])),
    [rx.data?.id, center.lat, center.lng],
  )
  const [activeId, setActiveId] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  const current = rx.data && {
    id: 'current',
    name: rx.data.pickup_name,
    address: rx.data.pickup_address,
    lat: rx.data.pickup_lat,
    lng: rx.data.pickup_lng,
    kind: 'partner',
    image: hospitalPhoto(rx.data.pickup_name),
    distance: distanceKm(center, { lat: rx.data.pickup_lat, lng: rx.data.pickup_lng }),
  }
  // Partner hospital pharmacies (with photos) first, then real pharmacies from OpenStreetMap.
  const partners = (cat.data?.hospitals ?? [])
    .map((h) => ({ id: `h-${h.id}`, name: `${h.name} Pharmacy`, address: h.address, lat: h.lat, lng: h.lng, kind: 'partner', image: h.image, distance: distanceKm(center, h) }))
    .filter((h) => h.name !== current?.name)
  const osm = (nearby.data ?? []).map((p) => ({ ...p, kind: 'pharmacy', distance: distanceKm(center, p) }))
  const options = [...partners, ...osm].sort((a, b) => a.distance - b.distance).slice(0, 25)

  const save = async () => {
    setBusy(true)
    try {
      await api.changePickup(id, confirm)
      toast('Pick-up location changed')
      navigate('/pharmacy', { replace: true })
    } catch (e) {
      toast(friendlyError(e), 'error')
      setBusy(false)
    }
  }

  if (rx.error) return <><TopBar title="Pick-up location" /><ErrorState message={rx.error} /></>
  if (rx.loading) return <div className="p-5"><Skeleton className="h-96" /></div>

  const select = (p) => {
    setActiveId(p.id)
    document.getElementById(`pick-${p.id}`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }
  const actionBtn = (label, onClick, disabled) => (
    <button
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      className="flex-1 rounded-full bg-mist py-1.5 text-center text-xs font-semibold text-brand shadow-press disabled:opacity-80"
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative">
        <MapView
          center={[current, ...options].find((p) => p.id === activeId) ?? center}
          you={geo.status === 'granted' ? geo.coords : null}
          places={[current, ...options]}
          activeId={activeId}
          onSelect={select}
          className="h-[42vh] min-h-[280px] md:h-[320px]"
        />
        <div className="absolute inset-x-0 top-0 z-[400] flex items-center gap-2 px-4 pt-page-top">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-brand">
            <LuChevronLeft className="h-7 w-7" />
          </button>
          <div className="flex h-11 flex-1 items-center rounded-full border-2 border-brand bg-white px-5 text-[15px] text-ink shadow-soft">
            Change pick-up pharmacy
          </div>
        </div>
      </div>

      <section className="relative z-[401] -mt-8 flex-1 rounded-t-[32px] bg-mist pt-5 pb-page-bottom">
        <div className="px-5">
          <h1 className="font-display text-xl font-bold text-brand">Nearest Pharmacy</h1>
          <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-ink">
            <LuMapPin className="h-4 w-4 shrink-0 text-brand" /> {origin === 'me' ? geo.label : `Around ${current.name}`}
          </p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setOrigin('pickup')} className={`chip ${origin === 'pickup' ? 'chip-active' : ''}`}>Near current pick-up</button>
            <button
              onClick={() => {
                setOrigin('me')
                if (geo.status !== 'granted') geo.locate()
              }}
              className={`chip ${origin === 'me' ? 'chip-active' : ''}`}
            >
              <LuLocateFixed /> Near me
            </button>
          </div>
        </div>

        {nearby.error && <ErrorState message={`Couldn’t load OpenStreetMap results. ${nearby.error}`} onRetry={nearby.reload} />}
        <div className="no-scrollbar mt-4 flex snap-x scroll-px-5 items-stretch gap-3 overflow-x-auto px-5 pb-3">
          <div id="pick-current" className="flex">
            <PlaceCard place={current} active={activeId === 'current'} onSelect={select} action={actionBtn('Current', null, true)} />
          </div>
          {nearby.loading && options.length === 0
            ? [0, 1].map((i) => <Skeleton key={i} className="h-[230px] w-[180px] shrink-0" />)
            : options.map((p) => (
                <div key={p.id} id={`pick-${p.id}`} className="flex">
                  <PlaceCard place={p} active={p.id === activeId} onSelect={select} action={actionBtn('Change Now', () => setConfirm(p))} />
                </div>
              ))}
        </div>
        <p className="mt-2 flex items-start gap-1.5 px-5 text-[11px] text-muted">
          <LuCircleHelp className="mt-0.5 shrink-0" /> Pharmacy data © OpenStreetMap contributors. Pick-up is simulated.
        </p>
      </section>

      <Sheet open={!!confirm} onClose={() => setConfirm(null)} title="Change pharmacy?">
        {confirm && (
          <>
            <p className="text-sm text-muted">Are you sure you want to change to this pharmacy instead?</p>
            <div className="mt-4 rounded-2xl bg-mist-light p-4">
              <p className="font-semibold">{confirm.name}</p>
              <p className="text-xs text-muted">{confirm.address}</p>
              <a href={directionsUrl(confirm)} target="_blank" rel="noreferrer" className="btn-ghost mt-2 -ml-3">
                <LuNavigation /> View on map
              </a>
            </div>
            <button className="btn-primary mt-5" onClick={save} disabled={busy}>
              {busy ? <Spinner /> : 'Change Now'}
            </button>
          </>
        )}
      </Sheet>
    </div>
  )
}
