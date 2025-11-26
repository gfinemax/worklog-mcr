-- Grant usage on auth schema to all relevant roles
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role, postgres;

-- Grant access to all tables in auth schema
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated, service_role;

-- Grant access to sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Ensure search_path includes auth for these roles
ALTER ROLE anon SET search_path = public, auth;
ALTER ROLE authenticated SET search_path = public, auth;
ALTER ROLE service_role SET search_path = public, auth;

-- Verify
SELECT count(*) FROM auth.users;
