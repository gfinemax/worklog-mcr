-- Create audit_logs table for tracking system changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g., 'UPDATE_SHIFT_PATTERN', 'MOVE_WORKER'
    target_type TEXT NOT NULL, -- e.g., 'SHIFT_CONFIG', 'USER'
    target_id UUID,
    changes JSONB, -- Stores before/after data or details
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster querying by date and user
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view logs (transparency)
CREATE POLICY "Everyone can view audit logs" ON public.audit_logs
    FOR SELECT USING (true);

-- Policy: Only authenticated users can insert logs (via application logic)
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
