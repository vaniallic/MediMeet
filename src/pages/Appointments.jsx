import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LuCalendarPlus, LuChevronRight, LuDownload, LuFileText, LuMapPin, LuNavigation, LuPlus, LuStar } from 'react-icons/lu'
import { api, friendlyError } from '../lib/api'
import { directionsUrl } from '../lib/osm'
import { daysUntil, formatDate, fromISODate, rupiah, todayISO } from '../lib/format'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import ApptPanel, { GreyTile, StatusRow } from '../components/ApptPanel'
import { Avatar, EmptyState, ErrorState, InfoNote, Logo, Skeleton, Spinner, Stars, StatusBadge, TopBar } from '../components/ui'

export const apptRows = (a) => [
  ['Date', formatDate(a.date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })],
  ['Time', a.time.replace(':', '.')],
  ['Loc', a.doctor.hospital?.name],
]

const STATUS_LABEL = {
  pending_payment: ['Not paid', 'coral'],
  confirmed: ['Paid', 'mint'],
  completed: ['Paid', 'mint'],
}

function ApptCard({ a, history }) {
  const days = daysUntil(a.date)
  const [label, tone] = STATUS_LABEL[a.status] ?? [a.status, 'muted']
  const tile = history ? (
    a.status !== 'completed' ? (
      <GreyTile as={Link} to={`/appointments/${a.id}`}>
        <span className="text-xs font-semibold">Waiting for result</span>
      </GreyTile>
    ) : a.review ? (
      <GreyTile>
        <span>
          <span className="flex items-center justify-center gap-1 font-display text-3xl font-bold">
            {a.review.rating} <LuStar className="h-6 w-6 fill-current" />
          </span>
          <span className="text-sm font-medium">Your Review</span>
        </span>
      </GreyTile>
    ) : (
      <GreyTile as={Link} to={`/appointments/${a.id}/review`}>
        <span>
          <LuStar className="mx-auto h-11 w-11 fill-current" />
          <span className="mt-1 block text-sm font-medium">Leave Review</span>
        </span>
      </GreyTile>
    )
  ) : (
    <GreyTile as={Link} to={a.status === 'pending_payment' ? `/checkout/${a.id}` : `/appointments/${a.id}`}>
      {a.status === 'pending_payment' ? (
        <span className="text-sm font-semibold text-coral">Complete payment</span>
      ) : (
        <span>
          <span className="block font-display text-[32px] leading-none font-bold">{days <= 0 ? '0' : days}</span>
          <span className="mt-1 block text-sm font-medium">{days <= 0 ? 'Today' : days === 1 ? 'More Day' : 'More Days'}</span>
        </span>
      )}
    </GreyTile>
  )

  return (
    <ApptPanel appt={a} rows={apptRows(a)} tile={tile}>
      <Link to={`/appointments/${a.id}`} aria-label="Appointment details" className="block">
        <StatusRow value={label} tone={tone} />
      </Link>
      {history && a.status === 'completed' && (
        <>
          <p className="mt-4 px-3 text-sm font-semibold text-brand">Result</p>
          <div className="mt-2 rounded-2xl bg-white px-4 py-4 shadow-[0_3px_6px_rgba(0,0,0,0.15)]">
            <p className="text-[13px] text-ink">The check-up result and the medical prescription.</p>
            <div className="mt-4 flex items-center justify-between">
              <Link to="/pharmacy" className="text-[13px] font-medium text-brand">
                Buy Medicine <span className="text-mint">Here</span>
              </Link>
              <Link to={`/appointments/${a.id}`} aria-label="View result" className="text-brand">
                <LuDownload className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </>
      )}
    </ApptPanel>
  )
}

