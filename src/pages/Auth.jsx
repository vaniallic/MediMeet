import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FcGoogle } from 'react-icons/fc'
import { FaApple, FaFacebook } from 'react-icons/fa'
import { LuArrowLeft, LuEye, LuEyeOff, LuLock, LuMail, LuPhone, LuUserRound } from 'react-icons/lu'
import { api, friendlyError } from '../lib/api'
import { DEMO_ACCOUNT, isDemoMode } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Logo, Spinner } from '../components/ui'

function Field({ icon: Icon, label, type = 'text', value, onChange, autoComplete, required = true, minLength }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <label className="field">
      <Icon className="h-5 w-5 shrink-0 text-muted" aria-hidden />
      <span className="sr-only">{label}</span>
      <input
        type={isPassword && show ? 'text' : type}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
      />
      {isPassword && (
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="text-muted">
          {show ? <LuEyeOff className="h-5 w-5" /> : <LuEye className="h-5 w-5" />}
        </button>
      )}
    </label>
  )
}

/**
 * Login: teal header with greeting and the waving doctor. Other auth screens: compact teal
 * header with the logo and a "Back to login" link inside the mist sheet, as in Figma.
 */
function AuthLayout({ greeting, sub, title, children, back }) {
  return (
    <div className="flex flex-1 flex-col bg-brand">
      {back ? (
        <div className="min-h-[130px] shrink-0 px-6 pt-page-top">
          <Logo light className="h-9 opacity-90" />
        </div>
      ) : (
        <div className="relative min-h-[240px] shrink-0 overflow-hidden px-6 pt-page-top">
          <Logo light className="h-9 opacity-90" />
          <p className="mt-10 font-display text-[34px] leading-none font-bold text-white [text-shadow:0_4px_4px_rgba(0,0,0,0.2)]">{greeting}</p>
          <p className="mt-2 text-base text-white">{sub}</p>
          <img src="/img/doctor-wave.png" alt="" className="absolute right-0 bottom-0 h-[160px] w-auto" />
        </div>
      )}
      <div className="relative z-10 -mt-6 flex flex-1 flex-col rounded-t-[32px] bg-mist px-6 pt-7 pb-page-bottom">
        {back && (
          <Link to={back} className="mb-5 inline-flex items-center gap-2 self-start text-[15px] text-brand hover:underline">
            <LuArrowLeft className="h-5 w-5" /> Back to login
          </Link>
        )}
        <h1 className="font-display text-[28px] font-bold text-brand [text-shadow:0_4px_4px_rgba(0,0,0,0.18)]">{title}</h1>
        {children}
      </div>
    </div>
  )
}

function Divider({ label }) {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted/80">
      <span className="h-px flex-1 bg-muted/30" />
      {label}
      <span className="h-px flex-1 bg-muted/30" />
    </div>
  )
}

const PROVIDERS = [
  { id: 'facebook', label: 'Facebook', icon: <FaFacebook className="h-6 w-6 text-[#1877f2]" /> },
  { id: 'google', label: 'Google', icon: <FcGoogle className="h-6 w-6" /> },
  { id: 'apple', label: 'Apple', icon: <FaApple className="h-6 w-6 text-black" /> },
]

function SocialButtons() {
  const toast = useToast()
  const go = async (provider) => {
    try {
      await api.signInWithProvider(provider)
    } catch (e) {
      toast(friendlyError(e), 'error')
    }
  }
  return (
    <div className="flex justify-center gap-4">
      {PROVIDERS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => go(p.id)}
          aria-label={`Continue with ${p.label}`}
          className="grid h-12 w-14 place-items-center rounded-xl bg-white shadow-[0_4px_4px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 active:scale-95"
        >
          {p.icon}
        </button>
      ))}
    </div>
  )
}

function useAfterAuth() {
  const navigate = useNavigate()
  const location = useLocation()
  return () => navigate(location.state?.from || '/home', { replace: true })
}

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const done = useAfterAuth()
  const location = useLocation()

  const signIn = async (e, creds = { email, password }) => {
    e?.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.signIn(creds.email.trim(), creds.password)
      done()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout greeting="Hello!" sub="Welcome to MediMeet" title="Login">
      {location.state?.reason === 'book' && (
        <p className="mt-4 rounded-2xl bg-brand-light px-4 py-3 text-sm text-brand">Log in or sign up to book your session. Your doctor and time are waiting.</p>
      )}
      <form onSubmit={signIn} className="mt-7 space-y-5">
        <Field icon={LuMail} label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field icon={LuLock} label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        <div className="-mt-2 text-right">
          <Link to="/forgot-password" className="text-sm font-semibold text-brand hover:underline">
            Forgot Password
          </Link>
        </div>
        {error && <p role="alert" className="rounded-xl bg-coral-light px-4 py-2.5 text-sm text-coral">{error}</p>}
        <button className="btn-primary" disabled={busy}>
          {busy ? <Spinner /> : 'Login'}
        </button>
      </form>

      {isDemoMode && (
        <button
          type="button"
          onClick={() => signIn(null, DEMO_ACCOUNT)}
          disabled={busy}
          className="btn-secondary mt-3 border-transparent bg-white/70 text-sm"
        >
          Try the demo account
        </button>
      )}

      <Divider label="Or login with" />
      <SocialButtons />

      <p className="mt-auto pt-8 text-center text-sm text-muted">
        Don’t have an account?{' '}
        <Link to="/signup" state={location.state} className="font-semibold text-brand hover:underline">
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  )
}

