import { Link } from 'react-router-dom'
import { LuMapPin } from 'react-icons/lu'
import { Avatar, RatingPill } from './ui'
import { fromISODate, rupiah } from '../lib/format'

/**
 * Doctor row from the Figma "Choose Your Doctor" screen: a round photo with a thick teal
 * ring that overlaps a white card holding hospital, name, specialty, rating and fee.
 */
export function DoctorCard({ doctor, showHospital = true, to, as = 'link', className = '' }) {
  const body = (
    <>
      <Avatar
        name={doctor.name}
        photo={doctor.photo}
        size="h-[72px] w-[72px] text-xl"
        className="absolute top-1/2 left-0 z-10 -translate-y-1/2"
      />
      <div className="ml-[30px] rounded-2xl bg-white py-2.5 pr-3.5 pl-[54px] shadow-press">
        {showHospital && doctor.hospital && (
          <p className="flex items-center gap-1 truncate text-xs text-ink">
            <LuMapPin className="shrink-0 text-brand" /> {doctor.hospital.name}
          </p>
        )}
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 font-display text-[15px] leading-tight font-bold tracking-tight text-black">{doctor.name}</p>
          <RatingPill value={doctor.rating} className="shrink-0" />
        </div>
        <div className="mt-0.5 flex items-end justify-between gap-2">
          <p className="text-[13px] leading-snug text-ink">{doctor.specialtyName}</p>
          <p className="shrink-0 text-[13px] text-brand">{rupiah(doctor.fee)}</p>
        </div>
      </div>
    </>
  )
  const cls = `relative block transition hover:-translate-y-0.5 active:scale-[0.99] ${className}`
  if (as === 'div') return <div className={cls}>{body}</div>
  return (
    <Link to={to ?? `/doctors/${doctor.id}`} className={cls}>
      {body}
    </Link>
  )
}

/** Teal (or rose when unpaid) date card used on Home, as in the Figma "Upcoming Appointments" carousel. */
export function UpcomingCard({ appt, compact = false }) {
  const d = fromISODate(appt.date)
  const pending = appt.status === 'pending_payment'
  return (
    <Link
      to={`/appointments/${appt.id}`}
      className={`flex shrink-0 items-center gap-4 rounded-2xl p-3.5 text-white shadow-press transition hover:brightness-105 active:scale-[0.99] ${
        compact ? 'w-[270px]' : 'w-full'
      } ${pending ? 'bg-[#a87670]' : 'bg-[#76999f]'}`}
    >
      <div className="grid h-[70px] w-[58px] shrink-0 place-items-center rounded-xl bg-white/45 text-center shadow-press">
        <div>
          <p className="font-display text-xl leading-none font-bold">{d.getDate()}</p>
          <p className="mt-1 font-display text-base leading-none font-bold">{d.toLocaleDateString('en-GB', { month: 'short' })}</p>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 text-xs text-white/85">
          <span>On Time: {appt.time.replace(':', '.')}</span>
          <span>{pending ? 'Unpaid' : appt.queue_no ? `No. ${appt.queue_no}` : ''}</span>
        </div>
        <p className="mt-0.5 truncate font-display text-lg font-bold">{shortDoctor(appt.doctor?.name)}</p>
        <p className="truncate text-sm text-white/85">{appt.doctor?.hospital?.name}</p>
      </div>
    </Link>
  )
}

/** "Dr. Joko Santoso" → "Dr. Joko", "Dr. Felicia, Sp.A" → "Dr. Felicia" (as on the Figma cards). */
export const shortDoctor = (name = '') => {
  const clean = name.split(',')[0]
  const parts = clean.split(' ')
  return parts.length > 2 ? parts.slice(0, 2).join(' ') : clean
}
