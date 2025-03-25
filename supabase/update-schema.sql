-- Add estimated_score column to goals table if it doesn't exist
ALTER TABLE goals ADD COLUMN IF NOT EXISTS estimated_score NUMERIC DEFAULT 0;

