import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LuArrowUpRight } from 'react-icons/lu'
import { TOPIC_ART, timeAgo } from '../lib/news'

/** One readable news card: illustration or photo on the left, headline and source on the right. */
export function NewsCard({ item, className = '' }) {
  const art = TOPIC_ART[item.topic] ?? TOPIC_ART.general
  const external = !item.to
  const body = (
    <>
      <div className="relative w-[38%] shrink-0 overflow-hidden" style={{ background: art.tint }}>
        {item.image ? (
          <img src={item.image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <img src={art.img} alt="" className="absolute inset-0 m-auto h-[72%] w-[72%] object-contain" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3.5">
        <span className="self-start rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand uppercase">
          {art.label}
        </span>
        <p className="mt-1.5 line-clamp-3 text-[14px] leading-snug font-semibold text-ink">{item.title}</p>
        <p className="mt-auto flex items-center gap-1 pt-1.5 text-[11px] text-muted">
          <span className="truncate">{item.source}</span>
          {item.published && <span className="shrink-0">· {timeAgo(item.published)}</span>}
          {external && <LuArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 text-brand" aria-label="opens in a new tab" />}
        </p>
      </div>
    </>
  )
  const cls = `flex h-[132px] overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-mist transition hover:-translate-y-0.5 ${className}`
  return external ? (
    <a href={item.link} target="_blank" rel="noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <Link to={item.to} className={cls}>
      {body}
    </Link>
  )
}

/** Auto-advancing slideshow; pauses while the user touches or hovers it. */
export default function NewsSlideshow({ items, interval = 5000 }) {
  const ref = useRef(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || items.length < 2) return
    const t = setInterval(() => {
      const el = ref.current
      if (!el) return
      const next = (index + 1) % items.length
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
    }, interval)
    return () => clearInterval(t)
  }, [index, paused, items.length, interval])

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)}>
      <div
        ref={ref}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto py-1"
        aria-roledescription="carousel"
      >
        {items.map((item, i) => (
          <div key={item.id} className="w-full shrink-0 snap-center px-5" aria-roledescription="slide" aria-label={`${i + 1} of ${items.length}`}>
            <NewsCard item={item} />
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5">
        {items.map((item, i) => (
          <button
            key={item.id}
            aria-label={`Show news ${i + 1}`}
            onClick={() => ref.current?.scrollTo({ left: i * ref.current.clientWidth, behavior: 'smooth' })}
            className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-brand' : 'w-1.5 bg-mint'}`}
          />
        ))}
      </div>
    </div>
  )
}
