-- Add unique constraint to saved_coaches table
ALTER TABLE saved_coaches 
ADD CONSTRAINT saved_coaches_user_id_coach_id_unique UNIQUE (user_id, coach_id);

-- Add unique constraint to email_templates table
ALTER TABLE email_templates 
ADD CONSTRAINT email_templates_user_id_name_unique UNIQUE (user_id, name);

-- Add unique constraint to tasks table
ALTER TABLE tasks 
ADD CONSTRAINT tasks_user_id_coach_id_title_type_unique UNIQUE (user_id, coach_id, title, type);