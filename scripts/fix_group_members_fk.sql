
-- Add Foreign Key constraint to group_members table
ALTER TABLE group_members
ADD CONSTRAINT group_members_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users (id)
ON DELETE CASCADE;

-- Refresh schema cache (optional, but good practice)
NOTIFY pgrst, 'reload config';
