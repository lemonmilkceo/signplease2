-- 사용자 크레딧 테이블
CREATE TABLE public.user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    free_credits INTEGER NOT NULL DEFAULT 5,
    paid_credits INTEGER NOT NULL DEFAULT 0,
    total_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- 사용자 본인의 크레딧만 조회 가능
CREATE POLICY "Users can view own credits"
ON public.user_credits
FOR SELECT
USING (auth.uid() = user_id);

-- 사용자 본인의 크레딧만 수정 가능
CREATE POLICY "Users can update own credits"
ON public.user_credits
FOR UPDATE
USING (auth.uid() = user_id);

-- 사용자 본인의 크레딧 생성 가능
CREATE POLICY "Users can insert own credits"
ON public.user_credits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 크레딧 사용 함수 (계약서 생성 시 호출)
CREATE OR REPLACE FUNCTION public.use_credit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_free INTEGER;
    v_paid INTEGER;
BEGIN
    SELECT free_credits, paid_credits INTO v_free, v_paid
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        -- 새 사용자면 크레딧 레코드 생성
        INSERT INTO user_credits (user_id, free_credits, paid_credits, total_used)
        VALUES (p_user_id, 4, 0, 1);
        RETURN TRUE;
    END IF;
    
    IF v_free > 0 THEN
        UPDATE user_credits
        SET free_credits = free_credits - 1,
            total_used = total_used + 1,
            updated_at = now()
        WHERE user_id = p_user_id;
        RETURN TRUE;
    ELSIF v_paid > 0 THEN
        UPDATE user_credits
        SET paid_credits = paid_credits - 1,
            total_used = total_used + 1,
            updated_at = now()
        WHERE user_id = p_user_id;
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- 잔여 크레딧 조회 함수
CREATE OR REPLACE FUNCTION public.get_remaining_credits(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total INTEGER;
BEGIN
    SELECT COALESCE(free_credits, 5) + COALESCE(paid_credits, 0) INTO v_total
    FROM user_credits
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN 5; -- 신규 사용자 기본 무료 크레딧
    END IF;
    
    RETURN v_total;
END;
$$;

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_user_credits_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();