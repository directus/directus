# Directus UI Configuration

**Issue #22**: Configure Directus UI for collections

## Overview

This document describes the UI configuration applied to DirectApp collections via the `configure_ui.sh` script. The configuration cannot be done via SQL migrations because Directus field metadata requires specific JSON structures and API calls.

## Configuration Method

**Script**: `migrations/configure_ui.sh`

The script uses the Directus Fields API to configure:
- Field interfaces (how fields are edited)
- Field displays (how fields are shown)
- Field options (dropdowns, placeholders, templates)
- Relationship templates (how related items are displayed)

## Collections Configured

### 1. Dealership Collection

**Display Template**: `{{dealership_number}} - {{dealership_name}}`

| Field | Interface | Display | Purpose |
|-------|-----------|---------|---------|
| `dealership_number` | input | formatted-value | FNR input with placeholder |
| `dealership_name` | input | formatted-value | Name input |
| `dealership_type` | select-dropdown | labels | Dropdown: fullskala, klargjøringssenter, verksted, outlet |
| `brand` | select-dropdown | labels | Dropdown: VW, Audi, Skoda, Nissan, MG, Seres, Subaru, Multi |
| `parent_dealership_id` | select-dropdown-m2o | related-values | Shows "490 - Gumpens Auto AS" |
| `prep_center_id` | select-dropdown-m2o | related-values | Shows "499 - Gumpen Skade..." |
| `does_own_prep` | boolean | boolean | Checkbox with label |
| `brand_colors` | input-code | raw | JSON editor |
| `logo` | file-image | image | Image uploader |
| `location` | input | formatted-value | Location input |
| `active` | boolean | boolean | Active checkbox |

**Norwegian Labels**:
- Fullskala forhandler
- Klargjøringssenter
- Verksted
- Outlet

### 2. Cars Collection

**Display Template**: `{{brand}} {{model}} ({{vin}})`

| Field | Interface | Display | Purpose |
|-------|-----------|---------|---------|
| `vin` | input | formatted-value | 17-character VIN |
| `license_plate` | input | formatted-value | Registreringsnummer |
| `brand` | input | formatted-value | Bilmerke |
| `model` | input | formatted-value | Modell |
| `dealership_id` | select-dropdown-m2o | related-values | Shows "490 - Gumpens Auto AS" |
| `prep_center_id` | select-dropdown-m2o | related-values | Shows prep center name |
| `seller_id` | select-dropdown-m2o | related-values | Shows "John Doe (john@example.com)" |
| `assigned_mechanic_id` | select-dropdown-m2o | related-values | Shows "Jane Smith" |
| `assigned_detailer_id` | select-dropdown-m2o | related-values | Shows detailer name |
| `car_type` | select-dropdown | labels | Nybil / Bruktbil |
| `status` | select-dropdown | labels | Workflow status |

**Norwegian Labels**:
- Nybil
- Bruktbil

### 3. Directus Users Collection

| Field | Interface | Display | Purpose |
|-------|-----------|---------|---------|
| `dealership_id` | select-dropdown-m2o | related-values | Shows dealership |
| `job_role` | select-dropdown | labels | Norwegian job roles |
| `is_productive` | boolean | boolean | Produktiv rolle checkbox |
| `hours_per_day` | input | formatted-value | Timer per dag |

**Norwegian Job Roles**:
- Daglig leder
- Salgsjef
- Nybilselger
- Bruktbilselger
- Kundemottaker/Booking
- Garantimedarbeider
- Mottakskontrollør
- Delelager
- Mekaniker
- Bilpleiespesialist
- Admin

### 4. Resource Types Collection

**Display Template**: `{{code}} - {{name}}`

| Field | Interface | Display | Purpose |
|-------|-----------|---------|---------|
| `code` | input | formatted-value | Unique code |
| `name` | input | formatted-value | Display name |
| `icon` | select-icon | formatted-value | Icon picker |
| `color` | select-color | color | Color picker |
| `is_productive` | boolean | boolean | Produktiv ressurs |
| `bookable` | boolean | boolean | Kan bookes |
| `requires_assignment` | boolean | boolean | Krever tildeling |

### 5. Resource Sharing Collection

| Field | Interface | Display | Purpose |
|-------|-----------|---------|---------|
| `provider_dealership_id` | select-dropdown-m2o | related-values | Provider dealership |
| `consumer_dealership_id` | select-dropdown-m2o | related-values | Consumer dealership |
| `resource_type_id` | select-dropdown-m2o | related-values | Resource type name |
| `enabled` | boolean | boolean | Aktivert checkbox |
| `priority` | input | formatted-value | Priority (1=highest) |
| `max_hours_per_week` | input | formatted-value | Max hours per week |

