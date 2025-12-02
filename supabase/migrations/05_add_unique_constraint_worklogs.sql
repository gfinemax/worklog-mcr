-- Add unique constraint to worklogs table to prevent duplicates
ALTER TABLE public.worklogs
ADD CONSTRAINT worklogs_date_group_type_key UNIQUE (date, group_id, type);
