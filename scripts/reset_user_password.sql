-- 1. Ensure email is clean (trim whitespace) just in case
UPDATE auth.users
SET email = '정광훈@mbcplus.com'
WHERE id = '941cace0-a9bf-47b5-9e83-04a1b73ac59b';

UPDATE public.users
SET email = '정광훈@mbcplus.com'
WHERE id = '941cace0-a9bf-47b5-9e83-04a1b73ac59b';

-- 2. Reset password to '12341234' with correct hash cost (10)
UPDATE auth.users 
SET encrypted_password = crypt('12341234', gen_salt('bf', 10)) 
WHERE id = '941cace0-a9bf-47b5-9e83-04a1b73ac59b';

-- Verify
SELECT email, updated_at FROM auth.users WHERE id = '941cace0-a9bf-47b5-9e83-04a1b73ac59b';
