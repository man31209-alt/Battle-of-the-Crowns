// Offline support: keeps a copy of the game on the phone after the first visit.
const CACHE='boc-v36';
const FILES=['./','index.html','game.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    // Network first so updates arrive when online; fall back to the saved copy offline.
    e.respondWith(fetch(req).then(r=>{const c=r.clone();caches.open(CACHE).then(ca=>ca.put(req,c));return r}).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
  }else if(url.hostname.includes('fonts.g')){
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{const c=res.clone();caches.open(CACHE).then(ca=>ca.put(req,c));return res})));
  }
});
