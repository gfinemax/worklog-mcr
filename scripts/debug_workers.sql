-- 1. Check the most recent worklog's workers data
SELECT id, date, "groupName", type, workers
FROM worklog
ORDER BY created_at DESC
LIMIT 1;

-- 2. Check group members for '1조' (assuming A조 is 1조 or similar, checking group names first)
SELECT g.name as group_name, u.name as user_name, u.role, gm.display_order
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
JOIN users u ON gm.user_id = u.id
ORDER BY g.name, gm.display_order;
