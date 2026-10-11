// Dalla Simo v1.26 — piano di Simona, fonte originale e porzioni della spesa.
(function(root){
'use strict';
const Q=root.v124Quantities||(typeof require==='function'?require('./domain-core-v124-diet-shopping.js'):null);
const originalFactory=root.v125GetDefaultDiet||(typeof require==='function'?require('./domain-core-v125-default-diet.js').getDefaultDiet:null);
const clone=x=>JSON.parse(JSON.stringify(x));
const H=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=x=>String(x||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
const R=x=>Math.round((Number(x)||0)*1000)/1000;
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const MAIN='simona-principale',ORIGINAL='simona-originale';
const replacements=[
  {day:0,name:'Platessa',item:'Platessa 150 g in padella',note:'in padella; peso crudo al netto degli scarti',previous:'Filetto di merluzzo'},
  {day:3,name:'Pesce spada',item:'Pesce spada 150 g al forno',note:'al forno; peso crudo al netto degli scarti',previous:'Orata'},
  {day:5,name:'Polpo',item:'Polpo 150 g',note:'peso crudo pulito, al netto degli scarti',previous:'Filetto di branzino'}
];
const originalSeed=originalFactory?originalFactory():null;

function isOriginalCopy(raw){
  if(!raw||!originalSeed||raw.profile!=='simona'||!Array.isArray(raw.week)||raw.week.length!==7)return false;
  return raw.week.every((day,d)=>day?.day===originalSeed.week[d].day&&Array.isArray(day.meals)&&day.meals.length===5&&day.meals.every((meal,m)=>{
    const seed=originalSeed.week[d].meals[m];
    return meal.name===seed.name&&JSON.stringify(meal.items)===JSON.stringify(seed.items)&&
      (meal.components===undefined||JSON.stringify(canonical(meal.components))===JSON.stringify(canonical(seed.components)));
  }));
}

function getDiet(raw){
  if(!originalSeed)throw new Error('La fonte del piano di Simona non è disponibile');
  if(raw?.plans?.some(p=>p.id===MAIN)&&raw.plans.some(p=>p.id===ORIGINAL))return clone(raw);
  // Una settimana importata e modificata rimane personale, senza sostituirla al piano incluso.
  if(raw&&!isOriginalCopy(raw))return clone(raw);
  const data=clone(originalSeed),source=data.plans.find(p=>p.id==='principale');
  const original={...clone(source),id:ORIGINAL,label:'Documento originale',description:'La settimana del documento, prima delle sostituzioni richieste.'};
  const main={...clone(source),id:MAIN,label:'Piano di Simona',description:'La dieta principale con platessa, pesce spada e polpo al posto dei tre pesci sostituiti.'};
  for(const swap of replacements){
    const meal=main.week[swap.day].meals[4];
    meal.items[0]=swap.item;
    meal.components[0]={...meal.components[0],name:swap.name,amount:150,unit:'g',note:swap.note};
  }
  main.notes.push('Sostituzioni richieste: merluzzo → platessa, orata → pesce spada, branzino → polpo. Ogni porzione resta di 150 g crudi al netto degli scarti.');
  data.title='Piano alimentare';
  data.description='Sette giorni, cinque pasti al giorno e le grammature del documento. Le quantità indicate solo a pezzi o q.b. si possono pesare per la spesa.';
  data.revision=Math.max(4,Number(data.revision)||0);
  data.primaryPlan=MAIN;
  data.week=clone(main.week);
  const legacy=data.plans.filter(p=>p.id!=='principale');
  const custom=(raw?.plans||[]).filter(p=>!['principale','alternativa-2','alternativa-3',MAIN,ORIGINAL].includes(p.id));
  data.plans=[main,original,...legacy,...clone(custom)].slice(0,10);
  return data;
}

function currentState(){return typeof st!=='undefined'?(st.v124||{}):{};}
function selectedPlan(raw,state=currentState()){
  const data=getDiet(raw);
  if(!data?.plans?.length)return {id:data.primaryPlan||'personale',label:data.title,description:data.description,week:data.week,notes:[]};
  return data.plans.find(p=>p.id===state.plan)||data.plans.find(p=>p.id===data.primaryPlan)||data.plans[0];
}

function selectedIngredients(meal,d,m,state={}){
  const rows=[];
  for(const component of meal.components||[]){
    let list=[component],prefix=component.id;
    if(component.kind==='choice'){
      const wanted=state.choices?.[d+'|'+m+'|'+component.id]||component.defaultOption;
      const option=component.options.find(o=>o.id===wanted)||component.options.find(o=>o.id===component.defaultOption);
      if(!option)continue;
      list=option.ingredients;prefix=component.id+'|'+option.id;
    }
    for(const i of list){
      const itemKey=prefix+'|'+i.id,key=d+'|'+m+'|'+itemKey;
      if(i.optional&&!state.optional?.[key])continue;
      const grams=state.quantities?.[key],convertible=i.amount===null||['pezzi','uova','frutti'].includes(i.unit);
      const hasWeight=convertible&&Number.isFinite(grams)&&R(grams)>0&&grams<=1000000;
      rows.push({...i,itemKey,prescribedAmount:i.amount,prescribedUnit:i.unit,
        amount:hasWeight?R(grams):i.amount,unit:hasWeight?'g':i.unit,shoppingWeight:hasWeight?R(grams):null});
    }
  }
  return rows;
}

function collect(plan,state,start,scopes){
  if(!Q.dateValid(start))throw new Error('Scegli la data della settimana di spesa');
  const scopeSet=new Set(scopes.map(([d,m])=>d+'|'+m)),portions=[];
  for(const scope of scopeSet){
    const [d,m]=scope.split('|').map(Number),day=plan.week[d],meal=day?.meals[m];
    if(!meal)throw new Error('Pasto non valido');
    const scopeKey=start+'|simona|'+scope;
    for(const i of selectedIngredients(meal,d,m,state))portions.push({scopeKey,sourceKey:scopeKey+'|'+i.itemKey,name:i.name,
      amount:i.amount,unit:i.unit,basis:i.basis||'',prescribedAmount:i.prescribedAmount,prescribedUnit:i.prescribedUnit,
      label:'Dieta · '+start+' · '+plan.label+' · '+day.day+' · '+meal.name});
  }
  return {scopeKeys:[...scopeSet].map(s=>start+'|simona|'+s),portions};
}

function summary(row){
  const result=Q.summary(row);if(!result)return null;
  result.detail=result.detail.replace(/([^+]+?) × (\d+)(?=\s*(?:\+|$))/g,(_,quantity,count)=>quantity.trim()+' (× '+count+')');
  return result;
}

function syncShopping(items,batch){
  const result=Q.syncShopping(items,batch),used=new Set();
  for(const row of result.items){
    if((items||[]).some(x=>x.id===row.id)){used.add(row.id);continue;}
    const old=(items||[]).find(x=>{
      if(used.has(x.id)||x.stato!==row.stato||N(x.nome)!==N(row.nome))return false;
      try{return Q.base(1,x.unita).unit===Q.base(1,row.unita).unit&&(!x.dietBasis||!row.dietBasis||x.dietBasis===row.dietBasis);}catch(e){return false;}
    });
    if(old){row.id=old.id;used.add(old.id);}
  }
  return result;
}

function migrateShopping(items,state,plan){
  let list=clone(items||[]);const byWeek=new Map();
  for(const row of list){
    if(row.stato!=='da_comprare')continue;
    for(const p of row.dietPortions||[]){
      const match=p.scopeKey?.match(/^(\d{4}-\d{2}-\d{2})\|simona\|([0-6])\|4$/);
      if(!match)continue;
      const swap=replacements.find(x=>x.day===Number(match[2])&&N(x.previous)===N(p.name));
      if(!swap||p.amount!==150||p.unit!=='g')continue;
      const days=byWeek.get(match[1])||new Set();days.add(swap.day);byWeek.set(match[1],days);
    }
  }
  for(const [week,days] of byWeek)list=syncShopping(list,collect(plan,state,week,[...days].map(d=>[d,4]))).items;
  return list;
}

function textForPlan(raw,planId){
  const data=getDiet(raw),plan=selectedPlan(data,{plan:planId||data.primaryPlan}),lines=[data.title,plan.label,''];
  for(const day of plan.week){lines.push('',day.day.toUpperCase());for(const meal of day.meals)lines.push(meal.name,...meal.items.map(item=>'• '+item));}
  function sections(list){for(const section of list||[]){lines.push('',section.title.toUpperCase());for(const block of section.blocks||[]){
    if(block.type==='heading'||block.type==='text')lines.push(block.text);
    else if(block.type==='table')for(const row of block.rows)lines.push(row.join(': '));
    else{if(block.type==='meal')lines.push(block.name);for(const item of block.items||[])lines.push('• '+item);}
  }}}
  sections(data.foodSections);
  if(plan.notes?.length)lines.push('','NOTE SUL PIANO',...plan.notes.map(note=>'• '+note));
  sections(data.notes);
  return lines.join('\n');
}

const api={getDiet,selectedPlan,selectedIngredients,collect,syncShopping,summary,qty:Q.qty,
  validateComponents:Q.validateComponents,dateValid:Q.dateValid,migrateShopping,textForPlan,isOriginalCopy,mainId:MAIN,originalId:ORIGINAL};
root.v126Diet=api;
root.v126GetDiet=()=>getDiet(root.v122GetPrivateDiet?.());
root.v126SelectedPlan=()=>selectedPlan(root.v122GetPrivateDiet?.());
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document==='undefined'){api.ready=Promise.resolve({available:true,migrated:false});return;}

// Caricato prima di v122, questo getter fornisce il piano corretto al primo avvio.
root.v125GetDefaultDiet=()=>getDiet();
api.ready=new Promise(resolve=>{
  async function boot(){
    if(typeof st==='undefined'||typeof save!=='function'||typeof root.v122GetPrivateDiet!=='function'||typeof root.v124Shop!=='function')return setTimeout(boot,80);
    await root.v122PrivateDietReady;
    const previousGet=root.v122GetPrivateDiet;
    root.v122GetPrivateDiet=()=>getDiet(previousGet());
    root.v124SelectedPlan=raw=>selectedPlan(getDiet(raw||previousGet()));
    st.v126=st.v126||{};st.v124=st.v124||{};
    for(const key of ['choices','quantities','optional'])st.v124[key]=st.v124[key]&&typeof st.v124[key]==='object'?st.v124[key]:{};
    const raw=previousGet(),diet=getDiet(raw),first=st.v126.dietMigration!==1;
    if(first){
      st.v124.plan=diet.primaryPlan||diet.plans?.[0]?.id;
      if(diet.primaryPlan===MAIN)st.spesa=migrateShopping(st.spesa,st.v124,selectedPlan(diet));
      st.v126.dietMigration=1;
    }
    if(!diet.plans?.some(p=>p.id===st.v124.plan))st.v124.plan=diet.primaryPlan;
    function changed(){save();root.v122RenderPrivateDiet?.();root.dispatchEvent?.(new Event('v126:diet-changed'));}
    api.setPlan=root.v124ChoosePlan=function(value){
      const data=root.v122GetPrivateDiet();if(!data.plans?.some(p=>p.id===value))return false;
      st.v124.plan=value;changed();return true;
    };
    api.setQuantity=root.v124Quantity=function(d,m,key,value){
      const n=Number(String(value).replace(',','.'));
      if(value!==''&&(!Number.isFinite(n)||R(n)<=0||n>1000000)){root.toast?.('Indica una quantità positiva');return false;}
      const stateKey=d+'|'+m+'|'+key;
      if(value==='')delete st.v124.quantities[stateKey];else st.v124.quantities[stateKey]=R(n);
      changed();return true;
    };
    root.v124Choice=function(d,m,id,value){
      const choice=selectedPlan(root.v122GetPrivateDiet()).week[d]?.meals[m]?.components?.find(c=>c.id===id&&c.kind==='choice');
      if(!choice?.options.some(o=>o.id===value))return false;
      st.v124.choices[d+'|'+m+'|'+id]=value;changed();return true;
    };
    root.v124Optional=function(d,m,key,value){st.v124.optional[d+'|'+m+'|'+key]=Boolean(value);changed();};
    root.v124Shop=function(scope,d,m){
      try{
        const plan=selectedPlan(root.v122GetPrivateDiet());
        const scopes=scope==='week'?plan.week.flatMap((day,di)=>day.meals.map((meal,mi)=>[di,mi])):
          scope==='day'?plan.week[d]?.meals.map((meal,mi)=>[d,mi]):scope==='meal'?[[d,m]]:null;
        if(!scopes)throw new Error('Pasto non valido');
        const batch=collect(plan,st.v124,st.v124.shopStart,scopes),result=syncShopping(st.spesa,batch);
        st.spesa=result.items;save();root.renderSpesa?.();root.toast?.('Spesa aggiornata: porzioni e totali'+(result.alreadyBought?' · acquistati già conteggiati':''));
        return result;
      }catch(e){root.toast?.(e.message||'Non riesco ad aggiornare la spesa');return {error:e.message};}
    };
    function download(name,text,type){
      const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');
      a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
    root.v122ExportDiet=()=>download('Piano_alimentare_v1.26.json',JSON.stringify(root.v122GetPrivateDiet(),null,2),'application/json');
    root.v122ExportText=()=>download('Piano_alimentare_v1.26.txt',textForPlan(root.v122GetPrivateDiet(),st.v124.plan),'text/plain;charset=utf-8');
    function ingredientHtml(i,d,m,prefix){
      const key=prefix+'|'+i.id,stateKey=d+'|'+m+'|'+key,value=st.v124.quantities[stateKey],convertible=i.amount===null||['pezzi','uova','frutti'].includes(i.unit);
      const optional=i.optional?`<label><input type="checkbox" ${st.v124.optional[stateKey]?'checked':''} onchange="v124Optional(${d},${m},'${key}',this.checked)"> Facoltativo: </label>`:'';
      return `<li>${optional}<b>${H(i.name)}</b> — ${H(Q.qty(i.amount,i.unit))}${i.note?` <span class="meta">(${H(i.note)})</span>`:''}${convertible?`<label class="v124-qb">${i.amount===null?'Quantità per la spesa':'Peso della porzione per la spesa'} <input type="number" min="0.001" max="1000000" step="0.001" aria-label="Grammi per la spesa: ${H(i.name)}, ${d}, ${m}" value="${Number.isFinite(value)?value:''}" placeholder="g" onchange="v124Quantity(${d},${m},'${key}',this.value)"> g</label>`:''}</li>`;
    }
    root.v124RenderMeal=function(meal,d,m){
      if(!meal.components||!Number.isInteger(d)||!Number.isInteger(m))return null;
      return `<div class="v122-meal" data-v124-meal="${d}-${m}"><div class="v122-meal-title"><b>${H(meal.name.toUpperCase())}</b></div>${meal.components.map(c=>{
        if(c.kind==='ingredient')return '<ul class="v122-list">'+ingredientHtml(c,d,m,c.id)+'</ul>';
        const key=d+'|'+m+'|'+c.id,option=c.options.find(o=>o.id===(st.v124.choices[key]||c.defaultOption))||c.options.find(o=>o.id===c.defaultOption);
        return `<label class="v124-choice-label">${H(c.label)}<select class="search v124-choice" data-choice="${d}-${m}-${H(c.id)}" onchange="v124Choice(${d},${m},'${c.id}',this.value)">${c.options.map(o=>`<option value="${H(o.id)}" ${o.id===option.id?'selected':''}>${H(o.label)}</option>`).join('')}</select></label><ul class="v122-list">${option.ingredients.map(i=>ingredientHtml(i,d,m,c.id+'|'+option.id)).join('')}</ul>`;
      }).join('')}<button class="btn small secondary v124-meal-shop" onclick="v124Shop('meal',${d},${m})">+ Spesa pasto</button></div>`;
    };
    const previousRenderSpesa=root.renderSpesa;
    root.renderSpesa=function(){
      const result=previousRenderSpesa?.();
      for(const listId of ['listaDaComprare','listaComprati'])document.getElementById(listId)?.querySelectorAll('.shop-item').forEach(el=>{
        const action=el.getAttribute('onclick')||el.querySelector('button[onclick*="cancellaComprato"]')?.getAttribute('onclick')||'';
        const id=action.match(/(?:segnaComprato|cancellaComprato)\(['"]([^'"]+)['"]\)/)?.[1],row=st.spesa?.find(x=>x.id===id),s=row&&summary(row);
        if(!s)return;const detail=el.querySelector('.v124-portion-detail'),total=el.querySelector('.qty');
        if(detail)detail.textContent=s.detail+(s.note?' · '+s.note:'');if(total)total.textContent=s.total;
      });
      return result;
    };
    save();
    let persisted=true;
    if(JSON.stringify(raw)!==JSON.stringify(diet)&&typeof indexedDB!=='undefined'){
      try{await new Promise((done,fail)=>{
        const request=indexedDB.open('dalla_simo_private_v122',1);
        request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('original_diets'))request.result.createObjectStore('original_diets',{keyPath:'key'});};
        request.onerror=()=>fail(request.error);request.onblocked=()=>fail(new Error('Archivio occupato'));
        request.onsuccess=()=>{const db=request.result,tx=db.transaction('original_diets','readwrite');
          tx.objectStore('original_diets').put({key:'simona',diet,importedAt:new Date().toISOString()});
          tx.oncomplete=()=>{db.close();done();};tx.onerror=tx.onabort=()=>{db.close();fail(tx.error);};};
      });}catch(e){persisted=false;}
    }
    root.__DALLA_SIMO_DIET_V126__={version:'1.26',mainPlan:MAIN,originalPlan:ORIGINAL,exactShoppingSums:true,portionWeights:true};
    root.v122RenderPrivateDiet?.();root.renderSpesa?.();
    resolve({available:true,migrated:first,persisted});
  }
  boot();
});
})(typeof window!=='undefined'?window:globalThis);
