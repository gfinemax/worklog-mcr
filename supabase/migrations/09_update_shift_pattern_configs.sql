-- Ensure table exists (if not already created)
CREATE TABLE IF NOT EXISTS public.shift_pattern_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valid_from DATE NOT NULL,
    cycle_length INTEGER NOT NULL,
    pattern_json JSONB NOT NULL,
    roles_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns for Wizard history
ALTER TABLE public.shift_pattern_configs 
ADD COLUMN IF NOT EXISTS memo TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Index for faster sorting
CREATE INDEX IF NOT EXISTS idx_shift_pattern_configs_valid_from ON public.shift_pattern_configs(valid_from DESC);

-- RLS Policies
-- RLS Policies (Drop first to avoid conflicts)
ALTER TABLE public.shift_pattern_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view shift configs" ON public.shift_pattern_configs;
CREATE POLICY "Everyone can view shift configs" ON public.shift_pattern_configs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert shift configs" ON public.shift_pattern_configs;
CREATE POLICY "Authenticated users can insert shift configs" ON public.shift_pattern_configs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update shift configs" ON public.shift_pattern_configs;
CREATE POLICY "Authenticated users can update shift configs" ON public.shift_pattern_configs
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete shift configs" ON public.shift_pattern_configs;
CREATE POLICY "Authenticated users can delete shift configs" ON public.shift_pattern_configs
    FOR DELETE USING (auth.role() = 'authenticated');
