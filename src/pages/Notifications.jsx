import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TbBellRinging, TbCircleCheckFilled, TbCreditCardFilled, TbPill, TbStarFilled } from 'react-icons/tb'
import { api } from '../lib/api'
import { buildNotifications, markSeen, readSeen } from '../lib/notifications'
import { timeAgo } from '../lib/news'
import { useAsync } from '../hooks/useAsync'
import { EmptyState, ErrorState, Skeleton, TopBar } from '../components/ui'

const ICONS = {
  payment: [TbCreditCardFilled, 'bg-coral-light text-coral'],
  reminder: [TbBellRinging, 'bg-amber-100 text-amber-700'],
  success: [TbCircleCheckFilled, 'bg-brand-light text-brand'],
  review: [TbStarFilled, 'bg-amber-100 text-amber-500'],
  prescription: [TbPill, 'bg-[#e3f1ee] text-[#2f8a7e]'],
}

export async function loadNotifications() {
  const [a, p] = await Promise.all([api.listAppointments(), api.listPrescriptions()])
  return buildNotifications(a, p)
}

export default function Notifications() {
  const data = useAsync(loadNotifications, [])
  const seen = useMemo(() => readSeen(), [])

  useEffect(() => {
    if (data.data) markSeen(data.data.map((n) => n.id))
  }, [data.data])

  return (
    <div className="pb-8">
      <TopBar title="Notifications" />
      {data.error && <ErrorState message={data.error} onRetry={data.reload} />}
      <div className="space-y-2.5 px-5">
        {data.loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
        {data.data?.map((n) => {
          const [Icon, tone] = ICONS[n.kind] ?? ICONS.success
          const unread = !seen.has(n.id)
          return (
            <Link key={n.id} to={n.to} className={`flex gap-3 rounded-2xl p-3.5 transition hover:bg-mist-light ${unread ? 'bg-brand-light/60' : 'bg-white ring-1 ring-mist'}`}>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">{n.title}</span>
                  <span className="shrink-0 text-[11px] text-muted">{timeAgo(n.at)}</span>
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-muted">{n.text}</span>
              </span>
              {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral" aria-label="unread" />}
            </Link>
          )
        })}
        {data.data?.length === 0 && <EmptyState image="/img/icon-calendar.png" title="You’re all caught up" text="Reminders about visits, payments and medicine show up here." />}
      </div>
    </div>
  )
}
