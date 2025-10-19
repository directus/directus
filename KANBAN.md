# DirectApp - Project Board

**Project:** Norwegian Car Dealership Multi-Site ERP System
**GitHub Project:** https://github.com/orgs/gumpen-app/projects/1
**Last Synced:** 2025-10-19

---

## 🔴 Blocked

*Issues waiting on external dependencies*

- Issue #29 - PDF parsing (venter på beslutning om teknologi)
- Issue #30 - Nøkkeltag scanning (venter på info om tag-format)

---

## 📋 Backlog

*Future work not yet prioritized*

### Phase 5: Advanced Features (Later)
- Issue #10: Ask Cars AI module (OpenAI natural language queries)
- Issue #11: Dealership branding (CSS vars per forhandler)
- Issue #12: Auto-archiving av leverte biler
- Issue #13: Vehicle bank med visibility levels
- Issue #14: Daily enrichment Flow (Statens Vegvesen)

### Phase 6: MCP Integration (Weeks 9-10)
- [ ] Research official Directus MCP server
- [ ] Deploy MCP server
- [ ] Create custom tools (car search, workflow queries)
- [ ] Test AI assistant integration

### Phase 8: Documentation & Training (Weeks 11-12)
- [ ] Create user documentation (role-specific guides)
- [ ] Create admin documentation
- [ ] Create developer documentation
- [ ] Train admin users
- [ ] Train end users
- [ ] Create support materials

---

## 📝 Todo

*Ready to start - organized by phase*

### Phase 1: Multi-Site Schema Implementation (Weeks 1-2) 🔴 HIGHEST PRIORITY

**Critical Path:**
1. Issue #20: 🗄️ Kjør database migrations (4t)
   - 001: Extend dealership
   - 002: Add dealership_id to users
   - 003: Extend cars with workflow
   - 004: Create notifications
   - 005: Create resource management

2. Issue #21: 🏢 Opprett initielle forhandlere (2t)
   - Seed alle Gumpen-forhandlere
   - Setup resource sharing (499 → 495/324/326)
   - Brand colors

3. Issue #22: ⚙️ Konfigurer Directus UI (8t)
   - Translations
   - Interfaces (dropdowns, m2o, datetime)
   - Conditional field visibility
   - Tabs og layouts

4. Issue #23: 👥 Opprett test-brukere (2t)
   - En bruker per rolle per forhandler
   - Produktive roller med tidsbank

**Total Phase 1:** ~16 timer

---

### Phase 2: Workflow & Permissions (Weeks 2-3) 🔴 HIGH PRIORITY

5. Issue #24: 🔄 Implementer workflow hook (12t)
   - Status transition validering
   - Automatiske timestamp updates
   - Read-only når arkivert
   - Notification triggers

6. Issue #26: 🔐 Rolle-basert felttilgang (16t)
   - Field-level permissions per rolle
   - Dealership isolation filters
   - Cross-dealership søk for bruktbilselger
   - Testing med alle roller

7. Issue #1: 🔴 CRITICAL - Remove unscoped DELETE (DONE i schema-exported/roles.json)
8. Issue #2: 🔴 CRITICAL - Restrict password/email (DONE i schema-exported/roles.json)
9. Issue #3: ⚠️ HIGH - Enable TFA (DONE i schema-exported/roles.json)
10. Issue #5: 🔴 CRITICAL - Dealership isolation (dekkes av #26)

**Total Phase 2:** ~28 timer

---

### Phase 3: Notifications & Automation (Week 4) ⚠️ MEDIUM PRIORITY

11. Issue #25: 🔔 Implementer notification Flows (10t)
    - Ny ordre → delelager
    - Tilbehør endret → delelager
    - Mottakskontroll → selger + booking
    - Klar for planlegging → booking
    - Klargjøring ferdig → selger
    - Tidsbank full → booking

12. Issue #8: Flows for key events (overlap med #25)
    - Email integration med Resend
    - In-app notifications

**Total Phase 3:** ~10 timer

---

### Phase 4: UI/UX Enhancements (Weeks 5-6) ⚠️ MEDIUM PRIORITY

13. Issue #27: 📅 Kalendervisning for bookinger (20t)
    - Dag/uke view
    - Drag & drop
    - Kapasitetsindikator
    - Filtrering

14. Issue #28: 📊 Rolle-spesifikke dashboards (16t)
    - Dashboard per rolle
    - Directus Insights + custom panels
    - AI-assistert rapportering for daglig leder

15. Issue #9: Role-based forms (dekkes av #22)

**Total Phase 4:** ~36 timer

---

### Phase 5: Advanced Automation (Weeks 7-8) 📌 LOWER PRIORITY

16. Issue #29: 📄 PDF parsing for ordreimport (12t)
    - Upload interface
    - Auto-parse VIN, ordrenr, kunde
    - Forhåndsvisning før lagring

17. Issue #30: 🔑 Nøkkeltag scanning (16t)
    - OCR av nøkkeltag
    - Auto-koble til bil
    - Mottakskontroll integration

