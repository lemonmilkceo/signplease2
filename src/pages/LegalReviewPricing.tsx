import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft, 
  Check, 
  Sparkles, 
  Gift, 
  Scale, 
  Building2, 
  Crown,
  MessageCircle,
  ShieldCheck,
  FileSearch
} from "lucide-react";
import { LEGAL_REVIEW_PRICING_PLANS, getRemainingLegalReviews } from "@/lib/legal-review-credits-api";
import { toast } from "sonner";

export default function LegalReviewPricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [remainingReviews, setRemainingReviews] = useState<number>(3);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      if (user) {
        try {
          const reviews = await getRemainingLegalReviews(user.id);
          setRemainingReviews(reviews);
        } catch (error) {
          console.error('Error fetching reviews:', error);
        }
      }
    };
    fetchReviews();
  }, [user]);

  const handlePurchase = async (planId: string) => {
    setIsLoading(true);
    setSelectedPlan(planId);
    
    // 실제 결제 연동 전 - 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.info("결제 기능은 곧 출시됩니다!", {
      description: "현재 무료 크레딧으로 서비스를 체험해 보세요."
    });
    
    setIsLoading(false);
    setSelectedPlan(null);
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'single':
        return <MessageCircle className="w-6 h-6" />;
      case 'starter':
        return <FileSearch className="w-6 h-6" />;
      case 'business':
        return <Scale className="w-6 h-6" />;
      case 'enterprise':
        return <Crown className="w-6 h-6" />;
      default:
        return <Scale className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">AI 노무사 요금제</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4">
            <Scale className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            AI 노무사 법률 검토
          </h2>
          <p className="text-muted-foreground">
            근로계약서의 법적 문제점을 AI가 분석해 드립니다
          </p>
        </motion.div>

        {/* Current Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 rounded-2xl p-4 mb-8 border border-emerald-500/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">잔여 검토 횟수</p>
                <p className="text-xl font-bold text-foreground">{remainingReviews}회</p>
              </div>
            </div>
            {remainingReviews === 0 && (
              <span className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                충전 필요
              </span>
            )}
          </div>
        </motion.div>

        {/* Free Tier Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 mb-8"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
              <Gift className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">
                🎁 신규 가입 혜택
              </p>
              <p className="text-sm text-muted-foreground">
                가입 즉시 <span className="font-semibold text-emerald-600">3회 무료</span> 법률 검토 제공!
                <br />AI가 계약서의 법적 문제점을 꼼꼼히 분석해 드립니다.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="space-y-4">
          {LEGAL_REVIEW_PRICING_PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className={`
                relative rounded-2xl border-2 p-5 transition-all
                ${plan.popular 
                  ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10' 
                  : 'border-border bg-card hover:border-emerald-500/50'
                }
              `}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold">
                    추천
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center
                    ${plan.popular ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'}
                  `}>
                    {getPlanIcon(plan.id)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      회당 {plan.pricePerReview.toLocaleString()}원
                    </p>
                  </div>
                </div>
                {plan.savings && (
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-medium">
                    {plan.savings}% 할인
                  </span>
                )}
              </div>

              {plan.description && (
                <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>
              )}

              <div className="flex items-end justify-between">
                <div>
                  <span className="text-3xl font-bold text-foreground">
                    ₩{plan.price.toLocaleString()}
                  </span>
                </div>
                <Button
                  onClick={() => handlePurchase(plan.id)}
                  disabled={isLoading}
                  variant={plan.popular ? "default" : "outline"}
                  size="sm"
                  className={`min-w-[80px] ${plan.popular ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                >
                  {isLoading && selectedPlan === plan.id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    '구매하기'
                  )}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 pt-8 border-t border-border"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">AI 노무사 검토 항목</h3>
          <div className="space-y-3">
            {[
              '근로기준법 위반 여부 확인',
              '포괄임금제 적법성 검토',
              '최저임금 준수 여부 확인',
              '휴게시간·연장근로 규정 점검',
              '필수 기재사항 누락 확인',
              '개선 방안 및 조언 제공',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 계약서 크레딧 안내 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-5 rounded-2xl bg-primary/5 border border-primary/20"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-primary flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                계약서 작성 크레딧이 필요하신가요?
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                AI 근로계약서 자동 생성 서비스도 이용해 보세요
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/pricing')}
              >
                계약서 요금제 보기
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Contact for Enterprise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 p-5 rounded-2xl bg-muted/50 text-center"
        >
          <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <h4 className="font-semibold text-foreground mb-1">
            대량 검토가 필요하신가요?
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            50회 이상 이용 시 별도 상담을 통해 할인을 제공합니다
          </p>
          <Button variant="outline" size="sm">
            문의하기
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
