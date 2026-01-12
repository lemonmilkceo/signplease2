-- Add worker_deleted_at column for soft delete functionality
ALTER TABLE public.contracts
ADD COLUMN worker_deleted_at timestamp with time zone DEFAULT NULL;

-- Add comment to explain the column's purpose
COMMENT ON COLUMN public.contracts.worker_deleted_at IS 'Timestamp when worker soft-deleted the contract. NULL means not deleted. Used for hiding from worker dashboard while preserving data for career history.';