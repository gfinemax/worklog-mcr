
-- Drop trigger first (optional, as dropping table cascades, but good practice)
DROP TRIGGER IF EXISTS update_support_staff_updated_at ON public.support_staff;

-- Drop table
DROP TABLE IF EXISTS public.support_staff;
