-- Migration: Create notifications collection
-- Created: 2025-10-19
-- Description: Stores in-app notifications for workflow events

BEGIN;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  car_id UUID,
  type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  CONSTRAINT fk_notification_user
    FOREIGN KEY (user_id)
    REFERENCES directus_users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_notification_car
    FOREIGN KEY (car_id)
    REFERENCES cars(id)
    ON DELETE CASCADE
);

-- Add check constraint for notification type
ALTER TABLE notifications
  ADD CONSTRAINT check_notification_type
    CHECK (type IN (
      'new_order',
      'parts_changed',
      'parts_ordered',
      'parts_arrived',
      'inspection_done',
      'ready_for_booking',
      'scheduled',
      'prep_complete',
      'ready_for_delivery',
      'time_bank_full',
      'general'
    ));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_car ON notifications(car_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Composite index for common query: unread notifications for user
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, read, created_at DESC);

-- Add comments
COMMENT ON TABLE notifications IS 'In-app varslinger for workflow hendelser';
COMMENT ON COLUMN notifications.type IS 'Type varsling: new_order, parts_changed, inspection_done, etc';
COMMENT ON COLUMN notifications.message IS 'Varslingstekst til bruker';
COMMENT ON COLUMN notifications.read IS 'Om brukeren har sett varslingen';

COMMIT;
