// Loader Dalla Simo v1.18
(function(){
  function carica(src){
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=src;
      s.async=false;
      s.onload=resolve;
      s.onerror=()=>reject(new Error('Impossibile caricare '+src));
      document.head.appendChild(s);
    });
  }
  carica('./domain-core-v113.js?v=118')
    .then(()=>carica('./domain-core-v114.js?v=118'))
    // Il catalogo v1.18 entra PRIMA di v1.16, così scarti/master includono anche le nuove ricette.
    .then(()=>carica('./domain-core-v118-recipes.js?v=118'))
    .then(()=>carica('./domain-core-v116.js?v=118'))
    .then(()=>carica('./domain-core-v117.js?v=118'))
    .then(()=>carica('./domain-core-v117-search-scanner.js?v=118'))
    .then(()=>carica('./domain-core-v117-product-resolver.js?v=118'))
    .then(()=>carica('./domain-core-v117-qr-resolver.js?v=118'))
    .then(()=>carica('./domain-core-v117-discard-ui.js?v=118'))
    .then(()=>carica('./domain-core-v117-spesa-actions.js?v=118'))
    .then(()=>carica('./domain-core-v118-ui.js?v=118'))
    .then(()=>{
      document.title='App Alimentazione — Dalla Simo v1.18';
      const sub=document.querySelector('.brand-subtitle');
      if(sub)sub.textContent='Alimentazione familiare · v1.18';
      window.__DALLA_SIMO_BUILD__='v1.18';
      console.log('Dalla Simo v1.18 attiva');
    })
    .catch(e=>console.error('Dalla Simo v1.18:',e));
})();
