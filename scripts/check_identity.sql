-- Check if the user has an identity in auth.identities
SELECT * 
FROM auth.identities 
WHERE user_id = '941cace0-a9bf-47b5-9e83-04a1b73ac59b';

-- Also check for the test user for comparison
SELECT * 
FROM auth.identities 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test_login@example.com');
