-- Drop the overly permissive policy that shows all pending contracts to everyone
DROP POLICY IF EXISTS "Public can view pending contracts for signing" ON public.contracts;

-- Create a new policy: Workers can only view pending contracts if they have an invitation
CREATE POLICY "Workers can view pending contracts with invitation" 
ON public.contracts 
FOR SELECT 
USING (
  status = 'pending' 
  AND EXISTS (
    SELECT 1 FROM contract_invitations ci
    JOIN profiles p ON p.phone = ci.phone
    WHERE ci.contract_id = contracts.id
    AND p.user_id = auth.uid()
    AND ci.status = 'pending'
  )
);