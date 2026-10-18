import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { TbMapPinFilled } from 'react-icons/tb'
import { LuChevronLeft, LuChevronRight, LuHistory, LuMapPin, LuStar, LuUsers } from 'react-icons/lu'
import { api, friendlyError } from '../lib/api'
import { addDays, compact, fromISODate, isSlotPast, rupiah, todayISO } from '../lib/format'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { Avatar, ErrorState, RatingPill, Skeleton, Spinner, TopBar } from '../components/ui'

const DAYS_AHEAD = 21

export default function DoctorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const cat = useAsync(() => api.getCatalog(), [])
  const doctor = cat.data?.doctorById[id]

  const dates = useMemo(() => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(todayISO(), i)), [])
  const works = (iso) => doctor?.days.includes(fromISODate(iso).getDay())
  const hasFreeTime = (iso) => doctor?.slots.some((t) => !isSlotPast(iso, t))
  const [date, setDate] = useState(null)
  const [time, setTime] = useState(null)
  const [busy, setBusy] = useState(false)
  const strip = useRef(null)

  useEffect(() => {
    if (doctor && !date) setDate(dates.find((d) => works(d) && hasFreeTime(d)) ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctor])

  const booked = useAsync(() => (date ? api.bookedSlots(id, date) : Promise.resolve([])), [id, date])

  useEffect(() => setTime(null), [date])

  const book = async () => {
    setBusy(true)
    try {
      const appt = await api.createAppointment({ doctorId: id, date, time })
      navigate(`/checkout/${appt.id}`)
    } catch (e) {
      toast(friendlyError(e), 'error')
      booked.reload({ silent: true })
      setTime(null)
    } finally {
      setBusy(false)
    }
  }

  if (cat.error) return <ErrorState message={cat.error} onRetry={cat.reload} />
  if (cat.loading)
    return (
      <div className="space-y-4 p-5">
        <Skeleton className="h-64" />
        <Skeleton className="h-40" />
      </div>
    )
  if (!doctor) return <><TopBar /><ErrorState message="Doctor not found." /></>

  const monthLabel = date ? fromISODate(date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : ''
  const scroll = (dir) => strip.current?.scrollBy({ left: dir * 240, behavior: 'smooth' })

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative h-[300px] overflow-hidden bg-gradient-to-b from-brand via-[#5a9fb0] to-[#d9f1f5]">
        {doctor.portrait ? (
          <img src={doctor.portrait} alt="" className="absolute right-6 bottom-0 h-[236px] w-auto" />
        ) : (
          <Avatar
            name={doctor.name}
            photo={doctor.photo}
            ring={false}
            size="h-32 w-32 text-4xl"
            className="absolute top-20 right-6 border-[5px] border-white/80 shadow-card"
          />
        )}
        <div className="relative text-white [&_button]:text-white [&_button:hover]:bg-white/15">
          <TopBar />
        </div>
        <div className="relative max-w-[56%] px-6">
          <RatingPill value={doctor.rating} />
          <h1 className="mt-3 font-display text-[26px] leading-[1.08] font-bold text-white [text-shadow:0_3px_6px_rgba(0,0,0,0.25)]">
            {doctor.name}
          </h1>
          <p className="mt-1 text-sm text-white">{doctor.specialtyName}</p>
          <Link to={`/hospitals/${doctor.hospital_id}`} className="mt-2 inline-flex items-center gap-1.5 text-[15px] text-brand hover:underline">
            <TbMapPinFilled className="h-5 w-5" /> {doctor.hospital?.name}
          </Link>
        </div>
      </div>

      <div className="relative z-10 mx-5 -mt-10 grid grid-cols-3 rounded-full bg-white py-3.5 shadow-press">
        {[
          [LuHistory, `${doctor.experience_years} Years`, 'Experience'],
          [LuUsers, `${compact(doctor.patients)} +`, 'Patients'],
          [LuStar, `${compact(doctor.reviews_count)} +`, 'Reviews'],
        ].map(([Icon, v, l]) => (
          <div key={l} className="flex items-center justify-center gap-2">
            <Icon className="h-5 w-5 shrink-0 text-brand" />
            <div className="leading-tight">
              <p className="text-[13px] text-brand">{v}</p>
              <p className="text-[12px] text-black">{l}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="px-5 pt-5">
        <p className="text-sm leading-relaxed text-muted">{doctor.bio}</p>
        <p className="mt-2 text-sm">
          Consultation fee <b className="text-brand">{rupiah(doctor.fee)}</b>
        </p>
      </section>

      <section className="mt-5 flex flex-1 flex-col rounded-t-[32px] bg-white px-5 pt-6 pb-8 shadow-[0_-6px_18px_rgba(4,103,125,0.06)]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">Select Date</h2>
          <p className="font-display text-sm font-semibold text-brand">{monthLabel}</p>
        </div>
        <div className="mt-3 flex items-center gap-1">
          <button onClick={() => scroll(-1)} aria-label="Earlier dates" className="grid h-9 w-7 shrink-0 place-items-center text-brand">
            <LuChevronLeft className="h-7 w-7" />
          </button>
          <div ref={strip} className="no-scrollbar flex flex-1 gap-2.5 overflow-x-auto py-1">
            {dates.map((d) => {
              const ok = works(d) && hasFreeTime(d)
              const on = d === date
              const dt = fromISODate(d)
              return (
                <button
                  key={d}
                  disabled={!ok}
                  onClick={() => setDate(d)}
                  aria-pressed={on}
                  aria-label={dt.toDateString() + (ok ? '' : ', not available')}
                  className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border-2 transition ${
                    on
                      ? 'border-brand bg-brand text-white shadow-press'
                      : ok
                        ? 'border-mist bg-white text-ink hover:border-mint'
                        : 'border-transparent bg-transparent text-muted/40 line-through'
                  }`}
                >
                  <span className="font-display text-xl leading-none font-bold">{dt.getDate()}</span>
                  <span className="mt-1 text-xs">{dt.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                </button>
              )
            })}
          </div>
          <button onClick={() => scroll(1)} aria-label="Later dates" className="grid h-9 w-7 shrink-0 place-items-center text-brand">
            <LuChevronRight className="h-7 w-7" />
          </button>
        </div>

        <h2 className="mt-6 text-sm font-semibold text-muted">Select Time</h2>
        {!date ? (
          <p className="mt-3 text-sm text-muted">No open dates in the next three weeks.</p>
        ) : (
          <div className="mt-3 grid grid-cols-4 gap-2.5">
            {doctor.slots.map((t) => {
              const taken = booked.data?.includes(t)
              const past = isSlotPast(date, t)
              const disabled = taken || past || booked.loading
              const on = t === time
              return (
                <button
                  key={t}
                  disabled={disabled}
                  onClick={() => setTime(t)}
                  aria-pressed={on}
                  title={taken ? 'Already booked' : past ? 'Time has passed' : undefined}
                  className={`h-9 rounded-full border-2 font-display text-sm font-semibold transition ${
                    on
                      ? 'border-brand bg-brand text-white'
                      : disabled
                        ? 'border-mist bg-mist/60 text-muted/50 line-through'
                        : 'border-brand bg-white text-brand hover:bg-brand-light'
                  }`}
                >
                  {t.replace(':', '.')}
                </button>
              )
            })}
          </div>
        )}
        <p className="mt-3 text-[11px] text-muted">Crossed-out times are already booked or have passed.</p>

        <div className="mt-auto pt-6">
          <button className="btn-primary h-12" disabled={!date || !time || busy} onClick={book}>
            {busy ? <Spinner /> : time ? `Book Session · ${time.replace(':', '.')}` : 'Book Session'}
          </button>
        </div>
      </section>
    </div>
  )
}
