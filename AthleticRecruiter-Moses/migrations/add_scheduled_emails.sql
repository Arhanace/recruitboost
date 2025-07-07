-- Add scheduled_for and parent_email_id columns to emails table
ALTER TABLE emails 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP,
ADD COLUMN IF NOT EXISTS parent_email_id INTEGER;