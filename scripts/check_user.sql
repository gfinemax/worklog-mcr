-- Check if the user exists in auth.users
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
WHERE email = '정광훈@mbcplus.com';

-- Check if the user exists in public.users
SELECT * 
FROM public.users 
WHERE email = '정광훈@mbcplus.com';
