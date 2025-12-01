-- Add unique constraint to ensure only one worklog per type (Day/Night) per group per date
ALTER TABLE public.worklogs
ADD CONSTRAINT worklogs_group_date_type_key UNIQUE (group_id, date, type);
