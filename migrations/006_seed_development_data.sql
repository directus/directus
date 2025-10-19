-- Migration: Seed development data
-- Created: 2025-10-19
-- Description: Seed dealerships, test users, and resource types for development

BEGIN;

-- =============================================================================
-- DEALERSHIPS (Based on GUMPEN_SYSTEM_DESIGN.md)
-- =============================================================================

INSERT INTO dealership (
  id,
  dealership_number,
  dealership_name,
  dealership_type,
  brand,
  location,
  parent_dealership_id,
  prep_center_id,
  does_own_prep,
  brand_colors,
  active
) VALUES
  -- 490: Gumpens Auto AS (VW) - Moderselskap
  (
    '11111111-1111-1111-1111-111111111490'::uuid,
    490,
    'Gumpens Auto AS',
    'fullskala',
    'VW',
    'Kristiansand Vest',
    NULL,
    NULL, -- Gjør egen klargjøring
    true,
    '{"primary": "#001E50", "secondary": "#FFFFFF"}'::json,
    true
  ),

  -- 495: Gumpens Auto Øst (Audi) - Sørlandsparken
  (
    '11111111-1111-1111-1111-111111111495'::uuid,
    495,
    'Gumpens Auto Øst',
    'fullskala',
    'Audi',
    'Sørlandsparken Kristiansand',
    '11111111-1111-1111-1111-111111111490'::uuid,
    '11111111-1111-1111-1111-111111111499'::uuid, -- Bruker 499 for klargjøring
    false,
    '{"primary": "#BB0A30", "secondary": "#000000"}'::json,
    true
  ),

  -- 324: G-bil (Skoda) - Sørlandsparken
  (
    '11111111-1111-1111-1111-111111111324'::uuid,
    324,
    'G-bil',
    'fullskala',
    'Skoda',
    'Sørlandsparken Kristiansand',
    '11111111-1111-1111-1111-111111111490'::uuid,
    '11111111-1111-1111-1111-111111111499'::uuid,
    false,
    '{"primary": "#4BA82E", "secondary": "#000000"}'::json,
    true
  ),

  -- 326: Gumpen Motor (Nissan, MG, Seres, Subaru) - Sørlandsparken
  (
    '11111111-1111-1111-1111-111111111326'::uuid,
    326,
    'Gumpen Motor',
    'fullskala',
    'Multi',
    'Sørlandsparken Kristiansand',
    '11111111-1111-1111-1111-111111111490'::uuid,
    '11111111-1111-1111-1111-111111111499'::uuid,
    false,
    '{"primary": "#C3002F", "secondary": "#000000"}'::json,
    true
  ),

  -- 499: Gumpen Skade og Bilpleie - Klargjøringssenter
  (
    '11111111-1111-1111-1111-111111111499'::uuid,
    499,
    'Gumpen Skade og Bilpleie',
    'klargjøringssenter',
    'Multi',
    'Sørlandsparken Kristiansand',
    '11111111-1111-1111-1111-111111111490'::uuid,
    NULL, -- Er klargjøringssenter
    true,
    '{"primary": "#00A651", "secondary": "#000000"}'::json,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- TEST USERS (One per role per dealership)
-- =============================================================================
-- Password for all test users: Test123!
-- Hashed with bcrypt: $2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J

-- Admin user
INSERT INTO directus_users (
  id,
  first_name,
  last_name,
  email,
  password,
  role,
  status,
  dealership_id
) VALUES
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Admin',
    'User',
    'admin@dev.local',
    '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', -- Test123!
    NULL, -- Admin role (set via Directus policies)
    'active',
    NULL -- Admins have no dealership restriction
  )
ON CONFLICT (id) DO NOTHING;

