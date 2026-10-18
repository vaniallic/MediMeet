import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LuChevronRight, LuClock, LuMapPin, LuSearch, LuX } from 'react-icons/lu'
import { api } from '../lib/api'
import { useAsync } from '../hooks/useAsync'
import { DoctorCard } from '../components/cards'
import NewsSlideshow from '../components/NewsSlideshow'
import { getHealthNews } from '../lib/news'
import { SpecialtyIcon } from '../components/icons'
import { specialtyImage } from '../data/catalog'
import { ErrorState, Skeleton, TopBar } from '../components/ui'

const RECENT_KEY = 'medimeet-recent-searches'
const readRecent = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) ?? []
  } catch {
    return []
  }
}

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function Search() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [recent, setRecent] = useState(readRecent)
  const navigate = useNavigate()
  const cat = useAsync(() => api.getCatalog(), [])
  const news = useAsync(() => getHealthNews(), [])

  useEffect(() => {
    const t = setTimeout(() => setParams(q ? { q } : {}, { replace: true }), 250)
    return () => clearTimeout(t)
  }, [q, setParams])

  const remember = (term) => {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 6)
    setRecent(next)
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  const results = useMemo(() => {
    if (!cat.data || !q.trim()) return null
    const terms = norm(q).split(/\s+/).filter(Boolean)
    const hit = (text) => terms.every((t) => norm(text).includes(t))
    return {
      specialties: cat.data.specialties.filter((s) => hit(`${s.name} ${s.blurb}`)),
      doctors: cat.data.doctors.filter((d) => hit(`${d.name} ${d.specialtyName} ${d.hospital?.name}`)),
      hospitals: cat.data.hospitals.filter((h) => hit(`${h.name} ${h.address}`)),
    }
  }, [cat.data, q])

  const total = results ? results.specialties.length + results.doctors.length + results.hospitals.length : 0

  return (
    <div className="pb-8">
      <TopBar title="Search" />
      <form
        className="px-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (q.trim()) remember(q.trim())
        }}
      >
        <label className="flex h-12 items-center gap-3 rounded-full border-2 border-brand bg-white px-4">
          <LuSearch className="h-6 w-6 shrink-0 text-brand" />
          <span className="sr-only">Search doctors, specialists or hospitals</span>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Doctor, specialist, or hospital"
            className="h-full flex-1 bg-transparent text-sm outline-none"
            enterKeyHint="search"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="text-muted">
              <LuX className="h-5 w-5" />
            </button>
          )}
        </label>
      </form>

      {!q.trim() && (
        <>
          <div className="mt-4 flex flex-wrap gap-2.5 px-5">
            <Link to="/nearby?type=hospital" className="chip">Nearest Hospital</Link>
            <Link to="/news" className="chip">News</Link>
            <Link to="/tips/walk-30-minutes" className="chip">Recommendations</Link>
            <Link to="/emergency" className="chip">Emergency</Link>
            <button onClick={() => setQ('Joko')} className="chip">Dr. Joko</button>
            <button onClick={() => setQ('Ciputra')} className="chip">Ciputra Hospital</button>
            <Link to="/nearby?type=pharmacy" className="chip">Nearest Pharmacy</Link>
          </div>

          {recent.length > 0 && (
            <section className="mt-6 px-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="section-title text-lg">Recent</h2>
                <button
                  className="text-xs font-medium text-muted hover:text-brand"
                  onClick={() => {
                    setRecent([])
                    localStorage.removeItem(RECENT_KEY)
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button key={r} onClick={() => setQ(r)} className="chip">
                    <LuClock /> {r}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="mt-7">
            <h2 className="section-title mb-2 px-5">What’s New?</h2>
            {news.data && <NewsSlideshow items={news.data.items.slice(0, 6)} />}
          </section>

          <section className="mt-7 px-5">
            <h2 className="section-title mb-3">Popular specialists</h2>
            <div className="flex flex-wrap gap-2">
              {(cat.data?.specialties ?? []).slice(0, 8).map((s) => (
                <Link key={s.slug} to={`/specialists/${s.slug}`} className="chip">
                  <SpecialtyIcon icon={s.icon} /> {s.name}
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      {cat.error && <ErrorState message={cat.error} onRetry={cat.reload} />}
      {q.trim() && cat.loading && (
        <div className="mt-5 space-y-3 px-5">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      {results && (
        <div className="mt-5 space-y-6" onClickCapture={() => remember(q.trim())}>
          {total === 0 && (
            <p className="px-5 text-sm text-muted">
              No results for “{q}”. Try a specialty like <button className="font-semibold text-brand" onClick={() => setQ('dentist')}>dentist</button> or a doctor’s name.
            </p>
          )}
          {results.specialties.length > 0 && (
            <section className="px-5">
              <h2 className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">Specialists</h2>
              <div className="space-y-2">
                {results.specialties.map((s) => (
                  <Link key={s.slug} to={`/specialists/${s.slug}`} className="row-card">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-light p-1">
                      <img src={specialtyImage(s.slug)} alt="" className="h-full w-full object-contain" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[15px] font-bold text-ink">{s.name}</span>
                      <span className="line-clamp-2 block text-xs text-muted">{s.blurb}</span>
                    </span>
                    <LuChevronRight className="text-brand" />
                  </Link>
                ))}
              </div>
            </section>
          )}
          {results.doctors.length > 0 && (
            <section className="px-5">
              <h2 className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">Doctors</h2>
              <div className="space-y-3">
                {results.doctors.map((d) => (
                  <DoctorCard key={d.id} doctor={d} />
                ))}
              </div>
            </section>
          )}
          {results.hospitals.length > 0 && (
            <section className="px-5">
              <h2 className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">Partner hospitals</h2>
              <div className="space-y-2">
                {results.hospitals.map((h) => (
                  <button key={h.id} onClick={() => navigate(`/hospitals/${h.id}`)} className="row-card w-full text-left">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-light">
                      <img src="/img/icon-hospital.png" alt="" className="h-9 w-9 object-contain" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[15px] font-bold text-ink">{h.name}</span>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <LuMapPin className="shrink-0 text-brand" /> <span className="truncate">{h.address}</span>
                      </span>
                    </span>
                    <LuChevronRight className="text-brand" />
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
