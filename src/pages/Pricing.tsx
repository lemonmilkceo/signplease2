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
  Zap, 
  Building2, 
  Crown,
  Coins
} from "lucide-react";
import { PRICING_PLANS, getRemainingCredits } from "@/lib/credits-api";
import { toast } from "sonner";

export default function Pricing() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [remainingCredits, setRemainingCredits] = useState<number>(5);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCredits = async () => {
      if (user) {
        const credits = await getRemainingCredits(user.id);
        setRemainingCredits(credits);
      }
    };
    fetchCredits();
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
        return <Coins className="w-6 h-6" />;
      case 'starter':
        return <Gift className="w-6 h-6" />;
      case 'business':
        return <Zap className="w-6 h-6" />;
      case 'enterprise':
        return <Crown className="w-6 h-6" />;
      default:
        return <Coins className="w-6 h-6" />;
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
          <h1 className="text-lg font-semibold text-foreground">요금제</h1>
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
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            더 많은 계약서가 필요하신가요?
          </h2>
          <p className="text-muted-foreground">
            합리적인 가격으로 크레딧을 충전하세요
          </p>
        </motion.div>

        {/* Current Credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-4 mb-8 border border-primary/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">현재 잔여 크레딧</p>
                <p className="text-xl font-bold text-foreground">{remainingCredits}건</p>
              </div>
            </div>
            {remainingCredits === 0 && (
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
          className="bg-success/5 border border-success/20 rounded-2xl p-4 mb-8"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
              <Gift className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">
                🎉 첫 가입 혜택
              </p>
              <p className="text-sm text-muted-foreground">
                신규 가입 시 <span className="font-semibold text-success">5건 무료</span>로 시작하세요!
                <br />결제 없이 바로 계약서를 작성할 수 있습니다.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="space-y-4">
          {PRICING_PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className={`
                relative rounded-2xl border-2 p-5 transition-all
                ${plan.popular 
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' 
                  : 'border-border bg-card hover:border-primary/50'
                }
              `}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    인기
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center
                    ${plan.popular ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}
                  `}>
                    {getPlanIcon(plan.id)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      건당 {plan.pricePerCredit.toLocaleString()}원
                    </p>
                  </div>
                </div>
                {plan.savings && (
                  <span className="px-2 py-1 rounded-lg bg-success/10 text-success text-xs font-medium">
                    {plan.savings}% 할인
                  </span>
                )}
              </div>

              <div className="flex items-end justify-between">
                <div>
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

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 pt-8 border-t border-border"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">모든 요금제 포함</h3>
          <div className="space-y-3">
            {[
              '표준근로계약서 자동 생성',
              'AI 법률 용어 해설',
              '전자 서명 기능',
              '카카오톡 공유 기능',
              'PDF 다운로드',
              '무제한 보관',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                  <Check className="w-3 h-3 text-success" />
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
            대량 구매가 필요하신가요?
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            100건 이상 구매 시 추가 할인을 제공합니다
          </p>
          <Button variant="outline" size="sm">
            문의하기
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
