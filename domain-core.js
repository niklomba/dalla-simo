// Loader Dalla Simo v1.19
(function(){
  function carica(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('Impossibile caricare '+src));document.head.appendChild(s)})}
  carica('./domain-core-v113.js?v=119')
    .then(()=>carica('./domain-core-v114.js?v=119'))
    .then(()=>carica('./domain-core-v118-recipes.js?v=119'))
    .then(()=>carica('./domain-core-v119-recipes.js?v=119'))
    .then(()=>carica('./domain-core-v116.js?v=119'))
    .then(()=>carica('./domain-core-v117.js?v=119'))
    .then(()=>carica('./domain-core-v117-search-scanner.js?v=119'))
    .then(()=>carica('./domain-core-v117-product-resolver.js?v=119'))
    .then(()=>carica('./domain-core-v117-qr-resolver.js?v=119'))
    .then(()=>carica('./domain-core-v117-discard-ui.js?v=119'))
    .then(()=>carica('./domain-core-v117-spesa-actions.js?v=119'))
    .then(()=>carica('./domain-core-v118-ui.js?v=119'))
    .then(()=>carica('./domain-core-v119-family-nutrition.js?v=119'))
    .then(()=>{document.title='App Alimentazione — Dalla Simo v1.19';const sub=document.querySelector('.brand-subtitle');if(sub)sub.textContent='Alimentazione familiare · v1.19';const rsub=document.querySelector('#ricette .sub');if(rsub&&window.__DALLA_SIMO_RECIPES_V119__)rsub.textContent='Archivio locale · '+window.__DALLA_SIMO_RECIPES_V119__.total+' ricette/versioni uniche · '+window.__DALLA_SIMO_RECIPES_V119__.uniqueNames+' piatti distinti';window.__DALLA_SIMO_BUILD__='v1.19';console.log('Dalla Simo v1.19 attiva')})
    .catch(e=>console.error('Dalla Simo v1.19:',e));
})();
