# Critical Schema Permission Fixes

**MUST FIX BEFORE PRODUCTION DEPLOYMENT**

These are data-level permission issues found in `schema-exported/roles.json` that must be fixed in the Directus admin UI.

---

## 🔴 CRITICAL ISSUE #1: Unscoped Car Deletes

**Location:** `schema-exported/roles.json:137`

**Problem:**
```json
{
  "collection": "cars",
  "action": "delete",
  "permissions": null  // ❌ NO RESTRICTIONS!
}
```

Users with this permission can delete ANY car in the system, regardless of dealership.

**Fix in Directus UI:**

1. Go to **Settings → Access Control → Roles**
2. Find the "Booking" role (or whichever role has this permission)
3. Go to **Cars collection → Delete permission**
4. **Option A: Remove delete permission entirely** (recommended)
   - Implement soft delete instead (status="archived")

5. **Option B: Add dealership filter** (if delete is required)
   ```json
   {
     "permissions": {
       "_and": [
         {"dealership_id": {"_eq": "$CURRENT_USER.dealership_id"}},
         {"status": {"_eq": "registered"}}
       ]
     }
   }
   ```

**After fix:** Run `./schema/scripts/lint-permissions.sh prod` - should show 0 errors

---

## 🔴 CRITICAL ISSUE #2: Non-Admin Can Update Passwords/Emails

**Location:** `schema-exported/roles.json:170`

**Problem:**
```json
{
  "collection": "directus_users",
  "action": "update",
  "fields": ["password", "email", ...],
  "permissions": null  // ❌ NO RESTRICTIONS!
}
```

Non-admin users can update passwords and emails of OTHER users.

**Fix in Directus UI:**

1. Go to **Settings → Access Control → Roles**
2. For each **non-admin role**:
3. Go to **Directus Users collection → Update permission**
4. **Remove** `password` and `email` from allowed fields
5. Add permission filter:
   ```json
   {
     "permissions": {
       "id": {"_eq": "$CURRENT_USER.id"}
     }
   }
   ```

This ensures users can only update their own record, and can't change critical fields.

**After fix:** Run `./schema/scripts/lint-permissions.sh prod` - should show 0 errors

---

## ⚠️  HIGH PRIORITY: TFA Not Enforced on Admin Policies

**Locations:** `schema-exported/roles.json:88, 101, 114, 127`

**Problem:**
```json
{
  "name": "Administrator",
  "admin_access": true,
  "enforce_tfa": false  // ❌ TFA NOT REQUIRED
}
```

Admin accounts can login without Two-Factor Authentication.

**Fix in Directus UI:**

1. Go to **Settings → Access Control → Policies**
2. For EACH admin policy:
3. Enable **"Enforce Two-Factor Authentication"** checkbox
4. Save

**After fix:** All admin users will be required to set up TFA on next login.

**Verify:** Run `./schema/scripts/lint-permissions.sh prod` - should show 0 warnings

---

## How to Apply Fixes

### Step 1: Start Development Environment

```bash
cp .env.development.example .env
docker compose -f docker-compose.development.yml up
```

Wait for containers to be healthy, then go to http://localhost:8055/admin

Login: `admin@dev.local` / `DevPassword123!`

### Step 2: Fix Permissions

Follow the fixes above in the Directus admin UI.

### Step 3: Export Fixed Schema

```bash
./schema/scripts/export.sh dev
```

This creates `schema/snapshots/dev.json` with the fixed permissions.

### Step 4: Run Permission Linter

```bash
./schema/scripts/lint-permissions.sh dev
```

**Expected output:**
```
[1/5] Checking for unscoped delete permissions...
  ✓ No unscoped delete permissions found

[2/5] Checking for missing dealership_id filters...
  ✓ All non-admin permissions have dealership_id filters

[3/5] Checking for dangerous user update permissions...
  ✓ No dangerous user update permissions found

[4/5] Checking TFA enforcement on admin policies...
  ✓ All admin policies enforce TFA

[5/5] Checking for duplicate permission rules...
  ✓ No duplicate permission rules found

=== Summary ===
Errors: 0
Warnings: 0

✓ PASSED - No security issues found
```

### Step 5: Commit Fixed Schema

```bash
git add schema/snapshots/dev.json
git commit -m "Fix critical permission issues (unscoped deletes, user updates, TFA)"
git push
```

### Step 6: Apply to Staging/Production

**Staging:**
```bash
./schema/scripts/apply.sh staging
./schema/scripts/lint-permissions.sh staging
```

**Production:**
```bash
./schema/scripts/apply.sh prod
./schema/scripts/lint-permissions.sh prod
```

---

## Additional Recommended Fixes

While fixing the critical issues above, also consider:

### 1. Add Unique Constraints

```sql
-- In Directus admin or via migration
ALTER TABLE cars ADD CONSTRAINT cars_vin_unique UNIQUE (vin);
ALTER TABLE cars ADD CONSTRAINT cars_order_number_unique UNIQUE (order_number);
```

### 2. Add Dealership Isolation to ALL Collections

For every non-admin role, on every collection that has `dealership_id`:

**Read/Update/Create permissions:**
```json
{
  "permissions": {
    "dealership_id": {"_eq": "$CURRENT_USER.dealership_id"}
  }
}
```

**Presets (for creates):**
```json
{
  "presets": {
    "dealership_id": "$CURRENT_USER.dealership_id"
  }
}
```

### 3. Add User `dealership_id` Field

```sql
-- Add dealership_id to users table
ALTER TABLE directus_users
  ADD COLUMN dealership_id UUID
  REFERENCES dealership(id)
  ON DELETE SET NULL;
```

Then in Directus UI:
1. Settings → Data Model → Directus Users
2. Add field: `dealership_id` (Many-to-One relationship to Dealership)
3. Make it required for non-admin users

---

## Verification Checklist

Before going to production, verify:

- [ ] Permission linter shows **0 errors, 0 warnings**
- [ ] Test user from Dealership A cannot see cars from Dealership B
- [ ] Test user cannot delete cars (or can only delete registered status)
- [ ] Test user cannot update another user's password/email
- [ ] All admin users have TFA enabled
- [ ] Schema exported and committed to git
- [ ] Applied to staging and tested
- [ ] Applied to production

---

## Support

If the linter still shows errors after fixes:

1. Review linter output for specific issues
2. Check `.claude/SCHEMA_ANALYSIS.md` for detailed explanations
3. Run `./schema/scripts/diff.sh dev prod` to see differences
4. Consult `MASTER_IMPLEMENTATION_PLAN.md` Phase 0 for migration scripts

---

**Priority:** 🔴 **CRITICAL - DO NOT DEPLOY WITHOUT FIXING**

**Estimated Time:** 1-2 hours to fix all issues

**Last Updated:** 2025-10-18
