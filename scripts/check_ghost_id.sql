-- Check if the ID exists in auth.users but with a different email
SELECT 
    p.id as public_id,
    p.email as public_email,
    p.name as public_name,
    a.id as auth_id,
    a.email as auth_email,
    a.created_at as auth_created_at
FROM public.users p
LEFT JOIN auth.users a ON p.id = a.id
WHERE p.email = '정광훈@mbcplus.com';
