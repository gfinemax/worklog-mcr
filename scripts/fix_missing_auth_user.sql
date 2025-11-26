-- Delete the orphaned user from public.users
-- This is necessary because the user is missing from auth.users, so we need to clear the public record
-- to allow the user to 'Sign Up' again with the same email.

DELETE FROM public.users 
WHERE email = '정광훈@mbcplus.com';

-- Verify deletion
SELECT * FROM public.users WHERE email = '정광훈@mbcplus.com';
