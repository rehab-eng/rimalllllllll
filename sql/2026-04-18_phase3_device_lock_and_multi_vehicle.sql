BEGIN;

-- 1) Device locking for drivers
ALTER TABLE "Driver"
  ADD COLUMN IF NOT EXISTS device_token VARCHAR(128);

CREATE UNIQUE INDEX IF NOT EXISTS driver_device_token_unique_idx
  ON "Driver" (device_token)
  WHERE device_token IS NOT NULL AND deleted_at IS NULL;

-- 2) Extend vehicle data for multi-vehicle support
ALTER TABLE "Vehicle"
  ADD COLUMN IF NOT EXISTS cubic_capacity NUMERIC(10, 2);

UPDATE "Vehicle"
SET cubic_capacity = COALESCE(cubic_capacity, 0);

ALTER TABLE "Vehicle"
  ALTER COLUMN cubic_capacity SET NOT NULL;

-- 3) Recommended indexes for driver login flow
CREATE INDEX IF NOT EXISTS driver_phone_lookup_idx
  ON "Driver" (phone)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS driver_license_lookup_idx
  ON "Driver" (license_number)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS vehicle_driver_active_lookup_idx
  ON "Vehicle" ("driverId", is_active);

COMMIT;
