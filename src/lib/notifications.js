// In-app notifications, worked out from the user's appointments and prescriptions.
// Nothing extra is stored on the server: the list is always in sync with the real data.
// Which notifications were already seen is a per-browser convenience kept in localStorage.
import { daysUntil, fromISODate, todayISO } from './format'

const SEEN_KEY = 'medimeet-seen-notifications'

export function readSeen() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY)) ?? [])
  } catch {
    return new Set()
  }
}

export function markSeen(ids) {
  try {
    const seen = readSeen()
    ids.forEach((id) => seen.add(id))
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-200)))
  } catch {
    /* ignore */
  }
}

const atTime = (date, time) => {
  const d = fromISODate(date)
  const [h, m] = time.split(':').map(Number)
  d.setHours(h, m)
  return d.toISOString()
}

export function buildNotifications(appointments = [], prescriptions = []) {
  const today = todayISO()
  const list = []

  for (const a of appointments) {
    const doc = a.doctor?.name ?? 'your doctor'
    if (a.status === 'pending_payment' && a.date >= today) {
      list.push({
        id: `pay-${a.id}`,
        kind: 'payment',
        title: 'Complete your payment',
        text: `Your booking with ${doc} is held for 15 minutes. Pay to confirm it.`,
        to: `/checkout/${a.id}`,
        at: a.created_at,
      })
    }
    if (a.status === 'confirmed' && a.date >= today) {
      const d = daysUntil(a.date)
      if (d <= 2) {
        list.push({
          id: `remind-${a.id}-${d}`,
          kind: 'reminder',
          title: d === 0 ? 'Your visit is today' : d === 1 ? 'Your visit is tomorrow' : 'Visit in 2 days',
          text: `${doc} at ${a.doctor?.hospital?.name ?? 'the hospital'}, ${a.time.replace(':', '.')}. Queue no. ${a.queue_no ?? '-'}.`,
          to: `/appointments/${a.id}`,
          at: new Date().toISOString(),
        })
      }
      list.push({
        id: `confirmed-${a.id}`,
        kind: 'success',
        title: 'Booking confirmed',
        text: `You’re booked with ${doc}. Payment received via ${a.payment_method}.`,
        to: `/appointments/${a.id}`,
        at: a.paid_at ?? a.created_at,
      })
    }
    if (a.status === 'completed' && !a.review) {
      list.push({
        id: `review-${a.id}`,
        kind: 'review',
        title: 'How was your visit?',
        text: `Rate ${doc} to help other patients choose.`,
        to: `/appointments/${a.id}/review`,
        at: atTime(a.date, a.time),
      })
    }
  }

  for (const p of prescriptions) {
    const doc = p.doctor?.name ?? 'your doctor'
    if (p.status === 'unpaid') {
      list.push({
        id: `rx-${p.id}`,
        kind: 'prescription',
        title: 'Your prescription is ready',
        text: `${doc} prescribed ${p.items.length} item(s). Pay in the app and pick up at ${p.pickup_name}.`,
        to: '/pharmacy',
        at: p.created_at,
      })
    } else if (p.paid_at && Date.now() - new Date(p.paid_at).getTime() < 7 * 86400000) {
      list.push({
        id: `rx-paid-${p.id}`,
        kind: 'success',
        title: 'Medicine ready for pick-up',
        text: `Show your order at ${p.pickup_name}.`,
        to: '/pharmacy',
        at: p.paid_at,
      })
    }
  }

  return list.sort((x, y) => (y.at ?? '').localeCompare(x.at ?? ''))
}
