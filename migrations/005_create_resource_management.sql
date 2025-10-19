-- Migration: Create generalized resource and time management
-- Created: 2025-10-19
-- Description: Fleksibel ressursstyring for cross-dealership deling

BEGIN;

-- ==============================
-- RESOURCE TYPES (Ressurstyper)
-- ==============================
-- Definerer hvilke typer ressurser som kan bookes
CREATE TABLE IF NOT EXISTS resource_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,  -- 'mekanisk', 'kosmetisk', 'kundemottak', etc
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7),  -- Hex color for UI
  is_productive BOOLEAN DEFAULT true,  -- Krever tidsbank tracking?
  default_duration_hours DECIMAL(4,2),  -- Standard varighet
  bookable BOOLEAN DEFAULT true,  -- Kan bookes i kalender?
  requires_assignment BOOLEAN DEFAULT false,  -- Må tildeles spesifikk person?
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default resource types
INSERT INTO resource_types (code, name, description, icon, color, is_productive, default_duration_hours, bookable, requires_assignment) VALUES
  ('mekanisk', 'Mekanisk klargjøring', 'Teknisk verkstedsarbeid', 'build', '#2196F3', true, 2.5, true, true),
  ('kosmetisk', 'Kosmetisk klargjøring', 'Bilpleie og vask', 'auto_awesome', '#4CAF50', true, 2.5, true, true),
  ('mottakskontroll', 'Mottakskontroll', 'Kontroll ved mottak av bil', 'fact_check', '#FF9800', true, 0.5, true, true),
  ('kundemottak', 'Kundemottak', 'Booking og planlegging', 'schedule', '#9C27B0', false, 0.25, true, false),
  ('delelager', 'Delelager', 'Bestilling og mottak av deler', 'inventory_2', '#795548', false, 0.5, false, false),
  ('kvalitetskontroll', 'Kvalitetskontroll', 'Sluttkontroll før levering', 'verified', '#00BCD4', true, 0.5, true, true),
  ('levering', 'Levering', 'Transport/levering av bil', 'local_shipping', '#607D8B', true, 1.0, true, false)
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE resource_types IS 'Definerer alle typer ressurser som kan bookes/trackes';
COMMENT ON COLUMN resource_types.code IS 'Unik kode (brukes i kode)';
COMMENT ON COLUMN resource_types.is_productive IS 'Om ressursen krever tidsbank tracking';
COMMENT ON COLUMN resource_types.bookable IS 'Om ressursen kan bookes i kalender';
COMMENT ON COLUMN resource_types.requires_assignment IS 'Om ressursen må tildeles spesifikk person';

