-- Make coachId nullable in tasks table
ALTER TABLE tasks ALTER COLUMN coach_id DROP NOT NULL;

-- Update the unique constraint to handle NULL coach_id
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_user_id_coach_id_title_type_key;
CREATE UNIQUE INDEX tasks_user_id_title_type_idx ON tasks (user_id, title, type) WHERE coach_id IS NULL;
ALTER TABLE tasks ADD CONSTRAINT tasks_user_id_coach_id_title_type_key UNIQUE (user_id, coach_id, title, type) WHERE coach_id IS NOT NULL;