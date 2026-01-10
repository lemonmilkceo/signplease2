export type WageType = 'hourly' | 'monthly';

export interface ContractData {
  id?: string;
  employerName: string;
  workerName: string;
  wageType: WageType;
  hourlyWage: number;
  monthlyWage?: number;
  startDate: string;
  endDate?: string;
  noEndDate?: boolean;
  workDays: string[];
  workDaysPerWeek?: number;
  workStartTime: string;
  workEndTime: string;
  breakTimeMinutes?: number; // 휴게시간 (분 단위)
  workLocation: string;
  paymentDay?: number;
  paymentMonth?: 'current' | 'next';
  paymentEndOfMonth?: boolean;
  jobDescription?: string;
  status: 'draft' | 'pending' | 'signed' | 'completed';
  createdAt?: string;
  employerSignature?: string;
  workerSignature?: string;
  includeWeeklyHolidayPay?: boolean;
  isComprehensiveWage?: boolean; // 포괄임금계약 여부
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
    wageType: 'hourly',
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
    wageType: 'monthly',
    hourlyWage: 0,
    monthlyWage: 2500000,
    startDate: '2025-01-01',
    workDays: ['월', '화', '수', '목', '금'],
    workStartTime: '09:00',
    workEndTime: '18:00',
    workLocation: '서울시 강남구 테헤란로 123',
    jobDescription: '주방 보조',
    status: 'completed',
    createdAt: '2024-12-20',
    employerSignature: 'data:image/png;base64,mock',
    workerSignature: 'data:image/png;base64,mock',
  },
];

export const WORK_DAYS = ['월', '화', '수', '목', '금', '토', '일'];
export const WORK_DAYS_PER_WEEK = [1, 2, 3, 4, 5, 6, 7];

export const MINIMUM_WAGE_2025 = 10030;
export const MINIMUM_WAGE_2026 = 10360;
export const WEEKLY_HOLIDAY_MULTIPLIER = 1.2;
export const MINIMUM_WAGE_WITH_HOLIDAY_2026 = Math.round(MINIMUM_WAGE_2026 * WEEKLY_HOLIDAY_MULTIPLIER); // 12,432원

export const JOB_KEYWORDS = [
  '홀과 주방 등 가게 운영의 전반적인 관리',
  '홀 서빙 및 고객 응대',
  '주방 조리 및 음식 준비',
  '매장 청소 및 정리',
  '계산 및 주문 접수',
  '재고 관리 및 상품 진열',
  '음료 제조 (바리스타)',
  '배달 업무',
  '행정 및 사무 보조',
];

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
