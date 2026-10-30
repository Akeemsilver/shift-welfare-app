/* Shift Welfare service worker: keeps the app opening with no signal.
   Only the app files and the Firebase script files are cached. Data is handled by Firestore's own offline storage. */
const CACHE = 'shift-welfare-v153';
const SHELL = ['./', './index.html', './firebase-config.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/logo.png', './icons/apple-touch-icon.png', './icons/favicon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  const mine = u.origin === location.origin, sdk = u.hostname === 'www.gstatic.com' && u.pathname.indexOf('/firebasejs/') === 0;
  if (e.request.method !== 'GET' || !(mine || sdk) || (mine && u.search.indexOf('oobCode') >= 0)) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; }).catch(() => caches.match(e.request).then(h => h || caches.match('./index.html'))));
});
/* a waiting handover mistake shows in the phone's notification bar (made by the app while it runs); tapping it opens the app on that correction */
self.addEventListener('push', e => {   /* a real push from the push Worker (through Firebase), even when the app is closed */
  let d = {}; try { const j = e.data && e.data.json(); d = (j && j.data) || j || {}; } catch (x) {}
  if (!d.title) return;
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body || '', tag: d.tag || 'sw-push', renotify: false, requireInteraction: d.kind === 'corr' || d.kind === 'handover', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { cid: d.kind === 'corr' ? (d.cid || '') : '', kind: d.kind || '' } }));   /* always shown: the open app closes the ones it already shows itself */
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const cid = e.notification.data && e.notification.data.cid;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cl => {
    if (cl.length) { cl[0].focus(); cl[0].postMessage(cid ? { type: 'corr', id: cid } : { type: 'bell' }); return; }
    return self.clients.openWindow('./' + (cid ? '?corr=' + encodeURIComponent(cid) : '?bell=1'));
  }));
});
