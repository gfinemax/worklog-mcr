-- 1. Check for orphaned users (exist in public.users but NOT in auth.users)
SELECT p.id, p.email, p.name, p.role
FROM public.users p
LEFT JOIN auth.users a ON p.id = a.id
WHERE a.id IS NULL;

-- 2. (Optional) Delete all orphaned users to allow re-registration
-- Uncomment the following lines to execute the cleanup:

-- DELETE FROM public.users 
-- WHERE id IN (
--     SELECT p.id
--     FROM public.users p
--     LEFT JOIN auth.users a ON p.id = a.id
--     WHERE a.id IS NULL
-- );
