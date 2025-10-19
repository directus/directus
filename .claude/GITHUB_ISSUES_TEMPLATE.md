# GitHub Issues Template for DirectApp Production Readiness

Generated from schema analysis: 2025-10-18

---

## Sprint 1: Critical Security & Data Integrity (Week 1)

### Issue #1: [CRITICAL] Add unique constraint on VIN field

**Priority:** P0 - Blocker
**Labels:** `critical`, `database`, `data-integrity`
**Milestone:** Production Readiness - Phase 1

**Description:**
The `cars.vin` field has no unique constraint, allowing duplicate Vehicle Identification Numbers to be created. This violates automotive industry standards and creates data integrity issues.

**Current State:**
```sql
-- VIN field definition
vin VARCHAR, NOT NULL
-- NO UNIQUE CONSTRAINT
```

**Impact:**
- Multiple cars can have the same VIN
- Cannot reliably identify vehicles
- Legal compliance issues
- Data corruption in reports

**Acceptance Criteria:**
- [ ] Add unique constraint to `cars.vin` in database
- [ ] Update Directus field metadata to show uniqueness
- [ ] Handle existing duplicates (if any)
- [ ] Add migration script for production data
- [ ] Add validation error message in UI
- [ ] Test duplicate VIN rejection

**Migration Script:**
```sql
-- 1. Find existing duplicates
SELECT vin, COUNT(*) as count
FROM cars
GROUP BY vin
HAVING COUNT(*) > 1;

-- 2. Fix duplicates (manual review required)
-- UPDATE cars SET vin = 'CORRECTED_VIN' WHERE id = 'duplicate-id';

-- 3. Add unique constraint
ALTER TABLE cars
ADD CONSTRAINT cars_vin_unique UNIQUE (vin);
```

**Rollback Plan:**
```sql
ALTER TABLE cars DROP CONSTRAINT cars_vin_unique;
```

**Testing Checklist:**
- [ ] Try to create car with duplicate VIN (should fail)
- [ ] Verify error message is user-friendly
- [ ] Check existing data for duplicates
- [ ] Test VIN update to existing VIN (should fail)
- [ ] Test VIN update to new unique VIN (should succeed)

**Estimated Effort:** 2-4 hours
**Risk:** LOW (standard database constraint)

---

### Issue #2: [CRITICAL] Add unique constraint on order_number field

**Priority:** P0 - Blocker
**Labels:** `critical`, `database`, `data-integrity`
**Milestone:** Production Readiness - Phase 1

**Description:**
The `cars.order_number` field has no unique constraint, allowing duplicate order numbers. This creates confusion in order processing and inventory management.

**Current State:**
```sql
-- order_number field definition
order_number INTEGER, NULLABLE
-- NO UNIQUE CONSTRAINT
```

**Impact:**
- Multiple cars can have the same order number
- Cannot track orders reliably
- Sales and inventory confusion
- Reporting errors

**Acceptance Criteria:**
- [ ] Add unique constraint to `cars.order_number`
- [ ] Make field NOT NULL (business rule)
- [ ] Handle existing NULL or duplicate values
- [ ] Add migration script
- [ ] Update UI validation
- [ ] Test duplicate rejection

**Migration Script:**
```sql
-- 1. Find NULLs and duplicates
SELECT 'NULL values:', COUNT(*) FROM cars WHERE order_number IS NULL;
SELECT order_number, COUNT(*) as count
FROM cars
WHERE order_number IS NOT NULL
GROUP BY order_number
HAVING COUNT(*) > 1;

-- 2. Fix issues (assign sequential numbers or manual review)
-- Generate sequential order numbers for NULLs
UPDATE cars
SET order_number = NEXTVAL('order_number_seq')
WHERE order_number IS NULL;

-- 3. Add constraints
ALTER TABLE cars
ALTER COLUMN order_number SET NOT NULL;

ALTER TABLE cars
ADD CONSTRAINT cars_order_number_unique UNIQUE (order_number);
```

**Rollback Plan:**
```sql
ALTER TABLE cars DROP CONSTRAINT cars_order_number_unique;
ALTER TABLE cars ALTER COLUMN order_number DROP NOT NULL;
```

**Estimated Effort:** 2-4 hours
**Risk:** MEDIUM (may have data cleanup required)

