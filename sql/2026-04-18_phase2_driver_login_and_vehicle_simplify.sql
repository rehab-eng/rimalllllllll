BEGIN;

-- 1) Driver identity fields used for login
ALTER TABLE "Driver"
  ADD COLUMN IF NOT EXISTS license_number VARCHAR(100);

-- Fill empty values in legacy data so login stays possible after NOT NULL.
UPDATE "Driver"
SET
  phone = COALESCE(NULLIF(BTRIM(phone), ''), CONCAT('DRV-PHONE-', id)),
  license_number = COALESCE(NULLIF(BTRIM(license_number), ''), CONCAT('DRV-LIC-', id));

ALTER TABLE "Driver"
  ALTER COLUMN phone SET NOT NULL,
  ALTER COLUMN license_number SET NOT NULL;

CREATE INDEX IF NOT EXISTS driver_phone_idx ON "Driver" (phone);
CREATE INDEX IF NOT EXISTS driver_license_number_idx ON "Driver" (license_number);

-- Optional cleanup of legacy fields we no longer use in the application layer.
ALTER TABLE "Driver"
  DROP COLUMN IF EXISTS national_id,
  DROP COLUMN IF EXISTS password,
  DROP COLUMN IF EXISTS license_url;

-- 2) Vehicle simplification (remove truck_type/image and keep capacity in liters)
ALTER TABLE "Vehicle"
  ADD COLUMN IF NOT EXISTS capacity_liters NUMERIC(10, 2);

UPDATE "Vehicle"
SET capacity_liters = COALESCE(capacity_liters, truck_volume, 0);

ALTER TABLE "Vehicle"
  ALTER COLUMN capacity_liters SET NOT NULL;

ALTER TABLE "Vehicle"
  DROP COLUMN IF EXISTS truck_type,
  DROP COLUMN IF EXISTS truck_volume,
  DROP COLUMN IF EXISTS image_url;

COMMIT;
