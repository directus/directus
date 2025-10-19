# DirectApp Schema Analysis - Car Dealership Management System

**Analysis Date:** 2025-10-18
**Schema Source:** Coolify Docker Compose deployment
**Status:** ⚠️ NOT PRODUCTION READY - Critical issues identified

---

## Executive Summary

Your Directus instance is a **Norwegian car dealership management system** tracking vehicles through a preparation workflow from arrival to customer delivery. The system manages multiple dealerships with role-based access for sales teams, mechanics, and workshop planners.

### Critical Finding

**You were right to call it "testy and dangerous"** - I've identified **15 critical security and data integrity issues** that must be fixed before production use.

---

## System Overview

### Business Domain
Car dealership vehicle preparation and sales management for Norwegian market.

### Core Workflow
```
1. Car arrives at dealer (ankommet_forhandler)
2. Reception check (mottakskontroll) → Approved/Not Approved
3. Parts ordered (deler_bestilt) → Parts arrived (deler_ankommet)
4. Technical preparation (teknisk_klargjoring)
5. Cosmetic preparation (kosmetisk_klargjoring)
6. Ready for pickup (klar_for_henting)
7. Delivered to dealer (levert_forhandler)

Optional services:
- Tire storage (dekhotell)
- Paint protection (folie)
- Coating (behanding: Standard/Premium/Ultra)
```

###Status Flow
```
Ubehandlet (Untreated - Red)
    ↓
Klar for planlegging (Ready for planning)
    ↓
Planlagt (Planned - Green)
    ↓
Behandles (Being treated - Orange)
    ↓
Ferdig (Finished - Purple)
```

---

## Data Model

### Collections (3)

#### 1. `dealership` (Hidden collection)
**Purpose:** Manage multiple dealership locations

**Fields:**
- `id` (UUID, primary key)
- `dealership_name` (string)
- `dealership_code` (string)
- `dealership_location` (string)
- `dealership_functions` (unknown type)
- Display templates, UI elements

**Issues:**
- ⚠️ No unique constraint on `dealership_code`
- ⚠️ Hidden but critical for data isolation
- ⚠️ Minimal validation

#### 2. `cars` (Main collection)
**Purpose:** Track vehicles through preparation workflow

**Key Fields:**

*Identity:*
- `id` (UUID)
- `vin` (string, required) - Vehicle Identification Number
- `kjennemerke` (string, required) - License plate
- `order_number` (integer, required)
- `make` (string) - Manufacturer
- `model` (string)

*Classification:*
- `status` (dropdown, required) - Workflow state
- `biltype` (dropdown) - Car type (Nybil/Bruktbil/Audi Approved Plus/Outlet)

*Customer:*
- `customer_name` (string)
- `customer_phone` (string)
- `delivery_date` (datetime)
- `eta` (datetime) - Estimated arrival

*Sales:*
- `selgernummer` (string) - Salesperson number
- `solgt` (boolean) - Sold flag

*Workflow Timestamps:*
- `ankommet_forhandler` (datetime) - Arrived at dealer
- `deler_bestilt` (datetime) - Parts ordered
- `deler_ankommet` (datetime) - Parts arrived
- `teknisk_klargjoring` (datetime) - Technical prep done
- `kosmetisk_klargjoring` (datetime) - Cosmetic prep done
- `levert_forhandler` (datetime) - Delivered to dealer
- `klar_for_henting` (boolean) - Ready for pickup

*Quality Control:*
- `mottakskontroll` (dropdown) - Reception check: Godkjent/Ikke godkjent

*Services:*
- `dekhotell` (select-radio) - Tire storage
- `folie` (string) - Foil/wrap
- `behanding` (dropdown) - Coating: Standard/Premium/Ultra

*Assignments:*
- `dealership_id` (M2O → dealership)
- `mekaniker` (M2O → directus_users) - Assigned mechanic
- `user_created` (M2O → directus_users)
- `user_updated` (M2O → directus_users)

