# Diete originali — gestione privata

Il repository Dalla Simo è pubblico. Per evitare di pubblicare su Internet le immagini originali dei piani alimentari personali, le fotografie non vengono versionate nel repository.

La v1.21 aggiunge la sezione **Dieta originale**: le immagini vengono importate dall'utente e salvate senza modifica in IndexedDB sul dispositivo. Il file `manifest.json` conserva soltanto conteggio e SHA-256 degli originali forniti, così l'app può verificare che le immagini importate siano esattamente quelle originali.

Gli attuali piani digitali, le modifiche e le cinque settimane intercambiabili della v1.20 restano separati e invariati.

La v1.25 include la trascrizione testuale del piano originale, senza nominativi e recapiti. La scheda Dieta si apre con il piano già compilato anche al primo avvio: non sono richiesti fotografie, file JSON o collegamenti di attivazione. Il piano principale e le due varianti con sostituzione del pesce hanno ingredienti e porzioni strutturati per la spesa.

Le fotografie restano facoltative. I dati del profilo, le scelte nei pasti e la spesa vengono salvati solo sul dispositivo. Un breve frammento personale può precompilare i dati del profilo senza inviarli al server; il piano testuale funziona anche senza quel frammento.
