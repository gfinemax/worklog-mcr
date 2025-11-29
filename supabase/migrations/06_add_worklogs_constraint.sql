-- Add unique constraint to worklogs table to prevent duplicates
ALTER TABLE public.worklogs
ADD CONSTRAINT worklogs_group_id_date_type_key UNIQUE (group_id, date, type);
