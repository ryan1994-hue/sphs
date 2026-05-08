const CACHE_NAME = 'olympos-v1';
const STATIC_ASSETS = [
  './login.html',
  './올림포스_1to20강.html',
  './admin.html',
  './manifest.json'
];

// 설치 시 핵심 파일 캐싱
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 오래된 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 네트워크 우선, 실패 시 캐시 사용 (Firebase 실시간 데이터 보장)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Firebase, Google API는 캐시 안 함 (항상 네트워크)
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('google') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('googleapis')
  ) {
    return;
  }

  // HTML 파일: 네트워크 우선 → 실패 시 캐시
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 나머지: 캐시 우선 → 없으면 네트워크
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
