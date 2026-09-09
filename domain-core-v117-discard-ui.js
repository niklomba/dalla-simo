// Dalla Simo v1.17 — UX scarto ricette: scarto singolo diretto + scarto dei risultati correnti
(function(){
'use strict';
function bootDiscardUi117(){
  if(typeof st==='undefined'||typeof RICETTE==='undefined'||typeof save!=='function'||typeof renderRicette!=='function'){
    return setTimeout(bootDiscardUi117,120);
  }

  const N=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
  const MASTER=window.__DALLA_SIMO_MASTER_116||RICETTE.slice();

  const getScarti=()=>{
    st.ricetteScartate=st.ricetteScartate||{};
    st.ricetteScartate.manuali=Array.isArray(st.ricetteScartate.manuali)?st.ricetteScartate.manuali:[];
    st.ricetteScartate.ingredienti=Array.isArray(st.ricetteScartate.ingredienti)?st.ricetteScartate.ingredienti:[];
    st.ricetteScartate.eccezioni=Array.isArray(st.ricetteScartate.eccezioni)?st.ricetteScartate.eccezioni:[];
    st.ricetteScartate.famiglie=Array.isArray(st.ricetteScartate.famiglie)?st.ricetteScartate.famiglie:[];
    st.ricetteScartate.singoleEsplicite=Array.isArray(st.ricetteScartate.singoleEsplicite)?st.ricetteScartate.singoleEsplicite:st.ricetteScartate.manuali.slice();
    return st.ricetteScartate;
  };

  const famKey=r=>String(r?.famiglia||N(r?.nome).replace(/[^a-z0-9]+/g,'_'));
  const matchIngrediente=(r,t)=>{
    t=N(t);if(!t)return false;
    return (r.ingredienti||[]).some(i=>N(i).includes(t)||t.includes(N(i)))||N(r.nome).includes(t);
  };
  const eScartata=r=>{
    const x=getScarti();
    if(x.eccezioni.includes(r.id))return false;
    if(x.manuali.includes(r.id))return true;
    if(x.famiglie.includes(famKey(r)))return true;
    return x.ingredienti.some(t=>matchIngrediente(r,t));
  };
  const applicaScartiLocal117=()=>RICETTE.splice(0,RICETTE.length,...MASTER.filter(r=>!eScartata(r)));

  if(!document.getElementById('v117DiscardListCss')){
    const css=document.createElement('style');
    css.id='v117DiscardListCss';
    css.textContent=`
      .v117-list-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap;margin-left:8px}
      .v117-list-actions .btn{white-space:nowrap}
      .v117-result-batch{margin:10px 0 4px}
      @media(max-width:420px){.v117-list-actions{flex-direction:column;align-items:stretch;margin-left:6px}.v117-list-actions .btn{padding:7px 9px}}
    `;
    document.head.appendChild(css);
  }

  function idRicettaDaPulsante(openBtn){
    const code=openBtn?.getAttribute('onclick')||'';
    const m=code.match(/openRecipe\(\s*['\"]([^'\"]+)['\"]\s*\)/);
    return m?m[1]:null;
  }

  function registraScartoId117(id){
    const x=getScarti();
    if(!x.manuali.includes(id))x.manuali.push(id);
    if(!x.singoleEsplicite.includes(id))x.singoleEsplicite.push(id);
    x.eccezioni=x.eccezioni.filter(v=>v!==id);
  }

  function aggiornaDopoScarto117(){
    applicaScartiLocal117();
    save();
    if(typeof renderRicette==='function')renderRicette();
    if(typeof renderConsigli==='function')renderConsigli();
    if(typeof renderSettimana==='function')renderSettimana();
    if(typeof renderScartate116==='function')renderScartate116();
  }

  function montaScartaSuiRisultati117(){
    const host=document.getElementById('risultati');
    if(!host)return;
    host.querySelectorAll('.recipe').forEach(recipeRow=>{
      const row=recipeRow.querySelector('.row.between')||recipeRow;
      let actions=row.querySelector('.v117-list-actions');
      let openBtn=actions?.querySelector('button[onclick*="openRecipe"]')||row.querySelector('button[onclick*="openRecipe"]');
      if(!openBtn)return;
      const id=idRicettaDaPulsante(openBtn);
      if(!id)return;

      if(!actions){
        actions=document.createElement('div');
        actions.className='v117-list-actions';
        row.appendChild(actions);
        actions.appendChild(openBtn);
      }
      if(actions.querySelector('[data-v117-discard-id="'+id+'"]'))return;

      const b=document.createElement('button');
      b.type='button';
      b.className='btn small danger';
      b.dataset.v117DiscardId=id;
      b.textContent='⛔ Scarta';
      b.setAttribute('aria-label','Scarta questa ricetta');
      b.onclick=ev=>{
        ev.preventDefault();
        ev.stopPropagation();
        if(typeof window.scartaRicetta116==='function')window.scartaRicetta116(id);
      };
      actions.insertBefore(b,openBtn);
    });
  }

  // Il motore di ricerca base indicizza già nome, famiglia e ingredienti.
  // Dopo ogni render aggiungiamo lo scarto singolo direttamente sulla riga trovata.
  const renderRicettePreDiscard117=window.renderRicette;
  window.renderRicette=function(){
    renderRicettePreDiscard117();
    montaScartaSuiRisultati117();
  };
  montaScartaSuiRisultati117();

  // --- schermata "Trova ricette per ingredienti": scarto singolo + scarto di tutti i risultati visibili ---
  function idsRisultatiIngredienti117(){
    const out=document.getElementById('v113IngOut');if(!out)return [];
    return [...new Set([...out.querySelectorAll('button[onclick*="openRecipe"]')].map(idRicettaDaPulsante).filter(Boolean))];
  }

  function montaScartiIngredienti117(){
    const out=document.getElementById('v113IngOut');if(!out)return;
    const ids=idsRisultatiIngredienti117();

    out.querySelectorAll('.family.row.between').forEach(row=>{
      let actions=row.querySelector('.v117-list-actions');
      let openBtn=actions?.querySelector('button[onclick*="openRecipe"]')||row.querySelector('button[onclick*="openRecipe"]');
      if(!openBtn)return;
      const id=idRicettaDaPulsante(openBtn);if(!id)return;
      if(!actions){
        actions=document.createElement('div');
        actions.className='v117-list-actions';
        row.appendChild(actions);
        actions.appendChild(openBtn);
      }
      if(actions.querySelector('[data-v117-modal-discard-id="'+id+'"]'))return;
      const b=document.createElement('button');
      b.type='button';b.className='btn small danger';b.dataset.v117ModalDiscardId=id;b.textContent='⛔ Scarta';
      b.onclick=ev=>{ev.preventDefault();ev.stopPropagation();window.scartaRisultatoIngredienti117(id)};
      actions.insertBefore(b,openBtn);
    });

    out.querySelector('[data-v117-discard-all-results]')?.remove();
    if(ids.length){
      const h=out.querySelector('h3');
      const box=document.createElement('div');box.className='v117-result-batch';box.dataset.v117DiscardAllResults='1';
      const b=document.createElement('button');b.type='button';b.className='btn full danger';b.textContent='⛔ Scarta tutti i '+ids.length+' risultati';
      b.onclick=()=>window.scartaTuttiRisultatiIngredienti117();box.appendChild(b);
      if(h)h.insertAdjacentElement('afterend',box);else out.prepend(box);
    }
  }

  const eseguiIngredientiPre117=window.eseguiIngredienti113;
  if(typeof eseguiIngredientiPre117==='function'){
    window.eseguiIngredienti113=function(){
      eseguiIngredientiPre117();
      montaScartiIngredienti117();
    };
  }

  window.scartaRisultatoIngredienti117=function(id){
    const r=MASTER.find(x=>x.id===id);if(!r)return;
    if(!confirm('Scartare “'+r.nome+'”? Potrai ripristinarla dalla sezione Ricette scartate.'))return;
    registraScartoId117(id);
    aggiornaDopoScarto117();
    if(typeof eseguiIngredientiPre117==='function'){eseguiIngredientiPre117();montaScartiIngredienti117()}
    if(typeof toast==='function')toast('Ricetta scartata');
  };

  window.scartaTuttiRisultatiIngredienti117=function(){
    const ids=idsRisultatiIngredienti117();
    if(!ids.length){if(typeof toast==='function')toast('Nessun risultato da scartare');return}
    if(!confirm('Scartare tutte le '+ids.length+' ricette attualmente mostrate? Potrai ripristinarle dalla sezione Ricette scartate.'))return;
    ids.forEach(registraScartoId117);
    aggiornaDopoScarto117();
    if(typeof eseguiIngredientiPre117==='function'){eseguiIngredientiPre117();montaScartiIngredienti117()}
    if(typeof toast==='function')toast(ids.length+' ricette scartate');
  };

  // Mantiene lo scarto singolo dentro la scheda, ma rimuove il vecchio comando massivo per famiglia.
  const openRecipePreDiscard117=window.openRecipe;
  if(typeof openRecipePreDiscard117==='function'){
    window.openRecipe=function(id){
      openRecipePreDiscard117(id);
      document.getElementById('v117ScartaFamigliaBtn')?.remove();
    };
  }

  // Restano disattivati gli scarti massivi generici per famiglia/ingrediente.
  // L'unico scarto multiplo nuovo è quello contestuale dei risultati effettivamente visibili nella ricerca ingredienti.
  window.scartaFamiglia117=function(){
    if(typeof toast==='function')toast('Scarto per tipo disattivato: usa i risultati del ricettario.');
  };
  window.scartaIngrediente116=function(){
    if(typeof toast==='function')toast('Usa “Trova ricette per ingredienti” e scegli Scarta oppure Scarta tutti i risultati.');
  };

  function pulisciUiScartoMassivo117(){
    document.getElementById('v117ScartaFamigliaBtn')?.remove();
    const x=getScarti();

    // La vecchia scheda "Scarta per ingrediente" diventa solo guida + manutenzione di eventuali regole legacy.
    const input=document.getElementById('v116IngredienteScarto');
    const card=input?.closest('.card');
    if(card){
      const h=card.querySelector('h3');if(h)h.textContent='Scarto rapido dal ricettario';
      const meta=card.querySelector('.meta');if(meta)meta.textContent='Usa “Trova ricette per ingredienti”: puoi scartare una singola ricetta oppure tutti i risultati mostrati.';
      input.closest('.row')?.remove();
      const rules=document.getElementById('v116RegoleScarto');
      if(rules&&x.ingredienti.length&&!card.querySelector('[data-v117-legacy-note]')){
        rules.insertAdjacentHTML('beforebegin','<div class="tiny" data-v117-legacy-note style="margin-top:8px">Regole per ingrediente create in versioni precedenti: puoi ancora rimuoverle qui sotto.</div>');
      }
    }

    // Nessun nuovo scarto per famiglia. Se esistono dati legacy, mostriamo solo il ripristino per non perderli.
    const famBox=document.getElementById('v117FamiglieBox');
    if(famBox){
      if(!x.famiglie.length){famBox.remove();}
      else{
        const h=famBox.querySelector('h3');if(h)h.textContent='Scarti multipli precedenti';
        const meta=famBox.querySelector('.meta');if(meta)meta.textContent='Questi scarti erano stati creati in una versione precedente. Puoi ripristinarli, ma non crearne di nuovi.';
      }
    }
  }

  const renderScartatePreDiscard117=window.renderScartate116;
  if(typeof renderScartatePreDiscard117==='function'){
    window.renderScartate116=function(){
      renderScartatePreDiscard117();
      pulisciUiScartoMassivo117();
    };
  }
  pulisciUiScartoMassivo117();
}
bootDiscardUi117();
})();