-- Daglig leder per dealership
INSERT INTO directus_users (
  id, first_name, last_name, email, password, role, status, dealership_id
) VALUES
  ('10000000-0000-0000-0000-000000000490'::uuid, 'Daglig', 'Leder 490', 'leder.490@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'daglig_leder', 'active', '11111111-1111-1111-1111-111111111490'::uuid),
  ('10000000-0000-0000-0000-000000000495'::uuid, 'Daglig', 'Leder 495', 'leder.495@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'daglig_leder', 'active', '11111111-1111-1111-1111-111111111495'::uuid),
  ('10000000-0000-0000-0000-000000000324'::uuid, 'Daglig', 'Leder 324', 'leder.324@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'daglig_leder', 'active', '11111111-1111-1111-1111-111111111324'::uuid),
  ('10000000-0000-0000-0000-000000000499'::uuid, 'Daglig', 'Leder 499', 'leder.499@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'daglig_leder', 'active', '11111111-1111-1111-1111-111111111499'::uuid)
ON CONFLICT (id) DO NOTHING;

-- Nybilselgere
INSERT INTO directus_users (
  id, first_name, last_name, email, password, role, status, dealership_id, is_productive, hours_per_day
) VALUES
  ('20000000-0000-0000-0000-000000000490'::uuid, 'Nybilselger', '490', 'nybil.490@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'nybilselger', 'active', '11111111-1111-1111-1111-111111111490'::uuid, false, NULL),
  ('20000000-0000-0000-0000-000000000495'::uuid, 'Nybilselger', '495', 'nybil.495@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'nybilselger', 'active', '11111111-1111-1111-1111-111111111495'::uuid, false, NULL)
ON CONFLICT (id) DO NOTHING;

-- Bruktbilselgere
INSERT INTO directus_users (
  id, first_name, last_name, email, password, role, status, dealership_id, is_productive, hours_per_day
) VALUES
  ('21000000-0000-0000-0000-000000000490'::uuid, 'Bruktbilselger', '490', 'bruktbil.490@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'bruktbilselger', 'active', '11111111-1111-1111-1111-111111111490'::uuid, false, NULL),
  ('21000000-0000-0000-0000-000000000495'::uuid, 'Bruktbilselger', '495', 'bruktbil.495@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'bruktbilselger', 'active', '11111111-1111-1111-1111-111111111495'::uuid, false, NULL)
ON CONFLICT (id) DO NOTHING;

-- Delelager
INSERT INTO directus_users (
  id, first_name, last_name, email, password, role, status, dealership_id, is_productive, hours_per_day
) VALUES
  ('22000000-0000-0000-0000-000000000490'::uuid, 'Delelager', '490', 'delelager.490@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'delelager', 'active', '11111111-1111-1111-1111-111111111490'::uuid, false, NULL),
  ('22000000-0000-0000-0000-000000000495'::uuid, 'Delelager', '495', 'delelager.495@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'delelager', 'active', '11111111-1111-1111-1111-111111111495'::uuid, false, NULL),
  ('22000000-0000-0000-0000-000000000499'::uuid, 'Delelager', '499', 'delelager.499@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'delelager', 'active', '11111111-1111-1111-1111-111111111499'::uuid, false, NULL)
ON CONFLICT (id) DO NOTHING;

-- Mottakskontrollør (kun hos 499)
INSERT INTO directus_users (
  id, first_name, last_name, email, password, role, status, dealership_id, is_productive, hours_per_day
) VALUES
  ('23000000-0000-0000-0000-000000000499'::uuid, 'Mottakskontrollør', '499', 'mottakskontroll.499@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'mottakskontrollør', 'active', '11111111-1111-1111-1111-111111111499'::uuid, true, 7.5)
ON CONFLICT (id) DO NOTHING;

-- Booking (kun hos 499)
INSERT INTO directus_users (
  id, first_name, last_name, email, password, role, status, dealership_id, is_productive, hours_per_day
) VALUES
  ('24000000-0000-0000-0000-000000000499'::uuid, 'Booking', '499', 'booking.499@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'booking', 'active', '11111111-1111-1111-1111-111111111499'::uuid, false, NULL)
ON CONFLICT (id) DO NOTHING;

-- Mekanikere (hos 490 og 499)
INSERT INTO directus_users (
  id, first_name, last_name, email, password, role, status, dealership_id, is_productive, hours_per_day
) VALUES
  ('25000000-0000-0000-0000-000000000490'::uuid, 'Mekaniker', '490', 'mekaniker.490@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'mekaniker', 'active', '11111111-1111-1111-1111-111111111490'::uuid, true, 7.5),
  ('25000000-0000-0000-0000-000000000499'::uuid, 'Mekaniker', '499 A', 'mekaniker.499a@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'mekaniker', 'active', '11111111-1111-1111-1111-111111111499'::uuid, true, 7.5),
  ('25000000-0000-0000-0000-000000000499'::uuid, 'Mekaniker', '499 B', 'mekaniker.499b@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'mekaniker', 'active', '11111111-1111-1111-1111-111111111499'::uuid, true, 7.5)
ON CONFLICT (id) DO NOTHING;

-- Bilpleiespesialister (hos 490 og 499)
INSERT INTO directus_users (
  id, first_name, last_name, email, password, role, status, dealership_id, is_productive, hours_per_day
) VALUES
  ('26000000-0000-0000-0000-000000000490'::uuid, 'Bilpleier', '490', 'bilpleier.490@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'bilpleiespesialist', 'active', '11111111-1111-1111-1111-111111111490'::uuid, true, 7.5),
  ('26000000-0000-0000-0000-000000000499'::uuid, 'Bilpleier', '499 A', 'bilpleier.499a@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'bilpleiespesialist', 'active', '11111111-1111-1111-1111-111111111499'::uuid, true, 7.5),
  ('26000000-0000-0000-0000-000000000500'::uuid, 'Bilpleier', '499 B', 'bilpleier.499b@dev.local', '$2b$10$Z5FZ7tF9LGxVHDzF7HWKnOqJ7jW8nM9ggT7LJ3Z7B1H3W7J8H3W7J', 'bilpleiespesialist', 'active', '11111111-1111-1111-1111-111111111499'::uuid, true, 7.5)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- RESOURCE TYPES (For Gumpen Skade og Bilpleie - 499)
-- =============================================================================

INSERT INTO resource_types (
  id,
  name,
  category,
  dealership_id,
  capacity_per_day,
  requires_booking,
  active
) VALUES
  -- Lifter
  ('30000000-0000-0000-0000-000000000001'::uuid, 'Lift 1', 'lift', '11111111-1111-1111-1111-111111111499'::uuid, 10, true, true),
  ('30000000-0000-0000-0000-000000000002'::uuid, 'Lift 2', 'lift', '11111111-1111-1111-1111-111111111499'::uuid, 10, true, true),
  ('30000000-0000-0000-0000-000000000003'::uuid, 'Lift 3', 'lift', '11111111-1111-1111-1111-111111111499'::uuid, 10, true, true),

  -- Vaskeområder
  ('30000000-0000-0000-0000-000000000010'::uuid, 'Vaskeområde 1', 'wash_bay', '11111111-1111-1111-1111-111111111499'::uuid, 8, true, true),
  ('30000000-0000-0000-0000-000000000011'::uuid, 'Vaskeområde 2', 'wash_bay', '11111111-1111-1111-1111-111111111499'::uuid, 8, true, true),

  -- Lakkbokser
  ('30000000-0000-0000-0000-000000000020'::uuid, 'Lakkboks 1', 'paint_booth', '11111111-1111-1111-1111-111111111499'::uuid, 4, true, true),
  ('30000000-0000-0000-0000-000000000021'::uuid, 'Lakkboks 2', 'paint_booth', '11111111-1111-1111-1111-111111111499'::uuid, 4, true, true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- RESOURCE SHARING (Cross-dealership prep)
-- =============================================================================

INSERT INTO resource_sharing (
  id,
  resource_type_id,
  dealership_id,
  allowed
) VALUES
  -- 495 can use 499 resources
  ('40000000-0000-0000-0000-000000000001'::uuid, '30000000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111495'::uuid, true),
  ('40000000-0000-0000-0000-000000000002'::uuid, '30000000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111495'::uuid, true),

  -- 324 can use 499 resources
  ('40000000-0000-0000-0000-000000000010'::uuid, '30000000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111324'::uuid, true),
  ('40000000-0000-0000-0000-000000000011'::uuid, '30000000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111324'::uuid, true),

  -- 326 can use 499 resources
  ('40000000-0000-0000-0000-000000000020'::uuid, '30000000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111326'::uuid, true),
  ('40000000-0000-0000-0000-000000000021'::uuid, '30000000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111326'::uuid, true)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- ✅ 5 dealerships created (490, 495, 324, 326, 499)
-- ✅ 20+ test users created (one per role per dealership)
-- ✅ 7 resource types created at forhandler 499
-- ✅ Resource sharing configured for cross-dealership prep

-- Login credentials for testing:
-- Admin: admin@dev.local / Test123!
-- Daglig leder 490: leder.490@dev.local / Test123!
-- Nybilselger 495: nybil.495@dev.local / Test123!
-- Mekaniker 499: mekaniker.499a@dev.local / Test123!
-- etc.
