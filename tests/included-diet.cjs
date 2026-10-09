const assert=require('node:assert/strict');
const Q=require('../domain-core-v124-diet-shopping.js');
const {getDefaultDiet,validateProfile,readProfileToken}=require('../domain-core-v125-default-diet.js');
const diet=getDefaultDiet();
assert.equal(diet.primaryPlan,'principale');
assert.equal(diet.plans.length,3);
assert.equal(diet.sourcePages,6);
assert.equal(diet.sourceContacts,undefined);
assert(!/Serinelli|Carreri|icloud|345843/.test(JSON.stringify(diet)));
assert.equal(diet.foodSections.length,5);
assert.equal(diet.notes.length,6);
for(const plan of diet.plans){
  assert.equal(plan.week.length,7);
  assert.equal(plan.week.flatMap(d=>d.meals).length,35);
  for(const d of plan.week)for(const m of d.meals)Q.validateComponents(m.components);
}
assert.deepEqual(diet.week,diet.plans[0].week);
for(const variant of diet.plans.slice(1)){
  let changes=0;
  for(let d=0;d<7;d++)for(let m=0;m<5;m++){
    const base=structuredClone(diet.week[d].meals[m]),alt=structuredClone(variant.week[d].meals[m]);
    if(JSON.stringify(base)!==JSON.stringify(alt)){
      changes++;assert(m===4&&[0,3,5].includes(d));
      assert.equal(alt.components[0].amount,150);
      base.components.shift();alt.components.shift();base.items.shift();alt.items.shift();assert.deepEqual(base,alt);
    }
  }
  assert.equal(changes,3);
}
const scopes=diet.week.flatMap((d,i)=>d.meals.map((m,j)=>[i,j]));
const main=Q.syncShopping([],Q.collect(diet.plans[0],{},'2026-10-05',scopes));
assert.equal(main.items.find(x=>x.nome==='Latte parzialmente scremato').quantita,700);
assert.equal(main.items.find(x=>x.nome==='Olio extravergine di oliva').quantita,140);
const third=Q.syncShopping(main.items,Q.collect(diet.plans[2],{},'2026-10-05',scopes));
assert.equal(third.items.find(x=>x.nome==='Platessa').quantita,300);
assert.deepEqual(Q.summary(third.items.find(x=>x.nome==='Platessa')),{detail:'150 g × 2',total:'Totale 300 g'});
assert.deepEqual(getDefaultDiet(),diet,'Ogni chiamata restituisce una copia autonoma');
assert.throws(()=>validateProfile({weight:-2}));
assert.deepEqual(validateProfile({height:'170',weight:'80,5',unexpected:'ignored'}),{weight:80.5,height:170});
const token=Buffer.from(JSON.stringify({height:170,weight:80.5})).toString('base64url');
assert.deepEqual(readProfileToken('#profilo='+token),{weight:80.5,height:170});

// Primo avvio senza alcun file, collegamento di attivazione o IndexedDB.
const nav={dataset:{s:'settimana'},innerHTML:'',onclick:null};
const h1={textContent:''},sub={textContent:''},out={innerHTML:'',querySelector:()=>null};
const sec={querySelector:q=>q==='h1'?h1:q==='.sub'?sub:null};
const elements={v122css:{},settimana:sec,pianoGiorno:out,giorniPlanner:{style:{}},v113DietCtl:{style:{}},membri:null};
global.window=global;global.v124Quantities=Q;global.v125GetDefaultDiet=getDefaultDiet;
global.document={getElementById:id=>elements[id]||null,querySelector:q=>q==='.nav [data-s="settimana"]'?nav:null};
global.requestAnimationFrame=fn=>fn();global.setTimeout=()=>{};
global.st={membri:[{id:'m2',nome:'Simona'}],giornoPlanner:'Lunedì'};
global.save=()=>{};global.renderSettimana=()=>{};global.renderMembri=()=>{};global.showScreenById=()=>{};
require('../domain-core-v122-simona-original.js');
assert.equal(v122GetPrivateDiet().plans.length,3);
assert.equal((out.innerHTML.match(/data-v122-day=/g)||[]).length,7);
assert(!out.innerHTML.includes('Importa dieta privata'));
assert(out.innerHTML.includes('Filetto di merluzzo 150 g'));
v122PrivateDietReady.then(result=>{
  assert.equal(result.available,true);assert.equal(result.state,'ready');
  assert(!out.innerHTML.includes('Apri il collegamento personale'));
  console.log('PIANO_INCLUSO_OK: 3 piani, 35 pasti, senza file e senza IndexedDB');
}).catch(e=>{console.error(e);process.exitCode=1;});
