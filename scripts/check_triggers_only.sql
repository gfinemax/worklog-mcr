-- List triggers on auth.users
SELECT 
    event_object_schema as schema,
    event_object_table as table,
    trigger_name,
    action_statement as definition
FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users';

-- List triggers on public.users
SELECT 
    event_object_schema as schema,
    event_object_table as table,
    trigger_name,
    action_statement as definition
FROM information_schema.triggers
WHERE event_object_schema = 'public' AND event_object_table = 'users';
