import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  LuBell,
  LuChevronDown,
  LuChevronRight,
  LuCircleHelp,
  LuCreditCard,
  LuDownload,
  LuGlobe,
  LuHardDrive,
  LuLock,
  LuLogOut,
  LuPencil,
  LuReceipt,
  LuSiren,
  LuTrash2,
} from 'react-icons/lu'
import { api, friendlyError } from '../lib/api'
import { isDemoMode } from '../lib/supabase'
import { formatTimestamp, rupiah } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import {
  TbBellFilled,
  TbCreditCardFilled,
  TbHelpCircleFilled,
  TbHistory,
  TbLockFilled,
  TbPackage,
  TbUrgent,
  TbWorld,
} from 'react-icons/tb'
import { Avatar, EmptyState, InfoNote, Logo, Skeleton, Spinner, TopBar } from '../components/ui'

const age = (birth) => {
  if (!birth) return null
  const b = new Date(birth)
  const n = new Date()
  return n.getFullYear() - b.getFullYear() - (n < new Date(n.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0)
}

const GROUPS = [
  [
    { key: 'language', label: 'Language', icon: TbWorld },
    { key: 'notifications', label: 'Notifications', icon: TbBellFilled },
  ],
  [{ key: 'payments', label: 'Payments', icon: TbCreditCardFilled }],
  [
    { key: 'privacy', label: 'Privacy and Security', icon: TbLockFilled },
    { key: 'storage', label: 'Storage and Data', icon: TbPackage },
  ],
  [
    { key: 'emergency', label: 'Emergency Service', icon: TbUrgent, to: '/emergency' },
    { key: 'help', label: 'Get Help', icon: TbHelpCircleFilled },
  ],
]

export function Profile() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const logout = async () => {
    await api.signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex-1 pb-6">
      <div className="relative h-[200px] bg-brand px-5 pt-7">
        <Logo light className="h-9 opacity-90" />
        {profile && (
          <p className="absolute bottom-6 left-[160px] right-4 truncate font-display text-base text-white">
            {profile.full_name || 'Your name'}
            {age(profile.birth_date) !== null && <span>, {age(profile.birth_date)} y.o.</span>}
          </p>
        )}
      </div>
      <div className="relative -mt-4 rounded-t-[32px] bg-white px-5">
        {!profile ? (
          <div className="pt-6"><Skeleton className="h-32" /></div>
        ) : (
          <div className="flex gap-4">
            <Avatar
              name={profile.full_name || profile.email}
              size="h-[120px] w-[120px] text-4xl"
              ring={false}
              className="-mt-[70px] border-[4px] border-brand ring-4 ring-white"
            />
            <div className="min-w-0 flex-1 pt-3">
              <p className="truncate text-xs text-brand">{profile.email}</p>
              <Link
                to="/profile/edit"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs text-muted shadow-[0_3px_6px_rgba(0,0,0,0.18)] hover:text-brand"
              >
                <LuPencil /> Edit Profile
              </Link>
            </div>
          </div>
        )}

        <Link
          to="/settings/payments"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-mist px-5 py-2.5 text-sm text-brand shadow-press"
        >
          <TbHistory className="h-5 w-5" /> View Active Transactions
        </Link>
        <div className="mt-4 border-t border-mist">
          {GROUPS.map((g, i) => (
            <div key={i} className="border-b border-mist py-2">
              {g.map(({ key, label, icon: Icon, to }) => (
                <Link key={key} to={to ?? `/settings/${key}`} className="flex items-center gap-5 rounded-xl px-2 py-2.5 transition hover:bg-mist-light">
                  <Icon className="h-6 w-6 text-brand" />
                  <span className="flex-1 text-sm text-brand">{label}</span>
                  <LuChevronRight className="text-mint" />
                </Link>
              ))}
            </div>
          ))}
          <button onClick={logout} className="mt-2 flex w-full items-center gap-5 rounded-xl px-2 py-2.5 text-coral transition hover:bg-coral-light">
            <LuLogOut className="h-6 w-6" /> <span className="text-sm">Log out</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export function EditProfile() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState(() => ({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    birth_date: profile?.birth_date ?? '',
  }))
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim()) return toast('Please enter your name', 'error')
    setBusy(true)
    try {
      await api.updateProfile({ ...profile, ...form, full_name: form.full_name.trim() })
      await refreshProfile()
      toast('Profile saved')
      navigate('/profile', { replace: true })
    } catch (err) {
      toast(friendlyError(err), 'error')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="flex flex-1 flex-col pb-8">
      <TopBar title="Edit Profile" />
      <div className="flex justify-center py-3">
        <Avatar name={form.full_name || 'M M'} size="h-24 w-24 text-3xl" />
      </div>
      <div className="space-y-4 px-5">
        {[
          ['full_name', 'Full name', 'text', 'name'],
          ['phone', 'Phone', 'tel', 'tel'],
          ['birth_date', 'Date of birth', 'date', 'bday'],
        ].map(([k, label, type, ac]) => (
          <label key={k} className="block">
            <span className="mb-1.5 block pl-4 text-xs font-semibold text-muted">{label}</span>
            <span className="field bg-mist-light">
              <input type={type} value={form[k] ?? ''} onChange={set(k)} autoComplete={ac} max={type === 'date' ? new Date().toISOString().slice(0, 10) : undefined} />
            </span>
          </label>
        ))}
        <label className="block">
          <span className="mb-1.5 block pl-4 text-xs font-semibold text-muted">Email</span>
          <span className="field bg-mist-light opacity-70">
            <input value={profile?.email ?? ''} disabled />
          </span>
        </label>
      </div>
      <div className="mt-auto px-5 pt-8">
        <button className="btn-primary h-12" disabled={busy}>{busy ? <Spinner /> : 'Save changes'}</button>
      </div>
    </form>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition ${checked ? 'bg-brand' : 'bg-mist'}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  )
}