---

### Issue #3: [CRITICAL] Add VIN format validation

**Priority:** P0 - Blocker
**Labels:** `critical`, `validation`, `data-quality`
**Milestone:** Production Readiness - Phase 1

**Description:**
VIN (Vehicle Identification Number) must be exactly 17 alphanumeric characters (excluding I, O, Q) per ISO 3779 standard. Currently no validation exists.

**Current State:**
- VIN is simple string field
- No format validation
- No length check
- Can contain invalid characters

**Impact:**
- Invalid VINs accepted
- Cannot integrate with external automotive APIs
- Legal compliance issues
- Cannot verify vehicle authenticity

**Acceptance Criteria:**
- [ ] Add regex validation in Directus: `^[A-HJ-NPR-Z0-9]{17}$`
- [ ] Add field validation metadata
- [ ] Create custom validation hook if needed
- [ ] Show helpful error message
- [ ] Audit existing VINs for format issues
- [ ] Document VIN requirements

**Implementation:**

1. **Directus Field Metadata:**
```json
{
  "field": "vin",
  "meta": {
    "validation": {
      "_and": [
        {
          "vin": {
            "_regex": "^[A-HJ-NPR-Z0-9]{17}$"
          }
        }
      ]
    },
    "validation_message": "VIN must be exactly 17 characters (A-Z, 0-9, excluding I, O, Q)",
    "options": {
      "placeholder": "Example: 1HGBH41JXMN109186",
      "trim": true,
      "uppercase": true
    }
  }
}
```

2. **Custom Hook (if needed):**
```javascript
// extensions/hooks/validate-vin/index.js
export default ({ filter }, { services, exceptions }) => {
  const { ItemsService } = services;
  const { InvalidPayloadException } = exceptions;

  filter('cars.items.create', async (input) => {
    if (input.vin && !validateVIN(input.vin)) {
      throw new InvalidPayloadException('Invalid VIN format. Must be 17 characters (A-Z, 0-9, excluding I, O, Q)');
    }
    return input;
  });

  filter('cars.items.update', async (input) => {
    if (input.vin && !validateVIN(input.vin)) {
      throw new InvalidPayloadException('Invalid VIN format. Must be 17 characters (A-Z, 0-9, excluding I, O, Q)');
    }
    return input;
  });
};

function validateVIN(vin) {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
}
```

**Audit Existing Data:**
```sql
-- Find invalid VINs
SELECT id, vin, LENGTH(vin) as vin_length
FROM cars
WHERE vin !~ '^[A-HJ-NPR-Z0-9]{17}$'
   OR LENGTH(vin) != 17;
```

**Testing Checklist:**
- [ ] Test valid 17-character VIN (should succeed)
- [ ] Test 16-character VIN (should fail)
- [ ] Test 18-character VIN (should fail)
- [ ] Test VIN with 'I' (should fail)
- [ ] Test VIN with 'O' (should fail)
- [ ] Test VIN with lowercase (should convert to uppercase)
- [ ] Test VIN with spaces (should trim)
- [ ] Verify error message is clear

**Estimated Effort:** 4-6 hours
**Risk:** MEDIUM (may have existing invalid data)

---

### Issue #4: [CRITICAL] Remove DELETE permission from Booking role

**Priority:** P0 - Blocker
**Labels:** `critical`, `security`, `permissions`
**Milestone:** Production Readiness - Phase 1

**Description:**
The Booking role (workshop planners) has DELETE permission on cars collection with NO filters. This allows them to delete ANY car, including sold vehicles, with no audit trail.

**Current State:**
```json
{
  "collection": "cars",
  "action": "delete",
  "permissions": null,  // ← NO RESTRICTIONS!
  "policy": "Booking (b77df49f-8ee0-4eb7-b63c-fe39d0db596b)"
}
```

**Impact:**
- Workshop staff can delete sold cars
- No audit trail for deletions
- Potential data loss
- Legal compliance issues
- No recovery mechanism

**Recommended Solution:**
**Option A: Remove DELETE entirely** (Recommended)
- Use soft delete (archive) instead
- Keep data for compliance
- Maintain audit trail

**Option B: Restrict to specific conditions**
- Only delete if status="Ubehandlet" AND solgt=false
- Add audit logging
- Require admin approval

