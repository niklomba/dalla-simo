// Dalla Simo v1.17 — azioni rapide Lista Spesa + Dispensa
(function(){
'use strict';
function boot117SpesaActions(){
  if(typeof st==='undefined'||typeof save!=='function'||typeof window.renderSpesa!=='function'||typeof window.renderDispensa!=='function'){
    return setTimeout(boot117SpesaActions,120);
  }

  function daComprare117(){
    return Array.isArray(st.spesa)?st.spesa.filter(x=>x&&x.stato==='da_comprare'):[];
  }

  function montaCompratoTutto117(){
    const lista=document.getElementById('listaDaComprare');
    if(!lista)return;
    const arr=daComprare117();
    let bar=document.getElementById('v117CompratoTuttoBar');
    if(!arr.length){if(bar)bar.remove();return}
    if(!bar){
      bar=document.createElement('div');
      bar.id='v117CompratoTuttoBar';
      bar.style.cssText='display:grid;grid-template-columns:1fr;gap:8px;margin:10px 0 12px';
      lista.parentNode.insertBefore(bar,lista);
    }
    bar.innerHTML='<button type="button" class="btn full" onclick="segnaTuttoComprato117()">✓ Sposta tutto in Comprati ('+arr.length+')</button><div class="meta">Segna tutta la spesa ancora da fare come già comprata.</div>';
  }

  window.segnaTuttoComprato117=function(){
    const arr=daComprare117();
    if(!arr.length){if(typeof toast==='function')toast('Non ci sono prodotti da segnare come comprati');return}
    if(!confirm('Spostare tutti i '+arr.length+' prodotti da “Da comprare” a “Comprati”?'))return;
    const quando=new Date().toISOString();
    arr.forEach(x=>{x.stato='comprato';x.compratoIl=quando});
    save();
    if(typeof window.renderSpesa==='function')window.renderSpesa();
    if(typeof toast==='function')toast(arr.length+' prodotti spostati in Comprati');
  };

  window.ripristinaComprato117=function(id){
    if(!Array.isArray(st.spesa))return;
    const item=st.spesa.find(x=>x&&x.id===id&&x.stato==='comprato');
    if(!item){if(typeof toast==='function')toast('Prodotto non trovato nei Comprati');return}
    item.stato='da_comprare';
    delete item.compratoIl;
    save();
    if(typeof window.renderSpesa==='function')window.renderSpesa();
    if(typeof toast==='function')toast(item.nome+' riportato in Da comprare');
  };

  function montaRipristinaComprati117(){
    const lista=document.getElementById('listaComprati');
    if(!lista)return;
    lista.querySelectorAll('.shop-item').forEach(row=>{
      if(row.querySelector('[data-v117-ripristina]'))return;
      const del=row.querySelector('button.danger[onclick*="cancellaComprato"]');
      if(!del)return;
      const attr=del.getAttribute('onclick')||'';
      const m=attr.match(/cancellaComprato\(['\"]([^'\"]+)['\"]\)/);
      if(!m)return;
      const id=m[1];
      const box=del.parentElement;
      if(!box)return;
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='btn small secondary';
      btn.setAttribute('data-v117-ripristina',id);
      btn.style.marginTop='5px';
      btn.style.marginRight='6px';
      btn.textContent='Ripristina';
      btn.onclick=function(ev){
        ev.stopPropagation();
        window.ripristinaComprato117(id);
      };
      box.insertBefore(btn,del);
    });
  }

  function montaSvuotaDispensa117(){
    const lista=document.getElementById('listaDispensa');
    if(!lista)return;
    const n=Array.isArray(st.dispensa)?st.dispensa.length:0;
    let bar=document.getElementById('v117SvuotaDispensaBar');
    if(!n){if(bar)bar.remove();return}
    if(!bar){
      bar=document.createElement('div');
      bar.id='v117SvuotaDispensaBar';
      bar.style.cssText='margin:10px 0 12px';
      lista.parentNode.insertBefore(bar,lista);
    }
    bar.innerHTML='<button type="button" class="btn full danger" onclick="svuotaDispensa117()">🗑 Svuota tutta la Dispensa ('+n+')</button><div class="meta">Cancella tutti gli alimenti registrati in Dispensa. Gli Avanzi restano separati e non vengono cancellati.</div>';
  }

  window.svuotaDispensa117=function(){
    const n=Array.isArray(st.dispensa)?st.dispensa.length:0;
    if(!n){if(typeof toast==='function')toast('La Dispensa è già vuota');return}
    if(!confirm('Cancellare tutti i '+n+' alimenti presenti in Dispensa? Gli Avanzi non verranno cancellati.'))return;
    st.dispensa=[];
    save();
    if(typeof window.renderDispensa==='function')window.renderDispensa();
    if(typeof toast==='function')toast('Dispensa svuotata');
  };

  const renderSpesaPre117=window.renderSpesa;
  window.renderSpesa=function(){
    renderSpesaPre117();
    montaCompratoTutto117();
    montaRipristinaComprati117();
  };

  const renderDispensaPre117=window.renderDispensa;
  window.renderDispensa=function(){
    renderDispensaPre117();
    montaSvuotaDispensa117();
  };

  montaCompratoTutto117();
  montaRipristinaComprati117();
  montaSvuotaDispensa117();
  window.__DALLA_SIMO_SPESA_ACTIONS__='v117-spesa-dispensa-ripristina';
}
boot117SpesaActions();
})();
