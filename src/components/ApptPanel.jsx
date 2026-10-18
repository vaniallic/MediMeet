import { DoctorCard } from './cards'

/**
 * Bordered appointment panel from the Figma Upcoming / History / Payment screens:
 * doctor card on top, Date / Time / Loc pills on the left, a grey action tile on the right,
 * and optional footer rows (status, result…).
 */
export default function ApptPanel({ appt, doctor, rows, tile, children, className = '' }) {
  const d = doctor ?? appt?.doctor
  return (
    <div className={`relative ml-3 rounded-[22px] border-[3px] border-brand bg-white px-3 pt-0 pb-4 shadow-press ${className}`}>
      <DoctorCard doctor={d} showHospital={false} className="-mt-3 -ml-6" />
      <div className="mt-3 flex gap-3">
        <div className="min-w-0 flex-1 space-y-2.5">
          {rows.map(([label, value]) => (
            <p key={label} className="truncate rounded-full bg-mist px-4 py-1.5 text-xs text-brand shadow-[0_3px_4px_rgba(0,0,0,0.1)]">
              {label}: <span className="font-medium">{value}</span>
            </p>
          ))}
        </div>
        {tile && <div className="w-[104px] shrink-0">{tile}</div>}
      </div>
      {children}
    </div>
  )
}

/** Grey square tile ("3 More Days", "Leave Review", "Add Insurance"). */
export function GreyTile({ as: As = 'div', children, className = '', ...rest }) {
  return (
    <As
      {...rest}
      className={`grid h-full min-h-[96px] w-full place-items-center rounded-2xl bg-[#c9cccd] p-2 text-center text-[#587a90] shadow-press transition ${
        As !== 'div' ? 'hover:brightness-95 active:scale-[0.98]' : ''
      } ${className}`}
    >
      {children}
    </As>
  )
}

export function StatusRow({ label = 'Status', value, tone = 'mint' }) {
  const color = { mint: 'text-mint', coral: 'text-coral', amber: 'text-amber-600', muted: 'text-muted' }[tone]
  return (
    <div className="mt-4 flex items-center justify-between rounded-full bg-white px-4 py-2 text-sm shadow-[0_3px_6px_rgba(0,0,0,0.15)]">
      <span className="text-muted">{label}</span>
      <span className={`font-semibold uppercase ${color}`}>{value}</span>
    </div>
  )
}
