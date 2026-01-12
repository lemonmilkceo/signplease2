import { supabase } from '@/integrations/supabase/client';
import { isContractEditable, CONTRACT_EDIT_PERIOD_DAYS } from '@/lib/contract-utils';

export interface ContractInput {
  workerName: string;
  hourlyWage: number;
  startDate: string;
  workDays: string[];
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
}

export interface Contract {
  id: string;
  employer_id: string;
  worker_id: string | null;
  employer_name: string;
  worker_name: string;
  hourly_wage: number;
  start_date: string;
  work_days: string[];
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
      work_days: data.workDays,
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
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return contract as Contract;
}

// Get all contracts for an employer
export async function getEmployerContracts(employerId: string): Promise<Contract[]> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('employer_id', employerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as Contract[];
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
  signature: string
): Promise<Contract> {
  return updateContract(contractId, {
    worker_signature: signature,
    status: 'completed',
    signed_at: new Date().toISOString(),
  });
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

// Delete a contract
export async function deleteContract(contractId: string): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', contractId);

  if (error) {
    throw new Error(error.message);
  }
}

// Delete multiple contracts
export async function deleteContracts(contractIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .delete()
    .in('id', contractIds);

  if (error) {
    throw new Error(error.message);
  }
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
