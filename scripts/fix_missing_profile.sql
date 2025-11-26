-- Fix missing public.users profile for gfinemax@gmail.com
-- This is required because the app expects a profile row to exist after login.

INSERT INTO public.users (id, email, name, role, created_at, updated_at)
SELECT 
    id, 
    email, 
    '정광훈', -- Default name (can be updated later)
    'authenticated', -- Default role
    now(), 
    now()
FROM auth.users
WHERE email = 'gfinemax@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Verify insertion
SELECT * FROM public.users WHERE email = 'gfinemax@gmail.com';
