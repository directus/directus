# Gumpen System Design
**Multi-Site Bilforhandler ERP-system**

**Dato:** 2025-10-19
**Status:** DESIGN FASE - Må godkjennes før implementering

---

## 📍 Forhandlerstruktur

### Moderselskap
**Gumpens Auto AS (VW) - Forhandler 490**
- **Lokasjon:** Vest side, Kristiansand
- **Type:** Fullskala VW forhandler (ny/brukt personbil, nyttekjøretøy, verksted)
- **Administrasjon:** Hovedkontor her
- **Klargjøring:** Inhouse (gjør selv)
- **Inkluderer:** "Gumpen Økonomi Service" (inget eget fnr, billig verksted for eldre biler)

### Sørlandsparken (Øst side Kristiansand)

**Gumpens Auto Øst - Forhandler 495**
- **Type:** Fullskala Audi + Outlet bruktavdeling
- **Klargjøring:** Bruker 499 (Gumpen Skade og Bilpleie)

**G-bil - Forhandler 324**
- **Type:** Fullskala Skoda forhandler
- **Klargjøring:** Bruker 499

**Gumpen Motor - Forhandler 325/326**
- **Merker:** Nissan, MG, Seres, Subaru
- **Klargjøring:** Bruker 499

**Gumpen Skade og Bilpleie - Forhandler 499**
- **Type:** Norges nyeste og største skadespesialist
- **Funksjon:** Klargjøringssenter for ALLE Sørlandsparken-forhandlere (495, 324, 325/326)
- **Fasiliteter:**
  - Skadesenter med nyeste teknologi
  - Grønt bygg, smart energi
  - Mange avdelinger inkl. bilpleie/klargjøring

### Andre Lokasjoner
- **Gumpens Auto Grenland** - Østlandet
- **Gumpens Auto Lyngdal** - Vestover
- **Gumpens Auto Notodden**

---

## 👥 Brukerroller og Tilganger

### Administrative Roller

#### 1. Daglig Leder (Forhandler Admin)
**Tilganger:**
- ✅ Legge til/fjerne brukere på sin forhandler
- ✅ Administrere egne datafelt (tillegg/fjerning av tilbehør)
- ✅ Full rapportering: Dashboard med tall per selger
- ✅ Scoreboard med AI assistanse for filtrering
- ✅ Eksport av rapporter
- ✅ Se alle objekter under sin forhandler
- ❌ Kan IKKE se andre forhandleres data (med mindre gitt spesialtilgang)

#### 2. Salgsjef
**Tilganger:**
- ✅ Samme som Daglig Leder
- ❌ Kan IKKE slette brukere

#### 3. Kundemottaker / Booking
**Tilganger:**
- ✅ Se ordre klar for planlegging
- ✅ Planlegge teknisk + kosmetisk klargjøring
- ✅ Velge mekaniker (eller la det stå tomt)
- ✅ Se tidsbank og tilgjengelige timer
- ✅ Kun endre booking-relaterte felt
- ⚠️ Får varsling når mottakskontroll er godkjent

#### 4. Garantimedarbeider
**Tilganger:** (må defineres)

---

### Salgsroller

#### 5. Nybilselger
**Tilganger:**
- ✅ Registrere ny nybilordre (manuell eller PDF-parsing)
- ✅ Kun se nybiler for sin forhandler
- ✅ Kun endre felt i sin delprosess (salgsrelaterte felt)
- ❌ Kan IKKE endre delelager-felt eller booking-felt
- ⚠️ Får varsling når tilbehørsfelter endres (av andre)
- ⚠️ Får varsling når bil er mottakskontrollert

**Datafelt nybilselger kan endre:**
- Kunde info
- Salgspris
- Tilbehør (men delelager får varsling ved endring)
- Leveringsdato
- Kommentarer

#### 6. Bruktbilselger
**Tilganger:**
- ✅ Registrere bruktbil (manuell eller hent fra Statens Vegvesen)
- ✅ Kun se bruktbiler for sin forhandler som standard
- ✅ **Kan søke på tvers av forhandlere** for synergier ved salg
- ✅ Kun endre felt i sin delprosess
- ❌ Kan IKKE endre delelager-felt eller booking-felt
- ⚠️ Får varsling når tilbehørsfelter endres

**Datafelt bruktbilselger kan endre:**
- Kunde info
- Innbyttepris
- Salgspris
- Tilbehør
- Leveringsdato
- Kommentarer

---

### Produktive Roller (Med Tidsbank)