**Implementation (Option A - Recommended):**

1. **Remove DELETE permission:**
```json
// Delete this permission entirely from Booking policy
// Users will see "Archive" option instead
```

2. **Update cars collection to use archive:**
```json
{
  "collection": "cars",
  "meta": {
    "archive_field": "status",
    "archive_value": "archived",
    "unarchive_value": "Ubehandlet"
  }
}
```

3. **Add "archived" to status choices:**
```json
{
  "field": "status",
  "meta": {
    "options": {
      "choices": [
        // ... existing choices ...
        {
          "text": "Arkivert",
          "value": "archived",
          "color": "#A2A9B0"
        }
      ]
    }
  }
}
```

**Implementation (Option B - If delete needed):**

```json
{
  "collection": "cars",
  "action": "delete",
  "permissions": {
    "_and": [
      {
        "status": {
          "_eq": "Ubehandlet"
        }
      },
      {
        "solgt": {
          "_eq": false
        }
      },
      {
        "dealership_id": {
          "_eq": "$CURRENT_USER.dealership_id"
        }
      }
    ]
  },
  "policy": "Booking"
}
```

**Acceptance Criteria:**
- [ ] Remove or restrict DELETE permission
- [ ] Test booking user cannot delete sold cars
- [ ] Test booking user cannot delete cars from other dealerships
- [ ] Add audit logging for any deletes
- [ ] Document deletion policy
- [ ] Train users on archive workflow

**Testing Checklist:**
- [ ] Booking user tries to delete unsold car (should fail or archive)
- [ ] Booking user tries to delete sold car (should fail)
- [ ] Booking user tries to delete car from other dealership (should fail)
- [ ] Admin can still delete if needed
- [ ] Archived cars don't show in default views
- [ ] Archived cars can be unarchived

**Estimated Effort:** 2-3 hours
**Risk:** LOW (permission removal)

---

### Issue #5: [CRITICAL] Implement dealership data isolation

**Priority:** P0 - Blocker
**Labels:** `critical`, `security`, `multi-tenancy`
**Milestone:** Production Readiness - Phase 1

**Description:**
Currently ALL roles can see and modify cars from ALL dealerships. There is no row-level security filtering by `dealership_id`. This is a critical data leakage issue.

**Current State:**
```json
{
  "collection": "cars",
  "action": "read",
  "permissions": null  // ← NO FILTERING!
}
```

**Impact:**
- Dealership A can see dealership B's cars
- Sensitive sales data exposed
- Cannot have dealership-specific pricing
- Privacy violations
- Competitive intelligence leakage

**Solution:**
Add `dealership_id` filter to ALL non-admin permissions.

**Implementation:**

1. **Add dealership_id to directus_users:**
```sql
ALTER TABLE directus_users
ADD COLUMN dealership_id UUID REFERENCES dealership(id) ON DELETE SET NULL;
```

2. **Update ALL role permissions:**

```json
// For: Nybilselger, Bruktbilselger, Booking, Klargjoring, Mottakskontroll
{
  "collection": "cars",
  "action": "read",
  "permissions": {
    "dealership_id": {
      "_eq": "$CURRENT_USER.dealership_id"
    }
  }
}

{
  "collection": "cars",
  "action": "create",
  "permissions": null,  // Can create
  "presets": {
    "dealership_id": "$CURRENT_USER.dealership_id"  // Auto-set
  }
}

{
  "collection": "cars",
  "action": "update",
  "permissions": {
    "dealership_id": {
      "_eq": "$CURRENT_USER.dealership_id"
    }
  },
  "fields": ["..."]  // Prevent changing dealership_id
}
```

3. **Restrict dealership_id changes:**
```json
// Remove dealership_id from all UPDATE field lists
// Only admins can change dealership assignment
```

**Acceptance Criteria:**
- [ ] Add dealership_id to directus_users
- [ ] Update all role permissions with dealership filter
- [ ] Auto-set dealership_id on car creation
- [ ] Prevent dealership_id changes by non-admins
- [ ] Test cross-dealership data isolation
- [ ] Migrate existing users to correct dealership
- [ ] Document multi-tenancy architecture