-- ==============================
-- RESOURCE SHARING (Ressursdeling)
-- ==============================
-- Definerer hvilke forhandlere som deler ressurser med hverandre
CREATE TABLE IF NOT EXISTS resource_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_dealership_id UUID NOT NULL,  -- Forhandler som TILBYR ressurs
  consumer_dealership_id UUID NOT NULL,  -- Forhandler som KAN BRUKE ressurs
  resource_type_id UUID NOT NULL,  -- Type ressurs som deles
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,  -- Prioritet (høyere = viktigere kunde)
  max_hours_per_week DECIMAL(6,2),  -- Maks timer per uke (NULL = unlimited)
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  CONSTRAINT fk_sharing_provider
    FOREIGN KEY (provider_dealership_id)
    REFERENCES dealership(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_sharing_consumer
    FOREIGN KEY (consumer_dealership_id)
    REFERENCES dealership(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_sharing_resource_type
    FOREIGN KEY (resource_type_id)
    REFERENCES resource_types(id)
    ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT check_sharing_different_dealerships
    CHECK (provider_dealership_id != consumer_dealership_id),
  CONSTRAINT unique_sharing_config
    UNIQUE (provider_dealership_id, consumer_dealership_id, resource_type_id)
);

CREATE INDEX IF NOT EXISTS idx_sharing_provider ON resource_sharing(provider_dealership_id);
CREATE INDEX IF NOT EXISTS idx_sharing_consumer ON resource_sharing(consumer_dealership_id);
CREATE INDEX IF NOT EXISTS idx_sharing_resource_type ON resource_sharing(resource_type_id);

COMMENT ON TABLE resource_sharing IS 'Definerer cross-dealership ressursdeling (feks 499 tilbyr mekanisk til 495)';
COMMENT ON COLUMN resource_sharing.provider_dealership_id IS 'Forhandler som tilbyr ressursen (feks 499)';
COMMENT ON COLUMN resource_sharing.consumer_dealership_id IS 'Forhandler som kan bruke ressursen (feks 495)';
COMMENT ON COLUMN resource_sharing.priority IS 'Prioritet ved kapasitetskonflikter';
COMMENT ON COLUMN resource_sharing.max_hours_per_week IS 'Maks timer per uke denne kunden kan bruke';

-- ==============================
-- RESOURCE CAPACITIES (Ressurskapasitet)
-- ==============================
-- Erstatter time_allocations - mer generisk
CREATE TABLE IF NOT EXISTS resource_capacities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID NOT NULL,  -- Forhandler som tilbyr ressursen
  resource_type_id UUID NOT NULL,  -- Type ressurs
  user_id UUID,  -- Spesifikk bruker (NULL = total forhandler-kapasitet)
  date DATE NOT NULL,
  allocated_hours DECIMAL(6,2) NOT NULL DEFAULT 8.0,
  used_hours DECIMAL(6,2) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  CONSTRAINT fk_capacity_dealership
    FOREIGN KEY (dealership_id)
    REFERENCES dealership(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_capacity_resource_type
    FOREIGN KEY (resource_type_id)
    REFERENCES resource_types(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_capacity_user
    FOREIGN KEY (user_id)
    REFERENCES directus_users(id)
    ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT check_capacity_allocated_hours
    CHECK (allocated_hours >= 0 AND allocated_hours <= 24),
  CONSTRAINT check_capacity_used_hours
    CHECK (used_hours >= 0 AND used_hours <= allocated_hours),

  -- Unique: en kapasitet per dealership/resource/user/date
  CONSTRAINT unique_resource_capacity
    UNIQUE NULLS NOT DISTINCT (dealership_id, resource_type_id, user_id, date)
);

-- Computed column
ALTER TABLE resource_capacities
  ADD COLUMN IF NOT EXISTS available_hours DECIMAL(6,2)
    GENERATED ALWAYS AS (allocated_hours - used_hours) STORED;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_capacities_dealership ON resource_capacities(dealership_id);
CREATE INDEX IF NOT EXISTS idx_capacities_resource_type ON resource_capacities(resource_type_id);
CREATE INDEX IF NOT EXISTS idx_capacities_user ON resource_capacities(user_id);
CREATE INDEX IF NOT EXISTS idx_capacities_date ON resource_capacities(date);
CREATE INDEX IF NOT EXISTS idx_capacities_dealership_date
  ON resource_capacities(dealership_id, date);
CREATE INDEX IF NOT EXISTS idx_capacities_user_date
  ON resource_capacities(user_id, date) WHERE user_id IS NOT NULL;

COMMENT ON TABLE resource_capacities IS 'Ressurskapasitet per forhandler/bruker/dag';
COMMENT ON COLUMN resource_capacities.dealership_id IS 'Forhandler som tilbyr ressursen';
COMMENT ON COLUMN resource_capacities.resource_type_id IS 'Type ressurs';
COMMENT ON COLUMN resource_capacities.user_id IS 'Spesifikk bruker (NULL = total kapasitet)';
COMMENT ON COLUMN resource_capacities.date IS 'Dato';
COMMENT ON COLUMN resource_capacities.allocated_hours IS 'Timer tilgjengelig';
COMMENT ON COLUMN resource_capacities.used_hours IS 'Timer brukt/booket';
COMMENT ON COLUMN resource_capacities.available_hours IS 'Tilgjengelige timer (beregnet)';

-- ==============================
-- RESOURCE BOOKINGS (Ressursbookinger)
-- ==============================
-- Erstatter time_bookings - mer generisk
CREATE TABLE IF NOT EXISTS resource_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL,
  resource_type_id UUID NOT NULL,  -- Type ressurs som bookes
  provider_dealership_id UUID NOT NULL,  -- Forhandler som UTFØRER jobben
  consumer_dealership_id UUID NOT NULL,  -- Forhandler som EIER bilen
  user_id UUID,  -- Spesifikk person tildelt (kan være NULL)
  date DATE NOT NULL,
  start_time TIME,
  estimated_hours DECIMAL(6,2) NOT NULL,
  actual_hours DECIMAL(6,2),
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,

  -- Foreign keys
  CONSTRAINT fk_booking_car
    FOREIGN KEY (car_id)
    REFERENCES cars(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_booking_resource_type
    FOREIGN KEY (resource_type_id)
    REFERENCES resource_types(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_booking_provider
    FOREIGN KEY (provider_dealership_id)
    REFERENCES dealership(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_booking_consumer
    FOREIGN KEY (consumer_dealership_id)
    REFERENCES dealership(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_booking_user
    FOREIGN KEY (user_id)
    REFERENCES directus_users(id)
    ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT check_booking_status
    CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  CONSTRAINT check_booking_estimated_hours
    CHECK (estimated_hours > 0 AND estimated_hours <= 24),
  CONSTRAINT check_booking_actual_hours
    CHECK (actual_hours IS NULL OR (actual_hours >= 0 AND actual_hours <= 24))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_car ON resource_bookings(car_id);
CREATE INDEX IF NOT EXISTS idx_bookings_resource_type ON resource_bookings(resource_type_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON resource_bookings(provider_dealership_id);
CREATE INDEX IF NOT EXISTS idx_bookings_consumer ON resource_bookings(consumer_dealership_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON resource_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON resource_bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON resource_bookings(status);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_date
  ON resource_bookings(user_id, date, start_time) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_provider_date
  ON resource_bookings(provider_dealership_id, date, resource_type_id);

COMMENT ON TABLE resource_bookings IS 'Generiske ressursbookinger med cross-dealership support';
COMMENT ON COLUMN resource_bookings.provider_dealership_id IS 'Forhandler som UTFØRER jobben (feks 499 gjør jobben)';
COMMENT ON COLUMN resource_bookings.consumer_dealership_id IS 'Forhandler som EIER bilen (feks 495 eier bilen)';
COMMENT ON COLUMN resource_bookings.user_id IS 'Person tildelt jobben (kan settes senere)';
COMMENT ON COLUMN resource_bookings.status IS 'scheduled, confirmed, in_progress, completed, cancelled, no_show';

-- ==============================
-- TRIGGERS FOR AUTO-UPDATE
-- ==============================

-- Trigger: Oppdater used_hours når booking opprettes/endres
CREATE OR REPLACE FUNCTION update_resource_capacity()
RETURNS TRIGGER AS $$
BEGIN
  -- Hvis ny booking eller endring i estimert tid
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.estimated_hours != NEW.estimated_hours)) THEN
    -- Oppdater used_hours i resource_capacities
    UPDATE resource_capacities
    SET used_hours = (
      SELECT COALESCE(SUM(estimated_hours), 0)
      FROM resource_bookings
      WHERE provider_dealership_id = NEW.provider_dealership_id
        AND resource_type_id = NEW.resource_type_id
        AND date = NEW.date
        AND status NOT IN ('cancelled', 'no_show')
        AND (user_id = resource_capacities.user_id OR (resource_capacities.user_id IS NULL AND user_id IS NULL))
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE dealership_id = NEW.provider_dealership_id
      AND resource_type_id = NEW.resource_type_id
      AND date = NEW.date
      AND (user_id = NEW.user_id OR (user_id IS NULL AND NEW.user_id IS NULL));
  END IF;

  -- Hvis booking blir kansellert, oppdater også
  IF (TG_OP = 'UPDATE' AND OLD.status NOT IN ('cancelled', 'no_show') AND NEW.status IN ('cancelled', 'no_show')) THEN
    UPDATE resource_capacities
    SET used_hours = (
      SELECT COALESCE(SUM(estimated_hours), 0)
      FROM resource_bookings
      WHERE provider_dealership_id = NEW.provider_dealership_id
        AND resource_type_id = NEW.resource_type_id
        AND date = NEW.date
        AND status NOT IN ('cancelled', 'no_show')
        AND (user_id = resource_capacities.user_id OR (resource_capacities.user_id IS NULL AND user_id IS NULL))
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE dealership_id = NEW.provider_dealership_id
      AND resource_type_id = NEW.resource_type_id
      AND date = NEW.date
      AND (user_id = NEW.user_id OR (user_id IS NULL AND NEW.user_id IS NULL));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_resource_capacity
  AFTER INSERT OR UPDATE ON resource_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_capacity();

COMMENT ON FUNCTION update_resource_capacity() IS 'Auto-oppdaterer used_hours i resource_capacities når bookinger endres';

COMMIT;
