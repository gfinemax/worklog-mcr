-- Ensure RLS is enabled
ALTER TABLE public.shift_pattern_configs ENABLE ROW LEVEL SECURITY;

-- Drop existing delete policy to be sure
DROP POLICY IF EXISTS "Authenticated users can delete shift configs" ON public.shift_pattern_configs;

-- Re-create the policy allowing authenticated users to delete
CREATE POLICY "Authenticated users can delete shift configs" ON public.shift_pattern_configs
    FOR DELETE USING (auth.role() = 'authenticated');
