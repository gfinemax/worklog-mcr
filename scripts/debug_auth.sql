-- Check for triggers on auth.users
SELECT 
    event_object_schema as table_schema,
    event_object_table as table_name,
    trigger_schema,
    trigger_name,
    string_agg(event_manipulation, ',') as event,
    action_timing as activation,
    action_statement as definition
FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users'
GROUP BY 1,2,3,4,6,7;

-- Check permissions for authenticated role on auth schema (indirectly)
-- We can't easily check auth schema permissions via SQL for the GoTrue user, 
-- but we can check if we can read from it as postgres.
SELECT count(*) FROM auth.users;

-- Check if public.users exists and has correct columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users';
