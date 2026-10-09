// Dalla Simo v1.22 — lettore della dieta privata, conservata solo sul dispositivo
(function(){
'use strict';

const GIORNI=['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
const PASTI=['Colazione','Spuntino','Pranzo','Merenda','Cena'];
const DB='dalla_simo_private_v122';
const STORE='original_diets';
const FORMAT='dalla-simo-private-diet';
const MAX_BYTES=1024*1024;

// Il codice distribuito non contiene alimenti, quantità o note del piano personale.
function validateDiet(raw){
  function text(v,max=5000){if(typeof v!=='string'||!v.trim()||v.length>max)throw new Error('Testo del piano non valido');return v;}
  function array(v,max=60){if(!Array.isArray(v)||!v.length||v.length>max)throw new Error('Sezione del piano non valida');return v;}
  function meal(v){
    if(!v||typeof v!=='object')throw new Error('Pasto non valido');
    const m={name:text(v.name,100),items:array(v.items).map(x=>text(x))};
    if(v.components!==undefined){if(!window.v124Quantities)throw new Error('Aggiorna l’app per aprire questo piano');m.components=window.v124Quantities.validateComponents(v.components);}
    if(v.alternative!==undefined){if(!Number.isInteger(v.alternative)||v.alternative<1||v.alternative>20)throw new Error('Alternativa non valida');m.alternative=v.alternative;}
    return m;
  }
  function block(v){
    if(!v||typeof v!=='object')throw new Error('Nota non valida');
    if(v.type==='text'||v.type==='heading')return {type:v.type,text:text(v.text)};
    if(v.type==='list')return {type:'list',items:array(v.items).map(x=>text(x))};
    if(v.type==='meal')return {type:'meal',...meal(v)};
    if(v.type==='table')return {type:'table',rows:array(v.rows).map(r=>{if(!Array.isArray(r)||r.length!==2)throw new Error('Tabella non valida');return r.map(x=>text(x));})};
    throw new Error('Tipo di contenuto non riconosciuto');
  }
  function section(v){if(!v||typeof v!=='object')throw new Error('Sezione non valida');return {title:text(v.title,200),blocks:array(v.blocks).map(block)};}
  if(!raw||raw.format!==FORMAT||raw.version!==1||raw.profile!=='simona')throw new Error('Seleziona il file della dieta privata di Simona');
  function weekData(data){
  if(!Array.isArray(data)||data.length!==7)throw new Error('La settimana deve contenere tutti i sette giorni');
  return data.map((d,i)=>{
    if(!d||d.day!==GIORNI[i]||!Array.isArray(d.meals)||d.meals.length!==PASTI.length)throw new Error('Giorni o pasti incompleti');
    const meals=d.meals.map(meal);if(meals.some((m,j)=>m.name!==PASTI[j]))throw new Error('Suddivisione dei pasti non valida');
    return {day:GIORNI[i],meals};
  });}
  const week=weekData(raw.week);
  const diet={format:FORMAT,version:1,profile:'simona',title:text(raw.title,200),description:text(raw.description),week,
    foodSections:array(raw.foodSections,30).map(section),notes:array(raw.notes,30).map(section),source:text(raw.source)};
  if(raw.sourceContacts!==undefined)diet.sourceContacts=text(raw.sourceContacts);
  if(raw.sourcePages!==undefined){if(!Number.isInteger(raw.sourcePages)||raw.sourcePages<1||raw.sourcePages>100)throw new Error('Numero pagine non valido');diet.sourcePages=raw.sourcePages;}
  if(raw.revision!==undefined){if(!Number.isInteger(raw.revision)||raw.revision<1||raw.revision>1000000)throw new Error('Revisione non valida');diet.revision=raw.revision;}
  if(raw.plans!==undefined){
    function planId(v){if(typeof v!=='string'||!/^[a-z0-9_-]{1,80}$/.test(v))throw new Error('Piano non valido');return v;}
    diet.plans=array(raw.plans,10).map(p=>{const plan={id:planId(p.id),label:text(p.label,200),description:text(p.description),week:weekData(p.week)};if(plan.week.some(d=>d.meals.some(m=>!m.components)))throw new Error('Porzioni del piano incomplete');if(p.notes!==undefined)plan.notes=array(p.notes,30).map(x=>text(x));return plan;});
    diet.primaryPlan=planId(raw.primaryPlan);
    if(new Set(diet.plans.map(p=>p.id)).size!==diet.plans.length||!diet.plans.some(p=>p.id===diet.primaryPlan))throw new Error('Piano principale non valido');
  }
  return diet;
}

function openDb(){return new Promise((resolve,reject)=>{
  if(typeof indexedDB==='undefined')return reject(new Error('Il browser non permette il salvataggio locale'));
  const q=indexedDB.open(DB,1);
  q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains(STORE))q.result.createObjectStore(STORE,{keyPath:'key'});};
  q.onsuccess=()=>{q.result.onversionchange=()=>q.result.close();resolve(q.result);};
  q.onerror=()=>reject(q.error||new Error('Archivio locale non disponibile'));
  q.onblocked=()=>reject(new Error('Chiudi le altre finestre dell’app e riprova'));
});}
async function storage(action,diet){
  const db=await openDb();
  try{return await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,action==='read'?'readonly':'readwrite'),os=tx.objectStore(STORE);let value=null;
    if(action==='read'){const q=os.get('simona');q.onsuccess=()=>{value=q.result?.diet||null;};}
    else if(action==='write')os.put({key:'simona',diet,importedAt:new Date().toISOString()});
    else if(action==='delete')os.delete('simona');
    tx.oncomplete=()=>resolve(value);
    tx.onerror=()=>reject(tx.error||new Error('Salvataggio locale non riuscito'));
    tx.onabort=()=>reject(tx.error||new Error('Salvataggio locale interrotto'));
  });}finally{db.close();}
}

