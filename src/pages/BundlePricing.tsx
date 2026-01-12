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
  FileText,
  Package,
  Zap,
  Star
} from "lucide-react";
import { BUNDLE_PRICING_PLANS } from "@/lib/bundle-pricing";
import { getRemainingCredits } from "@/lib/credits-api";
import { getRemainingLegalReviews } from "@/lib/legal-review-credits-api";
import { toast } from "sonner";

export default function BundlePricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [remainingCredits, setRemainingCredits] = useState<number>(5);
  const [remainingReviews, setRemainingReviews] = useState<number>(3);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const [credits, reviews] = await Promise.all([
            getRemainingCredits(user.id),
            getRemainingLegalReviews(user.id)
          ]);
          setRemainingCredits(credits);
          setRemainingReviews(reviews);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };
    fetchData();
  }, [user]);

  const handlePurchase = async (planId: string) => {
    setIsLoading(true);
    setSelectedPlan(planId);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.info("결제 기능은 곧 출시됩니다!", {
      description: "현재 무료 크레딧으로 서비스를 체험해 보세요."
    });
    
    setIsLoading(false);
    setSelectedPlan(null);
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter-bundle':
        return <Package className="w-6 h-6" />;
      case 'business-bundle':
        return <Zap className="w-6 h-6" />;
      case 'pro-bundle':
        return <Star className="w-6 h-6" />;
      case 'enterprise-bundle':
        return <Crown className="w-6 h-6" />;
      default:
        return <Package className="w-6 h-6" />;
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
          <h1 className="text-lg font-semibold text-foreground">묶음 패키지</h1>
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            계약서 + AI 노무사 묶음
          </h2>
          <p className="text-muted-foreground">
            함께 구매하면 <span className="text-primary font-semibold">최대 38%</span> 추가 할인!
          </p>
        </motion.div>

        {/* Current Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">계약서</span>
            </div>
            <p className="text-lg font-bold text-foreground">{remainingCredits}건</p>
          </div>
          <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">법률 검토</span>
            </div>
            <p className="text-lg font-bold text-foreground">{remainingReviews}회</p>
          </div>
        </motion.div>

        {/* Bundle Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-r from-primary/5 to-emerald-500/5 border border-primary/20 rounded-2xl p-4 mb-8"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Gift className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">
                🎁 묶음 패키지 혜택
              </p>
              <p className="text-sm text-muted-foreground">
                개별 구매보다 <span className="font-semibold text-primary">최대 38% 저렴</span>하게!
                <br />계약서 작성과 법률 검토를 한 번에 해결하세요.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="space-y-4">
          {BUNDLE_PRICING_PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className={`
                relative rounded-2xl border-2 p-5 transition-all
                ${plan.popular 
                  ? 'border-primary bg-gradient-to-r from-primary/5 to-emerald-500/5 shadow-lg shadow-primary/10' 
                  : 'border-border bg-card hover:border-primary/50'
                }
              `}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-emerald-500 text-white text-xs font-semibold">
                    BEST
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center
                    ${plan.popular 
                      ? 'bg-gradient-to-br from-primary/20 to-emerald-500/20 text-primary' 
                      : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {getPlanIcon(plan.id)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    )}
                  </div>
                </div>
                <span className="px-2 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold">
                  -{plan.savings}%
                </span>
              </div>

              {/* Package Contents */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 bg-primary/5 rounded-lg px-3 py-2 border border-primary/10">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-muted-foreground">계약서</span>
                  </div>
                  <p className="font-bold text-foreground">{plan.contracts}건</p>
                </div>
                <div className="flex-1 bg-emerald-500/5 rounded-lg px-3 py-2 border border-emerald-500/10">
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs text-muted-foreground">법률 검토</span>
                  </div>
                  <p className="font-bold text-foreground">{plan.legalReviews}회</p>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-muted-foreground line-through">
                      ₩{plan.originalPrice.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-3xl font-bold text-foreground">
                    ₩{plan.price.toLocaleString()}
                  </span>
                </div>
                <Button
                  onClick={() => handlePurchase(plan.id)}
                  disabled={isLoading}
                  variant={plan.popular ? "toss" : "outline"}
                  size="sm"
                  className="min-w-[80px]"
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

        {/* Individual Pricing Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 pt-8 border-t border-border"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">개별 구매</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/pricing')}
              className="p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors text-left"
            >
              <FileText className="w-5 h-5 text-primary mb-2" />
              <p className="font-medium text-foreground text-sm">계약서 크레딧</p>
              <p className="text-xs text-muted-foreground">건당 800원~</p>
            </button>
            <button
              onClick={() => navigate('/legal-review-pricing')}
              className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors text-left"
            >
              <Scale className="w-5 h-5 text-emerald-600 mb-2" />
              <p className="font-medium text-foreground text-sm">법률 검토 크레딧</p>
              <p className="text-xs text-muted-foreground">회당 1,500원~</p>
            </button>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mt-8 pt-8 border-t border-border"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">묶음 패키지 포함 기능</h3>
          <div className="space-y-3">
            {[
              'AI 표준근로계약서 자동 생성',
              'AI 노무사 법률 검토 및 조언',
              '전자 서명 및 카카오톡 공유',
              'PDF 다운로드 및 무제한 보관',
              '근로기준법 위반 여부 자동 확인',
              '포괄임금제 적법성 검토',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact for Enterprise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-5 rounded-2xl bg-muted/50 text-center"
        >
          <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <h4 className="font-semibold text-foreground mb-1">
            더 큰 규모가 필요하신가요?
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            100건 이상 맞춤 견적을 제공해 드립니다
          </p>
          <Button variant="outline" size="sm">
            문의하기
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
