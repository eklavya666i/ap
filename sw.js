/* AP World History Practice: keeps a full copy of the app on the device so it works offline.
   The version changes with every build, which replaces the old copy the next time the app opens online. */
const CACHE = 'apworld-a2b5be4300a5';
const FILES = ["./", "index.html", "bank.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];

/* Safari will not use a redirected response for a page served from a service worker, so store a clean copy. */
function clean(res) {
  if (!res || !res.redirected) return Promise.resolve(res);
  return res.blob().then(function (body) {
    return new Response(body, {status: res.status, statusText: res.statusText, headers: res.headers});
  });
}

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (cache) {
    return Promise.all(FILES.map(function (f) {
      return fetch(new Request(f, {cache: 'reload'})).then(function (res) {
        if (!res.ok) throw new Error('Could not save ' + f + ' (' + res.status + ')');
        return clean(res).then(function (r) { return cache.put(f, r); });
      });
    }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('apworld-') === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(caches.open(CACHE).then(function (cache) {
      return cache.match('./').then(function (hit) {
        return hit || fetch(req).then(clean);
      });
    }).catch(function () { return caches.match('index.html'); }));
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
      }
      return res;
    });
  }));
});
