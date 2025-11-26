-- Force update the email to ensure it matches exactly (trimming whitespace)
UPDATE auth.users
SET email = '정광훈@mbcplus.com'
WHERE id = '941cace0-a9bf-47b5-9e83-04a1b73ac59b';

UPDATE public.users
SET email = '정광훈@mbcplus.com'
WHERE id = '941cace0-a9bf-47b5-9e83-04a1b73ac59b';

-- Verify the update
SELECT email, length(email) as len FROM auth.users WHERE id = '941cace0-a9bf-47b5-9e83-04a1b73ac59b';
