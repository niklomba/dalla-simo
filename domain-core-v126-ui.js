// Dalla Simo v1.26 — il piano alimentare al centro dell'app.
(function(root){
'use strict';
if(typeof document==='undefined')return;
const H=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const days=['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
const symbols=['☕','🥛','🍽️','🍎','🌙'];
const romeDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const todayIndex=()=>{const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',weekday:'long'}).format(new Date());return ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].indexOf(parts);};
function detail(title,body){return '<details class="card v126-details"><summary>'+H(title)+'</summary><div class="v126-details-body">'+body+'</div></details>';}
function sections(arr){return (arr||[]).map(s=>'<section class="v126-source-section"><h3>'+H(s.title)+'</h3>'+(s.blocks||[]).map(b=>b.type==='table'?'<table class="v126-table">'+b.rows.map(r=>'<tr><th scope="row">'+H(r[0])+'</th><td>'+H(r[1])+'</td></tr>').join('')+'</table>':b.type==='meal'?'<h4>'+H(b.name||('Alternativa '+b.alternative))+'</h4><ul>'+(b.items||[]).map(x=>'<li>'+H(x)+'</li>').join('')+'</ul>':b.type==='list'?'<ul>'+b.items.map(x=>'<li>'+H(x)+'</li>').join('')+'</ul>':b.type==='heading'?'<h4>'+H(b.text)+'</h4>':'<p>'+H(b.text||'')+'</p>').join('')+'</section>').join('');}
async function boot(){
  if(typeof st==='undefined'||!root.v126Diet||!root.v122GetPrivateDiet||!root.v124RenderMeal)return setTimeout(boot,100);
  await root.v122PrivateDietReady;
  if(root.v126Diet.ready)await root.v126Diet.ready;
  st.v126UI=st.v126UI||{};
  const api=()=>root.v126Diet;
  const diet=()=>root.v126GetDiet?root.v126GetDiet():api().getDiet();
  const plan=()=>root.v126SelectedPlan?root.v126SelectedPlan():api().selectedPlan();
  const qty=(q,u)=>api().qty(q,u);
  if(!st.v126UI.initialized){st.giornoPlanner=days[todayIndex()];st.v126UI.initialized=true;save();}
  const style=document.createElement('style');style.id='v126css';style.textContent=`
    .app{max-width:1140px;padding-bottom:105px}.nav{width:min(1140px,100%);grid-template-columns:repeat(6,1fr)}
    header{padding:10px 20px}.brand-logo{width:48px;height:48px;border-radius:10px}.brand-title{font-size:20px}.brand-subtitle{font-size:11px}
    main{padding:24px;overflow:hidden}h1{font-size:32px;line-height:1.15;margin:5px 0 19px}.nav button{min-height:48px;font-size:11px}.nav b{font-size:19px}
    .v126-eyebrow{font-size:12px;letter-spacing:.06em;color:var(--green);font-weight:750}.v126-intro{margin:0 0 20px;line-height:1.5;color:var(--muted);font-size:13px}
    .v126-today{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.v126-meal{border:1px solid var(--border);border-radius:18px;background:#fff;padding:17px;min-width:0}
    .v126-today>.v126-meal:last-child{grid-column:1/-1}.v126-meal h3{font-size:16px;display:flex;gap:9px;align-items:center;margin-bottom:12px}
    .v126-ingredients{list-style:none;padding:0;margin:0}.v126-ingredients li{display:flex;gap:14px;justify-content:space-between;align-items:start;padding:8px 0;border-bottom:1px solid #f0eee8;line-height:1.4;font-size:13px}
    .v126-ingredients li:last-child{border:0}.v126-food{min-width:0;overflow-wrap:anywhere}.v126-weight{flex:0 0 auto;font-weight:800;color:#426448;text-align:right;max-width:45%;font-size:13px}.v126-weight small{display:block;font-size:10px;font-weight:500;margin-top:3px;color:var(--muted)}
    .v126-meal details{margin-top:12px;border-top:1px solid var(--border);padding-top:11px}.v126-meal summary{font-size:12px;font-weight:700;color:var(--green);cursor:pointer}
    .v126-meal .v122-meal-title{display:none}.v126-meal .v122-list{font-size:12px}.v126-meal .v124-meal-shop{display:none}
    .v126-actions{display:flex;gap:9px;flex-wrap:wrap;margin:18px 0}.v126-actions .btn{flex:1;min-width:145px}.v126-details{box-shadow:none;padding:15px;margin-top:15px}.v126-details summary{cursor:pointer;font-weight:700;line-height:1.5}.v126-details-body{padding-top:14px}
    .v126-day-tabs{display:flex;overflow:auto;gap:7px;padding:4px 0 13px;scrollbar-width:thin}.v126-day-tabs button{flex:0 0 auto;white-space:nowrap;min-height:40px}.v126-day-tabs [aria-pressed=true]{background:var(--green);color:white}
    .v126-week{display:flex;overflow-x:auto;gap:16px;scroll-snap-type:x mandatory;scroll-padding-left:0;overscroll-behavior-x:contain;padding-bottom:14px;scrollbar-color:#a4b59f #f1f3ec;scrollbar-width:thin;align-items:stretch}
    .v126-day{flex:0 0 340px;scroll-snap-align:start;min-width:0;background:#f1f5ef;border:1px solid var(--border);border-radius:20px;padding:12px}.v126-day>header{position:static;background:transparent;padding:5px 4px 12px;z-index:auto;display:flex;align-items:center;justify-content:space-between;gap:8px;backdrop-filter:none;border:0}.v126-day>header h2{font-size:18px}.v126-day.on{border-color:#87a181}.v126-day .v126-meal{margin-bottom:10px;padding:12px}.v126-day .v126-meal:last-child{margin-bottom:0}.v126-day .v126-ingredients li{font-size:12px;padding:7px 0}.v126-day .v126-weight{font-size:12px}.v126-day .v126-meal h3{font-size:13px;margin-bottom:8px}
    .v126-week-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:end;margin:0 0 18px}.v126-week-tools label{flex:1;font-size:12px;font-weight:700;min-width:155px}.v126-week-tools input{display:block;margin-top:6px}.v126-week-tools .btn{min-height:44px}
    .v126-source-section{margin:0 0 22px}.v126-source-section p,.v126-source-section li{font-size:13px;line-height:1.55}.v126-source-section h4{font-size:13px}.v126-table{border-collapse:collapse;width:100%;font-size:13px}.v126-table th,.v126-table td{border-bottom:1px solid var(--border);padding:10px;text-align:left}.v126-table td{font-weight:750}.v126-nutrition-line{margin:14px 0;font-size:12px;line-height:1.6;color:var(--muted)}
    #spesa>.v126-details,#famiglia>.v126-details{margin-top:13px}#famiglia #membri .card{box-shadow:none}#settimana>.v118-back,#oggi>.v118-back{display:none}
    button:focus-visible,summary:focus-visible,a:focus-visible{outline:3px solid #8fab8a;outline-offset:3px}input:focus-visible,select:focus-visible{outline:2px solid #8fab8a}
    @media(max-width:650px){main{padding:18px 14px}.v126-today{grid-template-columns:1fr;gap:11px}.v126-today>.v126-meal:last-child{grid-column:auto}h1{font-size:28px}.v126-day{flex-basis:calc(100% - 8px)}.nav button{font-size:10px}.nav b{font-size:18px}.v126-meal{padding:15px}.v126-week-tools .btn{width:100%}}
    @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
  `;document.head.appendChild(style);
  function renderMeal(meal,d,m){
    const ingredients=api().selectedIngredients(meal,d,m,st.v124||{});
    return `<section class="v126-meal" data-v126-meal="${d}-${m}"><h3><span aria-hidden="true">${symbols[m]||'🍽️'}</span>${H(meal.name)}</h3><ul class="v126-ingredients">${ingredients.map(i=>{
      const prescribed=qty(i.prescribedAmount!==undefined?i.prescribedAmount:i.amount,i.prescribedUnit||i.unit);
      const shopping=i.prescribedUnit&&i.prescribedUnit!==i.unit?'<small>Spesa: '+H(qty(i.amount,i.unit))+'</small>':i.amount===null?'<small>Grammi da indicare</small>':'';
      return '<li><span class="v126-food">'+H(i.name)+'</span><span class="v126-weight">'+H(prescribed)+shopping+'</span></li>';
    }).join('')}</ul><details><summary>Alternative e quantità per la spesa</summary>${root.v124RenderMeal(meal,d,m)||''}</details></section>`;
  }
  function energy(d){
    const e=root.DallaSimoNutrition126?.dietTotals?.(d,plan(),st.v124||{});if(!e)return '';
    const kcal=e.kcal??e.totals?.kcal??e.total?.kcal;
    const hasCalories=Number.isFinite(kcal)&&(e.known?.kcal>0||kcal>0);
    return '<div class="v126-nutrition-line">'+(hasCalories?'<b>'+H(Math.round(kcal))+' kcal</b> conteggiate dal menù · ':'Calorie del menù da completare · ')+(e.complete?'Valori nutrizionali indicativi.':'Totale parziale: completa grammi e valori degli alimenti.')+' <button class="btn small secondary" onclick="apriValoriDieta126('+d+')">Completa i valori</button></div>';
  }
  root.renderConsigli=function(){
    const p=plan(),di=todayIndex(),day=p?.week?.[di];if(!day)return;
    const date=new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',weekday:'long',day:'numeric',month:'long'}).format(new Date());
    document.getElementById('oggi').innerHTML=`<div class="v126-eyebrow">${H(date)} · piano alimentare</div><h1>Menù di oggi</h1><p class="v126-intro">${H(p.label)} · Tutti i pasti e le porzioni della giornata.</p><div id="v126TodayMenu" class="v126-today">${day.meals.map((m,j)=>renderMeal(m,di,j)).join('')}</div>${energy(di)}<div class="v126-actions"><button class="btn" onclick="v124Shop('day',${di});showScreenById('spesa')">Metti il giorno in spesa</button><button class="btn secondary" onclick="v126OpenDiet(${di})">Vedi tutta la dieta</button></div><p class="tiny">Pesi crudi e al netto degli scarti. Per le dosi q.b. puoi indicare i grammi nella spesa.</p>${detail('Diario alimentare e calorie','<p class="meta">Registra quello che mangi quando cambi un pasto. Puoi usare i valori della confezione o leggere il codice del prodotto.</p><div class="v126-actions"><button class="btn" onclick="apriRegistraPasto()">Registra alimento</button><button class="btn secondary" onclick="showScreenById(\'registro\')">Calorie e macronutrienti</button></div>')}<div id="consigliGiorno" hidden></div>`;
  };
  function renderDiet(){
    if(st.v122?.vista==='altre')return legacyDiet?.();
    const p=plan(),data=diet(),sec=document.getElementById('settimana');if(!p||!data||!sec)return;
    const di=Math.max(0,days.indexOf(st.giornoPlanner));
    sec.innerHTML=`<div class="v126-eyebrow">Piano alimentare incluso</div><h1>Tutta la dieta</h1><p class="v126-intro">Una settimana, cinque pasti al giorno. Scorri i giorni oppure scegli quello che ti interessa.</p><div class="v126-day-tabs" aria-label="Giorni della dieta">${days.map((g,i)=>'<button class="btn small secondary" data-v126-tab="'+i+'" aria-pressed="'+(i===di)+'" onclick="v126SelectDay('+i+')">'+H(g)+'</button>').join('')}</div><div id="v126Week" class="v126-week" tabindex="0" aria-label="Menù completo della settimana">${p.week.map((d,i)=>`<article class="v126-day ${i===di?'on':''}" data-v126-day="${i}"><header><h2>${H(d.day)}</h2><button class="btn small secondary" onclick="v124Shop('day',${i})">+ Spesa</button></header>${d.meals.map((m,j)=>renderMeal(m,i,j)).join('')}</article>`).join('')}</div><div class="v126-actions"><button class="btn" onclick="v124Shop('week');showScreenById('spesa')">Metti la settimana in spesa</button><button class="btn secondary" onclick="showScreenById('spesa')">Apri spesa</button></div><p class="tiny">Le alternative selezionate valgono per Oggi e per la spesa. L’olio resta 20 g al giorno, ripartito in 10 g a pranzo e 10 g a cena.</p>${detail('Piano, periodo della spesa e sostituzioni',`<label for="v126Plan">Piano da consultare</label><select id="v126Plan" class="search" onchange="v126ChangePlan(this.value)">${data.plans.map(x=>'<option value="'+H(x.id)+'" '+(x.id===p.id?'selected':'')+'>'+H(x.label)+'</option>').join('')}</select><p class="meta">${H(p.description)}</p><div class="v126-week-tools"><label>Settimana della spesa dal<input id="v126ShopStart" class="search" type="date" value="${H(st.v124.shopStart)}" onchange="v124SetWeek(this.value)"></label></div><p class="meta">La spesa somma ogni porzione una sola volta per questo periodo. Per acquistare per una settimana diversa cambia la data.</p><p class="meta">Sostituzioni richieste: lunedì platessa 150 g, giovedì pesce spada 150 g, sabato polpo 150 g. Il documento originale resta tra i piani consultabili.</p>`)}${detail('Calorie e macronutrienti del menù','<p class="meta">Completa i valori per 100 g degli alimenti e le quantità senza grammi. Il diario confronta i consumi con il menù del giorno quando il conteggio è completo.</p><button class="btn secondary" onclick="apriValoriDieta126('+di+')">Valori del giorno selezionato</button>')}${detail('Tabelle delle porzioni e alternative originali',sections(data.foodSections))}${detail('Note, cotture e indicazioni del documento',sections(data.notes))}${detail('Copie e gestione del piano','<div class="v126-actions"><button class="btn secondary" onclick="v122ExportText()">Scarica dieta in testo</button><button class="btn secondary" onclick="v122ExportDiet()">Esporta piano</button><button class="btn secondary" onclick="v122ImportClick()">Importa piano</button></div><input id="v122PrivateFile" type="file" accept="application/json,.json" hidden onchange="v122ImportFiles(this)"><p class="meta">Il piano è già nell’app, senza fotografie, cognomi o recapiti. Le preferenze e i dati inseriti restano sul dispositivo.</p>')}<div id="pianoGiorno" hidden></div><div id="giorniPlanner" hidden></div>`;
    const week=document.getElementById('v126Week');
    requestAnimationFrame(()=>{const card=week.querySelector('[data-v126-day="'+di+'"]');if(card)week.scrollLeft=card.offsetLeft-week.firstElementChild.offsetLeft;markDay(di);});
    let timer;week.addEventListener('scroll',()=>{clearTimeout(timer);timer=setTimeout(()=>{
      const cards=[...week.querySelectorAll('.v126-day')],first=cards[0]?.offsetLeft||0;
      const selected=cards[days.indexOf(st.giornoPlanner)],box=week.getBoundingClientRect(),selectedBox=selected?.getBoundingClientRect();
      const atEnd=week.scrollWidth-week.clientWidth-week.scrollLeft<3;
      if(atEnd&&selectedBox&&selectedBox.left>=box.left-2&&selectedBox.right<=box.right+2){markDay(days.indexOf(st.giornoPlanner));return;}
      const target=cards.reduce((best,c)=>Math.abs(c.offsetLeft-first-week.scrollLeft)<Math.abs(best.offsetLeft-first-week.scrollLeft)?c:best,cards[0]);
      if(target)markDay(Number(target.dataset.v126Day));
    },140);},{passive:true});
  }
  const legacyDiet=root.renderSettimana;
  function markDay(i){
    document.querySelectorAll('[data-v126-tab]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.v126Tab)===i)));
    document.querySelectorAll('[data-v126-day]').forEach(c=>c.classList.toggle('on',Number(c.dataset.v126Day)===i));
    if(st.giornoPlanner!==days[i]){st.giornoPlanner=days[i];save();}
    const tab=document.querySelector('[data-v126-tab="'+i+'"]'),bar=tab?.parentElement;if(tab&&bar){const a=tab.getBoundingClientRect(),b=bar.getBoundingClientRect();if(a.left<b.left)bar.scrollLeft-=b.left-a.left;else if(a.right>b.right)bar.scrollLeft+=a.right-b.right;}
  }
  root.v126SelectDay=function(i){i=Math.max(0,Math.min(6,Number(i)||0));markDay(i);const week=document.getElementById('v126Week'),card=week?.querySelector('[data-v126-day="'+i+'"]');if(card)week.scrollTo({left:card.offsetLeft-week.firstElementChild.offsetLeft,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});};
  root.v126OpenDiet=function(i){st.v122=st.v122||{};st.v122.vista='simona-originale';if(Number.isInteger(i))st.giornoPlanner=days[i];save();showScreenById('settimana');};
  root.v126ChangePlan=function(id){api().setPlan(id);root.renderConsigli();renderDiet();};
  root.renderSettimana=renderDiet;
  root.v122RenderPrivateDiet=function(){renderDiet();root.renderConsigli();};
  root.v122ScegliGiorno=root.v126SelectDay;
  root.apriDietaOriginaleSimona122=()=>root.v126OpenDiet();
  for(const name of ['v122ImportFiles','v122ClearDiet']){const prev=root[name];if(prev)root[name]=async function(...args){const r=await prev(...args);renderDiet();root.renderConsigli();return r;};}
  const nav=document.querySelector('.nav');nav.setAttribute('aria-label','Navigazione principale');
  nav.innerHTML=[['oggi','☀️','Oggi'],['settimana','📋','Dieta'],['spesa','🛒','Spesa'],['dispensa','🥫','Dispensa'],['ricette','🍲','Ricette'],['famiglia','👪','Famiglia']].map(([id,icon,label])=>'<button type="button" data-s="'+id+'" onclick="'+(id==='settimana'?'v126OpenDiet()':"showScreen('"+id+"',this)")+'"><b aria-hidden="true">'+icon+'</b>'+label+'</button>').join('');
  const oldShow=root.showScreen;
  root.showScreen=function(id,b){const result=oldShow(id,b);if(id==='ricette')root.renderRicette?.();document.querySelectorAll('.nav button').forEach(x=>{x.classList.toggle('on',x.dataset.s===id);if(x.dataset.s===id)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current');});return result;};
  function collapse(el,title){if(!el||el.parentElement?.tagName==='DETAILS')return;const wrapper=document.createElement('details');wrapper.className='card v126-details';wrapper.innerHTML='<summary>'+H(title)+'</summary>';el.parentNode.insertBefore(wrapper,el);wrapper.appendChild(el);el.classList.remove('card');el.classList.add('v126-details-body');}
  const shop=document.getElementById('spesa');shop.querySelector('.sub').textContent='Porzioni del piano, prodotti e quantità totali';
  const manual=shop.querySelector(':scope > .hero');collapse(manual,'Aggiungi prodotto · manuale o codice');
  const bought=document.getElementById('cardComprati');collapse(bought,'Prodotti già comprati');
  shop.appendChild(bought.parentElement);
  const shopNote=[...shop.children].find(e=>e.classList.contains('note'));collapse(shopNote,'Come gestire la lista');
  const shopTop=document.createElement('div');shopTop.className='card hero';shopTop.id='v126ShoppingPlan';shopTop.innerHTML='<h3>La spesa del piano</h3><p class="meta">Ogni prodotto mostra la porzione, quante volte serve e il totale da acquistare.</p><div class="v126-actions"><button class="btn" onclick="v124Shop(\'week\')">Aggiungi settimana</button><button class="btn secondary" onclick="v126OpenDiet()">Scegli pasti e grammi</button></div>';
  shop.querySelector('h1').insertAdjacentElement('afterend',shopTop);
  const beforeShop=root.renderSpesa;
  root.renderSpesa=function(){const r=beforeShop?.();const pending=document.getElementById('listaDaComprare')?.closest('.card'),purchased=document.getElementById('cardComprati')?.parentElement;if(pending&&purchased?.tagName==='DETAILS')shop.insertBefore(pending,purchased);return r;};
  const fam=document.getElementById('famiglia');fam.querySelector('.sub').textContent='Gusti, ingredienti e piatti preferiti di ciascuno';
  for(const el of [...fam.children])if(el.classList.contains('card')||el.classList.contains('transfer-box'))collapse(el,el.querySelector('h3')?.textContent||'Altre opzioni');
  const extra=document.createElement('details');extra.className='card v126-details';extra.innerHTML='<summary>Preferiti, diario e altre informazioni</summary><div class="v126-actions"><button class="btn secondary" onclick="showScreenById(\'preferiti\')">Ricette preferite</button><button class="btn secondary" onclick="showScreenById(\'registro\')">Diario alimentare</button><button class="btn secondary" onclick="showScreenById(\'info\')">Informazioni</button></div>';fam.appendChild(extra);
  const beforeMembers=root.renderMembri;
  root.renderMembri=function(){const r=beforeMembers?.();document.querySelectorAll('#membri>.card').forEach(card=>{const title=card.querySelector('h3')?.textContent||'';if(/Strumenti famiglia|Reset e manutenzione/i.test(title))collapse(card,title);else collapse(card.querySelector('.v122-family-buttons'),'Altri piani e fotografie originali');});return r;};
  const recipeSection=document.getElementById('ricette'),filters=document.createElement('details');filters.id='v126RecipeFilters';filters.className='card v126-details';filters.innerHTML='<summary>Altri filtri · categorie, difficoltà e alfabeto</summary><div class="v126-details-body"></div>';
  const filterBody=filters.lastElementChild;for(const el of [document.getElementById('az'),recipeSection.querySelector('.tabs'),document.getElementById('v113Diff')])if(el)filterBody.appendChild(el);
  document.getElementById('v113RicetteTools')?.insertAdjacentElement('afterend',filters);
  let recipeQuery=null;
  const beforeRecipes=root.renderRicette;
  root.renderRicette=function(){const signature=[document.getElementById('q')?.value,st.filtro,st.lettera,st.v113?.tempoRicette,st.v113?.difficolta].join('|');if(signature!==recipeQuery){st.v113.limite=20;recipeQuery=signature;}const r=beforeRecipes?.();const more=document.querySelector('#risultati>button[onclick*="mostraAltre113"]');if(more)more.textContent='Mostra altre ricette';return r;};
  root.mostraAltre113=function(){st.v113.limite+=20;save();root.renderRicette();};
  const disp=document.getElementById('dispensa');for(const el of [...disp.children])if(el.classList.contains('card')&&/Avanzi/i.test(el.querySelector('h3')?.textContent||''))collapse(el,'Avanzi da utilizzare');
  document.title='Dalla Simo · Piano alimentare v1.26';document.querySelector('.brand-subtitle').textContent='Piano alimentare · v1.26';
  root.__DALLA_SIMO_BUILD__='v1.26';root.__DALLA_SIMO_UI_V126__={version:'1.26',todayFirst:true,horizontalWeek:true,includedAnonymousDiet:true,romeDate};
  root.renderConsigli();root.renderSettimana();root.renderSpesa?.();root.renderRicette?.();root.renderMembri?.();
  root.showScreen('oggi',nav.querySelector('[data-s="oggi"]'));
  let lastDate=romeDate();setInterval(()=>{const now=romeDate();if(now!==lastDate){lastDate=now;root.renderConsigli();root.renderRicette?.();}},60000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')root.renderConsigli();});
}
boot();
})(typeof window!=='undefined'?window:globalThis);
