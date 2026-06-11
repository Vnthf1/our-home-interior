/* 우리집 인테리어 — 서비스워커 (네트워크 우선 + 오프라인 폴백)
 * 콘텐츠(data.js 등)가 자주 바뀌므로 온라인이면 항상 최신을 받고,
 * 오프라인일 때만 캐시로 폴백한다. */
const CACHE = "home-interior-v1";
const CORE = [
  "./", "index.html", "styles.css", "app.js", "data.js",
  "schedule.html", "plans.html", "work.html", "floorplan.html",
  "quotes.html", "references.html", "contacts.html", "materials.html",
  "furniture.html", "furniture3d.js",
  "icons/icon-192.png", "icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      const cache = await caches.open(CACHE);
      cache.put(req, fresh.clone());
      return fresh;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === "navigate") return (await caches.match("index.html")) || Response.error();
      throw err;
    }
  })());
});
