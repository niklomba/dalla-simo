// Dalla Simo v1.26 — gusti personali, spunti ricette e diario in grammi.
// Il diario usa esclusivamente etichette/dati inseriti: non attribuisce calorie alla dieta.
(function(root){
'use strict';
const KEYS={kcal:'kcal',p:'proteine_g',c:'carboidrati_g',f:'grassi_g'};
const normalize=v=>String(v??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
function number(v){
  if(v===null||v===undefined||String(v).trim()==='')return null;
  const n=Number(String(v).trim().replace(',','.'));
  return Number.isFinite(n)&&n>=0?n:null;
}
function localDate(value=new Date()){
  const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(value);
  const get=t=>p.find(x=>x.type===t)?.value;
  return get('year')+'-'+get('month')+'-'+get('day');
}
function validDate(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return false;
  const d=new Date(value+'T12:00:00Z');
  return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;
}
function calculate(values,amount,basis='100'){
  const q=number(amount);
  if(q===null||q<=0)throw new Error('Inserisci una quantità maggiore di zero.');
  if(basis!=='100'&&basis!=='total')throw new Error('Scegli come sono espressi i valori.');
  const factor=basis==='100'?q/100:1,out={known:{}};
  for(const k of Object.keys(KEYS)){
    const raw=values?.[k],n=number(raw);
    if(raw!==undefined&&raw!==null&&String(raw).trim()!==''&&n===null)throw new Error('I valori nutrizionali devono essere numeri uguali o maggiori di zero.');
    out.known[k]=n!==null;
    out[k]=n===null?null:Math.round(n*factor*10000)/10000;
  }
  out.complete=Object.values(out.known).every(Boolean);
  return out;
}
function knownValue(entry,key){
  const field=KEYS[key],n=number(entry?.[field]);
  if(entry?.v126Known)return entry.v126Known[key]&&n!==null?n:null;
  // Le vecchie versioni riempivano i campi vuoti con 0. Uno zero storico
  // non documentato resta da confermare, così non sembra un dato di etichetta.
  return entry?.nutrizione_compilata&&n!==null&&n>0?n:null;
}
function totals(entries,memberId,date){
  const rows=(entries||[]).filter(x=>x.member_id===memberId&&x.data===date);
  const out={rows,count:rows.length,known:{},missing:{},incomplete:0};
  for(const k of Object.keys(KEYS)){
    const values=rows.map(x=>knownValue(x,k));
    out[k]=values.reduce((s,v)=>s+(v??0),0);
    out.known[k]=values.filter(v=>v!==null).length;
    out.missing[k]=values.filter(v=>v===null).length;
  }
  out.incomplete=rows.filter(x=>Object.keys(KEYS).some(k=>knownValue(x,k)===null)).length;
  return out;
}
function hasTerm(text,term){
  const a=' '+normalize(text)+' ',b=normalize(term);
  return !!b&&a.includes(' '+b+' ');
}
const array=x=>Array.isArray(x)?x:[];
function recommend(recipes,members,pantry,logs,date,maxMinutes=0){
  const pan=array(pantry).map(x=>normalize(x.nome)),people=array(members);
  const rank=[];
  for(const r of array(recipes)){
    const tags=array(r.tags).map(normalize),title=[r.nome,r.variante].filter(Boolean).join(' '),ingredients=array(r.ingredienti).join(' ');
    if(tags.some(t=>['dolce','condimento','colazione','spuntino','merenda','antipasto','contorno'].includes(t)))continue;
    if(maxMinutes&&(!number(r.minuti)||number(r.minuti)>maxMinutes))continue;
    if(people.some(m=>array(m.ingredientiNonGraditi).some(t=>hasTerm(ingredients,t))||array(m.piattiNonGraditi).some(t=>hasTerm(title,t))))continue;
    const reasons=[],stock=[];let score=0;
    people.forEach(m=>{
      const hits=array(m.ingredientiPreferiti).filter(t=>hasTerm(ingredients,t));
      const dishes=array(m.piattiPreferiti).filter(t=>hasTerm(title,t));
      if(hits.length||dishes.length)reasons.push(m.nome+': '+[...hits,...dishes].join(', '));
      score+=hits.length*18+dishes.length*24+(array(m.preferiti).includes(r.id)?20:0);
    });
    array(r.ingredienti).forEach(i=>{if(pan.some(p=>p&&hasTerm(i,p))&&!['sale','pepe','olio','acqua'].includes(normalize(i)))stock.push(i)});
    score+=stock.length*4;
    array(logs).forEach(x=>{
      if(x.ricetta_id!==r.id&&normalize(x.consumato)!==normalize(r.nome))return;
      if(x.member_id!=='tutti'&&!people.some(m=>m.id===x.member_id))return;
      if(!validDate(x.data)||!validDate(date))return;
      const days=(new Date(date+'T12:00:00Z')-new Date(x.data+'T12:00:00Z'))/86400000;
      if(days>=0&&days<=3)score-=60;
    });
    let h=2166136261;for(const c of date+'|'+r.id){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
    score+=(h>>>0)%17;
    rank.push({recipe:r,score,reasons,stock});
  }
  return rank.sort((a,b)=>b.score-a.score||(number(a.recipe.minuti)??999)-(number(b.recipe.minuti)??999));
}
function extractGtin(raw){
  const s=String(raw??'').trim();
  if(/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(s))return s;
  let m=s.match(/\(01\)\s*(\d{14})/);if(m)return m[1];
  m=s.match(/^01(\d{14})(?:\D|$)/);if(m)return m[1];
  try{
    const u=new URL(s);m=u.pathname.match(/(?:^|\/)01\/(\d{14})(?=\/|$)/);if(m)return m[1];
    for(const k of ['01','gtin','ean','upc','barcode','code']){
      const v=u.searchParams.get(k);if(v&&/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(v))return v;
    }
  }catch(e){}
  return '';
}
function productNutrients(product){
  const n=product?.nutriments||{};
  const values={kcal:number(n['energy-kcal_100g']),p:number(n.proteins_100g),c:number(n.carbohydrates_100g),f:number(n.fat_100g)};
  if(values.kcal===null){const kj=number(n['energy-kj_100g']??n.energy_100g);if(kj!==null)values.kcal=Math.round(kj/4.184*10000)/10000}
  return values;
}
function dietKey(ingredient){return normalize(ingredient.name)+'|'+normalize(ingredient.basis||'')}
function dietTotals(day,plan,selection,nutrition){
  const dietApi=root.v126Diet||(typeof require==='function'?require('./domain-core-v126-diet.js'):null);
  plan=plan||root.v126SelectedPlan?.();
  selection=selection||(typeof st!=='undefined'?st.v124||{}:{});
  nutrition=nutrition||selection.alimentiDieta||(typeof st!=='undefined'?st.v126Nutrizione?.alimentiDieta||{}:{});
  if(!plan?.week||!dietApi)return {available:false,complete:false,kcal:0,p:0,c:0,f:0,rows:[],missingWeights:0,missingValues:0};
  const dayIndex=typeof day==='number'?day:plan.week.findIndex(x=>normalize(x.day)===normalize(day));
  const selected=plan.week[dayIndex];if(!selected)return {available:false,complete:false,kcal:0,p:0,c:0,f:0,rows:[],missingWeights:0,missingValues:0};
  const result={available:true,planId:plan.id,day:selected.day,dayIndex,kcal:0,p:0,c:0,f:0,known:{kcal:0,p:0,c:0,f:0},missing:{kcal:0,p:0,c:0,f:0},rows:[],missingWeights:0,missingValues:0,complete:false,estimated:true};
  selected.meals.forEach((meal,m)=>{
    for(const i of dietApi.selectedIngredients(meal,dayIndex,m,selection)){
      const key=dietKey(i),stored=nutrition[key]||nutrition[normalize(i.name)],values=stored?.values||stored||{};
      const units={g:1,kg:1000,ml:1,l:1000},factor=units[i.unit],amount=number(i.amount),weightKnown=!!factor&&amount!==null&&amount>0;
      const q=weightKnown?amount*factor:null,unit=i.unit==='ml'||i.unit==='l'?'ml':'g';
      const unitMatches=!stored?.unita||stored.unita===unit;
      const row={...i,key,meal:meal.name,mealIndex:m,dayIndex,grammi:q,weightKnown,values,known:{},kcal:null,p:null,c:null,f:null,unit,source:stored?.source||''};
      for(const k of Object.keys(KEYS)){
        const v=number(values[k]);row.known[k]=weightKnown&&unitMatches&&v!==null;
        if(row.known[k]){row[k]=Math.round(v*q/100*10000)/10000;result[k]+=row[k];result.known[k]++}else result.missing[k]++;
      }
      row.complete=Object.values(row.known).every(Boolean);
      if(!weightKnown)result.missingWeights++;
      if(!unitMatches||Object.keys(KEYS).some(k=>number(values[k])===null))result.missingValues++;
      result.rows.push(row);
    }
  });
  result.count=result.rows.length;result.complete=result.count>0&&result.rows.every(x=>x.complete);
  for(const k of Object.keys(KEYS))result[k]=Math.round(result[k]*10000)/10000;
  result.caloriesComplete=result.count>0&&result.missing.kcal===0;
  return result;
}
const api={number,localDate,validDate,calculate,knownValue,totals,normalize,hasTerm,recommend,extractGtin,productNutrients,dietKey,dietTotals};
root.DallaSimoNutrition126=api;
if(typeof module!=='undefined'&&module.exports){module.exports=api;return}

function boot(){
  if(typeof st==='undefined'||typeof RICETTE==='undefined'||typeof save!=='function'||typeof openModal!=='function'||typeof root.gestisciScansione117!=='function'||typeof root.apriScanner116!=='function'||!root.__DALLA_SIMO_FAMILY_NUTRITION_V119__)return setTimeout(boot,120);
  if(root.__DALLA_SIMO_NUTRITION_V126__)return;
  const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const js=v=>H(JSON.stringify(String(v??'')));
  const fmt=(n,d=1)=>Number(n||0).toLocaleString('it-IT',{maximumFractionDigits:d});
  const el=id=>document.getElementById(id);
  const call=name=>{if(typeof root[name]==='function')root[name]()};
  const member=id=>array(st.membri).find(m=>m.id===id);
  function initMembers(){array(st.membri).forEach(m=>['ingredientiPreferiti','ingredientiNonGraditi','piattiPreferiti','piattiNonGraditi'].forEach(k=>{m[k]=array(m[k])}))}
  initMembers();
  const simona=array(st.membri).find(m=>normalize(m.nome)==='simona')||st.membri[0];
  st.v119Nutrizione=st.v119Nutrizione||{obiettivi:{}};
  st.v119Nutrizione.obiettivi=st.v119Nutrizione.obiettivi||{};
  st.v126Nutrizione=st.v126Nutrizione||{member:simona?.id||'',date:localDate(),prodotti:{},alimenti:{},adviceMember:'tutti',adviceMinutes:0,adviceIndex:{}};
  const state=()=>{
    if(!st.v126Nutrizione||typeof st.v126Nutrizione!=='object'||Array.isArray(st.v126Nutrizione))st.v126Nutrizione={member:array(st.membri).find(m=>normalize(m.nome)==='simona')?.id||st.membri[0]?.id||'',date:localDate(),adviceMember:'tutti',adviceMinutes:0};
    for(const k of ['prodotti','alimenti','adviceIndex','alimentiDieta'])if(!st.v126Nutrizione[k]||typeof st.v126Nutrizione[k]!=='object'||Array.isArray(st.v126Nutrizione[k]))st.v126Nutrizione[k]={};
    if(!member(st.v126Nutrizione.member))st.v126Nutrizione.member=array(st.membri).find(m=>normalize(m.nome)==='simona')?.id||st.membri[0]?.id||'';
    if(!validDate(st.v126Nutrizione.date))st.v126Nutrizione.date=localDate();
    st.v119Nutrizione=st.v119Nutrizione||{obiettivi:{}};st.v119Nutrizione.obiettivi=st.v119Nutrizione.obiettivi||{};
    return st.v126Nutrizione;
  };
  ['prodotti','alimenti','adviceIndex','alimentiDieta'].forEach(k=>{state()[k]=state()[k]||{}});
  if(!member(state().member))state().member=simona?.id||'';
  if(!validDate(state().date))state().date=localDate();
  let draft=null,activeSeed={},lookupId=0;

  function dayForDate(date){const d=new Date(date+'T12:00:00Z');return (d.getUTCDay()+6)%7}
  function dietForProfile(id,date){return normalize(member(id)?.nome)==='simona'?dietTotals(dayForDate(date)):null}
  function refreshDiet(){save();root.dispatchEvent?.(new Event('v126:nutrition-changed'));call('renderSettimana');call('renderConsigli');call('renderRegistro')}
  let dietEditor=null;
  root.apriValoriDieta126=function(day){
    const t=dietTotals(day);if(!t.available)return toast('Il menu della dieta non è disponibile');
    dietEditor=t;
    const unique=[...new Map(t.rows.map(x=>[x.key,x])).values()];
    openModal('Calorie del menu · '+t.day,`<div class="note">Il conteggio segue gli alimenti e le alternative selezionate nel menu. Inserisci i <b>valori per 100 g / 100 ml</b> dall’etichetta o da una fonte che conosci e pesa le porzioni indicate a pezzi o q.b.</div><div class="note" style="margin-top:10px"><b>${t.complete?'Stima completa: '+fmt(t.kcal,0)+' kcal':'Conteggio parziale: '+fmt(t.kcal,0)+' kcal'}</b><br>${t.missingWeights} porzioni da pesare · ${t.missingValues} porzioni con valori da completare</div><h3 style="margin-top:14px">Valori degli alimenti</h3>${unique.map((x,i)=>{
      const stored=state().alimentiDieta[x.key]||{},values=stored.values||{};
      return `<details class="n126-details"><summary>${H(x.name)} · ${Object.keys(KEYS).every(k=>number(values[k])!==null)?'valori inseriti':'da completare'}</summary><div class="n126-grid n126-fields">${[['kcal','Calorie (kcal)'],['p','Proteine (g)'],['c','Carboidrati (g)'],['f','Grassi (g)']].map(([k,label])=>`<label>${label}<input id="n126Diet_${i}_${k}" class="search" inputmode="decimal" value="${H(values[k]??'')}" placeholder="Per 100"></label>`).join('')}</div><div class="n126-grid n126-fields" style="margin-top:8px"><label>Base dell’etichetta<select id="n126DietUnit_${i}" class="search"><option value="g" ${(stored.unita||x.unit)==='g'?'selected':''}>100 g</option><option value="ml" ${(stored.unita||x.unit)==='ml'?'selected':''}>100 ml</option></select></label><label>Fonte / etichetta<input id="n126DietSource_${i}" class="search" maxlength="200" value="${H(stored.source||'')}" placeholder="Es. etichetta del prodotto"></label></div>${x.note?`<p class="meta">Peso nel piano: ${H(x.note)}</p>`:''}</details>`;
    }).join('')}<details class="n126-details"><summary>Pesa le porzioni a pezzi o q.b.</summary><div class="meta">Questi pesi servono al conteggio e alla spesa. La quantità prescritta nel documento resta visibile.</div>${t.rows.map((x,i)=>{
      if(x.prescribedAmount!==null&&!['pezzi','frutti','uova'].includes(x.prescribedUnit))return '';
      const key=x.dayIndex+'|'+x.mealIndex+'|'+x.itemKey,value=st.v124?.quantities?.[key];
      return `<label class="n126-food" style="display:block;margin-top:10px">${H(x.meal)} · ${H(x.name)} (${H(root.v126Diet?.qty(x.prescribedAmount,x.prescribedUnit)||'q.b.')})<input id="n126DietWeight_${i}" class="search" inputmode="decimal" placeholder="Grammi pesati" value="${H(value??'')}"> g</label>`;
    }).join('')}</details><div class="meta" style="margin-top:14px">Le calorie calcolate sono una stima del menu, distinta dall’eventuale obiettivo indicato nel piano. Fino a quando mancano valori o pesi il diario segnala il confronto come parziale.</div><button class="btn full" style="margin-top:14px" onclick="salvaValoriDieta126()">Salva e collega al diario</button>`);
  };
  root.salvaValoriDieta126=function(){
    if(!dietEditor)return;const t=dietEditor,unique=[...new Map(t.rows.map(x=>[x.key,x])).values()],valuesToSave=[],weightsToSave=[];
    for(let i=0;i<unique.length;i++){
      const values={};for(const k of Object.keys(KEYS)){const raw=el('n126Diet_'+i+'_'+k)?.value??'',n=number(raw);if(String(raw).trim()!==''&&n===null)return toast('Controlla i valori di '+unique[i].name);values[k]=n}
      valuesToSave.push([unique[i].key,{nome:unique[i].name,values,unita:el('n126DietUnit_'+i)?.value||'g',source:String(el('n126DietSource_'+i)?.value||'Valori inseriti da etichetta').trim(),aggiornatoIl:new Date().toISOString()}]);
    }
    for(let i=0;i<t.rows.length;i++){
      const input=el('n126DietWeight_'+i);if(!input)continue;const raw=input.value.trim(),n=number(raw);if(raw&&(n===null||n<=0||n>1000000))return toast('Inserisci un peso valido per '+t.rows[i].name);
      weightsToSave.push([t.dayIndex+'|'+t.rows[i].mealIndex+'|'+t.rows[i].itemKey,raw?n:null]);
    }
    valuesToSave.forEach(([k,v])=>{state().alimentiDieta[k]=v});st.v124=st.v124||{};st.v124.quantities=st.v124.quantities||{};
    weightsToSave.forEach(([k,v])=>{if(v===null)delete st.v124.quantities[k];else st.v124.quantities[k]=v});
    closeModal();refreshDiet();toast('Valori del menu collegati al diario');
  };

  const style=document.createElement('style');style.id='v126NutritionStyle';
  style.textContent='.n126-fields label{display:block;font-weight:650;font-size:14px}.n126-fields .search{margin-top:5px;width:100%;box-sizing:border-box}.n126-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.n126-grid .note{min-width:0}.n126-grid .note b{font-size:19px}.n126-grid .note span{display:block;font-size:12px;margin-top:4px}.n126-details{margin-top:12px}.n126-details summary{cursor:pointer;font-weight:700;padding:8px 0}.n126-chips{margin:6px 0 12px;overflow-wrap:anywhere}.n126-chips .btn{margin:3px}.n126-log-actions{display:flex;gap:6px;flex-wrap:wrap}.n126-food{font-size:13px;line-height:1.5}.n126-preview{margin-top:12px}.n126-advice .recipe-title{margin:10px 0 5px;font-size:20px}.n126-advice .row{flex-wrap:wrap}';
  document.head.appendChild(style);

  function refreshGusti(){save();call('renderMembri');call('renderPreferiti');call('renderRicette')}
  root.apriGusti119=function(id){
    initMembers();const m=member(id);if(!m)return;
    const chips=(items,kind,type)=>items.length?items.map((x,i)=>`<button class="btn small secondary" onclick="rimuoviGusto126(${js(id)},${js(kind)},${js(type)},${i})" aria-label="Rimuovi ${H(x)}">${H(x)} ×</button>`).join(''):'<span class="meta">Ancora nessuno.</span>';
    const group=(title,kind)=>{
      const ingredient=kind==='ingredient',fav=ingredient?'ingredientiPreferiti':'piattiPreferiti',no=ingredient?'ingredientiNonGraditi':'piattiNonGraditi';
      const fid=ingredient?'n126FavIngredient':'n126FavDish',nid=ingredient?'n126NoIngredient':'n126NoDish';
      return `<h3 style="margin-top:16px">${title}</h3><div class="meta">Preferiti</div><div class="n126-chips">${chips(m[fav],kind,'favorite')}</div><div class="row"><input id="${fid}" class="search" maxlength="120" placeholder="${ingredient?'Es. zucchine, pollo':'Es. pasta al pesto'}"><button class="btn" onclick="salvaGusto126(${js(id)},${js(kind)},'favorite')">Aggiungi</button></div><details class="n126-details"><summary>Non graditi (${m[no].length})</summary><div class="n126-chips">${chips(m[no],kind,'avoid')}</div><div class="row"><input id="${nid}" class="search" maxlength="120" placeholder="${ingredient?'Es. funghi':'Es. frittata'}"><button class="btn secondary" onclick="salvaGusto126(${js(id)},${js(kind)},'avoid')">Aggiungi</button></div></details>`;
    };
    openModal('Gusti di '+m.nome,`<div class="note">Ricordiamo ingredienti e piatti graditi anche per i bambini. Queste scelte aiutano i consigli in Ricette.</div>${group('Ingredienti','ingredient')}${group('Piatti','dish')}<details class="n126-details"><summary>Note sui gusti</summary><label class="meta" for="n126TasteNotes">Es. ama le carote crude, sta provando i legumi</label><textarea id="n126TasteNotes" class="search" maxlength="1000">${H(m.noteGusti||'')}</textarea><button class="btn small secondary" onclick="salvaNoteGusti126(${js(id)})">Salva note</button></details>`);
  };
  function tasteKey(kind,type){return kind==='dish'?(type==='avoid'?'piattiNonGraditi':'piattiPreferiti'):(type==='avoid'?'ingredientiNonGraditi':'ingredientiPreferiti')}
  root.salvaGusto126=function(id,kind,type){
    initMembers();const m=member(id);if(!m)return;
    const input=kind==='dish'?(type==='avoid'?'n126NoDish':'n126FavDish'):(type==='avoid'?'n126NoIngredient':'n126FavIngredient');
    const value=String(el(input)?.value||'').trim();if(!value)return toast('Scrivi un ingrediente o un piatto');
    const items=value.split(',').map(x=>x.trim()).filter(Boolean);const key=tasteKey(kind,type),other=tasteKey(kind,type==='avoid'?'favorite':'avoid');
    items.forEach(x=>{if(!m[key].some(t=>normalize(t)===normalize(x)))m[key].push(x);m[other]=m[other].filter(t=>normalize(t)!==normalize(x))});
    refreshGusti();root.apriGusti119(id);toast('Gusti salvati');
  };
  root.rimuoviGusto126=function(id,kind,type,i){const m=member(id);if(!m)return;m[tasteKey(kind,type)].splice(i,1);refreshGusti();root.apriGusti119(id)};
  root.salvaNoteGusti126=function(id){const m=member(id);if(!m)return;m.noteGusti=String(el('n126TasteNotes')?.value||'').trim();refreshGusti();toast('Note salvate')};
  const renderMembers=root.renderMembri;
  root.renderMembri=function(){
    initMembers();if(typeof renderMembers==='function')renderMembers();
    const cards=[...(el('membri')?.querySelectorAll(':scope > .card')||[])];
    array(st.membri).forEach((m,i)=>{
      const c=cards[i];if(!c)return;c.querySelector('.v119-gusti')?.remove();
      const box=document.createElement('div');box.className='v119-gusti';
      box.innerHTML=`<div class="meta"><b>Ingredienti:</b> ${H(m.ingredientiPreferiti.join(', ')||'aggiungi i preferiti')}<br><b>Piatti:</b> ${H(m.piattiPreferiti.join(', ')||'aggiungi i preferiti')}</div><button class="btn small secondary" style="margin-top:8px" onclick="apriGusti119(${js(m.id)})">Gestisci gusti</button>`;c.appendChild(box);
    });
  };
  const scoreMember=root.scorePerMembro;
  if(typeof scoreMember==='function')root.scorePerMembro=function(r,m){
    const person=member(m?.id)||m||{};const title=[r.nome,r.variante].join(' ');
    if(array(person.piattiNonGraditi).some(t=>hasTerm(title,t)))return -100000;
    return scoreMember(r,m)+array(person.piattiPreferiti).filter(t=>hasTerm(title,t)).length*24;
  };

  function renderAdvice(){
    const section=el('ricette');if(!section)return;
    let box=el('v126RecipeAdvice');if(!box){box=document.createElement('div');box.id='v126RecipeAdvice';box.className='card hero n126-advice';const heading=section.querySelector('h1');if(heading)heading.insertAdjacentElement('afterend',box);else section.prepend(box)}
    const chosen=member(state().adviceMember),people=chosen?[chosen]:array(st.membri),minutes=number(state().adviceMinutes)||0,date=localDate();
    const candidates=RICETTE.filter(r=>people.every(m=>{
      const engine=root.DallaSimoEngine;if(typeof engine?.scoreRecipeForMember!=='function')return true;
      const profile=array(st.profiliAlimentari).find(p=>p.member_id===m.id)||null;
      return !engine.scoreRecipeForMember(r,m,{profile,recentCategories:array(st.storicoCategorie),pantryNames:array(st.dispensa).map(x=>x.nome),sample:array(st.registro).length}).blocked;
    }));
    const ranks=recommend(candidates,people,st.dispensa,st.registro,date,minutes),index=Math.abs(Number(state().adviceIndex[date]||0))%Math.min(ranks.length||1,40),pick=ranks[index],r=pick?.recipe;
    box.innerHTML=`<div class="tiny">SPUNTO DEL GIORNO · ${H(new Date(date+'T12:00:00').toLocaleDateString('it-IT',{day:'numeric',month:'long'}))}</div>${r?`<div class="recipe-title">${H(r.nome)}</div><div class="meta">${H(r.minuti)} minuti${r.difficolta?' · '+H(r.difficolta):''}</div>${pick.reasons.length?`<div class="meta" style="margin-top:6px">❤️ ${H(pick.reasons.join(' · '))}</div>`:'<div class="meta" style="margin-top:6px">Aggiungi gusti in Famiglia per rendere i consigli più personali.</div>'}${pick.stock.length?`<div class="meta">In dispensa: ${H(pick.stock.slice(0,4).join(', '))}</div>`:''}<div class="shop-actions"><button class="btn small" onclick="openRecipe(${js(r.id)})">Apri ricetta</button><button class="btn small secondary" onclick="altroConsiglioNutrizione126()">Un altro spunto</button></div>`:'<div class="meta" style="margin:10px 0">Nessuna proposta con questi gusti e tempi. Cambia il tempo o la persona.</div>'}<details class="n126-details"><summary>Personalizza il consiglio</summary><div class="n126-grid n126-fields"><label>Per chi<select id="n126AdviceMember" class="search" onchange="filtraConsiglioNutrizione126()"><option value="tutti">Tutta la famiglia</option>${array(st.membri).map(m=>`<option value="${H(m.id)}" ${m.id===state().adviceMember?'selected':''}>${H(m.nome)}</option>`).join('')}</select></label><label>Tempo massimo<select id="n126AdviceMinutes" class="search" onchange="filtraConsiglioNutrizione126()">${[0,15,30,45,60].map(n=>`<option value="${n}" ${n===minutes?'selected':''}>${n?n+' minuti':'Qualsiasi'}</option>`).join('')}</select></label></div><p class="meta">I non graditi vengono esclusi dagli spunti. Il ricettario resta consultabile con la ricerca per ingredienti e tempo.</p></details>`;
  }
  root.altroConsiglioNutrizione126=function(){const date=localDate();state().adviceIndex[date]=Number(state().adviceIndex[date]||0)+1;save();renderAdvice()};
  root.filtraConsiglioNutrizione126=function(){state().adviceMember=el('n126AdviceMember')?.value||'tutti';state().adviceMinutes=Number(el('n126AdviceMinutes')?.value||0);state().adviceIndex[localDate()]=0;save();renderAdvice();el('v126RecipeAdvice')?.querySelector('details')?.setAttribute('open','')};
  const renderRecipes=root.renderRicette;
  root.renderRicette=function(){if(typeof renderRecipes==='function')renderRecipes();renderAdvice()};

  function readForm(){return {...activeSeed,member_id:el('n126Member')?.value||state().member,data:el('n126Date')?.value||localDate(),pasto:el('n126Meal')?.value||'Altro',consumato:el('n126Name')?.value||'',quantita:el('n126Amount')?.value||'',unita:el('n126Unit')?.value||'g',basis:el('n126Basis')?.value||'100',values:{kcal:el('n126K')?.value??'',p:el('n126P')?.value??'',c:el('n126C')?.value??'',f:el('n126F')?.value??''},remember:!!el('n126Remember')?.checked}}
  function seedFromEntry(x){return {...x,basis:x.v126Basis||'total',values:x.v126Values||{kcal:knownValue(x,'kcal'),p:knownValue(x,'p'),c:knownValue(x,'c'),f:knownValue(x,'f')},source:x.fonte_nutrizione||'Inserimento manuale'}}
  root.apriRegistraPasto=function(seed){
    lookupId++;seed=seed&&typeof seed==='object'?seed:{};activeSeed={...seed};
    const mid=member(seed.member_id)?.id||state().member||simona?.id||'',date=validDate(seed.data)?seed.data:localDate(),basis=seed.basis==='total'?'total':'100',unit=seed.unita==='ml'?'ml':'g',values=seed.values||{};
    openModal(seed.id?'Modifica alimento registrato':'Registra un alimento',`<div class="note">Inserisci la <b>quantità totale che hai mangiato</b>. Il diario calcola calorie e macronutrienti dai valori dell’etichetta.</div><button class="btn full secondary" style="margin-top:10px" onclick="apriScannerNutrizione126()">Scansiona codice a barre / QR</button><div class="n126-fields"><div class="n126-grid" style="margin-top:12px"><label>Persona<select id="n126Member" class="search">${array(st.membri).map(m=>`<option value="${H(m.id)}" ${m.id===mid?'selected':''}>${H(m.nome)}</option>`).join('')}</select></label><label>Data<input id="n126Date" class="search" type="date" value="${H(date)}" required></label></div><label style="margin-top:10px">Pasto<select id="n126Meal" class="search">${['Colazione','Spuntino','Pranzo','Merenda','Cena','Altro'].map(p=>`<option ${p===(seed.pasto||'Altro')?'selected':''}>${p}</option>`).join('')}</select></label><label style="margin-top:10px">Alimento / piatto<input id="n126Name" class="search" list="n126FoodList" maxlength="200" placeholder="Es. yogurt, pasta al pesto…" value="${H(seed.consumato||seed.nome||'')}" onchange="alimentoSalvatoNutrizione126()"></label><datalist id="n126FoodList">${Object.values(state().alimenti).map(x=>`<option value="${H(x.nome)}"></option>`).join('')}</datalist><div class="n126-grid" style="margin-top:10px"><label>Quantità consumata<input id="n126Amount" class="search" inputmode="decimal" placeholder="Es. 150" value="${H(seed.quantita??'')}" oninput="anteprimaNutrizione126()"></label><label>Unità<select id="n126Unit" class="search" onchange="anteprimaNutrizione126()"><option value="g" ${unit==='g'?'selected':''}>grammi (g)</option><option value="ml" ${unit==='ml'?'selected':''}>millilitri (ml)</option></select></label></div><label style="margin-top:14px">Valori nutrizionali<select id="n126Basis" class="search" onchange="anteprimaNutrizione126()"><option value="100" ${basis==='100'?'selected':''}>Per 100 g / 100 ml</option><option value="total" ${basis==='total'?'selected':''}>Già riferiti alla quantità consumata</option></select></label><div class="n126-grid" style="margin-top:10px">${[['K','kcal','Calorie (kcal)'],['P','p','Proteine (g)'],['C','c','Carboidrati (g)'],['F','f','Grassi (g)']].map(([id,k,label])=>`<label>${label}<input id="n126${id}" class="search" inputmode="decimal" placeholder="Da etichetta" value="${H(values[k]??'')}" oninput="anteprimaNutrizione126()"></label>`).join('')}</div></div>${seed.source?`<div class="meta" style="margin-top:8px">${H(seed.source)}${seed.code?' · Codice '+H(seed.code):''}</div>`:''}<div id="n126Preview" class="note n126-preview" aria-live="polite"></div><details class="n126-details"><summary>Valori e alimenti salvati</summary><div class="meta">Lascia vuoti i dati sconosciuti: il totale sarà indicato come parziale. Uno 0 scritto significa zero confermato. Per il confronto con la dieta imposta un obiettivo noto nel riepilogo del diario.</div><div class="meta" style="margin-top:8px">Usa quantità e valori nella stessa forma indicata sull’etichetta: prodotto confezionato, crudo o cotto.</div><label style="display:block;margin-top:10px"><input id="n126Remember" type="checkbox" checked> Ricorda questi valori per questo alimento</label></details><button class="btn full" style="margin-top:14px" onclick="salvaRegistroPasto()">${seed.id?'Salva modifiche':'Aggiungi al diario'}</button>`);
    root.anteprimaNutrizione126();
  };
  root.anteprimaNutrizione126=function(){
    const out=el('n126Preview');if(!out)return;
    const form=readForm(),q=number(form.quantita);
    if(q===null||q<=0){out.textContent='Inserisci la quantità consumata per vedere il calcolo.';return}
    try{const n=calculate(form.values,q,form.basis);out.innerHTML=`<b>Per ${fmt(q)} ${H(form.unita)} consumati</b><br>${Object.keys(KEYS).map(k=>n.known[k]?`${k==='kcal'?fmt(n[k],0)+' kcal':({p:'P',c:'C',f:'G'}[k])+' '+fmt(n[k])+' g'}`:({kcal:'kcal',p:'proteine',c:'carboidrati',f:'grassi'}[k])+' da completare').join(' · ')}${!n.complete?'<br><span class="meta">Valori parziali: puoi completarli in seguito.</span>':''}`}
    catch(e){out.textContent=e.message}
  };
  root.alimentoSalvatoNutrizione126=function(){
    const item=state().alimenti[normalize(el('n126Name')?.value)];if(!item)return;
    ['kcal','p','c','f'].forEach((k,i)=>{el(['n126K','n126P','n126C','n126F'][i]).value=item.values?.[k]??''});
    el('n126Basis').value='100';el('n126Unit').value=item.unita||'g';activeSeed.source=item.source||'Valori salvati';activeSeed.code=item.code||'';root.anteprimaNutrizione126();toast('Valori salvati caricati');
  };
  root.salvaRegistroPasto=function(){
    const form=readForm(),name=String(form.consumato||'').trim();
    if(!name)return toast('Scrivi il nome dell’alimento');
    if(!member(form.member_id))return toast('Scegli una persona');
    if(!validDate(form.data))return toast('Inserisci una data valida');
    let n;try{n=calculate(form.values,form.quantita,form.basis)}catch(e){return toast(e.message)}
    const q=number(form.quantita),entry={id:form.id||'n126'+Date.now()+Math.random().toString(16).slice(2,7),member_id:form.member_id,data:form.data,pasto:form.pasto,consumato:name,quantita:q,unita:form.unita,porzioni:1,kcal:n.kcal,proteine_g:n.p,carboidrati_g:n.c,grassi_g:n.f,v126Known:n.known,v126Basis:form.basis,v126Values:form.values,nutrizione_compilata:n.complete,fonte_nutrizione:form.source||'Etichetta / inserimento manuale',codice:form.code||'',feedback:form.feedback||'neutro',categorie:array(form.categorie)};
    st.registro=array(st.registro);const index=st.registro.findIndex(x=>x.id===entry.id);
    if(index>=0)st.registro[index]={...st.registro[index],...entry};else st.registro.push(entry);
    if(form.remember){
      const values={};Object.keys(KEYS).forEach(k=>{values[k]=n.known[k]?n[k]*100/q:null});
      const item={nome:name,values,unita:form.unita,source:entry.fonte_nutrizione,code:entry.codice,aggiornatoIl:new Date().toISOString()};state().alimenti[normalize(name)]=item;if(entry.codice)state().prodotti[entry.codice]=item;
    }
    state().member=form.member_id;state().date=form.data;st.v119Nutrizione.membroRegistro=form.member_id;st.v119Nutrizione.dataRegistro=form.data;
    draft=null;save();closeModal();call('renderRegistro');call('renderRicette');toast(index>=0?'Alimento aggiornato':'Alimento aggiunto al diario');
  };
  root.salvaRegistro126=root.salvaRegistroPasto;
  root.modificaRegistroNutrizione126=function(id){const x=array(st.registro).find(x=>x.id===id);if(x)root.apriRegistraPasto(seedFromEntry(x))};
  root.eliminaRegistro119=function(id){if(!confirm('Eliminare questo alimento dal diario?'))return;st.registro=array(st.registro).filter(x=>x.id!==id);save();call('renderRegistro');call('renderRicette')};
  root.cambiaRegistro119=function(){state().member=el('v119RegMembro')?.value||state().member;state().date=el('v119RegData')?.value||localDate();st.v119Nutrizione.membroRegistro=state().member;st.v119Nutrizione.dataRegistro=state().date;save();call('renderRegistro')};
  root.registraOggiNutrizione126=function(){root.apriRegistraPasto({member_id:state().member,data:state().date})};
  root.apriObiettivi119=function(id){
    const m=member(id);if(!m)return;const o=st.v119Nutrizione.obiettivi[id]||{};
    openModal('Obiettivi giornalieri · '+m.nome,`<div class="note">Inserisci i valori riportati o concordati nel piano. Il diario non ricava un obiettivo calorico dalle sole grammature della dieta.</div><div class="n126-grid n126-fields" style="margin-top:12px">${[['K','kcal','Calorie (kcal)'],['P','p','Proteine (g)'],['C','c','Carboidrati (g)'],['F','f','Grassi (g)']].map(([sid,k,label])=>`<label>${label}<input id="obj${sid}119" class="search" inputmode="decimal" placeholder="Non impostato" value="${H(o[k]??'')}"></label>`).join('')}</div><div class="meta" style="margin-top:10px">Lascia vuoto un obiettivo che non conosci o che vuoi rimuovere.</div><button class="btn full" style="margin-top:14px" onclick="salvaObiettivi119(${js(id)})">Salva obiettivi</button>`);
  };
  root.salvaObiettivi119=function(id){
    const goal={};for(const [k,sid] of [['kcal','K'],['p','P'],['c','C'],['f','F']]){const raw=el('obj'+sid+'119')?.value??'',value=number(raw);if(String(raw).trim()!==''&&(value===null||(k==='kcal'&&value===0)))return toast('Inserisci valori validi; le calorie devono essere maggiori di zero');goal[k]=value}
    st.v119Nutrizione.obiettivi[id]=goal;save();closeModal();call('renderRegistro');toast('Obiettivi salvati');
  };
  const renderLog=root.renderRegistro;
  root.renderRegistro=function(){
    state();initMembers();if(typeof renderLog==='function')renderLog();const list=el('listaRegistro');if(!list)return;
    let summary=el('v119Summary');if(!summary){summary=document.createElement('div');summary.id='v119Summary';list.parentNode.insertBefore(summary,list)}
    const m=member(state().member)||simona;if(!m)return;const date=validDate(state().date)?state().date:localDate(),t=totals(st.registro,m.id,date),manual=st.v119Nutrizione.obiettivi[m.id]||{},menu=dietForProfile(m.id,date),o=menu?.complete?menu:manual,reference=menu?.complete?'Menu':'Obiettivo';
    summary.innerHTML=`<div class="card hero"><h3>Calorie e macronutrienti</h3><div class="meta">Totali dai valori registrati per ${H(m.nome)}.</div><div class="n126-grid" style="margin-top:12px"><select id="v119RegMembro" class="search" aria-label="Persona del diario" onchange="cambiaRegistro119()">${array(st.membri).map(x=>`<option value="${H(x.id)}" ${x.id===m.id?'selected':''}>${H(x.nome)}</option>`).join('')}</select><input id="v119RegData" class="search" type="date" aria-label="Data del diario" value="${H(date)}" onchange="cambiaRegistro119()"></div><div class="n126-grid" style="margin-top:12px">${[['kcal','Calorie','kcal'],['p','Proteine','g'],['c','Carboidrati','g'],['f','Grassi','g']].map(([k,label,unit])=>{
      const value=t.count&&!t.known[k]?'—':fmt(t[k],k==='kcal'?0:1)+' '+unit,goal=number(o[k]),hasGoal=goal!==null&&(k!=='kcal'||goal>0);
      const compare=hasGoal?(t.missing[k]?'Confronto parziale':t[k]<=goal?'Restano '+fmt(goal-t[k],k==='kcal'?0:1)+' '+unit:'Oltre obiettivo: '+fmt(t[k]-goal,k==='kcal'?0:1)+' '+unit):'Obiettivo non impostato';
      return `<div class="note"><div class="meta">${label}</div><b>${value}</b><span>${hasGoal?reference+' '+fmt(goal,k==='kcal'?0:1)+' '+unit+' · ':''}${compare}</span></div>`;
    }).join('')}</div>${menu?.available?`<div class="note" style="margin-top:10px"><b>${menu.complete?'Confronto con il menu di '+H(menu.day)+' · stima '+fmt(menu.kcal,0)+' kcal':'Calorie del menu da completare'}</b>${menu.complete?'<br>Il riferimento segue le quantità e le alternative selezionate nella dieta.':`<br>${menu.known.kcal?fmt(menu.kcal,0)+' kcal conteggiate finora · ':''}${menu.missingWeights} porzioni da pesare · ${menu.missingValues} porzioni con valori mancanti. Il parziale non viene usato come obiettivo.`}<br><button class="btn small secondary" style="margin-top:8px" onclick="apriValoriDieta126(${menu.dayIndex})">${menu.complete?'Rivedi valori del menu':'Completa calorie del menu'}</button></div>`:''}${t.incomplete?`<div class="note" style="margin-top:10px"><b>Totali parziali</b>: ${t.incomplete} aliment${t.incomplete===1?'o ha':'i hanno'} dati nutrizionali da completare. Apri Modifica per aggiungerli.</div>`:''}<button class="btn full" style="margin-top:12px" onclick="registraOggiNutrizione126()">Aggiungi un alimento</button><button class="btn full secondary" style="margin-top:8px" onclick="apriScannerNutrizione126()">Scansiona codice a barre / QR</button><details class="n126-details"><summary>Obiettivi e dettaglio dei valori</summary><div class="meta">Il menu completo viene usato come riferimento calcolato. Puoi conservare a parte l’obiettivo riportato o concordato nel piano.</div><button class="btn small secondary" style="margin-top:10px" onclick="apriObiettivi119(${js(m.id)})">Modifica obiettivi di ${H(m.nome)}</button></details></div>`;
    list.innerHTML=t.rows.length?`<div class="card">${t.rows.slice().reverse().map(x=>{
      const line=Object.keys(KEYS).map(k=>{const v=knownValue(x,k);return v===null?({kcal:'kcal',p:'P',c:'C',f:'G'}[k])+' —':k==='kcal'?fmt(v,0)+' kcal':({p:'P',c:'C',f:'G'}[k])+' '+fmt(v)+' g'}).join(' · ');
      return `<div class="log-row"><div class="recipe-title">${H(x.consumato)}</div><div class="meta">${H(x.pasto||'Altro')}${number(x.quantita)>0?' · '+fmt(x.quantita)+' '+H(x.unita||'g'):''}</div><div class="meta">${line}</div><div class="n126-log-actions" style="margin-top:8px"><button class="btn small secondary" onclick="modificaRegistroNutrizione126(${js(x.id)})">Modifica</button><button class="btn small danger" onclick="eliminaRegistro119(${js(x.id)})">Elimina</button></div></div>`;
    }).join('')}</div>`:'<div class="card empty">Nessun alimento registrato per questo giorno.</div>';
  };

  function manualAfterScan(note,code=''){
    closeModal();lookupId++;root.apriRegistraPasto({...draft,code,source:note||'Inserimento manuale'});
    const preview=el('n126Preview');if(preview){const n=document.createElement('div');n.className='note';n.style.marginTop='10px';n.textContent=note||'Scrivi nome, quantità e valori dell’etichetta.';preview.insertAdjacentElement('beforebegin',n)}
  }
  root.continuaManualeNutrizione126=function(){manualAfterScan('Puoi inserire l’alimento a mano anche senza codice.')};
  root.apriScannerNutrizione126=function(){
    draft=el('n126Name')?readForm():{member_id:state().member,data:state().date};lookupId++;
    if(typeof root.apriScanner116!=='function')return manualAfterScan('Scanner non disponibile. Inserisci l’alimento a mano.');
    const running=root.apriScanner116('nutrizione');
    if(el('mt'))el('mt').textContent='Scansiona un alimento';
    const note=el('mb')?.querySelector('.note');if(note)note.innerHTML='Inquadra il <b>codice a barre EAN</b> o un <b>QR con codice prodotto</b>. Potrai scegliere la quantità mangiata e controllare i valori dell’etichetta.';
    const button=document.createElement('button');button.className='btn full secondary';button.style.marginTop='12px';button.textContent='Non ho un codice: inserisci a mano';button.onclick=root.continuaManualeNutrizione126;el('mb')?.appendChild(button);
    Promise.resolve(running).catch(()=>{});
  };
  async function lookupNutrition(raw,pending){
    const code=extractGtin(raw);if(!code)return manualAfterScan('Questo QR non contiene un codice alimentare riconoscibile. Inserisci il nome e i valori a mano.');
    closeModal();const ticket=++lookupId;
    const cached=state().prodotti[code];
    if(cached){root.apriRegistraPasto({...draft,consumato:cached.nome,values:cached.values,unita:cached.unita,basis:'100',source:cached.source||'Valori salvati',code});return}
    openModal('Cerco i valori dell’alimento',`<div id="v126Lookup" class="note">Cerco il prodotto e i valori per 100 g / 100 ml…</div><button class="btn full secondary" style="margin-top:12px" onclick="continuaManualeNutrizione126()">Continua a mano</button>`);
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),7000);let item=null,note='';
    try{
      const fields='code,product_name_it,product_name,generic_name_it,generic_name,brands,nutriments,nutrition_data_per,quantity';
      const response=await fetch('https://world.openfoodfacts.org/api/v2/product/'+encodeURIComponent(code)+'.json?lc=it&fields='+fields,{signal:ctl.signal,headers:{Accept:'application/json'}});
      if(!response.ok)throw new Error('HTTP '+response.status);
      const result=await response.json(),p=result?.product;
      if(result.status===1&&p){
        const name=String(p.product_name_it||p.product_name||p.generic_name_it||p.generic_name||pending?.nome||st.codiciProdotto?.[code]||'').trim();
        item={nome:name,values:productNutrients(p),unita:/100\s*ml/i.test(p.nutrition_data_per||'')?'ml':'g',source:'Open Food Facts · verifica con l’etichetta',code,aggiornatoIl:new Date().toISOString()};
        if(!name||Object.values(item.values).every(v=>v===null))note='Prodotto senza tutti i dati nutrizionali: completa i valori dall’etichetta.';
      }else note='Alimento non trovato: puoi scrivere nome e valori dell’etichetta.';
    }catch(e){note='I valori online non sono disponibili. Puoi inserire quelli dell’etichetta a mano.'}
    finally{clearTimeout(timer)}
    if(ticket!==lookupId||!el('v126Lookup')||!el('modal')?.classList.contains('open'))return;
    if(item){
      if(item.nome){state().prodotti[code]=item;save()}
      root.apriRegistraPasto({...draft,consumato:item.nome,values:item.values,basis:'100',unita:item.unita,source:item.source,code});
      if(note){const n=document.createElement('div');n.className='note';n.textContent=note;el('n126Preview')?.insertAdjacentElement('beforebegin',n)}
    }else manualAfterScan(note,code);
  }
  root.registraProdottoNutrizione126=function(pending){
    const p=pending||root.__DALLA_SIMO_SCAN_PENDING__;if(!p)return;
    draft={member_id:state().member,data:state().date,consumato:p.nome};return lookupNutrition(p.code,p);
  };
  const router=root.gestisciScansione117;
  if(typeof router==='function')root.gestisciScansione117=async function(raw,mode){
    if(mode==='nutrizione')return lookupNutrition(raw);
    const result=await router(raw,mode),pending=root.__DALLA_SIMO_SCAN_PENDING__,box=el('mb');
    if(pending&&box&&box.querySelector('[onclick*="azioneScansioneProdotto117"]')&&!box.querySelector('#n126ScanFood')&&!pending.info?.soloRiconoscimento){
      const button=document.createElement('button');button.id='n126ScanFood';button.className='btn full secondary';button.style.marginTop='8px';button.textContent='Registra quanto hai mangiato';button.onclick=()=>root.registraProdottoNutrizione126(pending);box.appendChild(button);
    }
    return result;
  };
  root.__DALLA_SIMO_NUTRITION_V126__='gusti-piatti+grammi+macro-parziali+scanner';
  call('renderMembri');call('renderRegistro');call('renderRicette');save();
}
boot();
})(typeof window!=='undefined'?window:globalThis);
