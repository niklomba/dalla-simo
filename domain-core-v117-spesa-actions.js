// Dalla Simo v1.17 — azioni rapide Lista Spesa
(function(){
'use strict';
function boot117SpesaActions(){
  if(typeof st==='undefined'||typeof save!=='function'||typeof window.renderSpesa!=='function'){
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
      bar.className='row between';
      bar.style.cssText='gap:10px;align-items:center;margin:8px 0 12px;flex-wrap:wrap';
      lista.parentNode.insertBefore(bar,lista);
    }
    bar.innerHTML='<div class="meta"><b>'+arr.length+'</b> da comprare</div><button type="button" class="btn" onclick="segnaTuttoComprato117()">✓ Comprato tutto</button>';
  }

  window.segnaTuttoComprato117=function(){
    const arr=daComprare117();
    if(!arr.length){if(typeof toast==='function')toast('Non ci sono prodotti da segnare come comprati');return}
    if(!confirm('Segnare come comprati tutti i '+arr.length+' prodotti presenti in Da comprare?'))return;
    const quando=new Date().toISOString();
    arr.forEach(x=>{x.stato='comprato';x.compratoIl=quando});
    save();
    if(typeof window.renderSpesa==='function')window.renderSpesa();
    if(typeof toast==='function')toast(arr.length+' prodotti spostati in Comprati');
  };

  const renderSpesaPre117=window.renderSpesa;
  window.renderSpesa=function(){
    renderSpesaPre117();
    montaCompratoTutto117();
  };

  montaCompratoTutto117();
  window.__DALLA_SIMO_SPESA_ACTIONS__='v117-comprato-tutto';
}
boot117SpesaActions();
})();