### 6. Notifications Collection

| Field | Interface | Display | Purpose |
|-------|-----------|---------|---------|
| `user_id` | select-dropdown-m2o | related-values | Shows user name |
| `car_id` | select-dropdown-m2o | related-values | Shows car with VIN |
| `type` | select-dropdown | labels | Notification type |
| `read` | boolean | boolean | Lest checkbox |

### 7. Resource Bookings Collection

| Field | Interface | Display | Purpose |
|-------|-----------|---------|---------|
| `dealership_id` | select-dropdown-m2o | related-values | Dealership |
| `car_id` | select-dropdown-m2o | related-values | Car |
| `resource_type_id` | select-dropdown-m2o | related-values | Resource type |
| `assigned_user_id` | select-dropdown-m2o | related-values | Assigned user |
| `booking_date` | datetime | datetime | Booking date |
| `status` | select-dropdown | labels | Planlagt, Pågår, Fullført, Kansellert |

**Norwegian Status Labels**:
- Planlagt (planned)
- Pågår (in_progress)
- Fullført (completed)
- Kansellert (cancelled)

### 8. Resource Capacities Collection

| Field | Interface | Display | Purpose |
|-------|-----------|---------|---------|
| `dealership_id` | select-dropdown-m2o | related-values | Dealership |
| `resource_type_id` | select-dropdown-m2o | related-values | Resource type |
| `user_id` | select-dropdown-m2o | related-values | User |
| `date` | datetime | datetime | Date |

## Running the Configuration

### Prerequisites

```bash
# Load Directus token
source directus_token.env

# Ensure Directus is running
docker compose -f docker-compose.development.yml up -d
```

### Execute Configuration

```bash
# Run the configuration script
./migrations/configure_ui.sh
```

### Expected Output

```
🔧 Configuring Directus UI...
📍 Base URL: http://localhost:8055

📦 Configuring dealership collection...
✅ dealership.dealership_number
✅ dealership.dealership_name
✅ dealership.dealership_type
...

✅ UI configuration complete!
```

## Verification

### Via SQL

```sql
-- Check field configuration
SELECT collection, field, interface, display, options
FROM directus_fields
WHERE collection = 'dealership'
ORDER BY field;

-- Check collection display templates
SELECT collection, display_template
FROM directus_collections
WHERE collection IN ('dealership', 'cars', 'resource_types');
```

### Via Directus Admin

1. Navigate to: http://localhost:8055/admin
2. Login: admin@example.com / DevPassword123!
3. Go to Content > Dealership
4. Check that:
   - Dropdowns show Norwegian labels
   - Relationship fields show readable names (not UUIDs)
   - Collection items display as "490 - Gumpens Auto AS"

## Key Benefits

### 1. Norwegian Language Support
All user-facing labels are in Norwegian, matching the target audience (Norwegian car dealerships).

### 2. Readable Relationships
Instead of seeing UUIDs like `a1b2c3d4-...`, users see:
- "490 - Gumpens Auto AS" (dealerships)
- "VW Golf (WVW1234567890)" (cars)
- "John Doe (john@example.com)" (users)

### 3. Type-Safe Dropdowns
Predefined choices prevent typos:
- Car types: nybil, bruktbil (not "new car", "used car", "nye", etc.)
- Status values: exact workflow states from migration 003
- Job roles: standardized Norwegian role names

### 4. Appropriate Input Widgets
- Booleans → Checkboxes
- Dates → Date pickers
- JSON → Code editor
- Images → Image uploader
- Colors → Color picker

## Maintenance

### Adding New Fields

When adding new fields via migrations, update `configure_ui.sh`:

```bash
update_field "collection_name" "field_name" \
  "interface_type" "display_type" \
  '{"options": "json"}' \
  '["special", "flags"]'
```

### Updating Dropdown Choices

Edit the choices array in `configure_ui.sh`:

```bash
'{"choices": [
  {"text": "Norwegian Label", "value": "database_value"},
  {"text": "Another Option", "value": "another_value"}
]}'
```

Then re-run the script.

## Related Files

- `migrations/configure_ui.sh` - Main configuration script
- `migrations/008_configure_ui_display_templates.sql` - Failed SQL attempt (deprecated)
- `fix_ui_displays.sh` - Earlier minimal version (deprecated, replaced by configure_ui.sh)

## See Also

- Issue #22: Configure Directus UI for collections
- Issue #20: Run database migrations (created the schema)
- Issue #21: Setup initial dealerships (created test data)

---

**Last Updated**: 2025-10-19
**Script Version**: 1.0
**Directus Version**: 11.12.0
