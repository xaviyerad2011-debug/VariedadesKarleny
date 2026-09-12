const CACHE_NAME = "karleny-shell-v2";
const APP_SHELL = ["./","./index.html","./style.css","./script.js","./manifest.json","./icons/icon-192.png","./icons/icon-512.png"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => { if(event.request.method !== "GET") return; const url=new URL(event.request.url); if(url.origin!==self.location.origin)return; event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(r=>{const c=r.clone();caches.open(CACHE_NAME).then(x=>x.put(event.request,c));return r}).catch(()=>caches.match("./index.html")))); });
self.addEventListener("notificationclick", event => { event.notification.close(); event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{const w=list.find(c=>"focus" in c);return w?w.focus():clients.openWindow?.("./")})); });
