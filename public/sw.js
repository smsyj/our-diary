// Our Diary - 간단한 오프라인 캐시용 서비스 워커
const CACHE = 'our-diary-v1'

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (e) => {
  // 동일 출처만 처리, GET만
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.origin !== location.origin) return

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      try {
        const fresh = await fetch(e.request)
        cache.put(e.request, fresh.clone())
        return fresh
      } catch {
        const cached = await cache.match(e.request)
        return cached || new Response('offline', { status: 503 })
      }
    })
  )
})
