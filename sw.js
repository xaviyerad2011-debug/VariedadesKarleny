const CACHE = "karleny-polvorav1";
const SHELL = ["./","./index.html","./style.css","./script.js","./manifest.json","./icons/icon-192.png","./icons/icon-512.png"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const clone=res.clone(); caches.open(CACHE).then(c=>c.put(req,clone)); return res; }).catch(() => caches.match("./index.html"))));
});
self.addEventListener("notificationclick", event => { event.notification.close(); event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list => { const w=list.find(c=>"focus" in c); return w ? w.focus() : clients.openWindow?.("./"); })); });
