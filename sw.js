/* 우리집 인테리어 — 서비스워커
 *
 * 전략 2가지로 분리한다.
 *  - 콘텐츠(HTML·js·css·manifest): 네트워크 우선(no-cache 재검증) + 3.5초 타임아웃 시 캐시 폴백.
 *    → 온라인이면 항상 최신. 오프라인/느린 망에서만 캐시가 나온다.
 *  - 정적 자산(이미지·아이콘·PDF·폰트): 캐시 우선 + 백그라운드 갱신. 용량 크고 잘 안 바뀜.
 *
 * 과거 버그(옛 데이터 고정)의 원인:
 *  1) install 의 addAll 이 HTTP 캐시(max-age=600)를 그대로 써서 방금 갱신한 캐시를 묵은 파일로 덮었다.
 *  2) addAll 은 원자적이라 CORE 중 1개만 404 여도 프리캐시 전체가 실패했다.
 *  3) 캐시 우선이라 새로고침 전까지 항상 한 박자 늦었고, 알림이 cache.put 보다 먼저 나가 루프가 났다.
 * → 프리캐시는 파일별 cache:"reload", 콘텐츠는 네트워크 우선으로 바꿔 셋 다 제거.
 *
 * ⚠️ CACHE 이름은 캐시 구조/전략을 바꿀 때마다 올린다(옛 캐시는 activate 에서 전부 삭제).
 */
const CACHE = "home-interior-v3";
const NET_TIMEOUT = 3500;

const CORE = [
  "./", "index.html", "styles.css", "app.js", "data.js", "manifest.webmanifest",
  "schedule.html", "plans.html", "work.html", "floorplan.html", "lighting.html",
  "quotes.html", "total-quote.html", "references.html", "contacts.html", "materials.html",
  "furniture.html", "furniture3d.js", "ceramic.html", "memo.html", "memo.js",
  "uploader.js", "print.html", "vanity-frame.html",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-180.png", "icons/favicon-64.png",
];

// 네트워크 우선으로 받을 것 — 내용이 자주 바뀌는 파일
const isContent = (req, url) =>
  req.mode === "navigate" || /\.(html|js|css|webmanifest|json)$/i.test(url.pathname);

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // 파일별로 개별 처리 — 1개가 404 여도 나머지는 캐시된다.
    // cache:"reload" 로 HTTP 캐시를 우회해야 '방금 배포된' 파일이 들어온다.
    await Promise.all(CORE.map(async (url) => {
      try {
        const res = await fetch(new Request(url, { cache: "reload" }));
        if (res && res.ok) await cache.put(url, res);
      } catch (err) { /* 개별 실패는 무시 */ }
    }));
  })());
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
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // 캐시 키는 항상 해시 없는 URL 문자열로 통일(navigate 요청 키 불일치 방지)
    const key = url.origin + url.pathname + url.search;
    return isContent(req, url)
      ? networkFirst(e, cache, req, key)
      : cacheFirst(e, cache, key);
  })());
});

/* 네트워크 우선 — 최신을 먼저 시도하고, 느리거나 끊기면 캐시로 폴백 */
async function networkFirst(e, cache, req, key) {
  const net = (async () => {
    try {
      // no-cache = 항상 서버에 확인(If-None-Match). 304면 본문 재전송 없이 최신 보장 → 데이터 절약.
      const res = await fetch(key, { cache: "no-cache" });
      if (!res || !res.ok) return null;
      try { await cache.put(key, res.clone()); } catch (err) {}
      return res;
    } catch (err) { return null; }
  })();

  const won = await Promise.race([net, wait(NET_TIMEOUT)]);
  if (won) return won;                      // 최신 응답 확보

  const cached = await cache.match(key);
  if (cached) {
    // 캐시를 먼저 내보냈으니, 뒤늦게 도착한 네트워크 응답이 다르면 그때 알린다.
    e.waitUntil(notifyIfChanged(net, cached));
    return cached;
  }
  const late = await net;                   // 캐시도 없으면 네트워크를 끝까지 기다린다
  if (late) return late;
  if (req.mode === "navigate") return (await cache.match(indexKey(key))) || offline();
  return offline();
}

/* 캐시 우선 — 이미지 등. 백그라운드로 조용히 갱신 */
async function cacheFirst(e, cache, key) {
  const cached = await cache.match(key);
  const net = fetch(key).then(async (res) => {
    if (res && res.ok) { try { await cache.put(key, res.clone()); } catch (err) {} }
    return res;
  }).catch(() => null);
  if (cached) { e.waitUntil(net); return cached; }
  return (await net) || offline();
}

/* ETag·Last-Modified 로 변경 판정(없으면 본문 비교) → 클라이언트에 새로고침 유도 */
async function notifyIfChanged(net, cached) {
  const fresh = await net;
  if (!fresh) return;
  let changed;
  const ea = cached.headers.get("etag"), eb = fresh.headers.get("etag");
  const la = cached.headers.get("last-modified"), lb = fresh.headers.get("last-modified");
  if (ea && eb) changed = ea !== eb;
  else if (la && lb) changed = la !== lb;
  else {
    try {
      const [a, b] = await Promise.all([cached.clone().text(), fresh.clone().text()]);
      changed = a !== b;
    } catch (err) { return; }
  }
  if (!changed) return;
  const clients = await self.clients.matchAll();
  clients.forEach((c) => c.postMessage({ type: "sw-updated" }));
}

const wait = (ms) => new Promise((r) => setTimeout(() => r(null), ms));
const indexKey = (key) => key.replace(/[^/]*$/, "") + "index.html";
const offline = () => new Response("오프라인 상태예요. 네트워크에 연결하면 다시 열립니다.", {
  status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" },
});
