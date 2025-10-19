-- Migration: Configure Directus UI display templates
-- Created: 2025-10-19
-- Description: Fix ID displays by configuring proper display templates and field metadata

BEGIN;

-- ============================================
-- UPDATE COLLECTION DISPLAY TEMPLATES
-- ============================================

-- These were already set in base migration, but ensure they're correct
UPDATE directus_collections
SET display_template = '{{dealership_number}} - {{dealership_name}}'
WHERE collection = 'dealership';

UPDATE directus_collections
SET display_template = '{{brand}} {{model}} ({{vin}})'
WHERE collection = 'cars';

-- ============================================
-- CONFIGURE FIELD INTERFACES & DISPLAYS
-- ============================================

-- Dealership fields
INSERT INTO directus_fields (collection, field, interface, display, special, options) VALUES
  ('dealership', 'dealership_number', 'input', 'formatted-value', NULL, '{"placeholder": "FNR (f.eks. 490)"}'),
  ('dealership', 'dealership_name', 'input', 'formatted-value', NULL, '{"placeholder": "Forhandlernavn"}'),
  ('dealership', 'dealership_type', 'select-dropdown', 'labels', NULL, '{"choices": [
    {"text": "Fullskala forhandler", "value": "fullskala"},
    {"text": "Klargjøringssenter", "value": "klargjøringssenter"},
    {"text": "Verksted", "value": "verksted"},
    {"text": "Outlet", "value": "outlet"}
  ]}'),
  ('dealership', 'brand', 'select-dropdown', 'labels', NULL, '{"choices": [
    {"text": "VW", "value": "VW"},
    {"text": "Audi", "value": "Audi"},
    {"text": "Skoda", "value": "Skoda"},
    {"text": "Nissan", "value": "Nissan"},
    {"text": "MG", "value": "MG"},
    {"text": "Seres", "value": "Seres"},
    {"text": "Subaru", "value": "Subaru"},
    {"text": "Multi", "value": "Multi"}
  ]}'),
  ('dealership', 'parent_dealership_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{dealership_number}} - {{dealership_name}}"}'),
  ('dealership', 'prep_center_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{dealership_number}} - {{dealership_name}}"}'),
  ('dealership', 'does_own_prep', 'boolean', 'boolean', NULL, '{"label": "Gjør egen klargjøring"}'),
  ('dealership', 'brand_colors', 'input-code', 'raw', 'cast-json', '{"language": "json"}'),
  ('dealership', 'logo', 'file-image', 'image', 'file', NULL),
  ('dealership', 'location', 'input', 'formatted-value', NULL, '{"placeholder": "By/lokasjon"}'),
  ('dealership', 'active', 'boolean', 'boolean', NULL, NULL)
ON CONFLICT (collection, field) DO UPDATE SET
  interface = EXCLUDED.interface,
  display = EXCLUDED.display,
  options = EXCLUDED.options;

-- Cars fields - critical ones for display
INSERT INTO directus_fields (collection, field, interface, display, special, options) VALUES
  ('cars', 'vin', 'input', 'formatted-value', NULL, '{"placeholder": "17-tegn VIN"}'),
  ('cars', 'license_plate', 'input', 'formatted-value', NULL, '{"placeholder": "Registreringsnummer"}'),
  ('cars', 'brand', 'input', 'formatted-value', NULL, '{"placeholder": "Bilmerke"}'),
  ('cars', 'model', 'input', 'formatted-value', NULL, '{"placeholder": "Modell"}'),
  ('cars', 'dealership_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{dealership_number}} - {{dealership_name}}"}'),
  ('cars', 'prep_center_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{dealership_number}} - {{dealership_name}}"}'),
  ('cars', 'seller_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{first_name}} {{last_name}} ({{email}})"}'),
  ('cars', 'assigned_mechanic_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{first_name}} {{last_name}}"}'),
  ('cars', 'assigned_detailer_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{first_name}} {{last_name}}"}'),
  ('cars', 'car_type', 'select-dropdown', 'labels', NULL, '{"choices": [
    {"text": "Nybil", "value": "nybil"},
    {"text": "Bruktbil", "value": "bruktbil"}
  ]}'),
  ('cars', 'status', 'select-dropdown', 'labels', NULL, '{"allowOther": false}')
ON CONFLICT (collection, field) DO UPDATE SET
  interface = EXCLUDED.interface,
  display = EXCLUDED.display,
  options = EXCLUDED.options;

-- Resource types
INSERT INTO directus_fields (collection, field, interface, display, special, options) VALUES
  ('resource_types', 'code', 'input', 'formatted-value', NULL, '{"placeholder": "Unik kode"}'),
  ('resource_types', 'name', 'input', 'formatted-value', NULL, '{"placeholder": "Visningsnavn"}'),
  ('resource_types', 'icon', 'select-icon', 'formatted-value', NULL, NULL),
  ('resource_types', 'color', 'select-color', 'color', NULL, NULL),
  ('resource_types', 'is_productive', 'boolean', 'boolean', NULL, '{"label": "Produktiv ressurs"}'),
  ('resource_types', 'bookable', 'boolean', 'boolean', NULL, '{"label": "Kan bookes"}'),
  ('resource_types', 'requires_assignment', 'boolean', 'boolean', NULL, '{"label": "Krever tildeling"}')
