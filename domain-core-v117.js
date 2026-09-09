// Dalla Simo v1.17 — scarto per famiglia ricetta + acquisto dieta con quantità reali aggregate
(function(){
'use strict';
function boot117(){
  if(typeof st==='undefined'||typeof RICETTE==='undefined'||typeof save!=='function'||typeof openModal!=='function'){
    return setTimeout(boot117,120);
  }
  const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const N=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
  const GIORNI=['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
  const MASTER=window.__DALLA_SIMO_MASTER_116||RICETTE.slice();
  const simona=(st.membri||[]).find(m=>N(m.nome)==='simona');
  const sid=simona?.id||'m2';

  document.title='App Alimentazione — Dalla Simo v1.17';
  const sub=document.querySelector('.brand-subtitle');if(sub)sub.textContent='Alimentazione familiare · v1.17';

  // ---------- 1) SCARTO DI TUTTE LE RICETTE DELLO STESSO TIPO/FAMIGLIA ----------
  function ensureScarti117(){
    st.ricetteScartate=st.ricetteScartate||{};
    st.ricetteScartate.manuali=Array.isArray(st.ricetteScartate.manuali)?st.ricetteScartate.manuali:[];
    st.ricetteScartate.ingredienti=Array.isArray(st.ricetteScartate.ingredienti)?st.ricetteScartate.ingredienti:[];
    st.ricetteScartate.eccezioni=Array.isArray(st.ricetteScartate.eccezioni)?st.ricetteScartate.eccezioni:[];
    st.ricetteScartate.famiglie=Array.isArray(st.ricetteScartate.famiglie)?st.ricetteScartate.famiglie:[];
    st.ricetteScartate.singoleEsplicite=Array.isArray(st.ricetteScartate.singoleEsplicite)?st.ricetteScartate.singoleEsplicite:st.ricetteScartate.manuali.slice();
    return st.ricetteScartate;
  }
  ensureScarti117();

  function famKey(r){return String(r?.famiglia||N(r?.nome).replace(/[^a-z0-9]+/g,'_'))}
  function famLabel(key){const r=MASTER.find(x=>famKey(x)===key);return r?.nome||key.replace(/_/g,' ')}
  function matchIng(r,t){t=N(t);return (r.ingredienti||[]).some(i=>N(i).includes(t)||t.includes(N(i)))||N(r.nome).includes(t)}
  function scartata117(r){
    const x=st.ricetteScartate;
    if((x.eccezioni||[]).includes(r.id))return false;
    if((x.manuali||[]).includes(r.id))return true;
    if((x.famiglie||[]).includes(famKey(r)))return true;
    return (x.ingredienti||[]).some(t=>matchIng(r,t));
  }
  function applicaScarti117(){RICETTE.splice(0,RICETTE.length,...MASTER.filter(r=>!scartata117(r)))}
  applicaScarti117();

  // Registra i futuri scarti singoli come espliciti, così ripristinare una famiglia non li riattiva per errore.
  const scartaSingolaPre117=window.scartaRicetta116;
  if(typeof scartaSingolaPre117==='function'){
    window.scartaRicetta116=function(id){
      ensureScarti117();
      const prima=(st.ricetteScartate.manuali||[]).includes(id);
      scartaSingolaPre117(id);
      setTimeout(()=>{
        ensureScarti117();
        if(!prima&&(st.ricetteScartate.manuali||[]).includes(id)&&!st.ricetteScartate.singoleEsplicite.includes(id)){
          st.ricetteScartate.singoleEsplicite.push(id);save();
        }
      },50);
    };
  }

  window.scartaFamiglia117=function(id){
    ensureScarti117();
    const r=MASTER.find(x=>x.id===id);if(!r)return;
    const key=famKey(r),label=famLabel(key);
    const ids=MASTER.filter(x=>famKey(x)===key).map(x=>x.id);
    if(!confirm('Scartare TUTTE le ricette/versioni del tipo “'+label+'”? Potrai ripristinarle dalla sezione Ricette scartate.'))return;
    if(!st.ricetteScartate.famiglie.includes(key))st.ricetteScartate.famiglie.push(key);
    ids.forEach(x=>{if(!st.ricetteScartate.manuali.includes(x))st.ricetteScartate.manuali.push(x)});
    st.ricetteScartate.eccezioni=st.ricetteScartate.eccezioni.filter(x=>!ids.includes(x));
    applicaScarti117();save();closeModal();
    if(typeof renderRicette==='function')renderRicette();if(typeof renderConsigli==='function')renderConsigli();if(typeof renderSettimana==='function')renderSettimana();
    if(typeof renderScartate116==='function')renderScartate116();
    renderFamiglieScartate117();toast('Scartate tutte le versioni di '+label);
  };
  window.ripristinaFamiglia117=function(key){
    ensureScarti117();
    const label=famLabel(key);if(!confirm('Ripristinare il tipo “'+label+'”? Gli scarti singoli e le regole per ingrediente resteranno attivi.'))return;
    st.ricetteScartate.famiglie=st.ricetteScartate.famiglie.filter(x=>x!==key);
    const explicit=new Set(st.ricetteScartate.singoleEsplicite||[]);
    const ids=MASTER.filter(x=>famKey(x)===key).map(x=>x.id);
    st.ricetteScartate.manuali=st.ricetteScartate.manuali.filter(id=>!ids.includes(id)||explicit.has(id));
    applicaScarti117();save();if(typeof renderRicette==='function')renderRicette();if(typeof renderConsigli==='function')renderConsigli();if(typeof renderScartate116==='function')renderScartate116();renderFamiglieScartate117();toast('Tipo ripristinato');
  };
  const ripristinaTuttePre117=window.ripristinaTutteScartate116;
  if(typeof ripristinaTuttePre117==='function'){
    window.ripristinaTutteScartate116=function(){
      ripristinaTuttePre117();
      ensureScarti117();
      save();
      renderFamiglieScartate117();
    };
  }

  function renderFamiglieScartate117(){
    const host=document.getElementById('v117FamiglieScartate');if(!host)return;
    const arr=st.ricetteScartate.famiglie||[];
    host.innerHTML=arr.length?arr.map(k=>'<span class="v116-excluded">Tipo: '+H(famLabel(k))+' <button class="star" style="font-size:14px" onclick="ripristinaFamiglia117(\''+H(k)+'\')">×</button></span>').join(''):'<span class="tiny">Nessun tipo di ricetta escluso.</span>';
  }
  function montaFamiglieScartate117(){
    const sec=document.getElementById('scartate');if(!sec)return;
    if(!document.getElementById('v117FamiglieBox')){
      const box=document.createElement('div');box.id='v117FamiglieBox';box.className='card';box.innerHTML='<h3>Tipi di ricetta scartati</h3><div class="meta">Qui compaiono le famiglie/versioni di ricetta scartate in blocco.</div><div id="v117FamiglieScartate" style="margin-top:8px"></div>';
      const first=sec.querySelector('.card.hero');if(first)first.insertAdjacentElement('afterend',box);else sec.prepend(box);
    }
    renderFamiglieScartate117();
  }
  montaFamiglieScartate117();
  const renderScartatePre117=window.renderScartate116;
  if(typeof renderScartatePre117==='function')window.renderScartate116=function(){renderScartatePre117();montaFamiglieScartate117();renderFamiglieScartate117()};

  const openRecipePre117=window.openRecipe;
  window.openRecipe=function(id){
    if(typeof openRecipePre117==='function')openRecipePre117(id);
    const mb=document.getElementById('mb');const r=MASTER.find(x=>x.id===id);if(!mb||!r)return;
    if(!document.getElementById('v117ScartaFamigliaBtn')){
      const b=document.createElement('button');b.id='v117ScartaFamigliaBtn';b.className='btn full danger';b.style.marginTop='8px';b.textContent='⛔ Scarta tutte le versioni di questo tipo';b.onclick=()=>scartaFamiglia117(id);mb.appendChild(b);
    }
  };

  // ---------- 2) DIETA SIMONA: ALTERNATIVE BASE DEL PIANO + SCELTE OPERATIVE ----------
  const ALT_BASE={
    'Lunedì':{Spuntino:1,Merenda:1},'Martedì':{Spuntino:2,Merenda:2},'Mercoledì':{Spuntino:1,Merenda:4},
    'Giovedì':{Spuntino:2,Merenda:3},'Venerdì':{Spuntino:1,Merenda:1},'Sabato':{Spuntino:2,Merenda:2},'Domenica':{Spuntino:1,Merenda:4}
  };
  st.simonaAlternative=st.simonaAlternative||{};
  GIORNI.forEach(g=>{st.simonaAlternative[g]=st.simonaAlternative[g]||{};if(!st.simonaAlternative[g].Spuntino)st.simonaAlternative[g].Spuntino=ALT_BASE[g].Spuntino;if(!st.simonaAlternative[g].Merenda)st.simonaAlternative[g].Merenda=ALT_BASE[g].Merenda});
  st.simonaScelteDettaglio117=st.simonaScelteDettaglio117||{};
  GIORNI.forEach(g=>{st.simonaScelteDettaglio117[g]=st.simonaScelteDettaglio117[g]||{spuntinoBase:'yogurt',merendaFrutta:'frutto_medio'}});

  const SP_BASE={yogurt:{label:'Yogurt greco 150 g',nome:'Yogurt greco',q:150,u:'g'},kefir:{label:'Kefir 300 g',nome:'Kefir',q:300,u:'g'}};
  const FR_BASE={
    frutto_medio:{label:'1 frutto medio',nome:'Frutta',q:1,u:'pezzi'},
    frutti_piccoli:{label:'2 frutti piccoli',nome:'Frutta piccola',q:2,u:'pezzi'},
    frutti_bosco:{label:'Frutti di bosco 100 g',nome:'Frutti di bosco',q:100,u:'g'},
    frutta_stagione:{label:'Frutta di stagione 150 g',nome:'Frutta di stagione',q:150,u:'g'}
  };
  window.cambiaDettaglioSimona117=function(g,k,v){st.simonaScelteDettaglio117[g]=st.simonaScelteDettaglio117[g]||{};st.simonaScelteDettaglio117[g][k]=v;save();toast('Scelta di '+g+' aggiornata')};
  window.ripristinaAlternativeBase117=function(){
    if(!confirm('Ripristinare spuntini e merende come nell’esempio settimanale allegato?'))return;
    GIORNI.forEach(g=>{st.simonaAlternative[g]={Spuntino:ALT_BASE[g].Spuntino,Merenda:ALT_BASE[g].Merenda};st.simonaScelteDettaglio117[g]={spuntinoBase:'yogurt',merendaFrutta:'frutto_medio'}});save();if(typeof renderSettimana==='function')renderSettimana();toast('Alternative base ripristinate come da piano');
  };
  function dettagliScelteHtml117(g){
    const d=st.simonaScelteDettaglio117[g]||{};
    return '<div class="v116-alt"><b>Scelta quantità Spuntino</b><div class="tiny">Il piano consente yogurt oppure kefir. La base app usa la prima opzione e puoi cambiarla.</div><select class="search" onchange="cambiaDettaglioSimona117(\''+g+'\',\'spuntinoBase\',this.value)">'+Object.entries(SP_BASE).map(([k,v])=>'<option value="'+k+'" '+(d.spuntinoBase===k?'selected':'')+'>'+H(v.label)+'</option>').join('')+'</select></div>'+ 
      '<div class="v116-alt"><b>Scelta frutta Merenda</b><div class="tiny">Il piano consente quattro forme equivalenti di frutta. La base app usa 1 frutto medio.</div><select class="search" onchange="cambiaDettaglioSimona117(\''+g+'\',\'merendaFrutta\',this.value)">'+Object.entries(FR_BASE).map(([k,v])=>'<option value="'+k+'" '+(d.merendaFrutta===k?'selected':'')+'>'+H(v.label)+'</option>').join('')+'</select></div>';
  }
  function montaScelteQuantita117(){
    const box=document.getElementById('v116AlternativeSimona');if(!box)return;
    const g=GIORNI.includes(st.giornoPlanner)?st.giornoPlanner:'Lunedì';
    let x=document.getElementById('v117ScelteQuantita');if(!x){x=document.createElement('div');x.id='v117ScelteQuantita';box.appendChild(x)}
    x.innerHTML='<div class="card"><div class="row between"><div><h3>Quantità acquisto · '+H(g)+'</h3><div class="meta">Le alternative 1/2/3/4 seguono il piano. Qui scegli solo quale voce “oppure” usare per calcolare la spesa.</div></div><button class="btn small secondary" onclick="ripristinaAlternativeBase117()">Base allegato</button></div>'+dettagliScelteHtml117(g)+'</div>';
  }

  // ---------- 3) PIANO STRUTTURATO PER ACQUISTO: QUANTITÀ DAL PIANO ----------
  function qb(nome){return {nome,q:1,u:'q.b.'}}
  function q(nome,n,u='g'){return {nome,q:n,u}}
  const PASTI_BASE={
    'Lunedì':[q('Mozzarella',100),qb('Pomodori'),qb('Basilico'),qb('Spinaci'),q('Merluzzo',150),qb('Finocchi'),q('Pane',70)],
    'Martedì':[q('Pollo',120),qb('Zucchine'),q('Uova',2,'pezzi'),qb('Verdure per frittata'),q('Pane',70)],
    'Mercoledì':[q('Carne di manzo',120),qb('Spinaci'),q('Orzo o farro',60),q('Piselli',120),qb('Fagiolini')],
    'Giovedì':[q('Bresaola',50),qb('Valeriana'),qb('Pomodorini'),q('Fiori d’acqua',12,'pezzi'),q('Orata',150),qb('Finocchi')],
    'Venerdì':[q('Ceci',120),qb('Verdure miste'),q('Gallette',5,'pezzi'),q('Uova',2,'pezzi'),qb('Cetrioli')],
    'Sabato':[q('Gnocchi di patate',120),q('Mozzarella',100),qb('Sugo di pomodoro'),qb('Finocchi'),q('Branzino',150),qb('Verdure da grigliare')],
    'Domenica':[q('Riso',60),q('Tonno',150),qb('Sottaceti'),qb('Barbabietola'),q('Carne di manzo',120),qb('Carote')]
  };
  // Olio: il piano indica 20 g TOTALI al giorno, quindi non viene duplicato tra pranzo e cena.
  function snackItems117(g){
    const n=Number(st.simonaAlternative?.[g]?.Spuntino||ALT_BASE[g].Spuntino);
    const d=st.simonaScelteDettaglio117[g]||{};const base=SP_BASE[d.spuntinoBase]||SP_BASE.yogurt;
    const out=[q(base.nome,base.q,base.u)];
    if(n===1)out.push(q('Cioccolato fondente 80–85%',20));else out.push(q('Frutta secca',20));
    return out;
  }
  function merendaItems117(g){
    const n=Number(st.simonaAlternative?.[g]?.Merenda||ALT_BASE[g].Merenda);
    const d=st.simonaScelteDettaglio117[g]||{};const fr=FR_BASE[d.merendaFrutta]||FR_BASE.frutto_medio;
    const out=[q(fr.nome,fr.q,fr.u)];
    if(n===1)out.push(q('Grana Padano o Parmigiano Reggiano',20));
    if(n===2)out.push(q('Olive verdi giganti con nocciolo',60));
    if(n===3)out.push(q('Cioccolato fondente 80–85%',15));
    if(n===4)out.push(q('Frutta secca',15));
    return out;
  }
  function giornoItems117(g){
    return [q('Latte parzialmente scremato',100),qb('Caffè senza zucchero'),q('Olio extravergine di oliva',20),...snackItems117(g),...merendaItems117(g),...(PASTI_BASE[g]||[])];
  }
  function keyItem117(x){return N(x.nome)+'|'+x.u}
  function aggrega117(items){
    const m=new Map();items.forEach(x=>{const k=keyItem117(x);if(!m.has(k))m.set(k,{...x});else if(x.u!=='q.b.')m.get(k).q+=x.q});return [...m.values()];
  }
  function compatU117(a,b){a=String(a||'').toLowerCase();b=String(b||'').toLowerCase();if(a===b)return true;return [['g','kg'],['ml','l']].some(z=>z.includes(a)&&z.includes(b))}
  function conv117(qty,from,to){from=String(from||'').toLowerCase();to=String(to||'').toLowerCase();qty=Number(qty)||0;if(from===to)return qty;if(from==='kg'&&to==='g')return qty*1000;if(from==='g'&&to==='kg')return qty/1000;if(from==='l'&&to==='ml')return qty*1000;if(from==='ml'&&to==='l')return qty/1000;return NaN}
  function pantryMatch117(nome){const n=N(nome);return (st.dispensa||[]).find(x=>{const z=N(x.nome);return z===n||z.includes(n)||n.includes(z)})}
  function shopMatch117(nome,u){const n=N(nome);return (st.spesa||[]).find(x=>x.stato==='da_comprare'&&N(x.nome)===n&&compatU117(x.unita,u))}
  function pulisciVecchiaDietaGenerica117(){
    st.spesa=(st.spesa||[]).filter(x=>{
      const ori=x.origini||[];const soloDieta=ori.length&&ori.every(o=>String(o).startsWith('Dieta Simona'));
      return !(soloDieta&&String(x.unita)==='confezione');
    });
  }
  function aggiungiQuantitaSpesa117(items,origine){
    pulisciVecchiaDietaGenerica117();
    let aggiunti=0,coperti=0,parziali=0;
    aggrega117(items).forEach(it=>{
      let need=it.q;const pan=pantryMatch117(it.nome);let notaDisp='';
      if(pan){
        if(it.u==='q.b.'){coperti++;return}
        if(compatU117(pan.unita,it.u)){
          const avail=conv117(pan.quantita,pan.unita,it.u);
          if(Number.isFinite(avail)&&avail>=need){coperti++;return}
          if(Number.isFinite(avail)&&avail>0){need=Math.max(0,need-avail);parziali++;notaDisp=' · DISPENSA '+pan.quantita+' '+pan.unita}
        }else notaDisp=' · DISPENSA presente, quantità da verificare';
      }
      if(need<=0)return;
      let ex=shopMatch117(it.nome,it.u);
      if(ex){
        ex.quantitaOrigini=ex.quantitaOrigini||{};
        const old=Number(ex.quantitaOrigini[origine]||0);
        if(old)ex.quantita=Math.max(0,Number(ex.quantita||0)-old);
        const add=it.u==='q.b.'?1:need;
        ex.quantita=it.u==='q.b.'?1:Number(ex.quantita||0)+add;
        ex.quantitaOrigini[origine]=add;
        ex.origini=ex.origini||[];if(!ex.origini.includes(origine+notaDisp))ex.origini.push(origine+notaDisp);
      }else{
        const add=it.u==='q.b.'?1:need;
        st.spesa.push({id:'s'+Date.now()+Math.random().toString(16).slice(2,6),nome:it.nome,quantita:add,unita:it.u,stato:'da_comprare',origini:[origine+notaDisp],quantitaOrigini:{[origine]:add}});aggiunti++;
      }
    });
    save();if(typeof renderSpesa==='function')renderSpesa();toast('Dieta aggiornata in Spesa · '+aggiunti+' voci nuove'+(coperti?' · '+coperti+' coperte da DISPENSA':'')+(parziali?' · '+parziali+' quantità ridotte':'') );
  }
  const formatoPre117=window.formatoQuantita;
  if(typeof formatoPre117==='function')window.formatoQuantita=function(qt,u){if(u==='q.b.')return 'q.b.';return formatoPre117(qt,u)};

  window.compraDietaGiorno117=function(g){aggiungiQuantitaSpesa117(giornoItems117(g),'Dieta Simona · '+g+' · quantità v1.17')};
  window.compraDietaSettimana117=function(){aggiungiQuantitaSpesa117(GIORNI.flatMap(g=>giornoItems117(g)),'Dieta Simona · settimana · quantità v1.17')};
  // I pulsanti v1.16 già presenti chiamano questi nomi: li ricolleghiamo alla logica quantitativa v1.17.
  window.compraDietaGiorno116=window.compraDietaGiorno117;
  window.compraDietaSettimana116=window.compraDietaSettimana117;

  function riepilogoAcquisto117(){
    const items=aggrega117(GIORNI.flatMap(g=>giornoItems117(g)));
    const numeric=items.filter(x=>x.u!=='q.b.');
    return numeric.map(x=>'<div class="row between" style="padding:5px 0;border-bottom:1px solid var(--border)"><span>'+H(x.nome)+'</span><b>'+x.q+' '+H(x.u)+'</b></div>').join('');
  }
  window.apriRiepilogoDieta117=function(){openModal('Riepilogo quantità dieta Simona','<div class="note">Quantità aggregate secondo le alternative attualmente selezionate. Gli alimenti indicati q.b. nel piano restano q.b. e non vengono inventate quantità.</div>'+riepilogoAcquisto117()+'<button class="btn full" style="margin-top:12px" onclick="compraDietaSettimana117();closeModal()">🛒 Compra tutta la dieta con queste quantità</button>')};

  // Augment menu after v1.16 rendering
  const renderSettimanaPre117=window.renderSettimana;
  window.renderSettimana=function(){if(typeof renderSettimanaPre117==='function')renderSettimanaPre117();montaScelteQuantita117();const box=document.getElementById('v116AlternativeSimona');if(box&&!document.getElementById('v117RiepBtn')){const b=document.createElement('button');b.id='v117RiepBtn';b.className='btn full secondary';b.style.marginTop='8px';b.textContent='📦 Vedi quantità totali della dieta';b.onclick=apriRiepilogoDieta117;box.appendChild(b)}};
  try{window.renderSettimana()}catch(e){}

  // Augment Simona modal with explicit source-grounded note and weekly reset.
  const dettagliPre117=window.dettagliSimona113;
  if(typeof dettagliPre117==='function')window.dettagliSimona113=function(){dettagliPre117();const mb=document.getElementById('mb');if(!mb)return;const d=document.createElement('div');d.className='note';d.style.margin='10px 0';d.innerHTML='<b>Quantità acquisto:</b> il carrello somma le quantità numeriche del piano e usa le alternative selezionate giorno per giorno. Le voci indicate <b>q.b.</b> restano q.b. perché il piano non assegna un numero.<div class="grid2" style="margin-top:8px"><button class="btn secondary" onclick="ripristinaAlternativeBase117()">Ripristina alternative base</button><button class="btn secondary" onclick="apriRiepilogoDieta117()">Riepilogo quantità</button></div>';mb.insertBefore(d,mb.children[1]||null)};

  save();
  console.log('Dalla Simo v1.17 attiva');
}
boot117();
})();
