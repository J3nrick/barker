// Offline support: pages are network-first, other app files stale-while-revalidate, OCR engine files and map tiles are cache-first.
const SHELL = 'shell-v2'
const CDN = 'cdn-v1'
const TILES = 'tiles-v1'
const MAX_TILES = 600 // shortcut: plain entry cap, not LRU; enough for Imus–Bacoor at street zoom

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(['./', './manifest.webmanifest', './favicon.svg'])))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  const keep = [SHELL, CDN, TILES]
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => !keep.includes(k)).map((k) => caches.delete(k)))))
  self.clients.claim()
})

async function cacheFirst(name, req, cap) {
  const hit = await caches.match(req)
  if (hit) return hit
  const res = await fetch(req)
  if (res.ok || res.type === 'opaque') {
    const c = await caches.open(name)
    await c.put(req, res.clone())
    if (cap) {
      const ks = await c.keys()
      for (const k of ks.slice(0, Math.max(0, ks.length - cap))) await c.delete(k)
    }
  }
  return res
}

// Pages go to the network first: a cached index.html points at asset hashes that a new deploy has deleted (blank page).
async function networkFirst(req) {
  const c = await caches.open(SHELL)
  try {
    const res = await fetch(req)
    if (res.ok) c.put('./', res.clone())
    return res
  } catch {
    return (await c.match('./')) || Response.error()
  }
}

async function staleWhileRevalidate(req) {
  const c = await caches.open(SHELL)
  const hit = await c.match(req, { ignoreSearch: req.mode === 'navigate' })
  const fresh = fetch(req)
    .then((res) => {
      if (res.ok) c.put(req.mode === 'navigate' ? './' : req, res.clone())
      return res
    })
    .catch(() => hit || caches.match('./'))
  return hit || fresh
}

// The page lists what it loaded before this worker took over (see main.jsx); save those same-origin files.
self.addEventListener('message', (e) => {
  const urls = Array.isArray(e.data?.save) ? e.data.save : []
  const ours = urls.filter((u) => typeof u === 'string' && new URL(u, self.location).origin === self.location.origin).slice(0, 300)
  e.waitUntil(
    caches.open(SHELL).then(
      (c) => Promise.all(ours.map(async (u) => (await c.match(u)) || c.add(u).catch(() => {}))), // one failed file shouldn't stop the rest
    ),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.hostname === 'tile.openstreetmap.org') e.respondWith(cacheFirst(TILES, req, MAX_TILES))
  else if (url.hostname === 'cdn.jsdelivr.net') e.respondWith(cacheFirst(CDN, req))
  else if (url.origin === self.location.origin) e.respondWith(req.mode === 'navigate' ? networkFirst(req) : staleWhileRevalidate(req))
})
