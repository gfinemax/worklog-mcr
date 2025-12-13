-- Update phone column length in contacts table

ALTER TABLE public.contacts ALTER COLUMN phone TYPE VARCHAR(50);