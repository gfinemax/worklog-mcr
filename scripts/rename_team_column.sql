-- Rename 'team' column to 'group_name' in 'worklogs' table
ALTER TABLE public.worklogs RENAME COLUMN team TO group_name;