#### 7. Mottakskontrollør
**Tilganger:**
- ✅ Se alle ordre som er "ankommet klargjøringsforhandler"
- ✅ Utføre mottakskontroll (godkjent/ikke godkjent)
- ✅ Laste opp bilder av skader/mangler
- ✅ Legge til kommentarer
- ✅ **Scanne nøkkeltag** for auto-registrering av bil
- ⚠️ Varsling til selger ved ferdig mottakskontroll

**Tidsbank:**
- Estimat: 0.5t per mottakskontroll?

#### 8. Delelager / Delemedarbeider
**Tilganger:**
- ✅ Se nye ordre som krever deler
- ✅ Lage ordrebekreftelse på tilbehørsdeler
- ✅ Laste opp vedlegg (PDF, DOC, TXT, bilder) - drag/drop
- ✅ Bekrefte når deler er ankommet (dato)
- ✅ Kun endre delelager-relaterte felt
- ⚠️ Får varsling når tilbehør endres av selger

**Datafelt delelager kan endre:**
- Deler bestilt (ja/nei, dato)
- Deler ankommet (ja/nei, dato)
- Kommentarer på deler
- Vedlegg

#### 9. Mekaniker (Teknisk klargjøring)
**Tilganger:**
- ✅ Se egen kalender (dag/uke) med verkstedordre
- ✅ Kun se ordre tildelt til seg selv
- ✅ Markere teknisk klargjøring som ferdig
- ✅ Laste opp bilder
- ✅ Legge til kommentarer

**Tidsbank:**
- **Nybil:** 2.5 timer per bil
- **Bruktbil:** 1.5 timer per bil (kan variere)

#### 10. Bilpleiespesialist / Bilklargjører (Kosmetisk)
**Tilganger:**
- ✅ Se egen kalender (dag/uke) med klargjøringsordre
- ✅ Kun se ordre tildelt til seg selv
- ✅ Markere kosmetisk klargjøring som ferdig
- ✅ Laste opp bilder
- ✅ Legge til kommentarer

**Tidsbank:**
- **Nybil:** 2.5 timer per bil
- **Bruktbil:** 1.5 timer per bil (kan variere)

---

## 🔄 Nybilflyt (Detaljert)

### Steg 1: Ordre registrering
**Ansvarlig:** Nybilselger (feks hos 495 Audi)

**Handlinger:**
1. Selger bestiller bil i eksternt system (VW/Audi-system)
2. Overfører til GAPP:
   - **Alternativ A:** Last opp ordrebekreftelse (PDF) → Auto-parsing til felter
   - **Alternativ B:** Manuell registrering
3. **Påkrevde felt:**
   - VIN
   - Ordrenummer
   - Kundenavn
   - Selgers navn (auto-fylles)
   - Forhandler (auto-fylles fra bruker)
   - Merke/Modell/Årsmodell
   - Leveringsdato estimat
   - Tilbehør (liste)

**Status etter dette:** `ny_ordre`

**Synlighet:**
- ✅ Synlig for klargjøringsforhandler (499) umiddelbart
- ✅ Synlig i tabellvisning med VIN + ordrenr

**Varsling:**
- ➡️ Delelager (samme forhandler som selger) får varsling

---

### Steg 2: Delelager (Selgerforhandler)
**Ansvarlig:** Delelager hos 495 Audi

**Handlinger:**
1. Får varsling: "Ny ordre fra [Selger] - Audi A4 2025 - VIN: xxx"
2. Gjør klar ordrebekreftelse på tilbehørsdeler
3. Laster opp vedlegg:
   - PDF ordrebekreftelse
   - Bilder
   - Drag/drop eller filvelger
4. Legger til kommentarer
5. Markerer "Deler bestilt" med dato

**Status etter dette:** `deler_bestilt_selgerforhandler`

**Varsling:**
- ➡️ Delelager hos klargjøringsforhandler (499) får varsling

---

### Steg 3: Delelager (Klargjøringsforhandler)
**Ansvarlig:** Delelager hos 499 Gumpen Skade og Bilpleie

**Handlinger:**
1. Får varsling: "Ordre klar for klargjøring - Audi A4 2025 fra 495"
2. Bekrefter når deler er ankommet (dato)

**Status etter dette:** `deler_ankommet_klargjoring`

---

### Steg 4: Bil ankommer fysisk
**Ansvarlig:** Mottakskontrollør hos 499

