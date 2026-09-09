// Dalla Simo v1.17 — ricerca ingredienti semantica + scanner più robusto
(function(){
'use strict';
function boot117SearchScanner(){
  if(typeof st==='undefined'||typeof RICETTE==='undefined'||typeof save!=='function'||typeof openModal!=='function'||typeof eseguiIngredienti113!=='function'){
    return setTimeout(boot117SearchScanner,120);
  }

  const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const N=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');

  const GRUPPI={
    carne:['carne','carne_bianca','carne_rossa','pollo','tacchino','manzo','vitello','maiale','suino','coniglio','bresaola','prosciutto','hamburger','bistecca','spezzatino','brasato','ragu','carne macinata','salsiccia'],
    pesce:['pesce','merluzzo','orata','branzino','sogliola','tonno','salmone','sgombro','sardine','acciughe','gamberi','gamberetti'],
    formaggio:['formaggio','latticini','mozzarella','ricotta','parmigiano','grana','pecorino','primosale','fiocchi di latte'],
    latticini:['latticini','latte','yogurt','kefir','mozzarella','ricotta','parmigiano','grana','pecorino','formaggio'],
    verdura:['verdura','verdure','zucchine','carote','broccoli','spinaci','finocchi','pomodoro','pomodorini','melanzane','peperoni','cetrioli','insalata','valeriana','bietole','fagiolini'],
    legumi:['legumi','ceci','fagioli','lenticchie','piselli'],
    pasta:['pasta','spaghetti','penne','fusilli','trofie','lasagne','cannelloni','gnocchi'],
    riso:['riso','risotto','riso basmati'],
    uova:['uova','uovo','frittata']
  };
  GRUPPI.carni=GRUPPI.carne;
  GRUPPI.verdure=GRUPPI.verdura;
  GRUPPI.formaggi=GRUPPI.formaggio;

  function varianti(q){
    q=N(q);
    return GRUPPI[q]||[q];
  }
  function testoRicetta(r){
    return N([r.nome,r.variante,r.categoria,...(r.tags||[]),...(r.ingredienti||[])].join(' '));
  }
  function matchQuery(r,q){
    const t=testoRicetta(r), vs=varianti(q);
    return vs.some(v=>t.includes(N(v)));
  }
  function directScore(r,q){
    const qn=N(q), nome=N(r.nome), ing=(r.ingredienti||[]).map(N);
    let s=0;
    if(nome.includes(qn))s+=12;
    if(ing.some(i=>i.includes(qn)||qn.includes(i)))s+=10;
    if(N(r.categoria).includes(qn))s+=5;
    return s;
  }

  window.eseguiIngredienti113=function(){
    const out=document.getElementById('v113IngOut');if(!out)return;
    const qs=(document.getElementById('v113Ing')?.value||'').split(',').map(N).filter(Boolean);
    const max=Number(document.getElementById('v113IngTempo')?.value||0);
    const dif=N(document.getElementById('v113IngDiff')?.value||'');
    if(!qs.length){out.innerHTML='<div class="note" style="margin-top:12px">Scrivi almeno un ingrediente o una categoria, per esempio carne, pesce, ricotta o zucchine.</div>';return}

    const arr=RICETTE.map(r=>{
      const hit=qs.filter(q=>matchQuery(r,q));
      const ing=(r.ingredienti||[]).map(N);
      const miss=ing.filter(i=>!['sale','pepe','olio','acqua'].includes(i)&&!qs.some(q=>varianti(q).some(v=>i.includes(N(v))||N(v).includes(i))));
      const ds=qs.reduce((a,q)=>a+directScore(r,q),0);
      return {r,hit,miss,s:hit.length*100+ds-miss.length*2};
    }).filter(x=>x.hit.length && (!max||x.r.minuti<=max) && (!dif||N(x.r.difficolta).includes(dif.slice(0,6))))
      .sort((a,b)=>b.s-a.s||b.hit.length-a.hit.length||a.miss.length-b.miss.length||a.r.minuti-b.r.minuti)
      .slice(0,40);

    const sem=qs.filter(q=>GRUPPI[q]);
    const nota=sem.length?'<div class="note" style="margin-top:12px"><b>Ricerca ampliata:</b> '+H(sem.map(q=>q+' comprende anche '+varianti(q).slice(1,8).join(', ')).join(' · '))+'</div>':'';
    out.innerHTML=nota+'<h3 style="margin-top:16px">Risultati'+(arr.length?' ('+arr.length+')':'')+'</h3>'+(arr.length?arr.map(x=>'<div class="family row between"><div><div class="recipe-title">'+H(x.r.nome)+'</div><div class="meta">'+x.r.minuti+' min · corrispondono '+x.hit.length+' ricerche'+(x.miss.length?' · altri principali: '+H(x.miss.slice(0,4).join(', ')):'')+'</div></div><button class="btn small" onclick="openRecipe(\''+x.r.id+'\')">Apri</button></div>').join(''):'<div class="note">Nessuna corrispondenza con questi filtri.</div>');
  };

  let scanner117=null;
  async function fermaScanner117(){
    try{if(scanner117){await scanner117.stop()}}catch(e){}
    try{if(scanner117){await scanner117.clear()}}catch(e){}
    scanner117=null;
  }

  function caricaScript117(src,timeout=8000){
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');let done=false;
      const fine=(ok,err)=>{if(done)return;done=true;clearTimeout(t);if(!ok)s.remove();ok?resolve():reject(err||new Error('Caricamento scanner fallito'))};
      const t=setTimeout(()=>fine(false,new Error('Timeout caricamento scanner')),timeout);
      s.src=src;s.async=true;s.onload=()=>fine(true);s.onerror=()=>fine(false,new Error('CDN scanner non disponibile'));document.head.appendChild(s);
    });
  }
  async function caricaScannerLib117(){
    if(window.Html5Qrcode)return;
    const cdn=['https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js','https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js'];
    let err=null;
    for(const src of cdn){try{await caricaScript117(src);if(window.Html5Qrcode)return}catch(e){err=e}}
    throw err||new Error('Libreria scanner non disponibile');
  }

  async function chiediPermessoCamera117(){
    if(!window.isSecureContext)throw Object.assign(new Error('Connessione non sicura'),{name:'SecurityError'});
    if(!navigator.mediaDevices?.getUserMedia)throw Object.assign(new Error('Fotocamera non supportata dal browser'),{name:'NotSupportedError'});
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
    stream.getTracks().forEach(t=>t.stop());
  }

  function messaggioErroreScanner117(e){
    const n=e?.name||'', m=String(e?.message||e||'');
    if(/NotAllowed|PermissionDenied/i.test(n+m))return 'Permesso fotocamera negato. Su iPhone apri Impostazioni > Safari > Fotocamera oppure le impostazioni del sito e consenti la fotocamera; poi riprova.';
    if(/NotFound|DevicesNotFound/i.test(n+m))return 'Non trovo una fotocamera disponibile su questo dispositivo.';
    if(/NotReadable|TrackStart/i.test(n+m))return 'La fotocamera è già in uso da un’altra app. Chiudila e riprova.';
    if(/Security/i.test(n+m))return 'La fotocamera richiede una pagina HTTPS sicura.';
    return 'Scanner non avviato. Puoi usare il codice manuale oppure chiudere e riprovare.';
  }

  const closeModalPre117Scanner=window.closeModal;
  window.closeModal=function(){fermaScanner117();if(typeof closeModalPre117Scanner==='function')closeModalPre117Scanner()};

  window.apriScanner116=async function(mode){
    const label=mode==='spesa'?'Spesa':'Dispensa';
    openModal('Scansiona prodotto · '+label,'<div class="note">Inquadra il <b>codice a barre EAN</b> della confezione. Alla prima apertura consenti l’uso della fotocamera. Se non funziona puoi inserire il codice manualmente.</div><div id="reader116"></div><div class="row" style="margin-top:10px"><input id="codiceManuale116" class="search" inputmode="numeric" placeholder="Codice EAN/QR"><button class="btn" onclick="usaCodiceManuale116(\''+mode+'\')">Usa codice</button></div><div id="scannerMsg116" class="meta">Controllo fotocamera…</div>');
    const msg=t=>{const m=document.getElementById('scannerMsg116');if(m)m.textContent=t};
    try{
      await fermaScanner117();
      await chiediPermessoCamera117();
      msg('Caricamento lettore codici…');
      await caricaScannerLib117();
      const cams=typeof Html5Qrcode.getCameras==='function'?await Html5Qrcode.getCameras():[];
      const post=(cams||[]).find(c=>/back|rear|environment|posteriore/i.test(c.label||''));
      const camId=post?.id||(cams||[])[0]?.id||{facingMode:'environment'};
      scanner117=new Html5Qrcode('reader116');
      const cfg={fps:12,qrbox:{width:280,height:160}};
      await scanner117.start(camId,cfg,async code=>{
        await fermaScanner117();
        const input=document.getElementById('codiceManuale116');if(input)input.value=code;
        if(typeof window.usaCodiceManuale116==='function')window.usaCodiceManuale116(mode);
      },()=>{});
      msg('Fotocamera attiva: avvicina il codice a barre e tienilo dentro il riquadro.');
    }catch(e){
      console.warn('Dalla Simo scanner:',e);
      await fermaScanner117();
      msg(messaggioErroreScanner117(e));
    }
  };
}
boot117SearchScanner();
})();
