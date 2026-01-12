-- Create worker_reviews table for employer ratings
CREATE TABLE public.worker_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  employer_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- One review per contract
  UNIQUE(contract_id)
);

-- Enable RLS
ALTER TABLE public.worker_reviews ENABLE ROW LEVEL SECURITY;

-- Employers can create reviews for their completed contracts
CREATE POLICY "Employers can create reviews for their contracts"
ON public.worker_reviews
FOR INSERT
WITH CHECK (
  auth.uid() = employer_id 
  AND EXISTS (
    SELECT 1 FROM public.contracts c 
    WHERE c.id = contract_id 
    AND c.employer_id = auth.uid() 
    AND c.status = 'completed'
  )
);

-- Employers can view reviews they created
CREATE POLICY "Employers can view their reviews"
ON public.worker_reviews
FOR SELECT
USING (auth.uid() = employer_id);

-- Employers can update their own reviews
CREATE POLICY "Employers can update their reviews"
ON public.worker_reviews
FOR UPDATE
USING (auth.uid() = employer_id);

-- Workers can view reviews about them
CREATE POLICY "Workers can view their reviews"
ON public.worker_reviews
FOR SELECT
USING (auth.uid() = worker_id);

-- Add updated_at trigger
CREATE TRIGGER update_worker_reviews_updated_at
BEFORE UPDATE ON public.worker_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_worker_reviews_worker_id ON public.worker_reviews(worker_id);
CREATE INDEX idx_worker_reviews_employer_id ON public.worker_reviews(employer_id);