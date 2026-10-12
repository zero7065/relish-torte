/* Relish Torte — service worker
   Offline shell + asset caching. Bump VERSION to force a refresh. */
var CACHE = 'relish-torte-v2';

var SHELL = [
  './',
  'index.html',
  'menu.html',
  'cake.html',
  'about.html',
  'reviews.html',
  'order.html',
  'contact.html',
  'access-control.html',
  'css/styles.css',
  'js/data.js',
  'js/config.js',
  'js/site.js',
  'js/ai.js',
  'js/admin.js',
  'images/logo-mark.svg',
  'images/favicon.svg',
  'images/icon.svg',
  'images/icon-maskable.svg',
  'manifest.webmanifest'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  // Leave cross-origin requests (fonts, CDN) alone — they have their own caches.
  if (url.origin !== self.location.origin) return;

  // Pages: network first, cache fallback so the site works offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (r) {
          return r || caches.match('index.html');
        });
      })
    );
    return;
  }

  // Everything else: cache first, then network (and store a copy).
  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
