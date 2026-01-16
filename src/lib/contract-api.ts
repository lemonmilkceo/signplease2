import { supabase } from '@/integrations/supabase/client';
import { isContractEditable, CONTRACT_EDIT_PERIOD_DAYS } from '@/lib/contract-utils';

export interface ContractInput {
  workerName: string;
  hourlyWage: number;
  startDate: string;
  endDate?: string;
  noEndDate: boolean;
  workDays: string[];
  workDaysPerWeek?: number;
  workStartTime: string;
  workEndTime: string;
  workLocation: string;
  businessName?: string;
  jobDescription?: string;
  employerName: string;
  breakTimeMinutes?: number;
  businessSize?: string;
  overtimePerHour?: number;
  holidayPerDay?: number;
  annualLeavePerDay?: number;
  wageType?: 'hourly' | 'monthly';
  monthlyWage?: number;
  includeWeeklyHolidayPay?: boolean;
  paymentDay?: number;
  paymentMonth?: 'current' | 'next';
  paymentEndOfMonth?: boolean;
}

export interface Contract {
  id: string;
  employer_id: string;
  worker_id: string | null;
  employer_name: string;
  worker_name: string;
  hourly_wage: number;
  start_date: string;
  end_date: string | null;
  no_end_date: boolean;
  work_days: string[];
  work_days_per_week?: number | null;
  work_start_time: string;
  work_end_time: string;
  work_location: string;
  business_name: string | null;
  job_description: string | null;
  status: 'draft' | 'pending' | 'signed' | 'completed';
  employer_signature: string | null;
  worker_signature: string | null;
  contract_content: string | null;
  created_at: string;
  updated_at: string;
  signed_at: string | null;
  folder_id: string | null;
  break_time_minutes?: number | null;
  business_size?: string | null;
  overtime_per_hour?: number | null;
  holiday_per_day?: number | null;
  annual_leave_per_day?: number | null;
  wage_type: 'hourly' | 'monthly';
  monthly_wage: number | null;
  include_weekly_holiday_pay: boolean;
  payment_day: number | null;
  payment_month: 'current' | 'next';
  payment_end_of_month: boolean;
  worker_deleted_at?: string | null;
  employer_deleted_at?: string | null;
}

export interface ContractFolder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

// Generate contract content using AI
export async function generateContractContent(data: ContractInput): Promise<string> {
  const response = await supabase.functions.invoke('generate-contract', {
    body: data,
  });

  if (response.error) {
    throw new Error(response.error.message || '계약서 생성에 실패했습니다');
  }

  return response.data.contractContent;
}

