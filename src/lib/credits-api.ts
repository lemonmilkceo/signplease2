import { supabase } from "@/integrations/supabase/client";

export interface UserCredits {
  id: string;
  user_id: string;
  free_credits: number;
  paid_credits: number;
  total_used: number;
  created_at: string;
  updated_at: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  popular?: boolean;
  savings?: number;
}

// 계약서 작성 요금제 - 합리적인 가격 설정
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'single',
    name: '1건',
    credits: 1,
    price: 1500,
    pricePerCredit: 1500,
  },
  {
    id: 'starter',
    name: '5건 패키지',
    credits: 5,
    price: 6000,
    pricePerCredit: 1200,
    savings: 20,
  },
  {
    id: 'business',
    name: '15건 패키지',
    credits: 15,
    price: 15000,
    pricePerCredit: 1000,
    popular: true,
    savings: 33,
  },
  {
    id: 'enterprise',
    name: '30건 패키지',
    credits: 30,
    price: 24000,
    pricePerCredit: 800,
    savings: 47,
  },
];

export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No record found - new user with 5 free credits
      return null;
    }
    console.error('Error fetching credits:', error);
    throw error;
  }

  return data as UserCredits;
}

export async function getRemainingCredits(userId: string): Promise<number> {
  const { data, error } = await supabase
    .rpc('get_remaining_credits', { p_user_id: userId });

  if (error) {
    console.error('Error getting remaining credits:', error);
    return 5; // Default for new users
  }

  return data ?? 5;
}

export async function useCredit(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('use_credit', { p_user_id: userId });

  if (error) {
    console.error('Error using credit:', error);
    throw error;
  }

  return data ?? false;
}

export async function initializeCredits(userId: string): Promise<UserCredits> {
  const { data, error } = await supabase
    .from('user_credits')
    .insert({
      user_id: userId,
      free_credits: 5,
      paid_credits: 0,
      total_used: 0,
    })
    .select()
    .single();

  if (error) {
    // If already exists, just fetch
    if (error.code === '23505') {
      const existing = await getUserCredits(userId);
      if (existing) return existing;
    }
    throw error;
  }

  return data as UserCredits;
}

// Simulate adding paid credits (실제 결제 연동 시 사용)
export async function addPaidCredits(userId: string, creditsToAdd: number): Promise<void> {
  // First get current credits
  const current = await getUserCredits(userId);
  const currentPaid = current?.paid_credits ?? 0;
  
  const { error } = await supabase
    .from('user_credits')
    .update({
      paid_credits: currentPaid + creditsToAdd,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error adding credits:', error);
    throw error;
  }
}
