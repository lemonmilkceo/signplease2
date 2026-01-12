import { supabase } from '@/integrations/supabase/client';

export interface WorkerReview {
  id: string;
  contract_id: string;
  employer_id: string;
  worker_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export const RATING_LABELS: Record<number, string> = {
  5: '최고예요',
  4: '좋았어요',
  3: '보통이에요',
  2: '아쉬웠어요',
  1: '별로였어요',
};

export const RATING_COLORS: Record<number, string> = {
  5: 'text-green-500 bg-green-500/10',
  4: 'text-blue-500 bg-blue-500/10',
  3: 'text-yellow-500 bg-yellow-500/10',
  2: 'text-orange-500 bg-orange-500/10',
  1: 'text-red-500 bg-red-500/10',
};

// Create a new review
export async function createReview(
  contractId: string,
  employerId: string,
  workerId: string,
  rating: number,
  comment?: string
): Promise<WorkerReview> {
  const { data, error } = await supabase
    .from('worker_reviews')
    .insert({
      contract_id: contractId,
      employer_id: employerId,
      worker_id: workerId,
      rating,
      comment: comment || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as WorkerReview;
}

// Update an existing review
export async function updateReview(
  reviewId: string,
  rating: number,
  comment?: string
): Promise<WorkerReview> {
  const { data, error } = await supabase
    .from('worker_reviews')
    .update({
      rating,
      comment: comment || null,
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as WorkerReview;
}

// Get review for a specific contract
export async function getReviewByContract(contractId: string): Promise<WorkerReview | null> {
  const { data, error } = await supabase
    .from('worker_reviews')
    .select('*')
    .eq('contract_id', contractId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as WorkerReview | null;
}

// Get all reviews for a worker
export async function getWorkerReviews(workerId: string): Promise<WorkerReview[]> {
  const { data, error } = await supabase
    .from('worker_reviews')
    .select('*')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as WorkerReview[];
}

// Get all reviews by an employer
export async function getEmployerReviews(employerId: string): Promise<WorkerReview[]> {
  const { data, error } = await supabase
    .from('worker_reviews')
    .select('*')
    .eq('employer_id', employerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as WorkerReview[];
}

// Get average rating for a worker
export async function getWorkerAverageRating(workerId: string): Promise<{ average: number; count: number }> {
  const { data, error } = await supabase
    .from('worker_reviews')
    .select('rating')
    .eq('worker_id', workerId);

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return { average: 0, count: 0 };
  }

  const sum = data.reduce((acc, review) => acc + review.rating, 0);
  return { 
    average: Math.round((sum / data.length) * 10) / 10, 
    count: data.length 
  };
}
