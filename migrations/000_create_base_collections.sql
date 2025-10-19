-- Migration: Create base collections for DirectApp
-- Created: 2025-10-19
-- Description: Creates the foundational dealership and cars tables

BEGIN;

-- ============================================
-- DEALERSHIP Collection (Base)
-- ============================================
CREATE TABLE IF NOT EXISTS dealership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status VARCHAR(255) DEFAULT 'draft',
  sort INTEGER DEFAULT NULL,
  user_created UUID REFERENCES directus_users(id) ON DELETE SET NULL,
  date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_updated UUID REFERENCES directus_users(id) ON DELETE SET NULL,
  date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Core dealership fields
  dealership_number INTEGER UNIQUE NOT NULL,
  dealership_name VARCHAR(255) NOT NULL,
  location VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add to Directus collections metadata
INSERT INTO directus_collections (collection, icon, note, display_template, hidden, singleton, translations, archive_field, archive_app_filter, archive_value, unarchive_value, sort_field, accountability, color, item_duplication_fields, sort, "group", collapse, preview_url, versioning)
VALUES ('dealership', 'store', 'Bilforhandlere i Gumpen-nettverket', '{{dealership_number}} - {{dealership_name}}', false, false, NULL, 'status', true, 'archived', 'draft', 'sort', 'all', NULL, NULL, NULL, NULL, 'open', NULL, false)
ON CONFLICT (collection) DO NOTHING;

-- ============================================
-- CARS Collection (Base)
-- ============================================
CREATE TABLE IF NOT EXISTS cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status VARCHAR(255) DEFAULT 'draft',
  sort INTEGER DEFAULT NULL,
  user_created UUID REFERENCES directus_users(id) ON DELETE SET NULL,
  date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_updated UUID REFERENCES directus_users(id) ON DELETE SET NULL,
  date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Core car identification
  vin VARCHAR(17) UNIQUE NOT NULL,
  license_plate VARCHAR(20),

  -- Basic car details
  brand VARCHAR(100),
  model VARCHAR(100),
  model_year INTEGER,
  color VARCHAR(100),

  -- Order/Sales info
  order_number VARCHAR(100) UNIQUE,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add to Directus collections metadata
INSERT INTO directus_collections (collection, icon, note, display_template, hidden, singleton, translations, archive_field, archive_app_filter, archive_value, unarchive_value, sort_field, accountability, color, item_duplication_fields, sort, "group", collapse, preview_url, versioning)
VALUES ('cars', 'directions_car', 'Biler (ny og brukt)', '{{brand}} {{model}} ({{vin}})', false, false, NULL, 'status', true, 'archived', 'draft', 'sort', 'all', NULL, NULL, NULL, NULL, 'open', NULL, false)
ON CONFLICT (collection) DO NOTHING;

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_dealership_number ON dealership(dealership_number);
CREATE INDEX IF NOT EXISTS idx_dealership_name ON dealership(dealership_name);

CREATE INDEX IF NOT EXISTS idx_cars_vin ON cars(vin);
CREATE INDEX IF NOT EXISTS idx_cars_license_plate ON cars(license_plate);
CREATE INDEX IF NOT EXISTS idx_cars_order_number ON cars(order_number);
CREATE INDEX IF NOT EXISTS idx_cars_brand ON cars(brand);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE dealership IS 'Bilforhandlere i Gumpen Auto-nettverket';
COMMENT ON COLUMN dealership.dealership_number IS 'Unikt forhandlernummer (f.eks. 490, 495, 499)';
COMMENT ON COLUMN dealership.dealership_name IS 'Forhandlernavn (f.eks. Gumpens Auto AS, G-bil)';

COMMENT ON TABLE cars IS 'Bil-objekter (nybil og bruktbil)';
COMMENT ON COLUMN cars.vin IS 'Vehicle Identification Number (ISO 3779) - 17 tegn';
COMMENT ON COLUMN cars.license_plate IS 'Norsk registreringsnummer';

COMMIT;
