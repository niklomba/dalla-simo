const C='dalla-simo-v118-20260911-recipes-menu-ux';
const A=[
  './','./index.html','./manifest.webmanifest','./domain-core.js?v=118',
  './domain-core-v113.js?v=118','./domain-core-v114.js?v=118','./domain-core-v118-recipes.js?v=118',
  './domain-core-v116.js?v=118','./domain-core-v117.js?v=118',
  './domain-core-v117-search-scanner.js?v=118','./domain-core-v117-product-resolver.js?v=118',
  './domain-core-v117-qr-resolver.js?v=118','./domain-core-v117-discard-ui.js?v=118',
  './domain-core-v117-spesa-actions.js?v=118','./domain-core-v118-ui.js?v=118',
  './brand-v111-512.png','./icon-192-v112.png','./icon-512-v112.png','./apple-touch-icon-v112.png'
];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(A)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))])));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const n=e.request.mode==='navigate';
  if(n){
    e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put('./index.html',c));return r}).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(x=>{const y=x.clone();caches.open(C).then(c=>c.put(e.request,y));return x})))
});
