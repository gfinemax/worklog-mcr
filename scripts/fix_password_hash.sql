-- Update password with specific Blowfish cost (10) to match Supabase Auth defaults
UPDATE auth.users 
SET encrypted_password = crypt('password1234', gen_salt('bf', 10)) 
WHERE email = 'test_login@example.com';

-- Verify the hash changed
SELECT email, encrypted_password FROM auth.users WHERE email = 'test_login@example.com';
