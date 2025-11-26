-- Create work_sessions table
CREATE TABLE IF NOT EXISTS public.work_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.groups(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create work_session_members table
CREATE TABLE IF NOT EXISTS public.work_session_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.work_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- Can reference users or support_staff, so no FK constraint for flexibility or need polymorphic relation. For now, just UUID.
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    is_substitute BOOLEAN DEFAULT false,
    original_member_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_session_members ENABLE ROW LEVEL SECURITY;

-- Policies (Public for now for simplicity, or Authenticated)
CREATE POLICY "Enable read access for all users" ON public.work_sessions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.work_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.work_sessions FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.work_session_members FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.work_session_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.work_session_members FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.work_session_members FOR DELETE USING (true);
