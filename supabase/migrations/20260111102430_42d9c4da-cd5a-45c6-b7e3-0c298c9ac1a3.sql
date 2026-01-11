-- Add phone column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Create contract_invitations table to track invitations
CREATE TABLE IF NOT EXISTS public.contract_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  invited_at timestamp with time zone NOT NULL DEFAULT now(),
  accepted_at timestamp with time zone,
  worker_id uuid
);

-- Enable RLS
ALTER TABLE public.contract_invitations ENABLE ROW LEVEL SECURITY;

-- Employers can create invitations for their contracts
CREATE POLICY "Employers can create invitations for their contracts"
ON public.contract_invitations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE contracts.id = contract_id 
    AND contracts.employer_id = auth.uid()
  )
);

-- Employers can view invitations for their contracts
CREATE POLICY "Employers can view their contract invitations"
ON public.contract_invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE contracts.id = contract_id 
    AND contracts.employer_id = auth.uid()
  )
);

-- Workers can view their own invitations (by phone or worker_id)
CREATE POLICY "Workers can view their invitations"
ON public.contract_invitations
FOR SELECT
USING (worker_id = auth.uid());

-- Workers can update their invitation (accept)
CREATE POLICY "Workers can accept invitations"
ON public.contract_invitations
FOR UPDATE
USING (worker_id = auth.uid() OR status = 'pending');