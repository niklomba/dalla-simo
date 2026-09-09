// Loader Dalla Simo v1.17 — patch classiche nello stesso ambiente globale della pagina
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
  carica('./domain-core-v113.js?v=117')
    .then(()=>carica('./domain-core-v114.js?v=117'))
    .then(()=>carica('./domain-core-v116.js?v=117'))
    .then(()=>carica('./domain-core-v117.js?v=117'))
    .then(()=>carica('./domain-core-v117-discard-ui.js?v=117'))
    .then(()=>{
      document.title='App Alimentazione — Dalla Simo v1.17';
      const sub=document.querySelector('.brand-subtitle');
      if(sub)sub.textContent='Alimentazione familiare · v1.17';
      window.__DALLA_SIMO_BUILD__='v1.17';
      console.log('Dalla Simo v1.17 attiva');
    })
    .catch(e=>console.error('Dalla Simo v1.17:',e));
})();
