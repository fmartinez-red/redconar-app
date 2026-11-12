// Service worker: deja la app instalable y abrible sin conexión (solo la app, nunca los datos).
// Estrategia: primero la red, y si no hay conexión, la copia guardada. Así los cambios llegan solos.
// Subir VERSION en cada cambio publicado (y VERSION_APP en app.js).
const VERSION = 'redconar-v14';
const ARCHIVOS = [
  './', 'index.html', 'styles.css', 'config.js', 'manifest.webmanifest', 'plantillas.js', 'app.js',
  'js/util.js', 'js/api.js', 'js/ficha.js', 'js/buscar.js', 'js/chat.js', 'js/ajustes.js', 'js/tareas.js', 'js/popup.js', 'js/trabajo.js', 'js/mejoras.js', 'js/mejoras2.js',
  'icons/icon-192.png', 'icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys()
    .then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); })); })
    .then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(function (r) {
      const copia = r.clone();
      caches.open(VERSION).then(function (c) { c.put(e.request, copia); });
      return r;
    }).catch(function () { return caches.match(e.request); })
  );
});
