-- Batch update Korean emails to English
-- Using the update_user_email function to ensure identity and profile are also updated.

DO $$
BEGIN
    -- 권영춘 -> kwon.ychun@mbcplus.com
    PERFORM update_user_email(
        (SELECT id FROM auth.users WHERE email = '권영춘@mbcplus.com'),
        'kwon.ychun@mbcplus.com'
    );

    -- 김단언 -> kim.daneon@mbcplus.com
    PERFORM update_user_email(
        (SELECT id FROM auth.users WHERE email = '김단언@mbcplus.com'),
        'kim.daneon@mbcplus.com'
    );

    -- 김소연 -> kim.soyeon@mbcplus.com
    PERFORM update_user_email(
        (SELECT id FROM auth.users WHERE email = '김소연@mbcplus.com'),
        'kim.soyeon@mbcplus.com'
    );

    -- 김준일 -> kim.junil@mbcplus.com
    PERFORM update_user_email(
        (SELECT id FROM auth.users WHERE email = '김준일@mbcplus.com'),
        'kim.junil@mbcplus.com'
    );

    -- 김희성 -> kim.hseong@mbcplus.com
    PERFORM update_user_email(
        (SELECT id FROM auth.users WHERE email = '김희성@mbcplus.com'),
        'kim.hseong@mbcplus.com'
    );

    -- 남궁장 -> nam.gungjang@mbcplus.com
    PERFORM update_user_email(
        (SELECT id FROM auth.users WHERE email = '남궁장@mbcplus.com'),
        'nam.gungjang@mbcplus.com'
    );

    -- 박상필 -> park.spil@mbcplus.com
    PERFORM update_user_email(
        (SELECT id FROM auth.users WHERE email = '박상필@mbcplus.com'),
        'park.spil@mbcplus.com'
    );

    -- 심창규 -> shim.cgyu@mbcplus.com
    PERFORM update_user_email(
        (SELECT id FROM auth.users WHERE email = '심창규@mbcplus.com'),
        'shim.cgyu@mbcplus.com'
    );

    -- 오동섭 -> oh.dseop@mbcplus.com
    PERFORM update_user_email(
        (SELECT id FROM auth.users WHERE email = '오동섭@mbcplus.com'),
        'oh.dseop@mbcplus.com'
    );

    -- 윤주현 -> yoon.jhyeon@mbcplus.com
    PERFORM update_user_email(
        (SELECT id FROM auth.users WHERE email = '윤주현@mbcplus.com'),
        'yoon.jhyeon@mbcplus.com'
    );

    -- 이석훈 -> lee.shoon@mbcplus.com
    PERFORM update_user_email(
        (SELECT id FROM auth.users WHERE email = '이석훈@mbcplus.com'),
        'lee.shoon@mbcplus.com'
    );

    -- 이종원 -> lee.jwon@mbcplus.com
    PERFORM update_user_email(
        (SELECT id FROM auth.users WHERE email = '이종원@mbcplus.com'),
        'lee.jwon@mbcplus.com'
    );

    -- 정광훈 (The one with Korean email) -> jung.ghun@mbcplus.com
    -- Note: gfinemax@gmail.com is already English, so we skip it.
    PERFORM update_user_email(
        (SELECT id FROM auth.users WHERE email = '정광훈@mbcplus.com'),
        'jung.ghun@mbcplus.com'
    );

    -- 천남웅 -> cheon.nwung@mbcplus.com
    PERFORM update_user_email(
        (SELECT id FROM auth.users WHERE email = '천남웅@mbcplus.com'),
        'cheon.nwung@mbcplus.com'
    );

    -- 황동성 -> hwang.dseong@mbcplus.com
    PERFORM update_user_email(
        (SELECT id FROM auth.users WHERE email = '황동성@mbcplus.com'),
        'hwang.dseong@mbcplus.com'
    );

END $$;
