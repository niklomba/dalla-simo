// Dalla Simo v1.18 — ID stabili per il catalogo esteso
(function(){
'use strict';
function boot118RecipeIds(){
  if(typeof RICETTE==='undefined')return setTimeout(boot118RecipeIds,120);
  const N=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
  const hash32=v=>{let h=2166136261,s=String(v||'');for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
  const slug=v=>N(v).replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,24);
  const used=new Set();
  RICETTE.forEach(r=>{
    if(String(r.fonte||'').includes('catalogo italiano/mediterraneo v1.18')){
      const key=N(r.nome)+'|'+N(r.variante||'');
      let id='v118_'+hash32(key).toString(36)+'_'+slug(r.nome);
      let n=2;while(used.has(id))id='v118_'+hash32(key+'|'+n++).toString(36)+'_'+slug(r.nome);
      r.id=id;used.add(id);
    } else if(r.id) used.add(r.id);
  });
  window.__DALLA_SIMO_RECIPE_IDS__='v118-stable-hash';
}
boot118RecipeIds();
})();