export function Appointments({ mode = 'upcoming' }) {
  const history = mode === 'history'
  const appts = useAsync(() => api.listAppointments(), [])
  const today = todayISO()
  const list = (appts.data ?? []).filter((a) =>
    history
      ? a.status === 'completed' || (a.status === 'confirmed' && a.date < today)
      : ['pending_payment', 'confirmed'].includes(a.status) && a.date >= today,
  )
  if (history) list.reverse()

  return (
    <div className="flex-1 pb-page-bottom">
      <header className="px-5 pt-page-top">
        <Logo />
        <h1 className="page-title mt-5">{history ? 'History' : 'Upcoming Appointment'}</h1>
      </header>

      <div className="mt-5 space-y-5 px-5">
        {appts.error && <ErrorState message={appts.error} onRetry={appts.reload} />}
        {appts.loading && [0, 1].map((i) => <Skeleton key={i} className="h-64" />)}
        {!appts.loading && list.map((a) => <ApptCard key={a.id} a={a} history={history} />)}
        {!appts.loading && !appts.error && list.length === 0 && (
          <EmptyState
            image="/img/icon-calendar.png"
            title={history ? 'No past visits' : 'Nothing booked yet'}
            text={history ? 'Finished visits will show up here.' : 'Find a doctor and pick a time that suits you.'}
          />
        )}
        <Link
          to="/specialists"
          className="ml-3 flex h-[76px] flex-col items-center justify-center gap-1.5 rounded-[22px] bg-white text-[15px] text-muted/80 shadow-[0_4px_8px_rgba(0,0,0,0.18)] transition hover:text-brand"
        >
          Add Another Appointment
          <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-current">
            <LuPlus className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </div>
  )
}

