// Dalla Simo v1.14 — rende visibili menu/dieta/dispensa/registro e rafforza varieta
(function(){
'use strict';
function boot114(){
  if(typeof st==='undefined'||typeof RICETTE==='undefined'||typeof save!=='function'||typeof showScreenById!=='function'){
    return setTimeout(boot114,120);
  }
  const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const N=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
  const GIORNI=['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
  const oggiISO=()=>{const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),g=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${g}`};
  const diffGiorni=data=>{if(!data)return 999;const a=new Date(data+'T12:00:00'),b=new Date(oggiISO()+'T12:00:00');return Math.round((b-a)/86400000)};
  const simona=(st.membri||[]).find(m=>N(m.nome)==='simona');
  const sid=simona?.id||'m2';

  document.title='App Alimentazione — Dalla Simo v1.14';
  const sub=document.querySelector('.brand-subtitle');if(sub)sub.textContent='Alimentazione familiare · v1.14';

  if(!document.getElementById('v114css')){
    const s=document.createElement('style');s.id='v114css';s.textContent=`
      .nav{grid-template-columns:repeat(6,1fr)!important}
      .nav button{font-size:9px!important;padding:5px 0!important}
      .nav b{font-size:18px!important}
      .v114-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0 14px}
      .v114-action{border:1px solid var(--border);background:#fff;border-radius:15px;padding:11px 6px;text-align:center;font-size:11px;font-weight:800;color:var(--text)}
      .v114-action b{display:block;font-size:22px;margin-bottom:4px}
      .v114-rule{background:linear-gradient(135deg,#fff,#eef4ed);border:1px solid var(--border);border-radius:18px;padding:13px;margin-bottom:13px}
      .v114-rule strong{color:var(--green)}
      .v114-plan-badge{display:inline-block;font-size:10px;font-weight:900;letter-spacing:.04em;color:var(--green);background:var(--green3);padding:4px 7px;border-radius:999px;margin-top:5px}
      .v114-done{font-size:10px;font-weight:900;color:var(--green)}
      .v114-plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
      @media(max-width:420px){.v114-actions{grid-template-columns:repeat(3,1fr)}.v114-plan-grid{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  const nav=document.querySelector('.nav');
  if(nav && !nav.querySelector('[data-s="dispensa"]')){
    const fam=nav.querySelector('[data-s="famiglia"]');
    const b=document.createElement('button');b.dataset.s='dispensa';b.innerHTML='<b>🥫</b>Dispensa';b.onclick=function(){showScreen('dispensa',this)};
    nav.insertBefore(b,fam||null);
  }
  const menuBtn=nav?.querySelector('[data-s="settimana"]');if(menuBtn)menuBtn.innerHTML='<b>🗓️</b>Menu';

  function categorie(r){
    const z=[N(r.categoria),...(r.tags||[]).map(N)],ings=(r.ingredienti||[]).map(N).join(' '),nome=N(r.nome);
    if(/ceci|fagiol|lentic|pisell/.test(ings))z.push('legumi');
    if(/merluzz|orata|branzin|sogliol|tonno|salmone|sgombr|sard|pesce/.test(ings+' '+nome))z.push('pesce');
    if(/uov|frittata/.test(ings+' '+nome))z.push('uova');
    if(/zucchin|carot|brocc|spinac|finocch|verdura|pomodor|melanz|peperon|cetriol|insalat|biet|fagiolin/.test(ings+' '+nome))z.push('verdura');
    if(/pollo|tacchin|coniglio/.test(ings+' '+nome))z.push('carne_bianca');
    if(/manzo|vitello|maiale|suino|cavallo|carne rossa/.test(ings+' '+nome))z.push('carne_rossa');
    return [...new Set(z)];
  }
  function ultimoUguale(r,m){
    let min=999;
    (st.registro||[]).forEach(x=>{
      if(x.member_id&&x.member_id!=='tutti'&&x.member_id!==m.id)return;
      if((x.ricetta_id&&x.ricetta_id===r.id)||N(x.consumato)===N(r.nome))min=Math.min(min,diffGiorni(x.data));
    });
    return min;
  }
  function penalitaCategoria(r,m){
    const c=categorie(r);let p=0;
    (st.registro||[]).forEach(x=>{
      if(x.member_id&&x.member_id!=='tutti'&&x.member_id!==m.id)return;
      const d=diffGiorni(x.data);if(d>3)return;
      const xc=(x.categorie||[]).map(N);
      if(xc.some(k=>c.includes(k)))p-=d<=1?12:d<=2?7:3;
    });
    return p;
  }
  function coperturaDispensa(r){
    const p=(st.dispensa||[]).map(x=>N(x.nome));
    const ings=(r.ingredienti||[]).filter(i=>!['sale','pepe','olio','acqua'].includes(N(i)));
    if(!ings.length)return 0;
    const ok=ings.filter(i=>p.some(x=>x===N(i)||x.includes(N(i))||N(i).includes(x))).length;
    return Math.round(ok/ings.length*9);
  }
  function equilibrioGenerale(r){
    const c=categorie(r);let s=0;
    if(c.includes('verdura'))s+=8;
    if(c.includes('legumi'))s+=8;
    if(c.includes('pesce'))s+=8;
    if(c.includes('uova'))s+=4;
    if((r.tags||[]).includes('famiglia'))s+=3;
    return s;
  }
  function jitter(r){const str=oggiISO()+r.id;let h=0;for(let i=0;i<str.length;i++)h=(h*31+str.charCodeAt(i))>>>0;return h%7}
  function score(r,m){
    let s=50+equilibrioGenerale(r)+penalitaCategoria(r,m)+coperturaDispensa(r)+jitter(r);
    if((m.preferiti||[]).includes(r.id))s+=18;
    const d=ultimoUguale(r,m);if(d<=1)return -999; if(d<=3)s-=28; else if(d<=7)s-=10;
    if(r.minuti<=30)s+=3;
    return s;
  }
  function poolPasto(){return RICETTE.filter(r=>{const t=r.tags||[];return t.includes('pranzo')||t.includes('cena')||(!t.includes('colazione')&&!t.includes('spuntino')&&!t.includes('merenda')&&!t.includes('condimento')&&!t.includes('contorno'))})}
  function bestPer(m){
    const p=poolPasto();let a=p.map(r=>({r,s:score(r,m)})).filter(x=>x.s>-900).sort((a,b)=>b.s-a.s||a.r.minuti-b.r.minuti);
    if(!a.length)a=p.map(r=>({r,s:50+equilibrioGenerale(r)})).sort((a,b)=>b.s-a.s);
    return a[0];
  }
  function giornoOggi(){return GIORNI[new Date().getDay()]}
  function pianoSimonaOggi(){return st.pianiPersona?.[sid]?.settimana?.[giornoOggi()]||null}

  window.vaiRegistro114=()=>showScreenById('registro');
  window.vaiDispensa114=()=>showScreenById('dispensa');
  window.vaiMenuBase114=()=>{st.v113=st.v113||{};st.v113.modalitaMenu='base';save();showScreenById('settimana');if(typeof renderSettimana==='function')renderSettimana()};
  window.vaiDieta114=id=>{st.v113=st.v113||{};st.v113.modalitaMenu='completa';st.v113.membroDieta=id;save();showScreenById('settimana');if(typeof renderSettimana==='function')renderSettimana()};

  window.renderConsigli=function(){
    const box=document.getElementById('consigliGiorno');if(!box)return;
    const membri=(st.membri||[]),best=membri.map(m=>({m,b:bestPer(m)}));
    const fam=poolPasto().map(r=>{
      const ss=membri.map(m=>score(r,m));if(ss.some(x=>x<=-900))return null;
      return {r,s:Math.round(Math.min(...ss)*.6+(ss.reduce((a,b)=>a+b,0)/Math.max(1,ss.length))*.4)};
    }).filter(Boolean).sort((a,b)=>b.s-a.s)[0];
    const intro='<div class="v114-rule"><strong>Come scelgo il piatto del giorno</strong><div class="meta">Preferiti + equilibrio alimentare generale + varietà recente + ciò che hai in dispensa. Una ricetta mangiata oggi o ieri viene esclusa dalla proposta del giorno successivo; anche le categorie ripetute troppo spesso vengono penalizzate.</div><div class="v114-actions"><button class="v114-action" onclick="vaiRegistro114()"><b>📝</b>Registro pasti</button><button class="v114-action" onclick="vaiMenuBase114()"><b>🗓️</b>Menu</button><button class="v114-action" onclick="vaiDispensa114()"><b>🥫</b>Dispensa</button></div></div>';
    const fc=fam?'<div class="card hero"><div class="row between"><div><h3>🍽️ Piatto del giorno per la famiglia</h3><div class="meta">Scelto per variare e non ripetere ciò che avete mangiato da poco</div></div><span class="pill">'+fam.s+'/100</span></div><div class="recipe-title" style="margin-top:11px">'+H(fam.r.nome)+' · '+H(fam.r.variante)+'</div><div class="meta">'+fam.r.minuti+' minuti · '+H(fam.r.difficolta)+'</div><div class="shop-actions"><button class="btn small" onclick="openRecipe(\''+fam.r.id+'\')">Apri ricetta</button><button class="btn small secondary" onclick="segnaMangiato113(\''+fam.r.id+'\')">✓ Segna mangiato</button></div></div>':'';
    const cards=best.map(({m,b})=>{
      if(m.id===sid&&st.pianiPersona?.[sid]?.stato==='inserita'){
        const d=pianoSimonaOggi()||{};
        return '<div class="card"><div class="row between"><div><h3>'+H(m.nome)+'</h3><div class="v114-plan-badge">DIETA INSERITA</div></div><span class="pill">Piano professionale</span></div><div class="meta" style="margin-top:8px"><b>'+H(giornoOggi())+'</b></div><div class="family"><div class="tiny">PRANZO</div><div class="recipe-title">'+H(d.Pranzo||'Vedi piano')+'</div></div><div class="family"><div class="tiny">CENA</div><div class="recipe-title">'+H(d.Cena||'Vedi piano')+'</div></div><button class="btn full secondary" onclick="vaiDieta114(\''+m.id+'\')">Apri dieta completa di Simona</button></div>';
      }
      if(!b)return '';
      const fav=(m.preferiti||[]).includes(b.r.id),disp=coperturaDispensa(b.r)>4;
      return '<div class="card"><div class="row between"><div><h3>'+H(m.nome)+'</h3><div class="meta">Consiglio personale</div></div><span class="pill">'+b.s+'/100</span></div><div class="recipe-title" style="margin-top:10px">'+H(b.r.nome)+' · '+H(b.r.variante)+'</div><div class="meta">'+(fav?'Preferito · ':'')+(disp?'compatibile con la dispensa · ':'')+'non mangiato di recente</div><div class="shop-actions"><button class="btn small soft" onclick="openRecipe(\''+b.r.id+'\')">Apri ricetta</button><button class="btn small secondary" onclick="segnaMangiato113(\''+b.r.id+'\')">✓ Segna mangiato</button></div></div>';
    }).join('');
    box.innerHTML=intro+fc+cards;
  };

  window.renderMembri=function(){
    const box=document.getElementById('membri');if(!box)return;
    box.innerHTML=(st.membri||[]).map(m=>{
      const p=st.pianiPersona?.[m.id];
      return '<div class="card"><div class="member"><div class="avatar">'+H(m.nome[0])+'</div><div style="flex:1"><h3>'+H(m.nome)+'</h3><div class="meta">'+H(m.eta)+' · '+(m.tipo==='adulto'?'adulto':'minore')+'</div>'+(p?'<div class="v114-plan-badge">DIETA INSERITA</div>':'')+'</div><span class="pill">'+((m.preferiti||[]).length)+' preferiti</span></div><p class="meta">'+(p?'Piano personale disponibile nel menu “Dieta completa”.':m.tipo==='adulto'?'Dieta personale da inserire.':'Consigli basati su varietà, preferiti e pasti registrati.')+'</p>'+(p?'<button class="btn full secondary" onclick="vaiDieta114(\''+m.id+'\')">Apri dieta</button>':'')+'</div>';
    }).join('')+'<div class="card"><h3>Strumenti famiglia</h3><div class="v114-actions"><button class="v114-action" onclick="showScreenById(\'registro\')"><b>📝</b>Registro pasti</button><button class="v114-action" onclick="showScreenById(\'dispensa\')"><b>🥫</b>Dispensa</button><button class="v114-action" onclick="vaiMenuBase114()"><b>🗓️</b>Menu</button></div></div>';
  };

  const renderSettimana113=window.renderSettimana;
  window.renderSettimana=function(){
    if(typeof renderSettimana113==='function')renderSettimana113();
    const sec=document.getElementById('settimana');if(!sec)return;
    const h1=sec.querySelector('h1');if(h1)h1.textContent='Menu settimanale';
    const sub=sec.querySelector('.sub');if(sub)sub.textContent='Scegli Menu base oppure Dieta completa per persona';
    let p=document.getElementById('v114MenuHelp');
    if(!p){p=document.createElement('div');p.id='v114MenuHelp';const ctl=document.getElementById('v113DietCtl');if(ctl)ctl.insertAdjacentElement('afterend',p);else sec.prepend(p)}
    p.innerHTML='<div class="v114-rule"><strong>Due modalità</strong><div class="meta"><b>Menu base:</b> pranzo e cena per la famiglia. <b>Dieta completa:</b> colazione, spuntino, pranzo, merenda e cena per la singola persona.</div><div class="v114-plan-grid"><button class="btn secondary" onclick="showScreenById(\'registro\')">📝 Apri registro pasti</button><button class="btn secondary" onclick="showScreenById(\'dispensa\')">🥫 Apri dispensa</button></div></div>';
  };

  function montaDispensa(){
    const sec=document.getElementById('dispensa');if(!sec||document.getElementById('v114PantryAction'))return;
    const d=document.createElement('div');d.id='v114PantryAction';d.className='card hero';
    d.innerHTML='<h3>🍲 Cucina con quello che hai</h3><div class="meta">Dalla Simo confronta gli alimenti presenti con gli ingredienti delle ricette e propone le più compatibili.</div><button class="btn full" style="margin-top:10px" onclick="ricettaDispensa113()">Trova ricetta dalla dispensa</button>';
    const first=sec.querySelector('.card');if(first)first.insertAdjacentElement('beforebegin',d);else sec.appendChild(d);
  }

  if(st.pianiPersona?.[sid]){
    const p=st.pianiPersona[sid];p.stato='inserita';p.tipo='professionale';p.titolo='Piano alimentare Simona';
    p.note_allegati=[
      'Colazione: caffè senza zucchero q.b. + latte parzialmente scremato 100 g.',
      'Spuntino: yogurt greco bianco intero 5% 150 g oppure kefir bianco da bere 300 g; abbinare 20 g di cioccolato fondente 80–85% oppure 20 g di frutta secca secondo l’alternativa.',
      'Pranzo: scegliere una proteina; carne 120 g, pesce 150 g, legumi 40 g secchi/120 g freschi, formaggio 100 g fresco/60 g stagionato, affettati 50 g, uova 2; aggiungere verdura q.b. e olio EVO secondo il quantitativo giornaliero.',
      'Merenda: 1 frutto medio oppure 2 piccoli oppure 100 g frutti di bosco oppure 150 g frutta di stagione da tagliare; abbinarvi, secondo alternativa, 20 g Grana/Parmigiano, 60 g olive verdi giganti con nocciolo, 15 g cioccolato fondente oppure 15 g frutta secca.',
      'Cena: scegliere un’alternativa di ogni colonna; carboidrati: pane 70 g, 5 gallette, patate 300 g, Fiori d’acqua 12–13 pezzi, pasta/riso/orzo/farro/grano saraceno 60 g, gnocchi di patate 120 g; proteine come a pranzo; aggiungere verdura q.b. e olio EVO.',
      'Frequenze settimanali: carne magra 3 volte + carne rossa 1 volta; pesce 4; legumi 2; uova 2; affettati 1; formaggi freschi/stagionati 2.',
      'Quantitativo giornaliero di olio extravergine di oliva: 20 g, indicati nel piano come 4 cucchiaini oppure 2 cucchiai da minestra.',
      'Acqua: almeno 2 litri al giorno. Tisane e tè senza zucchero possono essere consumati liberamente.',
      'Non saltare i pasti. Pranzo e cena sono intercambiabili; anche spuntino e merenda.',
      'Pesare gli alimenti a crudo e al netto degli scarti. Conversioni indicate: pasta/riso 100 g crudi ≈ 250 g cotti; carne/pesce 100 g crudi ≈ 80 g cotti.',
      'Burro chiarificato: possibile occasionalmente in sostituzione dell’olio EVO, nelle stesse quantità.',
      'Variare il più possibile la scelta degli alimenti. Sale: meno di 5 g al giorno, circa 1 cucchiaino da caffè, considerando anche quello già presente negli alimenti.',
      'Pesce: massimo 1 volta a settimana salmone selvaggio; prediligere il pesce azzurro. Affettati indicati: prosciutto cotto, prosciutto crudo, bresaola. Formaggi freschi indicati: mozzarella, primosale, fiocchi di latte, ricotta.',
      'Nota del menu settimanale: è possibile suddividere il quantitativo dei carboidrati tra pranzo e cena purché non si superi il quantitativo giornaliero.'
    ];
  }

  window.dettagliSimona113=function(){
    const p=st.pianiPersona?.[sid];
    const note=p?.note_allegati||[];
    const week=p?.settimana||{};
    openModal('Piano alimentare Simona',
      '<div class="note"><b>Piano professionale inserito dagli allegati.</b><br>L’app lo organizza e lo rende operativo senza cambiare dosi, frequenze o regole indicate.</div>'+
      '<h3 style="margin-top:14px">Regole, quantità e alternative</h3><div class="v113-diet-detail"><ul>'+note.map(x=>'<li>'+H(x)+'</li>').join('')+'</ul></div>'+
      '<h3 style="margin-top:14px">Esempio di menu settimanale allegato</h3>'+Object.keys(week).map(g=>'<div class="family"><div class="recipe-title">'+H(g)+'</div><div class="meta">'+['Colazione','Spuntino','Pranzo','Merenda','Cena'].map(k=>'<b>'+k+':</b> '+H(week[g]?.[k]||'—')).join('<br>')+'</div></div>').join('')
    );
  };

  function ritoccaRicette(){
    const t=document.getElementById('v113Tempo');if(t){
      [...t.options].forEach(o=>{if(o.value==='flash')o.textContent='FLASH · 5–15 minuti';if(o.value==='veloci')o.textContent='VELOCI · 15–30 minuti'});
    }
    const d=document.getElementById('v113Diff');if(d){
      [...d.options].forEach(o=>{if(N(o.textContent)==='intermedia')o.textContent='Intermedio';if(N(o.textContent)==='avanzata')o.textContent='Avanzato'});
    }
    const tools=document.getElementById('v113RicetteTools');if(tools){
      const bs=tools.querySelectorAll('button');if(bs[0])bs[0].innerHTML='🥫 Ricetta con ciò che hai in dispensa';if(bs[1])bs[1].innerHTML='🔎 Trova ricette per ingredienti';
    }
  }
  const renderRicette113=window.renderRicette;
  window.renderRicette=function(){if(typeof renderRicette113==='function')renderRicette113();ritoccaRicette()};

  function montaRegistro(){
    const sec=document.getElementById('registro');if(!sec||document.getElementById('v114RegInfo'))return;
    const x=document.createElement('div');x.id='v114RegInfo';x.className='v114-rule';x.innerHTML='<strong>Perché registrare i pasti?</strong><div class="meta">Il pasto realmente consumato entra nella memoria dell’app. La stessa ricetta viene esclusa il giorno successivo e le categorie mangiate di recente vengono temporaneamente penalizzate per aumentare la varietà.</div>';
    const b=sec.querySelector('button');if(b)b.insertAdjacentElement('beforebegin',x);else sec.prepend(x);
  }

  const old=document.querySelector('#oggi .card.note');if(old)old.innerHTML='Il consiglio famiglia usa preferiti, pasti realmente registrati, varietà recente e dispensa. <b>Per Simona il piano professionale allegato è già inserito</b> e resta prioritario rispetto ai consigli generali.';

  montaDispensa();montaRegistro();
  if(typeof renderMembri==='function')renderMembri();
  if(typeof renderSettimana==='function')renderSettimana();
  if(typeof renderRicette==='function')renderRicette();
  if(typeof renderConsigli==='function')renderConsigli();
  if(typeof renderProfiliAlimentari==='function')renderProfiliAlimentari();
  save();
}
boot114();
})();
