import { Link, useParams } from 'react-router-dom'
import { tips } from '../data/catalog'
import { illo } from '../components/icons'
import { InfoNote, TopBar } from '../components/ui'

export default function Tip() {
  const { slug } = useParams()
  const tip = tips.find((t) => t.slug === slug) ?? tips[0]
  const others = tips.filter((t) => t.slug !== tip.slug)
  return (
    <div className="pb-10">
      <div style={{ background: tip.tint }} className="relative h-60 overflow-hidden">
        <img src={illo(tip.art)} alt="" className="absolute right-1/2 bottom-8 h-32 w-32 translate-x-1/2 object-contain" />
        <div className="relative [&_button]:bg-white/85">
          <TopBar />
        </div>
      </div>
      <article className="-mt-5 rounded-t-[30px] bg-white px-6 pt-6">
        <p className="text-xs font-bold tracking-wider text-mint uppercase">{tip.category}</p>
        <h1 className="mt-1 font-display text-xl leading-tight font-bold text-brand">{tip.title}</h1>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-ink">
          {tip.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <InfoNote className="mt-6">General wellness information, not medical advice. Talk to a doctor about your own health.</InfoNote>
        <Link to="/specialists" className="btn-primary mt-6">Book a doctor</Link>

        <h2 className="section-title mt-8 mb-3 text-lg">More to read</h2>
        <div className="space-y-2">
          {others.map((t) => (
            <Link key={t.slug} to={`/tips/${t.slug}`} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-mist-light">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl" style={{ background: t.tint }}>
                <img src={illo(t.art)} alt="" className="h-9 w-9 object-contain" />
              </span>
              <span>
                <span className="block text-[11px] font-bold text-mint uppercase">{t.category}</span>
                <span className="block text-sm font-semibold">{t.title}</span>
              </span>
            </Link>
          ))}
        </div>
      </article>
    </div>
  )
}
