-- 1. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add slug column if it doesn't exist
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to posts table if they don't exist
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT '일반';
-- Drop existing check constraint if needed to avoid duplication error, or just add column. 
-- For simplicity in this script, we assume standard adding.
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS resolution_note TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS worklog_id UUID REFERENCES public.worklogs(id) ON DELETE SET NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS channel TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- 3. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Insert Default Categories (Upsert)
INSERT INTO public.categories (name, slug, description) VALUES
('채널 운행', 'channel-operation', '채널별 방송 운행 관련 사항'),
('장비 점검', 'equipment-check', '정기 및 수시 장비 점검 기록'),
('시스템 이슈', 'system-issue', '시스템 오류 및 이상 현상'),
('긴급 사항', 'emergency', '즉시 대응이 필요한 긴급 이슈'),
('정기 점검', 'regular-check', '정기적인 유지보수 및 점검'),
('송출 사고', 'broadcast-accident', '방송 송출 중 발생한 사고'),
('기술 지원', 'tech-support', '기술조 협업 및 지원 요청'),
('운영 공지', 'operation-notice', '조 내 공지 및 안내사항'),
('협업 요청', 'collaboration', '타 부서/조 협업 관련'),
('기타', 'others', '위 카테고리에 속하지 않는 사항')
ON CONFLICT (name) DO UPDATE SET
    slug = EXCLUDED.slug,
    description = EXCLUDED.description;
