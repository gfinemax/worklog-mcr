-- Create shift_pattern_configs table
CREATE TABLE IF NOT EXISTS public.shift_pattern_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    valid_from DATE NOT NULL,
    valid_to DATE, -- NULL means active indefinitely until next config
    cycle_length INTEGER NOT NULL,
    pattern_json JSONB NOT NULL, -- Array of daily schedules
    roles_json JSONB NOT NULL, -- Array of active roles
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.shift_pattern_configs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.shift_pattern_configs;
CREATE POLICY "Enable read access for all users" ON public.shift_pattern_configs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.shift_pattern_configs;
CREATE POLICY "Enable insert access for authenticated users" ON public.shift_pattern_configs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.shift_pattern_configs;
CREATE POLICY "Enable update access for authenticated users" ON public.shift_pattern_configs FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert Initial Configuration (10-Day Cycle from 2025-11-06)
INSERT INTO public.shift_pattern_configs (valid_from, cycle_length, roles_json, pattern_json)
VALUES (
    '2025-11-06',
    10,
    '["감독", "부감독", "영상"]'::jsonb,
    '[
        {"day": 0, "A": {"team": "1조", "is_swap": false}, "N": {"team": "4조", "is_swap": true}},
        {"day": 1, "A": {"team": "3조", "is_swap": true},  "N": {"team": "1조", "is_swap": false}},
        {"day": 2, "A": {"team": "5조", "is_swap": false}, "N": {"team": "3조", "is_swap": true}},
        {"day": 3, "A": {"team": "2조", "is_swap": true},  "N": {"team": "5조", "is_swap": false}},
        {"day": 4, "A": {"team": "4조", "is_swap": false}, "N": {"team": "3조", "is_swap": true}},
        {"day": 5, "A": {"team": "1조", "is_swap": true},  "N": {"team": "4조", "is_swap": false}},
        {"day": 6, "A": {"team": "3조", "is_swap": false}, "N": {"team": "1조", "is_swap": true}},
        {"day": 7, "A": {"team": "5조", "is_swap": true},  "N": {"team": "3조", "is_swap": false}},
        {"day": 8, "A": {"team": "2조", "is_swap": false}, "N": {"team": "5조", "is_swap": true}},
        {"day": 9, "A": {"team": "4조", "is_swap": true},  "N": {"team": "2조", "is_swap": false}}
    ]'::jsonb
);
