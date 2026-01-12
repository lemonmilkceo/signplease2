-- 폴더 테이블 생성
CREATE TABLE public.contract_folders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT 'gray',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.contract_folders ENABLE ROW LEVEL SECURITY;

-- 폴더 RLS 정책
CREATE POLICY "Users can view their own folders" 
ON public.contract_folders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders" 
ON public.contract_folders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" 
ON public.contract_folders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" 
ON public.contract_folders 
FOR DELETE 
USING (auth.uid() = user_id);

-- 계약서 테이블에 폴더 컬럼 추가
ALTER TABLE public.contracts ADD COLUMN folder_id UUID REFERENCES public.contract_folders(id) ON DELETE SET NULL;

-- 계약서 삭제 정책 추가
CREATE POLICY "Employers can delete their contracts" 
ON public.contracts 
FOR DELETE 
USING (auth.uid() = employer_id);

-- 트리거 추가
CREATE TRIGGER update_contract_folders_updated_at
BEFORE UPDATE ON public.contract_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();