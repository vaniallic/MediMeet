// RSS parsing shared by the Edge Function (Deno) and the Node test in scripts/.
// Kept dependency-free on purpose: a tiny regex parser is enough for WordPress / WHO feeds.

const entities = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#8217;|&rsquo;/g, '’')
    .replace(/&#8216;|&lsquo;/g, '‘')
    .replace(/&#8220;|&ldquo;/g, '“')
    .replace(/&#8221;|&rdquo;/g, '”')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#8212;|&mdash;/g, '—')
    .replace(/&#8230;|&hellip;/g, '…')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')

/** CDATA → entities → strip tags → entities again (feeds often double-escape HTML). */
const decode = (s = '') =>
  entities(entities(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')).replace(/<[^>]+>/g, ' '))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'))
  return m ? decode(m[1]) : ''
}

const firstImage = (xml) => {
  const m =
    xml.match(/<media:content[^>]+url="([^"]+)"/i) ||
    xml.match(/<enclosure[^>]+url="([^"]+\.(?:jpe?g|png|webp)[^"]*)"/i) ||
    xml.match(/<img[^>]+src="([^"]+)"/i) ||
    xml.match(/&lt;img[^&]+src=&quot;([^&]+)&quot;/i)
  return m ? m[1] : null
}

/** Picks a topic so the UI can show a matching illustration. */
export function topicOf(text) {
  const t = text.toLowerCase()
  if (/vaccin|imuni|vaksin|immuni/.test(t)) return 'vaccine'
  if (/heart|jantung|cardio|stroke|hypertens|hipertensi/.test(t)) return 'heart'
  if (/mental|depress|stress|suicid|jiwa/.test(t)) return 'mind'
  if (/dengue|dbd|malaria|tuberc|tbc|virus|flu|influenza|outbreak|covid|measles|campak|polio|infect/.test(t)) return 'outbreak'
  if (/nutri|gizi|stunting|diet|food|makan/.test(t)) return 'nutrition'
  if (/hospital|rumah sakit|puskesmas|clinic|bpjs|jkn|health system|layanan/.test(t)) return 'hospital'
  if (/medicine|obat|drug|antibiot|pharma/.test(t)) return 'medicine'
  return 'general'
}

export function parseFeed(xml, source, limit = 8) {
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? []
  return items.slice(0, limit).map((it) => {
    const title = tag(it, 'title')
    const summary = (tag(it, 'description') || tag(it, 'content:encoded')).slice(0, 220)
    const date = tag(it, 'pubDate') || tag(it, 'dc:date')
    return {
      id: `${source}:${tag(it, 'guid') || tag(it, 'link') || title}`,
      title,
      summary,
      link: tag(it, 'link'),
      source,
      published: date ? new Date(date).toISOString() : null,
      image: firstImage(it),
      topic: topicOf(`${title} ${summary}`),
    }
  }).filter((n) => n.title && n.link)
}
