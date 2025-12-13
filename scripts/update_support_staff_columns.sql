-- 담당자 목록 테이블 컬럼 변경
-- support_staff 테이블에서 role을 담당으로 변경하고, 회사와 분류 컬럼 추가

-- 1. role 컬럼을 담당으로 이름 변경
ALTER TABLE public.support_staff RENAME COLUMN role TO 담당;

-- 2. 회사 컬럼 추가
ALTER TABLE public.support_staff ADD COLUMN 회사 TEXT;

-- 3. 분류 컬럼 추가
ALTER TABLE public.support_staff ADD COLUMN 분류 TEXT;