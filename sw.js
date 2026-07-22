/* 우리집 인테리어 — 서비스워커 (캐시 우선 + 백그라운드 갱신 = stale-while-revalidate)
 * 앱을 켤 때 네트워크를 기다리지 않고 캐시에서 즉시 표시 → 흰 화면 제거.
 * 최신 반영은 app.js의 업데이트 감지(app.js ETag 비교)가 담당. */
const CACHE = "home-interior-v2";
const CORE = [
  "./", "index.html", "styles.css", "app.js", "data.js",
  "schedule.html", "plans.html", "work.html", "floorplan.html", "lighting.html",
  "quotes.html", "total-quote.html", "references.html", "contacts.html", "materials.html",
  "furniture.html", "furniture3d.js", "print.html",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-180.png", "icons/favicon-64.png",
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
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const network = fetch(req).then(async (fresh) => {
      if (fresh && fresh.ok) {
        // app.js/data.js/HTML 내용이 바뀌었으면 클라이언트에 알림 → 새로고침 유도
        const isCore = /\/(app|data)\.js(\?|$)/.test(req.url) || req.mode === "navigate";
        if (isCore && cached) {
          try {
            const [a, b] = await Promise.all([cached.clone().text(), fresh.clone().text()]);
            if (a !== b) (await self.clients.matchAll()).forEach((c) => c.postMessage({ type: "sw-updated" }));
          } catch (e) {}
        }
        await cache.put(req, fresh.clone());
      }
      return fresh;
    }).catch(() => null);
    if (cached) { e.waitUntil(network); return cached; }   // 캐시 있으면 즉시 반환 + 뒤에서 갱신
    const fresh = await network;
    if (fresh) return fresh;
    if (req.mode === "navigate") return (await cache.match("index.html")) || Response.error();
    return Response.error();
  })());
});
