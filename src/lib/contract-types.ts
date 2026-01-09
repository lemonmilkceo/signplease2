export interface ContractData {
  id?: string;
  employerName: string;
  workerName: string;
  hourlyWage: number;
  startDate: string;
  workDays: string[];
  workStartTime: string;
  workEndTime: string;
  workLocation: string;
  jobDescription: string;
  status: 'draft' | 'pending' | 'signed' | 'completed';
  createdAt?: string;
  employerSignature?: string;
  workerSignature?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'employer' | 'worker';
  profileImage?: string;
}

export const MOCK_CONTRACTS: ContractData[] = [
  {
    id: '1',
    employerName: '김사장',
    workerName: '이영희',
    hourlyWage: 10030,
    startDate: '2025-01-15',
    workDays: ['월', '화', '수', '목', '금'],
    workStartTime: '09:00',
    workEndTime: '18:00',
    workLocation: '서울시 강남구 테헤란로 123',
    jobDescription: '홀 서빙 및 매장 관리',
    status: 'pending',
    createdAt: '2025-01-10',
  },
  {
    id: '2',
    employerName: '김사장',
    workerName: '박철수',
    hourlyWage: 11000,
    startDate: '2025-01-01',
    workDays: ['토', '일'],
    workStartTime: '10:00',
    workEndTime: '17:00',
    workLocation: '서울시 강남구 테헤란로 123',
    jobDescription: '주방 보조',
    status: 'completed',
    createdAt: '2024-12-20',
    employerSignature: 'data:image/png;base64,mock',
    workerSignature: 'data:image/png;base64,mock',
  },
];

export const WORK_DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export const MINIMUM_WAGE_2025 = 10030;

export const CONTRACT_TEMPLATE = `
근로계약서

1. 근로계약 당사자
   사용자(갑): {{employerName}}
   근로자(을): {{workerName}}

2. 근로조건
   - 근무 장소: {{workLocation}}
   - 업무 내용: {{jobDescription}}
   - 근무 시작일: {{startDate}}
   - 근무 시간: {{workStartTime}} ~ {{workEndTime}}
   - 근무 요일: {{workDays}}

3. 임금
   - 시급: {{hourlyWage}}원
   - 임금 지급일: 매월 10일
   - 지급 방법: 근로자 명의 계좌 이체

4. 기타 사항
   - 본 계약서에 명시되지 않은 사항은 근로기준법에 따릅니다.
   - 근로자는 4대 보험에 가입됩니다.

본인은 위 근로조건을 충분히 이해하였으며, 이에 동의합니다.

사용자(갑) 서명: _______________
근로자(을) 서명: _______________

계약일: {{createdAt}}
`;