function Payments() {
  const data = useAsync(async () => {
    const [appts, rx] = await Promise.all([api.listAppointments(), api.listPrescriptions()])
    return [
      ...appts.filter((a) => a.paid_at).map((a) => ({ id: a.id, at: a.paid_at, title: `Consultation · ${a.doctor.name}`, method: a.payment_method, amount: a.total })),
      ...rx.filter((p) => p.paid_at).map((p) => ({ id: p.id, at: p.paid_at, title: `Medicine · ${p.pickup_name}`, method: p.payment_method, amount: p.total })),
    ].sort((x, y) => y.at.localeCompare(x.at))
  }, [])
  if (data.loading) return <Skeleton className="h-40" />
  if (!data.data?.length) return <EmptyState image="/img/icon-calendar.png" title="No payments yet" />
  return (
    <>
      <ul className="divide-y divide-mist rounded-2xl bg-white shadow-card">
        {data.data.map((t) => (
          <li key={t.id} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{t.title}</p>
              <p className="text-xs text-muted">{formatTimestamp(t.at)} · {t.method}</p>
            </div>
            <p className="text-sm font-bold text-brand">{rupiah(t.amount)}</p>
          </li>
        ))}
      </ul>
      <InfoNote className="mt-4">All payments in MediMeet are simulated.</InfoNote>
    </>
  )
}

function ChangePassword() {
  const toast = useToast()
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (pw.length < 8) return toast('Password needs at least 8 characters', 'error')
    setBusy(true)
    try {
      await api.updatePassword(pw)
      setPw('')
      toast('Password updated')
    } catch (err) {
      toast(friendlyError(err), 'error')
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <span className="field bg-mist-light">
        <LuLock className="text-muted" />
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" autoComplete="new-password" aria-label="New password" />
      </span>
      <button className="btn-primary h-11 text-sm" disabled={busy}>{busy ? <Spinner /> : 'Update password'}</button>
    </form>
  )
}

export function PrivacyText() {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-ink">
      <p>MediMeet is a student portfolio project. It is not a medical service and should not be used for real appointments.</p>
      <p><b>What we store:</b> your name, email, optional phone and date of birth, and the bookings, reviews and prescriptions you create in the app.</p>
      <p><b>Where:</b> in a Supabase database protected by row-level security, so each account can only read its own records. In demo mode, everything stays in your browser.</p>
      <p><b>Location:</b> used only in your browser to find nearby hospitals and pharmacies through OpenStreetMap. It is never saved to your account.</p>
      <p><b>Payments:</b> simulated. MediMeet never asks for card numbers.</p>
      <p>You can download or delete your data at any time from Profile → Storage and Data.</p>
    </div>
  )
}

