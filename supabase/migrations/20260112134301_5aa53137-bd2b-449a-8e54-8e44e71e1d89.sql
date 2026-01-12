-- Create a function to normalize phone numbers (remove hyphens, spaces, etc.)
CREATE OR REPLACE FUNCTION public.normalize_phone(phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g');
$$;

-- Drop the existing policy
DROP POLICY IF EXISTS "Workers can view pending contracts with invitation" ON public.contracts;

-- Create updated policy using normalized phone comparison
CREATE POLICY "Workers can view pending contracts with invitation" 
ON public.contracts 
FOR SELECT 
USING (
  status = 'pending' 
  AND EXISTS (
    SELECT 1 FROM contract_invitations ci
    JOIN profiles p ON public.normalize_phone(p.phone) = public.normalize_phone(ci.phone)
    WHERE ci.contract_id = contracts.id
    AND p.user_id = auth.uid()
    AND ci.status = 'pending'
  )
);