-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Clean up if exists
DELETE FROM public.users WHERE email = 'test_login@example.com';
DELETE FROM auth.users WHERE email = 'test_login@example.com';

-- 2. Insert into auth.users
-- We use a known password 'password1234' hashed with bcrypt
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- Default instance_id
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test_login@example.com',
    crypt('password1234', gen_salt('bf')), -- Hash the password
    now(),
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}',
    '{"name":"테스트계정"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- 3. Insert into public.users (Trigger might do this, but let's be safe and do it manually if trigger is missing)
-- We need to get the ID we just generated.
INSERT INTO public.users (id, email, name, role, is_active)
SELECT id, email, '테스트계정', '감독', true
FROM auth.users
WHERE email = 'test_login@example.com'
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT * FROM auth.users WHERE email = 'test_login@example.com';
