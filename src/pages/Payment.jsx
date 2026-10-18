import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { LuCheck, LuCopy } from 'react-icons/lu'
import { api, friendlyError } from '../lib/api'
import { formatDate, rupiah } from '../lib/format'
import { INSURANCE_COVERAGE } from '../data/catalog'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import PaymentMethods, { METHODS } from '../components/PaymentMethods'
import ApptPanel, { GreyTile } from '../components/ApptPanel'
import { apptRows } from './Appointments'
import { TbHeartHandshake } from 'react-icons/tb'
import { Avatar, ErrorState, InfoNote, Sheet, Skeleton, Spinner, TopBar } from '../components/ui'

const HOLD_MS = 15 * 60000
const PROVIDERS = ['Allianz', 'AXA Mandiri', 'Prudential', 'Manulife', 'Company insurance']

function useCountdown(createdAt) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const left = Math.max(0, new Date(createdAt).getTime() + HOLD_MS - now)
  const mm = String(Math.floor(left / 60000)).padStart(2, '0')
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0')
  return { left, label: `${mm}:${ss}` }
}

function Expired() {
  return (
    <div className="px-5 py-10 text-center">
      <p className="font-display text-xl font-bold text-ink">This booking expired</p>
      <p className="mt-2 text-sm text-muted">We hold a time for 15 minutes while you pay. Please choose your time again.</p>
      <Link to="/specialists" className="btn-primary mt-6">Choose a time</Link>
    </div>
  )
}

export function Checkout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const appt = useAsync(() => api.getAppointment(id), [id])
  const [method, setMethod] = useState('QRIS')
  const [insurance, setInsurance] = useState('')
  const [sheet, setSheet] = useState(false)
  const [busy, setBusy] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const { left, label } = useCountdown(appt.data?.created_at ?? Date.now())

  useEffect(() => {
    if (appt.data && appt.data.status !== 'pending_payment' && appt.data.status !== 'cancelled')
      navigate(`/appointments/${id}`, { replace: true })
  }, [appt.data, id, navigate])

  if (appt.error) return <><TopBar title="Payment" /><ErrorState message={appt.error} onRetry={appt.reload} /></>
  if (appt.loading) return <div className="space-y-4 p-5"><Skeleton className="h-40" /><Skeleton className="h-64" /></div>
  const a = appt.data
  if (a.status === 'cancelled' || left === 0) return <><TopBar title="Payment" /><Expired /></>

  const covered = insurance ? Math.floor(a.fee * INSURANCE_COVERAGE) : 0
  const total = a.fee + a.admin_fee - covered

  const pay = async () => {
    const m = METHODS.find((x) => x.id === method)
    if (m.id === 'Card') {
      setBusy(true)
      try {
        await api.payAppointment(id, { method, insurance })
        navigate(`/success/${id}`, { replace: true })
      } catch (e) {
        toast(friendlyError(e), 'error')
      } finally {
        setBusy(false)
      }
    } else {
      navigate(`/pay/${id}?${new URLSearchParams({ method, insurance })}`)
    }
  }

  const cancel = async () => {
    setCancelling(true)
    try {
      await api.cancelAppointment(id)
      toast('Booking cancelled')
      navigate('/home', { replace: true })
    } catch (e) {
      toast(friendlyError(e), 'error')
      setCancelling(false)
    }
  }

  return (
    <div className="pb-8">
      <TopBar title="Payment" right={<span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{label}</span>} />
      <div className="space-y-5 px-5 pt-2">
        <ApptPanel
          appt={a}
          rows={apptRows(a)}
          className="mt-2"
          tile={
            <GreyTile as="button" type="button" onClick={() => setSheet(true)} className={insurance ? 'bg-brand-light text-brand' : ''}>
              <span>
                <TbHeartHandshake className="mx-auto h-10 w-10" />
                <span className="mt-1 block text-[13px] leading-tight font-medium">{insurance || 'Add Insurance'}</span>
              </span>
            </GreyTile>
          }
        />

        <div className="rounded-full bg-brand px-5 py-3 text-white shadow-press">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-bold">Total</span>
            <span className="font-display text-lg font-semibold">{rupiah(total)}</span>
          </div>
        </div>
        <div className="-mt-2 space-y-1 px-6 text-xs text-muted">
          <div className="flex justify-between"><span>Consultation fee</span><span>{rupiah(a.fee)}</span></div>
          <div className="flex justify-between"><span>Service fee</span><span>{rupiah(a.admin_fee)}</span></div>
          {covered > 0 && (
            <div className="flex justify-between text-brand">
              <span>
                Insurance ({insurance}){' '}
                <button className="underline" onClick={() => setInsurance('')}>remove</button>
              </span>
              <span>− {rupiah(covered)}</span>
            </div>
          )}
        </div>

        <section>
          <h2 className="mb-3 px-1 text-sm text-muted">Select Payment Method</h2>
          <PaymentMethods value={method} onChange={setMethod} />
        </section>

        <InfoNote>Payments in MediMeet are simulated for this portfolio project. No money is charged.</InfoNote>

        <button className="btn-primary h-12" onClick={pay} disabled={busy}>
          {busy ? <Spinner /> : `Pay ${rupiah(total)}`}
        </button>
        <button className="w-full text-center text-sm font-medium text-coral hover:underline" onClick={cancel} disabled={cancelling}>
          {cancelling ? 'Cancelling…' : 'Cancel booking'}
        </button>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Add insurance">
        <p className="mb-4 text-sm text-muted">Choose your provider. In this demo, insurance covers {INSURANCE_COVERAGE * 100}% of the consultation fee.</p>
        <div className="space-y-2">
          {PROVIDERS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setInsurance(p)
                setSheet(false)
              }}
              className={`flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left font-semibold transition ${insurance === p ? 'border-brand bg-brand-light' : 'border-mist hover:border-mint'}`}
            >
              {p}
              {insurance === p && <LuCheck className="text-brand" />}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  )
}

