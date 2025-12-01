-- Add ai_summary column to worklogs table
ALTER TABLE public.worklogs ADD COLUMN IF NOT EXISTS ai_summary TEXT;