/** Downloadable calendar file so the visit lands in the user's own calendar app. */
function icsFor(a) {
  const start = fromISODate(a.date)
  const [h, m] = a.time.split(':').map(Number)
  start.setHours(h, m)
  const end = new Date(start.getTime() + 30 * 60000)
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MediMeet//EN',
    'BEGIN:VEVENT',
    `UID:${a.id}@medimeet`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:Consultation with ${a.doctor.name}`,
    `LOCATION:${a.doctor.hospital.name}\\, ${a.doctor.hospital.address.replace(/,/g, '\\,')}`,
    `DESCRIPTION:Queue number ${a.queue_no ?? '-'}. Please arrive 15 minutes early.`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  return URL.createObjectURL(new Blob([body], { type: 'text/calendar' }))
}

export function AppointmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const appt = useAsync(() => api.getAppointment(id), [id])
  const [busy, setBusy] = useState('')

  const run = async (key, fn, msg) => {
    setBusy(key)
    try {
      await fn()
      if (msg) toast(msg)
      await appt.reload({ silent: true })
    } catch (e) {
      toast(friendlyError(e), 'error')
    } finally {
      setBusy('')
    }
  }

  if (appt.error) return <><TopBar title="Appointment" /><ErrorState message={appt.error} onRetry={appt.reload} /></>
  if (appt.loading) return <div className="space-y-4 p-5"><Skeleton className="h-48" /><Skeleton className="h-40" /></div>
  const a = appt.data
  const h = a.doctor.hospital

  return (
    <div className="pb-page-bottom">
      <TopBar title="Appointment" right={<StatusBadge status={a.status} />} />
      <div className="space-y-5 px-5">
        <Link to={`/doctors/${a.doctor.id}`} className="card flex items-center gap-4 p-4">
          <Avatar name={a.doctor.name} photo={a.doctor.photo} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-bold">{a.doctor.name}</p>
            <p className="text-sm text-muted">{a.doctor.specialtyName}</p>
          </div>
          <LuChevronRight className="text-brand" />
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-brand p-4 text-white shadow-press">
            <p className="text-xs text-white/80">Date & time</p>
            <p className="mt-1 font-display text-lg leading-tight font-bold">{formatDate(a.date, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
            <p className="font-display text-lg font-bold">{a.time.replace(':', '.')} WIB</p>
          </div>
          <div className="rounded-2xl bg-mist p-4 shadow-card">
            <p className="text-xs text-muted">Queue number</p>
            <p className="font-display text-3xl font-bold text-brand">{a.queue_no ?? '–'}</p>
          </div>
        </div>

        <div className="card p-4">
          <p className="flex items-start gap-2 text-sm">
            <LuMapPin className="mt-0.5 shrink-0 text-brand" />
            <span>
              <b>{h.name}</b>
              <br />
              <span className="text-muted">{h.address}</span>
            </span>
          </p>
          <div className="mt-3 flex gap-2">
            <a href={directionsUrl(h)} target="_blank" rel="noreferrer" className="btn-secondary h-10 flex-1 px-3 text-sm whitespace-nowrap">
              <LuNavigation /> Directions
            </a>
            {a.status === 'confirmed' && (
              <a href={icsFor(a)} download={`medimeet-${a.date}.ics`} className="btn-secondary h-10 flex-1 px-3 text-sm whitespace-nowrap">
                <LuCalendarPlus /> Add to calendar
              </a>
            )}
          </div>
        </div>

        <div className="card space-y-2 p-4 text-sm">
          <div className="flex justify-between"><span className="text-muted">Consultation fee</span><span>{rupiah(a.fee)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Service fee</span><span>{rupiah(a.admin_fee)}</span></div>
          {a.insurance_covered > 0 && (
            <div className="flex justify-between text-brand"><span>Insurance ({a.insurance_provider})</span><span>− {rupiah(a.insurance_covered)}</span></div>
          )}
          <div className="flex justify-between border-t border-mist pt-2 font-bold">
            <span>{a.paid_at ? `Paid via ${a.payment_method}` : 'To pay'}</span>
            <span className="text-brand">{rupiah(a.total)}</span>
          </div>
        </div>

        {a.status === 'pending_payment' && (
          <Link to={`/checkout/${a.id}`} className="btn-primary">Complete payment</Link>
        )}

        {a.status === 'confirmed' && (
          <>
            <InfoNote>Please arrive 15 minutes early and show your queue number at the registration desk.</InfoNote>
            <button className="btn-secondary" disabled={!!busy} onClick={() => run('finish', () => api.finishVisit(a.id), 'Visit finished — your prescription is in Pharmacy')}>
              {busy === 'finish' ? <Spinner /> : 'Mark visit as finished (demo)'}
            </button>
            <button
              className="w-full text-center text-sm font-medium text-coral hover:underline"
              disabled={!!busy}
              onClick={() => {
                if (window.confirm('Cancel this appointment?'))
                  run('cancel', async () => {
                    await api.cancelAppointment(a.id)
                    navigate('/appointments', { replace: true })
                  }, 'Appointment cancelled')
              }}
            >
              Cancel appointment
            </button>
          </>
        )}

        {a.status === 'completed' && (
          <div className="grid grid-cols-2 gap-3">
            {a.review ? (
              <div className="card flex flex-col items-center justify-center p-4">
                <Stars value={a.review.rating} size="h-5 w-5" />
                <p className="mt-1 text-xs text-muted">Thanks for your review</p>
              </div>
            ) : (
              <Link to={`/appointments/${a.id}/review`} className="btn-primary h-auto py-3">
                <LuStar /> Leave Review
              </Link>
            )}
            <Link to="/pharmacy" className="btn-secondary h-auto py-3">
              <LuFileText /> Prescription
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export function Review() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const appt = useAsync(() => api.getAppointment(id), [id])
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.submitReview(appt.data, { rating, comment: comment.trim() })
      toast('Thank you for your review!')
      navigate(`/appointments/${id}`, { replace: true })
    } catch (err) {
      toast(friendlyError(err), 'error')
      setBusy(false)
    }
  }

  if (appt.error) return <><TopBar title="Review" /><ErrorState message={appt.error} /></>
  if (appt.loading) return <div className="p-5"><Skeleton className="h-72" /></div>
  const a = appt.data
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col pb-page-bottom">
      <TopBar title="Leave Review" />
      <div className="flex flex-col items-center px-5 pt-4 text-center">
        <Avatar name={a.doctor.name} photo={a.doctor.photo} size="h-24 w-24 text-3xl" />
        <p className="mt-4 font-display text-xl font-bold">How was your visit with {a.doctor.name}?</p>
        <p className="mt-1 text-sm text-muted">{formatDate(a.date)}</p>
        <div className="mt-6">
          <Stars value={rating} onChange={setRating} size="h-11 w-11" />
        </div>
        <p className="mt-2 h-5 text-sm font-semibold text-brand">{labels[rating]}</p>
      </div>
      <label className="mx-5 mt-6 block">
        <span className="text-sm font-semibold text-muted">Tell others about it (optional)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={5}
          placeholder="Was the doctor clear and on time?"
          className="mt-2 w-full resize-none rounded-2xl bg-mist-light p-4 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
      </label>
      <div className="mt-auto px-5 pt-6">
        <button className="btn-primary h-12" disabled={!rating || busy}>
          {busy ? <Spinner /> : 'Submit review'}
        </button>
      </div>
    </form>
  )
}
