// Dalla Simo v1.21 — Diete originali private + settimana a scorrimento laterale
(function(){
'use strict';
function boot121(){
  if(typeof window==='undefined'||typeof st==='undefined'||typeof save!=='function'||typeof renderSettimana!=='function')return setTimeout(boot121,120);
  const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const N=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const GIORNI=['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
  const PASTI=['Colazione','Spuntino','Pranzo','Merenda','Cena'];
  const memberById=id=>(st.membri||[]).find(m=>m.id===id);
  const memberKey=id=>{const m=memberById(id);if(!m)return '';const n=N(m.nome);return n==='simona'?'simona':n==='nicola'?'nicola':'';};
  const manifest={
    simona:{count:6,hashes:['bc6ffc229aff6943be16506da2b8e3299b415eec8567839c78076ef140ecafda','7a00b29a0b3a0863ee9efa589f7e4a3043ea032838b29b0d518c1b7fb750b750','263b786168dc2ef0fd14da97395ef6a93ffe05a0b49dac00ba8db48f29f1aa10','2e0e54626dfbd8bc54942e78b9e9ead5ea82c8e114b46d8e25e3f82d4436d8ab','72702c9c9ca81449f567afae8537f637b4e1aa753a471fdf2c03940b36bdb89b','d446af0840d3c877d102ce7c448ffe6ede5cb50b5f82cb63fe8f065e1f234a03']},
    nicola:{count:5,hashes:['bd3e7517a2761d9c9d6119c909e488bfafe8b575ea5228c96c261f2291ffc988','f480f2ab7d3a21c4e89907a0cd314d058339a5d7a62d6a4b609847eaee54fe06','a874b6ef4f2790b2edaa9c1fc97da27dc23bb0a9d27610fc363df01e9673651d','97e6a68c2ac0128edd490a304869e6cdafe45a45340a3d9c692ba201ca64c80c','3070434e7de8841885b372117dfc5c91c0b942b6ce015ac0faf85509be490c4c']}
  };
  st.v121=st.v121||{};
  if(!['menu','diete','originale'].includes(st.v121.vista))st.v121.vista=st.v113?.modalitaMenu==='base'?'menu':'diete';
  st.v121.originaleMembro=st.v121.originaleMembro||st.v113?.membroDieta||st.membri?.[0]?.id||'';

  if(!document.getElementById('v121css')){
    const s=document.createElement('style');s.id='v121css';s.textContent=`
      .v121-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:0 0 12px}
      .v121-tabs .tab{white-space:normal;min-height:48px;font-weight:850}
      .v121-week-scroll,.v121-original-scroll{display:flex;gap:12px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scroll-padding:8px;padding:3px 4px 14px;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}
      .v121-week-scroll::-webkit-scrollbar,.v121-original-scroll::-webkit-scrollbar{height:7px}
      .v121-day-card{flex:0 0 min(88vw,440px);scroll-snap-align:start;scroll-snap-stop:always;padding:16px}
      .v121-day-card.on{outline:2px solid var(--green);outline-offset:-2px}
      .v121-day-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
      .v121-day-meal{padding:9px 0;border-bottom:1px solid var(--border)}
      .v121-day-meal:last-child{border-bottom:0}
      .v121-day-meal .tiny{margin-bottom:3px}
      .v121-day-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}
      .v121-original-card{flex:0 0 min(92vw,720px);scroll-snap-align:start;scroll-snap-stop:always;background:#fff;border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:0 5px 18px rgba(0,0,0,.06)}
      .v121-original-card img{display:block;width:100%;height:auto;max-height:78vh;object-fit:contain;background:#f7f7f7}
      .v121-original-caption{padding:9px 12px;font-size:12px;color:var(--muted);display:flex;justify-content:space-between;gap:8px}
      .v121-local-note{font-size:12px;line-height:1.45}
      .v121-import-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
      .v121-privacy{border-left:4px solid var(--green);padding-left:10px}
      @media(max-width:560px){.v121-tabs{grid-template-columns:1fr}.v121-tabs .tab{min-height:42px}.v121-day-card{flex-basis:91vw}}
    `;document.head.appendChild(s);
  }

  function openDb(){return new Promise((resolve,reject)=>{const q=indexedDB.open('dalla_simo_private_v121',1);q.onupgradeneeded=()=>{const db=q.result;if(!db.objectStoreNames.contains('original_diet_images')){const os=db.createObjectStore('original_diet_images',{keyPath:'key'});os.createIndex('member','member',{unique:false});}};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}
  async function listImages(member){const db=await openDb();return await new Promise((resolve,reject)=>{const tx=db.transaction('original_diet_images','readonly'),idx=tx.objectStore('original_diet_images').index('member'),q=idx.getAll(member);q.onsuccess=()=>resolve((q.result||[]).sort((a,b)=>a.order-b.order));q.onerror=()=>reject(q.error);});}
  async function replaceImages(member,files){const db=await openDb();await new Promise((resolve,reject)=>{const tx=db.transaction('original_diet_images','readwrite'),os=tx.objectStore('original_diet_images'),idx=os.index('member'),q=idx.getAllKeys(member);q.onsuccess=()=>{(q.result||[]).forEach(k=>os.delete(k));[...files].forEach((f,i)=>os.put({key:member+':'+String(i).padStart(2,'0'),member,order:i,name:f.name,type:f.type||'image/jpeg',size:f.size,blob:f,importedAt:new Date().toISOString()}));};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
  async function clearImages(member){const db=await openDb();await new Promise((resolve,reject)=>{const tx=db.transaction('original_diet_images','readwrite'),os=tx.objectStore('original_diet_images'),idx=os.index('member'),q=idx.getAllKeys(member);q.onsuccess=()=>{(q.result||[]).forEach(k=>os.delete(k));};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
  async function sha256(blob){const buf=await blob.arrayBuffer(),dig=await crypto.subtle.digest('SHA-256',buf);return [...new Uint8Array(dig)].map(b=>b.toString(16).padStart(2,'0')).join('');}
  async function verifySet(member,items){const expected=manifest[member];if(!expected)return {ok:false,matched:0};let matched=0;const got=[];for(const it of items)got.push(await sha256(it.blob));const remain=[...expected.hashes];for(const h of got){const i=remain.indexOf(h);if(i>=0){matched++;remain.splice(i,1);}}return {ok:items.length===expected.count&&matched===expected.count,matched,expected:expected.count};}

  window.cambiaVistaPiani121=function(v){if(!['menu','diete','originale'].includes(v))return;st.v121.vista=v;if(v==='menu')st.v113.modalitaMenu='base';if(v==='diete')st.v113.modalitaMenu='completa';save();renderSettimana();};
  window.cambiaMembroOriginale121=function(id){st.v121.originaleMembro=id;st.v113.membroDieta=id;save();renderSettimana();};
  window.v121SelectDay=function(g){st.giornoPlanner=g;save();renderSettimana();};
  window.v121ChangeDay=function(id,di){st.giornoPlanner=GIORNI[di];save();if(typeof cambiaGiornoDieta120==='function')cambiaGiornoDieta120(id,di);};
  window.v121ChangeMeal=function(id,di,p){st.giornoPlanner=GIORNI[di];save();if(typeof cambiaPastoDieta120==='function')cambiaPastoDieta120(id,di,p);};
  window.v121ImportClick=function(){document.getElementById('v121OriginalFiles')?.click();};
  window.v121ImportFiles=async function(input){const id=st.v121.originaleMembro,key=memberKey(id);if(!key)return toast('Dieta originale disponibile per Simona e Nicola');const files=[...(input?.files||[])].filter(f=>/^image\//.test(f.type)||/\.(jpe?g|png|webp)$/i.test(f.name));if(!files.length)return toast('Seleziona le immagini originali');await replaceImages(key,files);input.value='';toast('Immagini originali salvate solo su questo dispositivo');renderOriginal121();};
  window.v121ClearOriginal=async function(){const key=memberKey(st.v121.originaleMembro);if(!key)return;if(!confirm('Rimuovere da questo dispositivo le immagini della dieta originale? I piani digitali non verranno modificati.'))return;await clearImages(key);renderOriginal121();};

  function planTabs(){const v=st.v121.vista;return `<div class="v121-tabs" id="v121PlanTabs"><button class="tab ${v==='menu'?'on':''}" onclick="cambiaVistaPiani121('menu')">🍽️ Menu</button><button class="tab ${v==='diete'?'on':''}" onclick="cambiaVistaPiani121('diete')">📋 Diete</button><button class="tab ${v==='originale'?'on':''}" onclick="cambiaVistaPiani121('originale')">🖼️ Dieta originale</button></div>`;}
  function memberSelect(id){return `<select class="search" onchange="cambiaMembroOriginale121(this.value)">${(st.membri||[]).map(m=>`<option value="${H(m.id)}" ${m.id===id?'selected':''}>${H(m.nome)}</option>`).join('')}</select>`;}
  function mountControls(){const sec=document.getElementById('settimana'),ctl=document.getElementById('v113DietCtl');if(!sec||!ctl)return;const id=st.v121.vista==='originale'?st.v121.originaleMembro:st.v113.membroDieta;ctl.innerHTML=planTabs()+((st.v121.vista==='diete'||st.v121.vista==='originale')?memberSelect(id):'');const h1=sec.querySelector('h1'),sub=sec.querySelector('.sub');if(h1)h1.textContent=st.v121.vista==='originale'?'Dieta originale':'Menu e diete';if(sub)sub.textContent=st.v121.vista==='originale'?'Immagini originali del piano, conservate in locale sul dispositivo':st.v121.vista==='diete'?'Cinque piani intercambiabili · settimana a scorrimento laterale':'Menu familiare';}

  function mealHtml(id,di,p,txt){const canChange=['Pranzo','Cena'].includes(p);return `<div class="v121-day-meal"><div class="tiny"><b>${p.toUpperCase()}</b></div><div class="recipe-title">${H(txt||'—')}</div>${txt?`<div class="v121-day-actions">${canChange?`<button class="btn small soft" onclick="v121ChangeMeal('${id}',${di},'${p}')">🔄 Cambia ${p.toLowerCase()}</button>`:''}<button class="btn small secondary" onclick="registraPastoDieta120('${id}',${di},'${p}')">✓ Fatto</button></div>`:''}</div>`;}
  function renderHorizontalDiet(){const gb=document.getElementById('giorniPlanner'),out=document.getElementById('pianoGiorno');if(!gb||!out)return;gb.style.display='none';const id=st.v113?.membroDieta||'',m=memberById(id),plan=st.pianiPersona?.[id]?.settimana;if(!m||!plan){out.innerHTML='<div class="card empty">Nessun piano dieta disponibile per questa persona.</div>';return;}const cards=GIORNI.map((g,di)=>{const d=plan[g]||{},on=g===st.giornoPlanner;return `<div class="card v121-day-card ${on?'on':''}" data-day="${g}"><div class="v121-day-head"><div><h3>${g}</h3><div class="meta">${H(m.nome)} · piano attivo</div></div><button class="btn small secondary" onclick="v121SelectDay('${g}')">${on?'Oggi selezionato':'Seleziona'}</button></div>${PASTI.map(p=>mealHtml(id,di,p,d[p])).join('')}<div class="v121-day-actions"><button class="btn small" onclick="v121ChangeDay('${id}',${di})">🔄 Cambia giorno</button><button class="btn small secondary" onclick="compraDietaGiorno117('${g}')">🛒 Compra giorno</button></div></div>`;}).join('');out.innerHTML=`<div class="card"><div class="row between"><div><h3>${H(m.nome)} · Dieta</h3><div class="meta">Mantiene i 5 piani intercambiabili della v1.20. Scorri lateralmente per passare da un giorno all'altro.</div></div><button class="btn small secondary" onclick="apriRegolePiano120('${id}')">Regole e limiti</button></div><div class="v121-import-row"><select class="search" style="max-width:260px" onchange="if(this.value!=='')usaSettimana120('${id}',this.value)"><option value="">Scegli uno dei 5 piani</option><option value="0">Settimana base</option><option value="1">Alternativa 1</option><option value="2">Alternativa 2</option><option value="3">Alternativa 3</option><option value="4">Alternativa 4</option></select><button class="btn secondary" onclick="mischiaSettimana120('${id}')">🎲 Mischia settimana</button><button class="btn secondary" onclick="showScreenById('registro')">📝 Registra i pasti</button><button class="btn secondary" onclick="compraDietaSettimana117()">🛒 Compra tutta la dieta</button></div></div><div class="v121-week-scroll" id="v121WeekScroll">${cards}</div>`;requestAnimationFrame(()=>{const a=out.querySelector('.v121-day-card.on');if(a)a.scrollIntoView({behavior:'auto',block:'nearest',inline:'start'});});}

  async function renderOriginalImagesInto(box,key){const items=await listImages(key),v=await verifySet(key,items);if(!items.length){box.innerHTML=`<div class="card empty"><b>Nessuna immagine originale salvata su questo dispositivo.</b><br><br>Importa le ${manifest[key]?.count||''} immagini originali. Verranno conservate senza compressione o modifica nel database locale del browser/PWA.</div>`;return;}box.innerHTML=`<div class="card"><div class="row between"><div><h3>${v.ok?'✓ Originali verificati':'Immagini locali'}</h3><div class="meta">${items.length} immagini · ${v.matched}/${v.expected||items.length} corrispondono agli originali forniti.</div></div><span class="pill">${v.ok?'VERIFICATO':'CONTROLLA'}</span></div></div><div class="v121-original-scroll">${items.map((it,i)=>{const u=URL.createObjectURL(it.blob);setTimeout(()=>URL.revokeObjectURL(u),60000);return `<figure class="v121-original-card"><img src="${u}" alt="Dieta originale ${H(key)} pagina ${i+1}"><figcaption class="v121-original-caption"><span>Pagina ${i+1}</span><span>${H(it.name)}</span></figcaption></figure>`;}).join('')}</div>`;}
  window.renderOriginal121=async function(){const gb=document.getElementById('giorniPlanner'),out=document.getElementById('pianoGiorno');if(!gb||!out)return;gb.style.display='none';const id=st.v121.originaleMembro||st.v113?.membroDieta||'',m=memberById(id),key=memberKey(id);if(!m||!key){out.innerHTML='<div class="card empty">La dieta originale fotografica è disponibile per Simona e Nicola.</div>';return;}out.innerHTML=`<div class="card"><h3>🖼️ Dieta originale · ${H(m.nome)}</h3><div class="note v121-privacy v121-local-note">Le immagini originali contengono dati personali. Il repository GitHub di Dalla Simo è pubblico: per non pubblicare la dieta su Internet, questa sezione conserva i file <b>solo sul dispositivo</b> in IndexedDB. I piani digitali modificati e le 5 versioni intercambiabili restano invariati.</div><div class="v121-import-row"><button class="btn" onclick="v121ImportClick()">📥 Importa immagini originali</button><button class="btn secondary" onclick="v121ClearOriginal()">Rimuovi immagini locali</button></div><input id="v121OriginalFiles" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onchange="v121ImportFiles(this)"></div><div id="v121OriginalImages"><div class="card empty">Caricamento...</div></div>`;await renderOriginalImagesInto(document.getElementById('v121OriginalImages'),key);};

  const prev=window.renderSettimana;
  window.renderSettimana=function(){const r=prev?.();mountControls();if(st.v121.vista==='originale')renderOriginal121();else if(st.v121.vista==='diete')renderHorizontalDiet();else{const gb=document.getElementById('giorniPlanner');if(gb)gb.style.display='';}return r;};
  window.__DALLA_SIMO_DIETS_V121__={version:'1.21',horizontalWeek:true,originalDietView:true,originalFilesStorage:'IndexedDB locale privato',originalManifest:{simona:6,nicola:5},preservesV120InterchangeablePlans:true,publicRepositoryImages:false};
  renderSettimana();
  console.log('Dalla Simo v1.21 dieta originale e settimana laterale attive',window.__DALLA_SIMO_DIETS_V121__);
}
boot121();
})();
