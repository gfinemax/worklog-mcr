-- 1. Check if pgcrypto is installed
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';

-- 2. Verify the test user's password hash manually
-- This checks if the stored hash actually matches 'password1234'
SELECT 
    email, 
    (encrypted_password = crypt('password1234', encrypted_password)) as password_match 
FROM auth.users 
WHERE email = 'test_login@example.com';

-- 3. Check permissions for supabase_auth_admin (the role used by Auth API)
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'auth' AND table_name = 'users' AND grantee = 'supabase_auth_admin';

-- 4. Check owner of auth.users
SELECT tableowner 
FROM pg_tables 
WHERE schemaname = 'auth' AND tablename = 'users';
