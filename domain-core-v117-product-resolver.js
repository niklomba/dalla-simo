// Dalla Simo v1.17 — risoluzione prodotto da barcode: Open Facts + fallback retail generico
(function(){
'use strict';
function boot117ProductResolver(){
  if(typeof st==='undefined'||typeof save!=='function'||typeof window.gestisciCodice116!=='function'){
    return setTimeout(boot117ProductResolver,120);
  }

  const N=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
  st.codiciProdotto=st.codiciProdotto||{};
  st.codiciProdottoMeta=st.codiciProdottoMeta||{};

  function nomeProdotto117(p){
    if(!p||typeof p!=='object')return '';
    const diretto=[
      p.product_name_it,p.product_name,p.generic_name_it,p.generic_name,
      p.abbreviated_product_name_it,p.abbreviated_product_name
    ].map(v=>String(v||'').trim()).find(Boolean);
    if(diretto)return diretto;
    const brand=String(p.brands||'').split(',')[0].trim();
    const qty=String(p.quantity||'').trim();
    return [brand,qty].filter(Boolean).join(' ').trim();
  }

  function brandProdotto117(p){
    return String(p?.brands||p?.brand||'').split(',')[0].trim();
  }

  async function fetchJson117(url,timeout=6500){
    const ctl=new AbortController();
    const t=setTimeout(()=>ctl.abort(),timeout);
    try{
      const r=await fetch(url,{cache:'no-store',redirect:'follow',signal:ctl.signal,headers:{'Accept':'application/json'}});
      if(r.status===404)return {found:false,notFound:true};
      if(!r.ok)throw new Error('HTTP '+r.status);
      const j=await r.json();
      const p=j?.product||null;
      const nome=nomeProdotto117(p);
      if(!p||(!nome&&j?.status===0))return {found:false,notFound:true};
      if(!nome)return {found:false,notFound:true};
      return {
        found:true,
        nome,
        product:p,
        tipo:String(p.product_type||j.product_type||'').trim(),
        marca:brandProdotto117(p),
        categoria:String(p.categories_it||p.categories||'').split(',')[0].trim()
      };
    }finally{
      clearTimeout(t);
    }
  }

  async function fetchUpcItemDb117(code,timeout=6500){
    const ctl=new AbortController();
    const t=setTimeout(()=>ctl.abort(),timeout);
    try{
      const url='https://api.upcitemdb.com/prod/trial/lookup?upc='+encodeURIComponent(code);
      const r=await fetch(url,{cache:'no-store',redirect:'follow',signal:ctl.signal,headers:{'Accept':'application/json'}});
      if(r.status===429)return {found:false,rateLimited:true};
      if(r.status===404)return {found:false,notFound:true};
      if(!r.ok)throw new Error('HTTP '+r.status);
      const j=await r.json();
      const p=Array.isArray(j?.items)?j.items[0]:null;
      const nome=String(p?.title||p?.description||'').trim();
      if(!p||!nome)return {found:false,notFound:true};
      return {
        found:true,
        nome,
        marca:String(p.brand||'').trim(),
        categoria:String(p.category||'').trim(),
        tipo:'generic-retail',
        soloRiconoscimento:true
      };
    }finally{
      clearTimeout(t);
    }
  }

  async function risolviProdotto117(code){
    code=String(code||'').trim();
    if(!code)return {nome:'',tipo:'',fonte:'',stato:'vuoto'};
    if(st.codiciProdotto[code]){
      const meta=st.codiciProdottoMeta?.[code]||{};
      return {
        nome:st.codiciProdotto[code],
        tipo:meta.tipo||'',
        fonte:meta.fonte||'cache',
        marca:meta.marca||'',
        categoria:meta.categoria||'',
        soloRiconoscimento:!!meta.soloRiconoscimento,
        stato:'cache'
      };
    }

    const fields='code,product_type,product_name_it,product_name,generic_name_it,generic_name,abbreviated_product_name_it,abbreviated_product_name,brands,quantity,categories_it,categories';
    const endpoints=[
      {fonte:'Open Facts universale',tipoDefault:'',url:'https://world.openfoodfacts.org/api/v3/product/'+encodeURIComponent(code)+'?product_type=all&lc=it&cc=it&fields='+fields},
      {fonte:'Open Food Facts',tipoDefault:'food',url:'https://world.openfoodfacts.org/api/v2/product/'+encodeURIComponent(code)+'.json?lc=it&cc=it&fields='+fields},
      {fonte:'Open Products Facts',tipoDefault:'product',url:'https://world.openproductsfacts.org/api/v2/product/'+encodeURIComponent(code)+'.json?lc=it&cc=it&fields='+fields}
    ];

    let almenoUnaRisposta=false;
    let ultimoErrore=null;
    for(const ep of endpoints){
      try{
        const x=await fetchJson117(ep.url);
        almenoUnaRisposta=true;
        if(x.found){
          const tipo=x.tipo||ep.tipoDefault||'';
          const solo=!!tipo&&N(tipo)!=='food';
          st.codiciProdotto[code]=x.nome;
          st.codiciProdottoMeta[code]={
            tipo,
            fonte:ep.fonte,
            marca:x.marca||'',
            categoria:x.categoria||'',
            soloRiconoscimento:solo,
            aggiornatoIl:new Date().toISOString()
          };
          save();
          return {nome:x.nome,tipo,fonte:ep.fonte,marca:x.marca||'',categoria:x.categoria||'',soloRiconoscimento:solo,stato:'trovato'};
        }
      }catch(e){
        ultimoErrore=e;
        console.warn('Dalla Simo lookup barcode:',ep.fonte,e);
      }
    }

    try{
      const g=await fetchUpcItemDb117(code);
      almenoUnaRisposta=true;
      if(g.found){
        st.codiciProdotto[code]=g.nome;
        st.codiciProdottoMeta[code]={
          tipo:g.tipo,
          fonte:'UPCitemdb',
          marca:g.marca||'',
          categoria:g.categoria||'',
          soloRiconoscimento:true,
          aggiornatoIl:new Date().toISOString()
        };
        save();
        return {nome:g.nome,tipo:g.tipo,fonte:'UPCitemdb',marca:g.marca||'',categoria:g.categoria||'',soloRiconoscimento:true,stato:'trovato'};
      }
      if(g.rateLimited)return {nome:'',tipo:'',fonte:'UPCitemdb',stato:'limite_generico'};
    }catch(e){
      ultimoErrore=e;
      console.warn('Dalla Simo lookup barcode: UPCitemdb',e);
    }

    return {nome:'',tipo:'',fonte:'',stato:almenoUnaRisposta?'non_trovato':'errore_rete',errore:ultimoErrore};
  }

  function trovaSpesa117(nome){
    const n=N(nome);
    return (st.spesa||[]).find(x=>x.stato==='da_comprare'&&(
      N(x.nome)===n||
      N(x.nome).includes(n)||
      n.includes(N(x.nome))||
      N(x.nome).split(' ').some(t=>t.length>3&&n.includes(t))
    ));
  }

  function mostraSoloRiconoscimento117(info,code){
    const righe=['Prodotto riconosciuto: “'+info.nome+'”'];
    if(info.marca)righe.push('Marca: '+info.marca);
    if(info.categoria)righe.push('Categoria: '+info.categoria);
    righe.push('Codice: '+code);
    if(info.fonte)righe.push('Fonte: '+info.fonte);
    righe.push('');
    righe.push('Articolo riconosciuto come non alimentare/generico: non viene aggiunto automaticamente a Dispensa o Spesa.');
    alert(righe.join('\n'));
  }

  window.gestisciCodice116=async function(code,mode){
    code=String(code||'').trim();
    if(!code)return;
    if(typeof toast==='function')toast('Cerco il prodotto…');

    const info=await risolviProdotto117(code);
    let nome=info.nome;

    if(info.soloRiconoscimento&&nome){
      closeModal();
      mostraSoloRiconoscimento117(info,code);
      return;
    }

    if(!nome){
      const testo=info.stato==='errore_rete'
        ?'Non riesco a contattare i database prodotti. Controlla la connessione e riprova. Se vuoi, puoi inserire il nome manualmente.'
        :info.stato==='limite_generico'
          ?'Il database generale ha raggiunto il limite temporaneo di richieste. Il prodotto non è stato trovato nelle fonti alimentari. Puoi riprovare più tardi o inserire il nome manualmente.'
          :'Prodotto non presente nei database disponibili. Scrivi il nome da associare a questo codice:';
      const manuale=prompt(testo,'');
      if(!manuale||!manuale.trim())return;
      nome=manuale.trim();
      st.codiciProdotto[code]=nome;
      st.codiciProdottoMeta[code]={tipo:'manuale',fonte:'inserimento manuale',soloRiconoscimento:false,aggiornatoIl:new Date().toISOString()};
      save();
    }

    if(mode==='spesa'){
      const x=trovaSpesa117(nome);
      if(x){
        x.stato='comprato';
        x.compratoIl=new Date().toISOString();
        x.codice=code;
        save();
        closeModal();
        if(typeof renderSpesa==='function')renderSpesa();
        if(typeof toast==='function')toast(x.nome+' riconosciuto e segnato come comprato');
        return;
      }
      if(confirm('Prodotto riconosciuto: “'+nome+'”. Non è nella lista Da comprare. Vuoi aggiungerlo direttamente tra i Comprati?')){
        st.spesa.push({
          id:'s'+Date.now(),nome,quantita:1,unita:'confezione',stato:'comprato',
          origini:['Scansione codice '+code],compratoIl:new Date().toISOString(),codice
        });
        save();
        closeModal();
        if(typeof renderSpesa==='function')renderSpesa();
        if(typeof toast==='function')toast(nome+' aggiunto ai comprati');
      }
      return;
    }

    let x=(st.dispensa||[]).find(v=>N(v.nome)===N(nome)||N(v.nome).includes(N(nome))||N(nome).includes(N(v.nome)));
    if(x){
      x.quantita=Number(x.quantita||0)+1;
      if(!x.codice)x.codice=code;
    }else{
      st.dispensa.push({id:'d'+Date.now(),nome,quantita:1,unita:'confezione',codice});
    }
    save();
    closeModal();
    if(typeof renderDispensa==='function')renderDispensa();
    if(typeof toast==='function')toast(nome+' riconosciuto e aggiunto alla dispensa');
  };

  window.__DALLA_SIMO_PRODUCT_LOOKUP__='v117-open-facts-plus-upcitemdb';
}
boot117ProductResolver();
})();