export function PayScreen() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const method = params.get('method') || 'QRIS'
  const insurance = params.get('insurance') || ''
  const navigate = useNavigate()
  const toast = useToast()
  const appt = useAsync(() => api.getAppointment(id), [id])
  const [busy, setBusy] = useState(false)
  const { left, label } = useCountdown(appt.data?.created_at ?? Date.now())
  const isQR = METHODS.find((m) => m.id === method)?.qr

  if (appt.error) return <><TopBar title="Pay" /><ErrorState message={appt.error} onRetry={appt.reload} /></>
  if (appt.loading) return <div className="p-5"><Skeleton className="h-96" /></div>
  const a = appt.data
  if (a.status !== 'pending_payment') return <><TopBar title="Pay" /><ErrorState message="This appointment is already paid." /></>
  if (left === 0) return <><TopBar title="Pay" /><Expired /></>

  const covered = insurance ? Math.floor(a.fee * INSURANCE_COVERAGE) : 0
  const total = a.fee + a.admin_fee - covered
  const va = `8808${a.id.replace(/\D/g, '').padEnd(12, '7').slice(0, 12)}`

  const confirm = async () => {
    setBusy(true)
    try {
      await api.payAppointment(id, { method, insurance })
      navigate(`/success/${id}`, { replace: true })
    } catch (e) {
      toast(friendlyError(e), 'error')
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-mist pb-8">
      <TopBar title={isQR ? 'Scan QR Code' : 'Virtual Account'} />
      <p className="text-center text-sm text-muted">
        Complete payment within <b className="font-display text-brand">{label}</b>
      </p>
      <div className="mx-6 mt-6 rounded-3xl bg-white p-5 text-center shadow-press">
        {isQR ? (
          <div className="mx-auto w-fit p-2">
            <QRCodeSVG value={`MEDIMEET|DEMO|${method}|${a.id}|${total}`} size={200} fgColor="#4a6573" level="M" />
          </div>
        ) : (
          <div className="py-6">
            <p className="text-xs text-muted">Virtual account number</p>
            <p className="mt-1 font-display text-2xl font-bold tracking-wider text-ink">{va.replace(/(\d{4})/g, '$1 ').trim()}</p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(va)
                toast('Account number copied')
              }}
              className="btn-ghost mt-2"
            >
              <LuCopy /> Copy
            </button>
          </div>
        )}
        <button
          disabled={busy}
          onClick={confirm}
          className="mt-6 flex w-full items-center justify-between rounded-full bg-brand px-5 py-3 text-white shadow-press transition hover:bg-brand-dark disabled:opacity-60"
        >
          <span className="font-display text-lg font-bold">{busy ? <Spinner /> : 'Pay'}</span>
          <span className="font-display text-base font-semibold">{rupiah(total)}</span>
        </button>
      </div>
      <InfoNote className="mx-6 mt-5 bg-white/70">
        Demo: this {isQR ? 'QR code' : 'account number'} isn’t connected to a real payment network. Tap <b>Pay</b> to simulate a
        successful payment.
      </InfoNote>
    </div>
  )
}

export function PaymentSuccess() {
  const { id } = useParams()
  const appt = useAsync(() => api.getAppointment(id), [id])
  const a = appt.data
  return (
    <div className="flex flex-1 flex-col items-center px-5 pt-16 pb-8 text-center">
      <div className="success-pop grid h-40 w-40 place-items-center rounded-full bg-brand-light">
        <div className="grid h-28 w-28 place-items-center rounded-full bg-brand text-white shadow-press">
          <LuCheck className="h-16 w-16" strokeWidth={3} />
        </div>
      </div>
      <h1 className="mt-7 font-display text-xl font-bold text-ink">Payment Successful.</h1>
      {a ? (
        <>
          <p className="mt-2 max-w-[320px] text-sm leading-relaxed text-muted">
            You’re booked with <b className="text-ink">{a.doctor.name}</b> on {formatDate(a.date, { weekday: 'long', day: 'numeric', month: 'long' })} at{' '}
            {a.time.replace(':', '.')}.
          </p>
          <div className="mt-7 grid w-full grid-cols-2 gap-3">
            <div className="card flex min-h-[132px] flex-col items-center justify-center gap-4 px-4 py-6">
              <p className="text-xs text-muted">Queue number</p>
              <p className="font-display text-4xl leading-none font-bold text-brand">{a.queue_no ?? '–'}</p>
            </div>
            <div className="card flex min-h-[132px] flex-col items-center justify-center gap-2.5 px-4 py-6">
              <p className="text-xs text-muted">Paid via</p>
              <p className="font-display text-lg leading-tight font-bold text-brand">{a.payment_method}</p>
              <p className="text-xs text-muted">{rupiah(a.total)}</p>
            </div>
          </div>
        </>
      ) : (
        <Skeleton className="mt-7 h-[132px] w-full" />
      )}
      <div className="mt-auto w-full space-y-3 pt-12">
        <Link to={`/appointments/${id}`} className="btn-primary">View appointment</Link>
        <Link to="/home" className="btn-secondary">Back to Home</Link>
      </div>
    </div>
  )
}
