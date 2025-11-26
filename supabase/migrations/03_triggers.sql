-- =====================================================
-- MCR 업무일지 시스템 - 트리거 및 자동화
-- =====================================================
-- 작성일: 2025-01-26
-- 설명: 자동 프로필 생성 및 데이터 동기화 트리거
-- =====================================================

-- =====================================================
-- 1. 새 사용자 자동 프로필 생성 트리거
-- =====================================================
-- auth.users에 신규 사용자가 생성되면 자동으로 public.users에도 프로필 생성

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        'tech_staff'
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- 트리거 생성 (기존 트리거가 있다면 삭제 후 재생성)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. Google OAuth 사용자 자동 프로필 업데이트
-- =====================================================
-- Google 로그인 시 프로필 이미지 및 이름 자동 업데이트

CREATE OR REPLACE FUNCTION public.handle_user_metadata_update()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- raw_user_meta_data에서 이름과 프로필 이미지 추출
    IF NEW.raw_user_meta_data IS NOT NULL THEN
        UPDATE public.users
        SET
            name = COALESCE(NEW.raw_user_meta_data->>'name', name),
            profile_image_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', profile_image_url),
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
    EXECUTE FUNCTION public.handle_user_metadata_update();

-- =====================================================
-- 3. 세션 종료 시 자동 처리
-- =====================================================
-- work_sessions의 status가 'completed'로 변경되면 end_time 자동 설정

CREATE OR REPLACE FUNCTION public.handle_session_completion()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.end_time = NOW();
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_session_completed ON public.work_sessions;

CREATE TRIGGER on_session_completed
    BEFORE UPDATE ON public.work_sessions
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION public.handle_session_completion();

-- =====================================================
-- 4. 사용자 삭제 시 연관 데이터 처리
-- =====================================================
-- auth.users 삭제 시 관련 데이터 자동 정리 (CASCADE로 처리되지만 추가 로직 가능)

CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- 추가적인 정리 작업이 필요한 경우 여기에 작성
    -- 예: 로그 기록, 백업 등
    RAISE NOTICE 'User % has been deleted', OLD.email;

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

CREATE TRIGGER on_auth_user_deleted
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_deletion();
