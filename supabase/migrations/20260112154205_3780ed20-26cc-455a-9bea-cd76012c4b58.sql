-- Add employer_deleted_at column to contracts table for soft delete feature
ALTER TABLE public.contracts
ADD COLUMN employer_deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;