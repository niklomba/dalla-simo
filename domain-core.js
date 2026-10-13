// Loader Dalla Simo v1.26 — ordine compatibile con i dati precedenti.
(function(){
const files=["v113", "v114", "v118-recipes", "v119-recipes", "v116", "v117", "v117-search-scanner", "v117-product-resolver", "v117-qr-resolver", "v117-discard-ui", "v117-spesa-actions", "v118-ui", "v119-family-nutrition", "v120-diet-plans", "v121-original-diets", "v124-diet-shopping", "v125-default-diet", "v126-diet", "v122-simona-original", "v123-private-link", "v126-nutrition", "v126-ui"];
function load(file){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='./domain-core-'+file+'.js?v=127';script.async=false;script.onload=resolve;script.onerror=()=>reject(new Error('Impossibile caricare '+file));document.head.appendChild(script);});}
window.__DALLA_SIMO_READY__=files.reduce((p,file)=>p.then(()=>load(file)),Promise.resolve()).catch(error=>{console.error('Dalla Simo v1.26:',error);const out=document.getElementById('oggi');if(out){const message=document.createElement('div');message.className='card note';message.textContent='Aggiornamento incompleto. Ricarica l’app per preparare il piano alimentare.';out.prepend(message);}throw error;});
})();
