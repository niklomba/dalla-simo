const C='dalla-simo-v126-20261011-diet-first';
const modules=["v113", "v114", "v118-recipes", "v119-recipes", "v116", "v117", "v117-search-scanner", "v117-product-resolver", "v117-qr-resolver", "v117-discard-ui", "v117-spesa-actions", "v118-ui", "v119-family-nutrition", "v120-diet-plans", "v121-original-diets", "v124-diet-shopping", "v125-default-diet", "v126-diet", "v122-simona-original", "v123-private-link", "v126-nutrition", "v126-ui"];
const A=['./','./index.html','./manifest.webmanifest','./manifest.webmanifest?v=126','./domain-core.js?v=126',...modules.map(m=>'./domain-core-'+m+'.js?v=126'),'./diete-originali/manifest.json','./brand-v111-512.png','./brand-v111-512.png?v=111','./icon-192-v112.png','./icon-192-v112.png?v=112','./icon-512-v112.png','./apple-touch-icon-v112.png','./apple-touch-icon-v112.png?v=112'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(C).then(cache=>cache.addAll(A)));});
self.addEventListener('activate',event=>event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('dalla-simo-')&&key!==C).map(key=>caches.delete(key))))])));
self.addEventListener('fetch',event=>{
const request=event.request,url=new URL(request.url);
if(request.method!=='GET'||url.origin!==self.location.origin)return;
if(request.mode==='navigate'){event.respondWith(fetch(request).then(response=>{if(response.ok)event.waitUntil(caches.open(C).then(cache=>cache.put('./index.html',response.clone())));return response;}).catch(()=>caches.match('./index.html')));return;}
event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok)event.waitUntil(caches.open(C).then(cache=>cache.put(request,response.clone())));return response;})));
});
