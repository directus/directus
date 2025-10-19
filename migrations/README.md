# Database Migrations

SQL migrations for DirectApp schema changes.

## 📋 Migration List

| # | File | Beskrivelse | Status |
|---|------|-------------|--------|
| 000 | `000_create_base_collections.sql` | Opprett base dealership og cars tabeller | ✅ Kjørt 2025-10-19 |
| 001 | `001_extend_dealership.sql` | Utvid dealership med multi-site felt | ✅ Kjørt 2025-10-19 |
| 002 | `002_add_dealership_to_users.sql` | Legg til dealership_id på users (job_role) | ✅ Kjørt 2025-10-19 |
| 003 | `003_extend_cars_workflow.sql` | Utvid cars med alle workflow-felt | ✅ Kjørt 2025-10-19 |
| 004 | `004_create_notifications.sql` | Lag notifications collection | ✅ Kjørt 2025-10-19 |
| 005 | `005_create_resource_management.sql` | Lag generisk ressursstyring | ✅ Kjørt 2025-10-19 |

---

## 🚀 Kjøre Migrations

### Manuelt (via psql)

```bash
# Koble til database
docker exec -it directapp-db psql -U directus -d directus

# Kjør migration
\i /migrations/001_extend_dealership.sql
```

### Via Directus CLI (anbefalt)

```bash
# Kjør alle migrations
for f in migrations/*.sql; do
  npx directus database migrate --file "$f"
done
```

---

## 📝 Migrationsrekkefølge

**VIKTIG:** Kjør i rekkefølge 001 → 002 → 003 → 004 → 005 pga foreign key dependencies.

### Dependencies:
- `002` krever `001` (dealership må eksistere før user.dealership_id)
- `003` krever `001` + `002` (cars trenger dealership og users)
- `004` krever `002` + `003` (notifications trenger users og cars)
- `005` krever `001` + `002` + `003` (resource_bookings trenger dealership, users, cars)

---

## ✅ Testing Migrations

Etter hver migration:

```sql
-- Sjekk at tabeller eksisterer
\dt

-- Sjekk kolonner
\d+ dealership
\d+ directus_users
\d+ cars
\d+ notifications
\d+ resource_types
\d+ resource_sharing
\d+ resource_capacities
\d+ resource_bookings

-- Sjekk indexes
\di

-- Sjekk constraints
SELECT conname, contype FROM pg_constraint WHERE conrelid = 'cars'::regclass;
```

---

## 🔄 Rollback Plan

Hvis noe går galt:

```sql
-- 005: Drop resource management
DROP TABLE IF EXISTS resource_bookings CASCADE;
DROP TABLE IF EXISTS resource_capacities CASCADE;
DROP TABLE IF EXISTS resource_sharing CASCADE;
DROP TABLE IF EXISTS resource_types CASCADE;
DROP FUNCTION IF EXISTS update_resource_capacity() CASCADE;

-- 004: Drop notifications
DROP TABLE IF EXISTS notifications CASCADE;

-- 003: Revert cars extensions
ALTER TABLE cars
  DROP COLUMN IF EXISTS dealership_id,
  DROP COLUMN IF EXISTS prep_center_id,
  -- ... (list all new columns)

-- 002: Revert users extensions
ALTER TABLE directus_users
  DROP COLUMN IF EXISTS dealership_id,
  DROP COLUMN IF EXISTS role,
  DROP COLUMN IF EXISTS is_productive,
  DROP COLUMN IF EXISTS hours_per_day;

-- 001: Revert dealership extensions
ALTER TABLE dealership
  DROP COLUMN IF EXISTS dealership_type,
  DROP COLUMN IF EXISTS brand,
  -- ... (list all new columns)
```

---

## 📊 Post-Migration Tasks

Etter alle migrations er kjørt:

1. **Export schema snapshot**
   ```bash
   ./schema/scripts/export.sh dev
   ```

2. **Update Directus collections** (i admin UI):
   - Legg til translations for nye felt
   - Sett opp interfaces (dropdowns, calendars, etc)
   - Konfigurer display templates
   - Sett opp layouts per rolle

3. **Seed initial data**:
   ```sql
   -- Opprett forhandlere
   INSERT INTO dealership (dealership_number, dealership_name, brand, ...) VALUES ...

   -- Opprett test-brukere
   INSERT INTO directus_users (email, dealership_id, role, ...) VALUES ...
   ```

4. **Update permissions** (Issue #5):
   - Legg til dealership_id filter på alle permissions
   - Test multi-tenancy isolation

---

## 🎯 Related Issues

- Issue #20: Run database migrations
- Issue #21: Setup initial dealerships
- Issue #22: Configure Directus UI for new collections
- Issue #23: Seed test data
- Issue #5: Implement dealership isolation (permissions)

---

**Last Updated:** 2025-10-19
