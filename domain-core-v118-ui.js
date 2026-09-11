// Dalla Simo v1.18 — UX, menu intelligenti, alternative dieta e navigazione
(function(){
'use strict';
function boot118UI(){
  if(typeof st==='undefined'||typeof RICETTE==='undefined'||typeof save!=='function'||typeof showScreenById!=='function'){
    return setTimeout(boot118UI,120);
  }
  const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const N=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
  const GIORNI=['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
  const oggiISO=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
  const diffGiorni=data=>{if(!data)return 999;const a=new Date(data+'T12:00:00'),b=new Date(oggiISO()+'T12:00:00');return Math.round((b-a)/86400000)};
  const simona=(st.membri||[]).find(m=>N(m.nome)==='simona');
  const sid=simona?.id||'m2';

  document.title='App Alimentazione — Dalla Simo v1.18';
  const subtitle=document.querySelector('.brand-subtitle');if(subtitle)subtitle.textContent='Alimentazione familiare · v1.18';
  window.__DALLA_SIMO_BUILD__='v1.18';

  if(!document.getElementById('v118css')){
    const css=document.createElement('style');css.id='v118css';css.textContent=`
      .v118-back{display:inline-flex;align-items:center;gap:7px;border:0;background:transparent;color:#111;font-weight:950;font-size:17px;padding:6px 4px 10px 0;margin:0;line-height:1}
      .v118-back .arr{font-size:28px;font-weight:1000;line-height:.75}
      .v118-menu-top{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 12px}
      .v118-menu-top .fullrow{grid-column:1/-1}
      .v118-meal{padding:13px 0;border-bottom:1px solid var(--border)}
      .v118-meal:last-child{border-bottom:0}
      .v118-role{display:grid;grid-template-columns:72px 1fr auto;gap:8px;align-items:center;padding:7px 0}
      .v118-role b{font-size:11px;text-transform:uppercase;color:var(--muted)}
      .v118-diet-row{padding:13px 0;border-bottom:1px solid var(--border)}
      .v118-diet-row:last-child{border-bottom:0}
      .v118-qty{font-size:12px;font-weight:850;color:var(--green);margin-top:4px}
      .v118-today-alt{margin-top:9px}
      .v118-count{font-weight:900;color:var(--green)}
      @media(min-width:700px), (min-resolution:2dppx){
        #oggi .hero-logo{width:min(70%,256px)!important;max-width:256px!important;height:auto!important}
      }
      @media(max-width:420px){
        .v118-menu-top{grid-template-columns:1fr}
        .v118-menu-top .fullrow{grid-column:auto}
        .v118-role{grid-template-columns:62px 1fr}
        .v118-role .btn{grid-column:2}
      }
    `;document.head.appendChild(css);
  }

  // Header: rimuove l'avatar/lettera decorativa a destra.
  const headerAvatar=document.querySelector('header > .row.between > .avatar, header .row.between > .avatar');
  if(headerAvatar)headerAvatar.remove();

  // Navigazione Indietro con cronologia interna.
  const navHistory=[];
  let internalNav=false,goingBack=false;
  const currentScreen=()=>document.querySelector('.screen.on')?.id||'oggi';
  const pushCurrent=id=>{const c=currentScreen();if(c&&c!==id&&navHistory[navHistory.length-1]!==c)navHistory.push(c)};
  const oldShow=window.showScreen;
  if(typeof oldShow==='function'){
    window.showScreen=function(id,btn){
      if(!internalNav&&!goingBack)pushCurrent(id);
      const r=oldShow(id,btn);setTimeout(montaBack118,0);return r;
    };
  }
  const oldShowById=window.showScreenById;
  window.showScreenById=function(id){
    if(!goingBack)pushCurrent(id);
    internalNav=true;
    try{return oldShowById(id)}
    finally{internalNav=false;setTimeout(montaBack118,0)}
  };
  window.vaiIndietro118=function(){
    const id=navHistory.pop()||'oggi';
    goingBack=true;
    try{oldShowById(id)}finally{goingBack=false;setTimeout(montaBack118,0)}
  };
  function montaBack118(){
    document.querySelectorAll('.screen').forEach(sec=>{
      if(sec.id==='oggi')return;
      if(sec.querySelector(':scope > .v118-back'))return;
      const h=sec.querySelector(':scope > h1')||sec.querySelector('h1');
      if(!h)return;
      const b=document.createElement('button');b.type='button';b.className='v118-back';b.innerHTML='<span class="arr">←</span><span>Indietro</span>';b.onclick=vaiIndietro118;
      h.insertAdjacentElement('beforebegin',b);
    });
  }
  montaBack118();
  try{new MutationObserver(()=>montaBack118()).observe(document.querySelector('main'),{childList:true,subtree:true})}catch(e){}

  // Rimuove il riquadro "Regole del planner".
  function pulisciPlanner118(){
    document.querySelectorAll('#settimana .card').forEach(c=>{if(N(c.querySelector('h3')?.textContent)==='regole del planner')c.remove()});
  }

  // CONSIGLIO DEL GIORNO: data reale + variante manuale.
  st.v118ConsiglioIndice=st.v118ConsiglioIndice||{};
  function ruolo(r){
    const t=(r.tags||[]).map(N),n=N(r.nome),c=N(r.categoria);
    if(t.includes('contorno'))return 'contorno';
    if(t.includes('dolce')||t.includes('condimento')||t.includes('colazione')||t.includes('spuntino')||t.includes('merenda')||t.includes('antipasto'))return 'altro';
    if(t.includes('primo')||/^(pasta|spaghetti|linguine|bucatini|rigatoni|penne|fusilli|caserecce|paccheri|orecchiette|tagliatelle|pappardelle|risotto|riso|gnocchi|lasagn|cannelloni|zuppa|minestra|vellutata|farro|orzo|cous cous|bulgur|quinoa)/.test(n))return 'primo';
    if(t.includes('secondo')||['carne','pesce','uova','latticini'].includes(c)||/frittata|omelette|pollo|manzo|vitello|maiale|tacchino|coniglio|orata|branzino|merluzzo|salmone|gamber|pesce/.test(n))return 'secondo';
    if(t.includes('piatto_unico'))return 'primo';
    return 'altro';
  }
  function mealReady(r){const rr=ruolo(r);return rr==='primo'||rr==='secondo'}
  function recentPenalty(r){
    let p=0;(st.registro||[]).forEach(x=>{
      const d=diffGiorni(x.data);if(d>10)return;
      if((x.ricetta_id&&x.ricetta_id===r.id)||N(x.consumato)===N(r.nome))p-=d<=1?180:d<=3?55:d<=7?18:5;
    });return p;
  }
  function pantryBonus(r){
    const pan=(st.dispensa||[]).map(x=>N(x.nome)),ing=(r.ingredienti||[]).filter(x=>!['sale','pepe','olio','acqua'].includes(N(x)));
    if(!ing.length)return 0;return Math.round(12*ing.filter(i=>pan.some(p=>p.includes(N(i))||N(i).includes(p))).length/ing.length);
  }
  function familyScore(r){
    let s=55+recentPenalty(r)+pantryBonus(r)+(hash(oggiISO()+'|'+r.id)%13);
    const c=N(r.categoria);if(c==='pesce'||c==='legumi'||c==='verdura')s+=8;
    (st.membri||[]).forEach(m=>{if((m.preferiti||[]).includes(r.id))s+=7});
    if((r.tags||[]).map(N).includes('famiglia'))s+=5;
    return s;
  }
  function familyRank(){
    return RICETTE.filter(mealReady).map(r=>({r,s:familyScore(r)})).sort((a,b)=>b.s-a.s||a.r.minuti-b.r.minuti);
  }
  function miglioraConsiglio118(){
    const box=document.getElementById('consigliGiorno');if(!box)return;
    const rank=familyRank();if(!rank.length)return;
    const key=oggiISO(),i=Math.abs(Number(st.v118ConsiglioIndice[key]||0))%Math.min(rank.length,30),pick=rank[i];
    let card=[...box.querySelectorAll('.card.hero')].find(x=>/piatto del giorno per la famiglia/i.test(x.textContent));
    if(!card){
      card=document.createElement('div');card.className='card hero';
      const rule=box.querySelector('.v114-rule');if(rule)rule.insertAdjacentElement('afterend',card);else box.prepend(card);
    }
    card.innerHTML='<div class="row between"><div><h3>🍽️ Piatto del giorno per la famiglia</h3><div class="meta">La graduatoria cambia con il giorno, i pasti registrati, la dispensa e i preferiti.</div></div><span class="pill">'+Math.max(0,Math.min(100,pick.s))+'/100</span></div>'+ '<div class="recipe-title" style="margin-top:11px">'+H(pick.r.nome)+' · '+H(pick.r.variante||'')+'</div>'+ '<div class="meta">'+pick.r.minuti+' minuti · '+H(pick.r.difficolta)+'</div>'+ '<div class="shop-actions"><button class="btn small" onclick="openRecipe(\''+pick.r.id+'\')">Apri ricetta</button><button class="btn small secondary" onclick="segnaMangiato113(\''+pick.r.id+'\')">✓ Segna mangiato</button><button class="btn small soft" onclick="altroConsiglio118()">🔄 Un altro consiglio</button></div>';
    const rule=box.querySelector('.v114-rule');
    if(rule){
      const acts=rule.querySelector('.v114-actions');
      if(acts)acts.innerHTML='<button class="v114-action" onclick="showScreenById(\'registro\')"><b>📝</b>Registra i pasti</button><button class="v114-action" onclick="vaiMenuBase114()"><b>🗓️</b>Menu</button>';
    }
  }
  window.altroConsiglio118=function(){
    const k=oggiISO();st.v118ConsiglioIndice[k]=Number(st.v118ConsiglioIndice[k]||0)+1;save();
    if(typeof window.renderConsigli==='function')window.renderConsigli();
  };
  const renderConsigliPre118=window.renderConsigli;
  if(typeof renderConsigliPre118==='function')window.renderConsigli=function(){renderConsigliPre118();miglioraConsiglio118()};

  // MENU BASE: primo + secondo + contorno, con rigenerazione.
  st.v118MenuCompleto=st.v118MenuCompleto||{};
  st.v118MenuCounter=Number(st.v118MenuCounter||0);
  const pools=()=>({
    primo:RICETTE.filter(r=>ruolo(r)==='primo'),
    secondo:RICETTE.filter(r=>ruolo(r)==='secondo'),
    contorno:RICETTE.filter(r=>ruolo(r)==='contorno')
  });
  function scegli118(arr,key,exclude=[]){
    const ex=new Set(exclude),ok=arr.filter(r=>!ex.has(r.id));
    const rank=ok.map(r=>({r,s:recentPenalty(r)+(hash(key+'|'+r.id)%1000)+(r.minuti<=45?80:0)})).sort((a,b)=>b.s-a.s);
    return rank[0]?.r||ok[0]||null;
  }
  function generaPasto118(g,p,force=true){
    const ps=pools(),counter=++st.v118MenuCounter,key=oggiISO()+'|'+g+'|'+p+'|'+counter;
    let old=null;if(!force){const oid=st.settimana?.[g]?.[p];old=RICETTE.find(r=>r.id===oid)}
    let primo=old&&ruolo(old)==='primo'?old:scegli118(ps.primo,key+'|primo');
    let secondo=old&&ruolo(old)==='secondo'?old:scegli118(ps.secondo,key+'|secondo',[primo?.id]);
    let contorno=scegli118(ps.contorno,key+'|contorno',[primo?.id,secondo?.id]);
    const item={primo:primo?.id||'',secondo:secondo?.id||'',contorno:contorno?.id||''};
    st.v118MenuCompleto[g]=st.v118MenuCompleto[g]||{};st.v118MenuCompleto[g][p]=item;
    st.settimana=st.settimana||{};st.settimana[g]=st.settimana[g]||{};if(primo)st.settimana[g][p]=primo.id;
    return item;
  }
  function ensurePasto118(g,p){return st.v118MenuCompleto?.[g]?.[p]||generaPasto118(g,p,false)}
  window.cambiaPasto118=function(g,p){generaPasto118(g,p,true);save();renderSettimana();toast('Nuovo '+p.toLowerCase()+' proposto')};
  window.cambiaGiorno118=function(g){generaPasto118(g,'Pranzo',true);generaPasto118(g,'Cena',true);save();renderSettimana();toast('Menu di '+g+' cambiato')};
  window.cambiaSettimana118=function(){
    if(!confirm('Generare un nuovo menu completo per tutta la settimana? Il registro dei pasti realmente mangiati non viene modificato.'))return;
    GIORNI.forEach(g=>{generaPasto118(g,'Pranzo',true);generaPasto118(g,'Cena',true)});save();renderSettimana();toast('Nuovo menu settimanale generato');
  };
  function recipe(id){return RICETTE.find(r=>r.id===id)}
  function roleLine(label,id){
    const r=recipe(id);if(!r)return '<div class="v118-role"><b>'+label+'</b><span class="meta">Nessuna proposta</span></div>';
    return '<div class="v118-role"><b>'+label+'</b><div><div class="recipe-title">'+H(r.nome)+'</div><div class="meta">'+r.minuti+' min · '+H(r.variante||'')+'</div></div><button class="btn small secondary" onclick="openRecipe(\''+r.id+'\')">Apri</button></div>';
  }
  window.registraMenu118=function(g,p){
    const m=ensurePasto118(g,p),ids=[m.primo,m.secondo,m.contorno].filter(Boolean);
    const data=oggiISO();
    ids.forEach((id,idx)=>{const r=recipe(id);if(r)(st.registro=st.registro||[]).push({id:'l'+Date.now()+idx+Math.random().toString(16).slice(2),data,pasto:p,consumato:r.nome,ricetta_id:r.id,member_id:'tutti',feedback:'positivo',categorie:[N(r.categoria),ruolo(r)]})});
    save();if(typeof renderRegistro==='function')renderRegistro();if(typeof renderConsigli==='function')renderConsigli();toast('Menu registrato come mangiato');
  };
  function renderBase118(){
    const out=document.getElementById('pianoGiorno');if(!out)return;
    const g=GIORNI.includes(st.giornoPlanner)?st.giornoPlanner:'Lunedì';
    const cards=['Pranzo','Cena'].map(p=>{const m=ensurePasto118(g,p);return '<div class="card"><div class="row between"><div><h3>'+p+'</h3><div class="meta">Proposta completa: primo + secondo + contorno</div></div><button class="btn small soft" onclick="cambiaPasto118(\''+g+'\',\''+p+'\')">🔄 Cambia '+p.toLowerCase()+'</button></div><div class="v118-meal">'+roleLine('Primo',m.primo)+roleLine('Secondo',m.secondo)+roleLine('Contorno',m.contorno)+'</div><button class="btn full secondary" style="margin-top:10px" onclick="registraMenu118(\''+g+'\',\''+p+'\')">✓ Fatto / registra pasto</button></div>'}).join('');
    out.innerHTML='<div class="v118-menu-top"><button class="btn fullrow" onclick="showScreenById(\'registro\')">📝 Registra i pasti</button><button class="btn secondary" onclick="cambiaGiorno118(\''+g+'\')">🔄 Cambia menu giornaliero</button><button class="btn secondary" onclick="cambiaSettimana118()">🔄 Cambia menu settimanale</button></div>'+cards;
  }

  // DIETA SIMONA: quantità e alternative direttamente nelle righe.
  const ALT_BASE={
    'Lunedì':{Spuntino:1,Merenda:1},'Martedì':{Spuntino:2,Merenda:2},'Mercoledì':{Spuntino:1,Merenda:4},
    'Giovedì':{Spuntino:2,Merenda:3},'Venerdì':{Spuntino:1,Merenda:1},'Sabato':{Spuntino:2,Merenda:2},'Domenica':{Spuntino:1,Merenda:4}
  };
  const DAY_Q={
    'Lunedì':{Pranzo:'Mozzarella 100 g · verdure q.b.',Cena:'Merluzzo 150 g · pane 70 g · verdure q.b.'},
    'Martedì':{Pranzo:'Pollo 120 g · zucchine q.b.',Cena:'2 uova · pane 70 g (oppure pasta 60 g con verdure) · verdure q.b.'},
    'Mercoledì':{Pranzo:'Carne di manzo 120 g · verdure q.b.',Cena:'Orzo o farro 60 g · piselli 120 g · verdure q.b.'},
    'Giovedì':{Pranzo:'Bresaola 50 g · 6 Fiori d’acqua · verdure q.b.',Cena:'Orata 150 g · 6 Fiori d’acqua · verdure q.b.'},
    'Venerdì':{Pranzo:'Ceci 120 g · 2 gallette · verdure q.b.',Cena:'2 uova · 3 gallette · verdure q.b.'},
    'Sabato':{Pranzo:'Gnocchi di patate 120 g · mozzarella 100 g · verdure q.b.',Cena:'Branzino 150 g · verdure q.b.'},
    'Domenica':{Pranzo:'Riso 60 g · tonno 150 g · verdure/condimenti q.b.',Cena:'Carne di manzo 120 g · carote q.b.'}
  };
  function snackText118(g){
    st.simonaAlternative=st.simonaAlternative||{};st.simonaAlternative[g]=st.simonaAlternative[g]||ALT_BASE[g];
    st.simonaScelteDettaglio117=st.simonaScelteDettaglio117||{};st.simonaScelteDettaglio117[g]=st.simonaScelteDettaglio117[g]||{spuntinoBase:'yogurt',merendaFrutta:'frutto_medio'};
    const n=Number(st.simonaAlternative[g].Spuntino||ALT_BASE[g].Spuntino),d=st.simonaScelteDettaglio117[g];
    const base=d.spuntinoBase==='kefir'?'Kefir 300 g':'Yogurt greco 5% 150 g';
    return base+(n===2?' + frutta secca 20 g':' + cioccolato fondente 80–85% 20 g');
  }
  function merendaText118(g){
    st.simonaAlternative=st.simonaAlternative||{};st.simonaAlternative[g]=st.simonaAlternative[g]||ALT_BASE[g];
    st.simonaScelteDettaglio117=st.simonaScelteDettaglio117||{};st.simonaScelteDettaglio117[g]=st.simonaScelteDettaglio117[g]||{spuntinoBase:'yogurt',merendaFrutta:'frutto_medio'};
    const n=Number(st.simonaAlternative[g].Merenda||ALT_BASE[g].Merenda),d=st.simonaScelteDettaglio117[g];
    const fruit={frutto_medio:'1 frutto medio',frutti_piccoli:'2 frutti piccoli',frutti_bosco:'frutti di bosco 100 g',frutta_stagione:'frutta di stagione 150 g'}[d.merendaFrutta]||'1 frutto medio';
    const add={1:'Grana/Parmigiano 20 g',2:'olive verdi giganti 60 g',3:'cioccolato fondente 15 g',4:'frutta secca 15 g'}[n]||'Grana/Parmigiano 20 g';
    return fruit+' + '+add;
  }
  window.apriCambiaAlternativa118=function(g,p){
    st.simonaAlternative=st.simonaAlternative||{};st.simonaAlternative[g]=st.simonaAlternative[g]||{...ALT_BASE[g]};
    st.simonaScelteDettaglio117=st.simonaScelteDettaglio117||{};st.simonaScelteDettaglio117[g]=st.simonaScelteDettaglio117[g]||{spuntinoBase:'yogurt',merendaFrutta:'frutto_medio'};
    const a=st.simonaAlternative[g],d=st.simonaScelteDettaglio117[g];
    if(p==='Spuntino')openModal('Cambia spuntino · '+g,'<label>Alternativa</label><select id="v118Alt" class="search"><option value="1" '+(a.Spuntino==1?'selected':'')+'>Alternativa 1 · cioccolato 20 g</option><option value="2" '+(a.Spuntino==2?'selected':'')+'>Alternativa 2 · frutta secca 20 g</option></select><label style="display:block;margin-top:10px">Base</label><select id="v118Base" class="search"><option value="yogurt" '+(d.spuntinoBase==='yogurt'?'selected':'')+'>Yogurt greco 150 g</option><option value="kefir" '+(d.spuntinoBase==='kefir'?'selected':'')+'>Kefir 300 g</option></select><button class="btn full" style="margin-top:12px" onclick="salvaAlternativa118(\''+g+'\',\'Spuntino\')">Salva</button>');
    else openModal('Cambia merenda · '+g,'<label>Alternativa</label><select id="v118Alt" class="search"><option value="1" '+(a.Merenda==1?'selected':'')+'>Alt 1 · Grana/Parmigiano 20 g</option><option value="2" '+(a.Merenda==2?'selected':'')+'>Alt 2 · olive 60 g</option><option value="3" '+(a.Merenda==3?'selected':'')+'>Alt 3 · cioccolato 15 g</option><option value="4" '+(a.Merenda==4?'selected':'')+'>Alt 4 · frutta secca 15 g</option></select><label style="display:block;margin-top:10px">Frutta</label><select id="v118Base" class="search"><option value="frutto_medio" '+(d.merendaFrutta==='frutto_medio'?'selected':'')+'>1 frutto medio</option><option value="frutti_piccoli" '+(d.merendaFrutta==='frutti_piccoli'?'selected':'')+'>2 frutti piccoli</option><option value="frutti_bosco" '+(d.merendaFrutta==='frutti_bosco'?'selected':'')+'>Frutti di bosco 100 g</option><option value="frutta_stagione" '+(d.merendaFrutta==='frutta_stagione'?'selected':'')+'>Frutta di stagione 150 g</option></select><button class="btn full" style="margin-top:12px" onclick="salvaAlternativa118(\''+g+'\',\'Merenda\')">Salva</button>');
  };
  window.salvaAlternativa118=function(g,p){
    const alt=Number(document.getElementById('v118Alt')?.value||1),base=document.getElementById('v118Base')?.value;
    st.simonaAlternative[g]=st.simonaAlternative[g]||{};st.simonaAlternative[g][p]=alt;
    st.simonaScelteDettaglio117[g]=st.simonaScelteDettaglio117[g]||{};
    if(p==='Spuntino')st.simonaScelteDettaglio117[g].spuntinoBase=base||'yogurt';else st.simonaScelteDettaglio117[g].merendaFrutta=base||'frutto_medio';
    save();closeModal();renderSettimana();toast(p+' di '+g+' aggiornato');
  };
  window.registraTestoDieta118=function(g,p,testo){
    (st.registro=st.registro||[]).push({id:'l'+Date.now()+Math.random().toString(16).slice(2),data:oggiISO(),pasto:p,consumato:testo,member_id:sid,feedback:'positivo',categorie:[]});
    save();if(typeof renderRegistro==='function')renderRegistro();if(typeof renderConsigli==='function')renderConsigli();toast('Pasto di Simona registrato');
  };
  function dietRow(p,text,qty,g,change){
    return '<div class="v118-diet-row"><div class="row between"><div style="flex:1"><div class="tiny"><b>'+p.toUpperCase()+'</b></div><div class="recipe-title">'+H(text)+'</div>'+(qty?'<div class="v118-qty">'+H(qty)+'</div>':'')+'</div>'+(change?'<button class="btn small soft" onclick="apriCambiaAlternativa118(\''+g+'\',\''+p+'\')">Cambia</button>':'')+'</div><div class="shop-actions"><button class="btn small secondary" onclick="registraTestoDieta118(\''+g+'\',\''+p+'\',decodeURIComponent(\''+encodeURIComponent(text).replace(/'/g,"%27")+'\'))">✓ Fatto</button></div></div>';
  }
  function renderSimona118(){
    const out=document.getElementById('pianoGiorno');if(!out)return;
    const g=GIORNI.includes(st.giornoPlanner)?st.giornoPlanner:'Lunedì',plan=st.pianiPersona?.[sid],day=plan?.settimana?.[g]||{};
    const col='Caffè senza zucchero q.b. + latte parzialmente scremato 100 g',sp=snackText118(g),me=merendaText118(g);
    out.innerHTML='<div class="v118-menu-top"><button class="btn fullrow" onclick="showScreenById(\'registro\')">📝 Registra i pasti</button><button class="btn secondary" onclick="compraDietaGiorno117(\''+g+'\')">🛒 Compra tutto '+H(g)+'</button><button class="btn secondary" onclick="compraDietaSettimana117()">🛒 Compra tutta la dieta</button><button class="btn secondary fullrow" onclick="apriRiepilogoDieta117()">📦 Quantità totali dieta</button></div>'+ '<div class="card hero"><div class="row between"><div><h3>Simona · '+H(g)+'</h3><div class="v114-plan-badge">DIETA INSERITA · PIANO PROFESSIONALE</div></div><button class="btn small secondary" onclick="dettagliSimona113()">Apri dieta</button></div></div>'+ '<div class="card">'+dietRow('Colazione',col,'Latte 100 g · caffè q.b.',g,false)+dietRow('Spuntino',sp,'Quantità già incluse nella riga',g,true)+dietRow('Pranzo',day.Pranzo||'—',DAY_Q[g]?.Pranzo||'',g,false)+dietRow('Merenda',me,'Quantità già incluse nella riga',g,true)+dietRow('Cena',day.Cena||'—',DAY_Q[g]?.Cena||'',g,false)+'<div class="meta" style="margin-top:10px"><b>Olio EVO: 20 g TOTALI al giorno</b>, non 20 g per pasto.</div></div>';
  }

  // MENU wrapper finale.
  const renderSettimanaPre118=window.renderSettimana;
  window.renderSettimana=function(){
    if(typeof renderSettimanaPre118==='function')renderSettimanaPre118();
    pulisciPlanner118();
    const help=document.getElementById('v114MenuHelp');if(help)help.remove();
    const alt=document.getElementById('v116AlternativeSimona');if(alt)alt.remove();
    const sec=document.getElementById('settimana');
    if(sec){
      let top=document.getElementById('v118MenuActionTop');
      if(!top){top=document.createElement('button');top.id='v118MenuActionTop';top.className='btn full';top.style.margin='0 0 12px';top.innerHTML='📝 Registra i pasti';top.onclick=()=>showScreenById('registro');const ctl=document.getElementById('v113DietCtl');if(ctl)ctl.insertAdjacentElement('afterend',top);else sec.prepend(top)}
    }
    const completa=st.v113?.modalitaMenu==='completa';
    if(!completa)renderBase118();
    else if(!st.v113?.membroDieta||st.v113.membroDieta===sid)renderSimona118();
    montaBack118();
  };

  // Barcode generico: riconosci tutto, ma avvisa prima della Dispensa.
  const azioneScanPre118=window.azioneScansioneProdotto117;
  if(typeof azioneScanPre118==='function')window.azioneScansioneProdotto117=function(azione){
    const p=window.__DALLA_SIMO_SCAN_PENDING__,tipo=N(p?.info?.tipo);
    if(azione==='dispensa'&&p?.info?.soloRiconoscimento&&tipo!=='food'){
      if(!confirm('Questo codice è stato riconosciuto come articolo non alimentare/generico. La Dispensa è pensata soprattutto per gli alimenti. Vuoi inserirlo comunque?'))return;
    }
    return azioneScanPre118(azione);
  };

  // Aggiorna testi informativi del ricettario al totale reale.
  function aggiornaInfo118(){
    const sub=document.querySelector('#ricette .sub');if(sub)sub.textContent='Archivio locale · '+RICETTE.length+' ricette/versioni';
    const info=document.getElementById('info');
    if(info){
      info.querySelectorAll('.card').forEach(c=>{
        if(/247 versioni di ricette/i.test(c.textContent)){
          const p=c.querySelector('.meta');if(p)p.innerHTML='<b>'+RICETTE.length+' ricette/versioni</b> nel catalogo attuale, con cucina italiana, specialità regionali, cucina mediterranea, contorni, pesce e varianti comuni.';
        }
      });
    }
  }

  pulisciPlanner118();aggiornaInfo118();
  if(typeof window.renderSettimana==='function')window.renderSettimana();
  if(typeof window.renderConsigli==='function')window.renderConsigli();
  console.log('Dalla Simo v1.18 UX attiva');
}
boot118UI();
})();
