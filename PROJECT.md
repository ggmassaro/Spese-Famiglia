# Progetto: App Tracciamento Spese Familiari

## Panoramica
Web-app per tracciare le spese quotidiane familiari, usata da due persone (marito e moglie) su telefoni separati, con dati condivisi e sincronizzati in tempo reale.

## Stack tecnologico
- Frontend: HTML/CSS/JS vanilla + Bootstrap
- Database: Supabase (Postgres, piano gratuito, sincronizzazione in tempo reale tramite Supabase Realtime)
- Hosting: GitHub Pages (gratuito)
- Autenticazione: Supabase Auth, email/password (da definire nel dettaglio in fase tecnica)

Nota: inizialmente scelto Firebase Firestore, poi sostituito con Supabase perché
Firebase richiede il collegamento di una carta di credito anche solo per creare
il database Firestore (pur restando nelle soglie gratuite). Supabase non richiede
alcun metodo di pagamento sul piano gratuito. Compromesso accettato: i progetti
gratuiti Supabase vanno in pausa dopo 7 giorni di inattività e vanno "risvegliati"
manualmente dal pannello di controllo.

## Vincoli di progetto
- Deve essere completamente gratuito (nessun servizio a pagamento)
- Niente riconoscimento automatico scontrini (inserimento sempre manuale)
- Nessuna notifica push (limite della web-app rispetto a un'app nativa)
- Sviluppato tramite Claude Code, con requisiti definiti in chat su Claude.ai

## Modello dati

### Spesa (collezione principale)
| Campo | Tipo | Obbligatorio |
|---|---|---|
| Data | Data | Sì |
| Importo | Numero (€) | Sì |
| Voce spesa | Stringa (da lista dropdown estendibile) | Sì |
| Gruppo spesa | Stringa (da lista dropdown estendibile) | Sì |
| Metodo pagamento | Contanti / Carta | Sì |
| Chi ha inserito | Automatico (da autenticazione utente) | Automatico |
| Nota | Testo libero | No |

Funzionalità richieste: modifica e cancellazione di una spesa già inserita.

### Voce spesa — lista iniziale (estendibile dall'utente)
Alimentari, Pulizia Casa/Vestiti, Bollette, Igiene personale, Farmaci, Trasporti/Carburante, Abbigliamento Bimbe, Abbigliamento Adulti, Colazione, Pranzo, Cena, Scuola, Cani, Veterinario, Babysitter, Attrazioni, Palestra, Piscina, Abbonamenti, Assicurazioni, Investimenti

### Gruppo spesa — lista iniziale (estendibile dall'utente)
Supermercato, Negozio, Bar, Ristorante, Online, Farmacia, Benzinaio, Gite Familiari, Professionisti, Sport

### Budget (collezione separata)
| Campo | Tipo | Note |
|---|---|---|
| Nome | Testo libero | Es. "Spesa per vivere", "Piscina" |
| Voci spesa incluse | Array di Voce spesa | Selezione libera, una o più |
| Gruppi spesa inclusi | Array di Gruppo spesa | Selezione libera, uno o più |
| Importo mensile | Numero (€) | |
| Mese/Anno di riferimento | Data | |

- Budget mensile, unico e condiviso per la famiglia (non per persona)
- A inizio mese, proporre in automatico l'importo/composizione del mese precedente (modificabile dall'utente prima di confermare)
- Un budget può combinare Voci e/o Gruppi spesa a piacere; più budget indipendenti possono coesistere

## Dashboard richiesta
- Totale speso per mese, filtrabile per mese, con ripartizione per Voce spesa e per Gruppo spesa
- Confronto Actual vs Budget per ogni budget creato: importo speso, budget impostato, spazio residuo, segnalazione visiva quando il budget è raggiunto/superato
- Grafico di trend nel tempo (andamento mese su mese)
- Esportazione dati in Excel/CSV

## Log decisioni chiave
- [Data odierna] Definiti requisiti completi tramite briefing in chat su Claude.ai
- Scelto inizialmente Firebase Firestore, poi sostituito con Supabase perché Firebase 
  richiede una carta di credito collegata per creare il database (anche restando 
  nelle soglie gratuite), mentre Supabase no
- Rimossa la funzione di riconoscimento foto scontrino per mantenere il progetto gratuito al 100%
- Risolta sovrapposizione tra Voce spesa e Gruppo spesa (Bar/Ristorante spostati a Gruppo spesa; sostituiti in Voce spesa con Colazione/Pranzo/Cena)
- Budget semplificato a solo periodo mensile (niente settimanale, per ora)

## Stato di avanzamento
- [x] Creazione account GitHub
- [ ] Creazione account/progetto Supabase
- [x] Setup struttura progetto in Claude Code
- [ ] Connessione a Supabase verificata
- [ ] Form inserimento spesa funzionante
- [ ] Dashboard con grafici funzionante
- [ ] Funzionalità Budget funzionante
- [ ] Deploy su GitHub Pages