const FAQ = [
  ['How do I book a doctor?', 'Open Doctors on the Home screen, pick a specialist, choose a doctor, then a date and time. You have 15 minutes to pay before the time is released.'],
  ['Can I cancel?', 'Yes. Open the appointment and tap “Cancel appointment”. In this demo no refund is needed because payments are simulated.'],
  ['Where do prescriptions come from?', 'After a visit is finished, the doctor’s prescription appears in Pharmacy. You can pay and change where you pick it up.'],
  ['Is my data real?', 'Hospitals and doctors are fictional. Nearby hospitals and pharmacies on the map are real places from OpenStreetMap.'],
]

export function Settings() {
  const { section } = useParams()
  const { profile, setProfile } = useAuth()
  const toast = useToast()
  const [openFaq, setOpenFaq] = useState(0)

  const titles = { language: 'Language', notifications: 'Notifications', payments: 'Payments', privacy: 'Privacy and Security', storage: 'Storage and Data', help: 'Get Help' }

  const toggleNotif = async (v) => {
    setProfile((p) => ({ ...p, notifications: v }))
    try {
      await api.updateProfile({ ...profile, notifications: v })
    } catch (e) {
      toast(friendlyError(e), 'error')
    }
  }

  const download = async () => {
    const data = await api.exportData()
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'medimeet-my-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearCache = () => {
    Object.keys(sessionStorage).filter((k) => k.startsWith('osm:') || k === 'medimeet-geo').forEach((k) => sessionStorage.removeItem(k))
    localStorage.removeItem('medimeet-recent-searches')
    toast('Map cache and recent searches cleared')
  }

  return (
    <div className="pb-10">
      <TopBar title={titles[section] ?? 'Settings'} />
      <div className="px-5">
        {section === 'language' && (
          <div className="space-y-2">
            {[['English', true], ['Bahasa Indonesia', false]].map(([l, on]) => (
              <div key={l} className={`flex items-center justify-between rounded-2xl border-2 p-4 ${on ? 'border-brand bg-brand-light' : 'border-mist opacity-60'}`}>
                <span className="font-semibold">{l}</span>
                <span className="text-xs text-muted">{on ? 'Current' : 'Coming soon'}</span>
              </div>
            ))}
          </div>
        )}
        {section === 'notifications' && (
          <div className="card flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-semibold">Appointment reminders</p>
              <p className="text-xs text-muted">A reminder the day before your visit</p>
            </div>
            <Toggle checked={profile?.notifications ?? true} onChange={toggleNotif} label="Appointment reminders" />
          </div>
        )}
        {section === 'payments' && <Payments />}
        {section === 'privacy' && (
          <>
            <PrivacyText />
            <h2 className="section-title mt-8 mb-3 text-lg">Change password</h2>
            <ChangePassword />
          </>
        )}
        {section === 'storage' && (
          <div className="space-y-3">
            <button onClick={download} className="card flex w-full items-center gap-4 p-4 text-left">
              <LuDownload className="h-6 w-6 text-brand" />
              <span className="flex-1"><b className="block text-sm">Download my data</b><span className="text-xs text-muted">Profile, appointments and prescriptions as JSON</span></span>
            </button>
            <button onClick={clearCache} className="card flex w-full items-center gap-4 p-4 text-left">
              <LuTrash2 className="h-6 w-6 text-brand" />
              <span className="flex-1"><b className="block text-sm">Clear cache</b><span className="text-xs text-muted">Saved map results and recent searches</span></span>
            </button>
            {isDemoMode && (
              <button
                onClick={() => {
                  if (window.confirm('Delete all demo accounts and data in this browser?')) {
                    localStorage.removeItem('medimeet-demo-v1')
                    window.location.href = '/'
                  }
                }}
                className="card flex w-full items-center gap-4 p-4 text-left text-coral"
              >
                <LuTrash2 className="h-6 w-6" />
                <span className="flex-1"><b className="block text-sm">Reset demo</b><span className="text-xs">Removes demo data from this browser</span></span>
              </button>
            )}
          </div>
        )}
        {section === 'help' && (
          <div className="space-y-2">
            {FAQ.map(([q, a], i) => (
              <div key={q} className="overflow-hidden rounded-2xl bg-mist-light">
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i} className="flex w-full items-center gap-3 p-4 text-left text-sm font-semibold">
                  <span className="flex-1">{q}</span>
                  <LuChevronDown className={`text-brand transition ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <p className="px-4 pb-4 text-sm text-muted">{a}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function PrivacyPage() {
  return (
    <div className="pb-10">
      <TopBar title="Privacy Policy" />
      <div className="px-5"><PrivacyText /></div>
    </div>
  )
}
