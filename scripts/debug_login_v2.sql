-- Consolidated Debug Script
-- Returns a single row with diagnostic info

SELECT 
    (SELECT count(*) FROM pg_extension WHERE extname = 'pgcrypto') as pgcrypto_installed,
    (SELECT count(*) FROM auth.users WHERE email = 'test_login@example.com') as test_user_exists,
    (SELECT (encrypted_password = crypt('password1234', encrypted_password)) 
     FROM auth.users 
     WHERE email = 'test_login@example.com') as password_matches,
    (SELECT count(*) FROM information_schema.role_table_grants 
     WHERE table_schema = 'auth' AND table_name = 'users' AND grantee = 'supabase_auth_admin') as auth_admin_grants;
