-- Add work_days_per_week column to contracts table
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS work_days_per_week integer;