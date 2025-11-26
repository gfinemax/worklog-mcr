-- Delete identity for user 정광훈 to match the working test_login state
DELETE FROM auth.identities 
WHERE user_id = '941cace0-a9bf-47b5-9e83-04a1b73ac59b';

-- Verify deletion
SELECT count(*) as identity_count 
FROM auth.identities 
WHERE user_id = '941cace0-a9bf-47b5-9e83-04a1b73ac59b';
