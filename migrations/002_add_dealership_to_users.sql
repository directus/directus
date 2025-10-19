-- Migration: Add dealership relationship to users
-- Created: 2025-10-19
-- Description: Links users to dealerships for multi-tenancy

BEGIN;

-- Add new fields to directus_users table
ALTER TABLE directus_users
  ADD COLUMN IF NOT EXISTS dealership_id UUID,
  ADD COLUMN IF NOT EXISTS job_role VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_productive BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS hours_per_day DECIMAL(4,2);

-- Add foreign key constraint
ALTER TABLE directus_users
  ADD CONSTRAINT fk_user_dealership
    FOREIGN KEY (dealership_id)
    REFERENCES dealership(id)
    ON DELETE RESTRICT;

-- Add index for performance (CRITICAL for multi-tenancy queries)
CREATE INDEX IF NOT EXISTS idx_users_dealership ON directus_users(dealership_id);

-- Add check constraint for job_role
ALTER TABLE directus_users
  ADD CONSTRAINT check_user_job_role
    CHECK (job_role IN (
      'daglig_leder',
      'salgsjef',
      'nybilselger',
      'bruktbilselger',
      'kundemottaker',
      'garantimedarbeider',
      'mottakskontrollør',
      'delelager',
      'mekaniker',
      'bilpleiespesialist',
      'admin'
    ));

-- Add check constraint for hours_per_day
ALTER TABLE directus_users
  ADD CONSTRAINT check_hours_per_day
    CHECK (hours_per_day IS NULL OR (hours_per_day >= 0 AND hours_per_day <= 24));

-- Add comments
COMMENT ON COLUMN directus_users.dealership_id IS 'Forhandler brukeren tilhører (REQUIRED for multi-tenancy)';
COMMENT ON COLUMN directus_users.job_role IS 'Brukerens jobberolle i systemet (ikke Directus role)';
COMMENT ON COLUMN directus_users.is_productive IS 'True hvis produktiv rolle (mekaniker, bilpleier) med tidsbank';
COMMENT ON COLUMN directus_users.hours_per_day IS 'Timer tilgjengelig per dag (kun for produktive roller)';

COMMIT;
