/* Cache offline.
   Util cuando la conexion falla: en China la red movil va a ratos.
   Sube el numero de version cada vez que cambies datos o codigo. */
var VERSION = 'china2026-v2';

var FILES = [
  './', './index.html', './styles.css', './app.js', './art.js', './sha256.js',
  './manifest.webmanifest', './assets/icon.svg',
  './data/trip.js', './data/itinerary.js', './data/hotels.js',
  './data/transport.js', './data/destinations.js', './data/checklist.js'
].map(function (p) { return new URL(p, self.location).toString(); });

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION)
      .then(function (c) { return c.addAll(FILES); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          return k === VERSION ? null : caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req).then(function (hit) {
      var live = fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || live;
    })
  );
});
