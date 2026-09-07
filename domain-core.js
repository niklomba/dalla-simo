// Loader Dalla Simo v1.9
(async()=>{try{const p=await Promise.all([1,2,3,4].map(n=>fetch('./domain-core-v19.part'+n+'?v=19',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Parte '+n+' non disponibile');return r.text()})));(0,eval)(p.join(''));}catch(e){console.error('Dalla Simo v1.9:',e);}})();