**Handlinger:**
1. Bil ankommer tomten
2. **Smart funksjon:** Scanne nøkkeltag (ta bilde/OCR)
   - Hvis bil finnes i systemet → knytt automatisk
   - Hvis bil IKKE finnes → opprett "forhandlerløs" midlertidig ordre
3. Utfører mottakskontroll:
   - ✅ Godkjent uten anmerkninger
   - ⚠️ Godkjent med anmerkninger (bilder + kommentarer)
   - ❌ Ikke godkjent (blokkert, må rettes)

**Status etter dette:**
- `mottakskontroll_godkjent` (hvis OK)
- `mottakskontroll_avvik` (hvis problemer)

**Varsling:**
- ➡️ Selger får varsling:
  - "Bil ankommet forhandler 499 og er nå mottatt uten anmerkninger"
  - "Bil ankommet forhandler 499 med følgende anmerkninger: [liste]"

---

### Steg 5: Planlegging
**Ansvarlig:** Booking hos 499

**Handlinger:**
1. Får varsling når mottakskontroll er godkjent
2. Ser ordre i "Klar for planlegging"-liste
3. Planlegger:
   - **Dato teknisk klargjøring**
   - **Dato kosmetisk klargjøring**
   - **Velg mekaniker** (eller la stå tomt → tilordnes senere)
4. Systemet sjekker **tidsbank:**
   - Nybil = 2.5t teknisk + 2.5t kosmetisk = 5t totalt
   - Hvis ikke nok timer tilgjengelig → varsling: "Tidsbank full for valgt dato"

**Status etter dette:**
- `planlagt_teknisk` (når teknisk time er booket)
- `planlagt_kosmetisk` (når kosmetisk time er booket)

---

### Steg 6: Teknisk klargjøring
**Ansvarlig:** Mekaniker hos 499

**Handlinger:**
1. Ser egen kalendervisning (dag/uke)
2. Starter på bil
3. Utfører teknisk klargjøring
4. Laster opp bilder (før/etter)
5. Legger til kommentarer
6. Markerer "Teknisk ferdig"

**Status etter dette:** `teknisk_ferdig`

---

### Steg 7: Kosmetisk klargjøring
**Ansvarlig:** Bilpleiespesialist hos 499

**Handlinger:**
1. Ser egen kalendervisning (dag/uke)
2. Starter på bil
3. Utfører kosmetisk klargjøring (vask, polering, etc)
4. Laster opp bilder (før/etter)
5. Legger til kommentarer
6. Markerer "Kosmetisk ferdig"

**Status etter dette:** `kosmetisk_ferdig`

---

### Steg 8: Kvalitetskontroll (Valgfri?)
**Ansvarlig:** Kvalitetskontrollør? Eller automatisk?

**Forslag:** Hvis både teknisk og kosmetisk er ferdig → auto-flytt til "klar_for_levering"

**Status etter dette:** `klar_for_levering`

**Varsling:**
- ➡️ Selger (495) får varsling: "Audi A4 2025 er nå klar for levering"

---

### Steg 9: Levering
**Ansvarlig:** Klargjører/Mekaniker hos 499

**Handlinger:**
1. Markerer "Levert til forhandler" med dato
2. Eventuelt: Transport-dokumentasjon

**Status etter dette:** `levert_til_selgerforhandler`

---

### Steg 10: Arkivering
**Ansvarlig:** System (automatisk) eller Selger

**Handlinger:**
1. Når bilen er levert til kunde → status `solgt_og_levert`
2. Automatisk arkivering etter X dager
3. Arkiverte ordre blir **read-only**

**Status etter dette:** `arkivert`

---

## 📊 Foreslåtte Statuser (Nybil)

