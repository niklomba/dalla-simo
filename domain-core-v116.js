// Dalla Simo v1.16 — scanner, alternative dieta, preferiti, reset, ricette scartate e spesa riordinata
(function(){
'use strict';
function boot116(){
  if(typeof st==='undefined'||typeof RICETTE==='undefined'||typeof save!=='function'||typeof openModal!=='function'||typeof showScreenById!=='function'){
    return setTimeout(boot116,120);
  }
  const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const N=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
  const GIORNI=['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
  const SPUNTINI={
    1:'Yogurt greco bianco intero 5% 150 g oppure kefir bianco da bere 300 g + cioccolato fondente 80–85% 20 g',
    2:'Yogurt greco bianco intero 5% 150 g oppure kefir bianco da bere 300 g + frutta secca 20 g'
  };
  const MERENDE={
    1:'1 frutto medio oppure 2 piccoli oppure 100 g frutti di bosco oppure 150 g frutta di stagione + Grana Padano o Parmigiano Reggiano 20 g',
    2:'1 frutto medio oppure 2 piccoli oppure 100 g frutti di bosco oppure 150 g frutta di stagione + olive verdi giganti con nocciolo 60 g',
    3:'1 frutto medio oppure 2 piccoli oppure 100 g frutti di bosco oppure 150 g frutta di stagione + cioccolato fondente 15 g',
    4:'1 frutto medio oppure 2 piccoli oppure 100 g frutti di bosco oppure 150 g frutta di stagione + frutta secca 15 g'
  };
  const simona=(st.membri||[]).find(m=>N(m.nome)==='simona');
  const sid=simona?.id||'m2';

  document.title='App Alimentazione — Dalla Simo v1.16';
  const sub=document.querySelector('.brand-subtitle');if(sub)sub.textContent='Alimentazione familiare · v1.16';

  if(!document.getElementById('v116css')){
    const s=document.createElement('style');s.id='v116css';s.textContent=`
      .v116-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
      .v116-fav{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 0;border-top:1px solid var(--border)}
      .v116-reset{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
      .v116-scan{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
      .v116-scan video{border-radius:16px!important}
      .v116-alt{border:1px solid var(--border);background:#fff;border-radius:14px;padding:10px;margin:8px 0}
      .v116-alt select{margin-top:7px}
      .v116-discard{background:#fff3f1;color:var(--red);border:1px solid #efd2cf}
      .v116-excluded{display:inline-flex;gap:6px;align-items:center;padding:6px 8px;margin:3px;border-radius:999px;background:#fff3f1;color:var(--red);font-size:11px}
      .v116-shop-disp{font-size:10px;font-weight:900;color:var(--green);background:var(--green3);padding:3px 6px;border-radius:999px}
      #reader116{width:100%;min-height:220px;margin-top:10px}
      @media(max-width:420px){.v116-reset{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  // --- stato v1.16 ---
  st.preferitiAzzerati=st.preferitiAzzerati||{};
  st.ricetteScartate=st.ricetteScartate||{manuali:[],ingredienti:[],eccezioni:[]};
  st.ricetteScartate.manuali=st.ricetteScartate.manuali||[];
  st.ricetteScartate.ingredienti=st.ricetteScartate.ingredienti||[];
  st.ricetteScartate.eccezioni=st.ricetteScartate.eccezioni||[];
  st.simonaAlternative=st.simonaAlternative||{};
  st.codiciProdotto=st.codiciProdotto||{};

  // Se l'utente aveva azzerato i preferiti, impedisce ai vecchi seed dimostrativi di ricomparire al riavvio.
  (st.membri||[]).forEach(m=>{if(st.preferitiAzzerati[m.id])m.preferiti=[]});

  // --- ricette scartate: archivio master e filtro globale ---
  if(!window.__DALLA_SIMO_MASTER_116)window.__DALLA_SIMO_MASTER_116=RICETTE.slice();
  const MASTER=window.__DALLA_SIMO_MASTER_116;
  function matchIngrediente(r,term){
    term=N(term);if(!term)return false;
    return (r.ingredienti||[]).some(i=>N(i).includes(term)||term.includes(N(i))) || N(r.nome).includes(term);
  }
  function eScartata(r){
    const x=st.ricetteScartate;
    if((x.eccezioni||[]).includes(r.id))return false;
    if((x.manuali||[]).includes(r.id))return true;
    return (x.ingredienti||[]).some(t=>matchIngrediente(r,t));
  }
  function applicaScarti116(){
    const attive=MASTER.filter(r=>!eScartata(r));
    RICETTE.splice(0,RICETTE.length,...attive);
  }
  applicaScarti116();

  window.scartaRicetta116=function(id){
    const r=MASTER.find(x=>x.id===id);if(!r)return;
    if(!confirm('Scartare “'+r.nome+'”? Non verrà più proposta finché non la ripristini.'))return;
    if(!st.ricetteScartate.manuali.includes(id))st.ricetteScartate.manuali.push(id);
    st.ricetteScartate.eccezioni=st.ricetteScartate.eccezioni.filter(x=>x!==id);
    applicaScarti116();save();closeModal();
    if(typeof renderRicette==='function')renderRicette();if(typeof renderConsigli==='function')renderConsigli();if(typeof renderSettimana==='function')renderSettimana();
    renderScartate116();toast('Ricetta spostata nelle ricette scartate');
  };
  window.scartaIngrediente116=function(){
    const el=document.getElementById('v116IngredienteScarto');const t=N(el?.value);if(!t)return toast('Scrivi un ingrediente, per esempio ricotta');
    if(!confirm('Scartare automaticamente tutte le ricette che contengono “'+t+'”?'))return;
    if(!st.ricetteScartate.ingredienti.includes(t))st.ricetteScartate.ingredienti.push(t);
    if(el)el.value='';applicaScarti116();save();renderScartate116();if(typeof renderRicette==='function')renderRicette();if(typeof renderConsigli==='function')renderConsigli();toast('Regola di esclusione aggiunta');
  };
  window.ripristinaRicetta116=function(id){
    st.ricetteScartate.manuali=st.ricetteScartate.manuali.filter(x=>x!==id);
    if(!st.ricetteScartate.eccezioni.includes(id))st.ricetteScartate.eccezioni.push(id);
    applicaScarti116();save();renderScartate116();if(typeof renderRicette==='function')renderRicette();toast('Ricetta ripristinata');
  };
   window.rimuoviRegolaIngrediente116=function(t){
    st.ricetteScartate.ingredienti=st.ricetteScartate.ingredienti.filter(x=>x!==t);applicaScarti116();save();renderScartate116();if(typeof renderRicette==='function')renderRicette();
  };
  window.ripristinaTutteScartate116=function(){
    if(!confirm('Ripristinare TUTTE le ricette scartate e cancellare tutte le regole per ingrediente?'))return;
    st.ricetteScartate={manuali:[],ingredienti:[],eccezioni:[]};applicaScarti116();save();renderScartate116();if(typeof renderRicette==='function')renderRicette();if(typeof renderConsigli==='function')renderConsigli();toast('Tutte le ricette sono state ripristinate');
  };

  function montaScartate116(){
    const main=document.querySelector('main');if(!main||document.getElementById('scartate'))return;
    const sec=document.createElement('section');sec.id='scartate';sec.className='screen';sec.innerHTML=`
      <div class="sub">Archivio separato</div><h1>Ricette scartate</h1>
      <div class="card hero"><h3>Scarta per ingrediente</h3><div class="meta">Esempio: scrivi “ricotta” per non vedere più le ricette che la contengono.</div><div class="row" style="margin-top:10px"><input id="v116IngredienteScarto" class="search" placeholder="Es. ricotta" style="flex:1"><button class="btn danger" onclick="scartaIngrediente116()">Scarta</button></div><div id="v116RegoleScarto" style="margin-top:8px"></div></div>
      <div class="row between" style="margin:10px 0"><button class="btn secondary" onclick="showScreenById('ricette')">← Ricette</button><button class="btn danger" onclick="ripristinaTutteScartate116()">Ripristina tutte</button></div>
      <div id="v116ListaScartate"></div>`;
    main.appendChild(sec);
    const ric=document.getElementById('ricette');if(ric&&!document.getElementById('v116DiscardBar')){
      const b=document.createElement('div');b.id='v116DiscardBar';b.className='card';b.innerHTML='<div class="row between"><div><h3>⛔ Ricette scartate</h3><div class="meta">Nascondi ricette singole o tutte quelle con un ingrediente che non interessa.</div></div><button class="btn small secondary" onclick="showScreenById(\'scartate\');renderScartate116()"><span id="v116ScartiCount">0</span> Apri</button></div>';
      const h=ric.querySelector('h1');if(h)h.insertAdjacentElement('afterend',b);else ric.prepend(b);
    }
  }
  window.renderScartate116=function(){
    const list=document.getElementById('v116ListaScartate');if(!list)return;
    const rules=document.getElementById('v116RegoleScarto');
    if(rules)rules.innerHTML=(st.ricetteScartate.ingredienti||[]).map(t=>'<span class="v116-excluded">'+H(t)+' <button class="star" style="font-size:14px" onclick="rimuoviRegolaIngrediente116(\''+H(t)+'\')">×</button></span>').join('')||'<span class="tiny">Nessuna regola per ingrediente.</span>';
    const arr=MASTER.filter(eScartata);
    const c=document.getElementById('v116ScartiCount');if(c)c.textContent=arr.length;
    list.innerHTML=arr.length?arr.map(r=>'<div class="card"><div class="row between"><div><div class="recipe-title">'+H(r.nome)+' · '+H(r.variante)+'</div><div class="meta">'+r.minuti+' min · '+H(r.difficolta)+'</div></div><button class="btn small" onclick="ripristinaRicetta116(\''+r.id+'\')">Ripristina</button></div></div>').join(''):'<div class="card empty">Nessuna ricetta scartata.</div>';
  };
  montaScartate116();renderScartate116();

  // Aggiunge il comando Scarta alla scheda di ogni ricetta.
  const openRecipePre116=window.openRecipe;
  window.openRecipe=function(id){
    if(typeof openRecipePre116==='function')openRecipePre116(id);
    const mb=document.getElementById('mb');if(mb&&!document.getElementById('v116ScartaRicettaBtn')){
      const b=document.createElement('button');b.id='v116ScartaRicettaBtn';b.className='btn full danger';b.style.marginTop='12px';b.textContent='⛔ Scarta questa ricetta';b.onclick=()=>scartaRicetta116(id);mb.appendChild(b);
    }
  };

  // --- preferiti visibili/modificabili nel menu Famiglia ---
  const toggleFavPre116=window.toggleFav;
  window.toggleFav=function(idm,idr){
    if(st.preferitiAzzerati?.[idm])st.preferitiAzzerati[idm]=false;
    if(typeof toggleFavPre116==='function')toggleFavPre116(idm,idr);
    if(typeof renderMembri==='function')renderMembri();
  };
  window.rimuoviPreferito116=function(mid,rid){
    const m=(st.membri||[]).find(x=>x.id===mid);if(!m)return;m.preferiti=(m.preferiti||[]).filter(x=>x!==rid);if(!m.preferiti.length)st.preferitiAzzerati[mid]=true;save();renderMembri();if(typeof renderPreferiti==='function')renderPreferiti();if(typeof renderConsigli==='function')renderConsigli();
  };
  window.azzeraPreferiti116=function(mid){
    const m=(st.membri||[]).find(x=>x.id===mid);if(!m)return;if(!confirm('Azzerare tutti i preferiti di '+m.nome+'?'))return;m.preferiti=[];st.preferitiAzzerati[mid]=true;save();renderMembri();if(typeof renderPreferiti==='function')renderPreferiti();if(typeof renderConsigli==='function')renderConsigli();toast('Preferiti di '+m.nome+' azzerati');
  };
  window.azzeraTuttiPreferiti116=function(){
    if(!confirm('Azzerare i preferiti di TUTTA la famiglia?'))return;(st.membri||[]).forEach(m=>{m.preferiti=[];st.preferitiAzzerati[m.id]=true});save();renderMembri();if(typeof renderPreferiti==='function')renderPreferiti();if(typeof renderConsigli==='function')renderConsigli();toast('Tutti i preferiti sono stati azzerati');
  };

  window.resetRegistro116=function(){if(confirm('Azzerare tutto il registro dei pasti?')){st.registro=[];save();if(typeof renderRegistro==='function')renderRegistro();if(typeof renderConsigli==='function')renderConsigli();toast('Registro pasti azzerato')}};
  window.resetDispensa116=function(){if(confirm('Svuotare completamente dispensa e avanzi?')){st.dispensa=[];st.avanzi=[];save();if(typeof renderDispensa==='function')renderDispensa();toast('Dispensa azzerata')}};
  window.resetSpesa116=function(){if(confirm('Svuotare completamente la lista della spesa, compresi i comprati?')){st.spesa=[];save();if(typeof renderSpesa==='function')renderSpesa();toast('Lista spesa azzerata')}};
  window.resetCompleto116=function(){
    if(!confirm('Ripristinare TUTTA Dalla Simo ai dati iniziali? Questa operazione cancella preferiti, registro, dispensa, spesa, planner e impostazioni locali.'))return;
    if(!confirm('Conferma definitiva del ripristino completo?'))return;
    st=base();st.preferitiAzzerati={};(st.membri||[]).forEach(m=>st.preferitiAzzerati[m.id]=true);st.ricetteScartate={manuali:[],ingredienti:[],eccezioni:[]};save();location.reload();
  };

  window.renderMembri=function(){
    const box=document.getElementById('membri');if(!box)return;
    box.innerHTML=(st.membri||[]).map(m=>{
      const p=st.pianiPersona?.[m.id];const fav=(m.preferiti||[]).map(id=>MASTER.find(r=>r.id===id)).filter(Boolean);
      return '<div class="card"><div class="member"><div class="avatar">'+H(m.nome[0])+'</div><div style="flex:1"><h3>'+H(m.nome)+'</h3><div class="meta">'+H(m.eta)+' · '+(m.tipo==='adulto'?'adulto':'minore')+'</div>'+(p?'<div class="v114-plan-badge">DIETA INSERITA</div>':'')+'</div><span class="pill">'+fav.length+' preferiti</span></div>'+
      '<div style="margin-top:10px"><div class="v116-head"><b>Alimenti / ricette preferiti</b><button class="btn small danger" onclick="azzeraPreferiti116(\''+m.id+'\')">Azzera</button></div>'+
      (fav.length?fav.map(r=>'<div class="v116-fav"><div><div class="recipe-title">'+H(r.nome)+'</div><div class="tiny">'+H(r.variante)+(eScartata(r)?' · SCARTATA':'')+'</div></div><button class="btn small secondary" onclick="rimuoviPreferito116(\''+m.id+'\',\''+r.id+'\')">Rimuovi</button></div>').join(''):'<div class="empty">Nessun preferito.</div>')+'</div>'+
      (p?'<button class="btn full secondary" style="margin-top:10px" onclick="vaiDieta114(\''+m.id+'\')">Apri dieta</button>':'')+'</div>';
    }).join('')+
    '<div class="card"><h3>Strumenti famiglia</h3><div class="v114-actions"><button class="v114-action" onclick="showScreenById(\'registro\')"><b>📝</b>Registro pasti</button><button class="v114-action" onclick="showScreenById(\'dispensa\')"><b>🥫</b>Dispensa</button><button class="v114-action" onclick="vaiMenuBase114()"><b>🗓️</b>Menu</button></div></div>'+
    '<div class="card"><h3>Reset e manutenzione</h3><div class="meta">Ogni reset richiede conferma.</div><div class="v116-reset"><button class="btn secondary" onclick="azzeraTuttiPreferiti116()">Azzera tutti i preferiti</button><button class="btn secondary" onclick="resetRegistro116()">Azzera registro pasti</button><button class="btn secondary" onclick="resetDispensa116()">Azzera dispensa</button><button class="btn secondary" onclick="resetSpesa116()">Azzera spesa</button><button class="btn danger" onclick="ripristinaTutteScartate116()">Ripristina ricette scartate</button><button class="btn danger" onclick="resetCompleto116()">Reset completo app</button></div></div>';
  };

  // --- Dieta Simona: alternative esplicite e modificabili ---
  function numAlt(v,def){const m=String(v||'').match(/(?:alternativa|alt)\s*(\d+)/i);return m?Number(m[1]):def}
  function initAlternative116(){
    const week=st.pianiPersona?.[sid]?.settimana||{};
    GIORNI.forEach(g=>{st.simonaAlternative[g]=st.simonaAlternative[g]||{};if(!st.simonaAlternative[g].Spuntino)st.simonaAlternative[g].Spuntino=numAlt(week[g]?.Spuntino,1);if(!st.simonaAlternative[g].Merenda)st.simonaAlternative[g].Merenda=numAlt(week[g]?.Merenda,1)});
  }
  initAlternative116();
  window.cambiaAlternativaSimona116=function(g,pasto,n){st.simonaAlternative[g]=st.simonaAlternative[g]||{};st.simonaAlternative[g][pasto]=Number(n);save();if(typeof renderSettimana==='function')renderSettimana();toast(pasto+' di '+g+' aggiornata')};
  function selectAlt116(g,pasto,map){
    const n=st.simonaAlternative?.[g]?.[pasto]||1;
    return '<select class="search" onchange="cambiaAlternativaSimona116(\''+g+'\',\''+pasto+'\',this.value)">'+Object.keys(map).map(k=>'<option value="'+k+'" '+(Number(k)===Number(n)?'selected':'')+'>Alternativa '+k+' — '+H(map[k])+'</option>').join('')+'</select>';
  }
  function montaAlternativeMenu116(){
    const sec=document.getElementById('settimana');if(!sec)return;
    let box=document.getElementById('v116AlternativeSimona');
    const completa=st.v113?.modalitaMenu==='completa' && (!st.v113?.membroDieta||st.v113.membroDieta===sid);
    if(!completa){if(box)box.remove();return}
    const g=GIORNI.includes(st.giornoPlanner)?st.giornoPlanner:'Lunedì';
    if(!box){box=document.createElement('div');box.id='v116AlternativeSimona';const help=document.getElementById('v114MenuHelp');if(help)help.insertAdjacentElement('afterend',box);else sec.prepend(box)}
    box.innerHTML='<div class="card hero"><div class="row between"><div><h3>Simona · alternative di '+H(g)+'</h3><div class="v114-plan-badge">DIETA INSERITA</div></div><button class="btn small" onclick="dettagliSimona113()">Apri dieta</button></div><div class="v116-alt"><b>Spuntino</b>'+selectAlt116(g,'Spuntino',SPUNTINI)+'</div><div class="v116-alt"><b>Merenda</b>'+selectAlt116(g,'Merenda',MERENDE)+'</div><div class="grid2"><button class="btn" onclick="compraDietaGiorno116(\''+g+'\')">🛒 Compra tutto '+H(g)+'</button><button class="btn secondary" onclick="compraDietaSettimana116()">🛒 Compra tutta la dieta</button></div></div>';
  }

  function dispensaHa116(nome){const n=N(nome);return (st.dispensa||[]).some(x=>N(x.nome).includes(n)||n.includes(N(x.nome)))}
  const DIET_KEYS=[
    ['latte','Latte'],['caffe','Caffè'],['yogurt','Yogurt greco'],['kefir','Kefir'],['cioccolato','Cioccolato fondente'],['frutta secca','Frutta secca'],['frutto','Frutta'],['frutti di bosco','Frutti di bosco'],['grana','Grana Padano'],['parmigiano','Parmigiano Reggiano'],['olive','Olive verdi'],['mozzarella','Mozzarella'],['spinaci','Spinaci'],['olio evo','Olio EVO'],['merluzzo','Merluzzo'],['finocchi','Finocchi'],['pane','Pane'],['pollo','Pollo'],['zucchine','Zucchine'],['uova','Uova'],['pasta','Pasta'],['hamburger','Carne di manzo'],['carne rossa','Carne di manzo'],['orzo','Orzo'],['farro','Farro'],['piselli','Piselli'],['fagiolini','Fagiolini'],['bresaola','Bresaola'],['valeriana','Valeriana'],['pomodorini','Pomodorini'],["fiori d'acqua","Fiori d’acqua"],['orata','Orata'],['ceci','Ceci'],['gallette','Gallette'],['cetrioli','Cetrioli'],['gnocchi','Gnocchi'],['sugo di pomodoro','Sugo di pomodoro'],['branzino','Branzino'],['riso','Riso'],['tonno','Tonno'],['sottaceti','Sottaceti'],['barbabietola','Barbabietola'],['zafferano','Zafferano'],['sogliola','Sogliola'],['bistecca','Carne di manzo'],['manzo','Carne di manzo'],['carote','Carote']
  ];
  function ingredientiTesto116(text){
    const z=N(text),out=[];DIET_KEYS.forEach(([k,v])=>{if(z.includes(N(k))&&!out.includes(v))out.push(v)});return out;
  }
  function badgeDispensaTesto116(text){
    const presenti=ingredientiTesto116(text).filter(dispensaHa116);
    return presenti.length?'<div class="meta" style="margin-top:5px"><span class="v116-shop-disp">DISPENSA</span> '+presenti.map(H).join(', ')+'</div>':'';
  }
  function testoPasto116(g,pasto){
    if(pasto==='Spuntino')return SPUNTINI[st.simonaAlternative?.[g]?.Spuntino||1];
    if(pasto==='Merenda')return MERENDE[st.simonaAlternative?.[g]?.Merenda||1];
    if(pasto==='Colazione')return 'Caffè senza zucchero + latte parzialmente scremato 100 g';
    return st.pianiPersona?.[sid]?.settimana?.[g]?.[pasto]||'';
  }
  function aggiungiListaSpesa116(nomi,origine){
    let added=0,pantry=0;nomi.forEach(nome=>{if(dispensaHa116(nome)){pantry++;return}const n=N(nome);let ex=(st.spesa||[]).find(x=>x.stato==='da_comprare'&&(N(x.nome)===n||N(x.nome).includes(n)||n.includes(N(x.nome))));if(ex){if(!ex.origini.includes(origine))ex.origini.push(origine)}else{st.spesa.push({id:'s'+Date.now()+Math.random().toString(16).slice(2,6),nome,quantita:1,unita:'confezione',stato:'da_comprare',origini:[origine]});added++}});save();if(typeof renderSpesa==='function')renderSpesa();toast(added+' aggiunti alla spesa'+(pantry?' · '+pantry+' già in DISPENSA':''));
  }
  window.compraDietaGiorno116=function(g){const arr=[];['Colazione','Spuntino','Pranzo','Merenda','Cena'].forEach(p=>ingredientiTesto116(testoPasto116(g,p)).forEach(x=>{if(!arr.includes(x))arr.push(x)}));aggiungiListaSpesa116(arr,'Dieta Simona · '+g)};
  window.compraDietaSettimana116=function(){const arr=[];GIORNI.forEach(g=>['Colazione','Spuntino','Pranzo','Merenda','Cena'].forEach(p=>ingredientiTesto116(testoPasto116(g,p)).forEach(x=>{if(!arr.includes(x))arr.push(x)})));aggiungiListaSpesa116(arr,'Dieta Simona · settimana')};

  window.dettagliSimona113=function(){
    const p=st.pianiPersona?.[sid],week=p?.settimana||{};
    const daily=GIORNI.map(g=>'<div class="card"><div class="row between"><h3>'+H(g)+'</h3><button class="btn small" onclick="compraDietaGiorno116(\''+g+'\')">🛒 Compra tutto</button></div><div class="family"><b>Colazione:</b> Caffè senza zucchero q.b. + latte parzialmente scremato 100 g'+badgeDispensaTesto116('caffè latte')+'</div><div class="v116-alt"><b>Spuntino</b>'+selectAlt116(g,'Spuntino',SPUNTINI)+badgeDispensaTesto116(SPUNTINI[st.simonaAlternative?.[g]?.Spuntino||1])+'</div><div class="family"><b>Pranzo:</b> '+H(week[g]?.Pranzo||'—')+badgeDispensaTesto116(week[g]?.Pranzo||'')+'</div><div class="v116-alt"><b>Merenda</b>'+selectAlt116(g,'Merenda',MERENDE)+badgeDispensaTesto116(MERENDE[st.simonaAlternative?.[g]?.Merenda||1])+'</div><div class="family"><b>Cena:</b> '+H(week[g]?.Cena||'—')+badgeDispensaTesto116(week[g]?.Cena||'')+'</div></div>').join('');
    const notes=(p?.note_allegati||[]).map(x=>'<li>'+H(x)+'</li>').join('');
    openModal('Piano alimentare Simona','<div class="note"><b>DIETA INSERITA.</b> Piano professionale organizzato senza modificare le prescrizioni degli allegati.</div><div class="grid2" style="margin-top:10px"><button class="btn" onclick="compraDietaSettimana116()">🛒 Compra tutta la dieta</button><button class="btn secondary" onclick="showScreenById(\'spesa\');closeModal()">Apri spesa</button></div><h3 style="margin-top:14px">Alternative modificabili</h3><div class="meta">Spuntino e merenda mostrano sempre l’alimento previsto per l’alternativa selezionata.</div>'+daily+'<h3>Regole e quantità del piano</h3><ul>'+notes+'</ul>');
  };

  const renderSettimanaPre116=window.renderSettimana;
  window.renderSettimana=function(){if(typeof renderSettimanaPre116==='function')renderSettimanaPre116();montaAlternativeMenu116()};

  // --- Spesa: DA COMPRARE sopra, COMPRATI sotto ---
  function riordinaSpesa116(){
    const co=document.getElementById('cardComprati'),da=document.getElementById('listaDaComprare')?.closest('.card');if(!co||!da||!co.parentNode)return;
    if(da.nextElementSibling!==co)co.parentNode.insertBefore(da,co);
    const note=document.querySelector('#spesa .note');if(note)note.innerHTML='Gli ingredienti <b>Da comprare</b> sono mostrati sopra. Quando li tocchi vengono spostati sotto, nella sezione <b>Comprati</b>, dove possono essere cancellati.';
  }
  const renderSpesaPre116=window.renderSpesa;
  window.renderSpesa=function(){if(typeof renderSpesaPre116==='function')renderSpesaPre116();riordinaSpesa116();montaScannerButtons116()};

  // --- Scanner QR / codici a barre per Spesa e Dispensa ---
  let scanner116=null;
  function caricaScannerLib116(){
    if(window.Html5Qrcode)return Promise.resolve();
    return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  }
  async function fermaScanner116(){try{if(scanner116){await scanner116.stop();await scanner116.clear()}}catch(e){}scanner116=null}
  const closeModalPre116=window.closeModal;
  window.closeModal=function(){fermaScanner116();if(typeof closeModalPre116==='function')closeModalPre116()};
  window.apriScanner116=function(mode){
    const label=mode==='spesa'?'Spesa':'Dispensa';
    openModal('Scansiona prodotto · '+label,'<div class="note">Inquadra il QR code o, più spesso, il <b>codice a barre EAN</b> della confezione. Se il prodotto non viene riconosciuto puoi inserire il codice manualmente.</div><div id="reader116"></div><div class="row" style="margin-top:10px"><input id="codiceManuale116" class="search" inputmode="numeric" placeholder="Codice EAN/QR"><button class="btn" onclick="usaCodiceManuale116(\''+mode+'\')">Usa codice</button></div><div id="scannerMsg116" class="meta">Avvio fotocamera…</div>');
    caricaScannerLib116().then(async()=>{try{scanner116=new Html5Qrcode('reader116');await scanner116.start({facingMode:'environment'},{fps:10,qrbox:250},code=>{fermaScanner116();gestisciCodice116(code,mode)},()=>{});const m=document.getElementById('scannerMsg116');if(m)m.textContent='Fotocamera attiva: inquadra il codice.'}catch(e){const m=document.getElementById('scannerMsg116');if(m)m.textContent='Fotocamera non disponibile. Usa il campo manuale qui sopra.'}}).catch(()=>{const m=document.getElementById('scannerMsg116');if(m)m.textContent='Scanner non disponibile offline. Inserisci il codice manualmente.'});
  };
  window.usaCodiceManuale116=function(mode){const c=document.getElementById('codiceManuale116')?.value.trim();if(!c)return toast('Inserisci un codice');fermaScanner116();gestisciCodice116(c,mode)};
  async function nomeDaCodice116(code){
    if(st.codiciProdotto[code])return st.codiciProdotto[code];
    try{const r=await fetch('https://world.openfoodfacts.org/api/v2/product/'+encodeURIComponent(code)+'.json?fields=product_name,product_name_it,generic_name_it,brands',{cache:'no-store'});if(r.ok){const j=await r.json();const p=j.product||{};const n=(p.product_name_it||p.product_name||p.generic_name_it||'').trim();if(n){st.codiciProdotto[code]=n;save();return n}}}catch(e){}
    const n=prompt('Prodotto non riconosciuto. Scrivi il nome da associare a questo codice (es. Mozzarella):','');if(n&&n.trim()){st.codiciProdotto[code]=n.trim();save();return n.trim()}return null;
  }
  function trovaSpesaPerNome116(nome){const n=N(nome);return (st.spesa||[]).find(x=>x.stato==='da_comprare'&&(N(x.nome)===n||N(x.nome).includes(n)||n.includes(N(x.nome))||N(x.nome).split(' ').some(t=>t.length>3&&n.includes(t))))}
  window.gestisciCodice116=async function(code,mode){
    const nome=await nomeDaCodice116(code);if(!nome)return;
    if(mode==='spesa'){
      const x=trovaSpesaPerNome116(nome);
      if(x){x.stato='comprato';x.compratoIl=new Date().toISOString();save();closeModal();renderSpesa();toast(x.nome+' segnato come comprato');return}
      if(confirm('“'+nome+'” non è nella lista Da comprare. Vuoi aggiungerlo direttamente tra i Comprati?')){st.spesa.push({id:'s'+Date.now(),nome,quantita:1,unita:'confezione',stato:'comprato',origini:['Scansione codice '+code],compratoIl:new Date().toISOString()});save();closeModal();renderSpesa();toast('Prodotto aggiunto ai comprati')}
      return;
    }
    let x=(st.dispensa||[]).find(v=>N(v.nome)===N(nome)||N(v.nome).includes(N(nome))||N(nome).includes(N(v.nome)));
    if(x)x.quantita=Number(x.quantita||0)+1;else st.dispensa.push({id:'d'+Date.now(),nome,quantita:1,unita:'confezione',codice});
    save();closeModal();if(typeof renderDispensa==='function')renderDispensa();toast(nome+' aggiunto alla dispensa');
  };
  function montaScannerButtons116(){
    const sp=document.querySelector('#spesa .card.hero');if(sp&&!document.getElementById('scanSpesa116')){const b=document.createElement('button');b.id='scanSpesa116';b.className='btn full secondary';b.style.marginTop='10px';b.innerHTML='📷 Scansiona codice prodotto';b.onclick=()=>apriScanner116('spesa');sp.appendChild(b)}
    const dp=document.querySelector('#dispensa .card.hero');if(dp&&!document.getElementById('scanDispensa116')){const b=document.createElement('button');b.id='scanDispensa116';b.className='btn full secondary';b.style.marginTop='10px';b.innerHTML='📷 Scansiona e aggiungi in dispensa';b.onclick=()=>apriScanner116('dispensa');dp.appendChild(b)}
  }
  const renderDispensaPre116=window.renderDispensa;
  window.renderDispensa=function(){if(typeof renderDispensaPre116==='function')renderDispensaPre116();montaScannerButtons116()};

  // Aggiornamento filtri/contatori dopo gli scarti.
  const renderRicettePre116=window.renderRicette;
  window.renderRicette=function(){if(typeof renderRicettePre116==='function')renderRicettePre116();renderScartate116()};

  // Montaggio finale
  riordinaSpesa116();montaScannerButtons116();montaAlternativeMenu116();
  if(typeof renderMembri==='function')renderMembri();
  if(typeof renderRicette==='function')renderRicette();
  if(typeof renderSpesa==='function')renderSpesa();
  if(typeof renderDispensa==='function')renderDispensa();
  if(typeof renderSettimana==='function')renderSettimana();
  if(typeof renderConsigli==='function')renderConsigli();
  save();
  window.__DALLA_SIMO_BUILD__='v1.16';
  console.log('Dalla Simo v1.16 attiva');
}
boot116();
})();
