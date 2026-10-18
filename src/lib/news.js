// Health news for the Home slideshow and the News page.
// Live data comes from the `health-news` Supabase Edge Function (Kemenkes + WHO RSS).
// In demo mode, or if the function is unreachable, MediMeet's own health tips are shown instead.
import { isDemoMode, supabase } from './supabase'

const CACHE_KEY = 'medimeet-news'

export const TOPIC_ART = {
  vaccine: { img: '/img/icon-syringe.png', tint: '#dfe9fb', label: 'Vaccines' },
  heart: { img: '/img/icon-heart.png', tint: '#fbe3e3', label: 'Heart health' },
  mind: { img: '/img/icon-monitor.png', tint: '#e7e3f8', label: 'Mental health' },
  outbreak: { img: '/img/icon-lab.png', tint: '#e2eefb', label: 'Disease alert' },
  nutrition: { img: '/img/icon-medicine.png', tint: '#f3e6f0', label: 'Nutrition' },
  hospital: { img: '/img/icon-hospital.png', tint: '#dcebed', label: 'Health services' },
  medicine: { img: '/img/icon-firstaid.png', tint: '#e5f1ee', label: 'Medicine' },
  general: { img: '/img/icon-bloodpressure.png', tint: '#e6eef0', label: 'Health' },
}

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString()

/** Shown in demo mode and as a fallback. Links stay inside the app. */
export const FALLBACK_NEWS = [
  {
    id: 'tip-flu',
    title: 'Flu season is here — protect yourself',
    summary: 'Why a yearly flu shot matters and when to see a doctor for a fever.',
    to: '/tips/flu-season',
    source: 'MediMeet Tips',
    published: daysAgo(1),
    topic: 'outbreak',
  },
  {
    id: 'feature-pharmacy',
    title: 'Get your medicine online and pick it up nearby',
    summary: 'Pay for your prescription in the app and choose the pharmacy closest to you.',
    to: '/pharmacy',
    source: 'MediMeet',
    published: daysAgo(2),
    topic: 'medicine',
  },
  {
    id: 'tip-mind',
    title: 'Your mind matters: try a 3-minute breathing break',
    summary: 'A simple breathing pattern to settle stress during a busy day.',
    to: '/tips/breathing-break',
    source: 'MediMeet Tips',
    published: daysAgo(3),
    topic: 'mind',
  },
  {
    id: 'tip-walk',
    title: 'Thirty minutes of walking a day adds up',
    summary: 'Small ways to move more without a gym membership.',
    to: '/tips/walk-30-minutes',
    source: 'MediMeet Tips',
    published: daysAgo(5),
    topic: 'heart',
  },
]

export async function getHealthNews() {
  if (isDemoMode) return { items: FALLBACK_NEWS, live: false }
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null')
    if (cached && Date.now() - cached.at < 30 * 60000) return cached.data
  } catch {
    /* ignore */
  }
  try {
    const { data, error } = await supabase.functions.invoke('health-news', { method: 'GET' })
    if (error || !data?.items?.length) throw error ?? new Error('No news')
    const result = { items: data.items, live: true }
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: result }))
    } catch {
      /* ignore */
    }
    return result
  } catch {
    return { items: FALLBACK_NEWS, live: false }
  }
}

export function timeAgo(iso) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))} min ago`
  if (diff < 86400) return `${Math.round(diff / 3600)} h ago`
  const d = Math.round(diff / 86400)
  if (d < 7) return `${d} day${d > 1 ? 's' : ''} ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