// Create a new contract in the database
export async function createContract(
  data: ContractInput,
  contractContent: string,
  employerId: string
): Promise<Contract> {
  const { data: contract, error } = await supabase
    .from('contracts')
    .insert({
      employer_id: employerId,
      employer_name: data.employerName,
      worker_name: data.workerName,
      hourly_wage: data.hourlyWage,
      start_date: data.startDate,
      end_date: data.endDate || null,
      no_end_date: data.noEndDate,
      work_days: data.workDays,
      work_days_per_week: data.workDaysPerWeek || null,
      work_start_time: data.workStartTime,
      work_end_time: data.workEndTime,
      work_location: data.workLocation,
      business_name: data.businessName || null,
      job_description: data.jobDescription || null,
      contract_content: contractContent,
      status: 'draft',
      break_time_minutes: data.breakTimeMinutes || 0,
      business_size: data.businessSize || 'under5',
      overtime_per_hour: data.overtimePerHour || null,
      holiday_per_day: data.holidayPerDay || null,
      annual_leave_per_day: data.annualLeavePerDay || null,
      wage_type: data.wageType || 'hourly',
      monthly_wage: data.monthlyWage || null,
      include_weekly_holiday_pay: data.includeWeeklyHolidayPay || false,
      payment_day: data.paymentDay || null,
      payment_month: data.paymentMonth || 'current',
      payment_end_of_month: data.paymentEndOfMonth || false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return contract as Contract;
}

// Get all contracts for an employer (excluding soft-deleted ones)
export async function getEmployerContracts(employerId: string): Promise<Contract[]> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('employer_id', employerId)
    .is('employer_deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as Contract[];
}

// Get soft-deleted contracts for an employer (trash)
export async function getEmployerTrashedContracts(employerId: string): Promise<Contract[]> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('employer_id', employerId)
    .not('employer_deleted_at', 'is', null)
    .order('employer_deleted_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as Contract[];
}

// Soft delete contracts for employers (sets employer_deleted_at timestamp)
export async function softDeleteContractsForEmployer(contractIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .update({ employer_deleted_at: new Date().toISOString() })
    .in('id', contractIds);

  if (error) {
    throw new Error(error.message);
  }
}

// Restore soft-deleted contracts for employers (clears employer_deleted_at timestamp)
export async function restoreContractsForEmployer(contractIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .update({ employer_deleted_at: null })
    .in('id', contractIds);

  if (error) {
    throw new Error(error.message);
  }
}

// Get a single contract by ID
export async function getContract(contractId: string): Promise<Contract | null> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Contract | null;
}

// Update contract (for signing or editing)
// Note: Editing is only allowed within CONTRACT_EDIT_PERIOD_DAYS of creation
export async function updateContract(
  contractId: string,
  updates: Partial<Contract>,
  skipEditCheck: boolean = false // For signing operations which should always be allowed
): Promise<Contract> {
  // If not skipping check and trying to edit content fields, verify edit period
  if (!skipEditCheck) {
    const currentContract = await getContract(contractId);
    if (currentContract && !isContractEditable(currentContract.created_at)) {
      // Only block non-signature updates
      const isSignatureUpdate = 'employer_signature' in updates || 'worker_signature' in updates || 'status' in updates || 'signed_at' in updates;
      if (!isSignatureUpdate) {
        throw new Error(`수정 가능 기간(${CONTRACT_EDIT_PERIOD_DAYS}일)이 지나 수정할 수 없습니다`);
      }
    }
  }

  const { data, error } = await supabase
    .from('contracts')
    .update(updates)
    .eq('id', contractId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Contract;
}

// Sign contract as employer
export async function signContractAsEmployer(
  contractId: string,
  signature: string
): Promise<Contract> {
  return updateContract(contractId, {
    employer_signature: signature,
    status: 'pending',
  });
}

// Sign contract as worker
export async function signContractAsWorker(
  contractId: string,
  signature: string,
  workerId: string
): Promise<Contract> {
  // Update the contract with worker signature
  const contract = await updateContract(contractId, {
    worker_id: workerId,
    worker_signature: signature,
    status: 'completed',
    signed_at: new Date().toISOString(),
  });

  // Update contract invitation status to accepted
  await supabase
    .from('contract_invitations')
    .update({
      status: 'accepted',
      worker_id: workerId,
      accepted_at: new Date().toISOString(),
    })
    .eq('contract_id', contractId);

  return contract;
}

// Explain a legal term using AI
export async function explainTerm(term: string, context?: string): Promise<string> {
  const response = await supabase.functions.invoke('explain-term', {
    body: { term, context },
  });

  if (response.error) {
    throw new Error(response.error.message || '용어 설명에 실패했습니다');
  }

  return response.data.explanation;
}

// Delete a contract (hard delete - for employers)
export async function deleteContract(contractId: string): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', contractId);

  if (error) {
    throw new Error(error.message);
  }
}

// Delete multiple contracts (hard delete - for employers)
export async function deleteContracts(contractIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .delete()
    .in('id', contractIds);

  if (error) {
    throw new Error(error.message);
  }
}

// Soft delete contracts for workers (sets worker_deleted_at timestamp)
// This hides the contract from worker's dashboard but keeps it visible for employers
// and preserves data for career history features
export async function softDeleteContractsForWorker(contractIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .update({ worker_deleted_at: new Date().toISOString() })
    .in('id', contractIds);

  if (error) {
    throw new Error(error.message);
  }
}

// Restore soft-deleted contracts for workers (clears worker_deleted_at timestamp)
export async function restoreContractsForWorker(contractIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .update({ worker_deleted_at: null })
    .in('id', contractIds);

  if (error) {
    throw new Error(error.message);
  }
}

// Get soft-deleted contracts for a worker (trash)
export async function getWorkerTrashedContracts(workerId: string): Promise<Contract[]> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('worker_id', workerId)
    .not('worker_deleted_at', 'is', null)
    .order('worker_deleted_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as Contract[];
}

// Get all folders for a user
export async function getFolders(userId: string): Promise<ContractFolder[]> {
  const { data, error } = await supabase
    .from('contract_folders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as ContractFolder[];
}

// Create a folder
export async function createFolder(userId: string, name: string, color: string = 'gray'): Promise<ContractFolder> {
  const { data, error } = await supabase
    .from('contract_folders')
    .insert({ user_id: userId, name, color })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ContractFolder;
}

// Delete a folder
export async function deleteFolder(folderId: string): Promise<void> {
  const { error } = await supabase
    .from('contract_folders')
    .delete()
    .eq('id', folderId);

  if (error) {
    throw new Error(error.message);
  }
}

// Move contracts to a folder
export async function moveContractsToFolder(contractIds: string[], folderId: string | null): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .update({ folder_id: folderId })
    .in('id', contractIds);

  if (error) {
    throw new Error(error.message);
  }
}

// Update folder
export async function updateFolder(folderId: string, updates: { name?: string; color?: string }): Promise<ContractFolder> {
  const { data, error } = await supabase
    .from('contract_folders')
    .update(updates)
    .eq('id', folderId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ContractFolder;
}

// Permanently delete contracts for employer
export async function permanentDeleteContractsForEmployer(contractIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .delete()
    .in('id', contractIds);

  if (error) {
    throw new Error(error.message);
  }
}