**Migration Script:**
```sql
-- 1. Add column
ALTER TABLE directus_users
ADD COLUMN IF NOT EXISTS dealership_id UUID
REFERENCES dealership(id) ON DELETE SET NULL;

-- 2. Assign users to dealerships (manual or based on role_dealership_code)
UPDATE directus_users u
SET dealership_id = (
  SELECT id FROM dealership d
  WHERE d.dealership_code = r.role_dealership_code
)
FROM directus_roles r
WHERE u.role = r.id
  AND r.role_dealership_code IS NOT NULL;

-- 3. Verify all non-admin users have dealership
SELECT id, email, first_name, dealership_id
FROM directus_users
WHERE dealership_id IS NULL
  AND role != 'Administrator';
```

**Testing Checklist:**
- [ ] User from dealership A cannot see cars from dealership B
- [ ] User creates car → auto-assigned to their dealership
- [ ] User cannot change car's dealership_id
- [ ] Admin can see all dealerships
- [ ] Admin can move cars between dealerships
- [ ] Search/filter works within dealership scope
- [ ] Reports only show dealership data

**Estimated Effort:** 6-8 hours
**Risk:** HIGH (major permission changes, data migration)

---

### Issue #6: [CRITICAL] Remove password/email update from non-admin roles

**Priority:** P0 - Blocker
**Labels:** `critical`, `security`, `authentication`
**Milestone:** Production Readiness - Phase 1

**Description:**
Salesperson roles (Nybilselger policy) can update `password` and `email` fields for other users. This is a critical security vulnerability.

**Current State:**
```json
{
  "collection": "directus_users",
  "action": "update",
  "permissions": null,  // ← NO FILTER (can update any user!)
  "fields": [
    "first_name",
    "last_name",
    "email",        // ← DANGEROUS
    "dealership_id",
    "password",     // ← CRITICAL SECURITY ISSUE
    "avatar"
  ],
  "policy": "Nybilselger"
}
```

**Impact:**
- Sales staff can change admin passwords
- Sales staff can hijack accounts by changing emails
- No audit trail for these changes
- Compliance violations

**Solution:**
Restrict user updates to SELF only, remove password/email from editable fields.

**Implementation:**

```json
{
  "collection": "directus_users",
  "action": "update",
  "permissions": {
    "id": {
      "_eq": "$CURRENT_USER"  // ← Can only update self
    }
  },
  "fields": [
    "first_name",
    "last_name",
    "avatar",
    "language",
    "appearance",
    "theme_light",
    "theme_dark"
    // ← NO password, NO email, NO dealership_id
  ],
  "policy": "Nybilselger"
}
```

**For password changes:**
- Use Directus built-in password reset flow
- Require email verification
- Admins can reset passwords via admin panel

**For email changes:**
- Require admin approval
- Or use Directus email change flow with verification

**Acceptance Criteria:**
- [ ] Non-admins can only update their own profile
- [ ] Remove password from non-admin update fields
- [ ] Remove email from non-admin update fields
- [ ] Remove dealership_id from non-admin update fields
- [ ] Test sales user cannot update other users
- [ ] Test sales user can update own name/avatar
- [ ] Document password reset process
- [ ] Document email change process

**Testing Checklist:**
- [ ] Sales user tries to update another user (should fail)
- [ ] Sales user tries to change own password (should fail or use reset flow)
- [ ] Sales user tries to change own email (should fail or use verification)
- [ ] Sales user can change own name/avatar
- [ ] Admin can change any user's password/email
- [ ] Password reset flow works
- [ ] Email verification works

**Estimated Effort:** 3-4 hours
**Risk:** LOW (permission restriction)

---

### Issue #7: [CRITICAL] Fix foreign key constraints for user references

**Priority:** P0 - Blocker
**Labels:** `critical`, `database`, `referential-integrity`
**Milestone:** Production Readiness - Phase 1

**Description:**
`cars.user_created` and `cars.user_updated` have `ON DELETE NO ACTION`, which prevents deleting users who created/updated cars. This creates "zombie users" that cannot be removed.

**Current State:**
```sql
CONSTRAINT cars_user_created_foreign
  FOREIGN KEY (user_created)
  REFERENCES directus_users(id)
  ON DELETE NO ACTION;

CONSTRAINT cars_user_updated_foreign
  FOREIGN KEY (user_updated)
  REFERENCES directus_users(id)
  ON DELETE NO ACTION;
```

