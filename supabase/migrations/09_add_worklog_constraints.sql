-- Add unique index to prevent duplicate worklogs
-- We want to ensure that for a given date, shift type, and group, only one worklog exists.
-- This prevents the "duplicate Day shift" issue physically.

CREATE UNIQUE INDEX IF NOT EXISTS idx_worklogs_unique_shift 
ON public.worklogs (date, type, group_id);