| Status | Norsk Visning | Hvem kan sette | Neste steg |
|--------|---------------|----------------|------------|
| `ny_ordre` | Ny ordre | Nybilselger | Delelager bestiller |
| `deler_bestilt_selgerforhandler` | Deler bestilt (selgerforhandler) | Delelager (selger) | Deler ankommer |
| `deler_ankommet_selgerforhandler` | Deler ankommet (selgerforhandler) | Delelager (selger) | Sendes til klargjøring |
| `deler_bestilt_klargjoring` | Deler bestilt (klargjøring) | Delelager (klargjøring) | Deler ankommer |
| `deler_ankommet_klargjoring` | Deler ankommet (klargjøring) | Delelager (klargjøring) | Bil ankommer |
| `på_vei_til_klargjoring` | På vei til klargjøring | System/Selger | Bil ankommer |
| `ankommet_klargjoring` | Ankommet klargjøring | System (nøkkeltag?) | Mottakskontroll |
| `mottakskontroll_pågår` | Mottakskontroll pågår | Mottakskontrollør | Godkjennes |
| `mottakskontroll_godkjent` | Mottakskontroll OK | Mottakskontrollør | Booking |
| `mottakskontroll_avvik` | Mottakskontroll avvik | Mottakskontrollør | Må rettes |
| `venter_booking` | Venter planlegging | Auto (når godkjent) | Booking planlegger |
| `planlagt_teknisk` | Planlagt teknisk | Booking | Mekaniker starter |
| `teknisk_pågår` | Teknisk pågår | Mekaniker | Teknisk ferdig |
| `teknisk_ferdig` | Teknisk ferdig | Mekaniker | Kosmetisk starter |
| `planlagt_kosmetisk` | Planlagt kosmetisk | Booking | Bilpleier starter |
| `kosmetisk_pågår` | Kosmetisk pågår | Bilpleiespesialist | Kosmetisk ferdig |
| `kosmetisk_ferdig` | Kosmetisk ferdig | Bilpleiespesialist | Klar for levering |
| `klar_for_levering` | Klar for levering | Auto | Leveres |
| `levert_til_selgerforhandler` | Levert til selgerforhandler | Klargjører | Selges til kunde |
| `solgt_til_kunde` | Solgt til kunde | Selger | Leveres til kunde |
| `levert_til_kunde` | Levert til kunde | Selger | Arkivering |
| `arkivert` | Arkivert | Auto/System | Terminal |

---

## 📊 Foreslåtte Statuser (Bruktbil)

Bruktbil kan ha kortere flyt siden de ofte ikke trenger like mye klargjøring:

| Status | Norsk Visning | Beskrivelse |
|--------|---------------|-------------|
| `innbytte_registrert` | Innbytte registrert | Bil tatt i innbytte |
| `vurdert_for_salg` | Vurdert for salg | Pris satt, klar for klargjøring |
| `til_klargjoring` | Sendt til klargjøring | Sendt til 499 eller inhouse |
| `mottakskontroll_godkjent` | Mottakskontroll OK | Samme som nybil |
| `planlagt_teknisk` | Planlagt teknisk | 1.5t estimert |
| `teknisk_ferdig` | Teknisk ferdig | - |
| `planlagt_kosmetisk` | Planlagt kosmetisk | 1.5t estimert |
| `kosmetisk_ferdig` | Kosmetisk ferdig | - |
| `klar_for_salg` | Klar for salg | På salgsavdelingen |
| `reservert` | Reservert | Kunde har reservert |
| `solgt_til_kunde` | Solgt til kunde | Kontrakt signert |
| `levert_til_kunde` | Levert til kunde | Kunde har hentet |
| `arkivert` | Arkivert | Terminal |

---

## 🔔 Varslingslogikk

### 1. Ny ordre lagt inn
- **Trigger:** Selger lagrer ny ordre
- **Mottaker:** Delelager (samme forhandler som selger)
- **Melding:** "Ny ordre fra [Selger]: [Merke Modell Årsmodell] - VIN: [xxx]"

### 2. Deler bestilt (selgerforhandler)
- **Trigger:** Delelager markerer "deler bestilt"
- **Mottaker:** Delelager (klargjøringsforhandler)
- **Melding:** "Ordre klar for klargjøring: [Merke Modell] fra [Forhandler]"

### 3. Tilbehør endret av selger
- **Trigger:** Selger endrer tilbehørsfelt
- **Mottaker:** Delelager (begge steder hvis deler allerede bestilt)
- **Melding:** "⚠️ Tilbehør endret på ordre [Ordrenr]: [Endringer]. Sjekk eksterne bestillinger!"

### 4. Bil mottakskontrollert
- **Trigger:** Mottakskontrollør godkjenner/avviser
- **Mottaker:** Selger
- **Melding:**
  - "✅ [Merke Modell] ankommet [Klargjøringsforhandler] uten anmerkninger"
  - "⚠️ [Merke Modell] ankommet med anmerkninger: [liste]"

### 5. Klar for planlegging
- **Trigger:** Mottakskontroll godkjent
- **Mottaker:** Booking
- **Melding:** "[Merke Modell] klar for planlegging"

### 6. Klargjøring ferdig
- **Trigger:** Både teknisk og kosmetisk ferdig
- **Mottaker:** Selger
- **Melding:** "✅ [Merke Modell] ferdig klargjort og klar for levering"

