
-- 1. Drop the foreign key constraint from worklog_staff
ALTER TABLE public.worklog_staff
DROP CONSTRAINT IF EXISTS worklog_staff_external_staff_id_fkey;

-- 2. Drop the support_staff table
DROP TRIGGER IF EXISTS update_support_staff_updated_at ON public.support_staff;
DROP TABLE IF EXISTS public.support_staff;

-- 3. (Optional) Add foreign key to users if worklog_staff needs it
-- Since the table is empty, we can just add it.
-- Assuming 'external_staff_id' is the column name based on the error message.
-- ALTER TABLE public.worklog_staff
-- ADD CONSTRAINT worklog_staff_external_staff_id_fkey
-- FOREIGN KEY (external_staff_id) REFERENCES public.users(id);