**Impact:**
- Cannot delete users who have created/updated cars
- Cannot offboard employees
- Database grows with inactive accounts
- Compliance issues (GDPR right to be forgotten)

**Solution:**
Change to `ON DELETE SET NULL` - when user is deleted, keep the car but NULL the user reference.

**Migration Script:**
```sql
-- 1. Drop existing constraints
ALTER TABLE cars
DROP CONSTRAINT IF EXISTS cars_user_created_foreign;

ALTER TABLE cars
DROP CONSTRAINT IF EXISTS cars_user_updated_foreign;

-- 2. Add new constraints with SET NULL
ALTER TABLE cars
ADD CONSTRAINT cars_user_created_foreign
  FOREIGN KEY (user_created)
  REFERENCES directus_users(id)
  ON DELETE SET NULL;

ALTER TABLE cars
ADD CONSTRAINT cars_user_updated_foreign
  FOREIGN KEY (user_updated)
  REFERENCES directus_users(id)
  ON DELETE SET NULL;

-- 3. Do the same for mekaniker
ALTER TABLE cars
DROP CONSTRAINT IF EXISTS cars_mekaniker_foreign;

ALTER TABLE cars
ADD CONSTRAINT cars_mekaniker_foreign
  FOREIGN KEY (mekaniker)
  REFERENCES directus_users(id)
  ON DELETE SET NULL;
```

**Update Directus metadata:**
```json
{
  "collection": "cars",
  "field": "user_created",
  "meta": {
    "one_deselect_action": "nullify"
  }
}
```

**Acceptance Criteria:**
- [ ] Update all user foreign keys to ON DELETE SET NULL
- [ ] Update Directus relation metadata
- [ ] Test user deletion (should succeed)
- [ ] Verify cars keep historical data (just NULL user refs)
- [ ] Document user offboarding process
- [ ] Consider audit logging for deleted users

**Testing Checklist:**
- [ ] Create car with user A
- [ ] Delete user A
- [ ] Verify car still exists
- [ ] Verify user_created is NULL
- [ ] Verify car data is intact
- [ ] Test with mekaniker assignment
- [ ] Check audit trail (if implemented)

**Estimated Effort:** 2-3 hours
**Risk:** LOW (standard foreign key update)

---

## Sprint 2: Data Validation & Quality (Week 2)

### Issue #8: [HIGH] Add Norwegian license plate validation

**Priority:** P1 - High
**Labels:** `validation`, `data-quality`, `norway`

**Description:**
Norwegian license plates have specific formats that should be validated.

**Norwegian License Plate Formats:**
- Standard: 2 letters + 5 digits (AA 12345)
- Electric: 2 letters + 4-5 digits + "EL" or "EK"
- Custom: Various formats

**Implementation:**
```json
{
  "field": "kjennemerke",
  "meta": {
    "validation": {
      "_or": [
        {
          "kjennemerke": {
            "_regex": "^[A-Z]{2}\\s?\\d{5}$"
          }
        },
        {
          "kjennemerke": {
            "_regex": "^[A-Z]{2}\\s?\\d{4,5}\\s?(EL|EK)$"
          }
        }
      ]
    },
    "validation_message": "Ugyldig bilskiltnummer. Format: AA 12345 eller AA 12345 EL",
    "options": {
      "trim": true,
      "uppercase": true,
      "placeholder": "AA 12345"
    }
  }
}
```

**Estimated Effort:** 3-4 hours

---

### Issue #9: [HIGH] Add Norwegian phone number validation

**Priority:** P1 - High
**Labels:** `validation`, `data-quality`, `norway`

**Description:**
Norwegian phone numbers should follow E.164 format or local format.

**Formats:**
- Local: 8 digits (12345678)
- International: +47 12345678

**Implementation:**
```json
{
  "field": "customer_phone",
  "meta": {
    "validation": {
      "_or": [
        {
          "customer_phone": {
            "_regex": "^\\d{8}$"
          }
        },
        {
          "customer_phone": {
            "_regex": "^\\+47\\s?\\d{8}$"
          }
        }
      ]
    },
    "validation_message": "Ugyldig telefonnummer. Format: 12345678 eller +47 12345678"
  }
}
```

**Estimated Effort:** 2-3 hours

---

