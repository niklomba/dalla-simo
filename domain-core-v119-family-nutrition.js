// Dalla Simo v1.19 — gusti familiari + registro reale calorie/macronutrienti
(function(){
'use strict';
function boot119FamilyNutrition(){
  if(typeof st==='undefined'||typeof RICETTE==='undefined'||typeof save!=='function'||typeof openModal!=='function')return setTimeout(boot119FamilyNutrition,120);
  const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const N=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const today=()=>new Date().toISOString().slice(0,10);
  const num=v=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:0};
  const fmt=(v,d=0)=>Number(v||0).toLocaleString('it-IT',{maximumFractionDigits:d,minimumFractionDigits:d});
  const idm=id=>(st.membri||[]).find(m=>m.id===id);

  st.membri=(st.membri||[]).map(m=>({...m,
    ingredientiPreferiti:Array.isArray(m.ingredientiPreferiti)?m.ingredientiPreferiti:[],
    ingredientiNonGraditi:Array.isArray(m.ingredientiNonGraditi)?m.ingredientiNonGraditi:[]
  }));
  st.v119Nutrizione=st.v119Nutrizione||{obiettivi:{},membroRegistro:(st.membri[0]?.id||''),dataRegistro:today()};
  st.v119Nutrizione.obiettivi=st.v119Nutrizione.obiettivi||{};
  if(!st.v119Nutrizione.membroRegistro)st.v119Nutrizione.membroRegistro=st.membri[0]?.id||'';
  if(!st.v119Nutrizione.dataRegistro)st.v119Nutrizione.dataRegistro=today();

  function ingredientText(r){return N([r.nome,r.variante,...(r.ingredienti||[])].join(' '))}
  function hasTerm(r,t){const q=N(t);if(!q)return false;const hay=ingredientText(r);return hay.includes(q)}
  function hasAny(r,arr){return (arr||[]).some(x=>hasTerm(r,x))}
  function countAny(r,arr){return (arr||[]).reduce((n,x)=>n+(hasTerm(r,x)?1:0),0)}

  // Le preferenze ingredienti influenzano SOLO i consigli: non toccano il ricettario o le ricette scartate.
  const oldScore=window.scorePerMembro;
  if(typeof oldScore==='function'&&!oldScore.__v119Ingredienti){
    const wrapped=function(r,m){
      const mm=idm(m?.id)||m||{};
      if(hasAny(r,mm.ingredientiNonGraditi))return -100000;
      let s=oldScore(r,m);
      s+=countAny(r,mm.ingredientiPreferiti)*24;
      return s;
    };
    wrapped.__v119Ingredienti=true;window.scorePerMembro=wrapped;
  }

  window.apriGusti119=function(memberId){
    const m=idm(memberId);if(!m)return;
    const chips=(arr,type)=>arr.length?arr.map((x,i)=>`<button class="btn small secondary" style="margin:3px" onclick="rimuoviGusto119('${m.id}','${type}',${i})">${H(x)} ×</button>`).join(''):'<span class="meta">Nessuno.</span>';
    openModal('Gusti di '+m.nome,`
      <div class="note">Queste scelte influenzano i <b>consigli del giorno</b>. Non eliminano e non nascondono ricette dal ricettario.</div>
      <h3 style="margin-top:16px">❤️ Ingredienti preferiti</h3>
      <div id="v119FavChips" style="margin:6px 0 10px">${chips(m.ingredientiPreferiti,'preferito')}</div>
      <div class="row"><input id="v119FavInput" class="search" placeholder="Es. pesto, salmone, zucchine"><button class="btn" onclick="aggiungiGusto119('${m.id}','preferito')">Aggiungi</button></div>
      <h3 style="margin-top:18px">🚫 Ingredienti non graditi</h3>
      <div class="meta">Se una proposta contiene uno di questi ingredienti, non viene consigliata a ${H(m.nome)}.</div>
      <div id="v119NoChips" style="margin:6px 0 10px">${chips(m.ingredientiNonGraditi,'non_gradito')}</div>
      <div class="row"><input id="v119NoInput" class="search" placeholder="Es. funghi, cipolla, tonno"><button class="btn" onclick="aggiungiGusto119('${m.id}','non_gradito')">Aggiungi</button></div>
    `);
  };
  window.aggiungiGusto119=function(memberId,type){
    const m=idm(memberId);if(!m)return;const inp=document.getElementById(type==='preferito'?'v119FavInput':'v119NoInput');const v=String(inp?.value||'').trim();if(!v)return toast('Inserisci un ingrediente');
    const arr=type==='preferito'?m.ingredientiPreferiti:m.ingredientiNonGraditi;if(!arr.some(x=>N(x)===N(v)))arr.push(v);
    save();renderMembri?.();renderPreferiti?.();renderConsigli?.();apriGusti119(memberId);toast('Gusto salvato');
  };
  window.rimuoviGusto119=function(memberId,type,i){
    const m=idm(memberId);if(!m)return;const arr=type==='preferito'?m.ingredientiPreferiti:m.ingredientiNonGraditi;arr.splice(i,1);save();renderMembri?.();renderPreferiti?.();renderConsigli?.();apriGusti119(memberId);
  };

  function montaGustiFamiglia(){
    const box=document.getElementById('membri');if(!box)return;
    const cards=[...box.querySelectorAll(':scope > .card')];
    st.membri.forEach((m,i)=>{
      const c=cards[i];if(!c||c.querySelector('.v119-gusti'))return;
      const d=document.createElement('div');d.className='v119-gusti';d.style.marginTop='10px';
      d.innerHTML=`<div class="meta"><b>Ingredienti preferiti:</b> ${m.ingredientiPreferiti.length?H(m.ingredientiPreferiti.join(', ')):'—'}<br><b>Non graditi:</b> ${m.ingredientiNonGraditi.length?H(m.ingredientiNonGraditi.join(', ')):'—'}</div><button class="btn small secondary" style="margin-top:8px" onclick="apriGusti119('${m.id}')">⚙️ Gestisci gusti</button>`;
      c.appendChild(d);
    });
  }
  const oldRenderMembri=window.renderMembri;
  if(typeof oldRenderMembri==='function')window.renderMembri=function(){const r=oldRenderMembri();montaGustiFamiglia();return r};

  // Nuovo consiglio famiglia: data/registro/dispensa + ingredienti preferiti e non graditi.
  st.v119ConsiglioIndice=st.v119ConsiglioIndice||{};
  function ruolo(r){
    const t=(r.tags||[]).map(N),n=N(r.nome),c=N(r.categoria);
    if(t.includes('dolce')||t.includes('condimento')||t.includes('colazione')||t.includes('spuntino')||t.includes('merenda')||t.includes('antipasto')||t.includes('contorno'))return 'altro';
    if(t.includes('primo')||t.includes('secondo')||t.includes('piatto unico')||t.includes('piatto_unico'))return 'pasto';
    if(['carne','pesce','uova','legumi','cereali','latticini'].includes(c))return 'pasto';
    return /pasta|riso|risotto|gnocchi|pollo|manzo|pesce|frittata|zuppa|cous cous|farro|orzo/.test(n)?'pasto':'altro';
  }
  function daysAgo(d){if(!d)return 999;return Math.round((new Date(today()+'T12:00:00')-new Date(d+'T12:00:00'))/86400000)}
  function scoreFam(r){
    if(st.membri.some(m=>hasAny(r,m.ingredientiNonGraditi)))return -999999;
    let s=50;
    st.membri.forEach(m=>{s+=countAny(r,m.ingredientiPreferiti)*16;if((m.preferiti||[]).includes(r.id))s+=7});
    const pan=(st.dispensa||[]).map(x=>N(x.nome));s+=(r.ingredienti||[]).filter(i=>pan.some(p=>p&&N(i).includes(p))).length*3;
    (st.registro||[]).forEach(x=>{if((x.ricetta_id===r.id||N(x.consumato)===N(r.nome))&&daysAgo(x.data)<=3)s-=55});
    let h=2166136261;const seed=today()+'|'+r.id;for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619)}s+=(h>>>0)%17;
    return s;
  }
  function applicaConsiglioFam119(){
    const box=document.getElementById('consigliGiorno');if(!box)return;
    const rank=RICETTE.filter(r=>ruolo(r)==='pasto').map(r=>({r,s:scoreFam(r)})).filter(x=>x.s>-900000).sort((a,b)=>b.s-a.s||a.r.minuti-b.r.minuti);
    if(!rank.length)return;
    const k=today(),idx=Number(st.v119ConsiglioIndice[k]||0)%Math.min(rank.length,40),p=rank[idx];
    const card=[...box.querySelectorAll('.card.hero')].find(x=>/piatto del giorno per la famiglia/i.test(x.textContent));if(!card)return;
    const why=[];st.membri.forEach(m=>{const hits=(m.ingredientiPreferiti||[]).filter(t=>hasTerm(p.r,t));if(hits.length)why.push(m.nome+': '+hits.join(', '))});
    card.innerHTML=`<div class="row between"><div><h3>🍽️ Piatto del giorno per la famiglia</h3><div class="meta">Considera giorno, pasti registrati, dispensa, ricette preferite e gusti dei singoli membri.</div></div><span class="pill">${Math.max(0,Math.min(100,p.s))}/100</span></div><div class="recipe-title" style="margin-top:11px">${H(p.r.nome)} · ${H(p.r.variante||'')}</div><div class="meta">${p.r.minuti} minuti · ${H(p.r.difficolta||'')}</div>${why.length?`<div class="meta" style="margin-top:5px">❤️ Preferenze abbinate: ${H(why.join(' · '))}</div>`:''}<div class="shop-actions"><button class="btn small" onclick="openRecipe('${p.r.id}')">Apri ricetta</button><button class="btn small secondary" onclick="segnaMangiato113('${p.r.id}')">✓ Segna mangiato</button><button class="btn small soft" onclick="altroConsiglio119()">🔄 Un altro consiglio</button></div>`;
  }
  window.altroConsiglio119=function(){const k=today();st.v119ConsiglioIndice[k]=Number(st.v119ConsiglioIndice[k]||0)+1;save();renderConsigli?.()};
  const oldRenderConsigli=window.renderConsigli;
  if(typeof oldRenderConsigli==='function')window.renderConsigli=function(){const r=oldRenderConsigli();setTimeout(applicaConsiglioFam119,0);return r};

  // Registro alimentare reale: quantità, porzioni, calorie e macro.
  window.apriRegistraPasto=function(){
    const opts=st.membri.map(m=>`<option value="${H(m.id)}">${H(m.nome)}</option>`).join('');
    openModal('Registra ciò che hai mangiato',`
      <div class="note">Registra il consumo <b>reale</b>. Calorie e macronutrienti si riferiscono alla quantità effettivamente mangiata, non al piano teorico.</div>
      <div class="grid2" style="margin-top:12px"><label>Membro<select id="logMembro119" class="search">${opts}</select></label><label>Data<input id="logData119" class="search" type="date" value="${today()}"></label></div>
      <div class="grid2" style="margin-top:10px"><label>Pasto<select id="logTipo119" class="search"><option>Colazione</option><option>Spuntino</option><option>Pranzo</option><option>Merenda</option><option>Cena</option><option>Altro</option></select></label><label>Tipologia<select id="logCategoria119" class="search"><option>Primo</option><option>Secondo</option><option>Contorno</option><option>Piatto unico</option><option>Snack</option><option>Bevanda</option><option>Altro</option></select></label></div>
      <label style="display:block;margin-top:10px">Alimento / piatto<input id="logNome119" class="search" placeholder="Es. pasta al pesto, yogurt, pollo..."></label>
      <div class="grid3" style="margin-top:10px"><label>Quantità<input id="logQta119" class="search" inputmode="decimal" placeholder="es. 180"></label><label>Unità<select id="logUnita119" class="search"><option>g</option><option>ml</option><option>porzione</option><option>pezzi</option></select></label><label>Porzioni<input id="logPorzioni119" class="search" inputmode="decimal" value="1"></label></div>
      <h3 style="margin-top:16px">Valori nutrizionali della quantità consumata</h3>
      <div class="grid2"><label>Calorie (kcal)<input id="logKcal119" class="search" inputmode="decimal" placeholder="0"></label><label>Proteine (g)<input id="logProt119" class="search" inputmode="decimal" placeholder="0"></label><label>Carboidrati (g)<input id="logCarb119" class="search" inputmode="decimal" placeholder="0"></label><label>Grassi (g)<input id="logFat119" class="search" inputmode="decimal" placeholder="0"></label></div>
      <div class="meta" style="margin-top:8px">Se non conosci ancora i valori, puoi salvare comunque il pasto: verrà indicato come “nutrizione da completare”.</div>
      <button class="btn full" style="margin-top:14px" onclick="salvaRegistroPasto()">Salva consumo reale</button>
    `);
  };
  window.salvaRegistroPasto=function(){
    const nome=String(document.getElementById('logNome119')?.value||'').trim();if(!nome)return toast('Inserisci alimento o piatto');
    const mid=document.getElementById('logMembro119')?.value||st.membri[0]?.id||'';
    const kcal=num(document.getElementById('logKcal119')?.value),prot=num(document.getElementById('logProt119')?.value),carb=num(document.getElementById('logCarb119')?.value),fat=num(document.getElementById('logFat119')?.value);
    st.registro=Array.isArray(st.registro)?st.registro:[];
    st.registro.push({id:'l119'+Date.now(),member_id:mid,data:document.getElementById('logData119')?.value||today(),pasto:document.getElementById('logTipo119')?.value||'Altro',tipo_cibo:document.getElementById('logCategoria119')?.value||'Altro',consumato:nome,quantita:num(document.getElementById('logQta119')?.value),unita:document.getElementById('logUnita119')?.value||'g',porzioni:Math.max(0.01,num(document.getElementById('logPorzioni119')?.value)||1),kcal,proteine_g:prot,carboidrati_g:carb,grassi_g:fat,nutrizione_compilata:(kcal>0||prot>0||carb>0||fat>0),feedback:'neutro',categorie:[]});
    st.v119Nutrizione.membroRegistro=mid;st.v119Nutrizione.dataRegistro=document.getElementById('logData119')?.value||today();save();closeModal();renderRegistro?.();renderConsigli?.();toast('Consumo reale registrato');
  };

  function totals(mid,date){
    const arr=(st.registro||[]).filter(x=>(x.member_id||st.membri[0]?.id)===mid&&x.data===date);
    return {arr,kcal:arr.reduce((s,x)=>s+num(x.kcal),0),p:arr.reduce((s,x)=>s+num(x.proteine_g),0),c:arr.reduce((s,x)=>s+num(x.carboidrati_g),0),f:arr.reduce((s,x)=>s+num(x.grassi_g),0),missing:arr.filter(x=>!x.nutrizione_compilata).length};
  }
  function delta(v,t,u){if(!t)return '<span class="meta">obiettivo non impostato</span>';const d=v-t;return `<b>${d>=0?'+':''}${fmt(d,1)} ${u}</b>`}
  window.apriObiettivi119=function(memberId){
    const m=idm(memberId);if(!m)return;const o=st.v119Nutrizione.obiettivi[memberId]||{};
    openModal('Obiettivi giornalieri · '+m.nome,`<div class="note">Inserisci gli obiettivi concordati/decisi per il profilo. Dalla Simo li usa solo come riferimento del registro reale.</div><div class="grid2" style="margin-top:12px"><label>Calorie<input id="objK119" class="search" inputmode="decimal" value="${H(o.kcal||'')}"></label><label>Proteine (g)<input id="objP119" class="search" inputmode="decimal" value="${H(o.p||'')}"></label><label>Carboidrati (g)<input id="objC119" class="search" inputmode="decimal" value="${H(o.c||'')}"></label><label>Grassi (g)<input id="objF119" class="search" inputmode="decimal" value="${H(o.f||'')}"></label></div><button class="btn full" style="margin-top:12px" onclick="salvaObiettivi119('${m.id}')">Salva obiettivi</button>`);
  };
  window.salvaObiettivi119=function(mid){st.v119Nutrizione.obiettivi[mid]={kcal:num(document.getElementById('objK119')?.value),p:num(document.getElementById('objP119')?.value),c:num(document.getElementById('objC119')?.value),f:num(document.getElementById('objF119')?.value)};save();closeModal();renderRegistro?.();toast('Obiettivi salvati')};
  window.cambiaRegistro119=function(){st.v119Nutrizione.membroRegistro=document.getElementById('v119RegMembro')?.value||st.v119Nutrizione.membroRegistro;st.v119Nutrizione.dataRegistro=document.getElementById('v119RegData')?.value||today();save();renderRegistro?.()};
  window.eliminaRegistro119=function(id){if(!confirm('Eliminare questa registrazione?'))return;st.registro=(st.registro||[]).filter(x=>x.id!==id);save();renderRegistro?.()};

  const oldRenderRegistro=window.renderRegistro;
  window.renderRegistro=function(){
    if(typeof oldRenderRegistro==='function')oldRenderRegistro();
    const list=document.getElementById('listaRegistro');if(!list)return;
    let summary=document.getElementById('v119Summary');if(!summary){summary=document.createElement('div');summary.id='v119Summary';list.parentNode.insertBefore(summary,list)}
    const mid=st.v119Nutrizione.membroRegistro||st.membri[0]?.id||'',date=st.v119Nutrizione.dataRegistro||today(),m=idm(mid)||st.membri[0];if(!m)return;
    const t=totals(m.id,date),o=st.v119Nutrizione.obiettivi[m.id]||{};
    summary.innerHTML=`<div class="card hero"><div class="row between"><div><h3>📊 Consumo reale del giorno</h3><div class="meta">Confronto fra ciò che hai registrato e gli obiettivi del profilo.</div></div><button class="btn small secondary" onclick="apriObiettivi119('${m.id}')">Obiettivi</button></div><div class="grid2" style="margin-top:12px"><select id="v119RegMembro" class="search" onchange="cambiaRegistro119()">${st.membri.map(x=>`<option value="${x.id}" ${x.id===m.id?'selected':''}>${H(x.nome)}</option>`).join('')}</select><input id="v119RegData" class="search" type="date" value="${H(date)}" onchange="cambiaRegistro119()"></div><div class="grid2" style="margin-top:12px"><div class="note"><b>${fmt(t.kcal)} kcal</b><br>${o.kcal?`obiettivo ${fmt(o.kcal)} · ${delta(t.kcal,o.kcal,'kcal')}`:'obiettivo non impostato'}</div><div class="note"><b>${fmt(t.p,1)} g proteine</b><br>${o.p?`obiettivo ${fmt(o.p,1)} · ${delta(t.p,o.p,'g')}`:'obiettivo non impostato'}</div><div class="note"><b>${fmt(t.c,1)} g carboidrati</b><br>${o.c?`obiettivo ${fmt(o.c,1)} · ${delta(t.c,o.c,'g')}`:'obiettivo non impostato'}</div><div class="note"><b>${fmt(t.f,1)} g grassi</b><br>${o.f?`obiettivo ${fmt(o.f,1)} · ${delta(t.f,o.f,'g')}`:'obiettivo non impostato'}</div></div>${t.missing?`<div class="note" style="margin-top:10px">⚠️ ${t.missing} registrazion${t.missing===1?'e':'i'} senza calorie/macronutrienti: i totali sono quindi parziali.</div>`:''}<button class="btn full" style="margin-top:12px" onclick="apriRegistraPasto()">＋ Registra ciò che hai mangiato</button></div>`;
    const rows=(st.registro||[]).filter(x=>(x.member_id||st.membri[0]?.id)===m.id&&x.data===date).slice().reverse();
    list.innerHTML=rows.length?`<div class="card">${rows.map(x=>`<div class="log-row"><div class="row between"><div style="min-width:0"><div class="recipe-title">${H(x.consumato)}</div><div class="meta">${H(x.pasto||'')} · ${x.quantita?fmt(x.quantita,1)+' '+H(x.unita||''):H(x.tipo_cibo||'')}</div><div class="meta">${x.nutrizione_compilata?`${fmt(x.kcal)} kcal · P ${fmt(x.proteine_g,1)} g · C ${fmt(x.carboidrati_g,1)} g · G ${fmt(x.grassi_g,1)} g`:'Nutrizione da completare'}</div></div><button class="btn small danger" onclick="eliminaRegistro119('${H(x.id)}')">Elimina</button></div></div>`).join('')}</div>`:'<div class="card empty">Nessun consumo reale registrato per questo giorno.</div>';
  };

  montaGustiFamiglia();renderRegistro();save();
  window.__DALLA_SIMO_FAMILY_NUTRITION_V119__='gusti+registro-macro';
}
boot119FamilyNutrition();
})();
