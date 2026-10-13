const C='dalla-simo-v126-20261013-rose';
const modules=["v113", "v114", "v118-recipes", "v119-recipes", "v116", "v117", "v117-search-scanner", "v117-product-resolver", "v117-qr-resolver", "v117-discard-ui", "v117-spesa-actions", "v118-ui", "v119-family-nutrition", "v120-diet-plans", "v121-original-diets", "v124-diet-shopping", "v125-default-diet", "v126-diet", "v122-simona-original", "v123-private-link", "v126-nutrition", "v126-ui"];
const A=['./','./index.html','./manifest.webmanifest','./manifest.webmanifest?v=127','./domain-core.js?v=127','./theme-rose.css?v=127',...modules.map(m=>'./domain-core-'+m+'.js?v=127'),'./diete-originali/manifest.json','./brand-rose.png?v=127','./icon-192-rose.png','./icon-192-rose.png?v=127','./icon-512-rose.png','./apple-touch-icon-rose.png?v=127'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(C).then(cache=>cache.addAll(A)));});
self.addEventListener('activate',event=>event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('dalla-simo-')&&key!==C).map(key=>caches.delete(key))))])));
self.addEventListener('fetch',event=>{
const request=event.request,url=new URL(request.url);
if(request.method!=='GET'||url.origin!==self.location.origin)return;
if(request.mode==='navigate'){event.respondWith(fetch(request).then(response=>{if(response.ok)event.waitUntil(caches.open(C).then(cache=>cache.put('./index.html',response.clone())));return response;}).catch(()=>caches.match('./index.html')));return;}
event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok)event.waitUntil(caches.open(C).then(cache=>cache.put(request,response.clone())));return response;})));
});
