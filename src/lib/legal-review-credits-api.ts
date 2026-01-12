import { supabase } from "@/integrations/supabase/client";

export interface LegalReviewCredits {
  id: string;
  user_id: string;
  free_reviews: number;
  paid_reviews: number;
  total_used: number;
  created_at: string;
  updated_at: string;
}

export interface LegalReviewPricingPlan {
  id: string;
  name: string;
  reviews: number;
  price: number;
  pricePerReview: number;
  popular?: boolean;
  savings?: number;
  description?: string;
}

// AI 노무사 법률 검토 요금제 - 합리적인 가격 설정
export const LEGAL_REVIEW_PRICING_PLANS: LegalReviewPricingPlan[] = [
  {
    id: 'single',
    name: '1회',
    reviews: 1,
    price: 3000,
    pricePerReview: 3000,
    description: '단건 검토가 필요할 때',
  },
  {
    id: 'starter',
    name: '5회 패키지',
    reviews: 5,
    price: 12000,
    pricePerReview: 2400,
    savings: 20,
    description: '일반 사업장 추천',
  },
  {
    id: 'business',
    name: '15회 패키지',
    reviews: 15,
    price: 30000,
    pricePerReview: 2000,
    popular: true,
    savings: 33,
    description: '다수 직원 고용 사업장',
  },
  {
    id: 'enterprise',
    name: '30회 패키지',
    reviews: 30,
    price: 45000,
    pricePerReview: 1500,
    savings: 50,
    description: '대량 검토 필요 시',
  },
];

export async function getLegalReviewCredits(userId: string): Promise<LegalReviewCredits | null> {
  const { data, error } = await supabase
    .from('legal_review_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No record found - new user with 3 free reviews
      return null;
    }
    console.error('Error fetching legal review credits:', error);
    throw error;
  }

  return data as LegalReviewCredits;
}

export async function getRemainingLegalReviews(userId: string): Promise<number> {
  const { data, error } = await supabase
    .rpc('get_remaining_legal_reviews', { p_user_id: userId });

  if (error) {
    console.error('Error getting remaining legal reviews:', error);
    return 3; // Default for new users
  }

  return data ?? 3;
}

export async function useLegalReview(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('use_legal_review', { p_user_id: userId });

  if (error) {
    console.error('Error using legal review:', error);
    throw error;
  }

  return data ?? false;
}

export async function initializeLegalReviewCredits(userId: string): Promise<LegalReviewCredits> {
  const { data, error } = await supabase
    .from('legal_review_credits')
    .insert({
      user_id: userId,
      free_reviews: 3,
      paid_reviews: 0,
      total_used: 0,
    })
    .select()
    .single();

  if (error) {
    // If already exists, just fetch
    if (error.code === '23505') {
      const existing = await getLegalReviewCredits(userId);
      if (existing) return existing;
    }
    throw error;
  }

  return data as LegalReviewCredits;
}

// 유료 법률 검토 크레딧 추가
export async function addPaidLegalReviews(userId: string, reviewsToAdd: number): Promise<void> {
  const current = await getLegalReviewCredits(userId);
  const currentPaid = current?.paid_reviews ?? 0;
  
  const { error } = await supabase
    .from('legal_review_credits')
    .update({
      paid_reviews: currentPaid + reviewsToAdd,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error adding legal review credits:', error);
    throw error;
  }
}
