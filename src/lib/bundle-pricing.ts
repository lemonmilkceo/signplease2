export interface BundlePricingPlan {
  id: string;
  name: string;
  contracts: number;
  legalReviews: number;
  price: number;
  originalPrice: number;
  savings: number;
  popular?: boolean;
  description?: string;
}

// 계약서 + AI 노무사 묶음 패키지 - 개별 구매 대비 추가 할인
export const BUNDLE_PRICING_PLANS: BundlePricingPlan[] = [
  {
    id: 'starter-bundle',
    name: '스타터 묶음',
    contracts: 5,
    legalReviews: 3,
    price: 15000,
    originalPrice: 21000, // 6,000 + 3회(9,000 상당)
    savings: 29,
    description: '소규모 사업장에 딱 맞는 구성',
  },
  {
    id: 'business-bundle',
    name: '비즈니스 묶음',
    contracts: 15,
    legalReviews: 10,
    price: 35000,
    originalPrice: 51000, // 15,000 + 10회(20,000 상당)
    savings: 31,
    popular: true,
    description: '가장 인기 있는 조합',
  },
  {
    id: 'pro-bundle',
    name: '프로 묶음',
    contracts: 30,
    legalReviews: 20,
    price: 55000,
    originalPrice: 84000, // 24,000 + 20회(40,000 상당)
    savings: 35,
    description: '다수 직원 관리에 최적',
  },
  {
    id: 'enterprise-bundle',
    name: '엔터프라이즈',
    contracts: 50,
    legalReviews: 30,
    price: 80000,
    originalPrice: 129000, // 40,000 + 30회(45,000 상당) 추정
    savings: 38,
    description: '대규모 사업장 맞춤 패키지',
  },
];