function boot122(){
  if(typeof window==='undefined'||typeof st==='undefined'||typeof save!=='function'||typeof renderSettimana!=='function'||typeof showScreenById!=='function')return setTimeout(boot122,120);
  const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const N=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const membro=id=>(st.membri||[]).find(m=>m.id===id);
  const simona=()=> (st.membri||[]).find(m=>N(m.nome)==='simona');
  const keyMembro=id=>N(membro(id)?.nome);
  let localDiet=null,loadState='loading',loadError='',busy=false;
  const notify=msg=>{if(typeof toast==='function')toast(msg);};
  st.v122=st.v122||{};
  if(!['simona-originale','altre'].includes(st.v122.vista))st.v122.vista='simona-originale';

  if(!document.getElementById('v122css')){
    const s=document.createElement('style');s.id='v122css';s.textContent=`
      .v122-hero{background:linear-gradient(135deg,#eef4ed,#fff8ed);border-left:5px solid var(--green)}
      .v122-top-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
      .v122-day-nav{display:flex;gap:7px;overflow-x:auto;padding:2px 1px 9px;scrollbar-width:thin}
      .v122-day-nav button{white-space:nowrap}
      .v122-week{display:flex;gap:12px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scroll-padding:4px;padding:3px 4px 15px;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}
      .v122-day{flex:0 0 min(86vw,455px);scroll-snap-align:start;scroll-snap-stop:always;padding:16px}
      .v122-day.on{outline:2px solid var(--green);outline-offset:-2px}
      .v122-meal{padding:10px 0;border-bottom:1px solid var(--border)}
      .v122-meal:last-child{border-bottom:0}
      .v122-meal-title{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:5px}
      .v122-meal-title b{font-size:12px;letter-spacing:.03em;color:var(--green)}
      .v122-list{margin:5px 0 0;padding-left:19px}
      .v122-list li{margin:5px 0;line-height:1.4;overflow-wrap:anywhere}
      .v122-qty{width:100%;table-layout:fixed;border-collapse:collapse;margin-top:9px;font-size:13px}
      .v122-qty th,.v122-qty td{padding:10px;border:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere}
      .v122-qty th{width:50%;font-weight:600}
      .v122-qty td{font-weight:850}
      .v122-qty tr:nth-child(odd){background:#f7f8f5}
      .v122-section-title{margin-top:22px}
      .v122-note-card h3{margin-bottom:8px}
      .v122-note-card h4{margin-top:14px}
      .v122-note-card p{line-height:1.5}
      .v122-source{font-size:11px;color:var(--muted);line-height:1.45;overflow-wrap:anywhere}
      .v122-family-buttons{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
      .v122-local{margin-top:10px;font-size:12px;line-height:1.45}
      .v122-manage summary{cursor:pointer;font-weight:750}
      @media(max-width:420px){.v122-top-actions,.v122-family-buttons{grid-template-columns:1fr}.v122-day{flex-basis:86vw}}
    `;document.head.appendChild(s);
  }

  function navDieta(){
    const b=document.querySelector('.nav [data-s="settimana"]');if(!b)return;
    b.innerHTML='<b>📋</b>Dieta';b.onclick=function(){window.apriDietaOriginaleSimona122(this);};
  }
  function lista(items){return `<ul class="v122-list">${items.map(x=>`<li>${H(x)}</li>`).join('')}</ul>`;}
  function pasto(m,d,i){const structured=window.v124RenderMeal?.(m,d,i);if(structured)return structured;return `<div class="v122-meal"><div class="v122-meal-title"><b>${H(m.name.toUpperCase())}</b>${m.alternative?`<span class="badge good">Alternativa ${m.alternative}</span>`:''}</div>${lista(m.items)}</div>`;}
  function griglia(rows){return `<table class="v122-qty"><tbody>${rows.map(([a,b])=>`<tr><th scope="row">${H(a)}</th><td>${H(b)}</td></tr>`).join('')}</tbody></table>`;}
  function section(s){return `<div class="card v122-note-card"><h3>${H(s.title)}</h3>${s.blocks.map(b=>{
    if(b.type==='text')return `<p>${H(b.text)}</p>`;
    if(b.type==='heading')return `<h4>${H(b.text)}</h4>`;
    if(b.type==='list')return lista(b.items);
    if(b.type==='table')return griglia(b.rows);
    return pasto(b);
  }).join('')}</div>`;}
  function giornoCard(d,i,selected,label){return `<article class="card v122-day ${selected?'on':''}" data-v122-day="${i}"><div class="row between"><div><h3>${H(d.day)}</h3><div class="meta">${H(label||'Esempio settimanale originale')}</div></div><button class="btn small secondary" onclick="v122ScegliGiorno(${i})">${selected?'Selezionato':'Apri'}</button></div>${window.v124DayAction?.(i)||''}${d.meals.map((m,j)=>pasto(m,i,j)).join('')}</article>`;}
  function importInput(){return '<input id="v122PrivateFile" type="file" accept="application/json,.json" hidden onchange="v122ImportFiles(this)">';}
  function altreActions(){return '<div class="v122-top-actions"><button class="btn secondary" onclick="showScreenById(\'famiglia\')">👨‍👩‍👧‍👦 Altre diete in Famiglia</button><button class="btn secondary" onclick="apriFotoOriginali122()">🖼️ Foto originali</button></div>';}
  function content(){
    if(!localDiet)return `<div class="card v122-hero"><h3>Dieta originale di Simona</h3><p class="v122-local">${loadState==='loading'?'Preparazione della dieta sul dispositivo…':loadState==='error'?H(loadError):'Apri il collegamento personale che hai ricevuto: la dieta comparirà automaticamente e resterà salvata su questo dispositivo.'}</p><p class="v122-local">Potrai consultarla anche offline. Sul tuo altro telefono puoi usare lo stesso collegamento personale.</p>${altreActions()}<details class="v122-manage" style="margin-top:14px"><summary>Hai già una copia privata del piano?</summary><button class="btn full" style="margin-top:10px" ${loadState==='loading'?'disabled':''} onclick="v122ImportClick()">📥 Importa dieta privata</button>${importInput()}</details></div>`;
    const di=Math.max(0,GIORNI.indexOf(st.giornoPlanner));
    const plan=window.v124SelectedPlan?.(localDiet),week=plan?.week||localDiet.week;
    return `<div class="card v122-hero"><div class="row between"><div><h3>${H(localDiet.title)}</h3><div class="v114-plan-badge">${localDiet.sourcePages?`TRASCRIZIONE DELLE ${localDiet.sourcePages} PAGINE ORIGINALI`:'PIANO ORIGINALE'}</div></div><span class="pill">SOLO QUI</span></div><p class="v122-local">${H(localDiet.description)}</p>${altreActions()}</div>
      ${window.v124PlanControls?.(localDiet)||''}<div class="v122-day-nav">${GIORNI.map((g,i)=>`<button class="btn small ${i===di?'':'secondary'}" aria-pressed="${i===di}" onclick="v122ScegliGiorno(${i})">${H(g)}</button>`).join('')}</div>
      <div class="v122-week" id="v122Week">${week.map((d,i)=>giornoCard(d,i,i===di,plan?.label)).join('')}</div>
      <h2 class="v122-section-title">Scelte e grammature originali</h2>${localDiet.foodSections.map(section).join('')}
      <h2 class="v122-section-title">Note aggiuntive del piano</h2>${window.v124PlanNotes?.(localDiet)||''}${localDiet.notes.map(section).join('')}
      <div class="card v122-source"><b>Fonte:</b> ${H(localDiet.source)}${localDiet.sourceContacts?`<p>${H(localDiet.sourceContacts)}</p>`:''}</div>
      <details class="card v122-manage"><summary>Gestisci la dieta su questo dispositivo</summary><p class="v122-local">Il piano importato è conservato solo nel browser o nell’app su questo dispositivo. Prima di cancellare i dati del browser, conserva il file privato per poterlo importare di nuovo.</p><div class="v122-top-actions"><button class="btn secondary" onclick="v122ImportClick()">Importa un altro file</button><button class="btn secondary" onclick="v122ExportDiet()">Esporta copia privata</button><button class="btn secondary" onclick="v122ClearDiet()">Rimuovi dieta locale</button></div>${importInput()}</details>`;
  }
  function renderOriginale(){
    if(st.v122.vista!=='simona-originale')return;
    const sec=document.getElementById('settimana'),out=document.getElementById('pianoGiorno');if(!sec||!out)return;
    for(const id of ['giorniPlanner','v113DietCtl']){const el=document.getElementById(id);if(el)el.style.display='none';}
    const g2=sec.querySelector(':scope > .grid2');if(g2)g2.style.display='none';
    const h1=sec.querySelector('h1'),sub=sec.querySelector('.sub');
    if(h1)h1.textContent='Dieta originale di Simona';if(sub)sub.textContent='Pasti e grammature · conservati solo su questo dispositivo';
    out.innerHTML=content();
    requestAnimationFrame(()=>{const week=out.querySelector('#v122Week'),card=out.querySelector('.v122-day.on');if(week&&card)week.scrollTo({left:card.offsetLeft-week.offsetLeft,behavior:'auto'});});
  }

  const ready=storage('read').then(d=>{localDiet=d?validateDiet(d):null;loadState='ready';}).catch(e=>{loadState='error';loadError=e.message||'Non riesco a leggere la dieta locale. Riprova a importare il file.';}).finally(()=>renderOriginale());
  window.v122PrivateDietReady=ready.then(()=>({available:Boolean(localDiet),state:loadState}));
  window.v122HasPrivateDiet=()=>Boolean(localDiet);
  window.v122GetPrivateDiet=()=>localDiet?JSON.parse(JSON.stringify(localDiet)):null;
  window.v122RenderPrivateDiet=renderOriginale;
  window.v122CanUpgradePrivateDiet=raw=>{const d=validateDiet(raw);return Boolean(localDiet&&d.source===localDiet.source&&(d.revision||1)>(localDiet.revision||1));};
  window.v122ImportClick=()=>document.getElementById('v122PrivateFile')?.click();
  window.v122ImportFiles=async function(input){
    const file=input?.files?.[0];if(!file||busy)return {ok:false};busy=true;
    try{
      if(file.size>MAX_BYTES)throw new Error('Il file è troppo grande: seleziona il file JSON della dieta');
      const diet=validateDiet(JSON.parse(await file.text()));await ready;await storage('write',diet);
      if(diet.plans&&(diet.revision||1)>(localDiet?.revision||1)){st.v124=st.v124||{};st.v124.plan=diet.primaryPlan;save();}
      localDiet=diet;loadState='ready';loadError='';notify('Dieta salvata solo su questo dispositivo');renderOriginale();
      return {ok:true};
    }catch(e){notify(e instanceof SyntaxError?'Il file non è un JSON valido':e.message||'Importazione non riuscita');return {ok:false};}
    finally{busy=false;input.value='';}
  };
  window.v122ExportDiet=function(){
    if(!localDiet)return;const blob=new Blob([JSON.stringify(localDiet,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='Dieta_originale_Simona_privata.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  window.v122ClearDiet=async function(){
    if(!localDiet||busy||!confirm('Rimuovere la dieta originale da questo dispositivo? Potrai ripristinarla importando il file privato. Le foto originali e le altre diete resteranno disponibili.'))return;
    busy=true;try{await storage('delete');localDiet=null;loadState='ready';notify('Dieta locale rimossa');renderOriginale();}catch(e){notify(e.message||'Rimozione non riuscita');}finally{busy=false;}
  };

  const renderSettimanaPrima122=window.renderSettimana;
  window.renderSettimana=function(){
    // Evita che il vecchio caricamento asincrono delle foto sovrascriva la vista privata.
    if(st.v122.vista==='simona-originale'){renderOriginale();navDieta();return;}
    const r=renderSettimanaPrima122?.(),ctl=document.getElementById('v113DietCtl');if(ctl)ctl.style.display='';
    const tabs=document.getElementById('v121PlanTabs');if(tabs){const bs=tabs.querySelectorAll('button');if(bs[0])bs[0].innerHTML='🍽️ Menu famiglia';if(bs[1])bs[1].innerHTML='📋 Piani alternativi';if(bs[2])bs[2].innerHTML='🖼️ Foto originali';}
    navDieta();return r;
  };
  window.v122ScegliGiorno=function(i){const n=Math.max(0,Math.min(6,Number(i)||0));st.giornoPlanner=GIORNI[n];save();renderOriginale();};
  window.apriDietaOriginaleSimona122=function(btn){
    st.v122.vista='simona-originale';const s=simona();if(s){st.v113=st.v113||{};st.v113.membroDieta=s.id;}save();
    if(typeof showScreen==='function'&&btn?.dataset?.s)showScreen('settimana',btn);else showScreenById('settimana');renderSettimana();
  };
  window.apriAltraDieta122=function(id){
    st.v122.vista='altre';st.v113=st.v113||{};st.v113.modalitaMenu='completa';st.v113.membroDieta=id;
    st.v121=st.v121||{};st.v121.vista='diete';save();showScreenById('settimana');renderSettimana();
  };
  window.apriFotoOriginali122=function(id){
    const target=id||simona()?.id;if(!target)return;
    st.v122.vista='altre';st.v113=st.v113||{};st.v113.membroDieta=target;
    st.v121=st.v121||{};st.v121.vista='originale';st.v121.originaleMembro=target;save();showScreenById('settimana');renderSettimana();
  };
  const vaiDietaPrima122=window.vaiDieta114;
  window.vaiDieta114=function(id){if(keyMembro(id)==='simona')return window.apriDietaOriginaleSimona122();if(keyMembro(id)==='nicola')return window.apriAltraDieta122(id);return vaiDietaPrima122?.(id);};

  const renderMembriPrima122=window.renderMembri;
  window.renderMembri=function(){
    const r=renderMembriPrima122?.(),box=document.getElementById('membri');if(!box)return r;
    [...box.querySelectorAll('.card')].forEach(card=>{
      const name=N(card.querySelector('h3')?.textContent);if(name!=='simona'&&name!=='nicola')return;
      const id=(st.membri||[]).find(m=>N(m.nome)===name)?.id;if(!id)return;
      card.querySelector('button[onclick*="vaiDieta114"]')?.remove();card.querySelector('.v122-family-buttons')?.remove();
      const actions=document.createElement('div');actions.className='v122-family-buttons';
      function button(label,fn,secondary){const b=document.createElement('button');b.className='btn'+(secondary?' secondary':'');b.textContent=label;b.onclick=fn;actions.appendChild(b);}
      if(name==='simona'){button('Apri dieta originale',()=>window.apriDietaOriginaleSimona122());button('Apri i 5 piani alternativi',()=>window.apriAltraDieta122(id),true);}
      else button('Apri dieta di Nicola',()=>window.apriAltraDieta122(id));
      button('Foto originali',()=>window.apriFotoOriginali122(id),true);card.appendChild(actions);
    });
    const tool=[...box.querySelectorAll('.v114-action')].find(b=>/menu/i.test(b.textContent||''));if(tool){tool.innerHTML='<b>📋</b>Dieta Simona';tool.onclick=()=>window.apriDietaOriginaleSimona122();}
    return r;
  };
  window.__DALLA_SIMO_DIET_V122__={version:'1.22',primaryView:'simona-originale',originalDietStorage:'IndexedDB locale',publicDietPayload:false,familyOtherDiets:true};
  navDieta();renderMembri();renderSettimana();
}
boot122();
})();
