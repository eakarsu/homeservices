const CACHE='homeservices-field-shell-v1';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.add('/field/offline.html')).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method==='GET'&&url.origin===self.location.origin&&url.pathname==='/field/offline.html')event.respondWith(fetch(event.request).catch(()=>caches.match('/field/offline.html')))});
