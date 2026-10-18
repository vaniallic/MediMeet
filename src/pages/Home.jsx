import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LuChevronRight, LuMapPin, LuPhone, LuSearch, LuSlidersHorizontal } from 'react-icons/lu'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { api } from '../lib/api'
import { firstName, todayISO } from '../lib/format'
import { tips } from '../data/catalog'
import { illo } from '../components/icons'
import { UpcomingCard } from '../components/cards'
import { Logo, SectionHeader, Sheet, Skeleton } from '../components/ui'
import NewsSlideshow from '../components/NewsSlideshow'
import { getHealthNews } from '../lib/news'
import { readSeen } from '../lib/notifications'
import { loadNotifications } from './Notifications'
import { TbBell } from 'react-icons/tb'

const SERVICES = [
  { label: 'Doctors', img: 'doctor', to: '/specialists' },
  { label: 'Hospital', img: 'hospital', to: '/nearby?type=hospital' },
  { label: 'Pharmacy', img: 'medicine', to: '/pharmacy' },
]

const OTHER = [
  { label: 'Nearby pharmacies', text: 'Real pharmacies around you', img: 'firstaid', to: '/nearby?type=pharmacy' },
  { label: 'Appointment history', text: 'Past visits, reviews and receipts', img: 'calendar', to: '/history' },
  { label: 'Health news', text: 'Latest from Kemenkes RI and WHO', img: 'heart', to: '/news' },
  { label: 'Notifications', text: 'Reminders, payments and prescriptions', img: 'calendar', to: '/notifications' },
  { label: 'Emergency', text: 'Call 112 or find the nearest ER', img: 'ambulance', to: '/emergency' },
]

export function SearchBar({ onClick, placeholder = 'Find what you need' }) {
  return (
    <div className="px-5">
      <button
        onClick={onClick}
        className="flex h-12 w-full items-center gap-3 rounded-full border-2 border-brand bg-white px-4 text-left text-muted shadow-soft transition hover:shadow-md"
      >
        <LuSearch className="h-6 w-6 text-brand" />
        <span className="flex-1 text-sm">{placeholder}</span>
        <LuSlidersHorizontal className="h-5 w-5 text-brand" />
      </button>
    </div>
  )
}

