
-- Create shift_configs table
CREATE TABLE IF NOT EXISTS shift_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_name TEXT NOT NULL,
    cycle_length INT NOT NULL DEFAULT 10,
    anchor_date DATE NOT NULL,
    shift_sequence TEXT[] NOT NULL,
    role_rotation_map JSONB NOT NULL,
    team_offsets JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shift_configs ENABLE ROW LEVEL SECURITY;

-- Create policy for reading (public read)
CREATE POLICY "Allow public read access" ON shift_configs FOR SELECT USING (true);

-- Create policy for insert/update (authenticated users only, ideally admins but for now all auth)
CREATE POLICY "Allow auth insert" ON shift_configs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow auth update" ON shift_configs FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert default configuration
INSERT INTO shift_configs (pattern_name, cycle_length, anchor_date, shift_sequence, role_rotation_map, team_offsets)
VALUES (
    '5조 10교대 (ANSYY x 2)',
    10,
    '2025-11-06',
    ARRAY['A', 'N', 'S', 'Y', 'Y', 'A', 'N', 'S', 'Y', 'Y'],
    '[
        {"director": 0, "assistant": 1, "video": 2},
        {"director": 0, "assistant": 1, "video": 2},
        {"director": 0, "assistant": 1, "video": 2},
        {"director": 0, "assistant": 1, "video": 2},
        {"director": 0, "assistant": 1, "video": 2},
        {"director": 1, "assistant": 0, "video": 2},
        {"director": 1, "assistant": 0, "video": 2},
        {"director": 1, "assistant": 0, "video": 2},
        {"director": 1, "assistant": 0, "video": 2},
        {"director": 1, "assistant": 0, "video": 2}
    ]'::jsonb,
    '{
        "1조": 0,
        "2조": 1,
        "3조": 2,
        "4조": 3,
        "5조": 4
    }'::jsonb
);
