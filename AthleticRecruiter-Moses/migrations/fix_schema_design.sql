-- Add status and favorite columns to saved_coaches
ALTER TABLE saved_coaches 
ADD COLUMN status TEXT DEFAULT 'Not Contacted',
ADD COLUMN favorite BOOLEAN DEFAULT FALSE;

-- Remove status and favorite columns from coaches
-- We're not dropping them yet, just to be safe in case of data migration
ALTER TABLE coaches
ADD COLUMN legacy_status TEXT;

ALTER TABLE coaches
ADD COLUMN legacy_favorite BOOLEAN;

-- Copy the data from the old columns to the new ones as part of migration
UPDATE coaches SET 
  legacy_status = status,
  legacy_favorite = favorite;

-- Now migrate the data to saved_coaches
-- This will only work for coaches that are already saved by users
UPDATE saved_coaches sc
SET status = c.status, favorite = c.favorite
FROM coaches c
WHERE sc.coach_id = c.id;

-- Finally, drop the old columns
ALTER TABLE coaches
DROP COLUMN status,
DROP COLUMN favorite;