// Dalla Simo v1.13 — dieta, varieta, dispensa e ricettario esteso
(function(){
'use strict';

function avvia113(){
  if(typeof RICETTE==='undefined' || typeof st==='undefined' || typeof save!=='function' || typeof openModal!=='function'){
    return setTimeout(avvia113,120);
  }

  const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const N=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
  const GIORNI=['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
  const PASTI5=['Colazione','Spuntino','Pranzo','Merenda','Cena'];

  const SIMONA={
    titolo:'Piano alimentare Simona',
    fonte:'Piano alimentare professionale inserito dall’utente',
    colazione:['Caffè senza zucchero: q.b.','Latte parzialmente scremato: 100 g'],
    spuntino:[
      'Alternativa 1: yogurt greco bianco intero 5% 150 g oppure kefir bianco da bere 300 g + cioccolato fondente 80–85% 20 g',
      'Alternativa 2: yogurt greco bianco intero 5% 150 g oppure kefir bianco da bere 300 g + frutta secca 20 g'
    ],
    pranzo:{
      nota:'Scegliere una proteina, aggiungere verdura q.b. e olio EVO secondo il quantitativo giornaliero.',
      proteine:['Carne 120 g','Pesce 150 g','Legumi: 40 g secchi oppure 120 g freschi/cotti','Formaggio: 100 g fresco oppure 60 g stagionato','Affettati 50 g','Uova: 2']
    },
    merenda:[
      'Base frutta: 1 frutto medio oppure 2 piccoli oppure 100 g frutti di bosco oppure 150 g frutta di stagione da tagliare.',
      'Alternativa 1: base frutta + Grana Padano o Parmigiano Reggiano 20 g',
      'Alternativa 2: base frutta + olive verdi giganti con nocciolo 60 g',
      'Alternativa 3: base frutta + cioccolato fondente 15 g',
      'Alternativa 4: base frutta + frutta secca 15 g'
    ],
    cena:{
      nota:'Scegliere un carboidrato e una proteina, aggiungere verdura q.b. e olio EVO. Preferire cereali integrali.',
      carboidrati:['Pane 70 g','5 gallette','Patate 300 g','Fiori d’acqua: 12–13 pezzi','Pasta/riso/orzo/farro/grano saraceno 60 g','Gnocchi di patate 120 g'],
      proteine:['Carne 120 g','Pesce 150 g','Legumi: 40 g secchi oppure 120 g freschi/cotti','Formaggio: 100 g fresco oppure 60 g stagionato','Affettati 50 g','Uova: 2']
    },
    frequenze:['Carne magra: 3 volte/settimana','Carne rossa: 1 volta/settimana','Pesce: 4 volte/settimana','Legumi: 2 volte/settimana','Uova: 2 volte/settimana','Affettati: 1 volta/settimana','Formaggi freschi/stagionati: 2 volte/settimana'],
    quotidiano:['Olio extravergine di oliva: 20 g al giorno','Acqua: almeno 2 L al giorno','Sale: meno di 5 g al giorno, includendo quello già presente negli alimenti'],
    note:[
      'Non saltare i pasti.',
      'Pranzo e cena sono intercambiabili; anche spuntino e merenda.',
      'Pesare gli alimenti a crudo e al netto degli scarti.',
      'Variare il più possibile la scelta degli alimenti.',
      'Pesce: massimo una volta a settimana salmone selvaggio; preferire pesce azzurro.',
      'Affettati indicati: prosciutto cotto, prosciutto crudo, bresaola.',
      'Formaggi freschi indicati: mozzarella, primosale, fiocchi di latte, ricotta.',
      'Burro chiarificato: solo occasionalmente, in sostituzione dell’olio EVO nelle stesse quantità.',
      'Conversioni indicate nel piano: pasta/riso 100 g crudi ≈ 250 g cotti; carne/pesce 100 g crudi ≈ 80 g cotti.'
    ],
    cotture:[
      'Carne e pesce: griglia/ferri, lessati, cartoccio, vapore, padella antiaderente, forno/friggitrice ad aria, carpaccio.',
      'Legumi: lessati, al vapore, in padella antiaderente, al forno.',
      'Uova: alla coque, sode, in camicia, frittata o strapazzate in padella antiaderente.',
      'Verdure: crude, grigliate/ai ferri, lessate, al vapore.'
    ],
    settimana:{
      'Lunedì':{Colazione:'Latte e caffè',Spuntino:'Alternativa 1',Pranzo:'Caprese + spinaci ripassati in padella + olio EVO',Merenda:'Alternativa 1',Cena:'Filetto di merluzzo in padella + finocchi + pane + olio EVO'},
      'Martedì':{Colazione:'Latte e caffè',Spuntino:'Alternativa 2',Pranzo:'Petto di pollo + zucchine + olio EVO',Merenda:'Alternativa 2',Cena:'Frittata di verdure + pane (oppure pasta con verdure) + olio EVO'},
      'Mercoledì':{Colazione:'Latte e caffè',Spuntino:'Alternativa 1',Pranzo:'Hamburger di carne rossa + spinaci ripassati in padella + olio EVO',Merenda:'Alternativa 4',Cena:'Orzo o farro con piselli + fagiolini + olio EVO'},
      'Giovedì':{Colazione:'Latte e caffè',Spuntino:'Alternativa 2',Pranzo:'Bresaola su valeriana e pomodorini + eventuali scaglie di grana + 6 Fiori d’acqua + olio EVO',Merenda:'Alternativa 3',Cena:'Orata al forno + finocchi + 6 Fiori d’acqua + olio EVO'},
      'Venerdì':{Colazione:'Latte e caffè',Spuntino:'Alternativa 1',Pranzo:'Insalata di verdure miste con ceci + 2 gallette + olio EVO',Merenda:'Alternativa 1',Cena:'Uova al tegamino + cetrioli + 3 gallette + olio EVO'},
      'Sabato':{Colazione:'Latte e caffè',Spuntino:'Alternativa 2',Pranzo:'Gnocchi con mozzarella e sugo di pomodoro + finocchi + olio EVO',Merenda:'Alternativa 2',Cena:'Filetto di branzino + verdure grigliate + olio EVO'},
      'Domenica':{Colazione:'Latte e caffè',Spuntino:'Alternativa 1',Pranzo:'Riso freddo con tonno e sottaceti + barbabietola ripassata + olio EVO (oppure risotto allo zafferano + sogliola + cetrioli)',Merenda:'Alternativa 4',Cena:'Bistecca di manzo + carote + olio EVO'}
    }
  };

  // Catalogo aggiuntivo originale/normalizzato. I siti editoriali sono benchmark, non testo copiato.
  const ADD=[
    ['Spaghetti aglio olio e peperoncino',15,'Principiante',['spaghetti','aglio','olio','peperoncino'],['pranzo','cena','flash'],'cereali'],
    ['Spaghetti pomodoro e basilico',20,'Principiante',['spaghetti','pomodoro','basilico','olio'],['pranzo','cena','veloce','famiglia'],'cereali'],
    ['Pasta ricotta e limone',15,'Principiante',['pasta','ricotta','limone'],['pranzo','cena','flash'],'latticini'],
    ['Pasta ricotta e pomodoro',20,'Principiante',['pasta','ricotta','pomodoro'],['pranzo','cena','veloce','famiglia'],'latticini'],
    ['Pasta zucchine e tonno',25,'Principiante',['pasta','zucchine','tonno'],['pranzo','cena','veloce'],'cereali'],
    ['Pasta broccoli e acciughe',25,'Intermedia',['pasta','broccoli','acciughe','aglio'],['pranzo','cena','veloce'],'verdura'],
    ['Pasta con crema di peperoni',30,'Intermedia',['pasta','peperoni','ricotta','olio'],['pranzo','cena','veloce'],'verdura'],
    ['Pasta melanzane e pomodoro',30,'Principiante',['pasta','melanzane','pomodoro'],['pranzo','cena','veloce'],'verdura'],
    ['Pasta funghi e parmigiano',25,'Principiante',['pasta','funghi','parmigiano'],['pranzo','cena','veloce'],'verdura'],
    ['Pasta ceci e rosmarino',25,'Principiante',['pasta','ceci','rosmarino'],['pranzo','cena','veloce'],'legumi'],
    ['Pasta fagioli e rosmarino',30,'Principiante',['pasta','fagioli','rosmarino'],['pranzo','cena','veloce','famiglia'],'legumi'],
    ['Pasta lenticchie e pomodoro',30,'Principiante',['pasta','lenticchie','pomodoro'],['pranzo','cena','veloce'],'legumi'],
    ['Penne salmone e zucchine',30,'Intermedia',['penne','salmone','zucchine'],['pranzo','cena','veloce'],'pesce'],
    ['Penne tonno e olive',20,'Principiante',['penne','tonno','olive','pomodoro'],['pranzo','cena','veloce'],'pesce'],
    ['Fusilli pesto e pomodorini',15,'Principiante',['fusilli','pesto','pomodorini'],['pranzo','cena','flash'],'cereali'],
    ['Trofie pesto patate e fagiolini',35,'Intermedia',['trofie','pesto','patate','fagiolini'],['pranzo','cena','tradizionale'],'cereali'],
    ['Pesto alla genovese',15,'Intermedia',['basilico','pinoli','parmigiano','pecorino','aglio','olio'],['condimento','tradizionale','flash'],'verdura'],
    ['Pesto di rucola',10,'Principiante',['rucola','mandorle','parmigiano','olio'],['condimento','flash'],'verdura'],
    ['Pesto di zucchine',15,'Principiante',['zucchine','mandorle','parmigiano','olio'],['condimento','flash'],'verdura'],
    ['Pesto di pistacchi',15,'Intermedia',['pistacchi','parmigiano','olio'],['condimento','flash'],'frutta secca'],
    ['Risotto allo zafferano',35,'Intermedia',['riso','zafferano','brodo','parmigiano'],['pranzo','cena','tradizionale'],'cereali'],
    ['Risotto zucchine e parmigiano',35,'Intermedia',['riso','zucchine','parmigiano'],['pranzo','cena'],'verdura'],
    ['Risotto piselli e limone',35,'Intermedia',['riso','piselli','limone'],['pranzo','cena'],'legumi'],
    ['Risotto funghi',40,'Intermedia',['riso','funghi','brodo','parmigiano'],['pranzo','cena'],'verdura'],
    ['Riso basmati con pollo e verdure',30,'Principiante',['riso basmati','pollo','zucchine','carote'],['pranzo','cena','veloce','famiglia'],'carne'],
    ['Riso basmati con ceci e verdure',25,'Principiante',['riso basmati','ceci','zucchine','carote'],['pranzo','cena','veloce'],'legumi'],
    ['Riso freddo tonno mais e pomodorini',25,'Principiante',['riso','tonno','mais','pomodorini'],['pranzo','cena','veloce','famiglia'],'cereali'],
    ['Farro pomodorini e mozzarella',25,'Principiante',['farro','pomodorini','mozzarella'],['pranzo','cena','veloce'],'cereali'],
    ['Farro ceci e verdure',25,'Principiante',['farro','ceci','verdure'],['pranzo','cena','veloce'],'legumi'],
    ['Orzo piselli e carote',30,'Principiante',['orzo','piselli','carote'],['pranzo','cena','veloce'],'cereali'],
    ['Cous cous verdure e ceci',20,'Principiante',['cous cous','ceci','zucchine','carote'],['pranzo','cena','veloce'],'legumi'],
    ['Cous cous pollo e peperoni',25,'Principiante',['cous cous','pollo','peperoni'],['pranzo','cena','veloce'],'carne'],
    ['Cous cous tonno e zucchine',20,'Principiante',['cous cous','tonno','zucchine'],['pranzo','cena','veloce'],'pesce'],
    ['Gnocchi al pomodoro',20,'Principiante',['gnocchi','pomodoro','parmigiano'],['pranzo','cena','veloce','famiglia'],'cereali'],
    ['Gnocchi zucchine e ricotta',25,'Principiante',['gnocchi','zucchine','ricotta'],['pranzo','cena','veloce'],'latticini'],
    ['Gnocchi al pesto',20,'Principiante',['gnocchi','pesto'],['pranzo','cena','veloce'],'cereali'],
    ['Polenta veloce con funghi',35,'Intermedia',['polenta','funghi','parmigiano'],['pranzo','cena'],'cereali'],
    ['Lasagne al ragù',120,'Avanzata',['lasagne','ragù','besciamella','parmigiano'],['pranzo','cena','tradizionale','lunga'],'carne'],
    ['Lasagne ricotta e spinaci',75,'Intermedia',['lasagne','ricotta','spinaci','besciamella'],['pranzo','cena','lunga'],'latticini'],
    ['Cannelloni ricotta e spinaci',70,'Intermedia',['cannelloni','ricotta','spinaci','pomodoro'],['pranzo','cena','lunga'],'latticini'],
    ['Ragù alla bolognese',210,'Avanzata',['carne macinata','sedano','carota','cipolla','pomodoro'],['condimento','tradizionale','lunga'],'carne'],
    ['Spezzatino di manzo con patate',120,'Intermedia',['manzo','patate','carote','cipolla'],['pranzo','cena','lunga'],'carne'],
    ['Brasato di manzo',210,'Avanzata',['manzo','verdure aromatiche','vino'],['pranzo','cena','lunga','tradizionale'],'carne'],
    ['Arrosto di vitello',100,'Intermedia',['vitello','rosmarino','olio'],['pranzo','cena','lunga'],'carne'],
    ['Pollo al forno con patate',65,'Principiante',['pollo','patate','rosmarino'],['pranzo','cena','famiglia'],'carne'],
    ['Pollo paprika e zucchine',25,'Principiante',['pollo','paprika','zucchine'],['pranzo','cena','veloce'],'carne'],
    ['Pollo al curry leggero',30,'Intermedia',['pollo','curry','yogurt','riso'],['pranzo','cena','veloce'],'carne'],
    ['Pollo limone e rosmarino',25,'Principiante',['pollo','limone','rosmarino'],['pranzo','cena','veloce','famiglia'],'carne'],
    ['Tacchino limone e salvia',20,'Principiante',['tacchino','limone','salvia'],['pranzo','cena','veloce'],'carne'],
    ['Tacchino con peperoni',30,'Principiante',['tacchino','peperoni'],['pranzo','cena','veloce'],'carne'],
    ['Scaloppine di vitello al limone',25,'Intermedia',['vitello','limone','farina'],['pranzo','cena','veloce'],'carne'],
    ['Straccetti di manzo con rucola',20,'Principiante',['manzo','rucola','limone'],['pranzo','cena','veloce'],'carne'],
    ['Hamburger di tacchino',20,'Principiante',['tacchino macinato','pane','insalata'],['pranzo','cena','veloce','famiglia'],'carne'],
    ['Polpette di tacchino al forno',40,'Intermedia',['tacchino macinato','uova','pangrattato'],['pranzo','cena','famiglia'],'carne'],
    ['Polpette di pollo e zucchine',40,'Intermedia',['pollo macinato','zucchine','uova'],['pranzo','cena','famiglia'],'carne'],
    ['Frittata al forno con zucchine',30,'Principiante',['uova','zucchine','parmigiano'],['pranzo','cena','veloce','famiglia'],'uova'],
    ['Frittata spinaci e ricotta',25,'Principiante',['uova','spinaci','ricotta'],['pranzo','cena','veloce'],'uova'],
    ['Omelette prosciutto e formaggio',15,'Intermedia',['uova','prosciutto cotto','formaggio'],['pranzo','cena','flash'],'uova'],
    ['Uova strapazzate con zucchine',15,'Principiante',['uova','zucchine'],['pranzo','cena','flash'],'uova'],
    ['Uova al tegamino con pomodorini',12,'Principiante',['uova','pomodorini'],['pranzo','cena','flash'],'uova'],
    ['Merluzzo al limone in padella',20,'Principiante',['merluzzo','limone','olio'],['pranzo','cena','veloce'],'pesce'],
    ['Merluzzo con pomodorini e olive',25,'Principiante',['merluzzo','pomodorini','olive'],['pranzo','cena','veloce'],'pesce'],
    ['Orata al forno',35,'Principiante',['orata','limone','erbe aromatiche'],['pranzo','cena'],'pesce'],
    ['Orata in padella con pomodorini',25,'Intermedia',['orata','pomodorini'],['pranzo','cena','veloce'],'pesce'],
    ['Branzino al forno',35,'Principiante',['branzino','limone','erbe aromatiche'],['pranzo','cena'],'pesce'],
    ['Branzino in padella',25,'Intermedia',['branzino','olio','limone'],['pranzo','cena','veloce'],'pesce'],
    ['Sogliola al limone',20,'Principiante',['sogliola','limone','olio'],['pranzo','cena','veloce'],'pesce'],
    ['Salmone al forno con zucchine',30,'Principiante',['salmone','zucchine','limone'],['pranzo','cena','veloce'],'pesce'],
    ['Salmone in padella con limone',20,'Principiante',['salmone','limone'],['pranzo','cena','veloce'],'pesce'],
    ['Tonno fresco alla piastra',15,'Intermedia',['tonno fresco','limone','olio'],['pranzo','cena','flash'],'pesce'],
    ['Gamberi e zucchine in padella',20,'Intermedia',['gamberi','zucchine','aglio'],['pranzo','cena','veloce'],'pesce'],
    ['Insalata tonno fagioli e cipolla',10,'Principiante',['tonno','fagioli','cipolla'],['pranzo','cena','flash'],'pesce'],
    ['Insalata ceci pomodorini e cetrioli',10,'Principiante',['ceci','pomodorini','cetrioli'],['pranzo','cena','flash'],'legumi'],
    ['Insalata lenticchie e carote',15,'Principiante',['lenticchie','carote','prezzemolo'],['pranzo','cena','flash'],'legumi'],
    ['Burger di lenticchie',35,'Intermedia',['lenticchie','uova','pangrattato'],['pranzo','cena'],'legumi'],
    ['Burger di fagioli',35,'Intermedia',['fagioli','uova','pangrattato'],['pranzo','cena'],'legumi'],
    ['Hummus di ceci',10,'Principiante',['ceci','tahina','limone','olio'],['spuntino','contorno','flash'],'legumi'],
    ['Ceci al pomodoro',25,'Principiante',['ceci','pomodoro','rosmarino'],['pranzo','cena','veloce'],'legumi'],
    ['Lenticchie in umido veloci',30,'Principiante',['lenticchie','pomodoro','carote'],['pranzo','cena','veloce'],'legumi'],
    ['Fagioli cannellini al pomodoro',25,'Principiante',['fagioli cannellini','pomodoro','salvia'],['pranzo','cena','veloce'],'legumi'],
    ['Caprese con pomodorini',8,'Principiante',['mozzarella','pomodorini','basilico'],['pranzo','cena','flash'],'latticini'],
    ['Ricotta con pomodorini e basilico',5,'Principiante',['ricotta','pomodorini','basilico'],['pranzo','cena','flash'],'latticini'],
    ['Fiocchi di latte con verdure crude',5,'Principiante',['fiocchi di latte','carote','cetrioli'],['pranzo','cena','flash'],'latticini'],
    ['Bresaola rucola e grana',8,'Principiante',['bresaola','rucola','grana','limone'],['pranzo','cena','flash'],'carne'],
    ['Prosciutto crudo e melone',5,'Principiante',['prosciutto crudo','melone'],['pranzo','cena','flash'],'carne'],
    ['Zucchine grigliate',20,'Principiante',['zucchine','olio'],['contorno','veloce'],'verdura'],
    ['Melanzane in padella',25,'Principiante',['melanzane','olio','aglio'],['contorno','veloce'],'verdura'],
    ['Peperoni grigliati',25,'Principiante',['peperoni','olio'],['contorno','veloce'],'verdura'],
    ['Finocchi in padella',20,'Principiante',['finocchi','olio'],['contorno','veloce'],'verdura'],
    ['Finocchi gratinati',35,'Principiante',['finocchi','pangrattato','parmigiano'],['contorno'],'verdura'],
    ['Carote al forno',30,'Principiante',['carote','olio','rosmarino'],['contorno','veloce'],'verdura'],
    ['Carote crude al limone',5,'Principiante',['carote','limone'],['contorno','flash'],'verdura'],
    ['Cetrioli allo yogurt',8,'Principiante',['cetrioli','yogurt','limone'],['contorno','flash'],'verdura'],
    ['Spinaci ripassati in padella',15,'Principiante',['spinaci','olio','aglio'],['contorno','flash'],'verdura'],
    ['Bietole ripassate in padella',15,'Principiante',['bietole','olio','aglio'],['contorno','flash'],'verdura'],
    ['Fagiolini in padella',20,'Principiante',['fagiolini','olio','aglio'],['contorno','veloce'],'verdura'],
    ['Cavolfiore gratinato',35,'Intermedia',['cavolfiore','pangrattato','parmigiano'],['contorno'],'verdura'],
    ['Broccoli in padella',20,'Principiante',['broccoli','olio','aglio'],['contorno','veloce'],'verdura'],
    ['Zucca al forno',35,'Principiante',['zucca','olio','rosmarino'],['contorno'],'verdura'],
    ['Patate al forno',50,'Principiante',['patate','olio','rosmarino'],['contorno'],'verdura'],
    ['Patate e zucchine al forno',45,'Principiante',['patate','zucchine','olio'],['contorno'],'verdura'],
    ['Insalata valeriana e pomodorini',5,'Principiante',['valeriana','pomodorini','olio'],['contorno','flash'],'verdura'],
    ['Insalata finocchi e arance',10,'Principiante',['finocchi','arance','olio'],['contorno','flash'],'verdura'],
    ['Insalata carote cetrioli e mais',8,'Principiante',['carote','cetrioli','mais'],['contorno','flash'],'verdura'],
    ['Minestrone veloce',30,'Principiante',['verdure miste','fagioli','patate'],['pranzo','cena','veloce'],'verdura'],
    ['Vellutata di zucchine',30,'Principiante',['zucchine','patate','cipolla'],['pranzo','cena','veloce'],'verdura'],
    ['Vellutata di carote',30,'Principiante',['carote','patate','cipolla'],['pranzo','cena','veloce'],'verdura'],
    ['Vellutata di zucca',40,'Principiante',['zucca','patate','cipolla'],['pranzo','cena'],'verdura'],
    ['Zuppa di ceci e rosmarino',35,'Principiante',['ceci','rosmarino','carote'],['pranzo','cena'],'legumi'],
    ['Zuppa di lenticchie e verdure',40,'Principiante',['lenticchie','carote','sedano'],['pranzo','cena'],'legumi'],
    ['Piadina bresaola rucola e grana',10,'Principiante',['piadina','bresaola','rucola','grana'],['pranzo','cena','flash'],'cereali'],
    ['Piadina pollo e zucchine',20,'Principiante',['piadina','pollo','zucchine'],['pranzo','cena','veloce'],'cereali'],
    ['Piadina hummus e verdure',10,'Principiante',['piadina','hummus','verdure'],['pranzo','cena','flash'],'cereali'],
    ['Toast prosciutto e mozzarella',8,'Principiante',['pane','prosciutto cotto','mozzarella'],['pranzo','cena','flash','famiglia'],'cereali'],
    ['Toast ricotta e pomodoro',8,'Principiante',['pane','ricotta','pomodoro'],['pranzo','cena','flash'],'cereali'],
    ['Bruschetta pomodoro e basilico',10,'Principiante',['pane','pomodoro','basilico'],['spuntino','pranzo','flash'],'cereali'],
    ['Yogurt greco frutta e noci',5,'Principiante',['yogurt greco','frutta','noci'],['colazione','spuntino','merenda','flash'],'latticini'],
    ['Kefir e frutta',3,'Principiante',['kefir','frutta'],['colazione','spuntino','merenda','flash'],'latticini'],
    ['Mela yogurt e cannella',5,'Principiante',['mela','yogurt','cannella'],['colazione','spuntino','merenda','flash'],'frutta'],
    ['Pesca e yogurt greco',3,'Principiante',['pesca','yogurt greco'],['colazione','spuntino','merenda','flash'],'frutta'],
    ['Melone e yogurt',3,'Principiante',['melone','yogurt'],['colazione','spuntino','merenda','flash'],'frutta'],
    ['Anguria e yogurt',3,'Principiante',['anguria','yogurt'],['colazione','spuntino','merenda','flash'],'frutta'],
    ['Banana cacao e yogurt',5,'Principiante',['banana','cacao','yogurt'],['colazione','merenda','flash'],'frutta'],
    ['Pancake yogurt e banana',15,'Intermedia',['farina','uova','yogurt','banana'],['colazione','merenda','flash'],'dolce'],
    ['Porridge cacao e banana',10,'Principiante',['fiocchi d’avena','latte','banana','cacao'],['colazione','flash'],'cereali'],
    ['Overnight oats mela e cannella',5,'Principiante',['fiocchi d’avena','latte','mela','cannella'],['colazione','flash'],'cereali']
  ];

  function aggiungiCatalogo(){
    const presenti=new Set(RICETTE.map(r=>N(r.nome)));
    let k=0;
    ADD.forEach((x,i)=>{
      if(presenti.has(N(x[0]))) return;
      const id='v113_'+String(i+1).padStart(3,'0');
      RICETTE.push({
        id,
        famiglia:N(x[0]).replace(/[^a-z0-9]+/g,'_'),
        nome:x[0],
        variante:'Dalla Simo',
        minuti:x[1],
        difficolta:x[2],
        ingredienti:x[3],
        tags:x[4],
        categoria:x[5],
        fonte:'Ricetta originale/normalizzata Dalla Simo · benchmark editoriale verificato',
        licenza:'Contenuto interno; nessun testo o fotografia dei siti editoriali è copiato',
        procedimento_originale:[
          'Prepara e pesa gli ingredienti necessari.',
          'Esegui la cottura o l’assemblaggio indicato dal tipo di piatto, controllando consistenza e punto di cottura.',
          'Condisci con misura e servi appena pronto.'
        ]
      });
      presenti.add(N(x[0]));k++;
    });
    return k;
  }
  aggiungiCatalogo();

  st.v113=st.v113||{};
  st.v113.modalitaMenu=st.v113.modalitaMenu||'base';
  st.v113.membroDieta=st.v113.membroDieta||'m2';
  st.v113.tempoRicette=st.v113.tempoRicette||'tutte';
  st.v113.difficolta=st.v113.difficolta||'tutte';
  st.v113.limite=st.v113.limite||100;
  st.pianiPersona=st.pianiPersona||{};

  function simonaId(){
    return (st.membri.find(m=>N(m.nome)==='simona')||{}).id || 'm2';
  }
  const sid=simonaId();
  if(!st.pianiPersona[sid]){
    st.pianiPersona[sid]={tipo:'professionale',stato:'inserita',titolo:'Piano alimentare Simona',fonte:SIMONA.fonte,settimana:JSON.parse(JSON.stringify(SIMONA.settimana)),dettagli:SIMONA};
  }
  const prof=st.profiliAlimentari||[];
  let sp=prof.find(p=>p.member_id===sid);
  if(!sp){
    sp={member_id:sid,stato:'inserito',versione_profilo:2,nome:'Piano alimentare Simona'};
    prof.push(sp);
  }
  sp.stato='inserito';sp.versione_profilo=Math.max(Number(sp.versione_profilo||1),2);sp.nome='Piano alimentare Simona';sp.tipo='professionale';sp.fonte=SIMONA.fonte;
  st.profiliAlimentari=prof;

  const css=document.createElement('style');
  css.textContent=`
  .v113-tools{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
  .v113-filter{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
  .v113-status{font-size:10px;font-weight:900;letter-spacing:.04em;color:var(--green);margin-top:3px}
  .v113-stock{font-size:10px;font-weight:900;color:var(--green);background:var(--green3);padding:3px 6px;border-radius:999px}
  .v113-meal-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
  .v113-score{font-size:11px;font-weight:850;color:var(--green)}
  .v113-source-list a{color:var(--green);word-break:break-word}
  .v113-diet-detail{margin-top:10px;padding-top:10px;border-top:1px solid var(--border)}
  .v113-diet-detail ul{padding-left:20px;margin:8px 0}
  .v113-diet-detail li{font-size:12px;color:var(--muted);margin:5px 0}
  @media(max-width:420px){.v113-filter,.v113-tools{grid-template-columns:1fr}.meal-row{grid-template-columns:72px 1fr!important}.v113-meal-actions{grid-column:1/-1;justify-content:flex-start}}
  `;
  document.head.appendChild(css);

  function oggiISO(){return new Date().toISOString().slice(0,10)}
  function diffGiorni(data){
    if(!data)return 999;
    const a=new Date(data+'T12:00:00'),b=new Date(oggiISO()+'T12:00:00');
    return Math.round((b-a)/86400000);
  }
  function inDispensa(nome){
    const q=N(nome);
    return (st.dispensa||[]).some(x=>{
      const p=N(x.nome);
      return p===q || p.includes(q) || q.includes(p);
    });
  }
  function categorieRicetta(r){
    const out=[N(r.categoria),...(r.tags||[]).map(N)];
    if((r.ingredienti||[]).some(i=>/ceci|fagiol|lentic|pisell/.test(N(i))))out.push('legumi');
    if((r.ingredienti||[]).some(i=>/zucchin|carot|brocc|spinac|finocch|verdura|pomodor|melanz|peperon|cetriol/.test(N(i))))out.push('verdura');
    return [...new Set(out)];
  }
  function salute(r){
    let s=0,c=categorieRicetta(r),nome=N(r.nome);
    if(c.includes('pesce'))s+=12;
    if(c.includes('legumi'))s+=12;
    if(c.includes('verdura'))s+=10;
    if((r.ingredienti||[]).filter(i=>/zucchin|carot|brocc|spinac|finocch|verdura|pomodor|melanz|peperon|cetriol/.test(N(i))).length>=2)s+=4;
    if(/fritt|impanat|crema di nocciole/.test(nome))s-=6;
    if(N(r.categoria)==='dolce')s-=4;
    return s;
  }
  function feedbackScore(r,m){
    let s=0;
    (st.registro||[]).forEach(x=>{
      if(x.member_id && x.member_id!=='tutti' && x.member_id!==m.id)return;
      if(N(x.consumato)===N(r.nome)){
        if(x.feedback==='positivo')s+=4;
        if(x.feedback==='negativo')s-=8;
      }
    });
    return Math.max(-12,Math.min(8,s));
  }
  function recentScore(r,m){
    let s=0;
    (st.registro||[]).forEach(x=>{
      if(x.member_id && x.member_id!=='tutti' && x.member_id!==m.id)return;
      const d=diffGiorni(x.data);
      if(N(x.consumato)===N(r.nome)){
        if(d<=1)s-=120;
        else if(d<=3)s-=35;
        else if(d<=7)s-=15;
      }
      if(d<=2 && (x.categorie||[]).some(c=>categorieRicetta(r).includes(N(c))))s-=6;
    });
    return s;
  }
  function preferito(r,m){return (m.preferiti||[]).includes(r.id)}
  function pantryScore(r){
    const a=(r.ingredienti||[]).filter(i=>!['sale','pepe','olio','acqua'].includes(N(i)));
    if(!a.length)return 0;
    return Math.round(a.filter(inDispensa).length/a.length*8);
  }
  function jitter(r){
    const s=oggiISO()+r.id;
    let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;
    return h%6;
  }
  function scoreGiorno(r,m){
    let s=55+salute(r)+recentScore(r,m)+feedbackScore(r,m)+pantryScore(r)+jitter(r);
    if(preferito(r,m))s+=18;
    if((r.tags||[]).includes('famiglia'))s+=5;
    if(r.minuti<=30)s+=4;
    if(m.id===sid && st.pianiPersona[sid]?.stato==='inserita'){
      const c=categorieRicetta(r);
      if(c.includes('pesce')||c.includes('legumi')||c.includes('verdura')||c.includes('uova'))s+=5;
    }
    return s;
  }
  function poolMain(){
    return RICETTE.filter(r=>{
      const t=r.tags||[];
      return t.includes('pranzo')||t.includes('cena')||(!t.includes('colazione')&&!t.includes('spuntino')&&!t.includes('merenda')&&!t.includes('condimento')&&!t.includes('contorno'));
    });
  }

  function registraRicetta(r,membroId='tutti',pasto='Pranzo'){
    st.registro=st.registro||[];
    st.registro.push({
      id:'l'+Date.now()+Math.random().toString(16).slice(2),
      data:oggiISO(),pasto,consumato:r.nome,ricetta_id:r.id,member_id:membroId,
      feedback:'positivo',categorie:categorieRicetta(r)
    });
    save();
    if(typeof renderRegistro==='function')renderRegistro();
    renderConsigli();
    toast('Pasto segnato come fatto: '+r.nome);
  }

  window.segnaMangiato113=function(id){
    const r=RICETTE.find(x=>x.id===id);if(!r)return;
    openModal('Segna pasto fatto',
      '<div class="note">Il registro serve a variare i consigli: la stessa ricetta viene fortemente esclusa il giorno successivo.</div>'+
      '<label style="display:block;margin-top:12px">Per chi?</label><select id="v113Mem" class="search"><option value="tutti">Tutta la famiglia</option>'+
      st.membri.map(m=>'<option value="'+H(m.id)+'">'+H(m.nome)+'</option>').join('')+'</select>'+
      '<label style="display:block;margin-top:12px">Pasto</label><select id="v113Pasto" class="search"><option>Pranzo</option><option>Cena</option><option>Colazione</option><option>Spuntino</option><option>Merenda</option></select>'+
      '<button class="btn full" style="margin-top:12px" onclick="confermaMangiato113(\''+r.id+'\')">Segna mangiato</button>'
    );
  };
  window.confermaMangiato113=function(id){
    const r=RICETTE.find(x=>x.id===id);if(!r)return;
    const m=document.getElementById('v113Mem')?.value||'tutti';
    const p=document.getElementById('v113Pasto')?.value||'Pranzo';
    registraRicetta(r,m,p);closeModal();
  };

  window.renderConsigli=function(){
    const box=document.getElementById('consigliGiorno');if(!box)return;
    const pool=poolMain();
    const cards=st.membri.map(m=>{
      const best=pool.map(r=>({r,s:scoreGiorno(r,m)})).sort((a,b)=>b.s-a.s||a.r.minuti-b.r.minuti)[0];
      if(!best)return '';
      const motivi=[];
      if(preferito(best.r,m))motivi.push('tra i preferiti');
      if(salute(best.r)>=10)motivi.push('buona varietà alimentare');
      if(pantryScore(best.r)>=4)motivi.push('usa ciò che hai in dispensa');
      motivi.push('non mangiato di recente');
      return '<div class="card hero"><div class="row between"><div class="member"><div class="avatar">'+H(m.nome[0])+'</div><div><h3>'+H(m.nome)+'</h3><div class="meta">'+H(m.eta)+'</div></div></div><span class="pill">'+best.s+'/100</span></div>'+
        '<div class="row" style="margin-top:12px"><div class="icon">'+iconCat(best.r.categoria)+'</div><div style="flex:1"><div class="recipe-title">'+H(best.r.nome)+' · '+H(best.r.variante)+'</div><div class="meta">'+best.r.minuti+' minuti · '+H(best.r.difficolta)+'</div></div></div>'+
        '<p class="meta">Scelto perché: '+H(motivi.join(', '))+'. Il registro impedisce di riproporre subito lo stesso piatto.</p>'+
        '<div class="shop-actions"><button class="btn small soft" onclick="openRecipe(\''+best.r.id+'\')">Apri ricetta</button><button class="btn small secondary" onclick="segnaMangiato113(\''+best.r.id+'\')">✓ Segna mangiato</button></div></div>';
    }).join('');
    const fam=pool.map(r=>{
      const ss=st.membri.map(m=>scoreGiorno(r,m));
      return {r,s:Math.round(Math.min(...ss)*.65+(ss.reduce((a,b)=>a+b,0)/ss.length)*.35)};
    }).sort((a,b)=>b.s-a.s)[0];
    const family=fam?'<div class="card"><div class="row between"><div><h3>🍽️ Piatto famiglia</h3><div class="meta">Equilibrio fra preferiti, salute, dispensa e varietà recente</div></div><span class="pill">'+fam.s+'/100</span></div><div class="recipe-title" style="margin-top:10px">'+H(fam.r.nome)+'</div><div class="shop-actions"><button class="btn small" onclick="openRecipe(\''+fam.r.id+'\')">Apri</button><button class="btn small secondary" onclick="segnaMangiato113(\''+fam.r.id+'\')">✓ Segna mangiato</button></div></div>':'';
    box.innerHTML=family+cards;
  };

  const oldOpenRecipe=window.openRecipe;
  window.openRecipe=function(idr){
    const r=RICETTE.find(x=>x.id===idr);if(!r)return oldOpenRecipe?.(idr);
    const fav=st.membri.map(m=>'<button class="btn small '+((m.preferiti||[]).includes(r.id)?'soft':'secondary')+'" onclick="toggleFav(\''+m.id+'\',\''+r.id+'\');openRecipe(\''+r.id+'\')">'+((m.preferiti||[]).includes(r.id)?'★':'☆')+' '+H(m.nome)+'</button>').join(' ');
    const ing=(r.ingredienti_strutturati||r.ingredienti.map(i=>{const s=stimaQuantitaIngrediente(i);return {nome:i,quantita:s.q,unita:s.u}}));
    openModal(r.nome,
      '<div class="row"><div class="icon">'+iconCat(r.categoria)+'</div><div><h3>'+H(r.variante)+'</h3><div class="meta">'+r.minuti+' minuti · '+H(r.difficolta)+'</div></div></div>'+
      '<h3 style="margin-top:16px">Ingredienti</h3>'+
      ing.map(i=>{const ok=inDispensa(i.nome);return '<div class="family row between"><span>• '+H(i.nome)+' <span class="tiny">('+H(formatoQuantita(i.quantita,i.unita))+')</span></span><span>'+(ok?'<span class="v113-stock">DISPENSA</span>':'<button class="btn small secondary" onclick="aggiungiIngredienteSingolo(\''+r.id+'\',\''+encodeURIComponent(i.nome)+'\')">+ Spesa</button>')+'</span></div>'}).join('')+
      '<div class="shop-actions"><button class="btn" onclick="aggiungiMancanti113(\''+r.id+'\')">🛒 Aggiungi mancanti alla spesa</button><button class="btn secondary" onclick="segnaMangiato113(\''+r.id+'\')">✓ Segna mangiato</button></div>'+
      '<h3 style="margin-top:16px">Preferiti</h3><div class="badges" style="gap:8px">'+fav+'</div>'+
      '<h3 style="margin-top:16px">Procedimento</h3><div class="note">'+(Array.isArray(r.procedimento_originale)?r.procedimento_originale.map((x,n)=>(n+1)+'. '+H(x)).join('<br>'):H(r.procedimento||''))+'</div>'+
      '<h3 style="margin-top:16px">Fonte</h3><div class="meta">'+H(r.fonte||'Archivio Dalla Simo')+'<br>'+H(r.licenza||'')+'</div>'
    );
  };
  window.aggiungiMancanti113=function(id){
    const r=RICETTE.find(x=>x.id===id);if(!r)return;
    let c=0;(r.ingredienti||[]).forEach(i=>{if(!inDispensa(i)){const s=stimaQuantitaIngrediente(i);aggiungiProdotto(i,'Ricetta: '+r.nome,s.q,s.u);c++;}});
    save();renderSpesa();toast(c?c+' ingredienti mancanti aggiunti alla spesa':'Hai già gli ingredienti principali in dispensa');
  };

  function montaRicetteUI(){
    const sec=document.getElementById('ricette');if(!sec)return;
    const sub=sec.querySelector('.sub');if(sub)sub.textContent='Archivio locale · '+RICETTE.length+' ricette/versioni';
    const q=document.getElementById('q');
    if(q && !document.getElementById('v113RicetteTools')){
      const d=document.createElement('div');d.id='v113RicetteTools';
      d.innerHTML='<div class="v113-tools"><button class="btn" onclick="ricettaDispensa113()">🥫 Ricetta dalla dispensa</button><button class="btn secondary" onclick="trovaIngredienti113()">🔎 Trova per ingredienti</button></div>'+
      '<div class="v113-filter"><select id="v113Tempo" class="search" onchange="cambiaTempo113(this.value)"><option value="tutte">Qualsiasi tempo</option><option value="flash">FLASH · 5–15 min</option><option value="veloci">VELOCI · 15–30 min</option><option value="oltre">Oltre 30 min</option></select><select id="v113Diff" class="search" onchange="cambiaDiff113(this.value)"><option value="tutte">Qualsiasi difficoltà</option><option>Principiante</option><option>Intermedia</option><option>Avanzata</option></select></div>';
      q.insertAdjacentElement('afterend',d);
    }
    const tabs=sec.querySelector('.tabs');
    if(tabs)tabs.innerHTML='<button class="tab '+(st.filtro==='tutte'?'on':'')+'" data-f="tutte" onclick="setFiltro(this)">Tutte</button><button class="tab '+(st.filtro==='famiglia'?'on':'')+'" data-f="famiglia" onclick="setFiltro(this)">Famiglia</button><button class="tab '+(st.filtro==='tradizionale'?'on':'')+'" data-f="tradizionale" onclick="setFiltro(this)">Tradizionali</button><button class="tab '+(st.filtro==='preferiti'?'on':'')+'" data-f="preferiti" onclick="setFiltro(this)">Preferiti</button>';
    const t=document.getElementById('v113Tempo'),df=document.getElementById('v113Diff');
    if(t)t.value=st.v113.tempoRicette;if(df)df.value=st.v113.difficolta;
  }
  window.cambiaTempo113=v=>{st.v113.tempoRicette=v;st.v113.limite=100;save();renderRicette()};
  window.cambiaDiff113=v=>{st.v113.difficolta=v;st.v113.limite=100;save();renderRicette()};
  const oldSetFiltro=window.setFiltro;
  window.setFiltro=function(el){
    document.querySelectorAll('#ricette .tab').forEach(x=>x.classList.remove('on'));el.classList.add('on');st.filtro=el.dataset.f||'tutte';st.v113.limite=100;save();renderRicette();
  };
  window.renderRicette=function(){
    montaRicetteUI();makeAZ();
    const q=N(document.getElementById('q')?.value||'');
    let arr=RICETTE.filter(r=>{
      const text=N([r.nome,r.variante,r.famiglia,...(r.ingredienti||[]),...(r.tags||[])].join(' '));
      if(q && !text.includes(q))return false;
      if(st.lettera && !r.nome.toUpperCase().startsWith(st.lettera))return false;
      if(st.filtro==='famiglia' && !(r.tags||[]).includes('famiglia'))return false;
      if(st.filtro==='tradizionale' && !(r.tags||[]).includes('tradizionale'))return false;
      if(st.filtro==='preferiti' && !favByAny(r.id))return false;
      const tm=st.v113.tempoRicette;
      if(tm==='flash' && !(r.minuti>=5&&r.minuti<=15))return false;
      if(tm==='veloci' && !(r.minuti>15&&r.minuti<=30))return false;
      if(tm==='oltre' && !(r.minuti>30))return false;
      if(st.v113.difficolta!=='tutte'){
        const d=N(r.difficolta);
        if(N(st.v113.difficolta)==='principiante' && !/principiante|facile|semplice/.test(d))return false;
        if(N(st.v113.difficolta)==='intermedia' && !/intermedia|medio/.test(d))return false;
        if(N(st.v113.difficolta)==='avanzata' && !/avanzata|difficile/.test(d))return false;
      }
      return true;
    });
    arr.sort((a,b)=>a.nome.localeCompare(b.nome,'it')||a.minuti-b.minuti);
    const count=document.getElementById('conteggio');if(count)count.textContent=arr.length+' risultati';
    const out=document.getElementById('risultati');if(!out)return;
    const lim=st.v113.limite;
    out.innerHTML=arr.length?arr.slice(0,lim).map(r=>'<div class="card"><div class="row between"><div class="row"><div class="icon">'+iconCat(r.categoria)+'</div><div><div class="recipe-title">'+H(r.nome)+'</div><div class="meta">'+H(r.variante)+' · '+r.minuti+' min · '+H(r.difficolta)+'</div></div></div><button class="btn small secondary" onclick="openRecipe(\''+r.id+'\')">Apri</button></div><div class="badges"><span class="badge">'+H(r.categoria)+'</span>'+(r.minuti>=5&&r.minuti<=15?'<span class="badge good">FLASH</span>':r.minuti<=30?'<span class="badge good">VELOCE</span>':'<span class="badge">Oltre 30 min</span>')+(pantryScore(r)>=5?'<span class="badge good">Dispensa compatibile</span>':'')+'</div></div>').join('')+(arr.length>lim?'<button class="btn full secondary" onclick="mostraAltre113()">Mostra altre '+Math.min(100,arr.length-lim)+'</button>':''):'<div class="card empty">Nessuna ricetta con questi filtri.</div>';
  };
  window.mostraAltre113=()=>{st.v113.limite+=100;save();renderRicette()};

  window.ricettaDispensa113=function(){
    const pantry=(st.dispensa||[]).map(x=>N(x.nome));
    if(!pantry.length){toast('Aggiungi prima qualche alimento alla dispensa');showScreenById('dispensa');return;}
    const a=poolMain().map(r=>{
      const ing=(r.ingredienti||[]).filter(i=>!['sale','pepe','olio','acqua'].includes(N(i)));
      const have=ing.filter(inDispensa),missing=ing.filter(i=>!inDispensa(i));
      const ratio=ing.length?have.length/ing.length:0;
      const recent=st.membri.map(m=>recentScore(r,m)).reduce((a,b)=>a+b,0);
      return {r,have,missing,s:Math.round(ratio*70+salute(r)+recent/4-(missing.length*2))};
    }).filter(x=>x.have.length).sort((a,b)=>b.s-a.s||a.missing.length-b.missing.length).slice(0,10);
    openModal('Ricette dalla dispensa',a.length?a.map((x,i)=>'<div class="card '+(i===0?'hero':'')+'"><div class="row between"><div><div class="recipe-title">'+(i===0?'⭐ ':'')+H(x.r.nome)+'</div><div class="meta">Hai '+x.have.length+' ingredienti · mancano '+x.missing.length+' · '+x.r.minuti+' min</div></div><button class="btn small" onclick="openRecipe(\''+x.r.id+'\')">Apri</button></div>'+(x.missing.length?'<div class="meta">Mancano: '+H(x.missing.slice(0,5).join(', '))+'</div>':'<div class="v113-status">HAI TUTTO IL NECESSARIO PRINCIPALE</div>')+'</div>').join(''):'<div class="note">Nessuna ricetta abbastanza compatibile con la dispensa attuale.</div>');
  };

  window.trovaIngredienti113=function(){
    openModal('Trova ricette per ingredienti','<div class="note">Scrivi gli ingredienti che hai o che vorresti mangiare, separati da virgole. Puoi anche limitare il tempo.</div><input id="v113Ing" class="search" style="margin-top:12px" placeholder="Es. pollo, zucchine, riso"><div class="v113-filter"><select id="v113IngTempo" class="search"><option value="0">Qualsiasi tempo</option><option value="15">Fino a 15 minuti</option><option value="30">Fino a 30 minuti</option><option value="45">Fino a 45 minuti</option><option value="60">Fino a 60 minuti</option></select><select id="v113IngDiff" class="search"><option value="">Qualsiasi difficoltà</option><option>Principiante</option><option>Intermedia</option><option>Avanzata</option></select></div><button class="btn full" onclick="eseguiIngredienti113()">Trova ricette</button><div id="v113IngOut"></div>');
  };
  window.eseguiIngredienti113=function(){
    const qs=(document.getElementById('v113Ing')?.value||'').split(',').map(N).filter(Boolean);
    const max=Number(document.getElementById('v113IngTempo')?.value||0);
    const dif=N(document.getElementById('v113IngDiff')?.value||'');
    const out=document.getElementById('v113IngOut');if(!out)return;
    if(!qs.length){out.innerHTML='<div class="note" style="margin-top:12px">Inserisci almeno un ingrediente.</div>';return;}
    const arr=RICETTE.map(r=>{
      const ing=(r.ingredienti||[]).map(N);
      const hit=qs.filter(q=>ing.some(i=>i.includes(q)||q.includes(i)));
      const miss=ing.filter(i=>!['sale','pepe','olio','acqua'].includes(i)&&!qs.some(q=>i.includes(q)||q.includes(i)));
      return {r,hit,miss,s:hit.length*20-miss.length*2};
    }).filter(x=>x.hit.length && (!max||x.r.minuti<=max) && (!dif||N(x.r.difficolta).includes(dif.slice(0,6)))).sort((a,b)=>b.s-a.s||a.miss.length-b.miss.length||a.r.minuti-b.r.minuti).slice(0,15);
    out.innerHTML='<h3 style="margin-top:16px">Risultati</h3>'+(arr.length?arr.map(x=>'<div class="family row between"><div><div class="recipe-title">'+H(x.r.nome)+'</div><div class="meta">'+x.r.minuti+' min · corrispondono '+x.hit.length+' ingredienti'+(x.miss.length?' · altri principali: '+H(x.miss.slice(0,4).join(', ')):'')+'</div></div><button class="btn small" onclick="openRecipe(\''+x.r.id+'\')">Apri</button></div>').join(''):'<div class="note">Nessuna corrispondenza.</div>');
  };

  function ingredientiDaTesto(t){
    const m=[
      ['pollo','pollo'],['zucchine','zucchine'],['spinaci','spinaci'],['olio evo','olio'],['merluzzo','merluzzo'],['finocchi','finocchi'],['pane','pane'],['bresaola','bresaola'],['valeriana','valeriana'],['pomodorini','pomodorini'],['grana','grana'],['ceci','ceci'],['gallette','gallette'],['gnocchi','gnocchi'],['mozzarella','mozzarella'],['pomodoro','pomodoro'],['tonno','tonno'],['sottaceti','sottaceti'],['barbabietola','barbabietola'],['sogliola','sogliola'],['cetrioli','cetrioli'],['uova','uova'],['orata','orata'],['branzino','branzino'],['verdure','verdure'],['manzo','manzo'],['carote','carote'],['farro','farro'],['orzo','orzo'],['piselli','piselli'],['fagiolini','fagiolini'],['latte','latte'],['caffe','caffè'],['yogurt','yogurt'],['kefir','kefir'],['cioccolato','cioccolato fondente'],['frutta secca','frutta secca'],['frutta','frutta']
    ];
    const z=N(t),out=[];m.forEach(([k,v])=>{if(z.includes(N(k))&&!out.includes(v))out.push(v)});return out;
  }
  window.aggiungiPastoDietaSpesa113=function(g,p){
    const id=st.v113.membroDieta,txt=st.pianiPersona[id]?.settimana?.[g]?.[p]||'';
    const ing=ingredientiDaTesto(txt);let c=0;
    ing.forEach(i=>{if(!inDispensa(i)){aggiungiProdotto(i,'Dieta '+(st.membri.find(m=>m.id===id)?.nome||'' )+': '+g+' '+p,1,'q.b.');c++;}});
    save();renderSpesa();toast(c?c+' ingredienti aggiunti alla spesa':'Gli ingredienti riconosciuti risultano già in dispensa');
  };
  window.segnaPastoDieta113=function(g,p){
    const id=st.v113.membroDieta,txt=st.pianiPersona[id]?.settimana?.[g]?.[p];if(!txt)return;
    st.registro.push({id:'l'+Date.now(),data:oggiISO(),pasto:p,consumato:txt,member_id:id,feedback:'positivo',categorie:[]});
    save();renderRegistro();renderConsigli();toast('Pasto registrato');
  };
  window.modificaPastoDieta113=function(g,p){
    const id=st.v113.membroDieta,cur=st.pianiPersona[id]?.settimana?.[g]?.[p]||'';
    openModal('Modifica '+p.toLowerCase(),'<label>'+H(g)+' · '+H(p)+'</label><textarea id="v113MealText" class="search" style="min-height:100px;margin-top:8px">'+H(cur)+'</textarea><button class="btn full" style="margin-top:12px" onclick="salvaPastoDieta113(\''+g+'\',\''+p+'\')">Salva</button>');
  };
  window.salvaPastoDieta113=function(g,p){
    const id=st.v113.membroDieta;
    st.pianiPersona[id]=st.pianiPersona[id]||{tipo:'manuale',stato:'inserita',titolo:'Dieta creata nell’app',settimana:{}};
    st.pianiPersona[id].settimana[g]=st.pianiPersona[id].settimana[g]||{};
    st.pianiPersona[id].settimana[g][p]=document.getElementById('v113MealText')?.value.trim()||'';
    save();closeModal();renderSettimana();toast('Pasto aggiornato');
  };
  window.creaDieta113=function(){
    const id=st.v113.membroDieta,m=st.membri.find(x=>x.id===id);
    if(!m)return;
    const w={};GIORNI.forEach(g=>{w[g]={};PASTI5.forEach(p=>w[g][p]='')});
    st.pianiPersona[id]={tipo:'manuale',stato:'inserita',titolo:'Dieta creata nell’app',fonte:'Inserita manualmente',settimana:w};
    const p=(st.profiliAlimentari||[]).find(x=>x.member_id===id);if(p)p.stato='inserito';
    save();renderSettimana();renderMembri();renderProfiliAlimentari();toast('Dieta creata per '+m.nome);
  };
  window.cambiaModalita113=function(v){st.v113.modalitaMenu=v;save();renderSettimana()};
  window.cambiaMembroDieta113=function(v){st.v113.membroDieta=v;save();renderSettimana()};
  window.scegliGiorno113=function(g){st.giornoPlanner=g;save();renderSettimana()};

  window.renderSettimana=function(){
    const sec=document.getElementById('settimana');if(!sec)return;
    const h1=sec.querySelector('h1'),sub=sec.querySelector('.sub');
    if(h1)h1.textContent='Menu e dieta';if(sub)sub.textContent='Menu base oppure dieta completa per persona';
    let ctl=document.getElementById('v113DietCtl');
    if(!ctl){ctl=document.createElement('div');ctl.id='v113DietCtl';sec.insertBefore(ctl,document.getElementById('giorniPlanner'));}
    ctl.innerHTML='<div class="tabs"><button class="tab '+(st.v113.modalitaMenu==='base'?'on':'')+'" onclick="cambiaModalita113(\'base\')">Menu base · pranzo/cena</button><button class="tab '+(st.v113.modalitaMenu==='completa'?'on':'')+'" onclick="cambiaModalita113(\'completa\')">Dieta completa · 5 pasti</button></div>'+
      (st.v113.modalitaMenu==='completa'?'<select class="search" onchange="cambiaMembroDieta113(this.value)">'+st.membri.map(m=>'<option value="'+m.id+'" '+(st.v113.membroDieta===m.id?'selected':'')+'>'+H(m.nome)+'</option>').join('')+'</select>':'');
    const gb=document.getElementById('giorniPlanner');if(!gb)return;
    gb.innerHTML=GIORNI.map(g=>'<button class="week-day '+(g===st.giornoPlanner?'on':'')+'" onclick="scegliGiorno113(\''+g+'\')">'+g.slice(0,3).toUpperCase()+'</button>').join('');
    const out=document.getElementById('pianoGiorno');if(!out)return;
    if(st.v113.modalitaMenu==='base'){
      const p=st.settimana[st.giornoPlanner]||{};
      out.innerHTML='<div class="card"><div class="note" style="margin-bottom:10px">Menu base: solo pranzo e cena. Quando un pasto è realmente consumato premi <b>Fatto</b>: entrerà nel registro e non verrà riproposto subito.</div>'+['Pranzo','Cena'].map(t=>{
        const r=RICETTE.find(x=>x.id===p[t]);
        return '<div class="meal-row"><div class="tiny"><b>'+t+'</b></div><div><div class="recipe-title">'+(r?H(r.nome):'Non pianificato')+'</div><div class="meta">'+(r?r.minuti+' minuti':'Scegli un pasto')+'</div></div><div class="v113-meal-actions"><button class="btn small secondary" onclick="scegliPastoPlannerV19(\''+st.giornoPlanner+'\',\''+t+'\')">'+(r?'Cambia':'Scegli')+'</button>'+(r?'<button class="btn small soft" onclick="registraPlanner113(\''+r.id+'\',\''+t+'\')">✓ Fatto</button>':'')+'</div></div>';
      }).join('')+'</div>';
    }else{
      const id=st.v113.membroDieta,m=st.membri.find(x=>x.id===id),plan=st.pianiPersona[id];
      if(!plan){
        out.innerHTML='<div class="card hero"><div class="row between"><div><h3>'+H(m?.nome||'Profilo')+'</h3><div class="v113-status">DIETA NON INSERITA</div></div><button class="btn small" onclick="creaDieta113()">Crea dieta</button></div><p class="meta">Puoi creare un piano completo con colazione, spuntino, pranzo, merenda e cena e modificarlo pasto per pasto.</p></div>';
      }else{
        const day=plan.settimana?.[st.giornoPlanner]||{};
        out.innerHTML='<div class="card hero"><div class="row between"><div><h3>'+H(m?.nome||'')+'</h3><div class="v113-status">INSERITA · '+H(plan.titolo||'Dieta')+'</div></div><span class="pill">'+H(plan.tipo==='professionale'?'Piano professionale':'Piano manuale')+'</span></div></div>'+
          '<div class="card">'+PASTI5.map(p=>{
            const txt=day[p]||'Non impostato',ings=ingredientiDaTesto(txt),stock=ings.filter(inDispensa);
            return '<div class="meal-row"><div class="tiny"><b>'+p+'</b></div><div><div class="recipe-title">'+H(txt)+'</div>'+(stock.length?'<div class="meta"><span class="v113-stock">DISPENSA</span> '+H(stock.join(', '))+'</div>':'')+'</div><div class="v113-meal-actions"><button class="btn small secondary" onclick="modificaPastoDieta113(\''+st.giornoPlanner+'\',\''+p+'\')">Modifica</button><button class="btn small soft" onclick="aggiungiPastoDietaSpesa113(\''+st.giornoPlanner+'\',\''+p+'\')">+ Spesa</button><button class="btn small soft" onclick="segnaPastoDieta113(\''+st.giornoPlanner+'\',\''+p+'\')">✓ Fatto</button></div></div>';
          }).join('')+'</div>'+
          (id===sid?'<button class="btn full secondary" onclick="dettagliSimona113()">Vedi quantità, alternative e regole del piano di Simona</button>':'');
      }
    }
    const g2=sec.querySelector(':scope > .grid2');if(g2)g2.style.display=st.v113.modalitaMenu==='base'?'grid':'none';
  };
  window.registraPlanner113=function(id,p){const r=RICETTE.find(x=>x.id===id);if(r)registraRicetta(r,'tutti',p)};

  window.dettagliSimona113=function(){
    openModal('Piano alimentare Simona',
      '<div class="note">Piano professionale inserito dagli allegati. L’app lo organizza e lo rende operativo, senza modificarne le prescrizioni.</div>'+
      '<div class="v113-diet-detail"><h3>Colazione</h3><ul>'+SIMONA.colazione.map(x=>'<li>'+H(x)+'</li>').join('')+'</ul>'+
      '<h3>Spuntino</h3><ul>'+SIMONA.spuntino.map(x=>'<li>'+H(x)+'</li>').join('')+'</ul>'+
      '<h3>Pranzo</h3><div class="meta">'+H(SIMONA.pranzo.nota)+'</div><ul>'+SIMONA.pranzo.proteine.map(x=>'<li>'+H(x)+'</li>').join('')+'</ul>'+
      '<h3>Merenda</h3><ul>'+SIMONA.merenda.map(x=>'<li>'+H(x)+'</li>').join('')+'</ul>'+
      '<h3>Cena</h3><div class="meta">'+H(SIMONA.cena.nota)+'</div><h3 style="margin-top:10px">Carboidrati</h3><ul>'+SIMONA.cena.carboidrati.map(x=>'<li>'+H(x)+'</li>').join('')+'</ul><h3>Proteine</h3><ul>'+SIMONA.cena.proteine.map(x=>'<li>'+H(x)+'</li>').join('')+'</ul>'+
      '<h3>Frequenze settimanali</h3><ul>'+SIMONA.frequenze.map(x=>'<li>'+H(x)+'</li>').join('')+'</ul>'+
      '<h3>Quantitativi e regole</h3><ul>'+SIMONA.quotidiano.concat(SIMONA.note).map(x=>'<li>'+H(x)+'</li>').join('')+'</ul>'+
      '<h3>Cotture indicate</h3><ul>'+SIMONA.cotture.map(x=>'<li>'+H(x)+'</li>').join('')+'</ul></div>'
    );
  };

  const oldRenderProf=window.renderProfiliAlimentari;
  window.renderProfiliAlimentari=function(){
    const box=document.getElementById('profiliAlimentariUI');if(!box)return;
    box.innerHTML=st.membri.map(m=>{
      const p=st.pianiPersona[m.id],stato=p?'INSERITA':(m.tipo==='adulto'?'DA INSERIRE':'GUIDA GENERALE PER ETÀ');
      return '<div class="family row between"><div><div class="recipe-title">'+H(m.nome)+'</div><div class="meta">'+(p?H(p.titolo):m.tipo==='adulto'?'Nessuna dieta personale caricata':'Indicazioni generali, varietà e preferenze')+'</div></div><span class="pill">'+stato+'</span></div>';
    }).join('');
  };
  const oldRenderMembri=window.renderMembri;
  window.renderMembri=function(){
    const box=document.getElementById('membri');if(!box)return oldRenderMembri?.();
    box.innerHTML=st.membri.map(m=>{
      const p=st.pianiPersona[m.id];
      return '<div class="card"><div class="member"><div class="avatar">'+H(m.nome[0])+'</div><div style="flex:1"><h3>'+H(m.nome)+'</h3><div class="meta">'+H(m.eta)+' · '+(m.tipo==='adulto'?'adulto':'minore')+'</div>'+(p?'<div class="v113-status">DIETA INSERITA</div>':'')+'</div><span class="pill">'+(m.preferiti||[]).length+' preferiti</span></div><p class="meta">'+(p?'Il piano personale è attivo nel menu “Dieta completa”.':m.tipo==='adulto'?'Dieta personale da inserire.':'Consigli basati su varietà, preferiti e gradimento osservato.')+'</p></div>';
    }).join('')+'<div class="card"><h3>Strumenti famiglia</h3><div class="quick-links"><button class="quick-link" onclick="showScreenById(\'preferiti\')">❤️<br>Preferiti</button><button class="quick-link" onclick="showScreenById(\'dispensa\')">🥫<br>Dispensa</button><button class="quick-link" onclick="showScreenById(\'registro\')">📝<br>Registro pasti</button></div></div>';
  };

  function aggiungiFonti(){
    const info=document.getElementById('info');if(!info||document.getElementById('v113Fonti'))return;
    const d=document.createElement('div');d.id='v113Fonti';d.className='card v113-source-list';
    const links=[
      ['GialloZafferano · facili e veloci','https://www.giallozafferano.it/ricette-cat/facili-e-veloci/'],
      ['La Cucina Italiana · ricette sotto 30 minuti','https://www.lacucinaitaliana.it/news/cucina/50-ricette-veloci-da-preparare-in-meno-di-30-minuti/'],
      ['Le Delizie di Mary Cake · ricette flash','https://blog.giallozafferano.it/ledeliziedimarycake/tag/ricette-flash/'],
      ['Il Gusto e la Salute · ricette flash','https://www.ilgustoelasalute.com/blog/categories/ricette-flash'],
      ['Cucchiaio d’Argento · 5 minuti','https://www.cucchiaio.it/fotogallery/ricette-in-5-minuti/'],
      ['Cucchiaio d’Argento · 10 minuti','https://www.cucchiaio.it/fotogallery/ricette-che-si-preparano-in-10-minuti/'],
      ['Fatto in casa da Benedetta · 10 minuti','https://www.fattoincasadabenedetta.it/ricettari/ricette-salvacena-pronte-in-10-minuti/'],
      ['Il Club delle Ricette · 10 minuti','https://www.ilclubdellericette.it/migliori-ricette/ricette-pronte-in-10-minuti'],
      ['Cucina di Chicca · meno di 10 minuti','https://blog.giallozafferano.it/cucinadichicca/20-ricette-pronte-in-meno-di-10-minuti/'],
      ['Fatto in casa da Benedetta · 5 minuti','https://www.fattoincasadabenedetta.it/ricettari/ricette-pronte-in-5-minuti/'],
      ['Cucchiaio d’Argento · articolo 5 minuti','https://www.cucchiaio.it/articolo/ricette-in-5-minuti/'],
      ['Negroni · ricette 5 minuti','https://www.negroni.com/it/ricette/menu/10-ricette-5-minuti-gli-attacchi-di-fame']
    ];
    d.innerHTML='<h3>Fonti editoriali per copertura e benchmark</h3><p class="meta">Usate per verificare varietà, tempi e categorie. Dalla Simo non copia automaticamente testi o fotografie proprietarie.</p>'+links.map(x=>'<div class="family"><a href="'+x[1]+'" target="_blank" rel="noopener">'+H(x[0])+'</a></div>').join('');
    info.appendChild(d);
  }

  // Registro: aggiunge Merenda e membro senza rompere le registrazioni precedenti.
  const oldApri=window.apriRegistraPasto;
  window.apriRegistraPasto=function(){
    openModal('Registra pasto','<label>Cosa avete mangiato?</label><input id="logNome" class="search" placeholder="Es. riso con pollo"><br><br><label>Tipo</label><select id="logTipo" class="search"><option>Colazione</option><option>Spuntino</option><option>Pranzo</option><option>Merenda</option><option>Cena</option></select><br><br><label>Per chi?</label><select id="logMem" class="search"><option value="tutti">Tutta la famiglia</option>'+st.membri.map(m=>'<option value="'+m.id+'">'+H(m.nome)+'</option>').join('')+'</select><br><br><label>Com’è andata?</label><div class="tabs"><button class="tab on" data-feed="positivo" onclick="scegliFeed(this)">👍 Bene</button><button class="tab" data-feed="neutro" onclick="scegliFeed(this)">😐 Così così</button><button class="tab" data-feed="negativo" onclick="scegliFeed(this)">👎 Male</button></div><button class="btn full" onclick="salvaRegistroPasto113()">Salva</button>');
  };
  window.salvaRegistroPasto113=function(){
    const nome=document.getElementById('logNome')?.value.trim();if(!nome)return toast('Inserisci il pasto');
    const feed=document.querySelector('[data-feed].on')?.dataset.feed||'neutro',mid=document.getElementById('logMem')?.value||'tutti';
    st.registro.push({id:'l'+Date.now(),data:oggiISO(),pasto:document.getElementById('logTipo')?.value||'Cena',consumato:nome,member_id:mid,feedback:feed,categorie:[]});
    save();closeModal();renderRegistro();renderConsigli();toast('Pasto registrato: i prossimi consigli terranno conto della varietà');
  };

  // Aggiorna intestazioni/versione senza cambiare logo o icona Home.
  document.title='App Alimentazione — Dalla Simo v1.13';
  const bs=document.querySelector('.brand-subtitle');if(bs)bs.textContent='Alimentazione familiare · v1.13';
  const noteOggi=document.querySelector('#oggi .card.note');if(noteOggi)noteOggi.innerHTML='Il <b>Piatto del giorno</b> usa preferiti, registro dei pasti, varietà recente, compatibilità con la dispensa e criteri alimentari generali. Per Simona tiene inoltre conto del piano professionale inserito.';
  aggiungiFonti();
  montaRicetteUI();
  renderMembri();renderProfiliAlimentari();renderSettimana();renderRicette();renderConsigli();
  save();
}
avvia113();
})();