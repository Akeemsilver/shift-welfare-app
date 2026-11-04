/* Shift Welfare service worker: keeps the app opening with no signal.
   Only the app files and the Firebase script files are cached. Data is handled by Firestore's own offline storage. */
const CACHE = 'shift-welfare-v238';
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
  const stay = d.kind === 'corr' || d.kind === 'handover' || d.imp === '1' || d.imp === true;   /* the important ones stay until tapped; the rest show once */
  e.waitUntil(Promise.resolve(self.registration.showNotification(d.title, { body: d.body || '', tag: d.tag || 'sw-push', renotify: false, requireInteraction: stay, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { cid: d.kind === 'corr' ? (d.cid || '') : '', sid: d.sid || '', kind: d.kind || '' } })).then(bumpBadge));   /* always shown: the open app closes the ones it already shows itself */
});
/* the number on the app icon goes up by one for every push; the open app sets it back to the exact count of unread alerts */
function bumpBadge() {
  return (typeof caches !== 'undefined' && caches.open ? caches.open('sw-badge').then(c => c.match('n').then(r => r ? r.text() : '0').then(t => { const n = (parseInt(t, 10) || 0) + 1; return c.put('n', new Response(String(n))).then(() => n); })) : Promise.resolve(1))
    .then(n => { try { if (self.navigator && self.navigator.setAppBadge) return self.navigator.setAppBadge(n); } catch (x) {} }).catch(() => {});
}
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const cid = e.notification.data && e.notification.data.cid, sid = e.notification.data && e.notification.data.sid;
  if (e.notification.data && e.notification.data.kind === 'handover') { e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cl => { if (cl.length) { cl[0].focus(); return; } return self.clients.openWindow('./'); })); return; }   /* a handover waiting for you: the app opens on the Count tab, where the card with the button is (it does not jump into the handover) */   /* sid: an accepted handover opens its short pop-up */
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cl => {
    if (cl.length) { cl[0].focus(); cl[0].postMessage(cid ? { type: 'corr', id: cid } : sid ? { type: 'ho', sid } : { type: 'bell' }); return; }
    return self.clients.openWindow('./' + (cid ? '?corr=' + encodeURIComponent(cid) : sid ? '?ho=' + encodeURIComponent(sid) : '?bell=1'));
  }));
});