*Organization:*
- `nybil` (alias, group-detail) - New car section
- `bruktbil` (alias, group-detail) - Used car section
- `bildata` (alias, group-detail) - Car data section
- `salg` (alias, group-detail) - Sales section
- `tjenester` (alias, group-detail) - Services section
- `delelager` (alias, group-detail) - Parts inventory
- `planlegging` (alias, group-detail) - Planning section
- `detaljer` (alias, group-detail) - Details section

*Comments:*
- `comment` (text)
- `comment_parts` (text)

*System:*
- `sort` (integer)
- `date_created` (datetime)
- `date_updated` (datetime)

**Critical Issues:**
- 🔴 NO validation on `vin` (should be 17 characters, alphanumeric)
- 🔴 NO unique constraint on `vin` (can create duplicates!)
- 🔴 NO unique constraint on `order_number` (can duplicate!)
- 🔴 NO validation on `kjennemerke` (license plate format)
- 🔴 NO validation on `customer_phone` (phone number format)
- 🔴 `status` has NO database constraint (relies on UI only)
- ⚠️ Many nullable fields that probably shouldn't be
- ⚠️ No cascading delete strategy for related files

#### 3. `cars_files` (Junction table)
**Purpose:** Many-to-Many between cars and files

**Fields:**
- `cars_id` (M2O → cars, on_delete: SET NULL)
- `directus_files_id` (M2O → directus_files, on_delete: SET NULL)

**Issues:**
- ⚠️ SET NULL on delete means orphaned junction records
- ⚠️ No CASCADE delete when car is deleted
- ⚠️ Files will remain but associations lost

---

## Roles & Permissions

### Roles (7)

1. **Administrator** - Full admin access
2. **Nybil** - New car sales role
3. **Bruktbil** - Used car sales role
4. **Klargjoring** - Preparation role
5. **Booking** - Workshop planning role
6. **Mottakskontroll.499** - Reception check (dealership-specific)
7. **demo** - Demo role

### Policies (4)

1. **Administrator** (admin_access: true)
2. **Nybilselger** (New car salesperson)
3. **Bruktbilselger** (Used car salesperson)
4. **Booking** (Workshop planner)

### 🔴 CRITICAL SECURITY ISSUES

#### 1. **Booking role can DELETE cars without restrictions**
```json
{
  "collection": "cars",
  "action": "delete",
  "permissions": null,  // ← NO FILTERS!
  "policy": "Booking"
}
```
**Impact:** Workshop planners can delete ANY car, including sold vehicles, with no audit trail.

#### 2. **No dealership data isolation**
```json
{
  "collection": "cars",
  "action": "read",
  "permissions": null  // ← Should filter by dealership_id!
}
```
**Impact:** Users at one dealership can see/modify cars at ALL dealerships.

#### 3. **Salespersons can update user passwords**
```json
{
  "collection": "directus_users",
  "action": "update",
  "fields": ["password", "email", ...]  // ← DANGEROUS!
}
```
**Impact:** Sales staff can change other users' passwords and emails.

#### 4. **No validation rules on critical updates**
All update permissions have:
```json
"validation": null
```
**Impact:** No server-side validation for VIN format, status transitions, required fields.

#### 5. **Overlapping field permissions**
Multiple roles can update the same fields with different permission sets, creating confusion and security gaps.

---

## Foreign Key Constraints

### 🔴 DANGEROUS: ON DELETE NO ACTION

```javascript
cars.user_created → directus_users
  on_delete: NO ACTION  // ← Will FAIL if user is deleted!

cars.user_updated → directus_users
  on_delete: NO ACTION  // ← Will FAIL if user is deleted!
```

**Impact:** Deleting a user will FAIL if they created or updated any car. This creates "zombie users" that can't be removed.

### ⚠️ ORPHAN RISK: SET NULL

