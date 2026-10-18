import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { LuMapPin, LuNavigation, LuStar } from 'react-icons/lu'
import { TbPhoneFilled } from 'react-icons/tb'
import { api } from '../lib/api'
import { directionsUrl } from '../lib/osm'
import { distanceKm, formatDistance } from '../lib/format'
import { useAsync } from '../hooks/useAsync'
import { useGeo } from '../context/GeoContext'
import { DoctorCard } from '../components/cards'
import { SpecialtyTile } from './Specialists'
import { ErrorState, Skeleton, TopBar } from '../components/ui'

export default function HospitalDetail() {
  const { id } = useParams()
  const geo = useGeo()
  const cat = useAsync(() => api.getCatalog(), [])
  const [spec, setSpec] = useState('all')

  const hospital = cat.data?.hospitalById[id]
  const doctors = useMemo(() => (cat.data?.doctors ?? []).filter((d) => d.hospital_id === id), [cat.data, id])
  const specialties = useMemo(
    () => (cat.data?.specialties ?? []).filter((s) => doctors.some((d) => d.specialty === s.slug)),
    [cat.data, doctors],
  )
  const shown = spec === 'all' ? doctors : doctors.filter((d) => d.specialty === spec)

  if (cat.error) return <ErrorState message={cat.error} onRetry={cat.reload} />
  if (cat.loading) return <div className="space-y-4 p-5"><Skeleton className="h-56" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
  if (!hospital) return <><TopBar title="Hospital" /><ErrorState message="Hospital not found." /></>

  return (
    <div className="pb-8">
      <div className="relative h-[160px] overflow-hidden bg-brand">
        {hospital.image && <img src={hospital.image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 to-transparent" />
        <div className="absolute inset-x-0 top-0 z-10 text-white [&_button]:text-white [&_button:hover]:bg-white/15">
          <TopBar />
        </div>
      </div>

      <section className="relative -mt-8 rounded-t-[30px] bg-white px-5 pt-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="min-w-0 font-display text-xl leading-tight font-bold text-brand">{hospital.name}</h1>
          <span className="shrink-0 rounded-full border-2 border-brand px-3 py-1 text-xs text-ink">
            {formatDistance(distanceKm(geo.coords, hospital))} away from you
          </span>
        </div>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-start gap-1.5 text-[13px] text-brand">
              <LuMapPin className="mt-0.5 shrink-0" /> {hospital.address}
            </p>
            <div className="mt-2 flex items-center gap-1 text-brand">
              {[1, 2, 3, 4, 5].map((n) => (
                <LuStar key={n} className={`h-4 w-4 ${n <= Math.round(hospital.rating) ? 'fill-current' : ''}`} />
              ))}
              <span className="ml-1 text-xs text-muted">{hospital.rating}</span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <a
              href={hospital.phone ? `tel:${hospital.phone}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name + ' ' + hospital.address)}`}
              target={hospital.phone ? undefined : '_blank'}
              rel="noreferrer"
              aria-label={`Contact ${hospital.name}`}
              className="grid h-11 w-11 place-items-center rounded-full bg-mist text-brand transition hover:brightness-95"
            >
              <TbPhoneFilled className="h-6 w-6" />
            </a>
            <a
              href={directionsUrl(hospital)}
              target="_blank"
              rel="noreferrer"
              aria-label="Directions"
              className="grid h-11 w-11 place-items-center rounded-full bg-brand text-white transition hover:brightness-110"
            >
              <LuNavigation className="h-5 w-5" />
            </a>
          </div>
        </div>
        <hr className="mt-5 border-t-2 border-brand" />

        <h2 className="section-title mt-5 mb-3">What you need?</h2>
        <div className="grid grid-cols-4 gap-x-3 gap-y-4">
          {specialties.map((s) => (
            <SpecialtyTile key={s.slug} s={s} active={spec === s.slug} onClick={() => setSpec(spec === s.slug ? 'all' : s.slug)} />
          ))}
        </div>

        <div className="mt-6 mb-3 flex items-center justify-between">
          <h2 className="section-title">Doctors</h2>
          {spec !== 'all' && (
            <button onClick={() => setSpec('all')} className="text-xs font-semibold text-brand">Show all</button>
          )}
        </div>
        <div className="space-y-3 rounded-3xl bg-mist-light p-3">
          {shown.map((d) => (
            <DoctorCard key={d.id} doctor={d} showHospital={false} />
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-muted">
          Portfolio demo: doctors, schedules and fees are simulated and not affiliated with {hospital.name}.
        </p>
      </section>
    </div>
  )
}