### 7. Tidsbank full
- **Trigger:** Booking prøver å planlegge når det ikke er timer igjen
- **Mottaker:** Booking
- **Melding:** "⚠️ Tidsbank full for [Dato]. Velg annen dato eller øk kapasitet"

---

## 🗄️ Schema-forslag

### 1. `dealerships` (forhandlere)

```
id (UUID, PK)
dealership_number (INTEGER, UNIQUE) - 490, 495, 324, 325, 499, etc
dealership_name (STRING) - "Gumpens Auto AS", "Gumpens Auto Øst"
dealership_type (ENUM) - "fullskala", "klargjøringssenter", "verksted"
brand (ENUM) - "VW", "Audi", "Skoda", "Nissan", "MG", "Seres", "Subaru", "Multi"
location (STRING) - "Kristiansand Vest", "Sørlandsparken"
parent_dealership_id (UUID, FK) - Hvis filialer (nullable)
prep_center_id (UUID, FK) - Peker til klargjøringsforhandler (499 for Sørlandsparken)
does_own_prep (BOOLEAN) - True for 490 (gjør selv), False for 495/324/325
colors (JSON) - Brand colors for UI theming
logo (FILE) - Logo
active (BOOLEAN)
created_at, updated_at
```

### 2. `users` (brukere/ansatte)

```
id (UUID, PK) - Directus standard
email, password, etc - Directus standard
first_name, last_name
dealership_id (UUID, FK, REQUIRED) - Tilhører forhandler
role (ENUM) - Se roller over
is_productive (BOOLEAN) - True hvis mekaniker/bilpleier (har tidsbank)
hours_per_day (DECIMAL) - Hvis produktiv: 8.0, 7.5, etc
phone, avatar
created_at, updated_at
```

### 3. `cars` (biler/ordre)

```
id (UUID, PK)
order_number (STRING, UNIQUE) - Ordrenummer fra ekstern system
car_type (ENUM) - "nybil", "bruktbil"
vin (STRING(17), UNIQUE for nybil)
regnr (STRING, UNIQUE for bruktbil) - Norsk format
make, model, year

# Kunde
customer_name (STRING)
customer_phone
customer_email

# Tilknytninger
dealership_id (UUID, FK, REQUIRED) - Selgerforhandler
prep_center_id (UUID, FK, NULLABLE) - Klargjøringsforhandler (hvis annen)
seller_id (UUID, FK) - Selger som registrerte
assigned_mechanic_id (UUID, FK, NULLABLE)
assigned_detailer_id (UUID, FK, NULLABLE)

# Status og datoer
status (ENUM) - Se statusliste over
registered_at (DATETIME)
parts_ordered_seller_at (DATETIME)
parts_arrived_seller_at (DATETIME)
parts_ordered_prep_at (DATETIME)
parts_arrived_prep_at (DATETIME)
arrived_prep_center_at (DATETIME)
inspection_completed_at (DATETIME)
inspection_approved (BOOLEAN)
inspection_notes (TEXT)
scheduled_technical_date (DATE)
scheduled_technical_time (TIME)
technical_started_at (DATETIME)
technical_completed_at (DATETIME)
scheduled_cosmetic_date (DATE)
scheduled_cosmetic_time (TIME)
cosmetic_started_at (DATETIME)
cosmetic_completed_at (DATETIME)
ready_for_delivery_at (DATETIME)
delivered_to_dealership_at (DATETIME)
sold_at (DATETIME)
delivered_to_customer_at (DATETIME)
archived_at (DATETIME)

# Tilbehør
accessories (JSON) - Liste med tilbehør

# Estimater
estimated_technical_hours (DECIMAL) - 2.5 eller 1.5
estimated_cosmetic_hours (DECIMAL) - 2.5 eller 1.5

# Priser (kun synlig for roller med tilgang)
purchase_price
sale_price
prep_cost

# Kommentarer
seller_notes (TEXT)
parts_notes (TEXT)
inspection_notes (TEXT)
technical_notes (TEXT)
cosmetic_notes (TEXT)

created_at, updated_at
```

### 4. `car_files` (vedlegg)

```
id (UUID, PK)
car_id (UUID, FK)
file_id (UUID, FK) - Directus files
uploaded_by (UUID, FK) - User
file_type (ENUM) - "order_confirmation", "inspection_photo", "technical_photo", "cosmetic_photo", "delivery_doc"
stage (ENUM) - "parts_order", "inspection", "technical", "cosmetic", "delivery"
description (TEXT)
created_at
```

