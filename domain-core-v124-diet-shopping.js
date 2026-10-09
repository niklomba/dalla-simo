// Dalla Simo v1.24 — porzioni del piano privato e somma esatta in spesa
(function(root){
'use strict';
const R=x=>Math.round((Number(x)||0)*1000)/1000;
const N=x=>String(x||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
const H=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const units={g:['g',1],kg:['g',1000],ml:['ml',1],l:['ml',1000],pezzi:['pezzi',1],uova:['pezzi',1],frutti:['frutti',1],'q.b.':['q.b.',1]};
function base(q,u){const z=units[u];if(!z)throw new Error('Unità non riconosciuta');return {amount:q===null?null:R(q*z[1]),unit:z[0]};}
function text(x,max=500){if(typeof x!=='string'||!x.trim()||x.length>max)throw new Error('Alimento non valido');return x;}
function id(x){if(typeof x!=='string'||!/^[a-z0-9_-]{1,80}$/.test(x))throw new Error('Identificatore del piano non valido');return x;}
function ingredient(x){
  if(!x||x.kind!=='ingredient')throw new Error('Porzione non valida');
  const v={kind:'ingredient',id:id(x.id),name:text(x.name),unit:text(x.unit,20),amount:x.amount};
  if(!units[v.unit]||(v.amount!==null&&(!Number.isFinite(v.amount)||v.amount<=0||v.amount>1000000))||(v.amount===null&&v.unit!=='q.b.'))throw new Error('Quantità del piano non valida');
  for(const k of ['note','category','basis'])if(x[k]!==undefined)v[k]=text(x[k],1000);
  if(x.optional!==undefined){if(typeof x.optional!=='boolean')throw new Error('Scelta facoltativa non valida');v.optional=x.optional;}
  return v;
}
function validateComponents(arr){
  if(!Array.isArray(arr)||!arr.length||arr.length>40)throw new Error('Ingredienti del pasto non validi');
  const result=arr.map(x=>{
    if(x?.kind==='ingredient')return ingredient(x);
    if(x?.kind!=='choice'||!Array.isArray(x.options)||x.options.length<2||x.options.length>12)throw new Error('Scelta del pasto non valida');
    const v={kind:'choice',id:id(x.id),label:text(x.label),defaultOption:id(x.defaultOption),options:x.options.map(o=>{
      if(!o||!Array.isArray(o.ingredients)||!o.ingredients.length||o.ingredients.length>20)throw new Error('Alternativa del pasto non valida');
      const ingredients=o.ingredients.map(ingredient);if(new Set(ingredients.map(i=>i.id)).size!==ingredients.length)throw new Error('Alimenti duplicati nella scelta');
      return {id:id(o.id),label:text(o.label),ingredients};
    })};
    if(new Set(v.options.map(o=>o.id)).size!==v.options.length||!v.options.some(o=>o.id===v.defaultOption))throw new Error('Alternativa predefinita non valida');
    return v;
  });
  if(new Set(result.map(x=>x.id)).size!==result.length)throw new Error('Ingredienti duplicati nel pasto');
  return result;
}
function selectedIngredients(meal,d,m,state={}){
  const rows=[];
  for(const c of meal.components||[]){
    let list=[c],prefix=c.id;
    if(c.kind==='choice'){
      const key=d+'|'+m+'|'+c.id,wanted=state.choices?.[key];
      const o=c.options.find(o=>o.id===(wanted||c.defaultOption))||c.options.find(o=>o.id===c.defaultOption);
      list=o.ingredients;prefix=c.id+'|'+o.id;
    }
    for(const i of list){
      const itemKey=prefix+'|'+i.id,key=d+'|'+m+'|'+itemKey;
      if(i.optional&&!state.optional?.[key])continue;
      const amount=state.quantities?.[key];
      rows.push({...i,amount:i.amount===null&&Number.isFinite(amount)&&amount>0?R(amount):i.amount,unit:i.amount===null&&Number.isFinite(amount)&&amount>0?'g':i.unit,itemKey});
    }
  }
  return rows;
}
function dateValid(x){return typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(new Date(x+'T12:00:00').getTime())&&new Date(x+'T12:00:00').toISOString().slice(0,10)===x;}
function collect(plan,state,start,scopes){
  if(!dateValid(start))throw new Error('Scegli la data della settimana di spesa');
  const scopeSet=new Set(scopes.map(([d,m])=>d+'|'+m)),portions=[];
  for(const scope of scopeSet){
    const [d,m]=scope.split('|').map(Number),day=plan.week[d],meal=day?.meals[m];if(!meal)throw new Error('Pasto non valido');
    const scopeKey=start+'|simona|'+scope;
    for(const i of selectedIngredients(meal,d,m,state))portions.push({scopeKey,sourceKey:scopeKey+'|'+i.itemKey,name:i.name,amount:i.amount,unit:i.unit,basis:i.basis||'',label:'Dieta · '+start+' · '+plan.label+' · '+day.day+' · '+meal.name});
  }
  return {scopeKeys:[...scopeSet].map(s=>start+'|simona|'+s),portions};
}
function amountIn(q,from,to){const a=base(q,from),b=base(1,to);if(a.unit!==b.unit)throw new Error('Quantità incompatibili');return q===null?0:R(a.amount/b.amount);}
function syncShopping(items,batch){
  const list=JSON.parse(JSON.stringify(items||[])),scopes=new Set(batch.scopeKeys);
  const bought=list.filter(x=>x.stato==='comprato').flatMap(x=>x.dietPortions||[]);
  for(const row of list){
    if(row.stato!=='da_comprare'||!Array.isArray(row.dietPortions))continue;
    const remove=row.dietPortions.filter(p=>scopes.has(p.scopeKey));
    row.dietPortions=row.dietPortions.filter(p=>!remove.includes(p));
    row.quantita=R(Math.max(0,(Number(row.quantita)||0)-remove.reduce((s,p)=>s+amountIn(p.amount,p.unit,row.unita),0)));
    const labels=new Set(remove.map(p=>p.label));
    row.origini=(row.origini||[]).filter(label=>!labels.has(label)||row.dietPortions.some(p=>p.label===label));
    if(remove.length&&!row.dietPortions.length&&row.quantita===0&&!row.origini.length)row._v124Remove=true;
  }
  let added=0,alreadyBought=0;
  for(const requested of batch.portions){
    const p={...requested},purchased=bought.filter(x=>x.sourceKey===p.sourceKey&&N(x.name)===N(p.name)&&base(1,x.unit).unit===base(1,p.unit).unit&&x.basis===p.basis);
    if(purchased.length){
      alreadyBought++;
      if(p.amount===null)continue;
      const covered=R(purchased.reduce((s,x)=>s+amountIn(x.amount,x.unit,p.unit),0));
      if(covered>=p.amount)continue;
      if(covered>0){p.plannedAmount=p.amount;p.purchasedAmount=covered;p.amount=R(p.amount-covered);}
    }
    const pb=base(p.amount,p.unit);
    let row=list.find(x=>!x._v124Remove&&x.stato==='da_comprare'&&N(x.nome)===N(p.name)&&units[x.unita]&&base(1,x.unita).unit===pb.unit&&(!x.dietBasis||!p.basis||x.dietBasis===p.basis));
    if(!row){row={id:'s124'+Date.now()+Math.random().toString(36).slice(2,10),nome:p.name,quantita:0,unita:pb.unit,stato:'da_comprare',origini:[],dietPortions:[],dietBasis:p.basis};list.push(row);}
    row.dietPortions=row.dietPortions||[];
    row.quantita=R((Number(row.quantita)||0)+amountIn(p.amount,p.unit,row.unita));
    row.dietPortions.push(p);if(!row.origini.includes(p.label))row.origini.push(p.label);added++;
  }
  return {items:list.filter(x=>!x._v124Remove),added,alreadyBought};
}
const num=x=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:3}).format(R(x));
function qty(q,u){if(q===null||u==='q.b.')return 'q.b.';const unit=q===1?({pezzi:'pezzo',frutti:'frutto',uova:'uovo'}[u]||u):u;return num(q)+' '+unit;}
function summary(row){
  const portions=row.dietPortions||[];if(!portions.length)return null;
  const group=new Map(),b=base(row.quantita,row.unita);let known=0;
  for(const p of portions){const v=base(p.amount,p.unit),key=v.amount===null?'unknown':String(v.amount);known+=v.amount||0;const g=group.get(key)||{amount:v.amount,count:0};g.count++;group.set(key,g);}
  const parts=[...group.values()].map(x=>qty(x.amount,b.unit)+' × '+x.count);
  const other=R(Math.max(0,(b.amount||0)-known));if(other>0)parts.push(qty(other,b.unit)+' altre aggiunte');
  const result={detail:parts.join(' + '),total:b.unit==='q.b.'?'Totale da indicare':'Totale '+qty(b.amount,b.unit)};
  const partial=portions.filter(p=>p.purchasedAmount>0);
  if(partial.length)result.note=partial.map(p=>'Già acquistati '+qty(p.purchasedAmount,p.unit)+' di una porzione da '+qty(p.plannedAmount,p.unit)).join(' · ');
  return result;
}
const api={validateComponents,selectedIngredients,collect,syncShopping,summary,qty,base,dateValid};
root.v124Quantities=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document==='undefined')return;
function boot(){
  if(typeof st==='undefined'||typeof root.v122GetPrivateDiet!=='function'||typeof root.v122RenderPrivateDiet!=='function'||typeof root.renderSpesa!=='function')return setTimeout(boot,120);
  st.v124=st.v124||{};for(const k of ['choices','quantities','optional'])if(!st.v124[k]||typeof st.v124[k]!=='object')st.v124[k]={};
  if(!dateValid(st.v124.shopStart)){const d=new Date();d.setDate(d.getDate()-((d.getDay()+6)%7));st.v124.shopStart=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function diet(){return root.v122GetPrivateDiet();}
  function plan(data=diet()){if(!data?.plans?.length)return null;return data.plans.find(x=>x.id===st.v124.plan)||data.plans.find(x=>x.id===data.primaryPlan)||data.plans[0];}
  root.v124SelectedPlan=plan;
  root.v124PlanControls=function(data){const p=plan(data);if(!p)return '';return `<div class="card v124-controls"><label for="v124Plan">Piano alimentare</label><select id="v124Plan" class="search" onchange="v124ChoosePlan(this.value)">${data.plans.map(x=>`<option value="${H(x.id)}" ${x.id===p.id?'selected':''}>${H(x.label)}</option>`).join('')}</select><p class="meta">${H(p.description)}</p><details id="v124WeekShopping"><summary>Spesa della settimana</summary><div class="v124-controls"><label for="v124ShopStart">Spesa per la settimana dal</label><input id="v124ShopStart" class="search" type="date" value="${H(st.v124.shopStart)}" onchange="v124SetWeek(this.value)"><button class="btn full" onclick="v124Shop('week')">Metti settimana in spesa</button><p class="meta">Somma le porzioni selezionate. Ripetere l’aggiunta aggiorna la stessa settimana senza duplicare i pasti. Per un’altra settimana cambia la data.</p></div></details></div>`;};
  root.v124ChoosePlan=function(value){if(!diet()?.plans?.some(p=>p.id===value))return;st.v124.plan=value;save();root.v122RenderPrivateDiet();};
  root.v124SetWeek=function(value){if(!dateValid(value)){toast('Scegli una data valida');return;}st.v124.shopStart=value;save();};
  root.v124Choice=function(d,m,c,value){const component=plan()?.week[d]?.meals[m]?.components?.find(x=>x.id===c);if(!component?.options?.some(o=>o.id===value))return;st.v124.choices[d+'|'+m+'|'+c]=value;save();root.v122RenderPrivateDiet();};
  root.v124Quantity=function(d,m,key,value){const n=Number(value);if(value!==''&&(!Number.isFinite(n)||n<=0||n>1000000)){toast('Indica una quantità positiva');return;}const k=d+'|'+m+'|'+key;if(value==='')delete st.v124.quantities[k];else st.v124.quantities[k]=R(n);save();root.v122RenderPrivateDiet();};
  root.v124Optional=function(d,m,key,value){st.v124.optional[d+'|'+m+'|'+key]=Boolean(value);save();root.v122RenderPrivateDiet();};
  function ingredientHtml(i,d,m,prefix){const key=prefix+'|'+i.id,stateKey=d+'|'+m+'|'+key,amount=st.v124.quantities[stateKey],optional=i.optional,checked=Boolean(st.v124.optional[stateKey]);return `<li>${optional?`<label><input type="checkbox" ${checked?'checked':''} onchange="v124Optional(${d},${m},'${key}',this.checked)"> Facoltativo: </label>`:''}<b>${H(i.name)}</b> — ${H(qty(i.amount,i.unit))}${i.note?` <span class="meta">(${H(i.note)})</span>`:''}${i.amount===null?`<label class="v124-qb">Per la spesa <input type="number" min="0.001" step="0.001" aria-label="Quantità per spesa: ${H(i.name)}, ${d}, ${m}" value="${Number.isFinite(amount)?amount:''}" placeholder="g" onchange="v124Quantity(${d},${m},'${key}',this.value)"> g</label>`:''}</li>`;}
  root.v124RenderMeal=function(meal,d,m){if(!meal.components||!Number.isInteger(d)||!Number.isInteger(m))return null;return `<div class="v122-meal" data-v124-meal="${d}-${m}"><div class="v122-meal-title"><b>${H(meal.name.toUpperCase())}</b>${meal.alternative?`<span class="badge good">Scelta ${meal.alternative}</span>`:''}</div>${meal.components.map(c=>{if(c.kind==='ingredient')return '<ul class="v122-list">'+ingredientHtml(c,d,m,c.id)+'</ul>';const key=d+'|'+m+'|'+c.id,option=c.options.find(o=>o.id===(st.v124.choices[key]||c.defaultOption))||c.options.find(o=>o.id===c.defaultOption);return `<label class="v124-choice-label">${H(c.label)}<select class="search v124-choice" data-choice="${d}-${m}-${H(c.id)}" onchange="v124Choice(${d},${m},'${c.id}',this.value)">${c.options.map(o=>`<option value="${H(o.id)}" ${o.id===option.id?'selected':''}>${H(o.label)}</option>`).join('')}</select></label><ul class="v122-list">${option.ingredients.map(i=>ingredientHtml(i,d,m,c.id+'|'+option.id)).join('')}</ul>`;}).join('')}<button class="btn small secondary v124-meal-shop" onclick="v124Shop('meal',${d},${m})">+ Spesa pasto</button></div>`;};
  root.v124DayAction=d=>plan()?`<button class="btn small secondary v124-day-shop" onclick="v124Shop('day',${d})">+ Spesa giorno</button>`:'';
  root.v124PlanNotes=data=>{const p=plan(data);return p?.notes?.length?`<div class="card v122-note-card"><h3>Note sul piano selezionato</h3><ul class="v122-list">${p.notes.map(n=>'<li>'+H(n)+'</li>').join('')}</ul></div>`:'';};
  root.v124Shop=function(scope,d,m){try{const p=plan();if(!p)return toast('Apri il collegamento aggiornato della dieta');const scopes=scope==='week'?p.week.flatMap((x,di)=>x.meals.map((y,mi)=>[di,mi])):scope==='day'?p.week[d]?.meals.map((x,mi)=>[d,mi]):scope==='meal'?[[d,m]]:null;if(!scopes)throw new Error('Pasto non valido');const batch=collect(p,st.v124,st.v124.shopStart,scopes),result=syncShopping(st.spesa,batch);st.spesa=result.items;save();root.renderSpesa();toast('Spesa aggiornata con le porzioni selezionate'+(result.alreadyBought?' · alcuni pasti già acquistati':''));}catch(e){toast(e.message||'Non riesco ad aggiornare la spesa');}};
  const previous=root.renderSpesa;
  root.renderSpesa=function(){const result=previous();for(const listId of ['listaDaComprare','listaComprati'])document.getElementById(listId)?.querySelectorAll('.shop-item').forEach(el=>{const action=el.getAttribute('onclick')||el.querySelector('button[onclick*="cancellaComprato"]')?.getAttribute('onclick')||'',id=action.match(/(?:segnaComprato|cancellaComprato)\(['"]([^'"]+)['"]\)/)?.[1],row=st.spesa.find(x=>x.id===id),s=row&&summary(row);if(!s)return;const title=el.querySelector('.recipe-title'),source=el.querySelector('.shop-source'),q=el.querySelector('.qty');if(source)source.textContent='';const detail=document.createElement('div');detail.className='v124-portion-detail';detail.textContent=s.detail+(s.note?' · '+s.note:'');title?.parentNode.insertBefore(detail,source||null);if(q)q.textContent=s.total;});return result;};
  if(!document.getElementById('v124css')){const style=document.createElement('style');style.id='v124css';style.textContent='.v124-controls{display:grid;gap:9px}.v124-controls label,.v124-choice-label{font-size:12px;font-weight:700}.v124-choice{margin:5px 0}.v124-qb{display:flex;gap:6px;align-items:center;font-size:11px;color:var(--muted);margin-top:5px}.v124-qb input{max-width:80px;padding:4px;border:1px solid var(--border);border-radius:7px}.v124-meal-shop{margin-top:9px}.v124-day-shop{margin:10px 0}.v124-portion-detail{font-size:12px;line-height:1.45;color:var(--green);margin-top:4px}.shop-item:has(.v124-portion-detail){flex-wrap:wrap;gap:8px}.shop-item:has(.v124-portion-detail) .qty{white-space:normal;text-align:right}.v122-list input[type=checkbox]{margin-right:5px}';document.head.appendChild(style);}
  root.__DALLA_SIMO_DIET_V124__={version:'1.24',structuredPortions:true,exactShoppingSums:true,publicDietPayload:false};
  root.v122PrivateDietReady.then(()=>root.v122RenderPrivateDiet());root.renderSpesa();
}
boot();
})(typeof window!=='undefined'?window:globalThis);
