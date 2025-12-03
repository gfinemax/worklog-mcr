-- Add is_auto_created column to worklogs table
ALTER TABLE public.worklogs 
ADD COLUMN IF NOT EXISTS is_auto_created BOOLEAN DEFAULT FALSE;