export default function Home() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [otherOpen, setOtherOpen] = useState(false)
  const appts = useAsync(() => api.listAppointments(), [])
  const news = useAsync(() => getHealthNews(), [])
  const notes = useAsync(() => loadNotifications(), [])
  const unread = useMemo(() => {
    const seen = readSeen()
    return (notes.data ?? []).filter((n) => !seen.has(n.id)).length
  }, [notes.data])

  const today = todayISO()
  const upcoming = (appts.data ?? []).filter(
    (a) => ['pending_payment', 'confirmed'].includes(a.status) && a.date >= today,
  )

  return (
    <div className="pb-6">
      <header className="flex items-center justify-between gap-3 px-5 pt-6 pb-4">
        <Logo />
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate font-display text-xl font-bold text-brand">Hi, {profile ? firstName(profile.full_name) : '…'}!</p>
          <Link to="/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-brand hover:bg-brand-light">
            <TbBell className="h-6 w-6" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
        </div>
      </header>

      <SearchBar onClick={() => navigate('/search')} />

      <section className="mt-6">
        <SectionHeader title="Services" />
        <div className="grid grid-cols-4 justify-items-center gap-2 px-5">
          {SERVICES.map((s) => (
            <Link key={s.label} to={s.to} className="group flex flex-col items-center gap-2">
              <span className="grid h-[68px] w-[68px] place-items-center rounded-[20px] bg-brand shadow-press transition group-hover:-translate-y-0.5 group-active:scale-95">
                <img src={illo(s.img)} alt="" className="h-11 w-11 object-contain" />
              </span>
              <span className="text-xs font-medium text-ink">{s.label}</span>
            </Link>
          ))}
          <button onClick={() => setOtherOpen(true)} className="group flex flex-col items-center gap-2">
            <span className="grid h-[68px] w-[68px] place-items-center rounded-[20px] bg-brand shadow-press transition group-hover:-translate-y-0.5 group-active:scale-95">
              <span className="grid grid-cols-2 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="h-3.5 w-3.5 rounded-[5px] bg-mint" />
                ))}
              </span>
            </span>
            <span className="text-xs font-medium text-ink">Other</span>
          </button>
        </div>
      </section>

      <a
        href="tel:112"
        className="mx-5 mt-6 flex min-h-[96px] items-center gap-4 rounded-3xl bg-coral-light px-4 py-3 shadow-press transition hover:brightness-[1.02]"
      >
        <img src={illo('ambulance')} alt="" className="h-16 w-auto shrink-0 object-contain" />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg leading-tight font-bold text-coral">Emergency Call</span>
          <span className="mt-0.5 block text-xs text-coral/80">Ambulance &amp; ER, 24 hours</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-coral px-4 py-2.5 font-display text-lg font-bold text-white shadow-press">
          <LuPhone className="h-4 w-4" /> 112
        </span>
      </a>

      <section className="mt-6">
        <SectionHeader title="Upcoming Appointments" to="/appointments" />
        {appts.loading ? (
          <div className="px-5">
            <Skeleton className="h-[118px]" />
          </div>
        ) : upcoming.length ? (
          <div className="no-scrollbar flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2">
            {upcoming.map((a) => (
              <div key={a.id} className="snap-start">
                <UpcomingCard appt={a} compact={upcoming.length > 1} />
              </div>
            ))}
          </div>
        ) : (
          <Link
            to="/specialists"
            className="mx-5 flex items-center gap-4 rounded-2xl border-2 border-dashed border-mint bg-mist-light p-4 transition hover:bg-brand-light"
          >
            <img src={illo('calendar')} alt="" className="h-16 w-16 object-contain" />
            <div className="flex-1">
              <p className="font-display font-semibold text-ink">No upcoming visits</p>
              <p className="text-sm text-muted">Book a doctor in under a minute</p>
            </div>
            <LuChevronRight className="h-5 w-5 text-brand" />
          </Link>
        )}
      </section>

      <section className="mt-6">
        <SectionHeader title="What’s New in Health" to="/news" linkLabel="See all" />
        {news.data ? <NewsSlideshow items={news.data.items.slice(0, 6)} /> : <div className="px-5"><Skeleton className="h-[132px]" /></div>}
      </section>

      <section className="mt-6">
        <SectionHeader title="Recommendations" />
        <div className="no-scrollbar flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pt-1 pb-4">
          {tips.map((t) => (
            <Link
              key={t.slug}
              to={`/tips/${t.slug}`}
              className="flex h-[188px] w-[152px] shrink-0 snap-start flex-col rounded-3xl p-3.5 shadow-card transition hover:-translate-y-0.5 active:scale-[0.98]"
              style={{ background: t.tint }}
            >
              <span className="self-start rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-brand">{t.category}</span>
              <img src={illo(t.art)} alt="" className="mx-auto my-auto h-[72px] w-[72px] object-contain" />
              <p className="line-clamp-2 text-[13px] leading-snug font-semibold text-ink">{t.caption}</p>
            </Link>
          ))}
        </div>
      </section>

      <Sheet open={otherOpen} onClose={() => setOtherOpen(false)} title="More services">
        <div className="space-y-2">
          {OTHER.map((o) => (
            <Link
              key={o.label}
              to={o.to}
              className="flex items-center gap-4 rounded-2xl p-3 transition hover:bg-mist-light"
              onClick={() => setOtherOpen(false)}
            >
              <img src={illo(o.img)} alt="" className="h-12 w-12 object-contain" />
              <div className="flex-1">
                <p className="font-semibold text-ink">{o.label}</p>
                <p className="text-xs text-muted">{o.text}</p>
              </div>
              <LuChevronRight className="text-brand" />
            </Link>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted">
          <LuMapPin /> Nearby results use OpenStreetMap data.
        </p>
      </Sheet>
    </div>
  )
}
