/* Relish Torte — service worker
   Offline shell for static assets only.

   Rules that keep the sold site's admin edits working:
   - /api/* is NEVER touched by this worker. The browser talks straight to
     the network so content, images and orders always reflect the server.
   - HTML/JS/CSS are network-first with a cache fallback, so a deploy reaches
     every visitor on their next page load instead of being frozen forever.
   - Only images/fonts are cache-first (they are immutable and rarely change).
   Bump CACHE to force every installed worker to drop its old copy. */
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

  // API calls (state, images, admin) bypass the worker entirely so the
  // server is always the single source of truth. Netlify's own headers
  // (short max-age on /api/state, no-store on /api/admin/*) then apply.
  if (url.pathname.indexOf('/api/') === 0) return;

  // Pages and code: network first, cache fallback so the site still opens
  // offline and a deploy is picked up on the very next load.
  var isCode = /\.(js|css|html|webmanifest)$/.test(url.pathname) || url.pathname === '/' || /\/$/.test(url.pathname);
  if (req.mode === 'navigate' || isCode) {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (r) {
          return r || caches.match('index.html');
        });
      })
    );
    return;
  }

  // Images and fonts: cache first, then network (immutable, rarely change).
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
