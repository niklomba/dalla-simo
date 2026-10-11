const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Q=require('../domain-core-v124-diet-shopping.js');
const factory=require('../domain-core-v125-default-diet.js').getDefaultDiet;
const source=fs.readFileSync(require.resolve('../domain-core-v126-diet.js'),'utf8');
async function startup(saved){
  const ctx={console,Event,setTimeout,Promise,st:{v124:{plan:'principale',shopStart:'2026-10-05'},spesa:[]},save:()=>{},
    document:{getElementById:()=>null},v124Quantities:Q,v125GetDefaultDiet:factory,
    v122GetPrivateDiet:()=>structuredClone(saved),v122PrivateDietReady:Promise.resolve({available:true}),
    v124Shop:()=>{},v122RenderPrivateDiet:()=>{},renderSpesa:()=>{},dispatchEvent:()=>{}};
  ctx.window=ctx;vm.createContext(ctx);vm.runInContext(source,ctx);
  const ready=await ctx.v126Diet.ready;
  assert.equal(ready.available,true);
  return ctx;
}
(async()=>{
  const saved=factory();saved.week.forEach(d=>d.meals.forEach(m=>m.components=Q.validateComponents(m.components)));
  const app=await startup(saved);
  assert.equal(app.st.v124.plan,'simona-principale');
  assert.equal(app.v122GetPrivateDiet().primaryPlan,'simona-principale');
  assert.equal(app.v124SelectedPlan(saved).week[5].meals[4].components[0].name,'Polpo');
  const eggs=app.v126SelectedPlan().week[1].meals[4];
  assert(app.v124RenderMeal(eggs,1,4).includes('Peso della porzione per la spesa'));
  assert.equal(app.v124Quantity(1,4,'uova|uova','110'),true);
  assert.equal(app.v124Quantity(1,4,'uova|uova','0.0001'),false);
  const result=app.v124Shop('meal',1,4);
  assert.equal(result.items.find(x=>x.nome==='Uova').quantita,110);
  assert.equal(result.items.find(x=>x.nome==='Uova').unita,'g');
  app.v124Shop('meal',1,4);
  assert.equal(app.st.spesa.find(x=>x.nome==='Uova').quantita,110);
  assert.equal(app.v124ChoosePlan('simona-originale'),true);
  assert.equal(app.v126SelectedPlan().week[0].meals[4].components[0].name,'Filetto di merluzzo');
  const custom=factory();custom.week[0].meals[0].components[1].amount=110;
  const personal=await startup(custom);
  assert.equal(personal.st.v124.plan,'principale');
  assert.equal(personal.v122GetPrivateDiet().week[0].meals[0].components[1].amount,110);
  console.log('V126_STARTUP_OK: avvio, migrazione dati validati, editor grammi, spesa pasto, documento originale e copia personalizzata');
})().catch(e=>{console.error(e);process.exitCode=1;});
