import { supabase } from '@/integrations/supabase/client';

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

// Update contract (for signing)
export async function updateContract(
  contractId: string,
  updates: Partial<Contract>
): Promise<Contract> {
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
