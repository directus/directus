-- Migration: Extend dealership collection for multi-site workflow
-- Created: 2025-10-19
-- Description: Adds fields needed for prep center logic, branding, and hierarchy

BEGIN;

-- Add new fields to dealership table
ALTER TABLE dealership
  ADD COLUMN IF NOT EXISTS dealership_type VARCHAR(50) DEFAULT 'fullskala',
  ADD COLUMN IF NOT EXISTS brand VARCHAR(50),
  ADD COLUMN IF NOT EXISTS parent_dealership_id UUID,
  ADD COLUMN IF NOT EXISTS prep_center_id UUID,
  ADD COLUMN IF NOT EXISTS does_own_prep BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS brand_colors JSON,
  ADD COLUMN IF NOT EXISTS logo UUID,
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key constraints
ALTER TABLE dealership
  ADD CONSTRAINT fk_parent_dealership
    FOREIGN KEY (parent_dealership_id)
    REFERENCES dealership(id)
    ON DELETE SET NULL,
  ADD CONSTRAINT fk_prep_center
    FOREIGN KEY (prep_center_id)
    REFERENCES dealership(id)
    ON DELETE SET NULL,
  ADD CONSTRAINT fk_logo
    FOREIGN KEY (logo)
    REFERENCES directus_files(id)
    ON DELETE SET NULL;

-- Add check constraint for dealership_type
ALTER TABLE dealership
  ADD CONSTRAINT check_dealership_type
    CHECK (dealership_type IN ('fullskala', 'klargjøringssenter', 'verksted', 'outlet'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_dealership_type ON dealership(dealership_type);
CREATE INDEX IF NOT EXISTS idx_dealership_brand ON dealership(brand);
CREATE INDEX IF NOT EXISTS idx_dealership_active ON dealership(active);
CREATE INDEX IF NOT EXISTS idx_dealership_prep_center ON dealership(prep_center_id);

-- Add comments
COMMENT ON COLUMN dealership.dealership_type IS 'Type forhandler: fullskala, klargjøringssenter, verksted, outlet';
COMMENT ON COLUMN dealership.brand IS 'Bilmerke: VW, Audi, Skoda, Nissan, MG, Seres, Subaru, Multi';
COMMENT ON COLUMN dealership.parent_dealership_id IS 'Moderselskap/hovedkontor (hvis filialer)';
COMMENT ON COLUMN dealership.prep_center_id IS 'Peker til klargjøringsforhandler (feks 499 for Sørlandsparken)';
COMMENT ON COLUMN dealership.does_own_prep IS 'True hvis forhandler gjør egen klargjøring (feks 490)';
COMMENT ON COLUMN dealership.brand_colors IS 'JSON med brand farger for UI theming: {primary: "#BB0A30", secondary: "#000000"}';
COMMENT ON COLUMN dealership.logo IS 'Forhandler logo (FK til directus_files)';

COMMIT;
