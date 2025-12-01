
-- Add created_by column to posts table for audit trail
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Comment on column
COMMENT ON COLUMN public.posts.created_by IS 'Audit trail: The user who actually created the record, especially when author_id is NULL (Group Author)';
