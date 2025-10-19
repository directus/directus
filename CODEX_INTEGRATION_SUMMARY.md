# Codex Integration Summary

**Date:** 2025-10-18
**Status:** ✅ All recommendations integrated
**GitHub Project:** https://github.com/orgs/gumpen-app/projects/1

---

## 🎯 Overview

Integrated Codex's comprehensive review and created **14 new GitHub issues** organized into **5 Epics** based on the updated requirements.

---

## 📋 Epic Structure

### Epic 1: Workflow Model Overhaul
**Goal:** Improve car workflow with enriched statuses and automatic transitions

| Issue | Title | Priority | Time |
|-------|-------|----------|------|
| [#6](https://github.com/gumpen-app/directapp/issues/6) | Add enriched statuses with colors/translations | ⚠️ MEDIUM | 6h |
| [#7](https://github.com/gumpen-app/directapp/issues/7) | Automatic status transitions in hook | ⚠️ HIGH | 8h |

**Status Flow:**
```
registered → booking → workshop_received → tech_completed →
cosmetic_completed → quality_check → ready_for_delivery → delivered
                        ↓
                  qc_failed, waiting_parts (branches)
```

**Auto-Transitions:**
- `workshop_received_at` set → `workshop_received`
- Tech + Cosmetic done → `quality_check`
- Quality approved → `ready_for_delivery`
- `delivered_at` set → `delivered` (terminal, locked)

---

### Epic 2: Notification & Automation
**Goal:** Smart notifications using Flows and OpenAI

| Issue | Title | Priority | Time |
|-------|-------|----------|------|
| [#8](https://github.com/gumpen-app/directapp/issues/8) | Flows for key events (arrival, QC, delivery, overdue) | ⚠️ HIGH | 12h |

**Events:**
1. Arrival - car reaches workshop
2. QC Result - quality check pass/fail
3. Ready for Delivery - car ready
4. Overdue Reminder - delivery_date tomorrow
5. Parts Arrived - waiting_parts → in_stock

**Implementation:**
- Trigger: Event Hook (status change)
- Email: Resend API
- In-app: Notifications collection
- Optional: OpenAI for smart summaries

---

### Epic 3: UX & Dashboards
**Goal:** Role-based UX and AI-powered queries

| Issue | Title | Priority | Time |
|-------|-------|----------|------|
| [#9](https://github.com/gumpen-app/directapp/issues/9) | Role-based forms (show only relevant fields) | ⚠️ MEDIUM | 8h |
| [#10](https://github.com/gumpen-app/directapp/issues/10) | "Ask Cars" module (OpenAI natural language) | ⚠️ MEDIUM | 16h |

**Role-Based Forms:**

| Role | Shows | Hides |
|------|-------|-------|
| Booking | regnr, vin, customer, dates | tech_*, cosmetic_*, price |
| Workshop Tech | tech_*, parts, hours | customer, cosmetic_*, price |
| Workshop Cosmetic | cosmetic_*, materials | tech_*, customer, price |
| Quality | quality_*, approval | customer, price |
| Sales | price, sold_*, delivery | tech_*, cosmetic_*, quality_* |

**Ask Cars Examples:**
- "Show me all Audis ready this week"
- "Which cars are overdue?"
- "List cars waiting for parts at Gumpen"

---

### Epic 4: Brand Presets & Auto-Archiving
**Goal:** Per-dealership branding and automatic archiving

| Issue | Title | Priority | Time |
|-------|-------|----------|------|
| [#11](https://github.com/gumpen-app/directapp/issues/11) | Dealership branding (colors/logo) with CSS vars | ⚠️ MEDIUM | 12h |
| [#12](https://github.com/gumpen-app/directapp/issues/12) | Auto-archive delivered cars; block edits | ⚠️ HIGH | 6h |

**Brand Colors:**
- **Audi:** Primary #BB0A30 (red), Secondary #000000 (black)
- **Skoda:** Primary #4BA82E (green), Secondary #000000
- **Nissan:** Primary #C3002F (red), Secondary #000000
- **Gumpen:** Primary #1E3A8A (blue), Secondary #F59E0B (amber)

**Auto-Archiving:**
- Trigger: `delivered_at` set OR `status = 'delivered'`
- Action: Set `status = 'archived'`
- Effect: Read-only (block all edits)

---

### Epic 5: Common Vehicle Bank & Daily Enrichment
**Goal:** Shared vehicle pool with automatic data enrichment

| Issue | Title | Priority | Time |
|-------|-------|----------|------|
| [#13](https://github.com/gumpen-app/directapp/issues/13) | Add in_vehicle_bank + visibility model | ⚠️ MEDIUM | 10h |
| [#14](https://github.com/gumpen-app/directapp/issues/14) | Daily enrichment Flow using vehicle-lookup | ⚠️ HIGH | 12h |

**Visibility Levels:**
- **Private:** Only my dealership
- **Brand:** All dealerships of same brand (Audi sees Audi from other locations)
- **Global:** All dealerships

**Daily Enrichment (03:00 cron):**
1. Find cars with missing: VIN, regnr, make, model, year
2. Call `/vehicle-lookup` endpoint
3. Update only empty fields (preserve user data)
4. Log to `enrichment_logs` collection
5. Rate limit: 100 cars/run, 1s delay between requests

---

## 🔧 Technical Implementation Notes

### From Codex's Review:

1. **Keep invariants in hook** (authoritative)
   - Automatic transitions
   - Terminal state locking
   - Archive protection

2. **Use Flows for side-effects**
   - Notifications
   - Logging
   - External API calls

3. **Separate concerns:**
   - `status` = workflow state
   - `archived` = separate (or use Directus archive_field)
   - Don't mix workflow and archive

4. **Security:**
   - All filters: `dealership_id = $CURRENT_USER.dealership_id`
   - Brand sharing: `dealership.brand = $CURRENT_USER.dealership.brand`
   - Rate limiting on AI queries
   - Sanitized logs (no PII)

5. **Enrichment:**
   - Idempotent (safe to re-run)
   - Never overwrite non-empty user fields
   - Log all actions

---

## 📊 Updated Priorities

### Phase 0: Critical Foundation (Weeks 1-2) 🔴 IMMEDIATE
- Issue #1: Remove unscoped DELETE
- Issue #2: Restrict password/email updates
- Issue #3: Enable TFA on admins
- Issue #4: Add unique constraints
- Issue #5: Implement dealership isolation

### Phase 1: Vehicle Registry (Weeks 3-4)
- Vehicle lookup endpoint (already built ✅)
- Issue #14: Daily enrichment Flow

### Phase 2: Role Workflows (Weeks 4-5)
- Issue #6: Enriched statuses
- Issue #7: Automatic transitions
- Issue #9: Role-based forms

### Phase 3: Notifications (Weeks 5-6)
- Issue #8: Notification Flows
- In-app notifications
- Email templates

### Phase 4: Multi-Dealership (Weeks 6-7)
- Issue #11: Dealership branding
- Issue #12: Auto-archiving
- Issue #13: Vehicle bank

### Phase 5: Scheduling (Weeks 7-9)
- Resource management
- Calendar interface
- Time tracking

### Phase 6: MCP & AI (Weeks 9-10)
- Issue #10: Ask Cars module
- MCP server integration

---

## 🎯 Next Actions

### 1. **Complete Phase 0** (Critical Security Fixes)

Follow `CRITICAL_SCHEMA_FIXES.md`:

```bash
# Start dev environment
docker compose -f docker-compose.development.yml up

# Fix permissions in UI (Issues #1, #2, #3)
# ~5 hours total

# Export fixed schema
./schema/scripts/export.sh dev
./schema/scripts/lint-permissions.sh dev

# Commit
git add schema/snapshots/dev.json
git commit -m "Fix critical permissions (#1 #2 #3)"
```

### 2. **Build Extensions with New SDK**

```bash
cd extensions
pnpm install
pnpm build

# Restart Directus
docker compose restart directus
```

### 3. **Start Phase 1**

- Get Statens Vegvesen API token
- Test vehicle lookup endpoint
- Create daily enrichment Flow (Issue #14)

### 4. **Continue with Epics**

Follow the epic structure:
1. Workflow Model Overhaul
2. Notifications & Automation
3. UX & Dashboards
4. Brand Presets & Archiving
5. Vehicle Bank & Enrichment

---

## 📈 Progress Tracking

**Total Issues Created:** 19
**By Epic:**
- Phase 0 (Critical): 5 issues
- Epic 1 (Workflow): 2 issues
- Epic 2 (Notifications): 1 issue
- Epic 3 (UX): 2 issues
- Epic 4 (Branding): 2 issues
- Epic 5 (Vehicle Bank): 2 issues

**Epics:** 5
**Total Estimated Time:** ~100+ hours
**Timeline:** 12 weeks to full production

---

## 🔗 Key Resources

| Resource | Purpose | Link |
|----------|---------|------|
| **GitHub Project** | Live board | https://github.com/orgs/gumpen-app/projects/1 |
| **All Issues** | Track work | https://github.com/gumpen-app/directapp/issues |
| **KANBAN.md** | Complete task list | Root directory |
| **CRITICAL_SCHEMA_FIXES.md** | Security fixes | Root directory |
| **MASTER_IMPLEMENTATION_PLAN.md** | 12-week roadmap | Root directory |
| **Codex Review** | .ideas/codex.md | Latest recommendations |

---

## ✅ Codex's Recommendations Applied

### Infrastructure ✅
- [x] Pinned Directus to 11.12.0 (MCP support)
- [x] Upgraded extensions SDK to ^16.0.2
- [x] Removed host port exposure (production)
- [x] Fixed healthchecks (curl instead of wget)
- [x] S3 storage configured
- [x] CORS/proxy/cookie hardening

### Schema-as-Code ✅
- [x] Created schema/ directory structure
- [x] Added export/apply/diff/lint scripts
- [x] Permission linter for CI

### CI/CD ✅
- [x] GitHub Actions workflow
- [x] Ephemeral Directus in services
- [x] Schema validation
- [x] Permission smoke tests

### Extensions ✅
- [x] Workspace structure
- [x] Vehicle lookup endpoint
- [x] Send email operation
- [x] Workflow guard hook
- [x] Vehicle lookup interface
- [x] Build system with SDK ^16

### New from Codex Update ✅
- [x] Epic structure defined
- [x] 14 new feature issues created
- [x] Workflow automation planned
- [x] Brand presets designed
- [x] Auto-archiving specified
- [x] Vehicle bank model defined
- [x] Daily enrichment flow planned
- [x] Ask Cars module scoped

---

## 🚀 Ready to Build!

All infrastructure is in place. All issues are created and tracked. The only blocker is completing Phase 0 (critical security fixes).

**Once Phase 0 is done** (~17 hours of work), you can:
1. Deploy to production safely
2. Start building features from the epics
3. Iterate on workflow improvements
4. Add AI-powered features

**Start here:** `CRITICAL_SCHEMA_FIXES.md` → Fix issues #1, #2, #3 (~5 hours)

---

**Last Updated:** 2025-10-18
**Maintained By:** DirectApp Team
