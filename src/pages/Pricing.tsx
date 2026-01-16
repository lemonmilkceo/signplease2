import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Coins,
  Scale,
  FileText,
  Loader2
} from "lucide-react";
import { PRICING_PLANS, getRemainingCredits } from "@/lib/credits-api";
import { toast } from "sonner";

declare global {
  interface Window {
    loadPaymentWidget: (clientKey: string, customerKey: string) => any;
  }
}

const TOSS_CLIENT_KEY = "test_ck_D5mOwv17VdzpW9K4v03M34LMxEze"; // 테스트 키

export default function Pricing() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [remainingCredits, setRemainingCredits] = useState<number>(5);
  const [selectedPlan, setSelectedPlan] = useState<typeof PRICING_PLANS[0] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentWidget, setPaymentWidget] = useState<any>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      if (user) {
        const credits = await getRemainingCredits(user.id);
        setRemainingCredits(credits);
      }
    };
    fetchCredits();
  }, [user]);

  // 토스페이먼츠 위젯 초기화
  useEffect(() => {
    if (user && window.loadPaymentWidget && !paymentWidget) {
      const widget = window.loadPaymentWidget(TOSS_CLIENT_KEY, user.id);
      setPaymentWidget(widget);
    }
  }, [user, paymentWidget]);

  // 선택된 플랜이 변경될 때마다 결제 금액 업데이트
  useEffect(() => {
    if (paymentWidget && selectedPlan) {
      paymentWidget.renderPaymentMethods("#payment-method", { value: selectedPlan.price });
      paymentWidget.renderAgreement("#agreement");
    }
  }, [paymentWidget, selectedPlan]);

  const handlePurchase = async (plan: typeof PRICING_PLANS[0]) => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    setSelectedPlan(plan);
    // 스크롤을 결제 섹션으로 이동
    setTimeout(() => {
      document.getElementById("payment-section")?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const executePayment = async () => {
    if (!paymentWidget || !selectedPlan) return;

    setIsLoading(true);
    try {
      await paymentWidget.requestPayment({
        orderId: `order_${Math.random().toString(36).slice(2, 11)}`,
        orderName: `[싸인해주세요] ${selectedPlan.name} 충전`,
        customerName: profile?.name || user?.email?.split('@')[0],
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error) {
      console.error("Payment request error:", error);
      toast.error("결제 요청 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
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
          <h1 className="text-lg font-semibold text-foreground">계약서 요금제</h1>
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
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            AI 근로계약서 작성
          </h2>
          <p className="text-muted-foreground">
            합리적인 가격으로 계약서를 작성하세요
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
                  onClick={() => handlePurchase(plan)}
                  variant={plan.popular ? "toss" : "outline"}
                  size="sm"
                  className="min-w-[80px]"
                >
                  선택하기
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Payment Widget Section */}
        {selectedPlan && (
          <motion.div
            id="payment-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-8 pt-8 border-t border-border"
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-1">결제하기</h3>
              <p className="text-sm text-muted-foreground">
                선택한 상품: <span className="font-bold text-primary">{selectedPlan.name}</span>
              </p>
            </div>

            <div id="payment-method" className="mb-4" />
            <div id="agreement" className="mb-6" />

            <Button
              onClick={executePayment}
              disabled={isLoading}
              variant="toss"
              size="full"
              className="h-14 text-lg font-bold"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : null}
              {selectedPlan.price.toLocaleString()}원 결제하기
            </Button>

            <Button
              variant="ghost"
              size="full"
              onClick={() => setSelectedPlan(null)}
              className="mt-2 text-muted-foreground"
            >
              취소
            </Button>
          </motion.div>
        )}

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

        {/* AI 노무사 안내 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mt-8 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20"
        >
          <div className="flex items-start gap-3">
            <Scale className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                AI 노무사 법률 검토가 필요하신가요?
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                작성한 계약서의 법적 문제점을 AI가 분석해 드립니다
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/legal-review-pricing')}
                  className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                >
                  노무사 요금제
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/bundle-pricing')}
                  className="bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  묶음 할인
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
