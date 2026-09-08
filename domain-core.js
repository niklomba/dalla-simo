// Loader Dalla Simo v1.14
(async()=>{try{
  const p=await Promise.all([1,2,3,4].map(n=>fetch('./domain-core-v19.part'+n+'?v=19',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Parte '+n+' non disponibile');return r.text()})));
  (0,eval)(p.join(''));
  const a=await fetch('./domain-core-v113.js?v=113',{cache:'no-store'});if(!a.ok)throw new Error('Patch v1.13 non disponibile');(0,eval)(await a.text());
  const b=await fetch('./domain-core-v114.js?v=114',{cache:'no-store'});if(!b.ok)throw new Error('Patch v1.14 non disponibile');(0,eval)(await b.text());
}catch(e){console.error('Dalla Simo v1.14:',e);}})();
