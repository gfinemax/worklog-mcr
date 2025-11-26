-- Find users with non-ASCII characters in their email (likely Korean)
SELECT id, email, raw_user_meta_data->>'name' as name
FROM auth.users
WHERE email ~ '[^[:ascii:]]';
