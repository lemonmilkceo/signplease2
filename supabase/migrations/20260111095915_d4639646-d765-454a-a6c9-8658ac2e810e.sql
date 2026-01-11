-- contracts 테이블에 business_name 컬럼 추가
ALTER TABLE public.contracts 
ADD COLUMN business_name text;