18. Issue #6: Enriched statuses med colors/translations (4t)
19. Issue #7: Automatic status transitions (dekkes av #24)

**Total Phase 5:** ~32 timer

---

### Legacy Issues (Old Schema - Reference Only)

**NOTE:** Disse er basert på gammelt schema. Behold som referanse.

- Issue #4: ⚠️ Add unique constraints (VIN, order_number)
  - **Status:** DONE i migration 003
- [ ] Add VIN validation (ISO 3779 regex)
- [ ] Add license plate validation (Norwegian format)
- [ ] Create database indexes
- [ ] Add audit logging
- [ ] Fix foreign key cascades

---

## 🏗️ In Progress

*Currently being worked on*

**Phase 0.5: System Redesign** ✅ COMPLETED 2025-10-19
- [x] Analysert eksisterende oppsett
- [x] Designet komplett multi-site arkitektur
- [x] Laget 5 SQL migrations
- [x] Laget 11 GitHub issues (#20-#30)
- [x] Dokumentert i GUMPEN_SYSTEM_DESIGN.md
- [x] Oppdatert KANBAN.md

---

## 👀 Review

*Awaiting review or testing*

**Schema Design Documents:**
- `GUMPEN_SYSTEM_DESIGN.md` - Komplett system design (venter på godkjenning)
- `migrations/` - 5 SQL-filer (venter på kjøring)
- `migrations/README.md` - Migration guide

---

## ✅ Done

*Completed tasks*

### System Design (2025-10-19)
- [x] Kartlagt alle 7+ forhandlere
- [x] Definert 10 brukerroller med tilganger
- [x] Designet 23 nybil-statuser + 13 bruktbil-statuser
- [x] Planlagt 7 varslingsregler
- [x] Designet generisk ressursstyring med cross-dealership support

### Critical Permission Fixes (2025-10-19)
- [x] Issue #3: TFA enforced på alle policies (roles.json)
- [x] Issue #1: DELETE permission restricted (roles.json)
- [x] Issue #2: Password/email updates restricted (roles.json)

### Infrastructure (2025-10-18)
- [x] Pinned Directus to 11.12.0 (MCP support)
- [x] Upgraded extensions SDK to ^16.0.2
- [x] All Docker Compose configs created
- [x] Schema-as-code workflow
- [x] CI/CD pipeline
- [x] PRODUCTION_CHECKLIST.md (200+ items)
- [x] MASTER_IMPLEMENTATION_PLAN.md

### Documentation
- [x] GUMPEN_SYSTEM_DESIGN.md
- [x] CODEX_INTEGRATION_SUMMARY.md
- [x] SYNC_SUMMARY.md
- [x] CRITICAL_SCHEMA_FIXES.md
- [x] migrations/README.md

---

## 📊 Stats

**Total Issues:** 30 (19 old + 11 new)
**New Issues Created:** 11 (#20-#30)
**Completed:** 3 (#1, #2, #3 - schema edits)
**In Progress:** 0 (klar til å starte Phase 1)
**Blocked:** 2 (#29, #30 - venter på avklaringer)

**Estimated Work Remaining:**
- Phase 1 (Schema): ~16t
- Phase 2 (Workflow): ~28t
- Phase 3 (Notifications): ~10t
- Phase 4 (UI/UX): ~36t
- Phase 5 (Advanced): ~32t
**Total:** ~122 timer (~15 arbeidsdager)

**Current Sprint:** Phase 1 - Multi-Site Schema Implementation
**Sprint Goal:** Kjør migrations, seed data, konfigurer UI
**Sprint Duration:** 2 uker
**Sprint Status:** Ready to start

---

## 🎯 Next Actions

### Umiddelbart (Priority 1)
1. **Start dev environment**
   ```bash
   docker compose -f docker-compose.development.yml up
   ```

2. **Kjør Issue #20: Database migrations**
   ```bash
   # Se migrations/README.md for kommandoer
   ```

3. **Kjør Issue #21: Seed dealerships**
   ```bash
   # Opprett alle Gumpen-forhandlere
   ```

4. **Kjør Issue #22: Configure UI**
   - Sett opp interfaces i Directus admin

### Denne uken (Priority 2)
- Issue #23: Opprett test-brukere
- Issue #24: Implementer workflow hook
- Issue #26: Rolle-basert tilgang

### Neste uker
- Issue #25: Notification Flows
- Issue #27: Kalendervisning
- Issue #28: Dashboards

---

## 🔗 Links

- **GitHub Project:** https://github.com/orgs/gumpen-app/projects/1
- **Repository:** https://github.com/gumpen-app/directapp
- **Issues:** https://github.com/gumpen-app/directapp/issues
- **Design Doc:** GUMPEN_SYSTEM_DESIGN.md
- **Master Plan:** MASTER_IMPLEMENTATION_PLAN.md

---

**Last Updated:** 2025-10-19
**Maintained By:** DirectApp Team
