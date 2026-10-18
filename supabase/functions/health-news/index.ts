// Supabase Edge Function: GET /functions/v1/health-news
// Fetches the latest health news from public RSS feeds (Kemenkes "Sehat Negeriku" and WHO),
// merges them newest-first and returns JSON. Running it on the server avoids the browser's
// CORS limits and lets us cache the result for an hour.
import { parseFeed } from './parse.js'

const FEEDS = [
  { url: 'https://sehatnegeriku.kemkes.go.id/feed/', source: 'Kemenkes RI' },
  { url: 'https://www.who.int/rss-feeds/news-english.xml', source: 'WHO' },
]

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

let cache: { at: number; body: string } | null = null
const TTL = 60 * 60 * 1000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  if (cache && Date.now() - cache.at < TTL) {
    return new Response(cache.body, { headers: { ...cors, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } })
  }

  const results = await Promise.allSettled(
    FEEDS.map(async ({ url, source }) => {
      const res = await fetch(url, { headers: { 'User-Agent': 'MediMeet/1.0 (+portfolio project)' } })
      if (!res.ok) throw new Error(`${source} ${res.status}`)
      return parseFeed(await res.text(), source, 8)
    }),
  )

  const items = results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .sort((a, b) => (b.published ?? '').localeCompare(a.published ?? ''))
    .slice(0, 12)

  const errors = results.filter((r) => r.status === 'rejected').map((r) => String((r as PromiseRejectedResult).reason))
  const body = JSON.stringify({ items, errors, updatedAt: new Date().toISOString() })
  if (items.length) cache = { at: Date.now(), body }

  return new Response(body, {
    status: items.length ? 200 : 502,
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900' },
  })
})
