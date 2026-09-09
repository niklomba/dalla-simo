// Dalla Simo v1.17 — UX scarto ricette: scarto singolo diretto dai risultati, niente nuovi scarti massivi
(function(){
'use strict';
function bootDiscardUi117(){
  if(typeof st==='undefined'||typeof RICETTE==='undefined'||typeof save!=='function'||typeof renderRicette!=='function'){
    return setTimeout(bootDiscardUi117,120);
  }

  const getScarti=()=>{
    st.ricetteScartate=st.ricetteScartate||{};
    st.ricetteScartate.manuali=Array.isArray(st.ricetteScartate.manuali)?st.ricetteScartate.manuali:[];
    st.ricetteScartate.ingredienti=Array.isArray(st.ricetteScartate.ingredienti)?st.ricetteScartate.ingredienti:[];
    st.ricetteScartate.eccezioni=Array.isArray(st.ricetteScartate.eccezioni)?st.ricetteScartate.eccezioni:[];
    st.ricetteScartate.famiglie=Array.isArray(st.ricetteScartate.famiglie)?st.ricetteScartate.famiglie:[];
    return st.ricetteScartate;
  };

  if(!document.getElementById('v117DiscardListCss')){
    const css=document.createElement('style');
    css.id='v117DiscardListCss';
    css.textContent=`
      .v117-list-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap;margin-left:8px}
      .v117-list-actions .btn{white-space:nowrap}
      @media(max-width:420px){.v117-list-actions{flex-direction:column;align-items:stretch;margin-left:6px}.v117-list-actions .btn{padding:7px 9px}}
    `;
    document.head.appendChild(css);
  }

  function idRicettaDaPulsante(openBtn){
    const code=openBtn?.getAttribute('onclick')||'';
    const m=code.match(/openRecipe\(\s*['\"]([^'\"]+)['\"]\s*\)/);
    return m?m[1]:null;
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

  // Mantiene lo scarto singolo dentro la scheda, ma rimuove il vecchio comando massivo per famiglia.
  const openRecipePreDiscard117=window.openRecipe;
  if(typeof openRecipePreDiscard117==='function'){
    window.openRecipe=function(id){
      openRecipePreDiscard117(id);
      document.getElementById('v117ScartaFamigliaBtn')?.remove();
    };
  }

  // Nessuna nuova esclusione massiva: se una vecchia UI o un vecchio handler prova a richiamarla, non modifica i dati.
  window.scartaFamiglia117=function(){
    if(typeof toast==='function')toast('Scarto multiplo disattivato: usa Scarta sulla singola ricetta.');
  };
  window.scartaIngrediente116=function(){
    if(typeof toast==='function')toast('Cerca l’ingrediente nel ricettario e scarta le ricette singolarmente.');
  };

  function pulisciUiScartoMassivo117(){
    document.getElementById('v117ScartaFamigliaBtn')?.remove();
    const x=getScarti();

    // La vecchia scheda "Scarta per ingrediente" diventa solo guida + manutenzione di eventuali regole legacy.
    const input=document.getElementById('v116IngredienteScarto');
    const card=input?.closest('.card');
    if(card){
      const h=card.querySelector('h3');if(h)h.textContent='Scarto rapido dal ricettario';
      const meta=card.querySelector('.meta');if(meta)meta.textContent='Cerca un ingrediente nel Ricettario e usa “Scarta” direttamente accanto alla ricetta che non vuoi più vedere.';
      input.closest('.row')?.remove();
      const rules=document.getElementById('v116RegoleScarto');
      if(rules&&x.ingredienti.length){
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
      document.querySelectorAll('[data-v117-legacy-note]').forEach((n,i)=>{if(i)n.remove()});
      pulisciUiScartoMassivo117();
    };
  }
  pulisciUiScartoMassivo117();
}
bootDiscardUi117();
})();
