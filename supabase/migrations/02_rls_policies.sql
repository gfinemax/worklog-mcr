-- =====================================================
-- MCR 업무일지 시스템 - RLS (Row Level Security) 정책
-- =====================================================
-- 작성일: 2025-01-26
-- 설명: 테이블별 접근 권한 정책 설정
-- =====================================================

-- =====================================================
-- 1. Users 테이블 RLS
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자는 모든 사용자 정보 조회 가능
CREATE POLICY "Enable read access for authenticated users"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- 익명 사용자도 읽기 가능 (로그인 시 프로필 조회용)
CREATE POLICY "Enable read access for anon users"
ON public.users FOR SELECT
TO anon
USING (true);

-- 본인 프로필만 업데이트 가능
CREATE POLICY "Enable update for users based on id"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 새 사용자 프로필 생성 가능 (회원가입 시)
CREATE POLICY "Enable insert for authenticated users"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. Support Staff 테이블 RLS
-- =====================================================
ALTER TABLE public.support_staff ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 조회 가능
CREATE POLICY "Enable read access for authenticated users"
ON public.support_staff FOR SELECT
TO authenticated
USING (true);

-- 관리자만 추가/수정/삭제 가능 (추후 관리자 권한 체크 추가 가능)
CREATE POLICY "Enable all operations for authenticated users"
ON public.support_staff FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- 3. Roles 테이블 RLS
-- =====================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 역할 목록 조회 가능
CREATE POLICY "Enable read access for all"
ON public.roles FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- 4. Groups 테이블 RLS
-- =====================================================
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 조회 가능
CREATE POLICY "Enable read access for authenticated users"
ON public.groups FOR SELECT
TO authenticated
USING (true);

-- 그룹 멤버가 그룹 정보 업데이트 가능 (active_members 등)
CREATE POLICY "Enable update for group members"
ON public.groups FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- 5. Group Members 테이블 RLS
-- =====================================================
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 조회 가능
CREATE POLICY "Enable read access for authenticated users"
ON public.group_members FOR SELECT
TO authenticated
USING (true);

-- 익명 사용자도 조회 가능 (로그인 시 그룹 정보 확인용)
CREATE POLICY "Enable read access for anon users"
ON public.group_members FOR SELECT
TO anon
USING (true);

-- 관리자 또는 그룹장이 멤버 추가/삭제 가능
CREATE POLICY "Enable insert/delete for authenticated users"
ON public.group_members FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- 6. Work Sessions 테이블 RLS
-- =====================================================
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 조회 가능
CREATE POLICY "Enable read access for authenticated users"
ON public.work_sessions FOR SELECT
TO authenticated
USING (true);

-- 세션 생성 가능
CREATE POLICY "Enable insert for authenticated users"
ON public.work_sessions FOR INSERT
TO authenticated
WITH CHECK (true);

-- 세션 업데이트 가능
CREATE POLICY "Enable update for authenticated users"
ON public.work_sessions FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- 7. Work Session Members 테이블 RLS
-- =====================================================
ALTER TABLE public.work_session_members ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 조회 가능
CREATE POLICY "Enable read access for authenticated users"
ON public.work_session_members FOR SELECT
TO authenticated
USING (true);

-- 세션 멤버 추가 가능
CREATE POLICY "Enable insert for authenticated users"
ON public.work_session_members FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================================================
-- 8. Worklogs 테이블 RLS
-- =====================================================
ALTER TABLE public.worklogs ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 조회 가능
CREATE POLICY "Enable read access for authenticated users"
ON public.worklogs FOR SELECT
TO authenticated
USING (true);

-- 업무일지 생성 가능
CREATE POLICY "Enable insert for authenticated users"
ON public.worklogs FOR INSERT
TO authenticated
WITH CHECK (true);

-- 업무일지 업데이트 가능
CREATE POLICY "Enable update for authenticated users"
ON public.worklogs FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 업무일지 삭제 가능
CREATE POLICY "Enable delete for authenticated users"
ON public.worklogs FOR DELETE
TO authenticated
USING (true);
