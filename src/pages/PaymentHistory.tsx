import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Receipt, CreditCard, Coins, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserCredits, UserCredits } from "@/lib/credits-api";

export default function PaymentHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const data = await getUserCredits(user.id);
          setCredits(data);
        } catch (error) {
          console.error('Error fetching credits:', error);
        }
      }
      setIsLoading(false);
    };
    fetchData();
  }, [user]);

  // Mock payment history (실제 결제 연동 시 DB에서 가져옴)
  const paymentHistory: Array<{
    id: string;
    date: string;
    type: string;
    amount: number;
    credits: number;
    status: string;
  }> = [];

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
          <h1 className="text-lg font-semibold text-foreground">결제내역</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Credit Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">무료 크레딧</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {credits?.free_credits ?? 5}건
            </p>
          </div>
          
          <div className="p-4 rounded-2xl bg-success/5 border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-success" />
              <span className="text-sm text-muted-foreground">유료 크레딧</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {credits?.paid_credits ?? 0}건
            </p>
          </div>
        </motion.div>

        {/* Usage Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-muted/50 mb-8"
        >
          <h3 className="font-semibold text-foreground mb-3">사용 현황</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">총 사용량</span>
              <span className="text-foreground font-medium">
                {credits?.total_used ?? 0}건
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">잔여 크레딧</span>
              <span className="text-foreground font-medium">
                {(credits?.free_credits ?? 5) + (credits?.paid_credits ?? 0)}건
              </span>
            </div>
          </div>
        </motion.div>

        {/* Payment History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-semibold text-foreground mb-4">결제 내역</h3>
          
          {paymentHistory.length > 0 ? (
            <div className="space-y-3">
              {paymentHistory.map((payment, index) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="p-4 rounded-2xl border border-border bg-card"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{payment.type}</p>
                        <p className="text-sm text-muted-foreground">{payment.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        ₩{payment.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        +{payment.credits}건
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                아직 결제 내역이 없습니다
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                크레딧을 구매하시면 여기에 표시됩니다
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
