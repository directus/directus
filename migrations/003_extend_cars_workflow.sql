-- Migration: Extend cars collection for complete workflow
-- Created: 2025-10-19
-- Description: Adds all workflow fields, timestamps, and relationships

BEGIN;

-- Add workflow relationship fields
ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS dealership_id UUID NOT NULL,
  ADD COLUMN IF NOT EXISTS prep_center_id UUID,
  ADD COLUMN IF NOT EXISTS seller_id UUID,
  ADD COLUMN IF NOT EXISTS assigned_mechanic_id UUID,
  ADD COLUMN IF NOT EXISTS assigned_detailer_id UUID;

-- Add workflow status and timestamps
ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS car_type VARCHAR(50) DEFAULT 'nybil',
  ADD COLUMN IF NOT EXISTS status VARCHAR(100) DEFAULT 'ny_ordre',
  ADD COLUMN IF NOT EXISTS order_number VARCHAR(100),

  -- Dates for nybil workflow
  ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS parts_ordered_seller_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS parts_arrived_seller_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS parts_ordered_prep_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS parts_arrived_prep_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS arrived_prep_center_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS inspection_completed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS inspection_approved BOOLEAN,
  ADD COLUMN IF NOT EXISTS inspection_notes TEXT,

  -- Scheduling
  ADD COLUMN IF NOT EXISTS scheduled_technical_date DATE,
  ADD COLUMN IF NOT EXISTS scheduled_technical_time TIME,
  ADD COLUMN IF NOT EXISTS technical_started_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS technical_completed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS scheduled_cosmetic_date DATE,
  ADD COLUMN IF NOT EXISTS scheduled_cosmetic_time TIME,
  ADD COLUMN IF NOT EXISTS cosmetic_started_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS cosmetic_completed_at TIMESTAMP,

  -- Completion
  ADD COLUMN IF NOT EXISTS ready_for_delivery_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS delivered_to_dealership_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS delivered_to_customer_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

-- Add customer fields
ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

-- Add accessories and pricing
ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS accessories JSON,
  ADD COLUMN IF NOT EXISTS estimated_technical_hours DECIMAL(4,2) DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS estimated_cosmetic_hours DECIMAL(4,2) DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS sale_price DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS prep_cost DECIMAL(12,2);

-- Add notes fields
ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS seller_notes TEXT,
  ADD COLUMN IF NOT EXISTS parts_notes TEXT,
  ADD COLUMN IF NOT EXISTS technical_notes TEXT,
  ADD COLUMN IF NOT EXISTS cosmetic_notes TEXT;

-- Add foreign key constraints
ALTER TABLE cars
  ADD CONSTRAINT fk_car_dealership
    FOREIGN KEY (dealership_id)
    REFERENCES dealership(id)
    ON DELETE RESTRICT,
  ADD CONSTRAINT fk_car_prep_center
    FOREIGN KEY (prep_center_id)
    REFERENCES dealership(id)
    ON DELETE SET NULL,
  ADD CONSTRAINT fk_car_seller
    FOREIGN KEY (seller_id)
    REFERENCES directus_users(id)
    ON DELETE SET NULL,
  ADD CONSTRAINT fk_car_mechanic
    FOREIGN KEY (assigned_mechanic_id)
    REFERENCES directus_users(id)
    ON DELETE SET NULL,
  ADD CONSTRAINT fk_car_detailer
    FOREIGN KEY (assigned_detailer_id)
    REFERENCES directus_users(id)
    ON DELETE SET NULL;

-- Add check constraints
ALTER TABLE cars
  ADD CONSTRAINT check_car_type
    CHECK (car_type IN ('nybil', 'bruktbil')),
  ADD CONSTRAINT check_car_status
    CHECK (status IN (
      -- Nybil statuser
      'ny_ordre', 'deler_bestilt_selgerforhandler', 'deler_ankommet_selgerforhandler',
      'deler_bestilt_klargjoring', 'deler_ankommet_klargjoring',
      'på_vei_til_klargjoring', 'ankommet_klargjoring',
      'mottakskontroll_pågår', 'mottakskontroll_godkjent', 'mottakskontroll_avvik',
      'venter_booking', 'planlagt_teknisk', 'teknisk_pågår', 'teknisk_ferdig',
      'planlagt_kosmetisk', 'kosmetisk_pågår', 'kosmetisk_ferdig',
      'klar_for_levering', 'levert_til_selgerforhandler',
      'solgt_til_kunde', 'levert_til_kunde', 'arkivert',
      -- Bruktbil statuser
      'innbytte_registrert', 'vurdert_for_salg', 'til_klargjoring',
      'klar_for_salg', 'reservert'
    ));

-- Add unique constraints
ALTER TABLE cars
  ADD CONSTRAINT cars_order_number_unique UNIQUE (order_number),
  ADD CONSTRAINT cars_vin_unique UNIQUE (vin);

-- Add indexes for performance (CRITICAL for queries)
CREATE INDEX IF NOT EXISTS idx_cars_dealership ON cars(dealership_id);
CREATE INDEX IF NOT EXISTS idx_cars_prep_center ON cars(prep_center_id);
CREATE INDEX IF NOT EXISTS idx_cars_seller ON cars(seller_id);
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_car_type ON cars(car_type);
CREATE INDEX IF NOT EXISTS idx_cars_vin ON cars(vin);
CREATE INDEX IF NOT EXISTS idx_cars_regnr ON cars(regnr);
CREATE INDEX IF NOT EXISTS idx_cars_order_number ON cars(order_number);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_cars_dealership_status ON cars(dealership_id, status);
CREATE INDEX IF NOT EXISTS idx_cars_dealership_type ON cars(dealership_id, car_type);

-- Add comments
COMMENT ON COLUMN cars.dealership_id IS 'Selgerforhandler (eier av bilen)';
COMMENT ON COLUMN cars.prep_center_id IS 'Klargjøringsforhandler (hvis annen enn selgerforhandler)';
COMMENT ON COLUMN cars.seller_id IS 'Selger som registrerte bilen';
COMMENT ON COLUMN cars.assigned_mechanic_id IS 'Mekaniker tildelt teknisk klargjøring';
COMMENT ON COLUMN cars.assigned_detailer_id IS 'Bilpleier tildelt kosmetisk klargjøring';
COMMENT ON COLUMN cars.car_type IS 'nybil eller bruktbil';
COMMENT ON COLUMN cars.status IS 'Nåværende status i workflow';
COMMENT ON COLUMN cars.order_number IS 'Ordrenummer fra eksternt system (UNIQUE)';
COMMENT ON COLUMN cars.accessories IS 'JSON array med tilbehør';
COMMENT ON COLUMN cars.estimated_technical_hours IS 'Estimert timer for teknisk (2.5 nybil, 1.5 bruktbil)';
COMMENT ON COLUMN cars.estimated_cosmetic_hours IS 'Estimert timer for kosmetisk (2.5 nybil, 1.5 bruktbil)';

COMMIT;