export function SignUp() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '', phone: '' })
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [checkEmail, setCheckEmail] = useState(false)
  const done = useAfterAuth()
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) return setError('Password needs at least 8 characters.')
    if (form.password !== form.confirm) return setError('Passwords don’t match.')
    if (!agree) return setError('Please agree to the Privacy Policy to continue.')
    setBusy(true)
    try {
      const { needsConfirmation } = await api.signUp({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
      })
      if (needsConfirmation) setCheckEmail(true)
      else done()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  if (checkEmail)
    return (
      <AuthLayout greeting="Almost!" sub="One more step" title="Check your email" back="/login">
        <p className="mt-4 text-sm leading-relaxed text-ink">
          We sent a confirmation link to <b>{form.email}</b>. Open it to activate your account, then come back and log in.
        </p>
        <Link to="/login" className="btn-primary mt-8">
          Back to login
        </Link>
      </AuthLayout>
    )

  return (
    <AuthLayout title="Sign Up" back="/login">
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field icon={LuUserRound} label="Full name" value={form.fullName} onChange={set('fullName')} autoComplete="name" />
        <Field icon={LuMail} label="Email" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
        <Field icon={LuLock} label="Password (min. 8 characters)" type="password" value={form.password} onChange={set('password')} autoComplete="new-password" minLength={8} />
        <Field icon={LuLock} label="Confirm Password" type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
        <Field icon={LuPhone} label="Phone (optional)" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" required={false} />
        <label className="flex items-center gap-3 px-2 text-sm text-ink">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-5 w-5 accent-brand" />
          <span>
            I agree with the{' '}
            <Link to="/privacy" className="font-semibold text-brand underline">
              Privacy Policy
            </Link>
          </span>
        </label>
        <Divider label="Or Sign Up with" />
        <SocialButtons />
        {error && <p role="alert" className="rounded-xl bg-coral-light px-4 py-2.5 text-sm text-coral">{error}</p>}
        <button className="btn-primary mt-4" disabled={busy}>
          {busy ? <Spinner /> : 'Sign Up'}
        </button>
      </form>
    </AuthLayout>
  )
}

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.sendPasswordReset(email.trim())
      setSent(true)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <AuthLayout greeting="No worries" sub="It happens to everyone" title="Reset" back="/login">
      {sent ? (
        <p className="mt-5 text-sm leading-relaxed">
          If an account exists for <b>{email}</b>, a reset link is on its way. Check your inbox (and spam folder).
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-5">
          <p className="text-sm text-muted">Enter your email and we’ll send you a link to choose a new password.</p>
          <Field icon={LuMail} label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
          {error && <p role="alert" className="rounded-xl bg-coral-light px-4 py-2.5 text-sm text-coral">{error}</p>}
          <button className="btn-primary" disabled={busy}>
            {busy ? <Spinner /> : 'Send reset link'}
          </button>
          {isDemoMode && <p className="text-xs text-muted">Reset emails work once Supabase is connected.</p>}
        </form>
      )}
    </AuthLayout>
  )
}

export function ResetPassword() {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { user, setRecovering } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const submit = async (e) => {
    e.preventDefault()
    if (password.length < 8) return setError('Password needs at least 8 characters.')
    setBusy(true)
    try {
      await api.updatePassword(password)
      setRecovering(false)
      toast('Password updated')
      navigate('/home', { replace: true })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <AuthLayout greeting="New start" sub="Choose a new password" title="New password" back="/login">
      {!user ? (
        <p className="mt-5 text-sm">This link has expired or was already used. Request a new one from the login page.</p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-5">
          <Field icon={LuLock} label="New password" type="password" value={password} onChange={setPassword} autoComplete="new-password" minLength={8} />
          {error && <p role="alert" className="rounded-xl bg-coral-light px-4 py-2.5 text-sm text-coral">{error}</p>}
          <button className="btn-primary" disabled={busy}>
            {busy ? <Spinner /> : 'Save password'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
