-- Grant usage on auth schema to standard roles
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- Grant select on auth.users to postgres (just in case)
GRANT SELECT ON auth.users TO postgres;

-- Ensure supabase_auth_admin has full access (this is the role used by Auth)
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin;

-- Check if we can select from auth.users now
SELECT count(*) as auth_users_count FROM auth.users;
