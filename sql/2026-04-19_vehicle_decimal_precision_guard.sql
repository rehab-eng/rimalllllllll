BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Vehicle'
      AND column_name = 'capacity_liters'
      AND data_type IN ('smallint', 'integer', 'bigint')
  ) THEN
    ALTER TABLE "Vehicle"
      ALTER COLUMN capacity_liters TYPE NUMERIC(10, 2)
      USING capacity_liters::NUMERIC(10, 2);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Vehicle'
      AND column_name = 'cubic_capacity'
      AND data_type IN ('smallint', 'integer', 'bigint')
  ) THEN
    ALTER TABLE "Vehicle"
      ALTER COLUMN cubic_capacity TYPE NUMERIC(10, 2)
      USING cubic_capacity::NUMERIC(10, 2);
  END IF;
END $$;

COMMIT;
