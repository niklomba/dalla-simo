# Dalla Simo v1.26

PWA statica: il piano alimentare è già incluso senza cognomi, recapiti o fotografie personali. L'apertura mostra i cinque pasti del giorno; Dieta contiene i sette giorni e le alternative del documento.

- Piano principale: platessa, pesce spada e polpo sostituiscono merluzzo, orata e branzino, con le porzioni di 150 g. Il documento originale resta consultabile.
- Spesa: porzione, ripetizioni e totale, ad esempio **150 g (× 3)** e **Totale 450 g**. Ricalcolare lo stesso periodo non duplica i pasti.
- Verdure e altri alimenti q.b. mantengono la dicitura della fonte. I grammi si possono inserire; anche una porzione in pezzi può essere pesata per spesa e conteggio calorico.
- Navigazione: Oggi, Dieta, Spesa, Dispensa, Ricette, Famiglia. Le opzioni secondarie sono richiudibili.
- Ricette: suggerimento giornaliero, ricerca per ingredienti e tempo, gusti per persona e dispensa. Famiglia conserva ingredienti e piatti preferiti, non graditi e note.
- Diario: valori per 100 g / 100 ml oppure per la quantità consumata, totali per persona e data, lettura EAN/QR con codice prodotto e inserimento manuale.
- Calorie del menù: completare i valori nutrizionali degli alimenti da etichetta e i pesi non indicati. La somma segue le alternative selezionate; fino al completamento resta parziale e non viene usata come obiettivo. I valori sono stime del menù, non una nuova prescrizione.

## Avvio locale

Servire questa cartella, ad esempio con `python -m http.server 8000 --bind 127.0.0.1`, e aprire `http://127.0.0.1:8000/`. Per installazione e fotocamera da telefono usare HTTPS. Il piano incluso è consultabile offline dopo il primo caricamento.

## Dati e aggiornamento

L'aggiornamento mantiene le chiavi locali precedenti e migra le copie del piano incluso v1.25; le diete importate e modificate restano personali. Preferenze, grammi, spesa, dispensa, valori nutrizionali e diario sono salvati sul dispositivo e inclusi nell'esportazione dello stato. Le fotografie eventualmente importate rimangono nell'archivio locale separato.

Non distribuire la cartella `privato` del vecchio handoff. Il piano anonimo aggiornato è disponibile in `dati/piano_alimentare_anonimo_v126.json` e `.txt`. Il loader e la cache offline usano la stessa versione; il workflow verifica i sorgenti senza rigenerare il vecchio loader.

## Verifica

Eseguire `node tests/diet-portions.cjs`, `node tests/included-diet.cjs`, `node tests/v126-diet.cjs`, `node tests/v126-diet-startup.cjs` e `node tests/nutrition-v126.cjs`.

Verificati i flussi browser mobile e desktop, migrazione, spesa idempotente, backup dello stato, riapertura offline, QR con risposta controllata e calcolo nutrizionale. La fotocamera fisica e la disponibilità dei servizi esterni richiedono verifica sul dispositivo.
