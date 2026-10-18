import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LuChevronLeft, LuLoaderCircle, LuRefreshCw, LuStar, LuX } from 'react-icons/lu'
import { initials } from '../lib/format'

export function Logo({ className = 'h-10', light = false }) {
  return (
    <img
      src="/img/logo.png"
      alt="MediMeet"
      className={`${className} w-auto shrink-0 self-start object-contain ${light ? 'brightness-0 invert' : ''}`}
    />
  )
}

export function TopBar({ title, back = true, right = null, onBack, className = '' }) {
  const navigate = useNavigate()
  const goBack = () => {
    if (onBack) return onBack()
    if (window.history.length > 1) navigate(-1)
    else navigate('/home')
  }
  return (
    <header className={`flex items-center gap-2 px-5 pt-page-top pb-4 ${className}`}>
      {back && (
        <button
          onClick={goBack}
          aria-label="Go back"
          className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-brand transition hover:bg-brand-light"
        >
          <LuChevronLeft className="h-7 w-7" />
        </button>
      )}
      {title && <h1 className="page-title flex-1 truncate [text-shadow:0_3px_4px_rgba(0,0,0,0.15)]">{title}</h1>}
      {right}
    </header>
  )
}

export function Spinner({ className = 'h-5 w-5' }) {
  return <LuLoaderCircle aria-hidden className={`animate-spin ${className}`} />
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-2xl ${className}`} />
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="mx-5 my-6 rounded-2xl bg-coral-light p-5 text-center">
      <p className="text-sm font-medium text-coral">{message}</p>
      {onRetry && (
        <button onClick={() => onRetry()} className="btn-ghost mt-3 text-coral hover:bg-white/60">
          <LuRefreshCw /> Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ image, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-8 py-10 text-center">
      {image && <img src={image} alt="" className="mb-4 h-24 w-24 object-contain opacity-90" />}
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      {action && <div className="mt-5 w-full max-w-60">{action}</div>}
    </div>
  )
}

const AVATAR_TINTS = ['#04677d', '#2f8a7e', '#3b7ea1', '#5a6fa8', '#8a5a9e', '#b5665b']
export function Avatar({ name, photo, size = 'h-14 w-14 text-lg', ring = true, className = '' }) {
  const tint = AVATAR_TINTS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_TINTS.length]
  const ringCls = ring ? 'border-[4px] border-brand' : ''
  if (photo)
    return <img src={photo} alt="" aria-hidden className={`shrink-0 rounded-full bg-mist object-cover ${size} ${ringCls} ${className}`} />
  return (
    <div
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full font-display font-bold text-white ${size} ${ringCls} ${className}`}
      style={{ background: `linear-gradient(145deg, ${tint}, ${tint}cc)` }}
    >
      {initials(name)}
    </div>
  )
}

export function RatingPill({ value, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white ${className}`}>
      {Number(value).toFixed(1)} <LuStar className="h-3 w-3 fill-current" aria-label="stars" />
    </span>
  )
}

export function Stars({ value, onChange, size = 'h-8 w-8' }) {
  return (
    <div className="flex gap-1" role={onChange ? 'radiogroup' : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= value
        const Star = (
          <LuStar className={`${size} transition ${on ? 'fill-amber-400 text-amber-400' : 'text-mist'}`} />
        )
        return onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => onChange(n)}
            className="transition active:scale-90"
          >
            {Star}
          </button>
        ) : (
          <span key={n}>{Star}</span>
        )
      })}
    </div>
  )
}

const STATUS = {
  pending_payment: ['Awaiting payment', 'bg-amber-100 text-amber-800'],
  confirmed: ['Paid', 'bg-brand-light text-brand'],
  completed: ['Completed', 'bg-mist text-ink'],
  cancelled: ['Cancelled', 'bg-coral-light text-coral'],
  unpaid: ['Not paid', 'bg-coral-light text-coral'],
  paid: ['Paid', 'bg-brand-light text-brand'],
}
export function StatusBadge({ status }) {
  const [label, cls] = STATUS[status] ?? [status, 'bg-mist text-ink']
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{label}</span>
}

export function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[900] flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="sheet-in relative max-h-[88vh] w-full max-w-[420px] overflow-y-auto rounded-t-[28px] bg-white px-6 pt-3 pb-8 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-mist" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-brand">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-mist-light">
            <LuX className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function SectionHeader({ title, to, linkLabel = 'View All' }) {
  return (
    <div className="mb-3 flex items-center justify-between px-5">
      <h2 className="section-title">{title}</h2>
      {to && (
        <Link to={to} className="text-sm font-medium text-muted hover:text-brand">
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

export function InfoNote({ children, className = '' }) {
  return <p className={`rounded-xl bg-mist-light px-4 py-3 text-xs leading-relaxed text-muted ${className}`}>{children}</p>
}