ON CONFLICT (collection, field) DO UPDATE SET
  interface = EXCLUDED.interface,
  display = EXCLUDED.display,
  options = EXCLUDED.options;

-- Resource sharing
INSERT INTO directus_fields (collection, field, interface, display, special, options) VALUES
  ('resource_sharing', 'provider_dealership_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{dealership_number}} - {{dealership_name}}"}'),
  ('resource_sharing', 'consumer_dealership_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{dealership_number}} - {{dealership_name}}"}'),
  ('resource_sharing', 'resource_type_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{name}}"}'),
  ('resource_sharing', 'enabled', 'boolean', 'boolean', NULL, '{"label": "Aktivert"}'),
  ('resource_sharing', 'priority', 'input', 'formatted-value', NULL, '{"placeholder": "1=høyest"}'),
  ('resource_sharing', 'max_hours_per_week', 'input', 'formatted-value', NULL, '{"placeholder": "Timer per uke"}')
ON CONFLICT (collection, field) DO UPDATE SET
  interface = EXCLUDED.interface,
  display = EXCLUDED.display,
  options = EXCLUDED.options;

-- Notifications
INSERT INTO directus_fields (collection, field, interface, display, special, options) VALUES
  ('notifications', 'user_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{first_name}} {{last_name}}"}'),
  ('notifications', 'car_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{brand}} {{model}} ({{vin}})"}'),
  ('notifications', 'type', 'select-dropdown', 'labels', NULL, '{"allowOther": false}'),
  ('notifications', 'read', 'boolean', 'boolean', NULL, '{"label": "Lest"}')
ON CONFLICT (collection, field) DO UPDATE SET
  interface = EXCLUDED.interface,
  display = EXCLUDED.display,
  options = EXCLUDED.options;

-- Resource bookings
INSERT INTO directus_fields (collection, field, interface, display, special, options) VALUES
  ('resource_bookings', 'dealership_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{dealership_number}} - {{dealership_name}}"}'),
  ('resource_bookings', 'car_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{brand}} {{model}} ({{vin}})"}'),
  ('resource_bookings', 'resource_type_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{name}}"}'),
  ('resource_bookings', 'assigned_user_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{first_name}} {{last_name}}"}'),
  ('resource_bookings', 'booking_date', 'datetime', 'datetime', 'date', NULL),
  ('resource_bookings', 'status', 'select-dropdown', 'labels', NULL, '{"choices": [
    {"text": "Planlagt", "value": "planned"},
    {"text": "Pågår", "value": "in_progress"},
    {"text": "Fullført", "value": "completed"},
    {"text": "Kansellert", "value": "cancelled"}
  ]}')
ON CONFLICT (collection, field) DO UPDATE SET
  interface = EXCLUDED.interface,
  display = EXCLUDED.display,
  options = EXCLUDED.options;

-- Resource capacities
INSERT INTO directus_fields (collection, field, interface, display, special, options) VALUES
  ('resource_capacities', 'dealership_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{dealership_number}} - {{dealership_name}}"}'),
  ('resource_capacities', 'resource_type_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{name}}"}'),
  ('resource_capacities', 'user_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{first_name}} {{last_name}}"}'),
  ('resource_capacities', 'date', 'datetime', 'datetime', 'date', NULL)
ON CONFLICT (collection, field) DO UPDATE SET
  interface = EXCLUDED.interface,
  display = EXCLUDED.display,
  options = EXCLUDED.options;

-- ============================================
-- UPDATE DIRECTUS_USERS FIELDS
-- ============================================

-- Configure the custom fields we added to directus_users
INSERT INTO directus_fields (collection, field, interface, display, special, options) VALUES
  ('directus_users', 'dealership_id', 'select-dropdown-m2o', 'related-values', 'uuid', '{"template": "{{dealership_number}} - {{dealership_name}}"}'),
  ('directus_users', 'job_role', 'select-dropdown', 'labels', NULL, '{"choices": [
    {"text": "Daglig leder", "value": "daglig_leder"},
    {"text": "Salgsjef", "value": "salgsjef"},
    {"text": "Nybilselger", "value": "nybilselger"},
    {"text": "Bruktbilselger", "value": "bruktbilselger"},
    {"text": "Kundemottaker/Booking", "value": "kundemottaker"},
    {"text": "Garantimedarbeider", "value": "garantimedarbeider"},
    {"text": "Mottakskontrollør", "value": "mottakskontrollør"},
    {"text": "Delelager", "value": "delelager"},
    {"text": "Mekaniker", "value": "mekaniker"},
    {"text": "Bilpleiespesialist", "value": "bilpleiespesialist"},
    {"text": "Admin", "value": "admin"}
  ]}'),
  ('directus_users', 'is_productive', 'boolean', 'boolean', NULL, '{"label": "Produktiv rolle"}'),
  ('directus_users', 'hours_per_day', 'input', 'formatted-value', NULL, '{"placeholder": "Timer per dag"}'  )
ON CONFLICT (collection, field) DO UPDATE SET
  interface = EXCLUDED.interface,
  display = EXCLUDED.display,
  options = EXCLUDED.options;

COMMIT;