```javascript
cars.dealership_id → dealership
  on_delete: SET NULL  // ← Cars lose dealership association

cars.mekaniker → directus_users
  on_delete: SET NULL  // ← Cars lose mechanic assignment

cars_files → cars
  on_delete: SET NULL  // ← Orphaned junction records
```

**Impact:** Deleting a dealership or mechanic leaves cars without proper ownership tracking.

---

## Critical Issues Summary

### 🔴 CRITICAL (Must fix before production)

1. **VIN duplication possible** - No unique constraint
2. **Order number duplication possible** - No unique constraint
3. **No VIN format validation** - Should be exactly 17 alphanumeric
4. **Delete permission without filters** - Booking role can delete anything
5. **No dealership data isolation** - Cross-dealership data leakage
6. **Password update by non-admins** - Security breach
7. **ON DELETE NO ACTION** - Cannot delete users who created cars
8. **No validation rules** - Status transitions unchecked
9. **No audit logging requirements** - Who changed what?
10. **License plate format unchecked** - Invalid data possible

### ⚠️ HIGH PRIORITY

11. **Orphaned file associations** - SET NULL on delete
12. **Phone number format unchecked** - Invalid phones
13. **No unique constraint on dealership_code** - Can create duplicates
14. **Overlapping permissions** - Role confusion
15. **No workflow state validation** - Can skip steps

---

## Data Integrity Risks

### Workflow Violations Possible

The system allows:
- Setting `klar_for_henting` = true without completing `teknisk_klargjoring`
- Marking car as `Ferdig` without `mottakskontroll` = "Godkjent"
- Changing `dealership_id` after car is sold
- Deleting car while `solgt` = true

No database constraints prevent these invalid state transitions.

---

## Missing Features

Based on the workflow, you're probably missing:

1. **Parts inventory tracking** - `delelager` is just a UI group, no collection
2. **Service history** - No audit trail of what was done
3. **Photo documentation** - Files exist but no required photos per stage
4. **Email notifications** - No flows detected
5. **Status change webhooks** - No automation detected
6. **Invoice generation** - Sales data but no billing
7. **Mechanic workload tracking** - Assignment exists but no capacity planning
8. **Customer communication log** - Phone field but no call history

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        directus_users                        │
│                    (Sales, Mechanics, Admin)                 │
└────┬─────────────────────────────┬──────────────────────────┘
     │                             │
     │ user_created                │ mekaniker (assigned)
     │ user_updated                │
     │                             │
┌────▼─────────────────────────────▼──────────────────────────┐
│                           cars                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Identity: vin, kjennemerke, order_number, make/model│   │
│  │ Status: Ubehandlet → Planlagt → Behandles → Ferdig  │   │
│  │ Type: Nybil, Bruktbil, Audi Approved, Outlet        │   │
│  │ Workflow: Dates for each stage                       │   │
│  │ Services: dekhotell, folie, behanding                │   │
│  │ Customer: name, phone, delivery_date                 │   │
│  └──────────────────────────────────────────────────────┘   │
└────┬─────────────────────────────┬──────────────────────────┘
     │                             │
     │ dealership_id               │ cars_id
     │                             │
┌────▼────────────────┐       ┌────▼────────────────────────┐
│    dealership       │       │        cars_files           │
│  - name             │       │   (junction table)          │
│  - code             │       │                             │
│  - location         │       │   directus_files_id         │
│  - functions        │       │          │                  │
└─────────────────────┘       └──────────┼──────────────────┘
                                         │
                              ┌──────────▼──────────────┐
                              │   directus_files        │
                              │   (photos, documents)   │
                              └─────────────────────────┘

