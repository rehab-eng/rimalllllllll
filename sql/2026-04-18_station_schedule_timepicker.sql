BEGIN;

-- Normalize legacy values (e.g. HH:mm:ss) to HH:mm
UPDATE "StationSchedule"
SET
  opens_at = LEFT(opens_at, 5),
  closes_at = LEFT(closes_at, 5);

ALTER TABLE "StationSchedule"
  ALTER COLUMN opens_at TYPE VARCHAR(5) USING LEFT(opens_at, 5),
  ALTER COLUMN closes_at TYPE VARCHAR(5) USING LEFT(closes_at, 5);

ALTER TABLE "StationSchedule"
  DROP CONSTRAINT IF EXISTS station_schedule_opens_at_format_chk,
  DROP CONSTRAINT IF EXISTS station_schedule_closes_at_format_chk,
  DROP CONSTRAINT IF EXISTS station_schedule_time_order_chk;

ALTER TABLE "StationSchedule"
  ADD CONSTRAINT station_schedule_opens_at_format_chk
    CHECK (opens_at ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD CONSTRAINT station_schedule_closes_at_format_chk
    CHECK (closes_at ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD CONSTRAINT station_schedule_time_order_chk
    CHECK (
      (split_part(opens_at, ':', 1)::int * 60 + split_part(opens_at, ':', 2)::int) <
      (split_part(closes_at, ':', 1)::int * 60 + split_part(closes_at, ':', 2)::int)
    );

COMMIT;
