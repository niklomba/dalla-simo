// Dalla Simo v1.23 — apertura immediata e attivazione privata dal collegamento personale
(function(){
'use strict';
const PREFIX='#dieta-privata=';
const MAX_LINK_CHARS=50000;
const MAX_JSON_BYTES=1024*1024;

// Il frammento resta nel browser: non viene inviato nelle richieste HTTP al sito.
function consumePersonalToken(){
  if(typeof location==='undefined'||!location.hash.startsWith(PREFIX))return null;
  const token=location.hash.slice(PREFIX.length);
  history.replaceState(history.state,'',location.pathname+location.search);
  return token;
}
let personalToken=consumePersonalToken();

async function decodePersonalToken(token){
  if(token.length>MAX_LINK_CHARS||!/^z1\.[A-Za-z0-9_-]+$/.test(token))throw new Error('Collegamento non valido');
  if(typeof DecompressionStream==='undefined')throw new Error('Apri il collegamento in un browser aggiornato');
  const encoded=token.slice(3),bin=atob(encoded.replace(/-/g,'+').replace(/_/g,'/'));
  const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
  const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();
  const chunks=[];let length=0;
  try{
    for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>MAX_JSON_BYTES){await reader.cancel();throw new Error('Collegamento troppo grande');}chunks.push(value);}
  }finally{reader.releaseLock();}
  const decoded=new Uint8Array(length);let offset=0;
  for(const c of chunks){decoded.set(c,offset);offset+=c.length;}
  return new TextDecoder('utf-8',{fatal:true}).decode(decoded);
}

function boot123(){
  if(typeof window==='undefined'||typeof window.apriDietaOriginaleSimona122!=='function'||typeof window.v122ImportFiles!=='function'||!window.v122PrivateDietReady)return setTimeout(boot123,120);
  window.__DALLA_SIMO_DIET_V123__={version:'1.23',defaultScreen:'dieta',personalLinkActivation:true,publicDietPayload:false,activation:'none'};
  const initialToken=personalToken;personalToken=null;
  async function activate(token){
    const stored=await window.v122PrivateDietReady;
    const available=typeof window.v122HasPrivateDiet==='function'?window.v122HasPrivateDiet():stored.available;
    if(token===null)return {ok:available,existing:available};
    window.__DALLA_SIMO_DIET_V123__.activation='preparing';
    try{
      const json=await decodePersonalToken(token);
      if(available&&!window.v122CanUpgradePrivateDiet?.(JSON.parse(json))){window.__DALLA_SIMO_DIET_V123__.activation='already-local';return {ok:true,existing:true};}
      const result=await window.v122ImportFiles({files:[new File([json],'piano-privato.json',{type:'application/json'})],value:''});
      if(!result?.ok)throw new Error('Salvataggio locale non riuscito');
      window.__DALLA_SIMO_DIET_V123__.activation='local';return {ok:true,existing:false};
    }catch(e){
      window.__DALLA_SIMO_DIET_V123__.activation='error';
      if(typeof toast==='function')toast('Non riesco ad attivare la dieta. Riapri il collegamento personale ricevuto.');
      return {ok:false};
    }
  }
  let queue=Promise.resolve();
  function openPersonalDiet(token){
    window.apriDietaOriginaleSimona122();
    queue=queue.then(()=>activate(token));
    window.v123ActivationDone=queue;
  }
  if(typeof window.addEventListener==='function')window.addEventListener('hashchange',()=>{
    const token=consumePersonalToken();
    if(token!==null)openPersonalDiet(token);
  });
  openPersonalDiet(initialToken);
}
boot123();
})();