ROLES:
- Administrator: Full access
- Nybilselger: Create/update new cars, customer data
- Bruktbilselger: Create/update used cars
- Booking: Plan workflow, DELETE access (!!)
- Mottakskontroll: Reception checks
```

---

## Recommendations

### Phase 1: Critical Fixes (Week 1)

**[CRITICAL] Add unique constraints:**
```sql
ALTER TABLE cars ADD CONSTRAINT cars_vin_unique UNIQUE (vin);
ALTER TABLE cars ADD CONSTRAINT cars_order_number_unique UNIQUE (order_number);
ALTER TABLE dealership ADD CONSTRAINT dealership_code_unique UNIQUE (dealership_code);
```

**[CRITICAL] Fix foreign key constraints:**
```sql
ALTER TABLE cars DROP CONSTRAINT cars_user_created_foreign;
ALTER TABLE cars ADD CONSTRAINT cars_user_created_foreign
  FOREIGN KEY (user_created) REFERENCES directus_users(id) ON DELETE SET NULL;

ALTER TABLE cars DROP CONSTRAINT cars_user_updated_foreign;
ALTER TABLE cars ADD CONSTRAINT cars_user_updated_foreign
  FOREIGN KEY (user_updated) REFERENCES directus_users(id) ON DELETE SET NULL;
```

**[CRITICAL] Add data isolation:**
Update all role permissions to filter by dealership:
```json
{
  "permissions": {
    "dealership_id": {
      "_eq": "$CURRENT_USER.dealership_id"
    }
  }
}
```

**[CRITICAL] Remove dangerous permissions:**
- Remove DELETE permission from Booking role
- Remove password/email update from non-admin roles

---

### Phase 2: Data Validation (Week 2)

**Add field validations:**
- VIN: `^[A-HJ-NPR-Z0-9]{17}$` (17 characters, no I, O, Q)
- License plate (kjennemerke): Norwegian format
- Phone: Norwegian phone format
- Email: RFC 5322 compliant

**Add status transition validation:**
```javascript
// Custom validation hook
- Cannot set status="Ferdig" without mottakskontroll="Godkjent"
- Cannot set klar_for_henting=true without teknisk_klargjoring date
- Cannot change dealership_id if solgt=true
```

---

### Phase 3: Missing Features (Week 3-4)

1. **Audit logging extension** - Track all changes
2. **Parts inventory collection** - Actual parts tracking
3. **Service history collection** - Work performed log
4. **Customer communication log** - Call/email history
5. **Photo requirements** - Required photos per stage
6. **Email notifications flow** - Status change alerts
7. **Invoice integration** - Billing system connection

---

### Phase 4: Production Hardening (Week 4-5)

1. **Backup strategy** - Automated backups
2. **Monitoring** - Error tracking (Sentry!)
3. **Rate limiting** - API protection
4. **IP whitelisting** - Admin access restriction
5. **2FA enforcement** - For admin/sales roles
6. **Data retention policy** - Archive old sold cars
7. **Performance indexes** - On vin, order_number, status, dealership_id

---

## What Makes It "Testy and Dangerous"

You were absolutely right. Here's why:

1. **No unique constraints** → Duplicate VINs/orders crash workflows
2. **No validation** → Invalid data silently accepted
3. **Wrong delete cascades** → Can't remove users, orphans junction records
4. **No data isolation** → Dealerships see each other's data
5. **Dangerous permissions** → Non-admins can delete/change passwords
6. **No audit trail** → Can't track who changed what
7. **No workflow validation** → Can skip critical steps
8. **No error handling** → Silent failures

---

## Next Steps

1. **Review this analysis** - Any questions or corrections?
2. **Prioritize fixes** - Which issues are causing problems now?
3. **Create GitHub Project tasks** - I'll generate issues from this analysis
4. **Plan migration** - How to fix production data
5. **Test environment** - Set up safe testing before production fixes

**Want me to generate the GitHub Project issues now?**

I can create prioritized tasks with:
- Clear descriptions
- Acceptance criteria
- SQL migration scripts
- Testing checklists
- Risk assessments

---

**Analysis Status:** ✅ Complete
**Production Ready:** 🔴 NO - 15 critical issues
**Estimated Fix Time:** 3-5 weeks (phased approach)
**Risk Level:** 🔴 HIGH - Data integrity and security issues

