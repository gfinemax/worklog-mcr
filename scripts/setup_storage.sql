-- Create 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Remove the ALTER TABLE command which causes permission errors
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policies (Using DO block to avoid errors if they already exist)
DO $$
BEGIN
    -- 1. Public Read Access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access'
    ) THEN
        CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
    END IF;

    -- 2. Public Upload Access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Upload'
    ) THEN
        CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' );
    END IF;

    -- 3. Public Update Access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Update'
    ) THEN
        CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'avatars' );
    END IF;

    -- 4. Public Delete Access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Delete'
    ) THEN
        CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING ( bucket_id = 'avatars' );
    END IF;
END
$$;