### Issue #10: [HIGH] Add status transition validation

**Priority:** P1 - High
**Labels:** `validation`, `workflow`, `business-logic`

**Description:**
Prevent invalid status transitions and enforce workflow rules.

**Business Rules:**
1. Cannot set status="Ferdig" without mottakskontroll="Godkjent"
2. Cannot set klar_for_henting=true without teknisk_klargjoring date
3. Cannot change dealership_id if solgt=true
4. Cannot set solgt=true without customer_name and customer_phone

**Implementation:**
Create custom Directus hook:

```javascript
// extensions/hooks/workflow-validation/index.js
export default ({ filter }, { services, exceptions }) => {
  const { ItemsService } = services;
  const { InvalidPayloadException } = exceptions;

  filter('cars.items.update', async (input, meta, context) => {
    const { accountability, schema } = context;
    const carsService = new ItemsService('cars', { schema, accountability });

    // Get current item state
    const currentItem = await carsService.readOne(meta.keys[0]);

    // Rule 1: Cannot finish without approved reception check
    if (input.status === 'Ferdig' && currentItem.mottakskontroll !== 'Godkjent') {
      throw new InvalidPayloadException(
        'Kan ikke sette status til Ferdig uten godkjent mottakskontroll'
      );
    }

    // Rule 2: Cannot mark ready for pickup without technical prep
    if (input.klar_for_henting === true && !currentItem.teknisk_klargjoring) {
      throw new InvalidPayloadException(
        'Kan ikke merke klar for henting uten teknisk klargjøring'
      );
    }

    // Rule 3: Cannot change dealership if sold
    if (input.dealership_id && currentItem.solgt === true) {
      throw new InvalidPayloadException(
        'Kan ikke endre forhandler for solgte biler'
      );
    }

    // Rule 4: Cannot mark sold without customer info
    if (input.solgt === true) {
      if (!currentItem.customer_name && !input.customer_name) {
        throw new InvalidPayloadException(
          'Kundenavn er påkrevd for solgte biler'
        );
      }
      if (!currentItem.customer_phone && !input.customer_phone) {
        throw new InvalidPayloadException(
          'Kundetelefon er påkrevd for solgte biler'
        );
      }
    }

    return input;
  });
};
```

**Estimated Effort:** 6-8 hours

---

### Issue #11: [MEDIUM] Fix orphaned file associations

**Priority:** P2 - Medium
**Labels:** `database`, `files`, `cleanup`

**Description:**
`cars_files` junction table has `ON DELETE SET NULL`, creating orphaned records.

**Solution:**
Change to `ON DELETE CASCADE` for proper cleanup.

**Migration:**
```sql
ALTER TABLE cars_files
DROP CONSTRAINT IF EXISTS cars_files_cars_id_foreign;

ALTER TABLE cars_files
ADD CONSTRAINT cars_files_cars_id_foreign
  FOREIGN KEY (cars_id)
  REFERENCES cars(id)
  ON DELETE CASCADE;

ALTER TABLE cars_files
DROP CONSTRAINT IF EXISTS cars_files_directus_files_id_foreign;

ALTER TABLE cars_files
ADD CONSTRAINT cars_files_directus_files_id_foreign
  FOREIGN KEY (directus_files_id)
  REFERENCES directus_files(id)
  ON DELETE CASCADE;
```

**Estimated Effort:** 2-3 hours

---

### Issue #12: [MEDIUM] Add unique constraint on dealership_code

**Priority:** P2 - Medium
**Labels:** `database`, `data-integrity`

**Migration:**
```sql
-- Check for duplicates
SELECT dealership_code, COUNT(*)
FROM dealership
GROUP BY dealership_code
HAVING COUNT(*) > 1;

-- Add constraint
ALTER TABLE dealership
ADD CONSTRAINT dealership_code_unique UNIQUE (dealership_code);
```

**Estimated Effort:** 2 hours

---

## Sprint 3: Missing Features (Week 3-4)

### Issue #13: [FEATURE] Implement audit logging

**Priority:** P1 - High
**Labels:** `feature`, `compliance`, `audit`

**Description:**
Add comprehensive audit trail for all critical operations.

**Requirements:**
- Log all car status changes
- Log all deletions/archives
- Log password resets
- Log dealership changes
- Track who made changes and when

