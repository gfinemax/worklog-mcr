-- =====================================================
-- MCR 업무일지 시스템 - 데이터베이스 스키마
-- =====================================================
-- 작성일: 2025-01-26
-- 설명: 주조정실 업무일지 시스템의 핵심 테이블 생성
-- =====================================================

-- 1. Users 테이블: 사용자 프로필 정보
-- auth.users와 1:1 연결되는 공개 프로필 테이블
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'tech_staff' CHECK (role IN ('tech_staff', 'operations_staff', 'team_leader', 'admin')),
    pin_code TEXT,
    profile_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Support Staff 테이블: 지원 인력 (외부 순환 근무자)
CREATE TABLE IF NOT EXISTS public.support_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Roles 테이블: 근무 역할 정의
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('individual', 'group', 'both')),
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Groups 테이블: 근무조 정보
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    active_members UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Group Members 테이블: 근무조 소속 멤버
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT '영상',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- 6. Work Sessions 테이블: 실제 근무 세션 기록
CREATE TABLE IF NOT EXISTS public.work_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Work Session Members 테이블: 세션별 실제 근무자 스냅샷
CREATE TABLE IF NOT EXISTS public.work_session_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.work_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    is_substitute BOOLEAN DEFAULT FALSE,
    original_member_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Worklogs 테이블: 업무일지 (기존 로컬 스토어 데이터 마이그레이션용)
CREATE TABLE IF NOT EXISTS public.worklogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.work_sessions(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    team TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('주간', '야간')),
    workers JSONB DEFAULT '{"director":[],"assistant":[],"video":[]}',
    status TEXT NOT NULL DEFAULT '작성중' CHECK (status IN ('작성중', '근무종료', '서명완료')),
    signature TEXT DEFAULT '0/4',
    is_important BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_name ON public.users(name);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_date ON public.work_sessions(date);
CREATE INDEX IF NOT EXISTS idx_work_sessions_group_id ON public.work_sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_work_session_members_session_id ON public.work_session_members(session_id);
CREATE INDEX IF NOT EXISTS idx_worklogs_date ON public.worklogs(date);
CREATE INDEX IF NOT EXISTS idx_worklogs_session_id ON public.worklogs(session_id);

-- Updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at 트리거 적용
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_staff_updated_at BEFORE UPDATE ON public.support_staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_sessions_updated_at BEFORE UPDATE ON public.work_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worklogs_updated_at BEFORE UPDATE ON public.worklogs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
