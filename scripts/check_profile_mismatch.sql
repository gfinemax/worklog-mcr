-- Check for profile mismatch for gfinemax@gmail.com
SELECT 
    au.id as auth_id,
    au.email as auth_email,
    au.raw_app_meta_data,
    pu.id as public_id,
    pu.email as public_email
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'gfinemax@gmail.com';
