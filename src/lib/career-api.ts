import { supabase } from '@/integrations/supabase/client';
import { Contract } from './contract-api';
import { WorkerReview, getWorkerReviews, getWorkerAverageRating } from './review-api';
import { differenceInDays, differenceInMonths, parseISO, format } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface CareerItem {
  contract: Contract;
  review: WorkerReview | null;
  durationDays: number;
  durationText: string;
}

export interface CareerSummary {
  totalContracts: number;
  totalWorkDays: number;
  totalWorkDaysText: string;
  averageRating: number;
  ratingCount: number;
  workplaces: string[];
  jobTypes: string[];
  careers: CareerItem[];
}

// Get all contracts for a worker (including soft-deleted ones for career history)
export async function getWorkerAllContracts(workerId: string): Promise<Contract[]> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('worker_id', workerId)
    .eq('status', 'completed')
    .order('start_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as Contract[];
}

// Calculate work duration from contract
function calculateWorkDuration(contract: Contract): { days: number; text: string } {
  const startDate = parseISO(contract.start_date);
  const endDate = contract.signed_at ? parseISO(contract.signed_at) : new Date();
  
  const days = differenceInDays(endDate, startDate);
  const months = differenceInMonths(endDate, startDate);
  
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return {
      days,
      text: remainingMonths > 0 ? `${years}년 ${remainingMonths}개월` : `${years}년`
    };
  } else if (months >= 1) {
    return { days, text: `${months}개월` };
  } else if (days >= 7) {
    const weeks = Math.floor(days / 7);
    return { days, text: `${weeks}주` };
  } else {
    return { days: Math.max(days, 1), text: `${Math.max(days, 1)}일` };
  }
}

// Get comprehensive career summary for a worker
export async function getWorkerCareerSummary(workerId: string): Promise<CareerSummary> {
  // Fetch contracts and reviews in parallel
  const [contracts, reviews, ratingInfo] = await Promise.all([
    getWorkerAllContracts(workerId),
    getWorkerReviews(workerId),
    getWorkerAverageRating(workerId)
  ]);

  // Create a map of reviews by contract_id
  const reviewMap = new Map<string, WorkerReview>();
  reviews.forEach(review => {
    reviewMap.set(review.contract_id, review);
  });

  // Build career items
  const careers: CareerItem[] = contracts.map(contract => {
    const duration = calculateWorkDuration(contract);
    return {
      contract,
      review: reviewMap.get(contract.id) || null,
      durationDays: duration.days,
      durationText: duration.text
    };
  });

  // Calculate totals
  const totalWorkDays = careers.reduce((sum, career) => sum + career.durationDays, 0);
  
  // Format total work days
  let totalWorkDaysText: string;
  if (totalWorkDays >= 365) {
    const years = Math.floor(totalWorkDays / 365);
    const remainingMonths = Math.floor((totalWorkDays % 365) / 30);
    totalWorkDaysText = remainingMonths > 0 ? `${years}년 ${remainingMonths}개월` : `${years}년`;
  } else if (totalWorkDays >= 30) {
    const months = Math.floor(totalWorkDays / 30);
    totalWorkDaysText = `${months}개월`;
  } else {
    totalWorkDaysText = `${totalWorkDays}일`;
  }

  // Get unique workplaces and job types
  const workplaces = [...new Set(contracts.map(c => c.business_name || c.employer_name).filter(Boolean))];
  const jobTypes = [...new Set(contracts.map(c => c.job_description).filter(Boolean))] as string[];

  return {
    totalContracts: contracts.length,
    totalWorkDays,
    totalWorkDaysText,
    averageRating: ratingInfo.average,
    ratingCount: ratingInfo.count,
    workplaces,
    jobTypes,
    careers
  };
}

// Format date range for display
export function formatContractPeriod(contract: Contract): string {
  const start = parseISO(contract.start_date);
  const startFormatted = format(start, 'yyyy.MM.dd', { locale: ko });
  
  if (contract.signed_at) {
    const end = parseISO(contract.signed_at);
    const endFormatted = format(end, 'yyyy.MM.dd', { locale: ko });
    return `${startFormatted} ~ ${endFormatted}`;
  }
  
  return `${startFormatted} ~`;
}
