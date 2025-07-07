-- Migration to remove the city and notes columns from the coaches table
-- This migration is idempotent and handles the case where columns don't exist

DO $$
BEGIN
  -- Check if city column exists and remove it if it does
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'coaches' AND column_name = 'city'
  ) THEN
    ALTER TABLE coaches DROP COLUMN city;
    RAISE NOTICE 'Dropped city column from coaches table';
  ELSE
    RAISE NOTICE 'city column does not exist in coaches table, skipping';
  END IF;

  -- Check if notes column exists and remove it if it does
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'coaches' AND column_name = 'notes'
  ) THEN
    ALTER TABLE coaches DROP COLUMN notes;
    RAISE NOTICE 'Dropped notes column from coaches table';
  ELSE
    RAISE NOTICE 'notes column does not exist in coaches table, skipping';
  END IF;
END
$$;