### 5. `notifications` (varslinger)

```
id (UUID, PK)
user_id (UUID, FK) - Mottaker
car_id (UUID, FK)
type (ENUM) - "new_order", "parts_changed", "inspection_done", "ready_for_booking", "prep_complete"
message (TEXT)
read (BOOLEAN)
created_at
```

### 6. `time_allocations` (tidsbank)

```
id (UUID, PK)
dealership_id (UUID, FK) - Klargjøringsforhandler
user_id (UUID, FK, NULLABLE) - Spesifikk bruker, eller NULL for forhandler-kapasitet
date (DATE)
allocated_hours (DECIMAL) - Totalt tilgjengelig
used_hours (DECIMAL) - Brukt så langt
available_hours (DECIMAL, computed) - allocated - used
type (ENUM) - "technical", "cosmetic"
```

### 7. `time_bookings` (bookinger)

```
id (UUID, PK)
car_id (UUID, FK)
user_id (UUID, FK) - Mekaniker/bilpleier
date (DATE)
start_time (TIME)
estimated_hours (DECIMAL)
actual_hours (DECIMAL, NULLABLE)
type (ENUM) - "technical", "cosmetic"
status (ENUM) - "scheduled", "in_progress", "completed", "cancelled"
created_at, updated_at
```

---

## 🔐 Tilgangskontroll

### Feltnivå-tilgang per rolle

| Felt | Nybilselger | Bruktbilselger | Delelager | Booking | Mekaniker | Bilpleier | Daglig Leder |
|------|-------------|----------------|-----------|---------|-----------|-----------|--------------|
| customer_name | ✏️ Endre | ✏️ Endre | 👁️ Se | 👁️ Se | 👁️ Se | 👁️ Se | ✏️ Endre |
| sale_price | ✏️ Endre | ✏️ Endre | ❌ Skjult | ❌ Skjult | ❌ Skjult | ❌ Skjult | ✏️ Endre |
| accessories | ✏️ Endre* | ✏️ Endre* | 👁️ Se | 👁️ Se | 👁️ Se | 👁️ Se | ✏️ Endre |
| parts_ordered_at | ❌ Skjult | ❌ Skjult | ✏️ Endre | 👁️ Se | 👁️ Se | 👁️ Se | 👁️ Se |
| scheduled_technical_date | ❌ Skjult | ❌ Skjult | ❌ Skjult | ✏️ Endre | 👁️ Se | 👁️ Se | 👁️ Se |
| technical_notes | ❌ Skjult | ❌ Skjult | ❌ Skjult | 👁️ Se | ✏️ Endre | 👁️ Se | 👁️ Se |

*Varsling til delelager ved endring

---

## 🎯 Spørsmål til deg

### 1. Bruktbilflyt
- Er bruktbilflyten lik nybil, eller kortere?
- Trenger bruktbil delelager-steg? (eller hopper de rett til klargjøring?)
- Skal innbyttebiler automatisk registreres?

### 2. Tidsbank
- Er 2.5t/1.5t riktige estimater?
- Skal tidsbank være per bruker ELLER per forhandler totalt?
- Hva skjer hvis en jobb tar lengre tid enn estimert?

### 3. Kvalitetskontroll
- Trenger dere eget kvalitetskontroll-steg etter kosmetisk?
- Eller er det nok at både teknisk og kosmetisk er ferdig?

### 4. Nøkkeltag scanning
- Har dere fysiske nøkkeltag med koder?
- Hva står på dem? (VIN, ordrenr, annet?)

### 5. Cross-dealership søk
- Når bruktbilselger søker på tvers, skal de kunne:
  - Kun SE biler?
  - Eller også OVERTA/KJØPE biler fra annen forhandler?

### 6. Daglig leder custom fields
- Hvilke felt skal daglig leder kunne legge til?
- Eksempel: Ekstra tilbehør-kategorier?

---

## ✅ Godkjenning

**Status:** ⏸️ VENTER PÅ GODKJENNING

**Neste steg:**
1. Gjennomgå dette dokumentet
2. Svar på spørsmål over
3. Godkjenn/juster struktur
4. Implementere schema
5. Implementere roller
6. Implementere workflow hooks
7. Implementere varslinger

---

**Sist oppdatert:** 2025-10-19
**Forfatter:** Claude Code + Bruker input
**Versjon:** 1.0 DRAFT
