// Dalla Simo v1.17 — risoluzione prodotto da barcode: Open Facts esteso + fallback retail + scelta destinazione
(function(){
'use strict';
function boot117ProductResolver(){
  if(typeof st==='undefined'||typeof save!=='function'||typeof window.gestisciCodice116!=='function'){
    return setTimeout(boot117ProductResolver,120);
  }

  const N=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
  const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
      let j=null;
      try{j=await r.json()}catch(e){
        if(r.status===404)return {found:false,notFound:true};
        throw e;
      }
      if(r.status===404||j?.status===0)return {found:false,notFound:true};
      if(!r.ok)throw new Error('HTTP '+r.status);
      const p=j?.product||null;
      const nome=nomeProdotto117(p);
      if(!p||!nome)return {found:false,notFound:true};
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
      {fonte:'Open Products Facts',tipoDefault:'product',url:'https://world.openproductsfacts.org/api/v2/product/'+encodeURIComponent(code)+'.json?lc=it&cc=it&fields='+fields},
      {fonte:'Open Beauty Facts',tipoDefault:'beauty',url:'https://world.openbeautyfacts.org/api/v2/product/'+encodeURIComponent(code)+'.json?lc=it&cc=it&fields='+fields},
      {fonte:'Open Pet Food Facts',tipoDefault:'pet-food',url:'https://world.openpetfoodfacts.org/api/v2/product/'+encodeURIComponent(code)+'.json?lc=it&cc=it&fields='+fields}
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

  function trovaSpesa117(nome,code){
    const n=N(nome),c=String(code||'').trim();
    return (st.spesa||[]).find(x=>x.stato==='da_comprare'&&(
      (c&&String(x.codice||'')===c)||
      N(x.nome)===n||
      N(x.nome).includes(n)||
      n.includes(N(x.nome))||
      N(x.nome).split(' ').some(t=>t.length>3&&n.includes(t))
    ));
  }

  function trovaDispensa117(nome,code){
    const n=N(nome),c=String(code||'').trim();
    return (st.dispensa||[]).find(x=>
      (c&&String(x.codice||'')===c)||
      N(x.nome)===n||
      N(x.nome).includes(n)||
      n.includes(N(x.nome))
    );
  }

  function vai117(id){
    try{if(typeof showScreenById==='function')showScreenById(id)}catch(e){}
  }

  function origine117(code){return 'Scansione codice '+code}

  function aggiungiSpesa117(nome,code){
    st.spesa=Array.isArray(st.spesa)?st.spesa:[];
    let x=trovaSpesa117(nome,code);
    if(x){
      x.origini=Array.isArray(x.origini)?x.origini:[];
      const o=origine117(code);if(!x.origini.includes(o))x.origini.push(o);
      if(!x.codice)x.codice=code;
      if((x.unita||'confezione')==='confezione')x.quantita=Number(x.quantita||0)+1;
      save();closeModal();if(typeof renderSpesa==='function')renderSpesa();vai117('spesa');
      if(typeof toast==='function')toast(nome+' aggiornato in Da comprare');
      return;
    }
    st.spesa.push({
      id:'s'+Date.now()+Math.random().toString(16).slice(2,6),
      nome,quantita:1,unita:'confezione',stato:'da_comprare',
      origini:[origine117(code)],codice:code
    });
    save();closeModal();if(typeof renderSpesa==='function')renderSpesa();vai117('spesa');
    if(typeof toast==='function')toast(nome+' aggiunto a Da comprare');
  }

  function segnaComprato117(nome,code){
    st.spesa=Array.isArray(st.spesa)?st.spesa:[];
    let x=trovaSpesa117(nome,code);
    if(x){
      x.stato='comprato';x.compratoIl=new Date().toISOString();x.codice=x.codice||code;
      x.origini=Array.isArray(x.origini)?x.origini:[];
      const o=origine117(code);if(!x.origini.includes(o))x.origini.push(o);
    }else{
      st.spesa.push({
        id:'s'+Date.now()+Math.random().toString(16).slice(2,6),
        nome,quantita:1,unita:'confezione',stato:'comprato',
        origini:[origine117(code)],compratoIl:new Date().toISOString(),codice:code
      });
    }
    save();closeModal();if(typeof renderSpesa==='function')renderSpesa();vai117('spesa');
    if(typeof toast==='function')toast(nome+' presente in Comprati');
  }

  function aggiungiDispensa117(nome,code){
    st.dispensa=Array.isArray(st.dispensa)?st.dispensa:[];
    let x=trovaDispensa117(nome,code);
    if(x&&(x.unita||'confezione')==='confezione'){
      x.quantita=Number(x.quantita||0)+1;x.codice=x.codice||code;
    }else{
      st.dispensa.push({id:'d'+Date.now()+Math.random().toString(16).slice(2,6),nome,quantita:1,unita:'confezione',codice:code});
    }
    save();closeModal();if(typeof renderDispensa==='function')renderDispensa();vai117('dispensa');
    if(typeof toast==='function')toast(nome+' aggiunto alla Dispensa');
  }

  function mostraScelte117(info,code,mode){
    const nome=info.nome;
    const inSpesa=!!trovaSpesa117(nome,code);
    window.__DALLA_SIMO_SCAN_PENDING__={nome,code,info,mode};
    const dettagli=[
      info.marca?'<div class="meta">Marca: '+H(info.marca)+'</div>':'',
      info.categoria?'<div class="meta">Categoria: '+H(info.categoria)+'</div>':'',
      info.fonte?'<div class="meta">Fonte: '+H(info.fonte)+'</div>':'',
      '<div class="meta">Codice: '+H(code)+'</div>'
    ].join('');
    const nota=info.soloRiconoscimento
      ?'<div class="note" style="margin-top:10px">Prodotto riconosciuto da un database generico/non alimentare. Non viene inserito automaticamente: scegli tu dove aggiungerlo.</div>'
      :'';
    const compra=inSpesa
      ?'<button class="btn full" style="margin-top:8px" onclick="azioneScansioneProdotto117(\'comprato\')">✓ Segna come comprato</button>'
      :'<button class="btn full secondary" style="margin-top:8px" onclick="azioneScansioneProdotto117(\'comprato\')">✓ Ho già comprato questo prodotto</button>';
    openModal('Prodotto riconosciuto',
      '<div class="card"><div class="recipe-title">'+H(nome)+'</div>'+dettagli+nota+'</div>'+ 
      '<button class="btn full" onclick="azioneScansioneProdotto117(\'spesa\')">🛒 Aggiungi a Da comprare</button>'+ 
      '<button class="btn full secondary" style="margin-top:8px" onclick="azioneScansioneProdotto117(\'dispensa\')">🏠 Aggiungi alla Dispensa</button>'+ 
      compra+
      '<div class="meta" style="margin-top:10px">Nessuna destinazione viene scelta automaticamente.</div>'
    );
  }

  window.azioneScansioneProdotto117=function(azione){
    const p=window.__DALLA_SIMO_SCAN_PENDING__;if(!p)return;
    if(azione==='spesa')return aggiungiSpesa117(p.nome,p.code);
    if(azione==='dispensa')return aggiungiDispensa117(p.nome,p.code);
    if(azione==='comprato')return segnaComprato117(p.nome,p.code);
  };

  window.gestisciCodice116=async function(code,mode){
    code=String(code||'').trim();
    if(!code)return;
    if(typeof toast==='function')toast('Cerco il prodotto…');

    const info=await risolviProdotto117(code);
    let nome=info.nome;

    if(!nome){
      const testo=info.stato==='errore_rete'
        ?'Non riesco a contattare i database prodotti. Controlla la connessione e riprova. Se vuoi, puoi inserire il nome manualmente.'
        :info.stato==='limite_generico'
          ?'Il database generale ha raggiunto il limite temporaneo di richieste. Il prodotto non è stato trovato nelle altre fonti. Puoi riprovare più tardi o inserire il nome manualmente.'
          :'Prodotto non presente nei database disponibili. Scrivi il nome da associare a questo codice:';
      const manuale=prompt(testo,'');
      if(!manuale||!manuale.trim())return;
      nome=manuale.trim();
      st.codiciProdotto[code]=nome;
      st.codiciProdottoMeta[code]={tipo:'manuale',fonte:'inserimento manuale',soloRiconoscimento:false,aggiornatoIl:new Date().toISOString()};
      save();
      info.nome=nome;info.tipo='manuale';info.fonte='inserimento manuale';info.soloRiconoscimento=false;info.stato='manuale';
    }

    try{if(typeof closeModal==='function')closeModal()}catch(e){}
    mostraScelte117({...info,nome},code,mode);
  };

  window.__DALLA_SIMO_PRODUCT_LOOKUP__='v117-open-facts-expanded-plus-upcitemdb-destination-choice';
}
boot117ProductResolver();
})();
