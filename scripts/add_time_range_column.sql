
-- Add time_range column to worklogs table for storing custom working hours
ALTER TABLE worklogs ADD COLUMN IF NOT EXISTS time_range TEXT;
