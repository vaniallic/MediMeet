import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { specialtyImage } from '../data/catalog'
import { useAsync } from '../hooks/useAsync'
import { DoctorCard } from '../components/cards'
import { EmptyState, ErrorState, Skeleton, TopBar } from '../components/ui'

/** Teal header with a doctor illustration, as on the Figma "Choose Your Specialist / Doctor" screens. */
export function TealHeader({ title, sub, illustration = '/img/doctor-think.png' }) {
  return (
    <div className="relative h-[176px] shrink-0 overflow-hidden bg-brand">
      <img src={illustration} alt="" className="pointer-events-none absolute right-0 bottom-0 h-[150px] w-auto [mask-image:linear-gradient(to_bottom,transparent,black_20%)]" />
      <div className="relative pr-36 text-white [&_button]:text-white [&_button:hover]:bg-white/15">
        <TopBar title={title} className="[&_h1]:text-xl [&_h1]:whitespace-normal [&_h1]:text-white" />
        {sub && <p className="-mt-1 pl-[68px] text-xs text-white/85">{sub}</p>}
      </div>
    </div>
  )
}

/** Illustrated specialty tile used on the Specialists and Hospital screens. Every tile is the same circle. */
export function SpecialtyTile({ s, to, onClick, active = false, count }) {
  const body = (
    <>
      <span
        className={`grid aspect-square w-full max-w-[84px] place-items-center rounded-full bg-brand-light p-1.5 transition group-hover:-translate-y-0.5 group-active:scale-95 ${
          active ? 'ring-[3px] ring-brand' : ''
        }`}
      >
        <img src={specialtyImage(s.slug)} alt="" className="h-full w-full object-contain" loading="lazy" />
      </span>
      <span className="mt-2 flex min-h-[28px] items-start text-[11px] leading-tight font-semibold text-brand">{s.name}</span>
      {count !== undefined && <span className="text-[10px] text-muted">{count} {count === 1 ? 'doctor' : 'doctors'}</span>}
    </>
  )
  const cls = 'group flex min-w-0 flex-col items-center text-center'
  return to ? (
    <Link to={to} className={cls}>{body}</Link>
  ) : (
    <button type="button" onClick={onClick} aria-pressed={active} className={cls}>{body}</button>
  )
}

export function Specialists() {
  const cat = useAsync(() => api.getCatalog(), [])
  return (
    <div className="flex flex-1 flex-col">
      <TealHeader title="Choose Your Specialist" />
      <div className="relative -mt-8 flex-1 rounded-t-[40px] bg-white px-5 pt-6 pb-page-bottom">
        {cat.error && <ErrorState message={cat.error} onRetry={cat.reload} />}
        <div className="grid grid-cols-4 gap-x-2 gap-y-4">
          {cat.loading
            ? Array.from({ length: 12 }, (_, i) => <Skeleton key={i} className="aspect-square rounded-full" />)
            : cat.data.specialties.map((s) => (
                <SpecialtyTile key={s.slug} s={s} to={`/specialists/${s.slug}`} />
              ))}
        </div>
      </div>
    </div>
  )
}

const SORTS = {
  rating: (a, b) => b.rating - a.rating || b.reviews_count - a.reviews_count,
  price: (a, b) => a.fee - b.fee,
  experience: (a, b) => b.experience_years - a.experience_years,
}

export function SpecialistDoctors() {
  const { slug } = useParams()
  const cat = useAsync(() => api.getCatalog(), [])
  const [sort, setSort] = useState('rating')
  const spec = cat.data?.specialtyBySlug[slug]
  const doctors = useMemo(
    () => (cat.data?.doctors ?? []).filter((d) => d.specialty === slug).sort(SORTS[sort]),
    [cat.data, slug, sort],
  )

  return (
    <div className="flex flex-1 flex-col">
      <TealHeader title="Choose Your Doctor" sub={spec?.name} illustration="/img/doctor-point.png" />
      <div className="relative -mt-8 flex-1 rounded-t-[40px] bg-white px-5 pt-6 pb-page-bottom">
        <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5">
          {[
            ['rating', 'Top rated'],
            ['price', 'Lowest fee'],
            ['experience', 'Most experienced'],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setSort(k)} className={`chip ${sort === k ? 'chip-active' : ''}`}>
              {label}
            </button>
          ))}
        </div>
        {cat.error && <ErrorState message={cat.error} onRetry={cat.reload} />}
        <div className="space-y-3">
          {cat.loading
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)
            : doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
        </div>
        {!cat.loading && doctors.length === 0 && (
          <EmptyState image={specialtyImage(slug)} title="No doctors yet" text="We’re adding more partners soon." />
        )}
      </div>
    </div>
  )
}
