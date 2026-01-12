-- Add worker-specific fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN resident_number TEXT,
ADD COLUMN bank_name TEXT,
ADD COLUMN bank_account TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.resident_number IS 'Worker resident registration number (주민등록번호)';
COMMENT ON COLUMN public.profiles.bank_name IS 'Worker bank name for payment (은행명)';
COMMENT ON COLUMN public.profiles.bank_account IS 'Worker bank account number (계좌번호)';