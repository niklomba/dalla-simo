// Dalla Simo v1.17 — router QR: GS1/GTIN + payload comuni in sola lettura
(function(){
'use strict';
function boot117Qr(){
  if(typeof window.gestisciCodice116!=='function')return setTimeout(boot117Qr,120);
  const gestisciProdotto=window.gestisciCodice116;

  function gtinValido(v){return /^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(String(v||'').trim())}
  function estraiGtin117(raw){
    const s=String(raw||'').trim();
    let m=s.match(/\(01\)\s*(\d{14})/);if(m)return m[1];
    m=s.match(/^01(\d{14})(?:\D|$)/);if(m)return m[1];
    try{
      const u=new URL(s);
      m=u.pathname.match(/(?:^|\/)01\/(\d{14})(?=\/|$)/);if(m)return m[1];
      for(const k of ['01','gtin','ean','upc','barcode','code']){
        const v=(u.searchParams.get(k)||'').trim();if(gtinValido(v))return v;
      }
    }catch(e){}
    return '';
  }
  function valoreLinea(s,nome){
    const r=new RegExp('(?:^|\\n)'+nome+'(?:;[^:]*)?:([^\\n\\r]*)','i').exec(s);
    return r?String(r[1]||'').trim():'';
  }
  function valoreCampo(s,campo){
    const r=new RegExp('(?:^|[;:])'+campo+':([^;]*)','i').exec(s);
    return r?String(r[1]||'').replace(/\\;/g,';').replace(/\\,/g,',').trim():'';
  }
  function chiudi(){try{if(typeof closeModal==='function')closeModal()}catch(e){}}
  function mostra(titolo,righe){chiudi();alert([titolo,'',...righe].filter(x=>x!==undefined&&x!==null).join('\n'))}

  window.gestisciScansione117=async function(raw,mode){
    const s=String(raw||'').trim();if(!s)return;
    const gtin=estraiGtin117(s);
    if(gtin)return gestisciProdotto(gtin,mode);
    if(gtinValido(s))return gestisciProdotto(s,mode);

    if(/^https?:\/\//i.test(s)){
      let host='';try{host=new URL(s).hostname}catch(e){}
      chiudi();
      if(confirm('QR link'+(host?' · '+host:'')+'\n\n'+s+'\n\nAprire il link nel browser?'))window.open(s,'_blank','noopener,noreferrer');
      return;
    }
    if(/^WIFI:/i.test(s)){
      const ssid=valoreCampo(s,'S'),tipo=valoreCampo(s,'T');
      return mostra('QR rete Wi‑Fi',[ssid?'Rete: '+ssid:'Rete Wi‑Fi',tipo?'Sicurezza: '+tipo:'','La password non viene mostrata né salvata da Dalla Simo.']);
    }
    if(/^BEGIN:VCARD/i.test(s)){
      const nome=valoreLinea(s,'FN')||valoreLinea(s,'N'),tel=valoreLinea(s,'TEL'),mail=valoreLinea(s,'EMAIL');
      return mostra('QR contatto',[nome?'Nome: '+nome:'',tel?'Telefono: '+tel:'',mail?'Email: '+mail:'','Il contatto non viene salvato automaticamente.']);
    }
    if(/^MECARD:/i.test(s)){
      return mostra('QR contatto',[valoreCampo(s,'N')?'Nome: '+valoreCampo(s,'N'):'',valoreCampo(s,'TEL')?'Telefono: '+valoreCampo(s,'TEL'):'',valoreCampo(s,'EMAIL')?'Email: '+valoreCampo(s,'EMAIL'):'','Il contatto non viene salvato automaticamente.']);
    }
    if(/^mailto:/i.test(s))return mostra('QR email',[s.replace(/^mailto:/i,'')]);
    if(/^tel:/i.test(s))return mostra('QR telefono',[s.replace(/^tel:/i,'')]);
    if(/^(sms:|smsto:)/i.test(s))return mostra('QR SMS',[s.replace(/^(sms:|smsto:)/i,'')]);
    if(/^geo:/i.test(s))return mostra('QR posizione',[s.replace(/^geo:/i,'')]);
    if(/^BEGIN:VEVENT/i.test(s)){
      const titolo=valoreLinea(s,'SUMMARY'),inizio=valoreLinea(s,'DTSTART'),luogo=valoreLinea(s,'LOCATION');
      return mostra('QR evento',[titolo?'Evento: '+titolo:'',inizio?'Data/ora: '+inizio:'',luogo?'Luogo: '+luogo:'','L’evento non viene aggiunto automaticamente al calendario.']);
    }
    if(/^000201/.test(s)&&s.length>20)return mostra('QR pagamento',['Contenuto di pagamento rilevato.','Per sicurezza Dalla Simo non esegue pagamenti né apre automaticamente app finanziarie.']);

    return mostra('QR testo / identificatore',[s,'Questo contenuto non viene aggiunto automaticamente a Dispensa o Spesa.']);
  };

  window.usaCodiceManuale116=function(mode){
    const s=document.getElementById('codiceManuale116')?.value.trim();
    if(!s){if(typeof toast==='function')toast('Inserisci o scansiona un codice');return}
    return window.gestisciScansione117(s,mode);
  };
  window.__DALLA_SIMO_QR_ROUTER__='v117-gs1-common-payloads';
}
boot117Qr();
})();
