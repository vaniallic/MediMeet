// Quick check for the Edge Function's RSS parser: node scripts/test-news-parser.mjs
import assert from 'node:assert/strict'
import { parseFeed, topicOf } from '../supabase/functions/health-news/parse.js'

const who = `<?xml version="1.0"?><rss version="2.0"><channel><title>News (English) - World Health Organization</title>
<item><guid isPermaLink="false">a1</guid><link>https://www.who.int/news/item/24-01-2026-x</link>
<title>WHO statement on notification of withdrawal of the United States</title>
<description>&lt;p&gt;Statement &amp;amp; details&lt;/p&gt;</description><pubDate>Sat, 24 Jan 2026 20:09:49 Z</pubDate></item>
<item><guid isPermaLink="false">a2</guid><link>https://www.who.int/news/item/23-07-2025-y</link>
<title>Timor-Leste certified malaria-free by WHO</title><description>Malaria elimination</description>
<pubDate>Wed, 23 Jul 2025 10:07:41 Z</pubDate></item></channel></rss>`

const wp = `<rss><channel><item><title><![CDATA[Kemenkes Perluas Imunisasi Polio di 5 Provinsi]]></title>
<link>https://sehatnegeriku.kemkes.go.id/baca/umum/20260101/1/contoh/</link>
<pubDate>Thu, 01 Jan 2026 08:00:00 +0000</pubDate><dc:creator>Admin</dc:creator>
<description><![CDATA[<p>Jakarta, 1 Januari &#8211; Kementerian Kesehatan&#8230;</p>]]></description>
<content:encoded><![CDATA[<img src="https://example.org/a.jpg" />]]></content:encoded></item></channel></rss>`

const a = parseFeed(who, 'WHO')
assert.equal(a.length, 2)
assert.equal(a[0].title, 'WHO statement on notification of withdrawal of the United States')
assert.equal(a[0].published, '2026-01-24T20:09:49.000Z')
assert.equal(a[1].topic, 'outbreak')
assert.match(a[0].summary, /Statement & details/)

const b = parseFeed(wp, 'Kemenkes RI')
assert.equal(b[0].title, 'Kemenkes Perluas Imunisasi Polio di 5 Provinsi')
assert.equal(b[0].topic, 'vaccine')
assert.equal(b[0].image, 'https://example.org/a.jpg')
assert.match(b[0].summary, /Jakarta, 1 Januari – Kementerian/)
assert.equal(topicOf('Hari Jantung Sedunia'), 'heart')

console.log('news parser: all checks passed')
