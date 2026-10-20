// Service worker kecil: biar MediMeet bisa dipasang dan kerangkanya tetap kebuka tanpa sinyal.
// Data (Supabase, peta, berita) sengaja tidak di-cache, supaya selalu yang terbaru.
const CACHE = 'medimeet-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/icons/icon-192.png'])).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return

  // Halaman: coba jaringan dulu, kalau offline pakai salinan terakhir.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/')))
    return
  }

  // File statis (js, css, gambar): pakai salinan lama, sambil diperbarui di belakang.
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()))
          return res
        })
        .catch(() => hit)
      return hit || net
    }),
  )
})
