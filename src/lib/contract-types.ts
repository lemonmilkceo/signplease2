export type WageType = 'hourly' | 'monthly';
export type BusinessSize = 'under5' | 'over5'; // 5인 미만 / 5인 이상
export type BusinessType = 'restaurant' | 'cafe' | 'convenience' | 'retail' | 'beauty' | 'office' | 'other'; // 업종 타입

// 포괄임금 수당 세부 내역 (5인 이상 사업장용) - 단위당 금액
export interface ComprehensiveWageDetails {
  overtimePerHour?: number; // 연장근로수당 (1시간당)
  nightAllowance?: number; // 야간근로수당
  holidayPerDay?: number; // 휴일근로수당 (1일당)
  annualLeavePerDay?: number; // 연차유급휴가 수당 (1일당)
}

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
  businessName?: string; // 사업장명
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
  businessSize?: BusinessSize; // 사업장 규모
  businessType?: BusinessType; // 업종 타입
  comprehensiveWageDetails?: ComprehensiveWageDetails; // 포괄임금 수당 세부 내역
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
    employerName: '박준혁',
    workerName: '김서연',
    wageType: 'hourly',
    hourlyWage: 10360, // 2026년 최저임금
    startDate: '2026-01-13',
    workDays: ['월', '수', '금'],
    workDaysPerWeek: 3,
    workStartTime: '17:00',
    workEndTime: '22:00',
    breakTimeMinutes: 0,
    workLocation: '서울시 마포구 연남동 567-12',
    businessName: '연남동 감성카페',
    jobDescription: '음료 제조 및 홀 서빙',
    status: 'pending',
    createdAt: '2026-01-10',
    employerSignature: 'data:image/png;base64,mock',
    includeWeeklyHolidayPay: false,
    paymentDay: 10,
    paymentMonth: 'next',
  },
  {
    id: '2',
    employerName: '이현수',
    workerName: '최유진',
    wageType: 'hourly',
    hourlyWage: 12432, // 주휴수당 포함 시급
    startDate: '2026-01-06',
    workDays: ['월', '화', '수', '목', '금'],
    workDaysPerWeek: 5,
    workStartTime: '11:00',
    workEndTime: '15:00',
    breakTimeMinutes: 0,
    workLocation: '서울시 강남구 역삼동 823-21',
    businessName: '역삼 직화삼겹',
    jobDescription: '홀 서빙 및 고객 응대',
    status: 'completed',
    createdAt: '2026-01-02',
    employerSignature: 'data:image/png;base64,mock',
    workerSignature: 'data:image/png;base64,mock',
    includeWeeklyHolidayPay: true,
    paymentDay: 5,
    paymentMonth: 'next',
  },
  {
    id: '3',
    employerName: '정민재',
    workerName: '박지훈',
    wageType: 'hourly',
    hourlyWage: 11000,
    startDate: '2026-01-20',
    workDays: ['화', '목', '토'],
    workDaysPerWeek: 3,
    workStartTime: '18:00',
    workEndTime: '23:00',
    breakTimeMinutes: 30,
    workLocation: '서울시 송파구 잠실동 178-3',
    businessName: 'GS25 잠실역점',
    jobDescription: '계산 및 상품 진열, 재고 관리',
    status: 'draft',
    createdAt: '2026-01-12',
    paymentDay: 25,
    paymentMonth: 'current',
  },
  {
    id: '4',
    employerName: '김도윤',
    workerName: '이수빈',
    wageType: 'hourly',
    hourlyWage: 12432, // 주휴수당 포함
    startDate: '2026-01-08',
    workDays: ['월', '화', '수', '목', '금'],
    workDaysPerWeek: 5,
    workStartTime: '09:00',
    workEndTime: '14:00',
    breakTimeMinutes: 0,
    workLocation: '서울시 서초구 서초동 1305-7',
    businessName: '서초 네일샵',
    jobDescription: '네일 아트 보조 및 고객 응대',
    status: 'pending',
    createdAt: '2026-01-05',
    employerSignature: 'data:image/png;base64,mock',
    includeWeeklyHolidayPay: true,
    paymentDay: 10,
    paymentMonth: 'next',
  },
  {
    id: '5',
    employerName: '송지호',
    workerName: '한예린',
    wageType: 'hourly',
    hourlyWage: 13000, // 주말 시급 우대
    startDate: '2026-01-04',
    workDays: ['토', '일'],
    workDaysPerWeek: 2,
    workStartTime: '10:00',
    workEndTime: '18:00',
    breakTimeMinutes: 60,
    workLocation: '서울시 용산구 이태원동 34-87',
    businessName: '이태원 브런치클럽',
    jobDescription: '주방 보조 및 플레이팅',
    status: 'completed',
    createdAt: '2026-01-02',
    employerSignature: 'data:image/png;base64,mock',
    workerSignature: 'data:image/png;base64,mock',
    includeWeeklyHolidayPay: false,
    paymentDay: 15,
    paymentMonth: 'next',
  },
  {
    id: '6',
    employerName: '오승민',
    workerName: '장민서',
    wageType: 'monthly',
    hourlyWage: 12432,
    monthlyWage: 2200000,
    startDate: '2026-02-01',
    workDays: ['월', '화', '수', '목', '금'],
    workDaysPerWeek: 5,
    workStartTime: '13:00',
    workEndTime: '22:00',
    breakTimeMinutes: 60,
    workLocation: '서울시 홍대입구 와우산로 94',
    businessName: '홍대 프차',
    jobDescription: '홀과 주방 등 가게 운영의 전반적인 관리',
    status: 'pending',
    createdAt: '2026-01-11',
    employerSignature: 'data:image/png;base64,mock',
    includeWeeklyHolidayPay: true,
    isComprehensiveWage: true,
    businessSize: 'under5',
    paymentDay: 10,
    paymentMonth: 'next',
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

// 업종별 키워드
export const BUSINESS_TYPE_KEYWORDS: Record<BusinessType, string[]> = {
  restaurant: [
    '홀과 주방 등 가게 운영의 전반적인 관리',
    '홀 서빙 및 고객 응대',
    '주방 조리 및 음식 준비',
    '설거지 및 주방 정리',
    '테이블 세팅 및 정리',
    '식재료 손질 및 준비',
    '배달 음식 포장',
    '매장 청소 및 정리',
  ],
  cafe: [
    '음료 제조 (바리스타)',
    '디저트 제조 및 플레이팅',
    '홀 서빙 및 테이블 정리',
    '계산 및 주문 접수',
    '원두 관리 및 머신 청소',
    '매장 청소 및 정리',
    '재고 관리 및 발주',
  ],
  convenience: [
    '계산 및 주문 접수',
    '상품 진열 및 정리',
    '재고 관리 및 검수',
    '유통기한 관리',
    '매장 청소 및 정리',
    '배달 업무',
    '택배 접수 및 관리',
  ],
  retail: [
    '고객 응대 및 상담',
    '상품 진열 및 정리',
    '재고 관리 및 발주',
    '계산 및 포장',
    '매장 청소 및 정리',
    '상품 설명 및 추천',
  ],
  beauty: [
    '고객 응대 및 예약 관리',
    '시술 보조',
    '매장 청소 및 정리',
    '재료 준비 및 정리',
    '상담 및 서비스 안내',
    '샴푸 및 두피 관리',
  ],
  office: [
    '행정 및 사무 보조',
    '전화 응대 및 고객 상담',
    '문서 작성 및 정리',
    '자료 입력 및 관리',
    '일정 관리 및 예약',
    '우편물 정리 및 발송',
  ],
  other: [
    '홀과 주방 등 가게 운영의 전반적인 관리',
    '고객 응대 및 서비스',
    '매장 청소 및 정리',
    '계산 및 주문 접수',
    '재고 관리',
    '배달 업무',
  ],
};

export const BUSINESS_TYPE_INFO: Record<BusinessType, { label: string; emoji: string }> = {
  restaurant: { label: '식당', emoji: '🍽️' },
  cafe: { label: '카페', emoji: '☕' },
  convenience: { label: '편의점', emoji: '🏪' },
  retail: { label: '소매점', emoji: '🛍️' },
  beauty: { label: '미용실/네일샵', emoji: '💇' },
  office: { label: '사무직', emoji: '💼' },
  other: { label: '상관없어요', emoji: '✨' },
};

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