**Implementation Options:**
1. Use Directus Revisions (built-in)
2. Custom audit log collection
3. External audit service (Sentry, LogRocket)

**Estimated Effort:** 16-20 hours

---

### Issue #14: [FEATURE] Create parts inventory collection

**Priority:** P2 - Medium
**Labels:** `feature`, `inventory`

**Description:**
Currently `delelager` is just a UI group. Create actual parts inventory tracking.

**Schema:**
```javascript
{
  collection: "parts_inventory",
  fields: [
    "id",
    "part_number",
    "part_name",
    "quantity_available",
    "quantity_ordered",
    "supplier",
    "cost",
    "car_id" // M2O to cars
  ]
}
```

**Estimated Effort:** 12-16 hours

---

### Issue #15: [FEATURE] Add service history collection

**Priority:** P2 - Medium
**Labels:** `feature`, `service-tracking`

**Description:**
Track what services were performed on each car.

**Schema:**
```javascript
{
  collection: "service_history",
  fields: [
    "id",
    "car_id", // M2O to cars
    "service_type", // dropdown
    "performed_by", // M2O to users
    "performed_date",
    "notes",
    "cost",
    "parts_used" // M2M to parts_inventory
  ]
}
```

**Estimated Effort:** 12-16 hours

---

## Sprint 4: Production Hardening (Week 4-5)

### Issue #16: [INFRA] Set up automated backups

**Priority:** P1 - High
**Labels:** `infrastructure`, `backup`, `disaster-recovery`

**Requirements:**
- Daily automated backups
- Backup retention policy (30 days)
- Test restore process
- Document recovery procedure

**Estimated Effort:** 8 hours

---

### Issue #17: [INFRA] Implement monitoring and error tracking

**Priority:** P1 - High
**Labels:** `infrastructure`, `monitoring`, `sentry`

**Tasks:**
- [ ] Set up Sentry integration
- [ ] Configure error alerts
- [ ] Set up performance monitoring
- [ ] Create uptime monitoring
- [ ] Document incident response

**Estimated Effort:** 6-8 hours

---

### Issue #18: [INFRA] Add database indexes for performance

**Priority:** P2 - Medium
**Labels:** `infrastructure`, `performance`, `database`

**Indexes needed:**
```sql
CREATE INDEX idx_cars_vin ON cars(vin);
CREATE INDEX idx_cars_order_number ON cars(order_number);
CREATE INDEX idx_cars_status ON cars(status);
CREATE INDEX idx_cars_dealership_id ON cars(dealership_id);
CREATE INDEX idx_cars_kjennemerke ON cars(kjennemerke);
CREATE INDEX idx_cars_solgt ON cars(solgt);
CREATE INDEX idx_cars_klar_for_henting ON cars(klar_for_henting);
```

**Estimated Effort:** 2-3 hours

---

### Issue #19: [SECURITY] Enable 2FA for admin and sales roles

**Priority:** P1 - High
**Labels:** `security`, `authentication`

**Tasks:**
- [ ] Enable 2FA in Directus settings
- [ ] Enforce for admin role
- [ ] Enforce for sales roles
- [ ] Document setup process
- [ ] Train users

**Estimated Effort:** 4 hours

---

### Issue #20: [DOCS] Create production deployment guide

**Priority:** P1 - High
**Labels:** `documentation`, `deployment`

**Contents:**
- Environment setup
- Database migration process
- Backup and restore procedures
- Monitoring setup
- Incident response
- User onboarding
- Troubleshooting guide

**Estimated Effort:** 8-12 hours

---

## Summary

**Total Issues:** 20
**Critical (P0):** 7 issues - Sprint 1
**High (P1):** 8 issues - Sprints 2-4
**Medium (P2):** 5 issues - Sprints 3-4

**Total Estimated Effort:** 120-160 hours (3-5 weeks)

**Priority Order:**
1. Sprint 1 (Week 1): Critical security and data integrity - MUST DO FIRST
2. Sprint 2 (Week 2): Data validation and quality
3. Sprint 3 (Week 3-4): Missing features
4. Sprint 4 (Week 4-5): Production hardening

**Next Steps:**
1. Review and prioritize issues
2. Create issues in GitHub Project
3. Set up test environment
4. Plan production migration
5. Execute sprints in order

